import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "../../../../lib/billing";
import {
  creemWebhookConfigured,
  pickId,
  verifyCreemSignature,
  type CreemWebhookEvent,
} from "../../../../lib/creem";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

async function activateUser(opts: {
  userId?: string;
  email?: string;
  customerId?: string;
  subscriptionId?: string | null;
  planStatus: string;
}) {
  const data: {
    planStatus: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
  } = {
    planStatus: opts.planStatus,
  };
  if (opts.customerId) data.stripeCustomerId = opts.customerId;
  if (opts.subscriptionId !== undefined) {
    data.stripeSubscriptionId = opts.subscriptionId;
  }

  if (opts.userId) {
    await prisma.user.update({ where: { id: opts.userId }, data });
    return true;
  }
  if (opts.customerId) {
    const r = await prisma.user.updateMany({
      where: { stripeCustomerId: opts.customerId },
      data,
    });
    if (r.count > 0) return true;
  }
  if (opts.email) {
    const r = await prisma.user.updateMany({
      where: { email: opts.email.toLowerCase() },
      data,
    });
    if (r.count > 0) return true;
  }
  return false;
}

async function handleCreem(rawBody: string, request: Request) {
  const secret = process.env.CREEM_WEBHOOK_SECRET!;
  const signature = request.headers.get("creem-signature");
  if (!verifyCreemSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as CreemWebhookEvent;
  const type = event.eventType || "";
  const obj = event.object || {};

  const metadata = (obj.metadata || {}) as Record<string, unknown>;
  const userIdFromMeta =
    (typeof metadata.userId === "string" && metadata.userId) ||
    (typeof metadata.referenceId === "string" && metadata.referenceId) ||
    undefined;
  const requestId =
    typeof obj.request_id === "string" ? obj.request_id : undefined;
  const userId = userIdFromMeta || requestId;

  const customer = obj.customer;
  const customerId = pickId(customer);
  const customerEmail =
    customer && typeof customer === "object" && "email" in customer
      ? String((customer as { email?: string }).email || "")
      : undefined;

  const subscription = obj.subscription;
  const subscriptionId =
    pickId(subscription) ||
    (typeof obj.id === "string" && obj.id.startsWith("sub_")
      ? obj.id
      : undefined);

  const grant = [
    "checkout.completed",
    "subscription.active",
    "subscription.paid",
    "subscription.trialing",
  ].includes(type);

  const revoke = [
    "subscription.canceled",
    "subscription.expired",
    "subscription.paused",
    "subscription.unpaid",
  ].includes(type);

  if (grant) {
    // Prefer paid/active; checkout.completed also activates
    await activateUser({
      userId,
      email: customerEmail,
      customerId,
      subscriptionId,
      planStatus: "active",
    });
  } else if (revoke) {
    await activateUser({
      userId,
      email: customerEmail,
      customerId,
      subscriptionId: null,
      planStatus: "canceled",
    });
  }

  return NextResponse.json({ received: true, provider: "creem", type });
}

async function activateFromStripeSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  const data = {
    planStatus:
      sub.status === "active" || sub.status === "trialing"
        ? "active"
        : sub.status,
    stripeSubscriptionId: sub.id,
    stripeCustomerId: customerId || undefined,
  };

  if (userId) {
    await prisma.user.update({ where: { id: userId }, data });
    return;
  }
  if (customerId) {
    await prisma.user.updateMany({
      where: { stripeCustomerId: customerId },
      data,
    });
  }
}

async function handleStripe(rawBody: string, request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            planStatus: "active",
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id,
            stripeSubscriptionId: subId,
          },
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await activateFromStripeSubscription(
        event.data.object as Stripe.Subscription,
      );
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      const customerId =
        typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { planStatus: "canceled", stripeSubscriptionId: null },
        });
      } else if (customerId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: { planStatus: "canceled", stripeSubscriptionId: null },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true, provider: "stripe" });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Route by signature header
  if (request.headers.get("creem-signature") && creemWebhookConfigured()) {
    return handleCreem(rawBody, request);
  }
  if (request.headers.get("stripe-signature")) {
    return handleStripe(rawBody, request);
  }

  // Default: Creem if secret present (some proxies strip custom headers in tests)
  if (creemWebhookConfigured()) {
    return handleCreem(rawBody, request);
  }

  return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
}

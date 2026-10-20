import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "../../../../lib/billing";
import { prisma } from "../../../../lib/prisma";

async function activateFromSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  const data = {
    planStatus: sub.status === "active" || sub.status === "trialing" ? "active" : sub.status,
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

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 501 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();
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
      await activateFromSubscription(event.data.object as Stripe.Subscription);
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

  return NextResponse.json({ received: true });
}

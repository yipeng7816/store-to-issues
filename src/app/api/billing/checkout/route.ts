import { NextResponse } from "next/server";
import {
  billingConfigured,
  getStripe,
  stripeConfigured,
} from "../../../../lib/billing";
import {
  createCreemCheckout,
  creemConfigured,
} from "../../../../lib/creem";
import { prisma } from "../../../../lib/prisma";
import { requireUserId } from "../../../../lib/session";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!billingConfigured()) {
    return NextResponse.json(
      {
        error:
          "Billing is not configured. Set CREEM_API_KEY and CREEM_PRODUCT_ID (recommended), or Stripe keys.",
      },
      { status: 501 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin =
    request.headers.get("origin") ||
    process.env.APP_URL ||
    "http://localhost:3000";
  const successUrl = `${origin}/dashboard?checkout=success`;

  if (creemConfigured()) {
    const key = process.env.CREEM_API_KEY || "";
    if (
      process.env.CREEM_TEST_MODE === "true" &&
      key.startsWith("creem_") &&
      !key.startsWith("creem_test_")
    ) {
      return NextResponse.json(
        {
          error:
            "Creem Test Mode needs a test API key (starts with creem_test_). Turn on Test Mode in Creem sidebar → API Keys → copy that key into CREEM_API_KEY.",
        },
        { status: 501 },
      );
    }
    try {
      const checkout = await createCreemCheckout({
        productId: process.env.CREEM_PRODUCT_ID!,
        successUrl,
        customerEmail: user.email,
        userId: user.id,
      });
      return NextResponse.json({ url: checkout.url, provider: "creem" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  // Stripe fallback (legacy / if Creem not set)
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "No billing provider" }, { status: 501 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe unavailable" }, { status: 501 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: successUrl,
    cancel_url: `${origin}/pricing?checkout=cancel`,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
    },
  });

  return NextResponse.json({ url: session.url, provider: "stripe" });
}

import { NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "../../../../lib/billing";
import {
  createCreemPortalLink,
  creemConfigured,
} from "../../../../lib/creem";
import { prisma } from "../../../../lib/prisma";
import { requireUserId } from "../../../../lib/session";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing customer yet. Subscribe first." },
      { status: 400 },
    );
  }

  // Stored in stripeCustomerId column for both Creem (cust_*) and Stripe (cus_*)
  const customerId = user.stripeCustomerId;

  if (creemConfigured() && customerId.startsWith("cust_")) {
    try {
      const url = await createCreemPortalLink(customerId);
      return NextResponse.json({ url, provider: "creem" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: "Billing portal is not configured." },
      { status: 501 },
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 501 },
    );
  }

  const origin =
    request.headers.get("origin") ||
    process.env.APP_URL ||
    "http://localhost:3000";

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard`,
  });

  return NextResponse.json({ url: portal.url, provider: "stripe" });
}

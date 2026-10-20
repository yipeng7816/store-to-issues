import { NextResponse } from "next/server";
import { getStripe } from "../../../../lib/billing";
import { prisma } from "../../../../lib/prisma";
import { requireUserId } from "../../../../lib/session";

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 501 },
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer yet. Subscribe first." },
      { status: 400 },
    );
  }

  const origin =
    request.headers.get("origin") ||
    process.env.APP_URL ||
    "http://localhost:3000";

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${origin}/dashboard`,
  });

  return NextResponse.json({ url: portal.url });
}

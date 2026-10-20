import { NextResponse } from "next/server";
import { checkSyncAccess } from "../../../../lib/billing";
import { prisma } from "../../../../lib/prisma";
import { getSession } from "../../../../lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const access = checkSyncAccess(user);
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
      emailVerified: Boolean(user.emailVerifiedAt),
      planStatus: access.planStatus,
      trialEndsAt: access.trialEndsAt,
      syncAllowed: access.allowed,
      accessReason: access.reason,
      stripeConfigured: access.billingConfigured,
      billingConfigured: access.billingConfigured,
      supportEmail: process.env.SUPPORT_EMAIL || "408722729@qq.com",
    },
  });
}

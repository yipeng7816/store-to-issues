import { NextResponse } from "next/server";
import { checkSyncAccess } from "../../../../lib/billing";
import { prisma } from "../../../../lib/prisma";
import { getSession } from "../../../../lib/session";

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
      planStatus: access.planStatus,
      trialEndsAt: access.trialEndsAt,
      syncAllowed: access.allowed,
      accessReason: access.reason,
      stripeConfigured: access.stripeConfigured,
    },
  });
}

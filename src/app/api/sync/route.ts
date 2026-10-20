import { NextResponse } from "next/server";
import { checkSyncAccess } from "../../../lib/billing";
import { prisma } from "../../../lib/prisma";
import { requireUserId } from "../../../lib/session";
import { runSync } from "../../../lib/sync";

export async function POST() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = checkSyncAccess(user);
  if (!access.allowed) {
    return NextResponse.json(
      {
        error: "Subscription required",
        reason: access.reason,
        planStatus: access.planStatus,
        trialEndsAt: access.trialEndsAt,
      },
      { status: 402 },
    );
  }

  const result = await runSync(userId);
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}

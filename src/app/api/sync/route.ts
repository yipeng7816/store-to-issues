import { NextResponse } from "next/server";
import { checkSyncAccess } from "../../../lib/billing";
import { prisma } from "../../../lib/prisma";
import { requireUserId } from "../../../lib/session";
import { enqueueAndRun } from "../../../lib/sync-queue";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  const result = await enqueueAndRun(userId);
  if (!result.ok) {
    const status = result.error?.includes("already running") ? 409 : 500;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}

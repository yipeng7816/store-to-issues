import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireUserId } from "../../../lib/session";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [reviews, runs] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.syncRun.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
  ]);
  return NextResponse.json({ reviews, runs });
}

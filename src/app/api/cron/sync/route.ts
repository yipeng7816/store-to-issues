import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { processCronQueue } from "../../../../lib/sync-queue";

/**
 * Daily cron (see vercel.json).
 * Enqueues eligible users into SyncJob then processes with spacing / rate limits.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET required in production" },
      { status: 401 },
    );
  }

  const users = await prisma.userSettings.findMany({
    where: {
      githubRepo: { not: "" },
      user: {
        OR: [
          { isAdmin: true },
          { planStatus: "active" },
          {
            planStatus: "trialing",
            trialEndsAt: { gt: new Date() },
          },
        ],
      },
    },
    select: { userId: true },
  });

  const results = await processCronQueue(
    users.map((u) => u.userId),
    Number(process.env.CRON_SYNC_LIMIT || "20"),
  );

  return NextResponse.json({
    ok: true,
    enqueued: users.length,
    processed: results.length,
    results,
  });
}

export async function GET(request: Request) {
  return POST(request);
}

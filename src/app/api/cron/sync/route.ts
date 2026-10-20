import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { runSync } from "../../../../lib/sync";

/**
 * Hourly cron (see vercel.json).
 * Auth: Authorization Bearer CRON_SECRET, or Vercel Cron when CRON_SECRET is set.
 */
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

  const results = [];
  for (const u of users) {
    results.push({ userId: u.userId, ...(await runSync(u.userId)) });
  }

  return NextResponse.json({ ok: true, count: results.length, results });
}

export async function GET(request: Request) {
  return POST(request);
}

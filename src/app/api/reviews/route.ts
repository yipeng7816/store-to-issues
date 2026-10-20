import { NextResponse } from "next/server";
import { decryptSecret } from "../../../lib/crypto";
import { fetchIssueStates } from "../../../lib/github";
import { prisma } from "../../../lib/prisma";
import { requireUserId } from "../../../lib/session";

function parseIssueNumber(raw: string | null | undefined): number | null {
  if (!raw || raw.startsWith("dry-run:")) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [reviews, runs, settings] = await Promise.all([
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
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const githubRepo =
    settings?.githubRepo || process.env.GITHUB_REPO || "";
  const githubToken = settings?.githubToken
    ? decryptSecret(settings.githubToken)
    : process.env.GITHUB_TOKEN || "";

  const numbers = reviews
    .map((r) => parseIssueNumber(r.githubIssue))
    .filter((n): n is number => n !== null);

  const issueStates = await fetchIssueStates({
    numbers,
    githubToken,
    githubRepo,
  });

  // Group by issue for the work queue
  const byIssue = new Map<
    number,
    {
      number: number;
      title: string;
      state: "open" | "closed" | "unknown";
      url: string;
      ratingMin: number;
      reviewCount: number;
    }
  >();

  for (const r of reviews) {
    const num = parseIssueNumber(r.githubIssue);
    if (num === null) continue;
    const info = issueStates[num];
    const url =
      info?.url ||
      (githubRepo.includes("/")
        ? `https://github.com/${githubRepo}/issues/${num}`
        : "");
    const existing = byIssue.get(num);
    if (existing) {
      existing.reviewCount += 1;
      existing.ratingMin = Math.min(existing.ratingMin, r.rating);
      if (!existing.title && (r.title || r.clusterKey)) {
        existing.title = r.title || r.clusterKey || existing.title;
      }
    } else {
      byIssue.set(num, {
        number: num,
        title: info?.title || r.title || r.clusterKey || `#${num}`,
        state: info?.state || "unknown",
        url,
        ratingMin: r.rating,
        reviewCount: 1,
      });
    }
  }

  const issues = [...byIssue.values()].sort((a, b) => {
    if (a.state === "open" && b.state !== "open") return -1;
    if (b.state === "open" && a.state !== "open") return 1;
    return a.ratingMin - b.ratingMin;
  });

  return NextResponse.json({
    reviews,
    runs,
    githubRepo: githubRepo || null,
    issues,
  });
}

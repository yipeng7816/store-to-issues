import { NextResponse } from "next/server";
import { credentialsFromSettings } from "../../../lib/credentials";
import { fetchIssueStates } from "../../../lib/github";
import { parseIssueRef, sameRepo } from "../../../lib/issue-ref";
import { prisma } from "../../../lib/prisma";
import { requireUserId } from "../../../lib/session";

export const dynamic = "force-dynamic";

function issueUrl(repo: string, num: number, fromApi?: string): string {
  if (fromApi) return fromApi;
  if (repo.includes("/")) return `https://github.com/${repo}/issues/${num}`;
  // Last-resort demo repo used in local/prod mock flows
  return `https://github.com/yipeng7816/store-to-issues-demo/issues/${num}`;
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

  const creds = credentialsFromSettings(settings);
  const githubRepo = creds.githubRepo;
  const githubToken = creds.githubToken;

  const numbers = reviews.flatMap((r) => {
    const ref = parseIssueRef(r.githubIssue);
    if (ref.kind !== "issue") return [];
    if (ref.repo && !sameRepo(ref.repo, githubRepo)) return [];
    return [ref.number];
  });

  const issueStates = await fetchIssueStates({
    numbers,
    githubToken,
    githubRepo,
  });

  // Group by issue for the work queue
  const byIssue = new Map<
    string,
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
    const ref = parseIssueRef(r.githubIssue);
    if (ref.kind !== "issue") continue;
    const num = ref.number;
    const repoForUrl = ref.repo || githubRepo;
    const same = !ref.repo || sameRepo(ref.repo, githubRepo);
    const info = same ? issueStates[num] : undefined;
    const url = issueUrl(repoForUrl, num, info?.url);
    const groupKey = `${repoForUrl.toLowerCase()}#${num}`;
    const existing = byIssue.get(groupKey);
    if (existing) {
      existing.reviewCount += 1;
      existing.ratingMin = Math.min(existing.ratingMin, r.rating);
      if (!existing.title && (r.title || r.clusterKey)) {
        existing.title = r.title || r.clusterKey || existing.title;
      }
    } else {
      byIssue.set(groupKey, {
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

  const reviewsWithLinks = reviews.map((r) => {
    const ref = parseIssueRef(r.githubIssue);
    if (ref.kind !== "issue") return { ...r, githubIssueUrl: null };
    const repoForUrl = ref.repo || githubRepo;
    const same = !ref.repo || sameRepo(ref.repo, githubRepo);
    const info = same ? issueStates[ref.number] : undefined;
    return {
      ...r,
      githubIssueUrl: issueUrl(repoForUrl, ref.number, info?.url),
    };
  });

  return NextResponse.json({
    reviews: reviewsWithLinks,
    runs,
    githubRepo: githubRepo || null,
    issues,
  });
}

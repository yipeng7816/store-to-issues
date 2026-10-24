import "./env";
import { prisma } from "./prisma";
import { clusterKey, overlapScore } from "./cluster";
import { createOrCommentIssue } from "./github";
import { fetchAllStoreReviews } from "./stores";
import {
  applyCredentialsEnv,
  credentialsFromSettings,
  type SyncCredentials,
} from "./credentials";

async function findSiblingIssue(userId: string, key: string) {
  const candidates = await prisma.review.findMany({
    where: { userId, githubIssue: { not: null } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  let best: (typeof candidates)[number] | null = null;
  let bestScore = 0;
  for (const c of candidates) {
    if (!c.clusterKey) continue;
    const score = overlapScore(key, c.clusterKey);
    if (score >= 0.5 && score > bestScore) {
      best = c;
      bestScore = score;
    }
  }
  return best;
}

function issueTitle(rating: number, title: string | null | undefined, key: string) {
  const short = (title || key.replace(/\|/g, " ") || "store review").slice(0, 72);
  return `[Store ${rating}★] ${short}`;
}

function issueBody(parts: {
  store: string;
  rating: number;
  title?: string | null;
  body: string;
  author?: string | null;
  version?: string | null;
  territory?: string | null;
  externalId: string;
}) {
  return [
    `**Store:** ${parts.store}`,
    `**Rating:** ${parts.rating}/5`,
    parts.version ? `**Version:** ${parts.version}` : null,
    parts.territory ? `**Territory:** ${parts.territory}` : null,
    parts.author ? `**Author:** ${parts.author}` : null,
    `**External id:** \`${parts.externalId}\``,
    "",
    parts.title ? `### ${parts.title}` : "### Review",
    parts.body,
  ]
    .filter(Boolean)
    .join("\n");
}

function parseIssueNumber(raw: string | null | undefined): number | null {
  if (!raw) return null;
  if (raw.startsWith("dry-run:")) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function runSync(userId: string, creds?: SyncCredentials) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const resolved = creds || credentialsFromSettings(settings);
  applyCredentialsEnv(resolved);

  const run = await prisma.syncRun.create({
    data: { userId, status: "running" },
  });

  try {
    const { reviews: fetched, sources, warnings } = await fetchAllStoreReviews();
    const threshold = resolved.minRating;
    let createdIssues = 0;
    let mergedInto = 0;

    for (const review of fetched) {
      const key = clusterKey(review.title, review.body);
      const existing = await prisma.review.findUnique({
        where: {
          userId_store_externalId: {
            userId,
            store: review.store,
            externalId: review.externalId,
          },
        },
      });
      if (existing) continue;

      const sibling = await findSiblingIssue(userId, key);
      let githubIssue: string | null = null;

      if (review.rating <= threshold) {
        const result = await createOrCommentIssue({
          title: issueTitle(review.rating, review.title, key),
          body: issueBody(review),
          existingIssueNumber: parseIssueNumber(sibling?.githubIssue),
          githubToken: resolved.githubToken,
          githubRepo: resolved.githubRepo,
        });

        if (result.dryRun) {
          githubIssue = sibling?.githubIssue || `dry-run:${key}`;
        } else {
          githubIssue = String(result.number);
        }

        if (sibling?.githubIssue) mergedInto += 1;
        else createdIssues += 1;
      }

      await prisma.review.create({
        data: {
          userId,
          store: review.store,
          externalId: review.externalId,
          rating: review.rating,
          title: review.title,
          body: review.body,
          author: review.author,
          version: review.version,
          territory: review.territory,
          reviewedAt: review.reviewedAt,
          clusterKey: key,
          githubIssue,
        },
      });
    }

    const message = [
      `minRating<=${threshold}`,
      `mock=${resolved.useMockReviews}`,
      `ios=${sources.app_store}`,
      `play=${sources.google_play}`,
      warnings.length ? `warnings=${warnings.length}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "ok",
        finishedAt: new Date(),
        fetched: fetched.length,
        createdIssues,
        mergedInto,
        message,
      },
    });

    // Suggest the worst open-linked review for the dashboard summary
    const linked = await prisma.review.findMany({
      where: {
        userId,
        githubIssue: { not: null },
        rating: { lte: threshold },
      },
      orderBy: [{ rating: "asc" }, { createdAt: "desc" }],
      take: 20,
    });
    const suggest = linked.find((r) => {
      const n = parseIssueNumber(r.githubIssue);
      return n !== null && !String(r.githubIssue).startsWith("dry-run:");
    });

    return {
      ok: true as const,
      fetched: fetched.length,
      createdIssues,
      mergedInto,
      sources,
      warnings,
      runId: run.id,
      suggestFix: suggest
        ? {
            issue: parseIssueNumber(suggest.githubIssue),
            title: suggest.title || suggest.clusterKey || "store review",
            rating: suggest.rating,
          }
        : null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "error",
        finishedAt: new Date(),
        message,
      },
    });
    return { ok: false as const, error: message, runId: run.id };
  }
}

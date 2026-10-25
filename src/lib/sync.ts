import "./env";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { clusterKey } from "./cluster";
import {
  createOrCommentIssue,
  externalIdLine,
  fetchIssueStates,
  findIssueByExternalId,
  storeLine,
  type IssueStateInfo,
} from "./github";
import { fetchAllStoreReviews } from "./stores";
import {
  applyCredentialsEnv,
  credentialsFromSettings,
  type SyncCredentials,
} from "./credentials";
import { formatIssueRef, issueNumber, parseIssueRef } from "./issue-ref";
import { acceptsNewReview, pickSibling, type SiblingCandidate } from "./merge";

const BUSY_MS = 5 * 60_000;

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
    storeLine(parts.store),
    `**Rating:** ${parts.rating}/5`,
    parts.version ? `**Version:** ${parts.version}` : null,
    parts.territory ? `**Territory:** ${parts.territory}` : null,
    parts.author ? `**Author:** ${parts.author}` : null,
    externalIdLine(parts.externalId),
    "",
    parts.title ? `### ${parts.title}` : "### Review",
    parts.body,
  ]
    .filter(Boolean)
    .join("\n");
}

function isUniqueConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

function isNotFound(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    Number((err as { status?: number }).status) === 404
  );
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
    const repo = resolved.githubRepo.trim();
    const token = resolved.githubToken.trim();
    const live = Boolean(token && repo.includes("/"));
    const mode = live ? "live" : "dry-run";
    let createdIssues = 0;
    let mergedInto = 0;

    const linkedRows = await prisma.review.findMany({
      where: { userId, githubIssue: { not: null } },
      select: { clusterKey: true, githubIssue: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const numbers: number[] = [];
    if (live) {
      for (const row of linkedRows) {
        const ref = parseIssueRef(row.githubIssue);
        if (ref.kind !== "issue") continue;
        if (ref.repo && ref.repo.toLowerCase() !== repo.toLowerCase()) continue;
        numbers.push(ref.number);
      }
    }

    const states: Record<number, IssueStateInfo> = live
      ? await fetchIssueStates({ numbers, githubToken: token, githubRepo: repo })
      : {};

    const pool: SiblingCandidate[] = [];
    for (const row of linkedRows) {
      if (!row.clusterKey || !row.githubIssue) continue;
      const ref = parseIssueRef(row.githubIssue);
      const info = ref.kind === "issue" ? states[ref.number] : undefined;
      if (
        !acceptsNewReview({
          githubIssue: row.githubIssue,
          mode,
          currentRepo: repo,
          state: info?.state,
          ours: info?.ours,
          stateKnown: Boolean(info),
        })
      ) {
        continue;
      }
      pool.push({
        clusterKey: row.clusterKey,
        githubIssue: row.githubIssue,
        accept: true,
      });
    }

    for (const review of fetched) {
      const key = clusterKey(review.title, review.body);
      const needsIssue = review.rating <= threshold;
      const identity = {
        userId_store_externalId: {
          userId,
          store: review.store,
          externalId: review.externalId,
        },
      };

      let row = await prisma.review.findUnique({ where: identity });
      let insertedNow = false;

      if (!row) {
        try {
          row = await prisma.review.create({
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
              githubIssue: needsIssue ? `pending:${run.id}` : null,
            },
          });
          insertedNow = true;
        } catch (err) {
          if (!isUniqueConflict(err)) throw err;
          row = await prisma.review.findUnique({ where: identity });
          if (!row) throw err;
        }
      }

      if (!needsIssue || !row) continue;

      const ref = parseIssueRef(row.githubIssue);
      if (ref.kind === "issue" || ref.kind === "dry-run") continue;
      if (ref.kind === "empty" && !insertedNow) continue;

      let resumed = false;
      if (ref.kind === "pending" && ref.runId !== run.id) {
        if (ref.runId) {
          const owner = await prisma.syncRun.findUnique({ where: { id: ref.runId } });
          const started = owner?.startedAt?.getTime() ?? 0;
          if (owner?.status === "running" && Date.now() - started < BUSY_MS) continue;
        }
        const claimed = await prisma.review.updateMany({
          where: { id: row.id, githubIssue: row.githubIssue },
          data: { githubIssue: `pending:${run.id}` },
        });
        if (claimed.count === 0) continue;
        resumed = true;
      }

      if (live && resumed) {
        const found = await findIssueByExternalId({
          store: review.store,
          externalId: review.externalId,
          githubToken: token,
          githubRepo: repo,
          since: row.createdAt,
        });
        if (found) {
          const githubIssue = formatIssueRef(repo, found);
          await prisma.review.update({
            where: { id: row.id },
            data: { githubIssue, clusterKey: key },
          });
          pool.unshift({ clusterKey: key, githubIssue, accept: true });
          createdIssues += 1;
          continue;
        }
      }

      const sibling = pickSibling(key, pool);
      const filed = await fileReview({
        sibling,
        pool,
        title: issueTitle(review.rating, review.title, key),
        body: issueBody(review),
        token,
        repo,
      });

      const githubIssue = filed.dryRun
        ? sibling?.githubIssue || `dry-run:${key}`
        : formatIssueRef(repo, filed.number);

      await prisma.review.update({
        where: { id: row.id },
        data: { githubIssue, clusterKey: key },
      });

      if (filed.merged) mergedInto += 1;
      else createdIssues += 1;

      pool.unshift({ clusterKey: key, githubIssue, accept: true });
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

    const linked = await prisma.review.findMany({
      where: {
        userId,
        githubIssue: { not: null },
        rating: { lte: threshold },
      },
      orderBy: [{ rating: "asc" }, { createdAt: "desc" }],
      take: 20,
    });
    const suggest = linked.find((item) => {
      const ref = parseIssueRef(item.githubIssue);
      if (ref.kind !== "issue") return false;
      if (ref.repo && ref.repo.toLowerCase() !== repo.toLowerCase()) return false;
      const state = states[ref.number];
      return !state || state.state !== "closed";
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
            issue: issueNumber(suggest.githubIssue),
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

async function fileReview(params: {
  sibling: SiblingCandidate | null;
  pool: SiblingCandidate[];
  title: string;
  body: string;
  token: string;
  repo: string;
}) {
  const call = (existingIssueNumber: number | null) =>
    createOrCommentIssue({
      title: params.title,
      body: params.body,
      existingIssueNumber,
      githubToken: params.token,
      githubRepo: params.repo,
    });

  let sibling = params.sibling;
  try {
    const result = await call(sibling ? issueNumber(sibling.githubIssue) : null);
    return { ...result, merged: Boolean(sibling) };
  } catch (err) {
    if (!sibling || !isNotFound(err)) throw err;
    const dead = sibling.githubIssue;
    for (const candidate of params.pool) {
      if (candidate.githubIssue === dead) candidate.accept = false;
    }
    const result = await call(null);
    return { ...result, merged: false };
  }
}

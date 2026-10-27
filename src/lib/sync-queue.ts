import { logProductError, logProductEvent } from "./analytics";
import { prisma } from "./prisma";
import { sleep } from "./rate-limit";
import { runSync } from "./sync";

export type SyncJobSource = "manual" | "cron";

/** Platform maxDuration is 60s. A running row older than this was killed mid-sync. */
const STALE_RUNNING_MS = 2 * 60 * 1000;

export async function expireStaleRunningJobs(userId: string) {
  const cutoff = new Date(Date.now() - STALE_RUNNING_MS);
  await prisma.syncJob.updateMany({
    where: {
      userId,
      status: "running",
      OR: [
        { startedAt: { lt: cutoff } },
        { startedAt: null, createdAt: { lt: cutoff } },
      ],
    },
    data: {
      status: "error",
      finishedAt: new Date(),
      message: "timed out",
    },
  });
}

/**
 * Enqueue a sync for a user. If one is already pending/running, reuse it
 * (manual waits on running; cron skips duplicate pending).
 */
export async function enqueueSync(userId: string, source: SyncJobSource) {
  await expireStaleRunningJobs(userId);
  const active = await prisma.syncJob.findFirst({
    where: { userId, status: { in: ["pending", "running"] } },
    orderBy: { createdAt: "desc" },
  });
  if (active) return active;
  return prisma.syncJob.create({
    data: { userId, source, status: "pending" },
  });
}

export async function processJob(jobId: string) {
  const claimed = await prisma.syncJob.updateMany({
    where: { id: jobId, status: "pending" },
    data: { status: "running", startedAt: new Date() },
  });
  if (claimed.count === 0) {
    const existing = await prisma.syncJob.findUnique({ where: { id: jobId } });
    return {
      ok: false as const,
      error: existing?.status === "running" ? "Sync already running" : "Job not claimable",
      jobId,
      status: existing?.status,
    };
  }

  const job = await prisma.syncJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return { ok: false as const, error: "Job missing", jobId };
  }

  try {
    const result = await runSync(job.userId);
    const message = result.ok
      ? `fetched=${result.fetched}; created=${result.createdIssues}; merged=${result.mergedInto}`
      : result.error;
    await prisma.syncJob.update({
      where: { id: jobId },
      data: {
        status: result.ok ? "ok" : "error",
        finishedAt: new Date(),
        message,
      },
    });
    if (result.ok) {
      logProductEvent("sync_ok", job.userId, message);
    } else {
      logProductError("sync_error", job.userId, message);
    }
    return { ...result, jobId };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.syncJob.update({
      where: { id: jobId },
      data: { status: "error", finishedAt: new Date(), message },
    });
    logProductError("sync_error", job.userId, message);
    return { ok: false as const, error: message, jobId };
  }
}

/** Manual path: enqueue then run immediately (returns sync result). */
export async function enqueueAndRun(userId: string) {
  await expireStaleRunningJobs(userId);
  const existing = await prisma.syncJob.findFirst({
    where: { userId, status: "running" },
  });
  if (existing) {
    return {
      ok: false as const,
      error: "Sync already running. Try again in a minute.",
      jobId: existing.id,
    };
  }

  // Drop stale pending for this user so we run a fresh job
  await prisma.syncJob.updateMany({
    where: { userId, status: "pending" },
    data: { status: "error", finishedAt: new Date(), message: "superseded" },
  });

  const job = await prisma.syncJob.create({
    data: { userId, source: "manual", status: "pending" },
  });
  return processJob(job.id);
}

/**
 * Cron: enqueue eligible users, then process pending jobs with spacing.
 * `limit` caps how many jobs run in one invocation (Vercel timeout safety).
 */
export async function processCronQueue(userIds: string[], limit = 20) {
  for (const userId of userIds) {
    await enqueueSync(userId, "cron");
  }

  const pending = await prisma.syncJob.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  const results = [];
  for (let i = 0; i < pending.length; i++) {
    results.push(await processJob(pending[i].id));
    if (i < pending.length - 1) await sleep(500);
  }
  return results;
}

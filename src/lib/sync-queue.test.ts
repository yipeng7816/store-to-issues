import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirst = vi.fn();
const create = vi.fn();
const updateMany = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
const runSync = vi.fn();

vi.mock("./prisma", () => ({
  prisma: {
    syncJob: {
      findFirst: (...args: unknown[]) => findFirst(...args),
      create: (...args: unknown[]) => create(...args),
      updateMany: (...args: unknown[]) => updateMany(...args),
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

vi.mock("./sync", () => ({
  runSync: (...args: unknown[]) => runSync(...args),
}));

vi.mock("./rate-limit", async () => {
  const actual = await vi.importActual<typeof import("./rate-limit")>(
    "./rate-limit",
  );
  return { ...actual, sleep: async () => undefined };
});

describe("enqueueAndRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("alerts when a job is already running", async () => {
    findFirst.mockResolvedValue({ id: "running-job", status: "running" });
    const { enqueueAndRun } = await import("./sync-queue");
    const result = await enqueueAndRun("u1");
    expect(result).toEqual({
      ok: false,
      error: "Sync already running. Try again in a minute.",
      jobId: "running-job",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates pending job, claims it, and returns sync ok", async () => {
    findFirst.mockResolvedValue(null);
    updateMany
      .mockResolvedValueOnce({ count: 0 }) // supersede pending
      .mockResolvedValueOnce({ count: 1 }); // claim
    create.mockResolvedValue({ id: "job-1", userId: "u1", status: "pending" });
    findUnique.mockResolvedValue({
      id: "job-1",
      userId: "u1",
      status: "running",
    });
    runSync.mockResolvedValue({
      ok: true,
      fetched: 3,
      createdIssues: 1,
      mergedInto: 0,
    });
    update.mockResolvedValue({});

    const { enqueueAndRun } = await import("./sync-queue");
    const result = await enqueueAndRun("u1");
    expect(result).toMatchObject({
      ok: true,
      fetched: 3,
      createdIssues: 1,
      jobId: "job-1",
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: expect.objectContaining({ status: "ok" }),
    });
  });

  it("marks job error when runSync fails", async () => {
    findFirst.mockResolvedValue(null);
    updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 });
    create.mockResolvedValue({ id: "job-2", userId: "u1", status: "pending" });
    findUnique.mockResolvedValue({
      id: "job-2",
      userId: "u1",
      status: "running",
    });
    runSync.mockResolvedValue({
      ok: false,
      error: "No reviews fetched from either store",
      runId: "r1",
    });
    update.mockResolvedValue({});

    const { enqueueAndRun } = await import("./sync-queue");
    const result = await enqueueAndRun("u1");
    expect(result).toMatchObject({
      ok: false,
      error: "No reviews fetched from either store",
      jobId: "job-2",
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "job-2" },
      data: expect.objectContaining({
        status: "error",
        message: "No reviews fetched from either store",
      }),
    });
  });
});

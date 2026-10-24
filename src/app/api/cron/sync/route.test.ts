import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const processCronQueue = vi.fn();

vi.mock("../../../../lib/prisma", () => ({
  prisma: {
    userSettings: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

vi.mock("../../../../lib/sync-queue", () => ({
  processCronQueue: (...args: unknown[]) => processCronQueue(...args),
}));

describe("POST /api/cron/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret";
    findMany.mockResolvedValue([{ userId: "u1" }]);
    processCronQueue.mockResolvedValue([{ ok: true, jobId: "j1" }]);
  });

  it("returns 401 without Bearer CRON_SECRET", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/cron/sync", { method: "POST" }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(processCronQueue).not.toHaveBeenCalled();
  });

  it("runs queue when authorized", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/cron/sync", {
        method: "POST",
        headers: { authorization: "Bearer cron-secret" },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      enqueued: 1,
      processed: 1,
    });
    expect(processCronQueue).toHaveBeenCalledWith(["u1"], 20);
  });
});

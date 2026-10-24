import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserId = vi.fn();
const findUnique = vi.fn();
const enqueueAndRun = vi.fn();
const checkSyncAccess = vi.fn();

vi.mock("../../../lib/session", () => ({
  requireUserId: () => requireUserId(),
}));

vi.mock("../../../lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));

vi.mock("../../../lib/sync-queue", () => ({
  enqueueAndRun: (...args: unknown[]) => enqueueAndRun(...args),
}));

vi.mock("../../../lib/billing", () => ({
  checkSyncAccess: (...args: unknown[]) => checkSyncAccess(...args),
}));

describe("POST /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not logged in", async () => {
    requireUserId.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 402 with reason when subscription required", async () => {
    requireUserId.mockResolvedValue("u1");
    findUnique.mockResolvedValue({
      id: "u1",
      planStatus: "trialing",
      trialEndsAt: new Date(0),
    });
    checkSyncAccess.mockReturnValue({
      allowed: false,
      reason: "trial_expired",
      planStatus: "none",
      trialEndsAt: new Date(0),
      stripeConfigured: false,
      billingConfigured: false,
    });

    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toBe("Subscription required");
    expect(body.reason).toBe("trial_expired");
    expect(enqueueAndRun).not.toHaveBeenCalled();
  });

  it("returns 409 when sync already running", async () => {
    requireUserId.mockResolvedValue("u1");
    findUnique.mockResolvedValue({ id: "u1", planStatus: "active" });
    checkSyncAccess.mockReturnValue({
      allowed: true,
      reason: "active",
      planStatus: "active",
      trialEndsAt: null,
      stripeConfigured: true,
      billingConfigured: true,
    });
    enqueueAndRun.mockResolvedValue({
      ok: false,
      error: "Sync already running. Try again in a minute.",
      jobId: "j1",
    });

    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/already running/i);
  });

  it("returns 500 when sync fails for other reasons", async () => {
    requireUserId.mockResolvedValue("u1");
    findUnique.mockResolvedValue({ id: "u1", planStatus: "active" });
    checkSyncAccess.mockReturnValue({
      allowed: true,
      reason: "active",
      planStatus: "active",
      trialEndsAt: null,
      stripeConfigured: true,
      billingConfigured: true,
    });
    enqueueAndRun.mockResolvedValue({
      ok: false,
      error: "GitHub API blew up",
      jobId: "j1",
    });

    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "GitHub API blew up",
    });
  });

  it("returns 200 with sync result when allowed", async () => {
    requireUserId.mockResolvedValue("u1");
    findUnique.mockResolvedValue({ id: "u1", planStatus: "trialing" });
    checkSyncAccess.mockReturnValue({
      allowed: true,
      reason: "trialing",
      planStatus: "trialing",
      trialEndsAt: new Date(Date.now() + 86400_000),
      stripeConfigured: false,
      billingConfigured: false,
    });
    enqueueAndRun.mockResolvedValue({
      ok: true,
      fetched: 5,
      createdIssues: 2,
      mergedInto: 1,
      jobId: "j1",
    });

    const { POST } = await import("./route");
    const res = await POST();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      fetched: 5,
      createdIssues: 2,
      mergedInto: 1,
    });
  });
});

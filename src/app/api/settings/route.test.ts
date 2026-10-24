import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUserId = vi.fn();
const findUnique = vi.fn();
const upsert = vi.fn();

vi.mock("../../../lib/session", () => ({
  requireUserId: () => requireUserId(),
}));

vi.mock("../../../lib/prisma", () => ({
  prisma: {
    userSettings: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      upsert: (...args: unknown[]) => upsert(...args),
    },
  },
}));

describe("GET/PUT /api/settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    requireUserId.mockResolvedValue(null);
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET redacts secrets (only *Set flags)", async () => {
    requireUserId.mockResolvedValue("u1");
    findUnique.mockResolvedValue({
      githubRepo: "owner/repo",
      githubToken: "enc:v1:secret",
      useMockReviews: true,
      minRating: 2,
      ascAppId: "",
      ascIssuerId: "",
      ascKeyId: "",
      ascPrivateKey: "",
      googlePlayPackageName: "",
      googlePlayServiceAccountJson: "enc:v1:sa",
    });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.settings.githubTokenSet).toBe(true);
    expect(body.settings.googlePlayServiceAccountJsonSet).toBe(true);
    expect(body.settings).not.toHaveProperty("githubToken");
    expect(body.settings.githubRepo).toBe("owner/repo");
  });

  it("PUT returns 401 when unauthenticated", async () => {
    requireUserId.mockResolvedValue(null);
    const { PUT } = await import("./route");
    const res = await PUT(
      new Request("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({ githubRepo: "a/b" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("PUT upserts settings on success", async () => {
    requireUserId.mockResolvedValue("u1");
    findUnique.mockResolvedValue(null);
    upsert.mockResolvedValue({});
    const { PUT } = await import("./route");
    const res = await PUT(
      new Request("http://localhost/api/settings", {
        method: "PUT",
        body: JSON.stringify({
          githubRepo: "owner/repo",
          githubToken: "ghp_test",
          useMockReviews: true,
          minRating: 3,
        }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(upsert).toHaveBeenCalled();
    const arg = upsert.mock.calls[0][0];
    expect(arg.create.githubRepo).toBe("owner/repo");
    expect(arg.create.githubToken).toMatch(/^enc:v1:/);
  });
});

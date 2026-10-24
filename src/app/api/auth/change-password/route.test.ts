import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const requireUserId = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();

vi.mock("../../../../lib/session", () => ({
  requireUserId: () => requireUserId(),
}));

vi.mock("../../../../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

describe("POST /api/auth/change-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    requireUserId.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass12",
          newPassword: "newpass12",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when new password too short", async () => {
    requireUserId.mockResolvedValue("u1");
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass12",
          newPassword: "short",
        }),
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "New password must be at least 8 characters.",
    });
  });

  it("returns 400 when current password is wrong", async () => {
    requireUserId.mockResolvedValue("u1");
    findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: await bcrypt.hash("oldpass12", 4),
    });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "wrong-pass",
          newPassword: "newpass12",
        }),
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Current password is incorrect.",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("updates hash on success", async () => {
    requireUserId.mockResolvedValue("u1");
    findUnique.mockResolvedValue({
      id: "u1",
      passwordHash: await bcrypt.hash("oldpass12", 4),
    });
    update.mockResolvedValue({});
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "oldpass12",
          newPassword: "newpass12",
        }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(update).toHaveBeenCalled();
  });
});

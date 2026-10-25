import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const findUnique = vi.fn();
const sessionSave = vi.fn();
const session: { userId?: string; email?: string; save: typeof sessionSave } = {
  save: sessionSave,
};

vi.mock("../../../../lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));

vi.mock("../../../../lib/session", () => ({
  getSession: async () => session,
}));

vi.mock("../../../../lib/request-limit", () => ({
  allowRequest: async () => true,
  clientIp: () => "127.0.0.1",
  tooManyAttempts: () => ({ error: "Too many attempts. Try again later." }),
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete session.userId;
    delete session.email;
  });

  it("returns 401 for unknown email (generic alert)", async () => {
    findUnique.mockResolvedValue(null);
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "no@one.com", password: "password1" }),
      }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid email or password.",
    });
  });

  it("returns 401 for wrong password (same alert, no leak)", async () => {
    const passwordHash = await bcrypt.hash("correct-horse", 4);
    findUnique.mockResolvedValue({
      id: "u1",
      email: "dev@example.com",
      passwordHash,
    });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "dev@example.com",
          password: "wrong-password",
        }),
      }),
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid email or password.",
    });
    expect(sessionSave).not.toHaveBeenCalled();
  });

  it("logs in and saves session on success", async () => {
    const passwordHash = await bcrypt.hash("correct-horse", 4);
    findUnique.mockResolvedValue({
      id: "u1",
      email: "dev@example.com",
      passwordHash,
    });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: " Dev@Example.com ",
          password: "correct-horse",
        }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      ok: true,
      email: "dev@example.com",
    });
    expect(session.userId).toBe("u1");
    expect(session.email).toBe("dev@example.com");
    expect(sessionSave).toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const create = vi.fn();
const update = vi.fn();
const createEmailToken = vi.fn();
const sendEmail = vi.fn();
const sessionSave = vi.fn();
const session: { userId?: string; email?: string; save: typeof sessionSave } = {
  save: sessionSave,
};

vi.mock("../../../../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      create: (...args: unknown[]) => create(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

vi.mock("../../../../lib/session", () => ({
  getSession: async () => session,
}));

vi.mock("../../../../lib/tokens", () => ({
  createEmailToken: (...args: unknown[]) => createEmailToken(...args),
}));

vi.mock("../../../../lib/email", () => ({
  appBaseUrl: () => "http://localhost:3000",
  sendEmail: (...args: unknown[]) => sendEmail(...args),
}));

vi.mock("../../../../lib/analytics", () => ({
  logProductEvent: vi.fn(),
  logProductError: vi.fn(),
}));

vi.mock("../../../../lib/billing", () => ({
  defaultTrialEndsAt: () => new Date("2030-01-01T00:00:00.000Z"),
}));

vi.mock("../../../../lib/request-limit", () => ({
  allowRequest: async () => true,
  clientIp: () => "127.0.0.1",
  tooManyAttempts: () => ({ error: "Too many attempts. Try again later." }),
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete session.userId;
    delete session.email;
  });

  it("returns 400 for invalid email", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: "not-an-email", password: "password1" }),
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid email." });
  });

  it("returns 400 for short password", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", password: "short" }),
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Password must be at least 8 characters.",
    });
  });

  it("returns 409 when email already registered", async () => {
    findUnique.mockResolvedValue({ id: "existing" });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com", password: "password1" }),
      }),
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      error: "Email already registered.",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates trialing user and session on success", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "u1", email: "a@b.com" });
    update.mockResolvedValue({});
    createEmailToken.mockResolvedValue("raw-token");
    sendEmail.mockResolvedValue({ ok: true });

    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: "A@B.com", password: "password1" }),
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      email: "a@b.com",
      emailSent: true,
    });
    expect(create).toHaveBeenCalled();
    const createArg = create.mock.calls[0][0];
    expect(createArg.data.planStatus).toBe("trialing");
    expect(session.userId).toBe("u1");
    expect(sessionSave).toHaveBeenCalled();
  });
});

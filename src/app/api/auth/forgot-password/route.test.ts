import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const createEmailToken = vi.fn();
const sendEmail = vi.fn();
const allowRequest = vi.fn();

vi.mock("../../../../lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
  },
}));

vi.mock("../../../../lib/tokens", () => ({
  createEmailToken: (...args: unknown[]) => createEmailToken(...args),
}));

vi.mock("../../../../lib/email", async () => {
  const actual = await vi.importActual<typeof import("../../../../lib/email")>(
    "../../../../lib/email",
  );
  return {
    ...actual,
    appBaseUrl: () => "http://localhost:3000",
    sendEmail: (...args: unknown[]) => sendEmail(...args),
  };
});

vi.mock("../../../../lib/request-limit", () => ({
  allowRequest: (...args: unknown[]) => allowRequest(...args),
  clientIp: () => "127.0.0.1",
  tooManyAttempts: () => ({ error: "Too many attempts. Try again later." }),
}));

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    allowRequest.mockResolvedValue(true);
    findUnique.mockResolvedValue({ id: "u1", email: "a@b.com" });
    createEmailToken.mockResolvedValue("raw-token");
    sendEmail.mockResolvedValue({ ok: false, error: "Resend 500" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not return the reset link when email sending fails in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.devLink).toBeUndefined();
    expect(body.emailSent).toBe(false);
  });

  it("returns the reset link outside production when email sending fails", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    );
    const body = await res.json();
    expect(body.devLink).toBe("http://localhost:3000/reset-password?token=raw-token");
  });

  it("returns 429 when the reset attempts are exhausted", async () => {
    allowRequest.mockResolvedValue(false);
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    );
    expect(res.status).toBe(429);
    expect(createEmailToken).not.toHaveBeenCalled();
  });
});

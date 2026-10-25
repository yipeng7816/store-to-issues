import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const upsert = vi.fn();
const update = vi.fn();

vi.mock("./prisma", () => ({
  prisma: {
    rateLimit: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      upsert: (...args: unknown[]) => upsert(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

describe("allowRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks once the window count is exhausted", async () => {
    findUnique.mockResolvedValue({
      key: "login:1:a@b.com",
      count: 10,
      resetAt: new Date(Date.now() + 60_000),
    });
    const { allowRequest } = await import("./request-limit");
    await expect(allowRequest("login:1:a@b.com", 10, 60_000)).resolves.toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("opens a new window when the previous one expired", async () => {
    findUnique.mockResolvedValue({
      key: "login:1:a@b.com",
      count: 10,
      resetAt: new Date(Date.now() - 1000),
    });
    upsert.mockResolvedValue({});
    const { allowRequest } = await import("./request-limit");
    await expect(allowRequest("login:1:a@b.com", 10, 60_000)).resolves.toBe(true);
    expect(upsert).toHaveBeenCalled();
  });

  it("allows the request when the limiter cannot reach the database", async () => {
    findUnique.mockRejectedValue(new Error("relation RateLimit does not exist"));
    const { allowRequest } = await import("./request-limit");
    await expect(allowRequest("login:1:a@b.com", 10, 60_000)).resolves.toBe(true);
  });
});

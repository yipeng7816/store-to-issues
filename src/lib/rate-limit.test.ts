import { describe, expect, it, vi } from "vitest";
import {
  fetchWithRetry,
  isRetryableStatus,
  mapPool,
  withRetry,
} from "./rate-limit";

describe("isRetryableStatus", () => {
  it("retries 429 and gateway errors", () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(502)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(504)).toBe(true);
  });

  it("does not retry client/auth errors", () => {
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(403)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(200)).toBe(false);
  });
});

describe("withRetry", () => {
  it("returns on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn, { retries: 3, baseDelayMs: 1 })).resolves.toBe(
      "ok",
    );
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries retryable status then succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("rate"), { status: 429 }))
      .mockResolvedValue("ok");
    await expect(
      withRetry(fn, { retries: 3, baseDelayMs: 1, maxDelayMs: 5 }),
    ).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-retryable errors (alerts immediately)", async () => {
    const err = Object.assign(new Error("bad auth"), { status: 401 });
    const fn = vi.fn().mockRejectedValue(err);
    await expect(
      withRetry(fn, { retries: 3, baseDelayMs: 1 }),
    ).rejects.toThrow("bad auth");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("exhausts retries and rethrows", async () => {
    const err = Object.assign(new Error("busy"), { status: 503 });
    const fn = vi.fn().mockRejectedValue(err);
    await expect(
      withRetry(fn, { retries: 2, baseDelayMs: 1, maxDelayMs: 5 }),
    ).rejects.toThrow("busy");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("fetchWithRetry", () => {
  it("retries 429 then returns success response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("slow", {
          status: 429,
          headers: { "retry-after": "0" },
        }),
      )
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("https://example.test", undefined, {
      retries: 2,
      baseDelayMs: 1,
      maxDelayMs: 5,
    });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllGlobals();
  });
});

describe("mapPool", () => {
  it("preserves order with concurrency cap", async () => {
    const items = [1, 2, 3, 4, 5];
    const active = { n: 0, max: 0 };
    const out = await mapPool(items, 2, async (n) => {
      active.n += 1;
      active.max = Math.max(active.max, active.n);
      await new Promise((r) => setTimeout(r, 5));
      active.n -= 1;
      return n * 10;
    });
    expect(out).toEqual([10, 20, 30, 40, 50]);
    expect(active.max).toBeLessThanOrEqual(2);
  });
});

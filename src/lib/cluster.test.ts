import { describe, expect, it } from "vitest";
import { clusterKey, overlapScore, shouldMergeKeys } from "./cluster";
import { mockAllReviews } from "./mocks";

describe("clusterKey", () => {
  it("is stable for the same complaint phrasing", () => {
    const a = clusterKey("Crash on login", "app crashes every time I tap login");
    const b = clusterKey("Crash on login", "app crashes every time I tap login");
    expect(a).toBe(b);
    expect(a).toContain("crash");
    expect(a).toContain("login");
  });

  it("prioritizes bug-ish tokens", () => {
    const key = clusterKey(
      "Payment failed",
      "Checkout button does nothing, cannot pay for subscription.",
    );
    expect(key.split("|")[0]).toMatch(/crash|login|pay|payment|checkout|bug|error|fail/);
  });

  it("falls back when text is empty", () => {
    expect(clusterKey(undefined, "")).toBe("unknown");
  });
});

describe("overlapScore / shouldMergeKeys", () => {
  it("merges at ≥ 50% overlap", () => {
    expect(overlapScore("crash|login|update", "crash|login|screen")).toBeCloseTo(
      2 / 3,
      5,
    );
    expect(shouldMergeKeys("crash|login|update", "crash|login|screen")).toBe(true);
  });

  it("does not merge unrelated keys", () => {
    expect(shouldMergeKeys("crash|login", "payment|checkout")).toBe(false);
  });

  it("mock dual-store login crashes should merge", () => {
    const reviews = mockAllReviews();
    const iosCrash = reviews.find((r) => r.externalId === "ios-1")!;
    const gpCrash = reviews.find((r) => r.externalId === "gp-1")!;
    const a = clusterKey(iosCrash.title, iosCrash.body);
    const b = clusterKey(gpCrash.title, gpCrash.body);
    expect(shouldMergeKeys(a, b)).toBe(true);
  });

  it("mock payment complaints should merge", () => {
    const reviews = mockAllReviews();
    const a = reviews.find((r) => r.externalId === "gp-2")!;
    const b = reviews.find((r) => r.externalId === "gp-3")!;
    expect(
      shouldMergeKeys(clusterKey(a.title, a.body), clusterKey(b.title, b.body)),
    ).toBe(true);
  });

  it("5★ praise does not merge into crash cluster", () => {
    const reviews = mockAllReviews();
    const crash = reviews.find((r) => r.externalId === "ios-1")!;
    const love = reviews.find((r) => r.externalId === "ios-2")!;
    expect(
      shouldMergeKeys(
        clusterKey(crash.title, crash.body),
        clusterKey(love.title, love.body),
      ),
    ).toBe(false);
  });
});

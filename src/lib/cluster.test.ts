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

  it("does not merge a one-token crash into a more specific crash", () => {
    expect(overlapScore("crash", "crash|login|tap|update")).toBe(1);
    expect(shouldMergeKeys("crash", "crash|login|tap|update")).toBe(false);
    expect(shouldMergeKeys("crash", "crash")).toBe(true);
  });

  it("does not treat logged-out, please-check, or slow login as the same complaint", () => {
    const payment = clusterKey(
      "Payment failed",
      "Checkout button does nothing, cannot pay for subscription.",
    );
    const login = clusterKey(
      "Crash on login",
      "app crashes every time I tap login",
    );
    expect(clusterKey(undefined, "out")).not.toContain("checkout");
    expect(clusterKey("Please check", "Please check the new version")).not.toContain(
      "checkout",
    );
    expect(clusterKey("Logged out", "Logged out")).not.toContain("checkout");
    expect(clusterKey("Log out", "Keeps logging me out")).not.toContain("login");
    expect(shouldMergeKeys(clusterKey("Logged out", "Signed out"), payment)).toBe(false);
    expect(shouldMergeKeys(clusterKey("Please check", "Please check this"), payment)).toBe(
      false,
    );
    expect(shouldMergeKeys(clusterKey("Crash", "It crashed"), login)).toBe(false);
    expect(shouldMergeKeys(clusterKey("Login", "Login is slow"), login)).toBe(false);
    expect(
      shouldMergeKeys(
        clusterKey("Crash", "Crashes on startup"),
        clusterKey("Crash", "Crashes when I open the camera"),
      ),
    ).toBe(false);
  });

  it("merges Chinese paraphrases of the same complaint", () => {
    expect(
      shouldMergeKeys(
        clusterKey("闪退", "打开就闪退"),
        clusterKey("闪退", "一打开就闪退"),
      ),
    ).toBe(true);
    expect(
      shouldMergeKeys(
        clusterKey("登录崩溃", "一点登录就崩溃"),
        clusterKey("登录闪退", "登录时崩溃"),
      ),
    ).toBe(true);
    expect(
      shouldMergeKeys(
        clusterKey("好评", "这个应用很好用"),
        clusterKey("卡顿", "这个应用很卡顿"),
      ),
    ).toBe(false);
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

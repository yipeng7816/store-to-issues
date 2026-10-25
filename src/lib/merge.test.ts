import { describe, expect, it } from "vitest";
import { acceptsNewReview, pickSibling } from "./merge";

describe("acceptsNewReview", () => {
  it("ignores dry-run anchors once GitHub is live", () => {
    expect(
      acceptsNewReview({
        githubIssue: "dry-run:crash|login",
        mode: "live",
        currentRepo: "acme/app",
        stateKnown: false,
      }),
    ).toBe(false);
  });

  it("keeps merging dry-run anchors while credentials are missing", () => {
    expect(
      acceptsNewReview({
        githubIssue: "dry-run:crash|login",
        mode: "dry-run",
        currentRepo: "",
        stateKnown: false,
      }),
    ).toBe(true);
  });

  it("refuses closed issues and issues in another repo", () => {
    expect(
      acceptsNewReview({
        githubIssue: "acme/app#4",
        mode: "live",
        currentRepo: "acme/app",
        state: "closed",
        ours: true,
        stateKnown: true,
      }),
    ).toBe(false);
    expect(
      acceptsNewReview({
        githubIssue: "other/repo#4",
        mode: "live",
        currentRepo: "acme/app",
        state: "open",
        ours: true,
        stateKnown: true,
      }),
    ).toBe(false);
  });

  it("accepts an open issue in the current repo", () => {
    expect(
      acceptsNewReview({
        githubIssue: "acme/app#4",
        mode: "live",
        currentRepo: "acme/app",
        state: "open",
        ours: true,
        stateKnown: true,
      }),
    ).toBe(true);
  });

  it("accepts a legacy bare number only when the live issue is ours and open", () => {
    expect(
      acceptsNewReview({
        githubIssue: "4",
        mode: "live",
        currentRepo: "acme/app",
        state: "open",
        ours: true,
        stateKnown: true,
      }),
    ).toBe(true);
    expect(
      acceptsNewReview({
        githubIssue: "4",
        mode: "live",
        currentRepo: "acme/app",
        state: "open",
        ours: false,
        stateKnown: true,
      }),
    ).toBe(false);
    expect(
      acceptsNewReview({
        githubIssue: "4",
        mode: "live",
        currentRepo: "acme/app",
        stateKnown: false,
      }),
    ).toBe(false);
  });
});

describe("pickSibling", () => {
  it("picks the closer open issue and skips rejected candidates", () => {
    const picked = pickSibling("crash|login|update", [
      { clusterKey: "crash|login", githubIssue: "acme/app#9", accept: true },
      { clusterKey: "dry-run:crash|login", githubIssue: "dry-run:crash|login", accept: false },
      { clusterKey: "pay|payment|checkout", githubIssue: "acme/app#2", accept: true },
    ]);
    expect(picked?.githubIssue).toBe("acme/app#9");
  });

  it("does not attach a bare crash key to a login-crash issue", () => {
    const picked = pickSibling("crash", [
      { clusterKey: "crash|login|tap|update", githubIssue: "acme/app#9", accept: true },
    ]);
    expect(picked).toBeNull();
  });
});

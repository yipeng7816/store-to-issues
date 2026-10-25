import { afterEach, describe, expect, it } from "vitest";
import { createOrCommentIssue, textHasReviewMarker } from "./github";

describe("textHasReviewMarker", () => {
  it("matches the store and external id lines written into an issue", () => {
    const body = [
      "**Store:** app_store",
      "**Rating:** 1/5",
      "**External id:** `ios-1`",
    ].join("\n");
    expect(textHasReviewMarker(body, "app_store", "ios-1")).toBe(true);
    expect(textHasReviewMarker(body, "google_play", "ios-1")).toBe(false);
    expect(textHasReviewMarker(body, "app_store", "ios-2")).toBe(false);
  });
});

describe("createOrCommentIssue", () => {
  const prevToken = process.env.GITHUB_TOKEN;
  const prevRepo = process.env.GITHUB_REPO;

  afterEach(() => {
    if (prevToken === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prevToken;
    if (prevRepo === undefined) delete process.env.GITHUB_REPO;
    else process.env.GITHUB_REPO = prevRepo;
  });

  it("dry-runs (alerts via dryRun) when token/repo missing", async () => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPO;
    const result = await createOrCommentIssue({
      title: "t",
      body: "b",
      githubToken: "",
      githubRepo: "",
    });
    expect(result.dryRun).toBe(true);
    expect(result.number).toBe(0);
    expect(result.url).toMatch(/dry-run/i);
  });

  it("dry-runs when repo shape is invalid", async () => {
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPO;
    const result = await createOrCommentIssue({
      title: "t",
      body: "b",
      githubToken: "tok",
      githubRepo: "not-a-repo",
    });
    expect(result.dryRun).toBe(true);
  });
});

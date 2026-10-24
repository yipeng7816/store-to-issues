import { afterEach, describe, expect, it } from "vitest";
import { createOrCommentIssue } from "./github";

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

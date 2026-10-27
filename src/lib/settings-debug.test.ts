import { describe, expect, it } from "vitest";
import { settingsSnapshotFromBody } from "./settings-debug";

describe("settingsSnapshotFromBody", () => {
  it("records app ids and secret-provided flags without secret values", () => {
    const snap = settingsSnapshotFromBody({
      githubRepo: "o/r",
      ascAppId: "123",
      ascIssuerId: "iss",
      ascKeyId: "kid",
      googlePlayPackageName: "com.example.app",
      githubToken: "ghp_secret_should_not_appear_in_snapshot",
      useMockReviews: false,
      minRating: 2,
    });
    expect(snap.ascAppId).toBe("123");
    expect(snap.githubTokenSet).toBe(true);
    expect(JSON.stringify(snap)).not.toContain("ghp_secret");
  });
});

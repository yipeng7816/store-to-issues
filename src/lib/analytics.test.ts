import { describe, expect, it } from "vitest";
import {
  normalizePagePath,
  normalizeReferrer,
  normalizeVisitorKey,
} from "./analytics";

describe("analytics normalization", () => {
  it("accepts public paths only", () => {
    expect(normalizePagePath("/pricing")).toBe("/pricing");
    expect(normalizePagePath("/api/health")).toBeNull();
    expect(normalizePagePath("/admin")).toBeNull();
    expect(normalizePagePath("../etc")).toBeNull();
  });

  it("strips query and hash", () => {
    expect(normalizePagePath("/login?x=1#foo")).toBe("/login");
  });

  it("validates visitor key", () => {
    expect(normalizeVisitorKey("abc")).toBeNull();
    expect(normalizeVisitorKey("abcd1234_abcd")).toBe("abcd1234_abcd");
    expect(normalizeVisitorKey("bad space")).toBeNull();
  });

  it("normalizes referrer host", () => {
    expect(normalizeReferrer("https://google.com/search?q=1")).toBe(
      "https://google.com",
    );
    expect(normalizeReferrer("not-a-url")).toBe("");
  });
});

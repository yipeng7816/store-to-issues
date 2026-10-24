import { describe, expect, it } from "vitest";
import { hashToken, newRawToken } from "./tokens";

describe("tokens helpers", () => {
  it("newRawToken is long hex", () => {
    const a = newRawToken();
    const b = newRawToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it("hashToken is deterministic sha256 hex", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});

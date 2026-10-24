import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, isEncrypted } from "./crypto";

describe("encryptSecret / decryptSecret", () => {
  it("round-trips secrets with enc:v1 prefix", () => {
    const sample = "github_pat_test_secret_value";
    const enc = encryptSecret(sample);
    expect(enc).not.toBe(sample);
    expect(isEncrypted(enc)).toBe(true);
    expect(enc).toMatch(/^enc:v1:/);
    expect(decryptSecret(enc)).toBe(sample);
  });

  it("passes through legacy plaintext", () => {
    expect(decryptSecret("legacy-plain")).toBe("legacy-plain");
    expect(isEncrypted("legacy-plain")).toBe(false);
  });

  it("keeps empty string empty", () => {
    expect(encryptSecret("")).toBe("");
    expect(decryptSecret("")).toBe("");
  });

  it("does not double-encrypt", () => {
    const once = encryptSecret("token");
    const twice = encryptSecret(once);
    expect(twice).toBe(once);
    expect(decryptSecret(twice)).toBe("token");
  });

  it("alerts on tampered ciphertext (throws)", () => {
    const enc = encryptSecret("secret");
    const broken = enc.slice(0, -4) + "xxxx";
    expect(() => decryptSecret(broken)).toThrow();
  });
});

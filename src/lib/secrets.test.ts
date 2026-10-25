import { afterEach, describe, expect, it, vi } from "vitest";
import { encryptionSecret, sessionPassword } from "./secrets";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("production secrets", () => {
  it("uses configured secrets when they are long enough", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "s".repeat(32));
    vi.stubEnv("ENCRYPTION_KEY", "e".repeat(16));
    expect(sessionPassword()).toBe("s".repeat(32));
    expect(encryptionSecret()).toBe("e".repeat(16));
  });

  it("refuses the in-repo session fallback in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    expect(() => sessionPassword()).toThrow(/SESSION_SECRET/);
  });

  it("refuses the in-repo encryption fallback in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENCRYPTION_KEY", "");
    vi.stubEnv("SESSION_SECRET", "s".repeat(32));
    expect(() => encryptionSecret()).toThrow(/ENCRYPTION_KEY/);
  });

  it("keeps a local fallback outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("ENCRYPTION_KEY", "");
    expect(sessionPassword().length).toBeGreaterThanOrEqual(32);
    expect(encryptionSecret().length).toBeGreaterThanOrEqual(16);
  });
});

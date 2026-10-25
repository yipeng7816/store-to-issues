const DEV_SESSION = "store-to-issues-dev-secret-min-32-chars!!";
const DEV_ENCRYPTION = "store-to-issues-dev-encryption";

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** iron-session password. Production refuses the in-repo fallback. */
export function sessionPassword(): string {
  const secret = process.env.SESSION_SECRET || "";
  if (secret.length >= 32) return secret;
  if (isProduction()) {
    throw new Error("SESSION_SECRET must be at least 32 characters in production");
  }
  return DEV_SESSION;
}

/**
 * AES key material. Production never uses the in-repo fallback.
 * ENCRYPTION_KEY wins so existing ciphertext keeps decrypting.
 */
export function encryptionSecret(): string {
  const dedicated = process.env.ENCRYPTION_KEY || "";
  if (dedicated.length >= 16) return dedicated;
  if (isProduction()) {
    throw new Error("ENCRYPTION_KEY must be at least 16 characters in production");
  }
  const session = process.env.SESSION_SECRET || "";
  if (session.length >= 16) return session;
  return DEV_ENCRYPTION;
}

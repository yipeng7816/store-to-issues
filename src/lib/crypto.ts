import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function keyBytes(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "";
  if (!secret || secret.length < 16) {
    // Dev fallback — set ENCRYPTION_KEY in production.
    return createHash("sha256").update("store-to-issues-dev-encryption").digest();
  }
  return createHash("sha256").update(secret).digest();
}

/** Encrypt a secret for DB storage. Empty string stays empty. */
export function encryptSecret(plain: string): string {
  if (!plain) return "";
  if (plain.startsWith(PREFIX)) return plain;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    Buffer.concat([iv, tag, encrypted]).toString("base64url")
  );
}

/** Decrypt DB value; plaintext legacy values pass through. */
export function decryptSecret(value: string): string {
  if (!value) return "";
  if (!value.startsWith(PREFIX)) return value;
  const raw = Buffer.from(value.slice(PREFIX.length), "base64url");
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const data = raw.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", keyBytes(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

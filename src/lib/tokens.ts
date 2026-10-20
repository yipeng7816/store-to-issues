import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function newRawToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createEmailToken(
  userId: string,
  type: "verify" | "reset",
  hoursValid = 24,
): Promise<string> {
  const raw = newRawToken();
  const token = hashToken(raw);
  const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);

  // Invalidate previous unused tokens of same type
  await prisma.emailToken.updateMany({
    where: { userId, type, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.emailToken.create({
    data: { userId, type, token, expiresAt },
  });

  return raw;
}

export async function consumeEmailToken(
  raw: string,
  type: "verify" | "reset",
): Promise<{ userId: string } | null> {
  const token = hashToken(raw);
  const row = await prisma.emailToken.findFirst({
    where: { token, type, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!row) return null;
  await prisma.emailToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return { userId: row.userId };
}

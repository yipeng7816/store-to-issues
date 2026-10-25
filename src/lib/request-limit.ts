import { prisma } from "./prisma";

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const raw = forwarded?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
  return raw.trim().slice(0, 64) || "unknown";
}

/**
 * Fixed window. Returns false when the caller is over the limit.
 * If the table is missing or the database errors, allow the request
 * so a not-yet-migrated deploy does not lock the app.
 */
export async function allowRequest(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const now = Date.now();
  try {
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt.getTime() <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(now + windowMs) },
        update: { count: 1, resetAt: new Date(now + windowMs) },
      });
      return true;
    }
    if (row.count >= limit) return false;
    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unavailable";
    console.error("[rate-limit]", message);
    return true;
  }
}

export function tooManyAttempts() {
  return { error: "Too many attempts. Try again later." };
}

import { prisma } from "./prisma";

export const PRODUCT_EVENTS = [
  "register",
  "login",
  "sync_ok",
  "sync_error",
  "checkout_start",
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];

const MAX_PATH = 200;
const MAX_REFERRER = 500;
const MAX_VISITOR_KEY = 64;
const MAX_META = 500;

export function normalizePagePath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.includes("..")) return null;
  const withoutQuery = trimmed.split("?")[0].split("#")[0];
  if (withoutQuery.length > MAX_PATH) return null;
  if (withoutQuery.startsWith("/api") || withoutQuery.startsWith("/admin")) {
    return null;
  }
  return withoutQuery || "/";
}

export function normalizeVisitorKey(key: string): string | null {
  const k = key.trim();
  if (k.length < 8 || k.length > MAX_VISITOR_KEY) return null;
  if (!/^[a-zA-Z0-9_-]+$/.test(k)) return null;
  return k;
}

export function normalizeReferrer(referrer: string): string {
  const r = referrer.trim();
  if (!r) return "";
  try {
    const u = new URL(r);
    return `${u.protocol}//${u.host}`.slice(0, MAX_REFERRER);
  } catch {
    return "";
  }
}

export async function recordPageView(input: {
  path: string;
  visitorKey: string;
  referrer?: string;
}): Promise<void> {
  const path = normalizePagePath(input.path);
  const visitorKey = normalizeVisitorKey(input.visitorKey);
  if (!path || !visitorKey) return;
  try {
    await prisma.analyticsPageView.create({
      data: {
        path,
        visitorKey,
        referrer: normalizeReferrer(input.referrer ?? ""),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("AnalyticsPageView")) return;
    console.error("[analytics] page view", message);
  }
}

export async function logProductEvent(
  name: ProductEventName,
  userId?: string | null,
  meta?: string,
): Promise<void> {
  try {
    await prisma.analyticsProductEvent.create({
      data: {
        name,
        userId: userId ?? null,
        meta: (meta ?? "").slice(0, MAX_META),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("AnalyticsProductEvent")) return;
    console.error("[analytics] event", name, message);
  }
}

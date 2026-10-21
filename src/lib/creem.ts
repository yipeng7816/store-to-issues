import { createHmac, timingSafeEqual } from "crypto";

/** Creem MoR: checkout + portal + webhook verification (no SDK). */

export function creemConfigured(): boolean {
  return Boolean(process.env.CREEM_API_KEY && process.env.CREEM_PRODUCT_ID);
}

export function creemWebhookConfigured(): boolean {
  return Boolean(process.env.CREEM_API_KEY && process.env.CREEM_WEBHOOK_SECRET);
}

/** Prefer key prefix (Creem keys are not interchangeable across environments). */
export function creemApiBase(): string {
  const key = process.env.CREEM_API_KEY || "";
  if (key.startsWith("creem_test_")) return "https://test-api.creem.io";
  if (key.startsWith("creem_")) return "https://api.creem.io";
  // Fallback when key missing / unknown shape
  const test =
    process.env.CREEM_TEST_MODE === "true" ||
    process.env.CREEM_TEST_MODE === "1";
  return test ? "https://test-api.creem.io" : "https://api.creem.io";
}

export function creemKeyLooksLikeTest(): boolean {
  return (process.env.CREEM_API_KEY || "").startsWith("creem_test_");
}

type CreemCheckout = {
  id?: string;
  checkout_url?: string;
  status?: string;
  message?: string;
};

type CreemPortal = {
  customer_portal_link?: string;
  message?: string;
};

async function creemFetch<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const key = process.env.CREEM_API_KEY;
  if (!key) throw new Error("CREEM_API_KEY missing");

  const res = await fetch(`${creemApiBase()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as T & {
    message?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(
      data.message || data.error || `Creem API ${res.status}`,
    );
  }
  return data;
}

export async function createCreemCheckout(opts: {
  productId: string;
  successUrl: string;
  customerEmail: string;
  userId: string;
}): Promise<{ url: string; id?: string }> {
  const data = await creemFetch<CreemCheckout>("/v1/checkouts", {
    product_id: opts.productId,
    success_url: opts.successUrl,
    request_id: opts.userId,
    customer: { email: opts.customerEmail },
    metadata: { userId: opts.userId },
  });

  if (!data.checkout_url) {
    throw new Error("Creem checkout missing checkout_url");
  }
  return { url: data.checkout_url, id: data.id };
}

export async function createCreemPortalLink(
  customerId: string,
): Promise<string> {
  // Official endpoint: POST /v1/customers/billing
  const data = await creemFetch<CreemPortal>("/v1/customers/billing", {
    customer_id: customerId,
  });
  if (!data.customer_portal_link) {
    throw new Error("Creem portal missing customer_portal_link");
  }
  return data.customer_portal_link;
}

export function verifyCreemSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function pickId(
  value: unknown,
): string | undefined {
  if (typeof value === "string" && value) return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string" && id) return id;
  }
  return undefined;
}

export type CreemWebhookEvent = {
  id?: string;
  eventType?: string;
  object?: Record<string, unknown>;
};

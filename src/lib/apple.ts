import { SignJWT, importPKCS8 } from "jose";
import type { StoreReview } from "./types";
import { mockAllReviews } from "./mocks";
import { fetchWithRetry, sleep } from "./rate-limit";

async function appleToken(): Promise<string> {
  const issuerId = process.env.ASC_ISSUER_ID;
  const keyId = process.env.ASC_KEY_ID;
  let privateKey = process.env.ASC_PRIVATE_KEY || "";
  if (!issuerId || !keyId || !privateKey) {
    throw new Error("Missing ASC_ISSUER_ID / ASC_KEY_ID / ASC_PRIVATE_KEY");
  }
  privateKey = privateKey.replace(/\\n/g, "\n");
  const key = await importPKCS8(privateKey, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId, typ: "JWT" })
    .setIssuer(issuerId)
    .setAudience("appstoreconnect-v1")
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(key);
}

type AscReviewItem = {
  id: string;
  attributes?: {
    rating?: number;
    title?: string;
    body?: string;
    reviewerNickname?: string;
    createdDate?: string;
    territory?: string;
  };
};

function mapAsc(item: AscReviewItem): StoreReview {
  return {
    store: "app_store",
    externalId: item.id,
    rating: item.attributes?.rating ?? 0,
    title: item.attributes?.title,
    body: item.attributes?.body || "",
    author: item.attributes?.reviewerNickname,
    territory: item.attributes?.territory,
    reviewedAt: item.attributes?.createdDate
      ? new Date(item.attributes.createdDate)
      : undefined,
  };
}

function maxPages(): number {
  const n = Number(process.env.REVIEW_MAX_PAGES || "10");
  return Number.isFinite(n) && n > 0 ? Math.min(50, Math.floor(n)) : 10;
}

export async function fetchAppStoreReviews(): Promise<StoreReview[]> {
  if (process.env.USE_MOCK_REVIEWS === "true") {
    return mockAllReviews().filter((r) => r.store === "app_store");
  }

  const appId = process.env.ASC_APP_ID;
  if (!appId) {
    throw new Error("Missing ASC_APP_ID");
  }

  const token = await appleToken();
  const out: StoreReview[] = [];
  const seen = new Set<string>();

  let nextUrl: string | null = (() => {
    const url = new URL(
      `https://api.appstoreconnect.apple.com/v1/apps/${appId}/customerReviews`,
    );
    url.searchParams.set("sort", "-createdDate");
    url.searchParams.set("limit", "50");
    return url.toString();
  })();

  for (let page = 0; page < maxPages() && nextUrl; page++) {
    const res = await fetchWithRetry(nextUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`App Store Connect error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as {
      data?: AscReviewItem[];
      links?: { next?: string | null };
    };

    for (const item of json.data || []) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(mapAsc(item));
    }

    nextUrl = json.links?.next || null;
    if (nextUrl) await sleep(200);
  }

  return out;
}

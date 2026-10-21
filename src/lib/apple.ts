import { SignJWT, importPKCS8 } from "jose";
import type { StoreReview } from "./types";
import { mockAllReviews } from "./mocks";
import { fetchWithRetry } from "./rate-limit";

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

export async function fetchAppStoreReviews(): Promise<StoreReview[]> {
  if (process.env.USE_MOCK_REVIEWS === "true") {
    return mockAllReviews().filter((r) => r.store === "app_store");
  }

  const appId = process.env.ASC_APP_ID;
  if (!appId) {
    throw new Error("Missing ASC_APP_ID");
  }

  const token = await appleToken();
  const url = new URL(
    `https://api.appstoreconnect.apple.com/v1/apps/${appId}/customerReviews`,
  );
  url.searchParams.set("sort", "-createdDate");
  url.searchParams.set("limit", "50");

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`App Store Connect error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    data?: Array<{
      id: string;
      attributes?: {
        rating?: number;
        title?: string;
        body?: string;
        reviewerNickname?: string;
        createdDate?: string;
        territory?: string;
      };
    }>;
  };

  return (json.data || []).map((item) => ({
    store: "app_store" as const,
    externalId: item.id,
    rating: item.attributes?.rating ?? 0,
    title: item.attributes?.title,
    body: item.attributes?.body || "",
    author: item.attributes?.reviewerNickname,
    territory: item.attributes?.territory,
    reviewedAt: item.attributes?.createdDate
      ? new Date(item.attributes.createdDate)
      : undefined,
  }));
}

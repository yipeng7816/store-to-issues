import { GoogleAuth } from "google-auth-library";
import type { StoreReview } from "./types";
import { mockAllReviews } from "./mocks";
import { fetchWithRetry } from "./rate-limit";

type PlayReview = {
  reviewId?: string;
  authorName?: string;
  comments?: Array<{
    userComment?: {
      text?: string;
      starRating?: number;
      lastModified?: { seconds?: string | number };
      appVersionName?: string;
      reviewerLanguage?: string;
    };
  }>;
};

function serviceAccountCredentials(): Record<string, unknown> | null {
  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
}

export async function fetchGooglePlayReviews(): Promise<StoreReview[]> {
  if (process.env.USE_MOCK_REVIEWS === "true") {
    return mockAllReviews().filter((r) => r.store === "google_play");
  }

  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME;
  if (!packageName) {
    throw new Error("Missing GOOGLE_PLAY_PACKAGE_NAME");
  }

  const credentials = serviceAccountCredentials();
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentials && !keyFile) {
    throw new Error(
      "Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS",
    );
  }

  const auth = new GoogleAuth({
    credentials: credentials ?? undefined,
    keyFile: credentials ? undefined : keyFile,
    scopes: ["https://www.googleapis.com/auth/androidpublisher"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error("Failed to obtain Google Play access token");
  }

  const url = new URL(
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/reviews`,
  );
  url.searchParams.set("maxResults", "50");

  const res = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token.token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Play error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { reviews?: PlayReview[] };
  const out: StoreReview[] = [];

  for (const review of json.reviews || []) {
    const comment = review.comments?.[0]?.userComment;
    if (!review.reviewId || !comment) continue;
    const seconds = comment.lastModified?.seconds;
    out.push({
      store: "google_play",
      externalId: review.reviewId,
      rating: comment.starRating ?? 0,
      body: comment.text || "",
      author: review.authorName,
      version: comment.appVersionName,
      territory: comment.reviewerLanguage,
      reviewedAt: seconds ? new Date(Number(seconds) * 1000) : undefined,
    });
  }

  return out;
}

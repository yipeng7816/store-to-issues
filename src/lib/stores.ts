import "./env";
import { fetchAppStoreReviews } from "./apple";
import { fetchGooglePlayReviews } from "./google-play";
import type { StoreReview } from "./types";

export type StoreFetchResult = {
  reviews: StoreReview[];
  sources: { app_store: number; google_play: number };
  warnings: string[];
};

/**
 * Fetch both stores. In live mode, one store failing becomes a warning
 * so the other store can still sync.
 */
export async function fetchAllStoreReviews(): Promise<StoreFetchResult> {
  const warnings: string[] = [];
  let apple: StoreReview[] = [];
  let play: StoreReview[] = [];

  if (process.env.USE_MOCK_REVIEWS === "true") {
    const [a, g] = await Promise.all([
      fetchAppStoreReviews(),
      fetchGooglePlayReviews(),
    ]);
    return {
      reviews: [...a, ...g],
      sources: { app_store: a.length, google_play: g.length },
      warnings,
    };
  }

  try {
    apple = await fetchAppStoreReviews();
  } catch (err) {
    warnings.push(err instanceof Error ? err.message : String(err));
  }

  try {
    play = await fetchGooglePlayReviews();
  } catch (err) {
    warnings.push(err instanceof Error ? err.message : String(err));
  }

  if (apple.length === 0 && play.length === 0) {
    throw new Error(
      warnings.join(" | ") || "No reviews fetched from either store",
    );
  }

  return {
    reviews: [...apple, ...play],
    sources: { app_store: apple.length, google_play: play.length },
    warnings,
  };
}

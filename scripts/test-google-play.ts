/**
 * One-shot live Google Play reviews fetch (uses .env or env vars).
 *
 *   npx tsx scripts/test-google-play.ts
 *
 * Requires: GOOGLE_PLAY_PACKAGE_NAME + GOOGLE_PLAY_SERVICE_ACCOUNT_JSON
 * (or GOOGLE_APPLICATION_CREDENTIALS). Set USE_MOCK_REVIEWS=false or pass --live.
 */
import "../src/lib/env";
import { fetchGooglePlayReviews } from "../src/lib/google-play";

const live = process.argv.includes("--live") || process.env.USE_MOCK_REVIEWS === "false";
if (live) {
  process.env.USE_MOCK_REVIEWS = "false";
}

async function main() {
  const pkg = process.env.GOOGLE_PLAY_PACKAGE_NAME || "";
  const hasSa = Boolean(
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
  );
  console.log(
    `mode=${process.env.USE_MOCK_REVIEWS === "true" ? "mock" : "live"} package=${pkg || "(missing)"} credentials=${hasSa ? "yes" : "no"}`,
  );

  const reviews = await fetchGooglePlayReviews();
  const low = reviews.filter((r) => r.rating <= 3);
  console.log(`fetched=${reviews.length} at-or-below-3=${low.length}`);

  const sample = reviews.slice(0, 3).map((r) => ({
    id: r.externalId,
    rating: r.rating,
    body: (r.body || "").slice(0, 80),
    at: r.reviewedAt?.toISOString(),
  }));
  if (sample.length) console.log("sample:", JSON.stringify(sample, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

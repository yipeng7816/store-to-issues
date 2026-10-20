import type { StoreReview } from "./types";

/** Dual-store sample data for local Phase 1/2 demos. */
export function mockAllReviews(): StoreReview[] {
  const now = Date.now();
  return [
    {
      store: "app_store",
      externalId: "ios-1",
      rating: 1,
      title: "Crash on login",
      body: "After the latest update the app crashes every time I tap login.",
      author: "Alex",
      version: "2.4.1",
      territory: "US",
      reviewedAt: new Date(now - 3600_000),
    },
    {
      store: "google_play",
      externalId: "gp-1",
      rating: 2,
      title: "Login crash",
      body: "Keeps crashing when I try to log in after update.",
      author: "Sam",
      version: "2.4.1",
      territory: "GB",
      reviewedAt: new Date(now - 7200_000),
    },
    {
      store: "app_store",
      externalId: "ios-2",
      rating: 5,
      title: "Love it",
      body: "Great app, thank you!",
      author: "Jordan",
      version: "2.4.0",
      territory: "US",
      reviewedAt: new Date(now - 86400_000),
    },
    {
      store: "google_play",
      externalId: "gp-2",
      rating: 1,
      title: "Payment failed",
      body: "Checkout button does nothing, cannot pay for subscription.",
      author: "Chris",
      version: "2.4.1",
      territory: "DE",
      reviewedAt: new Date(now - 5400_000),
    },
    {
      store: "google_play",
      externalId: "gp-3",
      rating: 1,
      title: "Can't pay",
      body: "Payment button fails, subscription checkout broken.",
      author: "Lee",
      version: "2.4.1",
      territory: "US",
      reviewedAt: new Date(now - 4000_000),
    },
  ];
}

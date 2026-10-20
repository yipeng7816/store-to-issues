export type StoreReview = {
  store: "app_store" | "google_play" | "mock";
  externalId: string;
  rating: number;
  title?: string;
  body: string;
  author?: string;
  version?: string;
  territory?: string;
  reviewedAt?: Date;
};

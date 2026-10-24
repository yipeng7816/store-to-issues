import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchAppStoreReviews = vi.fn();
const fetchGooglePlayReviews = vi.fn();

vi.mock("./env", () => ({}));

vi.mock("./apple", () => ({
  fetchAppStoreReviews: (...args: unknown[]) => fetchAppStoreReviews(...args),
}));

vi.mock("./google-play", () => ({
  fetchGooglePlayReviews: (...args: unknown[]) =>
    fetchGooglePlayReviews(...args),
}));

describe("fetchAllStoreReviews", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.USE_MOCK_REVIEWS = "false";
  });

  afterEach(() => {
    delete process.env.USE_MOCK_REVIEWS;
  });

  it("keeps going when one store fails (warning, not hard fail)", async () => {
    fetchAppStoreReviews.mockRejectedValue(new Error("ASC 401"));
    fetchGooglePlayReviews.mockResolvedValue([
      {
        store: "google_play",
        externalId: "1",
        rating: 1,
        body: "crash",
      },
    ]);

    const { fetchAllStoreReviews } = await import("./stores");
    process.env.USE_MOCK_REVIEWS = "false";
    const result = await fetchAllStoreReviews();
    expect(result.reviews).toHaveLength(1);
    expect(result.sources.google_play).toBe(1);
    expect(result.sources.app_store).toBe(0);
    expect(result.warnings).toEqual(["ASC 401"]);
  });

  it("throws when both stores fail (clear alert)", async () => {
    fetchAppStoreReviews.mockRejectedValue(new Error("ASC down"));
    fetchGooglePlayReviews.mockRejectedValue(new Error("Play down"));

    const { fetchAllStoreReviews } = await import("./stores");
    process.env.USE_MOCK_REVIEWS = "false";
    await expect(fetchAllStoreReviews()).rejects.toThrow(/ASC down|Play down/);
  });
});

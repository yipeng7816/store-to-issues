import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clusterKey } from "./cluster";
import type { SyncCredentials } from "./credentials";
import type { StoreReview } from "./types";

type ReviewRow = {
  id: string;
  userId: string;
  store: string;
  externalId: string;
  rating: number;
  title: string | null;
  body: string;
  author: string | null;
  version: string | null;
  territory: string | null;
  reviewedAt: Date | null;
  clusterKey: string | null;
  githubIssue: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type RunRow = {
  id: string;
  userId: string;
  status: string;
  startedAt: Date;
  finishedAt?: Date;
  message?: string;
  fetched?: number;
  createdIssues?: number;
  mergedInto?: number;
};

const reviews: ReviewRow[] = [];
const runs: RunRow[] = [];
const events: string[] = [];
let seq = 0;

const createOrCommentIssue = vi.fn();
const fetchIssueStates = vi.fn();
const findIssueByExternalId = vi.fn();
const fetchAllStoreReviews = vi.fn();

vi.mock("./prisma", () => ({
  prisma: {
    userSettings: {
      findUnique: async () => null,
    },
    syncRun: {
      create: async ({ data }: { data: { userId: string; status: string } }) => {
        const run: RunRow = {
          id: `run-${++seq}`,
          userId: data.userId,
          status: data.status,
          startedAt: new Date(),
        };
        runs.push(run);
        return run;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: string };
        data: Partial<RunRow>;
      }) => {
        const run = runs.find((item) => item.id === where.id);
        if (run) Object.assign(run, data);
        return run;
      },
      findUnique: async ({ where }: { where: { id: string } }) =>
        runs.find((item) => item.id === where.id) ?? null,
    },
    review: {
      findMany: async () => reviews.filter((item) => item.githubIssue),
      findUnique: async ({
        where,
      }: {
        where: {
          userId_store_externalId: { userId: string; store: string; externalId: string };
        };
      }) => {
        const key = where.userId_store_externalId;
        return (
          reviews.find(
            (item) =>
              item.userId === key.userId &&
              item.store === key.store &&
              item.externalId === key.externalId,
          ) ?? null
        );
      },
      create: async ({ data }: { data: Omit<ReviewRow, "id" | "createdAt" | "updatedAt"> }) => {
        if (typeof data.githubIssue === "string" && data.githubIssue.startsWith("pending")) {
          events.push("insert");
        }
        const row: ReviewRow = {
          ...data,
          id: `rev-${++seq}`,
          title: data.title ?? null,
          author: data.author ?? null,
          version: data.version ?? null,
          territory: data.territory ?? null,
          reviewedAt: data.reviewedAt ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        reviews.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<ReviewRow> }) => {
        const row = reviews.find((item) => item.id === where.id);
        if (!row) throw new Error("missing review");
        Object.assign(row, data, { updatedAt: new Date() });
        return row;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; githubIssue: string | null };
        data: Partial<ReviewRow>;
      }) => {
        const row = reviews.find(
          (item) => item.id === where.id && item.githubIssue === where.githubIssue,
        );
        if (!row) return { count: 0 };
        Object.assign(row, data, { updatedAt: new Date() });
        return { count: 1 };
      },
    },
  },
}));

vi.mock("./github", async () => {
  const actual = await vi.importActual<typeof import("./github")>("./github");
  return {
    ...actual,
    createOrCommentIssue: (...args: unknown[]) => createOrCommentIssue(...args),
    fetchIssueStates: (...args: unknown[]) => fetchIssueStates(...args),
    findIssueByExternalId: (...args: unknown[]) => findIssueByExternalId(...args),
  };
});

vi.mock("./stores", () => ({
  fetchAllStoreReviews: (...args: unknown[]) => fetchAllStoreReviews(...args),
}));

const ENV_KEYS = [
  "GITHUB_TOKEN",
  "GITHUB_REPO",
  "USE_MOCK_REVIEWS",
  "MIN_RATING",
  "ASC_ISSUER_ID",
  "ASC_KEY_ID",
  "ASC_PRIVATE_KEY",
  "ASC_APP_ID",
  "GOOGLE_PLAY_PACKAGE_NAME",
  "GOOGLE_PLAY_SERVICE_ACCOUNT_JSON",
] as const;

const savedEnv = new Map<string, string | undefined>();

function creds(overrides: Partial<SyncCredentials> = {}): SyncCredentials {
  return {
    githubToken: "tok",
    githubRepo: "acme/app",
    useMockReviews: false,
    minRating: 3,
    ascIssuerId: "",
    ascKeyId: "",
    ascPrivateKey: "",
    ascAppId: "",
    googlePlayPackageName: "",
    googlePlayServiceAccountJson: "",
    ...overrides,
  };
}

function review(partial: Partial<StoreReview> & Pick<StoreReview, "externalId">): StoreReview {
  return {
    store: "app_store",
    rating: 1,
    title: "Crash on login",
    body: "After the latest update the app crashes every time I tap login.",
    author: "Alex",
    version: "2.4.1",
    territory: "US",
    reviewedAt: new Date("2026-10-01T00:00:00Z"),
    ...partial,
  };
}

function seed(partial: Partial<ReviewRow> & Pick<ReviewRow, "externalId" | "githubIssue" | "clusterKey">) {
  reviews.push({
    id: partial.id ?? `seed-${++seq}`,
    userId: partial.userId ?? "u1",
    store: partial.store ?? "app_store",
    externalId: partial.externalId,
    rating: partial.rating ?? 1,
    title: partial.title ?? "Crash on login",
    body: partial.body ?? "After the latest update the app crashes every time I tap login.",
    author: null,
    version: null,
    territory: null,
    reviewedAt: null,
    clusterKey: partial.clusterKey,
    githubIssue: partial.githubIssue,
    createdAt: partial.createdAt ?? new Date("2026-01-01T00:00:00Z"),
    updatedAt: partial.updatedAt ?? new Date("2026-01-01T00:00:00Z"),
  });
}

function issueState(number: number, state: "open" | "closed", ours = true) {
  return {
    number,
    state,
    title: "t",
    url: `https://github.com/acme/app/issues/${number}`,
    ours,
  };
}

describe("runSync merge", () => {
  beforeEach(() => {
    reviews.length = 0;
    runs.length = 0;
    events.length = 0;
    seq = 0;
    vi.clearAllMocks();
    for (const key of ENV_KEYS) savedEnv.set(key, process.env[key]);
    fetchIssueStates.mockResolvedValue({});
    findIssueByExternalId.mockResolvedValue(null);
    createOrCommentIssue.mockImplementation(async (params: { existingIssueNumber?: number | null }) => {
      events.push("github");
      if (params.existingIssueNumber) {
        return { number: params.existingIssueNumber, url: "https://example.test", dryRun: false };
      }
      const number = 20 + createOrCommentIssue.mock.calls.length;
      return { number, url: `https://example.test/${number}`, dryRun: false };
    });
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = savedEnv.get(key);
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("claims the review row before calling GitHub", async () => {
    fetchAllStoreReviews.mockResolvedValue({
      reviews: [review({ externalId: "new-1" })],
      sources: { app_store: 1, google_play: 0 },
      warnings: [],
    });
    const { runSync } = await import("./sync");
    await runSync("u1", creds());
    expect(events[0]).toBe("insert");
    expect(events[1]).toBe("github");
  });

  it("does not let a dry-run anchor create one live issue per review", async () => {
    const sample = review({ externalId: "sample" });
    const key = clusterKey(sample.title, sample.body);
    seed({ externalId: "old-mock", githubIssue: `dry-run:${key}`, clusterKey: key });
    fetchAllStoreReviews.mockResolvedValue({
      reviews: [review({ externalId: "new-1" }), review({ externalId: "new-2", store: "google_play" })],
      sources: { app_store: 1, google_play: 1 },
      warnings: [],
    });

    const { runSync } = await import("./sync");
    const result = await runSync("u1", creds());

    expect(result).toMatchObject({ ok: true, createdIssues: 1, mergedInto: 1 });
    const first = createOrCommentIssue.mock.calls[0][0] as { existingIssueNumber?: number | null };
    const second = createOrCommentIssue.mock.calls[1][0] as { existingIssueNumber?: number | null };
    const created = await createOrCommentIssue.mock.results[0].value;
    expect(first.existingIssueNumber ?? null).toBeNull();
    expect(second.existingIssueNumber).toBe(created.number);
    const filed = reviews.filter((item) => item.externalId === "new-1" || item.externalId === "new-2");
    expect(filed.map((item) => item.githubIssue)).toEqual([
      expect.stringMatching(/^acme\/app#\d+$/),
      expect.stringMatching(/^acme\/app#\d+$/),
    ]);
    expect(new Set(filed.map((item) => item.githubIssue)).size).toBe(1);
  });

  it("opens a new issue when the matching issue is closed, then merges into that new issue", async () => {
    const sample = review({ externalId: "sample" });
    const key = clusterKey(sample.title, sample.body);
    seed({ externalId: "old-1", githubIssue: "acme/app#3", clusterKey: key });
    fetchIssueStates.mockResolvedValue({ 3: issueState(3, "closed") });
    fetchAllStoreReviews.mockResolvedValue({
      reviews: [review({ externalId: "new-1" }), review({ externalId: "new-2" })],
      sources: { app_store: 2, google_play: 0 },
      warnings: [],
    });

    const { runSync } = await import("./sync");
    const result = await runSync("u1", creds());

    expect(result).toMatchObject({ ok: true, createdIssues: 1, mergedInto: 1 });
    const first = createOrCommentIssue.mock.calls[0][0] as { existingIssueNumber?: number | null };
    const second = createOrCommentIssue.mock.calls[1][0] as { existingIssueNumber?: number | null };
    expect(first.existingIssueNumber ?? null).toBeNull();
    expect(second.existingIssueNumber).not.toBe(3);
    expect(second.existingIssueNumber).toBeGreaterThan(0);
  });

  it("does not file a one-word crash onto a login-crash issue", async () => {
    const specific = review({ externalId: "sample" });
    seed({
      externalId: "old-1",
      githubIssue: "acme/app#3",
      clusterKey: clusterKey(specific.title, specific.body),
    });
    fetchIssueStates.mockResolvedValue({ 3: issueState(3, "open") });
    fetchAllStoreReviews.mockResolvedValue({
      reviews: [review({ externalId: "bare", title: "Crash", body: "It crashed" })],
      sources: { app_store: 1, google_play: 0 },
      warnings: [],
    });

    const { runSync } = await import("./sync");
    const result = await runSync("u1", creds());
    const call = createOrCommentIssue.mock.calls[0][0] as { existingIssueNumber?: number | null };
    expect(call.existingIssueNumber ?? null).toBeNull();
    expect(result).toMatchObject({ ok: true, createdIssues: 1, mergedInto: 0 });
  });

  it("links a crashed sync to the issue already on GitHub instead of opening another", async () => {
    const sample = review({ externalId: "new-1" });
    runs.push({
      id: "run-dead",
      userId: "u1",
      status: "error",
      startedAt: new Date(Date.now() - 60_000),
    });
    seed({
      externalId: "new-1",
      githubIssue: "pending:run-dead",
      clusterKey: clusterKey(sample.title, sample.body),
      title: sample.title,
      body: sample.body,
    });
    findIssueByExternalId.mockResolvedValue(7);
    fetchAllStoreReviews.mockResolvedValue({
      reviews: [sample],
      sources: { app_store: 1, google_play: 0 },
      warnings: [],
    });

    const { runSync } = await import("./sync");
    const result = await runSync("u1", creds());

    expect(createOrCommentIssue).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, createdIssues: 1, mergedInto: 0 });
    expect(reviews.find((item) => item.externalId === "new-1")?.githubIssue).toBe("acme/app#7");
  });

  it("still merges mock reviews onto one dry-run anchor", async () => {
    createOrCommentIssue.mockImplementation(async () => {
      events.push("github");
      return { number: 0, url: "dry", dryRun: true };
    });
    fetchAllStoreReviews.mockResolvedValue({
      reviews: [review({ externalId: "new-1" }), review({ externalId: "new-2" })],
      sources: { app_store: 2, google_play: 0 },
      warnings: [],
    });

    const { runSync } = await import("./sync");
    const result = await runSync("u1", creds({ githubToken: "", githubRepo: "" }));

    expect(result).toMatchObject({ ok: true, createdIssues: 1, mergedInto: 1 });
    const filed = reviews.filter((item) => item.externalId === "new-1" || item.externalId === "new-2");
    expect(filed[0]?.githubIssue).toMatch(/^dry-run:/);
    expect(filed[1]?.githubIssue).toBe(filed[0]?.githubIssue);
  });

  it("stores a five-star review without opening an issue", async () => {
    fetchAllStoreReviews.mockResolvedValue({
      reviews: [review({ externalId: "love", rating: 5, title: "Love it", body: "Great app, thank you!" })],
      sources: { app_store: 1, google_play: 0 },
      warnings: [],
    });
    const { runSync } = await import("./sync");
    const result = await runSync("u1", creds());
    expect(createOrCommentIssue).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: true, createdIssues: 0, mergedInto: 0 });
    expect(reviews[0]?.githubIssue).toBeNull();
  });
});

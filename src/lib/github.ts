import "./env";
import { Octokit } from "octokit";
import { mapPool, sleep, withRetry } from "./rate-limit";

export type IssueResult = {
  number: number;
  url: string;
  dryRun?: boolean;
};

export async function createOrCommentIssue(params: {
  title: string;
  body: string;
  existingIssueNumber?: number | null;
  githubToken?: string;
  githubRepo?: string;
}): Promise<IssueResult> {
  const token = params.githubToken || process.env.GITHUB_TOKEN || "";
  const repo = params.githubRepo || process.env.GITHUB_REPO || "";
  if (!token || !repo || !repo.includes("/")) {
    return {
      number: 0,
      url: "(dry-run: set GitHub token and repo in Settings)",
      dryRun: true,
    };
  }

  const [owner, name] = repo.split("/");
  const octokit = new Octokit({ auth: token });

  if (params.existingIssueNumber) {
    await withRetry(() =>
      octokit.rest.issues.createComment({
        owner,
        repo: name,
        issue_number: params.existingIssueNumber!,
        body: params.body,
      }),
    );
    // Space writes slightly to reduce secondary rate limits
    await sleep(150);
    return {
      number: params.existingIssueNumber,
      url: `https://github.com/${owner}/${name}/issues/${params.existingIssueNumber}`,
    };
  }

  const issue = await withRetry(() =>
    octokit.rest.issues.create({
      owner,
      repo: name,
      title: params.title,
      body: params.body,
      labels: ["store-review"],
    }),
  );
  await sleep(150);

  return { number: issue.data.number, url: issue.data.html_url };
}

export function storeLine(store: string): string {
  return `**Store:** ${store}`;
}

export function externalIdLine(externalId: string): string {
  return `**External id:** \`${externalId}\``;
}

export function textHasReviewMarker(
  text: string,
  store: string,
  externalId: string,
): boolean {
  return text.includes(storeLine(store)) && text.includes(externalIdLine(externalId));
}

export type IssueStateInfo = {
  number: number;
  state: "open" | "closed";
  title: string;
  url: string;
  /** Body or label shows this issue was opened by StoreToIssues. */
  ours: boolean;
};

/** Resolve open/closed for issue numbers (best-effort; skips dry-run / missing auth). */
export async function fetchIssueStates(params: {
  numbers: number[];
  githubToken?: string;
  githubRepo?: string;
}): Promise<Record<number, IssueStateInfo>> {
  const token = params.githubToken || process.env.GITHUB_TOKEN || "";
  const repo = params.githubRepo || process.env.GITHUB_REPO || "";
  const unique = [...new Set(params.numbers.filter((n) => n > 0))];
  const out: Record<number, IssueStateInfo> = {};

  if (!token || !repo.includes("/") || unique.length === 0) {
    return out;
  }

  const [owner, name] = repo.split("/");
  const octokit = new Octokit({ auth: token });

  // Cap concurrency — unbounded Promise.all was easy to trip secondary limits
  await mapPool(unique, 4, async (num) => {
    try {
      const { data } = await withRetry(() =>
        octokit.rest.issues.get({
          owner,
          repo: name,
          issue_number: num,
        }),
      );
      const labels = Array.isArray(data.labels) ? data.labels : [];
      const names = labels.map((label) =>
        typeof label === "string" ? label : label?.name || "",
      );
      const body = data.body || "";
      out[num] = {
        number: num,
        state: data.state === "closed" ? "closed" : "open",
        title: data.title,
        url: data.html_url,
        ours: names.includes("store-review") || body.includes("**External id:**"),
      };
    } catch {
      // ignore missing / unauthorized issues
    }
  });

  return out;
}

function quoteSearch(value: string): string {
  return value.replace(/["\\]/g, "").slice(0, 120);
}

/**
 * Find an issue this app already filed for a store review.
 * Used when a sync wrote to GitHub and died before saving the issue number.
 */
export async function findIssueByExternalId(params: {
  store: string;
  externalId: string;
  githubToken?: string;
  githubRepo?: string;
  since?: Date;
}): Promise<number | null> {
  const token = params.githubToken || process.env.GITHUB_TOKEN || "";
  const repo = params.githubRepo || process.env.GITHUB_REPO || "";
  if (!token || !repo.includes("/") || !params.externalId) return null;

  const [owner, name] = repo.split("/");
  const octokit = new Octokit({ auth: token });
  const marker = (text: string) =>
    textHasReviewMarker(text, params.store, params.externalId);

  try {
    const listed = await withRetry(() =>
      octokit.rest.issues.listForRepo({
        owner,
        repo: name,
        state: "all",
        since: params.since?.toISOString(),
        labels: "store-review",
        per_page: 50,
      }),
    );
    for (const issue of listed.data) {
      if (issue.pull_request) continue;
      if (marker(issue.body || "")) return issue.number;
    }
  } catch {
    // Fall through to search. Listing can fail without making a duplicate inevitable.
  }

  const safeId = quoteSearch(params.externalId);
  if (!safeId) return null;

  try {
    const searched = await withRetry(() =>
      octokit.rest.search.issuesAndPullRequests({
        q: `repo:${owner}/${name} is:issue in:body "${safeId}"`,
        per_page: 10,
      }),
    );
    for (const item of searched.data.items) {
      if (marker(item.body || "")) return item.number;
    }
  } catch {
    // Comment search below is the other place a merge marker can live.
  }

  try {
    const searched = await withRetry(() =>
      octokit.rest.search.issuesAndPullRequests({
        q: `repo:${owner}/${name} is:issue in:comments "${safeId}"`,
        per_page: 5,
      }),
    );
    for (const item of searched.data.items) {
      const comments = await withRetry(() =>
        octokit.rest.issues.listComments({
          owner,
          repo: name,
          issue_number: item.number,
          per_page: 100,
        }),
      );
      if (comments.data.some((comment) => marker(comment.body || ""))) {
        return item.number;
      }
    }
  } catch {
    return null;
  }

  return null;
}

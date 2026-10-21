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

export type IssueStateInfo = {
  number: number;
  state: "open" | "closed";
  title: string;
  url: string;
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
      out[num] = {
        number: num,
        state: data.state === "closed" ? "closed" : "open",
        title: data.title,
        url: data.html_url,
      };
    } catch {
      // ignore missing / unauthorized issues
    }
  });

  return out;
}

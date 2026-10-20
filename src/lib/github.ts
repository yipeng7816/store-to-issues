import "./env";
import { Octokit } from "octokit";

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
    await octokit.rest.issues.createComment({
      owner,
      repo: name,
      issue_number: params.existingIssueNumber,
      body: params.body,
    });
    return {
      number: params.existingIssueNumber,
      url: `https://github.com/${owner}/${name}/issues/${params.existingIssueNumber}`,
    };
  }

  const issue = await octokit.rest.issues.create({
    owner,
    repo: name,
    title: params.title,
    body: params.body,
    labels: ["store-review"],
  });

  return { number: issue.data.number, url: issue.data.html_url };
}

export type IssueRef =
  | { kind: "empty" }
  | { kind: "dry-run" }
  | { kind: "pending"; runId: string }
  | { kind: "issue"; number: number; repo: string | null };

const QUALIFIED = /^(.+)#(\d+)$/;

/** Parse the `Review.githubIssue` string. Legacy rows store a bare number. */
export function parseIssueRef(raw: string | null | undefined): IssueRef {
  if (!raw) return { kind: "empty" };
  if (raw.startsWith("dry-run:")) return { kind: "dry-run" };
  if (raw === "pending" || raw.startsWith("pending:")) {
    return {
      kind: "pending",
      runId: raw.startsWith("pending:") ? raw.slice("pending:".length) : "",
    };
  }
  const qualified = QUALIFIED.exec(raw);
  if (qualified) {
    const number = Number(qualified[2]);
    if (number > 0) return { kind: "issue", number, repo: qualified[1] };
  }
  const number = Number(raw);
  if (Number.isFinite(number) && number > 0) {
    return { kind: "issue", number, repo: null };
  }
  return { kind: "empty" };
}

export function issueNumber(raw: string | null | undefined): number | null {
  const ref = parseIssueRef(raw);
  return ref.kind === "issue" ? ref.number : null;
}

export function formatIssueRef(repo: string, number: number): string {
  return `${repo}#${number}`;
}

export function sameRepo(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

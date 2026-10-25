import { overlapScore, shouldMergeKeys } from "./cluster";
import { parseIssueRef, sameRepo } from "./issue-ref";

export type SiblingCandidate = {
  clusterKey: string;
  githubIssue: string;
  accept: boolean;
};

/** Highest overlap among candidates that already passed the merge rule. Newer rows should come first so ties stick to the latest open issue. */
export function pickSibling(
  key: string,
  candidates: SiblingCandidate[],
): SiblingCandidate | null {
  let best: SiblingCandidate | null = null;
  let bestScore = 0;
  for (const candidate of candidates) {
    if (!candidate.accept || !candidate.clusterKey) continue;
    if (!shouldMergeKeys(key, candidate.clusterKey)) continue;
    const score = overlapScore(key, candidate.clusterKey);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Can a new review be commented onto this stored target?
 * Live sync ignores dry-run anchors, other repos, and closed issues.
 */
export function acceptsNewReview(params: {
  githubIssue: string;
  mode: "live" | "dry-run";
  currentRepo: string;
  state?: "open" | "closed";
  ours?: boolean;
  stateKnown: boolean;
}): boolean {
  const ref = parseIssueRef(params.githubIssue);
  if (params.mode === "dry-run") return ref.kind === "dry-run";
  if (ref.kind !== "issue") return false;
  if (ref.repo && !sameRepo(ref.repo, params.currentRepo)) return false;
  if (params.state === "closed") return false;
  if (params.state === "open") {
    if (ref.repo) return true;
    return params.ours === true;
  }
  // State fetch missed. A ref we wrote ourselves can still be used.
  // A legacy bare number cannot — it may belong to another repo.
  return !params.stateKnown && Boolean(ref.repo);
}

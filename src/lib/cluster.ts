/** Normalize review text into a coarse cluster key for duplicate merging. */
export function clusterKey(title: string | undefined, body: string): string {
  const text = `${title || ""} ${body}`
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stop = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "to",
    "of",
    "in",
    "on",
    "for",
    "is",
    "it",
    "this",
    "that",
    "app",
    "very",
    "with",
    "my",
    "me",
    "i",
    "when",
    "try",
    "after",
    "every",
    "time",
    "keeps",
    "latest",
    "thank",
    "you",
    "great",
  ]);

  const tokens = Array.from(
    new Set(
      text
        .split(" ")
        .filter((t) => t.length > 2 && !stop.has(t))
        .map((t) => (t.endsWith("ing") && t.length > 5 ? t.slice(0, -3) : t)),
    ),
  ).sort();

  // Prefer bug-ish tokens first for stabler keys across phrasings.
  const priority = ["crash", "login", "pay", "payment", "checkout", "bug", "error", "fail", "failed"];
  const head = priority.filter((p) => tokens.some((t) => t.includes(p) || p.includes(t)));
  const rest = tokens.filter((t) => !head.some((h) => t.includes(h) || h.includes(t)));
  const keyTokens = [...head, ...rest].slice(0, 6);

  return keyTokens.join("|") || text.slice(0, 40) || "unknown";
}

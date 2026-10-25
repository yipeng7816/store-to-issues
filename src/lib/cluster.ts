const STOP = new Set([
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

/** Longer terms first. A token matches only when it equals the term or starts with it. */
const EN_TERMS = [
  "checkout",
  "payment",
  "subscription",
  "refund",
  "crash",
  "login",
  "error",
  "failed",
  "fail",
  "bug",
  "pay",
];

const CJK_TERMS: [string, string][] = [
  ["闪退", "闪退"],
  ["崩溃", "崩溃"],
  ["无响应", "无响应"],
  ["登不上", "登录"],
  ["登陆", "登录"],
  ["登入", "登录"],
  ["登录", "登录"],
  ["卡顿", "卡顿"],
  ["白屏", "白屏"],
  ["黑屏", "黑屏"],
  ["订阅", "订阅"],
  ["退款", "退款"],
  ["支付", "付款"],
  ["付费", "付款"],
  ["付款", "付款"],
];

function tokensOf(text: string): Set<string> {
  return new Set(text.split("|").filter(Boolean));
}

/** Overlap coefficient: shared tokens / size of the shorter key. */
export function overlapScore(a: string, b: string): number {
  const sa = tokensOf(a);
  const sb = tokensOf(b);
  let hit = 0;
  for (const token of sa) if (sb.has(token)) hit += 1;
  const denom = Math.min(sa.size, sb.size) || 1;
  return hit / denom;
}

/**
 * Same complaint when the keys are identical, or they share at least two
 * tokens and the shorter key is at least half covered.
 * One shared token is not enough: "crash" must not sink into "crash|login|…".
 */
export function shouldMergeKeys(a: string, b: string, threshold = 0.5): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const sa = tokensOf(a);
  const sb = tokensOf(b);
  let hit = 0;
  for (const token of sa) if (sb.has(token)) hit += 1;
  if (hit < 2) return false;
  return overlapScore(a, b) >= threshold;
}

function normalize(title: string | undefined, body: string): string {
  return `${title || ""} ${body}`
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff\s]/g, " ")
    .replace(/\blog\s+in\b/g, "login")
    .replace(/\bsign\s+in\b/g, "login")
    .replace(/\s+/g, " ")
    .trim();
}

function latinTokens(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(" ")
        .filter((token) => /^[a-z0-9]+$/.test(token) && token.length > 2 && !STOP.has(token)),
    ),
  ).sort();
}

function termHits(text: string): string[] {
  const tokens = latinTokens(text);
  const hits: string[] = [];
  for (const term of EN_TERMS) {
    if (tokens.some((token) => token === term || token.startsWith(term))) hits.push(term);
  }
  for (const [needle, canon] of CJK_TERMS) {
    if (text.includes(needle)) hits.push(canon);
  }
  return Array.from(new Set(hits));
}

/** Normalize review text into a coarse cluster key for duplicate merging. */
export function clusterKey(title: string | undefined, body: string): string {
  const text = normalize(title, body);
  const hits = termHits(text);
  const rest = latinTokens(text).filter(
    (token) => !hits.some((hit) => token.includes(hit)),
  );
  const keyTokens = [...hits, ...rest].slice(0, 6);
  return keyTokens.join("|") || text.slice(0, 40) || "unknown";
}

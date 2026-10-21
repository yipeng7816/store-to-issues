/** Shared 429 / transient retry helpers for GitHub, ASC, Play. */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const asInt = Number(header);
  if (Number.isFinite(asInt) && asInt >= 0) {
    // GitHub often sends seconds; treat large values as ms if > 1000
    return asInt > 1000 ? asInt : asInt * 1000;
  }
  const when = Date.parse(header);
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return null;
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function extractStatus(err: unknown): number {
  if (!err || typeof err !== "object") return NaN;
  if ("status" in err) return Number((err as { status?: number }).status);
  return NaN;
}

function extractRetryAfterMs(err: unknown): number | null {
  if (!err || typeof err !== "object" || !("response" in err)) return null;
  const headers = (err as { response?: { headers?: unknown } }).response?.headers;
  if (!headers || typeof headers !== "object") return null;
  if (typeof (headers as Headers).get === "function") {
    return parseRetryAfterMs((headers as Headers).get("retry-after"));
  }
  const rec = headers as Record<string, string>;
  return parseRetryAfterMs(rec["retry-after"] || rec["Retry-After"] || null);
}

type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  label?: string;
};

function backoffMs(attempt: number, base: number, max: number, retryAfter?: number | null) {
  if (retryAfter != null && retryAfter > 0) {
    return Math.min(max, retryAfter + Math.floor(Math.random() * 250));
  }
  const exp = Math.min(max, base * 2 ** attempt);
  return exp + Math.floor(Math.random() * 200);
}

/** Retry an async call when the thrown error has a retryable HTTP status. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const retries = opts.retries ?? 4;
  const base = opts.baseDelayMs ?? 500;
  const max = opts.maxDelayMs ?? 20_000;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = extractStatus(err);
      const retryAfter = extractRetryAfterMs(err);

      if (!isRetryableStatus(status) || attempt === retries) throw err;
      const wait = backoffMs(attempt, base, max, retryAfter);
      await sleep(wait);
    }
  }
  throw lastErr;
}

/** fetch() with automatic retry on 429/5xx. */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  opts: RetryOptions = {},
): Promise<Response> {
  const retries = opts.retries ?? 4;
  const base = opts.baseDelayMs ?? 500;
  const max = opts.maxDelayMs ?? 20_000;

  let last: Response | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(input, init);
    last = res;
    if (!isRetryableStatus(res.status) || attempt === retries) return res;
    const wait = backoffMs(
      attempt,
      base,
      max,
      parseRetryAfterMs(res.headers.get("retry-after")),
    );
    // Consume body so the connection can close cleanly
    await res.text().catch(() => undefined);
    await sleep(wait);
  }
  return last!;
}

/** Run async work over items with a fixed concurrency cap. */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const limit = Math.max(1, concurrency);
  const results = new Array<R>(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

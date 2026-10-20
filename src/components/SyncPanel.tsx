"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "../lib/i18n";

type Review = {
  id: string;
  store: string;
  rating: number;
  title: string | null;
  body: string;
  clusterKey: string | null;
  githubIssue: string | null;
  githubIssueUrl?: string | null;
};

type IssueRow = {
  number: number;
  title: string;
  state: "open" | "closed" | "unknown";
  url: string;
  ratingMin: number;
  reviewCount: number;
};

function formatRunMessage(message: string, locale: "zh" | "en") {
  if (locale !== "zh") return message;
  return message
    .replace(/minRating<=(\d+)/, "最低星级≤$1")
    .replace(/mock=true/, "示例评价")
    .replace(/mock=false/, "真实商店")
    .replace(/ios=(\d+)/, "App Store $1")
    .replace(/play=(\d+)/, "Google Play $1")
    .replace(/warnings=(\d+)/, "警告 $1");
}

type SyncRun = {
  id: string;
  status: string;
  fetched: number;
  createdIssues: number;
  mergedInto: number;
  message: string | null;
  startedAt: string;
};

function fallbackIssueUrl(repo: string | null, num: number): string {
  const r = repo?.includes("/") ? repo : "yipeng7816/store-to-issues-demo";
  return `https://github.com/${r}/issues/${num}`;
}

export function SyncPanel() {
  const { t, locale } = useT();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [githubRepo, setGithubRepo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastResult, setLastResult] = useState("");
  const [suggestUrl, setSuggestUrl] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/reviews", { cache: "no-store" });
    if (res.status === 401) {
      setUnauthorized(true);
      return;
    }
    const data = (await res.json()) as {
      reviews: Review[];
      runs: SyncRun[];
      issues?: IssueRow[];
      githubRepo?: string | null;
    };
    setReviews(data.reviews || []);
    setRuns(data.runs || []);
    setIssues(data.issues || []);
    setGithubRepo(data.githubRepo || null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function resolveIssueUrl(num: number, preferred?: string | null): string {
    if (preferred) return preferred;
    const found = issues.find((i) => i.number === num);
    if (found?.url) return found.url;
    return fallbackIssueUrl(githubRepo, num);
  }

  async function syncNow() {
    setBusy(true);
    setError("");
    setLastResult("");
    setSuggestUrl(null);
    try {
      const res = await fetch("/api/sync", { method: "POST", cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fetched?: number;
        createdIssues?: number;
        mergedInto?: number;
        sources?: { app_store?: number; google_play?: number };
        warnings?: string[];
        suggestFix?: { issue: number | null; title: string; rating: number } | null;
      };
      if (res.status === 401) {
        setUnauthorized(true);
        setError(t("pleaseLogin"));
      } else if (res.status === 402) {
        setError(t("trialExpired"));
      } else if (!res.ok || data.ok === false) {
        setError(data.error || t("syncFail"));
      } else {
        const ios = data.sources?.app_store ?? "?";
        const play = data.sources?.google_play ?? "?";
        let summary = `${t("syncSummary")}：${t("fetched")} ${data.fetched}（${t("storeIos")} ${ios} / ${t("storePlay")} ${play}），${t("created")} ${data.createdIssues}，${t("merged")} ${data.mergedInto}`;
        if (data.suggestFix?.issue) {
          summary += ` · ${t("suggestFix")}：${data.suggestFix.title}（#${data.suggestFix.issue}）`;
          setSuggestUrl(fallbackIssueUrl(githubRepo, data.suggestFix.issue));
        }
        setLastResult(summary);
        if (data.warnings?.length) {
          setError(data.warnings.join(" · "));
        }
      }
      await load();
    } catch {
      setError(t("network"));
    } finally {
      setBusy(false);
    }
  }

  if (unauthorized) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-600">
        <Link href="/login" className="text-teal-800 underline">
          {t("pleaseLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={busy}
            className="h-10 rounded-full bg-teal-800 px-4 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {busy ? t("syncing") : t("runSync")}
          </button>
          <Link href="/settings" className="text-sm text-teal-800 underline">
            {t("navSettings")}
          </Link>
        </div>
        {lastResult ? (
          <p className="text-sm text-teal-800">
            {lastResult}
            {suggestUrl ? (
              <>
                {" "}
                <a
                  href={suggestUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  {t("openOnGithub")}
                </a>
              </>
            ) : null}
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </div>

      <section>
        <h2 className="text-sm font-medium text-stone-800">{t("workQueue")}</h2>
        <ul className="mt-3 space-y-2">
          {issues.length === 0 ? (
            <li className="rounded-xl border border-dashed border-stone-300 bg-white px-3 py-4 text-sm text-stone-500">
              {t("workQueueEmpty")}
            </li>
          ) : null}
          {issues.map((issue) => {
            const href = resolveIssueUrl(issue.number, issue.url);
            return (
              <li key={issue.number}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 transition hover:border-teal-700 hover:bg-teal-50/40"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          issue.state === "closed"
                            ? "bg-stone-100 text-stone-600"
                            : issue.state === "open"
                              ? "bg-amber-50 text-amber-900"
                              : "bg-stone-50 text-stone-500"
                        }`}
                      >
                        {issue.state === "closed"
                          ? t("issueClosed")
                          : issue.state === "open"
                            ? t("issueOpen")
                            : t("issueUnknown")}
                      </span>
                      <span className="font-medium text-stone-900">
                        #{issue.number} {issue.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-stone-500">
                      {"★".repeat(issue.ratingMin)} · {issue.reviewCount}{" "}
                      {t("reviewCount")}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-teal-800 underline">
                    {t("openOnGithub")}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-stone-800">{t("recentRuns")}</h2>
        <ul className="mt-3 space-y-2 font-mono text-xs text-stone-500">
          {runs.length === 0 ? (
            <li className="rounded-xl border border-dashed border-stone-300 bg-white px-3 py-4 text-stone-500">
              {t("noRuns")}
            </li>
          ) : null}
          {runs.map((r) => (
            <li key={r.id} className="rounded-xl border border-stone-200 bg-white px-3 py-2">
              {r.status === "ok" ? t("statusOk") : r.status} · {t("fetched")}{" "}
              {r.fetched} · {t("created")} {r.createdIssues} · {t("merged")}{" "}
              {r.mergedInto}
              {r.message ? ` · ${formatRunMessage(r.message, locale)}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-stone-800">{t("storedReviews")}</h2>
        <ul className="mt-3 space-y-3">
          {reviews.length === 0 ? (
            <li className="rounded-xl border border-dashed border-stone-300 bg-white px-3 py-4 text-sm text-stone-500">
              {t("noReviews")}
            </li>
          ) : null}
          {reviews.map((r) => {
            const num = r.githubIssue && !r.githubIssue.startsWith("dry-run:")
              ? Number(r.githubIssue)
              : NaN;
            const href =
              r.githubIssueUrl ||
              (Number.isFinite(num) && num > 0
                ? resolveIssueUrl(num)
                : null);
            return (
              <li
                key={r.id}
                className="rounded-2xl border border-stone-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-amber-400">{"★".repeat(r.rating)}</span>
                  <span className="text-stone-900">{r.title || t("noTitle")}</span>
                  <span className="text-xs text-stone-400">
                    {r.store === "app_store"
                      ? t("storeIos")
                      : r.store === "google_play"
                        ? t("storePlay")
                        : r.store}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-600">{r.body}</p>
                <p className="mt-2 font-mono text-xs text-stone-400">
                  {t("clusterLabel")}: {r.clusterKey || "—"} · {t("issueLabel")}:{" "}
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-teal-800 underline"
                    >
                      #{r.githubIssue}
                    </a>
                  ) : (
                    r.githubIssue || "—"
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

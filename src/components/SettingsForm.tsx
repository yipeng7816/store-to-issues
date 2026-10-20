"use client";

import { FormEvent, useEffect, useState } from "react";
import { useT } from "../lib/i18n";

type Settings = {
  githubRepo: string;
  githubTokenSet: boolean;
  useMockReviews: boolean;
  minRating: number;
  ascAppId: string;
  ascIssuerId: string;
  ascKeyId: string;
  ascPrivateKeySet: boolean;
  googlePlayPackageName: string;
  googlePlayServiceAccountJsonSet: boolean;
};

const inputClass =
  "mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-teal-700";

export function SettingsForm() {
  const { t } = useT();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [githubRepo, setGithubRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [useMockReviews, setUseMockReviews] = useState(true);
  const [minRating, setMinRating] = useState(3);
  const [ascAppId, setAscAppId] = useState("");
  const [ascIssuerId, setAscIssuerId] = useState("");
  const [ascKeyId, setAscKeyId] = useState("");
  const [ascPrivateKey, setAscPrivateKey] = useState("");
  const [googlePlayPackageName, setGooglePlayPackageName] = useState("");
  const [googlePlayJson, setGooglePlayJson] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function applySettings(s: Settings) {
    setSettings(s);
    setGithubRepo(s.githubRepo);
    setUseMockReviews(s.useMockReviews);
    setMinRating(s.minRating);
    setAscAppId(s.ascAppId);
    setAscIssuerId(s.ascIssuerId);
    setAscKeyId(s.ascKeyId);
    setGooglePlayPackageName(s.googlePlayPackageName);
  }

  useEffect(() => {
    void fetch("/api/settings")
      .then((r) => r.json())
      .then((d: { settings?: Settings; error?: string }) => {
        if (d.settings) applySettings(d.settings);
        else if (d.error) setError(d.error);
      });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubRepo,
          githubToken: githubToken || undefined,
          useMockReviews,
          minRating,
          ascAppId,
          ascIssuerId,
          ascKeyId,
          ascPrivateKey: ascPrivateKey || undefined,
          googlePlayPackageName,
          googlePlayServiceAccountJson: googlePlayJson || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || t("setSaveFail"));
        return;
      }
      setMessage(t("setSaved"));
      setGithubToken("");
      setAscPrivateKey("");
      setGooglePlayJson("");
      const refreshed = await fetch("/api/settings").then((r) => r.json());
      if (refreshed.settings) applySettings(refreshed.settings);
    } catch {
      setError(t("network"));
    } finally {
      setBusy(false);
    }
  }

  if (!settings && !error) {
    return <p className="text-sm text-stone-500">{t("setLoading")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-stone-900">GitHub</h2>
        <label className="text-xs text-stone-600">
          {t("ghRepo")}
          <input
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            placeholder="yipeng7816/store-to-issues-demo"
            className={inputClass}
          />
        </label>
        <label className="text-xs text-stone-600">
          {t("ghToken")} {settings?.githubTokenSet ? `（${t("saved")}）` : `（${t("notSet")}）`}
          <input
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder={t("keepBlank")}
            className={inputClass}
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-stone-900">{t("syncSection")}</h2>
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={useMockReviews}
            onChange={(e) => setUseMockReviews(e.target.checked)}
          />
          {t("useMock")}
        </label>
        <label className="text-xs text-stone-600">
          {t("minRatingLabel")}
          <input
            type="number"
            min={1}
            max={5}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="mt-1 h-11 w-24 rounded-xl border border-stone-300 bg-white px-3 text-sm"
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-stone-900">{t("ascSection")}</h2>
        <p className="text-xs text-stone-500">{t("ascHint")}</p>
        <label className="text-xs text-stone-600">
          {t("appId")}
          <input
            value={ascAppId}
            onChange={(e) => setAscAppId(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-xs text-stone-600">
          {t("issuerId")}
          <input
            value={ascIssuerId}
            onChange={(e) => setAscIssuerId(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-xs text-stone-600">
          {t("keyId")}
          <input
            value={ascKeyId}
            onChange={(e) => setAscKeyId(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-xs text-stone-600">
          {t("privateKey")}{" "}
          {settings?.ascPrivateKeySet ? `（${t("saved")}）` : `（${t("notSet")}）`}
          <textarea
            value={ascPrivateKey}
            onChange={(e) => setAscPrivateKey(e.target.value)}
            placeholder={t("keepBlank")}
            rows={4}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-mono text-xs text-stone-900"
          />
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-stone-900">{t("playSection")}</h2>
        <label className="text-xs text-stone-600">
          {t("packageName")}
          <input
            value={googlePlayPackageName}
            onChange={(e) => setGooglePlayPackageName(e.target.value)}
            placeholder="com.example.app"
            className={inputClass}
          />
        </label>
        <label className="text-xs text-stone-600">
          {t("serviceJson")}{" "}
          {settings?.googlePlayServiceAccountJsonSet ? `（${t("saved")}）` : `（${t("notSet")}）`}
          <textarea
            value={googlePlayJson}
            onChange={(e) => setGooglePlayJson(e.target.value)}
            placeholder={t("keepBlank")}
            rows={4}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-mono text-xs text-stone-900"
          />
        </label>
      </section>

      {message ? <p className="text-sm text-teal-800">{message}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="h-11 w-fit rounded-full bg-teal-800 px-5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {busy ? t("setSaving") : t("setSave")}
      </button>
    </form>
  );
}

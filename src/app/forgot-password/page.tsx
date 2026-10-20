"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useT } from "../../lib/i18n";

export default function ForgotPasswordPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setDevLink("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string; devLink?: string };
      if (!res.ok) {
        setError(data.error || t("failed"));
        return;
      }
      setDone(true);
      if (data.devLink) setDevLink(data.devLink);
    } catch {
      setError(t("network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("forgotTitle")}</h1>
      <p className="text-sm text-stone-600">{t("forgotBody")}</p>
      {done ? (
        <div className="space-y-3 text-sm text-stone-700">
          <p>{t("forgotSent")}</p>
          {devLink ? (
            <p className="break-all rounded-xl bg-amber-50 p-3 text-xs text-amber-950">
              Dev link (email not configured):{" "}
              <a href={devLink} className="underline">
                {devLink}
              </a>
            </p>
          ) : null}
          <Link href="/login" className="text-teal-800 underline">
            {t("goLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="text-sm text-stone-600">
            {t("email")}
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-full bg-teal-800 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {busy ? t("pleaseWait") : t("forgotSubmit")}
          </button>
        </form>
      )}
    </main>
  );
}

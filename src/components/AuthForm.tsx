"use client";

import { FormEvent, useState } from "react";
import { useT } from "../lib/i18n";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || t("failed"));
        return;
      }
      // Full navigation so the session cookie is definitely sent on the next page
      window.location.assign("/dashboard");
      return;
    } catch {
      setError(t("network"));
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-teal-700";

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="text-sm text-stone-600">
        {t("email")}
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </label>
      <label className="text-sm text-stone-600">
        {t("password")}
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={field}
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="h-11 rounded-full bg-teal-800 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {busy ? t("pleaseWait") : mode === "login" ? t("loginBtn") : t("registerBtn")}
      </button>
    </form>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useT } from "../../lib/i18n";

function ResetForm() {
  const { t } = useT();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || t("failed"));
        return;
      }
      setOk(true);
    } catch {
      setError(t("network"));
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return <p className="text-sm text-red-700">{t("verifyFail")}</p>;
  }

  if (ok) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-teal-800">{t("resetOk")}</p>
        <Link href="/login" className="text-teal-800 underline">
          {t("goLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="text-sm text-stone-600">
        {t("password")}
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700"
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="h-11 rounded-full bg-teal-800 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
      >
        {busy ? t("pleaseWait") : t("resetSubmit")}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("resetTitle")}</h1>
      <Suspense fallback={<p className="text-sm text-stone-500">{t("pleaseWait")}</p>}>
        <ResetForm />
      </Suspense>
    </main>
  );
}

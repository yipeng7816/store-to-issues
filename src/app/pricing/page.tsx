"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "../../lib/i18n";

export default function PricingPage() {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok || !data.url) {
        setError(data.error || t("checkoutFail"));
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t("network"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-5 py-16">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">{t("pricingTitle")}</h1>
        <p className="mt-3 max-w-xl text-stone-600">{t("pricingBody")}</p>
      </div>

      <div className="max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-stone-200">
        <p className="text-sm font-medium text-teal-800">{t("planName")}</p>
        <p className="mt-2 text-5xl font-semibold tracking-tight text-stone-950">
          $12
          <span className="text-base font-normal text-stone-500">{t("perMonth")}</span>
        </p>
        <ul className="mt-6 space-y-2 text-sm text-stone-600">
          <li>{t("feat1")}</li>
          <li>{t("feat2")}</li>
          <li>{t("feat3")}</li>
        </ul>
        <button
          type="button"
          onClick={() => void checkout()}
          disabled={busy}
          className="mt-8 h-11 rounded-full bg-teal-800 px-5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {busy ? t("redirecting") : t("checkout")}
        </button>
        {error ? <p className="mt-3 text-sm text-amber-800">{error}</p> : null}
      </div>

      <p className="text-sm text-stone-500">
        <Link href="/dashboard" className="font-medium text-teal-800 underline">
          {t("backDash")}
        </Link>
      </p>
    </main>
  );
}

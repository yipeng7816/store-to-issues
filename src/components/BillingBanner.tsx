"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "../lib/i18n";

type Me = {
  planStatus?: string;
  trialEndsAt?: string | null;
  syncAllowed?: boolean;
  accessReason?: string;
  stripeConfigured?: boolean;
  billingConfigured?: boolean;
  isAdmin?: boolean;
};

export function BillingBanner() {
  const { t } = useT();
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: Me | null }) => setMe(d.user || null));
  }, []);

  async function go(path: string) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(path, { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || t("billingUnavailable"));
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(t("network"));
    } finally {
      setBusy(false);
    }
  }

  if (!me) return null;

  const billingReady = Boolean(me.billingConfigured ?? me.stripeConfigured);
  const trialLabel = me.trialEndsAt
    ? new Date(me.trialEndsAt).toLocaleDateString()
    : null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
      <p>
        {t("planLabel")}:{" "}
        <span className="font-medium text-stone-950">
          {me.isAdmin || me.accessReason === "admin"
            ? t("planAdmin")
            : me.planStatus === "trialing"
              ? t("planTrialing")
              : me.planStatus === "active"
                ? t("planActive")
                : me.planStatus === "canceled"
                  ? t("planCanceled")
                  : t("planNone")}
        </span>
        {!me.isAdmin && me.planStatus === "trialing" && trialLabel
          ? ` · ${t("trialEnds")} ${trialLabel}`
          : null}
        {me.syncAllowed ? ` · ${t("syncAllowed")}` : ` · ${t("syncBlocked")}`}
      </p>
      {me.isAdmin || me.accessReason === "admin" ? null : !me.syncAllowed ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void go("/api/billing/checkout")}
            disabled={busy || !billingReady}
            className="h-9 rounded-full bg-teal-800 px-4 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {busy ? t("redirecting") : t("subscribe")}
          </button>
          <Link href="/pricing" className="text-xs text-teal-800 underline">
            {t("navPricing")}
          </Link>
          {!billingReady ? (
            <span className="text-xs text-amber-800">{t("stripeMissing")}</span>
          ) : null}
        </div>
      ) : me.planStatus === "trialing" ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void go("/api/billing/checkout")}
            disabled={busy || !billingReady}
            className="h-9 rounded-full bg-teal-800 px-4 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {busy ? t("redirecting") : t("upgradeNow")}
          </button>
          <Link href="/pricing" className="text-xs text-teal-800 underline">
            {t("navPricing")}
          </Link>
          {!billingReady ? (
            <span className="text-xs text-amber-800">{t("stripeMissing")}</span>
          ) : null}
        </div>
      ) : me.planStatus === "active" ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => void go("/api/billing/portal")}
            disabled={busy || !billingReady}
            className="h-9 rounded-full bg-teal-800 px-4 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {busy ? t("redirecting") : t("manageBilling")}
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-2 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

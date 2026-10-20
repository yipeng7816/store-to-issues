"use client";

import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";

export function VerifyBanner() {
  const { t } = useT();
  const [needed, setNeeded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [devLink, setDevLink] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: { user?: { emailVerified?: boolean } | null }) => {
        if (d.user && !d.user.emailVerified) setNeeded(true);
      });
  }, []);

  async function resend() {
    setBusy(true);
    setMsg("");
    setDevLink("");
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ resend: true }),
      });
      const data = (await res.json()) as {
        alreadyVerified?: boolean;
        emailSent?: boolean;
        devLink?: string;
      };
      if (data.alreadyVerified) {
        setNeeded(false);
        return;
      }
      setMsg(data.emailSent ? t("forgotSent") : t("forgotSent"));
      if (data.devLink) setDevLink(data.devLink);
    } finally {
      setBusy(false);
    }
  }

  if (!needed) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>{t("verifyBanner")}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void resend()}
        className="mt-2 font-medium text-teal-800 underline disabled:opacity-60"
      >
        {busy ? t("pleaseWait") : t("verifyResend")}
      </button>
      {msg ? <p className="mt-2 text-xs">{msg}</p> : null}
      {devLink ? (
        <p className="mt-2 break-all text-xs">
          <a href={devLink} className="underline">
            {devLink}
          </a>
        </p>
      ) : null}
    </div>
  );
}

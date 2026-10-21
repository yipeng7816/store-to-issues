"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useT } from "../../lib/i18n";

function VerifyInner() {
  const { t } = useT();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const type = params.get("type") || "verify";
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const [devLink, setDevLink] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("fail");
      return;
    }
    void fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, type }),
    })
      .then(async (res) => {
        setStatus(res.ok ? "ok" : "fail");
      })
      .catch(() => setStatus("fail"));
  }, [token, type]);

  async function resend() {
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ resend: true }),
    });
    const data = (await res.json()) as { devLink?: string };
    if (data.devLink) setDevLink(data.devLink);
  }

  if (status === "loading") {
    return <p className="text-sm text-stone-500">{t("pleaseWait")}</p>;
  }

  if (status === "ok") {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-teal-800">{t("verifyOk")}</p>
        <Link href="/dashboard" className="text-teal-800 underline">
          {t("goDash")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      <p className="text-red-700">{t("verifyFail")}</p>
      <button
        type="button"
        onClick={() => void resend()}
        className="text-teal-800 underline"
      >
        {t("verifyResend")}
      </button>
      {devLink ? (
        <p className="break-all text-xs text-amber-900">
          <a href={devLink} className="underline">
            {devLink}
          </a>
        </p>
      ) : null}
    </div>
  );
}

export default function VerifyEmailPage() {
  const { t } = useT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("verifyTitle")}</h1>
      <Suspense fallback={<p className="text-sm text-stone-500">{t("pleaseWait")}</p>}>
        <VerifyInner />
      </Suspense>
    </main>
  );
}

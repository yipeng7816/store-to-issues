"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useT } from "../../lib/i18n";

const SUPPORT = "ymyjobp@163.com";

export default function ContactPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setOk(false);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, name, message }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || t("failed"));
        return;
      }
      setOk(true);
      setMessage("");
    } catch {
      setError(t("network"));
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("contactTitle")}</h1>
      <p className="mt-3 text-sm text-stone-600">{t("contactBody")}</p>
      <p className="mt-4 text-sm text-stone-800">
        {t("supportLabel")}{" "}
        <a href={`mailto:${SUPPORT}`} className="font-medium text-teal-800 underline">
          {SUPPORT}
        </a>
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm text-stone-600">
          {t("email")}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`h-11 ${field}`}
          />
        </label>
        <label className="text-sm text-stone-600">
          {t("contactName")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`h-11 ${field}`}
          />
        </label>
        <label className="text-sm text-stone-600">
          {t("contactMessage")}
          <textarea
            required
            minLength={10}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={field}
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {ok ? <p className="text-sm text-teal-800">{t("contactOk")}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="h-11 w-fit rounded-full bg-teal-800 px-5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {busy ? t("pleaseWait") : t("contactSubmit")}
        </button>
      </form>

      <p className="mt-10 text-sm">
        <Link href="/" className="text-teal-800 underline">
          {t("backHome")}
        </Link>
      </p>
    </main>
  );
}

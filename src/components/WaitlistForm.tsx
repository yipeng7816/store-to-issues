"use client";

import { FormEvent, useState } from "react";
import { useT } from "../lib/i18n";

export function WaitlistForm() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || t("waitlistErr"));
        return;
      }
      setStatus("ok");
      setMessage(t("waitlistOk"));
      setEmail("");
    } catch {
      setStatus("error");
      setMessage(t("waitlistNet"));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="waitlist-email">
          {t("email")}
        </label>
        <input
          id="waitlist-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("waitlistPh")}
          className="h-11 flex-1 rounded-full border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none focus:border-teal-700"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-11 rounded-full bg-stone-900 px-5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {status === "loading" ? t("waitlistBusy") : t("waitlistBtn")}
        </button>
      </div>
      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-700" : "text-stone-500"}`} role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}

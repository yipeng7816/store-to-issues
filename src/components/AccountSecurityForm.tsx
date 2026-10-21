"use client";

import { FormEvent, useState } from "react";
import { useT } from "../lib/i18n";

const inputClass =
  "mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-900 outline-none focus:border-teal-700";

export function AccountSecurityForm() {
  const { t } = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [emMsg, setEmMsg] = useState("");
  const [emErr, setEmErr] = useState("");
  const [devLink, setDevLink] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [emBusy, setEmBusy] = useState(false);

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg("");
    setPwErr("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPwErr(data.error || t("acctFail"));
        return;
      }
      setPwMsg(t("pwChanged"));
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setPwErr(t("network"));
    } finally {
      setPwBusy(false);
    }
  }

  async function onChangeEmail(e: FormEvent) {
    e.preventDefault();
    setEmBusy(true);
    setEmMsg("");
    setEmErr("");
    setDevLink("");
    try {
      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, password: emailPassword }),
      });
      const data = (await res.json()) as {
        error?: string;
        emailSent?: boolean;
        devLink?: string;
      };
      if (!res.ok) {
        setEmErr(data.error || t("acctFail"));
        return;
      }
      setEmMsg(t("emailChangeSent"));
      if (data.devLink) setDevLink(data.devLink);
      setEmailPassword("");
    } catch {
      setEmErr(t("network"));
    } finally {
      setEmBusy(false);
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-10">
      <form onSubmit={onChangePassword} className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-stone-900">{t("acctPassword")}</h2>
        <label className="text-xs text-stone-600">
          {t("currentPassword")}
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="text-xs text-stone-600">
          {t("newPassword")}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className={inputClass}
          />
        </label>
        {pwMsg ? <p className="text-sm text-teal-800">{pwMsg}</p> : null}
        {pwErr ? <p className="text-sm text-red-700">{pwErr}</p> : null}
        <button
          type="submit"
          disabled={pwBusy}
          className="h-11 w-fit rounded-full bg-teal-800 px-5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {pwBusy ? t("setSaving") : t("changePassword")}
        </button>
      </form>

      <form onSubmit={onChangeEmail} className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-stone-900">{t("acctEmail")}</h2>
        <p className="text-xs text-stone-500">{t("emailChangeHint")}</p>
        <label className="text-xs text-stone-600">
          {t("newEmail")}
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        <label className="text-xs text-stone-600">
          {t("confirmWithPassword")}
          <input
            type="password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            required
            className={inputClass}
          />
        </label>
        {emMsg ? <p className="text-sm text-teal-800">{emMsg}</p> : null}
        {emErr ? <p className="text-sm text-red-700">{emErr}</p> : null}
        {devLink ? (
          <p className="break-all text-xs text-amber-900">
            <a href={devLink} className="underline">
              {devLink}
            </a>
          </p>
        ) : null}
        <button
          type="submit"
          disabled={emBusy}
          className="h-11 w-fit rounded-full bg-teal-800 px-5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        >
          {emBusy ? t("setSaving") : t("changeEmail")}
        </button>
      </form>
    </div>
  );
}

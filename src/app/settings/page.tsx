"use client";

import Link from "next/link";
import { AccountSecurityForm } from "../../components/AccountSecurityForm";
import { SettingsForm } from "../../components/SettingsForm";
import { useT } from "../../lib/i18n";

export default function SettingsPage() {
  const { t } = useT();
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-5 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("setTitle")}</h1>
          <p className="mt-2 max-w-xl text-sm text-stone-600">{t("setLead")}</p>
        </div>
        <Link href="/dashboard" className="shrink-0 text-sm font-medium text-teal-800 underline">
          {t("navDashboard")}
        </Link>
      </div>
      <SettingsForm />
      <section className="border-t border-stone-200 pt-10">
        <h2 className="mb-6 text-lg font-semibold text-stone-900">{t("acctSection")}</h2>
        <AccountSecurityForm />
      </section>
    </main>
  );
}

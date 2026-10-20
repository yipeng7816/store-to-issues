"use client";

import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";
import { useT } from "../../lib/i18n";

export default function RegisterPage() {
  const { t } = useT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("registerTitle")}</h1>
      <AuthForm mode="register" />
      <p className="text-sm text-stone-500">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-teal-800 underline">
          {t("navLogin")}
        </Link>
      </p>
    </main>
  );
}

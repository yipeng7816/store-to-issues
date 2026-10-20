"use client";

import Link from "next/link";
import { AuthForm } from "../../components/AuthForm";
import { useT } from "../../lib/i18n";

export default function LoginPage() {
  const { t } = useT();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("loginTitle")}</h1>
      <AuthForm mode="login" />
      <p className="text-sm text-stone-500">
        <Link href="/forgot-password" className="font-medium text-teal-800 underline">
          {t("forgotPassword")}
        </Link>
      </p>
      <p className="text-sm text-stone-500">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-medium text-teal-800 underline">
          {t("navRegister")}
        </Link>
      </p>
    </main>
  );
}

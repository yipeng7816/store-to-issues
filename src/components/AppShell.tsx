"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LocaleProvider, useT } from "../lib/i18n";

function LangSwitch() {
  const { locale, setLocale } = useT();
  return (
    <div className="flex rounded-full bg-stone-200/80 p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => setLocale("zh")}
        className={`rounded-full px-2.5 py-1 ${
          locale === "zh" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
        }`}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-2.5 py-1 ${
          locale === "en" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
        }`}
      >
        EN
      </button>
    </div>
  );
}

function Header() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { user?: { email?: string } | null }) => {
        setEmail(d.user?.email || null);
      });
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setEmail(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-[#f7f4ef]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-stone-900">
          {t("brand")}
        </Link>
        <nav className="flex items-center gap-1 text-sm text-stone-600 sm:gap-3">
          <Link href="/pricing" className="hidden rounded-full px-3 py-1.5 hover:bg-white sm:inline">
            {t("navPricing")}
          </Link>
          <Link href="/dashboard" className="hidden rounded-full px-3 py-1.5 hover:bg-white sm:inline">
            {t("navDashboard")}
          </Link>
          {email ? (
            <>
              <Link href="/settings" className="rounded-full px-3 py-1.5 hover:bg-white">
                {t("navSettings")}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full bg-stone-900 px-3.5 py-1.5 text-white hover:bg-stone-700"
              >
                {t("navLogout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-white">
                {t("navLogin")}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-stone-900 px-3.5 py-1.5 text-white hover:bg-stone-700"
              >
                {t("navRegister")}
              </Link>
            </>
          )}
          <LangSwitch />
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const { t } = useT();
  const support = "ymyjobp@163.com";
  return (
    <footer className="border-t border-stone-200 px-5 py-8 text-center text-xs text-stone-500">
      <p>{t("footer")}</p>
      <p className="mt-2">
        {t("supportLabel")}{" "}
        <a href={`mailto:${support}`} className="text-teal-800 underline">
          {support}
        </a>
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <Link href="/privacy" className="underline hover:text-stone-800">
          {t("footerPrivacy")}
        </Link>
        <Link href="/terms" className="underline hover:text-stone-800">
          {t("footerTerms")}
        </Link>
        <Link href="/contact" className="underline hover:text-stone-800">
          {t("footerContact")}
        </Link>
      </p>
    </footer>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-[#f7f4ef] text-stone-900">
      <Header />
      <div className="flex flex-1 flex-col">{children}</div>
      <Footer />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <Frame>{children}</Frame>
    </LocaleProvider>
  );
}

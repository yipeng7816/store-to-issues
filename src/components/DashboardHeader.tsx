"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../lib/i18n";

export function DashboardHeader() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: { user?: { email?: string } | null }) => {
        if (!d.user) {
          router.replace("/login");
          return;
        }
        setEmail(d.user.email || null);
      });
  }, [router]);

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">{t("dashTitle")}</h1>
      <p className="mt-2 text-sm text-stone-500">
        {email ? `${t("signedIn")} ${email}` : t("checking")}
      </p>
      <p className="mt-3 max-w-xl text-sm text-stone-600">{t("dashHint")}</p>
    </div>
  );
}

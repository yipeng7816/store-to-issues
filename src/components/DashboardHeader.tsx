"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../lib/i18n";

export function DashboardHeader() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const d = (await res.json()) as { user?: { email?: string } | null };
      if (cancelled) return;
      if (!d.user) {
        // One retry — cookie can lag a tick after login redirect
        await new Promise((r) => setTimeout(r, 200));
        const retry = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const again = (await retry.json()) as {
          user?: { email?: string } | null;
        };
        if (cancelled) return;
        if (!again.user) {
          router.replace("/login");
          return;
        }
        setEmail(again.user.email || null);
        return;
      }
      setEmail(d.user.email || null);
    })();
    return () => {
      cancelled = true;
    };
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

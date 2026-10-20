"use client";

import Link from "next/link";
import { WaitlistForm } from "../components/WaitlistForm";
import { useT } from "../lib/i18n";

export default function Home() {
  const { t } = useT();
  const cards = [
    { title: t("card1t"), body: t("card1b") },
    { title: t("card2t"), body: t("card2b") },
    { title: t("card3t"), body: t("card3b") },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 pb-20 pt-14">
      <section className="grid items-end gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="text-sm font-medium text-teal-800">App Store · Google Play · GitHub</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-[1.15] tracking-tight text-stone-950 sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600">{t("heroBody")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-teal-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              {t("ctaStart")}
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:border-stone-400"
            >
              {t("ctaPricing")}
            </Link>
          </div>
          <div className="mt-8">
            <WaitlistForm />
          </div>
        </div>
        <aside className="rounded-3xl bg-stone-950 p-6 text-stone-100 shadow-xl shadow-stone-300/40">
          <p className="text-xs uppercase tracking-[0.16em] text-teal-200">{t("demoLabel")}</p>
          <pre className="mt-4 whitespace-pre-wrap font-mono text-sm leading-7 text-stone-200">
            {t("demoBody")}
          </pre>
        </aside>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        {cards.map((item, i) => (
          <article
            key={item.title}
            className={`rounded-2xl p-5 ${
              i === 2 ? "bg-teal-800 text-white" : "border border-stone-200 bg-white"
            }`}
          >
            <h2 className={`text-base font-semibold ${i === 2 ? "text-white" : "text-stone-900"}`}>
              {item.title}
            </h2>
            <p className={`mt-2 text-sm leading-6 ${i === 2 ? "text-teal-50" : "text-stone-600"}`}>
              {item.body}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useT } from "../../lib/i18n";

export default function TermsPage() {
  const { t, locale } = useT();
  const zh = locale === "zh";
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("termsTitle")}</h1>
      <p className="mt-2 text-sm text-stone-500">
        {zh ? "最后更新：2026-10-20" : "Last updated: 2026-10-20"}
      </p>
      <div className="mt-8 space-y-4 text-sm leading-7 text-stone-700">
        {zh ? (
          <>
            <p>
              使用 StoreToIssues 即表示你同意本条款。本产品为个人实验性质的自助工具，按「现状」提供，可能随时变更或中止。
            </p>
            <p>
              <strong>你的责任：</strong>合法使用；保管好 GitHub / 商店密钥；你同步与创建的
              Issue 内容由你负责。不得滥用接口或侵犯他人权利。
            </p>
            <p>
              <strong>试用与付费：</strong>注册可获试用。付费功能以定价页与结账流程为准。退款政策将按支付平台规则另行说明。
            </p>
            <p>
              <strong>免责：</strong>我们与 Apple、Google、GitHub 无隶属关系。对间接损失、数据丢失、第三方
              API 故障不承担超出法律强制范围的责任。
            </p>
            <p>
              <strong>联系：</strong>ymyjobp@163.com · 联系我们页面。
            </p>
          </>
        ) : (
          <>
            <p>
              By using StoreToIssues you agree to these terms. The product is a personal
              experiment provided “as is” and may change or stop at any time.
            </p>
            <p>
              <strong>Your duties:</strong> use it lawfully; protect your GitHub / store
              secrets; you are responsible for issues created from your data. Do not abuse
              the API or infringe others’ rights.
            </p>
            <p>
              <strong>Trial & billing:</strong> signup includes a trial. Paid features
              follow the pricing page and checkout. Refunds follow the payment provider’s
              rules when billing is enabled.
            </p>
            <p>
              <strong>Disclaimer:</strong> not affiliated with Apple, Google, or GitHub.
              We are not liable for indirect damages, data loss, or third-party API
              outages beyond what applicable law requires.
            </p>
            <p>
              <strong>Contact:</strong> ymyjobp@163.com · Contact page.
            </p>
          </>
        )}
      </div>
      <p className="mt-10 text-sm">
        <Link href="/" className="text-teal-800 underline">
          {t("backHome")}
        </Link>
      </p>
    </main>
  );
}

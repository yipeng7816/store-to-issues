"use client";

import Link from "next/link";
import { useT } from "../../lib/i18n";

export default function PrivacyPage() {
  const { t, locale } = useT();
  const zh = locale === "zh";
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{t("privacyTitle")}</h1>
      <p className="mt-2 text-sm text-stone-500">
        {zh ? "最后更新：2026-10-20" : "Last updated: 2026-10-20"}
      </p>
      <div className="mt-8 space-y-4 text-sm leading-7 text-stone-700">
        {zh ? (
          <>
            <p>
              StoreToIssues（「我们」）是个人实验项目。本政策说明我们如何处理你在使用
              https://store-to-issues.vercel.app 时提供的信息。
            </p>
            <p>
              <strong>我们收集什么：</strong>注册邮箱与密码哈希；你主动填写的 GitHub /
              商店凭证（加密保存）；同步产生的评价与 Issue 元数据；联系表单内容；基础服务器日志。
            </p>
            <p>
              <strong>用途：</strong>提供同步与账号服务、安全、回复你的咨询、改进产品。我们不会出售你的个人数据。
            </p>
            <p>
              <strong>第三方：</strong>托管与数据库（如 Vercel、Neon）、可选邮件服务（Resend）、你配置的
              GitHub / Apple / Google API。支付若启用将通过相应支付平台处理。
            </p>
            <p>
              <strong>保留与删除：</strong>账号存续期间保留业务数据。你可来信要求删除账号与相关数据。
            </p>
            <p>
              <strong>联系：</strong>隐私相关问题请发信至 ymyjobp@163.com 或使用「联系我们」表单。
            </p>
          </>
        ) : (
          <>
            <p>
              StoreToIssues (“we”) is a personal experiment. This policy describes how we
              handle information when you use https://store-to-issues.vercel.app.
            </p>
            <p>
              <strong>What we collect:</strong> account email and password hash; GitHub /
              store credentials you enter (encrypted at rest); synced review and issue
              metadata; contact-form messages; basic server logs.
            </p>
            <p>
              <strong>Why:</strong> to run the product, keep accounts secure, answer
              support requests, and improve the service. We do not sell your personal data.
            </p>
            <p>
              <strong>Processors:</strong> hosting/database (e.g. Vercel, Neon), optional
              email (Resend), and the GitHub / Apple / Google APIs you connect. Payments,
              if enabled, go through the payment provider.
            </p>
            <p>
              <strong>Retention:</strong> we keep data while your account exists. Email us
              to request deletion of your account and related data.
            </p>
            <p>
              <strong>Contact:</strong> ymyjobp@163.com or the Contact form.
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

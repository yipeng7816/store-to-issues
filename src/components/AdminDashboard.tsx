"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AdminMetricsPayload } from "../lib/admin-metrics";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">
        {value}
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetricsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/metrics", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const d = (await r.json()) as { error?: string };
          throw new Error(d.error || `HTTP ${r.status}`);
        }
        return r.json() as Promise<{ metrics: AdminMetricsPayload }>;
      })
      .then((d) => setMetrics(d.metrics))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <p className="text-sm text-red-700">
        {error === "Forbidden" ? "需要管理员账号。" : error}
      </p>
    );
  }

  if (!metrics) {
    return <p className="text-sm text-stone-500">加载指标…</p>;
  }

  const t = metrics.totals;

  return (
    <div className="flex flex-col gap-10">
      <p className="text-sm text-stone-500">
        近 {metrics.rangeDays} 天（UTC 按日汇总）。更新于{" "}
        {new Date(metrics.generatedAt).toLocaleString()}.
        {" "}
        <a
          href="https://vercel.com/dashboard"
          className="text-teal-800 underline"
          target="_blank"
          rel="noreferrer"
        >
          Vercel Analytics
        </a>{" "}
        可看托管侧流量曲线（需在 Vercel 项目里启用 Web Analytics）。
      </p>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="总注册用户" value={t.users} />
        <Stat label="已验证邮箱" value={t.verifiedUsers} />
        <Stat label="已配 GitHub" value={t.withGithubRepo} />
        <Stat label="7 日内活跃" value={t.activeLast7Days} />
        <Stat label="30 天页面浏览" value={t.pageViews30d} />
        <Stat label="30 天独立访客" value={t.uniqueVisitors30d} />
        <Stat label="已接真商店 API" value={t.liveStoreConfigured} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">每日趋势</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase text-stone-500">
              <tr>
                <th className="px-3 py-2">日期</th>
                <th className="px-3 py-2">浏览</th>
                <th className="px-3 py-2">访客</th>
                <th className="px-3 py-2">注册</th>
                <th className="px-3 py-2">登录</th>
                <th className="px-3 py-2">同步成功</th>
              </tr>
            </thead>
            <tbody>
              {metrics.daily.map((row) => (
                <tr key={row.day} className="border-b border-stone-50">
                  <td className="px-3 py-2 font-mono text-xs">{row.day}</td>
                  <td className="px-3 py-2 tabular-nums">{row.pageViews}</td>
                  <td className="px-3 py-2 tabular-nums">{row.uniqueVisitors}</td>
                  <td className="px-3 py-2 tabular-nums">{row.signups}</td>
                  <td className="px-3 py-2 tabular-nums">{row.logins}</td>
                  <td className="px-3 py-2 tabular-nums">{row.syncOk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold">热门页面（30 天）</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {metrics.topPaths.length === 0 ? (
              <li className="text-stone-500">暂无数据</li>
            ) : (
              metrics.topPaths.map((p) => (
                <li
                  key={p.path}
                  className="flex justify-between rounded-lg bg-white px-3 py-2 border border-stone-100"
                >
                  <span className="font-mono text-xs">{p.path}</span>
                  <span className="tabular-nums text-stone-600">{p.views}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold">最近注册</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {metrics.recentSignups.map((u) => (
              <li
                key={u.email + u.createdAt}
                className="rounded-lg border border-stone-100 bg-white px-3 py-2"
              >
                <p className="font-medium">{u.email}</p>
                <p className="text-xs text-stone-500">
                  {new Date(u.createdAt).toLocaleString()} · {u.planStatus}
                  {u.emailVerified ? " · 已验证" : ""}
                  {u.lastLoginAt
                    ? ` · 上次登录 ${new Date(u.lastLoginAt).toLocaleDateString()}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="text-sm">
        <Link href="/dashboard" className="text-teal-800 underline">
          返回控制台
        </Link>
      </p>
    </div>
  );
}

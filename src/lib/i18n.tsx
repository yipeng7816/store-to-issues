"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "zh" | "en";

const dict = {
  zh: {
    brand: "StoreToIssues",
    navLogin: "登录",
    navRegister: "注册",
    navPricing: "价格",
    navDashboard: "控制台",
    navSettings: "设置",
    navHome: "首页",
    navLogout: "退出",
    heroTitle: "把应用商店差评，收成一条可修的 GitHub Issue",
    heroBody:
      "同时读取 App Store 和 Google Play。相似投诉合并成一条，直接进你的仓库。不用在两个后台之间复制粘贴。",
    ctaStart: "开始试用",
    ctaPricing: "看价格",
    waitlistPh: "你的邮箱",
    waitlistBtn: "加入候补",
    waitlistBusy: "提交中…",
    waitlistOk: "已记下。公测开放时会通知你。",
    waitlistErr: "出错了，请再试一次。",
    waitlistNet: "网络错误，请再试一次。",
    card1t: "现在的做法",
    card1b: "两个后台各看一遍，再手动贴到 GitHub，重复投诉会变成一堆待办。",
    card2t: "周报摘要",
    card2b: "每周一大条，能扫一眼，但不方便直接拿去修。",
    card3t: "StoreToIssues",
    card3b: "双端拉取 → 过滤星级 → 合并重复 → 一条能关单的 Issue。",
    demoLabel: "合并后的样子",
    demoBody: `[商店] 更新后登录闪退
• iOS ×3 · Android ×5 · 已合并
• 原文、版本、商店链接
→ 在 GitHub 开一条 Issue`,
    footer: "个人实验项目 · 与 Apple、Google 无关",
    loginTitle: "登录",
    registerTitle: "创建账号",
    noAccount: "还没有账号？",
    hasAccount: "已有账号？",
    email: "邮箱",
    password: "密码（至少 8 位）",
    loginBtn: "登录",
    registerBtn: "创建账号",
    pleaseWait: "请稍候…",
    failed: "失败",
    network: "网络错误",
    pricingTitle: "价格",
    pricingBody: "注册即有 14 天试用。之后按月订阅，把双端评价同步进 GitHub。",
    planName: "独立开发者",
    perMonth: "/月",
    feat1: "App Store + Google Play 同步",
    feat2: "重复投诉合并成一条 Issue",
    feat3: "含 14 天试用",
    checkout: "去结账",
    redirecting: "跳转中…",
    checkoutFail: "暂时无法结账",
    backDash: "返回控制台",
    dashTitle: "控制台",
    checking: "正在确认登录…",
    signedIn: "当前账号",
    dashHint:
      "同步后差评会合并成 GitHub Issue。修好后在 GitHub 关单，这里会显示已处理。默认使用示例评价。",
    planLabel: "方案",
    trialEnds: "试用至",
    syncAllowed: "可以同步",
    syncBlocked: "同步已停",
    upgradeNow: "现在升级",
    subscribe: "用 Stripe 订阅",
    manageBilling: "管理账单",
    stripeMissing: "还没配置 Stripe，暂时只能试用",
    billingUnavailable: "暂时无法结账",
    runSync: "开始同步",
    syncing: "同步中…",
    recentRuns: "最近同步",
    storedReviews: "已保存的评价",
    noRuns: "还没有同步记录。先去设置填 GitHub，再点开始同步。",
    noReviews: "还没有评价。",
    pleaseLogin: "请先登录后再同步。",
    trialExpired: "试用已结束，到价格页订阅后才能继续同步。",
    syncFail: "同步失败",
    issueLabel: "Issue",
    clusterLabel: "聚类",
    noTitle: "（无标题）",
    statusOk: "成功",
    workQueue: "待修 Issue",
    workQueueEmpty: "还没有关联的 Issue。同步差评后会出现在这里。",
    issueOpen: "待修",
    issueClosed: "已处理",
    issueUnknown: "未知",
    reviewCount: "条评价",
    openOnGithub: "在 GitHub 打开",
    suggestFix: "建议先修",
    syncSummary: "同步摘要",
    planTrialing: "试用中",
    planActive: "已订阅",
    planCanceled: "已取消",
    planNone: "未订阅",
    planAdmin: "管理员（全功能）",
    setTitle: "设置",
    setLead: "GitHub 和商店凭证按账号保存，并在本地数据库里加密。",
    setLoading: "正在加载设置…",
    setSaved: "已保存。密钥已加密存储。",
    setSaveFail: "保存失败",
    setSaving: "保存中…",
    setSave: "保存设置",
    ghRepo: "仓库（所有者/名称）",
    ghToken: "令牌",
    saved: "已保存",
    notSet: "未填写",
    keepBlank: "留空则保留已有内容",
    syncSection: "同步方式",
    useMock: "使用示例商店评价",
    minRatingLabel: "评分小于等于此时建 Issue",
    ascSection: "App Store Connect（真实拉取）",
    ascHint: "关闭示例模式后才需要。私钥会加密保存。",
    appId: "App ID",
    issuerId: "Issuer ID",
    keyId: "Key ID",
    privateKey: "私钥（.p8 PEM）",
    playSection: "Google Play（真实拉取）",
    packageName: "包名",
    serviceJson: "服务账号 JSON",
    storeIos: "App Store",
    storePlay: "Google Play",
    fetched: "拉取",
    created: "新建",
    merged: "合并",
  },
  en: {
    brand: "StoreToIssues",
    navLogin: "Log in",
    navRegister: "Register",
    navPricing: "Pricing",
    navDashboard: "Dashboard",
    navSettings: "Settings",
    navHome: "Home",
    navLogout: "Log out",
    heroTitle: "Turn store reviews into one GitHub issue you can ship",
    heroBody:
      "Read App Store and Google Play together. Merge the same complaint into one issue in your repo — no more copy-paste across two consoles.",
    ctaStart: "Start trial",
    ctaPricing: "See pricing",
    waitlistPh: "you@company.com",
    waitlistBtn: "Join waitlist",
    waitlistBusy: "Joining…",
    waitlistOk: "You're on the list. We'll email when beta opens.",
    waitlistErr: "Something went wrong.",
    waitlistNet: "Network error. Try again.",
    card1t: "Manual today",
    card1b: "Check both consoles, paste into GitHub, and drown in duplicate bugs.",
    card2t: "Weekly digests",
    card2b: "One big issue a week. Easy to skim, hard to ship from.",
    card3t: "StoreToIssues",
    card3b: "Both stores → filter stars → merge duplicates → one closable issue.",
    demoLabel: "What lands in GitHub",
    demoBody: `[Store] Login crash after update
• iOS ×3 · Android ×5 · merged
• quotes, version, store links
→ one GitHub issue`,
    footer: "Personal experiment · not affiliated with Apple or Google",
    loginTitle: "Log in",
    registerTitle: "Create account",
    noAccount: "No account yet?",
    hasAccount: "Already have an account?",
    email: "Email",
    password: "Password (min 8)",
    loginBtn: "Log in",
    registerBtn: "Create account",
    pleaseWait: "Please wait…",
    failed: "Failed",
    network: "Network error",
    pricingTitle: "Pricing",
    pricingBody:
      "14-day trial on signup. Then a monthly plan that syncs both stores into GitHub.",
    planName: "Indie",
    perMonth: "/month",
    feat1: "App Store + Google Play sync",
    feat2: "Duplicate complaints merged into one issue",
    feat3: "14-day trial included",
    checkout: "Start checkout",
    redirecting: "Redirecting…",
    checkoutFail: "Checkout unavailable",
    backDash: "Back to dashboard",
    dashTitle: "Dashboard",
    checking: "Checking session…",
    signedIn: "Signed in as",
    dashHint:
      "Sync merges bad reviews into GitHub issues. Close the issue when fixed — status shows here. Mock reviews stay on until you turn them off.",
    planLabel: "Plan",
    trialEnds: "trial ends",
    syncAllowed: "sync allowed",
    syncBlocked: "sync blocked",
    upgradeNow: "Upgrade now",
    subscribe: "Subscribe with Stripe",
    manageBilling: "Manage billing",
    stripeMissing: "Stripe is not configured yet — trial only",
    billingUnavailable: "Billing unavailable",
    runSync: "Run sync",
    syncing: "Syncing…",
    recentRuns: "Recent syncs",
    storedReviews: "Stored reviews",
    noRuns: "No syncs yet. Set GitHub in Settings, then run sync.",
    noReviews: "No reviews stored yet.",
    pleaseLogin: "Please log in to sync reviews.",
    trialExpired: "Trial expired — subscribe on Pricing to keep syncing.",
    syncFail: "Sync failed",
    issueLabel: "issue",
    clusterLabel: "cluster",
    noTitle: "(no title)",
    statusOk: "ok",
    workQueue: "Issue queue",
    workQueueEmpty: "No linked issues yet. Sync bad reviews to populate this list.",
    issueOpen: "open",
    issueClosed: "done",
    issueUnknown: "unknown",
    reviewCount: "reviews",
    openOnGithub: "Open on GitHub",
    suggestFix: "Fix first",
    syncSummary: "Sync summary",
    planTrialing: "trialing",
    planActive: "active",
    planCanceled: "canceled",
    planNone: "none",
    planAdmin: "admin (full access)",
    setTitle: "Settings",
    setLead:
      "GitHub and store credentials are saved per account and encrypted in the local database.",
    setLoading: "Loading settings…",
    setSaved: "Saved. Secrets are encrypted at rest.",
    setSaveFail: "Save failed",
    setSaving: "Saving…",
    setSave: "Save settings",
    ghRepo: "Repo (owner/name)",
    ghToken: "Token",
    saved: "saved",
    notSet: "not set",
    keepBlank: "Leave blank to keep existing",
    syncSection: "Sync behaviour",
    useMock: "Use mock store reviews",
    minRatingLabel: "Create issues when rating ≤",
    ascSection: "App Store Connect (live)",
    ascHint: "Required when mock mode is off. Private key is encrypted at rest.",
    appId: "App ID",
    issuerId: "Issuer ID",
    keyId: "Key ID",
    privateKey: "Private key (.p8 PEM)",
    playSection: "Google Play (live)",
    packageName: "Package name",
    serviceJson: "Service account JSON",
    storeIos: "App Store",
    storePlay: "Google Play",
    fetched: "fetched",
    created: "issues",
    merged: "merged",
  },
} as const;

export type CopyKey = keyof (typeof dict)["zh"];

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: CopyKey) => string;
} | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const saved = localStorage.getItem("sti-locale");
    if (saved === "en" || saved === "zh") setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const value = useMemo(() => {
    return {
      locale,
      setLocale: (l: Locale) => {
        setLocaleState(l);
        localStorage.setItem("sti-locale", l);
      },
      t: (key: CopyKey) => dict[locale][key],
    };
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useT outside LocaleProvider");
  return ctx;
}

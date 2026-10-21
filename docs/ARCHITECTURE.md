# StoreToIssues 架构

个人项目。把 **App Store + Google Play 评价** 拉下来，**合并重复投诉**，写成 **GitHub Issue**。

进度见 [PROGRESS.md](./PROGRESS.md)。  
公网：https://store.ypmyjob.fun · 本地：http://localhost:3000

## 目录

```text
store-to-issues/
├── prisma/schema.prisma     数据模型（Neon Postgres）
├── vercel.json              每天 cron（Hobby）
├── scripts/ship.sh          推送 + Vercel 生产部署
├── scripts/db-query.mjs     Neon SQL
├── docs/                    进度 / 业务 / 部署 / 推广
└── src/
    ├── app/                 页面与 API
    ├── components/
    └── lib/                 sync、queue、stores、github、creem、rate-limit…
```

## 页面

| 路径 | 作用 |
|------|------|
| `/` | 落地 + Waitlist（中英） |
| `/register` `/login` | 注册 / 登录 |
| `/forgot-password` `/reset-password` `/verify-email` | 找回 / 验证 / 改邮确认 |
| `/dashboard` | 同步、待修 Issue、评价、订阅状态 |
| `/settings` | GitHub / ASC / Play；改密 / 改邮 |
| `/pricing` | $12/月 + Checkout |
| `/privacy` `/terms` `/contact` | 法务与联系 |

## API（摘要）

| 路径 | 作用 |
|------|------|
| `/api/auth/*` | 注册登录、改密、改邮、验证、重置 |
| `/api/settings` | 每用户配置（密钥加密） |
| `/api/sync` | 入队并立即执行 `SyncJob`（402 未订阅） |
| `/api/reviews` | 评价、SyncRun、Issue 开闭状态 |
| `/api/billing/checkout\|portal\|webhook` | **Creem 优先**；Stripe 备用 |
| `/api/cron/sync` | 日更：入队 eligible 用户再消化 |
| `/api/health` | db / billing / creem / stripe |
| `/api/contact` `/api/waitlist` | 联系与候补 |

## 同步流水线

```text
登录用户（试用 / active / admin）
  → enqueue SyncJob（同用户 running 则 409）
  → 读 UserSettings，解密密钥 → applyCredentialsEnv
  → 拉 ASC + Play（或 mock；可翻页，REVIEW_MAX_PAGES）
  → 429/5xx：fetchWithRetry / withRetry
  → 星级 ≤ minRating 才建 Issue
  → clusterKey 重叠 ≥ 50% → 同一 Issue 评论
  → GitHub（写间隔 + 状态查询并发上限）
  → Review / SyncRun / SyncJob 收尾
```

核心：`sync.ts`、`sync-queue.ts`、`rate-limit.ts`、`stores.ts`、`apple.ts`、`google-play.ts`、`github.ts`、`creem.ts`。

## 数据模型（Prisma）

| 表 | 内容 |
|----|------|
| `User` | 邮箱、密码、`emailVerifiedAt`、`isAdmin`、`planStatus`、试用；`stripeCustomerId` 兼存 Creem `cust_*` |
| `UserSettings` | GitHub / ASC / Play |
| `Review` | 评价、聚类键、Issue 号 |
| `SyncRun` | 每次同步摘要 |
| `SyncJob` | pending/running/ok/error；manual \| cron |
| `EmailToken` | verify \| reset \| email_change（`payload`=新邮箱） |
| `ContactMessage` / `WaitlistEntry` | 联系与候补 |

## 安全

- 会话：`iron-session`（`SESSION_SECRET`）
- 密钥：AES-256-GCM（`ENCRYPTION_KEY`）
- 邮件：Resend；支持邮箱 `SUPPORT_EMAIL`
- Cron：`Bearer CRON_SECRET`
- 认证 API：`force-dynamic`

## 计费

- **生产：Creem MoR**（中国个人可开；Live 已审过）
- Webhook：`creem-signature` HMAC；事件开通/取消 → `planStatus`
- Stripe 代码保留作备用；未配 Creem 时若有 Stripe 密钥可走 Stripe

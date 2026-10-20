# StoreToIssues 架构

个人项目。把 **App Store + Google Play 评价** 拉下来，**合并重复投诉**，写成 **GitHub Issue**。

本地地址：http://localhost:3000

## 目录

```text
store-to-issues/
├── prisma/schema.prisma     数据模型（本地 SQLite）
├── vercel.json              生产每小时 cron
├── DEPLOY.md                上线清单
├── docs/
│   ├── ARCHITECTURE.md      本文件
│   └── BUSINESS.md          业务说明
└── src/
    ├── app/                 页面与 API（Next.js App Router）
    ├── components/          客户端表单与面板
    └── lib/                 同步、商店、GitHub、计费、加密
```

## 页面

| 路径 | 作用 |
|------|------|
| `/` | 英文落地页 + Waitlist |
| `/register` `/login` | 注册 / 登录 |
| `/dashboard` | 同步、评价列表、试用状态 |
| `/settings` | GitHub / ASC / Play 配置 |
| `/pricing` | $12/月 + Checkout |

## API

| 方法 | 路径 | 作用 |
|------|------|------|
| POST | `/api/auth/register` `/login` `/logout` | 账号 |
| GET | `/api/auth/me` | 当前用户与试用/订阅状态 |
| GET/PUT | `/api/settings` | 每用户配置（密钥加密后入库） |
| POST | `/api/sync` | 登录且试用/付费有效时同步 |
| GET | `/api/reviews` | 当前用户评价与同步记录 |
| POST | `/api/billing/checkout` | Stripe 订阅 |
| POST | `/api/billing/portal` | Stripe 客户门户 |
| POST | `/api/billing/webhook` | Stripe 回调 |
| GET/POST | `/api/cron/sync` | 定时同步（生产需 `CRON_SECRET`） |
| POST | `/api/waitlist` | 落地页邮箱 |
| GET | `/api/health` | 数据库与 Stripe 是否配置 |

## 同步流水线

```text
登录用户
  → 读 UserSettings，解密密钥
  → 拉 App Store + Google Play（或 mock）
  → 星级 ≤ minRating 才建 Issue
  → clusterKey 重叠 ≥ 50% 则评论到同一 Issue
  → GitHub Issues API
  → 写入 Review / SyncRun（按 userId）
```

核心文件：`src/lib/sync.ts`、`stores.ts`、`cluster.ts`、`github.ts`、`apple.ts`、`google-play.ts`。

## 数据模型（Prisma）

| 表 | 内容 |
|----|------|
| `User` | 邮箱、密码哈希、`planStatus`、`trialEndsAt`、Stripe id |
| `UserSettings` | GitHub / ASC / Play；敏感字段加密 |
| `Review` | 评价原文、聚类键、对应 Issue 号 |
| `SyncRun` | 每次同步结果 |
| `WaitlistEntry` | 落地页邮箱 |

本地库：`prisma/dev.db`（`DATABASE_URL=file:./dev.db`）。

## 安全（本地 MVP）

- 会话：`iron-session` cookie（`SESSION_SECRET`）
- 密钥：`src/lib/crypto.ts` AES-256-GCM（`ENCRYPTION_KEY`）
- 生产 cron：必须带 `Authorization: Bearer CRON_SECRET`

## 本地与生产差异

| | 本地 | 生产（见 DEPLOY.md） |
|--|------|----------------------|
| 数据库 | SQLite | 需改 Prisma 为 PostgreSQL |
| 商店数据 | 默认 mock | Settings 关 mock 并填真凭证 |
| 定时 | 手动点 Sync | Vercel Cron 每小时 |
| 收款 | 可不配 Stripe，14 天试用仍可同步 | Checkout / Webhook |

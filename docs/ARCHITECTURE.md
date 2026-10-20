# StoreToIssues 架构

个人项目。把 **App Store + Google Play 评价** 拉下来，**合并重复投诉**，写成 **GitHub Issue**。

进度见 [PROGRESS.md](./PROGRESS.md)。  
公网：https://store-to-issues.vercel.app · 本地：http://localhost:3000

## 目录

```text
store-to-issues/
├── prisma/schema.prisma     数据模型（生产 Postgres / Neon）
├── vercel.json              生产每天 cron（Hobby 限制）
├── DEPLOY.md                上线清单
├── docs/
│   ├── PROGRESS.md          进度与功能
│   ├── ARCHITECTURE.md      本文件
│   ├── BUSINESS.md          业务说明
│   └── DEPLOY-BEGINNER-CN.md
└── src/
    ├── app/                 页面与 API（Next.js App Router）
    ├── components/          客户端表单与面板
    └── lib/                 同步、商店、GitHub、计费、邮件、加密
```

## 页面

| 路径 | 作用 |
|------|------|
| `/` | 落地页 + Waitlist（中英） |
| `/register` `/login` | 注册 / 登录 |
| `/forgot-password` `/reset-password` `/verify-email` | 找回密码 / 验证邮箱 |
| `/dashboard` | 同步、待修 Issue、评价、试用状态 |
| `/settings` | GitHub / ASC / Play 配置 |
| `/pricing` | $12/月 + Checkout 入口 |
| `/privacy` `/terms` `/contact` | 法务与联系 |

## API

| 方法 | 路径 | 作用 |
|------|------|------|
| POST | `/api/auth/register` `/login` `/logout` | 账号 |
| GET | `/api/auth/me` | 当前用户与试用/订阅/验证状态 |
| POST | `/api/auth/forgot-password` `/reset-password` `/verify-email` | 邮件相关 |
| GET/PUT | `/api/settings` | 每用户配置（密钥加密后入库） |
| POST | `/api/sync` | 登录且试用/付费/管理员有效时同步 |
| GET | `/api/reviews` | 评价、同步记录、Issue 队列与开关状态 |
| POST | `/api/contact` | 联系表单（入库 + 邮件支持邮箱） |
| POST | `/api/billing/checkout` | Stripe 订阅（需配置密钥） |
| POST | `/api/billing/portal` | Stripe 客户门户 |
| POST | `/api/billing/webhook` | Stripe 回调 |
| GET/POST | `/api/cron/sync` | 定时同步（生产需 `CRON_SECRET`） |
| POST | `/api/waitlist` | 落地页邮箱 |
| GET | `/api/health` | 健康检查 |

## 同步流水线

```text
登录用户
  → 读 UserSettings，解密密钥
  → 拉 App Store + Google Play（或 mock）
  → 星级 ≤ minRating 才建 Issue
  → clusterKey 重叠 ≥ 50% 则评论到同一 Issue
  → GitHub Issues API
  → 写入 Review / SyncRun（按 userId）
  → 控制台拉取 Issue open/closed 状态
```

核心文件：`src/lib/sync.ts`、`stores.ts`、`cluster.ts`、`github.ts`、`apple.ts`、`google-play.ts`、`email.ts`。

## 数据模型（Prisma）

| 表 | 内容 |
|----|------|
| `User` | 邮箱、密码哈希、`emailVerifiedAt`、`isAdmin`、`planStatus`、试用与 Stripe id |
| `UserSettings` | GitHub / ASC / Play；敏感字段加密 |
| `Review` | 评价原文、聚类键、对应 Issue 号 |
| `SyncRun` | 每次同步结果 |
| `EmailToken` | 验证 / 重置密码令牌（哈希存储） |
| `ContactMessage` | 联系表单 |
| `WaitlistEntry` | 落地页邮箱 |

生产：Neon Postgres（`DATABASE_URL`）。本地亦可连同一 Neon。

## 安全

- 会话：`iron-session` cookie（`SESSION_SECRET`）
- 密钥：`src/lib/crypto.ts` AES-256-GCM（`ENCRYPTION_KEY`）
- 邮件：Resend（`RESEND_API_KEY`）；支持邮箱 `SUPPORT_EMAIL`
- 生产 cron：`Authorization: Bearer CRON_SECRET`
- 认证相关 API：`dynamic = force-dynamic`，避免会话被错误缓存

## 计费注意

大陆个人通常无法直接开 Stripe。代码保留 Stripe 骨架；上线收款优先评估 Creem 等 MoR（见 DEPLOY-BEGINNER-CN）。

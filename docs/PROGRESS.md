# StoreToIssues 进度与功能清单

更新：2026-10-25

| | |
|--|--|
| **公网** | https://store.ypmyjob.fun |
| **备用** | https://store-to-issues.vercel.app |
| **代码** | https://github.com/yipeng7816/store-to-issues |
| **演示 Issue** | https://github.com/yipeng7816/store-to-issues-demo |
| **支持邮箱** | `ymyjobp@163.com`（`SUPPORT_EMAIL`） |
| **定价** | $12/月 · 14 天试用 · Creem |

---

## 一句话进度

**v1 产品已上线可卖。**  
域名、Creem Live 审核通过、同步队列 / 限流 / 翻页、改密改邮、中英界面、法务联系均已齐。  

**收款与发信已闭环**（Creem Payout + 真卡付过一笔；Resend `mail.ypmyjob.fun` 已验证）。  
**待办：** 真商店 API（需自有 App）、对外推广与 `EXPERIMENT_START`。见 [OWNER-CHECKLIST.md](./OWNER-CHECKLIST.md)。

---

## 里程碑（按时间）

| 状态 | 事项 |
|------|------|
| ✅ | Neon Postgres + Vercel 生产部署 |
| ✅ | Mock 同步 → GitHub Issue（已测） |
| ✅ | 中英 UI、待修 Issue 队列、法务 / 联系 / 找回密码 |
| ✅ | Creem Checkout / Portal / Webhook；店铺 **Live 审核通过** |
| ✅ | 自定义域名 `store.ypmyjob.fun`（阿里云 DNS → Vercel） |
| ✅ | API 限流退避、ASC/Play 翻页、`SyncJob` 队列 |
| ✅ | 设置页改密码 / 改邮箱 |
| ✅ | Vitest 自动化回归（`npm test`，见 [TEST.md](./TEST.md)） |
| ✅ | Creem Payout（支付宝）+ 真卡付一笔（Live $12，2026-10-23） |
| ✅ | Resend `mail.ypmyjob.fun` 验证；生产 `EMAIL_FROM=noreply@mail.ypmyjob.fun` |
| ✅ | 控制台同步摘要随 EN/中文切换（2026-10-24 已部署） |
| ✅ | 合并只进当前仓库仍打开的 Issue；短评 / dry-run / 写入中断不再拆出重复 Issue（2026-10-25） |
| ⏳ | 真 ASC / Play 密钥端到端（无公开沙箱；本地可用 `scripts/test-google-play.ts --live`） |
| ⏳ | 对外发帖；填写 `EXPERIMENT_START` 开始 14/60/120 天闸门 |

---

## 已完成功能

### 产品

| 模块 | 内容 |
|------|------|
| 落地 | 介绍、候补邮箱、中英切换 |
| 账号 | 注册 / 登录 / 退出；会话 cookie；改密；改邮（新邮箱确认） |
| 邮件 | 注册验证、找回重置、改邮确认（Resend · `mail.ypmyjob.fun`） |
| 设置 | 每用户 GitHub / ASC / Play；密钥加密入库；mock、星级阈值 |
| 同步 | 双端或 mock → 星级过滤 → 合并到当前仓库的开放 Issue → GitHub |
| 工程 | `SyncJob` 防并发；Cron 入队消化；429/5xx 退避；GitHub 写间隔 + 查状态并发 4 |
| 翻页 | ASC `links.next` / Play `nextPageToken`；默认最多 10 页（`REVIEW_MAX_PAGES`） |
| 控制台 | 同步、最近记录、评价、待修 Issue（开/关可点 GitHub） |
| 计费 | 试用 / active / admin；Creem 优先，Stripe 备用 |
| 法务 | `/privacy` `/terms` `/contact` |
| 测试 | Vitest：计费门禁、聚类、加密、限流、同步/鉴权/Webhook/Cron 契约（[TEST.md](./TEST.md)） |

### 工程与上线

| 项 | 状态 |
|----|------|
| Next.js App Router + Prisma + Neon | ✅ |
| Vercel 生产 + 关 Deployment Protection | ✅ |
| 域名 HTTPS | ✅ `store.ypmyjob.fun` |
| Creem Live + Payout | ✅ Live 收款；支付宝 Payout 已配 |
| Resend 发信域 | ✅ `mail.ypmyjob.fun` Verified |
| 管理员 `isAdmin` | ✅ 可 SQL 设置 |
| `npm test`（Vitest） | ✅ 90 项；说明见 [TEST.md](./TEST.md) |

---

## 关键环境变量（生产）

| 变量 | 用途 |
|------|------|
| `DATABASE_URL` | Neon |
| `SESSION_SECRET` / `ENCRYPTION_KEY` | 会话与密钥加密 |
| `APP_URL` | `https://store.ypmyjob.fun` |
| `SUPPORT_EMAIL` | `ymyjobp@163.com` |
| `RESEND_API_KEY` / `EMAIL_FROM` | 发信；生产 `StoreToIssues <noreply@mail.ypmyjob.fun>` |
| `CREEM_API_KEY` / `CREEM_PRODUCT_ID` / `CREEM_WEBHOOK_SECRET` | 收款 |
| `CREEM_TEST_MODE` | 正式为 `false`；测试 Key 须 `creem_test_` 前缀 |
| `CRON_SECRET` | 日更同步鉴权 |
| `REVIEW_MAX_PAGES` | 商店翻页上限，默认 10 |
| `USE_MOCK_REVIEWS` / `MIN_RATING` / `GITHUB_*` | 默认同步行为（也可每用户设置覆盖） |

Webhook：`https://store.ypmyjob.fun/api/billing/webhook`  
正式商品 ID（示例）：`prod_47uKQPTgunVBUrsGavR5Ja`（以 Creem 后台为准）

完整示例见仓库根目录 `.env.example`。

---

## 未完成 / 不做

| 项 | 说明 |
|----|------|
| 真商店 API 实测 | 需自有 App 密钥；见 `scripts/test-google-play.ts` |
| 推广 + 实验计时 | [PROMO.md](./PROMO.md)；`BUSINESS.md` → `EXPERIMENT_START` |
| 2FA / OAuth | **v1.1** |
| 商店回评 / ASO / Gitee | **明确不做（v1）** |

---

## 用户路径

1. 打开 https://store.ypmyjob.fun → 介绍 / 价格  
2. 注册 → 可选验证邮箱 → 14 天试用  
3. 设置：GitHub `owner/repo` + Token；默认可 mock  
4. 控制台同步 → 「待修」打开 GitHub  
5. GitHub 关单后控制台显示已处理  
6. 试用结束：Creem 结账  
7. 真商店：关 mock，填 ASC 和/或 Play  

---

## 文档索引

| 文件 | 内容 |
|------|------|
| **PROGRESS.md** | **本文件：进度与清单** |
| OWNER-CHECKLIST.md | 仅主人可完成的检查表 |
| PROMO.md | 推广文案草稿 |
| RESEND-DOMAIN.md | 发信域名绑定步骤 |
| BUSINESS.md | 卖给谁、定价、实验闸门 |
| ARCHITECTURE.md | 目录、API、数据模型、流水线 |
| **TEST.md** | **自动化测试：怎么跑、覆盖表、怎么加测** |
| DEPLOY-BEGINNER-CN.md | 大陆部署与 Creem 入门 |
| DEPLOY.md | 生产英文简版 |
| `.cursor/skills/store-to-issues-ops/` | 发布 / 查库 Agent Skill |
| `scripts/ship.sh` / `db-query.mjs` | 一键发布与 SQL |

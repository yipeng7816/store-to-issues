# StoreToIssues 进度与功能清单

更新：2026-10-21

公网：https://store.ypmyjob.fun（兼：https://store-to-issues.vercel.app）  
代码：https://github.com/yipeng7816/store-to-issues  
演示 Issue 仓库：https://github.com/yipeng7816/store-to-issues-demo

---

## 一句话进度

**产品可公网使用 + Creem 正式收款已开通 + 自定义域名已挂。**  
可注册试用、mock/真商店同步、中英界面、联系与法务、找回密码/邮箱验证、Creem 订阅。  
**未完成：** 真商店密钥端到端实测、Resend 自定义发信域、对外推广与实验闸门计时。

---

## 已完成

### 产品功能

| 模块 | 内容 |
|------|------|
| 落地页 | 首页介绍、候补邮箱、中英切换 |
| 账号 | 注册 / 登录 / 退出；会话 cookie |
| 邮箱 | 注册验证、找回/重置密码（Resend）；未配密钥时有 dev 链接 |
| 设置 | 每用户 GitHub / ASC / Play；密钥加密入库；mock 开关、星级阈值 |
| 同步 | 双端拉取（或 mock）→ 过滤星级 → 模糊合并 → GitHub Issue；**ASC/Play 可翻页**（`REVIEW_MAX_PAGES`） |
| 限流 | GitHub 写间隔 + 查状态并发上限；429/5xx 退避；Cron 用户间隔 |
| 控制台 | 同步按钮、最近同步、评价列表、待修 Issue 队列 |
| 计费 | 14 天试用；**Creem Live 已审核通过**；Checkout/Portal/Webhook |
| 法务与支持 | `/privacy` `/terms` `/contact`；支持邮箱 `ymyjobp@163.com` |
| 定时 | `vercel.json` 每天一次 cron → `/api/cron/sync` |

### 工程与上线

| 项 | 状态 |
|----|------|
| Next.js + Prisma + Neon | 已用 |
| Vercel 生产 | 已上线 |
| 自定义域名 `store.ypmyjob.fun` | 已绑 + HTTPS |
| Creem 店铺审核 / Live | 已通过；需配 Payout（支付宝等）才提现 |
| 管理员 / 试用 | 库中可建 |

---

## 未完成 / 未验证

| 项 | 说明 |
|----|------|
| **真实 ASC / Play 拉取** | 翻页与重试已写，**尚未用真密钥打通** |
| **Resend 自定义发信域名** | 现用 `onboarding@resend.dev`；群发需绑域 |
| **推广** | 未发 PH / Reddit / Indie Hackers / SEO |
| **实验闸门** | BUSINESS.md：14/60/120 天从推广日起算 |
| 账号增强 | 无改邮箱、无 2FA、无 OAuth |
| 完整任务队列 | 未做；日更 + 退避目前够用 |
| 商店回评 / ASO / Gitee | **明确不做（v1）** |

---

## 功能一览（按用户路径）

1. 打开 https://store.ypmyjob.fun → 介绍 / 候补 / 价格  
2. 注册 →（可选）邮件验证 → 14 天试用  
3. 设置：GitHub `owner/repo` + Token；默认可开 mock  
4. 控制台：同步 → 「待修」打开 GitHub  
5. GitHub 关单后控制台显示已处理  
6. 试用结束：Creem 结账升级  
7. 真商店：关 mock，填 ASC 和/或 Play  

---

## 主要页面与 API

### 页面

| 路径 | 作用 |
|------|------|
| `/` | 落地 |
| `/register` `/login` `/forgot-password` `/reset-password` `/verify-email` | 账号 |
| `/dashboard` | 控制台 |
| `/settings` | 配置 |
| `/pricing` | 价格 |
| `/privacy` `/terms` `/contact` | 法务与联系 |

### API（摘要）

- 认证：`/api/auth/*`  
- 业务：`/api/settings` `/api/sync` `/api/reviews` `/api/contact` `/api/waitlist`  
- 计费：`/api/billing/checkout|portal|webhook`（Creem 优先）  
- 运维：`/api/cron/sync` `/api/health`  

---

## 文档索引

| 文件 | 内容 |
|------|------|
| `docs/PROGRESS.md` | **本文件** |
| `docs/BUSINESS.md` | 卖给谁、定价、实验闸门 |
| `docs/ARCHITECTURE.md` | 目录、API、同步流水线 |
| `docs/DEPLOY-BEGINNER-CN.md` | 部署与 Creem |
| `.cursor/skills/store-to-issues-ops/` | 发布/查库 Skill |
| `scripts/ship.sh` / `db-query.mjs` | 一键发布与 SQL |

---

## 建议的下一刀

1. 写英文介绍帖，用正式域名开始 14 天陌生人注册实验  
2. Creem 配好 Payout（支付宝），自己真卡测一笔  
3. 有 App 后关 mock 测真商店 API  
4. 需要群发邮件时在 Resend 绑域名  

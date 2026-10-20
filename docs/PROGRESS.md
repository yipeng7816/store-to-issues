# StoreToIssues 进度与功能清单

更新：2026-10-20

公网：https://store-to-issues.vercel.app  
代码：https://github.com/yipeng7816/store-to-issues  
演示 Issue 仓库：https://github.com/yipeng7816/store-to-issues-demo

---

## 一句话进度

**本地 MVP + 公网部署已完成。**  
可注册试用、mock 同步出 GitHub Issue、中英界面、联系与法务页、找回密码/邮箱验证（依赖 Resend）。  
**未完成：** 真实商店 API 实测、Creem 密钥填入与实付测试、自定义域名、对外推广。

---

## 已完成

### 产品功能

| 模块 | 内容 |
|------|------|
| 落地页 | 首页介绍、候补邮箱、中英切换 |
| 账号 | 注册 / 登录 / 退出；会话 cookie |
| 邮箱 | 注册验证、找回/重置密码（Resend）；未配密钥时有 dev 链接 |
| 设置 | 每用户 GitHub / ASC / Play；密钥加密入库；mock 开关、星级阈值 |
| 同步 | 双端拉取（或 mock）→ 过滤星级 → 模糊合并 → GitHub Issue |
| 控制台 | 同步按钮、最近同步、评价列表、**待修 Issue 队列**（开/关状态、可点开 GitHub） |
| 计费 | 14 天试用；**Creem** Checkout/Portal/Webhook 已接（优先）；Stripe 作备用；缺密钥时结账不可用 |
| 法务与支持 | `/privacy` `/terms` `/contact`；页脚展示支持邮箱 |
| 定时 | `vercel.json` 每天一次 cron → `/api/cron/sync`（Hobby 限制，非每小时） |

### 工程与上线

| 项 | 状态 |
|----|------|
| Next.js App Router + Prisma + Postgres（Neon） | 已用 |
| Vercel 生产部署 | 已上线 |
| 环境变量（库、会话、加密、GitHub、Resend、SUPPORT_EMAIL） | 已配 |
| 关闭 Vercel Deployment Protection | 已关（公网可直接打开） |
| 管理员账号 / 试用账号 | 库中可建；`isAdmin` 解锁全功能 |

---

## 未完成 / 未验证

| 项 | 说明 |
|----|------|
| **真实 App Store / Google Play 拉取** | 代码有，**从未用真密钥打通**；关 mock 需填 ASC/Play |
| **收款密钥** | 代码已接 Creem；需在 [creem.io](https://www.creem.io/) 建店、建 $12/月商品，把 `CREEM_*` 填进 Vercel 并测一笔 |
| **自定义域名** | 仍用 `*.vercel.app` |
| **Resend 自定义发信域名** | 现用 `onboarding@resend.dev`，仅适合测已验证邮箱；正式给任意用户发信需绑域名 |
| **推广** | 未发 PH / Reddit / Indie Hackers / SEO |
| **实验闸门** | 见 BUSINESS.md：14/60/120 天指标尚未开始计时验收 |
| 找回密码以外的账号能力 | 无改邮箱、无 2FA、无 OAuth 登录 |
| 商店回评 / ASO / Gitee | **明确不做（v1）** |

---

## 功能一览（按用户路径）

1. 打开站点 → 看介绍 / 候补 / 价格  
2. 注册 →（可选）邮件验证 → 14 天试用  
3. 设置：填 GitHub `owner/repo` + Token；默认可开 mock  
4. 控制台：开始同步 → 差评合并成 Issue →「待修」里点开 GitHub  
5. 修好后在 GitHub 关 Issue → 控制台显示已处理  
6. 忘记密码 / 联系我们 / 看隐私与条款  
7. 试用结束后：配好 Creem 后可结账升级；未配密钥时只能试用/管理员  


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

- 认证：`/api/auth/*`（register/login/logout/me/forgot/reset/verify）  
- 业务：`/api/settings` `/api/sync` `/api/reviews` `/api/contact` `/api/waitlist`  
- 计费：`/api/billing/checkout|portal|webhook`  
- 运维：`/api/cron/sync` `/api/health`  

更细见 `ARCHITECTURE.md`。

---

## 文档索引

| 文件 | 内容 |
|------|------|
| `docs/PROGRESS.md` | **本文件：进度与功能** |
| `docs/BUSINESS.md` | 卖给谁、定价叙事、实验闸门 |
| `docs/ARCHITECTURE.md` | 目录、API、同步流水线 |
| `docs/DEPLOY-BEGINNER-CN.md` | 外网部署入门（大陆、无国外卡） |
| `DEPLOY.md` | 生产清单（英文简版） |
| `README.md` | 仓库入口 |
| `.cursor/skills/store-to-issues-ops/` | 发布/查库 Agent Skill |
| `scripts/ship.sh` / `db-query.mjs` | 一键发布与 SQL |

---

## 建议的下一刀（非代码强制）

1. 写一篇英文介绍帖，带上公网链接，开始 14 天陌生人注册实验  
2. 在 Creem 后台建商品 → 填 Vercel `CREEM_*` → 测一笔 → Redeploy  

3. 有自己的 App 后再测真商店 API  
4. 需要正式群发邮件时，在 Resend 绑定域名  

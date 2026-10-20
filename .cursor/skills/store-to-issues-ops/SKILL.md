---
name: store-to-issues-ops
description: >-
  Ship and operate the personal StoreToIssues app (commit/push, Vercel prod
  deploy, Neon SQL, env checks, Resend/support). Use when the user asks to
  发布、部署、ship、上线、查库、查用户、跑 SQL、改 SUPPORT_EMAIL、或改完代码自动推送部署
  for store-to-issues / StoreToIssues.
---

# StoreToIssues 运维（发布 · 查库）

项目根目录：`store-to-issues/`（workspace 下 `myIdea/store-to-issues`）。  
公网：https://store-to-issues.vercel.app  
规则：个人项目，**禁止 Multica**。

## 何时用

- 改完代码要 **提交 + 推 GitHub + Vercel 生产部署**
- **查 Neon 库**（用户、同步、联系表单等）
- 改环境变量后 **Redeploy**
- 用户说「ship / 发布 / 上线 / 查库」

## 改完代码 → 自动发布（默认流程）

在项目根执行（优先用脚本）：

```bash
# 仅推送已有提交并部署
bash scripts/ship.sh

# 先提交再推送部署（消息用英文一句 why）
bash scripts/ship.sh --commit "$(cat <<'EOF'
Short why-focused commit message.

EOF
)"
```

### Agent 手工步骤（脚本失败时）

1. **不要**把 `.env` / `.env.local` / `.env.vercel` / 密钥提交进 Git。  
2. `git add` 相关源码；`git commit`（用户未禁止提交时；发布场景视为已授权）。  
3. Push 时清掉 shell 里的 fine-grained token 干扰，并优先 HTTP/1.1：

```bash
GIT_HTTP_VERSION=1.1 env -u GH_TOKEN -u GITHUB_TOKEN git push -u origin HEAD
```

4. 生产部署：

```bash
vercel --prod --yes
```

5. 回用户生产 URL；若 build 失败，读 Vercel 日志修后重跑 `ship.sh`。

### Prisma 变更

```bash
npx prisma migrate dev --name <name>
# 生产库已是 Neon：migrate 打到 DATABASE_URL
npx prisma generate   # package.json build/postinstall 也会跑
bash scripts/ship.sh --commit "Add migration <name>."
```

### 常见坑

| 现象 | 处理 |
|------|------|
| Push 超时 / HTTP2 framing | `GIT_HTTP_VERSION=1.1`；换网络后再 `ship.sh` |
| Hobby cron 报每小时不允许 | `vercel.json` 保持每天一次 `0 0 * * *` |
| 登录后又踢回登录 | 勿开 Vercel Deployment Protection（SSO）；会话 API 保持 `force-dynamic` |
| Build 报 Prisma 缺字段 | 确认 migration 已提交；`prisma generate` 在 build 里 |

## 数据库查询

`.env` 里 `DATABASE_URL` 指向 Neon。只读默认：

```bash
node scripts/db-query.mjs 'SELECT id, email, "planStatus", "isAdmin", "emailVerifiedAt" FROM "User" ORDER BY "createdAt" DESC LIMIT 20'

node scripts/db-query.mjs 'SELECT id, email, left(body, 80) AS preview, "createdAt" FROM "ContactMessage" ORDER BY "createdAt" DESC LIMIT 20'

node scripts/db-query.mjs 'SELECT id, status, fetched, "createdIssues", "mergedInto", "startedAt" FROM "SyncRun" ORDER BY "startedAt" DESC LIMIT 10'
```

写操作必须显式：

```bash
node scripts/db-query.mjs --allow-write 'UPDATE "User" SET "isAdmin" = true, "planStatus" = '\''active'\'' WHERE email = '\''someone@example.com'\'''
```

### 常用运维动作（Agent）

- **升管理员**：`isAdmin=true` + `planStatus=active`（见上，`--allow-write`）  
- **已有用户标已验证**：`UPDATE "User" SET "emailVerifiedAt" = NOW() WHERE "emailVerifiedAt" IS NULL`  
- **表是否存在**：`SELECT tablename FROM pg_tables WHERE schemaname='public'`

禁止：在聊天里打印 `DATABASE_URL`、Resend/GitHub/Stripe 密钥。

## 环境变量（Vercel）

查看：`vercel env ls`  

添加（示例，值从用户处来，勿回显完整密钥）：

```bash
printf '%s' 'value' | vercel env add NAME production
printf '%s' 'value' | vercel env add NAME preview
```

改完 env 后必须再 `bash scripts/ship.sh` 或 `vercel --prod --yes`。

相关键：`DATABASE_URL` `SESSION_SECRET` `ENCRYPTION_KEY` `APP_URL` `CRON_SECRET` `GITHUB_*` `RESEND_API_KEY` `EMAIL_FROM` `SUPPORT_EMAIL` `USE_MOCK_REVIEWS`  
收款（Creem）：`CREEM_API_KEY` `CREEM_PRODUCT_ID` `CREEM_WEBHOOK_SECRET` `CREEM_TEST_MODE`  
Webhook：`https://store-to-issues.vercel.app/api/billing/webhook`

## 邮件自测（线上）

本机常连不上 Resend；让用户浏览器测，或 Agent 在能访问公网时：

- https://store-to-issues.vercel.app/forgot-password  
- https://store-to-issues.vercel.app/contact  

## 文档

- 进度：`docs/PROGRESS.md`  
- 部署入门：`docs/DEPLOY-BEGINNER-CN.md`  

改功能后若进度有变，同步改 `docs/PROGRESS.md` 再 ship。

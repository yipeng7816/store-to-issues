# StoreToIssues 自动化测试

更新：2026-10-21

回归已上线功能：正常路径契约要对，异常要返回正确状态码与 `error` 文案。  
**不替代**真商店密钥 / Creem 真卡 / Resend 绑域（那些见 [OWNER-CHECKLIST.md](./OWNER-CHECKLIST.md)）。

---

## 怎么跑

```bash
cd store-to-issues
npm test              # 一次跑完（CI / 改完代码后）
npm run test:watch    # 改文件自动重跑
```

- 框架：**Vitest**（`vitest.config.ts`）
- 用例位置：`src/**/*.test.ts`（与源码同目录）
- 当前约 **72** 项；全绿即可认为本轮回归通过
- 测试会 **mock** Prisma / session / 外部 API，**不会**写生产库、不会打真 Creem/GitHub（除非某用例误连；保持 mock 路径与 route 的 `import` 相对路径一致）

旧脚本仍可用：`npx tsx scripts/verify-crypto.ts`（加密冒烟；已并入 `crypto.test.ts`）。

---

## 覆盖清单（对照产品承诺）

| 模块 | 文件 | 正常 | 异常 / 告警 |
|------|------|------|-------------|
| 计费门禁 | `src/lib/billing.test.ts` | admin / active / 试用中可同步 | 试用过期 `trial_expired`；canceled / none / past_due 拒绝 |
| 差评聚类 | `src/lib/cluster.test.ts` | mock 双端登录崩溃、支付投诉应合并（≥50%） | 好评不并入崩溃簇 |
| 密钥加密 | `src/lib/crypto.test.ts` | 加解密往返、`enc:v1:` | 篡改密文抛错；legacy 明文透传 |
| 限流重试 | `src/lib/rate-limit.test.ts` | 429 后成功；`mapPool` 并发 | 401 不重试；重试用尽仍抛错 |
| 商店拉取 | `src/lib/stores.test.ts` | 单端失败 → `warnings` 继续 | 双端失败 → throw |
| 同步队列 | `src/lib/sync-queue.test.ts` | 入队执行成功 | 已在 running → 明确错误；`runSync` 失败 → job `error` |
| GitHub 写入 | `src/lib/github.test.ts` | 缺 token/repo → `dryRun` | repo 格式非法 → dry-run |
| Creem 工具 | `src/lib/creem.test.ts` | 签名校验、test/live API base | 缺签 / 错签 → false |
| Token 哈希 | `src/lib/tokens.test.ts` | raw / hash 形状 | — |
| `POST /api/sync` | `src/app/api/sync/route.test.ts` | 200 + 结果 | 401 / **402** 订阅 / **409** 并发 / 500 |
| 登录 | `src/app/api/auth/login/route.test.ts` | 落 session | 未知邮箱与错密同一 401 文案（防枚举） |
| 注册 | `src/app/api/auth/register/route.test.ts` | trialing + session | 400 校验、409 已注册 |
| 改密 | `src/app/api/auth/change-password/route.test.ts` | 更新 hash | 401；新密太短；当前密码错误 400 |
| Settings | `src/app/api/settings/route.test.ts` | GET 只暴露 `*Set`；PUT 加密入库 | 未登录 401 |
| Creem Webhook | `src/app/api/billing/webhook/route.test.ts` | checkout → active；canceled → 取消 | 签名错误 **400** |
| Cron | `src/app/api/cron/sync/route.test.ts` | Bearer 通过后入队 | 无 secret → **401** |

核心合并分数：`overlapScore` / `shouldMergeKeys` 在 `src/lib/cluster.ts`（同步流水线 `sync.ts` 复用）。

---

## 以后怎么加测

1. **纯逻辑**（优先）：在 `src/lib/foo.ts` 旁加 `foo.test.ts`，不碰 DB。
2. **API 路由**：在同目录加 `route.test.ts`，用 `vi.mock` 掉 `../../../lib/prisma`、`session` 等——**相对路径必须与 `route.ts` 的 import 一致**（多一层 `../` 会打到真库）。
3. **环境变量**：用例里改 `process.env` 时，注意 `src/lib/env.ts` 会在首次 import 时用 `.env` `override`；需要隔离时 mock `./env`，或在调用前再设回目标值（见 `stores.test.ts` / `github.test.ts`）。
4. **断言告警契约**：除了 `ok: true`，异常至少断言 `status` + `error`（或 `reason`），避免「静默成功 / 静默失败」。

建议回归时机：改 sync / billing / auth / webhook / cron 后；发版前跑一遍 `npm test`。

---

## 刻意不测（v1）

| 项 | 原因 |
|----|------|
| 真 ASC / Play 密钥 E2E | 需自有 App；见 OWNER-CHECKLIST |
| Creem 真卡支付 | 主人操作 + Payout |
| Resend 真发信 / 自定义域 | 绑域后人工点一次即可 |
| 浏览器 UI / Playwright | 未上；关键路径已在 API 契约覆盖 |
| 连 Neon 的集成测 | 当前全 mock，避免污染生产数据 |

若以后要加「本地 Neon 集成测」，单独建 `src/**/*.integration.test.ts` 并指向临时库，不要默认并进 `npm test`。

---

## 相关

- 进度：[PROGRESS.md](./PROGRESS.md)
- 架构 / API 表：[ARCHITECTURE.md](./ARCHITECTURE.md)
- 业务门禁（402 规则）：[BUSINESS.md](./BUSINESS.md)

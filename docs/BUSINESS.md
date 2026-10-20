# StoreToIssues 业务说明

## 一句话

给独立开发者的自助订阅工具：把 App Store 和 Google Play 的差评收成去重后的 GitHub Issue，减少在两个后台里复制粘贴。

## 卖给谁

海外 indie / 小团队（约 1–10 人），自己能连 GitHub，习惯信用卡订阅，不需要销售电话。

## 用户要完成的事

1. 注册（自动 14 天试用）
2. Settings 填 `owner/repo` 和 GitHub Token（Issues 读写）
3. 本地演示可开 **Use mock store reviews**
4. Dashboard 点 **Run sync**
5. 在 GitHub 看到合并后的 Issue
6. 试用结束后走 Stripe（定价页标价 **$12/月**）

## 和竞品的差别（产品承诺）

| 做法 | 结果 |
|------|------|
| 手动复制 | 两个后台，重复投诉变成多条待办 |
| 开源周报 | 每周一大条摘要，不好直接修 |
| StoreToIssues | 双端 + 相似投诉合并成一条可修 Issue |

不在范围内：商店回评、ASO、竞品榜单、国内多商店。

## 计费规则（代码已实现）

| 状态 | 能否同步 |
|------|----------|
| `trialing` 且未过期 | 可以 |
| `active` | 可以 |
| 试用过期 / `canceled` / `none` | 不可以（HTTP 402） |

未配置 `STRIPE_SECRET_KEY` + `STRIPE_PRICE_ID` 时，Checkout 会提示未配置；试用逻辑仍然生效。

## 本地怎么看

服务：http://localhost:3000

| 想看什么 | 打开 |
|----------|------|
| 对外首页 | http://localhost:3000 |
| 注册 | http://localhost:3000/register |
| 控制台 | http://localhost:3000/dashboard |
| 配置 | http://localhost:3000/settings |
| 价格 | http://localhost:3000/pricing |

演示仓库（若 Settings 已指向它）：https://github.com/yipeng7816/store-to-issues-demo/issues

## 验证标准（实验，不是代码功能）

| 时间点 | 未达到则停或改定位 |
|--------|-------------------|
| 公开后 14 天 | 没有非好友注册 |
| 60 天 | 有试用但 0 付费 |
| 120 天 | 没有第 2 个独立付费用户 |

## 还不在本仓库里的事

推广帖、域名、Vercel 账号、Stripe 商品、真实商店 API 密钥。步骤见 `DEPLOY.md`。

# StoreToIssues 业务说明

进度与功能清单见 **[PROGRESS.md](./PROGRESS.md)**（2026-10-21 更新）。

## 一句话

给独立开发者的自助订阅工具：把 App Store 和 Google Play 的差评收成去重后的 GitHub Issue，减少在两个后台里复制粘贴。

**卖的是「差评 → 可关的 GitHub Issue」工程闭环，不是评论阅读器。**

## 卖给谁

海外 indie / 小团队（约 1–10 人），自己能连 GitHub，习惯信用卡订阅，不需要销售电话。

## 用户要完成的事

1. 注册（自动 14 天试用；建议验证邮箱）
2. Settings 填 `owner/repo` 和 GitHub Token（Issues 读写）
3. 演示可开 **使用示例商店评价**；正式再关 mock 并填 ASC/Play
4. Dashboard 点同步 → 在「待修 Issue」打开 GitHub
5. 修好后在 GitHub 关单，控制台显示已处理
6. 试用结束后付费（定价页 **$12/月**；**Creem Live 已开通**；Payout 提现见 OWNER-CHECKLIST）

## 和竞品的差别（产品承诺）

| 做法 | 结果 |
|------|------|
| 手动复制 | 两个后台，重复投诉变成多条待办 |
| 开源周报 | 每周一大条摘要，不好直接修 |
| StoreToIssues | 双端 + 相似投诉合并成一条可修 Issue |

不在范围内：商店回评、ASO、竞品榜单、国内多商店、Gitee（v1）。

## 计费规则（代码已实现）

| 状态 | 能否同步 |
|------|----------|
| `trialing` 且未过期 | 可以 |
| `active` / `isAdmin` | 可以 |
| 试用过期 / `canceled` / `none` | 不可以（HTTP 402） |

未配置 Creem（或 Stripe 备用）时，Checkout 不可用；试用与管理员仍可同步。

## 线上与本地

| 环境 | 地址 |
|------|------|
| 公网 | https://store.ypmyjob.fun |
| 本地 | http://localhost:3000 |
| 演示 Issue | https://github.com/yipeng7816/store-to-issues-demo/issues |

支持邮箱：`ymyjobp@163.com`（环境变量 `SUPPORT_EMAIL`）。

## 验证标准（实验，不是代码功能）

**EXPERIMENT_START：** _（发第一篇陌生人可见推广帖的当天填入，例如 2026-10-25）_

| 时间点 | 未达到则停或改定位 |
|--------|-------------------|
| 公开后 14 天 | 没有非好友注册 |
| 60 天 | 有试用但 0 付费 |
| 120 天 | 没有第 2 个独立付费用户 |

公开部署 + 域名 + Creem Live 已完成；**实验计时从 `EXPERIMENT_START` 起算**。推广文案见 [PROMO.md](./PROMO.md)。

## 相关文档

- 进度：`docs/PROGRESS.md`
- 部署：`docs/DEPLOY-BEGINNER-CN.md`、`DEPLOY.md`
- 架构：`docs/ARCHITECTURE.md`

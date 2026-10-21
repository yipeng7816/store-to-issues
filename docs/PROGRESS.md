# StoreToIssues 进度与功能清单

更新：2026-10-21

公网：https://store.ypmyjob.fun  
代码：https://github.com/yipeng7816/store-to-issues  
演示 Issue：https://github.com/yipeng7816/store-to-issues-demo

---

## 一句话进度

**v1 产品代码已收口。** 域名、Creem Live、同步队列、限流翻页、改密/改邮、推广与 Resend 文档齐全。  
**仅剩你本人操作：** Payout、真卡、Resend 绑域、真商店密钥、发推广帖（见 [OWNER-CHECKLIST.md](./OWNER-CHECKLIST.md)）。

---

## 已完成（代码 / 上线）

| 模块 | 内容 |
|------|------|
| 落地 / i18n / 账号 | 注册登录、试用、法务、联系 |
| 邮件 | 验证 / 重置 / 改邮确认（Resend） |
| 设置 | GitHub + ASC + Play；账号改密 / 改邮 |
| 同步 | mock/真商店、聚类、Issue；**SyncJob 队列**；翻页；429 退避 |
| 计费 | Creem Checkout / Portal / Webhook；Live 已通过 |
| 域名 | `store.ypmyjob.fun` |
| 文档 | PROMO、RESEND-DOMAIN、OWNER-CHECKLIST、实验闸门占位 |

## 明确不做（v1）

商店回评、ASO、Gitee、2FA、OAuth（→ v1.1）。

## 待你完成

见 [OWNER-CHECKLIST.md](./OWNER-CHECKLIST.md)。

---

## 文档索引

| 文件 | 内容 |
|------|------|
| `PROGRESS.md` | 本文件 |
| `OWNER-CHECKLIST.md` | 仅主人可做的检查表 |
| `PROMO.md` | 推广文案草稿 |
| `RESEND-DOMAIN.md` | 发信域名绑定 |
| `BUSINESS.md` | 定位与实验闸门 |
| `DEPLOY-BEGINNER-CN.md` | 部署 / Creem |
| `store-to-issues-ops` skill | 发布 / 查库 |

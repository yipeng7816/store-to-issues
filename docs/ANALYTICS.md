# 流量与使用看板

## 管理员页面

登录 **isAdmin** 账号后，导航栏出现 **看板**，或打开 `/admin`。

展示近 30 天（UTC）：

- 页面浏览、独立访客（自建统计）
- 注册、登录、同步成功（产品事件）
- 总用户、验证邮箱、已配 GitHub、7 日活跃、热门路径、最近注册

## 数据来源

| 层 | 作用 |
|----|------|
| **Vercel Web Analytics** | 托管侧访问曲线；在 Vercel 项目 → Analytics 启用 |
| **`AnalyticsPageView`** | 首方页面浏览（匿名 `localStorage` visitor id，不存 IP） |
| **`AnalyticsProductEvent`** | 成功：`register` / `login` / `sync_ok` / `checkout_start` |
| | 失败（看板「最近报错」）：`*_error`、`*_failed`（如 `register_failed`、`settings_error`、`sync_error`） |
| **`User.lastLoginAt`** | 上次登录时间 |

## 上线迁移

生产 Neon 需执行迁移（本地已含 `20261027090000_analytics`）：

```bash
npx prisma migrate deploy
```

未迁移时埋点会静默失败，看板查询可能报错直至表存在。

## SQL 备用

```bash
node scripts/db-query.mjs 'SELECT count(*) FROM "AnalyticsPageView"'
node scripts/db-query.mjs 'SELECT name, count(*) FROM "AnalyticsProductEvent" GROUP BY 1'
```

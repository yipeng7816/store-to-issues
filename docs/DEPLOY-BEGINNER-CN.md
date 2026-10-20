# 外网部署入门（从没部署过也能跟）

面向：大陆个人、没有国外银行卡、第一次把 Next.js 挂到公网。  
目标：先让陌生人能打开、注册、试用；收款可以第二步再接。

---

## 先回答你最关心的：要不要国外银行卡？

**不必须。** 分清楚两件事：

| 事 | 要不要国外卡 |
|----|----------------|
| 网站部署到 Vercel / Neon | **不要**。用 GitHub + 邮箱即可，免费档够起步 |
| 收美元订阅（买家用 Visa/Mastercard） | **不一定要国外卡**。大陆个人通常**不能直接开 Stripe**，但可以用「平台替你卖」（MoR）提到支付宝等 |

### 收款三条路（按你现在的情况）

| 方案 | 大概成本 | 适不适合你 | 说明 |
|------|----------|------------|------|
| **A. Creem / 同类 MoR（推荐起步）** | 约 3.9%+$0.4/笔，个人可提支付宝 | **适合** | 平台是法律卖方，管税；你接 Checkout，钱提到支付宝。费率比 Stripe 高，但不用美国公司 |
| **B. Paddle** | 约 5%+$0.5 | 可试 | 成熟 MoR，审核偏严，结算偏慢；可电汇 / Payoneer |
| **C. Stripe Atlas 开美国公司** | Atlas 约 $500 + 每年维护/报税 | **现在不适合** | 还要美国银行（如 Mercury），固定成本高；等月流水稳定再考虑 |

**结论：**  
- 没有国外卡 → **先别走 Stripe**。代码里已有 Stripe 骨架，以后再换或加一层 MoR 即可。  
- 现在：先部署上线 → 用试用验证有没有人注册 → 有人了再接 Creem（或同类）收款。  
- 「国外银行卡」≠「买家的信用卡」。买家用他们自己的 Visa；你缺的是**卖家结算账户**，支付宝路径可以解决。

费率与政策会变，开通前以各平台官网为准。可参考汇总文：[中国独立开发者收款平台怎么选](https://gaome.de/posts/indie-developer-payment-platforms-cn/)。

---

## 整体路线图（建议顺序）

```
1. GitHub 推代码
2. Neon 建 Postgres（免费）
3. 改 Prisma 为 postgresql 并迁移
4. Vercel 导入项目、填环境变量、部署
5. 打开公网网址，注册测一遍
6.（有人试用后再做）接 Creem/Paddle 收款
7.（可选）买域名指到 Vercel
```

预计纯部署：**一个下午到一天**（含注册账号、等构建）。  
收款：**另开一天**，且建议等有陌生人注册后再做。

---

## 第 0 步：你需要准备什么

- [ ] GitHub 账号（你已有 `yipeng7816`）
- [ ] 能访问外网的网络（部署、登录 Vercel/Neon）
- [ ] 邮箱（Vercel / Neon 注册用）
- [ ] 本机已能 `npm run dev` 跑通 StoreToIssues（你已具备）

不需要：国外卡、美国公司、域名（先用 `xxx.vercel.app` 即可）。

---

## 第 1 步：把代码推到 GitHub

若仓库还只在本地：

1. 在 GitHub 新建空仓库，例如 `store-to-issues`（Private 也可）。
2. 本机在项目目录执行（把 `YOUR_USER` 换成你的）：

```bash
cd "/Users/yipeng/myProjects/项目/myIdea/store-to-issues"
git remote add origin https://github.com/YOUR_USER/store-to-issues.git
git push -u origin HEAD
```

注意：

- **不要**把 `.env` 推上去（应在 `.gitignore` 里）。
- GitHub Token、Stripe 密钥只放在 Vercel 环境变量里。

---

## 第 2 步：Neon 免费 Postgres

1. 打开 [https://neon.tech](https://neon.tech) ，用 GitHub/邮箱注册。  
2. **New Project** → 区域选离用户近的（如 `US East` 或 `Singapore` 均可）。  
3. 创建后点 **Connect**，复制连接串，形如：

```text
postgresql://USER:PASSWORD@ep-xxxx.neon.tech/neondb?sslmode=require
```

4. 先存到备忘录（后面填到 Vercel）。本地也可临时写入 `.env` 的 `DATABASE_URL`（勿提交）。

免费档够早期验证（有存储/计算限额，对 MVP 足够）。

---

## 第 3 步：Prisma 改成 Postgres（生产必须）

本地开发可继续用 SQLite；**Vercel 上必须用 Postgres**。

1. 编辑 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. 本机临时把 `.env` 的 `DATABASE_URL` 换成 Neon 连接串，执行：

```bash
npx prisma migrate deploy
# 或第一次：npx prisma migrate dev --name init_postgres
```

3. 确认 Neon 控制台里能看到 `User`、`Review` 等表。

更细的清单见同目录 `DEPLOY.md`。

> 技巧：可以保留本地 SQLite 分支做开发，生产分支/`main` 用 postgresql；或始终用 Neon（本地也连 Neon），少维护两套库。

---

## 第 4 步：Vercel 部署

1. 打开 [https://vercel.com](https://vercel.com)，用 **GitHub** 登录。  
2. **Add New… → Project** → 选中你的 `store-to-issues` 仓库。  
3. Framework 应识别为 Next.js；Root Directory 若仓库就是项目根，保持默认。  
4. 在 **Environment Variables** 填（Production / Preview 都勾上更省事）：

| 变量 | 怎么填 |
|------|--------|
| `DATABASE_URL` | Neon 连接串 |
| `SESSION_SECRET` | 随机长字符串（≥32），可用 `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | 另一串随机（≥16） |
| `APP_URL` | 先填部署后的地址，如 `https://store-to-issues.vercel.app`（部署完若变了再改一次） |
| `CRON_SECRET` | 随机串；`vercel.json` 里的小时任务会打 `/api/cron/sync` |
| `USE_MOCK_REVIEWS` | 先 `true`（公网演示用示例评价） |
| `TRIAL_DAYS` | `14` |
| `MIN_RATING` | `3` |

**暂时可以不填：** `STRIPE_*`、真实 ASC/Play 密钥（没有国外结算也不急）。

5. 点 **Deploy**，等构建成功。  
6. 打开 `https://你的项目.vercel.app`，走一遍：注册 → 设置里填 GitHub → 同步。

若构建失败：在 Vercel → Deployment → Logs 看报错；常见是 `DATABASE_URL` 没设或 Prisma provider 仍是 sqlite。

---

## 第 5 步：上线后自测清单

- [ ] 首页能打开  
- [ ] 能注册新邮箱  
- [ ] 设置页能保存（密钥加密）  
- [ ] 示例评价同步能出 GitHub Issue（Settings 里 token + repo）  
- [ ] 退出再登录 cookie 仍在  

管理员账号只在你**本地 SQLite**里；生产是空库，需要重新注册，或以后写个一次性 seed。公网不要用弱密码。

---

## 第 6 步：以后要收钱时怎么做（没有国外卡）

1. 选 **Creem**（或当时仍支持大陆个人提现支付宝的 MoR），用大陆身份申请店铺。  
2. 在平台创建 **$12/月** 订阅商品。  
3. 改本站结账：把现在的 Stripe Checkout 换成该平台的 Checkout 链接 / SDK（一次小改造）。  
4. Webhook 里把用户 `planStatus` 设为 `active`（逻辑已有，换事件来源即可）。  
5. 等到最低提现额（常见 $20–$50）提到支付宝。

等月收入稳定、愿意付 Atlas/报税成本时，再评估美国公司 + Stripe。

---

## 第 7 步：域名（可选）

1. 任意注册商买域名（Namecheap、Cloudflare、国内注册商 overseas 后缀等）。  
2. Vercel → Project → Domains → 按提示加 A/CNAME。  
3. 把 `APP_URL` 改成 `https://你的域名`，重新部署或更新环境变量。

没有域名也能推广，用 `*.vercel.app` 即可。

---

## 费用预期（起步）

| 项 | 大约 |
|----|------|
| Vercel Hobby | $0 |
| Neon Free | $0 |
| 域名（可选） | 约 $10–15/年 |
| 收款平台 | 有成交才扣费率 |
| Stripe Atlas | **现在可跳过** |

你当前生活费紧：优先 **$0 上线**，用 14 天闸门看有没有陌生人注册，再决定是否接收款。

---

## 常见坑

1. **把 `.env` 提交到 GitHub** → 立刻轮换所有密钥。  
2. **生产仍用 SQLite 文件** → Vercel 无持久本地盘，数据会丢；必须 Postgres。  
3. **中国大陆访问 Vercel 不稳定** → 你自己调试可能要梯子；海外用户一般正常。若以后主要服务国内，再另议节点（但本产品卖海外 indie）。  
4. **一上来就开 Stripe** → 大陆个人过不了；浪费时间。  
5. **还没部署就接真实 App Store** → 非必须；mock 足够验证注册漏斗。

---

## 你现在最小行动清单

**已完成（本机）：** Neon 库已建表；代码已 `git commit`；环境变量草稿在本地 `.env.vercel`（勿提交、勿发到聊天）。

**你需要在浏览器完成（约 10 分钟）：**

### A. GitHub 登录授权（推代码）

1. 打开：https://github.com/login/device  
2. 登录你的 GitHub（`yipeng7816`）  
3. 输入一次性代码（终端里 `gh auth login` 显示的那串，例如 `XXXX-XXXX`）  
4. 授权 GitHub CLI  

完成后告诉我「GitHub 已授权」，我会执行：

```bash
gh repo create store-to-issues --public --source=. --remote=origin --push
```

### B. Vercel 部署

1. 打开 https://vercel.com → 用 **GitHub** 登录  
2. Import 仓库 `store-to-issues`  
3. Environment Variables：把本机 `.env.vercel` 里每一行贴进去（Production + Preview）  
4. Deploy  
5. 部署成功后把真实域名写回 `APP_URL`，再 Redeploy 一次  

收款、国外卡：**先不用管**；等 14 天实验出现陌生人注册，再开 Creem 类平台。

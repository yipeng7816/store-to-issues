# StoreToIssues

**App Store + Google Play reviews → deduped GitHub issues**  
Personal Mode B experiment. Do **not** use company Multica.

**Live:** https://store.ypmyjob.fun  

## Status (2026-10-21)

| | |
|--|--|
| Neon + Vercel + custom domain | Done (`store.ypmyjob.fun`) |
| Mock sync → GitHub Issues | Done / tested |
| Creem Live payments | **Approved**; configure Payout to withdraw |
| Live ASC / Play APIs | Code + paging/retries; **not** tested with real keys |
| SyncJob queue + rate limits | Done |
| Growth / experiment clock | Not started — see `docs/PROMO.md` |

Full checklist (中文：已做 / 未做 / 环境变量 / 路径): **[docs/PROGRESS.md](./docs/PROGRESS.md)**  
Owner-only leftovers: **[docs/OWNER-CHECKLIST.md](./docs/OWNER-CHECKLIST.md)**

## Features

- Landing + waitlist, zh/en UI
- Auth: register / login / logout, verify, forgot password, **change password / email**
- Per-user Settings (GitHub, ASC, Play) with encrypted secrets
- Mock or live dual-store sync + fuzzy merge → GitHub Issues
- SyncJob queue, 429 backoff, review pagination (`REVIEW_MAX_PAGES`)
- Dashboard: sync, review list, issue work queue (open/closed + links)
- 14-day trial + admin bypass; **Creem** Checkout / Portal / Webhook (Stripe fallback)
- Privacy / Terms / Contact; support `ymyjobp@163.com`
- Daily cron → `/api/cron/sync`

## Docs

| Doc | Content |
|-----|---------|
| [docs/PROGRESS.md](./docs/PROGRESS.md) | 进度与功能 |
| [docs/OWNER-CHECKLIST.md](./docs/OWNER-CHECKLIST.md) | 主人待办 |
| [docs/BUSINESS.md](./docs/BUSINESS.md) | 业务与实验闸门 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 架构 |
| [docs/DEPLOY-BEGINNER-CN.md](./docs/DEPLOY-BEGINNER-CN.md) | 部署 / Creem |
| [docs/PROMO.md](./docs/PROMO.md) | 推广文案 |
| [docs/RESEND-DOMAIN.md](./docs/RESEND-DOMAIN.md) | 发信域名 |
| [DEPLOY.md](./DEPLOY.md) | Production checklist |

## Local

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

- http://localhost:3000  
- Ship: `bash scripts/ship.sh`  
- SQL: `node scripts/db-query.mjs 'SELECT …'`  

Production DB is Neon. See `.env.example`.

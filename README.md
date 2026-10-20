# StoreToIssues

**App Store + Google Play reviews → deduped GitHub issues**  
Personal Mode B experiment. Do **not** use company Multica.

**Live:** https://store-to-issues.vercel.app  

## Status (2026-10-20)

| | |
|--|--|
| Local MVP | Done |
| Neon + Vercel production | Done |
| Mock sync → GitHub Issues | Done / tested |
| Live ASC / Play APIs | Code only, **not** tested with real keys |
| Billing for China founder | Stripe blocked; **Creem/MoR not wired yet** |
| Growth posts | Not started |

Full checklist (中文：已做 / 未做 / 功能列表): **[docs/PROGRESS.md](./docs/PROGRESS.md)**

## Features

- Landing + waitlist, zh/en UI
- Auth: register / login / logout, email verify, forgot password (Resend)
- Per-user Settings (GitHub, ASC, Play) with encrypted secrets
- Mock or live dual-store sync + fuzzy merge → GitHub Issues
- Dashboard: sync, review list, **issue work queue** (open/closed + links)
- 14-day trial + admin bypass; Stripe skeleton (Checkout / Portal / Webhook)
- Privacy / Terms / Contact + support email in footer
- Daily cron via `vercel.json` → `/api/cron/sync`

## Docs

| Doc | Content |
|-----|---------|
| [docs/PROGRESS.md](./docs/PROGRESS.md) | 进度与功能 |
| [docs/BUSINESS.md](./docs/BUSINESS.md) | 业务与实验闸门 |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 架构 |
| [docs/DEPLOY-BEGINNER-CN.md](./docs/DEPLOY-BEGINNER-CN.md) | 外网部署入门 |
| [DEPLOY.md](./DEPLOY.md) | Production checklist |

## Local

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
npm test
```

- http://localhost:3000  
- Register → Settings → Dashboard → Run sync  

Production DB is Postgres (Neon). See `.env.example`.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local server |
| `npm run build` | `prisma generate` + production build |
| `npm test` | Crypto unit check |
| `npm run db:migrate` | Prisma migrate |

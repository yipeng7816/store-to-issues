# Deploy checklist

**Live:** https://store.ypmyjob.fun  
Chinese beginner guide: [docs/DEPLOY-BEGINNER-CN.md](./docs/DEPLOY-BEGINNER-CN.md)  
Progress: [docs/PROGRESS.md](./docs/PROGRESS.md)

## Already done

- Neon Postgres + Prisma migrations
- Vercel production
- Custom domain `store.ypmyjob.fun`
- Creem Live approved (add Payout to withdraw)
- Daily cron in `vercel.json` (`0 0 * * *`) — Hobby plan

## Ship code

```bash
bash scripts/ship.sh
# or
bash scripts/ship.sh --commit "Why-focused message."
```

## Required env (Vercel)

| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Neon |
| `SESSION_SECRET` / `ENCRYPTION_KEY` | Secrets |
| `APP_URL` | `https://store.ypmyjob.fun` |
| `SUPPORT_EMAIL` | `ymyjobp@163.com` |
| `CRON_SECRET` | Cron auth |
| `CREEM_API_KEY` / `CREEM_PRODUCT_ID` / `CREEM_WEBHOOK_SECRET` | Live billing |
| `CREEM_TEST_MODE` | `false` for live; test keys must start with `creem_test_` |
| `RESEND_API_KEY` / `EMAIL_FROM` | Mail (bind domain — see docs/RESEND-DOMAIN.md) |

Webhook: `https://store.ypmyjob.fun/api/billing/webhook`

Stripe keys optional fallback. See `.env.example`.

# Deploy checklist (code-complete MVP)

## Local (done)

```bash
npm install
npx prisma migrate dev
npm run dev
```

SQLite via `DATABASE_URL="file:./dev.db"`.

## Production (Vercel + Postgres)

1. Create a Postgres DB (Neon / Supabase / Vercel Postgres).
2. In `prisma/schema.prisma`, set:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run `npx prisma migrate deploy` against that database.
4. Vercel project: import this folder, set env vars below.
5. `vercel.json` already schedules hourly `/api/cron/sync` — set `CRON_SECRET`.

## Required env

| Key | Notes |
|-----|--------|
| `DATABASE_URL` | Postgres in production |
| `SESSION_SECRET` | ≥32 chars |
| `ENCRYPTION_KEY` | ≥16 chars (secrets at rest) |
| `APP_URL` | Public site URL |
| `CRON_SECRET` | Protects cron |
| `STRIPE_SECRET_KEY` / `STRIPE_PRICE_ID` / `STRIPE_WEBHOOK_SECRET` | Billing |
| Optional store/GitHub fallbacks | Prefer per-user Settings |

Webhook URL: `https://YOUR_DOMAIN/api/billing/webhook`

# StoreToIssues

**App Store + Google Play reviews → deduped GitHub issues**  
Personal Mode B experiment. Do **not** use company Multica.

## Code status: MVP complete (local)

Application code for the sellable MVP loop is in place. Remaining work is **ops**: Postgres provider switch, Vercel env, real Stripe keys, live store credentials.

See [DEPLOY.md](./DEPLOY.md).

## Features

- Landing + waitlist
- Email/password auth + sessions
- Per-user Settings (GitHub, ASC, Play) with **encrypted secrets**
- Mock or live dual-store sync + fuzzy merge → GitHub Issues
- 14-day trial, Stripe Checkout / Portal / Webhook
- Dashboard sync UI, `/pricing`, `/api/health`
- Hourly cron via `vercel.json` → `/api/cron/sync`

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

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local server |
| `npm run build` | Production build |
| `npm test` | Crypto unit check |
| `npm run db:migrate` | Prisma migrate |

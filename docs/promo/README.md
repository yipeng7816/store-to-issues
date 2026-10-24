# Promo screenshots

Assets for [PromoHub](../PROMO.md) and English channel posts.

| File | Page | Locale |
|------|------|--------|
| `promo-landing.png` | `/` | EN (`sti-locale=en`) |
| `promo-pricing.png` | `/pricing` | EN |
| `promo-dashboard.png` | `/dashboard` | EN (login optional) |

## Regenerate (full page, not viewport-only)

From **promo-hub** (Playwright installed):

```bash
cd promo-hub
npx tsx scripts/capture-store-to-issues-promo.ts
```

Logged-in dashboard (recommended):

```bash
PROMO_LOGIN_EMAIL=you@example.com PROMO_LOGIN_PASSWORD='…' \
  npx tsx scripts/capture-store-to-issues-promo.ts
```

Override site URL (local dev):

```bash
PROMO_SCREENSHOT_BASE=http://127.0.0.1:3000 npx tsx scripts/capture-store-to-issues-promo.ts
```

Uses `fullPage: true` and 1440×900 @2x.

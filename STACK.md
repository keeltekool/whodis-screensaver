# WHO DIS? — The Wall (Screensaver) — STACK.md

> Branded hub + fullscreen celebrity photo screensaver. Gateway to the WHO DIS? experience collection.
> Last updated: 2026-04-05

## Services

| Service | Purpose | Env Var(s) |
|---------|---------|------------|
| Neon Postgres | Celebrity metadata (shared DB with WHO DIS? game, read-only) | `DATABASE_URL` |
| Cloudflare R2 | Photo CDN (shared `who-dis` bucket, read-only) | `NEXT_PUBLIC_R2_PUBLIC_URL` |
| Vercel | Hosting (Next.js 16) | — |

Env vars stored in: Vercel (2 vars), `.env.local` (local dev)

## Brand

Same Neo-Noir design system as WHO DIS? game:
- Background: `#131313` (deep charcoal)
- Accent: `#ffba20` (Vinyl Yellow)
- Text: `#e5e2e1` (warm off-white)
- Fonts: Space Grotesk (headlines), Manrope (body/labels)
- Border-radius: 0px everywhere

## Gotchas

| Issue | Fix |
|-------|-----|
| Neon `channel_binding=require` fails on Vercel | Use `sslmode=require` only in DATABASE_URL |
| Vercel env vars get trailing `\n` from shell | Use `printf` piped to `vercel env add` |

## Deployment

```bash
npm run dev -- -p 3002  # local dev (3001 used by WHO DIS? game)
vercel --prod           # production deploy
```

## Post-Deploy Smoke Tests

1. Load https://whodis-screensaver.vercel.app — hub landing page renders with 3 experience cards
2. Click "LAUNCH" → screensaver starts, photos load from R2
3. Open settings (gear icon) → change duration, verify it takes effect
4. Check console — no JS errors, no failed network requests

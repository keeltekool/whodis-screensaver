# WHO DIS? — The Wall (Screensaver) — STACK.md

> Branded hub + fullscreen celebrity photo screensaver. Gateway to the WHO DIS? experience collection.
> Last updated: 2026-09-12

## Services

| Service | Purpose | Env Var(s) |
|---------|---------|------------|
| Neon Postgres | Celebrity metadata (shared DB with WHO DIS? game, read-only) | `DATABASE_URL` |
| Cloudflare R2 | Photo CDN (shared `who-dis` bucket, read-only) | `NEXT_PUBLIC_R2_PUBLIC_URL` |
| Resend | Bi-weekly newsletter (3 rotating editions: deathmatch, spotlight, trivia) | `RESEND_API_KEY` |
| Vercel | Hosting (Next.js 16) + Cron (1st & 15th, 7AM UTC) | — |

Env vars stored in: Vercel (5 vars — BREVO removed 2026-09-12), `.env.local` (local dev)

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
| **Vercel cron sends GET, not POST** | Cron route handlers MUST export `GET`. POST = silent 405 failure. |
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
5. **Bi-weekly email:** Trigger manually: `GET /api/daily/send` with `Authorization: Bearer <CRON_SECRET>` — must return `{ sent: N, edition: "<type>" }` with `errors: 0`

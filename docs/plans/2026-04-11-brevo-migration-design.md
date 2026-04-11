# WHO DIS? — Email Provider Migration: Resend → Brevo

## Design Document
**Date:** 2026-04-11
**Status:** Approved

---

## 1. Problem

Resend free tier uses sandbox sender (`onboarding@resend.dev`) which can only deliver to the account owner's email. Even with a verified domain, Resend caps at 100 emails/day — insufficient for a daily newsletter targeting 100+ subscribers.

## 2. Solution

Replace Resend with **Brevo** (formerly Sendinblue) transactional email API.

- **Free tier:** 300 emails/day (~9,000/month), 100K contacts
- **API:** Plain REST (`POST https://api.brevo.com/v3/smtp/email`), no SDK needed
- **Auth:** `api-key` header
- **Trade-off:** Brevo branding in email footer on free tier

## 3. What Changes

| Component | Before | After |
|-----------|--------|-------|
| Email provider | Resend SDK (`resend` npm) | Brevo REST API (`fetch`) |
| Send call | `resend.emails.send()` | `POST api.brevo.com/v3/smtp/email` |
| Auth env var | `RESEND_API_KEY` | `BREVO_API_KEY` |
| Auth method | SDK constructor | Header: `api-key: <key>` |
| Sender address | `onboarding@resend.dev` | Verified sender on project domain |
| HTML field name | `html` | `htmlContent` |
| Recipient format | `to: "email"` (string) | `to: [{ email: "..." }]` (array of objects) |
| Dependencies removed | `resend`, `@react-email/components` | — |

## 4. What Stays Untouched

- `daily_subscribers` + `daily_challenges` DB tables
- Subscribe route (`POST /api/daily/subscribe`)
- Unsubscribe route (`GET /api/daily/unsubscribe`)
- Vercel cron config (`vercel.json` — `0 7 * * *`)
- Landing page (`/daily`)
- Challenge page (`/daily/[date]`)
- Inline HTML email template (neo-noir design)
- Cron auth mechanism (`Bearer CRON_SECRET`)
- Batch-of-50 send pattern

## 5. Files Modified

1. `app/api/daily/send/route.ts` — swap send logic
2. `package.json` — remove `resend`, `@react-email/components`
3. `.env.local` — add `BREVO_API_KEY`
4. Vercel env vars — add `BREVO_API_KEY`
5. `STACK.md` — update services table
6. Global STACK.md — register Brevo

## 6. Setup Steps (User-Guided)

1. Create Brevo account at brevo.com (free, no credit card)
2. Get API key from Settings → SMTP & API → API Keys
3. Verify sender (email address or domain DNS records)
4. Add `BREVO_API_KEY` to `.env.local` and Vercel

## 7. Rollback Plan

Keep Resend API key in Vercel env for 1 week. Revert is a single file change.

## 8. Success Criteria

- Send test email to a non-owner email address → delivered to inbox
- Cron trigger sends to all active subscribers in `daily_subscribers`
- Unsubscribe link works
- Email renders with neo-noir styling intact

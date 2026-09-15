# Multi-site sendmail (shared code, per-VPS transport)

One `sendmail/` codebase runs on **each frontend VPS**. Transport is selected with `.env` only — no fork per brand.

| VPS | Public URL | Transport |
|-----|------------|-----------|
| voidborn | `https://voidborn.fun/api/sendmail` | `MAIL_TRANSPORT=smtp` |
| komorebi | `https://komorebi.club/api/sendmail` | `MAIL_TRANSPORT=brevo` |

GoTrue on the **API VPS** calls a single edge function that **routes** auth emails to the correct relay by site id.

## Flow

```
GoTrue (API VPS)
  → POST /functions/v1/send-email-hook   (verify Standard Webhooks)
  → voidborn.fun/api/sendmail/hook       (voidborn users — SMTP)
  → komorebi.club/api/sendmail/hook      (iyashikei users — Brevo API)

Commerce invoices / withdrawals
  → same per-site relay map (SENDMAIL_RELAYS on API VPS)
```

Site detection (auth + commerce): `user_metadata.site_id`, signup `redirect_to` host, or `user+komorebi@…` email suffix.

## API VPS `backend/.env`

```env
GOTRUE_HOOK_SEND_EMAIL_ENABLED=true
GOTRUE_HOOK_SEND_EMAIL_URI=https://api.voidborn.fun/functions/v1/send-email-hook
GOTRUE_HOOK_SEND_EMAIL_SECRETS=v1,whsec_<shared secret>
SEND_EMAIL_HOOK_SECRET=v1,whsec_<same shared secret>

# Per-site relays (JSON one line). apiKey must match MAIL_API_KEY on that VPS.
SENDMAIL_RELAYS={"voidborn":{"url":"https://voidborn.fun/api/sendmail","apiKey":"..."},"iyashikei":{"url":"https://komorebi.club/api/sendmail","apiKey":"..."}}

# Legacy fallback if SENDMAIL_RELAYS omitted (voidborn only):
# SENDMAIL_URL=https://voidborn.fun/api/sendmail
# MAIL_API_KEY=...
```

Recreate after sync:

```bash
cd ~/constructor-files/backend
docker compose up -d auth functions --force-recreate
```

## voidborn VPS sendmail

```env
MAIL_TRANSPORT=smtp
SMTP_HOST=...
SMTP_USER=no-reply@voidborn.fun
SMTP_PASS=...
SITE_URL=https://voidborn.fun
AUTH_VERIFY_BASE_URL=https://api.voidborn.fun
MAIL_API_KEY=<voidborn relay key>
SEND_EMAIL_HOOK_SECRET=v1,whsec_<shared>
BASE_PATH=
```

```bash
cd ~/constructor-files/sendmail
npm install
pm2 start server.js --name voidborn-sendmail
pm2 save
curl -s https://voidborn.fun/api/sendmail/health
```

nginx: `location /api/sendmail/` → `127.0.0.1:6001/` (path stripped, `BASE_PATH` empty).

## komorebi VPS sendmail

```env
MAIL_TRANSPORT=brevo
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=no-reply@komorebi.club
BREVO_SENDER_NAME=KOMOREBI
SITE_URL=https://komorebi.club
AUTH_VERIFY_BASE_URL=https://api.voidborn.fun
MAIL_API_KEY=<komorebi relay key>
SEND_EMAIL_HOOK_SECRET=v1,whsec_<same shared secret>
BASE_PATH=
INVOICE_COMPANY_*=...   # komorebi seller details
```

```bash
cd ~/constructor-files/sendmail
npm install
npm run test:brevo
pm2 start server.js --name komorebi-sendmail
pm2 save
curl -s https://komorebi.club/api/sendmail/health
```

Regenerate nginx on komorebi VPS (`projects/registry.json` has `"sendmailProxy": true` for iyashikei):

```bash
cd ~/constructor-files/frontend
node deploy/scripts/generate-nginx.mjs --install
```

## Shared hook secret

Use **one** `SEND_EMAIL_HOOK_SECRET` on API VPS and **every** sendmail instance. The edge router forwards the signed GoTrue payload unchanged; each relay verifies the signature locally.

`MAIL_API_KEY` may differ per VPS (stored in `SENDMAIL_RELAYS` JSON).

## Local editing

- voidborn mount: `./sendmail` via `mount-voidborn.sh`
- komorebi: rsync/git deploy the same folder; `.env` lives only on each server

## Verify

```bash
# Auth preview (komorebi VPS)
curl -X POST https://komorebi.club/api/sendmail/test \
  -H "Authorization: Bearer $MAIL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"template":"signup","site":"iyashikei"}'

# Transport health
curl -H "Authorization: Bearer $MAIL_API_KEY" https://komorebi.club/api/sendmail/smtp-health
```

See also `sendmail/README.md` and `backend/MAIL-SETUP.md`.

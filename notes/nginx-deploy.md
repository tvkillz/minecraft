# Frontend VPS — nginx deploy

## Before nginx

```bash
cd /root/constructor-files/frontend

npm run compile:all
PROJECT=voidborn npm run build
PROJECT=project2 npm run build
pm2 start ecosystem.config.cjs --only voidborn-prod,project2-prod
```

Set `NEXT_PUBLIC_SUPABASE_URL` in `.env.production` to the backend API URL (not the site domain).

## nginx setup

Path is `deploy/scripts/setup-vps.sh`, not `./deploy/setup-vps.sh`:

```bash
cd /root/constructor-files/frontend

sudo bash deploy/scripts/setup-vps.sh install
sudo bash deploy/scripts/setup-vps.sh configure

# DNS A records for staging/production VPS domains → frontend VPS IP, then TLS manually:
sudo certbot --nginx --expand -m you@example.com \\
  -d staging.voidborn.fun -d test.sportsydeals.com
```

**Do not** run `generate-nginx.mjs --install` after certbot without re-running certbot — it overwrites SSL blocks.

## After domain changes

```bash
sudo bash deploy/scripts/setup-vps.sh reload
sudo certbot --nginx --expand -m you@example.com -d <domains...>
```

Sync backend redirects:

```bash
npm run site:sync   # paste ADDITIONAL_REDIRECT_URLS into backend/.env
```

## Staging auth

Default HTTP basic auth: **dev** / **dev** (nginx + dev middleware). Disable with `SITE_AUTH_DISABLED=1` before public launch.

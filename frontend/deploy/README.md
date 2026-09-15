# Frontend VPS deploy

nginx runs as a **systemd service** (`systemctl enable nginx`). This folder generates config from `projects/registry.json` and each site's `manifest.json` `siteUrl`.

## Architecture

```
Browser → https://staging.voidborn.fun  ─nginx:443─→ pm2 voidborn-prod  :3100  (VPS)
Browser → https://voidborn.fun          ─nginx:443─→ pm2 voidborn-prod  :3100  (VPS)

Browser → https://staging.sportsydeals.com     ─nginx─→ pm2 project2-prod :3101
Browser → https://test.sportsydeals.com         ─nginx─→ pm2 project2-prod :3101

Browser → https://api.your-platform.com  (Supabase/Kong on backend VPS)
```

Both `staging.voidborn.fun` and `voidborn.fun` hit the **same pm2 app** (`voidborn-prod` on port 3100). nginx differs only in basic auth: staging vhost has it, production vhost does not.

Per-site routing is defined in `projects/registry.json`:

| Field | Purpose |
|-------|---------|
| `stagingDomain` | VPS nginx staging vhost (`staging.{domain}`) |
| `vpsProd` | When true, production domain is served from this VPS via pm2 |

Frontend nginx only proxies to local pm2 ports. **CORS is configured on the backend**, not here. After `generate-nginx.mjs`, see `deploy/output/cors-origins.txt` for the origin list to allow.

The repo is often rclone-mounted locally via `mount-voidborn.sh` for editing only — builds and pm2 run on the **frontend VPS**.

---

## Regular deploy (voidborn)

Use this after you've tested on the VPS and DNS for both domains points at the frontend VPS.

### Option A — from your local machine (recommended)

Requires `frontend/deploy/deploy.local.env` (copy from `deploy.local.env.example`).

```bash
cd frontend
bash deploy/scripts/deploy-from-local.sh --site voidborn
```

This script:

1. Builds locally with `DEPLOY_TARGET=staging` (auth redirects use `https://staging.voidborn.fun`)
2. rsyncs `.build/voidborn/` + runtime files + `public/fonts/` to the VPS
3. Runs `npm ci --omit=dev` on the VPS
4. Restarts `voidborn-prod` and smoke-tests port 3100

**Faster landing-only deploy** (skips Vite play bundle):

```bash
bash deploy/scripts/deploy-from-local.sh --site voidborn --skip-game
```

**Push an existing build** (no local rebuild):

```bash
bash deploy/scripts/deploy-from-local.sh --site voidborn --skip-build
```

**Dry run** (see what would sync):

```bash
bash deploy/scripts/deploy-from-local.sh --site voidborn --dry-run
```

Stop local `npm run dev` before deploying — dev artifacts in `.build/voidborn/.next` cause the script to fail.

### Option B — build directly on the frontend VPS

On the **frontend VPS**, from `/root/constructor-files/frontend`:

```bash
cd /root/constructor-files/frontend

npm run compile:all          # if projects/ content changed
PROJECT=voidborn npm run build
pm2 restart voidborn-prod --update-env
pm2 save
```

Verify:

```bash
pm2 list
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3100/
```

### After deploy — check in browser

- `https://staging.voidborn.fun` — basic auth (`dev` / `dev` by default), then site loads
- `https://voidborn.fun` — no basic auth, same app

### Backend auth redirects (when adding/changing domains)

Not needed on every deploy — only when site URLs change:

```bash
cd frontend && npm run site:sync
```

Paste suggested `ADDITIONAL_REDIRECT_URLS` into `backend/.env` on the **API VPS**, then:

```bash
cd ~/constructor-files/backend
docker compose up -d auth --force-recreate
```

---

## Environment

Copy once on the frontend VPS:

```bash
cp deploy/env.production.example .env.production
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://api.voidborn.fun
```

API URL is the backend host — **not** `voidborn.fun`. Per-site public URL stays in `projects/voidborn/manifest.json` `siteUrl`.

`deploy-from-local.sh` does not overwrite `.env.production` unless `SYNC_ENV=1` in `deploy.local.env`.

---

## Card catalog (not deployed with frontend)

`deploy-from-local.sh` does **not** sync card catalog assets:

- `assets/cards/`
- `data/card-thumbs/`, `data/card-full/`
- `data/cards-catalog.json`, `data/landing-cards.json`

Portal and play load card art from **Supabase Storage** via the API. Seed/upload cards separately on the backend host (`npm run seed:cards:upload`, `compile:upload`, etc.).

Run `npm run compile:upload` before deploy if the homepage needs storage URLs baked into the bundle.

---

## Fresh VPS setup

```bash
cd frontend
npm install
npm run compile:all
cp deploy/env.production.example .env.production
# set NEXT_PUBLIC_SUPABASE_URL to the site API host (e.g. https://api.finalwhistle.games)

PROJECT=voidborn npm run build
PROJECT=project2 npm run build

pm2 start ecosystem.config.cjs --only voidborn-prod,project2-prod
pm2 save && pm2 startup

sudo bash deploy/scripts/setup-vps.sh install
sudo bash deploy/scripts/setup-vps.sh configure

# DNS: A record each site domain → VPS IP, then TLS:
sudo certbot --nginx --expand -m you@example.com \
  -d staging.voidborn.fun \
  -d voidborn.fun \
  -d test.sportsydeals.com
```

### Dedicated Final Whistle VPS

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://api.finalwhistle.games

PROJECT=final_whistle npm run build
pm2 start ecosystem.config.cjs --only final_whistle-prod
# sendmail on same box (nginx proxies /api/sendmail → :6001)
cd ../sendmail && npm install && pm2 start …   # see sendmail/README.md

# Install only this site's nginx vhost (port 3104 + sendmail proxy):
sudo bash deploy/scripts/setup-vps.sh install
NGINX_SITES=final_whistle sudo -E bash deploy/scripts/setup-vps.sh configure

# DNS A: finalwhistle.games + www → this VPS IP
# DNS A: api.finalwhistle.games → API VPS IP (shared Supabase stack)
sudo certbot --nginx --expand -m support@finalwhistle.games \
  -d finalwhistle.games -d www.finalwhistle.games
```

Reference HTTP-only config: `deploy/nginx/final_whistle.example.conf`.

Local deploys: set `VPS_HOST` to your SSH alias in `deploy/deploy.local.env`, then:

```bash
bash frontend/deploy/scripts/deploy-from-local.sh --site final_whistle
```

**Important:** `generate-nginx.mjs` writes **HTTP-only** vhosts. After `certbot --nginx`, do not run `setup-vps.sh reload` or `generate-nginx.mjs --install` unless you plan to run certbot again — it overwrites certbot's SSL blocks.

---

## Regenerate after adding a site

1. `npm run site:add -- --id=newsite --url=https://newsite.example.com`
2. `npm run compile:all` + `PROJECT=newsite npm run build`
3. `pm2 start ecosystem.config.cjs --only newsite-prod`
4. `sudo bash deploy/scripts/setup-vps.sh reload` then re-run `certbot --nginx` for the new domain
5. `npm run site:sync` — update backend redirects + `sites.sql`

See `projects/README.md` for site URL changes, metadata split, and per-site card uploads.

## SEO — sitemap & robots

Public URLs are defined in `projects/{id}/copy/sitemap.json`. Next.js serves `/sitemap.xml` and `/robots.txt` after compile + build.

Full guide: [`frontend/docs/SITEMAP.md`](../docs/SITEMAP.md)

```bash
curl -s https://voidborn.fun/sitemap.xml | head
curl -s https://voidborn.fun/robots.txt
```

## Manual / preview

```bash
node deploy/scripts/generate-nginx.mjs              # writes deploy/output/frontend-sites.conf (HTTP only)
node deploy/scripts/generate-nginx.mjs --cors-origins # only cors-origins.txt
```

Port formula: prod `3100 + registry index` (override with `PM2_PROD_PORT_BASE`).

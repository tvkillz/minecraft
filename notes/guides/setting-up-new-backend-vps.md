# Setting up a new backend VPS (fresh API domain)

The **backend VPS** runs Supabase (Postgres, Auth, REST, Storage, Edge Functions) behind one **API domain** (e.g. `api.example.com` or `sportsydeals.com`). Frontend sites live on a **separate VPS** and only talk to this API URL.

## Architecture

```
Browser  →  frontend VPS (voidborn.fun, demo.example.com, …)
                ↓  HTTPS
            backend VPS  (PROXY_DOMAIN = API domain only)
                ↓
            Docker: Kong, GoTrue, PostgREST, Storage, Functions, …
```

Do **not** point `PROXY_DOMAIN` at a frontend site hostname. Certbot on the backend will request a certificate for that host; if DNS points at the frontend VPS, TLS and API calls break.

## 1. Provision the server

- Ubuntu 22.04+ (or Debian) VPS with root/sudo
- Open ports **80** and **443** (Let's Encrypt + HTTPS API)
- Optional: restrict Postgres/Studio ports; API is exposed via nginx on 443

## 2. DNS

Create an **A record** for your API domain → **backend VPS IP**.

| Record | Points to |
|--------|-----------|
| `api.example.com` | backend VPS IP |

Frontend site domains (`voidborn.fun`, etc.) point at the **frontend VPS**, not here.

Wait for DNS to propagate before starting TLS (certbot needs the A record to resolve to this machine).

## 3. Install Docker

On the backend VPS:

```bash
# Option A: use the repo bootstrap (installs Docker + clones Supabase docker layout)
curl -fsSL …/backend/setup.sh | sh -y --project-dir constructor-files/backend

# Option B: install Docker manually, then sync the repo to ~/constructor-files/backend
```

If `docker compose pull` fails with IPv6 errors, either disable IPv6 for Docker or use a host with working IPv6 egress.

## 4. Configure `backend/.env`

Sync `constructor-files/backend/` to the VPS. Edit the **Platform URLs** block at the top of `.env`:

```env
SUPABASE_PUBLIC_URL=https://api.example.com
API_EXTERNAL_URL=https://api.example.com
PROXY_DOMAIN=api.example.com
CERTBOT_EMAIL=admin@example.com

SITE_URL=https://voidborn.fun
ADDITIONAL_REDIRECT_URLS=https://voidborn.fun/**,https://www.voidborn.fun/**,…
```

| Variable | Meaning |
|----------|---------|
| `SUPABASE_PUBLIC_URL` / `API_EXTERNAL_URL` / `PROXY_DOMAIN` | Same API hostname (no path) |
| `SITE_URL` | Primary frontend site (default auth redirect) |
| `ADDITIONAL_REDIRECT_URLS` | Every frontend domain, `https://host/**` pattern |

Generate redirect list from your dev machine or frontend VPS:

```bash
cd frontend && npm run site:sync
```

Paste the `ADDITIONAL_REDIRECT_URLS=…` line into `backend/.env`.

Ensure nginx TLS is enabled in compose:

```env
COMPOSE_FILE=docker-compose.yml:docker-compose.nginx.yml
```

On a **brand-new** stack, `setup.sh` generates JWT secrets and API keys. Print them after first boot:

```bash
cd ~/constructor-files/backend
sh run.sh secrets
```

Copy the anon / publishable keys into `frontend/.env.production` (see step 7).

## 5. Start the stack

```bash
cd ~/constructor-files/backend
sh run.sh start
sh run.sh status
```

First boot creates the database from `volumes/db/*.sql` (sites, cards schema, commerce, etc.). nginx + certbot in Docker request a certificate for `PROXY_DOMAIN`.

Check logs if TLS stalls:

```bash
sh run.sh logs nginx
```

## 6. Multi-site bootstrap (recommended)

Even on a fresh DB, run the idempotent bootstrap to ensure `site_members`, card `site_id`, and path fixes exist:

```bash
docker compose exec -T db psql -U postgres < volumes/db/sites-bootstrap.sql
docker compose restart rest functions
```

Re-run safely after code updates. See also `notes/storage-upload.md`.

## 7. Point frontends at the new API

On the **frontend VPS**, edit `frontend/.env.production`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://api.example.com
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<from backend sh run.sh secrets>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<legacy anon JWT if needed>
```

Create `frontend/.env.admin` for upload/migrate scripts (gitignored):

```bash
cp .env.admin.example .env.admin
# SERVICE_ROLE_KEY from backend/.env
```

Rebuild every site and restart pm2:

```bash
cd ~/constructor-files/frontend
npm install
npm run compile:all
npm run upload:all
PROJECT=voidborn npm run build
PROJECT=project2 npm run build
pm2 restart voidborn-prod project2-prod
```

Storage starts **empty** on a new backend — `upload:all` is required for card images.

## 8. Verify

| Check | Expected |
|-------|----------|
| `https://api.example.com/auth/v1/health` | 200 / healthy |
| Card image URL | `…/storage/v1/object/public/cards/{siteId}/thumbs/…` |
| Sign-in on a frontend site | Redirect back to that site's domain |
| Edge function | `POST …/functions/v1/match` with `X-Site-Id` header |

## Common mistakes

| Symptom | Cause |
|---------|--------|
| Certbot hits wrong server | `PROXY_DOMAIN` set to a frontend domain, or DNS A record wrong |
| 403 `site_forbidden` on play | User signed in on another site; use `user+{siteId}@domain` account |
| Card images 404 | Storage not uploaded, or DB paths missing `{siteId}/` prefix |
| Auth redirect error | `ADDITIONAL_REDIRECT_URLS` missing the frontend URL |

## Related notes

- `notes/backend-urls.md` — quick URL variable reference
- `notes/storage-upload.md` — card bucket upload after migration
- `notes/nginx-deploy.md` — frontend VPS (separate from this guide)

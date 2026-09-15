# Adding a new project (frontend site)

Each game/site is a **content pack** under `projects/{id}/`, listed in `projects/registry.json`. One frontend VPS can host many sites; all share the same backend API URL.

## Overview

```
projects/{id}/     manifest, theme, game data, assets
       ↓ compile + build
frontend/.build/{id}/
       ↓ pm2 + nginx
https://your-new-domain.com  →  prod port 3100+N
       ↓ API calls + X-Site-Id: {id}
backend (shared Supabase)
```

Port assignment is automatic: registry index `N` → `3100+N` (dev and prod share the same port; only run one at a time).

## 1. Scaffold the site

From `frontend/`:

```bash
npm run site:add -- --id=mysite --url=https://mysite.example.com
```

Options:

| Flag | Default | Purpose |
|------|---------|---------|
| `--id` | (required) | Folder name + `site_id` in DB (`mysite`) |
| `--url` | (required) | Public URL in `manifest.json` |
| `--from` | `project2` | Template project to copy |
| `--name` | same as id | Display name in manifest |
| `--status` | `demo` | `live` \| `demo` \| `disabled` in registry |

This creates `projects/mysite/`, updates `registry.json`, and sets `manifest.siteUrl`.

## 2. Edit content

Customize the new pack:

```
projects/mysite/
  manifest.json       # brand, routes, features (auth, commerce, …)
  theme/              # colors, ui
  copy/               # marketing copy
  portal/             # portal sections
  game/
    cards.json        # card stats + art paths
    domains.json
    locations.json
    featured-cards.json
    keywords.json
    scenes.json
  assets/             # images referenced by manifest / game JSON
```

If you still use monolithic `assets_metadata.json`, split it:

```bash
npm run metadata:split --project=mysite
```

**Auth:** registrations use plus-addressing — `player+mysite@yourdomain.com`. Site id in the email must match `projects/mysite` / registry id.

## 3. Compile and build

```bash
cd frontend
npm run compile:all          # or: PROJECT=mysite npm run compile
PROJECT=mysite npm run build
```

Check ports:

```bash
npm run site:list
```

## 4. Start pm2

```bash
pm2 start ecosystem.config.cjs --only mysite-prod
# optional dev:
pm2 start ecosystem.config.cjs --only mysite-dev
pm2 save
```

## 5. nginx + TLS (frontend VPS)

Regenerate nginx from the registry and reload:

```bash
npm run deploy:nginx
sudo bash deploy/scripts/setup-vps.sh reload
```

For a **new domain**, point DNS A record → frontend VPS IP, then issue a certificate:

```bash
sudo CERTBOT_EMAIL=you@example.com certbot --nginx --non-interactive --agree-tos \
  -d mysite.example.com

sudo node deploy/scripts/generate-nginx.mjs --install
sudo nginx -t && sudo systemctl reload nginx
```

If `setup-vps.sh ssl` fails (ESM/`require` issue), use manual certbot as in `notes/manual-ssl.md`.

Staging HTTP basic auth defaults to **dev** / **dev** (nginx + app middleware).

## 6. Register site on the backend

Print backend env + SQL hints:

```bash
npm run site:sync
```

**A. Auth redirects** — paste `ADDITIONAL_REDIRECT_URLS` into `backend/.env`, then on backend VPS:

```bash
sh run.sh restart
```

**B. `sites` table** — run bootstrap (idempotent, includes all known sites):

```bash
docker compose exec -T db psql -U postgres < volumes/db/sites-bootstrap.sql
docker compose restart rest functions
```

Or add a row manually / update `backend/volumes/db/sites.sql` for future fresh installs:

```sql
insert into public.sites (id, name, domain, status) values
  ('mysite', 'MYSITE', 'mysite.example.com', 'demo')
on conflict (id) do update set domain = excluded.domain, …;
```

The `handle_new_site_user` trigger rejects sign-ups unless `sites.id` exists for the `+mysite` email suffix.

## 7. Upload card art

Requires `frontend/.env.admin` with `SERVICE_ROLE_KEY` and API URL (see `frontend/.env.admin.example`):

```bash
PROJECT=mysite npm run upload:site
```

Uploads to storage paths `{siteId}/cards/…` and `{siteId}/thumbs/…`, and upserts `cards` rows with `site_id = mysite`.

## 8. Verify

| Check | How |
|-------|-----|
| Site loads | `https://mysite.example.com` |
| pm2 | `pm2 logs mysite-prod` |
| API site header | Browser devtools → match/commerce requests include `X-Site-Id: mysite` |
| Register | New user email `you+mysite@domain.com` |
| Play | Sign in with a **mysite** account (not another site's `+voidborn` session) |
| Cards | Image URLs contain `/cards/mysite/thumbs/…` |

## Checklist (copy)

1. `npm run site:add -- --id=… --url=…`
2. Edit `projects/{id}/`
3. `PROJECT={id} npm run compile && npm run build`
4. `pm2 start ecosystem.config.cjs --only {id}-prod`
5. DNS → frontend VPS; certbot + nginx reload
6. `npm run site:sync` → update `backend/.env` redirects; restart backend
7. `sites-bootstrap.sql` on backend (or insert into `sites`)
8. `PROJECT={id} npm run upload:site`

## Removing or renaming a site

Not fully automated — manually:

1. Remove entry from `projects/registry.json`
2. Delete or archive `projects/{id}/`
3. `pm2 delete {id}-prod {id}-dev`
4. Regenerate nginx (`npm run deploy:nginx`) and reload
5. `npm run site:sync` → update backend redirects
6. Optionally set `sites.status = 'disabled'` in Postgres

## Related notes

- `projects/README.md` — content pack layout and scripts
- `notes/nginx-deploy.md` — frontend VPS nginx bootstrap
- `notes/storage-upload.md` — storage bucket / path fixes
- `notes/backend-urls.md` — API vs site URL variables

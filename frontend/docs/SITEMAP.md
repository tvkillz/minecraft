# Sitemap & robots.txt — VOIDBORN

Search engines discover public pages via **`/sitemap.xml`** and **`/robots.txt`**, generated at build time by Next.js from the project content pack.

## Source of truth

Edit **`projects/voidborn/copy/sitemap.json`**:

| Field | Purpose |
|-------|---------|
| `entries[]` | Public URLs to index (path, priority, changeFrequency) |
| `robots.disallow[]` | Paths crawlers should skip (portal, auth, checkout) |

Current public pages:

| URL | Priority | Notes |
|-----|----------|-------|
| `/` | 1.0 | Landing |
| `/play` | 0.9 | Play lobby (hybrid SPA in production) |
| `/terms` | 0.3 | Legal |
| `/privacy` | 0.3 | Legal |
| `/refund-policy` | 0.3 | Legal |
| `/disclaimer` | 0.3 | Legal |
| `/cookie-policy` | 0.3 | Legal |

**Excluded** (sign-in required or redirects): `/portal/*`, `/checkout`, `/auth/*`, `/profile`, `/market`.

`/leaderboard` is intentionally omitted — it sits behind `AuthGate` and adds little SEO value.

## How it works in the frontend

```
projects/voidborn/copy/sitemap.json
        ↓  npm run compile
.build/voidborn/generated/app.config.json  (bundled sitemap)
        ↓  npm run build
Next.js serves:
  https://voidborn.fun/sitemap.xml   ← src/app/sitemap.ts
  https://voidborn.fun/robots.txt    ← src/app/robots.ts
```

Implementation files:

- `frontend/src/lib/seo/buildSitemap.ts` — builds entries from `appConfig`
- `frontend/src/app/sitemap.ts` — Next.js MetadataRoute
- `frontend/src/app/robots.ts` — disallow rules + sitemap URL

`siteUrl` comes from `projects/voidborn/manifest.json` (overridden to staging URL when `DEPLOY_TARGET=staging` at compile time).

## Deploy checklist

### 1. Recompile after sitemap changes

On the **frontend VPS** (or locally before rsync):

```bash
cd frontend
PROJECT=voidborn npm run compile
PROJECT=voidborn npm run build
pm2 restart voidborn-prod
```

Or use the deploy script from local:

```bash
cd frontend
bash deploy/scripts/deploy-from-local.sh --site voidborn
```

### 2. Verify live URLs

```bash
curl -s https://voidborn.fun/sitemap.xml | head -40
curl -s https://voidborn.fun/robots.txt
```

Expected robots.txt:

```
User-Agent: *
Allow: /
Disallow: /portal/
Disallow: /checkout
...

Sitemap: https://voidborn.fun/sitemap.xml
```

### 3. nginx

No extra nginx rules needed — pm2/Next serves `/sitemap.xml` and `/robots.txt` like any other route. Ensure production vhost proxies to the correct pm2 port (`voidborn-prod` :3100).

### 4. Google Search Console

1. Add property `https://voidborn.fun`
2. Submit sitemap: `https://voidborn.fun/sitemap.xml`
3. Use URL inspection on `/` and `/play` after deploy

For **staging** (`staging.voidborn.fun`): basic auth blocks most crawlers — do not submit staging sitemap to Search Console.

## Adding a new public page

1. Create the Next.js route under `frontend/src/app/…`
2. Add an entry to `projects/voidborn/copy/sitemap.json`:

```json
{
  "path": "/your-page",
  "changeFrequency": "monthly",
  "priority": 0.6
}
```

3. Recompile + rebuild + deploy (see above).

If the page should **not** be indexed, skip the sitemap and add its path to `robots.disallow`.

## Other sites (project2, etc.)

Copy `copy/sitemap.json` into that project's content pack. Compile embeds it per `PROJECT=` id. Defaults fall back to home + play + legal routes from `manifest.json` when the file is missing.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on `/sitemap.xml` | Rebuild after adding `sitemap.ts`; confirm pm2 restarted |
| Wrong domain in URLs | Recompile with correct `DEPLOY_TARGET` / `manifest.siteUrl` |
| Portal pages in Google | Confirm `robots.disallow` includes `/portal/` |
| Staging indexed | Keep basic auth on staging vhost; use `noindex` if needed later |

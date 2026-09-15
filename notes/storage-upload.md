# Card storage & backend sync

> **Day-to-day workflow:** see [cards-and-products.md](./cards-and-products.md) for adding cards, showcase vs full catalog, shop products, and deploy steps.

Storage is **not** in Postgres — a new backend VPS has an **empty** `cards` bucket until you upload from your **local machine**.

## Upload (from local `frontend/`)

Requires `frontend/.env.admin` with `SERVICE_ROLE_KEY` + API URL (see `.env.admin.example`).

```bash
PROJECT=voidborn npm run upload:site
PROJECT=project2 npm run upload:site
npm run upload:all    # every site in registry.json
```

This compiles the project and runs `--upload`: all cards → Storage (WebP full art + WebP thumbs; legacy PNG/JPEG objects removed) + Postgres `cards` + `location_featured_cards`.

**Every site in `projects/registry.json`** is processed by `upload:all` (voidborn, project2, …). New projects only need to be in the registry — no per-site conversion config.

**imgproxy** (backend `ENABLE_IMAGE_TRANSFORMATION`) is optional for cards: the frontend uses direct Storage object URLs, not `/render/image`. Upload-time WebP is what shrinks card payloads.

**Frontend deploy is separate** — only needed for landing/showcase or code changes. Portal/play/market read the full catalog from the API after upload.

```bash
bash frontend/deploy/scripts/deploy-from-local.sh --site voidborn
```

## Verify storage

`https://YOUR_API/storage/v1/object/public/cards/{siteId}/cards/kronos/kronos_card_01_granite_warden.webp`

Thumbs: `…/cards/{siteId}/thumbs/{domain}/{slug}.webp` (domain = `game/domains.json` id).

Local source art stays PNG or JPEG under `projects/{siteId}/assets/cards/`; upload converts to WebP.

### One-time migration (PNG → WebP in Storage)

After pulling the WebP upload changes, from `frontend/`:

```bash
npm run upload:all
```

Expect `uploaded` for cards not yet on WebP, plus `legacy raster removed` for old PNGs. Re-run is safe (skips existing WebP). Force refresh: `PROJECT=voidborn node scripts/compile-project.mjs --upload --force-upload`.

## DB migrations (backend VPS)

One-time or when schema lags the repo:

```bash
cd backend
docker compose exec -T db psql -U postgres < volumes/db/cards-schema-migration.sql
docker compose exec -T db psql -U postgres < volumes/db/cards-random-prices-migration.sql
docker compose restart rest
```

`cards-random-prices-migration.sql` sets `price_cents` (market credits, 1:1) to a random **1000–100000** ($10–$1000) for any card row where price is null or zero. Safe to re-run.

Adds `price_cents`, migrates `cards.domain` to text (project domain ids).

Legacy multi-site / auth email bootstrap:

```bash
docker compose exec -T db psql -U postgres < volumes/db/sites-bootstrap.sql
docker compose restart rest functions
```

Realm `location_id` backfill (older DBs):

```bash
docker compose exec -T db psql -U postgres < volumes/db/locations-id-migration.sql
docker compose restart rest
```

Then re-upload from local: `PROJECT=voidborn npm run upload:site`.

## Store products

Card rows and art come from `upload:site`. Shop SKUs live in `store_products` (credit packs, individual cards, vaults, bundles) — see [cards-and-products.md](./cards-and-products.md#flow-b--add-a-card-to-the-shop-store_products).

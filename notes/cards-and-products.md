# Cards & store products — workflow

Source of truth for **card stats, art paths, and domains** is always `projects/{siteId}/` on your **local machine**. The backend holds the **full catalog** (Postgres + Storage). The frontend VPS only ships a **small showcase** (hero + collection slugs).

---

## Architecture (quick)

```
projects/{id}/game/cards.json     ← you edit here (400+ cards OK)
        │
        ├─ npm run compile        ← local .build/ (showcase thumbs only)
        │
        └─ npm run upload:site  ← ALL cards → Storage + Postgres (run from local machine)

Browser (portal / play / market)  →  fetchPublishedCards()  →  cards table + Storage CDN
Browser (landing hero)            →  baked landing-cards.json (~4 featured)
Browser (collection section)      →  baked slugs from copy/collection.json (~8)
```

| Layer | What lives there |
|-------|------------------|
| Local `projects/` | Full `game/cards.json`, PNG art under `assets/cards/` |
| Supabase Storage | WebP full art + webp thumbs per card (`{siteId}/cards/…`, `{siteId}/thumbs/{domain}/…`) |
| Postgres `cards` | Full catalog row per card (stats, storage paths, `price_cents`, `domain`, `location_id`) |
| Frontend VPS `.build/` | Showcase JSON + ~10–12 local thumbs only |

---

## Prerequisites (one-time)

### Local machine

```bash
cd frontend
cp .env.admin.example .env.admin
# Edit .env.admin — SERVICE_ROLE_KEY from backend VPS backend/.env
# NEXT_PUBLIC_SUPABASE_URL = platform API URL (e.g. https://voidborn.fun)
```

### Backend VPS (existing DBs only)

```bash
cd backend
docker compose exec -T db psql -U postgres < volumes/db/cards-schema-migration.sql
docker compose restart rest
```

This adds `price_cents` and migrates `cards.domain` from the old enum to **text** (project domain ids from `game/domains.json`).

---

## Flow A — Add or update cards

### 1. Edit content locally

Under `projects/{siteId}/`:

| File | Purpose |
|------|---------|
| `game/cards.json` | Add card entry: `slug`, `title`, `domain` (must match `game/domains.json` id), `stats`, `keywords`, `ability`, `path` |
| `assets/cards/…` | PNG art referenced by `path` |
| Optional `priceCents` or `priceEur` | Shop/catalog price on the card row |

Example card entry:

```json
{
  "title": "Granite Warden",
  "slug": "kronos_card_01_granite_warden",
  "domain": "kronos",
  "stats": { "mana": 6, "attack": 3, "health": 8 },
  "keywords": ["Taunt", "Ward"],
  "ability": { "name": "Bedrock Aegis", "text": "…" },
  "path": "cards/kronos/kronos_card_01_granite_warden.png",
  "priceCents": 299
}
```

**Domain ids are per project** — voidborn uses `kronos` / `thalassa` / …; project2 uses `terra` / `aqua`. Never hardcode voidborn ids in shared engine code.

### 2. Upload cards to backend (from local machine)

```bash
cd frontend
PROJECT=voidborn npm run upload:site
```

This runs `compile-project.mjs --upload`, which:

1. Reads all cards from `game/cards.json`
2. **Skips** Storage upload when the object already exists at the target path
3. **Migrates** legacy paths/slugs when `manifest.json` defines `cardSlugMigration` (voidborn: `kronos`→`terra`, etc.) — moves objects in Storage or updates the existing DB row by legacy slug **without re-uploading bytes**
4. Uploads only **new** cards (missing from Storage)
5. Upserts every row into `public.cards` (including `price_cents`, `domain`, `location_id`)
6. Syncs `location_featured_cards` from `game/locations.json` (`featuredCardSlug` per realm)

Force re-upload everything (rare):

```bash
PROJECT=voidborn node scripts/compile-project.mjs --upload --force-upload
```

**After renaming card folders/slugs:** run `upload:site` once — it should log mostly `skipped` / `moved`, not `uploaded`. Then deploy frontend for showcase-only assets.

Upload **all sites** after a backend migration or empty storage:

```bash
npm run upload:all
```

Verify one image in the browser:

`https://YOUR_API/storage/v1/object/public/cards/voidborn/cards/kronos/kronos_card_01_granite_warden.webp`

### 3. Deploy frontend (only when needed)

You do **not** need a frontend deploy for every new card — portal/play/market load the full catalog from the API.

Deploy when you change **landing** content, site code, or a card is in the **showcase** set:

- Hero featured slugs → `game/locations.json` (`featuredCardSlug`)
- Collection fan slugs → `copy/collection.json` (`cardSlugs`)

```bash
# From repo root — builds locally, rsyncs artifacts to frontend VPS
bash frontend/deploy/scripts/deploy-from-local.sh --site voidborn
```

Or build + deploy manually:

```bash
cd frontend
PROJECT=voidborn npm run build
# then rsync .build/voidborn/ to VPS (see deploy-from-local.sh)
```

On the VPS, pm2 restarts automatically if you use the deploy script.

### 4. Optional — feature a card on the landing page

| Goal | Edit |
|------|------|
| Hero fan (one per realm) | `game/locations.json` → `featuredCardSlug` |
| Collection section fan | `copy/collection.json` → `cardSlugs` |

Then `npm run upload:site` (refreshes featured mapping) + frontend deploy (bakes showcase thumbs).

---

## Flow B — Add a card to the shop (`store_products`)

Cards exist in two related places:

| Table / field | Role |
|---------------|------|
| `cards.price_cents` | Catalog/market price (synced from `game/cards.json` on upload) |
| `store_products` | Checkout SKU — what Stripe sells (`kind`, `price_cents`, optional `card_id`) |

Product kinds (`store_product_kind`): `credit_pack`, `card`, `vault`, `bundle`.

### Card product (sell a specific card)

1. **Upload the card first** (Flow A step 2) so `public.cards` has a row and art in Storage.
2. **Get the card UUID** (backend VPS):

   ```bash
   docker compose exec -T db psql -U postgres -c \
     "select id, slug, price_cents from public.cards where site_id = 'voidborn' and slug = 'terra_card_01_granite_warden';"
   ```

3. **Insert or upsert a store product** — admin API (`admin_products_upsert`) or SQL:

   ```sql
   insert into public.store_products (
     site_id, slug, kind, title, description,
     price_cents, currency, card_id, active, sort_order
   ) values (
     'voidborn',
     'card-granite-warden',
     'card',
     'Granite Warden',
     'Single card purchase',
     299,
     'eur',
     'CARD_UUID_HERE',
     true,
     100
   )
   on conflict (site_id, slug) do update set
     price_cents = excluded.price_cents,
     card_id = excluded.card_id,
     active = excluded.active,
     updated_at = now();
   ```

   Checkout uses `store_products.price_cents`; keeping it in sync with `cards.price_cents` is your responsibility unless you automate it.

4. Portal store lists products via commerce `products_list` — no frontend redeploy required for DB-only product rows.

Admin UI: `/portal/admin/products` (read-only list today). Create/edit via commerce edge function action `admin_products_upsert` (requires `profiles.is_admin`).

### Credit packs (top-up currency)

| Layer | Source |
|-------|--------|
| Landing / purchase modal copy | `projects/{id}/credits.json` (`packages[].id`, `priceEur`, `credits`) |
| Checkout | `store_products` rows with `kind = 'credit_pack'` and matching `slug` (e.g. `pack-1000`) |

Default seeds live in `backend/volumes/db/commerce.sql`. For a **new site**, ensure rows exist with the correct `site_id`:

```sql
insert into public.store_products (site_id, slug, kind, title, price_cents, currency, credits_amount, sort_order)
values ('voidborn', 'pack-1000', 'credit_pack', '1,000 Credits', 1000, 'eur', 1000, 20)
on conflict (site_id, slug) do update set
  price_cents = excluded.price_cents,
  credits_amount = excluded.credits_amount;
```

After changing `credits.json` package ids or prices, update matching `store_products` slugs and redeploy frontend (copy is baked at compile).

### Vaults / bundles

Use `kind = 'vault'` or `kind = 'bundle'` in `store_products`. Wire metadata in product `description` / `image_url` as needed — no compile step yet; add rows via SQL or `admin_products_upsert`.

---

## Cheat sheet

| Task | Command / action |
|------|------------------|
| Add 50 new cards (not on landing) | Edit `cards.json` + art → `PROJECT=x npm run upload:site` — **no frontend deploy** |
| Change card stats/price | Edit `cards.json` → `upload:site` |
| New hero featured card | Edit `locations.json` → `upload:site` + frontend deploy |
| New collection showcase card | Edit `copy/collection.json` → compile/deploy (upload optional if card already in DB) |
| Sell card in shop | `upload:site` → insert `store_products` (`kind=card`, `card_id`) |
| New credit pack | Edit `credits.json` + insert `store_products` + frontend deploy |
| Empty storage on new backend | `npm run upload:all` |
| DB schema behind | `cards-schema-migration.sql` on backend, then `upload:site` |

---

## What not to do

- Do **not** put full `projects/{id}/assets/cards/` on the frontend VPS — art is served from Storage.
- Do **not** run `upload:site` on the production frontend VPS unless you explicitly want to — run it **locally** with `.env.admin`.
- Do **not** expect `npm run compile` alone to update the live catalog — compile without `--upload` only refreshes local `.build/` showcase files.

See also: [storage-upload.md](./storage-upload.md) (migrations & storage URLs), [projects/README.md](../projects/README.md) (content pack layout).

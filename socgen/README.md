# socgen — social post generator

Local CLI. Generates **Instagram**, **Facebook**, and **Discord** copy plus a **square image** per post.

## Layout

```
projects/{project}/social/
  _staging/                 ← WIP (validate / approve / render here)
    post1/
      post.json               network copy only
      meta.json               brief, status, image pipeline
      post.txt                all networks in one file (Instagram / Facebook / Discord)
      image.png
    post2/
  posts/                      ← published (final content)
    kronos_card_01_granite_warden/
      post.json
      meta.json
      post.txt
      image.png
  card-log.json               ← approved card slugs (random pick skips these)
```

Project config: `projects/{id}/socialgen.json`, `cardgen.json`, `game/scenes.json` (city backgrounds).

Brand assets for AI promo art: `projects/voidborn/assets/brand/header.png`, `assets/cities/`.

## Setup

```bash
cd socgen
npm install
cp .env.example .env
```

## Workflow

```bash
# Random card post (auto brief, city bg, composite image)
npm run add-post -- --random-card

# Or specific card / welcome post
npm run add-post -- --card=kronos_card_01_granite_warden --brief="..."
npm run add-post -- --brief="Welcome to VOIDBORN" --template=welcome

npm run validate
npm run approve              # logs card slug → card-log.json
npm run generate-images      # card → composite; promo → gemini/auto
npm run publish -- --post=post1   # _staging → posts/
npm run export               # paste files under _staging/export/
npm run export -- --published     # from posts/
npm run list                 # staging + posts + card-log
```

### npm flags — use `--`

Pass CLI flags **after** `--` or npm will swallow them:

```bash
npm run generate-images -- --post=post2
npm run generate-images -- --force
npm run approve -- --post=post2
```

When running **all** posts, already-rendered ones are **skipped** (not errors). Use `--post=postN` to target one post, or `--force` to regenerate.

## Welcome batch (5 AI promo posts)

Generates 5 welcome posts with **random hook titles**, **VOIDBORN logo** + **random realm city art** as Gemini references:

```bash
npm run welcome-batch
npm run welcome-batch -- --count=3          # fewer posts
npm run welcome-batch -- --skip-images      # copy only, render later
```

Each post gets `meta.image.use_brand_reference: true` and references `brand/header.png` + a city from `assets/cities/`.

## Full campaign batch

One command for the whole content plan — **promo posts have NO logo in AI art** (city/domain/CTA refs only). **Card posts** use sharp composite with `brand/gamelogo.png` top-left + random city bg + full card art.

```bash
npm run test-card                    # 1 card post — review composite layout first
npm run full-campaign -- --clean     # wipe staging, then 5+8+5+12 posts
npm run full-campaign -- --clean --cards=0   # promos only (after test-card approved)
npm run full-campaign -- --clean --skip-images
```

| Section | Count | Image |
|---------|-------|-------|
| Welcome | 5 | Gemini AI, city ref, no logo |
| Domain | 8 (2×4 realms) | Gemini AI, domain + city ref, no logo |
| Market | 5 | Gemini AI, CTA asset ref, no logo |
| Cards | 12 | Composite — gamelogo top-left + city + card |

## Realm + market batch (legacy)

Generates **2 posts per domain** (lore + playstyle) and **2 market posts** (buy + sell):

```bash
npm run realm-market-batch
npm run realm-market-batch -- --skip-images      # copy only
npm run realm-market-batch -- --domains-only     # 8 domain posts, skip market
npm run realm-market-batch -- --market-only      # 2 market posts only
```

Domain posts use logo + domain art + realm city references. Market posts use logo + `cta1/buy-cards.webp` or `cta1/sell-cards.webp`.

## post.txt (combined export)

Every post folder includes **`post.txt`** — one file with all network copy:

```
=== INSTAGRAM ===
...
=== FACEBOOK ===
...
=== DISCORD ===
...
```

Written on `add-post`, `generate-images`, and `export`. Use for copy-paste to schedulers.

## content-plan.md

`_staging/content-plan.md` — campaign overview, staged post table, gaps, suggested publish order. Regenerate:

```bash
npm run content-plan
```

Auto-updated after `full-campaign` / `test-card`.

## Card post image (composite)

- Random **realm city** background from `game/scenes.json` (matching card domain)
- **`gamelogo.png` top-left**
- Full **card art** (2:3, no crop) with subtle domain frame glow
- **Cinzel** card title (same as frontend production)

## Random card

```bash
npm run add-post -- --random-card
npm run add-post -- --random-card --domain=thalassa
```

Skips slugs already in `card-log.json` or other `_staging` card posts. Auto-fills brief if omitted.

## Image modes

| Mode | Behavior |
|------|----------|
| `composite` | sharp — card layout or promo layout |
| `gemini` | AI square art |
| `auto` | gemini → composite fallback (default for promos) |

Card posts always use `composite`. Welcome batch uses `gemini` with logo + city references.

## post.json (network copy only)

```json
{
  "instagram": { "header", "caption", "hashtags", "alt_text" },
  "facebook": { "body", "link_url", "link_cta" },
  "discord": { "content" }
}
```

Workflow fields live in **`meta.json`** beside it.

## card-log.json

Written on **approve** for card posts; **publish** sets `published_id`:

```json
{
  "approved": [
    {
      "slug": "kronos_card_01_granite_warden",
      "title": "Granite Warden",
      "domain": "kronos",
      "staging_id": "post1",
      "published_id": "kronos_card_01_granite_warden",
      "background_asset": "cities/terra/terra_city_01_great_bastion.png",
      "approved_at": "...",
      "published_at": "..."
    }
  ]
}
```

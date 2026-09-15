# cardgen — project-scoped card generation

Local CLI (not an HTTP service). **Site-specific** prompts, domain flavor, and design rules live in each project — the `cardgen` service only orchestrates Gemini + staging.

## Architecture

```
cardgen/                          ← generic engine (Gemini, validation, rounds)
  .env                            ← API keys only

projects/{project}/
  cardgen.json                    ← game title, domain visuals, design rules, image style
  game/domains.json               ← domain ids (source of truth for count)
  game/keywords.json
  game/cards.json
  game/_staging/rounds/
    round_YYYYMMDD_08-20/
      round.json                  ← manifest: 4 domain batches, status
      kronos_batch_08-20.json
      thalassa_batch_08-20.json
      ...
      approved/                   ← after approve-round
```

**voidborn** has 4 domains → use `--total` divisible by **4**.  
**project2** has 2 domains → `--total` must divide by **2**.

## Setup

```bash
cd cardgen
npm install
cp .env.example .env   # GEMINI_API_KEY, models, CARDGEN_PROJECT
```

## Project config (`projects/{id}/cardgen.json`)

Per-site content — not in `cardgen/`:

| Field | Purpose |
|-------|---------|
| `gameTitle`, `gamePitch` | Gemini system context |
| `world` | Lore blurb (falls back to `copy/dominions.json`) |
| `domains.{id}.visualIdentity` | Image + card flavor per domain |
| `domains.{id}.flavorNotes` | Archetype hints for text generation |
| `designRules` | Stat/ability constraints |
| `image.promptSuffix` | Appended to every image prompt |
| `generation.maxBatchPerDomain` | Max `--per-domain` (default 50) |

Add or edit `cardgen.json` when onboarding a new project. Domain ids must match `game/domains.json`.

## Round workflow (recommended)

Balanced generation: **one card per domain × N**, total = `domains × per-domain`.

```
generate-round → validate-round → approve-round → generate-images-round → apply-round → upload:site
```

### 1. Generate a round

```bash
# 13 cards per domain × 4 domains = 52 cards (voidborn)
npm run generate-round -- --project=voidborn --per-domain=13

# Or specify total (must divide evenly by domain count)
npm run generate-round -- --project=voidborn --total=48
```

Creates `projects/voidborn/game/_staging/rounds/round_YYYYMMDD_08-20/` with one JSON batch per domain.

### 2. Validate round

```bash
npm run validate-round -- --round=round_20260625_08-20
```

Checks slugs, domains, keywords, stat ranges, duplicates. **On title/slug conflicts**, automatically reprompts Gemini for fresh titles (up to 3 rounds) and writes fixes back to the batch file. Disable with `--no-repair`.

### 3. Review JSON, then approve

```bash
npm run approve-round -- --round=round_20260625_08-20
```

### 4. Generate images

```bash
npm run generate-images-round -- --round=round_20260625_08-20
```

Uses `GEMINI_IMAGE_MODEL` (default `gemini-3.1-flash-image`). PNGs → `game/_staging/images/{slug}.png`.

### 5. Apply to project

```bash
npm run apply-round -- --round=round_20260625_08-20
```

On success, **staging is cleared automatically** after `apply` / `apply-round`. Orphans from older runs:

```bash
npm run cleanup-staging -- --project=voidborn
npm run cleanup-staging -- --project=voidborn --all   # wipe entire _staging
```

### 6. Upload

```bash
cd ../frontend
PROJECT=voidborn npm run upload:site
```

### List state

```bash
npm run list -- --project=voidborn
npm run list-rounds -- --project=voidborn
```

## Example: 50 cards on voidborn

```bash
npm run generate-round -- --project=voidborn --total=48   # 12×4 — closest round number
# or
npm run generate-round -- --project=voidborn --per-domain=12
# then --per-domain=1 for one more mini-round, or use --per-domain=13 for 52
```

For exactly 50: `--per-domain=12` (48 cards) + a second round with `--per-domain=1` (4 cards), or accept 52 with `--per-domain=13`.

## Landing showcase cards (hero + collection)

The compile step requires **12 slugs** wired in `game/locations.json` (`featuredCardSlug`) and `copy/collection.json` (`cardSlugs`). These are baked into the frontend bundle for a fast landing (same as voidborn's `FRONTEND_SHOWCASE_ONLY` flow).

**Stub cards** may ship in `game/cards.json` so compile succeeds before art exists.

### Option A — art only (cards.json already has entries + `image_prompt`)

```bash
npm run generate-images-showcase -- --project=iyashikei
cd ../frontend && PROJECT=iyashikei npm run compile
```

Writes PNGs directly to `projects/iyashikei/assets/cards/{domain}/`.

### Option B — full Gemini text + art (replace stubs)

```bash
npm run generate-showcase -- --project=iyashikei --force
npm run validate -- --file=../projects/iyashikei/game/_staging/showcase/showcase_batch.json
npm run approve -- --file=.../approved/showcase_batch.json
npm run generate-images -- --file=.../approved/showcase_batch.json
npm run apply -- --file=.../approved/showcase_batch.json --force
```

### Full catalog (DB + storage)

Use `generate-round` for the rest of the card pool (50+ per domain). Showcase cards are only the landing subset.

## Single-domain / legacy commands

Still supported for one-off batches outside a round:

```bash
npm run generate -- --domain=kronos --count=10
npm run validate -- --file=../projects/voidborn/game/_staging/cards/kronos_batch_08-17.json
npm run approve -- --file=...
npm run generate-images -- --file=.../approved/...
npm run apply -- --file=.../approved/...
```

## Models (`.env`)

```env
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
```

`gemini-2.0-flash-lite` is shut down — use `gemini-3.1-flash-lite`.

## Flags reference

| Command | Flags |
|---------|-------|
| `generate-round` | `--per-domain`, `--total`, `--round-id`, `--project` |
| `validate` | `--file`, `--no-repair`, `--project` |
| `validate-round` | `--round`, `--round-dir`, `--no-repair`, `--project` |
| `approve-round` | `--round`, `--project` |
| `generate-images-round` | `--round`, `--slug`, `--force`, `--dry-run` |
| `apply-round` | `--round`, `--dry-run`, `--keep-staging`, `--project` |
| `apply` | `--file`, `--dry-run`, `--keep-staging`, `--project` |
| `generate` | `--domain`, `--count`, `--from`, `--project` |

`--total` must be divisible by the number of domains in `game/domains.json`.

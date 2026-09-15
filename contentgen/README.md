# contentgen — landing asset generation

Local CLI for **domains, cities, cta tiles, gamemodel pillars, and card type icons** — the graphical content pack a compiled landing page expects (same layout as voidborn).

**Not included:** card art (use `cardgen/`) and brand logo/video (supply manually under `assets/brand/`).

## Architecture

```
contentgen/                         ← generic engine (Gemini + resize/encode)
  .env                              ← API keys only

projects/{project}/
  contentgen.json                   ← style, sizes, per-domain palette, optional prompt overrides
  game/scenes.json                  ← domain + city prompts (notes field)
  copy/pathways.json                ← cta1 feature images
  copy/gamemodel.json               ← gamemodel pillar images
  assets/_staging/contentgen/
    manifest.json                   ← built asset list + showcase card refs
    images/*.png                    ← raw Gemini output before apply
```

## Output sizes (voidborn reference)

| Kind | Path | Size | Format |
|------|------|------|--------|
| domain | `domains/{element}_domain.png` | 1672×941 | png |
| city | `cities/{element}/{slug}.png` | 1672×941 | png |
| cta | `cta1/{id}.webp` | 1376×768 | webp |
| gamemodel | `gamemodel/{id}.webp` | 1024×1024 | webp |
| card_type | `card_types/{tier}.webp` | 640×640 | webp |

Compile converts rasters → webp where configured; landing copies from `projects/{id}/assets/`.

## Showcase cards (landing performance)

The frontend compile bakes **only showcase slugs** into the bundle when `FRONTEND_SHOWCASE_ONLY=1`:

- 4 featured cards from `game/locations.json` (`featuredCardSlug`)
- 8 collection cards from `copy/collection.json` (`cardSlugs`)

Those PNGs live under `assets/cards/{domain}/` and are produced by **cardgen**, not contentgen. Run:

```bash
cd cardgen
npm run generate-round -- --project=iyashikei --per-domain=3   # example
# … validate, approve, generate-images, apply-round …

cd ../frontend
FRONTEND_SHOWCASE_ONLY=1 PROJECT=iyashikei npm run compile
```

`contentgen list` reports showcase card status alongside landing backgrounds.

## Setup

```bash
cd contentgen
npm install
cp .env.example .env   # GEMINI_API_KEY, CONTENTGEN_PROJECT
```

## Workflow

```bash
npm run manifest -- --project=iyashikei
npm run generate-images -- --project=iyashikei
npm run apply -- --project=iyashikei
npm run list -- --project=iyashikei
```

Partial runs:

```bash
npm run generate-images -- --project=iyashikei --kind=domain,city
npm run generate-images -- --project=iyashikei --id=expand-collection --force
npm run apply -- --project=iyashikei --kind=cta --force
```

Dry-run:

```bash
npm run generate-images -- --project=iyashikei --dry-run
npm run apply -- --project=iyashikei --dry-run
```

## Project config (`projects/{id}/contentgen.json`)

| Field | Purpose |
|-------|---------|
| `style.aesthetic` / `style.avoid` | Global visual guardrails |
| `image.promptPrefix` / `promptSuffix` | Scene backgrounds |
| `image.ctaSuffix` / `gamemodelSuffix` | Tile/pillar compositions |
| `outputSizes` | Override voidborn reference dimensions |
| `domains.{id}` | Per-ward palette and mood |
| `cta.{featureId}.prompt` | Optional override for a pathway tile |
| `gamemodel.{pillarId}.prompt` | Optional override for a pillar |
| `cardTypes.{tier}` | Rarity icon prompts |

Domain/city prompts primarily come from `game/scenes.json` → `notes`.

## After assets exist

1. Add brand files manually: `brand/gamelogo.png`, `header.png`, `play-lobby.png`, etc.
2. Generate showcase cards via cardgen (see above).
3. Compile: `PROJECT=iyashikei npm run compile` from `frontend/`.

## Models (`.env`)

```env
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
```

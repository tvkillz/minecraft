# New Minecraft store (content pack)

Same phase order as TCG themes. Catalog items are **server features** (ranks, coin packs, minigames), not playing cards.

## Phase 0–1 — identity + JSON

1. `npm run site:add -- --id=… --url=… --from=_template`
2. Edit `projects/{id}/` copy, theme, `game/cards.json` (feature tiles), `credits.json`
3. Confirm `projects/registry.json`

## Phase 2a–2b — art

```bash
cd contentgen
npm run manifest -- --project=YOUR_ID
npm run generate-images -- --project=YOUR_ID
npm run apply -- --project=YOUR_ID
```

Showcase tiles (hero + collection slugs) still go through **cardgen**.

## Phase 3 — landing, hero first

Add `frontend/src/styles/{id}-*.css` and a landing variant if the store should look like a Tebex shop (IP + Discord + feature tiles) instead of a card fan.

Do **not** skip ahead to portal/game until the hero showcases ranks, coins, and minigames.

Shared landing shell: `frontend/src/components/landing/minecraft/` (`landing.variant: "minecraft"`). Store packs customize copy, colors, and contentgen art.

## Phase 4–6

Portal chrome, optional `/play`, then upload / nginx / `sites` row / ui-tests — same as constructor-mount, but **user** runs VPS commands.

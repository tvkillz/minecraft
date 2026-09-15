# Store content packs

Each Minecraft store is `projects/{id}/`, listed in `registry.json`.

| Path | Purpose |
|---|---|
| `_template/` | Scaffold for `npm run site:add` |
| `coop/` | First store — ranks, Victory Coins, minigames |
| `scripts/` | `site-add`, `site-list`, `site-url`, `site-sync-hints` |

`game/cards.json` is the **feature catalog** (rank tiles, coin packs, minigames). Compile still uses the same card pipeline the TCG engine expects.

Shared footer icons: `projects/shared/`.

# Minecraft store constructor

Sibling of `constructor-mount` (TCG) and `textproject` (text sites). One frontend engine, many **Minecraft storefronts** under `projects/{id}/`.

```
~/Desktop/projects/minecraft/
  frontend/       Next.js engine (compile + landing + portal + checkout)
  projects/       store packs (local — not the TCG rclone mount)
    _template/    scaffold source for `site:add`
    coop/         first store (Tebex-style ranks / coins / minigames)
  contentgen/     landing art (Gemini)
  cardgen/        hero/catalog feature art
  backend/        optional rclone mount (later)
  sendmail/       optional rclone mount (later)
```

This is **not** `constructor-mount/projects/minecraft`. Each store is its own pack, the same way Voidborn/Helix are TCG packs and Lexora/Copyrift are textproject packs.

## Quick start (local)

```bash
cd frontend
npm install
PROJECT=coop npm run compile
PROJECT=coop npm run dev:host
```

Default pack id is `coop` (port **3100**).

## Add another store

```bash
cd frontend
npm run site:add -- --id=newsie --url=https://newsie.example.com --name=Newsie --from=_template
PROJECT=newsie npm run compile
```

Then follow [`projects/NEW_THEME.md`](projects/NEW_THEME.md) — **hero first**, feature tiles instead of TCG cards.

## Backend / mail (later)

```bash
chmod +x mount-backend.sh unmount-backend.sh
./mount-backend.sh
```

Mounts the shared constructor Supabase stack + sendmail. Not required to start theming the landing page.

## Payments

No Stripe. Checkout is `checkout_init` → billing → `checkout_pay` / admin `checkout_test`. Coin packs live in `projects/{id}/credits.json`.

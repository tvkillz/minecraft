
```bash
node test-all.mjs --update -g helix
```

# UI tests

Playwright suites for **landing** (full-page visual) and **portal** (viewport visual + clicks) across every site listed in one place.

## Prerequisites

1. Install deps (once):

```bash
cd ui-tests
npm install
npx playwright install chromium   # + firefox if you use landing-firefox
```

2. Copy env for portal auth:

```bash
cp .env.example .env
```

Set `UI_TEST_EMAIL` (display email, **no** `+site` tag) and `UI_TEST_PASSWORD`.  
The app turns `you@example.com` into `you+voidborn@…` / `you+iyashikei@…` per site.

3. Start each site locally on the ports in `helpers/sites.ts` (auth **enabled** for portal).

---

## Site registry (add a new site here)

**Single source of truth:** [`helpers/sites.ts`](helpers/sites.ts) → `UI_TEST_SITES`.

Landing and portal both import this list. To add a site:

```ts
// helpers/sites.ts
export const UI_TEST_SITES: UiTestSite[] = [
  // …
  {
    name: 'helix',                       // test titles + snapshot filenames
    url: 'http://127.0.0.1:3103',        // local start:prod URL
    authSuffix: 'helix',                 // email plus-tag / siteId
    authFile: path.join(authDir, 'helix.json'),
  },
]
```

| Field | Meaning |
|--------|---------|
| `name` | Label in tests and PNGs (`helix-desktop.png`, `helix-market.png`, …) |
| `url` | Base URL (usually `http://127.0.0.1:(3100 + registry index)`) |
| `authSuffix` | Plus-address used by Supabase (`you+{authSuffix}@…`) — often same as project `siteId` (komorebi → `iyashikei`) |
| `authFile` | Where Playwright stores the logged-in `storageState` (gitignored under `.auth/`) |

Also ensure:

- QA user exists for that suffix on the API
- Site is running before tests
- Optional: `UI_TEST_EMAIL_HELIX=…` in `.env` if that site needs a different display email

### Generate snapshots only for the new site

Does **not** overwrite other sites’ baselines:

```bash
# Landing (desktop + mobile)
npx playwright test --project=landing -g "helix" --update-snapshots

# Portal visuals only
npx playwright test --project=portal -g "helix.*visual|visual.*helix" --update-snapshots

# Or via the unified script
node test-all.mjs --update -g helix
```

Commit new PNGs under:

- `tests/landing/landing.spec.ts-snapshots/`
- `tests/portal/portal.visual.spec.ts-snapshots/`

---

## Commands

| Command | What it runs |
|---------|----------------|
| `npm run test:all` | Landing (Chromium) + portal visual for **all** sites |
| `npm run test:all:update` | Refresh landing + portal visual baselines for all sites |
| `npm run test:landing` | Landing visual only |
| `npm run test:portal` | Portal visual (auth setup first) |
| `npm run test:portal:update` | Portal visual baselines only |

Unified script options (`node test-all.mjs` / `npm run test:all -- …`):

```bash
node test-all.mjs                  # landing + portal
node test-all.mjs --update         # rewrite snapshots
node test-all.mjs --landing-only
node test-all.mjs --portal-only
node test-all.mjs --firefox        # also landing-firefox
node test-all.mjs -g voidborn      # filter by site / title
```

Repo-root helper that **builds + starts** voidborn/iyashikei then runs landing only: `node ../scripts/test-landing.mjs` (separate from this folder’s `test-all.mjs`, which expects servers already up).

---

## What each suite covers

### Landing

- Full-page desktop + mobile screenshots
- Public home — no login
- Images/animations stripped for stability

### Portal

- **Visual** (also clicks through UI): market, credits modal, withdraw modal, cart drawer, account menu, collection Forge/Sell, transactions, profile
- Auth via Playwright `storageState` (Supabase **localStorage**, not cookies)
- Card art, names, stats, domain/rarity + cash/credit **prices** CSS-hidden; market **card grid** `display:none` (chrome-only, no catalog race); small masks for balances, username, tx lists, billing fields, footer contact
- BuyCard / BuyListing / SellCard modals skipped for now
- No separate DOM smoke suite — visuals cover the interactive paths

---

## Layout

```
ui-tests/
  helpers/sites.ts          ← add sites here
  helpers/auth.ts
  helpers/stabilize.ts
  helpers/visual.ts
  tests/auth.setup.ts       ← login once per site → .auth/*.json
  tests/landing/
  tests/portal/
  test-all.mjs              ← run everything
  .env.example
  .auth/                    ← gitignored sessions
```

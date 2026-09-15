# Frontend Development Rules: Phase A (React + TypeScript)

You are an expert React & TypeScript developer building the first phase of a Premium Dark Fantasy TCG Web Platform. Follow these technical guidelines strictly.

## 1. Stack & Tech Requirements
- **Framework:** Next.js 15 (App Router) with strict TypeScript (`.tsx`).
- **Styling:** Vanilla CSS. Every component MUST have its own individual `styles.css` file in its component folder (e.g., `components/Card/Card.tsx` and `components/Card/styles.css`).
- **Animations:** For card previews, use HTML5 CSS3 transitions or a lightweight React library like `react-parallax-tilt` to achieve the 3D card holographic/tilt effect.

## 2. File & Assets Structure
All assets must be referenced from the `public/assets/` folder:
- Background Video: `public/assets/main.mp4`
- Active Location Backgrounds: `public/assets/locations/` (e.g., `kronos.jpg`, `thalassa.jpg`)
- Project Logo: `public/assets/logo.jpg`

## 3. Component Specifications & Logic

### A. Header Component (`Header.tsx` + `styles.css`)
- **Left:** Logo (`assets/logo.jpg`) and Game Title using a custom Dark Fantasy serif font.
- **Right:** "Sign In" button and a Hamburger Menu button.
- **Accordion Logic:** Clicking the hamburger menu smoothly expands an accordion panel downwards, revealing navigation elements: `Play Now`, `Market`, `Leaderboard`. Use clean React state (`isOpen`).

### B. Hero Section & Background (`Hero.tsx` + `styles.css`)
- **Video Background:** On initial load, play `assets/main.mp4` (muted, loop, playsinline, absolute positioned behind content).
- **Background Switcher Logic:** Create a state or function to smoothly transition (via CSS opacity `transition: opacity 0.8s ease`) from the main video to static images from `assets/locations/` when required.

### C. Typography & CTA
- **Main Heading:** Epic dark fantasy tagline using the premium fantasy font. Add text-shadow or a glowing effect via CSS.
- **Subheading:** Smaller, immersive lore/description paragraph.
- **CTA Layout:** Display `Play Now`, `Market`, and `Leaderboard` buttons right below the text. Style them with a medieval dark-iron border and glowing hover states using standard CSS.

### D. Card Previews Component (`CardPlaceholder.tsx` + `styles.css`)
- Render a group/hand of card placeholders horizontally as shown in the reference screenshot.
- **TypeScript Interface:** Define a strict `interface CardProps` to accept:
  - `id: string`
  - `title: string`
  - `bgImage: string` (path to location asset)
  - `stats: { mana: number; attack: number; health: number; }` (for future expansion)
- **Component Architecture:** Every card must be an independent React component. Currently, it renders the image from `assets/locations/` wrapped inside a card frame.
- **Card Animations:** - Implement a 3D tilt effect on mouse hover (card follows the cursor angle).
  - Add intense colored neon drop-shadows (`box-shadow` or `filter: drop-shadow`) on hover, matching the elemental theme of the card.

## 4. UI/UX Style Guide
- **Colors:** Deep void black (`#0a0a0c`), corrupted gold, vivid magical purples and ember-reds for glows.
- **Glassmorphism:** Use `backdrop-filter: blur(10px)` and semi-transparent dark backgrounds for UI cards and menus.
- Ensure all layouts are fully responsive and look premium on both mobile and desktop screens.

### 4.1 Responsive layout (minimum viewport **350px**)

All landing and marketing UI must remain usable down to **350px** content width (typical narrow phone). Shared tokens live in `src/styles/landing-layout.css`.

| Token | Default | Purpose |
|-------|---------|---------|
| `--layout-min-width` | `350px` | Design floor — test every section at this width |
| `--landing-gutter-x` | `1.5rem` → `3rem` (768+) → `1rem` (480-) | Horizontal padding; shrinks on tiny screens |
| `--landing-content-max` | `1280px` | Centered landing column |
| `--locations-preview-max` | `534px` | Locations image cap on large screens |
| `--locations-breakpoint-fluid` | `1150px` | Below: preview shrinks; text column keeps priority |
| `--locations-breakpoint-stack` | `919px` | Below: locations stack; preview = full content width |

**Rules for new components**

1. **No fixed horizontal minimums** above 350px unless wrapped in a scroll container — avoid `min-width: 534px` on full-bleed blocks.
2. **Prefer `minmax(0, 1fr)`** in grid/flex children so columns can shrink; use `min-width: 0` on flex/grid items with long text.
3. **Use `clamp()` / `min()`** for typography and spacing instead of large fixed pixel widths.
4. **Images:** `max-width: 100%`, `height: auto` or `aspect-ratio` when fluid; `object-fit: cover` inside bounded boxes.
5. **Test:** resize DevTools to 350px width; no horizontal scroll on `/` (hero, locations, header).
6. **Shell:** wrap landing sections in `.landing-shell` so gutters align with header and hero.

**Locations section behaviour (reference)**

- **≥ 1150px:** two columns — text flexes, preview fixed at `--locations-preview-max`.
- **1150px – 920px:** two columns — text keeps width; preview column shrinks.
- **≤ 919px:** stacked — preview spans content width and scales down to 350px with text.

## 5. Central configuration (single source of truth)

**Do not hardcode** brand copy, colors, routes, card data, or **game animation timings** in components. Import from `src/config/`.

### 5.1 App / landing config

| File | Role |
|------|------|
| `src/config/schema.ts` | TypeScript types for `AppConfig` |
| `src/config/app.config.ts` | **Edit this** for product data (name, domain, logo, colors, arts, cards, descriptions, categories, theme) |
| `src/config/assets.ts` | Helpers: `assetPath()`, `locationImage()` |
| `src/config/selectors.ts` | Derived exports: `HERO_CARDS`, `LOCATIONS`, `getArenaBackground()`, nav/CTA href resolvers |
| `src/config/applyTheme.ts` | Runs on boot: CSS variables on `:root`, document title, Google Fonts |
| `src/config/index.ts` | Public barrel — import from `'../../config'` in components |

**`app.config.ts` top-level keys (schema):**

| Key | Contents |
|-----|----------|
| `name` | Display name, short name, `documentTitle` |
| `domain` | `siteUrl`, `routes` (`home`, `play`, `collections`), `anchors` |
| `logo` | `src`, `alt`, `favicon` |
| `colors` | Palette → `--void-black`, `--gold`, `--play-cyan`, etc. |
| `arts` | `introVideo`, `defaultArenaLocationId`, `defaultLobbyLocationId`, asset dirs |
| `cards` | Card id, title, stats, `art`, `glowColor`, optional `categoryId`, `fanIndex` |
| `descriptions` | Copy for hero, locations, play screen, deck modal, collections, header |
| `categories` | Elemental taxonomy (`earth` / `water` / `fire` / `air`) → `locationIds` |
| `theme` | Fonts, `locations[]`, lore, `navigation`, `heroCtas`, `playModes`, `player`, landing `particles` |

Binary files stay in `public/assets/`. Config holds **paths and metadata only**.

### 5.6 Next.js App Router routes

| URL | File |
|-----|------|
| `/` | `src/app/page.tsx` → `src/views/HomePage.tsx` |
| `/play` | **dev:** `src/app/play/page.tsx` → `PlayPage.dev.tsx` → `src/screens/PlayPage/` |
| `/portal/collections` | `src/app/portal/collections/page.tsx` → `src/screens/CollectionsPage/` |

**Note:** Do not use `src/pages/` for feature code — Next.js reserves it for the Pages Router. Use `src/screens/` (or `src/views/`) instead.

- Root layout: `src/app/layout.tsx` (global CSS, `ThemeProvider`, metadata from config).
- Interactive UI: `'use client'` on components with hooks, GSAP, or `document`.
- Internal links: `next/link` (`href`, not react-router `to`).
- Theme CSS variables: `src/components/providers/ThemeProvider.tsx` calls `applyTheme()` on mount.

### 5.7 Hybrid architecture (dev vs production)

| Mode | Command | `/play` behaviour |
|------|---------|-------------------|
| **Development** | `npm run dev` | Full play stack inside Next (`app/play` → `PlayPage.dev`). `public/play/` from a prod build is moved aside automatically. |
| **Production** | `npm run build` | Static Vite client in `public/play/`; Next rewrites `/play` → `/play/index.html` |

**Production pipeline**

1. `npm run build:game` — Vite (`game/vite.config.ts`) → `public/play/` (base `/play/`).
2. `npm run build:web` — **removes** `src/app/play/page.tsx` for the build, clears `.next`, runs `SITE_HYBRID=1 next build`, writes `.site-hybrid`, verifies `/portal/*` + `public/play/index.html`.
3. `npm run build` — runs both (game + web).
4. **Production serve:** `npm run start:prod` (or pm2 `start:prod`) — **not** a static file server; `/portal/*` needs the Next server.

**Layout**

| Path | Role |
|------|------|
| `game/vite.config.ts` | Vite build; aliases `@` → `src/`, `next/link` → `game/shims/next-link.tsx` |
| `game/src/main.tsx` | Static play entry (mounts `PlayPage`) |
| `scripts/build-game.mjs` | `build:game` |
| `scripts/build-web.mjs` | `build:web` (hybrid Next, no play route in graph) |
| `scripts/build-prod.mjs` | default `build` |

**Rules**

- Do not import `@/screens/PlayPage/*`, `@/components/Game/*`, or `gsap` from marketing code (ESLint enforces).
- Shared source stays in `src/screens/PlayPage` and `src/components/Game` — only the **bundle** splits in production.
- `public/play/` is build output (gitignored).

### 5.2 Game animations config (arena / battle)

All **GSAP VFX, turn banners, and battle-enter transitions** live under `src/config/game/`, not in `app.config.ts`.

| File | Role |
|------|------|
| `src/config/game/schema.ts` | Types: `GameAnimationsConfig`, `OrbPresetConfig`, `FireballAnimationConfig`, etc. |
| `src/config/game/orbs.config.ts` | **Orb presets only** (orange / green / blue projectiles + `buttonVariant`) |
| `src/config/game/animations.config.ts` | **Main edit file**: merges orbs + `battleTransition`, `turnBanner`, `particles`, `fireball` |
| `src/config/game/index.ts` | Barrel: `gameAnimationsConfig`, `orbPresets` |

**`gameAnimationsConfig` sections:**

| Section | Used by | What to tune |
|---------|---------|----------------|
| `battleTransition` | `PlayPage`, `BattleTransition` | Loading label, `loadingDurationMs`, `gateDurationMs`, gate panel CSS duration/easing |
| `turnBanner` | `Game.tsx` | `enemy` / `your` labels, `exitPhaseMs`, `hideMs` |
| `particles` | `Game.tsx` `spawnBurst()` | Burst duration, scale, GSAP ease |
| `fireball` | `Game.tsx` `triggerFireball()` | Cast ring, travel/return, screen shake, fade-out, linger burst |
| `orbs` | `Game.tsx` | Per-preset colors, counts, spreads (re-exported from `orbs.config.ts`) |

**When adding a new game animation:** extend `game/schema.ts`, add data to `animations.config.ts` (or a new `src/config/game/<name>.config.ts`), import `gameAnimationsConfig` in the component — **never** leave magic numbers in `Game.tsx`.

### 5.3 Shared UI

| Path | Role |
|------|------|
| `src/components/ui/Button/` | Unified `.vb-btn` for landing + play + arena controls |

### 5.4 Legacy re-exports

`src/data/cards.ts` and `src/data/locations.ts` re-export from `src/config` — prefer importing from `config` in new code.

### 5.5 Agent checklist

1. Branding / copy / cards / locations → `app.config.ts`
2. Colors / fonts → `app.config.ts` `colors` + `theme.fonts` (applied via `applyTheme()`)
3. Orb colors & projectile feel → `orbs.config.ts`
4. Arena timings, turn overlays, fireball physics → `animations.config.ts`
5. New animation family → new section in `game/schema.ts` + config file + wire in `Game.tsx` or `PlayPage`
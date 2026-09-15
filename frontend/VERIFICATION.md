# Multi-site pm2 verification

Run **parallel sites only via pm2** — each app is a separate process with its own `PROJECT`, `PORT`, and `.build/{PROJECT}/` artifacts.

Do **not** start two `npm run dev` shells manually (port conflicts and stale processes).

## Port map (auto from registry index)

| pm2 name | PROJECT | dev | prod |
|----------|---------|-----|------|
| `voidborn-dev` | voidborn | 3000 | 3100 |
| `project2-dev` | project2 | 3001 | 3101 |

Formula: `dev = PM2_DEV_PORT_BASE + index` (default 3000), `prod = PM2_PROD_PORT_BASE + index` (default 3100).

---

## Setup

```bash
cd frontend
npm run compile:all
pm2 start ecosystem.config.cjs --only voidborn-dev,project2-dev
pm2 list
pm2 logs
```

- http://localhost:3000 — Voidborn
- http://localhost:3001 — Project Two (demo content pack)

Single site (no pm2): `PROJECT=voidborn npm run dev:host` — port auto-picked from registry.

---

## Prod

```bash
PROJECT=voidborn npm run build
PROJECT=project2 npm run build
pm2 start ecosystem.config.cjs --only voidborn-prod,project2-prod
```

---

## Smoke checklist

- [ ] `npm run compile:all` → `.build/voidborn/` and `.build/project2/` exist
- [ ] `pm2 start … --only voidborn-dev,project2-dev` → both `online`, ↺ 0
- [ ] :3000 hero = Voidborn, :3001 hero = PROJECT TWO

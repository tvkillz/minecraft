#!/usr/bin/env bash
# Deploy built frontend artifacts from local machine → VPS.
# Does NOT ship src/, game/, or projects source packs.
# Card catalog images + JSON are NOT synced — cards live in Postgres/Storage (seed/upload separately).
#
# Usage (from repo root or frontend/):
#   bash frontend/deploy/scripts/deploy-from-local.sh
#   bash frontend/deploy/scripts/deploy-from-local.sh --site voidborn
#   bash frontend/deploy/scripts/deploy-from-local.sh --dry-run
#   bash frontend/deploy/scripts/deploy-from-local.sh --skip-build
#   bash frontend/deploy/scripts/deploy-from-local.sh --skip-game
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_ROOT="$(cd "$FRONTEND_DIR/.." && pwd)"
CONFIG_FILE="$FRONTEND_DIR/deploy/deploy.local.env"

DRY_RUN=0
SKIP_BUILD=0
SKIP_GAME=0
SITE_FILTER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)    DRY_RUN=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    --skip-game)  SKIP_GAME=1 ;;
    --site)       SITE_FILTER="$2"; shift ;;
    -h|--help)
      echo "Usage: $0 [--site ID] [--dry-run] [--skip-build] [--skip-game]"
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
  shift
done

[[ -f "$CONFIG_FILE" ]] || { echo "Missing $CONFIG_FILE — see deploy guide." >&2; exit 1; }
# shellcheck source=/dev/null
source "$CONFIG_FILE"

: "${VPS_HOST:?Set VPS_HOST in deploy.local.env}"
: "${VPS_USER:?Set VPS_USER in deploy.local.env}"
: "${VPS_FRONTEND_DIR:?Set VPS_FRONTEND_DIR}"
: "${VPS_PROJECTS_DIR:?Set VPS_PROJECTS_DIR}"
PM2_APPS="${PM2_APPS:-voidborn-prod}"

SSH_TARGET="${VPS_USER}@${VPS_HOST}"
RSYNC_SSH=(rsync -avz --progress)
[[ "$DRY_RUN" == "1" ]] && RSYNC_SSH+=(--dry-run)

log() { echo "[deploy] $*"; }

# pm2 app names for sites in this deploy (voidborn → voidborn-prod), not the full PM2_APPS list.
deploy_pm2_apps() {
  local site
  for site in "${SITES[@]}"; do
    echo "${site}-prod"
  done
}

deploy_pm2_dev_apps() {
  local site
  for site in "${SITES[@]}"; do
    echo "${site}-dev"
  done
}

pm2_stop_deploy_apps() {
  local app
  while IFS= read -r app; do
    [[ -z "$app" ]] && continue
    ssh "$SSH_TARGET" "pm2 stop '$app' 2>/dev/null || true"
  done < <(deploy_pm2_dev_apps)
  while IFS= read -r app; do
    [[ -z "$app" ]] && continue
    ssh "$SSH_TARGET" "pm2 stop '$app' 2>/dev/null || true"
  done < <(deploy_pm2_apps)
}

# --- Resolve sites from registry ---
read_registry() {
  node -e "
    const r = require('$REPO_ROOT/projects/registry.json');
    const filter = '$SITE_FILTER';
    for (const s of r) {
      if (!filter || s.id === filter) console.log(s.id);
    }
  "
}

SITES=()
while IFS= read -r line; do
  [[ -n "$line" ]] && SITES+=("$line")
done < <(read_registry)

[[ ${#SITES[@]} -gt 0 ]] || { echo "No sites matched." >&2; exit 1; }
log "Sites: ${SITES[*]}"

# --- Build locally (manifest siteUrl → sitemap, robots, auth redirects) ---
if [[ "$SKIP_BUILD" != "1" ]]; then
  log "Building locally…"
  export FRONTEND_SHOWCASE_ONLY=1
  cd "$FRONTEND_DIR"
  for site in "${SITES[@]}"; do
    if [[ "$SKIP_GAME" == "1" ]]; then
      log "  compile + build:web (skip game): $site"
      PROJECT="$site" node scripts/compile-project.mjs
      PROJECT="$site" node scripts/build-prod.mjs --skip-game --skip-compile
    else
      log "  compile + build: $site"
      PROJECT="$site" npm run build
    fi
  done
else
  log "Skipping build (--skip-build)"
fi

# --- Verify build outputs ---
for site in "${SITES[@]}"; do
  [[ -d "$FRONTEND_DIR/.build/$site/.next" ]] || {
    echo "Missing .build/$site/.next — run build first." >&2
    exit 1
  }
  dev_manifest="$FRONTEND_DIR/.build/$site/.next/static/development/_buildManifest.js"
  if [[ -f "$dev_manifest" ]]; then
    echo "[deploy] ERROR: .build/$site/.next still has dev artifacts after build." >&2
    echo "[deploy] Stop local dev (npm run dev) and run deploy again." >&2
    exit 1
  fi
done

# --- Rsync runtime shell (frontend) ---
log "Syncing runtime files…"
"${RSYNC_SSH[@]}" \
  "$FRONTEND_DIR/package.json" \
  "$FRONTEND_DIR/package-lock.json" \
  "$FRONTEND_DIR/next.config.ts" \
  "$FRONTEND_DIR/ecosystem.config.cjs" \
  "$SSH_TARGET:$VPS_FRONTEND_DIR/"

"${RSYNC_SSH[@]}" \
  "$FRONTEND_DIR/scripts/project-ports.mjs" \
  "$FRONTEND_DIR/scripts/registry-sites.mjs" \
  "$FRONTEND_DIR/scripts/project-next.mjs" \
  "$FRONTEND_DIR/scripts/project-paths.mjs" \
  "$FRONTEND_DIR/scripts/site-hybrid.mjs" \
  "$FRONTEND_DIR/scripts/verify-next-build.mjs" \
  "$FRONTEND_DIR/scripts/start-prod.mjs" \
  "$SSH_TARGET:$VPS_FRONTEND_DIR/scripts/"

"${RSYNC_SSH[@]}" \
  --exclude 'output/' \
  --exclude 'deploy.local.env' \
  "$FRONTEND_DIR/deploy/" \
  "$SSH_TARGET:$VPS_FRONTEND_DIR/deploy/"

ssh "$SSH_TARGET" "mkdir -p '$VPS_FRONTEND_DIR/.build' '$VPS_PROJECTS_DIR' '$VPS_FRONTEND_DIR/public/fonts'"

# Hiro Misake + other static fonts live in public/ (Next serves at /fonts/*) — not inside .build/.
log "Syncing public/fonts/…"
"${RSYNC_SSH[@]}" \
  "$FRONTEND_DIR/public/fonts/" \
  "$SSH_TARGET:$VPS_FRONTEND_DIR/public/fonts/"

# Stop pm2 before replacing .next chunks — avoids MODULE_NOT_FOUND if requests
# hit the server while rsync --delete is mid-transfer.
if [[ "$DRY_RUN" != "1" ]]; then
  log "Stopping pm2 (dev + prod) for: ${SITES[*]}"
  pm2_stop_deploy_apps
fi

# --- Rsync per-site build artifacts ---
for site in "${SITES[@]}"; do
  log "  .build/$site/"
  if [[ "$SKIP_BUILD" != "1" ]]; then
    log "  verify .build/$site/.next"
    PROJECT="$site" node "$FRONTEND_DIR/scripts/verify-next-build.mjs"
  fi
  "${RSYNC_SSH[@]}" --delete \
    --exclude '.next/types/' \
    --exclude '.next/trace' \
    --exclude '.next/cache/' \
    --exclude '.next/static/development/' \
    --exclude 'assets/cards/' \
    --exclude 'data/cards-catalog.json' \
    --exclude 'data/landing-cards.json' \
    "$FRONTEND_DIR/.build/$site/" \
    "$SSH_TARGET:$VPS_FRONTEND_DIR/.build/$site/"
  # Excluded paths are not deleted by rsync --delete; purge stale dev output on the VPS.
  ssh "$SSH_TARGET" "rm -rf '$VPS_FRONTEND_DIR/.build/$site/.next/static/development'"
  if [[ "$DRY_RUN" != "1" ]]; then
    ssh "$SSH_TARGET" "rm -rf '$VPS_FRONTEND_DIR/.build/$site/assets/cards' && \
      rm -f \
      '$VPS_FRONTEND_DIR/.build/$site/data/cards-catalog.json' \
      '$VPS_FRONTEND_DIR/.build/$site/data/landing-cards.json'"
  fi
done

# --- Rsync minimal projects/ (registry + manifests only) ---
# Registry on the VPS must match deployed sites only — e.g. iyashikei-only VPS
# keeps index 0 → port 3100. Never push the full local multi-site registry when
# deploying a single site to a dedicated host.
log "Syncing minimal projects/…"
DEPLOY_REGISTRY_TMP="$(mktemp)"
node -e "
  const r = require('$REPO_ROOT/projects/registry.json');
  const sites = $(node -e "console.log(JSON.stringify(process.argv.slice(1)))" "${SITES[@]}");
  const filtered = r.filter((s) => sites.includes(s.id));
  if (!filtered.length) {
    console.error('No matching sites in local registry.json');
    process.exit(1);
  }
  process.stdout.write(JSON.stringify(filtered, null, 2) + '\n');
" > "$DEPLOY_REGISTRY_TMP"
log "  registry.json → ${#SITES[@]} site(s): ${SITES[*]}"
"${RSYNC_SSH[@]}" \
  "$DEPLOY_REGISTRY_TMP" \
  "$SSH_TARGET:$VPS_PROJECTS_DIR/registry.json"
rm -f "$DEPLOY_REGISTRY_TMP"

for site in "${SITES[@]}"; do
  ssh "$SSH_TARGET" "mkdir -p '$VPS_PROJECTS_DIR/$site'"
  "${RSYNC_SSH[@]}" \
    "$REPO_ROOT/projects/$site/manifest.json" \
    "$SSH_TARGET:$VPS_PROJECTS_DIR/$site/"
done

# --- Optional: sync .env.production ---
if [[ "${SYNC_ENV:-0}" == "1" && -f "$FRONTEND_DIR/.env.production" ]]; then
  log "Syncing .env.production"
  "${RSYNC_SSH[@]}" \
    "$FRONTEND_DIR/.env.production" \
    "$SSH_TARGET:$VPS_FRONTEND_DIR/"
fi

# --- Remote: install deps + restart pm2 ---
if [[ "$DRY_RUN" == "1" ]]; then
  log "Dry run — skipping remote npm/pm2."
  exit 0
fi

log "Verifying build artifacts on VPS…"
for site in "${SITES[@]}"; do
  ssh "$SSH_TARGET" "cd '$VPS_FRONTEND_DIR' && PROJECT='$site' node scripts/verify-next-build.mjs"
done

log "Installing production deps on VPS…"
ssh "$SSH_TARGET" bash -s <<REMOTE
set -euo pipefail
cd "$VPS_FRONTEND_DIR"
npm ci --omit=dev
REMOTE

log "Starting pm2 for: $(deploy_pm2_apps | tr '\n' ' ')"
# Pass VPS_FRONTEND_DIR into the remote start helper.
ssh "$SSH_TARGET" "VPS_FRONTEND_DIR='$VPS_FRONTEND_DIR' bash -s" <<REMOTE
set -euo pipefail
cd "\$VPS_FRONTEND_DIR"
$(deploy_pm2_apps | while read -r app; do
  [[ -z "$app" ]] && continue
  echo "if pm2 describe '$app' >/dev/null 2>&1; then pm2 restart '$app' --update-env; else pm2 start ecosystem.config.cjs --only '$app'; fi"
done)
pm2 save
REMOTE

log "Smoke-testing deployed sites…"
for site in "${SITES[@]}"; do
  # Port comes from the VPS registry (after sync), not local index — dedicated hosts
  # often run iyashikei at 3100 while local registry puts it at 3102.
  port="$(ssh "$SSH_TARGET" "node -e \"
    const r = require('$VPS_PROJECTS_DIR/registry.json');
    const idx = r.findIndex((s) => s.id === '$site');
    if (idx < 0) { process.stderr.write('site not in VPS registry\\n'); process.exit(1); }
    console.log(Number(process.env.PM2_PROD_PORT_BASE || 3100) + idx);
  \"")"
  status="$(ssh "$SSH_TARGET" "curl -s -o /dev/null -w '%{http_code}' --max-time 15 http://127.0.0.1:${port}/" 2>/dev/null || true)"
  status="${status:-000}"
  body="$(ssh "$SSH_TARGET" "curl -s --max-time 15 http://127.0.0.1:${port}/ 2>/dev/null | head -c 8000" || true)"
  if echo "$body" | grep -qE 'react-refresh|/_next/static/development/|/_next/static/chunks/webpack\.js'; then
    echo "[deploy] ERROR: $site on port $port is serving DEV mode (stop ${site}-dev on VPS)." >&2
    exit 1
  fi
  if [[ "$status" != "200" ]]; then
    echo "[deploy] ERROR: $site on port $port returned HTTP $status (expected 200)." >&2
    echo "[deploy] On VPS: pm2 logs ${site}-prod --lines 40" >&2
    exit 1
  fi
  log "  $site HTTP $status on port $port (production)"
done

log "Done."
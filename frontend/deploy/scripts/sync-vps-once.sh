#!/usr/bin/env bash
# One-time sync: deploy/nginx + registry changes → VPS. Delete after use.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPO_ROOT="$(cd "$FRONTEND_DIR/.." && pwd)"
CONFIG_FILE="$FRONTEND_DIR/deploy/deploy.local.env"

[[ -f "$CONFIG_FILE" ]] || { echo "Missing $CONFIG_FILE" >&2; exit 1; }
# shellcheck source=/dev/null
source "$CONFIG_FILE"

: "${VPS_HOST:?Set VPS_HOST in deploy.local.env}"
: "${VPS_USER:?Set VPS_USER in deploy.local.env}"
: "${VPS_FRONTEND_DIR:?Set VPS_FRONTEND_DIR}"
: "${VPS_PROJECTS_DIR:?Set VPS_PROJECTS_DIR}"

TARGET="${VPS_USER}@${VPS_HOST}"
VPS_REPO_ROOT="$(dirname "$VPS_FRONTEND_DIR")"

echo "[sync-once] → $TARGET"

scp "$FRONTEND_DIR/deploy/nginx/site.conf.tpl" \
  "$TARGET:$VPS_FRONTEND_DIR/deploy/nginx/"

scp "$FRONTEND_DIR/deploy/scripts/generate-nginx.mjs" \
  "$FRONTEND_DIR/deploy/scripts/setup-vps.sh" \
  "$FRONTEND_DIR/deploy/scripts/deploy-from-local.sh" \
  "$TARGET:$VPS_FRONTEND_DIR/deploy/scripts/"

scp "$FRONTEND_DIR/scripts/registry-sites.mjs" \
  "$TARGET:$VPS_FRONTEND_DIR/scripts/"

scp "$FRONTEND_DIR/deploy/README.md" \
  "$TARGET:$VPS_FRONTEND_DIR/deploy/"

scp "$REPO_ROOT/projects/registry.json" \
  "$TARGET:$VPS_PROJECTS_DIR/"

ssh "$TARGET" "mkdir -p '$VPS_PROJECTS_DIR/scripts' '$VPS_REPO_ROOT/notes'"

scp "$REPO_ROOT/projects/scripts/site-url.mjs" \
  "$TARGET:$VPS_PROJECTS_DIR/scripts/"

scp "$REPO_ROOT/notes/nginx-deploy.md" \
  "$TARGET:$VPS_REPO_ROOT/notes/"

echo "[sync-once] Done. On VPS:"
echo "  cd $VPS_FRONTEND_DIR"
echo "  sudo bash deploy/scripts/setup-vps.sh reload"
echo "  sudo certbot --nginx --expand --non-interactive --agree-tos -m you@example.com \\"
echo "    -d staging.voidborn.fun -d test.sportsydeals.com"

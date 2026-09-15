#!/usr/bin/env bash
# Frontend VPS bootstrap — nginx (systemd) + pm2 site map.
# TLS is manual via certbot --nginx (not managed by generate-nginx.mjs).
#
#   cd /path/to/constructor-files/frontend
#   sudo bash deploy/scripts/setup-vps.sh install
#   sudo bash deploy/scripts/setup-vps.sh configure
#   # point DNS A records to this VPS, then certbot manually (see deploy/README.md)
#   sudo bash deploy/scripts/setup-vps.sh reload
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
NGINX_AVAILABLE="/etc/nginx/sites-available/constructor-frontend.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/constructor-frontend.conf"
NGINX_HTPASSWD="/etc/nginx/constructor-htpasswd"
SITE_AUTH_USERNAME="${SITE_AUTH_USERNAME:-dev}"
SITE_AUTH_PASSWORD="${SITE_AUTH_PASSWORD:-dev}"

log() { echo "[setup-vps] $*"; }
warn() { echo "[setup-vps] WARNING: $*" >&2; }
die() { echo "[setup-vps] ERROR: $*" >&2; exit 1; }

require_root() {
  [[ "${EUID:-$(id -u)}" -eq 0 ]] || die "Run as root: sudo bash $0 $*"
}

write_htpasswd() {
  HASH="$(openssl passwd -apr1 "$SITE_AUTH_PASSWORD")"
  printf '%s:%s\n' "$SITE_AUTH_USERNAME" "$HASH" > "$NGINX_HTPASSWD"
  chmod 640 "$NGINX_HTPASSWD"
  chown root:www-data "$NGINX_HTPASSWD" 2>/dev/null || true
  log "HTTP basic auth: $SITE_AUTH_USERNAME (file: $NGINX_HTPASSWD)"
}

cmd_install() {
  require_root
  log "Installing nginx and certbot…"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq
  apt-get install -y nginx certbot python3-certbot-nginx
  mkdir -p /var/www/certbot
  systemctl enable nginx
  systemctl start nginx
  log "nginx enabled (systemd). Version: $(nginx -v 2>&1)"
}

cmd_configure() {
  require_root
  write_htpasswd
  log "Generating HTTP nginx config from registry${NGINX_SITES:+ (sites: $NGINX_SITES)}…"
  # Dedicated VPS example: NGINX_SITES=final_whistle sudo -E bash deploy/scripts/setup-vps.sh configure
  node "$FRONTEND_DIR/deploy/scripts/generate-nginx.mjs" --install
  ln -sf "$NGINX_AVAILABLE" "$NGINX_ENABLED"
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl reload nginx
  log "Configured. Sites → pm2 prod ports (see deploy/output/cors-origins.txt for backend CORS)."
  log "Next: point DNS here, then run certbot --nginx manually (see deploy/README.md)."
}

cmd_reload() {
  require_root
  warn "Regenerating nginx removes certbot SSL blocks — re-run certbot --nginx after reload if you use HTTPS."
  write_htpasswd
  node "$FRONTEND_DIR/deploy/scripts/generate-nginx.mjs" --install
  nginx -t
  systemctl reload nginx
  log "nginx reloaded (HTTP only until you run certbot again)."
}

cmd_all() {
  cmd_install
  cmd_configure
  log "Run certbot --nginx manually after DNS is live (see deploy/README.md)."
}

case "${1:-}" in
  install)   cmd_install ;;
  configure) cmd_configure ;;
  reload)    cmd_reload ;;
  all)       cmd_all ;;
  *)
    cat <<EOF
Usage: sudo bash deploy/scripts/setup-vps.sh <command>

  install    apt install nginx + certbot, enable systemd service
  configure  generate HTTP site blocks, enable constructor-frontend.conf
  reload     regenerate HTTP config and reload (re-run certbot after if using HTTPS)
  all        install + configure

TLS (manual, after DNS points here):
  sudo certbot --nginx --expand -m you@example.com \\
    -d staging.voidborn.fun -d test.sportsydeals.com

Before first deploy:
  1. npm run compile:all && build each site
  2. pm2 start ecosystem.config.cjs --only voidborn-prod,project2-prod
  3. Copy deploy/env.production.example → .env.production (set BACKEND API URL)
  4. Point each site domain A record to this VPS
EOF
    exit 1
    ;;
esac

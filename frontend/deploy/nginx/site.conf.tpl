# {{DOMAIN}} — {{PROJECT}} ({{ROLE}}, pm2 port {{PORT}})
# TLS: add manually with certbot --nginx (not generated here).
#
# Cache policy (all projects):
#   /_next/static/, /play/assets/ — content-hashed; immutable long cache
#   everything else — no-store so HTML shells stay fresh on old mobile browsers

server {
    listen 80;
    listen [::]:80;
    server_name {{DOMAIN}}{{#WWW}} www.{{DOMAIN}}{{/WWW}};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    client_max_body_size 50m;

{{#STAGING_AUTH}}
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/constructor-htpasswd;

{{/STAGING_AUTH}}
{{#SENDMAIL_PROXY}}
    location /api/sendmail/ {
        auth_basic off;
        proxy_pass http://127.0.0.1:6001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

{{/SENDMAIL_PROXY}}
    location /_next/static/ {
        proxy_pass http://127.0.0.1:{{PORT}};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_hide_header Cache-Control;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    location /play/assets/ {
        proxy_pass http://127.0.0.1:{{PORT}};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_hide_header Cache-Control;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }

    location / {
        proxy_pass http://127.0.0.1:{{PORT}};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_read_timeout 86400;

        proxy_hide_header Cache-Control;
        proxy_hide_header Expires;
        proxy_hide_header Pragma;

        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }
}

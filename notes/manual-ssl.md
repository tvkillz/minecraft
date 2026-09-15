```bash
cd ~/constructor-files/frontend

sudo certbot --nginx --non-interactive --agree-tos -m YOUR_REAL_EMAIL \
  -d voidborn.fun \
  -d test.sportsydeals.com

sudo node deploy/scripts/generate-nginx.mjs --install
sudo nginx -t && sudo systemctl reload nginx
```
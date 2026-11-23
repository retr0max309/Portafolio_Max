#!/usr/bin/env bash
# One-time migration from Docker on public port 80 to Nginx on ports 80/443.
# Usage: sudo bash configure-https-vm.sh portafolio.168-138-148-187.sslip.io /path/to/compose.prod.yml
set -Eeuo pipefail

[[ $EUID -eq 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }
PUBLIC_HOST="${1:-}"
COMPOSE_SOURCE="${2:-}"
[[ $PUBLIC_HOST =~ ^portafolio\.([0-9]{1,3}-){3}[0-9]{1,3}\.sslip\.io$ ]] || {
  echo 'Expected a portafolio.<IP-with-dashes>.sslip.io hostname.' >&2
  exit 1
}
[[ -f $COMPOSE_SOURCE ]] || { echo 'Pass the production Compose file.' >&2; exit 1; }

APP_DIR=/opt/portafolio
ENV_FILE="$APP_DIR/.env.production"
COMPOSE_FILE="$APP_DIR/compose.prod.yml"
[[ -s $ENV_FILE ]] || { echo 'Missing /opt/portafolio/.env.production.' >&2; exit 1; }

# A certificate can only be issued if the public hostname points to this VM.
PUBLIC_IP="$(curl -fsS --max-time 10 https://api.ipify.org)"
DNS_IP="$(getent ahostsv4 "$PUBLIC_HOST" | awk 'NR == 1 { print $1 }')"
[[ $PUBLIC_IP == "$DNS_IP" ]] || {
  echo "DNS points to $DNS_IP, but this VM is $PUBLIC_IP." >&2
  exit 1
}

export DEBIAN_FRONTEND=noninteractive
POLICY_CREATED=0
if [[ ! -e /usr/sbin/policy-rc.d ]]; then
  printf '#!/bin/sh\nexit 101\n' > /usr/sbin/policy-rc.d
  chmod 0755 /usr/sbin/policy-rc.d
  POLICY_CREATED=1
fi
cleanup() {
  if [[ $POLICY_CREATED == 1 ]]; then rm -f /usr/sbin/policy-rc.d; fi
}
trap cleanup EXIT
apt-get update -qq
apt-get install -y -qq nginx certbot
cleanup
POLICY_CREATED=0

# The web container becomes private to the VM; Nginx takes over public ports.
install -m 0644 "$COMPOSE_SOURCE" "$COMPOSE_FILE"
if grep -q '^WEB_PORT=' "$ENV_FILE"; then
  sed -i -E 's/^WEB_PORT=.*/WEB_PORT=8080/' "$ENV_FILE"
else
  printf '\nWEB_PORT=8080\n' >> "$ENV_FILE"
fi
if grep -q '^PUBLIC_HOST=' "$ENV_FILE"; then
  sed -i -E "s/^PUBLIC_HOST=.*/PUBLIC_HOST=${PUBLIC_HOST}/" "$ENV_FILE"
else
  printf 'PUBLIC_HOST=%s\n' "$PUBLIC_HOST" >> "$ENV_FILE"
fi
cd "$APP_DIR"
docker compose --env-file .env.production -f compose.prod.yml config --quiet
docker compose --env-file .env.production -f compose.prod.yml up -d --no-build --wait
curl -fsS --max-time 20 http://127.0.0.1:8080/ >/dev/null

install -d -m 0755 /var/www/letsencrypt/.well-known/acme-challenge
cat > /etc/nginx/snippets/portafolio-proxy.conf <<'EOF'
proxy_pass http://127.0.0.1:8080;
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_read_timeout 60s;
EOF

# Keep HTTP access by IP while ACME validates the named host on port 80.
cat > /etc/nginx/sites-available/portafolio <<'EOF'
server {
    listen 80 default_server;
    server_name _;
    location / { include /etc/nginx/snippets/portafolio-proxy.conf; }
}
server {
    listen 80;
    server_name __HOST__;
    location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { include /etc/nginx/snippets/portafolio-proxy.conf; }
}
EOF
sed -i "s/__HOST__/${PUBLIC_HOST}/g" /etc/nginx/sites-available/portafolio
rm -f /etc/nginx/sites-enabled/default
ln -sfn /etc/nginx/sites-available/portafolio /etc/nginx/sites-enabled/portafolio
nginx -t
systemctl enable --now nginx
curl -fsS --max-time 20 \
  --resolve "${PUBLIC_HOST}:80:127.0.0.1" \
  "http://${PUBLIC_HOST}/" >/dev/null

if [[ ! -s /etc/letsencrypt/live/$PUBLIC_HOST/fullchain.pem ]]; then
  certbot certonly --webroot -w /var/www/letsencrypt \
    --non-interactive --agree-tos --register-unsafely-without-email \
    --cert-name "$PUBLIC_HOST" -d "$PUBLIC_HOST"
fi

cat > /etc/nginx/sites-available/portafolio <<'EOF'
server {
    listen 80 default_server;
    server_name _;
    location / { include /etc/nginx/snippets/portafolio-proxy.conf; }
}
server {
    listen 80;
    server_name __HOST__;
    location ^~ /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { return 301 https://$host$request_uri; }
}
server {
    listen 443 ssl;
    server_name __HOST__;
    ssl_certificate /etc/letsencrypt/live/__HOST__/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/__HOST__/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    location / { include /etc/nginx/snippets/portafolio-proxy.conf; }
}
EOF
sed -i "s/__HOST__/${PUBLIC_HOST}/g" /etc/nginx/sites-available/portafolio
nginx -t
systemctl reload nginx

install -d -m 0755 /etc/letsencrypt/renewal-hooks/deploy
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-portafolio-nginx <<'EOF'
#!/usr/bin/env bash
set -Eeuo pipefail
systemctl reload nginx
EOF
chmod 0755 /etc/letsencrypt/renewal-hooks/deploy/reload-portafolio-nginx
systemctl enable --now certbot.timer

curl -fsS --max-time 20 \
  --resolve "${PUBLIC_HOST}:443:127.0.0.1" \
  "https://${PUBLIC_HOST}/" >/dev/null
echo "HTTPS ready at https://${PUBLIC_HOST}/"

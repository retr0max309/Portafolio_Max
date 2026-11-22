#!/usr/bin/env bash
# Ejecutar en la VM: sudo bash scripts/deploy-vm.sh IP_PUBLICA_DEL_ADMIN/32
set -Eeuo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Ejecuta este script con sudo." >&2
  exit 1
fi

SSH_ALLOW_CIDR="${1:-}"
if [[ ! $SSH_ALLOW_CIDR =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}/32$ ]]; then
  echo "Indica tu IPv4 publica con /32" >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
STAGE_DIR="$(dirname -- "$SCRIPT_DIR")"
APP_DIR=/opt/portafolio
ENV_FILE="$STAGE_DIR/.env.production"
COMPOSE_FILE="$STAGE_DIR/compose.prod.yml"
RELEASE_HELPER="$SCRIPT_DIR/remote-release.sh"

[[ -f $ENV_FILE && -f $COMPOSE_FILE && -f $RELEASE_HELPER ]] || {
  echo "Faltan .env.production, compose.prod.yml o scripts/remote-release.sh." >&2
  exit 1
}

for name in DOCKERHUB_USERNAME IMAGE_TAG WEB_PORT SUPABASE_URL SUPABASE_PUBLISHABLE_KEY; do
  if ! grep -Eq "^${name}=.+" "$ENV_FILE"; then
    echo "Falta ${name} en .env.production." >&2
    exit 1
  fi
done
if ! tr -d '\r' < "$ENV_FILE" | grep -Eq '^WEB_PORT=80$'; then
  echo "En la VM, WEB_PORT debe ser 80 para publicar la pagina por HTTP." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl git gnupg iptables iptables-persistent

# La regla /32 debe estar antes del bloqueo de SSH. Así el administrador no
# pierde acceso mientras configuramos el firewall de Ubuntu.
iptables -C INPUT -p tcp -s "$SSH_ALLOW_CIDR" --dport 22 -j ACCEPT 2>/dev/null || \
  iptables -I INPUT 1 -p tcp -s "$SSH_ALLOW_CIDR" --dport 22 -j ACCEPT
iptables -C INPUT -p tcp --dport 22 -j DROP 2>/dev/null || \
  iptables -I INPUT 2 -p tcp --dport 22 -j DROP
for port in 80 443; do
  iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null || \
    iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
done
netfilter-persistent save
systemctl enable netfilter-persistent >/dev/null

# Repositorio oficial de Docker para Ubuntu 24.04 (noble).
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker >/dev/null

# OCI Run Command usa el usuario ocarun. Solo le damos sudo para este helper.
install -m 0755 "$RELEASE_HELPER" /usr/local/sbin/portafolio-release
printf '%s\n' 'ocarun ALL=(root) NOPASSWD: /usr/local/sbin/portafolio-release *' \
  > /etc/sudoers.d/101-portafolio-release
chmod 0440 /etc/sudoers.d/101-portafolio-release
visudo -cf /etc/sudoers.d/101-portafolio-release >/dev/null

install -m 0755 -d "$APP_DIR"
install -m 0644 "$COMPOSE_FILE" "$APP_DIR/compose.prod.yml"
install -m 0600 "$ENV_FILE" "$APP_DIR/.env.production"
cd "$APP_DIR"
docker compose --env-file .env.production -f compose.prod.yml config --quiet
docker compose --env-file .env.production -f compose.prod.yml pull
docker compose --env-file .env.production -f compose.prod.yml up -d --no-build --wait
curl --fail --silent --show-error --max-time 20 http://127.0.0.1/ >/dev/null
echo "Portafolio desplegado en HTTP puerto 80."

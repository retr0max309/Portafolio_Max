#!/usr/bin/env bash
# Called by OCI Run Command through the narrowly scoped sudoers rule.
set -Eeuo pipefail

[[ $EUID -eq 0 ]] || { echo "Run as root" >&2; exit 1; }
APP_DIR=/opt/portafolio
ENV_FILE="$APP_DIR/.env.production"
COMPOSE_FILE="$APP_DIR/compose.prod.yml"

if [[ ${1:-} == --check ]]; then
  test -s "$ENV_FILE"
  docker info >/dev/null
  echo "Release helper ready"
  exit 0
fi

COMMIT_SHA="${1:-}"
[[ $COMMIT_SHA =~ ^[0-9a-f]{40}$ ]] || {
  echo "Expected a full lowercase Git commit SHA" >&2
  exit 1
}
test -s "$ENV_FILE"
grep -q '^IMAGE_TAG=' "$ENV_FILE"

# A commit SHA fixes the Compose file and both image tags to one Git revision.
TEMP_COMPOSE="$(mktemp)"
trap 'rm -f "$TEMP_COMPOSE"' EXIT
curl -fsSL --retry 3 --max-time 30 \
  "https://raw.githubusercontent.com/retr0max309/Portafolio_Max/${COMMIT_SHA}/compose.prod.yml" \
  -o "$TEMP_COMPOSE"
test -s "$TEMP_COMPOSE"

install -m 0644 "$TEMP_COMPOSE" "$COMPOSE_FILE"
sed -i -E "s/^IMAGE_TAG=.*/IMAGE_TAG=sha-${COMMIT_SHA}/" "$ENV_FILE"
cd "$APP_DIR"
docker compose --env-file .env.production -f compose.prod.yml config --quiet
docker compose --env-file .env.production -f compose.prod.yml pull --quiet
docker compose --env-file .env.production -f compose.prod.yml up -d --no-build --wait --quiet-pull
curl --fail --silent --show-error --max-time 20 http://127.0.0.1:8080/ >/dev/null
if grep -q '^PUBLIC_HOST=' "$ENV_FILE"; then
  PUBLIC_HOST="$(sed -n 's/^PUBLIC_HOST=//p' "$ENV_FILE" | tail -n 1 | tr -d '\r')"
  curl --fail --silent --show-error --max-time 20 \
    --resolve "${PUBLIC_HOST}:443:127.0.0.1" \
    "https://${PUBLIC_HOST}/" >/dev/null
fi
echo "Release sha-${COMMIT_SHA} healthy"

#!/usr/bin/env bash
# Starts everything for local development:
#   postgres + redis (docker), then api (3000), client-web (4200), trainer-web (4201), admin-web (4202).
# Usage: tools/dev/start-all.sh [--no-infra] [--no-migrate]   (or: pnpm dev:all)
# Ctrl+C stops the four servers. Infra keeps running; stop it with `pnpm dev:infra:down`.
set -euo pipefail

cd "$(dirname "$0")/../.."

START_INFRA=true
RUN_MIGRATE=true
for arg in "$@"; do
  case "$arg" in
    --no-infra) START_INFRA=false ;;
    --no-migrate) RUN_MIGRATE=false ;;
    -h | --help)
      sed -n '2,5p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "Unknown option: $arg" >&2
      exit 1
      ;;
  esac
done

# Nx loads .env from the workspace root for every task, so the API picks these values up.
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

if [ "$START_INFRA" = true ]; then
  echo "Starting postgres and redis..."
  pnpm dev:infra
fi

if [ "$RUN_MIGRATE" = true ]; then
  echo "Applying database migrations..."
  pnpm db:migrate
fi

echo "Starting api, client-web, trainer-web and admin-web..."
exec pnpm nx run-many -t serve -p api client-web trainer-web admin-web --parallel=4

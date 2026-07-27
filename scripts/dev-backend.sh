#!/usr/bin/env bash
# Dev launcher for the Go backend. Used by .claude/launch.json.
#
# The backend does not load .env itself (no godotenv), so every var must come
# from the environment. Under WSL the Go toolchain on PATH is the Windows
# go.exe, and WSL does not forward Linux env vars to Windows processes unless
# they are named in WSLENV — hence the generated WSLENV below.
set -euo pipefail

cd "$(dirname "$0")/.."

set -a
# shellcheck disable=SC1091
. ./.env
set +a

# ponytail: no local Postgres wired up yet; backend boots in offline mode.
# Drop this once .env DATABASE_URL matches a running instance.
export ALLOW_NO_DB=true

# Forward every .env key (plus ALLOW_NO_DB) across the WSL/Windows boundary.
# Regenerated from .env on each launch so new vars need no edit here.
keys=$(grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' .env | tr -d '=' | paste -sd:)
export WSLENV="${keys}:ALLOW_NO_DB"

cd backend
# go.exe under WSL, plain go elsewhere.
if command -v go >/dev/null 2>&1; then
  exec go run ./cmd/kirmya
else
  exec go.exe run ./cmd/kirmya
fi

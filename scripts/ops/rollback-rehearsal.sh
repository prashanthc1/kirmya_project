#!/usr/bin/env bash
#
# Rollback rehearsal: prove the previous release still works against the schema
# this release migrated to.
#
# Step 9.2 and step 12.3 ask for a rehearsed rollback rather than a documented
# one. docs/deployment/rollback.md claims schema additions "remain backward
# compatible with the previous application version" under an Expand/Contract
# protocol. Nothing had ever tested that claim, and the migration runner in
# internal/shared/database/migrations.go applies only *.up.sql - it has no down
# path at all, and 39 of the 98 up migrations have no .down.sql beside them. So
# a rollback cannot take the schema back with it: the only rollback this
# platform can perform is to put the previous application binary back in front
# of the newer schema. That is exactly what this rehearses.
#
# What it does, in order:
#   1. resolves the previous release commit and the candidate
#   2. builds the API from each, in an isolated worktree for the old one
#   3. creates a disposable database and migrates it with the CANDIDATE's
#      migrations, so the schema is the new one
#   4. reports which migrations the previous release does not know about
#   5. starts the PREVIOUS binary against that new schema and drives the hiring
#      journey through it: register, publish, public read, apply
#   6. rolls forward again - the candidate binary against the same database -
#      and repeats the journey, so the rehearsal ends where a real one would
#
# It never touches an existing database. The target is created and dropped here.
#
# Usage:
#   scripts/ops/rollback-rehearsal.sh
#
# Environment:
#   ADMIN_DATABASE_URL   a URL on the server to create the target on (required)
#   PREVIOUS_REF         release to roll back to        (default: previous first-parent merge)
#   ROLLBACK_DB_NAME     disposable target              (default kirmya_rollback_rehearsal)
#   REHEARSAL_PORT       port for each API              (default 8099)

set -uo pipefail

ADMIN_URL="${ADMIN_DATABASE_URL:-}"
if [ -z "$ADMIN_URL" ]; then
  echo "ADMIN_DATABASE_URL is required (e.g. postgres://user:pass@host:5432/postgres?sslmode=disable)" >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET_DB="${ROLLBACK_DB_NAME:-kirmya_rollback_rehearsal}"
PORT="${REHEARSAL_PORT:-8099}"
WORKDIR="$(mktemp -d)"
OLD_TREE="$WORKDIR/previous"
TARGET_URL="${ADMIN_URL%/*}/$TARGET_DB"
QUERY=""
case "$TARGET_URL" in *\?*) QUERY="?${TARGET_URL#*\?}"; TARGET_URL="${TARGET_URL%%\?*}";; esac
TARGET_URL="$TARGET_URL$QUERY"

CANDIDATE="$(git -C "$REPO_ROOT" rev-parse HEAD)"
PREVIOUS="${PREVIOUS_REF:-$(git -C "$REPO_ROOT" rev-list --first-parent --merges -n 2 HEAD | tail -1)}"
if [ -z "$PREVIOUS" ]; then
  echo "Could not resolve a previous release; set PREVIOUS_REF" >&2
  exit 2
fi

cleanup() {
  [ -n "${API_PID:-}" ] && kill "$API_PID" 2>/dev/null
  psql "$ADMIN_URL" -q -c "DROP DATABASE IF EXISTS $TARGET_DB WITH (FORCE)" >/dev/null 2>&1
  git -C "$REPO_ROOT" worktree remove --force "$OLD_TREE" >/dev/null 2>&1
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

start_api() {
  local binary="$1" label="$2"
  (
    cd "$REPO_ROOT/backend" &&
    DATABASE_URL="$TARGET_URL" SERVER_PORT="$PORT" APP_ENV=test ALLOW_NO_DB=false \
    JWT_SECRET="${JWT_SECRET:-disposable-rehearsal-key-not-for-deployment-0123456789}" \
    OTEL_ENABLED=false ENABLE_TRACING=false REDIS_ENABLED=false \
    RATE_LIMIT_REQUESTS=60000 RATE_LIMIT_BURST=12000 \
    AUTH_RATE_LIMIT_REQUESTS=60000 AUTH_RATE_LIMIT_BURST=12000 \
    "$binary"
  ) > "$WORKDIR/$label.log" 2>&1 &
  API_PID=$!
  for _ in $(seq 1 60); do
    curl --fail --silent "http://127.0.0.1:$PORT/health" > /dev/null 2>&1 && return 0
    kill -0 "$API_PID" 2>/dev/null || break
    sleep 1
  done
  echo "FAIL: the $label API did not start"
  tail -20 "$WORKDIR/$label.log"
  return 1
}

stop_api() {
  [ -n "${API_PID:-}" ] || return 0
  kill "$API_PID" 2>/dev/null
  wait "$API_PID" 2>/dev/null
  API_PID=""
}

journey() {
  local label="$1"
  local api="http://127.0.0.1:$PORT"
  local suffix password employer seeker token job status ready

  ready=$(curl -s -o /dev/null -w '%{http_code}' "$api/health/ready")
  echo "  readiness: $ready"
  [ "$ready" = "200" ] || { echo "  FAIL: not ready"; return 1; }

  suffix="$(date +%s)-$RANDOM"
  password='Disposable-rehearsal-password-123!'
  employer="rollback-employer-$suffix@example.invalid"
  seeker="rollback-seeker-$suffix@example.invalid"

  register_and_login() {
    curl -s -o /dev/null -X POST "$api/api/v1/auth/register" -H 'Content-Type: application/json' \
      -d "{\"firstName\":\"Rollback\",\"lastName\":\"Rehearsal\",\"email\":\"$1\",\"password\":\"$password\",\"acceptTerms\":true,\"acceptPrivacy\":true}"
    curl -s -X POST "$api/api/v1/auth/login" -H 'Content-Type: application/json' \
      -d "{\"email\":\"$1\",\"password\":\"$password\"}" \
      | python3 -c 'import sys,json; print(json.load(sys.stdin).get("accessToken",""))' 2>/dev/null
  }

  token="$(register_and_login "$employer")"
  [ -n "$token" ] || { echo "  FAIL: $label could not register and sign in"; return 1; }
  echo "  ok: registration and sign-in"

  job="$(curl -s -X POST "$api/api/v1/recruiter/jobs" \
    -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
    -d '{"title":"Rollback rehearsal posting","description":"Published to prove the previous release serves the migrated schema.","status":"Active","workplaceType":"Remote","employmentType":"Full-time","location":"Remote"}' \
    | python3 -c 'import sys,json; print(json.load(sys.stdin).get("id",""))' 2>/dev/null)"
  [ -n "$job" ] || { echo "  FAIL: $label could not publish a job"; return 1; }
  echo "  ok: job published ($job)"

  curl -s --fail "$api/api/v1/jobs/$job" > /dev/null || { echo "  FAIL: $label cannot read the posting"; return 1; }
  echo "  ok: the posting is publicly readable"

  token="$(register_and_login "$seeker")"
  status="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$api/api/v1/jobs/$job/apply" \
    -H "Authorization: Bearer $token" -H 'Content-Type: application/json' \
    -d '{"coverLetter":"Applied during a rollback rehearsal."}')"
  case "$status" in
    20*) echo "  ok: application submitted ($status)" ;;
    *)   echo "  FAIL: $label application returned $status"; return 1 ;;
  esac
}

echo "== 1. releases =="
echo "candidate $CANDIDATE  $(git -C "$REPO_ROOT" log -1 --format=%s "$CANDIDATE")"
echo "previous  $PREVIOUS  $(git -C "$REPO_ROOT" log -1 --format=%s "$PREVIOUS")"

echo
echo "== 2. build both releases =="
git -C "$REPO_ROOT" worktree add --detach "$OLD_TREE" "$PREVIOUS" >/dev/null 2>&1 || {
  echo "FAIL: could not create a worktree at $PREVIOUS" >&2; exit 1; }
(cd "$OLD_TREE/backend" && go build -o "$WORKDIR/kirmya-previous" ./cmd/kirmya) || {
  echo "FAIL: the previous release does not build" >&2; exit 1; }
(cd "$REPO_ROOT/backend" && go build -o "$WORKDIR/kirmya-candidate" ./cmd/kirmya) || {
  echo "FAIL: the candidate does not build" >&2; exit 1; }
(cd "$REPO_ROOT/backend" && go build -o "$WORKDIR/ci-migrate" ./tools/ci-migrate) || {
  echo "FAIL: the migration runner does not build" >&2; exit 1; }
echo "ok: both binaries built"

echo
echo "== 3. migrate a disposable database to the candidate schema =="
psql "$ADMIN_URL" -q -c "DROP DATABASE IF EXISTS $TARGET_DB WITH (FORCE)" >/dev/null 2>&1
psql "$ADMIN_URL" -q -c "CREATE DATABASE $TARGET_DB" >/dev/null || { echo "FAIL: could not create $TARGET_DB"; exit 1; }
(cd "$REPO_ROOT/backend" && DATABASE_URL="$TARGET_URL" "$WORKDIR/ci-migrate") > "$WORKDIR/migrate.log" 2>&1 || {
  echo "FAIL: migrations did not apply"; tail -10 "$WORKDIR/migrate.log"; exit 1; }
grep -o 'total=[0-9]* newly_applied=[0-9]*' "$WORKDIR/migrate.log" | head -1

echo
echo "== 4. migrations the previous release does not know about =="
NEW_MIGRATIONS="$(comm -23 \
  <(cd "$REPO_ROOT/backend/scripts/migrations" && ls *.up.sql | sort) \
  <(cd "$OLD_TREE/backend/scripts/migrations" && ls *.up.sql | sort))"
if [ -z "$NEW_MIGRATIONS" ]; then
  echo "none: the schema is identical in both releases"
else
  echo "$NEW_MIGRATIONS" | sed 's/^/  /'
fi

echo
echo "== 5. roll back: the PREVIOUS release against the candidate schema =="
start_api "$WORKDIR/kirmya-previous" previous || exit 1
journey "previous" || { stop_api; echo; echo "ROLLBACK REHEARSAL FAILED"; exit 1; }
stop_api

echo
echo "== 6. roll forward again: the candidate against the same database =="
start_api "$WORKDIR/kirmya-candidate" candidate || exit 1
journey "candidate" || { stop_api; echo; echo "ROLL-FORWARD FAILED"; exit 1; }
stop_api

echo
echo "== summary =="
echo "The previous release serves the hiring journey against the schema this"
echo "candidate migrates to, and the candidate serves it again afterwards."
echo "Rolling the application back does not require rolling the schema back."
echo "host $(nproc) CPU, $(free -g | awk '/^Mem:/{print $2}')GB RAM"

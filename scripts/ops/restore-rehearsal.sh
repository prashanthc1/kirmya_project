#!/usr/bin/env bash
#
# Restore rehearsal: take a backup, restore it into an isolated database, and
# prove the hiring journey works against what came back.
#
# Step 9 asks for a restore into isolation with recovery time and data loss
# measured, and explicitly says not to reuse historical claims. The runbook in
# docs/operations/KIRMYA_DATABASE_BACKUP_RECOVERY.md describes this procedure
# and, as far as anything in this repository shows, had never been run: there
# was no script, no recorded timing and no check that a restored database can
# actually serve a request. A runbook nobody has executed is a plan, not a
# recovery capability.
#
# What this does, in order:
#   1. counts the rows in the source database
#   2. takes a pg_dump custom-format backup, timed
#   3. creates a fresh database and restores into it, timed
#   4. re-counts and reports any row that did not survive
#   5. starts the API against the restored database and drives a real hiring
#      journey through it: register, publish a job, apply
#
# It touches the source database only to read it. The restore target is created
# and dropped by this script.
#
# Usage:
#   scripts/ops/restore-rehearsal.sh
#
# Environment:
#   SOURCE_DATABASE_URL   database to back up (required)
#   RESTORE_DB_NAME       target name              (default kirmya_restore_rehearsal)
#   API_BINARY            built API to serve with  (default backend/bin/kirmya-ci)
#   REHEARSAL_PORT        port for that API        (default 8098)
#   KEEP_RESTORED_DB      set to 1 to keep the restored database for inspection

set -uo pipefail

SOURCE_URL="${SOURCE_DATABASE_URL:-}"
if [ -z "$SOURCE_URL" ]; then
  echo "SOURCE_DATABASE_URL is required" >&2
  exit 2
fi

RESTORE_DB="${RESTORE_DB_NAME:-kirmya_restore_rehearsal}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API_BINARY="${API_BINARY:-$REPO_ROOT/backend/bin/kirmya-ci}"
PORT="${REHEARSAL_PORT:-8098}"
WORKDIR="$(mktemp -d)"
DUMP="$WORKDIR/kirmya-rehearsal.dump"

# The tables whose loss would be noticed. Counted before and after, so "the
# restore succeeded" is a statement about rows rather than about an exit code.
TABLES=(users jobs job_applications notifications notification_deliveries)

# Everything but the database name, so the target can be addressed on the same
# server as the source.
ADMIN_URL="${SOURCE_URL%/*}/postgres"

cleanup() {
  [ -n "${API_PID:-}" ] && kill "$API_PID" 2>/dev/null
  if [ "${KEEP_RESTORED_DB:-0}" != "1" ]; then
    psql "$ADMIN_URL" -q -c "DROP DATABASE IF EXISTS $RESTORE_DB WITH (FORCE)" >/dev/null 2>&1
  fi
  rm -rf "$WORKDIR"
}
trap cleanup EXIT

count_rows() {
  local url="$1"
  for table in "${TABLES[@]}"; do
    local n
    n="$(psql "$url" -tAc "SELECT count(*) FROM $table" 2>/dev/null || echo missing)"
    echo "$table=$n"
  done
}

echo "== 1. source inventory =="
BEFORE="$(count_rows "$SOURCE_URL")"
echo "$BEFORE"

echo
echo "== 2. backup =="
BACKUP_START=$(date +%s.%N)
if ! pg_dump -Fc --no-owner --no-acl -f "$DUMP" "$SOURCE_URL"; then
  echo "FAIL: pg_dump did not complete" >&2
  exit 1
fi
BACKUP_SECONDS=$(echo "$(date +%s.%N) - $BACKUP_START" | bc)
printf 'backup completed in %.1fs, %s\n' "$BACKUP_SECONDS" "$(du -h "$DUMP" | cut -f1)"

echo
echo "== 3. restore into an isolated database =="
RESTORE_START=$(date +%s.%N)
psql "$ADMIN_URL" -q -c "DROP DATABASE IF EXISTS $RESTORE_DB WITH (FORCE)" >/dev/null
psql "$ADMIN_URL" -q -c "CREATE DATABASE $RESTORE_DB" >/dev/null
RESTORE_URL="${SOURCE_URL%/*}/$RESTORE_DB"
# pg_restore reports non-fatal notices as errors; the row counts below decide
# whether the restore is good, not this exit code.
pg_restore --no-owner --no-acl -d "$RESTORE_URL" "$DUMP" > "$WORKDIR/restore.log" 2>&1
RESTORE_SECONDS=$(echo "$(date +%s.%N) - $RESTORE_START" | bc)
printf 'restore completed in %.1fs (%d messages logged)\n' \
  "$RESTORE_SECONDS" "$(wc -l < "$WORKDIR/restore.log")"

echo
echo "== 4. data loss =="
AFTER="$(count_rows "$RESTORE_URL")"
LOSS=0
while IFS= read -r line; do
  table="${line%%=*}"
  before="${line#*=}"
  after="$(echo "$AFTER" | grep "^$table=" | cut -d= -f2)"
  if [ "$before" != "$after" ]; then
    echo "LOST: $table had $before rows, restored with $after"
    LOSS=1
  else
    echo "ok: $table $after rows"
  fi
done <<< "$BEFORE"

echo
echo "== 5. hiring journey against the restored database =="
if [ ! -x "$API_BINARY" ]; then
  echo "SKIP: $API_BINARY is not built; run 'go build -o bin/kirmya-ci ./cmd/kirmya' in backend/" >&2
  exit $LOSS
fi

JOURNEY_START=$(date +%s.%N)
(
  cd "$REPO_ROOT/backend" &&
  DATABASE_URL="$RESTORE_URL" SERVER_PORT="$PORT" APP_ENV=test ALLOW_NO_DB=false \
  JWT_SECRET="${JWT_SECRET:-disposable-rehearsal-key-not-for-deployment-0123456789}" \
  OTEL_ENABLED=false ENABLE_TRACING=false \
  "$API_BINARY"
) > "$WORKDIR/api.log" 2>&1 &
API_PID=$!

API="http://127.0.0.1:$PORT"
for _ in $(seq 1 60); do
  curl --fail --silent "$API/health" > /dev/null 2>&1 && break
  sleep 1
done
if ! curl --fail --silent "$API/health" > /dev/null 2>&1; then
  echo "FAIL: the API did not start against the restored database"
  tail -5 "$WORKDIR/api.log"
  exit 1
fi

READY=$(curl -s -o /dev/null -w '%{http_code}' "$API/health/ready")
echo "readiness against the restored database: $READY"
[ "$READY" = "200" ] || { echo "FAIL: restored database is not ready"; exit 1; }

SUFFIX="$(date +%s)-$RANDOM"
PASSWORD='Disposable-rehearsal-password-123!'
EMPLOYER="rehearsal-employer-$SUFFIX@example.invalid"
SEEKER="rehearsal-seeker-$SUFFIX@example.invalid"

register_and_login() {
  curl -s -o /dev/null -X POST "$API/api/v1/auth/register" -H 'Content-Type: application/json' \
    -d "{\"firstName\":\"Restore\",\"lastName\":\"Rehearsal\",\"email\":\"$1\",\"password\":\"$PASSWORD\",\"acceptTerms\":true,\"acceptPrivacy\":true}"
  curl -s -X POST "$API/api/v1/auth/login" -H 'Content-Type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"$PASSWORD\"}" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("accessToken",""))'
}

EMPLOYER_TOKEN="$(register_and_login "$EMPLOYER")"
[ -n "$EMPLOYER_TOKEN" ] || { echo "FAIL: could not sign in against the restored database"; exit 1; }
echo "ok: registration and sign-in"

JOB_ID="$(curl -s -X POST "$API/api/v1/recruiter/jobs" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Restore rehearsal posting","description":"Published against a restored database to prove the hiring journey works.","status":"Active","workplaceType":"Remote","employmentType":"Full-time","location":"Remote"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin).get("id",""))')"
[ -n "$JOB_ID" ] || { echo "FAIL: could not publish a job"; exit 1; }
echo "ok: job published ($JOB_ID)"

curl -s --fail "$API/api/v1/jobs/$JOB_ID" > /dev/null || { echo "FAIL: the published job is not readable"; exit 1; }
echo "ok: the posting is publicly readable"

SEEKER_TOKEN="$(register_and_login "$SEEKER")"
APPLY_STATUS="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/api/v1/jobs/$JOB_ID/apply" \
  -H "Authorization: Bearer $SEEKER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"coverLetter":"Applied during a restore rehearsal."}')"
case "$APPLY_STATUS" in
  20*) echo "ok: application submitted ($APPLY_STATUS)" ;;
  *)   echo "FAIL: application returned $APPLY_STATUS"; exit 1 ;;
esac

JOURNEY_SECONDS=$(echo "$(date +%s.%N) - $JOURNEY_START" | bc)

echo
echo "== summary =="
printf 'backup           %.1fs\n' "$BACKUP_SECONDS"
printf 'restore          %.1fs\n' "$RESTORE_SECONDS"
printf 'journey verified %.1fs (includes API start)\n' "$JOURNEY_SECONDS"
printf 'recovery time    %.1fs from backup start to a serving, verified system\n' \
  "$(echo "$BACKUP_SECONDS + $RESTORE_SECONDS + $JOURNEY_SECONDS" | bc)"
if [ "$LOSS" = "0" ]; then
  echo 'data loss        none across the counted tables'
else
  echo 'data loss        SEE ABOVE'
fi
echo "host             $(nproc) CPU, $(free -g | awk '/^Mem:/{print $2}')GB RAM, $(psql "$SOURCE_URL" -tAc 'SHOW server_version' | tr -d ' ')"

exit $LOSS

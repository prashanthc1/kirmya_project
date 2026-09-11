#!/usr/bin/env bash
#
# Production smoke test: prove a deployed Kirmya is actually serving, not merely
# built.
#
# A green CI run says the code is correct. It says nothing about whether the
# deployed frontend can reach the deployed API, whether the refresh cookie comes
# back with attributes a browser will store, or whether the API's dependencies
# answered. Those are deployment properties, and every one of them has its own
# way of failing silently - a wrong NEXT_PUBLIC_API_URL is baked into the bundle
# at build time, a missing CORS origin only shows up in a browser, and a cookie
# without Secure is dropped by WebKit without an error anywhere.
#
# This checks the ones that can be checked from outside, in the order a user
# meets them.
#
# What it does NOT do: it never writes business data, never registers an
# account, and never touches administrative routes. It signs in as an account
# you supply and reads. Point it at production safely.
#
# Usage:
#   KIRMYA_FRONTEND_URL=https://kirmya.com \
#   KIRMYA_API_URL=https://api.kirmya.com \
#   KIRMYA_SMOKE_EMAIL=smoke@example.com \
#   KIRMYA_SMOKE_PASSWORD='...' \
#     scripts/ops/production-smoke.sh
#
#   # unauthenticated half only, for a public health check:
#   scripts/ops/production-smoke.sh --public-only
#
# Credentials come from the environment and are never echoed. Exits non-zero on
# the first failed assertion group, so it is usable as a deployment gate.

set -uo pipefail

FRONTEND_URL="${KIRMYA_FRONTEND_URL:-https://kirmya.com}"
API_URL="${KIRMYA_API_URL:-https://api.kirmya.com}"
API_URL="${API_URL%/}"
FRONTEND_URL="${FRONTEND_URL%/}"

PUBLIC_ONLY=0
[ "${1:-}" = "--public-only" ] && PUBLIC_ONLY=1

FAILURES=0
CURL=(curl --silent --show-error --max-time 20)

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILURES=$((FAILURES + 1)); }
info() { printf '  ....  %s\n' "$1"; }
group() { printf '\n%s\n' "$1"; }

# ---------------------------------------------------------------------------
group "1. Frontend is serving"

status=$("${CURL[@]}" -o /dev/null -w '%{http_code}' "$FRONTEND_URL/" 2>/dev/null)
if [ "$status" = "200" ]; then
  pass "GET $FRONTEND_URL/ -> 200"
else
  fail "GET $FRONTEND_URL/ -> ${status:-no response} (expected 200)"
fi

# The bundle is built with NEXT_PUBLIC_API_URL inlined. If the build arg was
# missing, the shipped bundle points at localhost and every browser call fails
# while the page itself still renders - so serving 200 is not enough to conclude
# the frontend works.
home=$("${CURL[@]}" "$FRONTEND_URL/" 2>/dev/null)
if printf '%s' "$home" | grep -q 'localhost:8080'; then
  fail "the served HTML references localhost:8080 - NEXT_PUBLIC_API_URL was not passed as a build arg"
else
  pass "no localhost API reference in the served HTML"
fi

# ---------------------------------------------------------------------------
group "2. API liveness and readiness"

status=$("${CURL[@]}" -o /dev/null -w '%{http_code}' "$API_URL/health/live" 2>/dev/null)
if [ "$status" = "200" ]; then
  pass "GET /health/live -> 200"
else
  fail "GET /health/live -> ${status:-no response} (expected 200)"
fi

# Readiness is the one that reports dependencies. It fails closed when there is
# no health service to ask, which is the correct answer and still a failure here.
ready_body=$("${CURL[@]}" -w '\n%{http_code}' "$API_URL/health/ready" 2>/dev/null)
ready_status=$(printf '%s' "$ready_body" | tail -n1)
ready_json=$(printf '%s' "$ready_body" | sed '$d')
if [ "$ready_status" = "200" ]; then
  pass "GET /health/ready -> 200"
else
  fail "GET /health/ready -> ${ready_status:-no response} (expected 200; readiness fails closed when a dependency is unknown)"
fi
# Surface whatever the readiness payload says about backing services rather than
# asserting a shape this script would then have to be kept in step with.
for dep in postgres postgresql database redis; do
  if printf '%s' "$ready_json" | grep -qi "\"$dep\""; then
    info "readiness reports '$dep': $(printf '%s' "$ready_json" | tr ',' '\n' | grep -i "\"$dep\"" | head -1 | tr -d ' ')"
  fi
done

# ---------------------------------------------------------------------------
group "3. CORS is scoped to the real frontend origin"

acao=$("${CURL[@]}" -o /dev/null -D - -H "Origin: $FRONTEND_URL" \
  "$API_URL/health/live" 2>/dev/null | grep -i '^access-control-allow-origin:' | tr -d '\r')
if printf '%s' "$acao" | grep -qi "$FRONTEND_URL"; then
  pass "allowed origin is echoed exactly ($FRONTEND_URL)"
elif [ -z "$acao" ]; then
  fail "no Access-Control-Allow-Origin for $FRONTEND_URL - the browser will block every API call"
else
  fail "unexpected Access-Control-Allow-Origin: $acao"
fi

if printf '%s' "$acao" | grep -q '\*'; then
  fail "Access-Control-Allow-Origin is a wildcard, which cannot be combined with credentials"
else
  pass "no wildcard origin"
fi

evil=$("${CURL[@]}" -o /dev/null -D - -H "Origin: https://kirmya.com.attacker.example" \
  "$API_URL/health/live" 2>/dev/null | grep -ic '^access-control-allow-origin:')
if [ "${evil:-0}" = "0" ]; then
  pass "unknown origin receives no CORS grant"
else
  fail "an unknown origin received Access-Control-Allow-Origin"
fi

# ---------------------------------------------------------------------------
if [ "$PUBLIC_ONLY" = "1" ]; then
  group "4. Authenticated checks skipped (--public-only)"
  info "login, cookie attributes and /auth/me were not exercised"
else
  group "4. Sign-in, refresh cookie and bootstrap"

  if [ -z "${KIRMYA_SMOKE_EMAIL:-}" ] || [ -z "${KIRMYA_SMOKE_PASSWORD:-}" ]; then
    fail "KIRMYA_SMOKE_EMAIL and KIRMYA_SMOKE_PASSWORD are required (or pass --public-only)"
  else
    headers=$(mktemp)
    login=$("${CURL[@]}" -D "$headers" -X POST "$API_URL/api/v1/auth/login" \
      -H 'Content-Type: application/json' \
      -H "Origin: $FRONTEND_URL" \
      --data "$(printf '{"email":"%s","password":"%s"}' "$KIRMYA_SMOKE_EMAIL" "$KIRMYA_SMOKE_PASSWORD")" \
      2>/dev/null)

    token=$(printf '%s' "$login" | sed -n 's/.*"accessToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
    if [ -n "$token" ]; then
      pass "POST /api/v1/auth/login returned an access token"
    else
      fail "login did not return an access token"
    fi

    # The refresh cookie is what makes a session survive a reload. Every one of
    # these attributes has its own failure: no Secure and WebKit discards it, no
    # HttpOnly and script can read it, a wrong Path and it is never sent to the
    # refresh endpoint at all.
    cookie=$(grep -i '^set-cookie:' "$headers" | tr -d '\r' | head -1)
    if [ -n "$cookie" ]; then
      pass "login set a refresh cookie"
      case "$cookie" in *[Ss]ecure*) pass "cookie is Secure";; *) fail "cookie is missing Secure - a browser on HTTPS will not store it";; esac
      case "$cookie" in *[Hh]ttp[Oo]nly*) pass "cookie is HttpOnly";; *) fail "cookie is missing HttpOnly";; esac
      case "$cookie" in *SameSite=*) pass "cookie declares SameSite";; *) fail "cookie has no SameSite attribute";; esac
      case "$cookie" in *Path=/api/v1/auth*) pass "cookie Path is /api/v1/auth";; *) info "cookie Path is not /api/v1/auth - check AUTH_COOKIE_PATH";; esac
    else
      fail "login set no cookie - a reload will sign the user out"
    fi
    rm -f "$headers"

    if [ -n "$token" ]; then
      me=$("${CURL[@]}" -w '\n%{http_code}' "$API_URL/api/v1/auth/me" \
        -H "Authorization: Bearer $token" -H "Origin: $FRONTEND_URL" 2>/dev/null)
      me_status=$(printf '%s' "$me" | tail -n1)
      me_json=$(printf '%s' "$me" | sed '$d')
      if [ "$me_status" = "200" ]; then
        pass "GET /api/v1/auth/me -> 200"
      else
        fail "GET /api/v1/auth/me -> ${me_status:-no response} (expected 200)"
      fi
      # The bootstrap is what the workspace switcher reads. An account with no
      # workspaces renders no switcher, so an empty list is a real answer - but
      # the field being absent means the client has nothing to read at all.
      if printf '%s' "$me_json" | grep -q '"workspaces"'; then
        pass "bootstrap carries 'workspaces'"
      else
        fail "bootstrap has no 'workspaces' field - the workspace switcher will render nothing"
      fi
      if printf '%s' "$me_json" | grep -q '"workspacesComplete"'; then
        pass "bootstrap carries 'workspacesComplete'"
      else
        fail "bootstrap has no 'workspacesComplete' - a degraded list is indistinguishable from a real one"
      fi
    fi

    # A wrong password must be refused, and refused the same way a wrong address
    # is, or the endpoint answers "does this account exist?" to anyone asking.
    bad=$("${CURL[@]}" -o /dev/null -w '%{http_code}' -X POST "$API_URL/api/v1/auth/login" \
      -H 'Content-Type: application/json' \
      --data "$(printf '{"email":"%s","password":"definitely-not-the-password"}' "$KIRMYA_SMOKE_EMAIL")" \
      2>/dev/null)
    if [ "$bad" = "401" ]; then
      pass "a wrong password is refused with 401"
    else
      fail "a wrong password answered ${bad:-no response} (expected 401)"
    fi
  fi
fi

# ---------------------------------------------------------------------------
printf '\n'
if [ "$FAILURES" -eq 0 ]; then
  printf 'production smoke: PASS (%s, %s)\n' "$FRONTEND_URL" "$API_URL"
  exit 0
fi
printf 'production smoke: FAIL - %d check(s) failed (%s, %s)\n' "$FAILURES" "$FRONTEND_URL" "$API_URL"
exit 1

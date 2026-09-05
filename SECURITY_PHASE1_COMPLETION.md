# Security Phase 1 — Completion Report

**Scope:** Prompts 1–7 of the security hardening series, commits `b96e6dc`…`HEAD`, all on
`claude/repo-analysis-report-mcplch`.
**Verified:** against a live PostgreSQL 16 instance with the server running, not only in unit tests.

This report states what was fixed, how each claim was verified, and — with equal prominence —
what remains open. Where a task asked me to confirm something and the honest answer is "no",
that is recorded as "no" rather than softened.

---

## 1. Verification summary

| # | Claim under test | Result | Evidence |
|---|---|---|---|
| 1 | Every `/admin/*` route requires an admin role | **Confirmed** | 241 routes × 4 non-admin roles, all 403; all 241 return 401 anonymously; all 3 admin roles reach all 241 |
| 2 | Zero places trust client-supplied user IDs for authorization | **Not confirmed** | 79 sites in 31 modules still resolve identity from an unset context key — see §4.1 |
| 3 | Billing is fully protected | **Confirmed** | Per-account routes 401 anonymously; `/admin/billing/*` 403 to non-admins; webhook signature-verified |
| 4 | Password reset works and is rate limited | **Confirmed** | Full happy path end-to-end against a live database; both limiters observed firing |
| 5 | The system starts cleanly | **Confirmed** | Boots against PostgreSQL, applies 394 tables, serves on :8080, shuts down gracefully, zero panics |
| 6 | Tests pass | **Confirmed** (backend) / **one pre-existing failure** (frontend) | 66/66 Go packages; 535/536 frontend, the failure predates this work |

### What "verified live" means here

Earlier passes in this series could only exercise the backend as far as the database connection,
because no PostgreSQL was available. For this pass a PostgreSQL 16 cluster was initialised and the
compiled server run against it, so the claims below rest on observed HTTP responses and database
rows rather than on unit tests alone.

```
GET  /api/v1/admin/users              anonymous → 401    ordinary user → 403
GET  /api/v1/admin/billing/status     anonymous → 401    ordinary user → 403
GET  /api/v1/admin/security/incidents anonymous → 401    ordinary user → 403
GET  /api/v1/admin/system/health      anonymous → 401    ordinary user → 403
GET  /api/v1/admin/support/tickets    anonymous → 401    ordinary user → 403
GET  /api/v1/admin/users              token signed with the wrong key → 401
GET  /api/v1/billing/status           anonymous → 401    ordinary user → 200
GET  /api/v1/billing/plans            anonymous → 200   (public by design)
GET  /api/v1/jobs                     anonymous → 200   (public by design)
```

---

## 2. What was fixed

### Prompt 1 — Identity spoofing in mentorship (`b96e6dc`)

`getUserID` read the caller from `c.GetString("userID")`. The authentication middleware stores a
`uuid.UUID` under that key, and `GetString` type-asserts to `string`, so it returned `""` for every
authenticated user. Handlers then treated the empty string as an identity. Replaced with the shared
`middleware.GetUserID`, and `service.ErrUnauthorized` now maps to 403 rather than being flattened
into a generic error.

### Prompt 2 — Centralised RBAC middleware (`ed4beb8`)

Added `internal/shared/middleware/rbac.go`: role constants, `AdminRoles()`, `RequireRole(...)` and
`RequireAdmin()`. The middleware authenticates first if the request has not already been
authenticated, so it is correct whether or not `AuthRequired` precedes it, and it distinguishes 401
(no valid token) from 403 (valid token, wrong role). Token verification was factored into a single
`verifyRequestToken` used by both middlewares — two copies of signature verification are two things
that can drift, and the one that drifts is the one that lets someone in. The auth module's own
`RequireRole` became a thin adapter, so there is one implementation rather than two.

### Prompts 3–4 — RBAC applied across the admin surface (`2f009cb`, `0db1f9d`)

These groups were not simply missing a role check. They carried one, conditionally:

```go
if len(auth) > 0 && auth[0] != nil {
    adminX.Use(auth[0].RequireAuth(), auth[0].RequireRole("admin", "super_admin"))
} else {
    adminX.Use(sharedMiddleware.AuthRequired())   // authentication only — no role check
}
```

The protection therefore depended on the auth middleware being wired at each call site, and the
fallback authenticated without authorizing — any logged-in user reached the admin surface. The
enumerated roles also omitted `platform_admin`. All are now one unconditional
`sharedMiddleware.RequireAdmin()`, across the admin, backup, data_operations, legal, support,
system_health, security and profile administration groups, plus a genuine gap in trust_safety. Prompt 4 also found that
the Prompt 3 enforcement test skipped any path containing `:`, which left 64 of 241 admin routes
unverified — precisely the id-addressed ones, where an authorization mistake is most costly.
Parameterised routes are now resolved and swept. Ownership (IDOR) tests were added for the
self-service security endpoints, which are correctly gated on authentication rather than role.

### Prompt 5 — Billing (`f95984a`)

The user-facing and admin billing routes were already guarded. The real hole was the payment
webhook: `MockPaymentProvider.VerifyWebhookSignature` returned `true` unconditionally, the service
never called it, and the handler passed a nil payload and empty signature — so any unauthenticated
POST recorded a `payment_succeeded` event. It was inert only because `BILLING_ENABLED` defaults
false. Now HMAC-SHA256 over the raw body, constant-time comparison, fails closed on an empty secret,
401 (not 400) for an unverified caller, and the body bounded at 1 MiB.

No IDOR fix appears in billing because no billing endpoint is user-scoped today: `GetBillingStatus`
takes no user ID and `CreateCheckoutSession` hardcodes `"cus_free"`. There is no cross-user read to
prevent. **When these endpoints start returning real per-account data, ownership checks must be
added with them — the current tests will not catch that omission.**

### Prompt 6 — Password reset (`a665a7a`)

The flow already existed end to end. Six defects were found and fixed: a new link did not retire the
previous one; single-use was not race-safe (8 of 8 concurrent redemptions succeeded without the
guard); the repository consulted an in-memory map even with a database configured, which could let a
consumed link be redeemed again on another replica during a transient database error; rate limiting
was per-IP only, which cannot protect one mailbox from a distributed attacker; ineligible
(suspended, locked, banned) accounts were sent working links; and with no SMTP configured the flow
could not be completed at all locally.

---

## 3. Verified behaviour of the password reset flow

Observed against the running server and the database:

| Property | Observation |
|---|---|
| Token strength | 64 hex characters — 32 bytes from `crypto/rand` |
| Storage | `token_hash` equals SHA-256 of the emailed token, computed independently and compared; the raw token is never stored |
| Lifetime | `expires_at - now()` = 00:59:58 at issue |
| Happy path | Redemption 200; old password then 401, new password 200 |
| Single use | Replay of the same link → 400 `this password reset link has already been used` |
| Reissue | Two requests produce distinct tokens; the superseded link → 400, the current link → 200 |
| Session revocation | The pre-reset session row carries `revoked_at`; the post-reset login is the only live session |
| Per-account throttle | 3 links issued, the 4th request logged `Password reset throttled` with the response unchanged at 200 |
| Per-IP rate limiting | Sustained requests returned 429 with `Retry-After` — twice, unprompted, during this verification |
| Enumeration safety | Identical status and body for an address with an account and one without |

---

## 4. Residual risks

### 4.1 — Identity resolution outside the modules Phase 1 touched · **HIGH**

**79 call sites across 31 modules** read the caller's identity from the gin context key `user_id`.
Nothing sets that key: the authentication middleware publishes `userID`, holding a `uuid.UUID`.
Every one of those reads therefore yields an empty value, and the handler falls through to a
hardcoded or randomly generated UUID.

Largest concentrations: `endorsement` (7), `career_ai` (7), `event` (6), `career_companion` (6),
`analytics` (6), `verification` (5), `learning` (5), `referral` (4), `interview` (4).

**This is not an authentication bypass.** The affected routes still require a valid token and an
anonymous caller is refused before the handler runs. The consequence is that authenticated callers
are served, or write, data attributed to one synthetic identity rather than to themselves — a
cross-tenant data-integrity failure, not an open door. Two shapes are worse than the rest:

- `analytics` has no authentication on 5 of its 6 route groups *and* a fallback identity, so every
  caller is served one synthetic user's metrics.
- `interview` and `verification` fall back to `uuid.New()`, so they **write** rows attributed to a
  freshly invented user on every request — and since the persistence migration those rows survive
  restarts.

A third shape is client-supplied rather than merely broken: `GET /endorsements/skills?user_id=<id>`
takes the subject straight from the query string, falling back to the unset context key. The route
is authenticated, and endorsements are profile-visible data rather than private, so this reads as
low severity — but it is the literal pattern the task asked me to confirm was absent, and it is not.

**Why it was not fixed here.** Prompts 1–6 scoped identity work to mentorship. Closing the rest is
~79 mechanical edits across 31 modules, and `analytics` additionally needs authentication added
before its identity fix can work at all (swapping in the correct resolver without adding auth would
turn every analytics endpoint into a 401). That is a distinct change with its own regression
surface, not a verification step, and it is already planned as Workstreams 2–3 of the module-health
plan.

**What guards it in the meantime.** `test/security/phase1_boundaries_test.go` pins the exact file
list. A module that regresses fails the test by name; a module that is fixed fails it as a stale
entry to remove. The count cannot grow quietly.

### 4.2 — Access tokens survive a password reset · **MEDIUM**

Resetting a password revokes every session row, which kills refresh tokens. Access tokens are
stateless JWTs and nothing on the request path consults the session table, so one issued before the
reset keeps working until it expires. The exposure is bounded at the 15-minute access-token
lifetime rather than being open-ended. Closing it means checking revocation on every authenticated
request — a change to the authentication architecture, not to the reset flow — so it is documented
at the call site rather than half-implemented.

### 4.3 — Rate limiting is per-process and in-memory · **MEDIUM**

`RateLimiter` keeps its buckets in process memory. Under more than one replica a caller gets the
limit multiplied by the replica count, and the limits reset on deploy. The per-account reset
throttle is unaffected, because it counts database rows. This was observed directly during
verification: restarting the server cleared the buckets.

### 4.4 — `MustGetUserID` panics · **LOW**

`internal/shared/middleware/auth.go` exports a `MustGetUserID` that panics when the caller is not
authenticated. It predates Phase 1 and **has no callers**. `PanicRecovery` is installed, so a future
call on an unauthenticated route would be a 500 rather than a crashed process. Deleting it is safer
than leaving it available.

### 4.5 — Route registration fails silently on a nil handler · **LOW**

18 route-registration functions begin `if handler == nil { return }`, so a handler that is not wired
produces no routes and no error. All 62 handler fields are wired in `cmd/kirmya/main.go` today, and
the golden route table now covers a fully wired router, so a regression is visible — but the failure
mode remains "the endpoint silently does not exist".

### 4.6 — Out of scope for Phase 1, still open

The identity/RBAC/billing/reset findings were Phase 1. These remain from the original audit and are
untouched: hardcoded `localhost` in frontend clients, silent mock fallbacks, OpenAPI contract
problems, mock AI providers, unlocked migrations, the `SameSite=Strict` refresh cookie, and
in-memory pubsub under multiple replicas.

---

## 5. Test coverage added

| Location | What it holds |
|---|---|
| `internal/shared/middleware/rbac_test.go` | The RBAC middleware itself: role matching, 401 vs 403, idempotence |
| `internal/router/rbac_enforcement_test.go` | All 241 admin routes swept by role, parameterised routes included |
| `internal/router/admin_surface_completeness_test.go` | **New.** Builds a router with every handler populated by reflection, proves the hand-written sweep covers the whole admin surface, and that a fully wired router registers all 960 routes without panicking |
| `internal/router/billing_authz_test.go` | Billing routes pinned by name |
| `internal/security/service/security_idor_test.go` | Cross-user API key and device operations refused |
| `internal/billing/**` | Webhook signature verification and the routes as registered |
| `internal/auth/**` | Password reset: happy path via the emailed link, single use, concurrency, expiry, throttle, revocation |
| `test/security/phase1_boundaries_test.go` | **New.** The boundaries end-to-end on the assembled router, plus the residual-identity regression guard |
| `frontend/src/app/{forgot,reset}-password/__tests__/` | Reset UI success and failure states |

Every security assertion added in Phases 1–7 was mutation-tested: the protection was reverted and
the suite confirmed to fail. A test that does not fail when the thing it guards is removed is not
evidence.

**One test infrastructure fix.** `TestRouteTable` built its router from 14 of 62 handler fields, so
the golden file described roughly a quarter of the API and the rest could change unnoticed — the
same blind spot that let four duplicate route registrations reach production as a startup panic with
CI green. It now uses the fully populated router; the golden grew from 820 to 960 routes. One route,
`GET /health/dependencies`, left the golden: it is a fallback registered only when
`SystemHealthHandler` is nil, which is never true in production. The golden now describes the route
table that actually ships.

---

## 6. Reproducing the verification

```bash
# backend
cd backend
go build ./... && go vet ./... && go test ./...      # 66 packages
go run ./tools/swaggercheck                           # 756 paths, all routes documented

# live, with a database
initdb -D "$PGDATA" -U postgres --auth=trust && pg_ctl -D "$PGDATA" start
createdb -U postgres kirmya
JWT_SECRET=<32+ bytes> APP_ENV=development ALLOW_EPHEMERAL_REPOS=true \
  DATABASE_URL="postgresql://postgres@127.0.0.1:5432/kirmya?sslmode=disable" \
  go run ./cmd/kirmya

# frontend
cd frontend && npm install && npx tsc --noEmit && npx vitest run
```

With `APP_ENV` other than production and no SMTP configured, the reset link is written to the log,
which is how the end-to-end reset above was driven. In production it never is.

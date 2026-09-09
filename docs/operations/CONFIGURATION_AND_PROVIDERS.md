# Configuration and provider requirements

**Written for the 9 September 2026 release candidate.** Every key below was read
out of the source that consumes it, not out of an older document. Where the
platform has no provider, this says so rather than describing one.

Companion documents: the [release operations handbook](RELEASE_OPERATIONS_HANDBOOK.md)
for procedures, and [batch 6 release acceptance](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md)
for what was verified on this candidate.

## What the platform actually is

A modular monolith. Two deployable artifacts and two required dependencies:

| Piece | What it is | Required |
|---|---|---|
| `backend/` | One Go binary, `cmd/kirmya`. 961 registered HTTP routes, 930 documented OpenAPI operations. | yes |
| `frontend/` | One Next.js 16 application built with `output: 'standalone'` and run as `node server.js`. | yes |
| PostgreSQL | 98 migrations. Every business record. | yes |
| Redis | Cross-replica realtime delivery and the shared rate-limit bucket. | yes for more than one replica |

There is **no NATS, no OpenSearch cluster, no message broker and no worker
fleet** in this deployment, whatever `docs/deployment/` and `docs/devops/`
describe. `NATS_ENABLED` and `OPENSEARCH_ENABLED` default to false and the
health report says `disabled` for what is absent. Background delivery runs
in-process off the `notification_deliveries` table.

## Required before the API will serve

| Key | Consequence if unset or wrong |
|---|---|
| `JWT_SECRET` | The process logs `FATAL: JWT_SECRET environment variable is required` and exits. There is no default. |
| `DATABASE_URL` | Falls back to `postgresql://postgres:postgres@localhost:5432/kirmya`, which in a container is nothing. Readiness then fails closed. |
| `APP_ENV` | Decides CORS resolution and whether `ALLOW_NO_DB` is refused. Set it to `production`. |
| `CORS_ALLOWED_ORIGINS` | The exact web origin(s). Credentialed requests are answered with the matching origin, never `*`; an unlisted origin gets no grant and cannot write. |
| `NEXT_PUBLIC_API_URL` | **Build-time, not runtime.** `next build` inlines it into the client bundle, so it must be passed to `docker build --build-arg`, not to the running container. Wrong here and every browser call in the shipped image fails. Must end in `/api/v1`. |

`ALLOW_NO_DB=true` is refused when `APP_ENV=production`; the process will not
start database-free. That is deliberate (finding F18) — do not add it to a
production environment to "get the service up".

## Required for more than one replica

| Key | Why |
|---|---|
| `REDIS_HOST` / `REDIS_PORT` (or `REDIS_URL`), `REDIS_PASSWORD` | Without Redis both realtime delivery and rate limiting fall back to per-process. A message then reaches one replica's subscribers only, and a documented "5 sign-in attempts per minute" admits 5 × N. The fallback is deliberate — it degrades rather than failing closed — so nothing will alert you that you are running it. |

## Session and cookie settings

| Key | Default | Note |
|---|---|---|
| `AUTH_COOKIE_SECURE` | on outside development | Must stay on in production. |
| `AUTH_COOKIE_SAME_SITE` | `Lax` | **Not `Strict`.** The refresh cookie is dropped the moment the web client is served from a different host than the API, which is the normal deployment. Guarded by a test that fails if it is set back to Strict. |
| `AUTH_COOKIE_DOMAIN` | unset | Set only when the web app and API share a registrable domain. |
| `ACCESS_TOKEN_TTL` | 15m | An issued access token stays valid for its remaining lifetime after a password reset or logout. See R02 below. |
| `REFRESH_TOKEN_TTL`, `REMEMBER_ME_REFRESH_TOKEN_TTL` | | Refresh tokens rotate on use and reuse is detected. |

## Rate limits

Four independent buckets. Production defaults are in
`internal/shared/config/config.go`; CI raises them and says why in the workflow.

| Key | Default | Covers |
|---|---|---|
| `RATE_LIMIT_REQUESTS` / `RATE_LIMIT_BURST` | 600/min, 120 | Every request. |
| `AUTH_RATE_LIMIT_REQUESTS` / `AUTH_RATE_LIMIT_BURST` | 5/min, 5 | Credential endpoints. |
| `AUTH_SESSION_RATE_LIMIT_REQUESTS` / `AUTH_SESSION_RATE_LIMIT_BURST` | 120/min, 60 | `/auth/refresh`, `/auth/me`, `/auth/session`, `/auth/logout`. Kept separate on purpose: merging it into the credential bucket signed users out on the third page reload from one address. |
| `NEWSLETTER_RATE_LIMIT_REQUESTS` / `NEWSLETTER_RATE_LIMIT_BURST` | 10/min, 5 | The public newsletter endpoint. |

Behind a proxy, set `TRUSTED_PROXIES` or every client shares the proxy's bucket.

## Optional providers — none of them is configured anywhere reachable

Each of these reports `disabled` in `GET /status` when absent, with the
consequence stated, rather than reporting healthy.

| Provider | Keys | What is unavailable without it |
|---|---|---|
| Object storage (S3-compatible) | `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_PUBLIC_BASE_URL` | Without `STORAGE_ENDPOINT` the API writes candidate documents to `UPLOAD_DIRECTORY` (default `./uploads`) on the container's own disk, which does not survive a restart and is not shared between replicas. **Configure this before any real candidate uploads a résumé.** Note the probe reports on whichever provider is in use: `storage: healthy` with no endpoint set means the local directory is writable, not that durable object storage exists. With S3 configured the probe is a real `Exists` call, so a wrong bucket or credential shows as `critical` rather than failing silently. |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`/`SMTP_USER`, `SMTP_PASSWORD`/`SMTP_PASS`, `SMTP_FROM_EMAIL`/`SMTP_SENDER_EMAIL`, `SMTP_FROM_NAME`, `SMTP_REPLY_TO`, `SMTP_ENCRYPTION`; or `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Password reset, notification delivery, newsletter confirmation and interview notices are queued durably and then dead-lettered, because no channel is configured. Nothing claims success. Both naming schemes are read, and port 465 or `SMTP_ENCRYPTION=ssl` selects implicit TLS. |
| Search | `OPENSEARCH_ENABLED`, `OPENSEARCH_URL` | Search runs against PostgreSQL. Adding a cluster is not justified by any measurement taken so far. |
| AI | `AI_PROVIDER` and one of `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL`, `OPENAI_API_KEY`/`OPENAI_BASE_URL`/`OPENAI_MODEL`, `GEMINI_API_KEY`/`GEMINI_MODEL` | **No provider is configured and no provider decision has been made.** The AI surfaces answer deterministically — the recruiter evaluation compares stated skills, names that method, and returns an explicit insufficient-data state. Nothing invents a score. Group 10C stays open until a provider is chosen and its evaluation, provenance, cancellation, timeout and cost budget are tested. |
| Billing | `BILLING_ENABLED`, `STRIPE_ENABLED`, `SUBSCRIPTIONS_ENABLED`, `CHECKOUT_ENABLED`, `PREMIUM_FEATURES_ENABLED`, `BILLING_WEBHOOK_SECRET` | **All off, and they must stay off.** The free-access promise is unchanged and no product decision has authorised monetisation. Billing code exists; enabling it is a product decision, not a configuration one, and the duplicate/signature/isolation tests step 10F asks for have not been run. |

## Observability and operator access

| Key | Note |
|---|---|
| `BUILD_SHA` | Reported by the health endpoints. **Set it to the deployed commit.** It used to be a literal string, so the field an operator uses to tell which build is running could never tell them. |
| `APP_VERSION` | Shown alongside it. |
| `OTEL_ENABLED` / `ENABLE_TRACING` | Tracing. No collector is configured in any reachable environment. |
| `METRICS_USERNAME` / `METRICS_PASSWORD` | Guards `/metrics`. Leave unset only if the port is not reachable from outside. |
| `SWAGGER_ENABLED`, `SWAGGER_HOST`, `SWAGGER_BASE_PATH`, `SWAGGER_USERNAME`, `SWAGGER_PASSWORD` | Off by default. If enabled in production, set the credentials. |

## Known configuration-shaped limits

- **R02, access-token revocation.** Signing out or resetting a password revokes
  the refresh token and every stored session, and that revocation is now
  transactional. It does **not** invalidate an already-issued access token,
  which stays usable for up to `ACCESS_TOKEN_TTL`. Shortening the TTL narrows
  the window; closing it needs a revocation check on the request path, which is
  an architecture decision.
- **Schema rollback.** The migration runner applies `*.up.sql` only. It has no
  down path, and 39 of the 98 up migrations have no `.down.sql` beside them, so
  the 59 that do exist are never executed by anything. Rollback means putting
  the previous application binary in front of the newer schema — rehearsed, see
  the handbook.

# Kirmya Production Deployment Runbook

Every statement here was checked against the live Railway project on 2026-09-11.
Where something could not be checked from outside the deployment, it says so
rather than guessing.

This replaces a runbook that described building images by hand and orchestrating
them with `docker-compose -f docker-compose.production.yml`, and verified health
by curling `/api/v1/metrics`. None of that is how Kirmya deploys: nothing runs
compose in production, the images are built by Railway, and `/api/v1/metrics` is
not the health endpoint. Following it would have left production untouched while
appearing to succeed.

---

## 1. Topology

```
kirmya.com          -> Railway service "frontend"        (Next.js standalone, :3000)
api.kirmya.com      -> Railway service "kirmya_project"  (Go API)
                            |
                            +-- Railway service "postgres"
                            +-- Railway service "redis"
```

One Railway project (`Kirmya`) with **one environment, `production`**. There is
no staging environment. Both application services run **one replica** in
`asia-southeast1`. Neither has a volume mounted.

Both services build from a Dockerfile in the repository, not from a registry:

| Service | Root | Dockerfile | Healthcheck |
|---|---|---|---|
| `kirmya_project` | `/backend` | `backend/Dockerfile` | `/health/live` |
| `frontend` | `/frontend` | `frontend/Dockerfile` | `/` |

`frontend/vercel.json` is dead configuration — the frontend is not on Vercel.
Its security headers are served by `next.config.mjs` instead, so deleting it
would change nothing, but it misleads anyone reading the repository.

---

## 2. How a deploy is triggered

Push to `main`. Railway watches the repository directly; there is no deploy step
in GitHub Actions.

Two gates decide whether a push becomes a deployment, and **both have
silently held back backend releases**:

- **`checkSuites: true`** — Railway waits for the GitHub check suites on the
  commit. A red workflow means no deploy.
- **`watchPatterns: ["backend/**"]`** on the backend service — a commit that
  touches no backend path is marked `SKIPPED` immediately.

A `SKIPPED` deployment is not a failure and raises nothing. Check what is
actually live before assuming a merge shipped:

```bash
# The live backend commit, not the newest one on main
railway status            # or: Railway dashboard -> kirmya_project -> Deployments
git log --oneline -1 <that commit>
```

The frontend service has no watch patterns, so it deploys on **every** push to
`main`. The backend does not. The two can therefore be several commits apart,
and were at the time of writing: the frontend was on `b1be76c` while the backend
was still on `c79fb05`, three commits behind.

---

## 3. Required environment variables

Set on the **backend** service (`kirmya_project`). Names only — never record
values here.

**Must be set, or production misbehaves:**

| Variable | Why |
|---|---|
| `APP_ENV` | Must be `production`. It gates the fast-fail validation, forces the Secure cookie, and selects Gin release mode. |
| `JWT_SECRET` | Startup refuses in production if unset or left at the template value. |
| `DATABASE_URL` | Or `DB_HOST` + friends. |
| `CORS_ALLOWED_ORIGINS` | Must contain `https://kirmya.com` exactly. Production adds no implicit origin, so an omission blocks every browser call. |
| `APP_BASE_URL` | Password-reset and verification links are built from it. |
| `TRUSTED_PROXIES` | **Set to `*` on Railway.** See §7. |
| `REDIS_URL` / `REDIS_HOST` / `REDIS_PORT` | With `REDIS_ENABLED=true`. |
| `ALLOW_EPHEMERAL_REPOS` | Production refuses to boot unless `true`; setting it accepts that 13 modules keep their data in process memory. |

**Must NOT be set to true in production:** `ALLOW_NO_DB` (startup refuses it —
it discards every write), `SWAGGER_ENABLED` (defaults to `false`; leave it).

**Frontend service:** `NEXT_PUBLIC_API_URL` only (plus `PORT`). It is inlined
into the bundle at **build** time via a Dockerfile `ARG`, so changing it requires
a rebuild, not a restart. It must be `https://api.kirmya.com/api/v1`.

---

## 4. Migrations

Migrations run **automatically at backend boot**, from
`backend/scripts/migrations`, which the Dockerfile copies into the image.

They are serialised across replicas with a PostgreSQL advisory lock
(`internal/shared/database/migrations.go`), so two replicas starting together
cannot both execute the same DDL. There is no migration race to manage.

Two properties to plan around:

- **The runner applies `*.up.sql` only.** There is no down path at all, and 39
  of the 103 up migrations have no `.down.sql` beside them.
- A missing migrations directory is fatal rather than a warning, so an image
  built without them fails loudly instead of serving an empty schema.

Deployment order is therefore fixed and not configurable: the new binary
migrates, then serves. A migration that is not backward compatible with the
*previous* binary breaks rollback (§6).

---

## 5. Verifying a release

```bash
# 1. Liveness — the process is up
curl -fsS https://api.kirmya.com/health/live

# 2. Readiness — dependencies answered. Fails closed when one is unknown.
curl -fsS https://api.kirmya.com/health/ready

# 3. Everything a browser depends on, in the order a user meets it
KIRMYA_FRONTEND_URL=https://kirmya.com \
KIRMYA_API_URL=https://api.kirmya.com \
KIRMYA_SMOKE_EMAIL=... KIRMYA_SMOKE_PASSWORD=... \
  scripts/ops/production-smoke.sh
```

`scripts/ops/production-smoke.sh` checks the frontend serves, that the shipped
bundle does not carry the `localhost:8080` fallback, liveness and readiness,
that CORS echoes the real origin and refuses an unknown one, and that sign-in
returns a refresh cookie with `Secure`, `HttpOnly`, `SameSite` and the right
`Path` before reading `/auth/me` for `workspaces`. It never writes business data
and never touches an administrative route, so it is safe against production. It
exits non-zero on the first failed group; `--public-only` runs the
unauthenticated half without credentials.

**Railway's healthcheck is `/health/live`, which is liveness only.** A replica
whose database is unreachable still answers it, so Railway will route traffic to
it. Moving the healthcheck to `/health/ready` would close that gap; it is not
done here because it could not be rehearsed against the live deployment, and a
readiness path that fails closed can block a deploy from ever going live.

---

## 6. Rollback

**The only rollback this platform can perform is putting the previous
application binary back in front of the newer schema.** The schema does not come
back with it (§4).

```
Railway dashboard -> service -> Deployments -> previous SUCCESS -> Redeploy
```

Then re-run the smoke script. Rehearse the binary-against-newer-schema case with
`scripts/ops/rollback-rehearsal.sh`, which builds both commits, migrates a
disposable database with the candidate's migrations, and drives the hiring
journey through the previous binary. It never touches an existing database.

For anything the previous binary cannot serve against the new schema,
**forward-fix is the intended strategy**, not rollback.

---

## 7. Common failure diagnosis

**Everyone is rate limited at once / sign-in fails under load.**
`TRUSTED_PROXIES` is unset. Gin then derives the client IP from the socket peer,
which behind Railway's edge is the same address for the entire internet, so the
per-IP limiter becomes one global bucket — and the credential bucket defaults to
5 requests a minute. Set `TRUSTED_PROXIES=*`. Since this validation the backend
logs this at ERROR on boot, naming the platform it detected.

**Uploaded avatars and resumes disappear after a deploy.**
No volume is mounted and `STORAGE_ENDPOINT` is unset, so uploads land on the
container's writable layer and are discarded on every redeploy and restart while
the database rows that name them survive. Mount a volume at `UPLOAD_DIRECTORY`
or configure object storage. The backend logs this at ERROR on boot in
production.

**A merge to `main` did not change production.**
The backend deployment was `SKIPPED` — either the commit touched no `backend/**`
path, or a GitHub check suite was red. See §2.

**The frontend loads but every API call fails.**
Either `NEXT_PUBLIC_API_URL` was missing at *build* time (the bundle then holds
`http://localhost:8080`, which the smoke script checks for), or
`CORS_ALLOWED_ORIGINS` does not contain `https://kirmya.com` exactly.

**Login works, then a reload signs the user out.**
The access token lives in memory only and is restored by `POST /auth/refresh`
using the refresh cookie. Check the cookie's `Secure`, `SameSite` and `Path`
attributes — the smoke script asserts all three. `AUTH_COOKIE_PATH` defaults to
`/api/v1/auth`; a cookie written at a different path is never sent to refresh.

**Boot logs are missing.**
Railway drops messages above 500 lines/second per replica. This bit: the Gin
debug route dump cost 401 dropped messages on the deployment examined, and what
was dropped was the configuration audit and the dependency outcomes. Gin now
runs in release mode when `APP_ENV=production`, which removes the dump.

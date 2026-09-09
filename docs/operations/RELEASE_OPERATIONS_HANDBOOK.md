# Release operations handbook

**For the 9 September 2026 release candidate.** This is the authoritative
operational document for this release. Where it disagrees with an older
document in `docs/deployment/` or `docs/devops/`, this one is right and the
older one is superseded — see [What the older runbooks get wrong](#what-the-older-runbooks-get-wrong).

Every procedure below is marked **rehearsed** (executed, with the output
recorded) or **not rehearsed** (written down, never run). A procedure nobody has
executed is a plan, not a capability, and this document does not pretend
otherwise.

Companion documents: [configuration and provider requirements](CONFIGURATION_AND_PROVIDERS.md),
[batch 6 release acceptance](../BATCH6_RELEASE_ACCEPTANCE_2026-09-09.md),
[step 9 readiness evidence](step9-readiness-evidence-2026-09-08.md).

## 1. Topology

Two artifacts, two dependencies:

```
   browser ──► frontend (Next.js standalone, node server.js, :3000)
                   │  NEXT_PUBLIC_API_URL, baked in at build time
                   ▼
              backend (Go, cmd/kirmya, :8080) ──► PostgreSQL 18   (required)
                                              └─► Redis 7         (required for >1 replica)
                                              └─► S3 / SMTP / AI  (none configured anywhere)
```

Not present, whatever older diagrams show: NATS, OpenSearch, a worker fleet, a
blue-green load balancer, read replicas.

**Not rehearsed:** reconciling this against the live hosting project. Doing so
means reading the deployed services, variables and domains, and should be done
with the owner present. Until then, treat this as the topology the code
implements, not as a statement about what is deployed.

## 2. Health, readiness and which build is running

| Endpoint | Meaning | Use it for |
|---|---|---|
| `GET /health` | The process answered. | Container liveness. |
| `GET /health/live` | Same. Always 200 while the process is alive. | Liveness probe. |
| `GET /health/ready` | 200 only with a usable database handle; **503 otherwise**. | Readiness probe. This is the one that takes a replica out of rotation. |
| `GET /status` | Per-component report: `postgresql`, `redis`, `realtime`, `storage`, `workers`, `email`, `search`. | Triage. |
| `GET /metrics` | Prometheus metrics, behind `METRICS_USERNAME`/`METRICS_PASSWORD` when set. | Dashboards. |

`GET /health/dependencies` is **deliberately absent** and answers 404. It used
to report six components healthy from constants on a router built with no
dependencies at all.

Every component is a real probe: Redis and the realtime broker are a `PING`,
storage is an `Exists` call, workers read pending, overdue and dead-lettered
counts from `notification_deliveries`. Email reports configuration only and says
so — no probe proves a message will arrive without sending one. A dependency
this deployment does not have reports `disabled`, never `healthy`.

**Set `BUILD_SHA` to the deployed commit.** It is what the health endpoints
report, and it is how an operator tells which build is answering.

## 3. Deploy

**Not rehearsed against a real environment.** The image build is verified in CI;
the promotion is not.

1. Pick a commit on `main` whose four workflows are green: backend, frontend
   (including the image build), integration (PostgreSQL/Redis HTTP plus the
   Playwright suite against the production build) and security.
2. Build both images from that exact commit.
   - Backend: `docker build -t kirmya-backend:<sha> backend`
   - Frontend: `docker build --build-arg NEXT_PUBLIC_API_URL=https://<api-host>/api/v1 -t kirmya-frontend:<sha> frontend`
     `NEXT_PUBLIC_API_URL` is inlined by `next build`. Passing it to the running
     container does nothing; the image will carry the `http://localhost:8080`
     fallback and every browser call will fail.
3. Set the environment from [configuration and provider requirements](CONFIGURATION_AND_PROVIDERS.md).
   `JWT_SECRET` is mandatory — the process exits without it. `APP_ENV=production`
   refuses `ALLOW_NO_DB=true`.
4. Apply migrations before starting the new API. They serialise on an advisory
   lock, so concurrent runners are safe, and a missing migrations directory
   fails rather than passing as a no-op.
5. Start the backend. Wait for `GET /health/ready` to answer 200 — it fails
   closed while the pool is unusable, so a replica with a broken database never
   takes traffic.
6. Start the frontend. Confirm `GET /signin` answers 200 and that a request from
   the browser reaches the API (`/api/v1/...`, not `/api/v1/api/v1/...`).
7. Post-deployment: sign in, search the board, open a posting, apply. That is
   the journey the whole product exists to deliver.

## 4. Rollback — **rehearsed**

**The only rollback this platform can perform is to put the previous
application binary back in front of the newer schema.** The migration runner
(`internal/shared/database/migrations.go`) applies `*.up.sql` only. It has no
down path. 39 of the 98 up migrations have no `.down.sql` beside them, and the
59 that do exist are executed by nothing. Do not plan on reversing a migration.

`scripts/ops/rollback-rehearsal.sh` performs the rehearsal: it builds the
previous release in an isolated worktree, migrates a disposable database to the
candidate's schema, lists the migrations the previous release does not know
about, runs the hiring journey against that schema with the **previous** binary,
then rolls forward and runs it again.

Executed on this candidate (`19da324` back to `ce94d6c`):

```
== 3. migrate a disposable database to the candidate schema ==
total=98 newly_applied=98

== 4. migrations the previous release does not know about ==
  0096_close_schema_gaps_batch5.up.sql

== 5. roll back: the PREVIOUS release against the candidate schema ==
  readiness: 200
  ok: registration and sign-in
  ok: job published
  ok: the posting is publicly readable
  ok: application submitted (201)

== 6. roll forward again: the candidate against the same database ==
  readiness: 200 ... application submitted (201)
```

Run it before every release. It is the check that the next migration is
additive; a migration that drops or renames a column the previous release reads
will fail step 5, which is the point.

**Procedure:** redeploy the previous image tag, leave the schema alone, confirm
`GET /health/ready` is 200 and drive the same journey. Nothing needs to be
undone in the database.

**Rollback triggers.** Agreed for this release: readiness failing on a replica
for three consecutive intervals; 5xx above 1% of requests; the post-deploy
journey in §3 step 7 failing. **No alerting destination exists** — nothing pages
anyone, so these triggers are watched by a person during the deploy window, not
enforced automatically.

## 5. Backup and restore — **rehearsed**

`scripts/ops/restore-rehearsal.sh` takes a `pg_dump -Fc` backup, restores it into
a fresh database, compares row counts table by table, then starts the API
against the restored copy and drives the hiring journey through it.

Executed on this candidate:

```
source     users=128 jobs=41 job_applications=18 notifications=11 notification_deliveries=12
backup     0.2s, 1.1M
restore    3.7s, 0 messages logged
data loss  none across the counted tables
journey    readiness 200; registration, publication, public read, application (201)
recovery   6.1s from backup start to a serving, verified system
```

**Do not quote 6.1 seconds as a recovery objective.** The source database holds
about two hundred rows and one megabyte. Re-run against a production-sized
snapshot before setting an RTO. That re-run is **not rehearsed**.

## 6. Capacity — measured, no target set

`backend/tools/loadcheck` drives the public hiring path: list the board, open a
posting, submit an application, 10% writes. On this candidate, on a 4 CPU /
15 GB container running the database, cache, API and web server together:

```
operation  count   ok     failed   req/s    p50    p95    p99
apply       7630   7623        7   254.1   11ms   24ms   32ms
board      34740  34736        4  1157.0    5ms   14ms   20ms
posting    34375  34370        5  1144.9    4ms   12ms   18ms
total     76745 requests, 2556.0 req/s, 0.02% failed
```

The 16 failures are client-side timeouts at the 20-second bound. This is
consistent with the 2810 req/s measured in batch 4 on the same host class, so
this release introduces no throughput regression.

Measured a second time with the limiter at the integration setting
(60000/min): it admits about 1400 req/s of this mix and answers the rest 429.
The limiter is doing its job; the figure above was taken with it raised so it
did not mask the application.

**No capacity target is set.** Setting one is a product decision about expected
concurrent applicants and acceptable latency, and it must be made against a
production-shaped host rather than this container. Production-scale capacity
verification is **not rehearsed**.

## 7. Incident support

**There is no paging destination and no on-call rota.** Failures are detectable
— readiness flips, the component report degrades, `/metrics` is exported — but
nothing is wired to reach a person. Configuring that is the first operational
task after this release, and it needs an owner and a destination that do not
exist in this repository.

Until then, incident handling is manual:

| Symptom | First look | Likely cause |
|---|---|---|
| Every request 503 | `GET /health/ready`, then `/status` | Database unreachable. Readiness has already taken the replica out. |
| Signed-in users bounced to sign-in on reload | `AUTH_SESSION_RATE_LIMIT_*`, and whether `TRUSTED_PROXIES` is set | The session bucket shared with the credential bucket, or every client sharing the proxy's bucket. |
| Uploads vanish after a restart | `STORAGE_ENDPOINT` | No object storage configured; documents went to the container's disk. |
| No email arrives | `/status` → `email` | `disabled`. Deliveries are queued and dead-lettered; nothing is lost and nothing claims success. |
| Realtime reaches some users only | `/status` → `redis`, `realtime` | Redis absent; delivery fell back to per-process. It degrades silently by design. |
| A browser call 404s on `/api/v1/api/v1/...` | The image's build args | `NEXT_PUBLIC_API_URL` was passed at runtime instead of build time, or carries a doubled prefix. |

Preserve before restarting anything: `GET /status`, the container logs, and the
`BUILD_SHA` each replica reports.

## 8. Ownership

Roles, not people. Staffing is still pending; the plan has said so since step 1.

| Area | Responsible role |
|---|---|
| Release decision, evidence governance (F20) | Technical lead |
| Identity, sessions, authorization (F01, R01, R02) | Backend security lead |
| Persistence, migrations, rollback (F13, F18, R06) | Backend data lead |
| API contracts, web client (F05–F07, F17) | Frontend integration lead |
| Hiring journey (F03, F04, F21) | Hiring domain lead |
| Privacy and data lifecycle (F02) | Backend privacy lead |
| Public experience, communications, accessibility (F08–F10, F14–F16) | Frontend and communications lead |
| CI gates, scanners, browser suite (F11, F12, F19) | Platform and QA lead |
| Health, capacity, backup/restore (F22) | Platform and backend lead |
| Remaining domain groups 10A–10H | Designated domain engineers with QA |

## What the older runbooks get wrong

`docs/deployment/` and `docs/devops/` predate the evidence in this batch and in
step 9. Read them as history. Specifically:

| Claim | Reality |
|---|---|
| "Blue-green load balancer switch back to the previous stable container pool" | No blue-green deployment exists. Rollback is redeploying the previous image tag. |
| "Gracefully signal new workers to stop accepting incoming NATS/event jobs" | There is no NATS and no worker fleet. Delivery is in-process, off a database table. |
| "Schema additions remain backward compatible under the Expand/Contract protocol" | Now true for this release, and **verified** rather than asserted — see §4. It is a property of each migration, not a guarantee of the tooling: the runner cannot reverse anything. |
| "Log the rollback in the Admin Incident Control Center" | That console exists; nothing automatically writes to it. |
| Historical readiness percentages and operational scores | Superseded. They exceed their evidence (finding F20) and none of them was produced by a run. |

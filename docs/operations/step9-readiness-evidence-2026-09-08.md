# Step 9 operational readiness — what was executed, and what it showed

**Date:** 8 September 2026
**Scope:** the Step 9 checks that can be run in isolation, against a real
PostgreSQL 16, a real Redis and a real build of the API.

This records checks that were actually run and the numbers they produced. Where
a Step 9 item needs production access, a paid service or contact with real
users, it is listed as blocked rather than described as done. Nothing here
reuses a figure from an earlier document.

**Host for every measurement below:** 4 CPU, 15 GB RAM, Linux 6.18, PostgreSQL
16.13, Redis 7, Go 1.26.8. The database, the cache, the API and the Next server
all ran on this one container, so the throughput figures measure that
arrangement and are not a statement about a production tier.

---

## 1. Health and readiness under an injected dependency failure

**Step 9.3** asks for alerts that fire on injected failures.

### What was wrong

Only PostgreSQL was ever probed. The other six components of the health report
were constants:

| Component | What it reported | What it checked |
|---|---|---|
| redis | `healthy`, `hit_rate_pct: 98.4`, `memory_used_mb: 42` | nothing |
| nats | `healthy`, `messages_per_sec: 450`, `channels_active: 12` | nothing — the platform carries no NATS |
| opensearch | `healthy`, `cluster_status: green`, `active_shards: 24` | nothing |
| storage | `healthy`, `free_capacity_gb: 4500` | nothing |
| email | `healthy`, `queue_backlog: 0` | nothing |
| workers | `healthy`, "All 8 background workers reporting active heartbeats" | nothing |

`BuildSHA` was the literal string `21a5eef` and `Version` `v1.0.0` for every
artifact ever deployed, so the field an operator uses to tell which build is
running could never tell them.

`GET /health/dependencies` on the fallback router answered 200 with all six
`healthy` from a router constructed with no dependencies at all, and a
reliability test asserted that response — a check of the fabrication.

`GetPublicReadiness` returned `healthy` when the service held a nil database
handle, so a deployment whose pool failed to build would have answered every
readiness probe with 200 and taken traffic.

### What it does now

Probes are supplied by the composition root. Redis and the realtime broker are
a real `PING`; object storage is an `Exists` call, which is a `HEAD` against S3
and proves endpoint, bucket and credentials; the workers component reads the
delivery queue's pending, overdue and dead-lettered counts from
`notification_deliveries`. Email reports configuration and says explicitly that
it is configuration only, because no probe proves a message will arrive without
sending one. A dependency this deployment does not have reports `disabled` with
the consequence spelled out, never `healthy`.

### Executed

A TCP forwarder was placed between one API instance and PostgreSQL, then killed,
taking the database away from that instance alone.

```
--- database reachable ---
GET /health/ready -> 200  {"status":"healthy","version":"step9-check"}
GET /status       -> overallStatus healthy
                     postgresql healthy   redis healthy    realtime healthy
                     storage    healthy   workers healthy
                     email      disabled  search disabled

--- injected: database connection cut ---
GET /health/live  -> 200
GET /health/ready -> 503  {"status":"unhealthy","version":"step9-check"}
GET /status       -> overallStatus critical
                     postgresql critical  workers degraded
                     redis healthy   realtime healthy   storage healthy
```

Liveness stays up, because the process is alive. Readiness fails, so a platform
host stops routing to the replica. The component report names the dependency
that went, and does not claim the ones that did not.

Covered by `internal/system_health/service/health_probes_test.go` and the
corrected assertions in `internal/system_health/service/health_service_test.go`
and `test/reliability/reliability_performance_test.go`.

---

## 2. Backup and restore into isolation

**Step 9.4** asks for a real restore into isolation with recovery time and data
loss measured, and says not to reuse historical claims.

`docs/operations/KIRMYA_DATABASE_BACKUP_RECOVERY.md` described this procedure.
Nothing in the repository had ever run it: no script, no recorded timing, and no
check that a restored database can serve a request.

`scripts/ops/restore-rehearsal.sh` now performs it. Executed:

```
== 1. source inventory ==
users=103  jobs=40  job_applications=7  notifications=28  notification_deliveries=30

== 2. backup ==            0.3s, 1012K (pg_dump -Fc)
== 3. restore ==           2.3s into kirmya_restore_rehearsal, 0 messages logged
== 4. data loss ==         none: every counted table restored with its full row count
== 5. hiring journey against the restored database ==
   readiness 200
   ok: registration and sign-in
   ok: job published
   ok: the posting is publicly readable
   ok: application submitted (201)

recovery time 5.0s from backup start to a serving, verified system
```

**What this does and does not establish.** It establishes that the backup format,
the restore procedure and the application all work together, and that a restored
database serves the hiring journey end to end. It does not establish a
production recovery time: the source database here holds about a thousand rows
and one megabyte. Re-run against a production-sized snapshot before quoting a
recovery objective.

---

## 3. Load test, and the defect it found

**Step 9.5** asks for a load test over a representative read/write mix with the
hardware, workload and results recorded.

Nothing in the repository measured throughput or latency, so every performance
statement in the docs was an assertion. `backend/tools/loadcheck` now drives the
public hiring path — listing the board, opening a posting, submitting an
application — and reports what it observed.

### First run, 16 clients, 30s, 10% writes

```
operation    count       ok   failed     req/s       p50       p95       p99
apply          101        0      101       3.4         -         -         -
             85 x HTTP 500
             16 x transport timeout
board          371      371        0      12.4       2ms      12ms      31ms
posting        383      383        0      12.8       1ms      10ms      23ms
total          855 requests, 28.5 req/s, 11.8% failed
```

Every application failed. The body returned to the applicant was:

```
{"error":"ERROR: deadlock detected (SQLSTATE 40P01)"}
```

### Cause

`CreateApplication` took a `FOR SHARE` lock on the job row, then at the end of
the same transaction ran `UPDATE jobs SET applications_count = applications_count
+ 1` on that row. Two applications to one posting each held the shared lock and
each waited for the other to release it before the update could proceed.
PostgreSQL broke the cycle and the applicant got a 500.

This is not an edge case. A posting shared with a group is exactly the traffic
that produces it: eight candidates applying together produced eight failures out
of eight.

Two separate faults:

1. The lock upgrade. Fixed by taking `FOR NO KEY UPDATE` up front, which is the
   lock the later update needs — deliberately not `FOR UPDATE`, because the
   foreign key from `job_applications` to `jobs` needs a `KEY SHARE` lock on the
   parent row that `FOR UPDATE` would block.
2. The handler answered with `err.Error()`, so a database internal reached the
   browser. It now logs the detail and returns a message the caller can act on;
   a lost contended write is a 409 to retry, and a duplicate is reported through
   the unique index as "already applied".

### After the fix, same workload

```
operation    count       ok   failed     req/s       p50       p95       p99
apply         8509     8505        4     283.4      10ms      22ms      30ms
board        37794    37789        5    1258.8       5ms      13ms      18ms
posting      38058    38052        6    1267.6       3ms      11ms      16ms
total        84361 requests, 2809.9 req/s, 0.02% failed
```

28.5 req/s → 2809.9 req/s, and applications go from 0% to 99.95% success. The
15 remaining failures are client-side timeouts at the 20-second bound.

The rate limiter, at the integration-suite setting of 60000/min, admits about
1400 req/s of this mix and rejects the rest with 429 — it is doing its job, and
the capacity figure above was measured with it raised so it did not mask the
application.

### Regression coverage

`backend/test/ci/apply_concurrency_test.go`, under the `ciintegration` tag.
Verified to fail against a build from before the fix — eight of eight applicants
got 500, with `SQLSTATE 40P01` in the body — and to pass after.

### Capacity target

None is set here. Setting one is a product decision about expected concurrent
applicants and acceptable latency, and it should be made against a
production-shaped host rather than this container.

---

## 4. Accessibility of the core journey

axe-core (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) over `/`, `/jobs`,
`/signin`, `/register`, `/forgot-password` and a seeded job posting, in both
colour modes at desktop and phone widths: **24 checks, 0 serious or critical
violations.** Before this batch, four of the five pages failed on
`color-contrast`, including the submit button on sign-in and registration.

Covered by `test/e2e/accessibility.spec.ts` and by the contrast assertions that
replaced a pinned hex in `frontend/src/test/design-system.test.ts`.

---

## Blocked: needs access or a decision that is not ours to make

| Step 9 item | Why it is blocked |
|---|---|
| 9.1 hosting topology and environment mapping reconciled against deployed facts | Requires reading the live Railway project's services, variables and domains and comparing them to the deployment docs. Read-only, but it is a statement about production and should be made with the owner present. |
| 9.2 promotion and rollback rehearsal, secrets injection, provider configuration | Deploying and rolling back a real environment. Explicitly out of scope without authorization. |
| 9.2 storage signing and email against real providers | No SMTP host and no S3 endpoint are configured in any environment reachable from here; the health report says `disabled` for both rather than guessing. |
| 9.3 alerts firing to a real destination | Failures are now detectable — readiness flips and the component report degrades. Nothing is wired to page anyone. No alerting destination exists to configure. |
| 9.4 restore at production scale | Rehearsed against a one-megabyte database. The recovery time above must not be quoted for production until re-run against a production-sized snapshot. |
| 9.6 bounded beta with real maintained jobs and responsive employers | Requires contacting users and publishing real postings. Explicitly out of scope without authorization. |

---

## Beta-readiness verdict

**Not ready to open a beta.** The engineering gates that can be closed from here
are closed, and one of them was closed on a defect that would have made a beta
fail visibly: before this batch, several people applying to the same posting at
once all received a server error, which is precisely what a shared job posting
produces.

What remains is not code. A beta needs the hosting topology confirmed against
what is deployed, a rollback rehearsed rather than documented, an alert that
reaches a person, an SMTP provider configured so that the notifications this
batch made durable can actually leave the building, and a restore rehearsed at
real scale. Each needs access or a decision that was withheld from this batch on
purpose.

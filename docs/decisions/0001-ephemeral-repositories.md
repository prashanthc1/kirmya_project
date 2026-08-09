# ADR 0001: Ephemeral (memory-only) repositories

**Status**: Accepted — enforced in code
**Date**: 2026-08-09
**Affects**: `backend/internal/shared/persistence`, 13 backend modules, 65 of 325 API routes

---

## Context

Thirteen modules ship a repository that satisfies its interface entirely from
process memory. Each one takes a `*pgxpool.Pool` in its constructor, stores it
on the struct, and never issues a query. Until this decision they were also
named `pgx<Module>Repository`, so both the type name and the constructor
signature stated the opposite of what the code did.

Nothing at runtime distinguished them from a database-backed repository. Writes
were accepted, reads came back, handler tests passed, and the API returned 200.
The gap only becomes visible when the process restarts — every row is gone — or
when a second replica serves the request and answers from its own empty copy.

`docs/production_readiness_audit.md` scored "Backend & Data Repositories" 10/10
on the claim of "100% PostgreSQL repository migration; zero raw mock maps in
production". That claim was wrong, and nothing in the codebase would have
contradicted it. This ADR exists because the failure mode is silence.

## Inventory

| Module | Route prefix | Routes | Data held in memory | What a restart costs |
| :-- | :-- | --: | :-- | :-- |
| `assessment` | `/api/v1/assessments` | 5 | assessments, question banks, results, badges | completed assessments and awarded badges |
| `career_ai` | `/api/v1/career-ai` | 7 | sessions, recommendations, AI usage logs | advice history, and the usage counters any cost control depends on |
| `career_companion` | `/api/v1/career-companion` | 6 | conversations, messages, career plans, user context | every chat thread; the companion forgets the user |
| `endorsement` | `/api/v1/endorsements` | 7 | endorsements, recommendations, references | content written by *other* users about this one |
| `global_marketplace` | `/api/v1/global` | 4 | seeded regions, market insights, opportunities | nothing written to it ever survives |
| `landing` | `/api/v1/landing` | 3 | seeded statistics, testimonials, featured jobs | see "fabricated public content" below |
| `mobile` | `/api/v1/mobile` | 12¹ | device registrations, upload sessions | devices re-register; in-flight uploads orphaned |
| `native_mobile` | `/api/v1/mobile` | ¹ | devices, push tokens, mobile sessions | push stops reaching users whose token was only in memory |
| `recommendation_engine` | `/api/v1/recommendation-engine` | 4 | user preferences, candidate sets | personalisation resets to seeded defaults for everyone |
| `referral` | `/api/v1/referrals` | 5 | referral requests, referrals, history | referral credit, including rewards already owed |
| `resume_analysis` | `/api/v1/resume-analysis` | 3 | analyses, scores, improvement history | user analyses; scores can no longer be compared over time |
| `search` | `/api/v1/unified-search` | 4 | search history, saved search preferences | saved searches on every account |
| `verification` | `/api/v1/verifications` | 5 | requests, document records, status | verified users show as unverified; pending reviews vanish |

¹ `native_mobile` mounts under the same `/api/v1/mobile` group; the 12 routes are shared between the two modules.

Two findings deserve to be called out separately:

- **`verification` is a trust surface.** Verification status resetting to
  "unverified" is a visible integrity failure, and losing pending review
  records means user-submitted documents are accepted and then dropped.
- **`landing` publishes fabricated figures.** The seeded content includes
  `"150,000+ professionals helped"`, `"45,000+ active jobs"` and
  `"94.8% AI match accuracy"`, served from the public landing endpoint. These
  are placeholder strings, not measurements. Shipping them to the public site
  is a marketing-claims problem, not just a persistence one.

## Decision

We are **not** shipping these thirteen modules as if they were durable, and we
are **not** deleting them in this change either — both of those are product
calls. What we are removing is the ability for the situation to go unnoticed:

1. **Honest names.** Every one of these types is now `memory<Module>Repository`
   with a doc comment saying the data dies with the process. The constructor
   still takes the pool so a SQL implementation can replace it without
   touching a single caller.
2. **A registry.** Each constructor calls
   `persistence.RegisterEphemeral(...)`, declaring what it holds and what a
   restart costs. The registry reflects what the running binary wired up, not
   what the source tree contains.
3. **A startup gate.** `persistence.Audit(appEnv, allowEphemeralRepos)` runs in
   `cmd/kirmya/main.go` after dependency construction. Outside production it
   logs the inventory and continues — local development and CI depend on these
   repositories to boot without a database. In production it **refuses to
   start** unless `ALLOW_EPHEMERAL_REPOS=true` is set explicitly.
4. **A regression guard.** `TestEveryMemoryOnlyRepositoryIsRegistered` scans
   the source tree for any repository that accepts a pool and never queries it,
   and fails if it is not registered. A fourteenth one cannot be added quietly.

A deployment that drops user data on every restart is worse than one that does
not come up, because the second is noticed within a minute. That asymmetry is
the whole argument for failing closed.

### Why not fail the request instead of the boot?

Returning `501` from the 65 affected routes was considered. It moves the
failure to the user rather than the operator, and it silently disables a fifth
of the API on a deployment whose owner may have meant to accept the trade-off.
Refusing to start puts the decision in front of the person who can make it.

### Why not just implement the 13 in SQL?

That is the real fix and it remains the intended path — but it needs thirteen
schema migrations and thirteen sets of query code, each with its own data model
questions. Bundling that into the same change as the safety gate would delay
the gate indefinitely. The gate is what stops the wrong claim from being made
in the meantime.

## Consequences

- Production deployments must either implement the storage, stop wiring the
  module, or set `ALLOW_EPHEMERAL_REPOS=true` and own the data loss. There is
  no fourth option where nobody has decided.
- `ALLOW_EPHEMERAL_REPOS=true` is a deliberately unpleasant thing to have in a
  deployment config. It is meant to be.
- The audit line at startup names every module, so an operator reading the
  first screen of logs knows exactly which features are ephemeral.
- `docs/production_readiness_audit.md` has been corrected; the previous 10/10
  for "Backend & Data Repositories" did not describe this codebase.

## Follow-up

- [ ] Decide per module: implement in SQL, or remove the module and its routes.
- [ ] Replace the seeded landing statistics with measured values, or remove the
      claims from the public page.
- [ ] `verification` should be prioritised — it is the one with integrity
      consequences rather than only data-loss consequences.

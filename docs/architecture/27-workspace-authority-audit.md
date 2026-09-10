# 27. Workspace authority sources — implementation audit

| Field | Value |
| :--- | :--- |
| **Status** | Audit complete. Resolver implemented, served on `/auth/me`, and switched in the UI — see §18. |
| **Date** | 2026-09-10 |
| **Audited at** | `04e8ed2` |
| **Target design** | [26-workspace-architecture.md](26-workspace-architecture.md) · [ADR 0002](../decisions/0002-single-identity-multi-workspace-access.md) |
| **Purpose** | Establish the exact existing source of truth for every workspace entitlement, so the resolver implementation can be precise and safe. |

Every claim below was verified against code or the CI database on 2026-09-10.
Nothing is inferred from documentation.

---

## 1. Executive summary

- **`role_id` gates only platform administration.** All 27 role-middleware call
  sites are `RequireAdmin()`. There is no `RequireRole("recruiter")` or
  `RequireRole("freelancer")` anywhere. The legacy global role is far less
  load-bearing than the documentation implied, which makes this migration
  materially safer than expected.
- **Nothing makes someone a recruiter today.** `/recruiter/*` is gated by
  `AuthRequired()` alone, and the first call auto-provisions an organization
  and a recruiter profile stamped `VerificationStatus: "Verified"`. See the
  **P0 finding** in §11.
- **Registration hardcodes `RoleID: "user"`** and the request DTO carries no
  role field, so there is no privilege escalation at signup. But it also means
  **no account in production has `role_id = 'recruiter'`** — the frontend's
  recruiter navigation is dead code for every normally-registered user.
- **The company module is production-ready as an eligibility source.**
  `LoadGrant` filters `m.status = 'approved'`, resolves roles and extra
  permissions per company, and `rolePermissions` is an explicit map with no
  inheritance and no wildcard.
- **Community is also production-ready.** `isAdminOrHigher` /
  `isModeratorOrHigher` both reject non-`active` membership before checking the
  role.
- **Membership status vocabularies differ by domain** — company uses
  `approved`, community uses `active`. Any resolver must not assume one word.
- **Freelancer has no status field at all.** `freelancer_profiles` has
  `availability_status` (available for work), not account standing. Suspension
  is not expressible.
- **Two independent admin authority paths exist.** `RequireAdmin()` reads the
  JWT role claim; `admin_user_roles` + `admin_role_permissions` are read only
  by the admin module's own service. They are never reconciled.
- **Desktop and mobile disagree about who is an admin.** `AppHeader` uses
  `canAccessPlatformAdmin` (three roles); `MobileDrawer` hardcodes two and
  **omits `super_admin`**.
- **No migrations are required** to build the resolver. Every eligibility fact
  it needs is already stored.

---

## 2. Current identity and auth model

| Concern | Location | Behaviour |
| :--- | :--- | :--- |
| User row | `users` | `role_id character varying` — one global role |
| Registration | `auth_service.go:226` | `RoleID: "user"` hardcoded, *"Strictly enforce default role to prevent privilege escalation"*. `RegisterRequest` has no role field. |
| JWT claims | `middleware/auth.go:16` | `UserID`, `Email`, `Role` + registered claims. **No capabilities, no memberships.** |
| Access token | `auth_service.go:1006` | `GenerateAccessToken(userID, email, role)`, HS256, ~15 min |
| Refresh | `auth_service.go:558` | Re-reads `u.RoleID` **from the database** on refresh |
| Auth middleware | `middleware/auth.go` | `AuthRequired()` — verifies token, populates context |
| Role middleware | `middleware/rbac.go` | `RequireRole(...)`, `RequireAdmin()` = `RequireRole(AdminRoles()...)`; `AdminRoles()` = `{admin, super_admin, platform_admin}` |
| Current user | `GET /api/v1/auth/me` → `dto.UserMeDTO` | `user` + `permissions` + `notificationsCount` |
| Permissions | `auth_service.go:942` | **Hardcoded 5-item base list**, plus `admin:access`+`users:manage` when `role_id ∈ AdminRoles()`. No capability or membership data. |

**Global role staleness is bounded.** Because refresh re-reads `role_id` from
the database, a platform-role change propagates within one access-token
lifetime. This does not extend to scoped grants, which are not in the token at
all — and must not be put there (invariant 5).

### 2.1 Classification of role usage

| Use | Count | Class |
| :--- | ---: | :--- |
| `RequireAdmin()` route guards | 27 | **Global platform authorization** |
| `RequireRole()` for anything non-admin | **0** | — |
| JWT `Role` claim | 1 | **Authentication identity** carried for the above |
| `role_id` at registration | 1 | Identity default |
| `role_id` → `admin:access` in `/auth/me` | 1 | Global platform authorization, mirrored to the client |
| Frontend `roleId === 'recruiter'` | 2 | **Legacy single-role assumption** (dead — see §11 P2-1) |
| Frontend `roleId` admin checks | 3 | Presentation; one is **inconsistent** (§8) |

---

## 3. Authority-source inventory

| Table / model | Domain | Identity key | Scope | Status field | Authority represented | Current consumers | Eligibility source? | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `users.role_id` | Platform | PK `users.id` | Global | `users.status` | One global role | JWT, `RequireAdmin`, `/auth/me` | **PARTIAL** | Authoritative for platform admin only. Must not be read for recruiter/freelancer. |
| `company_members` | Company | `user_id` | **Entity** (`company_id`) | `status` — **`approved`** | Membership + base role | `LoadGrant`, company repo | **YES** | Unique on `(company_id,user_id)`; status filtered in the grant query. |
| `company_member_roles` | Company | `user_id`+`member_id` | **Entity** | via joined member | Additional roles + `extra_permissions` | `LoadGrant` | **YES** | Supports several roles and per-member extras. |
| `community_members` | Community | `user_id` | **Entity** (`community_id`) | `status` — **`active`** | `role_name`: owner/admin/moderator/member | `isAdminOrHigher`, `isModeratorOrHigher` | **YES** | Status checked before role, unique constraint present. |
| `admin_user_roles` | Platform admin | `user_id` | Global | none | Many-to-many admin roles | `AdminRepository` only | **PARTIAL** | Real RBAC, but **not consulted by `RequireAdmin`**. See §8. |
| `admin_roles`, `admin_permissions`, `admin_role_permissions` | Platform admin | — | Global | — | Role→permission mapping | `GetUserPermissions` | **PARTIAL** | Same disconnect. |
| `freelancer_profiles` | Freelancer | `user_id` **unique** | Global | **none** (`availability_status` ≠ standing) | Freelancer capability | Freelance handlers | **YES, with caveat** | Existence is the only signal; no suspension concept. |
| `recruiter_organization_profiles` | Recruiter | `user_id` | Global (via `org_id`) | `verification_status` — **self-asserted** | Recruiter org profile | `GetOrCreateProfile` | **NO** | Auto-created on first touch. See §4. |
| `recruiter_profiles` / `recruiters` | Recruiter | `user_id` | Global | — | Recruiter identity rows | Recruiter repo | **NO** | Same auto-provisioning path. |
| `organizations` | Recruiter/company | — | Entity | `status` | Tenant | Auto-created by recruiter path | **NO** | Created implicitly, not granted. |

---

## 4. Recruiter capability decision

### A. What makes someone a recruiter today?

**Nothing does.** Verified path:

1. `/recruiter/*` applies `AuthRequired()` only
   (`internal/recruiter/delivery/http/routes.go:11`). No capability gate.
2. Handlers call `GetOrCreateProfile(ctx, userID, "")`
   (`recruiter_service.go:55`), defaulting the company name to
   `"Enterprise Global Partners"`.
3. On `pgx.ErrNoRows` the repository **creates** an `organizations` row
   (`status 'active'`, `org_type 'recruiting'`) and a
   `recruiter_organization_profiles` row with
   `VerificationStatus: "Verified"` (`recruiter_repo.go:459,487`).

So recruiter capability is acquired implicitly by *calling the API*, and the
resulting profile asserts it was verified.

`users.role_id = 'recruiter'` is **never set by the application** —
registration hardcodes `"user"`. Any such row is imported or hand-made data.

### B. Canonical rule for the standalone Recruiting workspace

> **A `recruiter_profiles` row exists for the user AND was created through an
> explicit onboarding action.**

Because the current auto-provisioning cannot distinguish deliberate onboarding
from an incidental API call, the auto-create path must be **closed first**
(§11 P0-1). Until it is, no row is trustworthy evidence of intent, and the
resolver must not treat these tables as an eligibility source.

Recommended sequence: gate `/recruiter/*` on explicit onboarding, add an
`onboarded_at`/`status` column or equivalent, then key eligibility on it.

### C. Should company recruiter membership expose the Recruiting workspace?

**No — they are different workspaces.** A user with company role
`recruiter` or `recruiter_admin` on Acme gets the **Company workspace for
Acme**, whose navigation already includes Jobs and Candidates scoped to that
company. The standalone Recruiting workspace is the *personal* recruiting
surface, backed by `recruiter_jobs` keyed to the user.

Conflating them would let company membership silently create global recruiter
state, which is the "membership grants capability" mistake the architecture
forbids.

### D. Global or company-scoped?

**Both concepts are needed, and they are distinct:**

| Concept | Scope | Backed by | Workspace |
| :--- | :--- | :--- | :--- |
| Recruiter **capability** | Global | recruiter profile + onboarding | `recruiting` |
| Recruiter **role** | Company | `company_member_roles.role ∈ {recruiter, recruiter_admin}` | `company` instance |

Never derive one from the other.

### E. Legacy `role_id = 'recruiter'`

The application never writes it, so the population is imported data only.
Backwards-compatible strategy:

1. **Count them first** — `SELECT count(*) FROM users WHERE role_id NOT IN ('user','admin','super_admin','platform_admin')`. Do not migrate a set nobody has measured.
2. For each, ensure a recruiter profile row exists with onboarding marked
   complete — a data backfill, not a schema change.
3. Narrow `role_id` to the global vocabulary.
4. **Never read `role_id` for recruiter eligibility**, before or after.

No user loses access at any step, because `role_id = 'recruiter'` grants
nothing today.

### F. Revocation

Standalone recruiter capability is self-owned, so it is deactivated, not
revoked by others. Company recruiter membership is revoked by setting
`company_members.status` away from `approved`, or deleting the row — after
which `LoadGrant` returns an empty grant and that company workspace disappears
from the next resolver call. **No new account is ever required.**

---

## 5. Freelancer capability decision

- `/freelance/*` — public reads; writes behind `AuthRequired()` only. **No
  capability gate.**
- `freelancer_profiles` is unique on `user_id` and has **no status,
  verification or enabled column**. `availability_status` describes willingness
  to take work, not standing.
- A suspended freelancer therefore **cannot be expressed**, and a suspended
  profile would still reach every freelance API.

**Recommended canonical rule:**

> A `freelancer_profiles` row exists for the user **and** the account itself is
> active (`users.status = 'active'`).

This is implementable today with no migration. Account-level suspension is the
only suspension that currently exists, and honouring it is strictly better than
existence alone. If per-capability suspension is later required, that is an
**optional** migration (§10), not a blocker.

---

## 6. Company workspace eligibility

Source: `LoadGrant` → `domain.Grant` → `effectivePermissions`. Roles come from
`company_members.role` **and** `company_member_roles.role`, both filtered on
`m.status = 'approved'`.

**Do not expose a company workspace for every member.** `RoleEmployee` holds
only `PermCompanyView`, and `RoleViewer` holds `company:view`, `job:view`,
`analytics:view` — read access to a private dashboard, not management.

**Recommended permission threshold** — a Company workspace instance appears
when the effective permission set intersects **any** of:

```
company:edit      settings:edit     branding:edit
team:manage       team:invite       people:approve    permission:edit
job:create        job:edit          job:publish       job:close
recruiter:manage  recruiter:invite  application:view
```

Under `rolePermissions` this admits `company_owner`, `org_admin`,
`recruiter_admin`, `hiring_manager` and `recruiter`, and correctly excludes
`employee` and `viewer`.

`application:view` is included deliberately: seeing candidate applications is a
recruiting function that warrants the company workspace even without profile
edit rights.

**Multiple companies:** `LoadGrant` is called per `companyID`, so N memberships
yield N independent grants and N distinct workspace instances. The model
supports this without change; the resolver must iterate the user's memberships
rather than assume one.

---

## 7. Community-admin eligibility

Roles are `owner`, `admin`, `moderator`, `member` (`community.go:33`).
`isAdminOrHigher` and `isModeratorOrHigher` both return false unless
`mem.Status == "active"`.

**Recommended rule:**

> `community_members.status = 'active'` **and** `role_name ∈ {owner, admin,
> moderator}`.

Moderator is included because the specified navigation contains Moderation, and
`isModeratorOrHigher` already gates exactly that surface.

**Cross-community protection is already present**: membership is loaded for the
specific `communityID` on each call, so authority on X grants nothing on Y.
Ownership transfer additionally re-checks `ownerMem.RoleName != "owner"`
(`community_service.go:388`).

**Gap:** protection lives in the *service*, not in middleware, so a new handler
that forgets to call these helpers is unprotected by default. Worth a
route-level guard eventually; not a blocker for the resolver.

---

## 8. Platform-admin eligibility

**Canonical server-side rule — unchanged:**

> `users.role_id ∈ {admin, super_admin, platform_admin}`, as returned by
> `AdminRoles()` and enforced by `RequireAdmin()`.

This is the rule 27 route groups already use. The resolver must mirror it
exactly and must not accept any entity-scoped role.

### Two disconnected admin systems

`admin_user_roles` + `admin_roles` + `admin_role_permissions` implement a real
many-to-many admin RBAC, read by `AdminRepository.GetUserPermissions` and
`GetUserRoleCodes` — but **`RequireAdmin()` never consults them.** A user
granted an admin role there is not admitted by the middleware; a user with
`role_id = 'admin'` is admitted regardless of what those tables say.

This is not a vulnerability — the middleware is the stricter of the two — but it
is a latent trap: granting a role in the admin console does not grant access.
Recorded as **P1-2**.

### Frontend / backend mismatch

| Location | Recognises | Correct? |
| :--- | :--- | :--- |
| Backend `AdminRoles()` | `admin`, `super_admin`, `platform_admin` | Authoritative |
| `shared/permissions/canAccessPlatformAdmin` | all three + `admin:access` | ✅ |
| `app/admin/layout.tsx` | uses the helper | ✅ |
| `AppHeader.tsx:109` | uses the helper | ✅ |
| **`MobileDrawer.tsx:96`** | `platform_admin`, `admin` — **omits `super_admin`** | ❌ **P2-2** |

A `super_admin` sees the admin entry on desktop and not on mobile. Presentation
only — the route still admits them — but the two surfaces disagree.

---

## 9. Recommended bootstrap API integration point

**`GET /api/v1/auth/me` — extend it. Do not add an endpoint.**

| Property | Finding |
| :--- | :--- |
| Route | `GET /api/v1/auth/me` |
| Handler | `internal/auth/delivery/http/auth_handler.go` (`GetMe`) |
| Service | `AuthService`, `auth_service.go:~920` |
| DTO | `dto.UserMeDTO` — `user`, `permissions`, `notificationsCount` |
| Frontend consumer | `AuthContext.bootstrap()` → `authService.getMe()` → `applyIdentity` |
| Runs on refresh? | **Yes** — `bootstrap()` runs once per mount, after `refresh()` |
| Returns permissions? | Yes, but hardcoded + admin flags only |
| Caching | None server-side; single in-memory identity client-side |
| Risk of extending | **Low** — additive fields only; existing consumers read named fields |

It is already the post-login and post-refresh bootstrap, already carries
`permissions`, and its client already fans the result into navigation. A second
endpoint would mean two round trips and two truths about one session.

**Candidates rejected:** `/auth/session` (session metadata only — IP, user
agent; wrong concern), `/profile/*` (profile content, not entitlement),
`/admin/*` (admin-gated, so unusable for non-admins).

---

## 10. Database migration decision

**No migrations are required to implement the workspace resolver.**

| Category | Item | Reason |
| :--- | :--- | :--- |
| **Required** | *(none)* | Every eligibility fact the resolver needs is already stored and already queried. |
| **Optional** | Recruiter onboarding marker (`onboarded_at` or `status` on the recruiter profile) | Needed only to make recruiter eligibility trustworthy — but the **P0 route gate must land first**, and it needs no schema change. |
| **Optional** | `user_preferences.last_workspace_type` / `last_workspace_entity_id` | Convenience. Extends an existing 5-column table. Not needed for the resolver. |
| **Optional** | Freelancer capability status column | Only if per-capability suspension is required beyond `users.status`. |
| **Not required** | Generic `workspaces` table | No requirement discovered that domain-owned membership does not already meet. |
| **Not required** | Explicit capability table | `freelancer_profiles` and the recruiter profile tables already serve this. |
| **Not required** | New indexes | `company_members` unique `(company_id,user_id)` + `idx_company_members_user`; `community_members` `uniq_community_membership` + `idx_community_members_uid`; `freelancer_profiles_user_id_key`. All resolver lookups are covered. |
| **Not required** | Uniqueness constraints | Present on all three membership sources. |

---

## 11. Single-role assumptions and findings

### P0 — Security

> ### P0 SECURITY FINDING: recruiter capability self-provisions, and stamps itself Verified
>
> **Affected:** `backend/internal/recruiter/delivery/http/routes.go:11`,
> `backend/internal/recruiter/repository/recruiter_repo.go:447-530`
>
> **Behaviour:** `/recruiter/*` is protected by `AuthRequired()` only. The first
> call by any authenticated user creates an `organizations` row and a
> `recruiter_organization_profiles` row with
> `VerificationStatus: "Verified"` — a value no human or process verified.
>
> **Impact:** Any account can become a recruiter and publish job postings
> without review. Candidate-facing data remains protected — the handlers scope
> by owner, and `GetCandidates` returns only applicants to the caller's own
> jobs (fixed in `545c31a`) — so this is **unauthorized capability
> acquisition and a false trust claim, not cross-tenant data exposure.**
> Severity rests on job postings being a public, trust-bearing surface.
>
> **Remediation:** gate `/recruiter/*` on completed recruiter onboarding;
> stop writing `"Verified"` as a default — persist the real state
> (`unverified` until a verification decision exists). Both are prerequisites
> for treating recruiter tables as an eligibility source.
>
> **Not fixed in this task** — audit only, per the brief.

### P1 — Architecture blockers

- **P1-1** `dto.UserMeDTO` carries no capability or membership data
  (`auth_service.go:942`). The switcher cannot be built until this is extended.
- **P1-2** `admin_user_roles` RBAC is never consulted by `RequireAdmin()`.
  Granting an admin role in the console does not grant access.
- **P1-3** Recruiter eligibility has no trustworthy signal (§4A). Blocks the
  Recruiting row of the resolver only; all other workspaces are unblocked.

### P2 — Migration requirements

- **P2-1** `AppHeader.tsx:105`, `MobileDrawer.tsx:95` —
  `isRecruiter = roleId === 'recruiter' || roleId === 'company_admin'`.
  Registration never writes either value, so **this navigation is unreachable
  for every normally-registered user** while the API is open to all. The
  visibility and the authorization are inverted with respect to each other.
- **P2-2** `MobileDrawer.tsx:96` omits `super_admin` (§8).
- **P2-3** `SignInForm.tsx:106` routes post-login on
  `res?.user?.roleId || 'candidate'` — a persona vocabulary (`candidate`) that
  exists nowhere in the backend.
- **P2-4** `MobileDrawer.tsx:166`, `AppHeader.tsx:304` display `user.roleId` as
  a human-readable subtitle. It will read `user` for everyone.

### P3 — Cleanup

- **P3-1** Registration default is `"user"`; the architecture vocabulary is
  `member`. Harmless today, but two words for one concept.
- **P3-2** `GetOrCreateProfile` defaults company name to
  `"Enterprise Global Partners"`.
- **P3-3** Frontend `canManagePage` / page-admin navigation context are
  unreachable — Pages do not exist.
- **P3-4** Status vocabularies differ per domain (`approved` vs `active`).
  Document per domain; do not unify prematurely.

---

## 12. Eligibility rules

| Workspace | Eligibility source | Rule | Scoped? | Ready? |
| :--- | :--- | :--- | :--- | :--- |
| **Professional** | `users` | `users.status = 'active'` | No | **YES** |
| **Freelancer** | `freelancer_profiles` | Row exists AND `users.status = 'active'` | No | **YES** |
| **Recruiting** | recruiter profile tables | Row exists AND onboarding was explicit | No | **NO** — blocked by P0-1 |
| **Company** | `company_members` + `company_member_roles` via `LoadGrant` | `status = 'approved'` AND effective permissions intersect the management set (§6) | **Yes** — `company_id` | **YES** |
| **Community admin** | `community_members` | `status = 'active'` AND `role_name ∈ {owner, admin, moderator}` | **Yes** — `community_id` | **YES** |
| **Page admin** | none | **BLOCKED — domain not implemented** | Yes | **NO** |
| **Platform admin** | `users.role_id` | `∈ AdminRoles()` = `{admin, super_admin, platform_admin}` | No | **YES** |

Five of seven are ready. Recruiting needs the P0 gate first; Page admin needs a
domain.

---

## 13. Workspace resolver contract

Aggregates existing domain authority. **It is not itself an authority** and must
never be consulted to authorize a request.

```go
// Package workspace resolves which workspaces an account may enter.
//
// It reads existing domain authority and decides nothing on its own. A
// workspace in the result is a statement about navigation, never a grant:
// every request the resulting screens make is authorized independently.
package workspace

type Type string

const (
    TypeProfessional   Type = "professional"
    TypeFreelancer     Type = "freelancer"
    TypeRecruiting     Type = "recruiting"
    TypeCompany        Type = "company"
    TypeCommunityAdmin Type = "community_admin"
    TypePlatformAdmin  Type = "platform_admin"
    // No TypePageAdmin: the Pages domain does not exist.
)

type Workspace struct {
    Type      Type    `json:"type"`
    EntityID  *string `json:"entityId,omitempty"` // required for scoped types
    Label     string  `json:"label"`
    Slug      string  `json:"slug,omitempty"`     // routing handle where one exists
    IsDefault bool    `json:"isDefault"`          // exactly one: professional
}

type Resolver interface {
    ResolveForUser(ctx context.Context, userID uuid.UUID) ([]Workspace, error)
}
```

**Design rules**

1. Professional is always present and always `IsDefault`. If every other lookup
   fails, the result is still `[Professional]`.
2. A failed domain lookup is **not** access — it omits that workspace and logs,
   matching `grantFor`'s existing "a failed lookup becomes no access".
3. Entity-scoped entries always carry `EntityID`; a company entry without one is
   a programming error, not a defaultable value.
4. **No permission sets in the output.** The UI needs labels and routes;
   shipping permissions invites the client to make decisions with them.
5. Aggregation only — it calls existing domain resolvers
   (`LoadGrant`, community membership) rather than re-querying their tables,
   so module boundaries hold.
6. Deterministic ordering: professional, capabilities, company instances,
   community instances, platform admin.

---

## 14. File-by-file migration map

Ordered. Nothing here is done in this task.

| # | Path | Current responsibility | Problem | Required change | Depends on | Risk | Tests | Class |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `internal/recruiter/delivery/http/routes.go` | Recruiter routes | `AuthRequired()` only | Gate on completed onboarding | — | **High** — may break existing users; needs the count from §4E first | Capability gate; existing recruiter journeys | Security |
| 2 | `internal/recruiter/repository/recruiter_repo.go` | Profile provisioning | Auto-creates, stamps `"Verified"` | Explicit onboarding; persist real verification state | 1 | High | Onboarding creates once; no implicit create | Backend |
| 3 | `internal/workspace/` *(new)* | — | No resolver exists | Add `Resolver` per §13 | — | **Low** — additive, no caller yet | The whole matrix in §15 | Backend |
| 4 | `internal/company/service/management_service.go` | `grantFor`, `effectivePermissions` | Not reachable from outside the module | Expose a read-only membership lister | 3 | Low | Multi-company; `approved` filter | Backend |
| 5 | `internal/community/service/community_service.go` | Membership helpers | Same | Expose a managed-communities lister | 3 | Low | Role and status matrix | Backend |
| 6 | `internal/auth/dto/dto.go` | `UserMeDTO` | No capabilities/workspaces | Add `capabilities`, `workspaces` — additive | 3 | Low | Contract test: existing fields unchanged | API |
| 7 | `internal/auth/service/auth_service.go` | Builds `/auth/me` | Hardcoded permissions | Call the resolver; keep existing fields | 3,6 | Medium — hot path; needs a query budget | Latency; failure degrades to Professional | Backend |
| 8 | `frontend/src/context/AuthContext.tsx` | Bootstrap identity | No workspace state | Carry workspaces through `applyIdentity` | 6 | Low | Refresh preserves; invalid falls back | Frontend |
| 9 | `frontend/src/components/shell/AppHeader.tsx` | Desktop nav | `roleId === 'recruiter'` | Drive from served workspaces | 8 | Medium | Only entitled entries render | Frontend |
| 10 | `frontend/src/components/shell/MobileDrawer.tsx` | Mobile nav | Same + omits `super_admin` | Same; use `canAccessPlatformAdmin` | 8 | Medium | Desktop/mobile parity | Frontend |
| 11 | `frontend/src/components/auth/SignInForm.tsx` | Post-login routing | Routes on `roleId`/`'candidate'` | Always `/feed` unless returnUrl | 8 | Low | Landing test | Frontend |
| 12 | `internal/shared/middleware/rbac.go` | `RequireAdmin` | Ignores `admin_user_roles` | Decide: reconcile or document | — | Medium — could widen admin access | Admin matrix | Security |
| 13 | `docs/product/12-roles-permissions.md` | RBAC doc | §2–3 superseded | Replace matrix with capability model | 3 | None | — | Documentation |

---

## 15. Tests required before implementation

Resolver matrix — each asserts the exact returned set:

| # | Fixture | Expectation |
| :--- | :--- | :--- |
| 1 | Professional only | `[professional]`, `isDefault` true |
| 2 | Freelancer capable | `[professional, freelancer]` |
| 3 | Recruiter capable | includes `recruiting` (once P0-1 lands) |
| 4 | Freelancer **and** recruiter | both present — proves non-exclusivity |
| 5 | One managing company membership | one `company` with correct `entityId` |
| 6 | **Two** managing company memberships | **two distinct instances**, both ids |
| 7 | Community `owner`/`admin`/`moderator` | `community_admin` per community |
| 8 | Platform admin | `platform_admin` present |
| 9 | Company membership revoked (`status ≠ approved`) | that instance **absent** |
| 10 | Community membership suspended | that instance **absent** |
| 11 | `RoleEmployee` / `RoleViewer` only | **no** company workspace |
| 12 | `users.status ≠ 'active'` | Professional withheld or resolution refused |
| 13 | Legacy `role_id = 'recruiter'` | **no** recruiting workspace from the role alone |
| 14 | Duplicate membership rows | one instance, not two |
| 15 | Cross-tenant | membership on A yields nothing for B |
| 16 | Domain lookup fails | `[professional]`, error logged, **not** an open grant |
| 17 | No page_admin ever | absent for every fixture |

Security regressions: workspace list is never an input to authorization;
`/company/:id/*` refuses a non-member regardless of the served list.

---

## 16. Recommended next implementation slice

> ### Backend Workspace Eligibility Resolver — read-only, no caller
>
> Implement `internal/workspace` (§13) plus the two read-only listers
> (map items 3–5), with the §15 test matrix. **Do not** wire it into
> `/auth/me` yet.

Why this boundary:

- **No visible change.** No navigation, no login, no JWT, no frontend state.
- **Fully testable alone** — pure function of database state.
- **Reuses existing authority** — `LoadGrant` and the community helpers already
  enforce status and scope; the resolver aggregates rather than reimplements.
- **Stops before the risky part.** Extending `/auth/me` touches a hot path on
  every page load; doing it after the resolver is proven separates a
  correctness question from a performance one.
- **Recruiter is not a blocker.** Five of seven workspaces resolve today; the
  resolver ships with Recruiting behind the P0 gate and gains a row later
  without redesign.

Explicitly out of scope: WorkspaceProvider, switcher, navigation redesign,
schema migrations, authorization refactor, `/recruiting` routes, Pages.

---

## 17. Definition of Ready

**READY FOR WORKSPACE RESOLVER IMPLEMENTATION: YES**

Ready for Professional, Freelancer, Company, Community admin and Platform
admin — five of seven, each with a verified source, a status filter and a
concrete rule.

Two carry conditions, and neither blocks the slice:

1. **Recruiting** is not ready. P0-1 must land first; the resolver ships
   without that row and gains it later.
2. **Page admin** is permanently blocked until the Pages domain exists.

One decision remains open and is **not** on the critical path: whether
`RequireAdmin()` should reconcile with `admin_user_roles` (P1-2). The resolver
mirrors the current middleware rule, so it stays correct either way.

---

## 18. Implementation status

Added after the audit, recording what has since been built. The audit above is
unchanged; this section says which of its recommendations now exist in code.

| Slice | Status | Where |
| :--- | :--- | :--- |
| P0 recruiter capability gate (§11 P0-1) | **Done** | `internal/recruiter` — `RequireRecruiterCapability`, migration 0097 |
| Workspace eligibility resolver (§16) | **Done** | `internal/workspace` |
| Company bulk grant lister (map item 4) | **Done** | `ManagementRepository.ListUserGrants` |
| Community managed-membership lister (map item 5) | **Done** | `CommunityRepository.ListManagedMemberships` |
| `/auth/me` integration (map items 6–7) | **Done** | `dto.UserMeDTO.workspaces`, `AuthService.resolveWorkspaces` |
| Frontend workspace state (map items 8–11) | **Done** | `AuthContext.workspaces`, `WorkspaceSwitcher`, shell entries |

### Workspaces the resolver returns

| Workspace | Implemented | Authority it mirrors |
| :--- | :--- | :--- |
| Professional | Yes | `users.status = 'active'` |
| Freelancer | Yes | `freelancer_profiles` row exists, account active |
| Recruiting | Yes | `RecruiterService.RecruiterCapability` = `active` |
| Company | Yes | `domain.Grant.Has` over the company role map |
| Community admin | Yes | `CommunityMember.CanModerate` |
| Platform admin | Yes | `middleware.AdminRoles()` |
| Page admin | **Blocked** | No Pages domain exists |

Recruiting is no longer blocked: §12 marked it **NO** pending the P0 gate, and
that gate has since landed. The resolver reads the capability lifecycle the fix
introduced rather than the recruiter tables directly.

### Decisions taken during implementation

- **Failure is fail-closed and loud.** A domain lookup that errors aborts the
  whole resolution rather than omitting that workspace. This differs from the
  audit's §13 rule 2, deliberately: a silently omitted company reads to the user
  as a revoked one, and a transient outage would be indistinguishable from
  losing access to Acme. An error is recoverable by retry and keeps a missing
  workspace meaning exactly one thing. Degrading to a usable subset is a policy
  decision for the HTTP caller that serves this, which knows whether the request
  can afford to fail; the next slice must make that choice explicitly for
  `/auth/me` rather than inheriting it.
- **A non-active account resolves to nothing at all**, not to Professional. An
  account that may not use the product is not offered somewhere to use it.
- **No `page_admin` constant.** Keeping one "for contract stability" would put a
  value in the vocabulary that the resolver can never return; a type nobody can
  be in is worse than a type that does not exist yet.
- **Communities route by id.** The `communities` table has a `slug` column, but
  the Go model does not map it and every link in the application is built from
  `community.id`. The resolver matches what is served.
- **Company routes use the handle**, matching `/companies/{handle}/admin`. A
  company with no handle falls back to its id, so the path stays well-formed
  rather than collapsing to `/companies//admin`.

### Limitations found while implementing

- **`freelancer_profiles` still has no standing column** (§5 unchanged). Profile
  existence plus account-level status is the whole rule; a freelancer cannot be
  suspended without suspending the account. No migration was added — it is not
  needed for this slice.
- **`FreelanceRepository.GetProfileByUserID` fabricates a profile** when the
  database lookup misses, returning an invented "Software Engineer & Consultant"
  for any account that asks. It is therefore unusable as an eligibility source.
  `HasProfile` was added alongside it for that purpose; the fabricating method is
  left in place because screens depend on it, and replacing it is its own change.
  Same class of defect as the recruiter fabrication removed in `545c31a`.
- **`admin_user_roles` vs `RequireAdmin()` remains unreconciled** (P1-2). The
  resolver mirrors the middleware, so granting an admin role in the console still
  grants neither route access nor a workspace.
- **Active workspace is not persisted.** No `last_workspace` column, by design;
  the architecture allows it later.
- **`users.status` is gated inconsistently across the auth flows.** Login uses a
  denylist (`locked`, `suspended`, `disabled`) while refresh uses an allowlist
  (`status != 'active'`), so an account with `status = 'deleted'` can sign in but
  cannot refresh. That makes the resolver's not-eligible path reachable through a
  fresh access token. Not changed here — altering login admission is a security
  decision of its own — but the resolver handles it correctly: such an account
  gets an empty, complete workspace list.

### `/auth/me` integration

The resolver is served on `GET /api/v1/auth/me`, additively:

| Field | Meaning |
| :--- | :--- |
| `workspaces` | The workspaces the account may enter, in the resolver's deterministic order |
| `workspacesComplete` | Whether that list is the whole answer |

**Degradation policy, decided here rather than in the resolver.** The resolver
fails closed and returns an error; `/auth/me` runs on every page load and every
token refresh, so failing the bootstrap over one unreachable domain would take
the product down rather than one menu. It therefore degrades to the
professional workspace alone — and says so through `workspacesComplete: false`,
because a degraded list and a genuinely single-workspace account are otherwise
identical on the wire, and a client that cannot tell them apart will cache "you
were removed from Acme" as a fact.

Three answers are distinguished:

| Situation | `workspaces` | `workspacesComplete` |
| :--- | :--- | :--- |
| Resolved | the full list | `true` |
| Account not eligible (inactive) | `[]` | `true` — "none" is an answer |
| Domain lookup failed, or resolver unwired | professional only, or absent | `false` |

The privileged-workspace invariant is enforced again where the payload is
built, not only where it is produced: on the error path the auth service filters
the result to the professional workspace, so a future resolver cannot widen what
a failed resolution hands to a client.

**Cost:** five queries, constant in membership count. Measured on `/auth/me`
against the same database: median 1.58 ms before, 2.13 ms after (+0.55 ms);
p95 2.30 ms → 2.77 ms. No caching added.

### Frontend switcher

The switcher sits beside the account controls on desktop and inside the drawer's
account block on a phone, opening from the account control at both breakpoints
as §11.2 requires. It lists only entitled workspaces, grouped personal → entity
→ platform, and renders nothing for an account with fewer than two: a control
that cannot switch is a control that does nothing.

**The active workspace is derived from the URL** (`activeWorkspace`), not stored
beside it. That is the whole design — there is no selection to fall out of step
with the address bar, Back and Forward work without being taught to, a reload
lands where it left off, and a revoked workspace simply stops matching and falls
back to Professional. Nothing is persisted, so §26 (no workspace persistence)
still holds and needs no migration.

Matching is longest-route-prefix and segment-aware, so `/recruiterly` is not
inside `/recruiter`.

Three P2 findings from §11 are closed by this, because the server now serves the
truth those checks were guessing at:

| Finding | Was | Now |
| :--- | :--- | :--- |
| P2-1 | `roleId === 'recruiter' \|\| 'company_admin'` — unreachable for every real account | The served `recruiting` workspace |
| P2-2 | `MobileDrawer` omitted `super_admin` | `canAccessPlatformAdmin`, the same helper the header uses |
| P2-3 | Post-login routed on `roleId`, defaulting to a `'candidate'` persona | Always `/feed` unless a safe `returnUrl` |
| P2-4 | Both surfaces displayed `user.roleId` ("user" for everyone) | Job title, else the active workspace label |

Two further defects were found while wiring it and fixed:

- **The mobile administration entry led to a 404.** It pointed at
  `/admin/dashboard`, which has no page, while the header sent administrators to
  `/admin`. Both now use the platform workspace's own route and name.
- **`/recruiter/*` had no way back.** It is the only workspace with its own
  layout rather than the global shell, so the switcher was absent there — an
  account could switch in and be stranded. `RecruiterHeader` now carries it, in
  place of a fabricated "Emaar Group HQ / Corporate Administrator" badge with a
  verified tick, shown to every recruiter whoever they were, and a notification
  count hardcoded to 4.

Still not done: the contextual navigation redesign per workspace, and
persistence of the active workspace. The JWT is unchanged — scoped authority
stays server-resolved per request, which is what lets a capability gained
mid-session appear on the next bootstrap without a new token.

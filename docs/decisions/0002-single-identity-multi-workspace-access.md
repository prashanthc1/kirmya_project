# ADR 0002: Single identity with multi-workspace access

**Status**: Accepted — documentation only; no code implements this yet
**Date**: 2026-09-10
**Affects**: `backend/internal/auth`, `backend/internal/shared/middleware`, `backend/internal/company`, `backend/internal/community`, `backend/internal/recruiter`, `backend/internal/freelance`, `frontend/src/shared/navigation`, `frontend/src/shared/permissions`, `frontend/src/components/shell`, the `users` table and every scoped membership table
**Specification**: [26-workspace-architecture.md](../architecture/26-workspace-architecture.md)

---

## Context

A Kirmya account today has exactly one role. `users.role_id` is a
`character varying` holding a single value; the JWT carries it as a `Role`
claim; `RequireRole` gates routes on it. Product documentation matches:
[12-roles-permissions.md](../product/12-roles-permissions.md) defines eight
roles in an inheritance chain where Company Admin *extends* Recruiter and
Super Admin extends both.

The product this models does not exist. Real users are several things at once:
a professional who also freelances; a recruiter for two different companies; an
engineer who moderates a community and administers her employer's page. None of
that fits one string.

The schema has already outgrown the documentation. These tables exist today:

| Table | What it already models |
| :--- | :--- |
| `company_members` | company_id, user_id, role, status, approval |
| `company_member_roles` | company_id, user_id, role, extra_permissions |
| `community_members` | community_id, user_id, role_name, status |
| `admin_user_roles` | user_id → role_id, many-to-many |
| `freelancer_profiles` | user_id, the freelancer capability |
| `recruiter_profiles`, `recruiters` | the recruiter capability |

So scoped, multi-valued authority is already persisted. What is missing is a
coherent model over it, an API that exposes it, and a UI that can move between
the experiences it implies — without the user logging out, holding a second
account, or maintaining a duplicate profile.

## Problem

Three problems, in order of severity:

1. **The model cannot express scoped authority.** "Recruiter" has nowhere to put
   *for which company*. A user who recruits for Acme and not for Example
   Technologies cannot be represented.
2. **Nothing defines where workspace context stops and authorization starts.**
   Without an explicit rule, "the user is in the Recruiting workspace" becomes a
   de facto permission — the exact confusion that turns a UI preference into a
   privilege escalation.
3. **The documentation actively teaches the wrong model**, so each new module
   reimplements single-role assumptions.

## Decision

Adopt **one identity, many capabilities, several workspaces**, and separate
three concerns permanently:

- **Authentication** — who this user is. One account, one login, one session.
- **Authorization** — what they may do. Resolved server-side, per request, from
  global role + capabilities + scoped memberships.
- **Workspace context** — which experience they are currently using. A UX
  preference with no authority whatsoever.

Concretely:

1. An account holds one small **global role** (`member`, `platform_admin`,
   `super_admin`), zero or more **capabilities** (`freelancer`, `recruiter`),
   and zero or more **scoped memberships** (company, community, page).
2. Workspaces have a **type** and, when entity-scoped, an **entity id**.
3. `ActiveWorkspace` is client state, server-validated, defaulting to
   Professional.
4. Switching workspaces never touches the session, the tokens or the identity.
5. Capabilities are activated by **onboarding**, never by selecting a workspace.
6. Authorization is layered: authenticate → status → resource → membership →
   permission → ownership.
7. Permissions decide access. Roles are a way to grant sets of them.
8. Platform administration stays isolated from all entity-scoped authority.

The **company module is the reference implementation** — `Actor`, `grantFor`,
`effectivePermissions`, typed `domain.Role`/`domain.Permission`, and a
`ViewerContext` that states in its own comment that it is not the security
boundary. Other modules adopt that shape rather than inventing a parallel one.

## Alternatives considered

### Rejected: a separate account or login per persona

Give the user a recruiter account and a professional account.

Rejected because it is a worse product and worse security. It fragments
identity, reputation, connections and messages across accounts; it forces
re-authentication to do ordinary work; it multiplies credentials to phish and
sessions to revoke; and it makes "the same person" unrepresentable — which
breaks the network graph that is the point of the platform.

### Rejected: workspace selection as authorization

Treat the active workspace as the grant: in Recruiting, recruiter endpoints
answer.

Rejected because it puts an access-control decision in client-controlled state.
Anyone who can set `activeWorkspace` can grant themselves the workspace, and
the request carries no other evidence. This is the failure the specification's
invariant 1 exists to prevent, and it is attractive enough — it removes a
database lookup per request — that it must be rejected in writing rather than
left to judgement.

### Rejected: one global mutable role per user

Keep `users.role_id` and switch its value when the user changes context.

Rejected on three grounds. It cannot express scope, so "recruiter for Acme" is
inexpressible. It is a race: a value mutated for UI reasons is read for security
reasons. And it is destructive — becoming a recruiter would revoke being a
professional.

### Rejected: a single generic `workspaces` table

One table with `(user_id, workspace_type, entity_id, role)` for every kind.

Rejected because Kirmya already models these memberships in their own domains,
with the columns each actually needs — approval and department on company
membership, moderation status on community membership. Collapsing them loses
those columns or forces a JSON blob, and it puts every domain's authorization
behind one shared table, which is the opposite of the modular-monolith boundary
this codebase maintains. Prefer domain-owned membership; assemble the workspace
list at the edge.

## Consequences

**Good**

- One account per person, forever. Identity, graph and reputation stay whole.
- Scoped authority becomes expressible, so "recruiter for Acme only" is a
  statement the system can make and enforce.
- Authorization gets one shape across modules instead of per-module invention.
- The UI can stop guessing: it renders what the server says is enterable.

**Costs**

- Resolving memberships per request costs a query. Cache deliberately, with
  invalidation, or accept the cost — do not solve it by trusting the token.
- `/auth/me` grows. It becomes the bootstrap contract for the shell.
- More states to test: the matrix is combinations of capabilities and
  memberships, not a list of eight roles.
- A migration period in which both models exist.

## Security consequences

The central risk of this design is that **workspace context is a lie the client
can tell**. Everything else follows from refusing to believe it.

- Any code path that reads active workspace to make an access decision is a
  vulnerability, not a shortcut.
- Scoped permissions change while an access token is live. The JWT carries only
  the global `Role` today and access tokens are not revocable within their
  ~15-minute lifetime (residual **R02**); scoped grants must therefore be
  resolved per request, or an invalidation strategy must ship first. Putting
  company or community grants into the JWT without one would mean a removed
  admin keeps their access until the token expires.
- Membership removal and suspension must take effect on the next request.
- Hiding a workspace in the switcher is presentation. The route must refuse.
- Platform administration must not become reachable through any entity role.
- The switcher is an enumeration surface: listing workspaces a user cannot enter
  leaks the existence of companies and communities.

No existing control is weakened by this decision. Session handling, CSRF,
refresh-cookie policy, ownership checks and `RequireAdmin` all remain; this adds
a layer above them.

## Migration strategy

Incremental, no flag day. Existing functionality keeps working throughout.

| Phase | Work |
| :--- | :--- |
| 1 | **Documentation and decision** — this ADR and the specification |
| 2 | Backend capability and membership model; resolve grants server-side |
| 3 | Bootstrap API returns capabilities, memberships and entitled workspaces |
| 4 | Frontend workspace state provider |
| 5 | Workspace switcher |
| 6 | Contextual navigation keyed to workspace |
| 7 | Recruiter migration off the global role |
| 8 | Freelancer migration |
| 9 | Company, community and page admin workspaces |
| 10 | Platform admin hardening and isolation review |
| 11 | End-to-end and security regression tests |

`users.role_id` is not dropped in this sequence. It narrows to the global role
(`member`, `platform_admin`, `super_admin`) once capabilities and memberships
carry everything else. Dropping the column is a later decision, taken only when
nothing reads it.

Phase 11 is not optional and not last-if-there-is-time: the invariants in §10 of
the specification are the acceptance criteria for the whole migration.

# Networking, Connections & Professional Relationship Management System

## Architectural Overview

The **Networking, Connections & Professional Relationship Management System** provides discovery, connection lifecycles, relationship organization, networking recommendations, mutual connections, follow/unfollow capabilities, networking goals, private connection notes & labels, referral discovery, messaging integration, and privacy controls for the Kirmya platform.

### Core Capabilities

1. **Connection Lifecycle**:
   - States: `pending`, `accepted`, `declined`, `withdrawn`, `cancelled`, `blocked`.
   - Prevents duplicate requests, self-connections, and requests between blocked users.
   - Enforces unique active connection pairs across directional variations ($A \to B$ vs $B \to A$).

2. **People Discovery & Search**:
   - Advanced filters: Location, Industry, Company, Skills, Job Title, Degree (1st, 2nd, 3rd), and `openToWork`.
   - OpenSearch indexing with automatic PostgreSQL fallback when OpenSearch is unavailable.

3. **Suggested Connections & Recommendation Explanations**:
   - Personalization signals: Mutual connections, similar skills, industry, target companies, shared communities, career interests.
   - Actionable explanations: "3 mutual connections", "Both work in Artificial Intelligence", "Similar skill set in Go".
   - Dismissal support: `POST /api/v1/network/recommendations/:userId/dismiss`.

4. **Private Connection Notes & Labels (IDOR Protected)**:
   - **Notes**: Private relationship context visible only to the owner (e.g. "Met at Dubai Tech Summit").
   - **Labels**: Private category tagging (e.g. `Recruiter`, `Former Colleague`, `Mentor`, `Referral Contact`).
   - Notes and labels are strictly private to the user and never exposed to other users or search indexes.

5. **Networking Goals & Progress**:
   - Private networking goals with targets, categories, deadlines, and progress tracking.

6. **Referral Discovery**:
   - Discovers active connections working at target job companies for referral outreach.

7. **Trust, Safety & Privacy**:
   - Block/Unblock (`POST /network/blocks`, `DELETE /network/blocks/:userId`).
   - Abuse/Spam Reporting (`POST /network/report/:userId`).
   - Respects user privacy controls (profile visibility, connection list visibility, search indexing).

---

## API Endpoint Reference

### People Search & Discovery
- `GET /api/v1/people` or `GET /api/v1/people/search` — Search people with filters.
- `GET /api/v1/people/suggestions` — Get personalized connection recommendations.
- `POST /api/v1/network/recommendations/:userId/dismiss` — Dismiss recommendation.

### Connection Management
- `GET /api/v1/network` — Get network overview stats.
- `GET /api/v1/network/connections` — List user's active connections.
- `DELETE /api/v1/network/connections/:id` — Remove active connection.
- `GET /api/v1/network/requests` — List received pending requests.
- `GET /api/v1/network/requests/sent` — List sent pending requests.
- `POST /api/v1/network/requests` — Send connection request (optional note up to 500 chars).
- `POST /api/v1/network/requests/:id/accept` — Accept connection request.
- `POST /api/v1/network/requests/:id/decline` — Decline connection request.
- `POST /api/v1/network/requests/:id/withdraw` — Withdraw sent request.
- `GET /api/v1/network/mutual/:userId` — View mutual connections with target user.

### Private Notes & Labels
- `GET /api/v1/network/notes/:connectionId` — Fetch private note for connection.
- `POST /api/v1/network/notes` — Create/update private connection note.
- `DELETE /api/v1/network/notes/:id` — Delete private connection note.
- `GET /api/v1/network/labels` — Fetch user's private connection labels.
- `POST /api/v1/network/labels` — Assign private label to connection.
- `DELETE /api/v1/network/labels/:id` — Remove private label.

### Networking Goals
- `GET /api/v1/network/goals` — List user's networking goals.
- `POST /api/v1/network/goals` — Create new networking goal.
- `PATCH /api/v1/network/goals/:id` — Update goal progress or status.
- `DELETE /api/v1/network/goals/:id` — Delete networking goal.

### Referral Discovery & Following
- `GET /api/v1/network/company-connections/:companyId` — Discover connections at target company.
- `POST /api/v1/network/follow/:userId` — Follow user.
- `DELETE /api/v1/network/follow/:userId` — Unfollow user.
- `POST /api/v1/network/report/:userId` — Report user for abuse or spam.

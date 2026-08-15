# Professional Communities, Groups & Knowledge Collaboration System

## Architectural Overview

The **Professional Communities, Groups & Knowledge Collaboration System** provides career groups, community discovery, public/private/invite-only access control, member management, RBAC roles (`owner`, `admin`, `moderator`, `member`), discussions, posts, comments, reactions, announcements, content pinning & locking, virtual events, shared professional resources, moderation dashboard & audit logs, OpenSearch search integration with PostgreSQL fallback, and integrations across Jobs, Mentorship, Learning, and Networking.

---

## Access Control & Community Visibility

1. **Public Communities**:
   - Exposed to all users in discovery and search.
   - Anyone can view rules, topics, member count, public discussions, and resources.
   - Anyone can join directly.

2. **Private Communities**:
   - Require membership approval or invite.
   - Non-members can view name, description, rules, and logo/cover.
   - Discussions, feed posts, events, resources, and member directory are strictly protected from non-members (returns 403 Forbidden).

3. **Invite-Only Communities**:
   - Only authorized Owners, Admins, or Moderators can issue invitations.
   - Arbitrary join requests are rejected.

---

## Role-Based Access Control (RBAC)

- **Owner**: Full group management, settings edit, role assignments, moderation, community deletion, and ownership transfer.
- **Admin**: Member management, join request approvals, post/comment moderation, settings configuration, event/resource creation, announcements.
- **Moderator**: Content moderation (remove posts/comments, lock discussions, pin announcements, handle reports, warn/ban members).
- **Member**: Create discussions, post comments, add reactions, RSVP to events, share resources, view member directory.

---

## API Endpoint Reference

### Discovery & Search
- `GET /api/v1/communities` — Discover and search communities (supports query, category, visibility, industry, skills).
- `GET /api/v1/communities/recommendations` — Personalized community recommendations based on user skills, industry, and career goals.
- `POST /api/v1/communities` — Create a new professional community.
- `GET /api/v1/communities/:id` — Fetch detailed community metadata.
- `PATCH /api/v1/communities/:id` — Update community settings (Owner/Admin only).
- `DELETE /api/v1/communities/:id` — Delete community (Owner only).

### Membership & Invites
- `POST /api/v1/communities/:id/join` — Join public community or request membership to private community.
- `POST /api/v1/communities/:id/leave` — Leave community.
- `GET /api/v1/communities/:id/members` — Searchable member directory.
- `PATCH /api/v1/communities/:id/members/:userId/role` — Update member RBAC role.
- `GET /api/v1/communities/:id/join-requests` — List pending join requests (Admin/Moderator only).
- `PATCH /api/v1/communities/:id/join-requests/:requestId` — Approve or reject join request.
- `POST /api/v1/communities/:id/invites` — Invite user to community.

### Discussions & Posts
- `GET /api/v1/communities/:id/posts` — List community discussions and feed posts.
- `POST /api/v1/communities/:id/posts` — Create a discussion or announcement.
- `POST /api/v1/communities/:id/posts/:postId/pin` — Pin or unpin post (Admin/Moderator).
- `POST /api/v1/communities/:id/posts/:postId/lock` — Lock or unlock discussion thread (Admin/Moderator).
- `GET /api/v1/communities/:id/posts/:postId/comments` — Fetch comments.
- `POST /api/v1/communities/:id/posts/:postId/comments` — Add comment.

### Events & Resources
- `GET /api/v1/communities/:id/events` — List community events.
- `POST /api/v1/communities/:id/events` — Schedule event.
- `GET /api/v1/communities/:id/resources` — List shared resources & guides.
- `POST /api/v1/communities/:id/resources` — Share professional resource.

### Moderation & Safety
- `GET /api/v1/communities/:id/moderation` — Fetch moderation dashboard (flagged reports & audit log).
- `POST /api/v1/communities/:id/moderation/action` — Execute moderation action (warn, remove post, lock thread, ban member).
- `POST /api/v1/communities/:id/reports` — Report post or member for Trust & Safety review.

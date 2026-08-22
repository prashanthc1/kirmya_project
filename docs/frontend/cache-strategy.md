# Kirmya Frontend Cache Strategy & Query Invalidation

## Query Key Governance & Stale Times

| Query Key Category | Stale Time | Cache TTL | Refetch Triggers | Invalidation Trigger |
| :--- | :--- | :--- | :--- | :--- |
| `['user', 'profile']` | 5 minutes | 30 minutes | Window Focus, Reconnect | Profile Edit Mutation |
| `['jobs', 'search', filters]`| 2 minutes | 15 minutes | Filter Change, Pagination | Job Post / Save Mutation |
| `['notifications', 'unread']`| 30 seconds | 5 minutes | Periodic 30s Polling | Mark Read / Clear Mutation |
| `['security', 'sessions']` | 1 minute | 10 minutes | Manual Refresh | Revoke Session Mutation |

## Targeted Invalidation Pattern
Mutations invalidate only specific query keys matching the affected resource (e.g. `queryClient.invalidateQueries(['notifications'])`) to prevent uncontrolled full-application refetch storms.

# Kirmya Optimistic Updates & Rollback Lifecycle

## 1. Permitted Optimistic Actions
Optimistic UI updates are supported for low-risk, idempotent user interactions:
- **Save / Unsave Job**: Toggle bookmark state immediately.
- **Mark Notification Read**: Update unread count badge and read status indicator instantaneously.
- **Connect / Follow**: Update relationship chip to `Pending` or `Connected`.

---

## 2. Rollback Protocol
Every optimistic mutation must register a rollback snapshot handler:

```typescript
// 1. Snapshot previous query state
const previousState = queryClient.getQueryData(['notifications']);

// 2. Optimistically update local query cache
queryClient.setQueryData(['notifications'], (old) => updateReadState(old, id));

// 3. Perform mutation API request; if error occurs, rollback snapshot
try {
  await notificationApi.markAsRead(id);
} catch (error) {
  queryClient.setQueryData(['notifications'], previousState);
  showToastError('Failed to update notification status.');
}
```

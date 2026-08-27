# Kirmya Notification System Developer Guide & Event Contracts

## 1. Publishing Domain Notification Events
To trigger a user notification from any backend service, publish a typed event to NATS JetStream or call the notification service directly:

```go
event := models.NotificationEvent{
    IdempotencyKey: fmt.Sprintf("job_app:%s:%s", appID, candidateID),
    UserID:         candidateID,
    Category:       models.CategoryApplications,
    Priority:       models.PriorityHigh,
    Title:          "Application Status Updated",
    Message:        "Your application for Senior Backend Engineer is now in Interview stage.",
    ActionURL:      "/applications/" + appID,
}
notificationService.ProcessEvent(ctx, event)
```

# Kirmya Abuse Prevention & Anti-Spam Architecture

## 1. Rate Limiting & Behavioral Velocity Rules
- **Messaging Velocity**: Maximum 15 new conversations per hour to prevent mass cold-outreach spam.
- **Connection Requests**: Maximum 50 pending outbound connection requests per rolling 24-hour window.
- **Job Applications**: Cooldown period between rapid-fire bulk applications.

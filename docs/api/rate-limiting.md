# Kirmya API Rate Limiting & Abuse Protection

## Rate Limit Tiers

| Tier Name | Target Endpoints | Threshold Limit | Window Duration | Storage Backend |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication** | `/api/v1/auth/login`, `/api/v1/auth/mfa` | 5 requests | 60 seconds | Redis / In-memory counter |
| **Public API** | `/api/v1/jobs`, `/api/v1/communities` | 60 requests | 60 seconds | Redis / Token Bucket |
| **Authenticated User** | `/api/v1/profile`, `/api/v1/messages` | 300 requests | 60 seconds | Redis / Token Bucket |
| **Admin Operations** | `/api/v1/admin/*` | 600 requests | 60 seconds | Redis / Token Bucket |

## Rate Limit Response Headers
- `X-RateLimit-Limit`: Maximum allowed requests per window.
- `X-RateLimit-Remaining`: Remaining request quota.
- `X-RateLimit-Reset`: Unix timestamp when quota resets.

# Kirmya Native Mobile API Specification & Integration Guide (Android & iOS)

This document provides complete technical specifications for **Android (Kotlin/Jetpack Compose)** and **iOS (Swift/SwiftUI)** mobile engineers connecting to the Kirmya Backend.

---

## 📱 Mobile Authentication & Token Rotation

### 1. Refresh Token Rotation
- **Endpoint**: `POST /api/v1/mobile/auth/refresh`
- **Payload**:
```json
{
  "refresh_token": "ref_mobile_sample_token_xyz987",
  "device_id": "b3e9014f-82a1-43e9-a412-1100aa883311"
}
```
- **Response**:
```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "ref_rot_uuid_1774500000",
  "token_type": "Bearer",
  "expires_in": 86400
}
```

### 2. Device & Push Token Registration (FCM / APNs)
- **Endpoint**: `POST /api/v1/mobile/devices/register` (Auth required)
- **Payload**:
```json
{
  "device_id": "b3e9014f-82a1-43e9-a412-1100aa883311",
  "platform": "android",
  "device_model": "Google Pixel 8 Pro",
  "os_version": "Android 14",
  "app_version": "2.1.0"
}
```

---

## 🚀 5 Dedicated Compact Mobile APIs (`/api/v1/mobile/user`)

### 1. Compact User Profile
- **Endpoint**: `GET /api/v1/mobile/user/profile`
- **Response**:
```json
{
  "user_id": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
  "full_name": "Alex Rivera",
  "headline": "Senior Go Backend Architect",
  "avatar_url": "https://cdn.kirmya.dev/avatars/alex.jpg",
  "is_verified": true,
  "unread_messages": 3,
  "unread_notifications": 5,
  "active_role": "Candidate & Referrer"
}
```

### 2. Compact Jobs Feed
- **Endpoint**: `GET /api/v1/mobile/user/jobs`
- **Response**:
```json
{
  "data": [
    {
      "job_id": "j1111111-1111-1111-1111-111111111111",
      "title": "Senior Go Backend Architect",
      "company": "Stripe Global",
      "location": "Remote / SF",
      "salary": "$180k - $220k",
      "match_score": 96,
      "is_remote": true,
      "posted_time": "2 hours ago"
    }
  ],
  "count": 1
}
```

### 3. Application Progress Stepper
- **Endpoint**: `GET /api/v1/mobile/user/applications`
- **Response**:
```json
{
  "data": [
    {
      "application_id": "a1111111-1111-1111-1111-111111111111",
      "job_title": "Senior Go Backend Architect",
      "company": "Stripe Global",
      "status": "interviewing",
      "applied_date": "July 24, 2026"
    }
  ],
  "count": 1
}
```

### 4. Messaging Preview
- **Endpoint**: `GET /api/v1/mobile/user/messages`

### 5. In-App Notifications Inbox
- **Endpoint**: `GET /api/v1/mobile/user/notifications`

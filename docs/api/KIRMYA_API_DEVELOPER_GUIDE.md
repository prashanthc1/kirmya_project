# Kirmya API Developer Guide & Integration Manual

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: COMPLETE DEVELOPER GUIDE  

---

## 1. Quick Start & Local Environment

### Prerequisites
* Go 1.22+
* Node.js 20+
* PostgreSQL 16+ (or run `ALLOW_NO_DB=true` for offline development)

### Starting the Backend
```bash
cd backend
# Run server with live Swagger UI enabled
SWAGGER_ENABLED=true go run ./cmd/kirmya
```
The API monolith will be active on `http://localhost:8080` with interactive Swagger UI documentation at `http://localhost:8080/swagger/index.html`.

---

## 2. Authentication & Authorization

### Logging in & Obtaining Tokens
```http
POST /api/v1/auth/login HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "email": "candidate@kirmya.ae",
  "password": "Password123!"
}
```

### Making Authenticated Requests
Pass the access token in the standard `Authorization` header:
```http
GET /api/v1/profile/me HTTP/1.1
Host: localhost:8080
Authorization: Bearer <access_token>
```

---

## 3. Pagination & Query Conventions

### Standard Pagination Parameters
All listing endpoints accept:
* `page` (integer $\ge 1$, default: 1)
* `limit` (integer $1 \dots 100$, default: 20)

### Paginated Response Schema
```json
{
  "data": [
    { "id": "b8719cc6-bb82-4ac9-b2c5-7c88e5aca9c5", "title": "Staff Engineer" }
  ],
  "page": 1,
  "limit": 20,
  "total": 45,
  "total_pages": 3
}
```

---

## 4. WebSockets Integration

### Endpoint
`ws://localhost:8080/api/v1/messages/ws?token=<jwt_token>`

### Message Ingress & Egress
Messages are exchanged as JSON payloads. Real-time events include:
* `new_message`: Incoming direct message in an active conversation.
* `notification`: Real-time toast/banner notification event.
* `presence`: Global user online/offline presence broadcast.

# Kirmya Backend Modular Monolith & Domain Architecture Guide

## 1. Architectural Philosophy & Dependency Flow

Kirmya's backend is structured as a **Modular Monolith** engineered with strict layer boundaries and explicit dependency injection. This architecture ensures high performance, rapid iteration, and immediate testability while providing clean extraction boundaries for future microservices.

```
Client (Next.js / TypeScript / Mobile)
        │
        ▼
[HTTP Transport Layer] (Gin Router & Delivery Handlers)
        │ (Request Validation & Context Extraction)
        ▼
[Domain / Service Layer] (Business Rules, Invariants & Use-Cases)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
[Repository Layer]             [Event Bus / NATS]            [External Adapters]
(pgxpool / PostgreSQL SQL)     (In-Process / PubSub)         (OpenSearch, AI, Mailer)
```

---

## 2. Layer Responsibilities & Strict Boundaries

### 2.1 Transport Layer (`internal/<module>/delivery/http/`)
- **Single Responsibility**: HTTP request parsing, header extraction, query binding, and transport-level authorization context verification.
- **Contract Enforcement**: Handlers never execute direct SQL or instantiate repository pools; all business execution is delegated to the domain service layer.

### 2.2 Service / Use-Case Layer (`internal/<module>/service/`)
- **Single Responsibility**: Business rule enforcement, cross-entity orchestration, transactional boundaries, event dispatching, and error mapping.
- **Independence**: Services never import Gin context (`*gin.Context`) or depend on HTTP-specific primitives.

### 2.3 Repository Layer (`internal/<module>/repository/`)
- **Single Responsibility**: PostgreSQL SQL execution via `*pgxpool.Pool` with thread-safe `sync.RWMutex` protected in-memory fallbacks when running without external databases (`ALLOW_NO_DB=true`).
- **Safety**: Uses parameterized queries preventing SQL injection and bounded pagination limits.

---

## 3. Dependency Injection & Zero-Global Principle

- **Constructor Injection**: All services and repositories are instantiated via explicit factory functions (e.g. `NewUserService(repo, eventBus, config)`).
- **No Hidden Singletons**: Global mutable singletons are forbidden; configuration is loaded once at bootstrap in `cmd/kirmya/main.go` and passed down immutably.

---

## 4. Module Directory & Extraction Matrix

| Module | Core Responsibility | Database Entities | Potential Future Service |
| :--- | :--- | :--- | :--- |
| **`auth`** | Identity, tokens, MFA, sessions | `users`, `sessions`, `mfa_secrets` | Identity Service |
| **`profile`** | Career identity, skills, experience | `profiles`, `experiences`, `skills` | Profile Service |
| **`jobs`** | Job listings, lifecycle, search | `jobs`, `saved_jobs` | Job Market Service |
| **`applications`** | Candidate ATS pipeline | `applications`, `application_stages` | ATS Service |
| **`communities`** | Groups, posts, moderation | `communities`, `community_posts` | Community Service |
| **`networking`** | Relationships, requests, blocks | `connections`, `connection_requests` | Graph / Network Service |
| **`messaging`** | Chat, presence, WebSockets | `conversations`, `messages` | Real-Time Chat Service |
| **`notification`** | In-App, email, push routing | `notifications`, `preferences` | Notification Service |
| **`compliance`** | DSR, GDPR/CCPA, retention | `data_requests`, `legal_holds` | Compliance Service |
| **`admin`** | Platform operations, RBAC | `admin_roles`, `audit_logs` | Admin Service |
| **`ai`** | Resume scoring, career guidance | `ai_preferences`, `ai_analyses` | AI Intelligence Service |
| **`billing`** | Plans, entitlements (100% free) | `plans`, `subscriptions` | Billing Service |
| **`system_health`**| Liveness, readiness, diagnostics | In-Memory / Telemetry probes | Core Runtime Probe |

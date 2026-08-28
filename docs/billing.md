# Kirmya Monetization, Billing Architecture & Entitlement Subsystem

## 1. Overview & Current Business Model

**Kirmya is currently 100% free** for all users, candidates, recruiters, and employers. All core career tools, job searches, applications, resume builders, messaging, and community features are provided without financial paywalls.

To support future optional enterprise or recruiter billing without breaking existing modular boundaries, Kirmya maintains a dedicated **Billing & Entitlement Subsystem** (`backend/internal/billing`).

---

## 2. Subsystem Architecture

```
Client (Next.js / TypeScript / MUI v6)
        │
        ▼
Billing HTTP Handler (/api/v1/billing/...)
        │
        ▼
Billing Service Layer (internal/billing/service)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
Billing Repository (PostgreSQL)  PaymentProvider Interface     Entitlement Engine
(Plans, Subscriptions, Usage)   (MockPaymentProvider / Stripe) (Feature & Limit Checks)
```

---

## 3. Configuration & Feature Flags

The billing system is controlled via environment variables:
- `BILLING_ENABLED="false"` (Default: Free Mode)
- `SUBSCRIPTIONS_ENABLED="false"`
- `CHECKOUT_ENABLED="false"`
- `PREMIUM_FEATURES_ENABLED="false"`
- `STRIPE_ENABLED="false"`

When `BILLING_ENABLED=false`:
1. `HasEntitlement(...)` automatically returns `true` for all valid platform features.
2. `CheckLimit(...)` automatically returns `allowed = true` and `remaining = -1` (unlimited).
3. `GetStatus(...)` explicitly informs callers that Kirmya is 100% free with billing disabled.
4. `CreateCheckoutSession(...)` safely rejects checkout initiation with `BILLING_DISABLED`.

---

## 4. Payment Provider Security & Webhook Handling

- **Zero Client Trust**: All pricing, plans, and currency amounts are resolved server-side. No client-asserted price or transaction state is accepted.
- **Provider-Agnostic Interface (`PaymentProvider`)**:
  - `CreateCustomer(ctx, email, name)`
  - `CreateCheckoutSession(ctx, customerID, planID, successURL, cancelURL)`
  - `CreateSubscription(ctx, customerID, planID)`
  - `CancelSubscription(ctx, subscriptionID)`
  - `RefundPayment(ctx, paymentID, amountCents, reason)`
  - `VerifyWebhookSignature(payload, signature, secret)`
- **Webhook Idempotency**: Webhook events persist unique `provider_event_id` records in PostgreSQL before processing to ensure idempotency.
- **Financial Precision**: Monetary amounts use integer minor units (e.g. cents). Floating-point math is strictly prohibited for monetary calculations.

---

## 5. REST API Endpoint Directory

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/billing/status` | Current billing configuration and free-mode status | Public / Auth |
| `GET` | `/api/v1/billing/plans` | Active pricing and membership tiers | Public / Auth |
| `GET` | `/api/v1/billing/subscription` | Current user/organization subscription status | Bearer Token |
| `POST` | `/api/v1/billing/checkout` | Create checkout session (disabled when free) | Bearer Token |
| `POST` | `/api/v1/billing/webhooks/:provider` | Provider webhook ingestion & signature verification | Webhook Signature |

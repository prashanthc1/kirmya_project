# Kirmya Connection Management & Social Graph Protocol

## 1. Connection Request Workflows

### Sending a Connection Request (`POST /api/v1/network/connections/request`)
- Validates sender authentication and verifies recipient is not blocked.
- Enforces unique DB constraint on `(requester_id, addressee_id)` pair.
- Emits real-time notification to recipient via NATS event bus.

### Responding to a Connection Request (`POST /api/v1/network/connections/respond`)
- Accept: Transitions relationship to `connected` state; updates mutual connection counts atomically.
- Decline: Marks request declined; prevents repeat spamming via 30-day cooldown window.
- Withdraw: Allows sender to retract pending request.

---

## 2. Connections Directory (`/network/connections`)
- Renders responsive MUI v6 card directory supporting search within personal connection graph.

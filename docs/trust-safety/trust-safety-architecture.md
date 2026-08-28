# Kirmya Trust & Safety Architecture & Moderation Lifecycle

## 1. Moderation Pipeline & Case Triage

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Report  │ ──► │ Rate Limit & │ ──► │  Moderation  │
│ or AI Flag   │     │ Deduplicate  │     │ Priority Q   │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │ Assigned
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ User Appeal  │ ◄── │  Enforcement │ ◄── │  Human Case  │
│  Submission  │     │ Action Taken │     │    Review    │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐
│ Independent  │
│ Final Ruling │
└──────────────┘
```

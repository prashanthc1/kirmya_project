# Kirmya Community Architecture & Membership State Machine

## 1. Membership Lifecycles & State Transitions

```
                 Public Community                Private Community
                 ┌──────────────┐                ┌──────────────┐
                 │  Join Click  │                │ Join Request │
                 └──────┬───────┘                └──────┬───────┘
                        │                               │ Moderator Approves
                        ▼                               ▼
                 ┌──────────────┐                ┌──────────────┐
                 │Active Member │◄───────────────┤Pending State │
                 └──────┬───────┘                └──────────────┘
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Left Group   │ │Removed Member│ │Banned Account│
└──────────────┘ └──────────────┘ └──────────────┘
```

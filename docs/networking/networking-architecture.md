# Kirmya Networking & Connection Graph Architecture

## 1. Bidirectional Relationship Model & State Machine

```
              ┌───────────────┐
              │  No Relation  │
              └───────┬───────┘
                      │ Send Request
                      ▼
              ┌───────────────┐
              │    Pending    │
              └───┬───────┬───┘
     Accept Query │       │ Reject / Cancel Query
                  ▼       ▼
           ┌──────────┐ ┌───────────────┐
           │Connected │ │  No Relation  │
           └────┬─────┘ └───────────────┘
                │ Remove / Block Action
                ▼
         ┌───────────────┐
         │ Blocked/None  │
         └───────────────┘
```

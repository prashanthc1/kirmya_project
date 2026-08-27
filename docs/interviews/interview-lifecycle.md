# Kirmya Interview Lifecycle & State Transitions

## 1. Interview Status States

```
                                  [Draft]
                                     │
                                     ▼
                                [Scheduled] ◄───┐
                                     │          │ (Rescheduled)
                                     ▼          │
                                [Confirmed] ────┘
                                     │
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
               [Completed]      [Cancelled]       [No-Show]
```

---

## 2. Transition Rules & Business Policies
- **Completed**: Interviewers submit scorecards; ATS stage can advance to Next Stage or Offer.
- **Cancelled**: If an interview is cancelled, notifications are dispatched to all participants with the cancellation rationale.
- **Candidate Withdrawal**: If candidate withdraws their job application, all future scheduled interviews are automatically marked `Cancelled`.

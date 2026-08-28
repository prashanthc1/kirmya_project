# Kirmya Interview Platform Architecture & Scheduling Lifecycle

## 1. End-to-End Interview Coordination Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Recruiter Proposes / Books                  │
│       (Application Stage, Interviewers, Time Slots)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Transactional Slot Booking                  │
│        PostgreSQL Mutex Check (Zero Double-Booking)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│ Candidate Confirmation│             │  Multi-Channel Alerts │
│(Local Timezone Display│             │ (Email, Push, In-App) │
└───────────────────────┘             └───────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Post-Interview Feedback                   │
│         Private Interviewer Scorecard & Evaluation          │
└─────────────────────────────────────────────────────────────┘
```

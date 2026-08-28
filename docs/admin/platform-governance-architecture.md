# Kirmya Platform Governance & Moderation Architecture

## 1. Centralized Governance & Moderation Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                 User / Automated Safety Flag                │
│    (Spam, Scam Job, Harassment, Impersonation, Fraud)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Triage & Prioritization Queue               │
│         (Critical, High, Medium, Low Severity SLA)          │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌───────────────────────┐┌───────────┐┌───────────────────────┐
│  Content Moderation   ││Enforcement││    Appeals Desk       │
│ (Remove, Restore, Warn││ (Restrict)││ (Review, Re-evaluate) │
└───────────────────────┘└───────────┘└───────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Immutable Audit Pipeline                  │
│       (Actor ID, Target ID, Reason Code, Time UTC)          │
└─────────────────────────────────────────────────────────────┘
```

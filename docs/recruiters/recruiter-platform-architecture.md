# Kirmya Recruiter Platform Architecture & Multi-Tenant Boundaries

## 1. Enterprise Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Verified Employer Profile                   │
│           (Public Company Page, Branding & Jobs)            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Organization Hiring Tenant                  │
│       (Multi-Tenant Isolation Scoped by organization_id)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌───────────────────────┐┌───────────┐┌───────────────────────┐
│     Hiring Teams      ││Talent Pool││  Hiring Pipelines     │
│(Owner, Admin, Member) ││(Bookmarks)││ (Notes, Stage, Triage)│
└───────────────────────┘└───────────┘└───────────────────────┘
```

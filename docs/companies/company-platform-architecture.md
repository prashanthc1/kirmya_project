# Kirmya Company & Employer Brand Platform Architecture

## 1. Public Employer Architecture & Content Pipelines

```
┌─────────────────────────────────────────────────────────────┐
│                 Public Company Page (/company/:id)          │
│        (Branding, Mission, Culture, Benefits & Open Jobs)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌───────────────────────┐┌───────────┐┌───────────────────────┐
│   Company Follow Hub  ││  OpenSearch││  Moderated Reviews   │
│(Followers & Job Alerts││(Discovery)││ (Trust & Safety Desk) │
└───────────────────────┘└───────────┘└───────────────────────┘
```

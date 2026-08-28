# Kirmya Interview Scheduling, Video Meetings & Lifecycle Architecture Guide

## 1. Architectural Overview & Workflow

```
[Candidate / Job Seeker]                           [Recruiter / Hiring Manager]
          │                                                     │
          ├─────────────────────────────┐                       ├─────────────────────────────┐
          ▼                             ▼                       ▼                             ▼
View Scheduled Interviews      Join Video Meeting        Schedule / Reschedule       Submit Scorecards
(/api/v1/interviews)          (Signed Meeting URL)     (/api/v1/interviews/sched)  (/api/v1/recruiter/eval)
          │                             │                       │                             │
          └─────────────────────────────┴───────────┬───────────┴─────────────────────────────┘
                                                    ▼
                                     [PostgreSQL Primary Store]
                                  (Multi-Timezone / UTC Storage)
```

---

## 2. Interview Lifecycle & State Transitions

```
[ Proposed ] ──► [ Scheduled ] ──► [ Confirmed ] ──► [ Completed ]
      │                │                 │
      ▼                ▼                 ▼
[ Cancelled ]   [ Rescheduled ]     [ No-Show ]
```

### 2.1 State Rules
1. **Scheduled / Confirmed**: Recruiter issues meeting invitation; calendar event and notifications dispatched.
2. **Rescheduled**: Date/time updated; previous schedule archived in audit history.
3. **Completed**: Interview conducted; feedback/scorecards enabled.
4. **Cancelled**: Either party cancelled the meeting with mandatory cancellation reason.

---

## 3. Candidate & Recruiter Authorization Matrix

| Action | Candidate (Owner) | Recruiter (Org) | Recruiter (Other Org) | Anonymous | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Upcoming Interviews** | Yes | Yes | No (`403 Forbidden`) | No (`403`) | Yes |
| **Schedule Interview** | No (`403`) | Yes | No (`403 Forbidden`) | No (`403`) | Yes |
| **Reschedule Interview** | Yes (Request) | Yes | No (`403 Forbidden`) | No (`403`) | Yes |
| **Cancel Interview** | Yes | Yes | No (`403 Forbidden`) | No (`403`) | Yes |
| **Access Video Link** | Yes | Yes | No (`403 Forbidden`) | No (`403`) | Yes |
| **Submit Feedback** | No (`403`) | Yes | No (`403 Forbidden`) | No (`403`) | Yes |

---

## 4. Timezone, DST & Meeting Security

- **Canonical Storage**: All start/end times stored canonically in UTC (`TIMESTAMPTZ`).
- **Localized Display**: UI renders timestamps formatted to the user's localized timezone (`Intl.DateTimeFormat`).
- **Private Meeting Links**: Video URLs are accessible exclusively through authenticated participant endpoints with zero public index leakage.

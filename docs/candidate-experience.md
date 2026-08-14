# Kirmya Candidate Experience & Application Tracking — Architecture & Operations Guide

## Overview

The Candidate Experience & Application Tracking module in Kirmya provides job seekers with a centralized, privacy-first, professional interface to manage their career search. Candidates can discover tailored job opportunities, track real-time application statuses, monitor scheduled interviews, review historical submissions, manage saved job collections and job alerts, and communicate directly with recruiters.

Kirmya is completely free for all candidates and employers. No subscription or payment features are required.

```
Frontend (Next.js + MUI v6)                  Backend (Go 1.26 + Gin)
┌─────────────────────────┐                  ┌───────────────────────────────────┐
│  /dashboard/jobs        │─── HTTP ────────▶│  ApplicationsHandler (delivery)   │
│  /applications          │                  │         │                         │
│  /applications/[id]     │                  │  ApplicationsService (service)    │
│  /dashboard/applications│                  │         │                         │
│  /dashboard/saved-jobs  │                  │  ApplicationsRepository (repo)    │
│  /dashboard/interviews  │                  │         │                         │
│  /dashboard/job-alerts  │                  │    PostgreSQL (pgxpool)           │
└─────────────────────────┘                  └───────────────────────────────────┘
```

---

## Architecture & Principles

1. **Strict Candidate Ownership**: Every application API request enforces candidate ownership at the database level (`WHERE id = $1 AND candidate_id = $2`). Candidates can only access their own submissions, documents, and timelines.
2. **Recruiter Privacy & Separation**: Recruiter internal notes, candidate ratings, private evaluation forms, and internal hiring discussions are strictly filtered out of candidate-facing responses.
3. **Transparent Application Lifecycle**: Statuses are clearly communicated with human-readable explanations.
4. **Historical Submission Integrity**: When a candidate updates their global profile, submitted application records retain historical submission snapshots.
5. **Withdrawal Safety & Idempotency**: Application withdrawal updates the status to `Withdrawn`, appends a candidate timeline event, and notifies the recruiter ATS pipeline cleanly.

---

## API Endpoints

### Candidate Applications
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/v1/applications` | Get candidate's applications (filter by `status`, `search`) |
| `GET` | `/api/v1/applications/:id` | Get application details, job snapshot, documents, timeline |
| `PUT` | `/api/v1/applications/:id/withdraw` | Withdraw application |
| `GET` | `/api/v1/applications/:id/timeline` | Get chronological timeline items |
| `GET` | `/api/v1/applications/analytics` | Get candidate application stats & career analytics |
| `GET` | `/api/v1/applications/ai-insights` | Get candidate AI application match insights |

### Saved Jobs & Job Alerts
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/v1/jobs/saved` | List saved jobs |
| `POST` | `/api/v1/jobs/:id/save` | Save job opportunity |
| `DELETE` | `/api/v1/jobs/:id/save` | Remove saved job |
| `GET` | `/api/v1/job-alerts` | List active job alerts |
| `POST` | `/api/v1/job-alerts` | Create new job alert |
| `DELETE` | `/api/v1/job-alerts/:id` | Delete job alert |

### Candidate Interviews & Documents
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/v1/interviews` | List upcoming and past interviews |
| `GET` | `/api/v1/documents` | List uploaded candidate documents (resumes, certificates) |
| `POST` | `/api/v1/documents/upload` | Upload candidate document |
| `DELETE` | `/api/v1/documents/:id` | Delete candidate document |

---

## Candidate Application Stages & Explanations

| Status Stage | Candidate Display | Human-Readable Explanation |
|--------------|-------------------|----------------------------|
| `Applied` | **Applied** | Your application has been submitted and is awaiting recruiter review. |
| `Viewed` | **Under Review** | The recruiter has reviewed your application profile and resume. |
| `Shortlisted` | **Shortlisted** | You have passed initial screening and are shortlisted for the role. |
| `Interview` | **Interview Scheduled** | You have been invited to an interview. Check your scheduled dates below. |
| `Offer` | **Offer Received** | The employer has extended a formal job offer. |
| `Accepted` | **Offer Accepted** | You have accepted the job offer. |
| `Rejected` | **Closed** | The employer has closed this application process. |
| `Withdrawn` | **Withdrawn** | You have withdrawn this application. |

---

## User Interface Pages

### 1. Candidate Job Dashboard (`/dashboard/jobs`)
Central command center for candidate job search activity:
- Profile Completion Widget (e.g., 85% complete meter with quick action buttons)
- Overview KPI Cards: Total Applications, Active Pipelines, Interviews Scheduled, Offers Received
- Recommended Jobs Widget (Tailored based on skills and career preferences)
- Recent Applications & Status Updates
- Saved Jobs Quick Access
- Upcoming Interviews Card (with direct video meeting links)
- Active Job Alerts Quick Status
- AI Career Suggestions & Profile Improvement Tips

### 2. Applications Tracker (`/applications` and `/dashboard/applications`)
Unified application management:
- Status filter tabs: `All`, `Active`, `Interview`, `Offer`, `Rejected`, `Withdrawn`
- Real-time search by Job Title, Company Name, or Location
- Server-side pagination & sorting (Newest, Oldest, Recently Updated)
- Visual status chips with hover status explanations
- Direct action buttons: View Details, Message Recruiter, Withdraw Application (with confirmation modal)

### 3. Application Detail (`/applications/[applicationId]`)
Deep dive into a single job application:
- Job Snapshot Card: Title, Company Logo, Location, Salary Range, Employment Type, Active/Closed Job Badge
- Status Explanation Banner: Human-readable explanation of current application state
- Visual Progress Stepper: Applied → Viewed → Shortlisted → Interview → Offer
- Chronological Application Timeline
- Submitted Documents Section: Submitted Resume and Cover Letter with secure view/download links
- Interview Schedule Section: Start time, End time, Timezone, Location/Video Meeting link, Interviewer name
- Recruiter Contact Card: Message recruiter button opening direct conversation thread
- Action Bar: Withdraw application button with confirmation dialog

---

## Security & Privacy Compliance

- **IDOR Protection**: All database queries parameterize candidate ID (`WHERE a.id = $1 AND a.candidate_id = $2`). Attempts to access another candidate's application ID return HTTP 404 / 403.
- **Secure File Storage**: Resume and cover letter URLs use expiring signed access tokens or secure API endpoints. Credentials and internal storage paths are never leaked.
- **Data Protection**: Candidate withdrawals trigger database transaction updates updating stage history cleanly.

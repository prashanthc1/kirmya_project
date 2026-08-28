# Kirmya Employer Onboarding, Organization Verification & Recruiter Team Architecture Guide

## 1. Architectural Overview & Workflow

```
Employer Registration ──► Organization Creation ──► Document Verification ──► Team Invitations & RBAC ──► Employer Workspace
                                                           │
                                                           ▼
                                               [Admin Approval / Review]
```

---

## 2. Organization Lifecycle & Verification State Machine

```
[ Pending Verification ] ──► [ Active / Verified ] ──► [ Suspended ]
           │                                                  │
           ▼                                                  ▼
      [ Rejected ]                                       [ Archived ]
```

### 2.1 State Rules
1. **Pending Verification**: Employer registered; business documents uploaded for review.
2. **Active / Verified**: Approved by platform administrator; job posting and candidate management unlocked.
3. **Suspended**: Temporarily disabled by Trust & Safety; active jobs paused.
4. **Archived / Rejected**: Organization closed or verification rejected with actionable feedback.

---

## 3. Recruiter Team Roles & Permission Matrix

| Permission | Org Owner | Org Admin | Hiring Manager | Recruiter Member | Interviewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Org Settings** | Yes | Yes | No (`403`) | No (`403`) | No (`403`) |
| **Invite Team Members** | Yes | Yes | No (`403`) | No (`403`) | No (`403`) |
| **Manage Roles / Remove** | Yes | Yes (Non-Owners) | No (`403`) | No (`403`) | No (`403`) |
| **Transfer Ownership** | Yes | No (`403 Forbidden`) | No (`403`) | No (`403`) | No (`403`) |
| **Post / Publish Jobs** | Yes | Yes | Yes | Yes | No (`403`) |
| **View ATS Pipeline** | Yes | Yes | Yes | Yes | Yes |
| **Candidate Evaluation** | Yes | Yes | Yes | Yes | Yes |

---

## 4. Multi-Tenant Isolation & Organization Switching

- **Session Context Scoping**: The active organization context is validated server-side for every request (`WHERE organization_id = $1`).
- **Cryptographic Invitation Tokens**: Team invitations utilize high-entropy, hashed tokens with 7-day expiration and single-use redemption guarantees.
- **Secure Verification Documents**: Uploaded business registration documents generate temporary signed URLs accessible exclusively by platform administrators.

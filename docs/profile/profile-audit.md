<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F20 (Audit scores and operational claims exceed their evidence).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya User Profile & Professional Identity Audit

## Executive Summary
This document audits the user profile data models, experience/education entities, skills taxonomy, resume file upload pipelines, profile completeness scoring engine, and privacy-filtered public API views in Kirmya.

---

## 1. Profile Data Architecture

```
                    User Account Identity (`users`)
                                   │
                                   ▼
                   Professional Profile (`profiles`)
                    ├── Work Experience (`experiences`)
                    ├── Education (`education`)
                    ├── Skills & Endorsements (`skills`, `profile_skills`)
                    ├── Certifications & Credentials (`certifications`)
                    ├── Languages (`profile_languages`)
                    ├── Projects & Portfolio (`projects`)
                    ├── Resumes / CV Documents (`resumes`)
                    └── Career Preferences (`career_preferences`)
```

---

## 2. Profile Security & Privacy Safeguards
- **IDOR Protection**: Profiles can only be mutated by their respective owner (`WHERE user_id = caller_id`).
- **Field-Level Privacy Controls**: Phone number, email, and resume downloads are hidden from non-connections or non-recruiters based on user settings.
- **File Upload Protection**: Resumes and profile photos undergo MIME type verification, size limit validation (max 10MB), and are served via expiring pre-signed URLs.

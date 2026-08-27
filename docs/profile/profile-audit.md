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

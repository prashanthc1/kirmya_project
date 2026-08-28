# Kirmya Resume / CV Builder & Career Optimization Architecture

## 1. Architectural Overview

The Kirmya Resume Builder subsystem provides professionals with an interactive, multi-template CV creation tool, section-by-section customization, version history tracking, PDF export, shareable public/private links, and AI-powered ATS optimization and scoring.

```
Resume Client (Next.js / TypeScript / MUI v6)
        │
        ▼
Resume Delivery Handler (/api/v1/resumes/...)
        │ (JWT Context Extraction & Authorization)
        ▼
Resume Service Layer (internal/resume/service)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
PostgreSQL (pgxpool)          AI Resume Optimizer           Storage & PDF Exporter
(Resumes, Sections, Versions) (internal/resume_analysis)    (PDF Streams & Shares)
```

---

## 2. Resume Sections & Data Models

A Resume consists of ordered, typed sections:
- **Contact / Summary**: Full name, email, phone, location, professional headline, summary bio.
- **Experience**: Employer, role, start/end dates, bullet points, location, employment type.
- **Education**: Institution, degree, field of study, graduation dates, GPA/honors.
- **Skills**: Categorized technical, industry, and soft skills with proficiency tags.
- **Certifications**: Credential title, issuer, issue date, expiration, validation URL.
- **Projects**: Project title, URL, description, key outcomes, technologies used.

---

## 3. Resume Templates & Versioning

- **Templates**: `Classic`, `Modern`, `Minimal`.
- **Version Control**: Every major modification creates a historical version snapshot allowing rollback.
- **Default Resume**: Users can designate a default active resume (`POST /api/v1/resumes/:id/default`) used automatically for one-click job applications.

---

## 4. Privacy & Sharing Controls

- **Access Scope**: Resumes are strictly owned by the creating `user_id`.
- **Shareable Links**: Users can generate temporary, scoped shareable URLs (`POST /api/v1/resumes/:id/share`) with configurable privacy levels (`Public`, `Recruiters Only`, `Password Protected`).
- **Revocation**: Shares can be revoked immediately (`DELETE /api/v1/resumes/:id/share`), preventing further public or recruiter access.

---

## 5. REST API Endpoint Directory

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/resumes` | List user's resumes | Bearer Token |
| `POST` | `/api/v1/resumes` | Create new resume | Bearer Token |
| `GET` | `/api/v1/resumes/:id` | Get resume details & sections | Bearer Token |
| `PUT` | `/api/v1/resumes/:id` | Update resume sections | Bearer Token |
| `DELETE` | `/api/v1/resumes/:id` | Delete resume | Bearer Token |
| `POST` | `/api/v1/resumes/:id/duplicate` | Duplicate resume | Bearer Token |
| `POST` | `/api/v1/resumes/:id/default` | Set as primary application resume | Bearer Token |
| `GET` | `/api/v1/resumes/:id/versions` | List version history snapshots | Bearer Token |
| `POST` | `/api/v1/resumes/import` | Import resume from JSON / PDF | Bearer Token |
| `GET` | `/api/v1/resumes/templates` | List available styling templates | Public / Auth |
| `GET` | `/api/v1/resumes/:id/analyze` | AI ATS compatibility analysis & score | Bearer Token |
| `POST` | `/api/v1/resumes/:id/optimize` | AI resume content optimization suggestions | Bearer Token |
| `POST` | `/api/v1/resumes/:id/tailor` | Tailor resume against specific job description | Bearer Token |
| `GET` | `/api/v1/resumes/:id/preview` | Render preview HTML / image | Bearer Token |
| `GET` | `/api/v1/resumes/:id/download` | Download compiled PDF | Bearer Token |
| `POST` | `/api/v1/resumes/:id/share` | Create shareable public/private URL | Bearer Token |
| `DELETE` | `/api/v1/resumes/:id/share` | Revoke active share URL | Bearer Token |
| `GET` | `/api/v1/resumes/:id/analytics` | View resume engagement & view counts | Bearer Token |

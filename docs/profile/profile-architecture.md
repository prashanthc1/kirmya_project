# Kirmya Profile Architecture & Entity Relationships

## 1. Domain Separation
- **Authentication Identity (`users`)**: Stores credentials (email, password hash, MFA secrets).
- **Public Professional Profile (`profiles`)**: Stores public persona (headline, avatar URL, about, current role, location).
- **Sub-Resource Collections**: Managed as discrete sub-entities (`Experience`, `Education`, `Skill`, `Certification`, `Project`, `Resume`).

---

## 2. API Endpoints Overview

| Method | Endpoint | Description | Scope |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/profile/me` | Fetch authenticated user's complete profile | Owner |
| `PATCH`| `/api/v1/profile/me` | Update headline, about, location, career preferences | Owner |
| `POST` | `/api/v1/profile/me/experiences` | Add new work experience entry | Owner |
| `POST` | `/api/v1/profile/me/skills` | Add skill with proficiency level | Owner |
| `POST` | `/api/v1/profile/me/resumes` | Upload new PDF/DOCX resume file | Owner |
| `GET` | `/api/v1/profile/:username` | Fetch public profile (privacy filtered) | Public / Filtered |

# Kirmya User Profile & Professional Identity Platform

## 1. Architectural Overview

The Kirmya User Profile and Professional Identity platform provides a comprehensive identity management system for job seekers, recruiters, and career professionals.

```
Client Request (HTTP / REST)
       │
       ▼
Auth Middleware (JWT Context Extraction -> c.Get("userID"))
       │
       ▼
Profile Delivery Handler (Strict DTO Binding, Validation, Ownership)
       │
       ▼
Profile Service (Completeness Calculation, Reserved Names, Date Logic)
       │
       ▼
Profile Repository (PostgreSQL via pgxpool + Multi-Tier In-Memory Cache)
```

---

## 2. Core Profile Data Schema & Sections

| Section | Model Entity | Validation Rules | Privacy Controls |
| :--- | :--- | :--- | :--- |
| **Header & Identity** | `UserProfile` | Username (3-30 chars, alphanumeric/underscore, no reserved keywords), Headline (max 250 chars) | Public / Search Indexed |
| **About & Summary** | `UserProfile` | Summary markdown text (max 2000 chars) | Public |
| **Work Experience** | `UserWorkExperience` | Company & Title required; StartDate <= EndDate; Current Job handling | Public / Connections Only |
| **Education** | `UserEducation` | Institution & Degree required; StartDate <= EndDate | Public / Connections Only |
| **Skills & Capability**| `UserSkill` | Name required; ProficiencyLevel (`Beginner`, `Intermediate`, `Expert`) | Public / AI Matching |
| **Certifications** | `UserCertification` | Name & IssuingOrganization required; Valid URL format | Public |
| **Projects** | `UserProject` | Title & URL validation | Public |
| **Languages** | `UserLanguage` | Name & Proficiency level | Public |
| **Achievements** | `UserAchievement` | Title & Date achieved | Public |
| **Preferences & Goals**| `CareerPreferencesDTO`| `availabilityStatus` (`open_to_work`, `hiring`, `freelance`), Target Roles, Locations | Recruiter Only / Public |
| **Verification State** | `VerificationRequest` | Government ID / Document upload; `unverified`, `pending`, `verified`, `rejected` | Admin & Profile Badge |

---

## 3. Server-Authoritative Profile Completeness Calculation

Completeness is calculated deterministically on the server side upon every mutating profile update. The client cannot manipulate or submit raw completeness percentages.

- **Headline Added**: +10%
- **Summary Completed**: +15%
- **Work Experience Added**: +20%
- **Education Credential Added**: +15%
- **Skills Listed**: +15%
- **Certifications Added**: +10%
- **Portfolio Projects Added**: +10%
- **Languages Added**: +5%
- **Maximum Score**: 100%

---

## 4. Date Validation & Data Integrity

- **Chronological Consistency**: `EndDate` must be equal to or greater than `StartDate`. Submitting an `EndDate` preceding `StartDate` fails with HTTP 422 / `ErrInvalidDates`.
- **Reserved Username Protection**: Attempts to claim system reserved usernames (`admin`, `support`, `root`, `settings`, `api`, `kirmya`, `jobs`, `companies`) are blocked with HTTP 400 / `ErrReservedName`.
- **Server-Authoritative Identity**: The calling user's identity is extracted exclusively from the cryptographically verified JWT payload (`c.Get("userID")`), completely eliminating IDOR/BOLA vulnerabilities.

---

## 5. REST API Endpoints

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/profile/me` | Retrieve authenticated user's profile with all sub-collections | Bearer Token |
| `PUT` | `/api/v1/profile/me` | Update general profile identity and availability attributes | Bearer Token |
| `GET` | `/api/v1/profile/me/preview` | Preview public rendition of profile | Bearer Token |
| `PUT` | `/api/v1/profile/me/about` | Update about markdown summary | Bearer Token |
| `PUT` | `/api/v1/profile/me/headline` | Update headline and current title | Bearer Token |
| `POST` | `/api/v1/profile/me/experience` | Add work experience entry | Bearer Token |
| `PUT` | `/api/v1/profile/me/experience/:id`| Update work experience entry | Bearer Token |
| `DELETE`| `/api/v1/profile/me/experience/:id`| Remove work experience entry | Bearer Token |
| `POST` | `/api/v1/profile/me/education` | Add education credential | Bearer Token |
| `PUT` | `/api/v1/profile/me/education/:id` | Update education credential | Bearer Token |
| `DELETE`| `/api/v1/profile/me/education/:id` | Remove education credential | Bearer Token |
| `POST` | `/api/v1/profile/me/skills` | Add professional skill | Bearer Token |
| `DELETE`| `/api/v1/profile/me/skills/:id` | Remove professional skill | Bearer Token |
| `POST` | `/api/v1/profile/me/certifications`| Add certification or license | Bearer Token |
| `DELETE`| `/api/v1/profile/me/certifications/:id`| Remove certification | Bearer Token |
| `POST` | `/api/v1/profile/me/projects` | Add portfolio project | Bearer Token |
| `DELETE`| `/api/v1/profile/me/projects/:id` | Remove portfolio project | Bearer Token |
| `POST` | `/api/v1/profile/me/languages` | Add language proficiency | Bearer Token |
| `DELETE`| `/api/v1/profile/me/languages/:id` | Remove language entry | Bearer Token |
| `POST` | `/api/v1/profile/me/achievements`| Add milestone or achievement | Bearer Token |
| `DELETE`| `/api/v1/profile/me/achievements/:id`| Remove achievement | Bearer Token |
| `POST` | `/api/v1/profile/me/photo` | Upload profile avatar | Bearer Token |
| `DELETE`| `/api/v1/profile/me/photo` | Remove profile avatar | Bearer Token |
| `PUT` | `/api/v1/profile/me/privacy` | Update profile visibility & search index settings | Bearer Token |
| `GET` | `/api/v1/profile/me/completeness` | Get completeness score and missing section checklist | Bearer Token |
| `POST` | `/api/v1/profile/me/verification`| Submit ID verification document | Bearer Token |
| `PUT` | `/api/v1/profile/me/career-preferences`| Update job hunt and recruiter preferences | Bearer Token |
| `GET` | `/api/v1/profile/me/resume-consistency`| Compare profile data against uploaded resume | Bearer Token |
| `GET` | `/api/v1/profile/me/analytics` | View profile view counts & search impressions | Bearer Token |
| `GET` | `/api/v1/profile/:username` | Public profile view by username handle | Public |
| `POST` | `/api/v1/profile/:username/report`| Report user profile for Trust & Safety review | Bearer Token |

# Kirmya Complete Profile Experience Specification (Prompt 17/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE PROFESSIONAL PROFILE SPECIFICATION  
**Primary Engine**: Next.js 16 (App Router) + Material UI v6 + PostgreSQL/pgx backend  

---

## 1. Canonical Profile Route Architecture

| Route Path | Canonical Purpose | Auth Requirement | Layout Shell |
| :--- | :--- | :--- | :--- |
| **`/profile`** | **Own Profile View** | Authenticated (`AuthRequired`) | `AuthenticatedLayout` (maxWidth="standard") |
| **`/profile/[username]`** | **Public Candidate Profile** | Public (Respects Privacy Visibility) | `AppHeader` + `MobileDrawer` + `Footer` |
| **`/profile/edit`** | **Profile Editing Studio** | Authenticated (`AuthRequired`) | `AuthenticatedLayout` (maxWidth="standard") |
| **`/profile/completion`** | **Profile Strength & Guidance** | Authenticated (`AuthRequired`) | `AuthenticatedLayout` (maxWidth="standard") |
| **`/profile/preview`** | **Viewer Privacy Preview** | Authenticated (`AuthRequired`) | `AuthenticatedLayout` (maxWidth="standard") |
| **`/profile/settings`** | **Privacy & Visibility Settings** | Authenticated (`AuthRequired`) | `AuthenticatedLayout` (maxWidth="standard") |

---

## 2. Profile Information Architecture

The profile experience answers 6 fundamental professional questions in seconds:
$$\text{Who you are} \longrightarrow \text{What you do} \longrightarrow \text{What you achieved} \longrightarrow \text{What you offer} \longrightarrow \text{What you seek} \longrightarrow \text{How to connect}$$

### Key Sections:
1. **Profile Header (`ProfileHeader.tsx`)**:
   - Avatar with fallback initials, photo upload capability via `POST /api/v1/profile/me/photo`.
   - Full name with prominent display hierarchy and official verification badge (`verified`, `pending`, `rejected`, `unverified`).
   - Professional headline, current position, location, and "Open to Work" pill.
   - Primary "Edit Profile" action for owner, and "Connect / Message" + "Share Profile" for public viewers.
2. **About & Summary (`ProfileAbout.tsx`)**:
   - Structured career summary with comfortable line lengths ($\le 75\text{ch}$) and clean typography.
3. **Work Experience (`ProfileExperience.tsx` & `ExperienceEditor.tsx`)**:
   - Chronological position entries with job title, company, employment type, location, date range, "Current" badge, and key responsibilities.
4. **Education (`ProfileEducation.tsx` & `EducationEditor.tsx`)**:
   - Degree, field of study, university/institution, dates, and honors.
5. **Skills & Competencies (`ProfileSkills.tsx`)**:
   - Verified capability chips with proficiency ratings (`Expert`, `Advanced`, `Intermediate`).
6. **Projects & Portfolio (`ProfileProjects.tsx`)**:
   - Featured project cards with descriptions, roles, and verified external links.
7. **Licenses & Certifications (`ProfileCertifications.tsx`)**:
   - Issuing organization, credential ID, issue/expiration dates, and verification links.
8. **Languages (`ProfileLanguages.tsx`)**:
   - Language capabilities and standardized proficiency levels.
9. **Honors & Achievements (`ProfileAchievements.tsx`)**:
   - Concise accomplishment entries with dates and issuers.
10. **Profile Completeness (`ProfileCompletenessCard.tsx`)**:
    - Centralized linear progress tracker identifying missing sections to boost recruiter discovery.
11. **Profile Analytics (`ProfileAnalyticsCard.tsx`)**:
    - Real metric cards for profile views, search appearances, and connection requests.
12. **Career & Job Preferences (`CareerPreferencesEditor.tsx`)**:
    - Open to work toggle, recruiter visibility, availability status, target roles, and preferred locations.
13. **Privacy & Visibility Settings (`ProfilePrivacySettings.tsx`)**:
    - Public, Connections-Only, or Private visibility controls, with search indexing and contact privacy.

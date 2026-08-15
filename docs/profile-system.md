# Kirmya User Profile, Professional Identity & Verification System — Architecture Guide

## Overview

The **User Profile, Professional Identity & Profile Verification System** provides a comprehensive, privacy-first professional identity experience for Kirmya users, covering profile creation, editing, professional identity header, work experience, education, skills, certifications, achievements, career preferences, resume consistency analysis, profile completeness scoring, verification status, privacy controls, public profiles, profile sharing, and profile analytics.

Kirmya is 100% free for candidates and professionals. No subscription, payment, or pay-for-badge functionality exists.

```
Frontend (Next.js + MUI v6)                      Backend (Go 1.26 + Gin)
┌─────────────────────────────────┐              ┌─────────────────────────────────────┐
│  /profile                       │─── HTTP ────▶│  ProfileHandler (delivery/http)     │
│  /profile/:username             │              │         │                           │
│  /profile/edit                  │              │  ProfileService (service)         │
│  ProfileHeader                  │              │  ├── Completeness Engine            │
│  ProfileCompletenessCard        │              │  ├── Resume Consistency Checker     │
│  CareerPreferencesEditor        │              │  ├── Verification Workflow          │
│  ProfileVerificationCard        │              │  └── Privacy & Visibility Filter    │
│  ProfilePrivacySettings         │              └─────────────────────────────────────┘
│  ResumeConsistencyCard          │
│  ProfileAnalyticsCard           │
└─────────────────────────────────┘
```

---

## Key Features & Functional Modules

### 1. Professional Identity Header & Completeness
- **Profile Header** (`ProfileHeader.tsx`): Photo avatar upload, cover photo, full name, professional headline, current position, location, open-to-work chip, verification badge, connection count, and public sharing actions.
- **Completeness Engine** (`CalculateCompleteness` & `ProfileCompletenessCard.tsx`): Dynamically evaluates profile completeness across 7 core pillars:
  - Photo (15%)
  - Headline (15%)
  - Summary / About (15%)
  - Work Experience (20%)
  - Education (15%)
  - Skills (10%)
  - Career Preferences (10%)
  Provides an interactive checklist with direct action links to reach 100%.

### 2. Career Preferences & Open to Work
- **Career Preferences** (`CareerPreferencesEditor.tsx`): Allows candidates to manage open-to-work toggle, open-to-recruiters toggle, target job roles, preferred locations, and availability status (`looking_for_networking`, `open_to_work`, `available_for_freelance`, `hiring`).

### 3. Profile Verification System
- **Verification Workflow** (`ProfileVerificationCard.tsx` & `RequestVerification`):
  - Candidates can submit verification requests with supporting credentials/documents.
  - Server-side verification states (`unverified`, `pending`, `verified`, `rejected`).
  - Admin audit desk for reviewing requests. Verified profiles display a blue checkmark badge.

### 4. Privacy, Blocking & Search Discovery Controls
- **Privacy Settings** (`ProfilePrivacySettings.tsx`):
  - Overall profile visibility (`public`, `connections_only`, `private`).
  - Search engine discovery toggle (`search_visible`).
  - Contact information privacy.
- **Blocking & Trust & Safety**: Blocked users (`IsBlocked`) are automatically restricted from viewing public profiles or searching blocked accounts.

### 5. Resume Consistency Analysis
- **Resume Consistency** (`ResumeConsistencyCard.tsx` & `CheckResumeConsistency`):
  - Automatically compares uploaded resume details against profile skills and experience entries to highlight title discrepancies or missing skill tags.

---

## API Endpoints

### Profile API (`/api/v1/profile/...` & `/api/v1/profiles/...`)
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `GET` | `/api/v1/profile/me` | Get current user's full profile | Yes |
| `PUT` | `/api/v1/profile/me` | Update general profile fields | Yes |
| `GET` | `/api/v1/profile/me/completeness` | Get profile completeness score & missing sections | Yes |
| `POST` | `/api/v1/profile/me/verification` | Submit profile verification request | Yes |
| `PUT` | `/api/v1/profile/me/career-preferences` | Update career preferences & open-to-work | Yes |
| `GET` | `/api/v1/profile/me/resume-consistency` | Run profile vs. resume consistency analysis | Yes |
| `GET` | `/api/v1/profile/me/analytics` | Get profile views & search appearance analytics | Yes |
| `PUT` | `/api/v1/profile/me/privacy` | Update profile visibility & search preferences | Yes |
| `GET` | `/api/v1/profile/:username` | Get public profile (privacy-filtered) | Optional |
| `POST` | `/api/v1/profile/:username/report` | Report profile for safety violation | Yes |

# Kirmya Career Guidance, Mentorship & Professional Growth System — Architecture Guide

## Overview

The **Career Guidance, Mentorship & Professional Growth System** provides a complete, 100% free mentorship platform for Kirmya users. It enables candidates and professionals to opt in as mentors, search and discover mentors, submit structured mentorship requests, manage active mentor-mentee relationships, set career goals, schedule mentorship sessions, exchange private and shared notes, and connect mentorship directly with skills, learning resources, interview preparation, resumes, and job opportunities.

Kirmya is completely free. No subscription, payment, or paid mentorship functionality exists.

```
Frontend (Next.js + MUI v6)                      Backend (Go 1.26 + Gin)
┌─────────────────────────────────┐              ┌─────────────────────────────────────┐
│  /mentorship                    │─── HTTP ────▶│  MentorshipHandler (delivery/http)  │
│  /mentorship/mentors            │              │         │                           │
│  /mentorship/mentors/:id        │              │  MentorshipService (service)        │
│  /mentorship/:id                │              │  ├── Mentor Opt-In & Profiles       │
│  MentorCard                     │              │  ├── Discovery Search & Matching    │
│  MentorFiltersSidebar           │              │  ├── Request Lifecycle & Limits     │
│  MentorshipRequestModal         │              │  ├── Goals & Progress Engine        │
│  MentorshipGoalsCard            │              │  └── Session Scheduler              │
│  MentorshipSessionsCard         │              └─────────────────────────────────────┘
│  MentorProfileEditor            │
│  MentorshipFeedbackModal        │
└─────────────────────────────────┘
```

---

## Key Features & Functional Modules

### 1. Opt-In Mentor Profiles & Discovery
- **Opt-In Availability** (`isAvailable: true`): Users explicitly opt in to be mentors. They configure headline, current role, skills, industries, mentoring topics, availability preferences, preferred formats (`text`, `video`, `voice`, `in_person`), and `maxMentees` capacity limits.
- **Mentor Discovery Search & Filtering** (`/mentorship/mentors` & `MentorFiltersSidebar.tsx`): Filter mentors by canonical skills, industry, mentoring topics, experience level, and preferred format. Supports OpenSearch cluster queries with PostgreSQL fallback.

### 2. Mentorship Request & Lifecycle Management
- **Request Submission** (`MentorshipRequestModal.tsx`): Mentees send requests specifying career goal, reason, desired topics, expected duration, and preferred format.
- **Request Rules & Limits**: Server-side validation prevents self-requests, duplicate active requests, requests to unavailable mentors, and overbooking beyond `maxMentees` limits. Blocked users cannot send requests.
- **Request Status Lifecycle**: `pending` → `accepted` / `declined` / `cancelled` / `expired`. Acceptance creates an active mentorship relationship (`Status: active`).

### 3. Active Mentorship Workspace, Goals & Sessions
- **Mentorship Workspace** (`/mentorship/[id]`): Central hub for active mentorships displaying participants, goals, scheduled sessions, shared notes, and messaging entry point.
- **Goal Management** (`MentorshipGoalsCard.tsx`): Tracks specific goals with target dates, status (`not_started`, `in_progress`, `completed`, `cancelled`), and related skill tags.
- **Session Scheduling** (`MentorshipSessionsCard.tsx`): Schedule sessions with format badges, private/shared notes, and automated notification reminders.
- **Feedback & Completion** (`MentorshipFeedbackModal.tsx`): Post-mentorship feedback rating and completion recording.

---

## API Endpoints

### Mentorship API (`/api/v1/mentorship/...`)
| Method | Route | Description | Auth Required |
|--------|-------|-------------|---------------|
| `GET` | `/api/v1/mentorship/mentors` | Search & discover available mentors | Yes |
| `GET` | `/api/v1/mentorship/mentors/:id` | Get mentor public profile & availability | Yes |
| `GET` | `/api/v1/mentorship/profile/me` | Get current user's mentor profile | Yes |
| `PUT` | `/api/v1/mentorship/profile/me` | Update mentor profile, topics, & availability | Yes |
| `POST` | `/api/v1/mentorship/requests` | Submit mentorship request | Yes |
| `GET` | `/api/v1/mentorship/requests` | List user's sent & received mentorship requests | Yes |
| `PATCH` | `/api/v1/mentorship/requests/:id` | Accept, decline, or cancel request | Yes |
| `GET` | `/api/v1/mentorship` | List active & past mentorship relationships | Yes |
| `GET` | `/api/v1/mentorship/:id` | Get mentorship details, goals, & sessions | Yes |
| `POST` | `/api/v1/mentorship/:id/goals` | Create mentorship goal | Yes |
| `PATCH` | `/api/v1/mentorship/:id/goals/:goalId` | Update mentorship goal status | Yes |
| `POST` | `/api/v1/mentorship/:id/sessions` | Schedule mentorship session | Yes |
| `PATCH` | `/api/v1/mentorship/:id/sessions/:sessionId` | Update session status & notes | Yes |
| `POST` | `/api/v1/mentorship/:id/feedback` | Submit mentorship feedback | Yes |
| `POST` | `/api/v1/mentorship/:id/report` | Report safety or conduct violation | Yes |

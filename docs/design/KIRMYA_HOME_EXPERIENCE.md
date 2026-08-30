# Kirmya Landing Page & Authenticated Home Experience Specification (Prompt 15/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE HOME & LANDING SPECIFICATION  
**Primary Engine**: Next.js 16 (App Router) + Material UI v6 + TypeScript  

---

## 1. Canonical Routing Architecture

The entry points for Kirmya are defined with explicit separation between public marketing and authenticated workflows:

| Route Path | Canonical Purpose | Layout Shell | Target Audience |
| :--- | :--- | :--- | :--- |
| **`/`** | **Conditional Home Entry** | `PublicLayout` (unauth) / `AuthenticatedLayout` (auth) | Public visitors and returning members. |
| **`/feed`** | **Authenticated Home / Personal Feed** | `AuthenticatedLayout` (maxWidth="wide") | Logged-in candidates, professionals, recruiters. |
| **`/dashboard`** | **Candidate Management Hub** | `AuthenticatedLayout` (maxWidth="wide") | Direct access to applications, resumes, prep. |

---

## 2. Public Landing Page Hierarchy

Designed with **Apple-inspired restraint** and **clear professional value propositions**:

1. **Hero Section (`HeroSection.tsx`)**:
   - High-contrast headline: *"Restart your career with confidence."*
   - Outcome-oriented supporting copy focusing on career recovery, verified referrals, and AI matching.
   - Primary CTA: *"Get Started Free"* (`/signup`) with active physical press feedback (`scale(0.97)`).
   - Secondary CTA: *"Explore Jobs"* (`/jobs`).
   - Interactive job match preview card showing real salary, remote status, and 98% match badge.
2. **Value Propositions (`WhyKirmyaSection.tsx`)**:
   - 6 structured value cards: Career Recovery After Layoffs, Authentic Networking, AI Career Guidance, 100% Free for Candidates, Direct Application Process, Verified Employers.
3. **Product Capabilities & Journey (`FeaturesSection.tsx`, `JourneySection.tsx`)**:
   - 5-step visual recovery journey (Job Loss $\to$ Profile Optimizer $\to$ Community Referrals $\to$ AI Matching $\to$ Next Role).
4. **Social Proof & Metrics (`TestimonialsSection.tsx`, `MetricsSection.tsx`)**:
   - Real candidate reviews and platform capabilities.
5. **Closing CTA & Footer (`CTASection.tsx`, `Footer.tsx`)**:
   - High-impact closing CTA and restrained footer with 100% real route links.

---

## 3. Authenticated Home / Feed Hierarchy

Answers the critical question: *"What should I do next?"* within seconds:

1. **3-Column Professional Desktop Layout**:
   - **Left Column (Profile & Navigation Summary)**:
     - Profile strength progress bar with one-click completion trigger.
     - Quick navigation links (Applications, Saved Jobs, Job Alerts, Resumes, Network).
   - **Center Column (Personalized Activity & Recommendations)**:
     - Welcome banner card with personalized name greeting.
     - Real-time recommended jobs stream fetched via `jobsApi.search()`.
     - Loading skeletons, ErrorState with retry trigger, and accessible EmptyState.
   - **Right Column (AI Tools & Action Rail)**:
     - AI Career Assistant launcher (Resume optimizer, interview coaching).
     - Peer communities exploration card.
2. **Mobile Adaptation**:
   - Side rails collapse cleanly on `< md` screens.
   - 1-tap navigation via `MobileBottomNav` and `MobileDrawer`.

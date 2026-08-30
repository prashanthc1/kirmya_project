# Kirmya Jobs Experience & Discovery Specification (Prompt 16/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE JOBS DISCOVERY SPECIFICATION  
**Primary Engine**: Next.js 16 (App Router) + Material UI v6 + PostgreSQL/pgx backend  

---

## 1. Canonical Job Routes Architecture

| Route Path | Canonical Purpose | Auth Requirement | Layout Shell |
| :--- | :--- | :--- | :--- |
| **`/jobs`** | **Platform-Wide Job Board** | Public (No auth required) | `AppShell` with Search & Filter Toolbar |
| **`/jobs/:id`** | **Job Details & Application View** | Public (Auth required to submit) | `AppShell` with full detail view & modal |
| **`/saved-jobs`** | **Candidate Saved Jobs Hub** | Authenticated (`AuthRequired`) | `AuthenticatedLayout` (maxWidth="standard") |
| **`/dashboard/saved-jobs`** | **Dashboard Saved Jobs Alias** | Authenticated (`AuthRequired`) | `AuthenticatedLayout` |

---

## 2. Jobs Information Architecture & Discovery Flow

The job experience provides frictionless scanning and rapid application:
$$\text{Search \& Keyword Toolbar} \longrightarrow \text{Facet Filter Pills} \longrightarrow \text{Job Card Stream} \longrightarrow \text{Job Detail View} \longrightarrow \text{Save / Apply Action}$$

### Key Components:
1. **`JobSearchFilters.tsx`**:
   - Primary input: Title, skill, or company keyword.
   - Location input: City, state, or remote.
   - Collapsible filter panel: Work mode (`onsite`, `hybrid`, `remote`), Job type (`Full-time`, `Part-time`, `Contract`, `Internship`), Sort (`Featured`, `Newest`, `Salary`, `Title`).
   - Active filter chips with individual delete triggers and "Clear All Filters".
   - Bidirectional URL parameter synchronization (`?q=...&location=...&work_mode=...`).
2. **`JobCard.tsx`**:
   - Company avatar / initials lockup with verified employer indicator.
   - High-contrast job title and company handle link.
   - Location, work mode, employment type, and salary range.
   - Up to 4 skill chip tags.
   - Relative posting date (`Today`, `Yesterday`, `X days ago`).
   - Interactive `SavedJobButton` with optimistic bookmark state.
3. **`JobDetailView.tsx`**:
   - Header paper with verified badges, company lockup, and dominant "Apply for this Role" CTA.
   - Structured sections: About the Role, Key Responsibilities, Qualifications & Requirements, Relevant Skills, and Benefits & Perks.
   - In-modal application submission dialog with optional cover note.
4. **`SavedJobButton.tsx`**:
   - Accessible bookmark icon button with tooltip and optimistic state toggling.
   - Seamless sign-in redirect if an unauthenticated visitor attempts to save.

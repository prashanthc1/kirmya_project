# Kirmya Global Navigation System & Application Shell Specification (Prompt 14/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE GLOBAL NAVIGATION & SHELL SPECIFICATION  
**Primary Engine**: Next.js 16 (App Router) + Material UI v6 + TypeScript  

---

## 1. Executive Summary

Prompt 14 implemented the **Global Application Shell & Navigation Architecture** for Kirmya, translating the design tokens established in Prompt 13 into responsive desktop, tablet, and mobile shell components:
$$\text{Centralized Navigation Config} \longleftrightarrow \text{Role-Aware Shell / AppHeader} \longleftrightarrow \text{AppSidebar / MobileDrawer} \longleftrightarrow \text{AppContainer}$$

---

## 2. Navigation Architecture & Route Hierarchy

All navigation items across desktop, mobile drawer, and secondary sidebars are driven by centralized constants in [`frontend/src/shared/navigation/index.ts`](file:///c:/Users/PRASHANTH/Documents/real/my_project/frontend/src/shared/navigation/index.ts):

### 2.1 Primary Top-Level Navigation
| Item ID | Label | Destination Route | Icon | Badging & State |
| :--- | :--- | :--- | :--- | :--- |
| **`jobs`** | Jobs | `/jobs` | `WorkOutline` | Active when path matches `/jobs*` |
| **`network`** | Network | `/network` | `PeopleOutline` | Active when path matches `/network*` |
| **`communities`** | Communities | `/communities` | `ForumOutlined` | Active when path matches `/communities*` |
| **`messages`** | Messages | `/messages` | `ChatBubbleOutline` | Realtime unread messages count |
| **`notifications`**| Notifications | `/notifications` | `NotificationsNone`| Realtime unread notifications count |

### 2.2 Public Marketing Navigation
| Item ID | Label | Destination Route | Target Audience |
| :--- | :--- | :--- | :--- |
| **`jobs`** | Find Jobs | `/jobs` | Job Seekers & Visitors |
| **`companies`** | Companies | `/companies` | Industry Researchers |
| **`communities`** | Communities | `/communities` | Professional Networks |
| **`about`** | About | `/about` | Platform Information |
| **`login`** | Sign In | `/login` | Returning Members |
| **`signup`** | Join Free | `/signup` | New Registrations |

### 2.3 Role-Aware Consoles
* **Recruiter Console (`/recruiter/*`)**:
  * Dashboard (`/recruiter/dashboard`)
  * Job Postings (`/recruiter/jobs`)
  * Candidate Search (`/recruiter/candidates`)
  * Hiring Pipeline (`/recruiter/pipeline`)
  * Talent Analytics (`/recruiter/analytics`)
* **Admin Center (`/admin/*`)**:
  * Overview (`/admin/dashboard`)
  * User Directory (`/admin/users`)
  * Moderation Queue (`/admin/moderation`)
  * Trust & Safety (`/admin/trust-safety`)
  * Immutable Audit Logs (`/admin/audit-logs`)
  * System Health (`/admin/system`)

---

## 3. Shell Component Primitives

| Component | Path | Responsibility |
| :--- | :--- | :--- |
| **`AppHeader`** | [`src/components/shell/AppHeader.tsx`](file:///c:/Users/PRASHANTH/Documents/real/my_project/frontend/src/components/shell/AppHeader.tsx) | Sticky desktop/tablet navbar with BrandLockup, Search, Badged Icons, Theme toggle, and Account menu. |
| **`MobileDrawer`** | [`src/components/shell/MobileDrawer.tsx`](file:///c:/Users/PRASHANTH/Documents/real/my_project/frontend/src/components/shell/MobileDrawer.tsx) | Accessible slide-out navigation drawer with focus trapping and role sections. |
| **`MobileBottomNav`**| [`src/components/shell/MobileBottomNav.tsx`](file:///c:/Users/PRASHANTH/Documents/real/my_project/frontend/src/components/shell/MobileBottomNav.tsx) | Thumb-friendly bottom navigation bar for compact screens ($< 600\text{px}$). |
| **`AppSidebar`** | [`src/components/shell/AppSidebar.tsx`](file:///c:/Users/PRASHANTH/Documents/real/my_project/frontend/src/components/shell/AppSidebar.tsx) | Collapsible secondary navigation sidebar ($260\text{px} \to 72\text{px}$) with tooltips. |
| **`AppContainer`** | [`src/components/shell/AppContainer.tsx`](file:///c:/Users/PRASHANTH/Documents/real/my_project/frontend/src/components/shell/AppContainer.tsx) | Content container enforcing design token layout widths (`narrow: 640`, `standard: 1024`, `wide: 1280`, `max: 1440`). |
| **`AppShell`** | [`src/components/shell/AppShell.tsx`](file:///c:/Users/PRASHANTH/Documents/real/my_project/frontend/src/components/shell/AppShell.tsx) | Root application layout coordinating Header, Sidebar, Container, Main landmark, and Footer. |

---

## 4. Accessibility & Keyboard Navigation Matrix

1. **Skip-to-Content Link**: Enforces direct jump to `<main id="main-content">` on Tab entry.
2. **Universal Focus Rings**: `outline: 2px solid ${text.primary}`, `outlineOffset: 2px` on all interactive links and buttons.
3. **Coarse Touch Expansion**: $\ge 44 \times 44\text{px}$ touch hit areas on mobile and touch devices.
4. **Escape Key Handling**: Closes User Account Menu and Mobile Navigation Drawer with focus restoration.
5. **Screen Reader Landmarks**: Semantic `<header>`, `<nav aria-label="...">`, `<main id="main-content">`.

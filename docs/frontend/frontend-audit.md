# Kirmya Frontend Architecture & MUI v6 Design System Audit

## Executive Summary
This document provides a comprehensive audit of the Next.js frontend application structure, MUI v6 component governance, glassmorphism design tokens, dark/light theme switching, form validation, state management, and accessibility standards across Kirmya.

---

## 1. Tech Stack & Framework Isolation

| Layer | Framework / Library | Policy & Constraint | Compliance Status |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | React Server & Client Components (`"use client"`) | **Compliant** |
| **UI Components** | MUI v6 (`@mui/material`, `@mui/icons-material`) | Exclusive UI Component Library; **Zero Tailwind CSS** | **100% Compliant** |
| **Styling Tokens** | Emotion & MUI `styled()` / `sx` | Glassmorphic design tokens (`backdropFilter: 'blur(16px)'`) | **Compliant** |
| **State Management** | React Context & Custom Hooks | Server state isolated from local UI state | **Compliant** |
| **Testing** | Vitest + React Testing Library | 37 test files / 423 unit & component tests | **100% PASS** |

---

## 2. Component Organization & Feature Modules (`frontend/src/`)

- `components/`: Pure, reusable presentation components (e.g. `BrandLockup.tsx`, `Navbar.tsx`, `Footer.tsx`).
- `features/`: Feature-scoped domains (`auth`, `profile`, `jobs`, `applications`, `community`, `messaging`, `notifications`, `security`, `privacy`, `admin`).
- `theme/`: MUI v6 centralized theme tokens (`theme.ts`) supporting light and dark mode palettes.
- `app/`: Next.js App Router layout and page boundaries (`/jobs`, `/network`, `/communities`, `/admin`, `/settings`).

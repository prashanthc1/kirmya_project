# Kirmya Frontend State & Data Synchronization Audit

## Executive Summary
This document provides a comprehensive audit of the frontend state management, server-state query caching, mutation lifecycle, browser storage policies, optimistic UI updates, and cross-tab synchronization for Kirmya.

---

## 1. State Classification Matrix

| State Tier | Domain & Scope | Storage Mechanism | Lifecycle & Persistence Rules |
| :--- | :--- | :--- | :--- |
| **Server State** | Profiles, jobs, applications, messages, notifications | Query cache / Context | Stale time 5m; refetch on window focus or mutation invalidation |
| **Auth State** | Bearer JWT session, active user identity | React Context / HTTPS Cookie | Synchronized cross-tab via `BroadcastChannel`; purged on logout |
| **UI State** | Active tab, modal open state, drawer collapse | React `useState` / URL params | Local component tree; reset on route navigation |
| **Form State** | Form field values, validation errors, dirty state | Local form state | Isolated from server refetches until submit |
| **Preferences** | Dark/Light theme, notification sound | `localStorage` | Persisted browser preference key (`kirmya_theme_mode`) |

---

## 2. Browser Storage Hygiene & Privacy Audit

- **`localStorage` Policy**: Reserved exclusively for non-sensitive presentation preferences (`kirmya_theme_mode: 'dark' | 'light'`).
- **Forbidden Persistence**: Passwords, MFA secrets, Bearer JWT access tokens, private chat content, and DSAR export packages are strictly prohibited from being persisted in `localStorage` or `sessionStorage`.
- **Logout Cache Purge**: Executing `logout()` immediately clears all in-memory query caches, user contexts, and non-essential session states, ensuring zero data leak across user switches.

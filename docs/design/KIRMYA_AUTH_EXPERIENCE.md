# Kirmya Complete Authentication & Account Recovery Specification (Prompt 18/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE AUTHENTICATION & ONBOARDING SPECIFICATION  
**Primary Engine**: Next.js 16 (App Router) + Material UI v6 + PostgreSQL/pgx backend  

---

## 1. Canonical Authentication Route Architecture

| Route Path | Canonical Purpose | Auth Access | Layout Shell |
| :--- | :--- | :--- | :--- |
| **`/login`** | **Canonical Sign In** | Public Only (Redirects to `/feed` if authed) | `AuthLayout` + `AuthCard` |
| **`/signin`** | Sign In Alias | Public Only | `AuthLayout` + `AuthCard` |
| **`/auth/signin`** | App Sign In Alias | Public Only | `AuthLayout` + `AuthCard` |
| **`/signup`** | **Canonical Sign Up** | Public Only (Redirects to `/feed` if authed) | `AuthLayout` + `AuthCard` |
| **`/register`** | Sign Up Alias | Public Only | `AuthLayout` + `AuthCard` |
| **`/auth/signup`** | App Sign Up Alias | Public Only | `AuthLayout` + `AuthCard` |
| **`/verification`** | **Email Verification & Credential Hub** | Public / Token-scoped | `AuthLayout` + `AuthCard` / Credential Hub |
| **`/auth/verify-email`** | Email Verification Direct | Public / Token-scoped | `AuthLayout` + `AuthCard` |
| **`/forgot-password`** | **Password Recovery Request** | Public Only | `AuthLayout` + `AuthCard` |
| **`/auth/forgot-password`** | Password Recovery Alias | Public Only | `AuthLayout` + `AuthCard` |
| **`/reset-password`** | **Password Reset Execution** | Public / Token-scoped | `AuthLayout` + `AuthCard` |
| **`/auth/reset-password`** | Password Reset Alias | Public / Token-scoped | `AuthLayout` + `AuthCard` |
| **`/onboarding`** | **First-Time User Profile Setup** | Authenticated (`AuthRequired`) | `OnboardingLayout` + `ProgressStepper` |

---

## 2. Authentication Flow & State Lifecycle

### 1. Sign Up Flow:
$$\text{Registration (`/signup`)} \longrightarrow \text{Validation ($\ge 12$ chars)} \longrightarrow \text{Backend Account Creation} \longrightarrow \text{Email Verification Notice} \longrightarrow \text{Verify Email (`/verification?token=...`)} \longrightarrow \text{Onboarding Studio (`/onboarding`)} \longrightarrow \text{Feed (`/feed`)}$$

### 2. Sign In Flow:
$$\text{Sign In (`/login`)} \longrightarrow \text{In-Memory Access Token + HttpOnly Refresh Cookie} \longrightarrow \text{Role & Return URL Resolution} \longrightarrow \text{Destination (`/feed` / `/dashboard` / Return URL)}$$

### 3. Password Recovery Flow:
$$\text{Forgot Password (`/forgot-password`)} \longrightarrow \text{Generic Privacy Response} \longrightarrow \text{Secure Token in Email} \longrightarrow \text{Reset Password (`/reset-password?token=...`)} \longrightarrow \text{Sign In (`/login`)}$$

---

## 3. Security & Privacy Safeguards

1. **Anti-Enumeration Privacy**: Forgot-password submissions return a generic confirmation message regardless of whether the email exists in the database.
2. **Open-Redirect Defense**: Return URLs are strictly sanitized to ensure only relative internal paths (starting with a single `/`) are permitted.
3. **Token Memory Storage**: Short-lived JWT access tokens are maintained in-memory and never written to `localStorage` or `sessionStorage`. Refresh tokens are securely exchanged via `HttpOnly`, `SameSite=Strict` cookies.
4. **Cache Isolation on Logout**: Invoking `logout()` terminates the backend session, purges the in-memory access token, and invalidates all cached user queries.
5. **Accessible Password Visibility**: Show/hide toggle operates via an explicit `<button type="button">` with `aria-label` and $\ge 40\text{px}$ touch boundaries.

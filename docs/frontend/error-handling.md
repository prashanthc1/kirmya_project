# Kirmya Frontend Error Normalization & UX Resilience

## 1. Unified API Error Normalizer
All backend HTTP error responses (e.g. 401, 403, 404, 409, 429, 500) are intercepted and mapped into structured `AppError` instances with normalized machine-readable codes (`IDOR_FORBIDDEN`, `VALIDATION_FAILED`, `RATE_LIMITED`).

---

## 2. User-Facing Error UI & Boundaries
- **Field-Level Validation**: Displayed directly below form fields via MUI `TextField` error props.
- **Global Error Boundaries**: Next.js App Router `error.tsx` boundaries catch unhandled rendering exceptions gracefully without crashing the global application wrapper.

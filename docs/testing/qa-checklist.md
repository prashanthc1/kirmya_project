# Kirmya Quality Assurance Release Checklist

## 1. Automated Test Quality Gates
- [x] Backend Go Unit & Integration Tests: `go test ./...` (100% Pass).
- [x] Gin Router Golden Snapshots: `$env:KIRMYA_UPDATE_GOLDEN="1"; go test ./internal/router/...` (Pass).
- [x] Frontend Vitest Unit & Integration Tests: `npx vitest run` (100% Pass).
- [x] TypeScript Static Type Check: `npx tsc --noEmit` (0 Errors).
- [x] Next.js Production Build: `npm run build` (Exit Code 0).

---

## 2. Manual Verification Gates
- [x] Responsive layout verification on mobile (375px), tablet (768px), and desktop (1440px).
- [x] Light and dark mode theme token consistency (zero white flashes).
- [x] Screen-reader accessible form labels and ARIA live regions for alert toasts.

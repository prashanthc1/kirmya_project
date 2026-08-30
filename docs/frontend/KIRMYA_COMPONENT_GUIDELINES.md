# Kirmya Frontend Component Architecture & Development Guidelines

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE ARCHITECTURAL STANDARD  

---

## 1. Component Classification Hierarchy

All frontend UI components in Kirmya are organized into four explicit layers:

### Layer 1: Primitives (`@mui/material` & `@mui/icons-material`)
* Basic interactive atoms: `Button`, `TextField`, `Typography`, `Avatar`, `Chip`, `Divider`, `IconButton`.
* Do not encapsulate business logic or network requests in primitives.
* Must support keyboard navigation, visible focus rings, and touch-target minimums ($\ge 44 \times 44\text{px}$).

### Layer 2: UI Patterns (`frontend/src/components/common/`)
* Reusable layout and state primitives:
  * `EmptyState`: Empty collection placeholders with action triggers.
  * `ErrorState`: Error messages with retry and recovery actions.
  * `LoadingState`: Page loaders, card skeletons, and inline spinners.
  * `ConfirmDialog`: Confirmation modals for destructive actions.
  * `PageHeader`: Structured page headers with breadcrumbs and action slots.

### Layer 3: Feature Components (`frontend/src/features/<domain>/` & `frontend/src/components/<domain>/`)
* Domain-specific encapsulated widgets:
  * `JobCard`, `ApplicationCard`, `ProfileHeader`, `ConversationList`, `MessageComposer`, `CommunityPostCard`.
* Interacts with domain React Query hooks (`useJobs`, `useApplications`, `useMessages`).
* Pure presentation logic separated from network transport.

### Layer 4: Next.js Pages (`frontend/src/app/<route>/page.tsx`)
* Top-level route pages that compose feature components and layout wrappers.
* Coordinates URL state, metadata, route parameters, and initial query prefetching.

---

## 2. MUI v6 Standard Usage Rules

1. **Theme Consistency**: All colors, radii, shadows, and typography must reference the centralized MUI theme (`theme.palette.*`, `theme.spacing(*)`, `theme.shape.borderRadius`).
2. **Zero Secondary UI Frameworks**: No Tailwind CSS, Bootstrap, Chakra, or custom CSS classes.
3. **Semantic HTML**: Buttons must render `<Button component="button">`, internal links `<MuiLink component={Link} href="...">`.
4. **Accessible Forms**: Every `TextField` must provide explicit `label`, `aria-describedby` for helper text, and accessible error states.
5. **Reduced Motion**: All animations must respect `prefers-reduced-motion` via `<MotionConfig reducedMotion="user">`.

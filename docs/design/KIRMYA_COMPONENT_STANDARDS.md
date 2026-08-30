# Kirmya Component Standards & Interaction Matrix (Prompt 13/50)

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: ACTIVE COMPONENT STANDARD  

---

## 1. Action & Button Hierarchy

Every view must provide an unambiguous action hierarchy:

| Level | Component Pattern | Variant / Props | Usage & Constraints |
| :--- | :--- | :--- | :--- |
| **Primary** | `Button` | `variant="contained" color="primary"` | Main page action (e.g. "Apply Now", "Create Job", "Send Message"). Maximum **one** primary CTA per primary visual container. |
| **Secondary** | `Button` | `variant="outlined" color="primary" / "inherit"` | Alternative actions (e.g. "Save Job", "Preview Profile", "Filters"). |
| **Tertiary** | `Button` | `variant="text" color="inherit"` | Subtle actions (e.g. "Cancel", "Learn More", "Skip"). |
| **Destructive**| `Button` | `variant="contained" / "outlined" color="error"` | Irreversible operations (e.g. "Delete Job", "Withdraw Application"). Must trigger `ConfirmDialog`. |
| **Icon Action**| `IconButton` | `size="small" / "medium"` | Contextual inline actions (e.g. "Bookmark", "Share", "Close"). Requires `aria-label`. |

---

## 2. Card Hierarchy & Surface Rules

1. **Default Card**: Solid background (`#ffffff` / `#1e293b`), 1px border (`rgba(15, 23, 42, 0.08)` / `rgba(255, 255, 255, 0.08)`), `borderRadius: 16px`, subtle ambient shadow.
2. **Interactive Card (`MuiCardActionArea`)**: Micro scale down on active press (`0.995`), `translateY(-2px)` on hover.
3. **No Gratuitous Cards**: Use sections, dividers, and whitespace when grouping does not require an elevated container.
4. **No Transparent Cards Over Dense Text**: Background opacity must remain 100% on content cards to preserve WCAG contrast.

---

## 3. Input & Form Control Rules

1. **Explicit Labels**: Every input field must have an explicit visible label or `aria-label`.
2. **Standard Height**: Inputs enforce $\ge 44\text{px}$ touch height on coarse pointers.
3. **Focus State**: Indigo focus ring with clean border transition.
4. **Helper & Error Text**: Descriptive error feedback below the input using semantic error tokens.

---

## 4. Feedback & Status Displays

1. **EmptyState**: Rendered when collections have 0 items (clear heading, description, action trigger).
2. **ErrorState**: Rendered when queries fail (sanitized message, retry trigger, error code).
3. **LoadingState**: Rendered during asynchronous state (card skeletons, list skeletons, circular spinner).
4. **ConfirmDialog**: Rendered for destructive actions with explicit confirm/cancel buttons.

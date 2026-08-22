# Kirmya Responsive Design & Viewport Standards

## Breakpoint Grid Strategy

| Breakpoint | Viewport Range | Grid Layout Strategy | Navigation Behavior |
| :--- | :--- | :--- | :--- |
| **`xs` (Mobile)** | `0px - 599px` | Single-column stack (`Grid2 xs={12}`) | Collapsible Drawer / Bottom Nav |
| **`sm` (Tablet)** | `600px - 899px` | 2-Column layout (`Grid2 sm={6}`) | Collapsible Sidebar |
| **`md` (Laptop)** | `900px - 1199px` | Main feed + Sidebar layout | Persistent Sidebar |
| **`lg` (Desktop)**| `1200px+` | 3-Column layout (Navigation + Main Feed + Widgets) | Full Expanded Navigation |

## Mobile Table Adaptation
Admin data tables automatically transform into responsive card stacks on `xs` viewports to prevent horizontal page overflow.

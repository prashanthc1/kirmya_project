# Kirmya Frontend Architecture & App Router Structure

## Architectural Principles

1. **Strict MUI v6 Governance**: All visual elements are built exclusively using Material-UI v6 primitives (`Box`, `Grid2`, `Typography`, `Button`, `Card`, `Paper`, `Drawer`, `Dialog`). Tailwind CSS, Bootstrap, or duplicate UI frameworks are prohibited.
2. **Glassmorphism Aesthetic Tokens**: Modern professional aesthetics featuring semi-transparent glass cards (`background: rgba(255, 255, 255, 0.7)` in light mode, `rgba(15, 23, 42, 0.7)` in dark mode) paired with refined `backdrop-filter: blur(16px)` and subtle border highlights.
3. **App Router Boundaries**: Page components under `src/app/` act as thin orchestrators delegating business rendering to feature modules in `src/features/` and reusable presentation cards in `src/components/`.

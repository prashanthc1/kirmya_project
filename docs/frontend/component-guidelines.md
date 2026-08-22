# Kirmya Component Reusability & Governance Guidelines

## Standard Reusable Components (`src/components/`)

1. **`BrandLockup.tsx`**: Consistent SVG brand logo and typography header across Auth, Navbar, and Footer layouts.
2. **`NotificationItem.tsx`**: Standardized notification card with category chip, priority badge, and deep-link action button.
3. **`UserDataExportCard.tsx`**: DSAR export request widget with download status indicator.
4. **`MaintenanceOverlay.tsx`**: Full-screen glassmorphic overlay displayed when platform maintenance mode is enabled.
5. **`BackupDashboard.tsx`**: Admin disaster recovery management console with RPO/RTO telemetry gauges.

## Component Creation Rules
- **No Duplicate Components**: Before building a new UI card or modal, verify whether an existing component in `src/components/` can be reused or extended via props.
- **MUI Props Usage**: Prefer MUI system props (`sx={{ p: 3, mb: 2 }}`) over inline custom CSS strings.

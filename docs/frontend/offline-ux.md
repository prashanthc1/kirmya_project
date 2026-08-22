# Kirmya Offline-Aware UX & Network Connectivity Architecture

## 1. Network Status Monitoring
The frontend application listens to window `online` and `offline` network events to provide real-time connection status indicators without blocking local UI navigation:

- **Offline Indicator Banner**: Displays a non-intrusive top banner (`"Network Connection Lost - Viewing Cached Data"`).
- **Action Protection**: Disables destructive or mutating buttons (e.g. `Submit Application`, `Delete Account`) while offline.
- **Form Draft Preservation**: Unsaved form entries (e.g. cover letter drafts, post content) are preserved in local component state until connection is restored.

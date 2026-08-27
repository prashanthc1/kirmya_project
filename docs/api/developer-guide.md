# Kirmya Frontend Developer API Integration Guide

## 1. Modular API Client (`src/features/*/services/`)
- All Next.js API calls are routed through typed API service clients in `src/features/*/services/` using Axios/Fetch instances configured with automatic JWT refresh and request ID propagation (`X-Request-ID`).
- **Offline Mock Fallbacks**: Front-end service methods include fallback mock generators to support offline component testing and Vitest unit suites without requiring a live Go backend.

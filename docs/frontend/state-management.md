# Kirmya Frontend State Management Architecture

## Core Architectural Principles

1. **Decoupled State Tiers**: Server state (query data) is strictly separated from local component UI state. Components subscribe to custom feature hooks (`useSecurity`, `useNotifications`, `useCommunity`) rather than storing global raw API responses in monolithic stores.
2. **Cross-Tab Authentication Sync**: Uses `BroadcastChannel('kirmya_auth_channel')` to broadcast login and logout events across active browser tabs. Logging out in one tab instantly purges user state in all sibling tabs.
3. **Race Condition Protection**: Asynchronous data requests utilize cancellation tokens (`AbortController`) to automatically abort stale inflight network requests when query parameters or routes change rapidly.

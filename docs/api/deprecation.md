# Kirmya Endpoint Deprecation Timeline & Notice Protocol

## Deprecation Standard Operating Procedure

1. **Step 1: Code Marking**: Annotate handler with `@Deprecated` and emit HTTP headers `Deprecation: @<timestamp>` and `Sunset: <date>`.
2. **Step 2: Client Migration Notice**: Notify affected SDK callers via developer log alerts.
3. **Step 3: Traffic Sunset**: Decommission endpoint after 180 days.

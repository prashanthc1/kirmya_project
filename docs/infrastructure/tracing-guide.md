# Kirmya Distributed Tracing & Span Lifecycle Manual

## 1. End-to-End Distributed Tracing
- **Trace Context Propagation**: Propagates `traceparent` headers through Next.js frontend, Gin middleware, PostgreSQL queries, and NATS event subscribers.
- **Database Span Instrumentation**: Automatic SQL query duration tracing with parameterized query masking.
- **Async Job Tracing**: Background consumer jobs preserve origin trace IDs to maintain unbroken end-to-end request visibility.

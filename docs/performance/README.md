# Kirmya Performance Engineering & Capacity Planning Hub

Welcome to the Performance Engineering, Database Optimization, Caching Strategy, Load Testing, and Capacity Planning documentation for Kirmya.

## Documentation Index

- [`performance-audit.md`](performance-audit.md): Performance audit findings, SLO latency baselines, and `pgxpool` connection settings.
- [`performance-baselines.md`](performance-baselines.md): Latency SLO targets (P50/P95/P99), error budgets, and frontend Core Web Vitals.
- [`database-optimization.md`](database-optimization.md): N+1 query elimination, explicit column selection, and index catalog.
- [`caching.md`](caching.md): Redis caching strategy, single-flight stampede protection, and DB fallback.
- [`search-optimization.md`](search-optimization.md): OpenSearch query optimization and resilient PostgreSQL fallback.
- [`worker-optimization.md`](worker-optimization.md): Bounded worker concurrency, micro-batching, and DLQ diversion.
- [`scalability.md`](scalability.md): Stateless API architecture, horizontal scaling triggers, and connection draining.
- [`api-performance.md`](api-performance.md): HTTP compression, cursor pagination, and middleware cost control.
- [`frontend-performance.md`](frontend-performance.md): Next.js App Router lazy loading, MUI v6 memoization, and Core Web Vitals targets.
- [`load-testing.md`](load-testing.md): k6 load testing profiles, synthetic account rules, and regression gating.
- [`capacity-planning.md`](capacity-planning.md): Resource scaling projections (10K to 1M users) and HPA triggers.
- [`performance-runbooks.md`](performance-runbooks.md): Performance incident runbooks for DB pool saturation, Redis memory, and OpenSearch degradation.

## Admin Performance UI

- Performance Overview Dashboard: `/admin/performance`
- Slow APIs Studio: `/admin/performance/apis`
- Database Query Performance: `/admin/performance/database`
- Cache Hit Ratio Desk: `/admin/performance/cache`
- Worker Queue Performance: `/admin/performance/workers`

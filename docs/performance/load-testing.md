# Kirmya Load Testing & Performance Regression Prevention

## 1. Load Test Workload Profiles
- **Profile 1: Read-Heavy Traffic (80% Search / 20% Writes)**: Simulates 10,000 concurrent users searching jobs, viewing candidate profiles, and reading community posts.
- **Profile 2: Peak Application Submissions**: Simulates 1,000 recruiters screening candidates while 2,000 candidates submit job applications simultaneously.

---

## 2. Testing Methodology & Environments
- **Synthetic Accounts**: Load tests execute exclusively using synthetic test user accounts in staging environments. Production user data is NEVER subjected to automated load test traffic.
- **Performance Regression Gating**: Automated k6 scripts run in staging CI pipelines, failing builds if p95 latency regresses by > 15%.

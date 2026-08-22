# Kirmya Production Release Process & Lifecycle

## Lifecycle Phases

1. **Pull Request Quality Gate**: All code modifications submit PRs against `main`. GitHub Actions runs backend tests (`go test ./...`), frontend tests (`npx vitest run`), TypeScript compilation, OpenAPI validation, and Trivy security scanning.
2. **Staging Promotion**: Merges to `main` trigger automated container image compilation tagged with Git SHA and deployment to the Staging environment.
3. **Release Readiness Verification**: Staging smoke tests, migration checks, and performance benchmarks execute automatically.
4. **Production Sign-Off & Deployment**: Authorized SRE / Engineering leads approve production rollout via GitHub Environment protection. Blue-green deployment shifts live user traffic to new nodes.
5. **Post-Deployment Observation Window**: 15-minute telemetry monitoring period validating HTTP 5xx error rates, P95 latencies, and system health status.

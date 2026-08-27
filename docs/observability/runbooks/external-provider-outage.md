# SRE Runbook: External Dependency Outage (Email & AI Providers)

## 1. Provider Outage Triage
1. Check external provider status pages (AWS SES, Resend, OpenAI/Anthropic).
2. Review HTTP timeout metrics and circuit breaker trip states in Grafana.
3. Verify that non-critical external failures do not block core HTTP request completion.

---

## 2. Mitigation Steps
1. Switch primary email provider to secondary backup provider via configuration.
2. Enable graceful fallback for AI features (e.g. return heuristic rule-based suggestions instead of failing).
3. Drain pending notifications to background retry queues.

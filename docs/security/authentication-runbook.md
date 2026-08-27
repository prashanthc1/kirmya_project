# SRE Runbook: Authentication Incident Triage & Credential Attack Response

## 1. Credential Stuffing & Brute-Force Triage
1. Inspect 401/429 authentication failure metrics in Grafana (`http_requests_total{handler="Login",status="401"}`).
2. Verify Redis token bucket counters for affected IP addresses or user accounts.
3. If an automated attack is detected, enforce progressive CAPTCHA or temporary IP lockout.
4. Notify affected users with suspicious login alert email.

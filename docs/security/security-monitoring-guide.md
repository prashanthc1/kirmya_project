# Kirmya Security Operations, Threat Telemetry & SIEM Integration Manual

## 1. Security Event Monitoring & Alerting
- **Real-Time Threat Telemetry**: Emits structured security events for brute-force logins, credential stuffing, and unauthorized IDOR attempts.
- **Automated Lockdown Triggers**: 5 consecutive failed login attempts trigger a 15-minute temporary IP and account-level cooldown.
- **SIEM & Audit Shipping**: Security audit streams are forwarded to centralized logging clusters for continuous compliance monitoring.

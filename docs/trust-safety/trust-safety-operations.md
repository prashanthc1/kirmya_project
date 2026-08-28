# SRE Operations Guide: Trust & Safety Incident & Surge Triage

## 1. Handling Abuse Surges & Automated Attacks
1. **Spam Surge Response**: Lower per-minute connection request and message dispatch thresholds via Admin Settings.
2. **Fake Job Campaign Quarantine**: Execute automated SQL containment to quarantine unverified jobs matching campaign signatures.
3. **Mass Impersonation Sweep**: Run recruiter domain verification audits across registered employer accounts.

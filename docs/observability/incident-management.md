# Kirmya SRE Incident Management & Escalation Workflow

## 1. Incident Lifecycle Phases
1. **Detection**: Automated alert fires in PagerDuty / Grafana.
2. **Triage & Command**: Incident Commander (IC) assigned; severity classified (SEV-1 to SEV-3).
3. **Mitigation**: Traffic drained, feature flags toggled, or rollback triggered.
4. **Resolution**: Verification of healthy SLO recovery for at least 15 consecutive minutes.
5. **Post-Incident Review**: Blameless postmortem published within 48 hours.

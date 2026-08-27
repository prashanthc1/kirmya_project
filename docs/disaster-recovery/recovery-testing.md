# Kirmya Automated Recovery Testing & Readiness Scoring

## 1. Automated Recovery Drills
- Executed monthly in isolated staging environments.
- Measures actual RPO (time gap between last backup and failure point) and RTO (time elapsed until smoke tests pass).
- Automatically updates recovery readiness score on `/admin/disaster-recovery/readiness`.

---

## 2. Readiness Score Formula
$$\text{Readiness Score} = 0.30 \times \text{Backup Freshness} + 0.30 \times \text{Verification Status} + 0.20 \times \text{Offsite Sync} + 0.20 \times \text{Drill Success}$$

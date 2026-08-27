# Kirmya Business Continuity Plan (BCP) & Crisis Operations

## 1. Crisis Operational Sequence
In the event of a catastrophic infrastructure or regional outage:
1. **Activate DR Command**: Incident Commander convenes emergency operations bridge.
2. **Prioritize Core Services**: Restore User Authentication, Profile Retrieval, and Job Application pipelines before secondary features.
3. **Engage Degraded Modes**: Route search queries through PostgreSQL fallback; queue non-critical notifications in Dead-Letter Queues.

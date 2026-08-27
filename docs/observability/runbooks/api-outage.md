# SRE Runbook: API Outage & Service Degradation

## 1. Initial Assessment
1. Inspect Grafana API dashboard to identify affected routes and status code breakdown (500 vs 503 vs 504).
2. Check backend container memory and CPU limits.
3. Review recent deployment releases or configuration changes.

---

## 2. Mitigation Steps
1. If container is out-of-memory (OOM), trigger horizontal scaling or restart instance.
2. If downstream database is unresponsive, inspect PostgreSQL connection pool depth.
3. If recent commit introduced regression, initiate one-click rollback.

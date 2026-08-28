# Kirmya Technical Debt & Continuous Improvement Log

## 1. Technical Debt Classification & Maintenance Roadmap
| Area | Severity | Description | Mitigation Strategy |
| :--- | :---: | :--- | :--- |
| **Materialized Views** | Low | Heavy aggregate analytical reporting can use continuous materialized views during 1M+ active user scaling. | Implement PostgreSQL `pg_cron` automated refresh jobs. |
| **OpenSearch Clustering** | Low | Standalone development cluster to be expanded to multi-AZ index shards in production Kubernetes. | Configure production Helm values with cross-AZ affinity. |
| **Push Webhook Providers**| Low | Mobile APNs and FCM gateway integrations ready for multi-tenant worker dispatch. | Maintain modular provider abstractions. |

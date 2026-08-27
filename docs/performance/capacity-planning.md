# Kirmya Capacity Planning & Resource Scaling Model

## Capacity Scale Projections

| User Tier | API Replica Count | PostgreSQL DB Spec | Redis Cache Memory | OpenSearch Cluster |
| :--- | :--- | :--- | :--- | :--- |
| **10K Users** | 2 Container Pods | 4 vCPU / 16GB RAM | 4GB Memory | 2 Data Nodes |
| **100K Users**| 6 Container Pods | 16 vCPU / 64GB RAM | 16GB Memory | 4 Data Nodes |
| **1M Users**  | 20 Container Pods | 64 vCPU / 256GB RAM | 64GB Cluster | 8 Data Nodes |

---

## Autoscaling Triggers
- **Horizontal Pod Autoscaler (HPA)**: Scales API replicas when CPU utilization exceeds `70%` or HTTP p95 latency exceeds `250ms` over a 3-minute window.

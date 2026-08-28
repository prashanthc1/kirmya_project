# Kirmya OpenSearch Cluster Configuration & Index Mappings Guide

## 1. OpenSearch Index Architecture
- **Logical Indices**: Dedicated indices for `kirmya_jobs`, `kirmya_users`, `kirmya_organizations`, `kirmya_communities`, and `kirmya_learning`.
- **Edge-Ngram Analyzers**: Sub-word tokenizers enabling instant prefix autocomplete for skill names and company brands.
- **Cluster Sharding & Replication**: Distributed index partitions designed for low-latency retrieval across high query concurrency.

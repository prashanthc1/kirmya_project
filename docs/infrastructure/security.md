# Kirmya Infrastructure Security & Container Hardening

## Executive Summary
This document defines container security hardening standards, Linux capability drops, network segmentation, non-root execution policies, and secret injection protocols for Kirmya's production Docker containers.

---

## 1. Container Hardening Standards

```
                       Production Container Runtime
                                    │
                                    ▼
           Non-Root Execution (`USER kirmya`, UID 10001)
                                    │
                                    ▼
           Read-Only Root Filesystem + Disposable `/tmp` Mount
                                    │
                                    ▼
           Linux Capability Drop (`CAP_DROP_ALL` + `CAP_NET_BIND_SERVICE`)
                                    │
                                    ▼
           Runtime Secret Injection (Environment Secret Manager / Vault)
```

| Security Boundary | Control Mechanism | Verification Target |
| :--- | :--- | :--- |
| **Non-Root Execution** | `USER kirmya:kirmya` in Dockerfiles | Prevent container escape privilege escalation |
| **Filesystem Hardening**| Read-only root filesystem (`read_only: true`) | Block malicious runtime script creation |
| **Network Boundaries** | Private Docker Networks (`kirmya_internal_net`) | Isolate PostgreSQL, Redis, NATS & OpenSearch |
| **Secrets Protection** | Memory-injected runtime environment variables | Zero secrets in Docker layers or git logs |

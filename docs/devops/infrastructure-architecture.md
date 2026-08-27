# Kirmya Cloud Infrastructure Architecture & Hosting Topology

## Executive Summary
This document details the multi-tier production infrastructure topology, container deployment patterns, network boundaries, edge routing (Cloudflare CDN/DNS), and scaling limits across Kirmya.

---

## 1. Multi-Tier Production Topology

```
                                  End Users / Web & Mobile
                                             │
                                   Cloudflare Edge Network
                         (DDoS Protection, Global CDN, SSL/TLS)
                                             │
                        ┌────────────────────┴────────────────────┐
                        │                                         │
                        ▼                                         ▼
            Vercel Edge Platform / Next.js             Railway Production Cluster
            - Static Asset Caching (CDN)               - Gin REST API Backend
            - SSR & Route Rendering                    - NATS Background Workers
            - Edge Security Headers                   - Non-Root Docker Runtime
                                                                  │
                                            ┌─────────────────────┼─────────────────────┐
                                            ▼                     ▼                     ▼
                                   PostgreSQL (pgxpool)        Redis Cache         NATS JetStream
                                   (Managed HA Instance)    (Cluster Instance)   (Message Durability)
```

# Kirmya Zero-Downtime Cloud Deployment Guide

## 1. Railway & Vercel Deployment Workflows
- **Frontend**: Automated continuous deployment via Vercel GitHub integration targeting `main` branch.
- **Backend API**: Automated container deployment on Railway with rolling update strategy and 30-second graceful connection draining (`SIGTERM`).

---

## 2. Cloudflare CDN & Edge WAF Configuration
- SSL/TLS: Full (Strict) mode with HSTS enabled (max-age=31536000, includeSubDomains, preload).
- Edge Caching: Caches static JS/CSS bundles and assets; bypasses cache for all `/api/v1/*` requests.

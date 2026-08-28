# Kirmya Security Baseline & Hardening Standards

## 1. Environment Security Baselines
- **Transport Security**: Mandatory TLS 1.3 encryption with strict HTTP Strict Transport Security (HSTS) headers (`max-age=31536000; includeSubDomains; preload`).
- **Content Security Policy (CSP)**: Nonce-based script execution with strict restriction on object embeds and frame ancestry (`frame-ancestors 'none'`).
- **Zero-Trust Network Perimeter**: Direct database and Redis connections are blocked from public ingress; accessible only via internal VPC network bridges.

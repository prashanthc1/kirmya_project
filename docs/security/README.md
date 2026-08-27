# Kirmya Security Engineering & Application Hardening Documentation Hub

Welcome to the Security Hardening, Threat Modeling, Cryptographic Standards, and Penetration Testing Readiness documentation for Kirmya.

## Documentation Index

- [`security-audit.md`](security-audit.md): Comprehensive security audit and OWASP Top 10 defense matrix.
- [`threat-model.md`](threat-model.md): STRIDE threat model, attack surface map, and mitigation catalog.
- [`security-architecture.md`](security-architecture.md): Defense-in-depth architecture, trust boundaries, and encryption standards.
- [`authentication-security.md`](authentication-security.md): Adaptive password hashing, TOTP MFA, and progressive lockout throttles.
- [`authorization-security.md`](authorization-security.md): Server-authoritative RBAC, ABAC resource ownership, and tenant boundary isolation.
- [`security-hardening.md`](security-hardening.md): Container hardening, non-root execution, and security headers.
- [`api-security.md`](api-security.md): Threat protection, error response normalization, and IDOR prevention.
- [`data-protection.md`](data-protection.md): TLS 1.3, AES-256 at rest, and PII log redaction.
- [`file-security.md`](file-security.md): Magic byte verification, sandboxed UUID storage, and signed download URLs.
- [`ai-security.md`](ai-security.md): Prompt injection defenses, XML context fencing, and output schema validation.
- [`supply-chain-security.md`](supply-chain-security.md): Automated `govulncheck`, `npm audit`, and dependency pinning.
- [`container-security.md`](container-security.md): Non-root execution (`appuser` UID 10001), capability dropping, and Trivy scans.
- [`pentest-scope.md`](pentest-scope.md): In-scope penetration testing targets, rules of engagement, and validation criteria.
- [`incident-response.md`](incident-response.md): Severity classification (SEV-1 to SEV-3) and blameless RCA templates.
- [`vulnerability-management.md`](vulnerability-management.md): Vulnerability triage, severity SLAs, and remediation verification.

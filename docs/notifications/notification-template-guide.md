# Kirmya Notification Templates & Localization Guide

## 1. Notification Template Architecture
- **Multi-Channel Templates**: Centralized templates supporting In-App alerts, HTML emails, and plain-text summaries from unified data contracts.
- **XSS & Injection Defenses**: Dynamic payload variables are HTML-escaped and strictly validated before rendering.
- **Localization Readiness**: Template string tokens structured with standardized translation keys for future multi-lingual deployment.

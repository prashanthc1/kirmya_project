# Kirmya Transactional Email & Template System Guide

## 1. Transactional Email Standards
- **Branded Templates**: Semantic HTML & plain-text fallbacks with responsive typography and high-contrast styling.
- **Security Protocols**: Sensitive tokens use short expiry (15m for password reset, 24h for email verification); raw passwords or session tokens are never emailed.
- **Deliverability Headers**: Automatic injection of SPF, DKIM, DMARC, and `List-Unsubscribe` headers.

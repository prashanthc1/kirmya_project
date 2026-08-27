# Kirmya Transactional Email Delivery & Template Manual

## 1. Modular Template Architecture
- **Responsive HTML Templates**: Styled with clean branding and tested across desktop and mobile email clients.
- **Strict Security Hygiene**: Passwords, session tokens, and sensitive personal data are never sent via email; password reset and email verification use signed, short-lived tokens.
- **Deliverability Headers**: Enforces SPF, DKIM, DMARC alignment and automated `List-Unsubscribe` headers.

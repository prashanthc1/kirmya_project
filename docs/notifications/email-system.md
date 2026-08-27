# Kirmya Email Notification Infrastructure & Templates

## 1. Transactional Email Pipeline
- **Provider Abstraction**: Go `mailer.Provider` interface decoupling SMTP, SES, and local mock transports.
- **Template Engine**: Go `html/template` with strict HTML escaping and BlueMonday sanitization for user-generated strings.
- **Anti-Spam Rate Limits**: Bounded to a maximum of 10 emails per hour per user account for non-security categories.

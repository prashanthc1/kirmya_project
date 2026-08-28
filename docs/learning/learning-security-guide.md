# Kirmya Learning Platform Security, Integrity & Anti-Abuse Manual

## 1. Security Safeguards & Integrity Enforcement
- **IDOR Protection**: All progress, assessment submissions, and certificate issuance endpoints validate `user_id` in verified JWT context.
- **Certificate Forgery Defenses**: Public certificate verification endpoints check against immutable database records to prevent counterfeit credentials.
- **Resource URL Sanitization**: External tutorial links and learning resources are scanned for phishing patterns and malicious redirects.

# Kirmya Transactional Email System & Delivery Guide

## 1. Transactional Email Infrastructure
- **Template System**: Standardized HTML and plain-text templates with responsive formatting and sanitized variable interpolation.
- **Security Communications**: Critical authentication and security alerts (Password Reset, Email Verification, New Device Login) are dispatched with highest priority.
- **Zero Provider Secret Leakage**: SMTP/SendGrid/SES credentials remain strictly server-side and are never exposed via APIs or client bundles.

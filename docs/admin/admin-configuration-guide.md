# Kirmya Platform Dynamic Configuration Management Guide

## 1. Centralized Platform Configuration
- **Non-Secret Configuration**: Runtime adjustments for pagination limits, token bucket rate limits, notification batch sizes, and timeout ceilings.
- **Strict Secret Segregation**: Cryptographic keys, SMTP credentials, and database passwords remain strictly in environment variables and are excluded from configuration APIs.
- **Validation Rules**: Configuration schemas are strictly validated before committing changes to persistent stores.

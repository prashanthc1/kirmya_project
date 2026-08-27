# Kirmya Authentication Security, Token Handling & Brute-Force Throttles

## 1. Authentication Security Standards
- **Adaptive Password Hashing**: Bcrypt with cost factor 12.
- **Session Tokens**: 256-bit cryptographically secure random session tokens stored in HttpOnly, Secure, SameSite=Strict cookies.
- **Progressive Throttling**: Exponential backoff delays and temporary IP lockouts after 5 consecutive failed login attempts.
- **Single-Use Verification**: Email verification and password reset tokens expire in 15 minutes and self-destruct upon redemption.

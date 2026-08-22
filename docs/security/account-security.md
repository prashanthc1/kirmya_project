# Kirmya Account Security & Threat Detection

## Risk Scoring & Brute-Force Controls

1. **Brute-Force Counter**: Tracks failed login attempts per IP and per account in Redis. 5 consecutive failures trigger a temporary 15-minute login restriction.
2. **Account Risk Engine (0-100 Score)**:
   - Evaluates device trust status, IP velocity, and login failure frequency.
   - Scores above `70` trigger stepped-up security (MFA code re-validation).
3. **Security Event Notifications**: Email and in-app security alerts sent for new logins from untrusted devices, password updates, and session revocations.

# Kirmya Authentication Threat Model & Mitigations

## Threat Matrix & Security Controls

| Threat Scenario | Potential Attack Vector | Applied Platform Defense |
| :--- | :--- | :--- |
| **Credential Stuffing** | Automated login bursts with leaked password lists | Rate limiting + generic error responses + risk scoring |
| **Session Hijacking** | Intercepting session cookies or tokens | HttpOnly, Secure, SameSite=Strict cookies + short JWT TTL |
| **Refresh Token Replay**| Reusing stolen refresh token | Refresh token rotation + instant session family revocation |
| **Account Enumeration** | Brute-forcing signup/reset endpoints to discover users | Generic API responses (`HTTP 200` regardless of email presence) |
| **IDOR Resource Access** | Altering resource ID in API request | Service-layer ownership verification (`UserID == OwnerID`) |

# Kirmya Password Reset & Session Revocation Protocol

## 1. Password Reset Flow
1. **Initiation**: User requests password reset at `/auth/forgot-password`. API returns generic success response.
2. **Token Delivery**: Single-use signed token sent to verified user email address (expires in 15 minutes).
3. **Consumption & Reset**: Password update requires valid token + new password meeting policy rules.
4. **Automated Session Revocation**: Upon successful password reset, all active user sessions across all devices are immediately terminated.

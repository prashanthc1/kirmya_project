# Kirmya Authentication & Identity Architecture

## Core Identity Principles

1. **Decoupled Identity & Profile**: User authentication attributes (`id`, `email`, `password_hash`, `mfa_enabled`) exist in core auth tables (`users`), completely decoupled from presentation profile attributes (`profiles`). Profile updates cannot mutate authentication identity.
2. **Session Fixation Prevention**: Successful user authentication invalidates pre-login unauthenticated session contexts and issues a fresh session identifier with new cryptographic JWT tokens.
3. **MFA Enforcement**: When TOTP Multi-Factor Authentication is enabled, initial password validation yields a temporary `mfa_pending` ticket. Access tokens are granted only after valid TOTP code verification.

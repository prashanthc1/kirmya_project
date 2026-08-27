# Kirmya Security Incident Response Runbooks

## Incident Playbooks

### Playbook 1: Account Takeover / Credential Stuffing
1. Revoke all active sessions for targeted accounts (`DELETE /api/v1/security/sessions`).
2. Trigger mandatory password reset and invalidate current refresh tokens.
3. Enable IP-level progressive rate limiting on `/api/v1/auth/login`.

### Playbook 2: Secret / API Key Exposure
1. Instantly rotate compromised secret key in secret manager / environment.
2. Invalidate active JWTs signed with exposed key.
3. Audit append-only security logs for unauthorized API operations executed during exposure window.

### Playbook 3: Malicious File Upload Attempt
1. Purge uploaded file from S3 / quarantine storage.
2. Ban uploader user ID and restrict account permissions.
3. Review mime-type validation rules and ClamAV scanning logs.

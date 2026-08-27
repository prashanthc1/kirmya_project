# Kirmya Account Enforcement & Sanction Operations

## 1. Transactional State Modifications
All enforcement actions execute inside database transactions:
1. Update user account status (`status = 'restricted' | 'suspended' | 'banned'`).
2. Revoke active JWT refresh tokens and Redis session keys.
3. Remove user profile from OpenSearch discovery indexes.
4. Record immutable audit log entry (`admin_id`, `target_user_id`, `action`, `reason`, `timestamp`).
5. Dispatch automated notification with appeal instructions.

# Kirmya Browser Storage & Data Privacy Standards

## Browser Storage Key Inventory

| Storage Key | Storage Type | Data Stored | Privacy Classification | Expiration Policy |
| :--- | :--- | :--- | :--- | :--- |
| `kirmya_theme_mode` | `localStorage` | Theme preference (`'light'` \| `'dark'`) | Public / Non-sensitive | Persistent until user toggles |
| `kirmya_sidebar_collapsed` | `localStorage` | Navigation UI state (`boolean`) | Public / Non-sensitive | Persistent |
| `kirmya_cookie_consent` | `localStorage` | Cookie banner preference (`boolean`) | Public / Non-sensitive | 365 Days |

## Strictly Prohibited Items in Storage
- Passwords, authentication credentials, or MFA TOTP secrets.
- Bearer JWT tokens (handled via HttpOnly secure cookies).
- Private messaging text or attachment contents.
- User DSAR data export ZIP bundles.

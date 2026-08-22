# Kirmya Networking Privacy & Search Visibility Controls

## 1. Search Index Exclusions
- **Non-Searchable Profiles**: Users opting out of public discovery (`searchable: false`) are excluded from OpenSearch and PostgreSQL search indexes.
- **Deactivated / Deleted Accounts**: Deactivated or deleted user accounts are purged from search indexes instantly via NATS event listeners.
- **Block Relationships**: Users with active bidirectional block relationships are excluded from each other's search results, suggestions, and recommendation feeds.

---

## 2. Sensitive Attribute Protection
Search indexing and DTO serialization explicitly strip:
- Email addresses, phone numbers, and home addresses.
- Passwords and authentication secrets.
- Private career preferences and job search status.

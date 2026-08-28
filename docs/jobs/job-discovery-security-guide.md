# Kirmya Job Discovery Security, Privacy & Anti-Scraping Manual

## 1. Security Safeguards & Privacy Boundaries
- **Draft & Expired Job Shielding**: Search queries enforce `WHERE status = 'published' AND is_active = true`, ensuring internal drafts and expired listings never leak into search.
- **Candidate Privacy Isolation**: Recruiter searches cannot inspect candidate query history or personal job bookmark lists.
- **Anti-Scraping Defenses**: IP and session-based sliding-window rate limits block automated crawler harvesting while preserving search performance for legitimate users.

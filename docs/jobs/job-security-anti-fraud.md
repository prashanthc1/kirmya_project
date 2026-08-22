# Kirmya Job Security, Anti-Fraud & Anti-Spam Defenses

## Anti-Abuse & Fraud Safeguards

1. **Job Posting Rate Limiting**: Recruiters are limited to creating/publishing up to 10 jobs per hour to prevent mass spamming or fake job posting campaigns.
2. **Duplicate Job Detection**: Computes SHA-256 content hashes on job title + organization ID + description to block duplicate spam postings.
3. **Job Reporting Desk**: Candidates can report suspicious postings for **Scam/Fraud**, **Discrimination**, **Misleading Pay**, or **Spam**, triggering Trust & Safety review.
4. **Mass Assignment Shielding**: Client-submitted payloads cannot alter `status`, `organization_id`, `recruiter_id`, or `moderation_flag` attributes directly.

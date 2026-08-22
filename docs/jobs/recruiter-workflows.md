# Kirmya Recruiter Workflows & Management Console

## 1. Recruiter Job Dashboard (`/recruiter/jobs`)
- Provides tabbed management across **Drafts**, **Published**, **Paused**, **Closed**, and **Archived** jobs.
- Displays applicant counts, application conversion rates, and quick status toggle actions.

---

## 2. Rich Text HTML Sanitization
- Job descriptions submitted by recruiters are sanitized using `bluemonday.UGCPolicy()` to strip malicious script tags (`<script>`), inline event listeners (`onerror`, `onload`), and unauthorized external redirects (`javascript:` protocols).

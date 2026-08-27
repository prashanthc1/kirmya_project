# Kirmya Security & Negative Access Control Testing

## 1. Automated Security Regression Scenarios
- **IDOR Probing**: Validates that User A cannot retrieve or mutate User B's profile, private resumes, applications, or interviews by substituting IDs.
- **Cross-Organization Shielding**: Validates that Recruiter from Org X receives 403 Forbidden when requesting candidate scorecards from Org Y.
- **SQL Injection & XSS Payloads**: Asserts that malicious strings (`' OR 1=1 --`, `<script>alert(1)</script>`) are safely escaped and parameterized without execution.

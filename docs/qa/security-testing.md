# Kirmya Automated Security & Negative Authorization Testing

## 1. Automated Attack Scenarios Tested
- **IDOR Probing**: Asserting 403/404 when candidate A requests application or interview notes belonging to candidate B.
- **Cross-Organization Isolation**: Asserting 403 Forbidden when recruiter from Org A accesses jobs or candidate data belonging to Org B.
- **Injection Resilience**: Parameterized SQL queries tested with SQL injection and XSS fuzz payloads.

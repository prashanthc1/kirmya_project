# Kirmya End-to-End (E2E) Testing Architecture & Workflows

## 1. Playwright / Vitest E2E Test Suite
- **Isolated Environment**: E2E test runs execute against a dedicated staging stack (`frontend:3000`, `backend:8080`, isolated PostgreSQL database).
- **Synthetic Test Accounts**: Tests run exclusively using pre-seeded synthetic test user accounts (`test_candidate@kirmya.internal`, `test_recruiter@kirmya.internal`). Real user data is never modified.

---

## 2. Critical Path E2E Scenarios
1. **Candidate Job Application Flow**: Login ──► Search Jobs ──► Open Job ──► Submit Application with Resume ──► View Application Status in `/applications`.
2. **Recruiter ATS Screening Flow**: Recruiter Login ──► Navigate `/recruiter/applications` ──► Open Applicant ──► Shortlist Candidate ──► Verify Status Update.
3. **Networking Connection Flow**: Search User B ──► Send Connection Request ──► User B Log in & Accept ──► Verify Connected Badge.

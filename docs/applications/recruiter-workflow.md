# Kirmya Recruiter ATS Workflows & Bulk Operations

## 1. ATS Dashboard & Kanban Desk (`/recruiter/applications`)
- Renders an interactive MUI v6 Kanban board and table view categorized by hiring stages (**Applied**, **Under Review**, **Shortlisted**, **Interview**, **Offer**, **Hired**, **Rejected**).
- Supports candidate filtering by name, skills, experience, location, and job title.

---

## 2. Bulk Action Processing (`POST /api/v1/applications/bulk-status`)
- Allows authorized recruiters to batch shortlist or reject candidates (maximum batch size: 50 candidates).
- Executes atomic transaction verifying recruiter ownership for every target candidate application.

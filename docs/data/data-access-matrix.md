# Kirmya Data Access Matrix & Domain Governance

## 1. Domain Access Authorization Matrix

| Data Domain | Candidate User | Hiring Recruiter | Org Admin | Community Moderator | Platform Super Admin |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Profile & Skills** | Full CRUD (Own) | Read (Public/Conn)| Read (Public) | Read (Public) | Read / Suspend |
| **Job Postings** | Read (Published) | Full CRUD (Own Org)| Full CRUD (Own Org)| Read (Public) | Full CRUD / Moderate |
| **Applications & ATS** | Read/Submit (Own)| Full Review (Own Org)| Full Review (Own Org)| No Access | Audited Read |
| **Direct Messages** | Full (Participant)| Full (Participant)| No Access | No Access | Restricted (T&S Escalation) |
| **Audit Logs & Security**| Read (Own Events)| No Access | Read (Org Events)| No Access | Full Audit Read |

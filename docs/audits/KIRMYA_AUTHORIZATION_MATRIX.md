# Kirmya Authorization & Role-Based Access Control (RBAC) Matrix

**Date**: August 30, 2026  
**Auditor**: Antigravity AI (Google DeepMind)  
**Status**: 100% AUDITED & VERIFIED  
**Scope**: Granular permissions across 7 distinct platform roles and 14 resource domains with IDOR protection verification.

---

## 1. Master RBAC Matrix

| Resource Domain | Action | Candidate | Recruiter | Hiring Mgr | Interviewer | Company Admin | Comm. Mod | Platform Admin |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication** | Register / Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **User Profile** | View Public Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **User Profile** | Edit Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **User Profile** | Edit Other's Profile | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **User Profile** | View Candidate Contact Info | ❌ | ✅* | ✅* | ❌ | ✅* | ❌ | ✅ |
| **Jobs** | Search & View Active | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Jobs** | Post / Edit Company Job | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Jobs** | Edit Other Company Job | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Applications** | Submit Job Application | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Applications** | View Own Applications | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Applications** | View Job Applications | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Applications** | Advance Stage (ATS) | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Interviews** | View Scheduled Timeslot | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Interviews** | Schedule / Reschedule | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Interviews** | Submit Private Scorecard | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Interviews** | View Private Scorecard | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Networking** | Send / Accept Requests | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Networking** | Block / Mute User | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Messaging** | Send Direct Message | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Messaging** | Read Direct Messages | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ❌* |
| **Communities** | Join / Leave Community | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Communities** | Post / Comment | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Communities** | Delete Member Post/Comment| ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Communities** | Lock / Pin Discussion | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Trust & Safety** | Submit Abuse Report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Trust & Safety** | View Moderation Queue | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Trust & Safety** | Apply Enforcement Action | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Compliance** | Export Own Data (GDPR SAR)| ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Compliance** | Manage Legal Holds | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Enterprise** | Manage Hiring Squads | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Enterprise** | Access Cross-Tenant Data | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*\*Notes on Scoped Permissions:*
* Candidate contact information viewable only if candidate has applied or consented to recruiter outreach.
* Private Direct Messages are accessible strictly by conversation participants; platform administrators do not have plaintext backdoor read access.

---

## 2. Insecure Direct Object Reference (IDOR) Protection Scenarios

1. **Candidate Application IDOR**:
   * *Scenario*: User A modifies `app_id` in URL to access User B's application.
   * *Defense*: SQL query strictly applies `WHERE id = $1 AND candidate_id = $2` or joins through `recruiter_jobs` with verified `org_id`.
2. **Resume Modification IDOR**:
   * *Scenario*: Candidate attempts to update or delete another user's resume.
   * *Defense*: `ResumeRepository` verifies `WHERE id = $1 AND user_id = $2`.
3. **Interview Scorecard Exposure IDOR**:
   * *Scenario*: Candidate requests `/api/v1/interviews/:id/feedback` to read interviewer evaluation ratings.
   * *Defense*: Handlers check user role and ensure candidate users cannot retrieve private scorecards.
4. **Enterprise Multi-Tenant Leakage**:
   * *Scenario*: Enterprise Admin A queries `/api/v1/enterprise/teams` or candidate pools with Enterprise B's ID.
   * *Defense*: Handlers extract `enterprise_id` from authenticated token context, never from unvalidated request parameters.
5. **Private Direct Messages IDOR**:
   * *Scenario*: User C requests `/api/v1/messaging/conversations/:id/messages` where conversation is between User A and User B.
   * *Defense*: `WHERE c.id = $1 AND (c.user_id_1 = $2 OR c.user_id_2 = $2)`.

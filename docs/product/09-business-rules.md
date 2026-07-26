# Business Rules & Governance Policy: Kirmya Professional Ecosystem
**Document Identifier:** PL-PD-009 | **Status:** Draft / Pending Approval | **Version:** 1.0.0  
**Authors:** Antigravity AI & Compliance & Legal Operations | **Date:** July 19, 2026

---

## Document Control & Meta-Information

### Version History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| `0.1.0` | 2026-07-19 | Antigravity AI | Initial draft mapping governance and operational limits. |
| `1.0.0` | 2026-07-19 | Antigravity AI | Completed full Business Rules document detailing verification thresholds, job boundaries, and suspension/appeals protocols. |

---

## 1. Executive Summary

This document establishes the official **Business Rules and Governance Policies** for the **Kirmya Professional Ecosystem**. These rules define the boundaries of authority, verification criteria, posting limitations, moderation rules, and compliance standards for all users (candidates, recruiters, clients, and moderators). All software validation logical constraints, database permission trees, and administrative operations must align with the policies detailed herein.

---

## 2. Platform Entity Business Rules

### 2.1 Company Management Rules

#### Rule 2.1.1: Company Page Creation
* **Policy**: Company brand pages can only be created by users who:
  - Register using a verified, unique enterprise email domain (e.g. `name@enterprise.com`, not generic domains like Gmail or Outlook).
  - Authenticate using their corporate Single Sign-On (SSO) if their organization has pre-configured integration keys.
* **Logic Check**: Standard candidate profiles are blocked from creating company entities unless they submit a corporate account request form.

#### Rule 2.1.2: Company Verification Threshold
* **Policy**: A company page remains in a "Pending / Unverified" state until it passes the verification audit.
* **Verification Criteria**: Verification requires the submitting HR Manager or Company Admin to upload a valid regional **Business Registration Document** (e.g. UAE Trade License, KSA Commercial Registration card).
* **Authority**: Super Administrators (Kirmya Core Team) review and cross-reference uploaded documents against government registries before activating the "Verified" tick badge.

### 2.2 Community (Guild) Governance Rules

#### Rule 2.2.1: Community/Guild Creation
* **Policy**: Standard users cannot create new Guilds. 
* **Control**: Only Super Administrators can provision a new Guild node in the graph database. This prevents platform fragmentation and maintains Kirmya's high-signal design (ensuring only established, recognized professional disciplines have designated Guilds).

#### Rule 2.2.2: Moderator Election & Guild Board Authority
* **Policy**: Guild Moderators are elected by community members. 
* **Eligibility Criteria**: To stand for election as a Guild Moderator, a candidate must:
  - Have a persistent profile in good standing for at least 180 days.
  - Maintain a Decentralized Reputation Score (DRS) greater than **80** in that specific technical/professional discipline.
  - Receive nominations from at least three existing Guild members with a DRS > 70.
* **Term Limits**: Moderator positions undergo re-validation votes every 12 months.

---

## 3. Recruitment & Job Sourcing Rules

### 3.1 Recruiter Sourcing Access

#### Rule 3.1.1: Recruiter Identity Verification
* **Policy**: To access recruiter search dashboards and candidate databases, a user must:
  - Be provisioned by a verified Company Administrator.
  - Link their profile to a verified Company Brand Page.
  - Possess an active B2B Recruiter License seat.
* **Control**: Recruiter accounts that fail to renew their subscription seats are downgraded to read-only Guest status.

#### Rule 3.1.2: Sourcing Match Blind Mode
* **Policy**: Initial candidate sourcing searches must display candidate profiles in "Blind Mode".
* **Control**: Names, photos, ages, gender identifiers, and educational/corporate branding text must be programmatically masked. Recruiter-candidate messaging must remain anonymized until the candidate accepts an interview request, at which point the profile data is revealed.

### 3.2 Job Posting Boundaries

#### Rule 3.2.1: Sourcing-Only Job Listings
* **Policy**: Kirmya does not support text-only, keyword-dependent job descriptions. 
* **Control**: All job postings must map to specific skill ontology nodes and DRS thresholds. postings that fail to link at least three verified capability nodes will be blocked from publication.

#### Rule 3.2.2: Sourcing Frequency Limits (Anti-Spam Cooldown)
* **Policy**: To maintain a high-signal environment, standard recruiter accounts are capped at **5 active job posts** per seat at any time. Toggles for additional posts require upgrade licenses.
* **Cooldown**: Deleted job posts trigger a 48-hour cooldown period before that posting slot can be reused, preventing recruiters from continuously deleting and republishing posts to game search feeds.

---

## 4. Freelancing & Transactional Rules (Future Horizon)

### 4.1 Freelancer Eligibility

#### Rule 4.1.1: Regional Regulatory Verification
* **Policy**: Freelancers bidding on projects must provide proof of legal working compliance in their region.
* **GCC Compliance**: Freelancers located in the UAE must link a verified UAE Freelance Permit. Freelancers in Saudi Arabia must link their National ID/Iqama.
* **System Control**: Freelancers who fail to link verified permits are restricted from submitting project bids.

### 4.2 Escrow & Payment Guarantees

#### Rule 4.2.1: Escrow Funding Mandates
* **Policy**: No freelancer is permitted to begin codebase commits or project deliverables until Kirmya verifies that 100% of the milestone budget is deposited in the secure escrow account.
* **Control**: The system blocks project submission modules until the client’s escrow deposit transaction clears.

#### Rule 4.2.2: Escrow Disintermediation Sanctions
* **Policy**: Any attempt by a freelancer or client to arrange off-platform payments (e.g. sharing direct bank routing numbers in messaging feeds) will result in a warning, and repeat violations will lead to permanent account suspension.
* **Control**: Automated messaging filters flag strings containing IBANs, PayPal tags, or off-platform payment terminology for moderation review.

---

## 5. Content Moderation & Feed Enforcement

### 5.1 Content Guidelines

#### Rule 5.1.1: Value-Marked Feed Requirements
* **Policy**: The Kirmya home feed is reserved for technical designs, code repositories, case studies, and career guides.
* **Action**: If a post is flagged by three unique users as "Low Signal" or "Engagement Bait", the post is automatically hidden from public feeds and routed to the Moderation Queue.
* **Reputation Penalty**: Users whose posts are repeatedly flagged and confirmed as spam will suffer a permanent **10-point deduction** on their DRS.

### 5.2 Peer-Review Integrity

#### Rule 5.2.1: Assessment and Review Fraud
* **Policy**: Attempting to game assessments or falsify peer reviews is strictly prohibited.
* **Action**: Any reviewer found to be rubber-stamping portfolios without performing audits, or any candidate found using AI to complete coding tests, will have their DRS reset to zero and face an immediate suspension pending review.

---

## 6. Account Suspension, Appeals, & Recovery

### 6.1 Suspension Protocol

#### Rule 6.1.1: Tiered Penalties
* **Tier 1: Warning & Feed Restriction (Minor Spam)**: Profile is restricted from posting to feeds or Guild boards for 7 days.
* **Tier 2: Temporary Suspension (Repeated Spam / Escrow Bypass)**: Profile is locked for 30 days. Active job applications and bids are frozen.
* **Tier 3: Permanent Ban (Severe Fraud / Assessment Cheating / Security Breach)**: Account is terminated. Personal identifiers are blacklisted from registration.

### 6.2 Appeals Workflow

#### Rule 6.2.1: Appeals Submission
* **Policy**: Suspended users can submit an appeal through the unauthenticated Help Center wizard within 14 days of suspension.
* **Resolution Timescale**:
  - Tier 1 and 2 appeals are routed to Guild Moderator boards and must be resolved within 5 business days.
  - Tier 3 appeals are routed to Super Administrators and resolved within 10 business days.
* **Finality**: Decisions made by Super Administrators on Tier 3 appeals are final and cannot be reopened.

### 6.3 Account Recovery Policies

#### Rule 6.3.1: Password Reset Limits
* **Policy**: Password reset links sent via email are only valid for **60 minutes**. 
* **Frequency Limit**: Users are capped at **3 password reset requests** per day to prevent automated brute-force attacks on user mailboxes.

---

## 7. Data Privacy & GDPR Rules

### 7.1 Data Portability & Retention

#### Rule 7.1.1: The Right to be Forgotten (Purging Constraints)
* **Policy**: Upon receiving a deletion request, Kirmya must purge all personal identifiers within 72 hours.
* **Telemetry Anonymization**: The user's historical contributions to Guild documentation, peer reviews, and network telemetry are anonymized, maintaining system integrity while satisfying GDPR guidelines.

#### Rule 7.1.2: Algorithmic Sourcing Auditing
* **Policy**: Recruiter search matching data must be logged and kept in an encrypted, read-only audit log for 2 years. These logs must be exportable for independent AEDT bias audits under local laws (e.g. NYC Local Law 144).

---

## 8. Approval Checkpoints

These Business Rules must be signed off by the Leadership Board before engineering commencement:

| Role | Department | Name | Date | Status / Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Executive Officer**| Executive Board | [Pending] | | `Awaiting Review` |
| **Lead Compliance Counsel** | Legal & Compliance| [Pending] | | `Awaiting Review` |
| **Product Director** | Product Strategy | [Pending] | | `Awaiting Review` |
| **Lead Moderator** | Guild Boards | [Pending] | | `Awaiting Review` |

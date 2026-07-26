# Product Requirements Document: Kirmya Professional Ecosystem
**Document Identifier:** PL-PD-003 | **Status:** Draft / Pending Approval | **Version:** 1.0.0  
**Authors:** Antigravity AI & Product Engineering Group | **Date:** July 19, 2026

---

## Document Control & Meta-Information

### Version History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| `0.1.0` | 2026-07-19 | Antigravity AI | Initial draft outlining functional and non-functional requirements. |
| `1.0.0` | 2026-07-19 | Antigravity AI | Completed detailed PRD including in/out of scope definitions, success metrics, acceptance criteria, and system constraints. |

---

## 1. Executive Summary

### 1.1 Document Purpose
This Product Requirements Document (PRD) defines the functional, non-functional, technical, and operational specifications for the **Kirmya Professional Ecosystem** (incorporating Phases 1 through 3). It serves as the primary requirements source for engineering implementation, UI/UX architecture, database design, and testing protocols.

### 1.2 System Context
Kirmya is a unified platform designed to transition professionals from learning and networking to hiring and community collaboration. Unlike legacy professional platforms that operate as flat registries of unverified resume text, Kirmya is built around a dynamic, multi-dimensional **Skill Graph** that validates competencies via community peer reviews, portfolio code analysis, and system-level skill assessments.

---

## 2. Product Scope

### 2.1 In Scope (Phases 1-3)
* **High-Signal Professional Social Graph**: Connection models, follow models, user profile structures reflecting verified competencies, and a content feed driven by value-marked voting mechanics.
* **Professional Guilds (Communities)**: Discipline-specific workspaces, shared knowledge repositories, peer-reviewed portfolio modules, and mentorship circles.
* **Upskilling Pathways & Course API Integrations**: Integrations with Coursera, Udemy, and edX course indices, personal skill-gap analysis, and dynamic learning curricula.
* **Kirmya Copilot (AI Career Assistant)**: Resume optimization engine, text/voice-based mock interview simulator, interactive skill gap analysis, and matching insights.
* **Skills-First Recruitment Suite**: Recruiter search dashboard, blind candidate matching, candidate capability indices, and assessment integrations.

### 2.2 Out of Scope (Horizon 4 - Future)
* **Freelance Marketplace Payment Escrow**: Smart-contract escrow setups, Stripe Connect integrations, and cross-border currency conversions.
* **Decentralized Dispute Resolution**: Guild mediation legal templates and arbitration token reward models.
* **Third-Party Recruiting Agency Integrations**: Full-scale multi-tenant agency billing structures (deferred to Phase 4).

---

## 3. Business & User Goals

### 3.1 Business Goals
1. **Reduce Recruiting Waste**: Decrease the average time-to-hire (TTH) for enterprise customers by 45% by delivering pre-screened, skills-verified talent.
2. **Platform Retention**: Achieve a 40% Monthly Active User (MAU) retention rate by prioritizing educational/utility content over standard social feed noise.
3. **Upskilling Integration**: Drive an average 25% course completion rate for affiliate-sourced training via personalized, goal-driven pathway recommendations.

### 3.2 User Goals
* **For Talent (Professionals & Learners)**:
  * Showcase proven capabilities natively without relying on high-pedigree brand names (e.g., specific schools or companies).
  * Access actionable coaching (mock interviews and resume feedback) to fill skill gaps and secure career transitions.
  * Participate in focused, spam-free communities of practice.
* **For Employers & Recruiters**:
  * Source candidates based on verified output (code, design portfolios, assessments) instead of resume keywords.
  * Reduce top-of-funnel screening overhead through automated, blind competency matches.

---

## 4. Functional Requirements

### 4.1 Networking & Social Graph (Pillar 1)
* **FR-NET-001: Multi-Dimensional Profile**: The system must display a user profile containing:
  - Verified Skill Graph (categorized by competency scores).
  - Portfolio Integrations (GitHub, Behance, Figma links with metadata parsing).
  - Guild achievements and peer validation endorsements.
* **FR-NET-002: Value-Scored Content Feed**: 
  - Users can vote on feed posts using functional labels: "Educational", "Insightful", or "Inspirational".
  - The feed algorithm must prioritize posts based on utility scoring rather than raw click/comment counts.
* **FR-NET-003: Connection Model**: The connection graph must support two-way "Connections" (mutual professional relationships) and one-way "Follows" (educational content tracking).

### 4.2 Professional Guilds (Pillar 2)
* **FR-COM-001: Specialized Spaces**: The system must support dedicated, industry-specific workspaces (Guilds) restricted to verified practitioners.
* **FR-COM-002: Peer-Review Module**:
  - Users can submit design layouts, code repositories, or architectural plans to their Guild for peer review.
  - Reviews must follow structured rubrics, producing a competency endorsement that updates the user's Decentralized Reputation Score (DRS).
* **FR-COM-003: Mentorship Matching**: 
  - Experienced Guild members can opt-in as mentors.
  - The system must match mentors with junior members based on skill gaps and career objectives.

### 4.3 Learning & Course APIs (Pillar 3)
* **FR-LRN-001: Course Aggregation API**: The backend must integrate with Coursera, Udemy, and edX API endpoints to parse and index course metadata, duration, difficulty, and skill tags.
* **FR-LRN-002: Skill Gap Pathway Generator**: 
  - When a user defines a target role, the system must perform a delta analysis between the user's profile and target-role requirements.
  - The system must compile a sequential learning pathway of recommended courses and sandbox exercises.
* **FR-LRN-003: Micro-Credentials**: Upon completion of partner courses or native assessments, the system must issue a verified cryptographic skill badge on the user's profile.

### 4.4 AI Career Assistant (Kirmya Copilot) (Pillar 4)
* **FR-COP-001: Resume Optimizer**: The assistant must parse PDF resumes, analyze formatting and projects, and suggest specific updates mapped to targeted job descriptions.
* **FR-COP-002: Voice/Text Mock Interviews**:
  - The system must simulate interview scenarios using LLM agents.
  - The agent must assess responses for domain accuracy, communication clarity, and structuring, returning a scoring rubric.
* **FR-COP-003: Continuous Skill Audit**: The assistant must periodically check a user's GitHub activity and profile updates to highlight newly emerging skill gaps.

### 4.5 Skills-First Recruitment (Pillar 5)
* **FR-REC-001: Capability Search Engine**: Recruiters must search for candidates using structured skill queries, portfolio requirements, and minimum DRS scores.
* **FR-REC-002: Algorithmic Match Index**: The system must calculate a percentage fit score for each applicant based on assessment compliance and verified skills.
* **FR-REC-003: Blind Sourcing Mode**: 
  - Recruiters can toggle a "Blind Mode" that obscures name, gender, ethnicity, age, and corporate/university names.
  - Initial communications must occur through the blind interface until the recruiter requests an interview.

---

## 5. Non-Functional Requirements

### 5.1 Performance & Latency
* **NFR-PER-001: Page Load Time**: The web application's initial load time must not exceed 2.0 seconds under standard 4G network conditions.
* **NFR-PER-002: Search Latency**: Sourcing search queries across candidate graphs must return results in under 500ms for database sizes up to 10 million nodes.
* **NFR-PER-003: AI Response Time**: Text-based Kirmya Copilot response times must begin streaming within 1.0 second of submission. Voice-based interview responses must maintain latency under 800ms.

### 5.2 Scalability
* **NFR-SCA-001: Graph Queries**: The Neo4j graph database must support concurrent query loads up to 10,000 requests per second (RPS) without degradation.
* **NFR-SCA-002: Vector Indexing**: The vector search database (e.g., pgvector or Pinecone) must index and update 100,000 portfolio embeddings per hour.

### 5.3 Security, Compliance, & Privacy
* **NFR-SEC-001: GDPR Compliance**: 
  - Users must have a single-click "Request Data Export" tool returning all profile, graph, and resume data in JSON format.
  - Account deletion requests must permanently purge identifying information within 72 hours, maintaining anonymized career node telemetry.
* **NFR-SEC-002: AEDT Algorithmic Bias Mitigation**: 
  - Matching algorithms must undergo quarterly independent audits.
  - The recruitment matching engine must conform to NYC Local Law 144 and the EU AI Act, outputting audit logs demonstrating zero statistical bias across protected classes.
* **NFR-SEC-003: Data Encryption**: All user data must be encrypted in transit using TLS 1.3 and at rest using AES-256.

### 5.4 Reliability & Availability
* **NFR-REL-001: System Uptime**: The system must maintain a monthly uptime of 99.9% (excluding planned maintenance windows).
* **NFR-REL-002: Backup Recovery Time**: Automated database backups must run every 24 hours, with a Recovery Point Objective (RPO) of 24 hours and Recovery Time Objective (RTO) of under 2 hours.

---

## 6. Assumptions, Dependencies, & Constraints

### 6.1 Assumptions
1. **Recruiter Behavioral Transition**: Recruiters will adapt to sourcing via capability indices and blind candidate summaries once the ROI of lower time-to-hire is demonstrated.
2. **Compute Cost Margins**: Computational costs of LLM endpoints will continue to drop, ensuring premium subscriptions ($10/month) remain profitable.

### 6.2 Dependencies
1. **Third-Party API Support**: The learning pillar depends on the stability and licensing of Coursera, Udemy, and edX course endpoints.
2. **Third-Party LLM Endpoints**: Kirmya Copilot depends on API access to frontier LLM services (e.g., Anthropic, Gemini, or OpenAI) for complex code analysis and voice-coaching interactions.

### 6.3 Constraints
1. **Budgetary Constraints**: Initial server infrastructure and API compute budgets are limited to $50,000 for the private beta release.
2. **Legal and HR Compliance Boundary**: Candidate matching engines cannot automatically reject candidates without human-in-the-loop review. The system must display a disclaimer stating that final hiring choices are determined solely by the employer.

---

## 7. Success Metrics & Product KPIs

We will monitor product adoption and utility using these core metrics:

| Metric | Target Value (Phase 1-2) | Verification Method |
| :--- | :--- | :--- |
| **Content Signal Quality (CSQ)** | > 85% Value-Marked posts | Ratio of Educational/Insightful votes to total feed actions |
| **Active Guild Members (AGM)** | 40% of overall MAU | Weekly telemetry tracking posts/peer reviews per user |
| **Copilot Engagement Rate** | 65% of monthly active users | Percentage of users initiating mock interviews or resume checks |
| **Course Completion Rate (CCR)**| 25% completion on paths | Tracking progress callbacks from partner learning APIs |
| **Recruitment Conversion Rate**| 35% shortlist conversion | Ratio of candidate matches resulting in direct interview requests |

---

## 8. Acceptance Criteria

To determine feature completeness, the following criteria must be met:

| Feature / User Flow | Acceptance Criteria (Definition of Done) |
| :--- | :--- |
| **User Sign-Up & Authentication** | 1. User can register via Email/Password, GitHub OAuth, or LinkedIn OAuth.<br>2. Multi-factor authentication (MFA) can be enabled.<br>3. Profile creation workflow generates a new database node in both relational and graph databases. |
| **Skill Graph & Portfolio Setup** | 1. Profile successfully imports GitHub projects and parses repository languages.<br>2. User can add skills manually, which appear as "Unverified" until validated by assessments or peer audits.<br>3. Graph visualization correctly renders skill relationships and levels. |
| **Guild Peer Review Submission** | 1. User can upload a project link or portfolio asset specifying review rubrics.<br>2. Review notifications are sent to 3 qualified guild members with a DRS > 70.<br>3. On completion of all 3 audits, the system calculates the weighted score, updates the candidate's profile, and updates the DRS. |
| **Kirmya Copilot Interview Prep** | 1. User can select a targeted job description.<br>2. Copilot generates 5 role-specific questions.<br>3. Voice transcriptions parse accurately, and LLM provides a structured feedback rubric with a latency of < 1.0s. |
| **Recruiter Capability Search** | 1. Recruiter can input specific skill constraints and minimum peer-review thresholds.<br>2. Engine returns matches sorted by Match Index in under 500ms.<br>3. Toggling Blind Mode immediately strips names, photos, and pedigree text from the view. |

---

## 9. Risks & Mitigation Matrix

```
+-----------------------------------+-----------------------------------+
| IDENTIFIED RISK                   | MITIGATION STRATEGY               |
+-----------------------------------+-----------------------------------+
| Assessment Gaming                 | - Use randomized test question     |
| Candidates use AI models to cheat |   banks.                          |
| during Kirmya skill assessments.  | - Track abnormal input behavior    |
|                                   |   (e.g. rapid copy-pasting).      |
|                                   | - Prioritize peer code reviews and|
|                                   |   repository histories over basic |
|                                   |   multiple-choice tests.          |
+-----------------------------------+-----------------------------------+
| Algorithmic Matching Biases       | - Strip demographic telemetry from|
| Machine learning models favor     |   matching datasets.              |
| specific demographics or text     | - Perform monthly audits using the|
| formats.                          |   Disparate Impact Ratio method.   |
|                                   | - Allow manual search overrides.  |
+-----------------------------------+-----------------------------------+
| LLM Hallucinations in Coaching    | - Restrict LLM prompts to specific|
| Copilot provides incorrect coding |   domain-knowledge databases.     |
| advice during interview prep.     | - Run automated evaluations on    |
|                                   |   coaching outputs.               |
|                                   | - Include clear feedback disclaimers|
|                                   |   on all AI-generated screens.    |
+-----------------------------------+-----------------------------------+
| GDPR/Privacy Infringement         | - Store personal identifiers      |
| Sourcing graph leaks sensitive    |   separately from core graphs.    |
| identity records.                 | - Encrypt graph databases at the  |
|                                   |   property level.                 |
+-----------------------------------+-----------------------------------+
```

---

## 10. Future Expansion & Roadmap

* **Marketplace Escrow Integration (Phase 4)**: Deployment of multi-party milestone escrow accounts. Integration of automated milestone validation triggers using codebase commits and design assets.
* **Decentralized Reputation Ledger**: Porting user DRS scores to a private, cryptographic ledger. This allows professionals to maintain portable, tamper-proof proof of their skills outside Kirmya's centralized platform.
* **Offline Guild Meetups & Local Hubs**: Launching localized physical networking spaces managed by top-ranking regional Guild chapters.

---

## 11. Approval Checkpoints

This Product Requirements Document must be approved by all departments before commencement of database schema layouts:

| Role | Department | Name | Date | Status / Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Product Director** | Product Strategy | [Pending] | | `Awaiting Review` |
| **Chief Technology Officer**| Engineering | [Pending] | | `Awaiting Review` |
| **Lead Architect** | System Design | [Pending] | | `Awaiting Review` |
| **Chief Information Security Officer**| InfoSec & Legal | [Pending] | | `Awaiting Review` |

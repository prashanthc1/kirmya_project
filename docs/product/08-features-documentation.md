# Features Documentation: Kirmya Professional Ecosystem
**Document Identifier:** PL-PD-008 | **Status:** Draft / Pending Approval | **Version:** 1.0.0  
**Authors:** Antigravity AI & Product Management Guild | **Date:** July 19, 2026

---

## Document Control & Meta-Information

### Version History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| `0.1.0` | 2026-07-19 | Antigravity AI | Initial draft mapping modular feature hierarchies. |
| `1.0.0` | 2026-07-19 | Antigravity AI | Completed detailed specifications for every feature across all 14 modules. |

---

## 1. Executive Summary

This Features Documentation defines every planned feature of the **Kirmya Professional Ecosystem** across 14 modules. The catalog establishes engineering priorities, outlines technical/business dependencies, and tracks future enhancements to align technical development with Kirmya's long-term monetization and growth strategies.

---

## 2. Module Specifications & Feature Catalog

---

### 2.1 Authentication Module

#### Feature 2.1.1: Multi-Factor Authentication (MFA)
* **Purpose**: Secures user logins using time-based one-time passwords (TOTP) from authenticator apps or SMS codes.
* **Business Value**: Protects candidate profiles and recruiter dashboards from credential hijacking, safeguarding proprietary talent data.
* **Priority**: `P0 (Launch Critical)`
* **Dependencies**: Relational database user table, SMTP/SMS gateway services.
* **Future Enhancements**: Biometric authentication integrations (Passkeys/FIDO2).

#### Feature 2.1.2: GitHub & LinkedIn OAuth Integration
* **Purpose**: Allows candidates to sign up and log in using their existing GitHub or LinkedIn credentials.
* **Business Value**: Eliminates registration friction, driving high conversion rates for candidate sign-ups.
* **Priority**: `P0`
* **Dependencies**: GitHub and LinkedIn Developer API client setups.
* **Future Enhancements**: Auto-import portfolio and connections during registration.

#### Feature 2.1.3: Corporate Single Sign-On (SSO)
* **Purpose**: Integrates enterprise logins with SAML 2.0 or OIDC providers (e.g. Azure AD, Okta).
* **Business Value**: Mandatory requirement to close sales with enterprise corporate accounts.
* **Priority**: `P1 (Growth)`
* **Dependencies**: Enterprise subscription logic, corporate domain validation.
* **Future Enhancements**: Automated user provisioning via SCIM protocols.

---

### 2.2 Profiles Module

#### Feature 2.2.1: Multi-Source Portfolio Scraper
* **Purpose**: Automatically parses and imports project metadata, code repositories (GitHub), and design assets (Behance, Figma).
* **Business Value**: populates candidate profiles with verifiable evidence of capabilities, replacing flat text resumes.
* **Priority**: `P0`
* **Dependencies**: GitHub/Figma public APIs, background job queues.
* **Future Enhancements**: AI-driven analysis of code quality and design style.

#### Feature 2.2.2: Dynamic Skill Graph Visualization
* **Purpose**: Renders an interactive visual chart of candidate skill nodes, categorizing them by competency levels and verifications.
* **Business Value**: Increases candidate engagement and gives recruiters an immediate visual model of talent density.
* **Priority**: `P1`
* **Dependencies**: Graph database engine (Neo4j), D3.js or similar visual engine.
* **Future Enhancements**: Recommended connection paths based on overlapping skill clusters.

#### Feature 2.2.3: Cryptographic Skill Verification Badging
* **Purpose**: Attaches verified status badges to skills confirmed via platform assessments or Guild reviews.
* **Business Value**: Serves as Kirmya’s primary value proposition—providing recruiters with trusted, verified skill proofs.
* **Priority**: `P0`
* **Dependencies**: Assessment engine tables, DRS scoring logic.
* **Future Enhancements**: Storing verified certificates on a decentralized reputation ledger (DRS).

---

### 2.3 Companies Module

#### Feature 2.3.1: Verified Brand Pages
* **Purpose**: Allows enterprises to create customizable corporate profiles showcasing active tech stacks and career openings.
* **Business Value**: Core B2B customer attraction tool; acts as an organic pipeline builder for employers.
* **Priority**: `P0`
* **Dependencies**: Relational database company tables, image upload handlers.
* **Future Enhancements**: Native employee blogging and tech-case-study publications.

#### Feature 2.3.2: Corporate Sourcing Pipeline Analytics
* **Purpose**: Provides HR teams with visual dashboards tracking candidate funnel conversion and sourcing times.
* **Business Value**: Proves Kirmya's ROI directly to hiring directors by showing reduction in sourcing waste.
* **Priority**: `P1`
* **Dependencies**: Recruitment matching metrics, data visualization libraries.
* **Future Enhancements**: Machine learning predictions of time-to-hire based on job market conditions.

---

### 2.4 Jobs Module

#### Feature 2.4.1: Capabilities-First Job Post Creator
* **Purpose**: Restructures job postings, requiring employers to input specific skill nodes and required DRS levels rather than text qualifications.
* **Business Value**: Eliminates loose keyword-matching on job descriptions, ensuring high-accuracy matching profiles.
* **Priority**: `P0`
* **Dependencies**: Skill ontology database taxonomy.
* **Future Enhancements**: Auto-generation of capability templates using job titles.

#### Feature 2.4.2: Automated Blind Candidate Matching
* **Purpose**: Renders candidate profiles in a standardized, anonymized format that displays capabilities and hides demographic identifiers.
* **Business Value**: Eliminates unconscious bias in hiring, ensuring companies comply with regional diversity standards.
* **Priority**: `P0`
* **Dependencies**: Algorithmic Match Index, blind UI configurations.
* **Future Enhancements**: Natural Language processing tools that flag and redact potential demographic indicators in cover messages.

---

### 2.5 Communities Module

#### Feature 2.5.1: Specialized Guild Workspaces
* **Purpose**: Creates restricted, industry-specific workspaces for verified professionals to share technical assets.
* **Business Value**: Retains active talent on the platform, establishing a defensive moat of community engagement.
* **Priority**: `P0`
* **Dependencies**: User role validation, Guild content tables.
* **Future Enhancements**: Sub-Guild micro-communities for localized regional cohorts.

#### Feature 2.5.2: Structured Guild Peer Reviews
* **Purpose**: Allows users to submit projects to their Guild for evaluation using structured rubrics.
* **Business Value**: Drives skill validation and feeds candidate DRS scores organically.
* **Priority**: `P0`
* **Dependencies**: DRS rating algorithms, moderator notification queues.
* **Future Enhancements**: Automated matching of submissions to relevant expert reviewers.

#### Feature 2.5.3: Virtual Mentorship Matching
* **Purpose**: Connects junior professionals with experienced experts in their Guild based on target career goals.
* **Business Value**: Drives user loyalty among emerging talent who receive career guidance on Kirmya.
* **Priority**: `P1`
* **Dependencies**: Mentorship preference databases, matching algorithms.
* **Future Enhancements**: Group mentorship webinar hosting modules.

---

### 2.6 Messaging Module

#### Feature 2.6.1: Anonymized Blind Sourcing Chats
* **Purpose**: Enables recruiters to chat with matched candidates without revealing Candidate IDs or names during initial screens.
* **Business Value**: Mandated for blind hiring pipelines; protects candidate privacy until mutual interest is established.
* **Priority**: `P0`
* **Dependencies**: Encrypted messaging service database tables.
* **Future Enhancements**: Real-time translation tools for bilingual GCC recruitment.

#### Feature 2.6.2: Native Video Scheduling & Links
* **Purpose**: Integrates meeting schedulers and generates video interview conference links directly in the messaging thread.
* **Business Value**: Minimizes recruiter context-switching, keeping hiring operations completely on Kirmya.
* **Priority**: `P1`
* **Dependencies**: Calendar API synchronization, video provider APIs (e.g. Jitsi, Zoom).
* **Future Enhancements**: Native voice/video streaming server infrastructure.

---

### 2.7 Search Module

#### Feature 2.7.1: Recruiter Capability Search Engine
* **Purpose**: Allows recruiters to search for talent using strict skill nodes, DRS thresholds, and portfolio keywords.
* **Business Value**: Direct driver of B2B SaaS license subscriptions; primary tool for talent discovery.
* **Priority**: `P0`
* **Dependencies**: GraphDB and VectorDB indexes.
* **Future Enhancements**: AI semantic search that converts conversational queries into complex database search queries.

#### Feature 2.7.2: Bilingual Arabic-English Search Parsing
* **Purpose**: Translates and parses Arabic and English professional search queries contextually.
* **Business Value**: Mandatory differentiator for winning enterprise contracts in KSA and the UAE.
* **Priority**: `P1`
* **Dependencies**: Regional language processing dictionaries.
* **Future Enhancements**: GCC dialect translation models.

---

### 2.8 AI Module (Kirmya Copilot)

#### Feature 2.8.1: PDF Resume Formatting & Skill Auditor
* **Purpose**: Parses uploaded resumes, flags inconsistencies, and recommends skill updates based on targeted roles.
* **Business Value**: Basic value magnet that drives initial candidate registration.
* **Priority**: `P0`
* **Dependencies**: LLM API endpoints, PDF text extraction utilities.
* **Future Enhancements**: Automated conversion of standard resumes into interactive portfolios.

#### Feature 2.8.2: Voice-Streaming Mock Interview Coach
* **Purpose**: Conducts audio-based mock interviews with candidates, scoring responses on technical accuracy and communication style.
* **Business Value**: Primary driver of premium user subscriptions (Copilot Plus - $10/month).
* **Priority**: `P1`
* **Dependencies**: LLM voice processing APIs, WebRTC audio interfaces.
* **Future Enhancements**: Visual interview coach that analyzes video streams for body language feedback.

---

### 2.9 Analytics Module

#### Feature 2.9.1: Automated AEDT Bias Monitor
* **Purpose**: Audits Candidate Match Index allocations and logs candidate demographic distributions.
* **Business Value**: Guarantees corporate compliance with fair hiring laws (NYC Local Law 144 / EU AI Act).
* **Priority**: `P1`
* **Dependencies**: Algorithmic match records, anonymized demographic tables.
* **Future Enhancements**: Automated alerts when match distributions exceed deviation thresholds.

#### Feature 2.9.2: Regional Salary & Skill Benchmark Engine
* **Purpose**: Aggregates platform salary agreements and skill densities to provide regional benchmark reports.
* **Business Value**: Attracts corporate enterprise subscribers who pay for salary and talent analytics.
* **Priority**: `P2`
* **Dependencies**: Verified salary data entries, data aggregation scripts.
* **Future Enhancements**: Predictions of future regional skill shortages in tech sectors.

---

### 2.10 Admin Module

#### Feature 2.10.1: Multi-Tenant Recruiter Seat Manager
* **Purpose**: Allows Company Administrators to provision, monitor, and revoke recruiter access licenses.
* **Business Value**: Manages B2B SaaS subscription billing compliance.
* **Priority**: `P0`
* **Dependencies**: Billing databases, tenant authorization tables.
* **Future Enhancements**: Automated seat allocation based on hiring volumes.

#### Feature 2.10.2: Feature Flag Console
* **Purpose**: Enables Super Administrators to toggle system configuration flags and route traffic.
* **Business Value**: Ensures zero-downtime feature releases and rapid rollbacks in case of system failures.
* **Priority**: `P1`
* **Dependencies**: Admin dashboard tables, application route rules.
* **Future Enhancements**: Targeted A/B testing configurations.

---

### 2.11 Freelancing Module (Future Horizon)

#### Feature 2.11.1: Escrow Milestone Contract Manager
* **Purpose**: Holds contract payments in escrow and releases funds to freelancers based on milestone completions.
* **Business Value**: Drives transaction volume; supports the future flat 2.5% marketplace fee structure.
* **Priority**: `P2`
* **Dependencies**: Multi-party payment escrow integrations (e.g. Stripe Escrow).
* **Future Enhancements**: Automatic code-commit milestone verification.

#### Feature 2.11.2: Guild Dispute Arbitration Panel
* **Purpose**: Routes disputed freelance contracts to independent Guild expert panels for mediation.
* **Business Value**: Establishes trust by replacing automated platform decisions with peer-reviewed rulings.
* **Priority**: `P2`
* **Dependencies**: DRS validation structures, dispute queue models.
* **Future Enhancements**: Tokenized reward systems for expert mediators.

---

### 2.12 Learning Module

#### Feature 2.12.1: Unified Course Aggregators
* **Purpose**: Integrates Coursera, Udemy, and edX course indices into a unified platform directory.
* **Business Value**: Drives affiliate payout revenues (10-15% commission per purchase).
* **Priority**: `P0`
* **Dependencies**: Learning provider API keys and affiliate networks.
* **Future Enhancements**: Direct learning sandbox widget integrations on Kirmya.

#### Feature 2.12.2: AI-Powered Skill Gap Pathway Parser
* **Purpose**: Compares user skill gaps with targeted roles and compiles a recommended learning curriculum.
* **Business Value**: Drives upskilling path completions, feeding the affiliate revenue loops.
* **Priority**: `P0`
* **Dependencies**: Skills delta analysis algorithms, aggregated course databases.
* **Future Enhancements**: Personal career mentor assignments.

---

### 2.13 Notifications Module

#### Feature 2.13.1: Real-Time Event Alerts
* **Purpose**: Sends pushes, emails, or SMS alerts for DRS changes, interview requests, and billing events.
* **Business Value**: Drives platform retention by pulling users back to active workflows.
* **Priority**: `P0`
* **Dependencies**: Event bus architecture, SMTP/SMS endpoints.
* **Future Enhancements**: Smart notifications scheduling to avoid notification fatigue.

---

### 2.14 Settings Module

#### Feature 2.14.1: GDPR Data Export and Purge Tool
* **Purpose**: Allows users to download all personal records in JSON format and request complete account deletion.
* **Business Value**: Ensures legal compliance with global privacy laws, protecting Kirmya from regulatory fines.
* **Priority**: `P0`
* **Dependencies**: User database deletion scripts.
* **Future Enhancements**: Encrypted client-side data recovery vaults.

---

## 3. Summary Priority Matrix

To align launch parameters, features are prioritized as follows:

| Module | P0 (Launch Critical) | P1 (Growth Tier) | P2 (Future Scale) |
| :--- | :--- | :--- | :--- |
| **Authentication** | MFA, Social OAuth | Corporate SSO | Biometrics |
| **Profiles** | Portfolio Scraper, Credential Badges | Skill Graph Visualization | Ledger credentials |
| **Companies** | Verified Brand Pages | Pipeline Analytics | Sourcing benchmarking |
| **Jobs** | Job Creator, Blind Match Index | Bias monitoring | N/A |
| **Communities** | Guild Spaces, Peer Review | Mentorship Matching | Sub-guild cohorts |
| **Messaging** | Blind Sourcing Chats | Native Video Links | Dialect translation |
| **Search** | Capability Search Engine | Arabic NLP Sourcing | N/A |
| **AI** | PDF Resume Auditing | Voice Interview Coach | Video posture coach |
| **Analytics** | N/A | AEDT Bias Auditor | Salary Benchmarks |
| **Admin** | Recruiter Seat Manager | Feature Flag Console | N/A |
| **Freelancing** | N/A | N/A | Escrow, Dispute Mediate |
| **Learning** | Unified Catalog, Gap Pathway | N/A | Sandbox widgets |
| **Notifications**| Real-Time Event Alerts | N/A | Scheduled notifications|
| **Settings** | GDPR Export/Purge | Visibility controls | N/A |

---

## 4. Approval Checkpoints

This Features Documentation must be signed off by all stakeholders before database schema layouts are finalized:

| Role | Department | Name | Date | Status / Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Executive Officer**| Executive Board | [Pending] | | `Awaiting Review` |
| **Chief Technology Officer**| Engineering | [Pending] | | `Awaiting Review` |
| **Product Director** | Product Strategy | [Pending] | | `Awaiting Review` |
| **Lead Architect** | System Design | [Pending] | | `Awaiting Review` |

# Information Architecture & Sitemap: Kirmya Professional Ecosystem
**Document Identifier:** PL-PD-011 | **Status:** Draft / Pending Approval | **Version:** 1.0.0  
**Authors:** Antigravity AI & Design & UX Guild | **Date:** July 19, 2026

---

## Document Control & Meta-Information

### Version History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| `0.1.0` | 2026-07-19 | Antigravity AI | Initial draft outlining route hierarchies and dashboard structures. |
| `1.0.0` | 2026-07-19 | Antigravity AI | Completed full sitemap, breadcrumb specifications, and deep-link routing mappings. |

---

## 1. Executive Summary

This document establishes the official **Information Architecture (IA) and Sitemap** for the **Kirmya Professional Ecosystem**. It provides frontend developers, product managers, and UI/UX designers with a comprehensive blueprint of all page routes, authenticated dashboards, navigation hierarchies, deep-linking configurations, and SEO-optimized public landing directories.

---

## 2. Core Site Map & Navigation Hierarchy

The following site hierarchy diagram illustrates the navigation levels from unauthenticated guest pages down to authenticated dashboards:

```mermaid
graph TD
    classDef root fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;
    classDef auth fill:#eff6ff,stroke:#3b82f6,stroke-width:1px,color:#1e3a8a;
    classDef public fill:#f3f4f6,stroke:#d1d5db,stroke-width:1px,color:#1f2937;
    classDef admin fill:#ef4444,stroke:#dc2626,stroke-width:1px,color:#fff;
    
    Root[Landing Page /]:::public
    
    %% Public Branches
    Root --> AuthGate[Auth Gate /login]:::public
    Root --> SEO[SEO Skill Directories /skills]:::public
    Root --> Help[Help & Docs /docs]:::public
    
    %% Authenticated Talent Gateway
    AuthGate --> TalentDashboard[/dashboard]:::auth
    TalentDashboard --> Profiles[/profile/me]:::auth
    TalentDashboard --> Guilds[/guilds]:::auth
    TalentDashboard --> Learning[/learning]:::auth
    TalentDashboard --> Copilot[/copilot]:::auth
    
    %% Authenticated Recruiter Gateway
    AuthGate --> RecDashboard[/recruiter/dashboard]:::auth
    RecDashboard --> Sourcing[/recruiter/search]:::auth
    RecDashboard --> JobManager[/recruiter/jobs]:::auth
    RecDashboard --> Analytics[/recruiter/analytics]:::auth
    
    %% Administrative Gateway
    AuthGate --> AdminDashboard[/admin/dashboard]:::admin
    AdminDashboard --> Telemetry[/admin/telemetry]:::admin
    AdminDashboard --> AccessControl[/admin/access]:::admin
```

---

## 3. URL Routes & Page Index

### 3.1 Unauthenticated Public Routes (SEO & Marketing)
* **`/` (Home)**: Marketing landing page highlighting Kirmya’s ecosystem pillars.
* **`/about`**: Product philosophy, mission, and long-term horizons overview.
* **`/login`**: Multi-method login page (Email/Password + GitHub/LinkedIn OAuth + SSO redirects).
* **`/signup`**: Onboarding wizard segmenting users into Talent, Employer, or Freelancer types.
* **`/verify/badge/[badgeId]`**: Public-facing cryptographic skill-credential verification page.
* **`/skills/[slug]`**: SEO-optimized landing directory showcasing regional talent statistics (e.g. `/skills/react-developers-dubai`).
* **`/help`**: Public documentation, glossary tables, and unauthenticated suspension appeals forms.

### 3.2 Authenticated Talent Routes (Professionals & Learners)
* **`/dashboard`**: Unified homepage displaying personalized feed cards, upskilling recommendations, and active Guild notifications.
* **`/profile/[username]`**: Interactive user profile displaying the candidate's dynamic Skill Graph, linked portfolios (GitHub commits/Figma files), and Guild achievement badges.
* **`/guilds`**: Specialized communities dashboard.
  - **`/guilds/[guild-slug]`**: Main workspace feed for a technical discipline (e.g. `/guilds/rust-developers`).
  - **`/guilds/[guild-slug]/reviews`**: Active portfolio peer-review submission queue.
  - **`/guilds/[guild-slug]/docs`**: Curated technical documents and templates repository.
* **`/learning`**: Learning hub index showing recommended paths.
  - **`/learning/paths/[path-id]`**: Dynamic skill-gap pathway layout (listing Coursera/Udemy/edX course sequences).
* **`/copilot`**: Core AI career assistance workspace.
  - **`/copilot/resume`**: AI Resume Optimizer file uploader and audit interface.
  - **`/copilot/interview`**: Text and voice mock interview simulator panel.
* **`/settings`**: Personal security configurations, GDPR export request logs, and feed filter preferences.

### 3.3 Authenticated Recruiter & Employer Routes
* **`/recruiter/dashboard`**: Sourcing workspace displaying pipeline ratios, active jobs, and quick candidate lists.
* **`/recruiter/search`**: **Capability Search Engine** interface containing skill filters, DRS bounds, and location/visa selectors.
* **`/recruiter/jobs`**: Job posting manager list.
  - **`/recruiter/jobs/new`**: Capabilities-first job listing form mapping target DRS score requirements.
  - **`/recruiter/jobs/[job-id]/candidates`**: Candidate evaluation pipeline, displaying blind candidate match profiles.
* **`/recruiter/analytics`**: HR metrics dashboard logging sourcing speeds and AEDT bias audits.

### 3.4 Authenticated Administrative Routes
* **`/admin/dashboard`**: Consolidated operational portal displaying global metrics (Active users, active Guild counts, transaction volumes).
* **`/admin/telemetry`**: OpenTelemetry dashboard displaying graph DB query speeds, vector indexing rates, and compute costs.
* **`/admin/access`**: Recruiter seat licensing manager and SSO config panels.
* **`/admin/moderation`**: Flagged content review queues, mediation escalations, and moderator election configurations.

---

## 4. Dashboard Layout & Panel Specifications

### 4.1 Talent Dashboard Layout
* **Primary Panel (Center)**: The High-Signal Feed (voted technical articles, code updates, and Guild publications).
* **Sidebar Left**: Mini-profile card displaying current DRS rating and active Guild links.
* **Sidebar Right**: AI Copilot recommendations (next course in upskilling path, upcoming interview prep slot).

### 4.2 Recruiter Console Layout
* **Primary Panel (Center)**: Active Candidate Funnel matrix (Vetted -> Anonymized Chat -> Interview Scheduled -> Hired).
* **Header**: Global search bar triggering the **Capability Search Engine**.
* **Sidebar Left**: Active job postings slot list (cap: 5 active slots per seat).

### 4.3 Company Admin Control Panel
* **Primary Panel (Center)**: User management table (adding/revoking recruiter seats, assigning permissions).
* **Sidebar Left**: SSO (SAML/OIDC) security configuration wizard and API token generation controls.
* **Sidebar Right**: Billing summary panel (monthly SaaS seat count invoice exports).

### 4.4 Guild Moderator Interface
* **Primary Panel (Center)**: Flagged content moderation queue (flagged posts, comments, spammers).
* **Tab Panel 1**: Pending peer-review portfolio submissions (matching candidate deliverables with moderator expertise).
* **Tab Panel 2**: Escrow dispute mediation panel (auditing contract specifications and project submissions).

---

## 5. Breadcrumb Structure & Navigation Rules

To ensure orientation across nested workspaces, the platform enforces logical breadcrumb hierarchies:

* **Talent Guild Paths**:  
  `Home > Guilds > [Guild Name] > [Resource Type] > [Item]`  
  *Example*: `Home > Guilds > Rust Developers > Peer Reviews > Submission #4092`
* **Upskilling Paths**:  
  `Home > Learning > Upskilling Paths > [Target Role] > [Active Course]`  
  *Example*: `Home > Learning > Upskilling Paths > DevOps Engineer > Udemy Course API #1`
* **Recruiter Pipeline Paths**:  
  `Recruiter Dashboard > Job Postings > [Job Title] > Candidates > [Blind Candidate ID]`  
  *Example*: `Recruiter Dashboard > Job Postings > Senior Backend Engineer > Candidates > Profile #T7492`
* **Admin Telemetry Paths**:  
  `Admin Dashboard > Telemetry Logs > [Database Type] > Query Logs`  
  *Example*: `Admin Dashboard > Telemetry Logs > Neo4j GraphDB > Query Logs`

---

## 6. Deep Link Configurations

To support external workflows and sharing, the platform registers specific deep-link schemas:

* **Verifiable Skill Credentials**:  
  Format: `https://kirmya.com/verify/badge/[badgeId]`  
  *Target*: Public page rendering badge issuer details, candidate DRS scores, and cryptographic signatures.
* **B2B Sourcing Invitations**:  
  Format: `https://kirmya.com/invite/enterprise/[tenantId]?token=[token]`  
  *Target*: Instantly routes new team members to the SSO authentication bridge.
* **Specialized Guild Resource Sharing**:  
  Format: `https://kirmya.com/guilds/[guild-slug]/docs/[docId]`  
  *Target*: Renders specific Guild articles directly. Redirects unauthenticated Guests to public-read-only schemas.

---

## 7. SEO-Optimized Public Pages

To capture search engine index queries organically, Kirmya maintains public, read-only directories:

* **Regional Skill Directories**:  
  Format: `https://kirmya.com/skills/[skill-name]-developers-[region]`  
  *Target*: Public, search-indexed directories displaying aggregate talent density, trending skill graphs, and median salary structures for specific regions (e.g. `/skills/python-developers-riyadh`).
* **Open Guild Repositories**:  
  Format: `https://kirmya.com/guilds/[guild-slug]/public-resources`  
  *Target*: Public repositories indexing highly voted technical articles and guides, boosting Kirmya’s authority keywords.

---

## 8. Future Horizon Marketplace Mappings (Phase 4)

To support the V3.0 roadmap, the sitemap reserves the following routes:

* **`/marketplace`**: Freelance project listing index.
* **`/contracts/[contract-id]`**: Milestone escrow management panel (displaying deliverables, timelines, and escrow deposit statuses).
* **`/contracts/[contract-id]/dispute`**: Conflict arbitration workspace routing contracts to Guild moderator panels.
* **`/wallet`**: Escrow balance ledger displays, integrated with local transfer (Aani) banking configurations.

---

## 9. Approval Checkpoints

The Information Architecture and Sitemap must be signed off by UX and Engineering before front-end repository staging:

| Role | Department | Name | Date | Status / Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Lead UX Architect** | Design & UX | [Pending] | | `Awaiting Review` |
| **Front-End Lead Engineer**| Engineering | [Pending] | | `Awaiting Review` |
| **Product Director** | Product Strategy | [Pending] | | `Awaiting Review` |
| **SEO Operations Lead** | Marketing | [Pending] | | `Awaiting Review` |

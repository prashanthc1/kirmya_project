# Product Roadmap: Kirmya Professional Ecosystem
**Document Identifier:** PL-PD-004 | **Status:** Draft / Pending Approval | **Version:** 1.0.0  
**Authors:** Antigravity AI & Product Management Guild | **Date:** July 19, 2026

---

## Document Control & Meta-Information

### Version History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| `0.1.0` | 2026-07-19 | Antigravity AI | Initial draft mapping roadmap timeline and phase complexity. |
| `1.0.0` | 2026-07-19 | Antigravity AI | Completed detailed Roadmap document including priority milestones, dependencies, and business rationales. |

---

## 1. Executive Summary

### 1.1 Roadmap Objective
This Product Roadmap outlines the phased development and deployment timeline for the **Kirmya Professional Ecosystem**. It provides engineering, product, and design teams with a clear sequence of priorities, milestones, dependencies, and complexity levels required to execute the long-term vision established in the *Product Charter* ([01-product-charter.md](file:///c:/Users/PRASHANTH/Documents/real/my_project/docs/product/01-product-charter.md)) and the *Product Requirements Document* ([03-product-requirements.md](file:///c:/Users/PRASHANTH/Documents/real/my_project/docs/product/03-product-requirements.md)).

### 1.2 Strategic Progression
To overcome the social graph "cold-start" problem, Kirmya adopts an organic progression:
1. **Acquire & Organize (MVP & Beta)**: Capture talent through high-signal social loops, portfolios, and basic AI resume tools.
2. **Upskill & Integrate (V1 & V1.5)**: Deepen engagement via unified course integrations, skill-gap analysis, and initial recruiter capability search engines.
3. **Validate & Match (V2)**: Elevate matching precision using AI interview coaches and automated candidate assessments.
4. **Transact & Scale (V3 & 5-Year Vision)**: Unlock transactional revenues via low-fee escrow contracts and port data onto a decentralized reputation ledger.

---

## 2. Phased Development Timeline

```
+----------------------------------------------------------------------------------------+
| MVP: Social Foundation (M1-M3)                                                         |
| - Relational & Graph Database schemas, OAuth integrations.                             |
| - High-Signal Feed (value-based voting), profile portfolios.                           |
+---------------------------+------------------------------------------------------------+
                            |
                            v
+---------------------------+------------------------------------------------------------+
| Beta: Community & Assistant (M4-M6)                                                    |
| - Launch Professional Guilds workspaces.                                               |
| - Baseline Copilot (PDF resume auditing, text-based recommendations).                  |
+---------------------------+------------------------------------------------------------+
                            |
                            v
+---------------------------+------------------------------------------------------------+
| Version 1.0: Public Launch & Upskilling (M7-M12)                                        |
| - Integrate Udemy, Coursera, edX aggregate course APIs.                                |
| - Dynamic Skill Gap learning pathways.                                                 |
+---------------------------+------------------------------------------------------------+
                            |
                            v
+---------------------------+------------------------------------------------------------+
| Version 1.5: Sourcing Suite (M13-M18)                                                  |
| - Recruiter Sourcing Search Dashboard (Capability Search Engine).                      |
| - Algorithmic blind candidate match index.                                             |
+---------------------------+------------------------------------------------------------+
                            |
                            v
+---------------------------+------------------------------------------------------------+
| Version 2.0: Validation Tier (M19-M24)                                                 |
| - Copilot Plus: Live voice/text mock interview coaches.                                |
| - Native custom assessments engine.                                                    |
+---------------------------+------------------------------------------------------------+
                            |
                            v
+---------------------------+------------------------------------------------------------+
| Version 3.0: Transactional Hub (M25-M36)                                                 |
| - Escrow-backed freelance marketplace contracts (flat 2.5% fee).                       |
| - Dispute resolution module mediated by Guild members.                                 |
+----------------------------------------------------------------------------------------+
```

---

## 3. Detailed Phase Breakdowns

### 3.1 MVP (Minimum Viable Product) — Months 1-3
* **Focus**: Establish the relational and graph database foundations, core user authentication, and social profiles.
* **Estimated Complexity**: `Medium`

| Attribute | Details |
| :--- | :--- |
| **Priorities** | 1. Database schema generation (PostgreSQL + Neo4j).<br>2. Social profile setups with GitHub/LinkedIn integration.<br>3. High-Signal content feed implementation (functional voting mechanics). |
| **Key Milestones** | - Successful deployment of relational/graph data layer.<br>- Core OAuth integration sign-off.<br>- Feed value-voting algorithm live in private dev environment. |
| **Dependencies** | - **Technical**: Secure GraphDB connection clustering.<br>- **Business**: Initial content seeding partnerships. |
| **Strategic Rationale** | Building a stable data layer and basic social feed allows us to test user retention loops early without high infrastructure overhead. |

### 3.2 Beta Release — Months 4-6
* **Focus**: Introduce Professional Guild spaces and basic AI-powered resume parsing.
* **Estimated Complexity**: `High`

| Attribute | Details |
| :--- | :--- |
| **Priorities** | 1. Implement specialized workspaces (Guilds) with restrict access metrics.<br>2. Integrate initial Kirmya Copilot (PDF resume upload and text analysis).<br>3. Enable portfolio parsing for GitHub commits and projects. |
| **Key Milestones** | - Launch of private Beta Guilds (limit to 5 specific tech domains).<br>- Kirmya Copilot basic text API integrations live.<br>- Resume parsing latency stabilized below 1.5 seconds. |
| **Dependencies** | - **Technical**: Access to frontier LLM APIs (e.g., Anthropic Claude / Gemini API).<br>- **Business**: Recruiting 1,000 beta practitioners for Guild moderators. |
| **Strategic Rationale** | Establishes the peer-review culture and gives learners their first utility tool (Copilot resume audits) to build platform trust. |

### 3.3 Version 1.0 (Public Launch) — Months 7-12
* **Focus**: Open the platform to the public and introduce career-aligned upskilling pathways.
* **Estimated Complexity**: `High`

| Attribute | Details |
| :--- | :--- |
| **Priorities** | 1. API integration for online learning catalogs (Coursera, Udemy, edX).<br>2. Skill Gap pathway generator algorithm.<br>3. Micro-credential badge issuance framework. |
| **Key Milestones** | - Public platform launch (iOS, Android, Web).<br>- API connections validated with 3 major learning providers.<br>- Successful pathway creation logic parsing 95% of target tech roles. |
| **Dependencies** | - **Technical**: Multi-provider course catalog indexing and vectorization.<br>- **Business**: Signing affiliate data sharing agreements with MOOC providers. |
| **Strategic Rationale** | Incentivizes continuous user engagement. By showing users the exact paths to fill skill gaps, we increase retention and unlock affiliate revenue. |

### 3.4 Version 1.5 (Growth Tier) — Months 13-18
* **Focus**: Introduce corporate recruiter tooling and skills-first sourcing search engines.
* **Estimated Complexity**: `High`

| Attribute | Details |
| :--- | :--- |
| **Priorities** | 1. Recruiter capability search dashboard.<br>2. Algorithmic candidate match indexing logic.<br>3. Blind recruitment mode UI toggles (strip personal metadata). |
| **Key Milestones** | - Closed recruiter pilot launch with 50 selected companies.<br>- Match Index algorithm processing queries in under 500ms.<br>- Blind mode verified for complete privacy masking. |
| **Dependencies** | - **Technical**: Rapid graph queries across 100k+ candidate profiles.<br>- **Business**: Feedback alignments with HR leaders to ensure search relevance. |
| **Strategic Rationale** | Activates Kirmya’s primary B2B value proposition. Companies can now bypass keyword screening in favor of pre-vetted capabilities. |

### 3.5 Version 2.0 (Validation Tier) — Months 19-24
* **Focus**: Launch premium AI-powered voice mock interviews and native custom assessments.
* **Estimated Complexity**: `Critical`

| Attribute | Details |
| :--- | :--- |
| **Priorities** | 1. Copilot Plus voice-streaming mock interview coach.<br>2. Custom assessment hosting dashboard for companies.<br>3. Automated cheating detection logic for tests. |
| **Key Milestones** | - Launch of Copilot Plus monthly subscription tier.<br>- Interactive voice chat latency stabilized below 800ms.<br>- Enterprise assessment suite live with native code sandbox environments. |
| **Dependencies** | - **Technical**: Real-time WebRTC audio streaming and LLM processing clusters.<br>- **Business**: Premium subscription billing integrations (Stripe). |
| **Strategic Rationale** | Drives high-margin consumer revenue and provides recruiters with localized, proprietary tests, minimizing platform cheating risks. |

### 3.6 Version 3.0 (Marketplace Launch) — Months 25-36
* **Focus**: Enable transactional freelance contract processing and escrow accounts.
* **Estimated Complexity**: `Critical`

| Attribute | Details |
| :--- | :--- |
| **Priorities** | 1. Escrow-backed milestone contract template systems.<br>2. Payment gateways for secure global fund holding.<br>3. Guild-led conflict mediation and dispute resolutions. |
| **Key Milestones** | - Freelance Marketplace launch.<br>- First escrow milestone transaction completed successfully.<br>- Dispute resolution protocol signed-off by legal and Guild boards. |
| **Dependencies** | - **Technical**: Multi-party payment integrations and automated payout triggers.<br>- **Business**: Compliance clearances for cross-border financial holding. |
| **Strategic Rationale** | Solidifies Kirmya as a complete economic ecosystem, enabling professionals to monetize their verified profiles directly on the platform at a fraction of legacy commission rates (2.5%). |

---

## 4. Five-Year Vision: Horizon Scale — Months 37-60

Following the execution of V3.0, Kirmya’s long-term scale targets the following horizons:

* **Decentralized Reputation Ledger (DRS)**: Porting candidate competency profiles and peer-reviews onto a private, cryptographic ledger. This allows candidates to possess portable, tamper-proof proof of their skills that they own, independent of Kirmya's database.
* **Offline Guild Hubs**: Licensing regional physical coworking and meetup spaces managed directly by top-ranking Guild chapters. These hubs bridge online community interactions with physical project collaborations.
* **Enterprise Operating System**: Integrating Kirmya’s skills graph natively into enterprise HR suites, serving as the default tool for internal talent mapping, promotions, and cross-department assignments.

---

## 5. Key Risk Factors for Roadmap Execution

```
+-----------------------------------+-----------------------------------+
| RISK CATEGORY                     | CRITICAL IMPACTS & MITIGATIONS     |
+-----------------------------------+-----------------------------------+
| LLM Infrastructure Costs          | Impact: High compute bills for the|
|                                   | AI Copilot squeeze profit margins.|
|                                   | Mitigation: Cache common queries, |
|                                   | utilize regional/local LLMs for   |
|                                   | basic tasks, cap daily free chats.|
+-----------------------------------+-----------------------------------+
| Regulatory Matching Compliance    | Impact: AI bias lawsuits or AEDT  |
|                                   | compliance fines (EU AI Act).     |
|                                   | Mitigation: Regular third-party   |
|                                   | algorithmic audits, keep matching |
|                                   | criteria strictly capability-first|
+-----------------------------------+-----------------------------------+
| Cold-Start Liquidity Failure      | Impact: Talent logs off due to lack|
|                                   | of jobs; recruiters leave due to  |
|                                   | lack of candidate volume.         |
|                                   | Mitigation: Seed initial Guilds in|
|                                   | tech hubs via bootcamp cohorts.   |
+-----------------------------------+-----------------------------------+
```

---

## 6. Approval Checkpoints

The Product Roadmap must be authorized by the leadership board before commencing MVP engineering tasks:

| Role | Department | Name | Date | Status / Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Executive Officer**| Executive Board | [Pending] | | `Awaiting Review` |
| **Chief Technology Officer**| Engineering | [Pending] | | `Awaiting Review` |
| **Product Director** | Product Strategy | [Pending] | | `Awaiting Review` |
| **Lead Developer** | Development Guild| [Pending] | | `Awaiting Review` |

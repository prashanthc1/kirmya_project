# Search Strategy: Kirmya Professional Ecosystem
**Document Identifier:** PL-PD-014 | **Status:** Draft / Pending Approval | **Version:** 1.0.0  
**Authors:** Antigravity AI & Search & Discovery Guild | **Date:** July 19, 2026

---

## Document Control & Meta-Information

### Version History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| `0.1.0` | 2026-07-19 | Antigravity AI | Initial draft outlining search architectures and rankings. |
| `1.0.0` | 2026-07-19 | Antigravity AI | Completed detailed specifications for all search indices, algorithms, filters, and vector AI search. |

---

## 1. Executive Summary

This document establishes the official **Search Strategy** for the **Kirmya Professional Ecosystem**. It provides details on search indexing configurations, ranking weights, filter/sort attributes, autocomplete mechanisms, synonym dictionaries, and future vector semantic AI search targets. These strategies are designed to deliver high-signal, capability-vetted results for candidates, jobs, companies, Guilds, and freelancers.

---

## 2. Search Portals & Indexes

Kirmya manages five specialized search portals, each mapping queries to target database collections:

### 2.1 People (Candidate) Search
* **Sourcing Type**: Capability-first sourcing.
* **Target Users**: Recruiters and Company Admins.
* **Search Index Fields**: Verified skill nodes, Decentralized Reputation Scores (DRS), portfolio commit metadata, and Guild review activities.
* **Privacy Controls**: Results render in **Anonymized Blind Mode**. Names, contact details, photos, and previous employer/school names are hidden until the candidate accepts an interview request.

### 2.2 Job Search
* **Sourcing Type**: Skills-matching job search.
* **Target Users**: Job Seekers and Freelancers.
* **Search Index Fields**: Required skills, target DRS levels, location (remoteness), GCC visa suitability (e.g. Golden Visa indicators), salary parameters.
* **Algorithm Match**: Matches job requirements directly with candidate profile capabilities, ranking results based on Match Index alignment.

### 2.3 Company Search
* **Sourcing Type**: Corporate brand search.
* **Target Users**: All registered users.
* **Search Index Fields**: Company name, sector/industry, active tech stack nodes, employee count, brand page activity, open job counts.

### 2.4 Community (Guild) Search
* **Sourcing Type**: Guild directory search.
* **Target Users**: All users (Guests can access public directories).
* **Search Index Fields**: Guild name, technical discipline slug, active discussion counts, pinned technical guides, open peer-review submissions.

### 2.5 Freelancer Search (Future Horizon - Phase 4)
* **Sourcing Type**: Project talent marketplace.
* **Target Users**: Hiring clients and Company Admins.
* **Search Index Fields**: Milestone delivery capabilities, regional freelance permit indicators, hourly/project rates, past dispute resolution rates, and client reviews.

---

## 3. Search Ranking Algorithm

Sourcing results are ranked dynamically to favor verified capabilities and community-approved contributions. The ranking scoring models are calculated as follows:

```
+-----------------------------------------------------------------------------+
|               CANDIDATE SEARCH RANKING SCORE ALGORITHM                      |
|                                                                             |
|  Total Score = (DRS * 0.40) + (PM * 0.30) + (GC * 0.20) + (GA * 0.10)       |
|                                                                             |
|  Where:                                                                     |
|    - DRS = Decentralized Reputation Score (Normalized 0-100)               |
|    - PM  = Portfolio Commits/Design Activity Metric                        |
|    - GC  = Guild Contribution Count (Approved peer reviews, articles)       |
|    - GA  = Geographic & Visa Alignment Match Ratio                          |
+-----------------------------------------------------------------------------+
```

### 3.1 Weight Descriptions
1. **DRS Level (40% Weight)**: Verified capabilities. High DRS levels in target skills heavily influence rank priority.
2. **Portfolio Activity (30% Weight)**: Frequency of updates (GitHub commits, Figma updates) within the last 90 days.
3. **Guild Contribution (20% Weight)**: Active participation (conducting peer reviews, writing technical documents) within the relevant Guild.
4. **Geographic Alignment (10% Weight)**: Proximity to position location, remote preferences, and GCC visa eligibility.

---

## 4. Filters & Sorting Parameters

To allow users to refine search feeds, directories enforce these configuration options:

### 4.1 Filter Matrices
* **Candidate Search (Recruiter View)**:
  - Required Skills (Linked to ontology graph nodes).
  - Minimum DRS Score (Range selector: 0 - 100).
  - Target Region (UAE, KSA, Qatar, Bahrain, Kuwait, Oman, Remote).
  - Visa Status (Golden Visa Eligible, Local Transferable, Requires sponsorship).
  - Freelance Permit verified (Yes/No).
* **Job Search (Candidate View)**:
  - Required Skills matching candidate profile.
  - Job Type (Full-time, Part-time, Contract, Internship).
  - Remoteness (Fully Remote, Hybrid, On-site).
  - Salary Range (Local currencies: AED, SAR, QAR).
  - Visa Eligibility (Explicit Golden Visa support indicators).

### 4.2 Sorting Options
* **Default**: Match Index (Skills alignment score descending).
* **Date**: Posted Date (Newest first).
* **DRS**: DRS Score (Highest first - recruiter view only).
* **Rate**: Salary/Project Rate (Lowest first / Highest first).

---

## 5. Query Processing Optimization

To minimize DB search latencies and handle bilingual GCC searches, queries pass through an optimization layer before index hit:

### 5.1 Edge Autocomplete
* **Mechanism**: Redis-cached prefix dictionaries hosted at edge CDN nodes.
* **Features**: Dynamic autocomplete suggestions as the user types, returning matched skill nodes, companies, or Guild slugs within **50ms**.

### 5.2 Bilingual Synonym Mapping
* The search parser translates and expands search queries using localized dictionaries, resolving regional differences:
  - English terms map to Arabic translations and vice-versa (e.g. `Developer` maps to `مطور`).
  - Professional equivalents map together (e.g. `SQL Server` maps to `RDBMS` and `Relational DB`).

```
                              [ SYNONYM BINDING ]
      +------------------+                    +--------------------+
      |  Query: "مطور"   | <================> |  Query: "Developer"|
      +------------------+                    +--------------------+
               |                                         |
               +-------------------+---------------------+
                                   |
                                   v
                      +--------------------------+
                      | Matches Skill Node:      |
                      | "Software Engineer"      |
                      +--------------------------+
```

---

## 6. Future AI-Powered Semantic Search (Phase 3.0)

Under the Version 3.0 roadmap, Kirmya will transition from traditional keyword indexing (Elasticsearch) to vector-space semantic matching:

* **Vector Database Stack**: Multi-field vector index using pgvector (PostgreSQL extension) for relational data and Pinecone for project portfolios.
* **Embeddings Model**: Candidate profiles, portfolios, and job postings are converted into dense vector arrays (using open-source models like `text-embedding-ada-002`).
* **Semantic Matchmaking**: Sourcing search prompts are translated from natural language (e.g. *"Find a backend programmer in Riyadh who has built payment systems"*) into vector queries. The system calculates the cosine similarity between the search prompt vector and candidate vectors, returning matches that capture user intent rather than literal keyword matches.

---

## 7. Approval Checkpoints

The Search Strategy must be approved by the Technical and Product boards before query routing configurations begin:

| Role | Department | Name | Date | Status / Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Technology Officer**| Engineering | [Pending] | | `Awaiting Review` |
| **Search Product Manager** | Product Strategy | [Pending] | | `Awaiting Review` |
| **Principal DB Architect** | Database Operations| [Pending] | | `Awaiting Review` |
| **Lead QA Architect** | Quality Assurance| [Pending] | | `Awaiting Review` |

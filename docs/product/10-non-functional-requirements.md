# Non-Functional Requirements: Kirmya Professional Ecosystem
**Document Identifier:** PL-PD-010 | **Status:** Draft / Pending Approval | **Version:** 1.0.0  
**Authors:** Antigravity AI & Technical Architecture Group | **Date:** July 19, 2026

---

## Document Control & Meta-Information

### Version History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| `0.1.0` | 2026-07-19 | Antigravity AI | Initial draft outlining architectural quality metrics. |
| `1.0.0` | 2026-07-19 | Antigravity AI | Completed detailed Non-Functional Requirements covering security, scale, accessibility, and disaster recovery. |

---

## 1. Executive Summary

This document establishes the official **Non-Functional Requirements (NFRs)** for the **Kirmya Professional Ecosystem**. It provides engineering and operations teams with the mandatory quantitative thresholds, security baselines, scalability limits, and accessibility standards required to support Kirmya's six ecosystem pillars. All architectural layouts, database indexing, infrastructure scaling configurations, and deployment pipelines must satisfy the specifications defined herein.

---

## 2. Non-Functional Specifications

### 2.1 Performance & Latency Requirements

```
                       [ PERFORMANCE TARGETS ]
  +-------------------------------------------------------------+
  |  Initial Page Load (LCP)      |  <= 2.0 seconds             |
  +-------------------------------+-----------------------------+
  |  Capability Search Queries    |  <= 500 milliseconds (P95)  |
  +-------------------------------+-----------------------------+
  |  AI Text Streaming (First-Tok)|  <= 1.0 second              |
  +-------------------------------+-----------------------------+
  |  AI Voice Mock Interview RTC  |  <= 800 milliseconds        |
  +-------------------------------+-----------------------------+
  |  API Endpoint Response Time   |  <= 200 milliseconds (P95)  |
  +-------------------------------------------------------------+
```

* **NFR-PER-001: Front-End Page Load**: The Largest Contentful Paint (LCP) for all public and authenticated web screens must load in under **2.0 seconds** under standard 4G mobile connection speeds.
* **NFR-PER-002: Sourcing Search Latency**: Sourcing queries executed via the Recruiter Capability Search Engine must return search results in under **500ms** (P95) for a database node density of up to 10 million candidate records.
* **NFR-PER-003: AI Text Copilot Latency**: Kirmya Copilot LLM recommendations must start streaming the first text token in under **1.0 second** from request submission.
* **NFR-PER-004: AI Voice Mock Interview Latency**: The WebRTC voice streaming coach must maintain an audio response latency below **800ms** to prevent conversational lag.
* **NFR-PER-005: Backend API Endpoint Latency**: Core transactional JSON REST/GraphQL endpoints must return payloads in under **200ms** (P95) under standard loads.

### 2.2 Availability & SLO Requirements
* **NFR-AV-001: System Uptime SLO**: The platform must achieve a monthly application service availability of **99.9%** (representing no more than 43.8 minutes of unscheduled downtime per month).
* **NFR-AV-002: Database Layer Availability**: The core database cluster (PostgreSQL + Neo4j) must achieve a monthly availability of **99.95%** using multi-zone replica configurations.
* **NFR-AV-003: Maintenance Windows**: Scheduled platform maintenance requiring database locks or system downtime must be performed during low-traffic windows (Sundays 01:00 to 03:00 GST) and announced 72 hours in advance.

### 2.3 Accessibility Requirements
* **NFR-ACC-001: WCAG Compliance**: The user interface (web and mobile) must conform to the **Web Content Accessibility Guidelines (WCAG) 2.1 Level AA** standards.
* **NFR-ACC-002: Color Contrast Ratios**: All text elements must maintain a minimum contrast ratio of **4.5:1** against their background (or **3:1** for large text sizes), with support for an optional high-contrast layout theme.
* **NFR-ACC-003: Keyboard Navigation**: All interactive components, forms, assessment widgets, and portfolio views must be fully navigable and executable using only keyboard inputs (Tab, Shift+Tab, Enter, Space, and Arrow keys).
* **NFR-ACC-004: Screen Reader Support**: Form inputs must possess explicit HTML `<label>` tags and ARIA (Accessible Rich Internet Applications) attributes to support screen readers (JAWS, NVDA, VoiceOver).

### 2.4 Scalability Requirements
* **NFR-SCA-001: Auto-Scaling Web Clusters**: Frontend and backend container services must utilize auto-scaling rules (Kubernetes HPA) triggered when CPU utilization exceeds 70% or memory utilization exceeds 80%.
* **NFR-SCA-002: Neo4j Graph Scalability**: The graph database layer must scale to support up to **50 million nodes** (representing users, companies, skills, and Guilds) and **500 million relationships** without query response degradation.
* **NFR-SCA-003: Vector Search Scalability**: The vector database (pgvector/Pinecone) must support indexing and querying up to **10 million portfolio embeddings**, returning nearest-neighbor match queries in under 150ms.
* **NFR-SCA-004: Connection Concurrency**: The system must handle up to **100,000 concurrent active WebSocket connections** for real-time messaging, notifications, and telemetry.

### 2.5 Maintainability & Code Quality Requirements
* **NFR-MNT-001: Code Test Coverage**: The backend codebase must maintain a minimum automated unit and integration test coverage of **80%**. CI/CD pipelines must block builds that drop below this threshold.
* **NFR-MNT-002: Code Complexity & Linting**: Codebases must undergo static analysis checking (e.g. ESLint, Golangci-lint, SonarQube). Cognitive complexity scores per function must remain below **15**.
* **NFR-MNT-003: API Specifications**: All backend APIs must be documented using **OpenAPI 3.0 (Swagger)** standards, with automatic UI documentation generation available at `/api/docs`.

### 2.6 Security & Compliance Requirements
* **NFR-SEC-001: Data Encryption**: 
  - In transit: All connections must enforce **TLS 1.3** encryption (with TLS 1.2 as minimum fallback).
  - At rest: All databases, backups, and cloud storage buckets must use **AES-256** encryption.
* **NFR-SEC-002: GDPR & Privacy-by-Design Compliance**:
  - The system must provide a user dashboard containing a self-service **"Request Data Export"** tool returning all user-associated table rows in JSON format.
  - Accounts requested for deletion must be purged using automated background worker queues within **72 hours**, leaving only anonymized nodes for graph database integrity.
* **NFR-SEC-003: Algorithmic Fair Sourcing Auditing**:
  - Sourcing search databases must maintain separate, read-only encrypted log logs tracking candidate match indexes and demographic categories.
  - The matching algorithms must undergo quarterly audits to ensure compliance with AEDT (Automated Employment Decision Tools) regulations (e.g. NYC Local Law 144 / EU AI Act).
* **NFR-SEC-004: Security Scanning**: CI/CD pipelines must include automated SAST (Static Application Security Testing) and dependency vulnerability scans, blocking builds containing vulnerabilities marked "High" or "Critical".

### 2.7 Localization Requirements
* **NFR-LOC-001: Bilingual Layout Support**: The platform must natively support Modern Standard Arabic (MSA), Gulf Arabic, and English.
* **NFR-LOC-002: Right-to-Left (RTL) Layouts**: The UI grid system must support dynamic RTL stylesheet switches when the language is set to Arabic. Focus indices, navigation menus, and text alignments must invert seamlessly.
* **NFR-LOC-003: Regional Formatting**: System validations must adapt to regional formats, supporting GCC phone number country codes, Arabic numeric displays, Hijri calendar options, and local currency (AED, SAR) formats.

### 2.8 Reliability Requirements
* **NFR-REL-001: Mean Time Between Failures (MTBF)**: The system target MTBF must exceed **1,200 hours** of continuous operation under production conditions.
* **NFR-REL-002: Mean Time to Repair (MTTR)**: System target MTTR must remain under **15 minutes** for Tier 1 severity incidents (complete platform outages) and under **60 minutes** for Tier 2 incidents (individual module degradation).
* **NFR-REL-003: Automated Retry Logic**: API integrations with third-party systems (e.g. Coursera APIs, SMTP gateways) must use automated retry logic with exponential backoff and circuit-breaker patterns to prevent cascading system failures.

### 2.9 Observability & Monitoring Requirements
* **NFR-OBS-001: OpenTelemetry Tracing**: All microservices must export unified logging and trace telemetry using **OpenTelemetry** protocols to a centralized APM system (e.g. Datadog, Grafana Tempo).
* **NFR-OBS-002: Core Metric Metrics**: Operations teams must collect and monitor key metrics:
  - System: CPU, memory, disk I/O, network bandwidth.
  - Application: Request rate (RPS), error rates (5xx codes), database connection pools, LLM API tokens.
* **NFR-OBS-003: Alert Classifications**: Monitoring tools must trigger alerts categorized by priority:
  - **P0 (Critical)**: Platform offline or core database cluster down. Triggers instant pager calls (PagerDuty) to on-call SRE teams.
  - **P1 (High)**: Individual module failure (e.g. Copilot API unreachable). Sends SMS/Slack alerts, requiring resolution within 4 hours.
  - **P2 (Medium)**: Slow query alerts (sourcing query >1s). Sends email/Slack alerts for backlog scheduling.

### 2.10 Disaster Recovery Requirements

```
        +------------------------------------------------------+
        | RPO (Recovery Point Objective)   |  <= 24 hours      |
        +----------------------------------+-------------------+
        | RTO (Recovery Time Objective)    |  <= 2 hours       |
        +------------------------------------------------------+
```

* **NFR-DR-001: Database Backups**: The system must run automated daily incremental backups of all relational, graph, and vector databases. Backups must be encrypted, verified for integrity weekly, and replicated across two geographically distinct cloud regions (e.g. UAE North and UAE East).
* **NFR-DR-002: RPO & RTO Targets**:
  - **RPO (Recovery Point Objective)**: Under a catastrophic failure, maximum database data loss must not exceed **24 hours**.
  - **RTO (Recovery Time Objective)**: The time required to restore platform operations from disaster backups must not exceed **2.0 hours**.
* **NFR-DR-003: Infrastructure as Code (IaC)**: Platform environments must be configured using Infrastructure as Code templates (e.g. Terraform) to ensure rapid, error-free environments reconstruction in secondary cloud zones.

---

## 3. Approval Checkpoints

These Non-Functional Requirements must be approved by the Technical and Operations Boards before cloud provisioning:

| Role | Department | Name | Date | Status / Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Technology Officer**| Engineering | [Pending] | | `Awaiting Review` |
| **Lead Infrastructure Architect**| Operations | [Pending] | | `Awaiting Review` |
| **Information Security Officer**| InfoSec & Legal | [Pending] | | `Awaiting Review` |
| **Lead QA Engineer** | Quality Assurance| [Pending] | | `Awaiting Review` |

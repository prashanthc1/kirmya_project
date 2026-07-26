# AI Vision & Technical Strategy: Kirmya Professional Ecosystem
**Document Identifier:** PL-PD-015 | **Status:** Draft / Pending Approval | **Version:** 1.0.0  
**Authors:** Antigravity AI & AI Engineering Guild | **Date:** July 19, 2026

---

## Document Control & Meta-Information

### Version History
| Version | Date | Author | Description |
| :--- | :--- | :--- | :--- |
| `0.1.0` | 2026-07-19 | Antigravity AI | Initial draft outlining AI architecture and core models. |
| `1.0.0` | 2026-07-19 | Antigravity AI | Completed detailed specifications for MVP vs future AI, Arabic voice pipelines, bias audits, and evaluation metrics. |

---

## 1. Executive Summary

This document establishes the official **AI Vision and Technical Strategy** for the **Kirmya Professional Ecosystem**. It provides details on the deployment of Machine Learning and Large Language Models (LLMs) across Kirmya's six pillars, detailing candidate profiling, recruiting sourcing, learning recommendations, and future marketplace contracts. All engineering frameworks, model pipelines, and regional compliance audits must align with these specifications.

---

## 2. Core AI Capabilities: MVP vs. Future Enhancements

Kirmya’s AI roadmap is structured in phases to ensure a stable MVP release while preparing for advanced semantic vector and voice features:

```
                            [ AI EVOLUTION ROADMAP ]
  +-------------------------------------------------------------+
  |  MVP Features            |  Future Enhancements (V2.0/V3.0) |
  +--------------------------+----------------------------------+
  |  - PDF Resume Parsing    |  - WebRTC Voice Interview Coach  |
  |  - Skill Graph Matching  |  - Trajectory Career Guidance    |
  |  - Skill-Gap Diagnostics |  - Semantic Sourcing Prompts     |
  |  - Text Mock Interview   |  - Escrow Code Commit Auditing   |
  +-------------------------------------------------------------+
```

### 2.1 Candidate Capabilities

#### 2.1.1 Resume Analysis & Profile Optimization
* **MVP Capability**:
  - Automatically parses uploaded PDF/Docx resumes and extracts structured JSON schemas containing skills, roles, projects, and educational events.
  - Generates optimization recommendations, flagging text inconsistencies and recommending additions to the candidate’s dynamic portfolio.
* **Future Enhancement**:
  - Contextual portfolio parsing that pulls repository code commits (GitHub) or layout designs (Figma), automatically linking them to specific capability nodes.

#### 2.1.2 Interview Preparation (Mock Coach)
* **MVP Capability**:
  - Text-based interactive chat mock interview coach. Candidates receive industry-specific technical questions based on target roles, with responses graded on technical accuracy and communication style.
* **Future Enhancement (V2.0)**:
  - Audio-streaming mock coach using WebRTC to conduct real-time voice interviews. Incorporates vocal analysis to evaluate communication pacing, speech clarity, and verbal filler counts.

#### 2.1.3 Career Guidance & Trajectory Forecasting
* **MVP Capability**: Not included.
* **Future Enhancement (V2.0)**:
  - AI Trajectory Planner that analyzes thousands of anonymous platform career paths to forecast multi-year progression routes for candidates, showing what target roles they can achieve by acquiring specific skill nodes.

### 2.2 Recruiter & ATS Capabilities

#### 2.2.1 ATS Capabilities Match Index
* **MVP Capability**:
  - Calculatess the candidate's **Match Index** score against job postings using strict ontological skill nodes and verified DRS levels, returning match percentages rather than keyword counts.
* **Future Enhancement (V3.0)**:
  - Automated redaction pipelines that redact potential demographic bias cues from cover letters or projects before recruiter delivery.

#### 2.2.2 Recruiter Sourcing Assistance
* **MVP Capability**:
  - Standard keyword and filter sourcing inputs mapping to the relational database.
* **Future Enhancement (V3.0)**:
  - **Conversational Sourcing Translator** that converts recruiter natural language prompts (e.g. *"Find a database designer in Dubai who has built microservices"*) into complex Neo4j Cypher and pgvector database queries.

### 2.3 Learning & Skill Gap Capabilities

#### 2.3.1 Skill-Gap Analysis & Course Recommendations
* **MVP Capability**:
  - Compares the candidate’s verified skill profile against the requirements of their target job post.
  - Flags missing skill nodes and generates a custom upskilling sequence, pulling and listing relevant courses from aggregated Udemy, Coursera, and edX API directories.
* **Future Enhancement (V2.0)**:
  - Dynamic path adjustments that update in real-time as the candidate completes new projects or verifies new DRS badges on Kirmya.

### 2.4 Freelance & Marketplace Capabilities

#### 2.4.1 Project Matching & Escrow Verification
* **MVP Capability**: Not included.
* **Future Enhancement (V3.0 - Phase 4)**:
  - **Code Commit Escrow Auditor**: Checks freelancer code repositories during milestone submissions, comparing the code deliverables with the contract's technical scope of work before flagging approval recommendations to client review dashboards.

---

## 3. Multilingual Arabic-English Pipelines

To address the GCC enterprise and public sectors, Kirmya implements bilingual voice and text processing pipelines:

```
                            [ BILINGUAL AI PIPELINE ]
  +--------------------------------------------------------------------------+
  |  English Inputs  |  LLM Translator / Dictionary  |  Arabic Layouts       |
  |  (JSON/GraphQL)  |  (OpenAI / Custom Models)     |  (RTL Grids)          |
  +------------------+-------------------------------+-----------------------+
  |  Arabic Speech   |  Whisper STT (Dialect Aware)  |  Text Analysis & LLM  |
  +--------------------------------------------------------------------------+
```

* **STT/TTS Pipeline**: The mock interview voice coach uses Whisper Speech-to-Text (STT) models fine-tuned on Gulf Arabic dialects, coupled with low-latency Text-to-Speech (TTS) models to deliver natural Arabic audio responses.
* **Local Language Parsing**: Custom dictionary adapters automatically translate technical synonyms (e.g. `مطور بايثون` maps directly to the `Python Developer` skill ontology node).

---

## 4. Responsible AI & Bias Mitigation Framework

To ensure ethical compliance with fair hiring rules (e.g. NYC Local Law 144 and the EU AI Act), Kirmya applies a strict mitigation policy:

* **Algorithmic Fair Sourcing Auditing**:
  - Sourcing search logs track candidate match indexes and demographic category distributions.
  - The matching algorithms undergo quarterly audits by third-party compliance firms to ensure candidate selection deviation scores remain within legally allowed boundaries.
* **Feature Access Boundaries**:
  - Demographic fields (Age, gender, nationality, photos, names) are completely excluded from entering the weights of matching models.

---

## 5. Privacy & Data Security Considerations

* **PII Redaction Pipeline**: Raw PDF resume files are parsed through a local, containerized PII redaction pipeline before the parsed skill arrays are stored in database logs.
* **Isolated Tenant Training**: Enterprise model fine-tuning must occur on isolated, tenant-specific compute clusters. Sourcing data from Company A is never used to train or optimize sourcing queries for Company B.
* **User Opt-Out Controls**: Candidates can opt out of algorithmic match indexing in `/settings`, restricting their profiles to manual search queries.

---

## 6. AI Performance & Evaluation Metrics

To monitor AI reliability, operations dashboards track these indicators:

| Metric Name | Dimension | MVP Target | Future (V2.0/3.0) Target |
| :--- | :--- | :--- | :--- |
| **Parsing Precision** | Resume analysis JSON output accuracy. | >= 90% accuracy | >= 95% accuracy |
| **Cosine Match Recall** | Vector similarity sourcing matching accuracy. | N/A | >= 88% recall |
| **Voice Audio Latency**| Real-time voice mock coach WebRTC latency. | N/A | <= 800 milliseconds |
| **AEDT Deviation Score**| Algorithm matching demographic selection bias. | Deviation <= 0.05 | Deviation <= 0.02 |
| **Recommendation CTR** | Candidate upskilling click-through rates. | >= 12% CTR | >= 20% CTR |

---

## 7. Approval Checkpoints

The AI Vision and Technical Strategy must be signed off by the Technical and Legal boards before model staging:

| Role | Department | Name | Date | Status / Signature |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Technology Officer**| Engineering | [Pending] | | `Awaiting Review` |
| **Head of AI Research** | AI Engineering | [Pending] | | `Awaiting Review` |
| **Lead Security Architect** | InfoSec & Legal | [Pending] | | `Awaiting Review` |
| **Lead QA Architect** | Quality Assurance| [Pending] | | `Awaiting Review` |

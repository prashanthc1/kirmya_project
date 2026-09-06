<!-- KIRMYA-AUDIT-RECONCILIATION-2026-09-05 -->
> **Current review addendum — 2026-09-05**
>
> Audited commit: `5f6790a95ae02d74666b668ab62e140d861424ec`. **Release verdict: HOLD for broad public launch; verified blockers remain.**
>
> This historical report is not re-certified for the current commit. Any original percentages, global PASS labels, absence-of-vulnerability claims, performance figures or restore timings require dated evidence before reuse. The current review is repository-wide automated screening plus focused source tracing and selected verification, not a complete manual review of every line.
>
> Relevant current findings: F20 (Audit scores and operational claims exceed their evidence).
>
> Evidence and acceptance criteria: [current audit](../../audit-review/reports/KIRMYA_AUDIT_REPORT_2026-09-05.md). Original content below is retained as historical context, not current sign-off.

---

# Kirmya AI Job Matching & Recommendation System Audit

## Executive Summary
This document audits the AI job matching architecture, candidate-to-job recommendation engine, recruiter candidate screening assistance, skill gap detection algorithm, explainability framework, and bias mitigation safeguards in Kirmya.

---

## 1. Multi-Vector Compatibility Scoring

```
                 Candidate Match Profile               Job Match Profile
                 ├── Normalized Skills                 ├── Required Skills
                 ├── Experience Level                  ├── Preferred Skills
                 ├── Work Mode Preference              ├── Experience Requirement
                 └── Location / Relocation             └── Work Mode & Location
                            │                                     │
                            └─────────────────┬───────────────────┘
                                              ▼
                             Weighted Scoring Engine (0-100%)
                              ├── Skills Overlap (40%)
                              ├── Experience Alignment (25%)
                              ├── Work Mode & Location (20%)
                              └── Industry & Role Match (15%)
```

---

## 2. Ethical Safeguards & Fairness
- **Zero Protected Attribute Usage**: Age, gender, ethnicity, disability, religion, and other protected personal characteristics are strictly excluded from feature extraction and ranking algorithms.
- **Human Decision Authority**: AI scores serve strictly as non-binding recommendations. Automated candidate rejection or hiring without human recruiter verification is prohibited.

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

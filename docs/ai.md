# Kirmya AI Career Intelligence, Recommendation Engine & AI Safety Architecture

## 1. Overview & Core Mission

Kirmya AI provides intelligent, transparent, and user-empowering career assistance. It aids candidates in closing skill gaps, tailoring resumes, and preparing for interviews, while helping recruiters discover qualified talent faster.

**Critical Policy**: AI in Kirmya is **strictly assistive and advisory**. AI models **never** make automated, binding hiring or rejection decisions, enforce algorithmic gatekeeping, or rank candidates based on protected demographic attributes.

---

## 2. Subsystem Architecture & Provider Flow

```
Client (Next.js / TypeScript / MUI v6)
        │ (JWT Authenticated Context)
        ▼
AI / Recommendation HTTP Handler (/api/v1/ai/..., /api/v1/recommendations/...)
        │
        ▼
Service Layer (Data Minimization & Prompt Sanitization)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
AI Provider (OpenAI / Claude)  Recommendation Engine         PostgreSQL Fallback
(Structured JSON Generation)   (Internal Skill Matrix / BM25) (Rule-Based Heuristics)
```

---

## 3. Data Minimization & Privacy Protection

Before dispatching prompts to external LLM providers:
1. **PII Redaction**: Full candidate names, residential addresses, personal phone numbers, and raw email addresses are stripped from prompt contexts.
2. **Credential Sanitization**: Passwords, API tokens, session keys, and billing IDs are stripped.
3. **Internal Note Shielding**: Recruiter private notes, scorecard evaluations, and internal Trust & Safety moderation histories are strictly excluded from AI prompt assembly.

---

## 4. Prompt Injection & Adversarial Content Defenses

- **Untrusted Input Boundary**: Resumes, portfolio project links, job descriptions, and user messages are treated as untrusted text inputs.
- **System Prompt Isolation**: System instructions and guardrails are demarcated from user input blocks.
- **Structured JSON Schema Enforcement**: Model outputs must conform to strict JSON schemas. Arbitrary text is rejected, preventing command injection or unauthorized tool invocations.

---

## 5. Assistive Human-in-the-Loop Principles

- **Transparent Match Scoring**: Job and candidate match scores ($0\text{--}100\%$) are computed from skill overlap, experience level, and preferred location with explainable breakdown factors.
- **Recruiter Autonomy**: Candidates are never automatically rejected by AI scores; final application progression requires human recruiter action.
- **Content Review**: All AI-tailored resume bullets and cover letter drafts require candidate review and explicit approval before submission.

---

## 6. REST API Endpoint Directory

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/resume/analyze` | AI resume ATS compliance & keyword scoring | Bearer Token |
| `POST` | `/api/v1/ai/skills/gap-analysis` | Career skill gap identification vs target role | Bearer Token |
| `POST` | `/api/v1/ai/career/guidance` | Personalized career trajectory suggestions | Bearer Token |
| `POST` | `/api/v1/ai/interview/generate-questions` | Role-tailored mock interview prep questions | Bearer Token |
| `GET` | `/api/v1/recommendations` | Personalized job and networking recommendations | Bearer Token |
| `POST` | `/api/v1/recommendations/feedback` | User feedback loop (`like`, `dislike`, `dismiss`) | Bearer Token |
| `PUT` | `/api/v1/recommendations/preferences` | Update recommendation preference criteria | Bearer Token |

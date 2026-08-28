# Kirmya AI Career Intelligence & Copilot Platform Architecture

## 1. AI Gateway & Context Orchestration Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                 Client AI Career Assistant (/copilot)       │
│        (MUI v6 Glassmorphic Chat, Memory & Action Cards)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Centralized Backend AI Gateway              │
│  (Auth Check, Context Minimization, Prompt Injection Filter)│
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
┌───────────────────────┐┌───────────┐┌───────────────────────┐
│  Career Copilot Agent ││Resume / JD││  Mock Interview Coach │
│  (Roadmap & Gaps)     ││ (Tailoring││   (STAR Framework)    │
└───────────────────────┘└───────────┘└───────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Provider Abstraction Adapter                 │
│         (Gemini 1.5/2.0, Claude 3.5, OpenAI GPT-4o)         │
└─────────────────────────────────────────────────────────────┘
```

# Kirmya AI Security, Prompt Injection & Data Isolation

## 1. Prompt Injection Defenses
- **Context Separation**: System prompts are strictly separated from user-provided job descriptions and candidate resumes.
- **Input Delimiting**: Untrusted input is fenced with boundary tokens and XML wrappers to prevent system command overrides.
- **Output Verification**: AI output schemas are validated against strict JSON schemas before ingestion into application pipelines.

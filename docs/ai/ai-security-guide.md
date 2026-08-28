# Kirmya AI Security, Prompt Injection & Guardrail Enforcement Manual

## 1. Prompt Injection Defenses & Output Guardrails
- **Input Sanitization**: Encapsulates untrusted candidate/job inputs in clear system boundary markers to prevent prompt jailbreaking.
- **Output Validation**: Structured JSON schema validation ensures returned payloads match strict expected types before frontend rendering.
- **Rate Limiting & Abuse Prevention**: Token-bucket throttling prevents automated LLM scraping and denial-of-service attempts.

# Kirmya AI Provider Abstraction & Model Configuration Guide

## 1. Provider Adapter Architecture
- **Unified Interface**: Golang `AIProvider` interface abstracts completions, structured JSON generation, and embeddings across backends.
- **Dynamic Configuration**: Switch seamlessly between Google Gemini, Anthropic Claude, OpenAI GPT-4o, or self-hosted Ollama/vLLM endpoints via server `.env`.
- **Zero API Key Leakage**: Provider credentials reside exclusively in server memory and are never exposed to clients.

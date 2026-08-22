# Kirmya Search Security & Anti-Scraping Defenses

## Anti-Abuse & Rate Limiting Controls

1. **Search Query Rate Limiting**: Caps search requests at 60 calls per minute per authenticated IP/user to prevent mass profile harvesting.
2. **Autocomplete Anti-Enumeration**: Search autocomplete responses require a minimum 2-character prefix and cap returned suggestions at 5 items.
3. **Structured OpenSearch Queries**: Raw user input strings are sanitized and passed through structured JSON builders to eliminate OpenSearch query syntax injection attacks.
4. **Max Page Size Hard Cap**: Enforces `pageSize <= 100` to prevent memory exhaustion from large result payload requests.

# Kirmya Profile Fields & Validation Catalog

## 1. Field Constraints & Validation

| Field | Max Length | Allowed Content | Validation Rule |
| :--- | :--- | :--- | :--- |
| `Headline` | 220 chars | Plain text | No script or raw HTML tags |
| `About` | 2,000 chars | Plain text / Markdown | BlueMonday sanitization |
| `Location` | 100 chars | City, State, Country | Format matching |
| `Industry` | 50 chars | Standard taxonomy | Taxonomy enum validation |
| `Website URL`| 255 chars | Safe HTTPS URLs | Regex URL verification (`https://...`) |

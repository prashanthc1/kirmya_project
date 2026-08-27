# Kirmya File Upload Security & Sandboxed Storage

## 1. Resume & Document Upload Safeguards
- **MIME & Magic Byte Verification**: Validates file headers against allowed formats (`PDF`, `DOCX`, `TXT`).
- **File Size Limits**: Hard limit of 5MB per resume file.
- **Filename Sanitization**: Uploaded files receive randomized UUID storage names, neutralizing path traversal attacks (`../`).
- **Pre-Signed Access**: Private documents are accessed solely via temporary 15-minute signed URLs.

# Kirmya File Upload Security, Antivirus & Magic Byte Validation Manual

## 1. File Upload Defense Pipeline
- **Magic Byte Inspection**: Verifies file signatures (PDF, DOCX, PNG, JPEG) against content headers to reject disguised executables.
- **Strict Size Ceilings**: Enforces a 10MB maximum ceiling for resume documents and a 5MB ceiling for profile avatars.
- **Non-Executable Storage**: Uploads are written to dedicated object storage buckets with execution permissions completely disabled.

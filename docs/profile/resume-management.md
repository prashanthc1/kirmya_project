# Kirmya Resume & CV Document Management

## 1. File Upload Requirements
- **Supported Formats**: PDF (`application/pdf`), DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
- **Maximum File Size**: 10 MB per document.
- **Max Active Resumes**: 5 resumes per user account.

---

## 2. Secure Access & Signed URLs
- Resumes are stored in private object storage buckets (`s3://kirmya-resumes/private/`).
- Downloads are served via 15-minute expiring cryptographically signed URLs after verifying recruiter/owner authorization.

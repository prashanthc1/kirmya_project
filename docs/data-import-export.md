# Kirmya Data Import, Export, Migration & Bulk Operations Guide

## 1. Overview
Kirmya provides enterprise-grade data management, data portability, CSV import, JSON/ZIP exports, and dry-run bulk operation capabilities with built-in security, formula injection protection, PII safeguards, and audit logging.

## 2. CSV Import Infrastructure
- **Supported Schemas**: Job Postings (`jobs`), Technical Skills (`skills`), Job Categories (`categories`), Platform Reference Data (`reference_data`).
- **Formula Injection Protection**: Any imported string starting with `=`, `+`, `-`, or `@` is automatically sanitized by prepending a single quote `'` to prevent spreadsheet code execution in Microsoft Excel / Google Sheets.
- **Dry-Run Preview**: Administrators can preview column detection, field mapping, validation errors, and duplicate row detection before committing any data to PostgreSQL.
- **Duplicate Strategies**:
  - `create_or_update`: Updates existing records matching unique keys or creates new entries.
  - `create_only`: Ignores existing matches and creates new entries.
  - `skip_duplicates`: Ignores duplicate rows and processes clean records.
  - `reject_duplicates`: Fails the entire import batch if any duplicate records exist.

## 3. Data Export Security
- **Format Options**: ZIP archive (multi-file JSON + CSV), CSV, or JSON.
- **Download Security**: All export packages are served via short-lived signed URL tokens with automatic 24-hour expiration. Public storage is never used.
- **PII Protection**: Administrative exports omit sensitive PII (emails, phone numbers, security tokens) by default unless requested with explicit `export.pii` RBAC authorization.

## 4. Bulk Operations & Dry-Run Safety
- Supported Operations: Bulk Status Update, Bulk Archive, Bulk Assignment, Bulk Moderation, Bulk Notification.
- Dry-Run Preview: Setting `isDryRun: true` returns exact target counts and expected state changes without modifying database records.

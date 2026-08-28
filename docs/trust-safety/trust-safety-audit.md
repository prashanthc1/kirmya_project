# Kirmya Trust & Safety Platform Audit

## Executive Summary
This document audits the Trust & Safety architecture, User/Content Reporting Pipelines, Fraud & Fake Job Detection, Moderation Desk, Progressive Restrictions, Account Suspensions, and Appeals Lifecycle across Kirmya.

---

## 1. Safety Ecosystem Overview
- **Multi-Entity Reporting Pipeline**: Users can report users, jobs, communities, posts, comments, direct messages, and organizations with controlled categorization (`Spam`, `Harassment`, `Scam`, `Fraud`, `Misleading`, `Illegal`).
- **Fraud Detection Engine**: Algorithmic scoring for advance-fee requests, credential theft, fake recruiter identities, and abnormal recruitment outreach velocity.
- **Progressive Enforcement State Machine**: `Warning` -> `Feature Restriction` (messaging/posting disabled) -> `Temporary Suspension` -> `Permanent Ban` with human-in-the-loop review for high-impact actions.
- **Fair & Independent Appeals**: Enforced 14-day appeal window reviewed by an independent Senior Moderator with complete audit trail.

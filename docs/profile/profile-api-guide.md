# Kirmya Profile & Resume Platform API Integration Guide

## 1. REST API Endpoints & Request Specifications
- **Authentication**: Endpoints under `/api/v1/profile/...` and `/api/v1/resumes/...` require verified Bearer JWT tokens.
- **Atomic Mutations**: Work experience, education, skills, and portfolio records are updated in transactional PostgreSQL routines.

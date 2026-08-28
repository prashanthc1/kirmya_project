# Kirmya Candidate Profile Developer Guide & API Contracts

## 1. Profile Service API Integration
- **Ownership Verification**: All profile update endpoints (`PUT /api/v1/profile/...`) require authenticated session context and strictly enforce user ownership.
- **Transactional Updates**: Section changes (Experience, Education, Skills) are written in atomic PostgreSQL transactions.

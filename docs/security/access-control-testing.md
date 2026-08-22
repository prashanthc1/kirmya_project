# Kirmya Access Control & Negative Security Test Plan

## 1. Negative Test Scenarios

| Test Case ID | Target Endpoint | Test Description | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-AUTHZ-01` | `GET /api/v1/applications/:id` | User B attempts to access User A's application ID | `HTTP 404 / 403` (IDOR Shield) |
| `TC-AUTHZ-02` | `POST /api/v1/jobs` | Standard job seeker attempts to create a job | `HTTP 403 Forbidden` |
| `TC-AUTHZ-03` | `GET /api/v1/admin/health` | Non-admin user calls admin health endpoint | `HTTP 403 Forbidden` |
| `TC-AUTHZ-04` | `POST /api/v1/communities/:id/pin` | Regular community member attempts to pin post | `HTTP 403 Forbidden` |
| `TC-AUTHZ-05` | `DELETE /api/v1/security/sessions/:id` | User B attempts to revoke User A's active session | `HTTP 403 / 404` |

## 2. Automated Test Execution
- Backend Integration Tests (`backend/test/integration/`) enforce negative authorization assertions across all routes.
- Command: `go test -v ./test/integration/...`

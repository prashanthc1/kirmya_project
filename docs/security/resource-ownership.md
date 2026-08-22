# Kirmya Resource Ownership & IDOR Protection Architecture

## 1. IDOR / BOLA Prevention Architecture
Insecure Direct Object Reference (IDOR) attacks are prevented by enforcing database query-level ownership checks (`WHERE id = $1 AND user_id = $2`) in the SQL repository layer.

```go
// Secure SQL Repository Scoping Pattern
func (r *applicationRepo) GetApplicationByID(ctx context.Context, appID string, userID string) (*models.Application, error) {
    var app models.Application
    err := r.pool.QueryRow(ctx, `
        SELECT id, job_id, user_id, status, created_at 
        FROM applications 
        WHERE id = $1 AND (user_id = $2 OR job_id IN (SELECT id FROM jobs WHERE recruiter_id = $2))
    `, appID, userID).Scan(&app.ID, &app.JobID, &app.UserID, &app.Status, &app.CreatedAt)
    if err != nil {
        return nil, ErrNotFoundOrForbidden // Generic error prevents enumeration
    }
    return &app, nil
}
```

## 2. Resource Scope Rules
- **Applications**: Accessible only by the applicant (`user_id = caller_id`) or the recruiter owning the associated job (`job_id IN recruiter_jobs`).
- **Messages**: Accessible only by confirmed participants of `conversation_id`.
- **DSAR Data Exports**: Accessible only by the authenticated data owner (`user_id = caller_id`).

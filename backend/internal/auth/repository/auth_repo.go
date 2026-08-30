package repository

import (
	"context"
	"errors"
	"sync"
	"time"

	"kirmya/internal/auth/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthRepository struct {
	db *pgxpool.Pool
	mu sync.RWMutex

	// In-memory fallbacks when DB pool is nil during unit testing
	memUsers         map[string]*models.User
	memSessions      map[string]*models.Session
	memVerifications map[string]*models.EmailVerification
	memAuditLogs     []*models.AuditLog
}

func NewAuthRepository(db *pgxpool.Pool) *AuthRepository {
	return &AuthRepository{
		db:               db,
		memUsers:         make(map[string]*models.User),
		memSessions:      make(map[string]*models.Session),
		memVerifications: make(map[string]*models.EmailVerification),
		memAuditLogs:     make([]*models.AuditLog, 0),
	}
}

// User methods
func (r *AuthRepository) CreateUser(ctx context.Context, u *models.User) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	if u.UUID == uuid.Nil {
		u.UUID = uuid.New()
	}
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	u.UpdatedAt = time.Now()

	if r.db != nil {
		query := `INSERT INTO users 
			(id, uuid, first_name, last_name, email, password_hash, email_verified, role_id, status, country, current_location, job_title, employment_status, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
		_, err := r.db.Exec(ctx, query,
			u.ID, u.UUID, u.FirstName, u.LastName, u.Email, u.PasswordHash,
			u.EmailVerified, u.RoleID, u.Status, u.Country, u.CurrentLocation,
			u.JobTitle, u.EmploymentStatus, u.CreatedAt, u.UpdatedAt,
		)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.memUsers[u.Email] = u
	return nil
}

// CreateProfile inserts a new profile record in PostgreSQL or memory
func (r *AuthRepository) CreateProfile(ctx context.Context, u *models.User) error {
	if r.db != nil {
		profileID := uuid.New()
		query := `INSERT INTO profiles (id, user_id, country, location, professional_status, job_title, profile_completion_percentage, created_at, updated_at)
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		          ON CONFLICT (user_id) DO NOTHING`
		_, _ = r.db.Exec(ctx, query, profileID, u.ID, u.Country, u.CurrentLocation, u.EmploymentStatus, u.JobTitle, 25, u.CreatedAt, u.UpdatedAt)
	}
	return nil
}

// CreateUserAccount wrapper for legacy support
func (r *AuthRepository) CreateUserAccount(ctx context.Context, u *models.UserAccount) error {
	return r.CreateUser(ctx, u)
}

func (r *AuthRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	if r.db != nil {
		u := &models.User{}
		query := `SELECT id, uuid, first_name, last_name, email, password_hash, email_verified, role_id, status, country, current_location, job_title, employment_status, created_at, updated_at
		          FROM users WHERE email = $1`
		err := r.db.QueryRow(ctx, query, email).Scan(
			&u.ID, &u.UUID, &u.FirstName, &u.LastName, &u.Email, &u.PasswordHash,
			&u.EmailVerified, &u.RoleID, &u.Status, &u.Country, &u.CurrentLocation,
			&u.JobTitle, &u.EmploymentStatus, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, errors.New("user not found")
			}
			return nil, err
		}
		return u, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if u, exists := r.memUsers[email]; exists {
		uCopy := *u
		return &uCopy, nil
	}
	return nil, errors.New("user not found")
}

func (r *AuthRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	if r.db != nil {
		u := &models.User{}
		query := `SELECT id, uuid, first_name, last_name, email, password_hash, email_verified, role_id, status, country, current_location, job_title, employment_status, created_at, updated_at
		          FROM users WHERE id = $1`
		err := r.db.QueryRow(ctx, query, id).Scan(
			&u.ID, &u.UUID, &u.FirstName, &u.LastName, &u.Email, &u.PasswordHash,
			&u.EmailVerified, &u.RoleID, &u.Status, &u.Country, &u.CurrentLocation,
			&u.JobTitle, &u.EmploymentStatus, &u.CreatedAt, &u.UpdatedAt,
		)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, errors.New("user not found")
			}
			return nil, err
		}
		return u, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.memUsers {
		if u.ID == id {
			uCopy := *u
			return &uCopy, nil
		}
	}
	return nil, errors.New("user not found")
}

func (r *AuthRepository) UpdateUser(ctx context.Context, u *models.User) error {
	u.UpdatedAt = time.Now().UTC()
	if r.db != nil {
		query := `
			UPDATE users SET
				first_name = $1, last_name = $2, country = $3, current_location = $4,
				job_title = $5, employment_status = $6, status = $7, updated_at = $8
			WHERE id = $9
		`
		ct, err := r.db.Exec(ctx, query,
			u.FirstName, u.LastName, u.Country, u.CurrentLocation,
			u.JobTitle, u.EmploymentStatus, u.Status, u.UpdatedAt, u.ID,
		)
		if err != nil {
			return err
		}
		if ct.RowsAffected() == 0 {
			return errors.New("user not found")
		}
		return nil
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	if _, exists := r.memUsers[u.Email]; exists {
		r.memUsers[u.Email] = u
		return nil
	}
	return errors.New("user not found")
}

func (r *AuthRepository) UpdateUserEmailVerified(ctx context.Context, id uuid.UUID) error {
	if r.db != nil {
		query := `UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $1`
		_, err := r.db.Exec(ctx, query, id)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	for _, u := range r.memUsers {
		if u.ID == id {
			u.EmailVerified = true
			u.UpdatedAt = time.Now()
		}
	}
	return nil
}

func (r *AuthRepository) UpdateUserPasswordHash(ctx context.Context, id uuid.UUID, passwordHash string) error {
	if r.db != nil {
		query := `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`
		_, err := r.db.Exec(ctx, query, passwordHash, id)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	for _, u := range r.memUsers {
		if u.ID == id {
			u.PasswordHash = passwordHash
			u.UpdatedAt = time.Now()
		}
	}
	return nil
}

// Session methods
func (r *AuthRepository) CreateSession(ctx context.Context, s *models.Session) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.CreatedAt.IsZero() {
		s.CreatedAt = time.Now()
	}

	if r.db != nil {
		query := `INSERT INTO sessions (id, user_id, refresh_token, ip_address, user_agent, expires_at, revoked_at, created_at)
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
		_, err := r.db.Exec(ctx, query, s.ID, s.UserID, s.RefreshToken, s.IPAddress, s.UserAgent, s.ExpiresAt, s.RevokedAt, s.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.memSessions[s.RefreshToken] = s
	return nil
}

func (r *AuthRepository) CreateRefreshToken(ctx context.Context, rt *models.RefreshToken) error {
	sess := &models.Session{
		ID:           rt.ID,
		UserID:       rt.UserID,
		RefreshToken: rt.Token,
		ExpiresAt:    rt.ExpiresAt,
		CreatedAt:    rt.CreatedAt,
	}
	if rt.IsRevoked {
		now := time.Now()
		sess.RevokedAt = &now
	}
	return r.CreateSession(ctx, sess)
}

func (r *AuthRepository) GetSessionByRefreshToken(ctx context.Context, tokenStr string) (*models.Session, error) {
	if r.db != nil {
		s := &models.Session{}
		query := `SELECT id, user_id, refresh_token, ip_address, user_agent, expires_at, revoked_at, created_at
		          FROM sessions WHERE refresh_token = $1`
		err := r.db.QueryRow(ctx, query, tokenStr).Scan(
			&s.ID, &s.UserID, &s.RefreshToken, &s.IPAddress, &s.UserAgent, &s.ExpiresAt, &s.RevokedAt, &s.CreatedAt,
		)
		if err == nil {
			return s, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if s, exists := r.memSessions[tokenStr]; exists {
		sCopy := *s
		return &sCopy, nil
	}
	return nil, errors.New("session not found")
}

func (r *AuthRepository) GetRefreshToken(ctx context.Context, tokenStr string) (*models.RefreshToken, error) {
	sess, err := r.GetSessionByRefreshToken(ctx, tokenStr)
	if err != nil {
		return nil, err
	}
	return &models.RefreshToken{
		ID:        sess.ID,
		UserID:    sess.UserID,
		Token:     sess.RefreshToken,
		ExpiresAt: sess.ExpiresAt,
		CreatedAt: sess.CreatedAt,
		IsRevoked: sess.RevokedAt != nil,
	}, nil
}

func (r *AuthRepository) RevokeSession(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	if r.db != nil {
		query := `UPDATE sessions SET revoked_at = $1 WHERE id = $2`
		_, err := r.db.Exec(ctx, query, now, id)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	for _, s := range r.memSessions {
		if s.ID == id {
			s.RevokedAt = &now
		}
	}
	return nil
}

func (r *AuthRepository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	return r.RevokeSession(ctx, id)
}

func (r *AuthRepository) RevokeAllUserSessions(ctx context.Context, userID uuid.UUID) error {
	now := time.Now()
	if r.db != nil {
		query := `UPDATE sessions SET revoked_at = $1 WHERE user_id = $2`
		_, err := r.db.Exec(ctx, query, now, userID)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	for _, s := range r.memSessions {
		if s.UserID == userID {
			s.RevokedAt = &now
		}
	}
	return nil
}

func (r *AuthRepository) RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error {
	return r.RevokeAllUserSessions(ctx, userID)
}

// Email Verification methods
func (r *AuthRepository) CreateEmailVerification(ctx context.Context, ev *models.EmailVerification) error {
	if ev.ID == uuid.Nil {
		ev.ID = uuid.New()
	}
	if ev.CreatedAt.IsZero() {
		ev.CreatedAt = time.Now()
	}

	if r.db != nil {
		query := `INSERT INTO email_verifications (id, user_id, token, expires_at, created_at)
		          VALUES ($1, $2, $3, $4, $5)`
		_, err := r.db.Exec(ctx, query, ev.ID, ev.UserID, ev.Token, ev.ExpiresAt, ev.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.memVerifications[ev.Token] = ev
	return nil
}

func (r *AuthRepository) GetEmailVerification(ctx context.Context, token string) (*models.EmailVerification, error) {
	if r.db != nil {
		ev := &models.EmailVerification{}
		query := `SELECT id, user_id, token, expires_at, created_at FROM email_verifications WHERE token = $1`
		err := r.db.QueryRow(ctx, query, token).Scan(&ev.ID, &ev.UserID, &ev.Token, &ev.ExpiresAt, &ev.CreatedAt)
		if err == nil {
			return ev, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if ev, exists := r.memVerifications[token]; exists {
		evCopy := *ev
		return &evCopy, nil
	}
	return nil, errors.New("verification token not found")
}

func (r *AuthRepository) DeleteEmailVerification(ctx context.Context, id uuid.UUID) error {
	if r.db != nil {
		query := `DELETE FROM email_verifications WHERE id = $1`
		_, err := r.db.Exec(ctx, query, id)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	for token, ev := range r.memVerifications {
		if ev.ID == id {
			delete(r.memVerifications, token)
		}
	}
	return nil
}

// Audit Log methods
func (r *AuthRepository) CreateAuditLog(ctx context.Context, al *models.AuditLog) error {
	if al.ID == uuid.Nil {
		al.ID = uuid.New()
	}
	if al.CreatedAt.IsZero() {
		al.CreatedAt = time.Now()
	}

	if r.db != nil {
		query := `INSERT INTO audit_logs (id, user_id, action, ip_address, created_at)
		          VALUES ($1, $2, $3, $4, $5)`
		_, _ = r.db.Exec(ctx, query, al.ID, al.UserID, al.Action, al.IPAddress, al.CreatedAt)
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.memAuditLogs = append(r.memAuditLogs, al)
	return nil
}

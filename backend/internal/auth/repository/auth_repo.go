package repository

import (
	"context"
	"errors"
	"sync"
	"time"

	"kirmya/internal/auth/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthRepository struct {
	db *pgxpool.Pool
	mu sync.RWMutex

	users  map[string]*models.UserAccount
	tokens map[uuid.UUID]*models.RefreshToken
}

func NewAuthRepository(db *pgxpool.Pool) *AuthRepository {
	return &AuthRepository{
		db:     db,
		users:  make(map[string]*models.UserAccount),
		tokens: make(map[uuid.UUID]*models.RefreshToken),
	}
}

func (r *AuthRepository) CreateUserAccount(ctx context.Context, u *models.UserAccount) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	if u.CreatedAt.IsZero() {
		u.CreatedAt = time.Now()
	}
	u.UpdatedAt = time.Now()

	if r.db != nil {
		query := `INSERT INTO usr_accounts (id, email, password_hash, is_active, created_at, updated_at)
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.db.Exec(ctx, query, u.ID, u.Email, u.PasswordHash, u.IsActive, u.CreatedAt, u.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.users[u.Email] = u
	return nil
}

func (r *AuthRepository) GetUserByEmail(ctx context.Context, email string) (*models.UserAccount, error) {
	if r.db != nil {
		u := &models.UserAccount{}
		query := `SELECT id, email, password_hash, is_active, created_at, updated_at 
		          FROM usr_accounts WHERE email = $1`
		err := r.db.QueryRow(ctx, query, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
		if err == nil {
			return u, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	if u, exists := r.users[email]; exists {
		uCopy := *u
		return &uCopy, nil
	}
	return nil, errors.New("user not found")
}

func (r *AuthRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.UserAccount, error) {
	if r.db != nil {
		u := &models.UserAccount{}
		query := `SELECT id, email, password_hash, is_active, created_at, updated_at 
		          FROM usr_accounts WHERE id = $1`
		err := r.db.QueryRow(ctx, query, id).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
		if err == nil {
			return u, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.users {
		if u.ID == id {
			uCopy := *u
			return &uCopy, nil
		}
	}
	return nil, errors.New("user not found")
}

func (r *AuthRepository) CreateRefreshToken(ctx context.Context, rt *models.RefreshToken) error {
	if rt.ID == uuid.Nil {
		rt.ID = uuid.New()
	}
	if rt.CreatedAt.IsZero() {
		rt.CreatedAt = time.Now()
	}

	if r.db != nil {
		query := `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at, is_revoked)
		          VALUES ($1, $2, $3, $4, $5, $6)`
		_, err := r.db.Exec(ctx, query, rt.ID, rt.UserID, rt.Token, rt.ExpiresAt, rt.CreatedAt, rt.IsRevoked)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.tokens[rt.ID] = rt
	return nil
}

func (r *AuthRepository) GetRefreshToken(ctx context.Context, tokenStr string) (*models.RefreshToken, error) {
	if r.db != nil {
		rt := &models.RefreshToken{}
		query := `SELECT id, user_id, token, expires_at, created_at, is_revoked 
		          FROM refresh_tokens WHERE token = $1`
		err := r.db.QueryRow(ctx, query, tokenStr).Scan(&rt.ID, &rt.UserID, &rt.Token, &rt.ExpiresAt, &rt.CreatedAt, &rt.IsRevoked)
		if err == nil {
			return rt, nil
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, rt := range r.tokens {
		if rt.Token == tokenStr {
			rtCopy := *rt
			return &rtCopy, nil
		}
	}
	return nil, errors.New("refresh token not found")
}

func (r *AuthRepository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	if r.db != nil {
		query := `UPDATE refresh_tokens SET is_revoked = true WHERE id = $1`
		_, err := r.db.Exec(ctx, query, id)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	if rt, exists := r.tokens[id]; exists {
		rt.IsRevoked = true
	}
	return nil
}

func (r *AuthRepository) RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error {
	if r.db != nil {
		query := `UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1`
		_, err := r.db.Exec(ctx, query, userID)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	for _, rt := range r.tokens {
		if rt.UserID == userID {
			rt.IsRevoked = true
		}
	}
	return nil
}

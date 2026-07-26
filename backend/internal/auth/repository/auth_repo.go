package repository

import (
	"context"
	"errors"
	"kirmya/internal/auth/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthRepository struct {
	db *pgxpool.Pool
}

func NewAuthRepository(db *pgxpool.Pool) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) CreateUserAccount(ctx context.Context, u *models.UserAccount) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO usr_accounts (id, email, password_hash, is_active, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, u.ID, u.Email, u.PasswordHash, u.IsActive, u.CreatedAt, u.UpdatedAt)
	return err
}

func (r *AuthRepository) GetUserByEmail(ctx context.Context, email string) (*models.UserAccount, error) {
	if r.db == nil {
		return nil, errors.New("database connection unavailable")
	}
	u := &models.UserAccount{}
	query := `SELECT id, email, password_hash, is_active, created_at, updated_at 
	          FROM usr_accounts WHERE email = $1`
	err := r.db.QueryRow(ctx, query, email).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return u, nil
}

func (r *AuthRepository) GetUserByID(ctx context.Context, id uuid.UUID) (*models.UserAccount, error) {
	if r.db == nil {
		return nil, errors.New("database connection unavailable")
	}
	u := &models.UserAccount{}
	query := `SELECT id, email, password_hash, is_active, created_at, updated_at 
	          FROM usr_accounts WHERE id = $1`
	err := r.db.QueryRow(ctx, query, id).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return u, nil
}

func (r *AuthRepository) CreateRefreshToken(ctx context.Context, rt *models.RefreshToken) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at, is_revoked)
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, rt.ID, rt.UserID, rt.Token, rt.ExpiresAt, rt.CreatedAt, rt.IsRevoked)
	return err
}

func (r *AuthRepository) GetRefreshToken(ctx context.Context, tokenStr string) (*models.RefreshToken, error) {
	if r.db == nil {
		return nil, errors.New("database connection unavailable")
	}
	rt := &models.RefreshToken{}
	query := `SELECT id, user_id, token, expires_at, created_at, is_revoked 
	          FROM refresh_tokens WHERE token = $1`
	err := r.db.QueryRow(ctx, query, tokenStr).Scan(&rt.ID, &rt.UserID, &rt.Token, &rt.ExpiresAt, &rt.CreatedAt, &rt.IsRevoked)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("refresh token not found")
		}
		return nil, err
	}
	return rt, nil
}

func (r *AuthRepository) RevokeRefreshToken(ctx context.Context, id uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1", id)
	return err
}

func (r *AuthRepository) RevokeAllUserTokens(ctx context.Context, userID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1", userID)
	return err
}

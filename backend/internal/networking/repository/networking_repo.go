package repository

import (
	"context"
	"errors"
	"kirmya/internal/networking/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NetworkingRepository struct {
	db *pgxpool.Pool
}

func NewNetworkingRepository(db *pgxpool.Pool) *NetworkingRepository {
	return &NetworkingRepository{db: db}
}

// Connection Requests
func (r *NetworkingRepository) CreateRequest(ctx context.Context, req *models.ConnectionRequest) error {
	query := `INSERT INTO connection_requests (id, sender_id, receiver_id, status, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = 'pending', updated_at = CURRENT_TIMESTAMP`
	_, err := r.db.Exec(ctx, query, req.ID, req.SenderID, req.ReceiverID, req.Status, req.CreatedAt, req.UpdatedAt)
	return err
}

func (r *NetworkingRepository) UpdateRequestStatus(ctx context.Context, requestID uuid.UUID, status string) error {
	_, err := r.db.Exec(ctx, "UPDATE connection_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", status, requestID)
	return err
}

func (r *NetworkingRepository) GetRequest(ctx context.Context, requestID uuid.UUID) (*models.ConnectionRequest, error) {
	req := &models.ConnectionRequest{}
	err := r.db.QueryRow(ctx, "SELECT id, sender_id, receiver_id, status, created_at, updated_at FROM connection_requests WHERE id = $1", requestID).Scan(
		&req.ID, &req.SenderID, &req.ReceiverID, &req.Status, &req.CreatedAt, &req.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return req, nil
}

func (r *NetworkingRepository) ListIncomingRequests(ctx context.Context, receiverID uuid.UUID) ([]models.ConnectionRequest, error) {
	rows, err := r.db.Query(ctx, `SELECT id, sender_id, receiver_id, status, created_at, updated_at 
	                             FROM connection_requests WHERE receiver_id = $1 AND status = 'pending' ORDER BY created_at DESC`, receiverID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ConnectionRequest
	for rows.Next() {
		var req models.ConnectionRequest
		err := rows.Scan(&req.ID, &req.SenderID, &req.ReceiverID, &req.Status, &req.CreatedAt, &req.UpdatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, req)
	}
	return list, nil
}

// Connections
func (r *NetworkingRepository) CreateConnection(ctx context.Context, c *models.Connection) error {
	query := `INSERT INTO connections (id, user_id_1, user_id_2, created_at) 
	          VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(ctx, query, c.ID, c.UserID1, c.UserID2, c.CreatedAt)
	return err
}

func (r *NetworkingRepository) ListConnections(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := r.db.Query(ctx, `SELECT user_id_2 FROM connections WHERE user_id_1 = $1 
	                             UNION 
	                             SELECT user_id_1 FROM connections WHERE user_id_2 = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []uuid.UUID
	for rows.Next() {
		var uID uuid.UUID
		if err := rows.Scan(&uID); err != nil {
			return nil, err
		}
		list = append(list, uID)
	}
	return list, nil
}

// Privacy Blocks
func (r *NetworkingRepository) CreateBlock(ctx context.Context, b *models.BlockedUser) error {
	query := `INSERT INTO blocked_users (id, blocker_id, blocked_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(ctx, query, b.ID, b.BlockerID, b.BlockedID, b.CreatedAt)
	return err
}

func (r *NetworkingRepository) DeleteBlock(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2", blockerID, blockedID)
	return err
}

func (r *NetworkingRepository) IsBlocked(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) (bool, error) {
	var count int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM blocked_users 
	                          WHERE (blocker_id = $1 AND blocked_id = $2) 
	                             OR (blocker_id = $2 AND blocked_id = $1)`, blockerID, blockedID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *NetworkingRepository) GetConnectionPair(ctx context.Context, u1 uuid.UUID, u2 uuid.UUID) (*models.Connection, error) {
	var c models.Connection
	err := r.db.QueryRow(ctx, `SELECT id, user_id_1, user_id_2, created_at FROM connections 
	                          WHERE (user_id_1 = $1 AND user_id_2 = $2) 
	                             OR (user_id_1 = $2 AND user_id_2 = $1)`, u1, u2).Scan(&c.ID, &c.UserID1, &c.UserID2, &c.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &c, nil
}

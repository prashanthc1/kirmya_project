package repository

import (
	"context"
	"errors"
	"kirmya/internal/community/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CommunityRepository struct {
	db *pgxpool.Pool
}

func NewCommunityRepository(db *pgxpool.Pool) *CommunityRepository {
	return &CommunityRepository{db: db}
}

// Communities
func (r *CommunityRepository) Create(ctx context.Context, c *models.Community) error {
	query := `INSERT INTO communities (id, title, description, category, location, is_private, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.Exec(ctx, query, c.ID, c.Title, c.Description, c.Category, c.Location, c.IsPrivate, c.CreatedAt, c.UpdatedAt)
	return err
}

func (r *CommunityRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Community, error) {
	c := &models.Community{}
	err := r.db.QueryRow(ctx, "SELECT id, title, description, category, location, is_private, created_at, updated_at FROM communities WHERE id = $1", id).Scan(
		&c.ID, &c.Title, &c.Description, &c.Category, &c.Location, &c.IsPrivate, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return c, nil
}

func (r *CommunityRepository) List(ctx context.Context, category string, location string) ([]models.Community, error) {
	var rows pgx.Rows
	var err error

	if category != "" && location != "" {
		rows, err = r.db.Query(ctx, "SELECT id, title, description, category, location, is_private, created_at, updated_at FROM communities WHERE category = $1 AND location = $2 ORDER BY title ASC", category, location)
	} else if category != "" {
		rows, err = r.db.Query(ctx, "SELECT id, title, description, category, location, is_private, created_at, updated_at FROM communities WHERE category = $1 ORDER BY title ASC", category)
	} else if location != "" {
		rows, err = r.db.Query(ctx, "SELECT id, title, description, category, location, is_private, created_at, updated_at FROM communities WHERE location = $1 ORDER BY title ASC", location)
	} else {
		rows, err = r.db.Query(ctx, "SELECT id, title, description, category, location, is_private, created_at, updated_at FROM communities ORDER BY title ASC")
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Community
	for rows.Next() {
		var c models.Community
		err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.Category, &c.Location, &c.IsPrivate, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

// Memberships
func (r *CommunityRepository) CreateMember(ctx context.Context, m *models.CommunityMember) error {
	query := `INSERT INTO community_members (id, community_id, user_id, role_name, status, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          ON CONFLICT (community_id, user_id) DO NOTHING`
	_, err := r.db.Exec(ctx, query, m.ID, m.CommunityID, m.UserID, m.RoleName, m.Status, m.CreatedAt)
	return err
}

func (r *CommunityRepository) UpdateMemberStatus(ctx context.Context, communityID uuid.UUID, userID uuid.UUID, status string) error {
	_, err := r.db.Exec(ctx, "UPDATE community_members SET status = $1 WHERE community_id = $2 AND user_id = $3", status, communityID, userID)
	return err
}

func (r *CommunityRepository) UpdateMemberRole(ctx context.Context, communityID uuid.UUID, userID uuid.UUID, roleName string) error {
	_, err := r.db.Exec(ctx, "UPDATE community_members SET role_name = $1 WHERE community_id = $2 AND user_id = $3", roleName, communityID, userID)
	return err
}

func (r *CommunityRepository) GetMember(ctx context.Context, communityID uuid.UUID, userID uuid.UUID) (*models.CommunityMember, error) {
	m := &models.CommunityMember{}
	err := r.db.QueryRow(ctx, "SELECT id, community_id, user_id, role_name, status, created_at FROM community_members WHERE community_id = $1 AND user_id = $2", communityID, userID).Scan(
		&m.ID, &m.CommunityID, &m.UserID, &m.RoleName, &m.Status, &m.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return m, nil
}

func (r *CommunityRepository) DeleteMember(ctx context.Context, communityID uuid.UUID, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM community_members WHERE community_id = $1 AND user_id = $2", communityID, userID)
	return err
}

func (r *CommunityRepository) ListPendingRequests(ctx context.Context, communityID uuid.UUID) ([]models.CommunityMember, error) {
	rows, err := r.db.Query(ctx, `SELECT id, community_id, user_id, role_name, status, created_at 
	                             FROM community_members WHERE community_id = $1 AND status = 'pending' ORDER BY created_at ASC`, communityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CommunityMember
	for rows.Next() {
		var m models.CommunityMember
		err := rows.Scan(&m.ID, &m.CommunityID, &m.UserID, &m.RoleName, &m.Status, &m.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

// Posts
func (r *CommunityRepository) CreatePost(ctx context.Context, p *models.CommunityPost) error {
	query := `INSERT INTO community_posts (id, community_id, user_id, content, created_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, p.ID, p.CommunityID, p.UserID, p.Content, p.CreatedAt)
	return err
}

func (r *CommunityRepository) ListPosts(ctx context.Context, communityID uuid.UUID) ([]models.CommunityPost, error) {
	rows, err := r.db.Query(ctx, `SELECT id, community_id, user_id, content, created_at FROM community_posts WHERE community_id = $1 ORDER BY created_at DESC`, communityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CommunityPost
	for rows.Next() {
		var p models.CommunityPost
		err := rows.Scan(&p.ID, &p.CommunityID, &p.UserID, &p.Content, &p.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *CommunityRepository) DeletePost(ctx context.Context, postID uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM community_posts WHERE id = $1", postID)
	return err
}

// Reports
func (r *CommunityRepository) CreateReport(ctx context.Context, rep *models.CommunityReport) error {
	query := `INSERT INTO community_reports (id, post_id, reporter_id, reason, is_resolved, created_at) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, rep.ID, rep.PostID, rep.ReporterID, rep.Reason, rep.IsResolved, rep.CreatedAt)
	return err
}

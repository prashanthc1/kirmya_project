package repository

import (
	"context"
	"errors"
	"strings"
	"sync"
	"time"

	"kirmya/internal/community/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type CommunityRepository struct {
	db *pgxpool.Pool

	mu                sync.RWMutex
	communities       map[uuid.UUID]*models.Community
	members           map[string]*models.CommunityMember // key: "communityID:userID"
	invites           map[uuid.UUID]*models.CommunityInvite
	posts             map[uuid.UUID]*models.CommunityPost
	comments          map[uuid.UUID]*models.CommunityComment
	events            map[uuid.UUID]*models.CommunityEvent
	resources         map[uuid.UUID]*models.CommunityResource
	moderationActions map[uuid.UUID]*models.CommunityModerationAction
	reports           map[uuid.UUID]*models.CommunityReport
}

func NewCommunityRepository(db *pgxpool.Pool) *CommunityRepository {
	return &CommunityRepository{
		db:                db,
		communities:       make(map[uuid.UUID]*models.Community),
		members:           make(map[string]*models.CommunityMember),
		invites:           make(map[uuid.UUID]*models.CommunityInvite),
		posts:             make(map[uuid.UUID]*models.CommunityPost),
		comments:          make(map[uuid.UUID]*models.CommunityComment),
		events:            make(map[uuid.UUID]*models.CommunityEvent),
		resources:         make(map[uuid.UUID]*models.CommunityResource),
		moderationActions: make(map[uuid.UUID]*models.CommunityModerationAction),
		reports:           make(map[uuid.UUID]*models.CommunityReport),
	}
}

// helper for member key
func memberKey(communityID, userID uuid.UUID) string {
	return communityID.String() + ":" + userID.String()
}

// --- Communities ---

func (r *CommunityRepository) Create(ctx context.Context, c *models.Community) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.communities[c.ID] = c

	if r.db == nil {
		return nil
	}

	query := `INSERT INTO communities 
		(id, title, description, category, location, visibility, is_private, logo_url, cover_image_url, rules, topics, skills, owner_id, member_count, post_count, created_at, updated_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`
	_, err := r.db.Exec(ctx, query,
		c.ID, c.Title, c.Description, c.Category, c.Location, c.Visibility, c.IsPrivate,
		c.LogoUrl, c.CoverImageUrl, c.Rules, c.Topics, c.Skills, c.OwnerID,
		c.MemberCount, c.PostCount, c.CreatedAt, c.UpdatedAt,
	)
	return err
}

func (r *CommunityRepository) Update(ctx context.Context, c *models.Community) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	c.UpdatedAt = time.Now()
	r.communities[c.ID] = c

	if r.db == nil {
		return nil
	}

	query := `UPDATE communities 
		SET title=$1, description=$2, category=$3, location=$4, visibility=$5, is_private=$6, 
		    logo_url=$7, cover_image_url=$8, rules=$9, topics=$10, skills=$11, updated_at=$12 
		WHERE id=$13`
	_, err := r.db.Exec(ctx, query,
		c.Title, c.Description, c.Category, c.Location, c.Visibility, c.IsPrivate,
		c.LogoUrl, c.CoverImageUrl, c.Rules, c.Topics, c.Skills, c.UpdatedAt, c.ID,
	)
	return err
}

func (r *CommunityRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Community, error) {
	r.mu.RLock()
	c, exists := r.communities[id]
	r.mu.RUnlock()

	if exists {
		return c, nil
	}

	if r.db == nil {
		return nil, nil
	}

	c = &models.Community{}
	err := r.db.QueryRow(ctx, `SELECT id, title, description, category, location, visibility, is_private, 
		logo_url, cover_image_url, rules, topics, skills, owner_id, member_count, post_count, created_at, updated_at 
		FROM communities WHERE id = $1`, id).Scan(
		&c.ID, &c.Title, &c.Description, &c.Category, &c.Location, &c.Visibility, &c.IsPrivate,
		&c.LogoUrl, &c.CoverImageUrl, &c.Rules, &c.Topics, &c.Skills, &c.OwnerID,
		&c.MemberCount, &c.PostCount, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	r.mu.Lock()
	r.communities[c.ID] = c
	r.mu.Unlock()

	return c, nil
}

func (r *CommunityRepository) List(ctx context.Context, params models.CommunityFilterParams) ([]models.Community, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.Community
	if r.db == nil {
		for _, c := range r.communities {
			if params.Category != "" && !strings.EqualFold(c.Category, params.Category) {
				continue
			}
			if params.Location != "" && !strings.EqualFold(c.Location, params.Location) {
				continue
			}
			if params.Visibility != "" && !strings.EqualFold(c.Visibility, params.Visibility) {
				continue
			}
			list = append(list, *c)
		}
		return list, nil
	}

	query := `SELECT id, title, description, category, location, visibility, is_private, 
		logo_url, cover_image_url, rules, topics, skills, owner_id, member_count, post_count, created_at, updated_at 
		FROM communities WHERE 1=1`
	var args []interface{}
	argIdx := 1

	if params.Category != "" {
		query += ` AND category = $` + string(rune('0'+argIdx))
		args = append(args, params.Category)
		argIdx++
	}
	if params.Location != "" {
		query += ` AND location = $` + string(rune('0'+argIdx))
		args = append(args, params.Location)
		argIdx++
	}
	if params.Visibility != "" {
		query += ` AND visibility = $` + string(rune('0'+argIdx))
		args = append(args, params.Visibility)
		argIdx++
	}
	query += ` ORDER BY title ASC`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var c models.Community
		err := rows.Scan(
			&c.ID, &c.Title, &c.Description, &c.Category, &c.Location, &c.Visibility, &c.IsPrivate,
			&c.LogoUrl, &c.CoverImageUrl, &c.Rules, &c.Topics, &c.Skills, &c.OwnerID,
			&c.MemberCount, &c.PostCount, &c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *CommunityRepository) Search(ctx context.Context, queryStr string, params models.CommunityFilterParams) ([]models.Community, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	q := strings.ToLower(queryStr)
	var result []models.Community

	if r.db == nil {
		for _, c := range r.communities {
			match := q == "" || strings.Contains(strings.ToLower(c.Title), q) || strings.Contains(strings.ToLower(c.Description), q)
			if !match {
				for _, topic := range c.Topics {
					if strings.Contains(strings.ToLower(topic), q) {
						match = true
						break
					}
				}
			}
			if !match {
				for _, skill := range c.Skills {
					if strings.Contains(strings.ToLower(skill), q) {
						match = true
						break
					}
				}
			}

			if match {
				if params.Category != "" && !strings.EqualFold(c.Category, params.Category) {
					continue
				}
				if params.Location != "" && !strings.EqualFold(c.Location, params.Location) {
					continue
				}
				result = append(result, *c)
			}
		}
		return result, nil
	}

	sqlQuery := `SELECT id, title, description, category, location, visibility, is_private, 
		logo_url, cover_image_url, rules, topics, skills, owner_id, member_count, post_count, created_at, updated_at 
		FROM communities WHERE (LOWER(title) LIKE $1 OR LOWER(description) LIKE $1) ORDER BY title ASC`

	pattern := "%" + q + "%"
	rows, err := r.db.Query(ctx, sqlQuery, pattern)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var c models.Community
		err := rows.Scan(
			&c.ID, &c.Title, &c.Description, &c.Category, &c.Location, &c.Visibility, &c.IsPrivate,
			&c.LogoUrl, &c.CoverImageUrl, &c.Rules, &c.Topics, &c.Skills, &c.OwnerID,
			&c.MemberCount, &c.PostCount, &c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		result = append(result, c)
	}
	return result, nil
}

func (r *CommunityRepository) IncrementMemberCount(ctx context.Context, communityID uuid.UUID, delta int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if c, exists := r.communities[communityID]; exists {
		c.MemberCount += delta
		if c.MemberCount < 0 {
			c.MemberCount = 0
		}
	}

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "UPDATE communities SET member_count = GREATEST(0, member_count + $1) WHERE id = $2", delta, communityID)
	return err
}

func (r *CommunityRepository) IncrementPostCount(ctx context.Context, communityID uuid.UUID, delta int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if c, exists := r.communities[communityID]; exists {
		c.PostCount += delta
		if c.PostCount < 0 {
			c.PostCount = 0
		}
	}

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "UPDATE communities SET post_count = GREATEST(0, post_count + $1) WHERE id = $2", delta, communityID)
	return err
}

// --- Memberships ---

func (r *CommunityRepository) CreateMember(ctx context.Context, m *models.CommunityMember) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := memberKey(m.CommunityID, m.UserID)
	r.members[key] = m

	if r.db == nil {
		return nil
	}

	query := `INSERT INTO community_members (id, community_id, user_id, role_name, status, joined_at, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6, $7) 
	          ON CONFLICT (community_id, user_id) DO UPDATE SET role_name = EXCLUDED.role_name, status = EXCLUDED.status`
	_, err := r.db.Exec(ctx, query, m.ID, m.CommunityID, m.UserID, m.RoleName, m.Status, m.JoinedAt, m.CreatedAt)
	return err
}

func (r *CommunityRepository) UpdateMemberStatus(ctx context.Context, communityID uuid.UUID, userID uuid.UUID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := memberKey(communityID, userID)
	if m, exists := r.members[key]; exists {
		m.Status = status
		if status == "active" && m.JoinedAt.IsZero() {
			m.JoinedAt = time.Now()
		}
	}

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "UPDATE community_members SET status = $1 WHERE community_id = $2 AND user_id = $3", status, communityID, userID)
	return err
}

func (r *CommunityRepository) UpdateMemberRole(ctx context.Context, communityID uuid.UUID, userID uuid.UUID, roleName string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := memberKey(communityID, userID)
	if m, exists := r.members[key]; exists {
		m.RoleName = roleName
	}

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "UPDATE community_members SET role_name = $1 WHERE community_id = $2 AND user_id = $3", roleName, communityID, userID)
	return err
}

func (r *CommunityRepository) GetMember(ctx context.Context, communityID uuid.UUID, userID uuid.UUID) (*models.CommunityMember, error) {
	r.mu.RLock()
	key := memberKey(communityID, userID)
	m, exists := r.members[key]
	r.mu.RUnlock()

	if exists {
		return m, nil
	}

	if r.db == nil {
		return nil, nil
	}

	m = &models.CommunityMember{}
	err := r.db.QueryRow(ctx, "SELECT id, community_id, user_id, role_name, status, joined_at, created_at FROM community_members WHERE community_id = $1 AND user_id = $2", communityID, userID).Scan(
		&m.ID, &m.CommunityID, &m.UserID, &m.RoleName, &m.Status, &m.JoinedAt, &m.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	r.mu.Lock()
	r.members[key] = m
	r.mu.Unlock()

	return m, nil
}

func (r *CommunityRepository) ListMembers(ctx context.Context, communityID uuid.UUID) ([]models.CommunityMember, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.CommunityMember
	if r.db == nil {
		for _, m := range r.members {
			if m.CommunityID == communityID && m.Status == "active" {
				list = append(list, *m)
			}
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, `SELECT id, community_id, user_id, role_name, status, joined_at, created_at 
		FROM community_members WHERE community_id = $1 AND status = 'active' ORDER BY joined_at DESC`, communityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var m models.CommunityMember
		err := rows.Scan(&m.ID, &m.CommunityID, &m.UserID, &m.RoleName, &m.Status, &m.JoinedAt, &m.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *CommunityRepository) DeleteMember(ctx context.Context, communityID uuid.UUID, userID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	key := memberKey(communityID, userID)
	delete(r.members, key)

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "DELETE FROM community_members WHERE community_id = $1 AND user_id = $2", communityID, userID)
	return err
}

func (r *CommunityRepository) ListPendingRequests(ctx context.Context, communityID uuid.UUID) ([]models.CommunityMember, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.CommunityMember
	if r.db == nil {
		for _, m := range r.members {
			if m.CommunityID == communityID && m.Status == "pending" {
				list = append(list, *m)
			}
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, `SELECT id, community_id, user_id, role_name, status, joined_at, created_at 
	                             FROM community_members WHERE community_id = $1 AND status = 'pending' ORDER BY created_at ASC`, communityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var m models.CommunityMember
		err := rows.Scan(&m.ID, &m.CommunityID, &m.UserID, &m.RoleName, &m.Status, &m.JoinedAt, &m.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

// --- Invites ---

func (r *CommunityRepository) CreateInvite(ctx context.Context, inv *models.CommunityInvite) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.invites[inv.ID] = inv

	if r.db == nil {
		return nil
	}

	query := `INSERT INTO community_invites (id, community_id, inviter_id, invited_user_id, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, inv.ID, inv.CommunityID, inv.InviterID, inv.InvitedUserID, inv.Status, inv.CreatedAt)
	return err
}

func (r *CommunityRepository) GetInviteByID(ctx context.Context, inviteID uuid.UUID) (*models.CommunityInvite, error) {
	r.mu.RLock()
	inv, exists := r.invites[inviteID]
	r.mu.RUnlock()

	if exists {
		return inv, nil
	}

	if r.db == nil {
		return nil, nil
	}

	inv = &models.CommunityInvite{}
	err := r.db.QueryRow(ctx, "SELECT id, community_id, inviter_id, invited_user_id, status, created_at FROM community_invites WHERE id = $1", inviteID).Scan(
		&inv.ID, &inv.CommunityID, &inv.InviterID, &inv.InvitedUserID, &inv.Status, &inv.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	r.mu.Lock()
	r.invites[inv.ID] = inv
	r.mu.Unlock()

	return inv, nil
}

func (r *CommunityRepository) UpdateInviteStatus(ctx context.Context, inviteID uuid.UUID, status string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if inv, exists := r.invites[inviteID]; exists {
		inv.Status = status
	}

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "UPDATE community_invites SET status = $1 WHERE id = $2", status, inviteID)
	return err
}

func (r *CommunityRepository) ListInvitesForUser(ctx context.Context, userID uuid.UUID) ([]models.CommunityInvite, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.CommunityInvite
	if r.db == nil {
		for _, inv := range r.invites {
			if inv.InvitedUserID == userID {
				list = append(list, *inv)
			}
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, "SELECT id, community_id, inviter_id, invited_user_id, status, created_at FROM community_invites WHERE invited_user_id = $1 ORDER BY created_at DESC", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var inv models.CommunityInvite
		err := rows.Scan(&inv.ID, &inv.CommunityID, &inv.InviterID, &inv.InvitedUserID, &inv.Status, &inv.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, inv)
	}
	return list, nil
}

// --- Posts / Discussions ---

func (r *CommunityRepository) CreatePost(ctx context.Context, p *models.CommunityPost) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.posts[p.ID] = p

	if r.db == nil {
		return nil
	}

	query := `INSERT INTO community_posts 
		(id, community_id, user_id, title, content, is_pinned, is_locked, is_announcement, tags, comment_count, reactions_count, created_at, user_name, user_avatar) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`
	_, err := r.db.Exec(ctx, query,
		p.ID, p.CommunityID, p.UserID, p.Title, p.Content,
		p.IsPinned, p.IsLocked, p.IsAnnouncement, p.Tags,
		p.CommentCount, p.ReactionsCount, p.CreatedAt, p.UserName, p.UserAvatar,
	)
	return err
}

func (r *CommunityRepository) GetPostByID(ctx context.Context, postID uuid.UUID) (*models.CommunityPost, error) {
	r.mu.RLock()
	p, exists := r.posts[postID]
	r.mu.RUnlock()

	if exists {
		return p, nil
	}

	if r.db == nil {
		return nil, nil
	}

	p = &models.CommunityPost{}
	err := r.db.QueryRow(ctx, `SELECT id, community_id, user_id, title, content, is_pinned, is_locked, 
		is_announcement, tags, comment_count, reactions_count, created_at, user_name, user_avatar 
		FROM community_posts WHERE id = $1`, postID).Scan(
		&p.ID, &p.CommunityID, &p.UserID, &p.Title, &p.Content,
		&p.IsPinned, &p.IsLocked, &p.IsAnnouncement, &p.Tags,
		&p.CommentCount, &p.ReactionsCount, &p.CreatedAt, &p.UserName, &p.UserAvatar,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	r.mu.Lock()
	r.posts[p.ID] = p
	r.mu.Unlock()

	return p, nil
}

func (r *CommunityRepository) UpdatePost(ctx context.Context, p *models.CommunityPost) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.posts[p.ID] = p

	if r.db == nil {
		return nil
	}

	query := `UPDATE community_posts 
		SET title=$1, content=$2, is_pinned=$3, is_locked=$4, is_announcement=$5, tags=$6 
		WHERE id=$7`
	_, err := r.db.Exec(ctx, query, p.Title, p.Content, p.IsPinned, p.IsLocked, p.IsAnnouncement, p.Tags, p.ID)
	return err
}

func (r *CommunityRepository) DeletePost(ctx context.Context, postID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.posts, postID)

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "DELETE FROM community_posts WHERE id = $1", postID)
	return err
}

func (r *CommunityRepository) ListPosts(ctx context.Context, communityID uuid.UUID) ([]models.CommunityPost, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.CommunityPost
	if r.db == nil {
		for _, p := range r.posts {
			if p.CommunityID == communityID {
				list = append(list, *p)
			}
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, `SELECT id, community_id, user_id, title, content, is_pinned, is_locked, 
		is_announcement, tags, comment_count, reactions_count, created_at, user_name, user_avatar 
		FROM community_posts WHERE community_id = $1 ORDER BY is_pinned DESC, created_at DESC`, communityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var p models.CommunityPost
		err := rows.Scan(
			&p.ID, &p.CommunityID, &p.UserID, &p.Title, &p.Content,
			&p.IsPinned, &p.IsLocked, &p.IsAnnouncement, &p.Tags,
			&p.CommentCount, &p.ReactionsCount, &p.CreatedAt, &p.UserName, &p.UserAvatar,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *CommunityRepository) SetPinned(ctx context.Context, postID uuid.UUID, isPinned bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if p, exists := r.posts[postID]; exists {
		p.IsPinned = isPinned
	}

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "UPDATE community_posts SET is_pinned = $1 WHERE id = $2", isPinned, postID)
	return err
}

func (r *CommunityRepository) SetLocked(ctx context.Context, postID uuid.UUID, isLocked bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if p, exists := r.posts[postID]; exists {
		p.IsLocked = isLocked
	}

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "UPDATE community_posts SET is_locked = $1 WHERE id = $2", isLocked, postID)
	return err
}

func (r *CommunityRepository) SetAnnouncement(ctx context.Context, postID uuid.UUID, isAnnouncement bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if p, exists := r.posts[postID]; exists {
		p.IsAnnouncement = isAnnouncement
	}

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "UPDATE community_posts SET is_announcement = $1 WHERE id = $2", isAnnouncement, postID)
	return err
}

// --- Comments ---

func (r *CommunityRepository) CreateComment(ctx context.Context, comment *models.CommunityComment) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.comments[comment.ID] = comment
	if p, exists := r.posts[comment.PostID]; exists {
		p.CommentCount++
	}

	if r.db == nil {
		return nil
	}

	query := `INSERT INTO community_comments (id, post_id, community_id, user_id, content, user_name, user_avatar, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.Exec(ctx, query,
		comment.ID, comment.PostID, comment.CommunityID, comment.UserID,
		comment.Content, comment.UserName, comment.UserAvatar, comment.CreatedAt,
	)
	if err == nil {
		_, _ = r.db.Exec(ctx, "UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = $1", comment.PostID)
	}
	return err
}

func (r *CommunityRepository) ListComments(ctx context.Context, postID uuid.UUID) ([]models.CommunityComment, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.CommunityComment
	if r.db == nil {
		for _, c := range r.comments {
			if c.PostID == postID {
				list = append(list, *c)
			}
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, `SELECT id, post_id, community_id, user_id, content, user_name, user_avatar, created_at 
		FROM community_comments WHERE post_id = $1 ORDER BY created_at ASC`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var c models.CommunityComment
		err := rows.Scan(&c.ID, &c.PostID, &c.CommunityID, &c.UserID, &c.Content, &c.UserName, &c.UserAvatar, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

// --- Events ---

func (r *CommunityRepository) CreateEvent(ctx context.Context, event *models.CommunityEvent) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.events[event.ID] = event

	if r.db == nil {
		return nil
	}

	query := `INSERT INTO community_events 
		(id, community_id, title, description, scheduled_at, location, meeting_url, organized_by_id, attendee_count, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
	_, err := r.db.Exec(ctx, query,
		event.ID, event.CommunityID, event.Title, event.Description,
		event.ScheduledAt, event.Location, event.MeetingUrl, event.OrganizedByID,
		event.AttendeeCount, event.CreatedAt,
	)
	return err
}

func (r *CommunityRepository) GetEventByID(ctx context.Context, eventID uuid.UUID) (*models.CommunityEvent, error) {
	r.mu.RLock()
	ev, exists := r.events[eventID]
	r.mu.RUnlock()

	if exists {
		return ev, nil
	}

	if r.db == nil {
		return nil, nil
	}

	ev = &models.CommunityEvent{}
	err := r.db.QueryRow(ctx, `SELECT id, community_id, title, description, scheduled_at, location, meeting_url, organized_by_id, attendee_count, created_at 
		FROM community_events WHERE id = $1`, eventID).Scan(
		&ev.ID, &ev.CommunityID, &ev.Title, &ev.Description,
		&ev.ScheduledAt, &ev.Location, &ev.MeetingUrl, &ev.OrganizedByID,
		&ev.AttendeeCount, &ev.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	r.mu.Lock()
	r.events[ev.ID] = ev
	r.mu.Unlock()

	return ev, nil
}

func (r *CommunityRepository) ListEvents(ctx context.Context, communityID uuid.UUID) ([]models.CommunityEvent, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.CommunityEvent
	if r.db == nil {
		for _, e := range r.events {
			if e.CommunityID == communityID {
				list = append(list, *e)
			}
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, `SELECT id, community_id, title, description, scheduled_at, location, meeting_url, organized_by_id, attendee_count, created_at 
		FROM community_events WHERE community_id = $1 ORDER BY scheduled_at ASC`, communityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var ev models.CommunityEvent
		err := rows.Scan(
			&ev.ID, &ev.CommunityID, &ev.Title, &ev.Description,
			&ev.ScheduledAt, &ev.Location, &ev.MeetingUrl, &ev.OrganizedByID,
			&ev.AttendeeCount, &ev.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, ev)
	}
	return list, nil
}

func (r *CommunityRepository) DeleteEvent(ctx context.Context, eventID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.events, eventID)

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "DELETE FROM community_events WHERE id = $1", eventID)
	return err
}

// --- Resources ---

func (r *CommunityRepository) CreateResource(ctx context.Context, resource *models.CommunityResource) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.resources[resource.ID] = resource

	if r.db == nil {
		return nil
	}

	query := `INSERT INTO community_resources (id, community_id, title, url, category, shared_by_id, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query,
		resource.ID, resource.CommunityID, resource.Title,
		resource.Url, resource.Category, resource.SharedByID, resource.CreatedAt,
	)
	return err
}

func (r *CommunityRepository) GetResourceByID(ctx context.Context, resourceID uuid.UUID) (*models.CommunityResource, error) {
	r.mu.RLock()
	res, exists := r.resources[resourceID]
	r.mu.RUnlock()

	if exists {
		return res, nil
	}

	if r.db == nil {
		return nil, nil
	}

	res = &models.CommunityResource{}
	err := r.db.QueryRow(ctx, `SELECT id, community_id, title, url, category, shared_by_id, created_at 
		FROM community_resources WHERE id = $1`, resourceID).Scan(
		&res.ID, &res.CommunityID, &res.Title, &res.Url, &res.Category, &res.SharedByID, &res.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	r.mu.Lock()
	r.resources[res.ID] = res
	r.mu.Unlock()

	return res, nil
}

func (r *CommunityRepository) ListResources(ctx context.Context, communityID uuid.UUID) ([]models.CommunityResource, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.CommunityResource
	if r.db == nil {
		for _, res := range r.resources {
			if res.CommunityID == communityID {
				list = append(list, *res)
			}
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, `SELECT id, community_id, title, url, category, shared_by_id, created_at 
		FROM community_resources WHERE community_id = $1 ORDER BY created_at DESC`, communityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var res models.CommunityResource
		err := rows.Scan(&res.ID, &res.CommunityID, &res.Title, &res.Url, &res.Category, &res.SharedByID, &res.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, res)
	}
	return list, nil
}

func (r *CommunityRepository) DeleteResource(ctx context.Context, resourceID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.resources, resourceID)

	if r.db == nil {
		return nil
	}

	_, err := r.db.Exec(ctx, "DELETE FROM community_resources WHERE id = $1", resourceID)
	return err
}

// --- Moderation & Audit Log ---

func (r *CommunityRepository) CreateModerationAction(ctx context.Context, act *models.CommunityModerationAction) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.moderationActions[act.ID] = act

	if r.db == nil {
		return nil
	}

	query := `INSERT INTO community_moderation_actions (id, community_id, moderator_id, target_user_id, action, reason, created_at) 
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query, act.ID, act.CommunityID, act.ModeratorID, act.TargetUserID, act.Action, act.Reason, act.CreatedAt)
	return err
}

func (r *CommunityRepository) ListModerationActions(ctx context.Context, communityID uuid.UUID) ([]models.CommunityModerationAction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.CommunityModerationAction
	if r.db == nil {
		for _, act := range r.moderationActions {
			if act.CommunityID == communityID {
				list = append(list, *act)
			}
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, `SELECT id, community_id, moderator_id, target_user_id, action, reason, created_at 
		FROM community_moderation_actions WHERE community_id = $1 ORDER BY created_at DESC`, communityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var act models.CommunityModerationAction
		err := rows.Scan(&act.ID, &act.CommunityID, &act.ModeratorID, &act.TargetUserID, &act.Action, &act.Reason, &act.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, act)
	}
	return list, nil
}

func (r *CommunityRepository) CreateReport(ctx context.Context, rep *models.CommunityReport) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.reports[rep.ID] = rep

	if r.db == nil {
		return nil
	}

	query := `INSERT INTO community_reports (id, post_id, reporter_id, reason, is_resolved, created_at) VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.db.Exec(ctx, query, rep.ID, rep.PostID, rep.ReporterID, rep.Reason, rep.IsResolved, rep.CreatedAt)
	return err
}

func (r *CommunityRepository) ListReports(ctx context.Context, communityID uuid.UUID) ([]models.CommunityReport, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []models.CommunityReport
	if r.db == nil {
		for _, rep := range r.reports {
			if post, exists := r.posts[rep.PostID]; exists && post.CommunityID == communityID {
				list = append(list, *rep)
			}
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, `SELECT r.id, r.post_id, r.reporter_id, r.reason, r.is_resolved, r.created_at 
		FROM community_reports r JOIN community_posts p ON r.post_id = p.id 
		WHERE p.community_id = $1 ORDER BY r.created_at DESC`, communityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var rep models.CommunityReport
		err := rows.Scan(&rep.ID, &rep.PostID, &rep.ReporterID, &rep.Reason, &rep.IsResolved, &rep.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, rep)
	}
	return list, nil
}

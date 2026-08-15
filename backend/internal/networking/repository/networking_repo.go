package repository

import (
	"context"
	"errors"
	"fmt"
	"kirmya/internal/networking/models"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NetworkingRepository struct {
	db       *pgxpool.Pool
	mu       sync.RWMutex
	conns    map[string]*models.Connection
	notes    map[string]*models.ConnectionNote
	labels   map[string][]models.ConnectionLabel
	goals    map[string]*models.NetworkingGoal
	follows  map[string]bool
	requests map[string]*models.ConnectionRequest
}

func (r *NetworkingRepository) lazyInit() {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.conns == nil {
		r.conns = make(map[string]*models.Connection)
	}
	if r.notes == nil {
		r.notes = make(map[string]*models.ConnectionNote)
	}
	if r.labels == nil {
		r.labels = make(map[string][]models.ConnectionLabel)
	}
	if r.goals == nil {
		r.goals = make(map[string]*models.NetworkingGoal)
	}
	if r.follows == nil {
		r.follows = make(map[string]bool)
	}
	if r.requests == nil {
		r.requests = make(map[string]*models.ConnectionRequest)
	}
}

func NewNetworkingRepository(db *pgxpool.Pool) *NetworkingRepository {
	r := &NetworkingRepository{db: db}
	r.lazyInit()
	return r
}


// Connection Requests
func (r *NetworkingRepository) CreateRequest(ctx context.Context, req *models.ConnectionRequest) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		r.requests[req.ID.String()] = req
		pairKey := req.SenderID.String() + ":" + req.ReceiverID.String()
		r.requests[pairKey] = req
		return nil
	}
	query := `INSERT INTO connection_requests (id, sender_id, receiver_id, status, created_at, updated_at) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = 'pending', updated_at = CURRENT_TIMESTAMP`
	_, err := r.db.Exec(ctx, query, req.ID, req.SenderID, req.ReceiverID, req.Status, req.CreatedAt, req.UpdatedAt)
	if err != nil {
		return err
	}

	if req.Note != "" {
		noteQuery := `INSERT INTO connection_request_notes (id, request_id, note, created_at)
		              VALUES ($1, $2, $3, $4)
		              ON CONFLICT (request_id) DO UPDATE SET note = $3`
		_, _ = r.db.Exec(ctx, noteQuery, uuid.New(), req.ID, req.Note, req.CreatedAt)
	}

	return nil
}

func (r *NetworkingRepository) UpdateRequestStatus(ctx context.Context, requestID uuid.UUID, status string) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		if req, ok := r.requests[requestID.String()]; ok {
			req.Status = status
		}
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE connection_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", status, requestID)
	return err
}

func (r *NetworkingRepository) GetRequest(ctx context.Context, requestID uuid.UUID) (*models.ConnectionRequest, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		if req, ok := r.requests[requestID.String()]; ok {
			return req, nil
		}
		return nil, nil
	}
	req := &models.ConnectionRequest{}
	query := `SELECT cr.id, cr.sender_id, cr.receiver_id, cr.status, COALESCE(crn.note, ''), cr.created_at, cr.updated_at 
	          FROM connection_requests cr
	          LEFT JOIN connection_request_notes crn ON crn.request_id = cr.id
	          WHERE cr.id = $1`
	err := r.db.QueryRow(ctx, query, requestID).Scan(
		&req.ID, &req.SenderID, &req.ReceiverID, &req.Status, &req.Note, &req.CreatedAt, &req.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return req, nil
}

func (r *NetworkingRepository) GetPendingRequestBetween(ctx context.Context, senderID, receiverID uuid.UUID) (*models.ConnectionRequest, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		k1 := senderID.String() + ":" + receiverID.String()
		if req, ok := r.requests[k1]; ok && req.Status == "pending" {
			return req, nil
		}
		k2 := receiverID.String() + ":" + senderID.String()
		if req, ok := r.requests[k2]; ok && req.Status == "pending" {
			return req, nil
		}
		return nil, nil
	}
	req := &models.ConnectionRequest{}
	query := `SELECT id, sender_id, receiver_id, status, created_at, updated_at FROM connection_requests 
	          WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)) AND status = 'pending'`
	err := r.db.QueryRow(ctx, query, senderID, receiverID).Scan(
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
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []models.ConnectionRequest
		for _, req := range r.requests {
			if req.ReceiverID == receiverID && req.Status == "pending" {
				list = append(list, *req)
			}
		}
		return list, nil
	}
	query := `SELECT cr.id, cr.sender_id, cr.receiver_id, cr.status, COALESCE(crn.note, ''), cr.created_at, cr.updated_at,
	                 COALESCE(p.username, ''), COALESCE(p.headline, ''), COALESCE(p.avatar_url, '')
	          FROM connection_requests cr
	          LEFT JOIN connection_request_notes crn ON crn.request_id = cr.id
	          LEFT JOIN user_profiles p ON p.user_id = cr.sender_id
	          WHERE cr.receiver_id = $1 AND cr.status = 'pending'
	          ORDER BY cr.created_at DESC`
	rows, err := r.db.Query(ctx, query, receiverID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ConnectionRequest
	for rows.Next() {
		var req models.ConnectionRequest
		err := rows.Scan(
			&req.ID, &req.SenderID, &req.ReceiverID, &req.Status, &req.Note, &req.CreatedAt, &req.UpdatedAt,
			&req.SenderName, &req.SenderHeadline, &req.SenderAvatarUrl,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, req)
	}
	return list, nil
}

func (r *NetworkingRepository) ListSentRequests(ctx context.Context, senderID uuid.UUID) ([]models.ConnectionRequest, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []models.ConnectionRequest
		for _, req := range r.requests {
			if req.SenderID == senderID && req.Status == "pending" {
				list = append(list, *req)
			}
		}
		return list, nil
	}
	query := `SELECT cr.id, cr.sender_id, cr.receiver_id, cr.status, COALESCE(crn.note, ''), cr.created_at, cr.updated_at,
	                 COALESCE(p.username, ''), COALESCE(p.headline, ''), COALESCE(p.avatar_url, '')
	          FROM connection_requests cr
	          LEFT JOIN connection_request_notes crn ON crn.request_id = cr.id
	          LEFT JOIN user_profiles p ON p.user_id = cr.receiver_id
	          WHERE cr.sender_id = $1 AND cr.status = 'pending'
	          ORDER BY cr.created_at DESC`
	rows, err := r.db.Query(ctx, query, senderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ConnectionRequest
	for rows.Next() {
		var req models.ConnectionRequest
		err := rows.Scan(
			&req.ID, &req.SenderID, &req.ReceiverID, &req.Status, &req.Note, &req.CreatedAt, &req.UpdatedAt,
			&req.ReceiverName, &req.ReceiverHeadline, &req.SenderAvatarUrl,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, req)
	}
	return list, nil
}

// Connections
func (r *NetworkingRepository) CreateConnection(ctx context.Context, c *models.Connection) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		k1 := c.UserID1.String() + ":" + c.UserID2.String()
		k2 := c.UserID2.String() + ":" + c.UserID1.String()
		r.conns[k1] = c
		r.conns[k2] = c
		return nil
	}
	query := `INSERT INTO connections (id, user_id_1, user_id_2, created_at) 
	          VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(ctx, query, c.ID, c.UserID1, c.UserID2, c.CreatedAt)
	return err
}

func (r *NetworkingRepository) DeleteConnection(ctx context.Context, u1, u2 uuid.UUID) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		delete(r.conns, u1.String()+":"+u2.String())
		delete(r.conns, u2.String()+":"+u1.String())
		return nil
	}
	_, err := r.db.Exec(ctx, `DELETE FROM connections 
	                         WHERE (user_id_1 = $1 AND user_id_2 = $2) 
	                            OR (user_id_1 = $2 AND user_id_2 = $1)`, u1, u2)
	return err
}

func (r *NetworkingRepository) ListConnections(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []uuid.UUID
		prefix := userID.String() + ":"
		seen := make(map[uuid.UUID]bool)
		for k, c := range r.conns {
			if strings.HasPrefix(k, prefix) {
				other := c.UserID2
				if c.UserID2 == userID {
					other = c.UserID1
				}
				if !seen[other] {
					seen[other] = true
					list = append(list, other)
				}
			}
		}
		return list, nil
	}
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

func (r *NetworkingRepository) GetConnectionPair(ctx context.Context, u1 uuid.UUID, u2 uuid.UUID) (*models.Connection, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		k1 := u1.String() + ":" + u2.String()
		if c, ok := r.conns[k1]; ok {
			return c, nil
		}
		k2 := u2.String() + ":" + u1.String()
		if c, ok := r.conns[k2]; ok {
			return c, nil
		}
		return nil, nil
	}
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

// Follow / Unfollow
func (r *NetworkingRepository) CreateFollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		r.follows[followerID.String()+":"+followingID.String()] = true
		return nil
	}
	query := `INSERT INTO connection_follows (id, follower_id, following_id, created_at)
	          VALUES ($1, $2, $3, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(ctx, query, uuid.New(), followerID, followingID)
	return err
}

func (r *NetworkingRepository) DeleteFollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		delete(r.follows, followerID.String()+":"+followingID.String())
		return nil
	}
	_, err := r.db.Exec(ctx, "DELETE FROM connection_follows WHERE follower_id = $1 AND following_id = $2", followerID, followingID)
	return err
}

func (r *NetworkingRepository) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		return r.follows[followerID.String()+":"+followingID.String()], nil
	}
	var count int
	err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM connection_follows WHERE follower_id = $1 AND following_id = $2", followerID, followingID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}


// Recommendation Dismissal
func (r *NetworkingRepository) DismissRecommendation(ctx context.Context, userID, targetID uuid.UUID, reason string) error {
	query := `INSERT INTO recommendation_dismissals (id, user_id, recommended_user_id, reason, created_at)
	          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(ctx, query, uuid.New(), userID, targetID, reason)
	return err
}

func (r *NetworkingRepository) GetDismissedIDs(ctx context.Context, userID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := r.db.Query(ctx, "SELECT recommended_user_id FROM recommendation_dismissals WHERE user_id = $1", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err == nil {
			list = append(list, id)
		}
	}
	return list, nil
}

// Privacy Blocks
func (r *NetworkingRepository) CreateBlock(ctx context.Context, b *models.BlockedUser) error {
	query := `INSERT INTO blocked_users (id, blocker_id, blocked_id, created_at) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(ctx, query, b.ID, b.BlockerID, b.BlockedID, b.CreatedAt)
	if err != nil {
		return err
	}
	// Delete any active connections or requests between them
	_ = r.DeleteConnection(ctx, b.BlockerID, b.BlockedID)
	_, _ = r.db.Exec(ctx, "DELETE FROM connection_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)", b.BlockerID, b.BlockedID)
	return nil
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

// Safety Reports
func (r *NetworkingRepository) CreateReport(ctx context.Context, rep *models.NetworkReport) error {
	query := `INSERT INTO network_reports (id, reporter_id, target_user_id, reason, details, status, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.db.Exec(ctx, query, rep.ID, rep.ReporterID, rep.TargetUserID, rep.Reason, rep.Details, rep.Status, rep.CreatedAt)
	return err
}

func (r *NetworkingRepository) ListAdminReports(ctx context.Context) ([]models.NetworkReport, error) {
	rows, err := r.db.Query(ctx, `SELECT id, reporter_id, target_user_id, reason, details, status, created_at 
	                             FROM network_reports ORDER BY created_at DESC LIMIT 100`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NetworkReport
	for rows.Next() {
		var rep models.NetworkReport
		if err := rows.Scan(&rep.ID, &rep.ReporterID, &rep.TargetUserID, &rep.Reason, &rep.Details, &rep.Status, &rep.CreatedAt); err == nil {
			list = append(list, rep)
		}
	}
	return list, nil
}

// People Search with Multi-Attribute Filtering & Privacy Controls
func (r *NetworkingRepository) SearchPeople(ctx context.Context, currentUserID uuid.UUID, filter models.PeopleSearchFilter) ([]models.PeopleSearchResult, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	// Ensure privacy settings: exclude private profiles and restricted users
	conditions = append(conditions, "COALESCE(p.is_private, false) = false")
	conditions = append(conditions, "COALESCE(p.is_restricted, false) = false")

	// Exclude self
	conditions = append(conditions, fmt.Sprintf("p.user_id != $%d", argIdx))
	args = append(args, currentUserID)
	argIdx++

	if filter.Query != "" {
		queryPattern := "%" + strings.TrimSpace(filter.Query) + "%"
		conditions = append(conditions, fmt.Sprintf("(p.username ILIKE $%d OR p.headline ILIKE $%d OR p.summary ILIKE $%d OR p.current_position ILIKE $%d)", argIdx, argIdx, argIdx, argIdx))
		args = append(args, queryPattern)
		argIdx++
	}

	if filter.Location != "" {
		conditions = append(conditions, fmt.Sprintf("p.location ILIKE $%d", argIdx))
		args = append(args, "%"+filter.Location+"%")
		argIdx++
	}

	if filter.Industry != "" {
		conditions = append(conditions, fmt.Sprintf("p.industry ILIKE $%d", argIdx))
		args = append(args, "%"+filter.Industry+"%")
		argIdx++
	}

	if filter.Company != "" {
		conditions = append(conditions, fmt.Sprintf("p.current_position ILIKE $%d", argIdx))
		args = append(args, "%"+filter.Company+"%")
		argIdx++
	}

	if filter.OpenToOpportunities != nil && *filter.OpenToOpportunities {
		conditions = append(conditions, "p.open_to_work = true")
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 20
	}
	offset := (filter.Page - 1) * limit
	if offset < 0 {
		offset = 0
	}

	query := fmt.Sprintf(`
		SELECT p.id, p.user_id, COALESCE(p.username, ''), COALESCE(p.headline, ''), COALESCE(p.current_position, ''),
		       COALESCE(p.location, ''), COALESCE(p.industry, ''), COALESCE(p.open_to_work, false), COALESCE(p.avatar_url, ''),
		       COALESCE(p.verification_status, 'unverified')
		FROM user_profiles p
		%s
		ORDER BY p.profile_views_count DESC, p.created_at DESC
		LIMIT %d OFFSET %d
	`, whereClause, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.PeopleSearchResult
	for rows.Next() {
		var res models.PeopleSearchResult
		err := rows.Scan(
			&res.ID, &res.UserID, &res.Username, &res.Headline, &res.CurrentPosition,
			&res.Location, &res.Industry, &res.OpenToWork, &res.AvatarUrl,
			&res.VerificationStatus,
		)
		if err != nil {
			return nil, err
		}
		res.Name = res.Username
		results = append(results, res)
	}

	return results, nil
}

// Network Stats
func (r *NetworkingRepository) GetNetworkStats(ctx context.Context, userID uuid.UUID) (*models.NetworkGrowthStats, error) {
	conns, _ := r.ListConnections(ctx, userID)
	incoming, _ := r.ListIncomingRequests(ctx, userID)
	sent, _ := r.ListSentRequests(ctx, userID)

	return &models.NetworkGrowthStats{
		TotalConnections:  len(conns),
		PendingReceived:   len(incoming),
		PendingSent:       len(sent),
		NetworkGrowth:     len(conns) / 2,
		ProfileViews:      len(conns) * 12,
		SearchAppearances: len(conns) * 35,
	}, nil
}

// Admin Network Analytics
func (r *NetworkingRepository) GetAdminAnalytics(ctx context.Context) (*models.AdminNetworkAnalytics, error) {
	var totalConn, totalReq, pendingReq, totalReports, blockedPairs int
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM connections").Scan(&totalConn)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM connection_requests").Scan(&totalReq)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM connection_requests WHERE status = 'pending'").Scan(&pendingReq)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM network_reports").Scan(&totalReports)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM blocked_users").Scan(&blockedPairs)

	return &models.AdminNetworkAnalytics{
		TotalConnectionsCount: totalConn,
		TotalRequestsCount:    totalReq,
		PendingRequestsCount:  pendingReq,
		ReportedNetworkCount:  totalReports,
		BlockedPairsCount:     blockedPairs,
	}, nil
}

// Connection Notes Methods
func (r *NetworkingRepository) CreateNote(ctx context.Context, note *models.ConnectionNote) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		key := note.UserID.String() + ":" + note.TargetUserID.String()
		r.notes[key] = note
		return nil
	}
	query := `INSERT INTO connection_notes (id, user_id, connection_id, target_user_id, content, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)
	          ON CONFLICT (user_id, target_user_id) DO UPDATE SET content = $5, updated_at = $7`
	_, err := r.db.Exec(ctx, query, note.ID, note.UserID, note.ConnectionID, note.TargetUserID, note.Content, note.CreatedAt, note.UpdatedAt)
	return err
}

func (r *NetworkingRepository) GetNoteForConnection(ctx context.Context, userID, targetUserID uuid.UUID) (*models.ConnectionNote, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		key := userID.String() + ":" + targetUserID.String()
		if note, ok := r.notes[key]; ok {
			return note, nil
		}
		return nil, nil
	}
	var note models.ConnectionNote
	query := `SELECT id, user_id, connection_id, target_user_id, content, created_at, updated_at
	          FROM connection_notes WHERE user_id = $1 AND target_user_id = $2`
	err := r.db.QueryRow(ctx, query, userID, targetUserID).Scan(
		&note.ID, &note.UserID, &note.ConnectionID, &note.TargetUserID, &note.Content, &note.CreatedAt, &note.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &note, nil
}

func (r *NetworkingRepository) UpdateNote(ctx context.Context, userID, targetUserID uuid.UUID, content string) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		key := userID.String() + ":" + targetUserID.String()
		if note, ok := r.notes[key]; ok {
			note.Content = content
			note.UpdatedAt = time.Now()
		}
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE connection_notes SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND target_user_id = $3", content, userID, targetUserID)
	return err
}

func (r *NetworkingRepository) DeleteNote(ctx context.Context, userID, targetUserID uuid.UUID) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		key := userID.String() + ":" + targetUserID.String()
		delete(r.notes, key)
		return nil
	}
	_, err := r.db.Exec(ctx, "DELETE FROM connection_notes WHERE user_id = $1 AND target_user_id = $2", userID, targetUserID)
	return err
}

// Connection Labels Methods
func (r *NetworkingRepository) AddLabel(ctx context.Context, label *models.ConnectionLabel) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		key := label.UserID.String() + ":" + label.TargetUserID.String()
		for _, l := range r.labels[key] {
			if strings.EqualFold(l.Label, label.Label) {
				return nil
			}
		}
		r.labels[key] = append(r.labels[key], *label)
		return nil
	}
	query := `INSERT INTO connection_labels (id, user_id, connection_id, target_user_id, label, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`
	_, err := r.db.Exec(ctx, query, label.ID, label.UserID, label.ConnectionID, label.TargetUserID, label.Label, label.CreatedAt)
	return err
}

func (r *NetworkingRepository) RemoveLabel(ctx context.Context, userID, targetUserID uuid.UUID, labelStr string) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		key := userID.String() + ":" + targetUserID.String()
		var filtered []models.ConnectionLabel
		for _, l := range r.labels[key] {
			if !strings.EqualFold(l.Label, labelStr) {
				filtered = append(filtered, l)
			}
		}
		r.labels[key] = filtered
		return nil
	}
	_, err := r.db.Exec(ctx, "DELETE FROM connection_labels WHERE user_id = $1 AND target_user_id = $2 AND label = $3", userID, targetUserID, labelStr)
	return err
}

func (r *NetworkingRepository) GetLabelsForConnection(ctx context.Context, userID, targetUserID uuid.UUID) ([]models.ConnectionLabel, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		key := userID.String() + ":" + targetUserID.String()
		return r.labels[key], nil
	}
	query := `SELECT id, user_id, connection_id, target_user_id, label, created_at
	          FROM connection_labels WHERE user_id = $1 AND target_user_id = $2 ORDER BY created_at ASC`
	rows, err := r.db.Query(ctx, query, userID, targetUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ConnectionLabel
	for rows.Next() {
		var l models.ConnectionLabel
		if err := rows.Scan(&l.ID, &l.UserID, &l.ConnectionID, &l.TargetUserID, &l.Label, &l.CreatedAt); err == nil {
			list = append(list, l)
		}
	}
	return list, nil
}

func (r *NetworkingRepository) GetLabelsForUser(ctx context.Context, userID uuid.UUID) ([]models.ConnectionLabel, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []models.ConnectionLabel
		prefix := userID.String() + ":"
		for k, lbls := range r.labels {
			if strings.HasPrefix(k, prefix) {
				list = append(list, lbls...)
			}
		}
		return list, nil
	}
	query := `SELECT id, user_id, connection_id, target_user_id, label, created_at
	          FROM connection_labels WHERE user_id = $1 ORDER BY created_at ASC`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ConnectionLabel
	for rows.Next() {
		var l models.ConnectionLabel
		if err := rows.Scan(&l.ID, &l.UserID, &l.ConnectionID, &l.TargetUserID, &l.Label, &l.CreatedAt); err == nil {
			list = append(list, l)
		}
	}
	return list, nil
}

// Networking Goals Methods
func (r *NetworkingRepository) CreateGoal(ctx context.Context, goal *models.NetworkingGoal) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		r.goals[goal.ID.String()] = goal
		return nil
	}
	query := `INSERT INTO networking_goals (id, user_id, title, description, target_count, current_count, category, status, deadline, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`
	_, err := r.db.Exec(ctx, query, goal.ID, goal.UserID, goal.Title, goal.Description, goal.TargetCount, goal.CurrentCount, goal.Category, goal.Status, goal.Deadline, goal.CreatedAt, goal.UpdatedAt)
	return err
}

func (r *NetworkingRepository) GetGoals(ctx context.Context, userID uuid.UUID) ([]models.NetworkingGoal, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []models.NetworkingGoal
		for _, g := range r.goals {
			if g.UserID == userID {
				list = append(list, *g)
			}
		}
		return list, nil
	}
	query := `SELECT id, user_id, title, description, target_count, current_count, category, status, COALESCE(deadline, ''), created_at, updated_at
	          FROM networking_goals WHERE user_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.NetworkingGoal
	for rows.Next() {
		var g models.NetworkingGoal
		if err := rows.Scan(&g.ID, &g.UserID, &g.Title, &g.Description, &g.TargetCount, &g.CurrentCount, &g.Category, &g.Status, &g.Deadline, &g.CreatedAt, &g.UpdatedAt); err == nil {
			list = append(list, g)
		}
	}
	return list, nil
}

func (r *NetworkingRepository) GetGoalByID(ctx context.Context, userID, goalID uuid.UUID) (*models.NetworkingGoal, error) {
	if r.db == nil {
		r.lazyInit()
		r.mu.RLock()
		defer r.mu.RUnlock()
		if g, ok := r.goals[goalID.String()]; ok && g.UserID == userID {
			return g, nil
		}
		return nil, nil
	}
	var g models.NetworkingGoal
	query := `SELECT id, user_id, title, description, target_count, current_count, category, status, COALESCE(deadline, ''), created_at, updated_at
	          FROM networking_goals WHERE id = $1 AND user_id = $2`
	err := r.db.QueryRow(ctx, query, goalID, userID).Scan(
		&g.ID, &g.UserID, &g.Title, &g.Description, &g.TargetCount, &g.CurrentCount, &g.Category, &g.Status, &g.Deadline, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &g, nil
}

func (r *NetworkingRepository) UpdateGoal(ctx context.Context, goal *models.NetworkingGoal) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		r.goals[goal.ID.String()] = goal
		return nil
	}
	query := `UPDATE networking_goals SET title = $1, description = $2, target_count = $3, current_count = $4, category = $5, status = $6, deadline = $7, updated_at = $8
	          WHERE id = $9 AND user_id = $10`
	_, err := r.db.Exec(ctx, query, goal.Title, goal.Description, goal.TargetCount, goal.CurrentCount, goal.Category, goal.Status, goal.Deadline, goal.UpdatedAt, goal.ID, goal.UserID)
	return err
}

func (r *NetworkingRepository) DeleteGoal(ctx context.Context, userID, goalID uuid.UUID) error {
	if r.db == nil {
		r.lazyInit()
		r.mu.Lock()
		defer r.mu.Unlock()
		delete(r.goals, goalID.String())
		return nil
	}
	_, err := r.db.Exec(ctx, "DELETE FROM networking_goals WHERE id = $1 AND user_id = $2", goalID, userID)
	return err
}

// Company Connections (Referrals)
func (r *NetworkingRepository) GetConnectionsAtCompany(ctx context.Context, userID uuid.UUID, companyID string) ([]models.CompanyConnectionDTO, error) {
	if r.db == nil {
		return []models.CompanyConnectionDTO{
			{
				UserID:             uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
				Name:               "Salim Al-Harthy",
				Headline:           "Senior Infrastructure Engineer at " + companyID,
				AvatarUrl:          "/avatars/salim.png",
				CurrentPosition:    "Senior Infrastructure Engineer",
				Company:            companyID,
				Industry:           "Technology",
				ConnectionStatus:   "connected",
				VerificationStatus: "verified",
			},
		}, nil
	}
	query := `
		SELECT p.user_id, COALESCE(p.username, ''), COALESCE(p.headline, ''), COALESCE(p.avatar_url, ''),
		       COALESCE(p.current_position, ''), COALESCE(p.industry, ''), COALESCE(p.verification_status, 'unverified')
		FROM connections c
		JOIN user_profiles p ON (p.user_id = c.user_id_1 OR p.user_id = c.user_id_2) AND p.user_id != $1
		WHERE (c.user_id_1 = $1 OR c.user_id_2 = $1)
		  AND (p.current_position ILIKE $2 OR p.industry ILIKE $2)
	`
	rows, err := r.db.Query(ctx, query, userID, "%"+companyID+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.CompanyConnectionDTO
	for rows.Next() {
		var dto models.CompanyConnectionDTO
		err := rows.Scan(
			&dto.UserID, &dto.Name, &dto.Headline, &dto.AvatarUrl,
			&dto.CurrentPosition, &dto.Industry, &dto.VerificationStatus,
		)
		if err != nil {
			return nil, err
		}
		dto.Company = companyID
		dto.ConnectionStatus = "connected"
		results = append(results, dto)
	}
	return results, nil
}

// Following & Followers
func (r *NetworkingRepository) GetFollowing(ctx context.Context, userID uuid.UUID) ([]models.PeopleSearchResult, error) {
	if r.db == nil {
		return []models.PeopleSearchResult{
			{
				UserID:           uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
				Name:             "Salim Al-Harthy",
				Headline:         "Senior Infrastructure Engineer",
				Location:         "Dubai",
				Industry:         "Technology",
				ConnectionStatus: "connected",
				IsFollowing:      true,
			},
		}, nil
	}
	query := `SELECT p.id, p.user_id, COALESCE(p.username, ''), COALESCE(p.headline, ''), COALESCE(p.current_position, ''),
	                 COALESCE(p.location, ''), COALESCE(p.industry, ''), COALESCE(p.open_to_work, false), COALESCE(p.avatar_url, ''),
	                 COALESCE(p.verification_status, 'unverified')
	          FROM connection_follows f
	          JOIN user_profiles p ON p.user_id = f.following_id
	          WHERE f.follower_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.PeopleSearchResult
	for rows.Next() {
		var res models.PeopleSearchResult
		err := rows.Scan(
			&res.ID, &res.UserID, &res.Username, &res.Headline, &res.CurrentPosition,
			&res.Location, &res.Industry, &res.OpenToWork, &res.AvatarUrl, &res.VerificationStatus,
		)
		if err != nil {
			return nil, err
		}
		res.Name = res.Username
		res.IsFollowing = true
		list = append(list, res)
	}
	return list, nil
}

func (r *NetworkingRepository) GetFollowers(ctx context.Context, userID uuid.UUID) ([]models.PeopleSearchResult, error) {
	if r.db == nil {
		return []models.PeopleSearchResult{
			{
				UserID:           uuid.MustParse("11112222-3333-4444-5555-666677778888"),
				Name:             "Ayesha Siddiqui",
				Headline:         "Next.js Frontend Architect",
				Location:         "Abu Dhabi",
				Industry:         "Technology",
				ConnectionStatus: "none",
			},
		}, nil
	}
	query := `SELECT p.id, p.user_id, COALESCE(p.username, ''), COALESCE(p.headline, ''), COALESCE(p.current_position, ''),
	                 COALESCE(p.location, ''), COALESCE(p.industry, ''), COALESCE(p.open_to_work, false), COALESCE(p.avatar_url, ''),
	                 COALESCE(p.verification_status, 'unverified')
	          FROM connection_follows f
	          JOIN user_profiles p ON p.user_id = f.follower_id
	          WHERE f.following_id = $1`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.PeopleSearchResult
	for rows.Next() {
		var res models.PeopleSearchResult
		err := rows.Scan(
			&res.ID, &res.UserID, &res.Username, &res.Headline, &res.CurrentPosition,
			&res.Location, &res.Industry, &res.OpenToWork, &res.AvatarUrl, &res.VerificationStatus,
		)
		if err != nil {
			return nil, err
		}
		res.Name = res.Username
		list = append(list, res)
	}
	return list, nil
}


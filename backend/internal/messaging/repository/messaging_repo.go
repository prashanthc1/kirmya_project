package repository

import (
	"context"
	"errors"
	"strings"
	"sync"
	"time"

	"kirmya/internal/messaging/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MessagingRepository struct {
	db       *pgxpool.Pool
	mu       sync.RWMutex
	convs    map[uuid.UUID]*models.Conversation
	messages map[uuid.UUID][]models.Message
	requests map[uuid.UUID]*models.MessageRequest
	presence map[uuid.UUID]*models.UserPresence
	reports  map[uuid.UUID]*models.MessageReport
}

func NewMessagingRepository(db *pgxpool.Pool) *MessagingRepository {
	return &MessagingRepository{
		db:       db,
		convs:    make(map[uuid.UUID]*models.Conversation),
		messages: make(map[uuid.UUID][]models.Message),
		requests: make(map[uuid.UUID]*models.MessageRequest),
		presence: make(map[uuid.UUID]*models.UserPresence),
		reports:  make(map[uuid.UUID]*models.MessageReport),
	}
}

// Conversations
func (r *MessagingRepository) CreateConversation(ctx context.Context, c *models.Conversation) error {
	r.mu.Lock()
	if r.convs == nil {
		r.convs = make(map[uuid.UUID]*models.Conversation)
	}
	if r.messages == nil {
		r.messages = make(map[uuid.UUID][]models.Message)
	}
	r.convs[c.ID] = c
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Check if conversation already exists between participants
	var existingID uuid.UUID
	checkQuery := `SELECT id FROM conversations 
	               WHERE (user_id_1 = $1 AND user_id_2 = $2) 
	                  OR (user_id_1 = $2 AND user_id_2 = $1)`
	err = tx.QueryRow(ctx, checkQuery, c.UserID1, c.UserID2).Scan(&existingID)
	if err == nil && existingID != uuid.Nil {
		c.ID = existingID
		return nil
	}

	query := `INSERT INTO conversations (id, user_id_1, user_id_2, last_message_text, last_message_time, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          ON CONFLICT (user_id_1, user_id_2) DO NOTHING`
	_, err = tx.Exec(ctx, query, c.ID, c.UserID1, c.UserID2, c.LastMessageText, c.LastMessageTime, c.CreatedAt)
	if err != nil {
		return err
	}

	// Insert default participant states
	partQuery := `INSERT INTO conversation_participants (id, conversation_id, user_id, is_archived, is_muted, is_pinned, unread_count, created_at)
	              VALUES ($1, $2, $3, false, false, false, 0, $4), ($5, $2, $6, false, false, false, 0, $4)
	              ON CONFLICT (conversation_id, user_id) DO NOTHING`
	_, _ = tx.Exec(ctx, partQuery, uuid.New(), c.ID, c.UserID1, c.CreatedAt, uuid.New(), c.UserID2)

	return tx.Commit(ctx)
}

func (r *MessagingRepository) GetConversation(ctx context.Context, id uuid.UUID) (*models.Conversation, error) {
	r.mu.RLock()
	if r.convs != nil {
		if c, exists := r.convs[id]; exists {
			r.mu.RUnlock()
			return c, nil
		}
	}
	r.mu.RUnlock()

	if r.db == nil {
		return nil, nil
	}

	c := &models.Conversation{}
	err := r.db.QueryRow(ctx, "SELECT id, user_id_1, user_id_2, last_message_text, last_message_time, created_at FROM conversations WHERE id = $1", id).Scan(
		&c.ID, &c.UserID1, &c.UserID2, &c.LastMessageText, &c.LastMessageTime, &c.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	r.mu.Lock()
	r.convs[c.ID] = c
	r.mu.Unlock()

	return c, nil
}

func (r *MessagingRepository) GetConversationByParticipants(ctx context.Context, u1 uuid.UUID, u2 uuid.UUID) (*models.Conversation, error) {
	r.mu.RLock()
	if r.convs != nil {
		for _, conv := range r.convs {
			if (conv.UserID1 == u1 && conv.UserID2 == u2) || (conv.UserID1 == u2 && conv.UserID2 == u1) {
				r.mu.RUnlock()
				return conv, nil
			}
		}
	}
	r.mu.RUnlock()

	if r.db == nil {
		return nil, nil
	}

	c := &models.Conversation{}
	err := r.db.QueryRow(ctx, `SELECT id, user_id_1, user_id_2, last_message_text, last_message_time, created_at FROM conversations 
	                          WHERE (user_id_1 = $1 AND user_id_2 = $2) 
	                             OR (user_id_1 = $2 AND user_id_2 = $1)`, u1, u2).Scan(
		&c.ID, &c.UserID1, &c.UserID2, &c.LastMessageText, &c.LastMessageTime, &c.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	r.mu.Lock()
	r.convs[c.ID] = c
	r.mu.Unlock()

	return c, nil
}

func (r *MessagingRepository) ListConversations(ctx context.Context, userID uuid.UUID) ([]models.Conversation, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []models.Conversation
		for _, c := range r.convs {
			if c.UserID1 == userID || c.UserID2 == userID {
				list = append(list, *c)
			}
		}
		return list, nil
	}

	query := `SELECT c.id, c.user_id_1, c.user_id_2, c.last_message_text, c.last_message_time, c.created_at,
	                 COALESCE(cp.is_archived, false), COALESCE(cp.is_muted, false), COALESCE(cp.is_pinned, false), COALESCE(cp.unread_count, 0)
	          FROM conversations c
	          LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = $1
	          WHERE c.user_id_1 = $1 OR c.user_id_2 = $1
	          ORDER BY cp.is_pinned DESC NULLS LAST, c.last_message_time DESC`

	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Conversation
	for rows.Next() {
		var c models.Conversation
		err := rows.Scan(
			&c.ID, &c.UserID1, &c.UserID2, &c.LastMessageText, &c.LastMessageTime, &c.CreatedAt,
			&c.IsArchived, &c.IsMuted, &c.IsPinned, &c.UnreadCount,
		)
		if err != nil {
			return nil, err
		}

		// Fill participant ID
		targetID := c.UserID2
		if userID == c.UserID2 {
			targetID = c.UserID1
		}
		c.ParticipantName = "User " + targetID.String()[:8]

		list = append(list, c)
	}
	return list, nil
}

func (r *MessagingRepository) UpdateConversationPreview(ctx context.Context, id uuid.UUID, text string, senderID uuid.UUID) error {
	r.mu.Lock()
	if c, exists := r.convs[id]; exists {
		c.LastMessageText = text
		c.LastMessageTime = time.Now()
	}
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE conversations SET last_message_text = $1, last_message_time = CURRENT_TIMESTAMP WHERE id = $2", text, id)
	if err != nil {
		return err
	}

	// Increment unread count for non-sender participant
	_, err = r.db.Exec(ctx, `UPDATE conversation_participants 
	                         SET unread_count = unread_count + 1 
	                         WHERE conversation_id = $1 AND user_id != $2`, id, senderID)
	return err
}

func (r *MessagingRepository) SetConversationArchived(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, archived bool) error {
	r.mu.Lock()
	if c, exists := r.convs[conversationID]; exists {
		c.IsArchived = archived
	}
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	query := `INSERT INTO conversation_participants (id, conversation_id, user_id, is_archived, created_at)
	          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
	          ON CONFLICT (conversation_id, user_id) DO UPDATE SET is_archived = $4`
	_, err := r.db.Exec(ctx, query, uuid.New(), conversationID, userID, archived)
	return err
}

func (r *MessagingRepository) SetConversationMuted(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, muted bool) error {
	r.mu.Lock()
	if c, exists := r.convs[conversationID]; exists {
		c.IsMuted = muted
	}
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	query := `INSERT INTO conversation_participants (id, conversation_id, user_id, is_muted, created_at)
	          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
	          ON CONFLICT (conversation_id, user_id) DO UPDATE SET is_muted = $4`
	_, err := r.db.Exec(ctx, query, uuid.New(), conversationID, userID, muted)
	return err
}

func (r *MessagingRepository) SetConversationPinned(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, pinned bool) error {
	r.mu.Lock()
	if c, exists := r.convs[conversationID]; exists {
		c.IsPinned = pinned
	}
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	query := `INSERT INTO conversation_participants (id, conversation_id, user_id, is_pinned, created_at)
	          VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
	          ON CONFLICT (conversation_id, user_id) DO UPDATE SET is_pinned = $4`
	_, err := r.db.Exec(ctx, query, uuid.New(), conversationID, userID, pinned)
	return err
}

// Messages
func (r *MessagingRepository) CreateMessage(ctx context.Context, m *models.Message) error {
	r.mu.Lock()
	if r.messages == nil {
		r.messages = make(map[uuid.UUID][]models.Message)
	}
	r.messages[m.ConversationID] = append(r.messages[m.ConversationID], *m)
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `INSERT INTO messages (id, conversation_id, sender_id, content, is_read, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6)`
	_, err = tx.Exec(ctx, query, m.ID, m.ConversationID, m.SenderID, m.Content, m.IsRead, m.CreatedAt)
	if err != nil {
		return err
	}

	for _, att := range m.Attachments {
		attQuery := `INSERT INTO message_attachments (id, message_id, file_name, file_url, file_size, created_at) 
		             VALUES ($1, $2, $3, $4, $5, $6)`
		_, err = tx.Exec(ctx, attQuery, att.ID, m.ID, att.FileName, att.FileURL, att.FileSize, att.CreatedAt)
		if err != nil {
			return err
		}
	}

	// Update conversation last message preview and unread count atomically
	_, _ = tx.Exec(ctx, "UPDATE conversations SET last_message_text = $1, last_message_time = $2 WHERE id = $3", m.Content, m.CreatedAt, m.ConversationID)
	_, _ = tx.Exec(ctx, `UPDATE conversation_participants 
	                     SET unread_count = unread_count + 1 
	                     WHERE conversation_id = $1 AND user_id != $2`, m.ConversationID, m.SenderID)

	return tx.Commit(ctx)
}

func (r *MessagingRepository) ListMessages(ctx context.Context, conversationID uuid.UUID) ([]models.Message, error) {
	r.mu.RLock()
	if r.messages != nil {
		if msgs, ok := r.messages[conversationID]; ok && r.db == nil {
			r.mu.RUnlock()
			return msgs, nil
		}
	}
	r.mu.RUnlock()

	if r.db == nil {
		return []models.Message{}, nil
	}

	rows, err := r.db.Query(ctx, `SELECT id, conversation_id, sender_id, content, is_read, created_at 
	                             FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Message
	for rows.Next() {
		var m models.Message
		err := rows.Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.Content, &m.IsRead, &m.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, m)
	}

	// Fetch attachments for each message
	for i := range list {
		attRows, err := r.db.Query(ctx, `SELECT id, message_id, file_name, file_url, file_size, created_at 
		                                 FROM message_attachments WHERE message_id = $1`, list[i].ID)
		if err == nil {
			var attList []models.MessageAttachment
			for attRows.Next() {
				var att models.MessageAttachment
				err := attRows.Scan(&att.ID, &att.MessageID, &att.FileName, &att.FileURL, &att.FileSize, &att.CreatedAt)
				if err == nil {
					attList = append(attList, att)
				}
			}
			attRows.Close()
			list[i].Attachments = attList
		}
	}

	return list, nil
}

func (r *MessagingRepository) SearchMessages(ctx context.Context, userID uuid.UUID, query string) ([]models.Message, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []models.Message
		q := strings.ToLower(query)
		for _, msgs := range r.messages {
			for _, m := range msgs {
				if strings.Contains(strings.ToLower(m.Content), q) {
					list = append(list, m)
				}
			}
		}
		return list, nil
	}

	sqlQuery := `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.is_read, m.created_at
	             FROM messages m
	             JOIN conversations c ON c.id = m.conversation_id
	             WHERE (c.user_id_1 = $1 OR c.user_id_2 = $1)
	               AND m.content ILIKE $2
	             ORDER BY m.created_at DESC LIMIT 50`

	rows, err := r.db.Query(ctx, sqlQuery, userID, "%"+query+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Message
	for rows.Next() {
		var m models.Message
		err := rows.Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.Content, &m.IsRead, &m.CreatedAt)
		if err == nil {
			list = append(list, m)
		}
	}
	return list, nil
}

func (r *MessagingRepository) UpdateUnread(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID) error {
	r.mu.Lock()
	if msgs, exists := r.messages[conversationID]; exists {
		for i := range msgs {
			if msgs[i].SenderID != userID {
				msgs[i].IsRead = true
			}
		}
	}
	if c, exists := r.convs[conversationID]; exists {
		c.UnreadCount = 0
	}
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND sender_id != $2", conversationID, userID)
	if err != nil {
		return err
	}

	// Reset unread count for user in conversation_participants
	_, err = r.db.Exec(ctx, "UPDATE conversation_participants SET unread_count = 0, last_read_at = CURRENT_TIMESTAMP WHERE conversation_id = $1 AND user_id = $2", conversationID, userID)
	return err
}

func (r *MessagingRepository) DeleteMessageForUser(ctx context.Context, messageID uuid.UUID, userID uuid.UUID) error {
	r.mu.Lock()
	for convID, msgs := range r.messages {
		for i, m := range msgs {
			if m.ID == messageID && m.SenderID == userID {
				r.messages[convID] = append(msgs[:i], msgs[i+1:]...)
				break
			}
		}
	}
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "DELETE FROM messages WHERE id = $1 AND sender_id = $2", messageID, userID)
	return err
}

// Message Requests
func (r *MessagingRepository) CreateMessageRequest(ctx context.Context, req *models.MessageRequest) error {
	r.mu.Lock()
	if r.requests == nil {
		r.requests = make(map[uuid.UUID]*models.MessageRequest)
	}
	r.requests[req.ID] = req
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	query := `INSERT INTO message_requests (id, sender_id, receiver_id, initial_message, status, created_at, updated_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7)
	          ON CONFLICT (sender_id, receiver_id) DO NOTHING`
	_, err := r.db.Exec(ctx, query, req.ID, req.SenderID, req.ReceiverID, req.InitialMessage, req.Status, req.CreatedAt, req.UpdatedAt)
	return err
}

func (r *MessagingRepository) GetMessageRequest(ctx context.Context, id uuid.UUID) (*models.MessageRequest, error) {
	r.mu.RLock()
	if r.requests != nil {
		if req, exists := r.requests[id]; exists {
			r.mu.RUnlock()
			return req, nil
		}
	}
	r.mu.RUnlock()

	if r.db == nil {
		return nil, nil
	}
	req := &models.MessageRequest{}
	err := r.db.QueryRow(ctx, "SELECT id, sender_id, receiver_id, initial_message, status, created_at, updated_at FROM message_requests WHERE id = $1", id).Scan(
		&req.ID, &req.SenderID, &req.ReceiverID, &req.InitialMessage, &req.Status, &req.CreatedAt, &req.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return req, nil
}

func (r *MessagingRepository) ListIncomingRequests(ctx context.Context, receiverID uuid.UUID) ([]models.MessageRequest, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []models.MessageRequest
		for _, req := range r.requests {
			if req.ReceiverID == receiverID && req.Status == "pending" {
				list = append(list, *req)
			}
		}
		return list, nil
	}
	rows, err := r.db.Query(ctx, `SELECT id, sender_id, receiver_id, initial_message, status, created_at, updated_at 
	                             FROM message_requests WHERE receiver_id = $1 AND status = 'pending' ORDER BY created_at DESC`, receiverID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.MessageRequest
	for rows.Next() {
		var req models.MessageRequest
		err := rows.Scan(&req.ID, &req.SenderID, &req.ReceiverID, &req.InitialMessage, &req.Status, &req.CreatedAt, &req.UpdatedAt)
		if err == nil {
			req.SenderName = "User " + req.SenderID.String()[:8]
			list = append(list, req)
		}
	}
	return list, nil
}

func (r *MessagingRepository) UpdateMessageRequestStatus(ctx context.Context, id uuid.UUID, status string) error {
	r.mu.Lock()
	if req, exists := r.requests[id]; exists {
		req.Status = status
		req.UpdatedAt = time.Now()
	}
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	_, err := r.db.Exec(ctx, "UPDATE message_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", status, id)
	return err
}

// Reactions & Reports
func (r *MessagingRepository) AddReaction(ctx context.Context, reaction *models.MessageReaction) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO message_reactions (id, message_id, user_id, emoji, created_at)
	          VALUES ($1, $2, $3, $4, $5)
	          ON CONFLICT (message_id, user_id, emoji) DO NOTHING`
	_, err := r.db.Exec(ctx, query, reaction.ID, reaction.MessageID, reaction.UserID, reaction.Emoji, reaction.CreatedAt)
	return err
}

func (r *MessagingRepository) CreateMessageReport(ctx context.Context, rep *models.MessageReport) error {
	r.mu.Lock()
	if r.reports == nil {
		r.reports = make(map[uuid.UUID]*models.MessageReport)
	}
	r.reports[rep.ID] = rep
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	query := `INSERT INTO message_reports (id, reporter_id, message_id, conversation_id, reason, details, status, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`
	_, err := r.db.Exec(ctx, query, rep.ID, rep.ReporterID, rep.MessageID, rep.ConversationID, rep.Reason, rep.Details, rep.Status, rep.CreatedAt)
	return err
}

// User Presence Status
func (r *MessagingRepository) UpsertPresence(ctx context.Context, p *models.UserPresence) error {
	r.mu.Lock()
	if r.presence == nil {
		r.presence = make(map[uuid.UUID]*models.UserPresence)
	}
	r.presence[p.UserID] = p
	r.mu.Unlock()

	if r.db == nil {
		return nil
	}
	query := `INSERT INTO user_presence (user_id, status, last_seen) VALUES ($1, $2, $3) 
	          ON CONFLICT (user_id) DO UPDATE SET status = $2, last_seen = $3`
	_, err := r.db.Exec(ctx, query, p.UserID, p.Status, p.LastSeen)
	return err
}

func (r *MessagingRepository) GetPresence(ctx context.Context, userID uuid.UUID) (*models.UserPresence, error) {
	r.mu.RLock()
	if r.presence != nil {
		if p, exists := r.presence[userID]; exists {
			r.mu.RUnlock()
			return p, nil
		}
	}
	r.mu.RUnlock()

	if r.db == nil {
		return nil, nil
	}
	p := &models.UserPresence{}
	err := r.db.QueryRow(ctx, "SELECT user_id, status, last_seen FROM user_presence WHERE user_id = $1", userID).Scan(&p.UserID, &p.Status, &p.LastSeen)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return p, nil
}

// Admin Metrics
func (r *MessagingRepository) GetAdminAnalytics(ctx context.Context) (*models.AdminMessagingAnalytics, error) {
	stats := &models.AdminMessagingAnalytics{}
	if r.db == nil {
		r.mu.RLock()
		stats.TotalConversationsCount = len(r.convs)
		for _, msgs := range r.messages {
			stats.TotalMessagesSent += len(msgs)
		}
		stats.PendingRequestsCount = len(r.requests)
		stats.ReportedMessagesCount = len(r.reports)
		r.mu.RUnlock()
		return stats, nil
	}

	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM conversations").Scan(&stats.TotalConversationsCount)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM messages").Scan(&stats.TotalMessagesSent)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM message_requests WHERE status = 'pending'").Scan(&stats.PendingRequestsCount)
	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM message_reports WHERE status = 'pending'").Scan(&stats.ReportedMessagesCount)
	return stats, nil
}

func (r *MessagingRepository) GetAdminReports(ctx context.Context) ([]models.MessageReport, error) {
	if r.db == nil {
		r.mu.RLock()
		defer r.mu.RUnlock()
		var list []models.MessageReport
		for _, rep := range r.reports {
			list = append(list, *rep)
		}
		return list, nil
	}

	rows, err := r.db.Query(ctx, "SELECT id, reporter_id, message_id, conversation_id, reason, details, status, created_at FROM message_reports ORDER BY created_at DESC LIMIT 50")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.MessageReport
	for rows.Next() {
		var rep models.MessageReport
		err := rows.Scan(&rep.ID, &rep.ReporterID, &rep.MessageID, &rep.ConversationID, &rep.Reason, &rep.Details, &rep.Status, &rep.CreatedAt)
		if err == nil {
			list = append(list, rep)
		}
	}
	return list, nil
}

func (r *MessagingRepository) IsBlocked(ctx context.Context, u1 uuid.UUID, u2 uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, nil
	}
	var exists bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(
		SELECT 1 FROM blocked_users 
		WHERE (blocker_id = $1 AND blocked_id = $2) 
		   OR (blocker_id = $2 AND blocked_id = $1)
	)`, u1, u2).Scan(&exists)
	return exists, err
}

func (r *MessagingRepository) IsConnected(ctx context.Context, u1 uuid.UUID, u2 uuid.UUID) (bool, error) {
	if r.db == nil {
		return true, nil
	}
	var exists bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(
		SELECT 1 FROM connections 
		WHERE (user_id_1 = $1 AND user_id_2 = $2) 
		   OR (user_id_1 = $2 AND user_id_2 = $1)
	)`, u1, u2).Scan(&exists)
	return exists, err
}

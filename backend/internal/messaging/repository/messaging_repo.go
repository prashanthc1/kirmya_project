package repository

import (
	"context"
	"errors"
	"kirmya/internal/messaging/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MessagingRepository struct {
	db *pgxpool.Pool
}

func NewMessagingRepository(db *pgxpool.Pool) *MessagingRepository {
	return &MessagingRepository{db: db}
}

// Conversations
func (r *MessagingRepository) CreateConversation(ctx context.Context, c *models.Conversation) error {
	query := `INSERT INTO conversations (id, user_id_1, user_id_2, last_message_text, last_message_time, created_at) 
	          VALUES ($1, $2, $3, $4, $5, $6) 
	          ON CONFLICT (user_id_1, user_id_2) DO NOTHING`
	_, err := r.db.Exec(ctx, query, c.ID, c.UserID1, c.UserID2, c.LastMessageText, c.LastMessageTime, c.CreatedAt)
	return err
}

func (r *MessagingRepository) GetConversation(ctx context.Context, id uuid.UUID) (*models.Conversation, error) {
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
	return c, nil
}

func (r *MessagingRepository) GetConversationByParticipants(ctx context.Context, u1 uuid.UUID, u2 uuid.UUID) (*models.Conversation, error) {
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
	return c, nil
}

func (r *MessagingRepository) ListConversations(ctx context.Context, userID uuid.UUID) ([]models.Conversation, error) {
	rows, err := r.db.Query(ctx, `SELECT id, user_id_1, user_id_2, last_message_text, last_message_time, created_at 
	                             FROM conversations WHERE user_id_1 = $1 OR user_id_2 = $2 ORDER BY last_message_time DESC`, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.Conversation
	for rows.Next() {
		var c models.Conversation
		err := rows.Scan(&c.ID, &c.UserID1, &c.UserID2, &c.LastMessageText, &c.LastMessageTime, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *MessagingRepository) UpdateConversationPreview(ctx context.Context, id uuid.UUID, text string) error {
	_, err := r.db.Exec(ctx, "UPDATE conversations SET last_message_text = $1, last_message_time = CURRENT_TIMESTAMP WHERE id = $2", text, id)
	return err
}

// Messages
func (r *MessagingRepository) CreateMessage(ctx context.Context, m *models.Message) error {
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

	return tx.Commit(ctx)
}

func (r *MessagingRepository) ListMessages(ctx context.Context, conversationID uuid.UUID) ([]models.Message, error) {
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

func (r *MessagingRepository) UpdateUnread(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, "UPDATE messages SET is_read = TRUE WHERE conversation_id = $1 AND sender_id != $2", conversationID, userID)
	return err
}

// User Presence Status
func (r *MessagingRepository) UpsertPresence(ctx context.Context, p *models.UserPresence) error {
	query := `INSERT INTO user_presence (user_id, status, last_seen) VALUES ($1, $2, $3) 
	          ON CONFLICT (user_id) DO UPDATE SET status = $2, last_seen = $3`
	_, err := r.db.Exec(ctx, query, p.UserID, p.Status, p.LastSeen)
	return err
}

func (r *MessagingRepository) GetPresence(ctx context.Context, userID uuid.UUID) (*models.UserPresence, error) {
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

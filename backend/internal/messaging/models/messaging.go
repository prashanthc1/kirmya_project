package models

import (
	"time"

	"github.com/google/uuid"
)

// Conversation represents a chat room linking two candidates.
type Conversation struct {
	ID              uuid.UUID `json:"id"`
	UserID1         uuid.UUID `json:"userId1"`
	UserID2         uuid.UUID `json:"userId2"`
	LastMessageText string    `json:"lastMessageText"`
	LastMessageTime time.Time `json:"lastMessageTime"`
	CreatedAt       time.Time `json:"createdAt"`
}

// Message represents a text chat block.
type Message struct {
	ID             uuid.UUID           `json:"id"`
	ConversationID uuid.UUID           `json:"conversationId"`
	SenderID       uuid.UUID           `json:"senderId"`
	Content        string              `json:"content"`
	IsRead         bool                `json:"isRead"`
	CreatedAt      time.Time           `json:"createdAt"`
	Attachments    []MessageAttachment `json:"attachments,omitempty"`
}

// MessageAttachment represents file logs.
type MessageAttachment struct {
	ID        uuid.UUID `json:"id"`
	MessageID uuid.UUID `json:"messageId"`
	FileName  string    `json:"fileName"`
	FileURL   string    `json:"fileUrl"`
	FileSize  int       `json:"fileSize"`
	CreatedAt time.Time `json:"createdAt"`
}

// UserPresence registers candidate status.
type UserPresence struct {
	UserID   uuid.UUID `json:"userId"`
	Status   string    `json:"status"` // online, offline
	LastSeen time.Time `json:"lastSeen"`
}

// WSEvent defines WebSocket payload structures.
type WSEvent struct {
	Type           string              `json:"type"` // chat, typing, presence
	ConversationID uuid.UUID           `json:"conversationId,omitempty"`
	SenderID       uuid.UUID           `json:"senderId,omitempty"`
	ReceiverID     uuid.UUID           `json:"receiverId,omitempty"`
	Content        string              `json:"content,omitempty"`
	Attachments    []MessageAttachment `json:"attachments,omitempty"`
	Timestamp      time.Time           `json:"timestamp"`
}

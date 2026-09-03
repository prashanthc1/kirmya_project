package models

import (
	"time"

	"github.com/google/uuid"
)

// Conversation represents a chat room linking two participants.
type Conversation struct {
	ID              uuid.UUID `json:"id"`
	UserID1         uuid.UUID `json:"userId1"`
	UserID2         uuid.UUID `json:"userId2"`
	LastMessageText string    `json:"lastMessageText"`
	LastMessageTime time.Time `json:"lastMessageTime"`
	CreatedAt       time.Time `json:"createdAt"`

	// Per-user participant state
	IsArchived        bool      `json:"isArchived,omitempty"`
	IsMuted           bool      `json:"isMuted,omitempty"`
	IsPinned          bool      `json:"isPinned,omitempty"`
	UnreadCount       int       `json:"unreadCount"`
	ParticipantName   string    `json:"participantName,omitempty"`
	ParticipantAvatar string    `json:"participantAvatar,omitempty"`
	ParticipantStatus string    `json:"participantStatus,omitempty"` // online, offline
}

// ConversationParticipant tracks settings per participant room.
type ConversationParticipant struct {
	ID             uuid.UUID `json:"id"`
	ConversationID uuid.UUID `json:"conversationId"`
	UserID         uuid.UUID `json:"userId"`
	IsArchived     bool      `json:"isArchived"`
	IsMuted        bool      `json:"isMuted"`
	IsPinned       bool      `json:"isPinned"`
	UnreadCount    int       `json:"unreadCount"`
	LastReadAt     time.Time `json:"lastReadAt"`
	CreatedAt      time.Time `json:"createdAt"`
}

// Message represents a text chat block.
type Message struct {
	ID             uuid.UUID           `json:"id"`
	ConversationID uuid.UUID           `json:"conversationId"`
	SenderID       uuid.UUID           `json:"senderId"`
	SenderName     string              `json:"senderName,omitempty"`
	Content        string              `json:"content"`
	IsRead         bool                `json:"isRead"`
	CreatedAt      time.Time           `json:"createdAt"`
	Attachments    []MessageAttachment `json:"attachments,omitempty"`
	Reactions      []MessageReaction   `json:"reactions,omitempty"`
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

// MessageRequest represents an invitation to chat from a non-connection.
type MessageRequest struct {
	ID             uuid.UUID `json:"id"`
	SenderID       uuid.UUID `json:"senderId"`
	SenderName     string    `json:"senderName,omitempty"`
	SenderHeadline string    `json:"senderHeadline,omitempty"`
	SenderAvatar   string    `json:"senderAvatar,omitempty"`
	ReceiverID     uuid.UUID `json:"receiverId"`
	InitialMessage string    `json:"initialMessage"`
	Status         string    `json:"status"` // pending, accepted, declined, blocked
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// MessageReaction stores emoji reactions.
type MessageReaction struct {
	ID        uuid.UUID `json:"id"`
	MessageID uuid.UUID `json:"messageId"`
	UserID    uuid.UUID `json:"userId"`
	Emoji     string    `json:"emoji"`
	CreatedAt time.Time `json:"createdAt"`
}

// MessageReport logs moderation reports.
type MessageReport struct {
	ID             uuid.UUID  `json:"id"`
	ReporterID     uuid.UUID  `json:"reporterId"`
	MessageID      *uuid.UUID `json:"messageId,omitempty"`
	ConversationID uuid.UUID  `json:"conversationId"`
	Reason         string     `json:"reason"`
	Details        string     `json:"details"`
	Status         string     `json:"status"`
	CreatedAt      time.Time  `json:"createdAt"`
}

// UserPresence registers candidate status.
type UserPresence struct {
	UserID   uuid.UUID `json:"userId"`
	Status   string    `json:"status"` // online, offline
	LastSeen time.Time `json:"lastSeen"`
}

// WSEvent defines WebSocket payload structures.
type WSEvent struct {
	Type           string              `json:"type"` // chat, typing, presence, read, request
	ConversationID uuid.UUID           `json:"conversationId,omitempty"`
	SenderID       uuid.UUID           `json:"senderId,omitempty"`
	ReceiverID     uuid.UUID           `json:"receiverId,omitempty"`
	Content        string              `json:"content,omitempty"`
	Attachments    []MessageAttachment `json:"attachments,omitempty"`
	Timestamp      time.Time           `json:"timestamp"`
}

// AdminMessagingAnalytics aggregates admin metrics.
type AdminMessagingAnalytics struct {
	TotalConversationsCount int `json:"totalConversationsCount"`
	TotalMessagesSent       int `json:"totalMessagesSent"`
	PendingRequestsCount    int `json:"pendingRequestsCount"`
	ReportedMessagesCount   int `json:"reportedMessagesCount"`
}

// DTOs
type SendMessageDTO struct {
	Content     string              `json:"content"`
	Attachments []MessageAttachment `json:"attachments,omitempty"`
}

type CreateConversationDTO struct {
	ParticipantID uuid.UUID `json:"participantId"`
	InitialNote   string    `json:"initialNote,omitempty"`
}

type MessageReportDTO struct {
	ConversationID uuid.UUID  `json:"conversationId"`
	MessageID      *uuid.UUID `json:"messageId,omitempty"`
	Reason         string     `json:"reason"`
	Details        string     `json:"details,omitempty"`
}

type CreateMessageRequestDTO struct {
	ReceiverID     uuid.UUID `json:"receiverId" binding:"required"`
	InitialMessage string    `json:"initialMessage" binding:"required"`
}

type AddReactionPayload struct {
	Emoji string `json:"emoji" binding:"required"`
}

type ReportMessagePayload struct {
	ConversationID uuid.UUID  `json:"conversationId" binding:"required"`
	MessageID      *uuid.UUID `json:"messageId,omitempty"`
	Reason         string     `json:"reason" binding:"required"`
	Details        string     `json:"details,omitempty"`
}


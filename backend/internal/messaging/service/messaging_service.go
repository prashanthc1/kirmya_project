package service

import (
	"context"
	"encoding/json"
	"fmt"
	"html"
	"log"
	"strings"
	"sync"
	"time"

	"kirmya/internal/messaging/models"
	"kirmya/internal/messaging/pubsub"
	"kirmya/internal/messaging/repository"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type ClientSession struct {
	Conn     *websocket.Conn
	EventSub pubsub.Subscription
}

type MessagingService struct {
	repo      *repository.MessagingRepository
	pubsub    pubsub.PubSub
	clients   map[uuid.UUID]*ClientSession
	clientsMu sync.RWMutex
}

func NewMessagingService(repo *repository.MessagingRepository, ps pubsub.PubSub) *MessagingService {
	s := &MessagingService{
		repo:    repo,
		pubsub:  ps,
		clients: make(map[uuid.UUID]*ClientSession),
	}
	s.startGlobalPresenceListener()
	return s
}

func (s *MessagingService) startGlobalPresenceListener() {
	if s.pubsub == nil {
		return
	}
	sub, err := s.pubsub.Subscribe(context.Background(), "presence:broadcast")
	if err != nil {
		log.Printf("Failed to subscribe to global presence: %v", err)
		return
	}
	go func() {
		ch := sub.Channel()
		for msgBytes := range ch {
			s.clientsMu.RLock()
			for _, sess := range s.clients {
				func() {
					defer func() {
						if r := recover(); r != nil {
							// Silent recover to handle dummy websocket connections in test suites
						}
					}()
					_ = sess.Conn.WriteMessage(websocket.TextMessage, msgBytes)
				}()
			}
			s.clientsMu.RUnlock()
		}
	}()
}

func (s *MessagingService) ListConversations(ctx context.Context, userID uuid.UUID) ([]models.Conversation, error) {
	return s.repo.ListConversations(ctx, userID)
}

func (s *MessagingService) GetOrCreateConversation(ctx context.Context, u1 uuid.UUID, u2 uuid.UUID) (*models.Conversation, error) {
	if u1 == u2 {
		return nil, fmt.Errorf("cannot initiate a conversation with yourself")
	}

	// Check blocking status
	blocked, err := s.repo.IsBlocked(ctx, u1, u2)
	if err != nil {
		return nil, err
	}
	if blocked {
		return nil, fmt.Errorf("messaging is restricted due to privacy or block settings")
	}

	conv, err := s.repo.GetConversationByParticipants(ctx, u1, u2)
	if err != nil {
		return nil, err
	}

	if conv == nil {
		conv = &models.Conversation{
			ID:              uuid.New(),
			UserID1:         u1,
			UserID2:         u2,
			LastMessageText: "",
			LastMessageTime: time.Now(),
			CreatedAt:       time.Now(),
		}
		if err := s.repo.CreateConversation(ctx, conv); err != nil {
			return nil, err
		}
	}
	return conv, nil
}

func (s *MessagingService) GetMessages(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID) ([]models.Message, error) {
	// Verify membership
	conv, err := s.repo.GetConversation(ctx, conversationID)
	if err != nil || conv == nil {
		return nil, fmt.Errorf("conversation not found")
	}
	if conv.UserID1 != userID && conv.UserID2 != userID {
		return nil, fmt.Errorf("unauthorized to view this conversation")
	}

	return s.repo.ListMessages(ctx, conversationID)
}

func (s *MessagingService) SendMessage(ctx context.Context, senderID uuid.UUID, conversationID uuid.UUID, content string, attachments []models.MessageAttachment) (*models.Message, error) {
	sanitizedContent := strings.TrimSpace(html.EscapeString(content))
	if len(sanitizedContent) == 0 && len(attachments) == 0 {
		return nil, fmt.Errorf("message content or attachment cannot be empty")
	}
	if len(sanitizedContent) > 5000 {
		return nil, fmt.Errorf("message content exceeds maximum limit of 5000 characters")
	}

	conv, err := s.repo.GetConversation(ctx, conversationID)
	if err != nil || conv == nil {
		return nil, fmt.Errorf("conversation not found")
	}

	if conv.UserID1 != senderID && conv.UserID2 != senderID {
		return nil, fmt.Errorf("unauthorized to send messages to this conversation")
	}

	// Check blocking status
	blocked, err := s.repo.IsBlocked(ctx, conv.UserID1, conv.UserID2)
	if err != nil {
		return nil, err
	}
	if blocked {
		return nil, fmt.Errorf("cannot send message to a blocked candidate")
	}

	m := &models.Message{
		ID:             uuid.New(),
		ConversationID: conversationID,
		SenderID:       senderID,
		Content:        sanitizedContent,
		IsRead:         false,
		CreatedAt:      time.Now(),
		Attachments:    attachments,
	}

	if err := s.repo.CreateMessage(ctx, m); err != nil {
		return nil, err
	}

	// Update preview in conversation room
	_ = s.repo.UpdateConversationPreview(ctx, conversationID, sanitizedContent, senderID)

	// Determine recipient ID
	recipientID := conv.UserID2
	if senderID == conv.UserID2 {
		recipientID = conv.UserID1
	}

	// Route real-time WebSocket event if connected
	evt := models.WSEvent{
		Type:           "chat",
		ConversationID: conversationID,
		SenderID:       senderID,
		ReceiverID:     recipientID,
		Content:        sanitizedContent,
		Attachments:    attachments,
		Timestamp:      time.Now(),
	}
	s.SendEventToUser(recipientID, evt)

	return m, nil
}

// Conversation Actions
func (s *MessagingService) SetConversationArchived(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, archived bool) error {
	return s.repo.SetConversationArchived(ctx, conversationID, userID, archived)
}

func (s *MessagingService) SetConversationMuted(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, muted bool) error {
	return s.repo.SetConversationMuted(ctx, conversationID, userID, muted)
}

func (s *MessagingService) SetConversationPinned(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID, pinned bool) error {
	return s.repo.SetConversationPinned(ctx, conversationID, userID, pinned)
}

func (s *MessagingService) MarkMessagesRead(ctx context.Context, conversationID uuid.UUID, userID uuid.UUID) error {
	return s.repo.UpdateUnread(ctx, conversationID, userID)
}

func (s *MessagingService) SearchMessages(ctx context.Context, userID uuid.UUID, query string) ([]models.Message, error) {
	if len(strings.TrimSpace(query)) == 0 {
		return []models.Message{}, nil
	}
	return s.repo.SearchMessages(ctx, userID, query)
}

// Message Requests Logic
func (s *MessagingService) SendMessageRequest(ctx context.Context, senderID uuid.UUID, receiverID uuid.UUID, initialMessage string) (*models.MessageRequest, error) {
	if senderID == receiverID {
		return nil, fmt.Errorf("cannot send message request to yourself")
	}

	blocked, err := s.repo.IsBlocked(ctx, senderID, receiverID)
	if err != nil {
		return nil, err
	}
	if blocked {
		return nil, fmt.Errorf("cannot send request to a blocked user")
	}

	sanitizedMsg := strings.TrimSpace(html.EscapeString(initialMessage))
	if len(sanitizedMsg) == 0 {
		return nil, fmt.Errorf("initial message is required")
	}

	req := &models.MessageRequest{
		ID:             uuid.New(),
		SenderID:       senderID,
		ReceiverID:     receiverID,
		InitialMessage: sanitizedMsg,
		Status:         "pending",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.repo.CreateMessageRequest(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *MessagingService) ListIncomingRequests(ctx context.Context, receiverID uuid.UUID) ([]models.MessageRequest, error) {
	return s.repo.ListIncomingRequests(ctx, receiverID)
}

func (s *MessagingService) AcceptMessageRequest(ctx context.Context, receiverID uuid.UUID, requestID uuid.UUID) (*models.Conversation, error) {
	req, err := s.repo.GetMessageRequest(ctx, requestID)
	if err != nil || req == nil {
		return nil, fmt.Errorf("message request not found")
	}
	if req.ReceiverID != receiverID {
		return nil, fmt.Errorf("unauthorized to manage this message request")
	}

	if err := s.repo.UpdateMessageRequestStatus(ctx, requestID, "accepted"); err != nil {
		return nil, err
	}

	// Automatically create conversation and post initial message
	conv, err := s.GetOrCreateConversation(ctx, req.SenderID, req.ReceiverID)
	if err != nil {
		return nil, err
	}

	_, _ = s.SendMessage(ctx, req.SenderID, conv.ID, req.InitialMessage, nil)

	return conv, nil
}

func (s *MessagingService) DeclineMessageRequest(ctx context.Context, receiverID uuid.UUID, requestID uuid.UUID) error {
	req, err := s.repo.GetMessageRequest(ctx, requestID)
	if err != nil || req == nil {
		return fmt.Errorf("message request not found")
	}
	if req.ReceiverID != receiverID {
		return fmt.Errorf("unauthorized to manage this message request")
	}
	return s.repo.UpdateMessageRequestStatus(ctx, requestID, "declined")
}

// Reactions & Safety Reports
func (s *MessagingService) AddReaction(ctx context.Context, messageID uuid.UUID, userID uuid.UUID, emoji string) error {
	r := &models.MessageReaction{
		ID:        uuid.New(),
		MessageID: messageID,
		UserID:    userID,
		Emoji:     emoji,
		CreatedAt: time.Now(),
	}
	return s.repo.AddReaction(ctx, r)
}

func (s *MessagingService) ReportMessage(ctx context.Context, reporterID uuid.UUID, convID uuid.UUID, msgID *uuid.UUID, reason string, details string) error {
	rep := &models.MessageReport{
		ID:             uuid.New(),
		ReporterID:     reporterID,
		MessageID:      msgID,
		ConversationID: convID,
		Reason:         reason,
		Details:        details,
		Status:         "pending",
		CreatedAt:      time.Now(),
	}
	return s.repo.CreateMessageReport(ctx, rep)
}

// Admin Logic
func (s *MessagingService) GetAdminAnalytics(ctx context.Context) (*models.AdminMessagingAnalytics, error) {
	return s.repo.GetAdminAnalytics(ctx)
}

func (s *MessagingService) GetAdminReports(ctx context.Context) ([]models.MessageReport, error) {
	return s.repo.GetAdminReports(ctx)
}

// WebSocket Connection Registry Management
func (s *MessagingService) RegisterClient(userID uuid.UUID, conn *websocket.Conn) {
	s.clientsMu.Lock()
	defer s.clientsMu.Unlock()

	// Clean up existing session if any
	if existing, exists := s.clients[userID]; exists {
		existing.Conn.Close()
		if existing.EventSub != nil {
			_ = existing.EventSub.Close()
		}
	}

	var sub pubsub.Subscription
	if s.pubsub != nil {
		var err error
		sub, err = s.pubsub.Subscribe(context.Background(), "user:events:"+userID.String())
		if err != nil {
			log.Printf("Failed to subscribe to user events for %s: %v", userID, err)
		} else {
			go func(sessionSub pubsub.Subscription, sessionConn *websocket.Conn) {
				ch := sessionSub.Channel()
				for msgBytes := range ch {
					func() {
						defer func() {
							if r := recover(); r != nil {
								// Silent recover
							}
						}()
						_ = sessionConn.WriteMessage(websocket.TextMessage, msgBytes)
					}()
				}
			}(sub, conn)
		}
	}

	s.clients[userID] = &ClientSession{
		Conn:     conn,
		EventSub: sub,
	}
	log.Printf("User %s connected to WebSocket hub.", userID)

	// Set presence online
	p := &models.UserPresence{
		UserID:   userID,
		Status:   "online",
		LastSeen: time.Now(),
	}
	if s.repo != nil {
		_ = s.repo.UpsertPresence(context.Background(), p)
	}

	s.broadcastPresence(userID, "online")
}

func (s *MessagingService) UnregisterClient(userID uuid.UUID) {
	s.clientsMu.Lock()
	defer s.clientsMu.Unlock()

	if sess, exists := s.clients[userID]; exists {
		func() {
			defer func() {
				if r := recover(); r != nil {
					// Handle panics
				}
			}()
			sess.Conn.Close()
		}()
		if sess.EventSub != nil {
			_ = sess.EventSub.Close()
		}
		delete(s.clients, userID)
		log.Printf("User %s disconnected from WebSocket hub.", userID)
	}

	p := &models.UserPresence{
		UserID:   userID,
		Status:   "offline",
		LastSeen: time.Now(),
	}
	if s.repo != nil {
		_ = s.repo.UpsertPresence(context.Background(), p)
	}

	s.broadcastPresence(userID, "offline")
}

func (s *MessagingService) SendEventToUser(userID uuid.UUID, evt models.WSEvent) {
	if s.pubsub == nil {
		return
	}
	msgBytes, err := json.Marshal(evt)
	if err == nil {
		_ = s.pubsub.Publish(context.Background(), "user:events:"+userID.String(), msgBytes)
	}
}

func (s *MessagingService) HandleIncomingWS(userID uuid.UUID, conn *websocket.Conn) {
	defer func() {
		s.UnregisterClient(userID)
	}()

	for {
		_, msgBytes, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var evt models.WSEvent
		if err := json.Unmarshal(msgBytes, &evt); err == nil {
			evt.SenderID = userID
			evt.Timestamp = time.Now()

			if evt.Type == "typing" && evt.ReceiverID != uuid.Nil {
				s.SendEventToUser(evt.ReceiverID, evt)
			}
		}
	}
}

func (s *MessagingService) broadcastPresence(userID uuid.UUID, status string) {
	if s.pubsub == nil {
		return
	}
	evt := models.WSEvent{
		Type:      "presence",
		SenderID:  userID,
		Content:   status,
		Timestamp: time.Now(),
	}

	msgBytes, _ := json.Marshal(evt)
	_ = s.pubsub.Publish(context.Background(), "presence:broadcast", msgBytes)
}

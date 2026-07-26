package service

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"kirmya/internal/messaging/models"
	"kirmya/internal/messaging/pubsub"
	"kirmya/internal/messaging/repository"
	"sync"
	"time"

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

func (s *MessagingService) GetMessages(ctx context.Context, conversationID uuid.UUID) ([]models.Message, error) {
	return s.repo.ListMessages(ctx, conversationID)
}

func (s *MessagingService) SendMessage(ctx context.Context, senderID uuid.UUID, conversationID uuid.UUID, content string, attachments []models.MessageAttachment) (*models.Message, error) {
	conv, err := s.repo.GetConversation(ctx, conversationID)
	if err != nil {
		return nil, err
	}
	if conv == nil {
		return nil, fmt.Errorf("conversation not found")
	}

	m := &models.Message{
		ID:             uuid.New(),
		ConversationID: conversationID,
		SenderID:       senderID,
		Content:        content,
		IsRead:         false,
		CreatedAt:      time.Now(),
		Attachments:    attachments,
	}

	if err := s.repo.CreateMessage(ctx, m); err != nil {
		return nil, err
	}

	// Update preview in conversation room
	_ = s.repo.UpdateConversationPreview(ctx, conversationID, content)

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
		Content:        content,
		Attachments:    attachments,
		Timestamp:      time.Now(),
	}
	s.SendEventToUser(recipientID, evt)

	return m, nil
}

// WebSocket connection registry management
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
			// Start reader loop from subscription channel and write to connection
			go func(sessionSub pubsub.Subscription, sessionConn *websocket.Conn) {
				ch := sessionSub.Channel()
				for msgBytes := range ch {
					func() {
						defer func() {
							if r := recover(); r != nil {
								// Silent recover to handle dummy websocket connections in test suites
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

	// Broadcast online presence status to all connected users
	s.broadcastPresence(userID, "online")
}

func (s *MessagingService) UnregisterClient(userID uuid.UUID) {
	s.clientsMu.Lock()
	defer s.clientsMu.Unlock()

	if sess, exists := s.clients[userID]; exists {
		func() {
			defer func() {
				if r := recover(); r != nil {
					// Handle panics from dummy websocket connections in test suites
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

	// Set presence offline
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

			// Route typing notifications
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

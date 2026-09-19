//go:build ciintegration

package ci

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

func messagingPersistBase(t *testing.T) string {
	t.Helper()
	base := os.Getenv("TEST_API_URL")
	if base == "" {
		base = "http://127.0.0.1:8080"
	}
	return strings.TrimRight(base, "/")
}

// TestMessagingPersist tests the messaging lifecycle and persistence guarantees:
// 1. Register and authenticate two users (User A and User B).
// 2. Establish a connection between them (Request + Accept).
// 3. User A starts a conversation with User B.
// 4. User A sends a message to User B.
// 5. User B lists messages; asserts that the recipient list contains the message.
// 6. User B lists conversations; asserts the conversation exists with matching preview.
// 7. Verify persistence in PostgreSQL (messages and conversations tables).
// 8. If Redis is unset or degraded, verify that API still persists and health/dependency
//    response accurately reports realtime/pubsub status as degraded or disabled.
func TestMessagingPersist(t *testing.T) {
	base := messagingPersistBase(t)

	// 1. Two users
	userA := registerAndLogin(t, base)
	userB := registerAndLogin(t, base)

	// 2. Establish connection: User A sends connection request to User B
	reqPayload := map[string]any{
		"receiverId": userB.id,
		"note":       "Connecting for messaging persistence test",
	}
	reqResp := do(t, http.MethodPost, base+"/api/v1/network/requests", userA.token, reqPayload)
	reqBody, _ := readBody(reqResp)
	if reqResp.StatusCode != http.StatusCreated {
		t.Fatalf("send connection request: got %d want 201: %s", reqResp.StatusCode, reqBody)
	}

	var createdReq struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal([]byte(reqBody), &createdReq); err != nil || createdReq.ID == "" {
		t.Fatalf("decode connection request: %v (body: %s)", err, reqBody)
	}

	// User B accepts connection request
	acceptResp := do(t, http.MethodPost, base+"/api/v1/network/requests/"+createdReq.ID+"/accept", userB.token, nil)
	acceptBody, _ := readBody(acceptResp)
	if acceptResp.StatusCode != http.StatusOK {
		t.Fatalf("accept connection request: got %d want 200: %s", acceptResp.StatusCode, acceptBody)
	}

	// 3. User A initiates/gets conversation with User B
	convPayload := map[string]any{
		"participantId": userB.id,
	}
	convResp := do(t, http.MethodPost, base+"/api/v1/messages/conversations", userA.token, convPayload)
	convBody, _ := readBody(convResp)
	if convResp.StatusCode != http.StatusOK && convResp.StatusCode != http.StatusCreated {
		t.Fatalf("initiate conversation: got %d want 200/201: %s", convResp.StatusCode, convBody)
	}

	var conv struct {
		ID      string `json:"id"`
		UserID1 string `json:"userId1"`
		UserID2 string `json:"userId2"`
	}
	if err := json.Unmarshal([]byte(convBody), &conv); err != nil || conv.ID == "" {
		t.Fatalf("decode conversation: %v (body: %s)", err, convBody)
	}

	// 4. User A sends message
	uniqueContent := fmt.Sprintf("CI persistence test message %s", uuid.NewString())
	sendPayload := map[string]any{
		"content": uniqueContent,
	}
	sendResp := do(t, http.MethodPost, base+"/api/v1/messages/conversations/"+conv.ID+"/messages", userA.token, sendPayload)
	sendBody, _ := readBody(sendResp)
	if sendResp.StatusCode != http.StatusCreated {
		t.Fatalf("send message: got %d want 201: %s", sendResp.StatusCode, sendBody)
	}

	var sentMsg struct {
		ID             string `json:"id"`
		ConversationID string `json:"conversationId"`
		SenderID       string `json:"senderId"`
		Content        string `json:"content"`
	}
	if err := json.Unmarshal([]byte(sendBody), &sentMsg); err != nil || sentMsg.ID == "" {
		t.Fatalf("decode sent message: %v (body: %s)", err, sendBody)
	}
	if sentMsg.Content != uniqueContent {
		t.Errorf("sent message content mismatch: got %q want %q", sentMsg.Content, uniqueContent)
	}

	// 5. Recipient (User B) lists messages: recipient list contains it
	listMsgResp := do(t, http.MethodGet, base+"/api/v1/messages/conversations/"+conv.ID+"/messages", userB.token, nil)
	listMsgBody, _ := readBody(listMsgResp)
	if listMsgResp.StatusCode != http.StatusOK {
		t.Fatalf("recipient list messages: got %d want 200: %s", listMsgResp.StatusCode, listMsgBody)
	}

	var messages []struct {
		ID             string `json:"id"`
		ConversationID string `json:"conversationId"`
		SenderID       string `json:"senderId"`
		Content        string `json:"content"`
	}
	if err := json.Unmarshal([]byte(listMsgBody), &messages); err != nil {
		t.Fatalf("decode recipient message list: %v (body: %s)", err, listMsgBody)
	}

	foundInMessages := false
	for _, m := range messages {
		if m.ID == sentMsg.ID && m.Content == uniqueContent {
			foundInMessages = true
			if m.SenderID != userA.id {
				t.Errorf("expected sender %s, got %s", userA.id, m.SenderID)
			}
			break
		}
	}
	if !foundInMessages {
		t.Fatalf("sent message %s not found in recipient message list (%d messages returned): %s", sentMsg.ID, len(messages), listMsgBody)
	}

	// 6. Recipient (User B) lists conversations: conversation list contains it with preview
	listConvResp := do(t, http.MethodGet, base+"/api/v1/messages/conversations", userB.token, nil)
	listConvBody, _ := readBody(listConvResp)
	if listConvResp.StatusCode != http.StatusOK {
		t.Fatalf("recipient list conversations: got %d want 200: %s", listConvResp.StatusCode, listConvBody)
	}

	var convs []struct {
		ID              string `json:"id"`
		LastMessageText string `json:"lastMessageText"`
	}
	if err := json.Unmarshal([]byte(listConvBody), &convs); err != nil {
		t.Fatalf("decode recipient conversation list: %v (body: %s)", err, listConvBody)
	}

	foundInConvs := false
	for _, c := range convs {
		if c.ID == conv.ID {
			foundInConvs = true
			if c.LastMessageText != uniqueContent {
				t.Errorf("conversation lastMessageText: got %q want %q", c.LastMessageText, uniqueContent)
			}
			break
		}
	}
	if !foundInConvs {
		t.Fatalf("conversation %s not found in recipient conversations list: %s", conv.ID, listConvBody)
	}

	// 7. Verify direct database persistence in PostgreSQL if DATABASE_URL is provided
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		pool, err := pgxpool.New(ctx, dbURL)
		if err != nil {
			t.Fatalf("connect to database: %v", err)
		}
		defer pool.Close()

		var dbContent string
		var dbSenderID string
		err = pool.QueryRow(ctx, "SELECT content, sender_id::text FROM messages WHERE id = $1", sentMsg.ID).Scan(&dbContent, &dbSenderID)
		if err != nil {
			t.Fatalf("query message from postgres: %v", err)
		}
		if dbContent != uniqueContent {
			t.Errorf("postgres message content: got %q want %q", dbContent, uniqueContent)
		}
		if dbSenderID != userA.id {
			t.Errorf("postgres message sender: got %s want %s", dbSenderID, userA.id)
		}

		var dbLastMsg string
		err = pool.QueryRow(ctx, "SELECT last_message_text FROM conversations WHERE id = $1", conv.ID).Scan(&dbLastMsg)
		if err != nil {
			t.Fatalf("query conversation preview from postgres: %v", err)
		}
		if dbLastMsg != uniqueContent {
			t.Errorf("postgres conversation preview: got %q want %q", dbLastMsg, uniqueContent)
		}
	}

	// 8. Health check dependency reporting:
	// If Redis is unset or degraded, API still persists (verified above), and response/health must say so.
	healthResp := do(t, http.MethodGet, base+"/health/dependencies", "", nil)
	healthBody, _ := readBody(healthResp)
	if healthResp.StatusCode != http.StatusOK {
		t.Fatalf("health dependencies: got %d want 200: %s", healthResp.StatusCode, healthBody)
	}

	var health struct {
		OverallStatus    string            `json:"overallStatus"`
		PublicComponents map[string]string `json:"publicComponents"`
	}
	if err := json.Unmarshal([]byte(healthBody), &health); err != nil {
		t.Fatalf("decode health dependencies: %v (body: %s)", err, healthBody)
	}

	realtimeStatus := health.PublicComponents["realtime"]
	redisStatus := health.PublicComponents["redis"]

	redisConfigured := os.Getenv("REDIS_URL") != "" || os.Getenv("REDIS_HOST") != ""
	if !redisConfigured || redisStatus == "degraded" || redisStatus == "disabled" {
		// When Redis is unset or degraded, WS/pubsub is degraded/disabled (single-process in-memory only)
		if realtimeStatus != "degraded" && realtimeStatus != "disabled" {
			t.Errorf("expected realtime status degraded or disabled when Redis is absent/degraded, got: %s", realtimeStatus)
		}
		t.Logf("Redis absent/degraded: realtime broker is %q, redis is %q; API persistence fully verified", realtimeStatus, redisStatus)
	} else {
		t.Logf("Redis configured: realtime status is %q, redis is %q", realtimeStatus, redisStatus)
	}
}

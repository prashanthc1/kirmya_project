//go:build ciintegration

package ci

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"testing"
)

func networkingBase(t *testing.T) string {
	t.Helper()
	base := os.Getenv("TEST_API_URL")
	if base == "" {
		base = "http://127.0.0.1:8080"
	}
	return strings.TrimRight(base, "/")
}

// TestNetworkingJourney exercises the complete networking lifecycle:
// 1. Two real users registered and authenticated.
// 2. User A sends connection request to User B.
// 3. User B accepts the connection request.
// 4. Assert both users list connections of length 1 (and reference each other).
// 5. User A blocks User B.
// 6. Assert both users list connections of length 0 (connection severed upon block).
// 7. Verify blocked user cannot message (or initiate conversation) if that rule exists.
func TestNetworkingJourney(t *testing.T) {
	base := networkingBase(t)

	// 1. Two users
	userA := registerAndLogin(t, base)
	userB := registerAndLogin(t, base)

	// 2. User A requests connection with User B
	reqPayload := map[string]any{
		"receiverId": userB.id,
		"note":       "Hey, let's connect on Kirmya!",
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
		t.Fatalf("expected created connection request with id, got: %s (err: %v)", reqBody, err)
	}

	// 3. User B accepts the request
	acceptResp := do(t, http.MethodPost, base+"/api/v1/network/requests/"+createdReq.ID+"/accept", userB.token, nil)
	acceptBody, _ := readBody(acceptResp)
	if acceptResp.StatusCode != http.StatusOK {
		t.Fatalf("accept connection request: got %d want 200: %s", acceptResp.StatusCode, acceptBody)
	}

	// 4. List connections length 1
	type connectionItem struct {
		UserID           string `json:"userId"`
		ConnectionStatus string `json:"connectionStatus"`
	}

	// Verify User A connections
	listRespA := do(t, http.MethodGet, base+"/api/v1/network/connections", userA.token, nil)
	listBodyA, _ := readBody(listRespA)
	if listRespA.StatusCode != http.StatusOK {
		t.Fatalf("get user A connections: got %d want 200: %s", listRespA.StatusCode, listBodyA)
	}
	var connsA []connectionItem
	if err := json.Unmarshal([]byte(listBodyA), &connsA); err != nil {
		t.Fatalf("decoding user A connections: %v (body: %s)", err, listBodyA)
	}
	if len(connsA) != 1 {
		t.Fatalf("user A connections count: got %d want 1: %s", len(connsA), listBodyA)
	}
	if connsA[0].UserID != userB.id {
		t.Errorf("user A connected to %s, want %s", connsA[0].UserID, userB.id)
	}

	// Verify User B connections
	listRespB := do(t, http.MethodGet, base+"/api/v1/network/connections", userB.token, nil)
	listBodyB, _ := readBody(listRespB)
	if listRespB.StatusCode != http.StatusOK {
		t.Fatalf("get user B connections: got %d want 200: %s", listRespB.StatusCode, listBodyB)
	}
	var connsB []connectionItem
	if err := json.Unmarshal([]byte(listBodyB), &connsB); err != nil {
		t.Fatalf("decoding user B connections: %v (body: %s)", err, listBodyB)
	}
	if len(connsB) != 1 {
		t.Fatalf("user B connections count: got %d want 1: %s", len(connsB), listBodyB)
	}
	if connsB[0].UserID != userA.id {
		t.Errorf("user B connected to %s, want %s", connsB[0].UserID, userA.id)
	}

	// 5. User A blocks User B
	blockPayload := map[string]any{
		"blockedId": userB.id,
	}
	blockResp := do(t, http.MethodPost, base+"/api/v1/network/blocks", userA.token, blockPayload)
	blockBody, _ := readBody(blockResp)
	if blockResp.StatusCode != http.StatusOK {
		t.Fatalf("block user: got %d want 200: %s", blockResp.StatusCode, blockBody)
	}

	// 6. List connections length 0
	listRespAAfter := do(t, http.MethodGet, base+"/api/v1/network/connections", userA.token, nil)
	listBodyAAfter, _ := readBody(listRespAAfter)
	if listRespAAfter.StatusCode != http.StatusOK {
		t.Fatalf("get user A connections after block: got %d want 200: %s", listRespAAfter.StatusCode, listBodyAAfter)
	}
	var connsAAfter []connectionItem
	if err := json.Unmarshal([]byte(listBodyAAfter), &connsAAfter); err != nil {
		t.Fatalf("decoding user A connections after block: %v (body: %s)", err, listBodyAAfter)
	}
	if len(connsAAfter) != 0 {
		t.Fatalf("user A connections after block: got %d want 0: %s", len(connsAAfter), listBodyAAfter)
	}

	listRespBAfter := do(t, http.MethodGet, base+"/api/v1/network/connections", userB.token, nil)
	listBodyBAfter, _ := readBody(listRespBAfter)
	if listRespBAfter.StatusCode != http.StatusOK {
		t.Fatalf("get user B connections after block: got %d want 200: %s", listRespBAfter.StatusCode, listBodyBAfter)
	}
	var connsBAfter []connectionItem
	if err := json.Unmarshal([]byte(listBodyBAfter), &connsBAfter); err != nil {
		t.Fatalf("decoding user B connections after block: %v (body: %s)", err, listBodyBAfter)
	}
	if len(connsBAfter) != 0 {
		t.Fatalf("user B connections after block: got %d want 0: %s", len(connsBAfter), listBodyBAfter)
	}

	// 7. Blocked user cannot message if that rule exists (skip message assert if out of module)
	// Attempt creating conversation from blocked User B to User A
	convPayload := map[string]any{
		"participantId": userA.id,
	}
	convResp := do(t, http.MethodPost, base+"/api/v1/messages/conversations", userB.token, convPayload)
	convBody, _ := readBody(convResp)

	if convResp.StatusCode == http.StatusNotFound {
		t.Log("messaging route not found, skipping message assert")
	} else if convResp.StatusCode == http.StatusBadRequest || convResp.StatusCode == http.StatusForbidden {
		// Rule exists and correctly prevented messaging
		t.Logf("blocked user correctly prevented from initiating conversation: HTTP %d (%s)", convResp.StatusCode, convBody)
	} else if convResp.StatusCode == http.StatusOK || convResp.StatusCode == http.StatusCreated {
		t.Errorf("blocked user was able to initiate conversation: got %d: %s", convResp.StatusCode, convBody)
	}

	// Attempt sending a message request from blocked User B to User A
	msgReqPayload := map[string]any{
		"receiverId":     userA.id,
		"initialMessage": "Hello from blocked user",
	}
	msgReqResp := do(t, http.MethodPost, base+"/api/v1/messages/requests", userB.token, msgReqPayload)
	msgReqBody, _ := readBody(msgReqResp)

	if msgReqResp.StatusCode == http.StatusNotFound {
		t.Log("message request route not found, skipping message assert")
	} else if msgReqResp.StatusCode == http.StatusBadRequest || msgReqResp.StatusCode == http.StatusForbidden {
		t.Logf("blocked user correctly prevented from sending message request: HTTP %d (%s)", msgReqResp.StatusCode, msgReqBody)
	} else if msgReqResp.StatusCode == http.StatusOK || msgReqResp.StatusCode == http.StatusCreated {
		t.Errorf("blocked user was able to send message request: got %d: %s", msgReqResp.StatusCode, msgReqBody)
	}
}

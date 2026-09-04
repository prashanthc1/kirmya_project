package service

import (
	"context"
	"strings"
	"testing"

	"kirmya/internal/networking/models"
	"kirmya/internal/networking/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestComputeMutualsAndScore(t *testing.T) {
	repo := repository.NewNetworkingRepository(nil)
	svc := &NetworkingService{repo: repo}

	salimID := uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
	candID := uuid.MustParse("11112222-3333-4444-5555-666677778888") // Ayesha

	reqID := uuid.New()
	_ = repo.CreateRequest(context.Background(), &models.ConnectionRequest{
		ID:         reqID,
		SenderID:   candID,
		ReceiverID: salimID,
		Status:     "pending",
	})
	_ = repo.AcceptRequestTx(context.Background(), reqID, salimID)

	userConns := []uuid.UUID{
		salimID, // Salim (mutual bridge)
		uuid.MustParse("99998888-7777-6666-5555-444433332222"), // Fatima
	}

	candLoc := "Dubai"
	candInd := "Technology"

	mutuals, score := svc.computeMutualsAndScore(context.Background(), userConns, candID, candLoc, candInd)

	assert.Equal(t, 80, score)
	assert.Contains(t, mutuals, "Salim Al-Harthy")
}

func TestGetMockNetworkingCandidates(t *testing.T) {
	userID := uuid.New()
	userConns := []uuid.UUID{
		uuid.MustParse("11112222-3333-4444-5555-666677778888"), // Ayesha Siddiqui
	}

	candidates := getMockNetworkingCandidates(userID, userConns)

	for _, c := range candidates {
		assert.NotEqual(t, "Ayesha Siddiqui", c.Name)
	}
}

func TestSendConnectionRequestValidations(t *testing.T) {
	svc := &NetworkingService{}
	u1 := uuid.New()

	// Self-connection error
	_, err := svc.SendConnectionRequest(context.Background(), u1, u1, "Hello")
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot connect with yourself")

	// Excessive note length error
	u2 := uuid.New()
	longNote := strings.Repeat("a", 501)
	_, err = svc.SendConnectionRequest(context.Background(), u1, u2, longNote)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "exceeds maximum length")
}

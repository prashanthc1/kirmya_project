package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// TestComputeMutualsAndScore validates that overlapping direct connections increase
// the computed score for connection recommendations.
func TestComputeMutualsAndScore(t *testing.T) {
	// Setup service instance
	svc := &NetworkingService{}

	userConns := []uuid.UUID{
		uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"), // Salim (mutual bridge)
		uuid.MustParse("99998888-7777-6666-5555-444433332222"), // Fatima
	}

	candID := uuid.MustParse("11112222-3333-4444-5555-666677778888") // Ayesha
	candLoc := "Dubai"
	candInd := "Technology"

	// Call private scoring function
	mutuals, score := svc.computeMutualsAndScore(context.Background(), userConns, candID, candLoc, candInd)

	// Score calculations:
	// - Mutuals count is 1 (Salim) -> len(mutuals) * 20 = 20 points
	// - Location matches "Dubai" -> +20 points
	// - Industry matches "Technology" -> +20 points
	// - Base completeness weight -> +20 points
	// Total expected = 20 + 20 + 20 + 20 = 80
	assert.Equal(t, 80, score)
	assert.Contains(t, mutuals, "Salim Al-Harthy")
}

// TestGetMockNetworkingCandidates validates filtering candidate routines
func TestGetMockNetworkingCandidates(t *testing.T) {
	userID := uuid.New()
	userConns := []uuid.UUID{
		uuid.MustParse("11112222-3333-4444-5555-666677778888"), // Ayesha Siddiqui
	}

	candidates := getMockNetworkingCandidates(userID, userConns)

	// Ayesha Siddiqui should be excluded since she is already a direct connection
	for _, c := range candidates {
		assert.NotEqual(t, "Ayesha Siddiqui", c.Name)
	}
}

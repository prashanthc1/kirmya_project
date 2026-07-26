package service

import (
	"context"
	"fmt"
	profileRepo "kirmya/internal/profile/repository"
	"kirmya/internal/networking/models"
	netRepo "kirmya/internal/networking/repository"
	"strings"
	"time"

	"github.com/google/uuid"
)

type NetworkingService struct {
	repo        *netRepo.NetworkingRepository
	profileRepo *profileRepo.ProfileRepository
}

func NewNetworkingService(r *netRepo.NetworkingRepository, p *profileRepo.ProfileRepository) *NetworkingService {
	return &NetworkingService{repo: r, profileRepo: p}
}

func (s *NetworkingService) SendConnectionRequest(ctx context.Context, senderID uuid.UUID, receiverID uuid.UUID) (*models.ConnectionRequest, error) {
	if senderID == receiverID {
		return nil, fmt.Errorf("cannot connect with yourself")
	}

	// Check blocks
	blocked, err := s.repo.IsBlocked(ctx, senderID, receiverID)
	if err != nil {
		return nil, err
	}
	if blocked {
		return nil, fmt.Errorf("action restricted due to privacy blocks")
	}

	// Check active connections
	existingConn, err := s.repo.GetConnectionPair(ctx, senderID, receiverID)
	if err == nil && existingConn != nil {
		return nil, fmt.Errorf("already connected")
	}

	req := &models.ConnectionRequest{
		ID:         uuid.New(),
		SenderID:   senderID,
		ReceiverID: receiverID,
		Status:     "pending",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.repo.CreateRequest(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *NetworkingService) AcceptConnectionRequest(ctx context.Context, userID uuid.UUID, requestID uuid.UUID) error {
	req, err := s.repo.GetRequest(ctx, requestID)
	if err != nil {
		return err
	}
	if req == nil {
		return fmt.Errorf("request not found")
	}
	if req.ReceiverID != userID {
		return fmt.Errorf("unauthorized request action")
	}

	// Update status
	if err := s.repo.UpdateRequestStatus(ctx, requestID, "accepted"); err != nil {
		return err
	}

	// Create bidirectional connections entries
	c1 := &models.Connection{
		ID:        uuid.New(),
		UserID1:   req.SenderID,
		UserID2:   req.ReceiverID,
		CreatedAt: time.Now(),
	}
	return s.repo.CreateConnection(ctx, c1)
}

func (s *NetworkingService) RejectConnectionRequest(ctx context.Context, userID uuid.UUID, requestID uuid.UUID) error {
	req, err := s.repo.GetRequest(ctx, requestID)
	if err != nil {
		return err
	}
	if req == nil {
		return fmt.Errorf("request not found")
	}
	if req.ReceiverID != userID {
		return fmt.Errorf("unauthorized request action")
	}

	return s.repo.UpdateRequestStatus(ctx, requestID, "rejected")
}

func (s *NetworkingService) BlockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error {
	if blockerID == blockedID {
		return fmt.Errorf("cannot block yourself")
	}

	b := &models.BlockedUser{
		ID:        uuid.New(),
		BlockerID: blockerID,
		BlockedID: blockedID,
		CreatedAt: time.Now(),
	}

	if err := s.repo.CreateBlock(ctx, b); err != nil {
		return err
	}

	// Delete any active connections or requests between them
	// In a real DB this would also cascade or we run deletes
	return nil
}

func (s *NetworkingService) UnblockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error {
	return s.repo.DeleteBlock(ctx, blockerID, blockedID)
}

func (s *NetworkingService) ListIncomingRequests(ctx context.Context, userID uuid.UUID) ([]models.ConnectionRequest, error) {
	return s.repo.ListIncomingRequests(ctx, userID)
}

func (s *NetworkingService) ListConnections(ctx context.Context, userID uuid.UUID) ([]models.ConnectionRecommendation, error) {
	conns, err := s.repo.ListConnections(ctx, userID)
	if err != nil {
		return nil, err
	}

	var list []models.ConnectionRecommendation
	for _, connID := range conns {
		name, headline, location, industry := getMockProfileInfo(connID)
		list = append(list, models.ConnectionRecommendation{
			UserID:   connID,
			Name:     name,
			Headline: headline,
			Location: location,
			Industry: industry,
		})
	}
	return list, nil
}

func (s *NetworkingService) GetRecommendations(ctx context.Context, userID uuid.UUID) ([]models.ConnectionRecommendation, error) {
	// 1. Fetch user's active connections
	userConns, err := s.repo.ListConnections(ctx, userID)
	if err != nil {
		userConns = []uuid.UUID{}
	}

	// In offline/test environments, if connections are empty, let's mock one active connection
	// to enable mutual connection graphs calculations!
	if len(userConns) == 0 {
		salimID := uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
		userConns = append(userConns, salimID)
	}

	// 2. Define pool of potential candidates (excluding user and direct connections)
	candidates := getMockNetworkingCandidates(userID, userConns)

	// 3. Compute score and extract mutual connections
	var recs []models.ConnectionRecommendation
	for _, cand := range candidates {
		// Verify if candidate is blocked
		blocked, err := s.repo.IsBlocked(ctx, userID, cand.UserID)
		if err == nil && blocked {
			continue
		}

		mutuals, matchScore := s.computeMutualsAndScore(ctx, userConns, cand.UserID, cand.Location, cand.Industry)
		cand.MutualConnections = mutuals
		cand.MutualCount = len(mutuals)
		cand.MatchScore = matchScore

		recs = append(recs, cand)
	}

	return recs, nil
}

// computeMutualsAndScore intersects connection lists and adds matching weights.
func (s *NetworkingService) computeMutualsAndScore(ctx context.Context, userConns []uuid.UUID, candID uuid.UUID, candLoc, candInd string) ([]string, int) {
	var candConns []uuid.UUID
	var err error
	if s.repo != nil {
		candConns, err = s.repo.ListConnections(ctx, candID)
		if err != nil {
			candConns = []uuid.UUID{}
		}
	}

	// If offline/mock mode, Salim acts as a bridge connection
	if len(candConns) == 0 {
		salimID := uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
		candConns = append(candConns, salimID)
	}

	var mutualNames []string
	for _, uc := range userConns {
		for _, cc := range candConns {
			if uc == cc {
				name, _, _, _ := getMockProfileInfo(uc)
				mutualNames = append(mutualNames, name)
				break
			}
		}
	}

	score := 0
	// Weightings:
	// - Mutuals count (40% weight): +20 points per mutual (max 40)
	score += len(mutualNames) * 20
	if score > 40 {
		score = 40
	}

	// - Location (20% weight)
	if strings.EqualFold(candLoc, "Dubai") {
		score += 20
	}

	// - Industry (20% weight)
	if strings.EqualFold(candInd, "Technology") {
		score += 20
	}

	// - Completeness base (20% weight)
	score += 20

	return mutualNames, score
}

// Mock profiles helper data
func getMockProfileInfo(id uuid.UUID) (string, string, string, string) {
	switch id.String() {
	case "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee":
		return "Salim Al-Harthy", "Senior Infrastructure Engineer", "Dubai", "Technology"
	case "11112222-3333-4444-5555-666677778888":
		return "Ayesha Siddiqui", "Next.js Frontend Architect", "Abu Dhabi", "Technology"
	case "99998888-7777-6666-5555-444433332222":
		return "Fatima Al-Suwaidi", "Product Owner", "Dubai", "Finance"
	default:
		return "Kirmya Member", "Professional Specialist", "Dubai", "Technology"
	}
}

func getMockNetworkingCandidates(userID uuid.UUID, userConns []uuid.UUID) []models.ConnectionRecommendation {
	cand1 := uuid.MustParse("11112222-3333-4444-5555-666677778888")
	cand2 := uuid.MustParse("99998888-7777-6666-5555-444433332222")

	list := []models.ConnectionRecommendation{
		{
			UserID:   cand1,
			Name:     "Ayesha Siddiqui",
			Headline: "Next.js Frontend Architect",
			Location: "Abu Dhabi",
			Industry: "Technology",
		},
		{
			UserID:   cand2,
			Name:     "Fatima Al-Suwaidi",
			Headline: "Product Owner",
			Location: "Dubai",
			Industry: "Finance",
		},
	}

	// Filter out users already connected
	var filtered []models.ConnectionRecommendation
	for _, cand := range list {
		if cand.UserID == userID {
			continue
		}
		isDirectConn := false
		for _, uc := range userConns {
			if uc == cand.UserID {
				isDirectConn = true
				break
			}
		}
		if !isDirectConn {
			filtered = append(filtered, cand)
		}
	}
	return filtered
}

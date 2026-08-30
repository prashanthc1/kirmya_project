package service

import (
	"context"
	"fmt"
	netModels "kirmya/internal/networking/models"
	netRepo "kirmya/internal/networking/repository"
	profileRepo "kirmya/internal/profile/repository"
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

func (s *NetworkingService) SendConnectionRequest(ctx context.Context, senderID uuid.UUID, receiverID uuid.UUID, note string) (*netModels.ConnectionRequest, error) {
	if senderID == receiverID {
		return nil, fmt.Errorf("cannot connect with yourself")
	}

	if len(note) > 500 {
		return nil, fmt.Errorf("personal note exceeds maximum length of 500 characters")
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

	// Check duplicate pending request
	pending, err := s.repo.GetPendingRequestBetween(ctx, senderID, receiverID)
	if err == nil && pending != nil {
		return nil, fmt.Errorf("a connection request is already pending")
	}

	req := &netModels.ConnectionRequest{
		ID:         uuid.New(),
		SenderID:   senderID,
		ReceiverID: receiverID,
		Status:     "pending",
		Note:       strings.TrimSpace(note),
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if err := s.repo.CreateRequest(ctx, req); err != nil {
		return nil, err
	}
	return req, nil
}

func (s *NetworkingService) AcceptConnectionRequest(ctx context.Context, userID uuid.UUID, requestID uuid.UUID) error {
	return s.repo.AcceptRequestTx(ctx, requestID, userID)
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

func (s *NetworkingService) WithdrawConnectionRequest(ctx context.Context, userID uuid.UUID, requestID uuid.UUID) error {
	req, err := s.repo.GetRequest(ctx, requestID)
	if err != nil {
		return err
	}
	if req == nil {
		return fmt.Errorf("request not found")
	}
	if req.SenderID != userID {
		return fmt.Errorf("unauthorized request action")
	}

	return s.repo.UpdateRequestStatus(ctx, requestID, "withdrawn")
}

func (s *NetworkingService) RemoveConnection(ctx context.Context, userID uuid.UUID, targetUserID uuid.UUID) error {
	return s.repo.DeleteConnection(ctx, userID, targetUserID)
}

func (s *NetworkingService) FollowUser(ctx context.Context, followerID uuid.UUID, followingID uuid.UUID) error {
	if followerID == followingID {
		return fmt.Errorf("cannot follow yourself")
	}
	return s.repo.CreateFollow(ctx, followerID, followingID)
}

func (s *NetworkingService) UnfollowUser(ctx context.Context, followerID uuid.UUID, followingID uuid.UUID) error {
	return s.repo.DeleteFollow(ctx, followerID, followingID)
}

func (s *NetworkingService) DismissRecommendation(ctx context.Context, userID uuid.UUID, targetID uuid.UUID, reason string) error {
	if reason == "" {
		reason = "Not Interested"
	}
	return s.repo.DismissRecommendation(ctx, userID, targetID, reason)
}

func (s *NetworkingService) BlockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error {
	if blockerID == blockedID {
		return fmt.Errorf("cannot block yourself")
	}

	b := &netModels.BlockedUser{
		ID:        uuid.New(),
		BlockerID: blockerID,
		BlockedID: blockedID,
		CreatedAt: time.Now(),
	}

	return s.repo.CreateBlock(ctx, b)
}

func (s *NetworkingService) UnblockUser(ctx context.Context, blockerID uuid.UUID, blockedID uuid.UUID) error {
	return s.repo.DeleteBlock(ctx, blockerID, blockedID)
}

func (s *NetworkingService) ReportUser(ctx context.Context, reporterID uuid.UUID, targetID uuid.UUID, reason, details string) error {
	rep := &netModels.NetworkReport{
		ID:           uuid.New(),
		ReporterID:   reporterID,
		TargetUserID: targetID,
		Reason:       reason,
		Details:      details,
		Status:       "pending",
		CreatedAt:    time.Now(),
	}
	return s.repo.CreateReport(ctx, rep)
}

func (s *NetworkingService) SearchPeople(ctx context.Context, currentUserID uuid.UUID, filter netModels.PeopleSearchFilter) ([]netModels.PeopleSearchResult, error) {
	results, err := s.repo.SearchPeople(ctx, currentUserID, filter)
	if err != nil {
		return nil, err
	}

	// Enrich relationship status for each result
	for i := range results {
		s.enrichRelationshipStatus(ctx, currentUserID, &results[i])
	}
	return results, nil
}

func (s *NetworkingService) enrichRelationshipStatus(ctx context.Context, currentUserID uuid.UUID, res *netModels.PeopleSearchResult) {
	// Check connection status
	conn, err := s.repo.GetConnectionPair(ctx, currentUserID, res.UserID)
	if err == nil && conn != nil {
		res.ConnectionStatus = "connected"
		return
	}

	// Check pending request
	req, err := s.repo.GetPendingRequestBetween(ctx, currentUserID, res.UserID)
	if err == nil && req != nil {
		if req.SenderID == currentUserID {
			res.ConnectionStatus = "pending_sent"
		} else {
			res.ConnectionStatus = "pending_received"
		}
		return
	}

	// Check follow
	isFollowing, _ := s.repo.IsFollowing(ctx, currentUserID, res.UserID)
	res.IsFollowing = isFollowing

	res.ConnectionStatus = "none"
}

func (s *NetworkingService) ListIncomingRequests(ctx context.Context, userID uuid.UUID) ([]netModels.ConnectionRequest, error) {
	return s.repo.ListIncomingRequests(ctx, userID)
}

func (s *NetworkingService) ListSentRequests(ctx context.Context, userID uuid.UUID) ([]netModels.ConnectionRequest, error) {
	return s.repo.ListSentRequests(ctx, userID)
}

func (s *NetworkingService) ListConnections(ctx context.Context, userID uuid.UUID) ([]netModels.ConnectionRecommendation, error) {
	conns, err := s.repo.ListConnections(ctx, userID)
	if err != nil {
		return nil, err
	}

	var list []netModels.ConnectionRecommendation
	for _, connID := range conns {
		name, headline, location, industry := getMockProfileInfo(connID)
		list = append(list, netModels.ConnectionRecommendation{
			UserID:           connID,
			Name:             name,
			Headline:         headline,
			Location:         location,
			Industry:         industry,
			ConnectionStatus: "connected",
		})
	}
	return list, nil
}

func (s *NetworkingService) GetMutualConnections(ctx context.Context, currentUserID, targetUserID uuid.UUID) (*netModels.MutualConnectionsResult, error) {
	c1, _ := s.repo.ListConnections(ctx, currentUserID)
	c2, _ := s.repo.ListConnections(ctx, targetUserID)

	var mutuals []netModels.PeopleSearchResult
	for _, id1 := range c1 {
		for _, id2 := range c2 {
			if id1 == id2 {
				name, headline, location, industry := getMockProfileInfo(id1)
				mutuals = append(mutuals, netModels.PeopleSearchResult{
					UserID:           id1,
					Name:             name,
					Headline:         headline,
					Location:         location,
					Industry:         industry,
					ConnectionStatus: "connected",
				})
			}
		}
	}

	return &netModels.MutualConnectionsResult{
		TargetUserID: targetUserID,
		MutualCount:  len(mutuals),
		Mutuals:      mutuals,
	}, nil
}

func (s *NetworkingService) GetRecommendations(ctx context.Context, userID uuid.UUID) ([]netModels.ConnectionRecommendation, error) {
	userConns, err := s.repo.ListConnections(ctx, userID)
	if err != nil {
		userConns = []uuid.UUID{}
	}

	dismissedIDs, _ := s.repo.GetDismissedIDs(ctx, userID)

	if len(userConns) == 0 {
		salimID := uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
		userConns = append(userConns, salimID)
	}

	candidates := getMockNetworkingCandidates(userID, userConns)

	var recs []netModels.ConnectionRecommendation
	for _, cand := range candidates {
		// Check blocked
		blocked, err := s.repo.IsBlocked(ctx, userID, cand.UserID)
		if err == nil && blocked {
			continue
		}

		// Check dismissed
		isDismissed := false
		for _, dID := range dismissedIDs {
			if dID == cand.UserID {
				isDismissed = true
				break
			}
		}
		if isDismissed {
			continue
		}

		mutuals, matchScore := s.computeMutualsAndScore(ctx, userConns, cand.UserID, cand.Location, cand.Industry)
		cand.MutualConnections = mutuals
		cand.MutualCount = len(mutuals)
		cand.MatchScore = matchScore
		cand.ConnectionStatus = "none"

		if cand.MutualCount > 0 {
			cand.Reason = fmt.Sprintf("%d mutual connections", cand.MutualCount)
		} else {
			cand.Reason = fmt.Sprintf("Works in %s", cand.Industry)
		}

		recs = append(recs, cand)
	}

	return recs, nil
}

func (s *NetworkingService) computeMutualsAndScore(ctx context.Context, userConns []uuid.UUID, candID uuid.UUID, candLoc, candInd string) ([]string, int) {
	var candConns []uuid.UUID
	if s.repo != nil {
		candConns, _ = s.repo.ListConnections(ctx, candID)
	}

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

	score := len(mutualNames) * 20
	if score > 40 {
		score = 40
	}
	if strings.EqualFold(candLoc, "Dubai") {
		score += 20
	}
	if strings.EqualFold(candInd, "Technology") {
		score += 20
	}
	score += 20

	return mutualNames, score
}

func (s *NetworkingService) GetNetworkStats(ctx context.Context, userID uuid.UUID) (*netModels.NetworkGrowthStats, error) {
	return s.repo.GetNetworkStats(ctx, userID)
}

func (s *NetworkingService) GetAdminAnalytics(ctx context.Context) (*netModels.AdminNetworkAnalytics, error) {
	return s.repo.GetAdminAnalytics(ctx)
}

func (s *NetworkingService) GetAdminReports(ctx context.Context) ([]netModels.NetworkReport, error) {
	return s.repo.ListAdminReports(ctx)
}

// Helpers
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

func getMockNetworkingCandidates(userID uuid.UUID, userConns []uuid.UUID) []netModels.ConnectionRecommendation {
	cand1 := uuid.MustParse("11112222-3333-4444-5555-666677778888")
	cand2 := uuid.MustParse("99998888-7777-6666-5555-444433332222")

	list := []netModels.ConnectionRecommendation{
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

	var filtered []netModels.ConnectionRecommendation
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

// Connection Notes
func (s *NetworkingService) SaveConnectionNote(ctx context.Context, userID uuid.UUID, dto netModels.SaveNoteDTO) (*netModels.ConnectionNote, error) {
	if userID == dto.TargetUserID {
		return nil, fmt.Errorf("cannot create note for yourself")
	}

	content := strings.TrimSpace(dto.Content)
	if content == "" {
		return nil, fmt.Errorf("note content cannot be empty")
	}
	if len(content) > 2000 {
		return nil, fmt.Errorf("note content exceeds maximum length of 2000 characters")
	}

	conn, err := s.repo.GetConnectionPair(ctx, userID, dto.TargetUserID)
	if err != nil || conn == nil {
		return nil, fmt.Errorf("connection not found or unauthorized")
	}

	existing, _ := s.repo.GetNoteForConnection(ctx, userID, dto.TargetUserID)
	if existing != nil {
		existing.Content = content
		existing.UpdatedAt = time.Now()
		if err := s.repo.CreateNote(ctx, existing); err != nil {
			return nil, err
		}
		return existing, nil
	}

	note := &netModels.ConnectionNote{
		ID:           uuid.New(),
		UserID:       userID,
		ConnectionID: conn.ID,
		TargetUserID: dto.TargetUserID,
		Content:      content,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.repo.CreateNote(ctx, note); err != nil {
		return nil, err
	}
	return note, nil
}

func (s *NetworkingService) GetConnectionNote(ctx context.Context, userID, targetUserID uuid.UUID) (*netModels.ConnectionNote, error) {
	conn, err := s.repo.GetConnectionPair(ctx, userID, targetUserID)
	if err != nil || conn == nil {
		return nil, fmt.Errorf("connection not found or unauthorized")
	}

	return s.repo.GetNoteForConnection(ctx, userID, targetUserID)
}

func (s *NetworkingService) DeleteConnectionNote(ctx context.Context, userID, targetUserID uuid.UUID) error {
	conn, err := s.repo.GetConnectionPair(ctx, userID, targetUserID)
	if err != nil || conn == nil {
		return fmt.Errorf("connection not found or unauthorized")
	}

	return s.repo.DeleteNote(ctx, userID, targetUserID)
}

// Connection Labels
func (s *NetworkingService) AddConnectionLabel(ctx context.Context, userID uuid.UUID, dto netModels.SaveLabelDTO) (*netModels.ConnectionLabel, error) {
	if userID == dto.TargetUserID {
		return nil, fmt.Errorf("cannot label yourself")
	}

	labelStr := strings.TrimSpace(dto.Label)
	if labelStr == "" {
		return nil, fmt.Errorf("label cannot be empty")
	}
	if len(labelStr) > 50 {
		return nil, fmt.Errorf("label exceeds maximum length of 50 characters")
	}

	conn, err := s.repo.GetConnectionPair(ctx, userID, dto.TargetUserID)
	if err != nil || conn == nil {
		return nil, fmt.Errorf("connection not found or unauthorized")
	}

	existingLabels, _ := s.repo.GetLabelsForConnection(ctx, userID, dto.TargetUserID)
	for _, l := range existingLabels {
		if strings.EqualFold(l.Label, labelStr) {
			return nil, fmt.Errorf("label already assigned to connection")
		}
	}

	label := &netModels.ConnectionLabel{
		ID:           uuid.New(),
		UserID:       userID,
		ConnectionID: conn.ID,
		TargetUserID: dto.TargetUserID,
		Label:        labelStr,
		CreatedAt:    time.Now(),
	}

	if err := s.repo.AddLabel(ctx, label); err != nil {
		return nil, err
	}
	return label, nil
}

func (s *NetworkingService) RemoveConnectionLabel(ctx context.Context, userID, targetUserID uuid.UUID, label string) error {
	conn, err := s.repo.GetConnectionPair(ctx, userID, targetUserID)
	if err != nil || conn == nil {
		return fmt.Errorf("connection not found or unauthorized")
	}

	return s.repo.RemoveLabel(ctx, userID, targetUserID, strings.TrimSpace(label))
}

func (s *NetworkingService) GetConnectionLabels(ctx context.Context, userID, targetUserID uuid.UUID) ([]netModels.ConnectionLabel, error) {
	conn, err := s.repo.GetConnectionPair(ctx, userID, targetUserID)
	if err != nil || conn == nil {
		return nil, fmt.Errorf("connection not found or unauthorized")
	}

	return s.repo.GetLabelsForConnection(ctx, userID, targetUserID)
}

// Networking Goals
func (s *NetworkingService) CreateNetworkingGoal(ctx context.Context, userID uuid.UUID, dto netModels.CreateNetworkingGoalDTO) (*netModels.NetworkingGoal, error) {
	title := strings.TrimSpace(dto.Title)
	if title == "" {
		return nil, fmt.Errorf("goal title is required")
	}
	if dto.TargetCount < 1 {
		return nil, fmt.Errorf("target count must be at least 1")
	}

	goal := &netModels.NetworkingGoal{
		ID:           uuid.New(),
		UserID:       userID,
		Title:        title,
		Description:  strings.TrimSpace(dto.Description),
		TargetCount:  dto.TargetCount,
		CurrentCount: 0,
		Category:     strings.TrimSpace(dto.Category),
		Status:       "active",
		Deadline:     strings.TrimSpace(dto.Deadline),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.repo.CreateGoal(ctx, goal); err != nil {
		return nil, err
	}
	return goal, nil
}

func (s *NetworkingService) GetNetworkingGoals(ctx context.Context, userID uuid.UUID) ([]netModels.NetworkingGoal, error) {
	return s.repo.GetGoals(ctx, userID)
}

func (s *NetworkingService) UpdateNetworkingGoal(ctx context.Context, userID, goalID uuid.UUID, dto netModels.UpdateNetworkingGoalDTO) (*netModels.NetworkingGoal, error) {
	goal, err := s.repo.GetGoalByID(ctx, userID, goalID)
	if err != nil || goal == nil || goal.UserID != userID {
		return nil, fmt.Errorf("goal not found or unauthorized")
	}

	if strings.TrimSpace(dto.Title) != "" {
		goal.Title = strings.TrimSpace(dto.Title)
	}
	if dto.Description != "" {
		goal.Description = strings.TrimSpace(dto.Description)
	}
	if dto.TargetCount > 0 {
		goal.TargetCount = dto.TargetCount
	}
	if dto.CurrentCount >= 0 {
		goal.CurrentCount = dto.CurrentCount
	}
	if dto.Category != "" {
		goal.Category = strings.TrimSpace(dto.Category)
	}
	if dto.Status != "" {
		goal.Status = strings.TrimSpace(dto.Status)
	}
	if dto.Deadline != "" {
		goal.Deadline = strings.TrimSpace(dto.Deadline)
	}

	if goal.CurrentCount >= goal.TargetCount {
		goal.Status = "completed"
	}
	goal.UpdatedAt = time.Now()

	if err := s.repo.UpdateGoal(ctx, goal); err != nil {
		return nil, err
	}
	return goal, nil
}

func (s *NetworkingService) DeleteNetworkingGoal(ctx context.Context, userID, goalID uuid.UUID) error {
	goal, err := s.repo.GetGoalByID(ctx, userID, goalID)
	if err != nil || goal == nil || goal.UserID != userID {
		return fmt.Errorf("goal not found or unauthorized")
	}

	return s.repo.DeleteGoal(ctx, userID, goalID)
}

// Company Connections (Referrals)
func (s *NetworkingService) GetCompanyConnections(ctx context.Context, userID uuid.UUID, companyID string) ([]netModels.CompanyConnectionDTO, error) {
	companyID = strings.TrimSpace(companyID)
	if companyID == "" {
		return nil, fmt.Errorf("company identifier is required")
	}

	return s.repo.GetConnectionsAtCompany(ctx, userID, companyID)
}

// Following & Followers
func (s *NetworkingService) GetFollowing(ctx context.Context, userID uuid.UUID) ([]netModels.PeopleSearchResult, error) {
	return s.repo.GetFollowing(ctx, userID)
}

func (s *NetworkingService) GetFollowers(ctx context.Context, userID uuid.UUID) ([]netModels.PeopleSearchResult, error) {
	return s.repo.GetFollowers(ctx, userID)
}


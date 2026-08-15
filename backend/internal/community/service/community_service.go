package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"kirmya/internal/community/models"
	"kirmya/internal/community/repository"

	"github.com/google/uuid"
)

type CommunityService struct {
	repo *repository.CommunityRepository
}

func NewCommunityService(repo *repository.CommunityRepository) *CommunityService {
	return &CommunityService{repo: repo}
}

// --- Helpers & RBAC ---

func (s *CommunityService) validateCommunityAccess(ctx context.Context, communityID uuid.UUID, userID uuid.UUID) (*models.Community, *models.CommunityMember, error) {
	comm, err := s.repo.GetByID(ctx, communityID)
	if err != nil {
		return nil, nil, err
	}
	if comm == nil {
		return nil, nil, fmt.Errorf("community not found")
	}

	var mem *models.CommunityMember
	if userID != uuid.Nil {
		mem, _ = s.repo.GetMember(ctx, communityID, userID)
	}

	// Check if banned
	if mem != nil && mem.Status == "banned" {
		return nil, nil, fmt.Errorf("user has been banned from this community")
	}

	// Enforce visibility
	if comm.Visibility == "private" || comm.Visibility == "invite_only" || comm.IsPrivate {
		if mem == nil || mem.Status != "active" {
			return nil, nil, fmt.Errorf("access denied to private community")
		}
	}

	return comm, mem, nil
}

func (s *CommunityService) isModeratorOrHigher(mem *models.CommunityMember) bool {
	if mem == nil || mem.Status != "active" {
		return false
	}
	return mem.RoleName == "owner" || mem.RoleName == "admin" || mem.RoleName == "moderator"
}

func (s *CommunityService) isAdminOrHigher(mem *models.CommunityMember) bool {
	if mem == nil || mem.Status != "active" {
		return false
	}
	return mem.RoleName == "owner" || mem.RoleName == "admin"
}

// --- Communities CRUD & Discovery ---

func (s *CommunityService) CreateCommunity(ctx context.Context, userID uuid.UUID, dto models.CreateCommunityDTO) (*models.Community, error) {
	cID := uuid.New()
	visibility := dto.Visibility
	if visibility == "" {
		visibility = "public"
	}
	isPrivate := (visibility == "private" || visibility == "invite_only")

	c := &models.Community{
		ID:            cID,
		Title:         dto.Title,
		Description:   dto.Description,
		Category:      dto.Category,
		Location:      dto.Location,
		Visibility:    visibility,
		IsPrivate:     isPrivate,
		LogoUrl:       dto.LogoUrl,
		CoverImageUrl: dto.CoverImageUrl,
		Rules:         dto.Rules,
		Topics:        dto.Topics,
		Skills:        dto.Skills,
		OwnerID:       userID,
		MemberCount:   1,
		PostCount:     0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}

	// Creator auto-joins as Owner
	owner := &models.CommunityMember{
		ID:          uuid.New(),
		CommunityID: cID,
		UserID:      userID,
		RoleName:    "owner",
		Status:      "active",
		JoinedAt:    time.Now(),
		CreatedAt:   time.Now(),
	}
	_ = s.repo.CreateMember(ctx, owner)

	return c, nil
}

func (s *CommunityService) UpdateCommunity(ctx context.Context, userID uuid.UUID, communityID uuid.UUID, dto models.UpdateCommunityDTO) (*models.Community, error) {
	comm, mem, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}

	if !s.isAdminOrHigher(mem) {
		return nil, fmt.Errorf("permission denied to update community settings")
	}

	if dto.Title != "" {
		comm.Title = dto.Title
	}
	if dto.Description != "" {
		comm.Description = dto.Description
	}
	if dto.Category != "" {
		comm.Category = dto.Category
	}
	if dto.Location != "" {
		comm.Location = dto.Location
	}
	if dto.Visibility != "" {
		comm.Visibility = dto.Visibility
		comm.IsPrivate = (dto.Visibility == "private" || dto.Visibility == "invite_only")
	}
	if dto.LogoUrl != "" {
		comm.LogoUrl = dto.LogoUrl
	}
	if dto.CoverImageUrl != "" {
		comm.CoverImageUrl = dto.CoverImageUrl
	}
	if dto.Rules != nil {
		comm.Rules = dto.Rules
	}
	if dto.Topics != nil {
		comm.Topics = dto.Topics
	}
	if dto.Skills != nil {
		comm.Skills = dto.Skills
	}

	if err := s.repo.Update(ctx, comm); err != nil {
		return nil, err
	}
	return comm, nil
}

func (s *CommunityService) GetCommunity(ctx context.Context, userID uuid.UUID, communityID uuid.UUID) (*models.Community, error) {
	comm, _, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	return comm, nil
}

func (s *CommunityService) ListCommunities(ctx context.Context, params models.CommunityFilterParams) ([]models.Community, error) {
	return s.repo.List(ctx, params)
}

func (s *CommunityService) SearchCommunities(ctx context.Context, query string, params models.CommunityFilterParams) ([]models.Community, error) {
	// OpenSearch fallback to Postgres repo search
	return s.repo.Search(ctx, query, params)
}

func (s *CommunityService) GetRecommendedCommunities(ctx context.Context, userID uuid.UUID, userSkills []string, userIndustry string) ([]models.Community, error) {
	all, err := s.repo.List(ctx, models.CommunityFilterParams{})
	if err != nil {
		return nil, err
	}

	type scoredComm struct {
		comm  models.Community
		score int
	}

	var scored []scoredComm
	skillsMap := make(map[string]bool)
	for _, sk := range userSkills {
		skillsMap[strings.ToLower(sk)] = true
	}

	for _, c := range all {
		// Only recommend public or private communities, skip invite_only
		if c.Visibility == "invite_only" {
			continue
		}

		score := 0
		if userIndustry != "" && strings.EqualFold(c.Category, userIndustry) {
			score += 10
		}

		for _, topic := range c.Topics {
			if skillsMap[strings.ToLower(topic)] {
				score += 5
			}
		}

		for _, skill := range c.Skills {
			if skillsMap[strings.ToLower(skill)] {
				score += 5
			}
		}

		// Higher member count bonus
		score += c.MemberCount / 10

		if score > 0 {
			scored = append(scored, scoredComm{comm: c, score: score})
		}
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	var result []models.Community
	for _, sc := range scored {
		result = append(result, sc.comm)
	}

	// If no matched recommendations, return top public communities
	if len(result) == 0 {
		for _, c := range all {
			if c.Visibility != "invite_only" {
				result = append(result, c)
			}
		}
	}

	return result, nil
}

// --- Member Management & Invites ---

func (s *CommunityService) RequestToJoin(ctx context.Context, userID uuid.UUID, communityID uuid.UUID) error {
	comm, err := s.repo.GetByID(ctx, communityID)
	if err != nil {
		return err
	}
	if comm == nil {
		return fmt.Errorf("community workspace not found")
	}

	if comm.Visibility == "invite_only" {
		return fmt.Errorf("joining invite-only communities requires an invitation")
	}

	existing, _ := s.repo.GetMember(ctx, communityID, userID)
	if existing != nil {
		if existing.Status == "banned" {
			return fmt.Errorf("banned from joining community")
		}
		if existing.Status == "active" {
			return fmt.Errorf("already an active member")
		}
	}

	status := "active"
	if comm.Visibility == "private" || comm.IsPrivate {
		status = "pending"
	}

	m := &models.CommunityMember{
		ID:          uuid.New(),
		CommunityID: communityID,
		UserID:      userID,
		RoleName:    "member",
		Status:      status,
		JoinedAt:    time.Now(),
		CreatedAt:   time.Now(),
	}

	if err := s.repo.CreateMember(ctx, m); err != nil {
		return err
	}

	if status == "active" {
		_ = s.repo.IncrementMemberCount(ctx, communityID, 1)
	}

	return nil
}

func (s *CommunityService) ApproveMembership(ctx context.Context, adminID uuid.UUID, communityID uuid.UUID, candidateID uuid.UUID, approve bool) error {
	adminMem, err := s.repo.GetMember(ctx, communityID, adminID)
	if err != nil {
		return err
	}
	if !s.isAdminOrHigher(adminMem) {
		return fmt.Errorf("permission denied to approve members")
	}

	if approve {
		err := s.repo.UpdateMemberStatus(ctx, communityID, candidateID, "active")
		if err == nil {
			_ = s.repo.IncrementMemberCount(ctx, communityID, 1)
		}
		return err
	} else {
		return s.repo.UpdateMemberStatus(ctx, communityID, candidateID, "rejected")
	}
}

func (s *CommunityService) InviteUser(ctx context.Context, inviterID uuid.UUID, communityID uuid.UUID, invitedUserID uuid.UUID) (*models.CommunityInvite, error) {
	_, inviterMem, err := s.validateCommunityAccess(ctx, communityID, inviterID)
	if err != nil {
		return nil, err
	}
	if inviterMem == nil || inviterMem.Status != "active" {
		return nil, fmt.Errorf("only active members can send invites")
	}

	inv := &models.CommunityInvite{
		ID:            uuid.New(),
		CommunityID:   communityID,
		InviterID:     inviterID,
		InvitedUserID: invitedUserID,
		Status:        "pending",
		CreatedAt:     time.Now(),
	}

	if err := s.repo.CreateInvite(ctx, inv); err != nil {
		return nil, err
	}

	return inv, nil
}

func (s *CommunityService) RespondToInvite(ctx context.Context, userID uuid.UUID, inviteID uuid.UUID, accept bool) error {
	inv, err := s.repo.GetInviteByID(ctx, inviteID)
	if err != nil {
		return err
	}
	if inv == nil {
		return fmt.Errorf("invite not found")
	}
	if inv.InvitedUserID != userID {
		return fmt.Errorf("permission denied to respond to this invite")
	}
	if inv.Status != "pending" {
		return fmt.Errorf("invite is no longer pending")
	}

	if accept {
		_ = s.repo.UpdateInviteStatus(ctx, inviteID, "accepted")
		m := &models.CommunityMember{
			ID:          uuid.New(),
			CommunityID: inv.CommunityID,
			UserID:      userID,
			RoleName:    "member",
			Status:      "active",
			JoinedAt:    time.Now(),
			CreatedAt:   time.Now(),
		}
		if err := s.repo.CreateMember(ctx, m); err != nil {
			return err
		}
		return s.repo.IncrementMemberCount(ctx, inv.CommunityID, 1)
	} else {
		return s.repo.UpdateInviteStatus(ctx, inviteID, "declined")
	}
}

func (s *CommunityService) AssignRole(ctx context.Context, ownerID uuid.UUID, communityID uuid.UUID, targetUserID uuid.UUID, targetRole string) error {
	ownerMem, err := s.repo.GetMember(ctx, communityID, ownerID)
	if err != nil {
		return err
	}
	if ownerMem == nil || ownerMem.RoleName != "owner" {
		return fmt.Errorf("only workspace owners can assign roles")
	}

	if targetRole != "admin" && targetRole != "moderator" && targetRole != "member" {
		return fmt.Errorf("invalid target role name")
	}

	return s.repo.UpdateMemberRole(ctx, communityID, targetUserID, targetRole)
}

func (s *CommunityService) ListMembers(ctx context.Context, userID uuid.UUID, communityID uuid.UUID) ([]models.CommunityMember, error) {
	_, _, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	return s.repo.ListMembers(ctx, communityID)
}

func (s *CommunityService) LeaveCommunity(ctx context.Context, userID uuid.UUID, communityID uuid.UUID) error {
	mem, err := s.repo.GetMember(ctx, communityID, userID)
	if err != nil || mem == nil {
		return fmt.Errorf("member not found")
	}
	if mem.RoleName == "owner" {
		return fmt.Errorf("owner cannot leave community without transferring ownership")
	}

	if err := s.repo.DeleteMember(ctx, communityID, userID); err != nil {
		return err
	}
	return s.repo.IncrementMemberCount(ctx, communityID, -1)
}

func (s *CommunityService) ListPendingRequests(ctx context.Context, adminID uuid.UUID, communityID uuid.UUID) ([]models.CommunityMember, error) {
	adminMem, err := s.repo.GetMember(ctx, communityID, adminID)
	if err != nil {
		return nil, err
	}
	if !s.isAdminOrHigher(adminMem) {
		return nil, fmt.Errorf("permission denied to list pending join requests")
	}
	return s.repo.ListPendingRequests(ctx, communityID)
}

// --- Discussions / Posts ---

func (s *CommunityService) CreatePost(ctx context.Context, userID uuid.UUID, communityID uuid.UUID, dto models.CreateDiscussionDTO) (*models.CommunityPost, error) {
	_, mem, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	if mem == nil || mem.Status != "active" {
		return nil, fmt.Errorf("must be an active member to write posts")
	}

	p := &models.CommunityPost{
		ID:             uuid.New(),
		CommunityID:    communityID,
		UserID:         userID,
		Title:          dto.Title,
		Content:        dto.Content,
		IsPinned:       false,
		IsLocked:       false,
		IsAnnouncement: dto.IsAnnouncement,
		Tags:           dto.Tags,
		CommentCount:   0,
		ReactionsCount: 0,
		CreatedAt:      time.Now(),
	}

	if err := s.repo.CreatePost(ctx, p); err != nil {
		return nil, err
	}

	_ = s.repo.IncrementPostCount(ctx, communityID, 1)

	return p, nil
}

func (s *CommunityService) GetPost(ctx context.Context, userID uuid.UUID, communityID uuid.UUID, postID uuid.UUID) (*models.CommunityPost, error) {
	_, _, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}

	p, err := s.repo.GetPostByID(ctx, postID)
	if err != nil {
		return nil, err
	}
	if p == nil || p.CommunityID != communityID {
		return nil, fmt.Errorf("post not found")
	}
	return p, nil
}

func (s *CommunityService) ListPosts(ctx context.Context, userID uuid.UUID, communityID uuid.UUID) ([]models.CommunityPost, error) {
	_, _, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	return s.repo.ListPosts(ctx, communityID)
}

func (s *CommunityService) DeletePost(ctx context.Context, moderatorID uuid.UUID, communityID uuid.UUID, postID uuid.UUID) error {
	p, err := s.repo.GetPostByID(ctx, postID)
	if err != nil || p == nil {
		return fmt.Errorf("post not found")
	}

	mem, err := s.repo.GetMember(ctx, communityID, moderatorID)
	if err != nil {
		return err
	}

	// Author can delete their own post, or moderator/admin/owner can delete
	if p.UserID != moderatorID && !s.isModeratorOrHigher(mem) {
		return fmt.Errorf("permission denied to moderate content")
	}

	if err := s.repo.DeletePost(ctx, postID); err != nil {
		return err
	}
	return s.repo.IncrementPostCount(ctx, communityID, -1)
}

func (s *CommunityService) PinPost(ctx context.Context, moderatorID uuid.UUID, communityID uuid.UUID, postID uuid.UUID, pin bool) error {
	mem, err := s.repo.GetMember(ctx, communityID, moderatorID)
	if err != nil {
		return err
	}
	if !s.isModeratorOrHigher(mem) {
		return fmt.Errorf("permission denied to pin discussions")
	}

	return s.repo.SetPinned(ctx, postID, pin)
}

func (s *CommunityService) LockPost(ctx context.Context, moderatorID uuid.UUID, communityID uuid.UUID, postID uuid.UUID, lock bool) error {
	mem, err := s.repo.GetMember(ctx, communityID, moderatorID)
	if err != nil {
		return err
	}
	if !s.isModeratorOrHigher(mem) {
		return fmt.Errorf("permission denied to lock discussions")
	}

	return s.repo.SetLocked(ctx, postID, lock)
}

// --- Comments ---

func (s *CommunityService) CreateComment(ctx context.Context, userID uuid.UUID, communityID uuid.UUID, postID uuid.UUID, dto models.CreateCommentDTO) (*models.CommunityComment, error) {
	_, mem, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	if mem == nil || mem.Status != "active" {
		return nil, fmt.Errorf("must be an active member to write comments")
	}

	p, err := s.repo.GetPostByID(ctx, postID)
	if err != nil || p == nil {
		return nil, fmt.Errorf("post not found")
	}
	if p.IsLocked {
		return nil, fmt.Errorf("discussion thread is locked for new comments")
	}

	c := &models.CommunityComment{
		ID:          uuid.New(),
		PostID:      postID,
		CommunityID: communityID,
		UserID:      userID,
		Content:     dto.Content,
		CreatedAt:   time.Now(),
	}

	if err := s.repo.CreateComment(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *CommunityService) ListComments(ctx context.Context, userID uuid.UUID, communityID uuid.UUID, postID uuid.UUID) ([]models.CommunityComment, error) {
	_, _, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	return s.repo.ListComments(ctx, postID)
}

// --- Events ---

func (s *CommunityService) CreateEvent(ctx context.Context, userID uuid.UUID, communityID uuid.UUID, dto models.CreateCommunityEventDTO) (*models.CommunityEvent, error) {
	_, mem, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	if !s.isModeratorOrHigher(mem) {
		return nil, fmt.Errorf("permission denied to organize community events")
	}

	event := &models.CommunityEvent{
		ID:            uuid.New(),
		CommunityID:   communityID,
		Title:         dto.Title,
		Description:   dto.Description,
		ScheduledAt:   dto.ScheduledAt,
		Location:      dto.Location,
		MeetingUrl:    dto.MeetingUrl,
		OrganizedByID: userID,
		AttendeeCount: 1,
		CreatedAt:     time.Now(),
	}

	if err := s.repo.CreateEvent(ctx, event); err != nil {
		return nil, err
	}
	return event, nil
}

func (s *CommunityService) ListEvents(ctx context.Context, userID uuid.UUID, communityID uuid.UUID) ([]models.CommunityEvent, error) {
	_, _, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	return s.repo.ListEvents(ctx, communityID)
}

// --- Resources ---

func (s *CommunityService) CreateResource(ctx context.Context, userID uuid.UUID, communityID uuid.UUID, dto models.CreateCommunityResourceDTO) (*models.CommunityResource, error) {
	_, mem, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	if mem == nil || mem.Status != "active" {
		return nil, fmt.Errorf("must be an active member to share resources")
	}

	res := &models.CommunityResource{
		ID:          uuid.New(),
		CommunityID: communityID,
		Title:       dto.Title,
		Url:         dto.Url,
		Category:    dto.Category,
		SharedByID:  userID,
		CreatedAt:   time.Now(),
	}

	if err := s.repo.CreateResource(ctx, res); err != nil {
		return nil, err
	}
	return res, nil
}

func (s *CommunityService) ListResources(ctx context.Context, userID uuid.UUID, communityID uuid.UUID) ([]models.CommunityResource, error) {
	_, _, err := s.validateCommunityAccess(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	return s.repo.ListResources(ctx, communityID)
}

// --- Moderation & Audit ---

func (s *CommunityService) ModerateMember(ctx context.Context, moderatorID uuid.UUID, communityID uuid.UUID, dto models.ModerateMemberDTO) error {
	mem, err := s.repo.GetMember(ctx, communityID, moderatorID)
	if err != nil {
		return err
	}
	if !s.isModeratorOrHigher(mem) {
		return fmt.Errorf("permission denied to perform moderation actions")
	}

	act := &models.CommunityModerationAction{
		ID:           uuid.New(),
		CommunityID:  communityID,
		ModeratorID:  moderatorID,
		TargetUserID: dto.TargetUserID,
		Action:       dto.Action,
		Reason:       dto.Reason,
		CreatedAt:    time.Now(),
	}

	if err := s.repo.CreateModerationAction(ctx, act); err != nil {
		return err
	}

	switch dto.Action {
	case "ban_member":
		_ = s.repo.UpdateMemberStatus(ctx, communityID, dto.TargetUserID, "banned")
		_ = s.repo.IncrementMemberCount(ctx, communityID, -1)
	case "remove_member":
		_ = s.repo.DeleteMember(ctx, communityID, dto.TargetUserID)
		_ = s.repo.IncrementMemberCount(ctx, communityID, -1)
	}

	return nil
}

func (s *CommunityService) ListModerationActions(ctx context.Context, moderatorID uuid.UUID, communityID uuid.UUID) ([]models.CommunityModerationAction, error) {
	mem, err := s.repo.GetMember(ctx, communityID, moderatorID)
	if err != nil {
		return nil, err
	}
	if !s.isModeratorOrHigher(mem) {
		return nil, fmt.Errorf("permission denied to view moderation logs")
	}

	return s.repo.ListModerationActions(ctx, communityID)
}

func (s *CommunityService) ReportPost(ctx context.Context, reporterID uuid.UUID, postID uuid.UUID, reason string) error {
	rep := &models.CommunityReport{
		ID:         uuid.New(),
		PostID:     postID,
		ReporterID: reporterID,
		Reason:     reason,
		IsResolved: false,
		CreatedAt:  time.Now(),
	}

	return s.repo.CreateReport(ctx, rep)
}

func (s *CommunityService) ListReports(ctx context.Context, moderatorID uuid.UUID, communityID uuid.UUID) ([]models.CommunityReport, error) {
	mem, err := s.repo.GetMember(ctx, communityID, moderatorID)
	if err != nil {
		return nil, err
	}
	if !s.isModeratorOrHigher(mem) {
		return nil, fmt.Errorf("permission denied to view reported content")
	}

	return s.repo.ListReports(ctx, communityID)
}

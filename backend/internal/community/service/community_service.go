package service

import (
	"context"
	"fmt"
	"kirmya/internal/community/models"
	"kirmya/internal/community/repository"
	"time"

	"github.com/google/uuid"
)

type CommunityService struct {
	repo *repository.CommunityRepository
}

func NewCommunityService(repo *repository.CommunityRepository) *CommunityService {
	return &CommunityService{repo: repo}
}

func (s *CommunityService) CreateCommunity(ctx context.Context, userID uuid.UUID, title string, desc string, category string, location string, isPrivate bool) (*models.Community, error) {
	cID := uuid.New()
	c := &models.Community{
		ID:          cID,
		Title:       title,
		Description: desc,
		Category:    category,
		Location:    location,
		IsPrivate:   isPrivate,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}

	// Auto-join creator as Owner
	owner := &models.CommunityMember{
		ID:          uuid.New(),
		CommunityID: cID,
		UserID:      userID,
		RoleName:    "owner",
		Status:      "active",
		CreatedAt:   time.Now(),
	}
	_ = s.repo.CreateMember(ctx, owner)

	return c, nil
}

func (s *CommunityService) ListCommunities(ctx context.Context, category string, location string) ([]models.Community, error) {
	return s.repo.List(ctx, category, location)
}

func (s *CommunityService) RequestToJoin(ctx context.Context, userID uuid.UUID, communityID uuid.UUID) error {
	comm, err := s.repo.GetByID(ctx, communityID)
	if err != nil {
		return err
	}
	if comm == nil {
		return fmt.Errorf("community workspace not found")
	}

	status := "active"
	if comm.IsPrivate {
		status = "pending"
	}

	m := &models.CommunityMember{
		ID:          uuid.New(),
		CommunityID: communityID,
		UserID:      userID,
		RoleName:    "member",
		Status:      status,
		CreatedAt:   time.Now(),
	}
	return s.repo.CreateMember(ctx, m)
}

func (s *CommunityService) ApproveMembership(ctx context.Context, adminID uuid.UUID, communityID uuid.UUID, candidateID uuid.UUID, approve bool) error {
	// Check admin permissions
	adminMem, err := s.repo.GetMember(ctx, communityID, adminID)
	if err != nil {
		return err
	}
	if adminMem == nil || (adminMem.RoleName != "owner" && adminMem.RoleName != "admin") {
		return fmt.Errorf("permission denied to approve members")
	}

	if approve {
		return s.repo.UpdateMemberStatus(ctx, communityID, candidateID, "active")
	} else {
		return s.repo.DeleteMember(ctx, communityID, candidateID)
	}
}

func (s *CommunityService) AssignRole(ctx context.Context, ownerID uuid.UUID, communityID uuid.UUID, targetUserID uuid.UUID, targetRole string) error {
	// Only owner can assign roles
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

func (s *CommunityService) CreatePost(ctx context.Context, userID uuid.UUID, communityID uuid.UUID, content string) (*models.CommunityPost, error) {
	// Verify user is an active member
	mem, err := s.repo.GetMember(ctx, communityID, userID)
	if err != nil {
		return nil, err
	}
	if mem == nil || mem.Status != "active" {
		return nil, fmt.Errorf("must be an active member to write posts")
	}

	p := &models.CommunityPost{
		ID:          uuid.New(),
		CommunityID: communityID,
		UserID:      userID,
		Content:     content,
		CreatedAt:   time.Now(),
	}

	if err := s.repo.CreatePost(ctx, p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *CommunityService) ListPosts(ctx context.Context, userID uuid.UUID, communityID uuid.UUID) ([]models.CommunityPost, error) {
	// Verify user is member if community is private
	comm, err := s.repo.GetByID(ctx, communityID)
	if err != nil {
		return nil, err
	}
	if comm == nil {
		return nil, fmt.Errorf("community not found")
	}

	if comm.IsPrivate {
		mem, err := s.repo.GetMember(ctx, communityID, userID)
		if err != nil || mem == nil || mem.Status != "active" {
			return nil, fmt.Errorf("access denied to private community board")
		}
	}

	return s.repo.ListPosts(ctx, communityID)
}

func (s *CommunityService) DeletePost(ctx context.Context, moderatorID uuid.UUID, communityID uuid.UUID, postID uuid.UUID) error {
	// Check if moderator is owner, admin, or moderator of the community
	mem, err := s.repo.GetMember(ctx, communityID, moderatorID)
	if err != nil {
		return err
	}
	if mem == nil || (mem.RoleName != "owner" && mem.RoleName != "admin" && mem.RoleName != "moderator") {
		return fmt.Errorf("permission denied to moderate content")
	}

	return s.repo.DeletePost(ctx, postID)
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

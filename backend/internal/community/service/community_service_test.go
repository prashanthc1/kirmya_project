package service

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/community/models"
	"kirmya/internal/community/repository"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestService() (*CommunityService, *repository.CommunityRepository) {
	repo := repository.NewCommunityRepository(nil)
	svc := NewCommunityService(repo)
	return svc, repo
}

func TestCommunityPermissions(t *testing.T) {
	svc, _ := setupTestService()

	modMem := &models.CommunityMember{RoleName: "moderator", Status: "active"}
	adminMem := &models.CommunityMember{RoleName: "admin", Status: "active"}
	ownerMem := &models.CommunityMember{RoleName: "owner", Status: "active"}
	memberMem := &models.CommunityMember{RoleName: "member", Status: "active"}

	assert.True(t, svc.isModeratorOrHigher(modMem))
	assert.True(t, svc.isModeratorOrHigher(adminMem))
	assert.True(t, svc.isModeratorOrHigher(ownerMem))
	assert.False(t, svc.isModeratorOrHigher(memberMem))

	assert.False(t, svc.isAdminOrHigher(modMem))
	assert.True(t, svc.isAdminOrHigher(adminMem))
	assert.True(t, svc.isAdminOrHigher(ownerMem))
}

func TestCommunityCreationAndOwnerAutoJoin(t *testing.T) {
	svc, repo := setupTestService()
	ctx := context.Background()
	ownerID := uuid.New()

	dto := models.CreateCommunityDTO{
		Title:       "Golang Backend Engineering",
		Description: "Community for Go developers",
		Category:    "Software Engineering",
		Visibility:  "public",
		Topics:      []string{"golang", "microservices"},
		Skills:      []string{"Go", "PostgreSQL"},
	}

	comm, err := svc.CreateCommunity(ctx, ownerID, dto)
	require.NoError(t, err)
	assert.Equal(t, "Golang Backend Engineering", comm.Title)
	assert.Equal(t, 1, comm.MemberCount)

	mem, err := repo.GetMember(ctx, comm.ID, ownerID)
	require.NoError(t, err)
	require.NotNil(t, mem)
	assert.Equal(t, "owner", mem.RoleName)
	assert.Equal(t, "active", mem.Status)
}

func TestPrivateCommunityAccessLogic(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()

	ownerID := uuid.New()
	nonMemberID := uuid.New()

	dto := models.CreateCommunityDTO{
		Title:      "Stealth Founders Hub",
		Visibility: "private",
	}

	comm, err := svc.CreateCommunity(ctx, ownerID, dto)
	require.NoError(t, err)

	// Owner can access
	retrieved, err := svc.GetCommunity(ctx, ownerID, comm.ID)
	require.NoError(t, err)
	assert.Equal(t, comm.ID, retrieved.ID)

	// Non-member access denied
	_, err = svc.GetCommunity(ctx, nonMemberID, comm.ID)
	require.Error(t, err)
	assert.Contains(t, err.Error(), "access denied")
}

func TestJoinRequestAndApprove(t *testing.T) {
	svc, repo := setupTestService()
	ctx := context.Background()

	ownerID := uuid.New()
	candidateID := uuid.New()

	comm, err := svc.CreateCommunity(ctx, ownerID, models.CreateCommunityDTO{
		Title:      "Private Tech Lead Network",
		Visibility: "private",
	})
	require.NoError(t, err)

	// Candidate requests to join
	err = svc.RequestToJoin(ctx, candidateID, comm.ID)
	require.NoError(t, err)

	mem, err := repo.GetMember(ctx, comm.ID, candidateID)
	require.NoError(t, err)
	assert.Equal(t, "pending", mem.Status)

	// Owner approves candidate
	err = svc.ApproveMembership(ctx, ownerID, comm.ID, candidateID, true)
	require.NoError(t, err)

	mem, err = repo.GetMember(ctx, comm.ID, candidateID)
	require.NoError(t, err)
	assert.Equal(t, "active", mem.Status)
}

func TestDiscussionPinningAndLocking(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()

	ownerID := uuid.New()
	memberID := uuid.New()

	comm, err := svc.CreateCommunity(ctx, ownerID, models.CreateCommunityDTO{
		Title:      "DevOps & SRE",
		Visibility: "public",
	})
	require.NoError(t, err)

	_ = svc.RequestToJoin(ctx, memberID, comm.ID)

	// Member creates post
	post, err := svc.CreatePost(ctx, memberID, comm.ID, models.CreateDiscussionDTO{
		Title:   "Kubernetes Best Practices",
		Content: "Here are top tips for cluster scaling...",
	})
	require.NoError(t, err)
	assert.False(t, post.IsPinned)
	assert.False(t, post.IsLocked)

	// Member cannot pin post
	err = svc.PinPost(ctx, memberID, comm.ID, post.ID, true)
	require.Error(t, err)

	// Owner (moderator) pins and locks post
	err = svc.PinPost(ctx, ownerID, comm.ID, post.ID, true)
	require.NoError(t, err)

	err = svc.LockPost(ctx, ownerID, comm.ID, post.ID, true)
	require.NoError(t, err)

	// Member cannot comment on locked post
	_, err = svc.CreateComment(ctx, memberID, comm.ID, post.ID, models.CreateCommentDTO{
		Content: "Agreed with tip #2!",
	})
	require.Error(t, err)
	assert.Contains(t, err.Error(), "locked")
}

func TestModerationActions(t *testing.T) {
	svc, repo := setupTestService()
	ctx := context.Background()

	ownerID := uuid.New()
	spammerID := uuid.New()

	comm, err := svc.CreateCommunity(ctx, ownerID, models.CreateCommunityDTO{
		Title:      "Data Engineering",
		Visibility: "public",
	})
	require.NoError(t, err)

	_ = svc.RequestToJoin(ctx, spammerID, comm.ID)

	// Owner bans spammer
	err = svc.ModerateMember(ctx, ownerID, comm.ID, models.ModerateMemberDTO{
		TargetUserID: spammerID,
		Action:       "ban_member",
		Reason:       "Repeated promotional spam",
	})
	require.NoError(t, err)

	mem, err := repo.GetMember(ctx, comm.ID, spammerID)
	require.NoError(t, err)
	assert.Equal(t, "banned", mem.Status)

	// Banned member cannot post
	_, err = svc.CreatePost(ctx, spammerID, comm.ID, models.CreateDiscussionDTO{Content: "Buy crypto!"})
	require.Error(t, err)
}

func TestCommunityRecommendations(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()

	ownerID := uuid.New()

	_, _ = svc.CreateCommunity(ctx, ownerID, models.CreateCommunityDTO{
		Title:      "AI & Machine Learning",
		Category:   "Artificial Intelligence",
		Visibility: "public",
		Topics:     []string{"PyTorch", "LLM", "Python"},
		Skills:     []string{"Python", "Deep Learning"},
	})

	_, _ = svc.CreateCommunity(ctx, ownerID, models.CreateCommunityDTO{
		Title:      "Frontend Craft",
		Category:   "Web Development",
		Visibility: "public",
		Topics:     []string{"React", "TypeScript"},
		Skills:     []string{"CSS", "JavaScript"},
	})

	recs, err := svc.GetRecommendedCommunities(ctx, uuid.New(), []string{"PyTorch", "Python"}, "Artificial Intelligence")
	require.NoError(t, err)
	require.NotEmpty(t, recs)
	assert.Equal(t, "AI & Machine Learning", recs[0].Title)
}

func TestEventAndResourceManagement(t *testing.T) {
	svc, _ := setupTestService()
	ctx := context.Background()

	ownerID := uuid.New()

	comm, err := svc.CreateCommunity(ctx, ownerID, models.CreateCommunityDTO{
		Title:      "Product Management",
		Visibility: "public",
	})
	require.NoError(t, err)

	// Owner creates event
	event, err := svc.CreateEvent(ctx, ownerID, comm.ID, models.CreateCommunityEventDTO{
		Title:       "Product Strategy Summit",
		Description: "Annual product strategy meetup",
		ScheduledAt: time.Now().Add(48 * time.Hour),
		MeetingUrl:  "https://meet.kirmya.com/pm-summit",
	})
	require.NoError(t, err)
	assert.Equal(t, "Product Strategy Summit", event.Title)

	// Owner shares resource
	res, err := svc.CreateResource(ctx, ownerID, comm.ID, models.CreateCommunityResourceDTO{
		Title:    "PRD Template Guide",
		Url:      "https://kirmya.com/resources/prd-guide",
		Category: "guide",
	})
	require.NoError(t, err)
	assert.Equal(t, "PRD Template Guide", res.Title)
}

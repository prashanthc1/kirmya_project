package models

import (
	"time"

	"github.com/google/uuid"
)

// Community represents a professional career group workspace.
type Community struct {
	ID             uuid.UUID `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	Category       string    `json:"category"` // trending, industry, location
	Location       string    `json:"location"`
	Visibility     string    `json:"visibility"` // public, private, invite_only
	IsPrivate      bool      `json:"isPrivate"`
	LogoUrl        string    `json:"logoUrl"`
	CoverImageUrl  string    `json:"coverImageUrl"`
	Rules          []string  `json:"rules"`
	Topics         []string  `json:"topics"`
	Skills         []string  `json:"skills"`
	OwnerID        uuid.UUID `json:"ownerId"`
	MemberCount    int       `json:"memberCount"`
	PostCount      int       `json:"postCount"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// CommunityRole maps access control properties.
type CommunityRole struct {
	ID               uuid.UUID `json:"id"`
	RoleName         string    `json:"roleName"` // owner, admin, moderator, member
	CanManageMembers bool      `json:"canManageMembers"`
	CanModeratePosts bool      `json:"canModeratePosts"`
}

// CommunityMember maps candidate membership joins and status flags.
type CommunityMember struct {
	ID          uuid.UUID `json:"id"`
	CommunityID uuid.UUID `json:"communityId"`
	UserID      uuid.UUID `json:"userId"`
	RoleName    string    `json:"roleName"` // owner, admin, moderator, member
	Status      string    `json:"status"`   // active, pending, rejected, banned, removed
	JoinedAt    time.Time `json:"joinedAt"`
	CreatedAt   time.Time `json:"createdAt"`
}

// CommunityInvite represents an invitation sent to a user to join a community.
type CommunityInvite struct {
	ID            uuid.UUID `json:"id"`
	CommunityID   uuid.UUID `json:"communityId"`
	InviterID     uuid.UUID `json:"inviterId"`
	InvitedUserID uuid.UUID `json:"invitedUserId"`
	Status        string    `json:"status"` // pending, accepted, declined, expired
	CreatedAt     time.Time `json:"createdAt"`
}

// CommunityPost is a discussion post within a community page.
type CommunityPost struct {
	ID             uuid.UUID `json:"id"`
	CommunityID    uuid.UUID `json:"communityId"`
	UserID         uuid.UUID `json:"userId"`
	Title          string    `json:"title"`
	Content        string    `json:"content"`
	IsPinned       bool      `json:"isPinned"`
	IsLocked       bool      `json:"isLocked"`
	IsAnnouncement bool      `json:"isAnnouncement"`
	Tags           []string  `json:"tags"`
	CommentCount   int       `json:"commentCount"`
	ReactionsCount int       `json:"reactionsCount"`
	CreatedAt      time.Time `json:"createdAt"`
	UserName       string    `json:"userName,omitempty"`
	UserAvatar     string    `json:"userAvatar,omitempty"`
}

// CommunityComment represents a comment on a community post.
type CommunityComment struct {
	ID          uuid.UUID `json:"id"`
	PostID      uuid.UUID `json:"postId"`
	CommunityID uuid.UUID `json:"communityId"`
	UserID      uuid.UUID `json:"userId"`
	Content     string    `json:"content"`
	UserName    string    `json:"userName,omitempty"`
	UserAvatar  string    `json:"userAvatar,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// CommunityEvent represents a scheduled event in a community.
type CommunityEvent struct {
	ID            uuid.UUID `json:"id"`
	CommunityID   uuid.UUID `json:"communityId"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	ScheduledAt   time.Time `json:"scheduledAt"`
	Location      string    `json:"location"`
	MeetingUrl    string    `json:"meetingUrl"`
	OrganizedByID uuid.UUID `json:"organizedById"`
	AttendeeCount int       `json:"attendeeCount"`
	CreatedAt     time.Time `json:"createdAt"`
}

// CommunityResource represents a shared resource (article, guide, course, job resource).
type CommunityResource struct {
	ID          uuid.UUID `json:"id"`
	CommunityID uuid.UUID `json:"communityId"`
	Title       string    `json:"title"`
	Url         string    `json:"url"`
	Category    string    `json:"category"` // article, guide, course, job_resource
	SharedByID  uuid.UUID `json:"sharedById"`
	CreatedAt   time.Time `json:"createdAt"`
}

// CommunityModerationAction records actions taken by moderators on members or content.
type CommunityModerationAction struct {
	ID           uuid.UUID `json:"id"`
	CommunityID  uuid.UUID `json:"communityId"`
	ModeratorID  uuid.UUID `json:"moderatorId"`
	TargetUserID uuid.UUID `json:"targetUserId"`
	Action       string    `json:"action"` // warn, remove_post, lock_discussion, ban_member
	Reason       string    `json:"reason"`
	CreatedAt    time.Time `json:"createdAt"`
}

// CommunityReport logs posts flagged for moderation review.
type CommunityReport struct {
	ID         uuid.UUID `json:"id"`
	PostID     uuid.UUID `json:"postId"`
	ReporterID uuid.UUID `json:"reporterId"`
	Reason     string    `json:"reason"`
	IsResolved bool      `json:"isResolved"`
	CreatedAt  time.Time `json:"createdAt"`
}

// --- DTOs ---

// CreateCommunityDTO contains payload fields to create a community.
type CreateCommunityDTO struct {
	Title         string   `json:"title" binding:"required"`
	Description   string   `json:"description"`
	Category      string   `json:"category" binding:"required"`
	Location      string   `json:"location"`
	Visibility    string   `json:"visibility"` // public, private, invite_only
	LogoUrl       string   `json:"logoUrl"`
	CoverImageUrl string   `json:"coverImageUrl"`
	Rules         []string `json:"rules"`
	Topics        []string `json:"topics"`
	Skills        []string `json:"skills"`
}

// UpdateCommunityDTO contains payload fields to update a community.
type UpdateCommunityDTO struct {
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	Category      string   `json:"category"`
	Location      string   `json:"location"`
	Visibility    string   `json:"visibility"`
	LogoUrl       string   `json:"logoUrl"`
	CoverImageUrl string   `json:"coverImageUrl"`
	Rules         []string `json:"rules"`
	Topics        []string `json:"topics"`
	Skills        []string `json:"skills"`
}

// CreateDiscussionDTO contains payload fields for creating a post/discussion.
type CreateDiscussionDTO struct {
	Title          string   `json:"title"`
	Content        string   `json:"content" binding:"required"`
	IsAnnouncement bool     `json:"isAnnouncement"`
	Tags           []string `json:"tags"`
}

// CreateCommentDTO contains payload fields for creating a comment.
type CreateCommentDTO struct {
	Content string `json:"content" binding:"required"`
}

// CreateCommunityEventDTO contains payload fields for creating an event.
type CreateCommunityEventDTO struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	ScheduledAt time.Time `json:"scheduledAt" binding:"required"`
	Location    string    `json:"location"`
	MeetingUrl  string    `json:"meetingUrl"`
}

// CreateCommunityResourceDTO contains payload fields for sharing a resource.
type CreateCommunityResourceDTO struct {
	Title    string `json:"title" binding:"required"`
	Url      string `json:"url" binding:"required"`
	Category string `json:"category" binding:"required"` // article, guide, course, job_resource
}

// ModerateMemberDTO contains payload fields to take moderation action on a member.
type ModerateMemberDTO struct {
	TargetUserID uuid.UUID `json:"targetUserId" binding:"required"`
	Action       string    `json:"action" binding:"required"` // warn, remove_post, lock_discussion, ban_member
	Reason       string    `json:"reason"`
}

// CommunityFilterParams contains query parameters for filtering communities.
type CommunityFilterParams struct {
	Category    string `json:"category"`
	Location    string `json:"location"`
	Visibility  string `json:"visibility"`
	Topic       string `json:"topic"`
	Skill       string `json:"skill"`
	SearchQuery string `json:"searchQuery"`
}

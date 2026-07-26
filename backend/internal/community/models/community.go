package models

import (
	"time"

	"github.com/google/uuid"
)

// Community represents a professional career group workspace.
type Community struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"` // trending, industry, location
	Location    string    `json:"location"`
	IsPrivate   bool      `json:"isPrivate"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CommunityRole maps access control properties.
type CommunityRole struct {
	ID                uuid.UUID `json:"id"`
	RoleName          string    `json:"roleName"` // owner, admin, moderator, member
	CanManageMembers  bool      `json:"canManageMembers"`
	CanModeratePosts  bool      `json:"canModeratePosts"`
}

// CommunityMember maps candidate membership joins and status flags.
type CommunityMember struct {
	ID          uuid.UUID `json:"id"`
	CommunityID uuid.UUID `json:"communityId"`
	UserID      uuid.UUID `json:"userId"`
	RoleName    string    `json:"roleName"` // owner, admin, moderator, member
	Status      string    `json:"status"`   // pending, active
	CreatedAt   time.Time `json:"createdAt"`
}

// CommunityPost is a content post within a community page.
type CommunityPost struct {
	ID          uuid.UUID `json:"id"`
	CommunityID uuid.UUID `json:"communityId"`
	UserID      uuid.UUID `json:"userId"`
	Content     string    `json:"content"`
	CreatedAt   time.Time `json:"createdAt"`
	UserName    string    `json:"userName,omitempty"`
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

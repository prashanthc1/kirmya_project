package models

import (
	"time"

	"github.com/google/uuid"
)

// Connection represents an accepted connection between two users.
type Connection struct {
	ID        uuid.UUID `json:"id"`
	UserID1   uuid.UUID `json:"userId1"`
	UserID2   uuid.UUID `json:"userId2"`
	CreatedAt time.Time `json:"createdAt"`

	// Enriched fields
	ConnectedUser *PeopleSearchResult `json:"connectedUser,omitempty"`
}

// ConnectionRequest represents an invitation to connect.
type ConnectionRequest struct {
	ID         uuid.UUID `json:"id"`
	SenderID   uuid.UUID `json:"senderId"`
	ReceiverID uuid.UUID `json:"receiverId"`
	Status     string    `json:"status"` // pending, accepted, rejected, withdrawn
	Note       string    `json:"note,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`

	// Enriched sender/receiver details
	SenderName       string `json:"senderName,omitempty"`
	SenderHeadline   string `json:"senderHeadline,omitempty"`
	SenderAvatarUrl  string `json:"senderAvatarUrl,omitempty"`
	ReceiverName     string `json:"receiverName,omitempty"`
	ReceiverHeadline string `json:"receiverHeadline,omitempty"`
}

// ConnectionRequestNote stores optional personal notes.
type ConnectionRequestNote struct {
	ID        uuid.UUID `json:"id"`
	RequestID uuid.UUID `json:"requestId"`
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"createdAt"`
}

// BlockedUser represents one-way privacy block.
type BlockedUser struct {
	ID        uuid.UUID `json:"id"`
	BlockerID uuid.UUID `json:"blockerId"`
	BlockedID uuid.UUID `json:"blockedId"`
	CreatedAt time.Time `json:"createdAt"`
}

// ConnectionFollow represents follow/unfollow status.
type ConnectionFollow struct {
	ID          uuid.UUID `json:"id"`
	FollowerID  uuid.UUID `json:"followerId"`
	FollowingID uuid.UUID `json:"followingId"`
	CreatedAt   time.Time `json:"createdAt"`
}

// RecommendationDismissal stores dismissed suggested connections.
type RecommendationDismissal struct {
	ID                  uuid.UUID `json:"id"`
	UserID              uuid.UUID `json:"userId"`
	RecommendedUserID uuid.UUID `json:"recommendedUserId"`
	Reason              string    `json:"reason"`
	CreatedAt           time.Time `json:"createdAt"`
}

// NetworkReport represents safety/abuse reports.
type NetworkReport struct {
	ID           uuid.UUID `json:"id"`
	ReporterID   uuid.UUID `json:"reporterId"`
	TargetUserID uuid.UUID `json:"targetUserId"`
	Reason       string    `json:"reason"`
	Details      string    `json:"details"`
	Status       string    `json:"status"` // pending, reviewed, actioned
	CreatedAt    time.Time `json:"createdAt"`
}

// ConnectionRecommendation represents recommended people to connect with.
type ConnectionRecommendation struct {
	UserID            uuid.UUID `json:"userId"`
	Username          string    `json:"username"`
	Name              string    `json:"name"`
	AvatarUrl         string    `json:"avatarUrl"`
	Headline          string    `json:"headline"`
	Location          string    `json:"location"`
	Industry          string    `json:"industry"`
	CurrentCompany    string    `json:"currentCompany"`
	MutualCount       int       `json:"mutualCount"`
	MutualConnections []string  `json:"mutualConnections"`
	MatchScore        int       `json:"matchScore"` // 0-100 match score
	Reason            string    `json:"reason"`     // E.g., "3 mutual connections", "Works in your industry"
	ConnectionStatus  string    `json:"connectionStatus"` // none, pending_sent, pending_received, connected, blocked
	IsFollowing       bool      `json:"isFollowing"`
}

// PeopleSearchFilter filters candidate discovery results.
type PeopleSearchFilter struct {
	Query               string   `json:"query"`
	Location            string   `json:"location"`
	Industry            string   `json:"industry"`
	Company             string   `json:"company"`
	Skills              []string `json:"skills"`
	JobTitle            string   `json:"jobTitle"`
	Degree              string   `json:"degree"` // 1st, 2nd, 3rd
	OpenToOpportunities *bool    `json:"openToOpportunities"`
	SortBy              string   `json:"sortBy"` // relevance, name, mutuals
	Page                int      `json:"page"`
	Limit               int      `json:"limit"`
}

// PeopleSearchResult represents a person discovered in search or network views.
type PeopleSearchResult struct {
	ID                 uuid.UUID `json:"id"`
	UserID             uuid.UUID `json:"userId"`
	Username           string    `json:"username"`
	Name               string    `json:"name"`
	AvatarUrl          string    `json:"avatarUrl"`
	Headline           string    `json:"headline"`
	CurrentPosition    string    `json:"currentPosition"`
	Location           string    `json:"location"`
	Industry           string    `json:"industry"`
	OpenToWork         bool      `json:"openToWork"`
	MutualCount        int       `json:"mutualCount"`
	MutualConnections  []string  `json:"mutualConnections"`
	ConnectionStatus   string    `json:"connectionStatus"` // none, pending_sent, pending_received, connected, blocked
	IsFollowing        bool      `json:"isFollowing"`
	VerificationStatus string    `json:"verificationStatus"`
}

// MutualConnectionsResult returns mutual connection context.
type MutualConnectionsResult struct {
	TargetUserID uuid.UUID            `json:"targetUserId"`
	MutualCount  int                  `json:"mutualCount"`
	Mutuals      []PeopleSearchResult `json:"mutuals"`
}

// NetworkGrowthStats represents personal network overview.
type NetworkGrowthStats struct {
	TotalConnections  int `json:"totalConnections"`
	PendingReceived   int `json:"pendingReceived"`
	PendingSent       int `json:"pendingSent"`
	NetworkGrowth     int `json:"networkGrowthThisMonth"`
	ProfileViews      int `json:"profileViews"`
	SearchAppearances int `json:"searchAppearances"`
}

// Admin Network Management DTOs
type AdminNetworkAnalytics struct {
	TotalConnectionsCount int `json:"totalConnectionsCount"`
	TotalRequestsCount    int `json:"totalRequestsCount"`
	PendingRequestsCount  int `json:"pendingRequestsCount"`
	ReportedNetworkCount  int `json:"reportedNetworkCount"`
	BlockedPairsCount     int `json:"blockedPairsCount"`
}

type SendConnectionRequestDTO struct {
	ReceiverID uuid.UUID `json:"receiverId" binding:"required"`
	Note       string    `json:"note"`
}

type NetworkReportDTO struct {
	Reason  string `json:"reason" binding:"required"`
	Details string `json:"details"`
}

type AdminRestrictNetworkDTO struct {
	UserID       uuid.UUID `json:"userId" binding:"required"`
	IsRestricted bool      `json:"isRestricted"`
	Reason       string    `json:"reason"`
}

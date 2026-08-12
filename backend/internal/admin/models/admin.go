package models

import (
	"time"

	"github.com/google/uuid"
)

// AdminRole defines administrator role definitions.
type AdminRole struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsSystem    bool      `json:"isSystem"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// AdminPermission defines granular capability tokens.
type AdminPermission struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Category    string    `json:"category"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

// AdminAuditLog records immutable administrative activities.
type AdminAuditLog struct {
	ID            uuid.UUID              `json:"id"`
	AdminID       uuid.UUID              `json:"adminId"`
	AdminEmail    string                 `json:"adminEmail,omitempty"`
	RoleCode      string                 `json:"roleCode,omitempty"`
	Action        string                 `json:"action"`
	TargetType    string                 `json:"targetType"`
	TargetID      string                 `json:"targetId"`
	PreviousState map[string]interface{} `json:"previousState,omitempty"`
	NewState      map[string]interface{} `json:"newState,omitempty"`
	Reason        string                 `json:"reason,omitempty"`
	IPAddress     string                 `json:"ipAddress,omitempty"`
	UserAgent     string                 `json:"userAgent,omitempty"`
	RequestID     string                 `json:"requestId,omitempty"`
	CreatedAt     time.Time              `json:"createdAt"`
}

// ModerationCase represents a queued content or user moderation item.
type ModerationCase struct {
	ID               uuid.UUID  `json:"id"`
	CaseNumber       string     `json:"caseNumber"`
	TargetType       string     `json:"targetType"` // User, Company, Job, Post, Comment, Review, Message
	TargetID         string     `json:"targetId"`
	TargetTitle      string     `json:"targetTitle,omitempty"`
	ReporterID       *uuid.UUID `json:"reporterId,omitempty"`
	Category         string     `json:"category"`
	Priority         string     `json:"priority"` // Critical, High, Medium, Low
	RiskScore        float64    `json:"riskScore"`
	Status           string     `json:"status"` // New, Under Review, Needs Info, Action Required, Resolved, Dismissed, Escalated
	AssignedAdminID  *uuid.UUID `json:"assignedAdminId,omitempty"`
	AISummary        string     `json:"aiSummary,omitempty"`
	AIRecommendation string     `json:"aiRecommendation,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

// ModerationAction stores history of moderator actions.
type ModerationAction struct {
	ID         uuid.UUID `json:"id"`
	CaseID     uuid.UUID `json:"caseId"`
	AdminID    uuid.UUID `json:"adminId"`
	ActionType string    `json:"actionType"` // Approve, Reject, Hide, Remove, Suspend, Restore, Flag
	Reason     string    `json:"reason"`
	Evidence   string    `json:"evidence,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
}

// ContentReport represents a user-submitted report.
type ContentReport struct {
	ID              uuid.UUID              `json:"id"`
	ReporterID      uuid.UUID              `json:"reporterId"`
	TargetType      string                 `json:"targetType"`
	TargetID        string                 `json:"targetId"`
	TargetTitle     string                 `json:"targetTitle,omitempty"`
	Category        string                 `json:"category"`
	Reason          string                 `json:"reason"`
	Description     string                 `json:"description,omitempty"`
	EvidenceURLs    []string               `json:"evidenceUrls,omitempty"`
	Status          string                 `json:"status"`
	Priority        string                 `json:"priority"`
	AssignedAdminID *uuid.UUID             `json:"assignedAdminId,omitempty"`
	ResolutionNotes string                 `json:"resolutionNotes,omitempty"`
	CreatedAt       time.Time              `json:"createdAt"`
	UpdatedAt       time.Time              `json:"updatedAt"`
}

// AccountFlag represents internal status flags on users.
type AccountFlag struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"userId"`
	FlagType  string     `json:"flagType"`
	Reason    string     `json:"reason"`
	CreatedBy uuid.UUID  `json:"createdBy"`
	ExpiresAt *time.Time `json:"expiresAt,omitempty"`
	IsActive  bool       `json:"isActive"`
	CreatedAt time.Time  `json:"createdAt"`
}

// RiskScore represents explainable risk assessment metrics.
type RiskScore struct {
	ID         uuid.UUID              `json:"id"`
	EntityType string                 `json:"entityType"`
	EntityID   string                 `json:"entityId"`
	Score      float64                `json:"score"`
	RiskLevel  string                 `json:"riskLevel"` // Low, Medium, High, Critical
	Factors    map[string]interface{} `json:"factors,omitempty"`
	UpdatedAt  time.Time              `json:"updatedAt"`
}

// VerificationReview represents a verification request in the admin queue.
type VerificationReview struct {
	ID               uuid.UUID              `json:"id"`
	EntityType       string                 `json:"entityType"` // User, Company, Recruiter, Skill
	EntityID         string                 `json:"entityId"`
	VerificationType string                 `json:"verificationType"`
	SubmittedData    map[string]interface{} `json:"submittedData,omitempty"`
	DocumentURLs     []string               `json:"documentUrls,omitempty"`
	Status           string                 `json:"status"` // Pending, Under Review, Approved, Rejected, Needs Info
	ReviewerID       *uuid.UUID             `json:"reviewerId,omitempty"`
	ReviewerNotes    string                 `json:"reviewerNotes,omitempty"`
	CreatedAt        time.Time              `json:"createdAt"`
	UpdatedAt        time.Time              `json:"updatedAt"`
}

// SecurityEvent represents user authentication security logs.
type SecurityEvent struct {
	ID        uuid.UUID              `json:"id"`
	UserID    uuid.UUID              `json:"userId"`
	EventType string                 `json:"eventType"`
	Status    string                 `json:"status"`
	IPAddress string                 `json:"ipAddress,omitempty"`
	UserAgent string                 `json:"userAgent,omitempty"`
	Location  string                 `json:"location,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty"`
	CreatedAt time.Time              `json:"createdAt"`
}

// FeatureFlag defines feature rollout toggles.
type FeatureFlag struct {
	ID                uuid.UUID  `json:"id"`
	Name              string     `json:"name"`
	Description       string     `json:"description,omitempty"`
	IsEnabled         bool       `json:"isEnabled"`
	Environment       string     `json:"environment"`
	RolloutPercentage int        `json:"rolloutPercentage"`
	StartDate         *time.Time `json:"startDate,omitempty"`
	EndDate           *time.Time `json:"endDate,omitempty"`
	UpdatedBy         *uuid.UUID `json:"updatedBy,omitempty"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

// SystemHealth defines infrastructure health metrics.
type SystemHealth struct {
	APIStatus           string                 `json:"apiStatus"`
	DatabaseStatus      string                 `json:"databaseStatus"`
	RedisStatus         string                 `json:"redisStatus"`
	QueueStatus         string                 `json:"queueStatus"`
	NotificationStatus  string                 `json:"notificationStatus"`
	AIServiceStatus     string                 `json:"aiServiceStatus"`
	SearchServiceStatus string                 `json:"searchServiceStatus"`
	StorageStatus       string                 `json:"storageStatus"`
	WorkersStatus       string                 `json:"workersStatus"`
	Metrics             map[string]interface{} `json:"metrics,omitempty"`
}

// AdminDashboardStats defines administrative high-level overview metrics.
type AdminDashboardStats struct {
	TotalUsers           int64            `json:"totalUsers"`
	ActiveUsers          int64            `json:"activeUsers"`
	NewUsers             int64            `json:"newUsers"`
	SuspendedUsers       int64            `json:"suspendedUsers"`
	VerifiedUsers        int64            `json:"verifiedUsers"`
	Companies            int64            `json:"companies"`
	VerifiedCompanies    int64            `json:"verifiedCompanies"`
	Recruiters           int64            `json:"recruiters"`
	ActiveJobs           int64            `json:"activeJobs"`
	Applications         int64            `json:"applications"`
	Reports              int64            `json:"reports"`
	PendingModeration    int64            `json:"pendingModeration"`
	PendingVerifications int64            `json:"pendingVerifications"`
	SecurityAlerts       int64            `json:"securityAlerts"`
	SystemHealth         SystemHealth     `json:"systemHealth"`
	GrowthTrends         map[string]int64 `json:"growthTrends"`
}

// Payload structs
type UpdateUserStatusPayload struct {
	Status string `json:"status" binding:"required"` // Active, Restricted, Suspended
	Reason string `json:"reason" binding:"required"`
}

type UpdateCompanyStatusPayload struct {
	Status string `json:"status" binding:"required"` // Active, Restricted, Suspended
	Reason string `json:"reason" binding:"required"`
}

type ModerateJobPayload struct {
	Action string `json:"action" binding:"required"` // Approve, Reject, Hide, Remove, Suspend, Restore, Flag
	Reason string `json:"reason" binding:"required"`
}

type ResolveReportPayload struct {
	Action string `json:"action" binding:"required"` // Resolve, Dismiss, Escalate
	Notes  string `json:"notes" binding:"required"`
}

package models

import (
	"time"

	"github.com/google/uuid"
)

// AnalyticsEvent logs click-level system operations.
type AnalyticsEvent struct {
	ID            uuid.UUID              `json:"id"`
	UserID        *uuid.UUID             `json:"userId,omitempty"`
	EventType     string                 `json:"eventType"`
	EventMetadata map[string]interface{} `json:"eventMetadata"`
	CreatedAt     time.Time              `json:"createdAt"`
}

// DailyStatistics tracks stats aggregates grouped by calendar day.
type DailyStatistics struct {
	Date              time.Time `json:"date"`
	TotalUsers        int       `json:"totalUsers"`
	ActiveUsers       int       `json:"activeUsers"`
	JobsPosted        int       `json:"jobsPosted"`
	ApplicationsCount int       `json:"applicationsCount"`
	ConnectionsCount  int       `json:"connectionsCount"`
	CommunitiesCount  int       `json:"communitiesCount"`
	MessagesCount     int       `json:"messagesCount"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

// OverviewMetrics groups running aggregates of Kirmya.
type OverviewMetrics struct {
	TotalUsers        int     `json:"totalUsers"`
	ActiveUsers       int     `json:"activeUsers"`
	JobsPosted        int     `json:"jobsPosted"`
	ApplicationsCount int     `json:"applicationsCount"`
	ConnectionsCount  int     `json:"connectionsCount"`
	CommunitiesCount  int     `json:"communitiesCount"`
	MessagesCount     int     `json:"messagesCount"`
	UserGrowthRate    float64 `json:"userGrowthRate"` // Percentage growth
}

// TrackEventPayload defines the payload structure for tracking events via client calls.
type TrackEventPayload struct {
	EventType     string                 `json:"eventType" binding:"required"`
	EventMetadata map[string]interface{} `json:"eventMetadata,omitempty"`
}

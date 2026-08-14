package models

import (
	"time"

	"github.com/google/uuid"
)

type HealthStatus string
type ComponentWeight string

const (
	StatusHealthy     HealthStatus = "healthy"
	StatusDegraded    HealthStatus = "degraded"
	StatusCritical    HealthStatus = "critical"
	StatusUnknown     HealthStatus = "unknown"
	StatusDisabled    HealthStatus = "disabled"
	StatusMaintenance HealthStatus = "maintenance"

	WeightCritical  ComponentWeight = "critical"
	WeightImportant ComponentWeight = "important"
	WeightOptional  ComponentWeight = "optional"
)

type ComponentHealth struct {
	Name            string                 `json:"name"`
	Status          HealthStatus           `json:"status"`
	Weight          ComponentWeight        `json:"weight"`
	LatencyMS       int64                  `json:"latencyMs"`
	LastChecked     time.Time              `json:"lastChecked"`
	Message         string                 `json:"message"`
	MetricsDetails  map[string]interface{} `json:"metricsDetails,omitempty"`
	CircuitBreaker  string                 `json:"circuitBreakerStatus,omitempty"` // closed, open, half_open
	RecentFailures  int                    `json:"recentFailures"`
}

type OverallHealthSummary struct {
	Status           HealthStatus               `json:"status"`
	Version          string                     `json:"version"`
	BuildSHA         string                     `json:"buildSha"`
	UptimeSeconds    int64                      `json:"uptimeSeconds"`
	IsMaintenance    bool                       `json:"isMaintenance"`
	Components       map[string]ComponentHealth `json:"components"`
	ActiveIncidents  int                        `json:"activeIncidents"`
	CheckedAt        time.Time                  `json:"checkedAt"`
}

type PublicHealthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Version   string `json:"version"`
}

type HealthIncident struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	ComponentName string     `json:"componentName" db:"component_name"`
	Severity     string     `json:"severity" db:"severity"`
	Status       string     `json:"status" db:"status"`
	FailureType  string     `json:"failureType" db:"failure_type"`
	ErrorMessage string     `json:"errorMessage" db:"error_message"`
	FirstSeenAt  time.Time  `json:"firstSeenAt" db:"first_seen_at"`
	LastSeenAt   time.Time  `json:"lastSeenAt" db:"last_seen_at"`
	ResolvedAt   *time.Time `json:"resolvedAt,omitempty" db:"resolved_at"`
	DedupCount   int        `json:"dedupCount" db:"dedup_count"`
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
}

type HealthRecoveryAction struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	IncidentID    *uuid.UUID `json:"incidentId,omitempty" db:"incident_id"`
	ActionType    string     `json:"actionType" db:"action_type"`
	ComponentName string     `json:"componentName" db:"component_name"`
	Status        string     `json:"status" db:"status"`
	ResultSummary string     `json:"resultSummary" db:"result_summary"`
	ExecutedBy    *uuid.UUID `json:"executedBy,omitempty" db:"executed_by"`
	StartedAt     time.Time  `json:"startedAt" db:"started_at"`
	CompletedAt   *time.Time `json:"completedAt,omitempty" db:"completed_at"`
	CreatedAt     time.Time  `json:"createdAt" db:"created_at"`
}

type MaintenanceModeConfig struct {
	ID              uuid.UUID  `json:"id" db:"id"`
	IsEnabled       bool       `json:"isEnabled" db:"is_enabled"`
	Reason          string     `json:"reason" db:"reason"`
	AllowedAdminIDs []string   `json:"allowedAdminIds" db:"allowed_admin_ids"`
	EnabledBy       *uuid.UUID `json:"enabledBy,omitempty" db:"enabled_by"`
	EnabledAt       *time.Time `json:"enabledAt,omitempty" db:"enabled_at"`
	DisabledAt      *time.Time `json:"disabledAt,omitempty" db:"disabled_at"`
	CreatedAt       time.Time  `json:"createdAt" db:"created_at"`
}

type ToggleMaintenanceRequest struct {
	Enable          bool     `json:"enable"`
	Reason          string   `json:"reason"`
	AllowedAdminIDs []string `json:"allowedAdminIds"`
}

type DiagnosticReport struct {
	ReportID            string                 `json:"reportId"`
	GeneratedAt         time.Time              `json:"generatedAt"`
	ExpiresAt           time.Time              `json:"expiresAt"`
	DownloadURL         string                 `json:"downloadUrl"`
	OverallStatus       HealthStatus           `json:"overallStatus"`
	SystemComponents    map[string]ComponentHealth `json:"systemComponents"`
	ActiveIncidents     []HealthIncident       `json:"activeIncidents"`
	RecentRecoveryLogs  []HealthRecoveryAction `json:"recentRecoveryLogs"`
	ConfigurationSummary map[string]string     `json:"configurationSummary"`
}

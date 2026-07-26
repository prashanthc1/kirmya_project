package domain

import (
	"time"

	"github.com/google/uuid"
)

type Enterprise struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Industry  string    `json:"industry"`
	Tier      string    `json:"tier"`
	Domain    string    `json:"domain"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type HiringTeam struct {
	ID             uuid.UUID `json:"id"`
	EnterpriseID   uuid.UUID `json:"enterprise_id"`
	DepartmentName string    `json:"department_name"`
	TeamName       string    `json:"team_name"`
	TeamLeadID     uuid.UUID `json:"team_lead_id"`
	TeamLeadName   string    `json:"team_lead_name"`
	MemberCount    int       `json:"member_count"`
	CreatedAt      time.Time `json:"created_at"`
}

type Role struct {
	ID           uuid.UUID `json:"id"`
	EnterpriseID uuid.UUID `json:"enterprise_id"`
	Name         string    `json:"name"`
	Permissions  []string  `json:"permissions"`
	CreatedAt    time.Time `json:"created_at"`
}

type CandidatePool struct {
	ID             uuid.UUID `json:"id"`
	EnterpriseID   uuid.UUID `json:"enterprise_id"`
	Name           string    `json:"name"`
	Description    string    `json:"description"`
	CandidateCount int       `json:"candidate_count"`
	CreatedAt      time.Time `json:"created_at"`
}

type AuditLog struct {
	ID           uuid.UUID `json:"id"`
	EnterpriseID uuid.UUID `json:"enterprise_id"`
	ActorID      uuid.UUID `json:"actor_id"`
	ActorEmail   string    `json:"actor_email"`
	Action       string    `json:"action"`
	Resource     string    `json:"resource"`
	IPAddress    string    `json:"ip_address"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateTeamPayload struct {
	DepartmentName string `json:"department_name" binding:"required"`
	TeamName       string `json:"team_name" binding:"required"`
}

type CreatePoolPayload struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

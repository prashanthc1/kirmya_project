package service

import (
	"context"
	"time"

	"kirmya/internal/enterprise_hiring/domain"
	"kirmya/internal/enterprise_hiring/repository"

	"github.com/google/uuid"
)

type EnterpriseService interface {
	GetEnterpriseOverview(ctx context.Context, entID uuid.UUID) (*domain.Enterprise, error)
	GetTeams(ctx context.Context, entID uuid.UUID) ([]domain.HiringTeam, error)
	CreateTeam(ctx context.Context, entID uuid.UUID, leadID uuid.UUID, payload domain.CreateTeamPayload) (*domain.HiringTeam, error)

	GetCandidatePools(ctx context.Context, entID uuid.UUID) ([]domain.CandidatePool, error)
	CreateCandidatePool(ctx context.Context, entID uuid.UUID, payload domain.CreatePoolPayload) (*domain.CandidatePool, error)

	GetAuditLogs(ctx context.Context, entID uuid.UUID) ([]domain.AuditLog, error)
	LogAction(ctx context.Context, entID uuid.UUID, actorID uuid.UUID, actorEmail, action, resource, ipAddress string) error
}

type enterpriseService struct {
	repo repository.EnterpriseRepository
}

func NewEnterpriseService(repo repository.EnterpriseRepository) EnterpriseService {
	return &enterpriseService{repo: repo}
}

func (s *enterpriseService) GetEnterpriseOverview(ctx context.Context, entID uuid.UUID) (*domain.Enterprise, error) {
	return s.repo.GetEnterpriseOverview(ctx, entID)
}

func (s *enterpriseService) GetTeams(ctx context.Context, entID uuid.UUID) ([]domain.HiringTeam, error) {
	return s.repo.GetTeams(ctx, entID)
}

func (s *enterpriseService) CreateTeam(ctx context.Context, entID uuid.UUID, leadID uuid.UUID, payload domain.CreateTeamPayload) (*domain.HiringTeam, error) {
	team := &domain.HiringTeam{
		ID:             uuid.New(),
		EnterpriseID:   entID,
		DepartmentName: payload.DepartmentName,
		TeamName:       payload.TeamName,
		TeamLeadID:     leadID,
		TeamLeadName:   "Alex Rivera (Enterprise Admin)",
		MemberCount:    1,
		CreatedAt:      time.Now(),
	}

	if err := s.repo.CreateTeam(ctx, team); err != nil {
		return nil, err
	}

	_ = s.LogAction(ctx, entID, leadID, "admin@stripe.com", "CREATE_HIRING_TEAM", payload.TeamName, "127.0.0.1")
	return team, nil
}

func (s *enterpriseService) GetCandidatePools(ctx context.Context, entID uuid.UUID) ([]domain.CandidatePool, error) {
	return s.repo.GetCandidatePools(ctx, entID)
}

func (s *enterpriseService) CreateCandidatePool(ctx context.Context, entID uuid.UUID, payload domain.CreatePoolPayload) (*domain.CandidatePool, error) {
	pool := &domain.CandidatePool{
		ID:             uuid.New(),
		EnterpriseID:   entID,
		Name:           payload.Name,
		Description:    payload.Description,
		CandidateCount: 0,
		CreatedAt:      time.Now(),
	}

	if err := s.repo.CreateCandidatePool(ctx, pool); err != nil {
		return nil, err
	}
	return pool, nil
}

func (s *enterpriseService) GetAuditLogs(ctx context.Context, entID uuid.UUID) ([]domain.AuditLog, error) {
	return s.repo.GetAuditLogs(ctx, entID)
}

func (s *enterpriseService) LogAction(ctx context.Context, entID uuid.UUID, actorID uuid.UUID, actorEmail, action, resource, ipAddress string) error {
	log := &domain.AuditLog{
		ID:           uuid.New(),
		EnterpriseID: entID,
		ActorID:      actorID,
		ActorEmail:   actorEmail,
		Action:       action,
		Resource:     resource,
		IPAddress:    ipAddress,
		CreatedAt:    time.Now(),
	}
	return s.repo.LogAction(ctx, log)
}

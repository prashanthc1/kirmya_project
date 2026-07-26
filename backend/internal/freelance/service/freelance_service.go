package service

import (
	"context"
	"time"

	"kirmya/internal/freelance/domain"
	"kirmya/internal/freelance/repository"

	"github.com/google/uuid"
)

type FreelanceService interface {
	CreateProject(ctx context.Context, clientID uuid.UUID, payload domain.CreateProjectPayload) (*domain.Project, error)
	GetProjects(ctx context.Context, status string) ([]domain.Project, error)
	GetProjectByID(ctx context.Context, id uuid.UUID) (*domain.Project, error)

	SubmitProposal(ctx context.Context, freelancerID uuid.UUID, projectID uuid.UUID, payload domain.SubmitProposalPayload) (*domain.Proposal, error)
	AcceptProposal(ctx context.Context, clientID uuid.UUID, proposalID uuid.UUID) (*domain.Contract, error)
	GetUserContracts(ctx context.Context, userID uuid.UUID) ([]domain.Contract, error)

	SaveProfile(ctx context.Context, userID uuid.UUID, payload domain.SaveProfilePayload) (*domain.FreelancerProfile, error)
	GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error)
}

type freelanceService struct {
	repo repository.FreelanceRepository
}

func NewFreelanceService(repo repository.FreelanceRepository) FreelanceService {
	return &freelanceService{repo: repo}
}

func (s *freelanceService) CreateProject(ctx context.Context, clientID uuid.UUID, payload domain.CreateProjectPayload) (*domain.Project, error) {
	budgetType := payload.BudgetType
	if budgetType == "" {
		budgetType = domain.BudgetTypeFixed
	}

	proj := &domain.Project{
		ID:             uuid.New(),
		ClientID:       clientID,
		Title:          payload.Title,
		Description:    payload.Description,
		Budget:         payload.Budget,
		BudgetType:     budgetType,
		SkillsRequired: payload.SkillsRequired,
		Status:         domain.ProjectStatusOpen,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	if err := s.repo.CreateProject(ctx, proj); err != nil {
		return nil, err
	}
	return proj, nil
}

func (s *freelanceService) GetProjects(ctx context.Context, status string) ([]domain.Project, error) {
	return s.repo.GetProjects(ctx, status)
}

func (s *freelanceService) GetProjectByID(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
	proj, err := s.repo.GetProjectByID(ctx, id)
	if err != nil {
		return nil, err
	}
	props, _ := s.repo.GetProjectProposals(ctx, id)
	proj.Proposals = props
	return proj, nil
}

func (s *freelanceService) SubmitProposal(ctx context.Context, freelancerID uuid.UUID, projectID uuid.UUID, payload domain.SubmitProposalPayload) (*domain.Proposal, error) {
	prop := &domain.Proposal{
		ID:             uuid.New(),
		ProjectID:      projectID,
		FreelancerID:   freelancerID,
		FreelancerName: "Alex Rivera",
		BidAmount:      payload.BidAmount,
		EstimatedDays:  payload.EstimatedDays,
		CoverLetter:    payload.CoverLetter,
		Status:         domain.ProposalStatusSubmitted,
		CreatedAt:      time.Now(),
	}

	if err := s.repo.SubmitProposal(ctx, prop); err != nil {
		return nil, err
	}
	return prop, nil
}

func (s *freelanceService) AcceptProposal(ctx context.Context, clientID uuid.UUID, proposalID uuid.UUID) (*domain.Contract, error) {
	prop, err := s.repo.GetProposalByID(ctx, proposalID)
	if err != nil {
		return nil, err
	}

	proj, err := s.repo.GetProjectByID(ctx, prop.ProjectID)
	if err != nil {
		return nil, err
	}

	_ = s.repo.UpdateProposalStatus(ctx, proposalID, domain.ProposalStatusAccepted)
	_ = s.repo.UpdateProjectStatus(ctx, proj.ID, domain.ProjectStatusInProgress)

	contract := &domain.Contract{
		ID:           uuid.New(),
		ProjectID:    proj.ID,
		ProposalID:   proposalID,
		ProjectTitle: proj.Title,
		ClientID:     clientID,
		FreelancerID: prop.FreelancerID,
		TotalAmount:  prop.BidAmount,
		Status:       domain.ContractStatusActive,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := s.repo.CreateContract(ctx, contract); err != nil {
		return nil, err
	}
	return contract, nil
}

func (s *freelanceService) GetUserContracts(ctx context.Context, userID uuid.UUID) ([]domain.Contract, error) {
	return s.repo.GetUserContracts(ctx, userID)
}

func (s *freelanceService) SaveProfile(ctx context.Context, userID uuid.UUID, payload domain.SaveProfilePayload) (*domain.FreelancerProfile, error) {
	prof := &domain.FreelancerProfile{
		ID:                 uuid.New(),
		UserID:             userID,
		HourlyRate:         payload.HourlyRate,
		Tagline:            payload.Tagline,
		Skills:             payload.Skills,
		PortfolioLinks:     payload.PortfolioLinks,
		AvailabilityStatus: "available",
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.repo.SaveProfile(ctx, prof); err != nil {
		return nil, err
	}
	return prof, nil
}

func (s *freelanceService) GetProfileByUserID(ctx context.Context, userID uuid.UUID) (*domain.FreelancerProfile, error) {
	return s.repo.GetProfileByUserID(ctx, userID)
}

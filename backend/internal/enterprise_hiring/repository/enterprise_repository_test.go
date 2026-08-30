package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/enterprise_hiring/domain"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestEnterpriseRepositoryLifecycle(t *testing.T) {
	repo := NewEnterpriseRepository(nil)
	ctx := context.Background()

	entID := uuid.New()

	// 1. Create Team
	teamID := uuid.New()
	team := &domain.HiringTeam{
		ID:             teamID,
		EnterpriseID:   entID,
		DepartmentName: "Platform Systems",
		TeamName:       "Core Distributed Systems Squad",
		TeamLeadID:     uuid.New(),
		TeamLeadName:   "Alex Rivera (Principal Architect)",
		MemberCount:    10,
		CreatedAt:      time.Now(),
	}
	err := repo.CreateTeam(ctx, team)
	require.NoError(t, err)

	// 2. Fetch Teams
	teams, err := repo.GetTeams(ctx, entID)
	require.NoError(t, err)
	assert.NotEmpty(t, teams)

	// 3. Create Candidate Pool
	poolID := uuid.New()
	pool := &domain.CandidatePool{
		ID:             poolID,
		EnterpriseID:   entID,
		Name:           "Senior Go Engineers Pipeline",
		Description:    "Pre-screened Go and PostgreSQL candidates",
		CandidateCount: 25,
		CreatedAt:      time.Now(),
	}
	err = repo.CreateCandidatePool(ctx, pool)
	require.NoError(t, err)

	// 4. Log Action
	log := &domain.AuditLog{
		ID:           uuid.New(),
		EnterpriseID: entID,
		ActorID:      uuid.New(),
		ActorEmail:   "admin@enterprise.com",
		Action:       "CREATE_CANDIDATE_POOL",
		Resource:     "/api/v1/enterprise/candidate-pools",
		IPAddress:    "192.168.1.1",
		CreatedAt:    time.Now(),
	}
	err = repo.LogAction(ctx, log)
	require.NoError(t, err)

	logs, err := repo.GetAuditLogs(ctx, entID)
	require.NoError(t, err)
	assert.NotEmpty(t, logs)
}

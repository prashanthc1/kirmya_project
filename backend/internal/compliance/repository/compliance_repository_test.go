package repository

import (
	"context"
	"testing"
	"time"

	"kirmya/internal/compliance/domain"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestComplianceRepositoryLifecycle(t *testing.T) {
	repo := NewComplianceRepository(nil)
	ctx := context.Background()

	userID := uuid.New()

	// 1. Save Consent
	consent := &domain.ConsentRecord{
		ID:          uuid.New(),
		UserID:      userID,
		ConsentType: domain.ConsentAnalytics,
		IsGranted:   true,
		GrantedAt:   time.Now(),
		IPAddress:   "192.168.1.1",
	}
	err := repo.SaveConsent(ctx, consent)
	require.NoError(t, err)

	consents, err := repo.GetUserConsents(ctx, userID)
	require.NoError(t, err)
	assert.NotEmpty(t, consents)
	assert.Equal(t, domain.ConsentAnalytics, consents[0].ConsentType)

	// 2. Create Data Request (DSR)
	reqID := uuid.New()
	dataReq := &domain.DataRequest{
		ID:          reqID,
		UserID:      userID,
		RequestType: domain.RequestTypeExport,
		Status:      domain.RequestStatusPending,
		RequestedAt: time.Now(),
	}
	err = repo.CreateDataRequest(ctx, dataReq)
	require.NoError(t, err)

	fetchedReq, err := repo.GetRequestByID(ctx, reqID)
	require.NoError(t, err)
	assert.NotNil(t, fetchedReq)
	assert.Equal(t, domain.RequestStatusPending, fetchedReq.Status)

	// 3. Log Audit Event
	auditEvent := &domain.AuditEvent{
		ID:        uuid.New(),
		UserID:    userID,
		EventType: "DATA_EXPORT_REQUESTED",
		Resource:  "/api/v1/compliance/data-requests",
		Details:   map[string]interface{}{"ip": "192.168.1.1"},
		CreatedAt: time.Now(),
	}
	err = repo.LogAuditEvent(ctx, auditEvent)
	require.NoError(t, err)

	events, err := repo.GetUserAuditEvents(ctx, userID)
	require.NoError(t, err)
	assert.NotEmpty(t, events)
}

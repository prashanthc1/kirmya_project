package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"kirmya/internal/support/models"
	"kirmya/internal/support/repository"
)

func TestSupportService(t *testing.T) {
	repo := repository.NewSupportRepository(nil)
	svc := NewSupportService(repo)
	ctx := context.Background()

	t.Run("GetCategories returns knowledge base categories", func(t *testing.T) {
		cats, err := svc.GetCategories(ctx)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(cats) == 0 {
			t.Error("expected non-empty categories list")
		}
	})

	t.Run("CreateTicket generates human-readable ticket number and SLA due date", func(t *testing.T) {
		userID := uuid.New()
		ticket, err := svc.CreateTicket(ctx, &userID, models.CreateTicketPayload{
			UserEmail:   "test@kirmya.com",
			UserName:    "Test User",
			Category:    "jobs",
			Subject:     "Application Status Query",
			Description: "Need help tracking status of my application.",
			Priority:    "high",
		})
		if err != nil {
			t.Fatalf("unexpected ticket creation error: %v", err)
		}
		if ticket.TicketNumber == "" || len(ticket.TicketNumber) < 12 {
			t.Errorf("invalid ticket number: %s", ticket.TicketNumber)
		}
		if ticket.SLADueAt == nil {
			t.Error("expected non-nil SLA due timestamp")
		}
	})

	t.Run("AddMessage blocks internal notes created by ordinary users", func(t *testing.T) {
		ticketID := uuid.New()
		userID := uuid.New()
		_, err := svc.AddMessage(ctx, ticketID, &userID, "user", true, "Unauthorized internal note", nil)
		if err == nil {
			t.Error("expected error when user attempts to add internal note, got nil")
		}
	})

	t.Run("RecordCSAT validates 1-5 rating range", func(t *testing.T) {
		ticketID := uuid.New()
		err := svc.RecordCSAT(ctx, ticketID, 6, "Invalid rating")
		if err == nil {
			t.Error("expected error for rating 6, got nil")
		}

		err = svc.RecordCSAT(ctx, ticketID, 5, "Great support service!")
		if err != nil {
			t.Errorf("unexpected error for rating 5: %v", err)
		}
	})

	t.Run("GetAnalyticsSummary returns support metrics", func(t *testing.T) {
		summary, err := svc.GetAnalyticsSummary(ctx)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if summary.CSATScore <= 0.0 {
			t.Errorf("invalid CSAT score: %f", summary.CSATScore)
		}
	})
}

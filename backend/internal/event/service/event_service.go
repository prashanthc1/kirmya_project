package service

import (
	"context"
	"errors"
	"time"

	"kirmya/internal/event/domain"
	"kirmya/internal/event/provider"
	"kirmya/internal/event/repository"

	"github.com/google/uuid"
)

type EventService interface {
	CreateEvent(ctx context.Context, userID uuid.UUID, payload domain.CreateEventPayload) (*domain.Event, error)
	GetEvents(ctx context.Context, userID uuid.UUID, category string) ([]domain.Event, error)
	GetEventByID(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) (*domain.Event, error)

	RegisterAttendee(ctx context.Context, userID uuid.UUID, eventID uuid.UUID, payload domain.RegisterEventPayload) (*domain.EventAttendee, error)
	CancelRegistration(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) error
	GetUserRegistrations(ctx context.Context, userID uuid.UUID) ([]domain.Event, error)
}

type eventService struct {
	repo               repository.EventRepository
	liveStreamProvider provider.LiveStreamAdapter
}

func NewEventService(repo repository.EventRepository, liveProvider provider.LiveStreamAdapter) EventService {
	return &eventService{
		repo:               repo,
		liveStreamProvider: liveProvider,
	}
}

func (s *eventService) getOrCreateHost(ctx context.Context, userID uuid.UUID, name, company, title string) (*domain.EventHost, error) {
	hostName := name
	if hostName == "" {
		hostName = "Senior Industry Specialist"
	}
	companyName := company
	if companyName == "" {
		companyName = "Kirmya Professional Network"
	}

	host := &domain.EventHost{
		ID:           uuid.New(),
		UserID:       userID,
		HostName:     hostName,
		CompanyName:  companyName,
		Title:        title,
		Bio:          "Professional event host dedicated to candidate empowerment.",
		AvatarURL:    "",
		VerifiedHost: true,
	}

	if err := s.repo.CreateHost(ctx, host); err != nil {
		return nil, err
	}
	return host, nil
}

func (s *eventService) CreateEvent(ctx context.Context, userID uuid.UUID, payload domain.CreateEventPayload) (*domain.Event, error) {
	host, err := s.getOrCreateHost(ctx, userID, payload.HostName, payload.CompanyName, payload.HostTitle)
	if err != nil {
		return nil, err
	}

	eventID := uuid.New()
	streamInfo, _ := s.liveStreamProvider.GenerateStreamRoom(eventID, payload.Title)

	maxAtt := payload.MaxAttendees
	if maxAtt <= 0 {
		maxAtt = 500
	}

	event := &domain.Event{
		ID:               eventID,
		HostID:           host.ID,
		Title:            payload.Title,
		EventType:        payload.EventType,
		Description:      payload.Description,
		StartTime:        payload.StartTime,
		EndTime:          payload.EndTime,
		MaxAttendees:     maxAtt,
		CurrentAttendees: 0,
		LocationType:     payload.LocationType,
		LiveStreamURL:    streamInfo.StreamURL,
		BannerImageURL:   payload.BannerImageURL,
		Status:           domain.StatusUpcoming,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
		Host:             host,
		LiveStream:       streamInfo,
	}

	if err := s.repo.CreateEvent(ctx, event); err != nil {
		return nil, err
	}
	return event, nil
}

func (s *eventService) GetEvents(ctx context.Context, userID uuid.UUID, category string) ([]domain.Event, error) {
	events, err := s.repo.GetEvents(ctx, category)
	if err != nil {
		return nil, err
	}

	for i := range events {
		isReg, _ := s.repo.IsAttendeeRegistered(ctx, events[i].ID, userID)
		events[i].IsRegistered = isReg
		streamInfo, _ := s.liveStreamProvider.GenerateStreamRoom(events[i].ID, events[i].Title)
		events[i].LiveStream = streamInfo
	}
	return events, nil
}

func (s *eventService) GetEventByID(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) (*domain.Event, error) {
	ev, err := s.repo.GetEventByID(ctx, eventID)
	if err != nil {
		return nil, err
	}

	isReg, _ := s.repo.IsAttendeeRegistered(ctx, ev.ID, userID)
	ev.IsRegistered = isReg
	streamInfo, _ := s.liveStreamProvider.GenerateStreamRoom(ev.ID, ev.Title)
	ev.LiveStream = streamInfo
	return ev, nil
}

func (s *eventService) RegisterAttendee(ctx context.Context, userID uuid.UUID, eventID uuid.UUID, payload domain.RegisterEventPayload) (*domain.EventAttendee, error) {
	ev, err := s.repo.GetEventByID(ctx, eventID)
	if err != nil {
		return nil, err
	}

	if ev.CurrentAttendees >= ev.MaxAttendees {
		return nil, errors.New("event registration capacity full")
	}

	isReg, _ := s.repo.IsAttendeeRegistered(ctx, eventID, userID)
	if isReg {
		return nil, errors.New("user is already registered for this event")
	}

	userName := payload.UserName
	if userName == "" {
		userName = "Alex Rivera"
	}
	userEmail := payload.UserEmail
	if userEmail == "" {
		userEmail = "alex.rivera@example.com"
	}

	att := &domain.EventAttendee{
		ID:        uuid.New(),
		EventID:   eventID,
		UserID:    userID,
		UserName:  userName,
		UserEmail: userEmail,
		Status:    domain.AttendeeStatusRegistered,
		CreatedAt: time.Now(),
	}

	if err := s.repo.RegisterAttendee(ctx, att); err != nil {
		return nil, err
	}

	_ = s.repo.UpdateEventAttendeeCount(ctx, eventID, 1)
	return att, nil
}

func (s *eventService) CancelRegistration(ctx context.Context, userID uuid.UUID, eventID uuid.UUID) error {
	if err := s.repo.CancelAttendee(ctx, eventID, userID); err != nil {
		return err
	}
	return s.repo.UpdateEventAttendeeCount(ctx, eventID, -1)
}

func (s *eventService) GetUserRegistrations(ctx context.Context, userID uuid.UUID) ([]domain.Event, error) {
	return s.repo.GetUserRegistrations(ctx, userID)
}

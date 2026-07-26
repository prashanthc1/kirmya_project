package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/event/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type EventRepository interface {
	CreateHost(ctx context.Context, host *domain.EventHost) error
	GetHostByID(ctx context.Context, id uuid.UUID) (*domain.EventHost, error)

	CreateEvent(ctx context.Context, event *domain.Event) error
	GetEventByID(ctx context.Context, id uuid.UUID) (*domain.Event, error)
	GetEvents(ctx context.Context, category string) ([]domain.Event, error)
	UpdateEventAttendeeCount(ctx context.Context, id uuid.UUID, delta int) error

	RegisterAttendee(ctx context.Context, att *domain.EventAttendee) error
	IsAttendeeRegistered(ctx context.Context, eventID, userID uuid.UUID) (bool, error)
	GetUserRegistrations(ctx context.Context, userID uuid.UUID) ([]domain.Event, error)
	CancelAttendee(ctx context.Context, eventID, userID uuid.UUID) error
}

type pgxEventRepository struct {
	pool *pgxpool.Pool
	mu   sync.RWMutex

	hosts     map[uuid.UUID]*domain.EventHost
	events    map[uuid.UUID]*domain.Event
	attendees map[uuid.UUID]*domain.EventAttendee
}

func NewEventRepository(pool *pgxpool.Pool) EventRepository {
	repo := &pgxEventRepository{
		pool:      pool,
		hosts:     make(map[uuid.UUID]*domain.EventHost),
		events:    make(map[uuid.UUID]*domain.Event),
		attendees: make(map[uuid.UUID]*domain.EventAttendee),
	}
	repo.seedDefaultData()
	return repo
}

func (r *pgxEventRepository) seedDefaultData() {
	h1 := &domain.EventHost{
		ID:           uuid.MustParse("h1111111-1111-1111-1111-111111111111"),
		UserID:       uuid.MustParse("9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d"),
		HostName:     "Sarah Jenkins",
		CompanyName:  "TechCorp & Kirmya Careers",
		Title:        "VP of Engineering",
		Bio:          "Tech leader passionate about helping unemployed professionals land senior roles.",
		AvatarURL:    "",
		VerifiedHost: true,
		CreatedAt:    time.Now(),
	}
	r.hosts[h1.ID] = h1

	now := time.Now()

	e1 := &domain.Event{
		ID:               uuid.MustParse("e1111111-1111-1111-1111-111111111111"),
		HostID:           h1.ID,
		Title:            "Virtual Tech Hiring Fair & Speed Recruiter Match",
		EventType:        domain.TypeHiringEvent,
		Description:      "Connect live with hiring managers from 15+ tech scaleups. Speed interviewing sessions and ATS resume reviews.",
		StartTime:        now.Add(24 * time.Hour),
		EndTime:          now.Add(27 * time.Hour),
		MaxAttendees:     500,
		CurrentAttendees: 142,
		LocationType:     "virtual",
		LiveStreamURL:    "https://live.kirmya.dev/rooms/hiring-fair-2026",
		BannerImageURL:   "",
		Status:           domain.StatusUpcoming,
		CreatedAt:        now,
		UpdatedAt:        now,
		Host:             h1,
	}
	r.events[e1.ID] = e1

	e2 := &domain.Event{
		ID:               uuid.MustParse("e2222222-2222-2222-2222-222222222222"),
		HostID:           h1.ID,
		Title:            "Mastering System Design & Distributed Go Architecture",
		EventType:        domain.TypeWebinar,
		Description:      "Technical webinar covering microservice isolation, rate limiting algorithms, and PostgreSQL P99 query optimization.",
		StartTime:        now.Add(48 * time.Hour),
		EndTime:          now.Add(50 * time.Hour),
		MaxAttendees:     300,
		CurrentAttendees: 98,
		LocationType:     "virtual",
		LiveStreamURL:    "https://live.kirmya.dev/rooms/sys-design-webinar",
		BannerImageURL:   "",
		Status:           domain.StatusUpcoming,
		CreatedAt:        now,
		UpdatedAt:        now,
		Host:             h1,
	}
	r.events[e2.ID] = e2
}

func (r *pgxEventRepository) CreateHost(ctx context.Context, host *domain.EventHost) error {
	if host.ID == uuid.Nil {
		host.ID = uuid.New()
	}
	host.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.hosts[host.ID] = host
	return nil
}

func (r *pgxEventRepository) GetHostByID(ctx context.Context, id uuid.UUID) (*domain.EventHost, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if h, exists := r.hosts[id]; exists {
		hCopy := *h
		return &hCopy, nil
	}
	return nil, fmt.Errorf("event host not found: %s", id)
}

func (r *pgxEventRepository) CreateEvent(ctx context.Context, event *domain.Event) error {
	if event.ID == uuid.Nil {
		event.ID = uuid.New()
	}
	event.CreatedAt = time.Now()
	event.UpdatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()
	r.events[event.ID] = event
	return nil
}

func (r *pgxEventRepository) GetEventByID(ctx context.Context, id uuid.UUID) (*domain.Event, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	if ev, exists := r.events[id]; exists {
		evCopy := *ev
		if h, existsHost := r.hosts[ev.HostID]; existsHost {
			evCopy.Host = h
		}
		return &evCopy, nil
	}
	return nil, fmt.Errorf("event not found: %s", id)
}

func (r *pgxEventRepository) GetEvents(ctx context.Context, category string) ([]domain.Event, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Event
	for _, ev := range r.events {
		if category == "" || ev.EventType == category {
			evCopy := *ev
			if h, existsHost := r.hosts[ev.HostID]; existsHost {
				evCopy.Host = h
			}
			list = append(list, evCopy)
		}
	}
	return list, nil
}

func (r *pgxEventRepository) UpdateEventAttendeeCount(ctx context.Context, id uuid.UUID, delta int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if ev, exists := r.events[id]; exists {
		ev.CurrentAttendees += delta
		if ev.CurrentAttendees < 0 {
			ev.CurrentAttendees = 0
		}
		ev.UpdatedAt = time.Now()
		return nil
	}
	return fmt.Errorf("event not found: %s", id)
}

func (r *pgxEventRepository) IsAttendeeRegistered(ctx context.Context, eventID, userID uuid.UUID) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, att := range r.attendees {
		if att.EventID == eventID && att.UserID == userID && att.Status == domain.AttendeeStatusRegistered {
			return true, nil
		}
	}
	return false, nil
}

func (r *pgxEventRepository) RegisterAttendee(ctx context.Context, att *domain.EventAttendee) error {
	if att.ID == uuid.Nil {
		att.ID = uuid.New()
	}
	att.CreatedAt = time.Now()

	r.mu.Lock()
	defer r.mu.Unlock()

	r.attendees[att.ID] = att
	return nil
}

func (r *pgxEventRepository) GetUserRegistrations(ctx context.Context, userID uuid.UUID) ([]domain.Event, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Event
	for _, att := range r.attendees {
		if att.UserID == userID && att.Status == domain.AttendeeStatusRegistered {
			if ev, exists := r.events[att.EventID]; exists {
				evCopy := *ev
				evCopy.IsRegistered = true
				if h, existsHost := r.hosts[ev.HostID]; existsHost {
					evCopy.Host = h
				}
				list = append(list, evCopy)
			}
		}
	}
	return list, nil
}

func (r *pgxEventRepository) CancelAttendee(ctx context.Context, eventID, userID uuid.UUID) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	for _, att := range r.attendees {
		if att.EventID == eventID && att.UserID == userID {
			att.Status = domain.AttendeeStatusCancelled
			return nil
		}
	}
	return fmt.Errorf("attendee registration not found")
}

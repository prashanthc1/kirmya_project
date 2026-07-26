package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"kirmya/internal/event/domain"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
		ID:           uuid.MustParse("a1111111-1111-1111-1111-111111111111"),
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

	e1ID := uuid.MustParse("e1111111-1111-1111-1111-111111111111")
	e1 := &domain.Event{
		ID:               e1ID,
		HostID:           h1.ID,
		Host:             h1,
		Title:            "Bouncing Back from Layoffs: High-Impact Resume & AI Job Matching Summit",
		EventType:        domain.TypeCareerEvent,
		Description:      "Interactive live workshop covering resume optimization, LinkedIn networking secrets, and leveraging Kirmya AI to land interviews fast.",
		StartTime:        now.Add(48 * time.Hour),
		EndTime:          now.Add(50 * time.Hour),
		MaxAttendees:     1000,
		CurrentAttendees: 482,
		LocationType:     "virtual",
		LiveStreamURL:    "https://kirmya.com/events/live/layoff-recovery-summit",
		Status:           domain.StatusUpcoming,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	e2ID := uuid.MustParse("e2222222-2222-2222-2222-222222222222")
	e2 := &domain.Event{
		ID:               e2ID,
		HostID:           h1.ID,
		Host:             h1,
		Title:            "FAANG & Global Unicorn Virtual Hiring Expo 2026",
		EventType:        domain.TypeHiringEvent,
		Description:      "Connect directly with lead recruiters hiring Go, React, and Machine Learning engineers.",
		StartTime:        now.Add(120 * time.Hour),
		EndTime:          now.Add(124 * time.Hour),
		MaxAttendees:     2500,
		CurrentAttendees: 1890,
		LocationType:     "virtual",
		LiveStreamURL:    "https://kirmya.com/events/live/faang-hiring-expo",
		Status:           domain.StatusUpcoming,
		CreatedAt:        now,
		UpdatedAt:        now,
	}

	r.events[e1.ID] = e1
	r.events[e2.ID] = e2
}

func (r *pgxEventRepository) CreateHost(ctx context.Context, host *domain.EventHost) error {
	if host.ID == uuid.Nil {
		host.ID = uuid.New()
	}
	host.CreatedAt = time.Now()

	if r.pool != nil {
		query := `INSERT INTO event_hosts (id, user_id, host_name, company_name, title, bio, avatar_url, verified_host, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
		_, err := r.pool.Exec(ctx, query, host.ID, host.UserID, host.HostName, host.CompanyName, host.Title, host.Bio, host.AvatarURL, host.VerifiedHost, host.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.hosts[host.ID] = host
	return nil
}

func (r *pgxEventRepository) GetHostByID(ctx context.Context, id uuid.UUID) (*domain.EventHost, error) {
	if r.pool != nil {
		query := `SELECT id, user_id, host_name, company_name, title, bio, avatar_url, verified_host, created_at FROM event_hosts WHERE id = $1`
		h := &domain.EventHost{}
		err := r.pool.QueryRow(ctx, query, id).Scan(
			&h.ID, &h.UserID, &h.HostName, &h.CompanyName, &h.Title, &h.Bio, &h.AvatarURL, &h.VerifiedHost, &h.CreatedAt,
		)
		if err == nil {
			return h, nil
		}
	}

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

	if r.pool != nil {
		query := `INSERT INTO events (id, host_id, title, event_type, description, start_time, end_time, max_attendees, current_attendees, location_type, live_stream_url, banner_image_url, status, created_at, updated_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`
		_, err := r.pool.Exec(ctx, query, event.ID, event.HostID, event.Title, event.EventType, event.Description, event.StartTime, event.EndTime, event.MaxAttendees, event.CurrentAttendees, event.LocationType, event.LiveStreamURL, event.BannerImageURL, event.Status, event.CreatedAt, event.UpdatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.events[event.ID] = event
	return nil
}

func (r *pgxEventRepository) GetEventByID(ctx context.Context, id uuid.UUID) (*domain.Event, error) {
	if r.pool != nil {
		query := `SELECT id, host_id, title, event_type, description, start_time, end_time, max_attendees, current_attendees, location_type, live_stream_url, banner_image_url, status, created_at, updated_at FROM events WHERE id = $1`
		ev := &domain.Event{}
		err := r.pool.QueryRow(ctx, query, id).Scan(
			&ev.ID, &ev.HostID, &ev.Title, &ev.EventType, &ev.Description, &ev.StartTime, &ev.EndTime, &ev.MaxAttendees, &ev.CurrentAttendees, &ev.LocationType, &ev.LiveStreamURL, &ev.BannerImageURL, &ev.Status, &ev.CreatedAt, &ev.UpdatedAt,
		)
		if err == nil {
			if h, err := r.GetHostByID(ctx, ev.HostID); err == nil {
				ev.Host = h
			}
			return ev, nil
		}
	}

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
	if r.pool != nil {
		var query string
		var rows pgx.Rows
		var err error

		if category != "" && category != "ALL" {
			query = `SELECT id, host_id, title, event_type, description, start_time, end_time, max_attendees, current_attendees, location_type, live_stream_url, banner_image_url, status, created_at, updated_at FROM events WHERE event_type = $1 ORDER BY start_time ASC`
			rows, err = r.pool.Query(ctx, query, category)
		} else {
			query = `SELECT id, host_id, title, event_type, description, start_time, end_time, max_attendees, current_attendees, location_type, live_stream_url, banner_image_url, status, created_at, updated_at FROM events ORDER BY start_time ASC`
			rows, err = r.pool.Query(ctx, query)
		}

		if err == nil {
			defer rows.Close()
			var list []domain.Event
			for rows.Next() {
				var ev domain.Event
				if err := rows.Scan(&ev.ID, &ev.HostID, &ev.Title, &ev.EventType, &ev.Description, &ev.StartTime, &ev.EndTime, &ev.MaxAttendees, &ev.CurrentAttendees, &ev.LocationType, &ev.LiveStreamURL, &ev.BannerImageURL, &ev.Status, &ev.CreatedAt, &ev.UpdatedAt); err == nil {
					list = append(list, ev)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	var list []domain.Event
	for _, ev := range r.events {
		if category == "" || category == "ALL" || ev.EventType == category {
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
	if r.pool != nil {
		query := `UPDATE events SET current_attendees = GREATEST(0, current_attendees + $1), updated_at = $2 WHERE id = $3`
		_, err := r.pool.Exec(ctx, query, delta, time.Now(), id)
		if err != nil {
			return err
		}
	}

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
	if r.pool != nil {
		query := `SELECT EXISTS (SELECT 1 FROM event_attendees WHERE event_id = $1 AND user_id = $2 AND status = 'registered')`
		var isReg bool
		err := r.pool.QueryRow(ctx, query, eventID, userID).Scan(&isReg)
		if err == nil {
			return isReg, nil
		}
	}

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

	if r.pool != nil {
		query := `INSERT INTO event_attendees (id, event_id, user_id, user_name, user_email, status, created_at) 
		          VALUES ($1, $2, $3, $4, $5, $6, $7) 
		          ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status`
		_, err := r.pool.Exec(ctx, query, att.ID, att.EventID, att.UserID, att.UserName, att.UserEmail, att.Status, att.CreatedAt)
		if err != nil {
			return err
		}
	}

	r.mu.Lock()
	defer r.mu.Unlock()

	r.attendees[att.ID] = att
	return nil
}

func (r *pgxEventRepository) GetUserRegistrations(ctx context.Context, userID uuid.UUID) ([]domain.Event, error) {
	if r.pool != nil {
		query := `SELECT e.id, e.host_id, e.title, e.event_type, e.description, e.start_time, e.end_time, e.max_attendees, e.current_attendees, e.location_type, e.live_stream_url, e.banner_image_url, e.status, e.created_at, e.updated_at 
		          FROM events e 
		          JOIN event_attendees ea ON e.id = ea.event_id 
		          WHERE ea.user_id = $1 AND ea.status = 'registered'`
		rows, err := r.pool.Query(ctx, query, userID)
		if err == nil {
			defer rows.Close()
			var list []domain.Event
			for rows.Next() {
				var ev domain.Event
				if err := rows.Scan(&ev.ID, &ev.HostID, &ev.Title, &ev.EventType, &ev.Description, &ev.StartTime, &ev.EndTime, &ev.MaxAttendees, &ev.CurrentAttendees, &ev.LocationType, &ev.LiveStreamURL, &ev.BannerImageURL, &ev.Status, &ev.CreatedAt, &ev.UpdatedAt); err == nil {
					ev.IsRegistered = true
					list = append(list, ev)
				}
			}
			if len(list) > 0 {
				return list, nil
			}
		}
	}

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
	if r.pool != nil {
		query := `UPDATE event_attendees SET status = 'cancelled' WHERE event_id = $1 AND user_id = $2`
		_, err := r.pool.Exec(ctx, query, eventID, userID)
		if err != nil {
			return err
		}
	}

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

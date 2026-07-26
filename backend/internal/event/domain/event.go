package domain

import (
	"time"

	"github.com/google/uuid"
)

const (
	TypeCareerEvent     = "career_event"
	TypeWebinar         = "webinar"
	TypeHiringEvent     = "hiring_event"
	TypeCommunityMeetup = "community_meetup"

	StatusUpcoming  = "upcoming"
	StatusLive      = "live"
	StatusCompleted = "completed"

	AttendeeStatusRegistered = "registered"
	AttendeeStatusAttended   = "attended"
	AttendeeStatusCancelled  = "cancelled"
)

type EventHost struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	HostName     string    `json:"host_name"`
	CompanyName  string    `json:"company_name"`
	Title        string    `json:"title"`
	Bio          string    `json:"bio"`
	AvatarURL    string    `json:"avatar_url"`
	VerifiedHost bool      `json:"verified_host"`
	CreatedAt    time.Time `json:"created_at"`
}

type LiveStreamInfo struct {
	StreamURL   string `json:"stream_url"`
	Provider    string `json:"provider"`
	RoomID      string `json:"room_id"`
	AccessToken string `json:"access_token,omitempty"`
}

type Event struct {
	ID               uuid.UUID       `json:"id"`
	HostID           uuid.UUID       `json:"host_id"`
	Title            string          `json:"title"`
	EventType        string          `json:"event_type"`
	Description      string          `json:"description"`
	StartTime        time.Time       `json:"start_time"`
	EndTime          time.Time       `json:"end_time"`
	MaxAttendees     int             `json:"max_attendees"`
	CurrentAttendees int             `json:"current_attendees"`
	LocationType     string          `json:"location_type"`
	LiveStreamURL    string          `json:"live_stream_url"`
	BannerImageURL   string          `json:"banner_image_url"`
	Status           string          `json:"status"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
	Host             *EventHost      `json:"host,omitempty"`
	IsRegistered     bool            `json:"is_registered"`
	LiveStream       *LiveStreamInfo `json:"live_stream,omitempty"`
}

type EventAttendee struct {
	ID          uuid.UUID  `json:"id"`
	EventID     uuid.UUID  `json:"event_id"`
	UserID      uuid.UUID  `json:"user_id"`
	UserName    string     `json:"user_name"`
	UserEmail   string     `json:"user_email"`
	Status      string     `json:"status"`
	CheckedInAt *time.Time `json:"checked_in_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
}

type CreateEventPayload struct {
	Title          string    `json:"title" binding:"required"`
	EventType      string    `json:"event_type" binding:"required"`
	Description    string    `json:"description" binding:"required"`
	StartTime      time.Time `json:"start_time" binding:"required"`
	EndTime        time.Time `json:"end_time" binding:"required"`
	MaxAttendees   int       `json:"max_attendees"`
	LocationType   string    `json:"location_type"`
	BannerImageURL string    `json:"banner_image_url"`
	HostName       string    `json:"host_name"`
	CompanyName    string    `json:"company_name"`
	HostTitle      string    `json:"host_title"`
}

type RegisterEventPayload struct {
	UserName  string `json:"user_name"`
	UserEmail string `json:"user_email"`
}

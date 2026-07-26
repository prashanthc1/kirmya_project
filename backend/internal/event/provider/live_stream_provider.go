package provider

import (
	"fmt"

	"kirmya/internal/event/domain"

	"github.com/google/uuid"
)

// LiveStreamAdapter interface decouples event room generation from specific video providers (WebRTC, Zoom, Google Meet).
type LiveStreamAdapter interface {
	GetProviderName() string
	GenerateStreamRoom(eventID uuid.UUID, eventTitle string) (*domain.LiveStreamInfo, error)
}

// MockStreamAdapter provides fast WebRTC/HTML5 virtual room generation for development and demo mode
type MockStreamAdapter struct{}

func NewMockStreamAdapter() *MockStreamAdapter {
	return &MockStreamAdapter{}
}

func (p *MockStreamAdapter) GetProviderName() string {
	return "kirmya-webrtc-v1"
}

func (p *MockStreamAdapter) GenerateStreamRoom(eventID uuid.UUID, eventTitle string) (*domain.LiveStreamInfo, error) {
	roomID := fmt.Sprintf("kirmya-room-%s", eventID.String()[:8])
	streamURL := fmt.Sprintf("https://live.kirmya.dev/rooms/%s", roomID)

	return &domain.LiveStreamInfo{
		StreamURL:   streamURL,
		Provider:    p.GetProviderName(),
		RoomID:      roomID,
		AccessToken: fmt.Sprintf("token-%s", uuid.New().String()[:12]),
	}, nil
}

// ZoomStreamAdapter implements LiveStreamAdapter for Zoom SDK integration
type ZoomStreamAdapter struct{}

func NewZoomStreamAdapter() *ZoomStreamAdapter {
	return &ZoomStreamAdapter{}
}

func (p *ZoomStreamAdapter) GetProviderName() string {
	return "zoom-meeting-v2"
}

func (p *ZoomStreamAdapter) GenerateStreamRoom(eventID uuid.UUID, eventTitle string) (*domain.LiveStreamInfo, error) {
	roomID := fmt.Sprintf("892-%s-019", eventID.String()[:4])
	streamURL := fmt.Sprintf("https://zoom.us/j/%s", roomID)

	return &domain.LiveStreamInfo{
		StreamURL:   streamURL,
		Provider:    p.GetProviderName(),
		RoomID:      roomID,
		AccessToken: "passcode-889900",
	}, nil
}

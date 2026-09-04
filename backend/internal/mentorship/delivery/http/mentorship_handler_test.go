package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kirmya/internal/mentorship/models"
	"kirmya/internal/mentorship/service"
)

// spyService records the user ID the handler passed down, so a test can assert
// on the identity the module actually acted as rather than only on the status
// code. errToReturn lets a test make the service refuse an action the way the
// real one does for a caller who is neither the mentor nor the mentee.
type spyService struct {
	gotUserID string
	errToRet  error
}

func (s *spyService) record(userID string) error {
	s.gotUserID = userID
	return s.errToRet
}

func (s *spyService) CreateOrUpdateProfile(_ context.Context, userID string, _ models.UpdateMentorProfileDTO) (*models.MentorProfile, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return &models.MentorProfile{UserID: userID}, nil
}

func (s *spyService) GetProfileByUserID(_ context.Context, userID string) (*models.MentorProfile, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return &models.MentorProfile{UserID: userID}, nil
}

func (s *spyService) GetProfileByID(_ context.Context, id string) (*models.MentorProfile, error) {
	return &models.MentorProfile{UserID: id}, nil
}

func (s *spyService) SearchMentors(_ context.Context, _ models.MentorFilterParams) ([]*models.MentorProfile, int, error) {
	return nil, 0, nil
}

func (s *spyService) GetRecommendations(_ context.Context, userID string, _ []string) ([]*models.MentorProfile, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return nil, nil
}

func (s *spyService) CreateMentorshipRequest(_ context.Context, menteeID string, _ models.CreateMentorshipRequestDTO) (*models.MentorshipRequest, error) {
	if err := s.record(menteeID); err != nil {
		return nil, err
	}
	return &models.MentorshipRequest{MenteeID: menteeID}, nil
}

func (s *spyService) RespondToMentorshipRequest(_ context.Context, userID string, _ string, _ models.UpdateMentorshipRequestDTO) (*models.MentorshipRequest, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return &models.MentorshipRequest{MentorID: userID}, nil
}

func (s *spyService) GetUserRequests(_ context.Context, userID string, _ string) ([]*models.MentorshipRequest, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return nil, nil
}

func (s *spyService) GetUserMentorships(_ context.Context, userID string) ([]*models.Mentorship, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return nil, nil
}

func (s *spyService) GetMentorshipByID(_ context.Context, userID string, _ string) (*models.Mentorship, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return &models.Mentorship{MenteeID: userID}, nil
}

func (s *spyService) CreateGoal(_ context.Context, userID string, _ models.CreateMentorshipGoalDTO) (*models.MentorshipGoal, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return &models.MentorshipGoal{}, nil
}

func (s *spyService) GetGoals(_ context.Context, userID string, _ string) ([]*models.MentorshipGoal, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return nil, nil
}

func (s *spyService) UpdateGoal(_ context.Context, userID string, _ string, _ models.UpdateMentorshipGoalDTO) (*models.MentorshipGoal, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return &models.MentorshipGoal{}, nil
}

func (s *spyService) CreateSession(_ context.Context, userID string, _ models.CreateMentorshipSessionDTO) (*models.MentorshipSession, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return &models.MentorshipSession{}, nil
}

func (s *spyService) GetSessions(_ context.Context, userID string, _ string) ([]*models.MentorshipSession, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return nil, nil
}

func (s *spyService) UpdateSession(_ context.Context, userID string, _ string, _ models.UpdateMentorshipSessionDTO) (*models.MentorshipSession, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return &models.MentorshipSession{}, nil
}

func (s *spyService) SubmitFeedback(_ context.Context, fromUserID string, _ models.CreateMentorshipFeedbackDTO) (*models.MentorshipFeedback, error) {
	if err := s.record(fromUserID); err != nil {
		return nil, err
	}
	return &models.MentorshipFeedback{FromUserID: fromUserID}, nil
}

func (s *spyService) GetFeedbackForMentorship(_ context.Context, userID string, _ string) ([]*models.MentorshipFeedback, error) {
	if err := s.record(userID); err != nil {
		return nil, err
	}
	return nil, nil
}

var _ service.MentorshipService = (*spyService)(nil)

// authedContext builds a request context the way the auth middleware leaves it:
// the verified user ID under "userID", stored as a uuid.UUID.
func authedContext(t *testing.T, method, target string, body any, userID uuid.UUID) (*gin.Context, *httptest.ResponseRecorder) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	rec := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(rec)

	var payload []byte
	if body != nil {
		payload, _ = json.Marshal(body)
	}
	req := httptest.NewRequest(method, target, bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req

	if userID != uuid.Nil {
		c.Set("userID", userID)
	}
	return c, rec
}

// TestGetUserID_ResolvesUUIDFromAuthContext is the regression test for the bug
// this change fixes. Both auth middlewares store claims.UserID, which is a
// uuid.UUID. The previous resolver fell through to c.GetString("userID"), whose
// type assertion to string fails for a uuid.UUID, so it returned "" and every
// authenticated mentorship endpoint answered 401 for every real user.
func TestGetUserID_ResolvesUUIDFromAuthContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	id := uuid.New()
	c.Set("userID", id)

	if got := getUserID(c); got != id.String() {
		t.Fatalf("authenticated caller resolved to %q, want %q", got, id.String())
	}
}

// TestGetUserID_ResolvesStringFromAuthContext covers the other shape the shared
// helper accepts, so the module keeps working if a middleware ever stores the
// ID already rendered as text.
func TestGetUserID_ResolvesStringFromAuthContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	id := uuid.New()
	c.Set("userID", id.String())

	if got := getUserID(c); got != id.String() {
		t.Fatalf("authenticated caller resolved to %q, want %q", got, id.String())
	}
}

// TestGetUserID_IgnoresClientSuppliedIdentity is the core security assertion:
// every channel the client controls must be inert for identity purposes.
func TestGetUserID_IgnoresClientSuppliedIdentity(t *testing.T) {
	victim := uuid.New()

	cases := []struct {
		name  string
		spoof func(c *gin.Context)
	}{
		{"X-User-ID header", func(c *gin.Context) {
			c.Request.Header.Set("X-User-ID", victim.String())
		}},
		{"user_id query parameter", func(c *gin.Context) {
			c.Request.URL.RawQuery = "user_id=" + victim.String()
		}},
		{"legacy user_id context key", func(c *gin.Context) {
			// Nothing in the codebase sets this key. It must not be honoured
			// even if some future middleware starts populating it.
			c.Set("user_id", victim.String())
		}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gin.SetMode(gin.TestMode)
			c, _ := gin.CreateTestContext(httptest.NewRecorder())
			c.Request = httptest.NewRequest(http.MethodGet, "/", nil)
			tc.spoof(c)

			if got := getUserID(c); got != "" {
				t.Fatalf("unauthenticated caller spoofed identity via %s: resolved to %q", tc.name, got)
			}
		})
	}
}

// TestHandler_RejectsUnauthenticatedRequest checks the handler refuses rather
// than falling back to some default identity.
func TestHandler_RejectsUnauthenticatedRequest(t *testing.T) {
	svc := &spyService{}
	h := NewMentorshipHandler(svc)

	c, rec := authedContext(t, http.MethodGet, "/mentorship/mentors/profile", nil, uuid.Nil)
	h.GetMyProfile(c)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
	if svc.gotUserID != "" {
		t.Fatalf("service was called with %q for an unauthenticated request", svc.gotUserID)
	}
}

// TestHandler_ActsOnlyAsAuthenticatedUser is the end-to-end version of the
// spoofing test: an attacker supplies a victim's ID through every client-
// controlled channel at once, and the handler must still act as the token
// holder.
func TestHandler_ActsOnlyAsAuthenticatedUser(t *testing.T) {
	attacker := uuid.New()
	victim := uuid.New()

	svc := &spyService{}
	h := NewMentorshipHandler(svc)

	c, rec := authedContext(t, http.MethodPost, "/mentorship/requests?user_id="+victim.String(),
		models.CreateMentorshipRequestDTO{MentorID: uuid.New().String(), Message: "hello"}, attacker)
	c.Request.Header.Set("X-User-ID", victim.String())

	h.CreateMentorshipRequest(c)

	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want 201; body = %s", rec.Code, rec.Body.String())
	}
	if svc.gotUserID != attacker.String() {
		t.Fatalf("handler acted as %q, want the token holder %q", svc.gotUserID, attacker.String())
	}
	if svc.gotUserID == victim.String() {
		t.Fatal("identity spoofing: handler acted as the victim")
	}
}

// TestHandler_CannotActOnAnotherUsersMentorship proves the second half of the
// property. Identity is correct, but the caller is neither the mentor nor the
// mentee of the target mentorship, so the service refuses and the handler must
// surface that as 403 rather than as a malformed-request 400.
func TestHandler_CannotActOnAnotherUsersMentorship(t *testing.T) {
	outsider := uuid.New()
	svc := &spyService{errToRet: service.ErrUnauthorized}
	h := NewMentorshipHandler(svc)

	c, rec := authedContext(t, http.MethodPut, "/mentorship/requests/some-id/status",
		models.UpdateMentorshipRequestDTO{Status: "accepted"}, outsider)
	c.Params = gin.Params{{Key: "id", Value: "a-request-owned-by-somebody-else"}}

	h.RespondToMentorshipRequest(c)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403 for an unauthorized relationship; body = %s", rec.Code, rec.Body.String())
	}
	if svc.gotUserID != outsider.String() {
		t.Fatalf("service saw %q, want the authenticated caller %q", svc.gotUserID, outsider.String())
	}
}

// TestHandler_EveryAuthenticatedEndpointRejectsAnonymous walks the whole
// authenticated surface so a newly added handler that forgets the identity
// check is caught here rather than in production.
func TestHandler_EveryAuthenticatedEndpointRejectsAnonymous(t *testing.T) {
	h := NewMentorshipHandler(&spyService{})

	endpoints := map[string]func(*gin.Context){
		"CreateOrUpdateProfile":      h.CreateOrUpdateProfile,
		"GetMyProfile":               h.GetMyProfile,
		"CreateMentorshipRequest":    h.CreateMentorshipRequest,
		"RespondToMentorshipRequest": h.RespondToMentorshipRequest,
		"GetUserRequests":            h.GetUserRequests,
		"GetActiveMentorships":       h.GetActiveMentorships,
		"GetMentorshipByID":          h.GetMentorshipByID,
		"CreateGoal":                 h.CreateGoal,
		"GetGoals":                   h.GetGoals,
		"UpdateGoal":                 h.UpdateGoal,
		"CreateSession":              h.CreateSession,
		"GetSessions":                h.GetSessions,
		"UpdateSession":              h.UpdateSession,
		"SubmitFeedback":             h.SubmitFeedback,
		"GetFeedback":                h.GetFeedback,
	}

	for name, handle := range endpoints {
		t.Run(name, func(t *testing.T) {
			// Anonymous, but supplying a victim ID through client channels.
			c, rec := authedContext(t, http.MethodPost, "/?user_id="+uuid.New().String(), map[string]any{}, uuid.Nil)
			c.Request.Header.Set("X-User-ID", uuid.New().String())
			c.Params = gin.Params{{Key: "id", Value: "x"}}

			handle(c)

			if rec.Code != http.StatusUnauthorized {
				t.Errorf("%s returned %d for an anonymous caller, want 401; body = %s",
					name, rec.Code, rec.Body.String())
			}
		})
	}
}

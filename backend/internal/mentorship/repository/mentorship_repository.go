package repository

import (
	"context"
	"errors"
	"strings"
	"sync"
	"time"

	"kirmya/internal/mentorship/models"
)

var (
	ErrNotFound      = errors.New("record not found")
	ErrAlreadyExists = errors.New("record already exists")
)

type MentorshipRepository interface {
	// Profile methods
	CreateMentorProfile(ctx context.Context, profile *models.MentorProfile) error
	GetMentorProfileByID(ctx context.Context, id string) (*models.MentorProfile, error)
	GetMentorProfileByUserID(ctx context.Context, userID string) (*models.MentorProfile, error)
	UpdateMentorProfile(ctx context.Context, profile *models.MentorProfile) error
	ListMentorProfiles(ctx context.Context, params models.MentorFilterParams) ([]*models.MentorProfile, int, error)

	// Request methods
	CreateRequest(ctx context.Context, req *models.MentorshipRequest) error
	GetRequestByID(ctx context.Context, id string) (*models.MentorshipRequest, error)
	GetPendingRequestBetween(ctx context.Context, menteeID, mentorID string) (*models.MentorshipRequest, error)
	UpdateRequest(ctx context.Context, req *models.MentorshipRequest) error
	ListRequestsByUserID(ctx context.Context, userID string, role string) ([]*models.MentorshipRequest, error)

	// Mentorship relationship methods
	CreateMentorship(ctx context.Context, m *models.Mentorship) error
	GetMentorshipByID(ctx context.Context, id string) (*models.Mentorship, error)
	GetActiveMentorshipBetween(ctx context.Context, menteeID, mentorID string) (*models.Mentorship, error)
	CountActiveMenteesForMentor(ctx context.Context, mentorID string) (int, error)
	UpdateMentorship(ctx context.Context, m *models.Mentorship) error
	ListMentorshipsByUserID(ctx context.Context, userID string) ([]*models.Mentorship, error)

	// Goal methods
	CreateGoal(ctx context.Context, goal *models.MentorshipGoal) error
	GetGoalByID(ctx context.Context, id string) (*models.MentorshipGoal, error)
	UpdateGoal(ctx context.Context, goal *models.MentorshipGoal) error
	ListGoalsByMentorshipID(ctx context.Context, mentorshipID string) ([]*models.MentorshipGoal, error)

	// Session methods
	CreateSession(ctx context.Context, session *models.MentorshipSession) error
	GetSessionByID(ctx context.Context, id string) (*models.MentorshipSession, error)
	UpdateSession(ctx context.Context, session *models.MentorshipSession) error
	ListSessionsByMentorshipID(ctx context.Context, mentorshipID string) ([]*models.MentorshipSession, error)

	// Feedback methods
	CreateFeedback(ctx context.Context, fb *models.MentorshipFeedback) error
	ListFeedbackByMentorshipID(ctx context.Context, mentorshipID string) ([]*models.MentorshipFeedback, error)
	ListFeedbackByMentorID(ctx context.Context, mentorID string) ([]*models.MentorshipFeedback, error)
}

type MemoryMentorshipRepository struct {
	mu          sync.RWMutex
	profiles    map[string]*models.MentorProfile    // Key: ID
	userToProf  map[string]string                   // Key: UserID -> Profile ID
	requests    map[string]*models.MentorshipRequest// Key: ID
	mentorships map[string]*models.Mentorship       // Key: ID
	goals       map[string]*models.MentorshipGoal   // Key: ID
	sessions    map[string]*models.MentorshipSession// Key: ID
	feedbacks   map[string]*models.MentorshipFeedback// Key: ID
}

func NewMemoryMentorshipRepository() *MemoryMentorshipRepository {
	return &MemoryMentorshipRepository{
		profiles:    make(map[string]*models.MentorProfile),
		userToProf:  make(map[string]string),
		requests:    make(map[string]*models.MentorshipRequest),
		mentorships: make(map[string]*models.Mentorship),
		goals:       make(map[string]*models.MentorshipGoal),
		sessions:    make(map[string]*models.MentorshipSession),
		feedbacks:   make(map[string]*models.MentorshipFeedback),
	}
}

// Profiles
func (r *MemoryMentorshipRepository) CreateMentorProfile(ctx context.Context, profile *models.MentorProfile) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.userToProf[profile.UserID]; exists {
		return ErrAlreadyExists
	}

	pCopy := *profile
	r.profiles[profile.ID] = &pCopy
	r.userToProf[profile.UserID] = profile.ID
	return nil
}

func (r *MemoryMentorshipRepository) GetMentorProfileByID(ctx context.Context, id string) (*models.MentorProfile, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	p, exists := r.profiles[id]
	if !exists {
		return nil, ErrNotFound
	}
	pCopy := *p
	return &pCopy, nil
}

func (r *MemoryMentorshipRepository) GetMentorProfileByUserID(ctx context.Context, userID string) (*models.MentorProfile, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	profID, exists := r.userToProf[userID]
	if !exists {
		return nil, ErrNotFound
	}
	p, exists := r.profiles[profID]
	if !exists {
		return nil, ErrNotFound
	}
	pCopy := *p
	return &pCopy, nil
}

func (r *MemoryMentorshipRepository) UpdateMentorProfile(ctx context.Context, profile *models.MentorProfile) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.profiles[profile.ID]; !exists {
		return ErrNotFound
	}
	pCopy := *profile
	pCopy.UpdatedAt = time.Now()
	r.profiles[profile.ID] = &pCopy
	return nil
}

func (r *MemoryMentorshipRepository) ListMentorProfiles(ctx context.Context, params models.MentorFilterParams) ([]*models.MentorProfile, int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var matched []*models.MentorProfile

	for _, p := range r.profiles {
		if params.IsAvailable != nil && p.IsAvailable != *params.IsAvailable {
			continue
		}
		if params.MinYearsExperience > 0 && p.YearsExperience < params.MinYearsExperience {
			continue
		}
		if params.MaxHourlyRate > 0 && p.HourlyRate > params.MaxHourlyRate {
			continue
		}
		if params.Industry != "" && !containsIgnoreCase(p.Industries, params.Industry) && !strings.EqualFold(p.Company, params.Industry) {
			continue
		}
		if params.Language != "" && !containsIgnoreCase(p.Languages, params.Language) {
			continue
		}

		if len(params.Expertise) > 0 {
			hasMatch := false
			for _, exp := range params.Expertise {
				if containsIgnoreCase(p.Expertise, exp) {
					hasMatch = true
					break
				}
			}
			if !hasMatch {
				continue
			}
		}

		if params.Search != "" {
			term := strings.ToLower(params.Search)
			inBio := strings.Contains(strings.ToLower(p.Bio), term)
			inTitle := strings.Contains(strings.ToLower(p.JobTitle), term)
			inCompany := strings.Contains(strings.ToLower(p.Company), term)
			inExp := containsSubstringIgnoreCase(p.Expertise, term)

			if !inBio && !inTitle && !inCompany && !inExp {
				continue
			}
		}

		pCopy := *p
		matched = append(matched, &pCopy)
	}

	total := len(matched)
	if params.Page <= 0 {
		params.Page = 1
	}
	if params.Limit <= 0 {
		params.Limit = 20
	}

	start := (params.Page - 1) * params.Limit
	if start >= total {
		return []*models.MentorProfile{}, total, nil
	}
	end := start + params.Limit
	if end > total {
		end = total
	}

	return matched[start:end], total, nil
}

// Requests
func (r *MemoryMentorshipRepository) CreateRequest(ctx context.Context, req *models.MentorshipRequest) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	rCopy := *req
	r.requests[req.ID] = &rCopy
	return nil
}

func (r *MemoryMentorshipRepository) GetRequestByID(ctx context.Context, id string) (*models.MentorshipRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	req, exists := r.requests[id]
	if !exists {
		return nil, ErrNotFound
	}
	rCopy := *req
	return &rCopy, nil
}

func (r *MemoryMentorshipRepository) GetPendingRequestBetween(ctx context.Context, menteeID, mentorID string) (*models.MentorshipRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, req := range r.requests {
		if req.MenteeID == menteeID && req.MentorID == mentorID && req.Status == models.RequestStatusPending {
			rCopy := *req
			return &rCopy, nil
		}
	}
	return nil, ErrNotFound
}

func (r *MemoryMentorshipRepository) UpdateRequest(ctx context.Context, req *models.MentorshipRequest) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.requests[req.ID]; !exists {
		return ErrNotFound
	}
	rCopy := *req
	rCopy.UpdatedAt = time.Now()
	r.requests[req.ID] = &rCopy
	return nil
}

func (r *MemoryMentorshipRepository) ListRequestsByUserID(ctx context.Context, userID string, role string) ([]*models.MentorshipRequest, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*models.MentorshipRequest
	for _, req := range r.requests {
		match := false
		if (role == "mentee" || role == "all" || role == "") && req.MenteeID == userID {
			match = true
		}
		if (role == "mentor" || role == "all" || role == "") && req.MentorID == userID {
			match = true
		}
		if match {
			rCopy := *req
			result = append(result, &rCopy)
		}
	}
	return result, nil
}

// Mentorships
func (r *MemoryMentorshipRepository) CreateMentorship(ctx context.Context, m *models.Mentorship) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	mCopy := *m
	r.mentorships[m.ID] = &mCopy
	return nil
}

func (r *MemoryMentorshipRepository) GetMentorshipByID(ctx context.Context, id string) (*models.Mentorship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	m, exists := r.mentorships[id]
	if !exists {
		return nil, ErrNotFound
	}
	mCopy := *m
	return &mCopy, nil
}

func (r *MemoryMentorshipRepository) GetActiveMentorshipBetween(ctx context.Context, menteeID, mentorID string) (*models.Mentorship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, m := range r.mentorships {
		if m.MenteeID == menteeID && m.MentorID == mentorID && m.Status == models.MentorshipStatusActive {
			mCopy := *m
			return &mCopy, nil
		}
	}
	return nil, ErrNotFound
}

func (r *MemoryMentorshipRepository) CountActiveMenteesForMentor(ctx context.Context, mentorID string) (int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	count := 0
	for _, m := range r.mentorships {
		if m.MentorID == mentorID && m.Status == models.MentorshipStatusActive {
			count++
		}
	}
	return count, nil
}

func (r *MemoryMentorshipRepository) UpdateMentorship(ctx context.Context, m *models.Mentorship) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.mentorships[m.ID]; !exists {
		return ErrNotFound
	}
	mCopy := *m
	mCopy.UpdatedAt = time.Now()
	r.mentorships[m.ID] = &mCopy
	return nil
}

func (r *MemoryMentorshipRepository) ListMentorshipsByUserID(ctx context.Context, userID string) ([]*models.Mentorship, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*models.Mentorship
	for _, m := range r.mentorships {
		if m.MenteeID == userID || m.MentorID == userID {
			mCopy := *m
			result = append(result, &mCopy)
		}
	}
	return result, nil
}

// Goals
func (r *MemoryMentorshipRepository) CreateGoal(ctx context.Context, goal *models.MentorshipGoal) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	gCopy := *goal
	r.goals[goal.ID] = &gCopy
	return nil
}

func (r *MemoryMentorshipRepository) GetGoalByID(ctx context.Context, id string) (*models.MentorshipGoal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	g, exists := r.goals[id]
	if !exists {
		return nil, ErrNotFound
	}
	gCopy := *g
	return &gCopy, nil
}

func (r *MemoryMentorshipRepository) UpdateGoal(ctx context.Context, goal *models.MentorshipGoal) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.goals[goal.ID]; !exists {
		return ErrNotFound
	}
	gCopy := *goal
	gCopy.UpdatedAt = time.Now()
	r.goals[goal.ID] = &gCopy
	return nil
}

func (r *MemoryMentorshipRepository) ListGoalsByMentorshipID(ctx context.Context, mentorshipID string) ([]*models.MentorshipGoal, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*models.MentorshipGoal
	for _, g := range r.goals {
		if g.MentorshipID == mentorshipID {
			gCopy := *g
			result = append(result, &gCopy)
		}
	}
	return result, nil
}

// Sessions
func (r *MemoryMentorshipRepository) CreateSession(ctx context.Context, session *models.MentorshipSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	sCopy := *session
	r.sessions[session.ID] = &sCopy
	return nil
}

func (r *MemoryMentorshipRepository) GetSessionByID(ctx context.Context, id string) (*models.MentorshipSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, exists := r.sessions[id]
	if !exists {
		return nil, ErrNotFound
	}
	sCopy := *s
	return &sCopy, nil
}

func (r *MemoryMentorshipRepository) UpdateSession(ctx context.Context, session *models.MentorshipSession) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.sessions[session.ID]; !exists {
		return ErrNotFound
	}
	sCopy := *session
	sCopy.UpdatedAt = time.Now()
	r.sessions[session.ID] = &sCopy
	return nil
}

func (r *MemoryMentorshipRepository) ListSessionsByMentorshipID(ctx context.Context, mentorshipID string) ([]*models.MentorshipSession, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*models.MentorshipSession
	for _, s := range r.sessions {
		if s.MentorshipID == mentorshipID {
			sCopy := *s
			result = append(result, &sCopy)
		}
	}
	return result, nil
}

// Feedback
func (r *MemoryMentorshipRepository) CreateFeedback(ctx context.Context, fb *models.MentorshipFeedback) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	fbCopy := *fb
	r.feedbacks[fb.ID] = &fbCopy
	return nil
}

func (r *MemoryMentorshipRepository) ListFeedbackByMentorshipID(ctx context.Context, mentorshipID string) ([]*models.MentorshipFeedback, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*models.MentorshipFeedback
	for _, fb := range r.feedbacks {
		if fb.MentorshipID == mentorshipID {
			fbCopy := *fb
			result = append(result, &fbCopy)
		}
	}
	return result, nil
}

func (r *MemoryMentorshipRepository) ListFeedbackByMentorID(ctx context.Context, mentorID string) ([]*models.MentorshipFeedback, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var result []*models.MentorshipFeedback
	for _, fb := range r.feedbacks {
		if fb.ToUserID == mentorID {
			fbCopy := *fb
			result = append(result, &fbCopy)
		}
	}
	return result, nil
}

// Helpers
func containsIgnoreCase(slice []string, val string) bool {
	for _, item := range slice {
		if strings.EqualFold(item, val) {
			return true
		}
	}
	return false
}

func containsSubstringIgnoreCase(slice []string, val string) bool {
	for _, item := range slice {
		if strings.Contains(strings.ToLower(item), strings.ToLower(val)) {
			return true
		}
	}
	return false
}

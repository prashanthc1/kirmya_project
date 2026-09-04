package ai

import (
	"sync"
	"time"
)

type UserQuota struct {
	DailyRequests int
	LastReset     time.Time
}

type AIRateLimiter struct {
	mu           sync.Mutex
	quotas       map[string]*UserQuota
	maxPerMinute int
	maxPerDay    int
}

func NewAIRateLimiter(maxPerMinute, maxPerDay int) *AIRateLimiter {
	if maxPerMinute <= 0 {
		maxPerMinute = 20
	}
	if maxPerDay <= 0 {
		maxPerDay = 200
	}
	return &AIRateLimiter{
		quotas:       make(map[string]*UserQuota),
		maxPerMinute: maxPerMinute,
		maxPerDay:    maxPerDay,
	}
}

func (l *AIRateLimiter) Allow(userID string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	quota, exists := l.quotas[userID]
	if !exists {
		l.quotas[userID] = &UserQuota{
			DailyRequests: 1,
			LastReset:     now,
		}
		return true
	}

	// Reset if new day
	if now.Sub(quota.LastReset) > 24*time.Hour {
		quota.DailyRequests = 1
		quota.LastReset = now
		return true
	}

	if quota.DailyRequests >= l.maxPerDay {
		return false
	}

	quota.DailyRequests++
	return true
}

func (l *AIRateLimiter) GetUsage(userID string) (int, int) {
	l.mu.Lock()
	defer l.mu.Unlock()

	quota, exists := l.quotas[userID]
	if !exists {
		return 0, l.maxPerDay
	}
	return quota.DailyRequests, l.maxPerDay
}

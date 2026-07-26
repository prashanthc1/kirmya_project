package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type tokenBucket struct {
	tokens     float64
	lastRefill time.Time
}

var (
	registry = make(map[string]*tokenBucket)
	mu       sync.Mutex
)

// RateLimiter configures a sliding token bucket limiter per Client IP.
// rate: tokens added per second, capacity: maximum token burst count.
func RateLimiter(rate float64, capacity float64) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		mu.Lock()
		bucket, exists := registry[clientIP]
		if !exists {
			bucket = &tokenBucket{
				tokens:     capacity,
				lastRefill: time.Now(),
			}
			registry[clientIP] = bucket
		}

		// Refill tokens based on elapsed time
		now := time.Now()
		elapsed := now.Sub(bucket.lastRefill).Seconds()
		bucket.tokens += elapsed * rate
		if bucket.tokens > capacity {
			bucket.tokens = capacity
		}
		bucket.lastRefill = now

		// Check and consume token
		if bucket.tokens >= 1.0 {
			bucket.tokens -= 1.0
			mu.Unlock()
			c.Next()
		} else {
			mu.Unlock()
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Try again later.",
			})
			c.Abort()
		}
	}
}

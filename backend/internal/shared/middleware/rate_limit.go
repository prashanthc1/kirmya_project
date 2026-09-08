package middleware

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type tokenBucket struct {
	tokens   float64
	lastSeen time.Time
}

// ipRateLimiter holds one token bucket per client IP. Every RateLimiter call
// gets its own instance: a shared registry would let the buckets of one limiter
// drain those of another, so a login attempt would spend the caller's global
// request budget and vice versa.
type ipRateLimiter struct {
	mu        sync.Mutex
	buckets   map[string]*tokenBucket
	rate      float64
	capacity  float64
	idleTTL   time.Duration
	lastSweep time.Time
}

// sweepInterval bounds how often idle buckets are collected. Sweeping is done
// inline on request handling, so it must be cheap relative to traffic.
const sweepInterval = time.Minute

func newIPRateLimiter(rate, capacity float64) *ipRateLimiter {
	// A bucket idle for longer than a full refill is indistinguishable from a
	// fresh one, so it can be dropped without changing any client's budget.
	idleTTL := 5 * time.Minute
	if rate > 0 {
		if refill := time.Duration(capacity/rate) * time.Second; refill > idleTTL {
			idleTTL = refill
		}
	}

	return &ipRateLimiter{
		buckets:   make(map[string]*tokenBucket),
		rate:      rate,
		capacity:  capacity,
		idleTTL:   idleTTL,
		lastSweep: time.Now(),
	}
}

// allow consumes a token for clientIP, reporting whether the request may pass,
// how many tokens remain and how long to wait when it may not.
func (l *ipRateLimiter) allow(clientIP string, now time.Time) (bool, float64, time.Duration) {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.sweepLocked(now)

	bucket, exists := l.buckets[clientIP]
	if !exists {
		bucket = &tokenBucket{tokens: l.capacity, lastSeen: now}
		l.buckets[clientIP] = bucket
	} else {
		bucket.tokens += now.Sub(bucket.lastSeen).Seconds() * l.rate
		if bucket.tokens > l.capacity {
			bucket.tokens = l.capacity
		}
	}
	bucket.lastSeen = now

	if bucket.tokens >= 1.0 {
		bucket.tokens -= 1.0
		return true, bucket.tokens, 0
	}

	retryAfter := time.Second
	if l.rate > 0 {
		retryAfter = time.Duration(math.Ceil((1.0-bucket.tokens)/l.rate)) * time.Second
	}
	if retryAfter < time.Second {
		retryAfter = time.Second
	}
	return false, bucket.tokens, retryAfter
}

// sweepLocked drops buckets no client has touched for idleTTL. Without it the
// registry grows once per distinct client IP and never shrinks, which is a slow
// memory leak an attacker can drive by rotating source addresses.
func (l *ipRateLimiter) sweepLocked(now time.Time) {
	if now.Sub(l.lastSweep) < sweepInterval {
		return
	}
	l.lastSweep = now

	for ip, bucket := range l.buckets {
		if now.Sub(bucket.lastSeen) > l.idleTTL {
			delete(l.buckets, ip)
		}
	}
}

// RateLimiter configures a token bucket limiter per client IP.
// rate: tokens added per second, capacity: maximum token burst count.
// A rate of zero or less disables limiting entirely.
func RateLimiter(rate float64, capacity float64) gin.HandlerFunc {
	if rate <= 0 || capacity < 1 {
		return func(c *gin.Context) { c.Next() }
	}

	limiter := newIPRateLimiter(rate, capacity)
	limitHeader := strconv.FormatFloat(capacity, 'f', -1, 64)

	// Each limiter gets its own key prefix so the /auth bucket cannot drain the
	// newsletter one, matching the per-instance separation of the local
	// limiters. The prefix is derived from the limiter's own shape rather than
	// from a caller-supplied name, so a new limiter cannot silently collide
	// with an existing one by reusing a label.
	sharedPrefix := fmt.Sprintf("ratelimit:{%g:%g}:", rate, capacity)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		// The shared bucket is authoritative when Redis is configured and
		// reachable: with several replicas the process-local buckets each grant
		// the full allowance to the same client, so the documented limit is
		// multiplied by the replica count.
		//
		// A broker failure falls back to the local limiter rather than failing
		// closed. Denying every request because Redis hiccuped would lock users
		// out of sign-in, which is a worse outcome than a briefly looser limit.
		if client := sharedLimiterClient; client != nil {
			shared := &sharedLimiter{client: client, rate: rate, capacity: capacity, prefix: sharedPrefix}
			if allowed, remaining, retryAfter, consulted := shared.allow(c.Request.Context(), clientIP, time.Now()); consulted {
				respondToRateLimit(c, limitHeader, allowed, remaining, retryAfter)
				return
			}
		}

		allowed, remaining, retryAfter := limiter.allow(clientIP, time.Now())
		respondToRateLimit(c, limitHeader, allowed, remaining, retryAfter)
	}
}

// respondToRateLimit applies one limiter decision, so the shared and local
// paths cannot drift in the headers or the status they return.
func respondToRateLimit(c *gin.Context, limitHeader string, allowed bool, remaining float64, retryAfter time.Duration) {
	c.Header("X-RateLimit-Limit", limitHeader)
	c.Header("X-RateLimit-Remaining", strconv.Itoa(int(remaining)))

	if allowed {
		c.Next()
		return
	}

	c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
		"error": "Rate limit exceeded. Try again later.",
	})
}

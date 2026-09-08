package middleware

import (
	"context"
	"log/slog"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"
)

// Rate limiting across replicas.
//
// The limiter keeps its token buckets in a map inside one process. With one API
// instance that is exactly right. With N instances behind a load balancer it
// silently becomes N times more permissive: each process grants the full
// allowance to the same client, so a credential endpoint documented as five
// attempts a minute admits five per replica per minute. The tighter the limit,
// the more the multiplication matters — and the tightest limits here are the
// ones protecting sign-in.
//
// This backs the same token-bucket arithmetic with Redis so every replica draws
// from one bucket. It is used when Redis is configured and the process-local
// limiter remains the fallback, because a limiter that fails closed on a broker
// blip would lock every user out of sign-in.

// sharedLimiter evaluates a token bucket held in Redis.
type sharedLimiter struct {
	client   *redis.Client
	rate     float64
	capacity float64
	prefix   string

	// degraded tracks whether Redis is currently unreachable, so the fallback
	// is logged once rather than on every request during an outage.
	mu       sync.Mutex
	degraded bool
}

// allowScript is the whole decision, run atomically inside Redis.
//
// Read-modify-write from the application would let two replicas both read the
// same token count and both decide they may proceed, which is the race that
// makes a distributed limiter no limiter at all. Doing it in one script means
// Redis serialises it.
//
// KEYS[1] bucket key
// ARGV[1] rate (tokens per second)
// ARGV[2] capacity
// ARGV[3] now (unix seconds, fractional)
// ARGV[4] TTL seconds for the key
var allowScript = redis.NewScript(`
local key      = KEYS[1]
local rate     = tonumber(ARGV[1])
local capacity = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local ttl      = tonumber(ARGV[4])

local bucket   = redis.call('HMGET', key, 'tokens', 'seen')
local tokens   = tonumber(bucket[1])
local seen     = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  seen = now
end

-- Refill for the time that has passed since this bucket was last touched.
tokens = math.min(capacity, tokens + (now - seen) * rate)

local allowed = 0
if tokens >= 1.0 then
  tokens = tokens - 1.0
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'seen', now)
redis.call('EXPIRE', key, ttl)

return {allowed, tostring(tokens)}
`)

// allow consumes a token for clientIP, reporting whether the request may pass,
// how many tokens remain and how long to wait when it may not.
//
// The second return reports whether the shared bucket was actually consulted.
// A false there means the caller must fall back to the process-local limiter:
// answering "allowed" on a broker error would remove the limit entirely, and
// answering "denied" would lock everyone out because Redis hiccuped.
func (l *sharedLimiter) allow(ctx context.Context, clientIP string, now time.Time) (allowed bool, remaining float64, retryAfter time.Duration, consulted bool) {
	ctx, cancel := context.WithTimeout(ctx, 250*time.Millisecond)
	defer cancel()

	ttl := int64(math.Ceil(l.capacity/l.rate)) + 60

	res, err := allowScript.Run(ctx, l.client,
		[]string{l.prefix + clientIP},
		l.rate, l.capacity, float64(now.UnixNano())/1e9, ttl,
	).Slice()
	if err != nil {
		l.reportDegraded(err)
		return false, 0, 0, false
	}
	l.reportHealthy()

	if len(res) != 2 {
		return false, 0, 0, false
	}

	allowedFlag, _ := res[0].(int64)
	tokensText, _ := res[1].(string)
	tokens := parseFloat(tokensText)

	if allowedFlag == 1 {
		return true, tokens, 0, true
	}

	wait := time.Second
	if l.rate > 0 {
		wait = time.Duration(math.Ceil((1.0-tokens)/l.rate)) * time.Second
	}
	if wait < time.Second {
		wait = time.Second
	}
	return false, tokens, wait, true
}

func (l *sharedLimiter) reportDegraded(err error) {
	l.mu.Lock()
	defer l.mu.Unlock()
	if l.degraded {
		return
	}
	l.degraded = true
	slog.Error("shared rate limiter is unreachable; falling back to per-process limits, "+
		"which are more permissive across replicas",
		slog.String("error", err.Error()))
}

func (l *sharedLimiter) reportHealthy() {
	l.mu.Lock()
	defer l.mu.Unlock()
	if !l.degraded {
		return
	}
	l.degraded = false
	slog.Info("shared rate limiter is reachable again")
}

func parseFloat(s string) float64 {
	var f float64
	var neg bool
	i := 0
	if strings.HasPrefix(s, "-") {
		neg = true
		i = 1
	}
	seenDot := false
	frac := 1.0
	for ; i < len(s); i++ {
		c := s[i]
		if c == '.' {
			if seenDot {
				break
			}
			seenDot = true
			continue
		}
		if c < '0' || c > '9' {
			break
		}
		if seenDot {
			frac /= 10
			f += float64(c-'0') * frac
		} else {
			f = f*10 + float64(c-'0')
		}
	}
	if neg {
		return -f
	}
	return f
}

// sharedLimiterClient is the Redis connection every shared bucket uses. It is
// set once at startup by ConfigureSharedRateLimiting and read without a lock
// afterwards, because it never changes after configuration.
var sharedLimiterClient *redis.Client

// ConfigureSharedRateLimiting points the rate limiters at Redis.
//
// Call it before building the router. Without it every limiter stays
// process-local, which is correct for one replica and too permissive for more
// than one — so main logs which mode is in force.
func ConfigureSharedRateLimiting(client *redis.Client) {
	sharedLimiterClient = client
}

// SharedRateLimitingEnabled reports whether limits are enforced across replicas.
func SharedRateLimitingEnabled() bool { return sharedLimiterClient != nil }

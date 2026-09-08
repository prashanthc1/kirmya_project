package middleware

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// F16, the rate-limiting half. A limit enforced per process is multiplied by
// the replica count: five sign-in attempts a minute becomes five per replica
// per minute, and the tightest limits here are the ones protecting sign-in.
//
// Each test builds two routers, which is what two API instances behind a load
// balancer are. Against the process-local limiter every one of them passes
// twice as much traffic as the limit allows.

func sharedRedis(t *testing.T) *redis.Client {
	t.Helper()
	host := strings.TrimSpace(os.Getenv("REDIS_HOST"))
	if host == "" {
		t.Skip("REDIS_HOST is not set; skipping the shared rate limiter tests")
	}
	port := strings.TrimSpace(os.Getenv("REDIS_PORT"))
	if port == "" {
		port = "6379"
	}
	client := redis.NewClient(&redis.Options{Addr: host + ":" + port, Password: os.Getenv("REDIS_PASSWORD")})
	t.Cleanup(func() { _ = client.Close() })
	return client
}

// replica builds an independent router, standing in for one API instance.
func replica(rate, capacity float64) *gin.Engine {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.Use(RateLimiter(rate, capacity))
	engine.POST("/api/v1/auth/login", func(c *gin.Context) { c.Status(http.StatusOK) })
	return engine
}

// call sends one request from a fixed client address.
func call(engine *gin.Engine, clientIP string) int {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	req.RemoteAddr = clientIP + ":54321"
	res := httptest.NewRecorder()
	engine.ServeHTTP(res, req)
	return res.Code
}

// withSharedLimiter points the limiters at Redis for the duration of a test.
func withSharedLimiter(t *testing.T) {
	t.Helper()
	client := sharedRedis(t)
	previous := sharedLimiterClient
	ConfigureSharedRateLimiting(client)
	t.Cleanup(func() { sharedLimiterClient = previous })
}

// TestTwoReplicasShareOneBudget is the defect: the same client hitting two
// instances must not get the allowance twice.
func TestTwoReplicasShareOneBudget(t *testing.T) {
	withSharedLimiter(t)

	// Three tokens, refilling slowly enough that none returns during the test.
	const capacity = 3.0
	const rate = 0.05

	// A fresh, valid address per run. It has to parse as an IP: gin normalises
	// an unparseable RemoteAddr away, which would collapse every test in this
	// file onto one bucket key and make them decide each other's outcomes.
	clientIP := freshClientIP(t, rate, capacity)

	first := replica(rate, capacity)
	second := replica(rate, capacity)

	// Spend the whole budget on the first replica.
	for i := 0; i < int(capacity); i++ {
		if code := call(first, clientIP); code != http.StatusOK {
			t.Fatalf("request %d to replica one: got %d, want 200", i+1, code)
		}
	}

	// The same client on the second replica must find the budget already spent.
	// With per-process buckets it gets a fresh three.
	if code := call(second, clientIP); code != http.StatusTooManyRequests {
		t.Errorf("the second replica allowed a request the shared budget had already spent: got %d, want 429", code)
	}
}

// Separate clients must not share a bucket: one noisy address must not throttle
// everyone else.
func TestDifferentClientsGetSeparateBudgets(t *testing.T) {
	withSharedLimiter(t)

	const capacity = 2.0
	const rate = 0.05
	engine := replica(rate, capacity)

	noisy := freshClientIP(t, rate, capacity)
	quiet := freshClientIP(t, rate, capacity)

	for i := 0; i < int(capacity); i++ {
		if code := call(engine, noisy); code != http.StatusOK {
			t.Fatalf("noisy client request %d: got %d", i+1, code)
		}
	}
	if code := call(engine, noisy); code != http.StatusTooManyRequests {
		t.Fatalf("the noisy client was not throttled: got %d", code)
	}

	if code := call(engine, quiet); code != http.StatusOK {
		t.Errorf("a quiet client was throttled by another address: got %d, want 200", code)
	}
}

// Two limiters with different shapes must not drain each other. The credential
// bucket and the session bucket are deliberately different sizes, and sharing a
// key would collapse them into one.
func TestLimitersWithDifferentShapesDoNotShareABucket(t *testing.T) {
	withSharedLimiter(t)

	clientIP := freshClientIP(t, 0.05, 2)
	clearBucket(t, clientIP, 2.0, 20)

	tight := replica(0.05, 2) // credential-style
	loose := replica(2.0, 20) // session-style

	for i := 0; i < 2; i++ {
		if code := call(tight, clientIP); code != http.StatusOK {
			t.Fatalf("tight limiter request %d: got %d", i+1, code)
		}
	}
	if code := call(tight, clientIP); code != http.StatusTooManyRequests {
		t.Fatalf("the tight limiter did not throttle: got %d", code)
	}

	// The loose limiter's budget is its own.
	if code := call(loose, clientIP); code != http.StatusOK {
		t.Errorf("draining the tight bucket also drained the loose one: got %d, want 200", code)
	}
}

// An unreachable broker must fall back to the process-local limiter rather than
// failing closed. Locking every user out of sign-in because Redis hiccuped is a
// worse outcome than a briefly looser limit.
func TestUnreachableBrokerFallsBackRatherThanLockingEveryoneOut(t *testing.T) {
	previous := sharedLimiterClient
	// A port nothing is listening on.
	ConfigureSharedRateLimiting(redis.NewClient(&redis.Options{Addr: "127.0.0.1:6389"}))
	t.Cleanup(func() { sharedLimiterClient = previous })

	engine := replica(0.05, 2)
	if code := call(engine, "203.0.113.41"); code != http.StatusOK {
		t.Errorf("an unreachable rate-limit broker rejected a request: got %d, want 200", code)
	}
}

// With no broker configured the limiter must still work, per process.
func TestLocalLimiterStillWorksWithoutABroker(t *testing.T) {
	previous := sharedLimiterClient
	ConfigureSharedRateLimiting(nil)
	t.Cleanup(func() { sharedLimiterClient = previous })

	engine := replica(0.05, 2)
	clientIP := "203.0.113.51"

	for i := 0; i < 2; i++ {
		if code := call(engine, clientIP); code != http.StatusOK {
			t.Fatalf("request %d: got %d", i+1, code)
		}
	}
	if code := call(engine, clientIP); code != http.StatusTooManyRequests {
		t.Errorf("the local limiter did not throttle: got %d, want 429", code)
	}
}

// freshClientIP returns a valid client address nothing else in this run has
// used, with its bucket cleared. Redis outlives the test process, so a bucket
// left over from an earlier run would otherwise decide this one.
func freshClientIP(t *testing.T, rate, capacity float64) string {
	t.Helper()
	nextTestClientIP++
	ip := fmt.Sprintf("198.51.100.%d", nextTestClientIP%250+1)
	clearBucket(t, ip, rate, capacity)
	return ip
}

var nextTestClientIP int

// clearBucket removes one limiter's bucket for one address.
func clearBucket(t *testing.T, clientIP string, rate, capacity float64) {
	t.Helper()
	key := fmt.Sprintf("ratelimit:{%g:%g}:%s", rate, capacity, clientIP)
	if err := sharedRedis(t).Del(t.Context(), key).Err(); err != nil {
		t.Fatalf("clear bucket %s: %v", key, err)
	}
}

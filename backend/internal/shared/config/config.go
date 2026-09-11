package config

import (
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"sync"
)

type Config struct {
	AppName     string
	AppEnv      string
	AppVersion  string
	ServerHost  string
	ServerPort  string
	DatabaseURL string
	DBHost      string
	DBPort      string
	DBName      string
	JWTSecret   string

	// Optional Service Flags
	RedisEnabled  bool
	NATSEnabled   bool
	OpenSearchEn  bool
	TracingEnable bool

	// CORSAllowedOrigins lists the browser origins allowed to call the API with
	// credentials. Empty means no cross-origin browser client is accepted.
	CORSAllowedOrigins []string

	// TrustedProxies lists the proxy addresses whose X-Forwarded-For header may
	// be believed when deriving the client IP. Empty trusts none, so a caller
	// cannot forge a fresh identity past the rate limiter.
	TrustedProxies []string

	// RateLimitRequestsPerMinute is the sustained per-client-IP budget for the
	// whole API; RateLimitBurst is how many requests may land back to back
	// before that rate takes over. Zero requests disables the limiter.
	RateLimitRequestsPerMinute float64
	RateLimitBurst             float64

	// AuthRateLimitRequestsPerMinute and AuthRateLimitBurst size the tighter
	// bucket that sits on the /auth group alone. It stays deliberately far
	// below the API-wide budget: credential endpoints are what gets sprayed.
	// It is configurable for the same reason the API-wide one is — a browser
	// test suite driving every project from one loopback address shares a
	// single bucket and cannot fit inside the production allowance — and it
	// defaults to that production allowance, so leaving both unset changes
	// nothing.
	AuthRateLimitRequestsPerMinute float64
	AuthRateLimitBurst             float64

	// AuthSessionRateLimitRequestsPerMinute and AuthSessionRateLimitBurst size
	// the separate bucket in front of /auth/refresh, /auth/me, /auth/session and
	// /auth/logout. Restoring a session costs two requests on every page load,
	// so these endpoints cannot share the credential allowance without signing
	// users out on reload; see internal/auth/delivery/http/routes.go.
	AuthSessionRateLimitRequestsPerMinute float64
	AuthSessionRateLimitBurst             float64

	// NewsletterRateLimitRequestsPerMinute and NewsletterRateLimitBurst size the
	// bucket on the public newsletter endpoints. They take an address from
	// anyone, so they are the obvious thing to point a list-stuffing script at;
	// the default is generous for a person mistyping their address and far below
	// what a script needs. Configurable so a test suite can exercise the flow.
	NewsletterRateLimitRequestsPerMinute float64
	NewsletterRateLimitBurst             float64

	// MetricsUsername and MetricsPassword optionally put the Prometheus
	// endpoint behind basic auth. Unset, it answers internal callers only.
	MetricsUsername string
	MetricsPassword string

	// AllowEphemeralRepos lets production boot with repositories that keep
	// their data in process memory. Off by default so the data loss has to be
	// an explicit decision; see internal/shared/persistence.
	AllowEphemeralRepos bool

	// AllowNoDB permits the process to start when the database is unreachable,
	// which drops every repository into its in-memory branch: writes report
	// success and are lost on restart. It exists for tests and is refused in
	// production below.
	AllowNoDB bool

	// AppBaseURL is the public address of the web client. Links that leave the
	// system — an invitation acceptance URL, for instance — are built from this
	// rather than from the request Host header, which a caller controls.
	AppBaseURL string

	// AnalyticsViewSalt seasons the one-way hash that distinguishes unique
	// profile visitors from repeat ones. It is never stored alongside the hash,
	// so rotating it forgets who visited without exposing anyone.
	AnalyticsViewSalt string

	// Swagger / OpenAPI documentation. SwaggerUsername and SwaggerPassword are
	// optional; when both are set the docs endpoint sits behind basic auth.
	SwaggerEnabled  bool
	SwaggerHost     string
	SwaggerBasePath string
	SwaggerUsername string
	SwaggerPassword string
}

var (
	jwtSecretOnce  sync.Once
	jwtSecretBytes []byte
)

// InitJWTSecret reads JWT_SECRET via os.Getenv. If empty, logs a fatal error and exits.
func InitJWTSecret() []byte {
	jwtSecretOnce.Do(func() {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			if isTestMode() {
				secret = "kirmya-test-jwt-secret-key-32-bytes-long!"
				os.Setenv("JWT_SECRET", secret)
			} else {
				slog.Error("FATAL: JWT_SECRET environment variable is required and must not be empty.")
				os.Exit(1)
			}
		}
		jwtSecretBytes = []byte(secret)
	})
	return jwtSecretBytes
}

// GetJWTSecretBytes returns the single shared JWT secret byte slice.
func GetJWTSecretBytes() []byte {
	if len(jwtSecretBytes) == 0 {
		return InitJWTSecret()
	}
	return jwtSecretBytes
}

func isTestMode() bool {
	return flag.Lookup("test.v") != nil || strings.HasSuffix(os.Args[0], ".test") || strings.HasSuffix(os.Args[0], ".test.exe")
}

func LoadConfig() (*Config, error) {
	jwtSecret := string(GetJWTSecretBytes())

	cfg := &Config{
		AppName:     getEnv("APP_NAME", "Kirmya AI Career Companion"),
		AppEnv:      getEnv("APP_ENV", "development"),
		AppVersion:  getEnv("APP_VERSION", "2.1.0"),
		ServerHost:  getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort:  resolveServerPort(),
		DatabaseURL: getEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/kirmya?sslmode=disable"),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "5432"),
		DBName:      getEnv("DB_NAME", "kirmya"),
		JWTSecret:   jwtSecret,

		RedisEnabled:  getEnvAsBool("REDIS_ENABLED", true) && (getEnv("REDIS_HOST", "") != "" || getEnv("REDIS_URL", "") != ""),
		NATSEnabled:   getEnvAsBool("NATS_ENABLED", false) && getEnv("NATS_URL", "") != "",
		OpenSearchEn:  getEnvAsBool("OPENSEARCH_ENABLED", false) && getEnv("OPENSEARCH_URL", "") != "",
		TracingEnable: getEnvAsBool("OTEL_ENABLED", true) || getEnvAsBool("ENABLE_TRACING", true),

		CORSAllowedOrigins: resolveCORSOrigins(getEnv("APP_ENV", "development")),
		TrustedProxies:     resolveTrustedProxies(),

		// Sized for a browser SPA rather than a single caller: one page load
		// fans out a dozen or so parallel requests, so the burst has to absorb
		// that without the user seeing a 429.
		RateLimitRequestsPerMinute: getEnvAsFloat("RATE_LIMIT_REQUESTS", 600),
		RateLimitBurst:             getEnvAsFloat("RATE_LIMIT_BURST", 120),

		AuthRateLimitRequestsPerMinute: getEnvAsFloat("AUTH_RATE_LIMIT_REQUESTS", 5),
		AuthRateLimitBurst:             getEnvAsFloat("AUTH_RATE_LIMIT_BURST", 5),

		AuthSessionRateLimitRequestsPerMinute: getEnvAsFloat("AUTH_SESSION_RATE_LIMIT_REQUESTS", 120),
		AuthSessionRateLimitBurst:             getEnvAsFloat("AUTH_SESSION_RATE_LIMIT_BURST", 60),

		NewsletterRateLimitRequestsPerMinute: getEnvAsFloat("NEWSLETTER_RATE_LIMIT_REQUESTS", 10),
		NewsletterRateLimitBurst:             getEnvAsFloat("NEWSLETTER_RATE_LIMIT_BURST", 5),

		MetricsUsername: getEnv("METRICS_USERNAME", ""),
		MetricsPassword: getEnv("METRICS_PASSWORD", ""),

		AllowEphemeralRepos: getEnvAsBool("ALLOW_EPHEMERAL_REPOS", false),
		AllowNoDB:           getEnvAsBool("ALLOW_NO_DB", false),

		AppBaseURL:        resolveAppBaseURL(),
		AnalyticsViewSalt: getEnv("ANALYTICS_VIEW_SALT", jwtSecret),

		// Swagger stays off unless explicitly switched on, so a misconfigured
		// deployment never publishes the API surface by accident.
		SwaggerEnabled:  getEnvAsBool("SWAGGER_ENABLED", false),
		SwaggerHost:     getEnv("SWAGGER_HOST", "localhost:8080"),
		SwaggerBasePath: getEnv("SWAGGER_BASE_PATH", "/"),
		SwaggerUsername: getEnv("SWAGGER_USERNAME", ""),
		SwaggerPassword: getEnv("SWAGGER_PASSWORD", ""),
	}

	// Fast Fail Validation for Production
	if cfg.AppEnv == "production" {
		if cfg.JWTSecret == "" || cfg.JWTSecret == "your-super-secret-jwt-key-min-32-chars-long" {
			return nil, fmt.Errorf("FATAL: JWT_SECRET must be set to a secure key in production environment")
		}
		if cfg.DatabaseURL == "" && cfg.DBHost == "" {
			return nil, fmt.Errorf("FATAL: DATABASE_URL or DB_HOST must be configured for database access")
		}
		// ALLOW_NO_DB lets the process continue past a failed database
		// connection, and every repository then serves its in-memory branch:
		// applications, saved jobs and documents are accepted, reported as
		// created and lost on the next restart. That is never a production
		// posture, so it is refused here rather than merely warned about.
		if cfg.AllowNoDB {
			return nil, fmt.Errorf("FATAL: ALLOW_NO_DB must not be enabled in production; it silently discards every write")
		}
	}

	// A platform edge proxy with nothing trusted makes every caller one client.
	//
	// Gin derives c.ClientIP() from X-Forwarded-For only for hops named in
	// SetTrustedProxies; with none set it falls back to the socket peer. Behind
	// Railway (or Heroku, or Fly) that peer is the edge proxy, which is the same
	// address for the entire internet — so the per-IP limiter in
	// shared/middleware/rate_limit.go collapses into a single global bucket.
	//
	// The credential bucket is what makes that serious: AUTH_RATE_LIMIT_REQUESTS
	// defaults to 5 a minute, so the sixth sign-in anywhere in the world inside
	// a minute is refused, and the product looks broken precisely when it is
	// busiest. This is not fatal — the API serves correctly, it throttles wrongly
	// — so it is reported rather than refused, and it is an error rather than a
	// warning because nothing downstream will ever surface it.
	if platformEdgeProxy() != "" && len(cfg.TrustedProxies) == 0 {
		slog.Error("TRUSTED_PROXIES is unset behind a platform edge proxy: every client shares one rate-limit bucket, so the credential limiter throttles all users together. Set TRUSTED_PROXIES=\"*\" to key the limiter on X-Forwarded-For.",
			slog.String("platform", platformEdgeProxy()),
			slog.Float64("auth_rate_limit_requests_per_minute", cfg.AuthRateLimitRequestsPerMinute),
		)
	}

	// Audit log optional service integrations without leaking credentials
	slog.Info("Auditing platform service integrations",
		slog.String("platform_edge_proxy", platformEdgeProxy()),
		slog.Bool("redis_enabled", cfg.RedisEnabled),
		slog.Bool("nats_enabled", cfg.NATSEnabled),
		slog.Bool("opensearch_enabled", cfg.OpenSearchEn),
		slog.Bool("opentelemetry_enabled", cfg.TracingEnable),
		slog.String("cors_allowed_origins", strings.Join(cfg.CORSAllowedOrigins, ",")),
		slog.String("trusted_proxies", strings.Join(cfg.TrustedProxies, ",")),
		slog.Float64("rate_limit_requests_per_minute", cfg.RateLimitRequestsPerMinute),
		slog.Float64("rate_limit_burst", cfg.RateLimitBurst),
		slog.Bool("metrics_basic_auth", cfg.MetricsUsername != "" && cfg.MetricsPassword != ""),
		slog.Bool("allow_ephemeral_repos", cfg.AllowEphemeralRepos),
		slog.Bool("allow_no_db", cfg.AllowNoDB),
		slog.Bool("swagger_enabled", cfg.SwaggerEnabled),
		slog.Bool("swagger_basic_auth", cfg.SwaggerUsername != "" && cfg.SwaggerPassword != ""),
	)

	return cfg, nil
}

// resolveCORSOrigins reads the browser origins allowed to call the API.
// CORS_ALLOWED_ORIGINS wins, then the legacy ALLOWED_ORIGINS, then FRONTEND_URL
// for deployments that only configure a single web client. Outside production
// the local Next.js dev server is assumed so a fresh checkout works unset;
// production gets nothing implicit, because guessing an origin there would hand
// credentialed access to a host nobody vetted.
func resolveCORSOrigins(appEnv string) []string {
	for _, key := range []string{"CORS_ALLOWED_ORIGINS", "ALLOWED_ORIGINS", "FRONTEND_URL"} {
		if origins := splitAndTrim(getEnv(key, "")); len(origins) > 0 {
			return origins
		}
	}

	if strings.EqualFold(appEnv, "production") {
		slog.Warn("No CORS origins configured; browser clients on another origin will be blocked. Set CORS_ALLOWED_ORIGINS.")
		return nil
	}

	return []string{"http://localhost:3000", "http://127.0.0.1:3000"}
}

// AppBaseURL exposes the resolved public web client address to components that
// build user-facing links without holding the whole Config — an email template,
// for instance, which is constructed far from where LoadConfig runs.
func AppBaseURL() string {
	return resolveAppBaseURL()
}

// resolveAppBaseURL reads the public address of the web client. APP_BASE_URL
// wins, then FRONTEND_URL, then the first configured CORS origin, since an
// origin the deployment already trusts for browser traffic is the same host a
// user would open a link on. The trailing slash is dropped so callers can
// append a path without producing "//".
func resolveAppBaseURL() string {
	for _, key := range []string{"APP_BASE_URL", "FRONTEND_URL"} {
		if value := strings.TrimSpace(getEnv(key, "")); value != "" {
			return strings.TrimRight(value, "/")
		}
	}

	if origins := splitAndTrim(getEnv("CORS_ALLOWED_ORIGINS", "")); len(origins) > 0 {
		return strings.TrimRight(origins[0], "/")
	}

	return "http://localhost:3000"
}

// resolveTrustedProxies reads TRUSTED_PROXIES as a comma separated list of IPs
// or CIDR blocks. "*" means trust every hop, which is what a platform like
// Railway needs since its edge address is not fixed — but it also lets any
// caller forge X-Forwarded-For, so it is logged as the deliberate choice it is.
// Unset trusts nothing and the client IP is the socket peer.
func resolveTrustedProxies() []string {
	proxies := splitAndTrim(getEnv("TRUSTED_PROXIES", ""))
	for _, proxy := range proxies {
		if proxy == "*" {
			slog.Warn("TRUSTED_PROXIES is '*': X-Forwarded-For is trusted from any source, so rate limiting can be evaded unless a proxy overwrites the header.")
			return []string{"0.0.0.0/0", "::/0"}
		}
	}
	return proxies
}

// platformEdgeProxy names the hosting platform when the process is running
// behind one whose edge address is not fixed, or "" when it is not. Those are
// exactly the deployments where TRUSTED_PROXIES must be set for the client IP
// to mean anything, because the socket peer is the platform's proxy rather than
// the user. The variables are the ones each platform injects itself, so this
// needs no configuration of its own.
func platformEdgeProxy() string {
	for _, probe := range []struct{ env, name string }{
		{"RAILWAY_ENVIRONMENT", "railway"},
		{"DYNO", "heroku"},
		{"FLY_APP_NAME", "fly"},
	} {
		if strings.TrimSpace(os.Getenv(probe.env)) != "" {
			return probe.name
		}
	}
	return ""
}

// resolveServerPort picks the port the HTTP server binds to. PORT comes first
// because that is what a platform host (Railway, Heroku, Cloud Run) injects,
// and it is assigned per deployment: ignoring it means the edge routes traffic
// to a port nothing is listening on and every request 502s. SERVER_PORT stays
// as the explicit override for operators who set it themselves.
func resolveServerPort() string {
	if port := getEnv("PORT", ""); port != "" {
		return port
	}
	return getEnv("SERVER_PORT", "8080")
}

func splitAndTrim(raw string) []string {
	var out []string
	for _, part := range strings.Split(raw, ",") {
		if part = strings.TrimSpace(strings.Trim(strings.TrimSpace(part), `"'`)); part != "" {
			out = append(out, part)
		}
	}
	return out
}

func getEnv(key, defaultVal string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return defaultVal
}

func getEnvAsFloat(key string, defaultVal float64) float64 {
	valStr := getEnv(key, "")
	if valStr == "" {
		return defaultVal
	}
	f, err := strconv.ParseFloat(strings.Trim(valStr, `"'`), 64)
	if err != nil || f < 0 {
		slog.Warn("Ignoring invalid numeric environment variable", slog.String("key", key), slog.String("value", valStr))
		return defaultVal
	}
	return f
}

func getEnvAsBool(key string, defaultVal bool) bool {
	valStr := getEnv(key, "")
	if valStr == "" {
		return defaultVal
	}
	b, err := strconv.ParseBool(valStr)
	if err != nil {
		return defaultVal
	}
	return b
}

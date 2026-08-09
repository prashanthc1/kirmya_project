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

	// MetricsUsername and MetricsPassword optionally put the Prometheus
	// endpoint behind basic auth. Unset, it answers internal callers only.
	MetricsUsername string
	MetricsPassword string

	// AllowEphemeralRepos lets production boot with repositories that keep
	// their data in process memory. Off by default so the data loss has to be
	// an explicit decision; see internal/shared/persistence.
	AllowEphemeralRepos bool

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
		ServerPort:  getEnv("SERVER_PORT", "8080"),
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

		MetricsUsername: getEnv("METRICS_USERNAME", ""),
		MetricsPassword: getEnv("METRICS_PASSWORD", ""),

		AllowEphemeralRepos: getEnvAsBool("ALLOW_EPHEMERAL_REPOS", false),

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
	}

	// Audit log optional service integrations without leaking credentials
	slog.Info("Auditing platform service integrations",
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

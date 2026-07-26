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
	)

	return cfg, nil
}

func getEnv(key, defaultVal string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return defaultVal
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

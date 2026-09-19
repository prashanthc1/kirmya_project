package config

import (
	"strings"
	"testing"
)

func TestResolveTrustedProxies(t *testing.T) {
	tests := []struct {
		name string
		env  string
		want []string
	}{
		{name: "unset trusts nothing", env: "", want: nil},
		{name: "explicit list", env: "127.0.0.1, 10.0.0.0/8", want: []string{"127.0.0.1", "10.0.0.0/8"}},
		// gin only parses IPs and CIDRs, so "*" has to be expanded rather than
		// passed through, or SetTrustedProxies errors and we trust nothing.
		{name: "wildcard expands to every address", env: `"*"`, want: []string{"0.0.0.0/0", "::/0"}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("TRUSTED_PROXIES", tc.env)

			got := resolveTrustedProxies()
			if len(got) != len(tc.want) {
				t.Fatalf("expected %v, got %v", tc.want, got)
			}
			for i := range got {
				if got[i] != tc.want[i] {
					t.Fatalf("expected %v, got %v", tc.want, got)
				}
			}
		})
	}
}

func TestGetEnvAsFloat(t *testing.T) {
	tests := []struct {
		name string
		env  string
		want float64
	}{
		{name: "unset falls back", env: "", want: 600},
		{name: "plain number", env: "120", want: 120},
		// .env files in this repo quote their values, and godotenv leaves the
		// quotes on for anything it cannot unquote.
		{name: "quoted number", env: `"120"`, want: 120},
		{name: "zero disables", env: "0", want: 0},
		{name: "garbage falls back", env: "many", want: 600},
		{name: "negative falls back", env: "-5", want: 600},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("RATE_LIMIT_REQUESTS", tc.env)

			if got := getEnvAsFloat("RATE_LIMIT_REQUESTS", 600); got != tc.want {
				t.Errorf("expected %v, got %v", tc.want, got)
			}
		})
	}
}

// TestLoadConfigRateLimitDefaults pins the defaults a browser SPA depends on:
// a burst too small silently 429s the parallel calls one page load fires.
func TestLoadConfigRateLimitDefaults(t *testing.T) {
	t.Setenv("RATE_LIMIT_REQUESTS", "")
	t.Setenv("RATE_LIMIT_BURST", "")

	cfg, err := LoadConfig()
	if err != nil {
		t.Fatalf("LoadConfig: %v", err)
	}
	if cfg.RateLimitRequestsPerMinute != 600 {
		t.Errorf("expected 600 requests/minute by default, got %v", cfg.RateLimitRequestsPerMinute)
	}
	if cfg.RateLimitBurst != 120 {
		t.Errorf("expected a burst of 120 by default, got %v", cfg.RateLimitBurst)
	}
}

func TestLoadConfig_ProductionRequiresStorageEndpoint(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("JWT_SECRET", "super-secret-production-jwt-key-32b!")
	t.Setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/kirmya")
	t.Setenv("ALLOW_NO_DB", "false")
	t.Setenv("STORAGE_ENDPOINT", "")

	cfg, err := LoadConfig()
	if err == nil {
		t.Fatalf("expected LoadConfig to fail in production when STORAGE_ENDPOINT is empty, got cfg: %+v", cfg)
	}
	if !strings.Contains(err.Error(), "STORAGE_ENDPOINT") {
		t.Errorf("expected error to mention STORAGE_ENDPOINT, got: %v", err)
	}

	t.Setenv("STORAGE_ENDPOINT", "https://s3.amazonaws.com")
	cfg, err = LoadConfig()
	if err != nil {
		t.Fatalf("expected LoadConfig to succeed with STORAGE_ENDPOINT set, got: %v", err)
	}
	if cfg.StorageEndpoint != "https://s3.amazonaws.com" {
		t.Errorf("expected StorageEndpoint %q, got %q", "https://s3.amazonaws.com", cfg.StorageEndpoint)
	}
}

func TestLoadConfig_ProductionRejectsAllowNoDB(t *testing.T) {
	t.Setenv("APP_ENV", "production")
	t.Setenv("JWT_SECRET", "super-secret-production-jwt-key-32b!")
	t.Setenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/kirmya")
	t.Setenv("STORAGE_ENDPOINT", "https://s3.amazonaws.com")
	t.Setenv("ALLOW_NO_DB", "true")

	cfg, err := LoadConfig()
	if err == nil {
		t.Fatalf("expected LoadConfig to fail in production when ALLOW_NO_DB is true, got cfg: %+v", cfg)
	}
	if !strings.Contains(err.Error(), "ALLOW_NO_DB") {
		t.Errorf("expected error to mention ALLOW_NO_DB, got: %v", err)
	}
}

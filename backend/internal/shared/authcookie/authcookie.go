// Package authcookie owns the refresh-token cookie: one configuration, resolved
// once from the environment, used by login, refresh and logout alike.
//
// It exists because those three handlers each wrote their own SetCookie call.
// The attributes drifted apart — login and refresh set SameSite=Strict while
// logout and the refresh failure path set none at all — and a cookie cleared
// with attributes that do not match the ones it was created with is not
// reliably cleared. Routing every write through one place makes creation and
// deletion agree by construction.
//
// The default posture is HttpOnly, host-only, SameSite=Lax, and Secure
// everywhere except a plain-HTTP development or test origin. Lax rather than
// Strict because Strict is both unnecessary for kirmya.com talking to
// api.kirmya.com (same registrable domain, so already same-site) and fatal the
// moment the web client is served from anywhere else — a preview deployment, a
// staging host — where the browser drops the cookie with no error anyone sees.
package authcookie

import (
	"log/slog"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Defaults for every setting the environment does not pin.
const (
	DefaultName          = "refresh_token"
	DefaultPath          = "/api/v1/auth"
	DefaultTTL           = 7 * 24 * time.Hour
	DefaultRememberTTL   = 30 * 24 * time.Hour
	DefaultAccessTTL     = 15 * time.Minute
	defaultSameSite      = http.SameSiteLaxMode
	maxReasonableAccess  = 2 * time.Hour
	minReasonableRefresh = time.Hour
)

// Config is the resolved cookie policy. Build it once at startup with FromEnv
// and hand the same value to every handler that touches the cookie.
type Config struct {
	Name   string
	Path   string
	Domain string // empty means host-only, which is what we want by default
	Secure bool

	SameSite http.SameSite

	// TTL and RememberMeTTL are the refresh-token lifetimes. They are the same
	// numbers the session row is given, so the cookie cannot outlive the server
	// session or the reverse.
	TTL           time.Duration
	RememberMeTTL time.Duration

	// AccessTTL is the access-token lifetime. It lives here so the login
	// response can report the real expiry rather than a hardcoded one.
	AccessTTL time.Duration
}

// FromEnv resolves the cookie policy.
//
// Secure defaults to on and only turns itself off for a development or test
// environment, where the app is served over plain HTTP and a Secure cookie is
// silently discarded by WebKit — Chromium and Firefox make a localhost
// exception, which is exactly why this failure reaches production having looked
// fine locally. AUTH_COOKIE_SECURE can override the default in either
// direction, except that production never accepts an insecure cookie.
func FromEnv() Config {
	env := strings.ToLower(strings.TrimSpace(os.Getenv("APP_ENV")))
	production := env == "production" || env == "prod"
	localEnv := env == "development" || env == "dev" || env == "test" || env == "local" || env == ""

	cfg := Config{
		Name:          envOr("AUTH_COOKIE_NAME", DefaultName),
		Path:          envOr("AUTH_COOKIE_PATH", DefaultPath),
		Domain:        strings.TrimSpace(os.Getenv("AUTH_COOKIE_DOMAIN")),
		Secure:        !localEnv,
		SameSite:      parseSameSite(os.Getenv("AUTH_COOKIE_SAME_SITE")),
		TTL:           parseDuration("REFRESH_TOKEN_TTL", DefaultTTL),
		RememberMeTTL: parseDuration("REMEMBER_ME_REFRESH_TOKEN_TTL", DefaultRememberTTL),
		AccessTTL:     parseDuration("ACCESS_TOKEN_TTL", DefaultAccessTTL),
	}

	if raw := strings.TrimSpace(os.Getenv("AUTH_COOKIE_SECURE")); raw != "" {
		if parsed, err := strconv.ParseBool(raw); err == nil {
			cfg.Secure = parsed
		} else {
			slog.Warn("AUTH_COOKIE_SECURE is not a boolean; keeping the environment default",
				slog.String("value", raw), slog.Bool("secure", cfg.Secure))
		}
	}

	// A cookie the browser will not store is worse than a misconfiguration that
	// fails loudly, so both impossible combinations are corrected here and the
	// correction is logged.
	if production && !cfg.Secure {
		slog.Error("AUTH_COOKIE_SECURE=false is refused in production; forcing Secure=true")
		cfg.Secure = true
	}
	if cfg.SameSite == http.SameSiteNoneMode && !cfg.Secure {
		// SameSite=None without Secure is rejected outright by every current
		// browser. Only a genuinely cross-site deployment should ask for None.
		slog.Error("AUTH_COOKIE_SAME_SITE=none requires a Secure cookie; forcing Secure=true")
		cfg.Secure = true
	}

	if cfg.AccessTTL > maxReasonableAccess {
		slog.Warn("ACCESS_TOKEN_TTL is long enough that revoking a session leaves a usable token behind",
			slog.Duration("access_token_ttl", cfg.AccessTTL))
	}
	if cfg.TTL < minReasonableRefresh {
		slog.Warn("REFRESH_TOKEN_TTL is very short; users will be signed out sooner than the session policy suggests",
			slog.Duration("refresh_token_ttl", cfg.TTL))
	}
	// A Remember Me policy shorter than the normal one is a configuration
	// mistake that would quietly shorten the sessions it is meant to extend.
	if cfg.RememberMeTTL < cfg.TTL {
		slog.Warn("REMEMBER_ME_REFRESH_TOKEN_TTL is shorter than REFRESH_TOKEN_TTL; using the normal lifetime for both",
			slog.Duration("remember_me_ttl", cfg.RememberMeTTL), slog.Duration("refresh_token_ttl", cfg.TTL))
		cfg.RememberMeTTL = cfg.TTL
	}

	return cfg
}

// Lifetime is the refresh-token lifetime for a session, which is the single
// place the Remember Me policy turns into a duration. The session row, the
// rotated session row and the cookie all take their expiry from this, so they
// cannot disagree.
func (c Config) Lifetime(rememberMe bool) time.Duration {
	if rememberMe {
		return c.RememberMeTTL
	}
	return c.TTL
}

// Set writes the refresh cookie. expiresAt is the session's own expiry, so a
// rotated cookie inherits the remaining life of the session rather than being
// handed a fresh full lifetime — otherwise a user who reloads often would hold
// a session that never expires.
func (c Config) Set(ctx *gin.Context, value string, expiresAt time.Time) {
	maxAge := int(time.Until(expiresAt).Seconds())
	if maxAge < 1 {
		// Already expired: clearing is the honest outcome, and it avoids
		// writing a cookie the browser would treat as a session cookie.
		c.Clear(ctx)
		return
	}

	ctx.SetSameSite(c.SameSite)
	ctx.SetCookie(c.Name, value, maxAge, c.Path, c.Domain, c.Secure, true)
}

// Clear removes the refresh cookie using the same name, path, domain and
// attributes it was created with. Anything less and the browser keeps a cookie
// that logout believed it had deleted.
func (c Config) Clear(ctx *gin.Context) {
	ctx.SetSameSite(c.SameSite)
	ctx.SetCookie(c.Name, "", -1, c.Path, c.Domain, c.Secure, true)
}

// Read returns the refresh token the browser sent, if any.
func (c Config) Read(ctx *gin.Context) string {
	value, err := ctx.Cookie(c.Name)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(value)
}

// LogSummary records the resolved policy at startup. The cookie's value is
// never touched here — only its shape — so this is safe to log.
func (c Config) LogSummary() {
	slog.Info("refresh cookie policy resolved",
		slog.String("name", c.Name),
		slog.String("path", c.Path),
		slog.String("domain", hostOnly(c.Domain)),
		slog.Bool("secure", c.Secure),
		slog.String("same_site", sameSiteName(c.SameSite)),
		slog.Duration("refresh_ttl", c.TTL),
		slog.Duration("remember_me_ttl", c.RememberMeTTL),
		slog.Duration("access_ttl", c.AccessTTL),
	)
}

func hostOnly(domain string) string {
	if domain == "" {
		return "(host-only)"
	}
	return domain
}

func sameSiteName(s http.SameSite) string {
	switch s {
	case http.SameSiteStrictMode:
		return "strict"
	case http.SameSiteNoneMode:
		return "none"
	case http.SameSiteLaxMode:
		return "lax"
	default:
		return "default"
	}
}

// parseSameSite accepts the attribute names as browsers spell them. An
// unrecognised value takes the Lax default rather than the Go zero value, which
// omits the attribute entirely and leaves the behaviour to the browser.
func parseSameSite(raw string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	case "lax":
		return http.SameSiteLaxMode
	case "":
		return defaultSameSite
	default:
		slog.Warn("AUTH_COOKIE_SAME_SITE is not one of lax, strict or none; using lax",
			slog.String("value", raw))
		return defaultSameSite
	}
}

func parseDuration(key string, fallback time.Duration) time.Duration {
	raw := strings.TrimSpace(os.Getenv(key))
	if raw == "" {
		return fallback
	}
	// A bare number is read as days for the refresh lifetimes people write as
	// "7", but requiring a unit is clearer and time.ParseDuration already
	// rejects it, so an unusable value keeps the default and says so.
	parsed, err := time.ParseDuration(raw)
	if err != nil || parsed <= 0 {
		slog.Warn("environment duration is not a valid Go duration such as 15m or 168h; using the default",
			slog.String("key", key), slog.String("value", raw), slog.Duration("default", fallback))
		return fallback
	}
	return parsed
}

func envOr(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

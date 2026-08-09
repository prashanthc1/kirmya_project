package middleware

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// corsAllowedHeaders lists every request header the browser clients send. The
// browser rejects a preflight whose Access-Control-Allow-Headers omits one of
// the headers it asked for, so the tenant, mobile and telemetry headers used by
// the shared middleware have to appear here too.
var corsAllowedHeaders = []string{
	"Authorization",
	"Content-Type",
	"Accept",
	"Origin",
	"X-Requested-With",
	HeaderTenantID,
	HeaderDeviceID,
	HeaderPlatform,
	HeaderAppVersion,
	"X-Trace-ID",
}

// corsExposedHeaders are the response headers the browser hands to JavaScript.
// Everything else stays hidden from fetch/XHR on a cross-origin response.
var corsExposedHeaders = []string{
	"X-Trace-ID",
	"X-Response-Time-Ms",
	"Content-Length",
}

var corsAllowedMethods = []string{
	http.MethodGet,
	http.MethodPost,
	http.MethodPut,
	http.MethodPatch,
	http.MethodDelete,
	http.MethodOptions,
}

const corsMaxAgeSeconds = 600

// CORS answers cross-origin browser requests for the configured origins. The
// frontend sends credentials (the refresh-token cookie), so the response must
// name one exact origin — a wildcard is rejected by the browser alongside
// Access-Control-Allow-Credentials — and requests from unknown origins get no
// CORS headers at all rather than a permissive fallback.
func CORS(allowedOrigins []string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		if origin = strings.TrimSpace(origin); origin != "" {
			allowed[strings.ToLower(strings.TrimSuffix(origin, "/"))] = struct{}{}
		}
	}

	allowMethods := strings.Join(corsAllowedMethods, ", ")
	allowHeaders := strings.Join(corsAllowedHeaders, ", ")
	exposeHeaders := strings.Join(corsExposedHeaders, ", ")

	return func(c *gin.Context) {
		// Responses differ per origin, so caches must key on it even when the
		// request carries no Origin at all.
		c.Writer.Header().Add("Vary", "Origin")

		origin := c.GetHeader("Origin")
		if origin == "" {
			// Same-origin, server-to-server or curl: nothing to negotiate.
			c.Next()
			return
		}

		if _, ok := allowed[strings.ToLower(strings.TrimSuffix(origin, "/"))]; !ok {
			// Unknown origin: the browser blocks the response because no
			// Access-Control-Allow-Origin comes back. Preflights are still
			// short-circuited so they never reach the handlers.
			if c.Request.Method == http.MethodOptions {
				c.AbortWithStatus(http.StatusNoContent)
				return
			}
			c.Next()
			return
		}

		header := c.Writer.Header()
		header.Set("Access-Control-Allow-Origin", origin)
		header.Set("Access-Control-Allow-Credentials", "true")
		header.Set("Access-Control-Expose-Headers", exposeHeaders)

		if c.Request.Method == http.MethodOptions {
			header.Add("Vary", "Access-Control-Request-Method")
			header.Add("Vary", "Access-Control-Request-Headers")
			header.Set("Access-Control-Allow-Methods", allowMethods)
			header.Set("Access-Control-Allow-Headers", allowHeaders)
			header.Set("Access-Control-Max-Age", strconv.Itoa(corsMaxAgeSeconds))
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

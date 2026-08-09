package middleware

import "github.com/gin-gonic/gin"

// SecurityHeaders sets hardening HTTP response headers on every route.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent clickjacking
		c.Header("X-Frame-Options", "DENY")

		// Prevent MIME-sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Control referrer tracking info leaks
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Block old XSS injection
		c.Header("X-XSS-Protection", "1; mode=block")

		// Enable HTTP Strict Transport Security (HSTS)
		c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")

		// Tighten CSP policies. This server answers with JSON and the Swagger UI
		// only, so 'self' covers everything it legitimately loads — cross-origin
		// browser access is governed by CORS, not by this policy.
		c.Header("Content-Security-Policy", "default-src 'self'; connect-src 'self' ws: wss:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval';")

		c.Next()
	}
}

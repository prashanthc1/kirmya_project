package middleware

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// TimeoutMiddleware sets a request-scoped context timeout for all downstream handler operations,
// database queries, and external API calls without spawning concurrent goroutines on the unsafe *gin.Context.
func TimeoutMiddleware(timeout time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), timeout)
		defer cancel()

		c.Request = c.Request.WithContext(ctx)

		c.Next()

		// Check if request deadline was exceeded during execution
		if ctx.Err() == context.DeadlineExceeded && !c.Writer.Written() {
			c.AbortWithStatusJSON(http.StatusGatewayTimeout, gin.H{
				"error":   "Request execution deadline exceeded",
				"code":    "REQUEST_TIMEOUT",
				"timeout": timeout.String(),
			})
		}
	}
}

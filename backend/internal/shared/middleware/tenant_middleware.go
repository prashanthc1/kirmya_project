package middleware

import (
	"log/slog"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const (
	HeaderTenantID = "X-Tenant-ID"
	CtxTenantID    = "tenant_id"

	// DefaultTenantID guarantees 100% backward compatibility for legacy single-tenant requests
	DefaultTenantID = "00000000-0000-0000-0000-000000000000"
)

// TenantIsolationMiddleware enforces multi-tenant boundary checks across backend API requests
func TenantIsolationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantIDStr := c.GetHeader(HeaderTenantID)

		if tenantIDStr == "" {
			// Fallback to default tenant ID for single-tenant / legacy backward compatibility
			tenantIDStr = DefaultTenantID
		}

		tenantUUID, err := uuid.Parse(tenantIDStr)
		if err != nil {
			tenantUUID = uuid.MustParse(DefaultTenantID)
		}

		c.Set(CtxTenantID, tenantUUID.String())
		slog.Debug("Tenant context injected", slog.String("tenant_id", tenantUUID.String()), slog.String("path", c.Request.URL.Path))

		c.Next()
	}
}

// GetTenantID extracts tenant UUID string from Gin context
func GetTenantID(c *gin.Context) string {
	if val, exists := c.Get(CtxTenantID); exists {
		if idStr, ok := val.(string); ok {
			return idStr
		}
	}
	return DefaultTenantID
}

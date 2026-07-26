package middleware

import (
	"log/slog"

	"github.com/gin-gonic/gin"
)

const (
	HeaderDeviceID   = "X-Device-ID"
	HeaderPlatform   = "X-Platform"
	HeaderAppVersion = "X-App-Version"

	CtxMobileDeviceID   = "mobile_device_id"
	CtxMobilePlatform   = "mobile_platform"
	CtxMobileAppVersion = "mobile_app_version"
)

// MobileDeviceMiddleware inspects mobile app request headers for device tracking & platform context
func MobileDeviceMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		deviceID := c.GetHeader(HeaderDeviceID)
		platform := c.GetHeader(HeaderPlatform)
		appVersion := c.GetHeader(HeaderAppVersion)

		if deviceID != "" {
			c.Set(CtxMobileDeviceID, deviceID)
			c.Set(CtxMobilePlatform, platform)
			c.Set(CtxMobileAppVersion, appVersion)

			slog.Debug("Mobile app request context injected",
				slog.String("device_id", deviceID),
				slog.String("platform", platform),
				slog.String("app_version", appVersion),
			)
		}

		c.Next()
	}
}

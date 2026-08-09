package router

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	"kirmya/internal/common/swagger"
	"kirmya/internal/docs"
)

// Anchors the swagger package import so the annotation on swaggerMetrics below
// resolves through this file's import set.
var _ swagger.ErrorResponse

// SwaggerConfig controls whether and how the generated OpenAPI contract is
// served. It is populated from the SWAGGER_* environment variables in
// shared/config.
type SwaggerConfig struct {
	// Enabled gates the whole docs surface. It defaults to false so an
	// environment that never sets SWAGGER_ENABLED cannot publish the API
	// surface by accident.
	Enabled bool
	// Host is the authority Swagger UI issues "Try it out" requests against,
	// e.g. localhost:8080 in development or api.kirmya.com in production.
	Host string
	// BasePath is prefixed to every documented path. Routes already carry the
	// full /api/v1 prefix, so this stays "/" unless the service is mounted
	// behind a path-rewriting proxy.
	BasePath string
	// Username and Password put the docs behind basic auth when both are set.
	Username string
	Password string
}

// registerSwagger mounts Swagger UI at /swagger/index.html. It is a no-op
// unless Enabled is set, which keeps the route table — and the golden file that
// locks it — unchanged for every environment that leaves docs switched off.
func registerSwagger(r *gin.Engine, cfg SwaggerConfig) {
	if !cfg.Enabled {
		return
	}

	// The generated spec ships with development defaults baked in; point it at
	// whatever host this deployment actually answers on so "Try it out" works.
	if cfg.Host != "" {
		docs.SwaggerInfo.Host = cfg.Host
	}
	if cfg.BasePath != "" {
		docs.SwaggerInfo.BasePath = cfg.BasePath
	}

	swaggerGroup := r.Group("/swagger")
	if cfg.Username != "" && cfg.Password != "" {
		swaggerGroup.Use(gin.BasicAuth(gin.Accounts{cfg.Username: cfg.Password}))
	} else {
		slog.Warn("Swagger UI is enabled without basic auth; set SWAGGER_USERNAME and SWAGGER_PASSWORD to restrict access")
	}
	swaggerGroup.GET("/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Convenience entry point so operators do not have to remember the
	// /index.html suffix.
	r.GET("/docs", func(c *gin.Context) {
		c.Redirect(http.StatusFound, "/swagger/index.html")
	})
}

// swaggerMetrics documents GET /api/v1/metrics, the only route this package
// registers itself. Every other operation is annotated in its owning module's
// delivery/http/swagger.go.
//
// @Summary      Prometheus metrics
// @Description  Exposes request, latency and runtime counters in Prometheus text exposition format. Restricted to the scraper: with METRICS_USERNAME and METRICS_PASSWORD set it requires basic auth, otherwise it only answers callers on loopback or private networks and returns 404 to everyone else.
// @Tags         Admin
// @Produce      plain
// @Success      200  {string}  string                 "Prometheus exposition payload"
// @Failure      401  {object}  swagger.ErrorResponse  "Basic auth required"
// @Failure      404  {object}  swagger.ErrorResponse  "Caller is not permitted to scrape metrics"
// @Failure      500  {object}  swagger.ErrorResponse  "Collector unavailable"
// @Router       /api/v1/metrics [get]
func swaggerMetrics() {}

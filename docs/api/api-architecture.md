# Kirmya Modular REST API Architecture & Router Composition

## Executive Summary
This document defines the modular routing architecture, Gin sub-router dependency injection, REST DTO contracts, structured error schemas, and OpenAPI 3.0 specifications across the Kirmya backend.

---

## 1. Modular Route Registration Pattern

Each business module in `backend/internal/` encapsulates its own HTTP handlers, service logic, SQL repositories, and exposes a modular route registration function:

```go
package jobs

import "github.com/gin-gonic/gin"

func RegisterRoutes(r *gin.RouterGroup, handler *JobHandler, authMiddleware gin.HandlerFunc) {
    jobsGroup := r.Group("/jobs")
    {
        jobsGroup.GET("", handler.ListJobs)
        jobsGroup.GET("/:id", handler.GetJobByID)
        jobsGroup.POST("", authMiddleware, handler.CreateJob)
        jobsGroup.PUT("/:id", authMiddleware, handler.UpdateJob)
        jobsGroup.DELETE("/:id", authMiddleware, handler.DeleteJob)
    }
}
```

`cmd/server/main.go` acts solely as a dependency injection and bootstrap orchestrator, calling each module's `RegisterRoutes` without hardcoding raw endpoints in `main.go`.

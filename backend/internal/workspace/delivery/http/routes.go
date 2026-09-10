package http

import (
	"github.com/gin-gonic/gin"

	sharedMiddleware "kirmya/internal/shared/middleware"
)

// RegisterRoutes wires the workspace module's single write.
//
// Authenticated, and nothing further. There is no capability gate here because
// there is nothing to gate: the handler refuses any workspace the caller's own
// resolved list does not contain, and that list is built from the same domain
// authority every one of those workspaces enforces on arrival.
func RegisterRoutes(api *gin.RouterGroup, handler *WorkspaceHandler) {
	workspaceGroup := api.Group("/workspace")
	workspaceGroup.Use(sharedMiddleware.AuthRequired())
	{
		workspaceGroup.PUT("/preference", handler.SelectWorkspace)
	}
}

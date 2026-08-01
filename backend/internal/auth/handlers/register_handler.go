package handlers

import (
	authHttp "kirmya/internal/auth/delivery/http"
	"kirmya/internal/auth/service"

	"github.com/gin-gonic/gin"
)

type RegisterHandler struct {
	httpHandler *authHttp.AuthHandler
}

func NewRegisterHandler(s *service.AuthService) *RegisterHandler {
	return &RegisterHandler{
		httpHandler: authHttp.NewAuthHandler(s),
	}
}

func (h *RegisterHandler) HandleRegister(c *gin.Context) {
	h.httpHandler.Register(c)
}

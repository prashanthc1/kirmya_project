package handlers

import (
	authHttp "kirmya/internal/auth/delivery/http"
	"kirmya/internal/auth/service"

	"github.com/gin-gonic/gin"
)

type LoginHandler struct {
	httpHandler *authHttp.AuthHandler
}

func NewLoginHandler(s *service.AuthService) *LoginHandler {
	return &LoginHandler{
		httpHandler: authHttp.NewAuthHandler(s),
	}
}

func (h *LoginHandler) HandleLogin(c *gin.Context) {
	h.httpHandler.Login(c)
}

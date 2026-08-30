package contract

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	authDto "kirmya/internal/auth/dto"
	authModels "kirmya/internal/auth/models"
	authRepo "kirmya/internal/auth/repository"
	authSvc "kirmya/internal/auth/service"
	jobsHttp "kirmya/internal/jobs/delivery/http"
	jobsModels "kirmya/internal/jobs/models"
	jobsRepo "kirmya/internal/jobs/repository"
	jobsSvc "kirmya/internal/jobs/service"
	msgPubsub "kirmya/internal/messaging/pubsub"
	msgRepo "kirmya/internal/messaging/repository"
	msgSvc "kirmya/internal/messaging/service"
	netRepo "kirmya/internal/networking/repository"
	netSvc "kirmya/internal/networking/service"
	notifyModels "kirmya/internal/notification/models"
	notifyRepo "kirmya/internal/notification/repository"
	notifySvc "kirmya/internal/notification/service"
	profileHttp "kirmya/internal/profile/delivery/http"
	profileModels "kirmya/internal/profile/models"
	profileRepo "kirmya/internal/profile/repository"
	profileSvc "kirmya/internal/profile/service"
	"kirmya/internal/router"
	configPkg "kirmya/internal/shared/config"
	"kirmya/internal/shared/middleware"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

// Helper: mint JWT token for tests
func mintCustomJWT(userID uuid.UUID, email, role string, expiry time.Duration, secret []byte) string {
	claims := middleware.JWTClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "kirmya-auth-service",
			Subject:   userID.String(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString(secret)
	return tokenStr
}

// 1. AUTHENTICATION & LOGIN CONTRACT TESTS
func TestContract_AuthLoginAndProfile_Contract(t *testing.T) {
	ctx := context.Background()
	repo := authRepo.NewAuthRepository(nil)
	svc := authSvc.NewAuthService(repo)

	userID := uuid.New()
	password := "ContractPass123!"
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), 12)

	user := &authModels.User{
		ID:           userID,
		Email:        "contract.user@kirmya.ae",
		PasswordHash: string(hash),
		FirstName:    "Contract",
		LastName:     "Tester",
		Status:       "active",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	err := repo.CreateUser(ctx, user)
	require.NoError(t, err)

	// Test Login DTO & Response Contract
	loginReq := &authDto.LoginRequest{
		Email:    "contract.user@kirmya.ae",
		Password: password,
	}
	resp, accessToken, refreshToken, err := svc.Login(ctx, loginReq, "127.0.0.1", "ContractAgent/1.0")
	require.NoError(t, err)
	assert.NotEmpty(t, accessToken)
	assert.NotEmpty(t, refreshToken)
	assert.NotEmpty(t, resp)
}

// 2. PROFILE RETRIEVAL & CONTRACT ALIGNMENT
func TestContract_ProfileRetrieval_Contract(t *testing.T) {
	ctx := context.Background()
	pRepo := profileRepo.NewProfileRepository(nil)
	pSvc := profileSvc.NewProfileService(pRepo)

	userID := uuid.New()
	newProfile := &profileModels.UserProfile{
		ID:        uuid.New(),
		UserID:    userID,
		Headline:  "Staff Engineer at Kirmya",
		Summary:   "Go, pgx, Next.js contract tester",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err := pRepo.Create(ctx, newProfile)
	require.NoError(t, err)

	profile, err := pSvc.GetOrCreateProfile(ctx, userID)
	require.NoError(t, err)
	assert.Equal(t, userID, profile.UserID)
	assert.Contains(t, profile.Headline, "Kirmya")
}

// 3. JOB SEARCH & LISTING CONTRACT
func TestContract_JobsListing_Contract(t *testing.T) {
	ctx := context.Background()
	jRepo := jobsRepo.NewJobRepository(nil)
	jSvc := jobsSvc.NewJobService(jRepo)

	// In unit testing with nil DB, SearchJobs correctly returns ErrNoDatabase
	_, err := jSvc.SearchJobs(ctx, jobsModels.JobSearchQuery{
		Page:  1,
		Limit: 20,
	})
	assert.Equal(t, jobsRepo.ErrNoDatabase, err)
}

// 4. NETWORKING CONNECTION REQUEST CONTRACT
func TestContract_NetworkingConnection_Contract(t *testing.T) {
	ctx := context.Background()
	nRepo := netRepo.NewNetworkingRepository(nil)
	pRepo := profileRepo.NewProfileRepository(nil)
	nSvc := netSvc.NewNetworkingService(nRepo, pRepo)

	requesterID := uuid.New()
	recipientID := uuid.New()

	conn, err := nSvc.SendConnectionRequest(ctx, requesterID, recipientID, "Hello, let's connect on Kirmya!")
	require.NoError(t, err)
	assert.Equal(t, requesterID, conn.SenderID)
	assert.Equal(t, recipientID, conn.ReceiverID)
	assert.Equal(t, "pending", conn.Status)
}

// 5. MESSAGING CONVERSATION & DISPATCH CONTRACT
func TestContract_MessagingDispatch_Contract(t *testing.T) {
	ctx := context.Background()
	mRepo := msgRepo.NewMessagingRepository(nil)
	ps := msgPubsub.NewInMemoryPubSub()
	mSvc := msgSvc.NewMessagingService(mRepo, ps)

	user1 := uuid.New()
	user2 := uuid.New()

	conv, err := mSvc.GetOrCreateConversation(ctx, user1, user2)
	require.NoError(t, err)
	assert.NotEqual(t, uuid.Nil, conv.ID)

	msg, err := mSvc.SendMessage(ctx, user1, conv.ID, "Contract verification message payload", nil)
	require.NoError(t, err)
	assert.Equal(t, conv.ID, msg.ConversationID)
	assert.Equal(t, user1, msg.SenderID)
	assert.Equal(t, "Contract verification message payload", msg.Content)
}

// 6. NOTIFICATION LISTING & READ CONTRACT
func TestContract_NotificationListing_Contract(t *testing.T) {
	ctx := context.Background()
	nRepo := notifyRepo.NewNotificationRepository(nil)
	ps := msgPubsub.NewInMemoryPubSub()
	nSvc := notifySvc.NewNotificationService(nRepo, ps)

	userID := uuid.New()
	evt := notifyModels.NotificationEvent{
		TargetUserID: userID,
		EventType:    "system_announcement",
		Payload: map[string]interface{}{
			"title": "Welcome to Kirmya",
			"body":  "Your contract verification test is complete.",
		},
	}
	notif, err := nSvc.ProcessEvent(ctx, evt)
	require.NoError(t, err)
	assert.NotNil(t, notif)

	notifications, err := nRepo.List(ctx, userID, "", false, 10, 0)
	require.NoError(t, err)
	assert.NotNil(t, notifications)
}

// 7. API SMOKE TEST VIA ROUTER ENGINE
func TestContract_APIRouteSmokeTest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	pRepo := profileRepo.NewProfileRepository(nil)
	pSvc := profileSvc.NewProfileService(pRepo)
	pHandler := profileHttp.NewProfileHandler(pSvc)

	jRepo := jobsRepo.NewJobRepository(nil)
	jSvc := jobsSvc.NewJobService(jRepo)
	jHandler := jobsHttp.NewJobHandler(jSvc)

	deps := router.RouterDependencies{
		ProfileHandler: pHandler,
		JobsHandler:    jHandler,
	}
	engine := router.New(deps, router.SwaggerConfig{Enabled: false})

	// Health Check Smoke
	reqHealth, _ := http.NewRequest("GET", "/health", nil)
	wHealth := httptest.NewRecorder()
	engine.ServeHTTP(wHealth, reqHealth)
	assert.Equal(t, http.StatusOK, wHealth.Code)

	// Public Jobs Listing Smoke (200 in live DB, 503 graceful in offline DB)
	reqJobs, _ := http.NewRequest("GET", "/api/v1/jobs", nil)
	wJobs := httptest.NewRecorder()
	engine.ServeHTTP(wJobs, reqJobs)
	assert.Contains(t, []int{http.StatusOK, http.StatusServiceUnavailable}, wJobs.Code)

	// Auth Protected Route Without Token Smoke (Expect 401)
	reqProtected, _ := http.NewRequest("GET", "/api/v1/profile/me", nil)
	wProtected := httptest.NewRecorder()
	engine.ServeHTTP(wProtected, reqProtected)
	assert.Equal(t, http.StatusUnauthorized, wProtected.Code)

	// Auth Protected Route With Valid Bearer Token Smoke (Expect 200)
	secret := configPkg.GetJWTSecretBytes()
	userUUID := uuid.New()
	validToken := mintCustomJWT(userUUID, "smoke@kirmya.ae", "candidate", 1*time.Hour, secret)
	reqAuthMe, _ := http.NewRequest("GET", "/api/v1/profile/me", nil)
	reqAuthMe.Header.Set("Authorization", "Bearer "+validToken)
	wAuthMe := httptest.NewRecorder()
	engine.ServeHTTP(wAuthMe, reqAuthMe)
	assert.Equal(t, http.StatusOK, wAuthMe.Code)

	// Error Code JSON Envelope Schema Validation
	var bodyMap map[string]interface{}
	err := json.Unmarshal(wProtected.Body.Bytes(), &bodyMap)
	assert.NoError(t, err)
	assert.Contains(t, bodyMap, "error")
}

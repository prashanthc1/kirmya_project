package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kirmya/internal/freelance/service"
	sharedMiddleware "kirmya/internal/shared/middleware"
	"kirmya/internal/shared/telemetry"
)

// Machine-readable codes, so the web client can tell the two refusals apart
// without parsing prose. They follow the convention the recruiter capability
// already established, because a client that handles one should handle the
// other the same way.
const (
	// CodeFreelancerOnboardingRequired means the account may onboard but has
	// not finished. The way out is to complete onboarding.
	CodeFreelancerOnboardingRequired = "FREELANCER_ONBOARDING_REQUIRED"
	// CodeFreelancerAccessSuspended means the capability was withdrawn.
	// Onboarding again will not restore it; an administrator must.
	CodeFreelancerAccessSuspended = "FREELANCER_ACCESS_SUSPENDED"
)

// RequireFreelancerCapability gates the routes that mean "acting as a
// freelancer".
//
// Before this existed, freelancer authority was the existence of a row in
// freelancer_profiles, and POST /freelance/profile created that row from a
// payload with no required field. An empty JSON body was the whole of becoming
// a freelancer, permanently: there was no state in which freelancing could be
// withheld or withdrawn, so the only way to stop somebody freelancing was to
// suspend their entire Kirmya account.
//
// Authentication says who the caller is. This says whether they currently hold
// usable Freelancer capability, read from the profile lifecycle in the database
// - never from users.role_id, never from the workspace the client claims to be
// in, never from whether a proposal or contract exists.
//
// It is not a substitute for the checks below it: handlers still resolve the
// resource and verify ownership, so one active freelancer still cannot reach
// another's proposals or contracts. The layering is
//
//	authenticate -> require capability -> resolve resource -> check ownership
func RequireFreelancerCapability(svc service.FreelanceService) gin.HandlerFunc {
	return func(c *gin.Context) {
		if svc == nil {
			// A router assembled without the freelance service cannot evaluate
			// "does this account hold the capability", and a surface that
			// answers yes to a question it cannot evaluate is the defect this
			// gate exists to remove. Fail closed.
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Freelancer capability could not be determined",
				"code":  "INTERNAL_ERROR",
			})
			return
		}

		userID, ok := sharedMiddleware.GetUserID(c)
		if !ok {
			// AuthRequired runs first on these groups, so reaching here means
			// the group was wired without it. Refuse rather than assume.
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
				"code":  "UNAUTHENTICATED",
			})
			return
		}

		capability, err := svc.FreelancerCapability(c.Request.Context(), userID)
		if err != nil {
			// A failed lookup is not a denial and not a grant: answering 403
			// here would report an outage as an authorization decision, and
			// would tell a freelancer they had been suspended when the database
			// was merely unreachable.
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Freelancer capability could not be determined",
				"code":  "INTERNAL_ERROR",
			})
			return
		}

		switch capability {
		case service.CapabilityActive:
			c.Next()
		case service.CapabilitySuspended:
			denied(c, userID, capability, CodeFreelancerAccessSuspended)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Freelancing has been suspended for this account.",
				"code":  CodeFreelancerAccessSuspended,
			})
		default:
			// CapabilityNone and CapabilityPending are the same answer to the
			// caller: complete onboarding. They are not distinguished in the
			// response, because whether a half-finished row exists is our
			// business rather than the caller's.
			denied(c, userID, capability, CodeFreelancerOnboardingRequired)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Freelancer onboarding is required before using freelancing features.",
				"code":  CodeFreelancerOnboardingRequired,
			})
		}
	}
}

// denied records a refused attempt to act as a freelancer.
//
// It goes to the existing security-event sink. The route is worth recording
// because the interesting signal is not one refusal but an account walking the
// privileged surface - and the callers this most needs to catch are precisely
// the ones with no profile at all.
func denied(c *gin.Context, userID uuid.UUID, capability service.Capability, code string) {
	telemetry.LogSecurityEvent(c.Request.Context(), "FREELANCER_CAPABILITY_DENIED", c.ClientIP(), map[string]interface{}{
		"userId":     userID.String(),
		"capability": string(capability),
		"code":       code,
		"method":     c.Request.Method,
		"path":       c.FullPath(),
	})
}

package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kirmya/internal/recruiter/service"
	sharedMiddleware "kirmya/internal/shared/middleware"
	"kirmya/internal/shared/telemetry"
)

// Machine-readable codes, so the web client can tell the three refusals apart
// without parsing prose. They follow the existing convention used by
// REQUEST_TIMEOUT and INTERNAL_ERROR in shared/middleware.
const (
	// CodeRecruiterOnboardingRequired means the account may onboard but has not.
	CodeRecruiterOnboardingRequired = "RECRUITER_ONBOARDING_REQUIRED"
	// CodeRecruiterAccessDisabled means the capability was withdrawn. Onboarding
	// again will not restore it; an administrator must.
	CodeRecruiterAccessDisabled = "RECRUITER_ACCESS_DISABLED"
)

// RequireRecruiterCapability gates the privileged recruiter routes.
//
// Before this existed, /recruiter/* was protected by AuthRequired() alone, and
// the handlers behind it called GetOrCreateProfile - so the first request from
// any authenticated account created an organization and a recruiter profile,
// stamped them Verified, and let that account publish a live public job. Being
// signed in was the whole of the check.
//
// Authentication says who the caller is. This says whether they hold the
// standalone Recruiting capability, and it reads that from the recruiter
// profile lifecycle in the database - never from users.role_id, never from
// company membership, never from anything the client sends.
//
// It is not a substitute for the checks below it: handlers still resolve the
// resource and verify ownership. The layering is
//
//	authenticate -> require capability -> resolve resource -> check ownership
func RequireRecruiterCapability(svc *service.RecruiterService) gin.HandlerFunc {
	return func(c *gin.Context) {
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

		capability, err := svc.RecruiterCapability(c.Request.Context(), userID)
		if err != nil {
			// A failed lookup is not a denial and not a grant: answering 403
			// here would report an outage as an authorization decision.
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "Recruiter capability could not be determined",
				"code":  "INTERNAL_ERROR",
			})
			return
		}

		switch capability {
		case service.CapabilityActive:
			c.Next()
		case service.CapabilitySuspended:
			denied(c, userID, capability, CodeRecruiterAccessDisabled)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Recruiting access has been disabled for this account.",
				"code":  CodeRecruiterAccessDisabled,
			})
		default:
			// CapabilityNone and CapabilityPending are the same answer to the
			// caller: complete onboarding. They are not distinguished in the
			// response, because whether a half-finished row exists is our
			// business rather than the caller's.
			denied(c, userID, capability, CodeRecruiterOnboardingRequired)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Recruiter onboarding is required before using recruiting features.",
				"code":  CodeRecruiterOnboardingRequired,
			})
		}
	}
}

// denied records a refused attempt to act as a recruiter.
//
// It goes to the existing security-event sink rather than to
// recruiter_activity: that table is keyed by recruiter profile id, which a
// refused caller does not have, and the callers this most needs to catch are
// precisely the ones with no profile at all. The route is worth recording
// because the interesting signal is not one refusal but an account walking the
// privileged surface.
func denied(c *gin.Context, userID uuid.UUID, capability service.Capability, code string) {
	telemetry.LogSecurityEvent(c.Request.Context(), "RECRUITER_CAPABILITY_DENIED", c.ClientIP(), map[string]interface{}{
		"userId":     userID.String(),
		"capability": string(capability),
		"code":       code,
		"method":     c.Request.Method,
		"path":       c.FullPath(),
	})
}

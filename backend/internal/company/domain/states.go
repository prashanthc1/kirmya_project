package domain

import (
	"errors"
	"strings"
	"time"
)

// Errors the service layer returns and the handlers map onto status codes.
var (
	// ErrNotFound is deliberately also returned when a caller lacks the right to
	// know a resource exists, so probing IDs across companies reveals nothing.
	ErrNotFound = errors.New("company: resource not found")
	// ErrForbidden means the caller is authenticated and the resource exists,
	// but their grant on that company does not carry the permission.
	ErrForbidden = errors.New("company: permission denied")
	// ErrUnauthenticated means no user is attached to the request.
	ErrUnauthenticated = errors.New("company: authentication required")
	// ErrConflict covers duplicate handles, duplicate reviews and repeated
	// invitations to the same address.
	ErrConflict = errors.New("company: conflicting state")
	// ErrValidation covers malformed input that binding could not catch.
	ErrValidation = errors.New("company: invalid input")
)

// MembershipStatus is the lifecycle of a person's association with a company.
// New associations start pending; only an approval by someone holding
// PermPeopleApprove makes them real.
type MembershipStatus string

const (
	MembershipPending   MembershipStatus = "pending"
	MembershipApproved  MembershipStatus = "approved"
	MembershipRejected  MembershipStatus = "rejected"
	MembershipRemoved   MembershipStatus = "removed"
	MembershipSuspended MembershipStatus = "suspended"
)

// ParseMembershipStatus rejects unknown values rather than defaulting.
func ParseMembershipStatus(value string) (MembershipStatus, bool) {
	switch MembershipStatus(strings.ToLower(strings.TrimSpace(value))) {
	case MembershipPending:
		return MembershipPending, true
	case MembershipApproved:
		return MembershipApproved, true
	case MembershipRejected:
		return MembershipRejected, true
	case MembershipRemoved:
		return MembershipRemoved, true
	case MembershipSuspended:
		return MembershipSuspended, true
	}
	return "", false
}

// GrantsAccess reports whether the status lets the member act on the company.
// Only approved members carry their role's permissions; a suspended recruiter
// keeps the row but loses the access.
func (s MembershipStatus) GrantsAccess() bool { return s == MembershipApproved }

// AssociationType describes how a person is attached to the company.
type AssociationType string

const (
	AssociationCurrentEmployee AssociationType = "current_employee"
	AssociationFormerEmployee  AssociationType = "former_employee"
	AssociationContractor      AssociationType = "contractor"
	AssociationRecruiter       AssociationType = "recruiter"
	AssociationHiringManager   AssociationType = "hiring_manager"
	AssociationExecutive       AssociationType = "executive"
	AssociationIntern          AssociationType = "intern"
)

// ParseAssociationType rejects unknown values.
func ParseAssociationType(value string) (AssociationType, bool) {
	switch AssociationType(strings.ToLower(strings.TrimSpace(value))) {
	case AssociationCurrentEmployee:
		return AssociationCurrentEmployee, true
	case AssociationFormerEmployee:
		return AssociationFormerEmployee, true
	case AssociationContractor:
		return AssociationContractor, true
	case AssociationRecruiter:
		return AssociationRecruiter, true
	case AssociationHiringManager:
		return AssociationHiringManager, true
	case AssociationExecutive:
		return AssociationExecutive, true
	case AssociationIntern:
		return AssociationIntern, true
	}
	return "", false
}

// VerificationStatus is the company's verification state. It starts at
// not_verified and only an administrator review moves it to verified; nothing
// in the company module may write that transition.
type VerificationStatus string

const (
	VerificationNotVerified VerificationStatus = "not_verified"
	VerificationPending     VerificationStatus = "pending"
	VerificationVerified    VerificationStatus = "verified"
	VerificationRejected    VerificationStatus = "rejected"
	VerificationExpired     VerificationStatus = "expired"
)

// ParseVerificationStatus rejects unknown values.
func ParseVerificationStatus(value string) (VerificationStatus, bool) {
	switch VerificationStatus(strings.ToLower(strings.TrimSpace(value))) {
	case VerificationNotVerified:
		return VerificationNotVerified, true
	case VerificationPending:
		return VerificationPending, true
	case VerificationVerified:
		return VerificationVerified, true
	case VerificationRejected:
		return VerificationRejected, true
	case VerificationExpired:
		return VerificationExpired, true
	}
	return "", false
}

// ShowsBadge reports whether a verification badge may be rendered. Only a
// completed, unexpired verification qualifies; pending must never look verified.
func (s VerificationStatus) ShowsBadge() bool { return s == VerificationVerified }

// CanSubmit reports whether a new verification request may be opened. A company
// already under review cannot queue a second one, and a verified company only
// re-submits once its verification has expired.
func (s VerificationStatus) CanSubmit() bool {
	return s == VerificationNotVerified || s == VerificationRejected || s == VerificationExpired
}

// AdminDecisions are the states an administrator may set on a review.
func AdminDecisions() []VerificationStatus {
	return []VerificationStatus{VerificationVerified, VerificationRejected}
}

// IsAdminDecision reports whether a status is one an administrator may set
// directly. Notably 'verified' is only reachable this way.
func IsAdminDecision(status VerificationStatus) bool {
	for _, allowed := range AdminDecisions() {
		if allowed == status {
			return true
		}
	}
	return false
}

// InvitationStatus is the lifecycle of a company invitation.
type InvitationStatus string

const (
	InvitationPending  InvitationStatus = "pending"
	InvitationAccepted InvitationStatus = "accepted"
	InvitationDeclined InvitationStatus = "declined"
	InvitationExpired  InvitationStatus = "expired"
	InvitationRevoked  InvitationStatus = "revoked"
)

// ParseInvitationStatus rejects unknown values.
func ParseInvitationStatus(value string) (InvitationStatus, bool) {
	switch InvitationStatus(strings.ToLower(strings.TrimSpace(value))) {
	case InvitationPending:
		return InvitationPending, true
	case InvitationAccepted:
		return InvitationAccepted, true
	case InvitationDeclined:
		return InvitationDeclined, true
	case InvitationExpired:
		return InvitationExpired, true
	case InvitationRevoked:
		return InvitationRevoked, true
	}
	return "", false
}

// InvitationTTL is how long an invitation link stays usable. Short enough that a
// leaked link from an old mailbox is worthless, long enough for someone to
// accept after a holiday.
const InvitationTTL = 7 * 24 * time.Hour

// InvitationChannel is how an invitation reached its recipient.
type InvitationChannel string

const (
	InvitationChannelEmail        InvitationChannel = "email"
	InvitationChannelNotification InvitationChannel = "notification"
	InvitationChannelLink         InvitationChannel = "link"
)

// ParseInvitationChannel rejects unknown values.
func ParseInvitationChannel(value string) (InvitationChannel, bool) {
	switch InvitationChannel(strings.ToLower(strings.TrimSpace(value))) {
	case InvitationChannelEmail:
		return InvitationChannelEmail, true
	case InvitationChannelNotification:
		return InvitationChannelNotification, true
	case InvitationChannelLink:
		return InvitationChannelLink, true
	}
	return "", false
}

// UpdateStatus is the lifecycle of a company update (post).
type UpdateStatus string

const (
	UpdateDraft     UpdateStatus = "draft"
	UpdateScheduled UpdateStatus = "scheduled"
	UpdatePublished UpdateStatus = "published"
	UpdateArchived  UpdateStatus = "archived"
)

// ParseUpdateStatus rejects unknown values.
func ParseUpdateStatus(value string) (UpdateStatus, bool) {
	switch UpdateStatus(strings.ToLower(strings.TrimSpace(value))) {
	case UpdateDraft:
		return UpdateDraft, true
	case UpdateScheduled:
		return UpdateScheduled, true
	case UpdatePublished:
		return UpdatePublished, true
	case UpdateArchived:
		return UpdateArchived, true
	}
	return "", false
}

// UpdateType is the kind of content a company update carries.
type UpdateType string

const (
	UpdateTypeText        UpdateType = "text"
	UpdateTypeImage       UpdateType = "image"
	UpdateTypeLink        UpdateType = "link"
	UpdateTypeJob         UpdateType = "job_announcement"
	UpdateTypeHiring      UpdateType = "hiring_announcement"
	UpdateTypeNews        UpdateType = "news"
	UpdateTypeEventNotice UpdateType = "event"
)

// ParseUpdateType rejects unknown values.
func ParseUpdateType(value string) (UpdateType, bool) {
	switch UpdateType(strings.ToLower(strings.TrimSpace(value))) {
	case UpdateTypeText:
		return UpdateTypeText, true
	case UpdateTypeImage:
		return UpdateTypeImage, true
	case UpdateTypeLink:
		return UpdateTypeLink, true
	case UpdateTypeJob:
		return UpdateTypeJob, true
	case UpdateTypeHiring:
		return UpdateTypeHiring, true
	case UpdateTypeNews:
		return UpdateTypeNews, true
	case UpdateTypeEventNotice:
		return UpdateTypeEventNotice, true
	}
	return "", false
}

// ReviewEmploymentType is the reviewer's relationship to the company during the
// period they are describing.
type ReviewEmploymentType string

const (
	ReviewCurrentEmployee ReviewEmploymentType = "current_employee"
	ReviewFormerEmployee  ReviewEmploymentType = "former_employee"
	ReviewContractor      ReviewEmploymentType = "contractor"
	ReviewIntern          ReviewEmploymentType = "intern"
)

// ParseReviewEmploymentType rejects unknown values.
func ParseReviewEmploymentType(value string) (ReviewEmploymentType, bool) {
	switch ReviewEmploymentType(strings.ToLower(strings.TrimSpace(value))) {
	case ReviewCurrentEmployee:
		return ReviewCurrentEmployee, true
	case ReviewFormerEmployee:
		return ReviewFormerEmployee, true
	case ReviewContractor:
		return ReviewContractor, true
	case ReviewIntern:
		return ReviewIntern, true
	}
	return "", false
}

// ReviewStatus is the moderation state of a review.
type ReviewStatus string

const (
	ReviewPublished   ReviewStatus = "published"
	ReviewUnderReview ReviewStatus = "under_review"
	ReviewRemoved     ReviewStatus = "removed"
)

// ReviewReportThreshold is how many distinct reports pull a review out of public
// view pending moderation. One report is not enough — a company could otherwise
// silence criticism with a single click.
const ReviewReportThreshold = 3

// AuditAction names an entry in company_audit_logs. These are the events the
// module is required to record.
const (
	AuditCompanyCreated        = "company.created"
	AuditCompanyUpdated        = "company.updated"
	AuditVerificationSubmitted = "verification.submitted"
	AuditVerificationApproved  = "verification.approved"
	AuditVerificationRejected  = "verification.rejected"
	AuditEmployeeAdded         = "employee.added"
	AuditEmployeeRemoved       = "employee.removed"
	AuditRecruiterInvited      = "recruiter.invited"
	AuditRecruiterRemoved      = "recruiter.removed"
	AuditPermissionChanged     = "permission.changed"
	AuditJobPublished          = "job.published"
	AuditJobClosed             = "job.closed"
	AuditUpdatePublished       = "update.published"
	AuditReviewReported        = "review.reported"
	AuditSensitiveDataAccessed = "sensitive_data.accessed"
)

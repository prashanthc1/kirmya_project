package models

import (
	"time"

	"kirmya/internal/company/domain"

	"github.com/google/uuid"
)

// CompanySummary is the identity of a company as it appears in lists. It never
// carries private fields, so it is safe on public endpoints.
type CompanySummary struct {
	ID                 uuid.UUID                 `json:"id"`
	Name               string                    `json:"name"`
	Slug               string                    `json:"slug"`
	Tagline            string                    `json:"tagline"`
	LogoURL            string                    `json:"logoUrl"`
	CoverURL           string                    `json:"coverUrl"`
	Industry           string                    `json:"industry"`
	CompanyType        string                    `json:"companyType"`
	CompanySize        string                    `json:"companySize"`
	Headquarters       string                    `json:"headquarters"`
	FollowersCount     int                       `json:"followersCount"`
	EmployeesCount     int                       `json:"employeesCount"`
	OpenJobsCount      int                       `json:"openJobsCount"`
	Rating             float64                   `json:"rating"`
	ReviewCount        int                       `json:"reviewCount"`
	IsHiring           bool                      `json:"isHiring"`
	VerificationStatus domain.VerificationStatus `json:"verificationStatus"`
	// IsVerified is the only signal the UI should use to render a badge; it is
	// true only for a completed, unexpired verification.
	IsVerified  bool `json:"isVerified"`
	IsFollowing bool `json:"isFollowing"`
}

// CompanyDetail is the full public profile of one company.
type CompanyDetail struct {
	CompanySummary
	Description        string            `json:"description"`
	Mission            string            `json:"mission"`
	Vision             string            `json:"vision"`
	History            string            `json:"history"`
	WorkCulture        string            `json:"workCulture"`
	CareerInfo         string            `json:"careerInfo"`
	Website            string            `json:"website"`
	ContactEmail       string            `json:"contactEmail"`
	ContactPhone       string            `json:"contactPhone"`
	FoundedYear        int               `json:"foundedYear"`
	SocialLinks        map[string]string `json:"socialLinks"`
	BrandAssets        []BrandAsset      `json:"brandAssets"`
	Specialties        []string          `json:"specialties"`
	Values             []string          `json:"values"`
	Benefits           []string          `json:"benefits"`
	Products           []string          `json:"products"`
	Services           []string          `json:"services"`
	Industries         []string          `json:"industries"`
	Technology         []string          `json:"technology"`
	Awards             []string          `json:"awards"`
	Certifications     []string          `json:"certifications"`
	OperatingCountries []string          `json:"operatingCountries"`
	ProfileCompletion  int               `json:"profileCompletion"`
	CreatedAt          time.Time         `json:"createdAt"`
	UpdatedAt          time.Time         `json:"updatedAt"`
	// Viewer describes what the requesting user may do here. It is empty for
	// anonymous and unaffiliated callers.
	Viewer *ViewerContext `json:"viewer,omitempty"`
}

// BrandAsset is one downloadable branding file.
type BrandAsset struct {
	Label    string `json:"label"`
	URL      string `json:"url"`
	MimeType string `json:"mimeType"`
}

// ViewerContext tells the frontend which controls to render. The backend still
// re-checks every permission on the write itself; this exists so the UI does not
// have to guess.
type ViewerContext struct {
	IsMember    bool                `json:"isMember"`
	Roles       []domain.Role       `json:"roles"`
	Permissions []domain.Permission `json:"permissions"`
	IsFollowing bool                `json:"isFollowing"`
}

// CompanyListPage is a paginated slice of company summaries.
type CompanyListPage struct {
	Items      []CompanySummary `json:"items"`
	Total      int              `json:"total"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"totalPages"`
}

// CompanySearchQuery is the filter set accepted by search and the directory.
type CompanySearchQuery struct {
	Query      string   `form:"query"`
	Industry   string   `form:"industry"`
	Location   string   `form:"location"`
	Size       string   `form:"size"`
	Type       string   `form:"type"`
	Skills     []string `form:"skills"`
	HiringOnly bool     `form:"hiring"`
	Verified   bool     `form:"verified"`
	Sort       string   `form:"sort"`
	Page       int      `form:"page"`
	Limit      int      `form:"limit"`
}

// CompanyMembership is one company the caller has standing in, together with
// what that standing lets them do. It is what the dashboard's company switcher
// reads: without it the dashboard has no way to know which company to open.
//
// Permissions is the flattened, effective set. The frontend uses it to decide
// which controls to render; the backend still re-checks every one of them on the
// write itself.
type CompanyMembership struct {
	Company     CompanySummary      `json:"company"`
	Roles       []domain.Role       `json:"roles"`
	Permissions []domain.Permission `json:"permissions"`
}

// CompanyDiscovery groups the curated shelves shown on the discovery page.
// Every shelf is derived from real rows; a shelf with nothing behind it comes
// back empty rather than padded.
type CompanyDiscovery struct {
	Trending              []CompanySummary `json:"trending"`
	Hiring                []CompanySummary `json:"hiring"`
	TopEmployers          []CompanySummary `json:"topEmployers"`
	FastGrowing           []CompanySummary `json:"fastGrowing"`
	HiringNearYou         []CompanySummary `json:"hiringNearYou"`
	HiringForYourSkills   []CompanySummary `json:"hiringForYourSkills"`
	FollowedByConnections []CompanySummary `json:"followedByConnections"`
}

// ---------------------------------------------------------------------------
// People and team
// ---------------------------------------------------------------------------

// CompanyPerson is one person's association with a company. Which fields are
// populated depends on who is asking: public callers get the display fields
// only, and only for members who made their association public.
type CompanyPerson struct {
	ID              uuid.UUID               `json:"id"`
	UserID          uuid.UUID               `json:"userId"`
	Name            string                  `json:"name"`
	PhotoURL        string                  `json:"photoUrl"`
	JobTitle        string                  `json:"jobTitle"`
	Department      string                  `json:"department"`
	DepartmentID    *uuid.UUID              `json:"departmentId,omitempty"`
	Location        string                  `json:"location"`
	AssociationType domain.AssociationType  `json:"associationType"`
	Status          domain.MembershipStatus `json:"status"`
	Role            domain.Role             `json:"role"`
	Roles           []domain.Role           `json:"roles,omitempty"`
	IsPublic        bool                    `json:"isPublic"`
	// Email is populated only for callers holding team:view; it is the main
	// piece of employee contact data this module can leak.
	Email string `json:"email,omitempty"`
	// ExtraPermissions are the permissions granted to this member individually,
	// on top of whatever their role carries. It is populated only for callers
	// holding permission:edit, because it is what the permissions editor has to
	// read before it writes: SetMemberPermissions replaces the list outright, so
	// an editor that could not see the current value would silently erase it.
	ExtraPermissions []domain.Permission `json:"extraPermissions,omitempty"`
	StartedAt        *time.Time          `json:"startedAt,omitempty"`
	EndedAt          *time.Time          `json:"endedAt,omitempty"`
	JoinedAt         time.Time           `json:"joinedAt"`
}

// CompanyDepartment is one department, used for filtering people and for the
// team editor's department picker.
type CompanyDepartment struct {
	ID            uuid.UUID `json:"id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	EmployeeCount int       `json:"employeeCount"`
	OpenJobs      int       `json:"openJobs"`
}

// PeopleQuery filters the people list.
type PeopleQuery struct {
	Query           string `form:"query"`
	DepartmentID    string `form:"departmentId"`
	AssociationType string `form:"associationType"`
	Status          string `form:"status"`
	Role            string `form:"role"`
	Page            int    `form:"page"`
	Limit           int    `form:"limit"`
}

// CompanyPeoplePage is a paginated slice of people.
type CompanyPeoplePage struct {
	Items      []CompanyPerson `json:"items"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"totalPages"`
}

// AssociationRequestPayload is an employee asking to be linked to a company.
type AssociationRequestPayload struct {
	AssociationType string     `json:"associationType" binding:"required"`
	JobTitle        string     `json:"jobTitle" binding:"required"`
	DepartmentID    *uuid.UUID `json:"departmentId"`
	Location        string     `json:"location"`
	IsPublic        bool       `json:"isPublic"`
}

// TeamInvitePayload invites someone to join the company in a given role.
type TeamInvitePayload struct {
	Email           string     `json:"email" binding:"required,email"`
	Role            string     `json:"role" binding:"required"`
	AssociationType string     `json:"associationType"`
	JobTitle        string     `json:"jobTitle"`
	DepartmentID    *uuid.UUID `json:"departmentId"`
	Message         string     `json:"message"`
	Channel         string     `json:"channel"`
}

// TeamMemberUpdatePayload changes a member's role, department or status.
type TeamMemberUpdatePayload struct {
	Role         string     `json:"role"`
	Status       string     `json:"status"`
	JobTitle     string     `json:"jobTitle"`
	DepartmentID *uuid.UUID `json:"departmentId"`
}

// CompanyInvitation is a pending or resolved invitation. The token itself is
// never included: it exists only in the link that was sent.
type CompanyInvitation struct {
	ID              uuid.UUID               `json:"id"`
	CompanyID       uuid.UUID               `json:"companyId"`
	Email           string                  `json:"email"`
	Role            domain.Role             `json:"role"`
	AssociationType domain.AssociationType  `json:"associationType"`
	JobTitle        string                  `json:"jobTitle"`
	Status          domain.InvitationStatus `json:"status"`
	Channel         string                  `json:"channel"`
	Message         string                  `json:"message"`
	InvitedBy       uuid.UUID               `json:"invitedBy"`
	ExpiresAt       time.Time               `json:"expiresAt"`
	CreatedAt       time.Time               `json:"createdAt"`
	// InvitedUserID is set when the address already belongs to a Kirmya
	// account. It stays out of the JSON: the company team has no business
	// learning a user id from an address they typed in.
	InvitedUserID *uuid.UUID `json:"-"`
}

// InvitationIssued is returned once, to the inviter, at the moment an
// invitation is created. AcceptURL contains the only copy of the plaintext
// token that will ever exist.
type InvitationIssued struct {
	Invitation CompanyInvitation `json:"invitation"`
	AcceptURL  string            `json:"acceptUrl"`
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

// VerificationSubmitPayload opens a verification review.
type VerificationSubmitPayload struct {
	LegalName           string                 `json:"legalName" binding:"required"`
	RegistrationNumber  string                 `json:"registrationNumber" binding:"required"`
	RegistrationCountry string                 `json:"registrationCountry" binding:"required"`
	ContactEmail        string                 `json:"contactEmail" binding:"required,email"`
	Documents           []VerificationDocument `json:"documents" binding:"required,min=1,dive"`
}

// VerificationDocument is one piece of proof supporting a verification claim.
//
// FileSize is optional because the module stores a link rather than the bytes:
// a client submitting a URL cannot report the size of a file it never read, and
// requiring a number it would have to invent is worse than not having one.
type VerificationDocument struct {
	ID           uuid.UUID `json:"id"`
	DocumentType string    `json:"documentType" binding:"required"`
	FileURL      string    `json:"fileUrl" binding:"required,url"`
	FileName     string    `json:"fileName" binding:"required"`
	FileSize     int64     `json:"fileSize" binding:"omitempty,gte=0"`
	MimeType     string    `json:"mimeType" binding:"required"`
	Checksum     string    `json:"checksum"`
	CreatedAt    time.Time `json:"createdAt"`
}

// CompanyVerification is the state of one verification review.
type CompanyVerification struct {
	ID                  uuid.UUID                 `json:"id"`
	CompanyID           uuid.UUID                 `json:"companyId"`
	Status              domain.VerificationStatus `json:"status"`
	LegalName           string                    `json:"legalName"`
	RegistrationNumber  string                    `json:"registrationNumber"`
	RegistrationCountry string                    `json:"registrationCountry"`
	ContactEmail        string                    `json:"contactEmail"`
	SubmittedBy         uuid.UUID                 `json:"submittedBy"`
	SubmittedAt         time.Time                 `json:"submittedAt"`
	ReviewedAt          *time.Time                `json:"reviewedAt,omitempty"`
	RejectionReason     string                    `json:"rejectionReason,omitempty"`
	ExpiresAt           *time.Time                `json:"expiresAt,omitempty"`
	Documents           []VerificationDocument    `json:"documents"`
}

// VerificationDecisionPayload is an administrator's ruling.
type VerificationDecisionPayload struct {
	Status          string `json:"status" binding:"required"`
	RejectionReason string `json:"rejectionReason"`
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

// CompanyJob is a job as shown on a company page. It is read from the jobs
// table owned by the jobs/recruiter modules; this module never creates one.
type CompanyJob struct {
	ID                uuid.UUID  `json:"id"`
	Title             string     `json:"title"`
	Department        string     `json:"department"`
	Location          string     `json:"location"`
	WorkMode          string     `json:"workMode"`
	EmploymentType    string     `json:"employmentType"`
	ExperienceLevel   string     `json:"experienceLevel"`
	SalaryRange       string     `json:"salaryRange"`
	Skills            []string   `json:"skills"`
	Status            string     `json:"status"`
	IsFeatured        bool       `json:"isFeatured"`
	ViewsCount        int        `json:"viewsCount"`
	ApplicationsCount int        `json:"applicationsCount"`
	PublishedAt       *time.Time `json:"publishedAt,omitempty"`
	ExpiresAt         *time.Time `json:"expiresAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
}

// CompanyJobsPage is a paginated slice of jobs.
type CompanyJobsPage struct {
	Items      []CompanyJob `json:"items"`
	Total      int          `json:"total"`
	Page       int          `json:"page"`
	Limit      int          `json:"limit"`
	TotalPages int          `json:"totalPages"`
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

// CompanyReview is one employee review. AuthorName is empty whenever the review
// is anonymous, and the raw user id is never sent to a public caller.
type CompanyReview struct {
	ID                 uuid.UUID                   `json:"id"`
	CompanyID          uuid.UUID                   `json:"companyId"`
	AuthorName         string                      `json:"authorName,omitempty"`
	AuthorPhotoURL     string                      `json:"authorPhotoUrl,omitempty"`
	IsAnonymous        bool                        `json:"isAnonymous"`
	IsOwnReview        bool                        `json:"isOwnReview"`
	EmploymentType     domain.ReviewEmploymentType `json:"employmentType"`
	EmploymentPeriod   string                      `json:"employmentPeriod"`
	JobTitle           string                      `json:"jobTitle,omitempty"`
	OverallRating      int                         `json:"overallRating"`
	WorkLifeBalance    *int                        `json:"workLifeBalance,omitempty"`
	CompensationRating *int                        `json:"compensationRating,omitempty"`
	CultureRating      *int                        `json:"cultureRating,omitempty"`
	ManagementRating   *int                        `json:"managementRating,omitempty"`
	CareerGrowthRating *int                        `json:"careerGrowthRating,omitempty"`
	Title              string                      `json:"title"`
	Summary            string                      `json:"summary"`
	Pros               string                      `json:"pros"`
	Cons               string                      `json:"cons"`
	CompanyResponse    string                      `json:"companyResponse,omitempty"`
	CompanyResponseAt  *time.Time                  `json:"companyResponseAt,omitempty"`
	CreatedAt          time.Time                   `json:"createdAt"`
	UpdatedAt          time.Time                   `json:"updatedAt"`
}

// CompanyReviewsPage carries the reviews plus the rating breakdown.
type CompanyReviewsPage struct {
	Items           []CompanyReview `json:"items"`
	Total           int             `json:"total"`
	Page            int             `json:"page"`
	Limit           int             `json:"limit"`
	TotalPages      int             `json:"totalPages"`
	AverageRating   float64         `json:"averageRating"`
	RatingBreakdown map[string]int  `json:"ratingBreakdown"`
	CanReview       bool            `json:"canReview"`
}

// ReviewPayload submits or edits a review.
type ReviewPayload struct {
	EmploymentType      string  `json:"employmentType" binding:"required"`
	EmploymentStartedOn *string `json:"employmentStartedOn"`
	EmploymentEndedOn   *string `json:"employmentEndedOn"`
	JobTitle            string  `json:"jobTitle"`
	OverallRating       int     `json:"overallRating" binding:"required,min=1,max=5"`
	WorkLifeBalance     *int    `json:"workLifeBalance" binding:"omitempty,min=1,max=5"`
	CompensationRating  *int    `json:"compensationRating" binding:"omitempty,min=1,max=5"`
	CultureRating       *int    `json:"cultureRating" binding:"omitempty,min=1,max=5"`
	ManagementRating    *int    `json:"managementRating" binding:"omitempty,min=1,max=5"`
	CareerGrowthRating  *int    `json:"careerGrowthRating" binding:"omitempty,min=1,max=5"`
	Title               string  `json:"title" binding:"required,max=255"`
	Summary             string  `json:"summary" binding:"required,min=40"`
	Pros                string  `json:"pros"`
	Cons                string  `json:"cons"`
	IsAnonymous         *bool   `json:"isAnonymous"`
}

// ReviewReportPayload flags a review for moderation.
type ReviewReportPayload struct {
	Reason  string `json:"reason" binding:"required"`
	Details string `json:"details"`
}

// ReviewResponsePayload is the company's public reply to a review.
type ReviewResponsePayload struct {
	Response string `json:"response" binding:"required,min=10"`
}

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

// CompanyUpdate is one company post.
type CompanyUpdate struct {
	ID             uuid.UUID           `json:"id"`
	CompanyID      uuid.UUID           `json:"companyId"`
	AuthorID       uuid.UUID           `json:"authorId"`
	AuthorName     string              `json:"authorName"`
	Type           domain.UpdateType   `json:"type"`
	Title          string              `json:"title"`
	Body           string              `json:"body"`
	Media          []string            `json:"media"`
	Links          []string            `json:"links"`
	JobID          *uuid.UUID          `json:"jobId,omitempty"`
	Status         domain.UpdateStatus `json:"status"`
	ScheduledAt    *time.Time          `json:"scheduledAt,omitempty"`
	PublishedAt    *time.Time          `json:"publishedAt,omitempty"`
	ViewsCount     int                 `json:"viewsCount"`
	ReactionsCount int                 `json:"reactionsCount"`
	CommentsCount  int                 `json:"commentsCount"`
	CreatedAt      time.Time           `json:"createdAt"`
	UpdatedAt      time.Time           `json:"updatedAt"`
}

// CompanyUpdatesPage is a paginated slice of updates.
type CompanyUpdatesPage struct {
	Items      []CompanyUpdate `json:"items"`
	Total      int             `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"totalPages"`
}

// UpdatePayload creates or edits a company update.
type UpdatePayload struct {
	Type        string     `json:"type" binding:"required"`
	Title       string     `json:"title" binding:"max=255"`
	Body        string     `json:"body" binding:"required,min=1"`
	Media       []string   `json:"media"`
	Links       []string   `json:"links"`
	JobID       *uuid.UUID `json:"jobId"`
	Status      string     `json:"status" binding:"required"`
	ScheduledAt *time.Time `json:"scheduledAt"`
}

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

// CompanyDashboard is the summary shown on /company/dashboard.
type CompanyDashboard struct {
	Company            CompanySummary            `json:"company"`
	ProfileCompletion  int                       `json:"profileCompletion"`
	VerificationStatus domain.VerificationStatus `json:"verificationStatus"`
	ActiveJobs         int                       `json:"activeJobs"`
	Applications       int                       `json:"applications"`
	Candidates         int                       `json:"candidates"`
	Interviews         int                       `json:"interviews"`
	Hires              int                       `json:"hires"`
	Followers          int                       `json:"followers"`
	ProfileViews       int                       `json:"profileViews"`
	JobViews           int                       `json:"jobViews"`
	PendingApprovals   int                       `json:"pendingApprovals"`
	RecruiterActivity  []RecruiterActivityItem   `json:"recruiterActivity"`
}

// RecruiterActivityItem is one recruiter's throughput over the window.
type RecruiterActivityItem struct {
	UserID           uuid.UUID `json:"userId"`
	Name             string    `json:"name"`
	JobsPosted       int       `json:"jobsPosted"`
	ApplicationsRead int       `json:"applicationsReviewed"`
	Interviews       int       `json:"interviews"`
	Hires            int       `json:"hires"`
}

// CompanyAnalytics is the aggregated view over a date range.
type CompanyAnalytics struct {
	From           time.Time `json:"from"`
	To             time.Time `json:"to"`
	ProfileViews   int       `json:"profileViews"`
	UniqueVisitors int       `json:"uniqueVisitors"`
	Followers      int       `json:"followers"`
	FollowerGrowth int       `json:"followerGrowth"`
	JobViews       int       `json:"jobViews"`
	Applications   int       `json:"applications"`
	// The funnel counts behind the rates below. They are reported alongside the
	// rates so a client never has to multiply a rate back out into a headcount
	// and present the rounding as a measurement.
	Interviews            int                     `json:"interviews"`
	Offers                int                     `json:"offers"`
	Hires                 int                     `json:"hires"`
	ApplicationConversion float64                 `json:"applicationConversion"`
	InterviewRate         float64                 `json:"interviewRate"`
	OfferRate             float64                 `json:"offerRate"`
	HireRate              float64                 `json:"hireRate"`
	CandidateSources      map[string]int          `json:"candidateSources"`
	Series                []AnalyticsPoint        `json:"series"`
	RecruiterActivity     []RecruiterActivityItem `json:"recruiterActivity"`
}

// AnalyticsPoint is one day in the series.
type AnalyticsPoint struct {
	Date           string `json:"date"`
	ProfileViews   int    `json:"profileViews"`
	UniqueVisitors int    `json:"uniqueVisitors"`
	JobViews       int    `json:"jobViews"`
	Applications   int    `json:"applications"`
	Followers      int    `json:"followers"`
}

// JobAnalytics is the per-job funnel.
type JobAnalytics struct {
	JobID                 uuid.UUID `json:"jobId"`
	Title                 string    `json:"title"`
	Views                 int       `json:"views"`
	UniqueViews           int       `json:"uniqueViews"`
	Applications          int       `json:"applications"`
	QualifiedApplications int       `json:"qualifiedApplications"`
	Shortlisted           int       `json:"shortlisted"`
	Interviews            int       `json:"interviews"`
	Offers                int       `json:"offers"`
	Hires                 int       `json:"hires"`
	ConversionRate        float64   `json:"conversionRate"`
	AvgTimeToReviewHours  float64   `json:"avgTimeToReviewHours"`
	AvgTimeToHireHours    float64   `json:"avgTimeToHireHours"`
}

// AuditEntry is one row of the company audit log.
type AuditEntry struct {
	ID           uuid.UUID      `json:"id"`
	ActorID      *uuid.UUID     `json:"actorId,omitempty"`
	ActorName    string         `json:"actorName,omitempty"`
	Action       string         `json:"action"`
	ResourceType string         `json:"resourceType"`
	ResourceID   *uuid.UUID     `json:"resourceId,omitempty"`
	Metadata     map[string]any `json:"metadata"`
	CreatedAt    time.Time      `json:"createdAt"`
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

// InsightSeverity ranks how much attention an insight deserves.
type InsightSeverity string

const (
	// InsightInfo is a neutral observation.
	InsightInfo InsightSeverity = "info"
	// InsightSuggestion is an improvement the company can act on.
	InsightSuggestion InsightSeverity = "suggestion"
	// InsightWarning marks something actively costing the company hires.
	InsightWarning InsightSeverity = "warning"
)

// CompanyInsight is one observation about a company's own hiring data.
//
// Evidence lists the figures the observation was computed from. Every insight
// must carry at least one, because an insight the company cannot trace back to
// its own numbers is indistinguishable from an invention.
type CompanyInsight struct {
	ID       string          `json:"id"`
	Category string          `json:"category"`
	Severity InsightSeverity `json:"severity"`
	Title    string          `json:"title"`
	Detail   string          `json:"detail"`
	Evidence []string        `json:"evidence"`
	Actions  []string        `json:"actions"`
}

// CompanyInsightsReport is the full set of insights for one company over a
// date range.
type CompanyInsightsReport struct {
	CompanyID   uuid.UUID        `json:"companyId"`
	GeneratedAt time.Time        `json:"generatedAt"`
	From        time.Time        `json:"from"`
	To          time.Time        `json:"to"`
	Summary     string           `json:"summary"`
	Insights    []CompanyInsight `json:"insights"`
	// SuggestedSkills are the skills the company's own open jobs ask for most
	// often. They are counted, never guessed.
	SuggestedSkills []string `json:"suggestedSkills"`
}

// CompanyCreatePayload registers a company. The creator becomes its owner and
// the company starts unverified.
type CompanyCreatePayload struct {
	Name         string `json:"name" binding:"required,min=2,max=255"`
	Slug         string `json:"slug" binding:"required,min=2,max=100"`
	Tagline      string `json:"tagline" binding:"max=255"`
	Description  string `json:"description"`
	Industry     string `json:"industry" binding:"required"`
	CompanyType  string `json:"companyType"`
	CompanySize  string `json:"companySize"`
	FoundedYear  int    `json:"foundedYear"`
	Headquarters string `json:"headquarters"`
	Website      string `json:"website" binding:"omitempty,url"`
	ContactEmail string `json:"contactEmail" binding:"omitempty,email"`
}

// CompanyUpdatePayload edits the profile. Every field is optional; a nil
// pointer leaves the stored value alone, which is what lets the settings page
// save one section at a time.
type CompanyUpdatePayload struct {
	Name               *string            `json:"name"`
	Tagline            *string            `json:"tagline"`
	Description        *string            `json:"description"`
	Industry           *string            `json:"industry"`
	CompanyType        *string            `json:"companyType"`
	CompanySize        *string            `json:"companySize"`
	FoundedYear        *int               `json:"foundedYear"`
	Headquarters       *string            `json:"headquarters"`
	Website            *string            `json:"website"`
	ContactEmail       *string            `json:"contactEmail"`
	ContactPhone       *string            `json:"contactPhone"`
	LogoURL            *string            `json:"logoUrl"`
	CoverURL           *string            `json:"coverUrl"`
	SocialLinks        *map[string]string `json:"socialLinks"`
	BrandAssets        *[]BrandAsset      `json:"brandAssets"`
	Specialties        *[]string          `json:"specialties"`
	Values             *[]string          `json:"values"`
	Benefits           *[]string          `json:"benefits"`
	Mission            *string            `json:"mission"`
	Vision             *string            `json:"vision"`
	History            *string            `json:"history"`
	WorkCulture        *string            `json:"workCulture"`
	CareerInfo         *string            `json:"careerInfo"`
	Products           *[]string          `json:"products"`
	Services           *[]string          `json:"services"`
	Industries         *[]string          `json:"industries"`
	Technology         *[]string          `json:"technology"`
	Awards             *[]string          `json:"awards"`
	Certifications     *[]string          `json:"certifications"`
	OperatingCountries *[]string          `json:"operatingCountries"`
	IsHiring           *bool              `json:"isHiring"`
}

// FollowPayload sets notification preferences when following.
type FollowPayload struct {
	NotifyUpdates *bool `json:"notifyUpdates"`
	NotifyJobs    *bool `json:"notifyJobs"`
}

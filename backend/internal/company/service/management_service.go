// Package service holds the company module's business rules. Every exported
// method takes an Actor and performs its own authorization: handlers decide
// which service call to make, never whether the caller is allowed to make it.
package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"
	"kirmya/internal/company/repository"
	notifmodels "kirmya/internal/notification/models"

	"github.com/google/uuid"
)

// Notifier is the slice of the notification module this module needs. Keeping
// it to one method means the company module cannot grow its own notification
// storage by accident.
type Notifier interface {
	Send(ctx context.Context, userID uuid.UUID, nType string, title string, content string) (*notifmodels.Notification, error)
}

// Notification types this module emits. They reuse the existing notifications
// table; nothing here stores a second copy of a user's alerts.
const (
	NotifyNewApplication      = "company_new_application"
	NotifyNewFollower         = "company_new_follower"
	NotifyJobExpiring         = "company_job_expiring"
	NotifyVerificationUpdate  = "company_verification_update"
	NotifyAssociationRequest  = "company_association_request"
	NotifyRecruiterInvitation = "company_recruiter_invitation"
	NotifyTeamInvitation      = "company_team_invitation"
	NotifyCompanyUpdate       = "company_update_published"
	NotifyMemberApproved      = "company_member_approved"
)

// ManagementService is the company and organization management service.
type ManagementService struct {
	repo     *repository.ManagementRepository
	base     *repository.CompanyRepository
	notifier Notifier
	// appBaseURL is where invitation links point. It comes from configuration
	// rather than the request host, so a forged Host header cannot redirect an
	// invitation link at an attacker's site.
	appBaseURL string
	// viewSalt keeps signed-out visitor identities out of the database in the
	// clear while still allowing unique-visitor counts.
	viewSalt string
}

// NewManagementService wires the service. notifier may be nil in deployments
// that run without the notification module; notifications are then skipped
// rather than failing the action that triggered them.
func NewManagementService(repo *repository.ManagementRepository, base *repository.CompanyRepository, notifier Notifier, appBaseURL, viewSalt string) *ManagementService {
	if appBaseURL == "" {
		appBaseURL = "https://kirmya.com"
	}
	return &ManagementService{
		repo:       repo,
		base:       base,
		notifier:   notifier,
		appBaseURL: strings.TrimRight(appBaseURL, "/"),
		viewSalt:   viewSalt,
	}
}

// Actor is the caller. It carries the platform identity from the JWT; the
// company-scoped authority is looked up per company and never cached on it.
type Actor struct {
	UserID       uuid.UUID
	Email        string
	PlatformRole string
	IP           string
	UserAgent    string
}

// IsAuthenticated reports whether a real user is attached to the request.
func (a Actor) IsAuthenticated() bool { return a.UserID != uuid.Nil }

// IsPlatformAdmin reports whether the caller is a Kirmya administrator. This is
// the only identity that may decide a verification, and it is deliberately
// separate from every company-scoped role: being the owner of a company grants
// nothing at the platform level.
func (a Actor) IsPlatformAdmin() bool {
	switch strings.ToLower(strings.TrimSpace(a.PlatformRole)) {
	case "admin", "super_admin", "platform_admin":
		return true
	}
	return false
}

// authorize resolves the caller's authority on a company and checks one
// permission.
//
// An unauthenticated caller gets ErrUnauthenticated so the client knows to log
// in. An authenticated caller with no grant gets ErrNotFound rather than
// ErrForbidden: "you may not touch this" and "this does not exist" look
// identical from outside, so company ids cannot be probed.
func (s *ManagementService) authorize(ctx context.Context, actor Actor, companyID uuid.UUID, perm domain.Permission) (domain.Grant, error) {
	if !actor.IsAuthenticated() {
		return domain.Grant{}, domain.ErrUnauthenticated
	}
	grant, err := s.repo.LoadGrant(ctx, companyID, actor.UserID)
	if err != nil {
		return domain.Grant{}, err
	}
	if !grant.Has(perm) {
		if len(grant.Roles) == 0 {
			return grant, domain.ErrNotFound
		}
		return grant, domain.ErrForbidden
	}
	return grant, nil
}

// grantFor loads the caller's authority without requiring anything of it, for
// the places that shape a response around what the viewer may see.
func (s *ManagementService) grantFor(ctx context.Context, actor Actor, companyID uuid.UUID) domain.Grant {
	if !actor.IsAuthenticated() {
		return domain.Grant{}
	}
	grant, err := s.repo.LoadGrant(ctx, companyID, actor.UserID)
	if err != nil {
		// A failed lookup must not become access. It becomes no access.
		log.Printf("company: grant lookup failed for company=%s user=%s: %v", companyID, actor.UserID, err)
		return domain.Grant{}
	}
	return grant
}

// audit records an action. A failed audit write is logged and swallowed: losing
// a log line is worse than nothing, but failing the user's action because the
// log line could not be written is worse still.
func (s *ManagementService) audit(ctx context.Context, actor Actor, companyID uuid.UUID, action, resourceType string, resourceID *uuid.UUID, metadata map[string]any) {
	var actorID *uuid.UUID
	if actor.IsAuthenticated() {
		id := actor.UserID
		actorID = &id
	}
	if err := s.repo.WriteAudit(ctx, companyID, actorID, action, resourceType, resourceID, metadata, actor.IP, actor.UserAgent); err != nil {
		log.Printf("company: audit write failed action=%s company=%s: %v", action, companyID, err)
	}
}

// notify sends one in-app notification, ignoring the absence of the
// notification module.
func (s *ManagementService) notify(ctx context.Context, userID uuid.UUID, nType, title, content string) {
	if s.notifier == nil || userID == uuid.Nil {
		return
	}
	if _, err := s.notifier.Send(ctx, userID, nType, title, content); err != nil {
		log.Printf("company: notification failed type=%s user=%s: %v", nType, userID, err)
	}
}

// ---------------------------------------------------------------------------
// Company profile
// ---------------------------------------------------------------------------

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

// Slugify turns a company name into a candidate handle.
func Slugify(value string) string {
	lower := strings.ToLower(strings.TrimSpace(value))
	var b strings.Builder
	lastDash := true
	for _, r := range lower {
		switch {
		case (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9'):
			b.WriteRune(r)
			lastDash = false
		case !lastDash:
			b.WriteRune('-')
			lastDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}

// CreateCompany registers a company owned by the caller.
//
// The company starts unverified with zero counters. Nothing about it is
// invented: an empty profile reports an empty profile.
func (s *ManagementService) CreateCompany(ctx context.Context, actor Actor, p models.CompanyCreatePayload) (*models.CompanyDetail, error) {
	if !actor.IsAuthenticated() {
		return nil, domain.ErrUnauthenticated
	}

	slug := Slugify(p.Slug)
	if slug == "" {
		slug = Slugify(p.Name)
	}
	if !slugPattern.MatchString(slug) || len(slug) < 2 || len(slug) > 100 {
		return nil, fmt.Errorf("%w: slug must be lowercase letters, numbers and hyphens", domain.ErrValidation)
	}
	taken, err := s.repo.SlugExists(ctx, slug)
	if err != nil {
		return nil, err
	}
	if taken {
		return nil, fmt.Errorf("%w: that company address is already in use", domain.ErrConflict)
	}

	companyID := uuid.New()
	company := &models.Company{ID: companyID, Name: strings.TrimSpace(p.Name), Handle: slug}
	profile := &models.CompanyProfile{
		CompanyID:   companyID,
		About:       strings.TrimSpace(p.Description),
		Industry:    strings.TrimSpace(p.Industry),
		CompanySize: strings.TrimSpace(p.CompanySize),
		Location:    strings.TrimSpace(p.Headquarters),
		Website:     strings.TrimSpace(p.Website),
		FoundedYear: p.FoundedYear,
	}
	member := &models.CompanyMember{
		ID:        uuid.New(),
		CompanyID: companyID,
		UserID:    actor.UserID,
		Role:      string(domain.RoleCompanyOwner),
	}

	if err := s.base.CreateCompany(ctx, company, profile, member); err != nil {
		return nil, err
	}

	// The fields the legacy create path does not cover are applied as an edit,
	// which also computes the profile completion score.
	tagline, companyType, contactEmail := p.Tagline, p.CompanyType, p.ContactEmail
	headquarters := p.Headquarters
	if err := s.repo.UpdateCompany(ctx, companyID, models.CompanyUpdatePayload{
		Tagline:      &tagline,
		CompanyType:  &companyType,
		Headquarters: &headquarters,
		ContactEmail: &contactEmail,
	}); err != nil {
		return nil, err
	}

	s.audit(ctx, actor, companyID, domain.AuditCompanyCreated, "company", &companyID, map[string]any{
		"name": company.Name, "slug": slug,
	})
	return s.repo.GetDetail(ctx, companyID, actor.UserID)
}

// GetCompanyBySlug loads a company's public page.
//
// It works for anonymous visitors. The viewer block is attached only for people
// who actually hold something on the company, so a public page never hints at
// what an administrator would be able to do.
func (s *ManagementService) GetCompanyBySlug(ctx context.Context, actor Actor, slug string) (*models.CompanyDetail, error) {
	companyID, err := s.repo.CompanyIDBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	return s.GetCompany(ctx, actor, companyID)
}

// GetCompany loads a company by id with the viewer's context attached.
func (s *ManagementService) GetCompany(ctx context.Context, actor Actor, companyID uuid.UUID) (*models.CompanyDetail, error) {
	detail, err := s.repo.GetDetail(ctx, companyID, actor.UserID)
	if err != nil {
		return nil, err
	}

	grant := s.grantFor(ctx, actor, companyID)
	if len(grant.Roles) > 0 || len(grant.Extra) > 0 {
		detail.Viewer = &models.ViewerContext{
			IsMember:    true,
			Roles:       grant.Roles,
			Permissions: effectivePermissions(grant),
			IsFollowing: detail.IsFollowing,
		}
	}

	// A suspended company keeps working for its own team so they can respond to
	// whatever caused the suspension, but it is invisible to everyone else.
	status, err := s.repo.CompanyStatus(ctx, companyID)
	if err != nil {
		return nil, err
	}
	if status != "active" && detail.Viewer == nil && !actor.IsPlatformAdmin() {
		return nil, domain.ErrNotFound
	}

	return detail, nil
}

// effectivePermissions flattens a grant into the permission list the frontend
// uses to decide which controls to render.
func effectivePermissions(grant domain.Grant) []domain.Permission {
	seen := map[domain.Permission]bool{}
	out := []domain.Permission{}
	for _, role := range grant.Roles {
		for _, perm := range role.Permissions() {
			if !seen[perm] {
				seen[perm] = true
				out = append(out, perm)
			}
		}
	}
	for _, perm := range grant.Extra {
		if !seen[perm] {
			seen[perm] = true
			out = append(out, perm)
		}
	}
	return out
}

// UpdateCompany edits the profile. Branding fields need branding:edit; the rest
// need company:edit, so a designer can be given the logo without the legal name.
func (s *ManagementService) UpdateCompany(ctx context.Context, actor Actor, companyID uuid.UUID, p models.CompanyUpdatePayload) (*models.CompanyDetail, error) {
	touchesBrandingOnly := onlyBrandingFields(p)
	perm := domain.PermCompanyEdit
	if touchesBrandingOnly {
		perm = domain.PermBrandingEdit
	}
	if _, err := s.authorize(ctx, actor, companyID, perm); err != nil {
		return nil, err
	}

	if p.Website != nil {
		if err := validateURL(*p.Website); err != nil {
			return nil, err
		}
	}
	if p.SocialLinks != nil {
		for name, link := range *p.SocialLinks {
			if strings.TrimSpace(link) == "" {
				continue
			}
			if err := validateURL(link); err != nil {
				return nil, fmt.Errorf("%w: %s link is not a valid URL", domain.ErrValidation, name)
			}
		}
	}
	if p.LogoURL != nil {
		if err := validateAssetURL(*p.LogoURL); err != nil {
			return nil, err
		}
	}
	if p.CoverURL != nil {
		if err := validateAssetURL(*p.CoverURL); err != nil {
			return nil, err
		}
	}

	if err := s.repo.UpdateCompany(ctx, companyID, p); err != nil {
		return nil, err
	}
	s.audit(ctx, actor, companyID, domain.AuditCompanyUpdated, "company", &companyID, map[string]any{
		"fields": changedFields(p),
	})
	return s.GetCompany(ctx, actor, companyID)
}

// onlyBrandingFields reports whether an edit touches nothing but the logo,
// cover, tagline and brand assets.
func onlyBrandingFields(p models.CompanyUpdatePayload) bool {
	brandingTouched := p.LogoURL != nil || p.CoverURL != nil || p.BrandAssets != nil || p.Tagline != nil
	if !brandingTouched {
		return false
	}
	others := []bool{
		p.Name != nil, p.Description != nil, p.Industry != nil, p.CompanyType != nil,
		p.CompanySize != nil, p.FoundedYear != nil, p.Headquarters != nil, p.Website != nil,
		p.ContactEmail != nil, p.ContactPhone != nil, p.SocialLinks != nil, p.Specialties != nil,
		p.Values != nil, p.Benefits != nil, p.Mission != nil, p.Vision != nil, p.History != nil,
		p.WorkCulture != nil, p.CareerInfo != nil, p.Products != nil, p.Services != nil,
		p.Industries != nil, p.Technology != nil, p.Awards != nil, p.Certifications != nil,
		p.OperatingCountries != nil, p.IsHiring != nil,
	}
	for _, touched := range others {
		if touched {
			return false
		}
	}
	return true
}

// changedFields lists which parts of the profile an edit touched, for the audit
// entry. The values themselves are not logged: the audit log is read by more
// people than the profile editor is.
func changedFields(p models.CompanyUpdatePayload) []string {
	fields := map[string]bool{
		"name": p.Name != nil, "tagline": p.Tagline != nil, "description": p.Description != nil,
		"industry": p.Industry != nil, "companyType": p.CompanyType != nil,
		"companySize": p.CompanySize != nil, "foundedYear": p.FoundedYear != nil,
		"headquarters": p.Headquarters != nil, "website": p.Website != nil,
		"contactEmail": p.ContactEmail != nil, "contactPhone": p.ContactPhone != nil,
		"logo": p.LogoURL != nil, "cover": p.CoverURL != nil, "socialLinks": p.SocialLinks != nil,
		"brandAssets": p.BrandAssets != nil, "specialties": p.Specialties != nil,
		"values": p.Values != nil, "benefits": p.Benefits != nil, "mission": p.Mission != nil,
		"vision": p.Vision != nil, "history": p.History != nil, "workCulture": p.WorkCulture != nil,
		"careerInfo": p.CareerInfo != nil, "products": p.Products != nil,
		"services": p.Services != nil, "industries": p.Industries != nil,
		"technology": p.Technology != nil, "awards": p.Awards != nil,
		"certifications": p.Certifications != nil, "operatingCountries": p.OperatingCountries != nil,
		"isHiring": p.IsHiring != nil,
	}
	out := []string{}
	for name, touched := range fields {
		if touched {
			out = append(out, name)
		}
	}
	return out
}

// validateURL rejects anything that is not an http(s) address. Without this a
// profile link is a javascript: payload waiting for a click.
func validateURL(value string) error {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	lower := strings.ToLower(trimmed)
	if !strings.HasPrefix(lower, "http://") && !strings.HasPrefix(lower, "https://") {
		return fmt.Errorf("%w: links must start with http:// or https://", domain.ErrValidation)
	}
	if len(trimmed) > 500 {
		return fmt.Errorf("%w: link is too long", domain.ErrValidation)
	}
	return nil
}

// validateAssetURL applies the same rule to uploaded images, and additionally
// requires an image extension so a document cannot be set as a logo.
func validateAssetURL(value string) error {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	if err := validateURL(trimmed); err != nil {
		return err
	}
	lower := strings.ToLower(trimmed)
	if idx := strings.IndexAny(lower, "?#"); idx >= 0 {
		lower = lower[:idx]
	}
	for _, ext := range []string{".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"} {
		if strings.HasSuffix(lower, ext) {
			return nil
		}
	}
	return fmt.Errorf("%w: images must be PNG, JPEG, WebP, GIF or SVG", domain.ErrValidation)
}

// ---------------------------------------------------------------------------
// Search, directory, discovery, following
// ---------------------------------------------------------------------------

// SearchCompanies runs the public company search.
func (s *ManagementService) SearchCompanies(ctx context.Context, actor Actor, q models.CompanySearchQuery) (*models.CompanyListPage, error) {
	return s.repo.SearchCompanies(ctx, q, actor.UserID)
}

// Discovery returns the curated shelves.
func (s *ManagementService) Discovery(ctx context.Context, actor Actor, limit int) (*models.CompanyDiscovery, error) {
	return s.repo.Discovery(ctx, actor.UserID, limit)
}

// FollowCompany records a follow and tells the company about the new follower.
func (s *ManagementService) FollowCompany(ctx context.Context, actor Actor, companyID uuid.UUID, p models.FollowPayload) error {
	if !actor.IsAuthenticated() {
		return domain.ErrUnauthenticated
	}
	if _, err := s.repo.GetDetail(ctx, companyID, uuid.Nil); err != nil {
		return err
	}

	notifyUpdates, notifyJobs := true, true
	if p.NotifyUpdates != nil {
		notifyUpdates = *p.NotifyUpdates
	}
	if p.NotifyJobs != nil {
		notifyJobs = *p.NotifyJobs
	}
	already, err := s.repo.IsFollowing(ctx, companyID, actor.UserID)
	if err != nil {
		return err
	}
	if err := s.repo.Follow(ctx, companyID, actor.UserID, notifyUpdates, notifyJobs); err != nil {
		return err
	}
	if !already {
		s.notifyCompanyAdmins(ctx, companyID, NotifyNewFollower, "New follower",
			"Someone started following your company page.")
	}
	return nil
}

// UnfollowCompany removes the follow edge.
func (s *ManagementService) UnfollowCompany(ctx context.Context, actor Actor, companyID uuid.UUID) error {
	if !actor.IsAuthenticated() {
		return domain.ErrUnauthenticated
	}
	return s.repo.Unfollow(ctx, companyID, actor.UserID)
}

// ListFollowing returns the companies the caller follows.
func (s *ManagementService) ListFollowing(ctx context.Context, actor Actor, page, limit int) (*models.CompanyListPage, error) {
	if !actor.IsAuthenticated() {
		return nil, domain.ErrUnauthenticated
	}
	return s.repo.ListFollowed(ctx, actor.UserID, page, limit)
}

// ListMyCompanies returns the companies the caller has standing in, each with
// the roles and effective permissions that standing carries.
//
// A company the caller can no longer act on is dropped rather than returned
// with an empty permission list, so the switcher only ever offers a dashboard
// the caller can actually open.
func (s *ManagementService) ListMyCompanies(ctx context.Context, actor Actor) ([]models.CompanyMembership, error) {
	if !actor.IsAuthenticated() {
		return nil, domain.ErrUnauthenticated
	}

	companies, err := s.repo.ListMemberCompanies(ctx, actor.UserID)
	if err != nil {
		return nil, err
	}

	out := make([]models.CompanyMembership, 0, len(companies))
	for _, company := range companies {
		grant := s.grantFor(ctx, actor, company.ID)
		if len(grant.Roles) == 0 && len(grant.Extra) == 0 {
			continue
		}
		out = append(out, models.CompanyMembership{
			Company:     company,
			Roles:       grant.Roles,
			Permissions: effectivePermissions(grant),
		})
	}
	return out, nil
}

// RecordProfileView logs a page view for analytics. Members viewing their own
// company are not counted, so the dashboard does not measure the team.
func (s *ManagementService) RecordProfileView(ctx context.Context, actor Actor, companyID uuid.UUID, clientKey, source string) {
	if actor.IsAuthenticated() {
		grant := s.grantFor(ctx, actor, companyID)
		if len(grant.Roles) > 0 {
			return
		}
	}
	var hash string
	if !actor.IsAuthenticated() && clientKey != "" {
		sum := sha256.Sum256([]byte(s.viewSalt + "|" + clientKey))
		hash = hex.EncodeToString(sum[:])
	}
	if err := s.repo.RecordProfileView(ctx, companyID, actor.UserID, hash, source); err != nil {
		log.Printf("company: profile view not recorded for %s: %v", companyID, err)
	}
}

// notifyCompanyAdmins sends one notification to everyone who can act on it.
func (s *ManagementService) notifyCompanyAdmins(ctx context.Context, companyID uuid.UUID, nType, title, content string) {
	if s.notifier == nil {
		return
	}
	people, err := s.repo.ListPeople(ctx, companyID, models.PeopleQuery{Limit: maxAdminFanout}, true)
	if err != nil {
		log.Printf("company: admin notification lookup failed for %s: %v", companyID, err)
		return
	}
	for _, person := range people.Items {
		if person.Status != domain.MembershipApproved {
			continue
		}
		if !person.Role.Has(domain.PermTeamManage) {
			continue
		}
		s.notify(ctx, person.UserID, nType, title, content)
	}
}

// maxAdminFanout caps how many members one notification can reach, so a large
// company does not turn a single follow into thousands of writes.
const maxAdminFanout = 100

// ---------------------------------------------------------------------------
// People and team
// ---------------------------------------------------------------------------

// GetPeople returns a company's people.
//
// The privacy switch is the caller's team:view permission. Without it the
// caller is a member of the public and sees only the people who chose to make
// their association visible.
func (s *ManagementService) GetPeople(ctx context.Context, actor Actor, companyID uuid.UUID, q models.PeopleQuery) (*models.CompanyPeoplePage, error) {
	grant := s.grantFor(ctx, actor, companyID)
	includePrivate := grant.Has(domain.PermTeamView)
	if !includePrivate {
		// Public callers cannot filter by status or role; those exist to
		// administer the team, and answering them would leak the team.
		q.Status = ""
		q.Role = ""
	}
	if includePrivate {
		s.audit(ctx, actor, companyID, domain.AuditSensitiveDataAccessed, "people", nil, map[string]any{
			"scope": "team_directory",
		})
	}
	return s.repo.ListPeople(ctx, companyID, q, includePrivate)
}

// GetTeam returns the internal team list. Unlike GetPeople it is never public:
// a caller without team:view is refused rather than being quietly downgraded to
// the public view, because the dashboard needs to know it cannot show this.
func (s *ManagementService) GetTeam(ctx context.Context, actor Actor, companyID uuid.UUID, q models.PeopleQuery) (*models.CompanyPeoplePage, error) {
	grant, err := s.authorize(ctx, actor, companyID, domain.PermTeamView)
	if err != nil {
		return nil, err
	}
	s.audit(ctx, actor, companyID, domain.AuditSensitiveDataAccessed, "team", nil, map[string]any{
		"scope": "team_management",
	})
	page, err := s.repo.ListPeople(ctx, companyID, q, true)
	if err != nil {
		return nil, err
	}
	if err := s.attachExtraPermissions(ctx, grant, companyID, page); err != nil {
		return nil, err
	}
	return page, nil
}

// attachExtraPermissions fills in each member's individually granted extras,
// but only for a caller who may edit them.
//
// Everyone else gets the field omitted rather than empty: who has been handed
// which extra authority is an administrative detail, and team:view alone is not
// a reason to see it. The permissions editor needs it because the write
// replaces the whole list.
func (s *ManagementService) attachExtraPermissions(ctx context.Context, grant domain.Grant, companyID uuid.UUID, page *models.CompanyPeoplePage) error {
	if page == nil || len(page.Items) == 0 || !grant.Has(domain.PermPermissionEdit) {
		return nil
	}
	ids := make([]uuid.UUID, 0, len(page.Items))
	for _, item := range page.Items {
		ids = append(ids, item.ID)
	}
	extras, err := s.repo.LoadExtraPermissions(ctx, companyID, ids)
	if err != nil {
		return err
	}
	for i := range page.Items {
		page.Items[i].ExtraPermissions = extras[page.Items[i].ID]
	}
	return nil
}

// CompanyIDBySlug resolves a public company handle to its id.
func (s *ManagementService) CompanyIDBySlug(ctx context.Context, slug string) (uuid.UUID, error) {
	return s.repo.CompanyIDBySlug(ctx, slug)
}

// RoleDescriptor describes one org role for the permissions settings screen.
type RoleDescriptor struct {
	Role        domain.Role         `json:"role"`
	Rank        int                 `json:"rank"`
	Permissions []domain.Permission `json:"permissions"`
}

// PermissionCatalog returns the role and permission vocabulary. The settings UI
// renders from this rather than from its own copy, so the checkboxes a user
// sees can never claim an authority the server does not recognise.
func (s *ManagementService) PermissionCatalog() []RoleDescriptor {
	roles := domain.AllRoles()
	out := make([]RoleDescriptor, 0, len(roles))
	for _, role := range roles {
		out = append(out, RoleDescriptor{
			Role:        role,
			Rank:        role.Rank(),
			Permissions: role.Permissions(),
		})
	}
	return out
}

// ListDepartments returns the company's departments.
func (s *ManagementService) ListDepartments(ctx context.Context, actor Actor, companyID uuid.UUID) ([]models.CompanyDepartment, error) {
	return s.repo.ListDepartments(ctx, companyID)
}

// RequestAssociation lets a user ask to be listed as working at a company. The
// request is always pending: nobody joins a company by asserting that they do.
func (s *ManagementService) RequestAssociation(ctx context.Context, actor Actor, companyID uuid.UUID, p models.AssociationRequestPayload) (*models.CompanyPerson, error) {
	if !actor.IsAuthenticated() {
		return nil, domain.ErrUnauthenticated
	}
	if _, err := s.repo.GetDetail(ctx, companyID, uuid.Nil); err != nil {
		return nil, err
	}
	if p.DepartmentID != nil {
		ok, err := s.repo.DepartmentBelongsTo(ctx, companyID, *p.DepartmentID)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, fmt.Errorf("%w: unknown department", domain.ErrValidation)
		}
	}

	person, err := s.repo.RequestAssociation(ctx, companyID, actor.UserID, p)
	if err != nil {
		return nil, err
	}
	s.notifyCompanyAdmins(ctx, companyID, NotifyAssociationRequest,
		"Employee association request",
		"Someone asked to be listed as working at your company.")
	return person, nil
}

// DecideAssociation approves or rejects a pending employee association.
func (s *ManagementService) DecideAssociation(ctx context.Context, actor Actor, companyID, memberID uuid.UUID, approve bool) error {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermPeopleApprove); err != nil {
		return err
	}
	member, err := s.repo.GetMember(ctx, companyID, memberID)
	if err != nil {
		return err
	}
	status := domain.MembershipRejected
	action := domain.AuditEmployeeRemoved
	if approve {
		status = domain.MembershipApproved
		action = domain.AuditEmployeeAdded
	}
	if err := s.repo.DecideAssociation(ctx, companyID, memberID, actor.UserID, status); err != nil {
		return err
	}
	s.audit(ctx, actor, companyID, action, "member", &memberID, map[string]any{"approved": approve})
	if approve {
		s.notify(ctx, member.UserID, NotifyMemberApproved, "Company association approved",
			"Your association with the company has been approved.")
	}
	return nil
}

// InviteMember invites someone to join the company in a given role.
//
// The role is checked against the inviter's own: nobody can invite at or above
// their own level, which is what stops a recruiter admin from minting an owner.
// The returned accept URL carries the only copy of the token.
func (s *ManagementService) InviteMember(ctx context.Context, actor Actor, companyID uuid.UUID, p models.TeamInvitePayload) (*models.InvitationIssued, error) {
	role, ok := domain.ParseRole(p.Role)
	if !ok {
		return nil, fmt.Errorf("%w: unknown role %q", domain.ErrValidation, p.Role)
	}

	// Recruiting roles are governed by recruiter:invite so a recruiter admin can
	// run their own team without holding the company's general team permission.
	perm := domain.PermTeamInvite
	if role == domain.RoleRecruiter || role == domain.RoleRecruiterAdmin {
		perm = domain.PermRecruiterInvite
	}
	grant, err := s.authorize(ctx, actor, companyID, perm)
	if err != nil {
		return nil, err
	}
	if !grant.CanAssign(role) {
		return nil, fmt.Errorf("%w: you cannot grant the %s role", domain.ErrForbidden, role)
	}

	association := domain.AssociationCurrentEmployee
	if p.AssociationType != "" {
		parsed, ok := domain.ParseAssociationType(p.AssociationType)
		if !ok {
			return nil, fmt.Errorf("%w: unknown association type", domain.ErrValidation)
		}
		association = parsed
	} else if role == domain.RoleRecruiter || role == domain.RoleRecruiterAdmin {
		association = domain.AssociationRecruiter
	} else if role == domain.RoleHiringManager {
		association = domain.AssociationHiringManager
	}

	channel := domain.InvitationChannelEmail
	if p.Channel != "" {
		parsed, ok := domain.ParseInvitationChannel(p.Channel)
		if !ok {
			return nil, fmt.Errorf("%w: unknown invitation channel", domain.ErrValidation)
		}
		channel = parsed
	}

	if p.DepartmentID != nil {
		ok, err := s.repo.DepartmentBelongsTo(ctx, companyID, *p.DepartmentID)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, fmt.Errorf("%w: unknown department", domain.ErrValidation)
		}
	}

	plaintext, hash, err := domain.NewInvitationToken()
	if err != nil {
		return nil, err
	}
	expiresAt := time.Now().UTC().Add(domain.InvitationTTL)

	invitation, err := s.repo.CreateInvitation(ctx, companyID, actor.UserID,
		strings.TrimSpace(p.Email), role, association, channel,
		p.JobTitle, p.Message, p.DepartmentID, hash, expiresAt)
	if err != nil {
		return nil, err
	}

	action := domain.AuditRecruiterInvited
	if perm == domain.PermTeamInvite {
		action = domain.AuditEmployeeAdded
	}
	s.audit(ctx, actor, companyID, action, "invitation", &invitation.ID, map[string]any{
		"role": string(role), "channel": string(channel),
	})

	// If the address already belongs to a Kirmya account, tell them in-app as
	// well. The link itself is never put in a notification body — it travels
	// over the channel the inviter chose, and the in-app message only says an
	// invitation is waiting.
	if invitation.InvitedUserID != nil {
		nType := NotifyTeamInvitation
		title := "You have been invited to join a company"
		if role == domain.RoleRecruiter || role == domain.RoleRecruiterAdmin {
			nType = NotifyRecruiterInvitation
			title = "You have been invited to recruit for a company"
		}
		s.notify(ctx, *invitation.InvitedUserID, nType, title,
			fmt.Sprintf("You have been invited as %s. The invitation expires on %s.",
				role, expiresAt.Format("2 January 2006")))
	}

	return &models.InvitationIssued{
		Invitation: *invitation,
		AcceptURL:  fmt.Sprintf("%s/company/invitations/accept?token=%s", s.appBaseURL, plaintext),
	}, nil
}

// ListInvitations returns the company's invitations.
func (s *ManagementService) ListInvitations(ctx context.Context, actor Actor, companyID uuid.UUID, status string) ([]models.CompanyInvitation, error) {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermTeamView); err != nil {
		return nil, err
	}
	if err := s.repo.ExpireStaleInvitations(ctx, companyID); err != nil {
		return nil, err
	}
	return s.repo.ListInvitations(ctx, companyID, status)
}

// RevokeInvitation cancels an outstanding invitation.
func (s *ManagementService) RevokeInvitation(ctx context.Context, actor Actor, companyID, invitationID uuid.UUID) error {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermTeamInvite); err != nil {
		return err
	}
	if err := s.repo.RevokeInvitation(ctx, companyID, invitationID, actor.UserID); err != nil {
		return err
	}
	s.audit(ctx, actor, companyID, domain.AuditPermissionChanged, "invitation", &invitationID, map[string]any{
		"action": "revoked",
	})
	return nil
}

// PreviewInvitation resolves a token so the accept screen can name the company
// before the user commits. It returns nothing that a stranger with the token
// could not already infer from the invitation email.
func (s *ManagementService) PreviewInvitation(ctx context.Context, token string) (*models.CompanyInvitation, *models.CompanySummary, error) {
	invitation, err := s.repo.InvitationByToken(ctx, token)
	if err != nil {
		return nil, nil, err
	}
	detail, err := s.repo.GetDetail(ctx, invitation.CompanyID, uuid.Nil)
	if err != nil {
		return nil, nil, err
	}
	summary := detail.CompanySummary
	return invitation, &summary, nil
}

// AcceptInvitation redeems a token and creates the membership.
//
// The signed-in account must match the address the invitation was sent to.
// Without that check, a leaked link would let whoever found it join the company.
func (s *ManagementService) AcceptInvitation(ctx context.Context, actor Actor, token string) (uuid.UUID, error) {
	if !actor.IsAuthenticated() {
		return uuid.Nil, domain.ErrUnauthenticated
	}
	invitation, err := s.repo.InvitationByToken(ctx, token)
	if err != nil {
		return uuid.Nil, err
	}
	switch invitation.Status {
	case domain.InvitationPending:
	case domain.InvitationExpired:
		return uuid.Nil, fmt.Errorf("%w: this invitation has expired", domain.ErrConflict)
	default:
		return uuid.Nil, fmt.Errorf("%w: this invitation is no longer valid", domain.ErrConflict)
	}
	if !strings.EqualFold(strings.TrimSpace(actor.Email), strings.TrimSpace(invitation.Email)) {
		return uuid.Nil, fmt.Errorf("%w: this invitation was sent to a different address", domain.ErrForbidden)
	}

	companyID, err := s.repo.AcceptInvitation(ctx, invitation.ID, actor.UserID)
	if err != nil {
		return uuid.Nil, err
	}
	s.audit(ctx, actor, companyID, domain.AuditEmployeeAdded, "invitation", &invitation.ID, map[string]any{
		"role": string(invitation.Role),
	})
	return companyID, nil
}

// DeclineInvitation turns down an invitation.
func (s *ManagementService) DeclineInvitation(ctx context.Context, actor Actor, token string) error {
	if !actor.IsAuthenticated() {
		return domain.ErrUnauthenticated
	}
	invitation, err := s.repo.InvitationByToken(ctx, token)
	if err != nil {
		return err
	}
	if !strings.EqualFold(strings.TrimSpace(actor.Email), strings.TrimSpace(invitation.Email)) {
		return domain.ErrForbidden
	}
	return s.repo.DeclineInvitation(ctx, invitation.ID)
}

// UpdateTeamMember changes a member's role, status, title or department.
//
// Three rules are enforced here and nowhere else: you cannot grant a role at or
// above your own, you cannot edit somebody who outranks you, and the last owner
// cannot be demoted or suspended.
func (s *ManagementService) UpdateTeamMember(ctx context.Context, actor Actor, companyID, memberID uuid.UUID, p models.TeamMemberUpdatePayload) error {
	grant, err := s.authorize(ctx, actor, companyID, domain.PermTeamManage)
	if err != nil {
		return err
	}
	target, err := s.repo.GetMember(ctx, companyID, memberID)
	if err != nil {
		return err
	}

	actorRole, ok := grant.HighestRole()
	if !ok {
		return domain.ErrForbidden
	}
	if target.UserID != actor.UserID && target.Role.Rank() <= actorRole.Rank() && actorRole != domain.RoleCompanyOwner {
		return fmt.Errorf("%w: you cannot manage a member at or above your own level", domain.ErrForbidden)
	}

	var newRole *domain.Role
	if strings.TrimSpace(p.Role) != "" {
		parsed, ok := domain.ParseRole(p.Role)
		if !ok {
			return fmt.Errorf("%w: unknown role %q", domain.ErrValidation, p.Role)
		}
		if !grant.CanAssign(parsed) {
			return fmt.Errorf("%w: you cannot grant the %s role", domain.ErrForbidden, parsed)
		}
		newRole = &parsed
	}

	var newStatus *domain.MembershipStatus
	if strings.TrimSpace(p.Status) != "" {
		parsed, ok := domain.ParseMembershipStatus(p.Status)
		if !ok {
			return fmt.Errorf("%w: unknown status %q", domain.ErrValidation, p.Status)
		}
		newStatus = &parsed
	}

	// Losing the last owner would leave the company unadministrable.
	demotingOwner := target.Role == domain.RoleCompanyOwner &&
		((newRole != nil && *newRole != domain.RoleCompanyOwner) ||
			(newStatus != nil && !newStatus.GrantsAccess()))
	if demotingOwner {
		owners, err := s.repo.OwnerCount(ctx, companyID)
		if err != nil {
			return err
		}
		if owners <= 1 {
			return fmt.Errorf("%w: a company must keep at least one owner", domain.ErrConflict)
		}
	}

	var jobTitle *string
	if strings.TrimSpace(p.JobTitle) != "" {
		title := strings.TrimSpace(p.JobTitle)
		jobTitle = &title
	}
	if p.DepartmentID != nil {
		ok, err := s.repo.DepartmentBelongsTo(ctx, companyID, *p.DepartmentID)
		if err != nil {
			return err
		}
		if !ok {
			return fmt.Errorf("%w: unknown department", domain.ErrValidation)
		}
	}

	if err := s.repo.UpdateMember(ctx, companyID, memberID, actor.UserID, newRole, newStatus, jobTitle, p.DepartmentID, false); err != nil {
		return err
	}
	s.audit(ctx, actor, companyID, domain.AuditPermissionChanged, "member", &memberID, map[string]any{
		"role": p.Role, "status": p.Status,
	})
	return nil
}

// RemoveTeamMember revokes someone's access to a company.
func (s *ManagementService) RemoveTeamMember(ctx context.Context, actor Actor, companyID, memberID uuid.UUID) error {
	grant, err := s.authorize(ctx, actor, companyID, domain.PermTeamManage)
	if err != nil {
		return err
	}
	target, err := s.repo.GetMember(ctx, companyID, memberID)
	if err != nil {
		return err
	}
	actorRole, ok := grant.HighestRole()
	if !ok {
		return domain.ErrForbidden
	}
	if target.Role.Rank() <= actorRole.Rank() && actorRole != domain.RoleCompanyOwner {
		return fmt.Errorf("%w: you cannot remove a member at or above your own level", domain.ErrForbidden)
	}
	if target.Role == domain.RoleCompanyOwner {
		owners, err := s.repo.OwnerCount(ctx, companyID)
		if err != nil {
			return err
		}
		if owners <= 1 {
			return fmt.Errorf("%w: a company must keep at least one owner", domain.ErrConflict)
		}
	}

	if err := s.repo.RemoveMember(ctx, companyID, memberID); err != nil {
		return err
	}
	s.audit(ctx, actor, companyID, domain.AuditEmployeeRemoved, "member", &memberID, map[string]any{
		"role": string(target.Role),
	})
	return nil
}

// SetMemberPermissions replaces a member's individually granted extras.
func (s *ManagementService) SetMemberPermissions(ctx context.Context, actor Actor, companyID, memberID uuid.UUID, requested []string) error {
	grant, err := s.authorize(ctx, actor, companyID, domain.PermPermissionEdit)
	if err != nil {
		return err
	}

	perms := make([]domain.Permission, 0, len(requested))
	for _, raw := range requested {
		perm := domain.Permission(strings.TrimSpace(raw))
		if perm == "" {
			continue
		}
		// You cannot hand out a permission you do not hold yourself. Otherwise
		// "edit permissions" would quietly be "grant yourself anything".
		if !grant.Has(perm) {
			return fmt.Errorf("%w: you do not hold %s", domain.ErrForbidden, perm)
		}
		perms = append(perms, perm)
	}

	if err := s.repo.SetExtraPermissions(ctx, companyID, memberID, actor.UserID, perms); err != nil {
		return err
	}
	s.audit(ctx, actor, companyID, domain.AuditPermissionChanged, "member", &memberID, map[string]any{
		"permissions": requested,
	})
	return nil
}

// GetRecruiters returns the company's recruiting team. It reads the same
// membership rows as the team list, filtered to recruiting roles, so recruiters
// are not tracked in two places.
func (s *ManagementService) GetRecruiters(ctx context.Context, actor Actor, companyID uuid.UUID, q models.PeopleQuery) (*models.CompanyPeoplePage, error) {
	grant, err := s.authorize(ctx, actor, companyID, domain.PermRecruiterView)
	if err != nil {
		return nil, err
	}

	recruiterRoles := []domain.Role{domain.RoleRecruiterAdmin, domain.RoleRecruiter, domain.RoleHiringManager}
	if strings.TrimSpace(q.Role) != "" {
		parsed, ok := domain.ParseRole(q.Role)
		if !ok {
			return nil, domain.ErrValidation
		}
		isRecruiting := false
		for _, allowed := range recruiterRoles {
			if allowed == parsed {
				isRecruiting = true
			}
		}
		if !isRecruiting {
			return nil, fmt.Errorf("%w: %s is not a recruiting role", domain.ErrValidation, parsed)
		}
		page, err := s.repo.ListPeople(ctx, companyID, q, true)
		if err != nil {
			return nil, err
		}
		if err := s.attachExtraPermissions(ctx, grant, companyID, page); err != nil {
			return nil, err
		}
		return page, nil
	}

	// No single-role filter: fetch each recruiting role and merge.
	merged := &models.CompanyPeoplePage{Items: []models.CompanyPerson{}, Page: 1, Limit: maxAdminFanout}
	for _, role := range recruiterRoles {
		roleQuery := q
		roleQuery.Role = string(role)
		roleQuery.Page = 1
		roleQuery.Limit = maxAdminFanout
		page, err := s.repo.ListPeople(ctx, companyID, roleQuery, true)
		if err != nil {
			return nil, err
		}
		merged.Items = append(merged.Items, page.Items...)
		merged.Total += page.Total
	}
	merged.TotalPages = 1
	if err := s.attachExtraPermissions(ctx, grant, companyID, merged); err != nil {
		return nil, err
	}
	return merged, nil
}

// RemoveRecruiter revokes a recruiter's access. It delegates to the same
// membership removal the team page uses, after checking that the target is in
// fact a recruiter, so this endpoint cannot be used to remove an owner.
func (s *ManagementService) RemoveRecruiter(ctx context.Context, actor Actor, companyID, memberID uuid.UUID) error {
	grant, err := s.authorize(ctx, actor, companyID, domain.PermRecruiterManage)
	if err != nil {
		return err
	}
	target, err := s.repo.GetMember(ctx, companyID, memberID)
	if err != nil {
		return err
	}
	switch target.Role {
	case domain.RoleRecruiter, domain.RoleRecruiterAdmin, domain.RoleHiringManager:
	default:
		return fmt.Errorf("%w: that member is not a recruiter", domain.ErrValidation)
	}
	actorRole, ok := grant.HighestRole()
	if !ok {
		return domain.ErrForbidden
	}
	if target.Role.Rank() <= actorRole.Rank() && actorRole != domain.RoleCompanyOwner {
		return fmt.Errorf("%w: you cannot remove a member at or above your own level", domain.ErrForbidden)
	}

	if err := s.repo.RemoveMember(ctx, companyID, memberID); err != nil {
		return err
	}
	s.audit(ctx, actor, companyID, domain.AuditRecruiterRemoved, "member", &memberID, map[string]any{
		"role": string(target.Role),
	})
	return nil
}

// SuspendRecruiter parks a recruiter's access without deleting the record.
func (s *ManagementService) SuspendRecruiter(ctx context.Context, actor Actor, companyID, memberID uuid.UUID, suspend bool) error {
	status := domain.MembershipApproved
	if suspend {
		status = domain.MembershipSuspended
	}
	return s.UpdateTeamMember(ctx, actor, companyID, memberID, models.TeamMemberUpdatePayload{
		Status: string(status),
	})
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

// GetVerification returns the company's verification state.
func (s *ManagementService) GetVerification(ctx context.Context, actor Actor, companyID uuid.UUID) (*models.CompanyVerification, error) {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermVerificationView); err != nil {
		return nil, err
	}
	s.audit(ctx, actor, companyID, domain.AuditSensitiveDataAccessed, "verification", nil, map[string]any{
		"scope": "verification_documents",
	})
	return s.repo.LatestVerification(ctx, companyID)
}

// SubmitVerification opens a verification review.
//
// It can only ever produce the pending state. Approval requires a platform
// administrator, and there is no argument to this method that changes that.
func (s *ManagementService) SubmitVerification(ctx context.Context, actor Actor, companyID uuid.UUID, p models.VerificationSubmitPayload) (*models.CompanyVerification, error) {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermVerificationSubmit); err != nil {
		return nil, err
	}
	if len(p.Documents) == 0 {
		return nil, fmt.Errorf("%w: at least one supporting document is required", domain.ErrValidation)
	}
	for _, doc := range p.Documents {
		if err := validateDocument(doc); err != nil {
			return nil, err
		}
	}

	verification, err := s.repo.SubmitVerification(ctx, companyID, actor.UserID, p)
	if err != nil {
		return nil, err
	}
	s.audit(ctx, actor, companyID, domain.AuditVerificationSubmitted, "verification", &verification.ID, map[string]any{
		"documents": len(p.Documents),
	})
	return verification, nil
}

// allowedDocumentTypes are the proofs a verification review accepts.
var allowedDocumentTypes = map[string]bool{
	"registration_certificate": true,
	"tax_document":             true,
	"domain_proof":             true,
	"identity":                 true,
	"other":                    true,
}

// allowedDocumentMIME are the file types accepted for verification documents.
// Anything else is refused at submission rather than being stored and served
// back to a reviewer later.
var allowedDocumentMIME = map[string]bool{
	"application/pdf": true,
	"image/png":       true,
	"image/jpeg":      true,
	"image/webp":      true,
}

// maxDocumentBytes caps a verification document at 10 MB.
const maxDocumentBytes = 10 << 20

func validateDocument(doc models.VerificationDocument) error {
	if !allowedDocumentTypes[strings.ToLower(strings.TrimSpace(doc.DocumentType))] {
		return fmt.Errorf("%w: unsupported document type %q", domain.ErrValidation, doc.DocumentType)
	}
	if !allowedDocumentMIME[strings.ToLower(strings.TrimSpace(doc.MimeType))] {
		return fmt.Errorf("%w: documents must be PDF, PNG, JPEG or WebP", domain.ErrValidation)
	}
	if doc.FileSize <= 0 || doc.FileSize > maxDocumentBytes {
		return fmt.Errorf("%w: documents must be between 1 byte and 10 MB", domain.ErrValidation)
	}
	if err := validateURL(doc.FileURL); err != nil {
		return err
	}
	return nil
}

// DecideVerification records a platform administrator's ruling.
//
// The platform-admin check is the whole point of this method: a company owner
// calling it gets ErrForbidden no matter what role they hold on the company.
func (s *ManagementService) DecideVerification(ctx context.Context, actor Actor, verificationID uuid.UUID, p models.VerificationDecisionPayload) error {
	if !actor.IsAuthenticated() {
		return domain.ErrUnauthenticated
	}
	if !actor.IsPlatformAdmin() {
		return fmt.Errorf("%w: verification decisions are made by Kirmya administrators", domain.ErrForbidden)
	}
	status, ok := domain.ParseVerificationStatus(p.Status)
	if !ok || !domain.IsAdminDecision(status) {
		return fmt.Errorf("%w: decision must be 'verified' or 'rejected'", domain.ErrValidation)
	}
	if status == domain.VerificationRejected && strings.TrimSpace(p.RejectionReason) == "" {
		return fmt.Errorf("%w: a rejection needs a reason", domain.ErrValidation)
	}

	companyID, err := s.repo.DecideVerification(ctx, verificationID, actor.UserID, status, p.RejectionReason)
	if err != nil {
		return err
	}

	action := domain.AuditVerificationApproved
	message := "Your company has been verified."
	if status == domain.VerificationRejected {
		action = domain.AuditVerificationRejected
		message = "Your company verification was not approved: " + strings.TrimSpace(p.RejectionReason)
	}
	s.audit(ctx, actor, companyID, action, "verification", &verificationID, map[string]any{
		"status": string(status),
	})
	s.notifyCompanyAdmins(ctx, companyID, NotifyVerificationUpdate, "Verification update", message)
	return nil
}

// ListPendingVerifications is the administrator review queue.
func (s *ManagementService) ListPendingVerifications(ctx context.Context, actor Actor, page, limit int) ([]models.CompanyVerification, int, error) {
	if !actor.IsAuthenticated() {
		return nil, 0, domain.ErrUnauthenticated
	}
	if !actor.IsPlatformAdmin() {
		return nil, 0, domain.ErrForbidden
	}
	return s.repo.ListPendingVerifications(ctx, page, limit)
}

// ---------------------------------------------------------------------------
// Jobs and analytics
// ---------------------------------------------------------------------------

// GetJobs returns a company's jobs. Callers holding job:view see drafts and
// closed roles; everyone else sees live openings.
func (s *ManagementService) GetJobs(ctx context.Context, actor Actor, companyID uuid.UUID, status string, page, limit int) (*models.CompanyJobsPage, error) {
	grant := s.grantFor(ctx, actor, companyID)
	return s.repo.ListCompanyJobs(ctx, companyID, status, grant.Has(domain.PermJobView), page, limit)
}

// GetDashboard returns the company dashboard summary.
func (s *ManagementService) GetDashboard(ctx context.Context, actor Actor, companyID uuid.UUID) (*models.CompanyDashboard, error) {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermAnalyticsView); err != nil {
		return nil, err
	}
	return s.repo.Dashboard(ctx, companyID, actor.UserID)
}

// GetAnalytics returns aggregated analytics over a date range, defaulting to
// the last 30 days.
func (s *ManagementService) GetAnalytics(ctx context.Context, actor Actor, companyID uuid.UUID, from, to time.Time) (*models.CompanyAnalytics, error) {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermAnalyticsView); err != nil {
		return nil, err
	}
	if to.IsZero() {
		to = time.Now().UTC()
	}
	if from.IsZero() {
		from = to.AddDate(0, 0, -30)
	}
	if from.After(to) {
		return nil, fmt.Errorf("%w: the start date must be before the end date", domain.ErrValidation)
	}
	// A year is as far back as one request may reach; longer ranges belong to an
	// export, not a dashboard query.
	if to.Sub(from) > 366*24*time.Hour {
		return nil, fmt.Errorf("%w: the range cannot exceed one year", domain.ErrValidation)
	}
	return s.repo.Analytics(ctx, companyID, from, to)
}

// GetJobAnalytics returns the funnel for one job.
func (s *ManagementService) GetJobAnalytics(ctx context.Context, actor Actor, companyID, jobID uuid.UUID) (*models.JobAnalytics, error) {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermJobAnalyticsView); err != nil {
		return nil, err
	}
	owned, err := s.repo.JobBelongsTo(ctx, companyID, jobID)
	if err != nil {
		return nil, err
	}
	if !owned {
		return nil, domain.ErrNotFound
	}
	return s.repo.JobAnalytics(ctx, companyID, jobID)
}

// GetAuditLog returns the company's audit trail.
func (s *ManagementService) GetAuditLog(ctx context.Context, actor Actor, companyID uuid.UUID, page, limit int) ([]models.AuditEntry, int, error) {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermAuditView); err != nil {
		return nil, 0, err
	}
	return s.repo.ListAudit(ctx, companyID, page, limit)
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

// GetReviews returns a company's published reviews.
func (s *ManagementService) GetReviews(ctx context.Context, actor Actor, companyID uuid.UUID, page, limit int) (*models.CompanyReviewsPage, error) {
	reviews, err := s.repo.ListReviews(ctx, companyID, actor.UserID, page, limit)
	if err != nil {
		return nil, err
	}
	if actor.IsAuthenticated() {
		reviewed, err := s.repo.HasReviewed(ctx, companyID, actor.UserID)
		if err != nil {
			return nil, err
		}
		reviews.CanReview = !reviewed
	}
	return reviews, nil
}

// CreateReview stores a review written by the caller about their own time at a
// company. One review per employment period is the control that keeps the
// rating from being farmed.
func (s *ManagementService) CreateReview(ctx context.Context, actor Actor, companyID uuid.UUID, p models.ReviewPayload) (*models.CompanyReview, error) {
	if !actor.IsAuthenticated() {
		return nil, domain.ErrUnauthenticated
	}
	if _, err := s.repo.GetDetail(ctx, companyID, uuid.Nil); err != nil {
		return nil, err
	}

	id, err := s.repo.CreateReview(ctx, companyID, actor.UserID, p)
	if errors.Is(err, domain.ErrConflict) {
		return nil, fmt.Errorf("%w: you have already reviewed this period at this company", domain.ErrConflict)
	}
	if err != nil {
		return nil, err
	}
	return s.repo.GetReview(ctx, companyID, id, actor.UserID)
}

// UpdateReview rewrites the caller's own review.
func (s *ManagementService) UpdateReview(ctx context.Context, actor Actor, companyID, reviewID uuid.UUID, p models.ReviewPayload) (*models.CompanyReview, error) {
	if !actor.IsAuthenticated() {
		return nil, domain.ErrUnauthenticated
	}
	if err := s.repo.UpdateReview(ctx, companyID, reviewID, actor.UserID, p); err != nil {
		return nil, err
	}
	return s.repo.GetReview(ctx, companyID, reviewID, actor.UserID)
}

// DeleteReview removes the caller's own review. Company administrators cannot
// delete a review they dislike; they can respond to it or report it.
func (s *ManagementService) DeleteReview(ctx context.Context, actor Actor, companyID, reviewID uuid.UUID) error {
	if !actor.IsAuthenticated() {
		return domain.ErrUnauthenticated
	}
	return s.repo.DeleteReview(ctx, companyID, reviewID, actor.UserID)
}

// ReportReview files a moderation report against a review.
func (s *ManagementService) ReportReview(ctx context.Context, actor Actor, companyID, reviewID uuid.UUID, p models.ReviewReportPayload) error {
	if !actor.IsAuthenticated() {
		return domain.ErrUnauthenticated
	}
	if err := s.repo.ReportReview(ctx, companyID, reviewID, actor.UserID, p.Reason, p.Details); err != nil {
		return err
	}
	s.audit(ctx, actor, companyID, domain.AuditReviewReported, "review", &reviewID, map[string]any{
		"reason": p.Reason,
	})
	return nil
}

// RespondToReview publishes the company's reply to a review.
func (s *ManagementService) RespondToReview(ctx context.Context, actor Actor, companyID, reviewID uuid.UUID, p models.ReviewResponsePayload) error {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermReviewRespond); err != nil {
		return err
	}
	return s.repo.RespondToReview(ctx, companyID, reviewID, actor.UserID, p.Response)
}

// ---------------------------------------------------------------------------
// Updates
// ---------------------------------------------------------------------------

// GetUpdates returns a company's posts.
func (s *ManagementService) GetUpdates(ctx context.Context, actor Actor, companyID uuid.UUID, page, limit int) (*models.CompanyUpdatesPage, error) {
	grant := s.grantFor(ctx, actor, companyID)
	return s.repo.ListUpdates(ctx, companyID, grant.Has(domain.PermUpdateCreate), page, limit)
}

// CreateUpdate writes a company post. Publishing immediately needs
// update:publish; saving a draft only needs update:create.
func (s *ManagementService) CreateUpdate(ctx context.Context, actor Actor, companyID uuid.UUID, p models.UpdatePayload) (*models.CompanyUpdate, error) {
	grant, err := s.authorize(ctx, actor, companyID, domain.PermUpdateCreate)
	if err != nil {
		return nil, err
	}
	status, ok := domain.ParseUpdateStatus(p.Status)
	if !ok {
		return nil, fmt.Errorf("%w: unknown status %q", domain.ErrValidation, p.Status)
	}
	if (status == domain.UpdatePublished || status == domain.UpdateScheduled) && !grant.Has(domain.PermUpdatePublish) {
		return nil, fmt.Errorf("%w: you may draft updates but not publish them", domain.ErrForbidden)
	}
	if status == domain.UpdateScheduled && (p.ScheduledAt == nil || p.ScheduledAt.Before(time.Now().UTC())) {
		return nil, fmt.Errorf("%w: a scheduled update needs a future time", domain.ErrValidation)
	}
	if err := s.validateUpdateLinks(ctx, companyID, p); err != nil {
		return nil, err
	}

	id, err := s.repo.CreateUpdate(ctx, companyID, actor.UserID, p)
	if err != nil {
		return nil, err
	}
	if status == domain.UpdatePublished {
		s.audit(ctx, actor, companyID, domain.AuditUpdatePublished, "update", &id, map[string]any{
			"type": p.Type,
		})
		s.notifyFollowersOfUpdate(ctx, companyID, p)
	}
	return s.repo.GetUpdate(ctx, companyID, id)
}

// EditUpdate rewrites a post.
func (s *ManagementService) EditUpdate(ctx context.Context, actor Actor, companyID, updateID uuid.UUID, p models.UpdatePayload) (*models.CompanyUpdate, error) {
	grant, err := s.authorize(ctx, actor, companyID, domain.PermUpdateCreate)
	if err != nil {
		return nil, err
	}
	existing, err := s.repo.GetUpdate(ctx, companyID, updateID)
	if err != nil {
		return nil, err
	}
	status, ok := domain.ParseUpdateStatus(p.Status)
	if !ok {
		return nil, fmt.Errorf("%w: unknown status %q", domain.ErrValidation, p.Status)
	}
	if (status == domain.UpdatePublished || status == domain.UpdateScheduled) && !grant.Has(domain.PermUpdatePublish) {
		return nil, fmt.Errorf("%w: you may draft updates but not publish them", domain.ErrForbidden)
	}
	if err := s.validateUpdateLinks(ctx, companyID, p); err != nil {
		return nil, err
	}

	if err := s.repo.EditUpdate(ctx, companyID, updateID, p); err != nil {
		return nil, err
	}
	if status == domain.UpdatePublished && existing.Status != domain.UpdatePublished {
		s.audit(ctx, actor, companyID, domain.AuditUpdatePublished, "update", &updateID, map[string]any{
			"type": p.Type,
		})
		s.notifyFollowersOfUpdate(ctx, companyID, p)
	}
	return s.repo.GetUpdate(ctx, companyID, updateID)
}

// DeleteUpdate removes a post.
func (s *ManagementService) DeleteUpdate(ctx context.Context, actor Actor, companyID, updateID uuid.UUID) error {
	if _, err := s.authorize(ctx, actor, companyID, domain.PermUpdateDelete); err != nil {
		return err
	}
	return s.repo.DeleteUpdate(ctx, companyID, updateID)
}

// validateUpdateLinks checks the media, links and any attached job. A job
// announcement may only point at this company's own job.
func (s *ManagementService) validateUpdateLinks(ctx context.Context, companyID uuid.UUID, p models.UpdatePayload) error {
	for _, link := range p.Links {
		if err := validateURL(link); err != nil {
			return err
		}
	}
	for _, media := range p.Media {
		if err := validateAssetURL(media); err != nil {
			return err
		}
	}
	if p.JobID != nil {
		owned, err := s.repo.JobBelongsTo(ctx, companyID, *p.JobID)
		if err != nil {
			return err
		}
		if !owned {
			return fmt.Errorf("%w: that job does not belong to this company", domain.ErrValidation)
		}
	}
	return nil
}

// notifyFollowersOfUpdate tells followers who opted in. Job and hiring
// announcements go to the job-alert audience; everything else to the updates
// audience.
func (s *ManagementService) notifyFollowersOfUpdate(ctx context.Context, companyID uuid.UUID, p models.UpdatePayload) {
	if s.notifier == nil {
		return
	}
	updateType, _ := domain.ParseUpdateType(p.Type)
	aboutJobs := updateType == domain.UpdateTypeJob || updateType == domain.UpdateTypeHiring

	followers, err := s.repo.FollowersToNotify(ctx, companyID, aboutJobs)
	if err != nil {
		log.Printf("company: follower notification lookup failed for %s: %v", companyID, err)
		return
	}
	title := strings.TrimSpace(p.Title)
	if title == "" {
		title = "New company update"
	}
	for _, userID := range followers {
		s.notify(ctx, userID, NotifyCompanyUpdate, title, truncate(p.Body, 240))
	}
}

// truncate shortens a body for a notification preview.
//
// It counts runes rather than bytes: an update written in Arabic would
// otherwise be cut mid-character, and the notification would carry a broken
// glyph. The ellipsis is counted against the limit, so the result never
// exceeds what the caller asked for.
func truncate(value string, limit int) string {
	trimmed := strings.TrimSpace(value)
	if limit <= 0 {
		return ""
	}
	runes := []rune(trimmed)
	if len(runes) <= limit {
		return trimmed
	}
	return strings.TrimSpace(string(runes[:limit-1])) + "…"
}

// ---------------------------------------------------------------------------
// Background maintenance
// ---------------------------------------------------------------------------

// RunMaintenance performs the module's periodic work: publishing scheduled
// updates, expiring lapsed verifications and rolling up yesterday's analytics.
// It is safe to run repeatedly; every step is idempotent for a given day.
func (s *ManagementService) RunMaintenance(ctx context.Context) error {
	published, err := s.repo.PublishDueUpdates(ctx)
	if err != nil {
		return err
	}
	for _, update := range published {
		s.notifyFollowersOfUpdate(ctx, update.CompanyID, models.UpdatePayload{
			Type: string(update.Type), Title: update.Title, Body: update.Body,
		})
	}

	if _, err := s.repo.ExpireLapsedVerifications(ctx); err != nil {
		return err
	}

	day := time.Now().UTC().AddDate(0, 0, -1)
	if err := s.repo.RollUpAnalytics(ctx, day); err != nil {
		return err
	}
	return s.repo.RollUpJobAnalytics(ctx, day)
}

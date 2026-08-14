package service

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"
	"kirmya/internal/company/repository"

	"github.com/google/uuid"
)

// offlineManagement builds the service with no database behind it. Every
// authorization decision asserted here is reached before a query would run, so
// the absence of a pool never decides the outcome.
func offlineManagement() *ManagementService {
	return NewManagementService(
		repository.NewManagementRepository(nil),
		repository.NewCompanyRepository(nil),
		nil,
		"https://app.kirmya.com",
		"test-salt",
	)
}

func anonymous() Actor { return Actor{} }

func signedIn() Actor {
	return Actor{UserID: uuid.New(), Email: "member@example.com", PlatformRole: "user"}
}

// Every write in the module refuses an anonymous caller, and refuses it with
// ErrUnauthenticated specifically — a 401 tells the client to log in, where a
// 403 or a 500 would not. This table is the reason a newly added write cannot
// quietly skip its authorization: it has to be listed here to pass review.
func TestEveryWriteRefusesAnonymousCallers(t *testing.T) {
	svc := offlineManagement()
	ctx := context.Background()
	companyID := uuid.New()
	memberID := uuid.New()
	resourceID := uuid.New()

	calls := map[string]func() error{
		"CreateCompany": func() error {
			_, err := svc.CreateCompany(ctx, anonymous(), models.CompanyCreatePayload{Name: "Acme", Slug: "acme", Industry: "Logistics"})
			return err
		},
		"UpdateCompany": func() error {
			_, err := svc.UpdateCompany(ctx, anonymous(), companyID, models.CompanyUpdatePayload{})
			return err
		},
		"FollowCompany": func() error {
			return svc.FollowCompany(ctx, anonymous(), companyID, models.FollowPayload{})
		},
		"UnfollowCompany": func() error {
			return svc.UnfollowCompany(ctx, anonymous(), companyID)
		},
		"ListFollowing": func() error {
			_, err := svc.ListFollowing(ctx, anonymous(), 1, 20)
			return err
		},
		"RequestAssociation": func() error {
			_, err := svc.RequestAssociation(ctx, anonymous(), companyID, models.AssociationRequestPayload{})
			return err
		},
		"DecideAssociation": func() error {
			return svc.DecideAssociation(ctx, anonymous(), companyID, memberID, true)
		},
		"GetTeam": func() error {
			_, err := svc.GetTeam(ctx, anonymous(), companyID, models.PeopleQuery{})
			return err
		},
		"InviteMember": func() error {
			_, err := svc.InviteMember(ctx, anonymous(), companyID, models.TeamInvitePayload{Email: "x@example.com", Role: "recruiter"})
			return err
		},
		"ListInvitations": func() error {
			_, err := svc.ListInvitations(ctx, anonymous(), companyID, "")
			return err
		},
		"RevokeInvitation": func() error {
			return svc.RevokeInvitation(ctx, anonymous(), companyID, resourceID)
		},
		"AcceptInvitation": func() error {
			_, err := svc.AcceptInvitation(ctx, anonymous(), "some-token")
			return err
		},
		"DeclineInvitation": func() error {
			return svc.DeclineInvitation(ctx, anonymous(), "some-token")
		},
		"UpdateTeamMember": func() error {
			return svc.UpdateTeamMember(ctx, anonymous(), companyID, memberID, models.TeamMemberUpdatePayload{Role: "recruiter"})
		},
		"RemoveTeamMember": func() error {
			return svc.RemoveTeamMember(ctx, anonymous(), companyID, memberID)
		},
		"SetMemberPermissions": func() error {
			return svc.SetMemberPermissions(ctx, anonymous(), companyID, memberID, []string{string(domain.PermJobView)})
		},
		"GetRecruiters": func() error {
			_, err := svc.GetRecruiters(ctx, anonymous(), companyID, models.PeopleQuery{})
			return err
		},
		"RemoveRecruiter": func() error {
			return svc.RemoveRecruiter(ctx, anonymous(), companyID, memberID)
		},
		"SuspendRecruiter": func() error {
			return svc.SuspendRecruiter(ctx, anonymous(), companyID, memberID, true)
		},
		"GetVerification": func() error {
			_, err := svc.GetVerification(ctx, anonymous(), companyID)
			return err
		},
		"SubmitVerification": func() error {
			_, err := svc.SubmitVerification(ctx, anonymous(), companyID, models.VerificationSubmitPayload{})
			return err
		},
		"DecideVerification": func() error {
			return svc.DecideVerification(ctx, anonymous(), resourceID, models.VerificationDecisionPayload{Status: "verified"})
		},
		"ListPendingVerifications": func() error {
			_, _, err := svc.ListPendingVerifications(ctx, anonymous(), 1, 20)
			return err
		},
		"GetDashboard": func() error {
			_, err := svc.GetDashboard(ctx, anonymous(), companyID)
			return err
		},
		"GetAnalytics": func() error {
			_, err := svc.GetAnalytics(ctx, anonymous(), companyID, time.Time{}, time.Time{})
			return err
		},
		"GetJobAnalytics": func() error {
			_, err := svc.GetJobAnalytics(ctx, anonymous(), companyID, resourceID)
			return err
		},
		"GetAuditLog": func() error {
			_, _, err := svc.GetAuditLog(ctx, anonymous(), companyID, 1, 20)
			return err
		},
		"CreateReview": func() error {
			_, err := svc.CreateReview(ctx, anonymous(), companyID, models.ReviewPayload{})
			return err
		},
		"UpdateReview": func() error {
			_, err := svc.UpdateReview(ctx, anonymous(), companyID, resourceID, models.ReviewPayload{})
			return err
		},
		"DeleteReview": func() error {
			return svc.DeleteReview(ctx, anonymous(), companyID, resourceID)
		},
		"ReportReview": func() error {
			return svc.ReportReview(ctx, anonymous(), companyID, resourceID, models.ReviewReportPayload{Reason: "spam"})
		},
		"RespondToReview": func() error {
			return svc.RespondToReview(ctx, anonymous(), companyID, resourceID, models.ReviewResponsePayload{Response: "Thank you for the feedback."})
		},
		"CreateUpdate": func() error {
			_, err := svc.CreateUpdate(ctx, anonymous(), companyID, models.UpdatePayload{Type: "text", Body: "hello", Status: "published"})
			return err
		},
		"EditUpdate": func() error {
			_, err := svc.EditUpdate(ctx, anonymous(), companyID, resourceID, models.UpdatePayload{Type: "text", Body: "hello", Status: "draft"})
			return err
		},
		"DeleteUpdate": func() error {
			return svc.DeleteUpdate(ctx, anonymous(), companyID, resourceID)
		},
		"GetEmployerSettings": func() error {
			_, err := svc.GetEmployerSettings(ctx, anonymous(), companyID)
			return err
		},
		"UpdateEmployerSettings": func() error {
			_, err := svc.UpdateEmployerSettings(ctx, anonymous(), companyID, models.EmployerSettingsUpdatePayload{})
			return err
		},
		"TransferOwnership": func() error {
			return svc.TransferOwnership(ctx, anonymous(), companyID, models.TransferOwnershipPayload{NewOwnerID: uuid.New().String()})
		},
		"ResendInvitation": func() error {
			_, err := svc.ResendInvitation(ctx, anonymous(), companyID, resourceID)
			return err
		},
		"ExportCompanyData": func() error {
			_, err := svc.ExportCompanyData(ctx, anonymous(), companyID)
			return err
		},
	}

	for name, call := range calls {
		t.Run(name, func(t *testing.T) {
			err := call()
			if !errors.Is(err, domain.ErrUnauthenticated) {
				t.Errorf("%s allowed an anonymous caller past authentication: %v", name, err)
			}
		})
	}
}

// The company switcher is a private read: it names companies the caller has
// standing in, so an anonymous request must not be answered with an empty list
// as though the question were harmless.
func TestListMyCompaniesRefusesAnonymousCallers(t *testing.T) {
	svc := offlineManagement()

	if _, err := svc.ListMyCompanies(context.Background(), anonymous()); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("got %v, want ErrUnauthenticated", err)
	}
}

// A signed-in user with no relationship to a company must not be able to learn
// that the company exists. The service answers ErrNotFound rather than
// ErrForbidden precisely so that iterating company ids yields nothing.
//
// With no database the grant lookup fails outright, which is the same
// fail-closed outcome; this asserts the shape of the check itself.
func TestAuthorizeIsFailClosed(t *testing.T) {
	svc := offlineManagement()
	ctx := context.Background()

	if _, err := svc.authorize(ctx, anonymous(), uuid.New(), domain.PermCompanyView); !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("anonymous caller: got %v, want ErrUnauthenticated", err)
	}

	grant, err := svc.authorize(ctx, signedIn(), uuid.New(), domain.PermCompanyView)
	if err == nil {
		t.Fatal("a grant that could not be loaded was treated as access")
	}
	if len(grant.Roles) != 0 || len(grant.Extra) != 0 {
		t.Errorf("a failed authorization returned authority: %+v", grant)
	}
}

// grantFor shapes public responses around the viewer. When the lookup fails it
// must degrade to "no relationship", never to an assumed one.
func TestGrantForDegradesToNoAccess(t *testing.T) {
	svc := offlineManagement()

	grant := svc.grantFor(context.Background(), signedIn(), uuid.New())
	if len(grant.Roles) != 0 {
		t.Errorf("a failed grant lookup produced roles: %v", grant.Roles)
	}
	if grant.Has(domain.PermCompanyView) || grant.Has(domain.PermTeamView) {
		t.Error("a failed grant lookup produced permissions")
	}

	if anon := svc.grantFor(context.Background(), anonymous(), uuid.New()); len(anon.Roles) != 0 {
		t.Errorf("an anonymous viewer produced roles: %v", anon.Roles)
	}
}

// Verification decisions belong to Kirmya administrators. Owning the company
// under review grants nothing here, which is the entire point of keeping the
// platform role separate from the company-scoped roles.
func TestDecideVerificationRequiresPlatformAdmin(t *testing.T) {
	svc := offlineManagement()
	ctx := context.Background()
	verificationID := uuid.New()
	approve := models.VerificationDecisionPayload{Status: "verified"}

	for _, role := range []string{"", "user", "candidate", "recruiter", "company_owner", "org_admin", "employer"} {
		actor := Actor{UserID: uuid.New(), PlatformRole: role}
		err := svc.DecideVerification(ctx, actor, verificationID, approve)
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("platform role %q was allowed to decide a verification: %v", role, err)
		}
	}

	// An administrator gets past the gate and fails later, at the database.
	for _, role := range []string{"admin", "super_admin", "platform_admin", "  Admin  "} {
		actor := Actor{UserID: uuid.New(), PlatformRole: role}
		err := svc.DecideVerification(ctx, actor, verificationID, approve)
		if errors.Is(err, domain.ErrForbidden) || errors.Is(err, domain.ErrUnauthenticated) {
			t.Errorf("platform role %q was refused the administrator gate: %v", role, err)
		}
	}
}

// The only statuses an administrator may set are verified and rejected, and a
// rejection has to say why. Nothing may set 'pending' or 'not_verified' by
// hand, and no near-miss spelling of a decision is accepted.
func TestDecideVerificationValidatesTheDecision(t *testing.T) {
	svc := offlineManagement()
	ctx := context.Background()
	admin := Actor{UserID: uuid.New(), PlatformRole: "admin"}

	for _, status := range []string{"", "approved", "pending", "not_verified", "expired", "VERIFY", "true"} {
		err := svc.DecideVerification(ctx, admin, uuid.New(), models.VerificationDecisionPayload{Status: status})
		if !errors.Is(err, domain.ErrValidation) {
			t.Errorf("status %q was accepted as a decision: %v", status, err)
		}
	}

	err := svc.DecideVerification(ctx, admin, uuid.New(), models.VerificationDecisionPayload{Status: "rejected"})
	if !errors.Is(err, domain.ErrValidation) {
		t.Errorf("a rejection without a reason was accepted: %v", err)
	}
	err = svc.DecideVerification(ctx, admin, uuid.New(), models.VerificationDecisionPayload{Status: "rejected", RejectionReason: "   "})
	if !errors.Is(err, domain.ErrValidation) {
		t.Errorf("a rejection with a blank reason was accepted: %v", err)
	}
}

// The review queue is administrators only.
func TestListPendingVerificationsRequiresPlatformAdmin(t *testing.T) {
	svc := offlineManagement()

	_, _, err := svc.ListPendingVerifications(context.Background(), signedIn(), 1, 20)
	if !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("a signed-in non-administrator reached the verification queue: %v", err)
	}
}

// IsPlatformAdmin decides who can verify a company, so what counts as an
// administrator is asserted exactly rather than left to a substring match.
func TestIsPlatformAdmin(t *testing.T) {
	admin := []string{"admin", "ADMIN", " admin ", "super_admin", "platform_admin"}
	notAdmin := []string{"", "user", "candidate", "recruiter", "company_owner", "administrator", "admins", "superadmin", "super-admin", "sub_admin"}

	for _, role := range admin {
		if !(Actor{PlatformRole: role}).IsPlatformAdmin() {
			t.Errorf("%q should be a platform administrator", role)
		}
	}
	for _, role := range notAdmin {
		if (Actor{PlatformRole: role}).IsPlatformAdmin() {
			t.Errorf("%q was treated as a platform administrator", role)
		}
	}
}

// The zero Actor is nobody. An absent user must never resolve to an account.
func TestZeroActorIsNotAuthenticated(t *testing.T) {
	if (Actor{}).IsAuthenticated() {
		t.Error("the zero Actor reported itself as authenticated")
	}
	if (Actor{Email: "someone@example.com", PlatformRole: "admin"}).IsAuthenticated() {
		t.Error("an Actor with no user id but a role reported itself as authenticated")
	}
	if !(Actor{UserID: uuid.New()}).IsAuthenticated() {
		t.Error("an Actor with a user id was not authenticated")
	}
}

// A slug becomes part of a public URL, so it is normalised rather than trusted.
func TestSlugify(t *testing.T) {
	cases := map[string]string{
		"Acme Middle East":       "acme-middle-east",
		"  Spaced  Out  ":        "spaced-out",
		"Ünïcödé Corp":           "n-c-d-corp",
		"C++ & Friends":          "c-friends",
		"already-a-slug":         "already-a-slug",
		"UPPER":                  "upper",
		"multiple---dashes":      "multiple-dashes",
		"-leading-and-trailing-": "leading-and-trailing",
		"123":                    "123",
		"":                       "",
		"!!!":                    "",
		"../../etc/passwd":       "etc-passwd",
		"<script>alert(1)":       "script-alert-1",
	}

	for input, want := range cases {
		if got := Slugify(input); got != want {
			t.Errorf("Slugify(%q) = %q, want %q", input, got, want)
		}
	}
}

// A slug that survives Slugify must still match the stored pattern, otherwise
// the create path would accept a handle no lookup could find.
func TestCreateCompanyRejectsUnusableSlugs(t *testing.T) {
	svc := offlineManagement()
	ctx := context.Background()
	actor := signedIn()

	for _, name := range []string{"!!!", "   ", "…", "@"} {
		_, err := svc.CreateCompany(ctx, actor, models.CompanyCreatePayload{Name: name, Slug: name, Industry: "Logistics"})
		if !errors.Is(err, domain.ErrValidation) {
			t.Errorf("company named %q was accepted: %v", name, err)
		}
	}

	// A single character slugifies cleanly but is below the stored minimum.
	_, err := svc.CreateCompany(ctx, actor, models.CompanyCreatePayload{Name: "A", Slug: "a", Industry: "Logistics"})
	if !errors.Is(err, domain.ErrValidation) {
		t.Errorf("a one-character slug was accepted: %v", err)
	}

	// Over the hundred-character column limit.
	long := strings.Repeat("a", 101)
	_, err = svc.CreateCompany(ctx, actor, models.CompanyCreatePayload{Name: long, Slug: long, Industry: "Logistics"})
	if !errors.Is(err, domain.ErrValidation) {
		t.Errorf("an over-long slug was accepted: %v", err)
	}
}

// Profile links are rendered as anchors. Anything that is not http(s) is a
// script waiting for a click.
func TestValidateURL(t *testing.T) {
	valid := []string{
		"", "   ",
		"https://acme.example",
		"http://acme.example/careers?ref=kirmya",
		"HTTPS://ACME.EXAMPLE",
	}
	invalid := []string{
		"javascript:alert(1)",
		"JavaScript:alert(1)",
		"data:text/html;base64,PHNjcmlwdD4=",
		"file:///etc/passwd",
		"acme.example",
		"//acme.example",
		"vbscript:msgbox(1)",
		"https://" + strings.Repeat("a", 500),
	}

	for _, value := range valid {
		if err := validateURL(value); err != nil {
			t.Errorf("validateURL(%q) rejected a usable link: %v", value, err)
		}
	}
	for _, value := range invalid {
		if err := validateURL(value); !errors.Is(err, domain.ErrValidation) {
			t.Errorf("validateURL(%q) accepted an unusable link: %v", value, err)
		}
	}
}

// A logo has to be an image. Without the extension check a PDF — or an HTML
// page — could be set as the company's logo and served from an <img> the
// browser then sniffs.
func TestValidateAssetURL(t *testing.T) {
	valid := []string{
		"",
		"https://cdn.example/logo.png",
		"https://cdn.example/logo.JPEG",
		"https://cdn.example/cover.webp?v=2",
		"https://cdn.example/mark.svg#icon",
	}
	invalid := []string{
		"https://cdn.example/logo.pdf",
		"https://cdn.example/logo",
		"https://cdn.example/logo.png.exe",
		"https://cdn.example/page.html",
		"javascript:alert(1)",
	}

	for _, value := range valid {
		if err := validateAssetURL(value); err != nil {
			t.Errorf("validateAssetURL(%q) rejected an image: %v", value, err)
		}
	}
	for _, value := range invalid {
		if err := validateAssetURL(value); !errors.Is(err, domain.ErrValidation) {
			t.Errorf("validateAssetURL(%q) accepted a non-image: %v", value, err)
		}
	}
}

// Verification documents are uploaded by companies and read by administrators.
// The type, the MIME type and the size are all checked at submission, so a
// reviewer is never handed something the platform did not agree to store.
func TestValidateDocument(t *testing.T) {
	good := models.VerificationDocument{
		DocumentType: "registration_certificate",
		FileURL:      "https://cdn.example/docs/reg.pdf",
		FileName:     "reg.pdf",
		FileSize:     1024,
		MimeType:     "application/pdf",
	}
	if err := validateDocument(good); err != nil {
		t.Fatalf("a valid document was rejected: %v", err)
	}

	cases := map[string]models.VerificationDocument{
		"unknown document type": withDoc(good, func(d *models.VerificationDocument) { d.DocumentType = "passport_scan" }),
		"empty document type":   withDoc(good, func(d *models.VerificationDocument) { d.DocumentType = "" }),
		"executable mime":       withDoc(good, func(d *models.VerificationDocument) { d.MimeType = "application/x-msdownload" }),
		"html mime":             withDoc(good, func(d *models.VerificationDocument) { d.MimeType = "text/html" }),
		"svg mime":              withDoc(good, func(d *models.VerificationDocument) { d.MimeType = "image/svg+xml" }),
		"zero size":             withDoc(good, func(d *models.VerificationDocument) { d.FileSize = 0 }),
		"negative size":         withDoc(good, func(d *models.VerificationDocument) { d.FileSize = -1 }),
		"oversized":             withDoc(good, func(d *models.VerificationDocument) { d.FileSize = maxDocumentBytes + 1 }),
		"non-http url":          withDoc(good, func(d *models.VerificationDocument) { d.FileURL = "file:///etc/passwd" }),
	}

	for name, doc := range cases {
		t.Run(name, func(t *testing.T) {
			if err := validateDocument(doc); !errors.Is(err, domain.ErrValidation) {
				t.Errorf("accepted: %v", err)
			}
		})
	}

	// Exactly at the cap is allowed; the boundary belongs to the company.
	atLimit := withDoc(good, func(d *models.VerificationDocument) { d.FileSize = maxDocumentBytes })
	if err := validateDocument(atLimit); err != nil {
		t.Errorf("a document at exactly the size cap was rejected: %v", err)
	}

	// Casing in a MIME type or document type is the client's business.
	cased := withDoc(good, func(d *models.VerificationDocument) {
		d.MimeType = "Application/PDF"
		d.DocumentType = "Registration_Certificate"
	})
	if err := validateDocument(cased); err != nil {
		t.Errorf("a document with upper-case metadata was rejected: %v", err)
	}
}

func withDoc(base models.VerificationDocument, mutate func(*models.VerificationDocument)) models.VerificationDocument {
	copied := base
	mutate(&copied)
	return copied
}

// Branding edits are separable from profile edits so a designer can hold
// branding:edit without company:edit. The classifier decides which permission
// an update needs, so a profile field slipping into the branding set would be a
// privilege hole.
func TestOnlyBrandingFields(t *testing.T) {
	mission := "To move things"
	logo := "https://cdn.example/logo.png"
	cover := "https://cdn.example/cover.png"
	tagline := "We build things"
	name := "Acme"
	assets := []models.BrandAsset{{Label: "Press kit", URL: "https://cdn.example/kit.zip"}}

	if !onlyBrandingFields(models.CompanyUpdatePayload{LogoURL: &logo, CoverURL: &cover, BrandAssets: &assets}) {
		t.Error("a logo, cover and asset change was not classified as branding")
	}
	if onlyBrandingFields(models.CompanyUpdatePayload{Name: &name}) {
		t.Error("a name change was classified as branding")
	}
	if onlyBrandingFields(models.CompanyUpdatePayload{LogoURL: &logo, Name: &name}) {
		t.Error("a payload mixing branding and profile fields was classified as branding")
	}
	// The tagline sits in the branding section of the spec alongside the logo
	// and the brand name, so a designer holding branding:edit may change it.
	if !onlyBrandingFields(models.CompanyUpdatePayload{Tagline: &tagline}) {
		t.Error("the tagline was not classified as branding")
	}
	if onlyBrandingFields(models.CompanyUpdatePayload{Tagline: &tagline, Mission: &mission}) {
		t.Error("a tagline change bundled with the mission was classified as branding")
	}
	// An empty payload changes nothing, so it cannot be a branding-only edit
	// that bypasses company:edit.
	if onlyBrandingFields(models.CompanyUpdatePayload{}) {
		t.Error("an empty payload was classified as branding")
	}
}

// The audit trail records which fields changed. It must name every field the
// caller actually sent and invent none.
func TestChangedFieldsNamesWhatWasSent(t *testing.T) {
	name := "Acme"
	mission := "To move things"
	values := []string{"Curiosity"}

	fields := changedFields(models.CompanyUpdatePayload{Name: &name, Mission: &mission, Values: &values})
	if len(fields) != 3 {
		t.Fatalf("changedFields returned %d entries: %v", len(fields), fields)
	}
	joined := strings.Join(fields, ",")
	for _, want := range []string{"name", "mission", "values"} {
		if !strings.Contains(joined, want) {
			t.Errorf("changedFields did not report %q: %v", want, fields)
		}
	}

	if fields := changedFields(models.CompanyUpdatePayload{}); len(fields) != 0 {
		t.Errorf("an empty payload reported changes: %v", fields)
	}
}

// The permission catalogue is what the settings screen renders. It must
// describe the real matrix, not a hand-maintained copy of it.
func TestPermissionCatalogMatchesTheMatrix(t *testing.T) {
	svc := offlineManagement()
	catalog := svc.PermissionCatalog()

	if len(catalog) != len(domain.AllRoles()) {
		t.Fatalf("catalogue lists %d roles, the module defines %d", len(catalog), len(domain.AllRoles()))
	}

	for i, descriptor := range catalog {
		role := domain.AllRoles()[i]
		if descriptor.Role != role {
			t.Errorf("catalogue entry %d is %q, want %q", i, descriptor.Role, role)
		}
		if descriptor.Rank != role.Rank() {
			t.Errorf("%s is ranked %d in the catalogue, %d in the matrix", role, descriptor.Rank, role.Rank())
		}
		if len(descriptor.Permissions) != len(role.Permissions()) {
			t.Errorf("%s lists %d permissions, the matrix grants %d", role, len(descriptor.Permissions), len(role.Permissions()))
		}
		for _, perm := range descriptor.Permissions {
			if !role.Has(perm) {
				t.Errorf("catalogue claims %s carries %s", role, perm)
			}
		}
	}
}

// Notification content is truncated before it is sent. An update body is
// user-supplied and unbounded.
func TestTruncate(t *testing.T) {
	if got := truncate("short", 40); got != "short" {
		t.Errorf("truncate shortened a short string: %q", got)
	}
	long := strings.Repeat("a", 200)
	got := truncate(long, 40)
	if len([]rune(got)) > 40 {
		t.Errorf("truncate returned %d runes, want at most 40", len([]rune(got)))
	}
	if got == long {
		t.Error("truncate left a long string untouched")
	}
	// Multi-byte input must not be cut mid-rune.
	multibyte := strings.Repeat("é", 100)
	if cut := truncate(multibyte, 10); !utf8Valid(cut) {
		t.Errorf("truncate produced invalid UTF-8: %q", cut)
	}
}

func utf8Valid(value string) bool {
	for _, r := range value {
		if r == '\uFFFD' {
			return false
		}
	}
	return true
}

func TestTransferOwnership(t *testing.T) {
	svc := offlineManagement()
	ctx := context.Background()
	companyID := uuid.New()
	newOwnerID := uuid.New()

	err := svc.TransferOwnership(ctx, anonymous(), companyID, models.TransferOwnershipPayload{NewOwnerID: newOwnerID.String()})
	if !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("anonymous caller: got %v, want ErrUnauthenticated", err)
	}

	err = svc.TransferOwnership(ctx, signedIn(), companyID, models.TransferOwnershipPayload{NewOwnerID: newOwnerID.String()})
	if !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("non-owner caller: got %v, want ErrForbidden", err)
	}
}

func TestResendInvitation(t *testing.T) {
	svc := offlineManagement()
	ctx := context.Background()
	companyID := uuid.New()
	invitationID := uuid.New()

	_, err := svc.ResendInvitation(ctx, anonymous(), companyID, invitationID)
	if !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("anonymous caller: got %v, want ErrUnauthenticated", err)
	}

	_, err = svc.ResendInvitation(ctx, signedIn(), companyID, invitationID)
	if err == nil {
		t.Errorf("unauthorized caller succeeded, want error")
	}
}

func TestGetEmployerSettings(t *testing.T) {
	svc := offlineManagement()
	ctx := context.Background()
	companyID := uuid.New()

	_, err := svc.GetEmployerSettings(ctx, anonymous(), companyID)
	if !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("anonymous caller: got %v, want ErrUnauthenticated", err)
	}

	_, err = svc.GetEmployerSettings(ctx, signedIn(), companyID)
	if err == nil {
		t.Errorf("unauthorized caller succeeded, want error")
	}
}

func TestExportCompanyData(t *testing.T) {
	svc := offlineManagement()
	ctx := context.Background()
	companyID := uuid.New()

	_, err := svc.ExportCompanyData(ctx, anonymous(), companyID)
	if !errors.Is(err, domain.ErrUnauthenticated) {
		t.Errorf("anonymous caller: got %v, want ErrUnauthenticated", err)
	}

	_, err = svc.ExportCompanyData(ctx, signedIn(), companyID)
	if err == nil {
		t.Errorf("unauthorized caller succeeded, want error")
	}
}

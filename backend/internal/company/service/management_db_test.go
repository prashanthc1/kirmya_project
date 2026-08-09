package service

import (
	"context"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"
	"testing"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"
	"kirmya/internal/company/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// The tests in this file exercise the authorization rules against real SQL,
// because that is where they actually live: a permission the service checks but
// the query ignores would pass every in-memory test and still leak.
//
// They run when COMPANY_TEST_DATABASE_URL points at a database with the
// migrations applied, and skip otherwise, so `go test ./...` stays runnable on
// a machine with no PostgreSQL.
//
//	COMPANY_TEST_DATABASE_URL=postgres://user:pass@localhost:5432/kirmya go test ./internal/company/...
type companyFixture struct {
	t       *testing.T
	pool    *pgxpool.Pool
	svc     *ManagementService
	ctx     context.Context
	company uuid.UUID
	slug    string
	owner   Actor
}

func newFixture(t *testing.T) *companyFixture {
	t.Helper()

	dsn := strings.TrimSpace(os.Getenv("COMPANY_TEST_DATABASE_URL"))
	if dsn == "" {
		t.Skip("COMPANY_TEST_DATABASE_URL is not set; skipping database-backed company tests")
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		t.Fatalf("ping: %v", err)
	}
	t.Cleanup(pool.Close)

	f := &companyFixture{
		t:    t,
		pool: pool,
		ctx:  ctx,
		svc: NewManagementService(
			repository.NewManagementRepository(pool),
			repository.NewCompanyRepository(pool),
			nil,
			"https://app.kirmya.com",
			"test-salt",
		),
	}
	f.company, f.slug = f.seedCompany("Fixture Co")
	f.owner = f.seedMember(f.company, domain.RoleCompanyOwner, domain.MembershipApproved)
	f.setOwner(f.company, f.owner.UserID)
	return f
}

// seedUser inserts an account and schedules its removal.
func (f *companyFixture) seedUser() Actor {
	f.t.Helper()

	id := uuid.New()
	email := fmt.Sprintf("test-%s@kirmya.test", id)
	_, err := f.pool.Exec(f.ctx,
		`INSERT INTO users (id, uuid, first_name, last_name, email, password_hash, role_id, status)
		 VALUES ($1, $1, 'Test', 'User', $2, 'x', 'user', 'active')`, id, email)
	if err != nil {
		f.t.Fatalf("seed user: %v", err)
	}
	f.t.Cleanup(func() {
		_, _ = f.pool.Exec(context.Background(), `DELETE FROM users WHERE id = $1`, id)
	})
	return Actor{UserID: id, Email: email, PlatformRole: "user"}
}

// seedCompany inserts an active company with a profile and schedules cleanup.
func (f *companyFixture) seedCompany(name string) (uuid.UUID, string) {
	f.t.Helper()

	id := uuid.New()
	slug := "test-" + strings.ReplaceAll(id.String(), "-", "")[:16]
	if _, err := f.pool.Exec(f.ctx,
		`INSERT INTO companies (id, name, handle, status) VALUES ($1, $2, $3, 'active')`,
		id, name, slug); err != nil {
		f.t.Fatalf("seed company: %v", err)
	}
	if _, err := f.pool.Exec(f.ctx,
		`INSERT INTO company_profiles (company_id, industry) VALUES ($1, 'Logistics')`, id); err != nil {
		f.t.Fatalf("seed company profile: %v", err)
	}
	f.t.Cleanup(func() {
		_, _ = f.pool.Exec(context.Background(), `DELETE FROM companies WHERE id = $1`, id)
	})
	return id, slug
}

func (f *companyFixture) setOwner(companyID, userID uuid.UUID) {
	f.t.Helper()
	if _, err := f.pool.Exec(f.ctx, `UPDATE companies SET owner_id = $2 WHERE id = $1`, companyID, userID); err != nil {
		f.t.Fatalf("set owner: %v", err)
	}
}

// seedMember creates a user and attaches them to a company in a role.
func (f *companyFixture) seedMember(companyID uuid.UUID, role domain.Role, status domain.MembershipStatus) Actor {
	f.t.Helper()

	actor := f.seedUser()
	memberID := uuid.New()
	if _, err := f.pool.Exec(f.ctx,
		`INSERT INTO company_members (id, company_id, user_id, role, status, is_public)
		 VALUES ($1, $2, $3, $4, $5, TRUE)`,
		memberID, companyID, actor.UserID, string(role), string(status)); err != nil {
		f.t.Fatalf("seed member: %v", err)
	}
	if _, err := f.pool.Exec(f.ctx,
		`INSERT INTO company_member_roles (id, company_id, member_id, user_id, role, extra_permissions)
		 VALUES ($1, $2, $3, $4, $5, '[]'::jsonb)`,
		uuid.New(), companyID, memberID, actor.UserID, string(role)); err != nil {
		f.t.Fatalf("seed member role: %v", err)
	}
	return actor
}

func (f *companyFixture) memberID(companyID, userID uuid.UUID) uuid.UUID {
	f.t.Helper()
	var id uuid.UUID
	if err := f.pool.QueryRow(f.ctx,
		`SELECT id FROM company_members WHERE company_id = $1 AND user_id = $2`,
		companyID, userID).Scan(&id); err != nil {
		f.t.Fatalf("look up member: %v", err)
	}
	return id
}

func (f *companyFixture) verificationStatus(companyID uuid.UUID) string {
	f.t.Helper()
	var status string
	if err := f.pool.QueryRow(f.ctx,
		`SELECT verification_status FROM company_profiles WHERE company_id = $1`, companyID).Scan(&status); err != nil {
		f.t.Fatalf("read verification status: %v", err)
	}
	return status
}

// An administrator of one company holds nothing on another. The answer is
// ErrNotFound rather than ErrForbidden so that iterating company ids tells the
// caller nothing about which ones exist.
func TestDBCrossCompanyAccessIsDenied(t *testing.T) {
	f := newFixture(t)
	other, _ := f.seedCompany("Unrelated Co")
	otherOwner := f.seedMember(other, domain.RoleCompanyOwner, domain.MembershipApproved)
	f.setOwner(other, otherOwner.UserID)

	name := "Renamed By An Outsider"
	attempts := map[string]func() error{
		"read the team": func() error {
			_, err := f.svc.GetTeam(f.ctx, f.owner, other, models.PeopleQuery{})
			return err
		},
		"read the dashboard": func() error {
			_, err := f.svc.GetDashboard(f.ctx, f.owner, other)
			return err
		},
		"read the recruiters": func() error {
			_, err := f.svc.GetRecruiters(f.ctx, f.owner, other, models.PeopleQuery{})
			return err
		},
		"read the invitations": func() error {
			_, err := f.svc.ListInvitations(f.ctx, f.owner, other, "")
			return err
		},
		"read the verification file": func() error {
			_, err := f.svc.GetVerification(f.ctx, f.owner, other)
			return err
		},
		"read the audit log": func() error {
			_, _, err := f.svc.GetAuditLog(f.ctx, f.owner, other, 1, 20)
			return err
		},
		"edit the profile": func() error {
			_, err := f.svc.UpdateCompany(f.ctx, f.owner, other, models.CompanyUpdatePayload{Name: &name})
			return err
		},
		"invite a recruiter": func() error {
			_, err := f.svc.InviteMember(f.ctx, f.owner, other, models.TeamInvitePayload{
				Email: "intruder@example.com", Role: string(domain.RoleRecruiter),
			})
			return err
		},
		"remove a member": func() error {
			return f.svc.RemoveTeamMember(f.ctx, f.owner, other, f.memberID(other, otherOwner.UserID))
		},
		"publish an update": func() error {
			_, err := f.svc.CreateUpdate(f.ctx, f.owner, other, models.UpdatePayload{
				Type: "text", Body: "We are hiring", Status: "published",
			})
			return err
		},
	}

	for name, attempt := range attempts {
		t.Run(name, func(t *testing.T) {
			err := attempt()
			if !errors.Is(err, domain.ErrNotFound) {
				t.Errorf("an owner of another company could %s: %v", name, err)
			}
			if errors.Is(err, domain.ErrForbidden) {
				t.Error("the refusal confirmed the company exists")
			}
		})
	}

	// The company's own owner is unaffected by all of the above.
	if _, err := f.svc.GetTeam(f.ctx, otherOwner, other, models.PeopleQuery{}); err != nil {
		t.Errorf("the rightful owner was refused their own team: %v", err)
	}
}

// Each role reaches exactly the parts of the back office its permissions
// describe, resolved through the real grant query rather than an in-memory
// Grant literal.
func TestDBRoleReachOnRealGrants(t *testing.T) {
	f := newFixture(t)

	recruiterAdmin := f.seedMember(f.company, domain.RoleRecruiterAdmin, domain.MembershipApproved)
	recruiter := f.seedMember(f.company, domain.RoleRecruiter, domain.MembershipApproved)
	employee := f.seedMember(f.company, domain.RoleEmployee, domain.MembershipApproved)
	stranger := f.seedUser()

	name := "Renamed"

	t.Run("recruiter admin cannot edit the company", func(t *testing.T) {
		_, err := f.svc.UpdateCompany(f.ctx, recruiterAdmin, f.company, models.CompanyUpdatePayload{Name: &name})
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("got %v, want ErrForbidden", err)
		}
	})

	t.Run("recruiter admin can read analytics", func(t *testing.T) {
		if _, err := f.svc.GetAnalytics(f.ctx, recruiterAdmin, f.company, time.Time{}, time.Time{}); err != nil {
			t.Errorf("got %v, want success", err)
		}
	})

	t.Run("recruiter admin cannot read the audit log", func(t *testing.T) {
		_, _, err := f.svc.GetAuditLog(f.ctx, recruiterAdmin, f.company, 1, 20)
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("got %v, want ErrForbidden", err)
		}
	})

	t.Run("recruiter cannot manage the team", func(t *testing.T) {
		target := f.memberID(f.company, employee.UserID)
		err := f.svc.UpdateTeamMember(f.ctx, recruiter, f.company, target, models.TeamMemberUpdatePayload{Role: string(domain.RoleViewer)})
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("got %v, want ErrForbidden", err)
		}
	})

	t.Run("employee cannot read the team", func(t *testing.T) {
		_, err := f.svc.GetTeam(f.ctx, employee, f.company, models.PeopleQuery{})
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("got %v, want ErrForbidden", err)
		}
	})

	t.Run("stranger is told nothing", func(t *testing.T) {
		_, err := f.svc.GetTeam(f.ctx, stranger, f.company, models.PeopleQuery{})
		if !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("got %v, want ErrNotFound", err)
		}
	})

	t.Run("owner reaches everything", func(t *testing.T) {
		if _, err := f.svc.UpdateCompany(f.ctx, f.owner, f.company, models.CompanyUpdatePayload{Name: &name}); err != nil {
			t.Errorf("edit: %v", err)
		}
		if _, err := f.svc.GetTeam(f.ctx, f.owner, f.company, models.PeopleQuery{}); err != nil {
			t.Errorf("team: %v", err)
		}
		if _, _, err := f.svc.GetAuditLog(f.ctx, f.owner, f.company, 1, 20); err != nil {
			t.Errorf("audit: %v", err)
		}
	})
}

// The company switcher lists only where the caller actually has standing, and
// carries the permissions that standing gives. A leak here would hand one
// organization the name of another before any per-company check runs.
func TestDBListMyCompaniesOnlyNamesRealStanding(t *testing.T) {
	f := newFixture(t)

	other, _ := f.seedCompany("Unrelated Co")
	otherOwner := f.seedMember(other, domain.RoleCompanyOwner, domain.MembershipApproved)
	f.setOwner(other, otherOwner.UserID)

	admin := f.seedMember(f.company, domain.RoleOrgAdmin, domain.MembershipApproved)
	pending := f.seedMember(f.company, domain.RoleOrgAdmin, domain.MembershipPending)
	stranger := f.seedUser()

	names := func(actor Actor) map[uuid.UUID]models.CompanyMembership {
		f.t.Helper()
		list, err := f.svc.ListMyCompanies(f.ctx, actor)
		if err != nil {
			t.Fatalf("list: %v", err)
		}
		out := map[uuid.UUID]models.CompanyMembership{}
		for _, m := range list {
			out[m.Company.ID] = m
		}
		return out
	}

	t.Run("owner sees their own company and not the other", func(t *testing.T) {
		got := names(f.owner)
		if _, ok := got[f.company]; !ok {
			t.Error("the owner's own company was missing from the switcher")
		}
		if _, ok := got[other]; ok {
			t.Error("the switcher named a company the caller has no standing in")
		}
	})

	t.Run("an approved admin is listed with their permissions", func(t *testing.T) {
		entry, ok := names(admin)[f.company]
		if !ok {
			t.Fatal("an approved org admin was not offered their company")
		}
		if len(entry.Permissions) == 0 {
			t.Error("the entry carried no permissions, so the dashboard cannot render")
		}
		for _, perm := range entry.Permissions {
			if perm == domain.PermCompanyDelete {
				t.Error("an org admin was handed the owner-only delete permission")
			}
		}
	})

	t.Run("a pending request opens no dashboard", func(t *testing.T) {
		if len(names(pending)) != 0 {
			t.Error("an unapproved association request appeared in the switcher")
		}
	})

	t.Run("a stranger is offered nothing", func(t *testing.T) {
		if len(names(stranger)) != 0 {
			t.Error("a user with no membership was offered a company")
		}
	})
}

// A membership that is not approved carries no permissions, whatever role the
// row names. This is what makes suspension work.
func TestDBUnapprovedMembershipCarriesNothing(t *testing.T) {
	f := newFixture(t)

	for _, status := range []domain.MembershipStatus{
		domain.MembershipPending, domain.MembershipRejected,
		domain.MembershipRemoved, domain.MembershipSuspended,
	} {
		t.Run(string(status), func(t *testing.T) {
			member := f.seedMember(f.company, domain.RoleOrgAdmin, status)

			_, err := f.svc.GetTeam(f.ctx, member, f.company, models.PeopleQuery{})
			if !errors.Is(err, domain.ErrNotFound) {
				t.Errorf("a %s org admin reached the team: %v", status, err)
			}

			name := "Renamed"
			if _, err := f.svc.UpdateCompany(f.ctx, member, f.company, models.CompanyUpdatePayload{Name: &name}); err == nil {
				t.Errorf("a %s org admin edited the company", status)
			}
		})
	}
}

// Nobody may hand out a role at or above their own, and the last owner cannot
// be demoted — either would end with a company its rightful owner has lost.
func TestDBPrivilegeEscalationIsBlocked(t *testing.T) {
	f := newFixture(t)

	recruiterAdmin := f.seedMember(f.company, domain.RoleRecruiterAdmin, domain.MembershipApproved)
	orgAdmin := f.seedMember(f.company, domain.RoleOrgAdmin, domain.MembershipApproved)
	recruiter := f.seedMember(f.company, domain.RoleRecruiter, domain.MembershipApproved)

	t.Run("recruiter admin promotes itself", func(t *testing.T) {
		self := f.memberID(f.company, recruiterAdmin.UserID)
		err := f.svc.UpdateTeamMember(f.ctx, recruiterAdmin, f.company, self, models.TeamMemberUpdatePayload{
			Role: string(domain.RoleCompanyOwner),
		})
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("got %v, want ErrForbidden", err)
		}
	})

	t.Run("recruiter admin promotes a recruiter to org admin", func(t *testing.T) {
		target := f.memberID(f.company, recruiter.UserID)
		err := f.svc.UpdateTeamMember(f.ctx, recruiterAdmin, f.company, target, models.TeamMemberUpdatePayload{
			Role: string(domain.RoleOrgAdmin),
		})
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("got %v, want ErrForbidden", err)
		}
	})

	t.Run("org admin edits the owner", func(t *testing.T) {
		target := f.memberID(f.company, f.owner.UserID)
		err := f.svc.UpdateTeamMember(f.ctx, orgAdmin, f.company, target, models.TeamMemberUpdatePayload{
			Role: string(domain.RoleViewer),
		})
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("an org admin demoted the owner: %v", err)
		}
	})

	t.Run("org admin removes the owner", func(t *testing.T) {
		target := f.memberID(f.company, f.owner.UserID)
		if err := f.svc.RemoveTeamMember(f.ctx, orgAdmin, f.company, target); err == nil {
			t.Error("an org admin removed the owner")
		}
	})

	t.Run("the last owner cannot demote themselves", func(t *testing.T) {
		self := f.memberID(f.company, f.owner.UserID)
		err := f.svc.UpdateTeamMember(f.ctx, f.owner, f.company, self, models.TeamMemberUpdatePayload{
			Role: string(domain.RoleViewer),
		})
		if err == nil {
			t.Error("the sole owner demoted themselves, leaving the company unadministrable")
		}
	})

	t.Run("editing permissions is itself a permission", func(t *testing.T) {
		target := f.memberID(f.company, recruiter.UserID)
		err := f.svc.SetMemberPermissions(f.ctx, recruiterAdmin, f.company, target, []string{
			string(domain.PermAnalyticsView),
		})
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("a recruiter admin edited permissions without permission:edit: %v", err)
		}
	})

	t.Run("nobody grants a permission they lack", func(t *testing.T) {
		target := f.memberID(f.company, recruiter.UserID)
		err := f.svc.SetMemberPermissions(f.ctx, orgAdmin, f.company, target, []string{
			string(domain.PermCompanyDelete),
		})
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("an org admin granted company:delete, which only an owner holds: %v", err)
		}

		// And the failed attempt granted nothing at all.
		if _, err := f.svc.GetAnalytics(f.ctx, recruiter, f.company, time.Time{}, time.Time{}); !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("the rejected grant partially applied: %v", err)
		}
	})

	t.Run("a permission the granter holds is allowed", func(t *testing.T) {
		target := f.memberID(f.company, recruiter.UserID)
		if err := f.svc.SetMemberPermissions(f.ctx, orgAdmin, f.company, target, []string{
			string(domain.PermAnalyticsView),
		}); err != nil {
			t.Fatalf("an org admin could not grant analytics:view, which it holds: %v", err)
		}

		// And the grant now takes effect for the recruiter.
		if _, err := f.svc.GetAnalytics(f.ctx, recruiter, f.company, time.Time{}, time.Time{}); err != nil {
			t.Errorf("the granted permission did not take effect: %v", err)
		}
	})
}

// Submitting a verification puts the company in review and nothing more. The
// badge appears only after an administrator says so.
func TestDBVerificationNeverSelfApproves(t *testing.T) {
	f := newFixture(t)

	if got := f.verificationStatus(f.company); got != string(domain.VerificationNotVerified) {
		t.Fatalf("a new company starts at %q, want not_verified", got)
	}

	payload := models.VerificationSubmitPayload{
		LegalName:           "Fixture Co Ltd",
		RegistrationNumber:  "REG-1",
		RegistrationCountry: "AE",
		ContactEmail:        "legal@fixture.test",
		Documents: []models.VerificationDocument{{
			DocumentType: "registration_certificate",
			FileURL:      "https://cdn.example/docs/reg.pdf",
			FileName:     "reg.pdf",
			FileSize:     2048,
			MimeType:     "application/pdf",
		}},
	}

	verification, err := f.svc.SubmitVerification(f.ctx, f.owner, f.company, payload)
	if err != nil {
		t.Fatalf("submit: %v", err)
	}
	if verification.Status != domain.VerificationPending {
		t.Errorf("a fresh submission is %q, want pending", verification.Status)
	}
	if got := f.verificationStatus(f.company); got != string(domain.VerificationPending) {
		t.Errorf("the profile reads %q, want pending", got)
	}

	detail, err := f.svc.GetCompany(f.ctx, Actor{}, f.company)
	if err != nil {
		t.Fatalf("read company: %v", err)
	}
	if detail.IsVerified {
		t.Error("a company under review advertised itself as verified")
	}

	// The owner cannot rule on their own submission, whatever they send.
	err = f.svc.DecideVerification(f.ctx, f.owner, verification.ID, models.VerificationDecisionPayload{Status: "verified"})
	if !errors.Is(err, domain.ErrForbidden) {
		t.Errorf("the company owner decided their own verification: %v", err)
	}
	if got := f.verificationStatus(f.company); got != string(domain.VerificationPending) {
		t.Fatalf("the failed decision changed the status to %q", got)
	}

	// A second submission while one is outstanding is refused.
	if _, err := f.svc.SubmitVerification(f.ctx, f.owner, f.company, payload); !errors.Is(err, domain.ErrConflict) {
		t.Errorf("a second review was queued: %v", err)
	}

	// An administrator approves, and only then does the badge appear.
	admin := Actor{UserID: f.seedUser().UserID, PlatformRole: "admin"}
	if err := f.svc.DecideVerification(f.ctx, admin, verification.ID, models.VerificationDecisionPayload{Status: "verified"}); err != nil {
		t.Fatalf("administrator decision: %v", err)
	}
	if got := f.verificationStatus(f.company); got != string(domain.VerificationVerified) {
		t.Errorf("after approval the profile reads %q", got)
	}
	detail, err = f.svc.GetCompany(f.ctx, Actor{}, f.company)
	if err != nil {
		t.Fatalf("read company: %v", err)
	}
	if !detail.IsVerified {
		t.Error("an approved company does not show its badge")
	}
}

// An invitation is a bearer token sent to one address. It has to be unguessable,
// single-use, revocable, and useless to anyone but its recipient.
func TestDBInvitationSecurity(t *testing.T) {
	f := newFixture(t)

	invitee := f.seedUser()
	issued, err := f.svc.InviteMember(f.ctx, f.owner, f.company, models.TeamInvitePayload{
		Email: invitee.Email,
		Role:  string(domain.RoleRecruiter),
	})
	if err != nil {
		t.Fatalf("invite: %v", err)
	}

	token := tokenFromAcceptURL(t, issued.AcceptURL)
	if token == "" {
		t.Fatal("the invitation carried no token")
	}

	t.Run("the plaintext token is not stored", func(t *testing.T) {
		var stored string
		if err := f.pool.QueryRow(f.ctx,
			`SELECT token_hash FROM company_invitations WHERE id = $1`, issued.Invitation.ID).Scan(&stored); err != nil {
			t.Fatalf("read invitation: %v", err)
		}
		if stored == token {
			t.Error("the invitation token is stored in plaintext")
		}
		if !domain.InvitationTokenMatches(token, stored) {
			t.Error("the stored hash does not match the issued token")
		}
	})

	t.Run("a wrong account cannot redeem it", func(t *testing.T) {
		finder := f.seedUser()
		_, err := f.svc.AcceptInvitation(f.ctx, finder, token)
		if !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("someone who found the link joined the company: %v", err)
		}
	})

	t.Run("a guessed token finds nothing", func(t *testing.T) {
		guess, _, err := domain.NewInvitationToken()
		if err != nil {
			t.Fatalf("mint: %v", err)
		}
		if _, err := f.svc.AcceptInvitation(f.ctx, invitee, guess); !errors.Is(err, domain.ErrNotFound) {
			t.Errorf("a guessed token resolved to something: %v", err)
		}
	})

	t.Run("the recipient can redeem it once", func(t *testing.T) {
		companyID, err := f.svc.AcceptInvitation(f.ctx, invitee, token)
		if err != nil {
			t.Fatalf("accept: %v", err)
		}
		if companyID != f.company {
			t.Errorf("accepted into %s, want %s", companyID, f.company)
		}

		if _, err := f.svc.AcceptInvitation(f.ctx, invitee, token); !errors.Is(err, domain.ErrConflict) {
			t.Errorf("the same invitation was redeemed twice: %v", err)
		}
	})

	t.Run("the membership carries the invited role and nothing more", func(t *testing.T) {
		if _, err := f.svc.GetTeam(f.ctx, invitee, f.company, models.PeopleQuery{}); err != nil {
			t.Errorf("the new recruiter cannot see the team: %v", err)
		}
		name := "Renamed By A Recruiter"
		if _, err := f.svc.UpdateCompany(f.ctx, invitee, f.company, models.CompanyUpdatePayload{Name: &name}); !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("the new recruiter edited the company: %v", err)
		}
	})

	t.Run("a revoked invitation stops working", func(t *testing.T) {
		other := f.seedUser()
		revoked, err := f.svc.InviteMember(f.ctx, f.owner, f.company, models.TeamInvitePayload{
			Email: other.Email,
			Role:  string(domain.RoleViewer),
		})
		if err != nil {
			t.Fatalf("invite: %v", err)
		}
		if err := f.svc.RevokeInvitation(f.ctx, f.owner, f.company, revoked.Invitation.ID); err != nil {
			t.Fatalf("revoke: %v", err)
		}
		if _, err := f.svc.AcceptInvitation(f.ctx, other, tokenFromAcceptURL(t, revoked.AcceptURL)); !errors.Is(err, domain.ErrConflict) {
			t.Errorf("a revoked invitation was redeemed: %v", err)
		}
	})

	t.Run("an expired invitation stops working", func(t *testing.T) {
		other := f.seedUser()
		stale, err := f.svc.InviteMember(f.ctx, f.owner, f.company, models.TeamInvitePayload{
			Email: other.Email,
			Role:  string(domain.RoleViewer),
		})
		if err != nil {
			t.Fatalf("invite: %v", err)
		}
		if _, err := f.pool.Exec(f.ctx,
			`UPDATE company_invitations SET expires_at = NOW() - INTERVAL '1 day' WHERE id = $1`,
			stale.Invitation.ID); err != nil {
			t.Fatalf("age the invitation: %v", err)
		}
		if _, err := f.svc.AcceptInvitation(f.ctx, other, tokenFromAcceptURL(t, stale.AcceptURL)); !errors.Is(err, domain.ErrConflict) {
			t.Errorf("an expired invitation was redeemed: %v", err)
		}
	})

	t.Run("nobody invites at or above their own level", func(t *testing.T) {
		recruiterAdmin := f.seedMember(f.company, domain.RoleRecruiterAdmin, domain.MembershipApproved)

		// An owner invitation is refused outright: a recruiter admin holds
		// recruiter:invite but not the general team:invite.
		if _, err := f.svc.InviteMember(f.ctx, recruiterAdmin, f.company, models.TeamInvitePayload{
			Email: "escalate@example.com",
			Role:  string(domain.RoleCompanyOwner),
		}); !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("a recruiter admin invited an owner: %v", err)
		}

		// A peer recruiter admin passes the permission gate — recruiting roles
		// are theirs to invite — and is stopped by the assignment ceiling.
		if _, err := f.svc.InviteMember(f.ctx, recruiterAdmin, f.company, models.TeamInvitePayload{
			Email: "peer@example.com",
			Role:  string(domain.RoleRecruiterAdmin),
		}); !errors.Is(err, domain.ErrForbidden) {
			t.Errorf("a recruiter admin cloned itself: %v", err)
		}

		// The role below it is theirs to hand out.
		if _, err := f.svc.InviteMember(f.ctx, recruiterAdmin, f.company, models.TeamInvitePayload{
			Email: "newhire@example.com",
			Role:  string(domain.RoleRecruiter),
		}); err != nil {
			t.Errorf("a recruiter admin could not invite a recruiter: %v", err)
		}
	})
}

// A public visitor sees only the people who chose to be visible, and cannot
// use the administrative filters to enumerate the rest.
func TestDBPeopleRespectPrivacySettings(t *testing.T) {
	f := newFixture(t)

	private := f.seedMember(f.company, domain.RoleEmployee, domain.MembershipApproved)
	if _, err := f.pool.Exec(f.ctx,
		`UPDATE company_members SET is_public = FALSE WHERE company_id = $1 AND user_id = $2`,
		f.company, private.UserID); err != nil {
		t.Fatalf("hide the member: %v", err)
	}
	pending := f.seedMember(f.company, domain.RoleEmployee, domain.MembershipPending)

	public, err := f.svc.GetPeople(f.ctx, Actor{}, f.company, models.PeopleQuery{})
	if err != nil {
		t.Fatalf("public people: %v", err)
	}
	for _, person := range public.Items {
		if person.UserID == private.UserID {
			t.Error("a member who opted out of public listing was listed")
		}
		if person.UserID == pending.UserID {
			t.Error("a pending association was listed publicly")
		}
	}

	// The administrative filters are ignored for a public caller rather than
	// answered, so they cannot be used to enumerate the hidden rows.
	filtered, err := f.svc.GetPeople(f.ctx, Actor{}, f.company, models.PeopleQuery{Status: "pending"})
	if err != nil {
		t.Fatalf("filtered people: %v", err)
	}
	for _, person := range filtered.Items {
		if person.UserID == pending.UserID {
			t.Error("a public caller filtered the directory down to pending associations")
		}
	}

	// The team view, which requires team:view, does see them.
	team, err := f.svc.GetTeam(f.ctx, f.owner, f.company, models.PeopleQuery{})
	if err != nil {
		t.Fatalf("team: %v", err)
	}
	var sawPrivate bool
	for _, person := range team.Items {
		if person.UserID == private.UserID {
			sawPrivate = true
		}
	}
	if !sawPrivate {
		t.Error("the team list hid a member from their own administrators")
	}
}

// The individually granted permissions on a member row are readable only by
// someone who may rewrite them.
//
// The read exists because SetMemberPermissions replaces the list outright: an
// editor that could not see the current value would erase it on every save. It
// is withheld from everyone else because who was handed which extra authority
// is an administrative detail, and team:view alone is not a reason to see it.
func TestDBExtraPermissionsAreVisibleOnlyToPermissionEditors(t *testing.T) {
	f := newFixture(t)

	member := f.seedMember(f.company, domain.RoleEmployee, domain.MembershipApproved)
	memberID := f.memberID(f.company, member.UserID)
	granted := []string{string(domain.PermJobView), string(domain.PermAnalyticsView)}

	if err := f.svc.SetMemberPermissions(f.ctx, f.owner, f.company, memberID, granted); err != nil {
		t.Fatalf("grant extra permissions: %v", err)
	}

	find := func(page *models.CompanyPeoplePage) *models.CompanyPerson {
		t.Helper()
		for i := range page.Items {
			if page.Items[i].UserID == member.UserID {
				return &page.Items[i]
			}
		}
		t.Fatal("the member was missing from the team list")
		return nil
	}

	t.Run("an editor reads the current value", func(t *testing.T) {
		page, err := f.svc.GetTeam(f.ctx, f.owner, f.company, models.PeopleQuery{})
		if err != nil {
			t.Fatalf("team: %v", err)
		}
		person := find(page)
		if len(person.ExtraPermissions) != len(granted) {
			t.Fatalf("got %v extras, want %v", person.ExtraPermissions, granted)
		}
		for _, want := range granted {
			var found bool
			for _, got := range person.ExtraPermissions {
				if string(got) == want {
					found = true
				}
			}
			if !found {
				t.Errorf("%s is missing from %v", want, person.ExtraPermissions)
			}
		}
	})

	t.Run("team:view alone does not", func(t *testing.T) {
		// A recruiter admin holds team:view and not permission:edit.
		reader := f.seedMember(f.company, domain.RoleRecruiterAdmin, domain.MembershipApproved)
		page, err := f.svc.GetTeam(f.ctx, reader, f.company, models.PeopleQuery{})
		if err != nil {
			t.Fatalf("team: %v", err)
		}
		if extras := find(page).ExtraPermissions; len(extras) != 0 {
			t.Errorf("a caller without permission:edit was shown %v", extras)
		}
	})

	t.Run("the company id is part of the predicate", func(t *testing.T) {
		// The member id is real; it just belongs to another company. Reading it
		// under the wrong company must resolve to nothing rather than to the row.
		other, _ := f.seedCompany("Unrelated Co")
		repo := repository.NewManagementRepository(f.pool)
		extras, err := repo.LoadExtraPermissions(f.ctx, other, []uuid.UUID{memberID})
		if err != nil {
			t.Fatalf("load extras: %v", err)
		}
		if len(extras) != 0 {
			t.Errorf("a member of another company contributed %v", extras)
		}
	})
}

// One review per person per company. Without this the rating is farmable.
func TestDBReviewDuplicateControl(t *testing.T) {
	f := newFixture(t)
	reviewer := f.seedUser()

	payload := models.ReviewPayload{
		EmploymentType: string(domain.ReviewFormerEmployee),
		OverallRating:  4,
		Title:          "Good place to grow",
		Summary:        "I spent two years here and learned a great deal from the people around me.",
	}

	first, err := f.svc.CreateReview(f.ctx, reviewer, f.company, payload)
	if err != nil {
		t.Fatalf("first review: %v", err)
	}

	if _, err := f.svc.CreateReview(f.ctx, reviewer, f.company, payload); !errors.Is(err, domain.ErrConflict) {
		t.Errorf("the same person reviewed the same company twice: %v", err)
	}

	// The company can respond to a review but cannot delete it.
	if err := f.svc.RespondToReview(f.ctx, f.owner, f.company, first.ID, models.ReviewResponsePayload{
		Response: "Thank you for taking the time to write this.",
	}); err != nil {
		t.Errorf("the company could not respond to a review: %v", err)
	}
	if err := f.svc.DeleteReview(f.ctx, f.owner, f.company, first.ID); err == nil {
		t.Error("the company deleted a review it did not write")
	}

	// The author can.
	if err := f.svc.DeleteReview(f.ctx, reviewer, f.company, first.ID); err != nil {
		t.Errorf("the author could not delete their own review: %v", err)
	}
}

// A company that is not active is invisible to the public and still reachable
// by its own team, which is what makes suspension a moderation tool rather than
// a deletion.
func TestDBSuspendedCompanyIsHiddenFromThePublic(t *testing.T) {
	f := newFixture(t)

	if _, err := f.pool.Exec(f.ctx, `UPDATE companies SET status = 'suspended' WHERE id = $1`, f.company); err != nil {
		t.Fatalf("suspend: %v", err)
	}

	if _, err := f.svc.GetCompany(f.ctx, Actor{}, f.company); !errors.Is(err, domain.ErrNotFound) {
		t.Errorf("a suspended company was served to the public: %v", err)
	}
	if _, err := f.svc.GetCompany(f.ctx, f.owner, f.company); err != nil {
		t.Errorf("a suspended company was hidden from its own owner: %v", err)
	}
}

// Audit entries are written for the events the module is required to record.
func TestDBAuditTrailRecordsAdministrativeActions(t *testing.T) {
	f := newFixture(t)

	name := "Audited Rename"
	if _, err := f.svc.UpdateCompany(f.ctx, f.owner, f.company, models.CompanyUpdatePayload{Name: &name}); err != nil {
		t.Fatalf("update: %v", err)
	}

	entries, total, err := f.svc.GetAuditLog(f.ctx, f.owner, f.company, 1, 50)
	if err != nil {
		t.Fatalf("audit log: %v", err)
	}
	if total == 0 || len(entries) == 0 {
		t.Fatal("no audit entry was written for a company update")
	}

	var found bool
	for _, entry := range entries {
		if entry.Action == domain.AuditCompanyUpdated {
			found = true
			if entry.ActorID == nil || *entry.ActorID != f.owner.UserID {
				t.Errorf("the entry names actor %v, want %s", entry.ActorID, f.owner.UserID)
			}
		}
	}
	if !found {
		t.Errorf("no %q entry among %d records", domain.AuditCompanyUpdated, len(entries))
	}
}

func tokenFromAcceptURL(t *testing.T, acceptURL string) string {
	t.Helper()
	idx := strings.Index(acceptURL, "token=")
	if idx < 0 {
		return ""
	}
	return acceptURL[idx+len("token="):]
}

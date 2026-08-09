package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"kirmya/internal/company/domain"
	"kirmya/internal/company/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// personColumns is the projection for one membership row. The display name is
// assembled from the users table so this module never stores a second copy of
// someone's name.
const personColumns = `
	m.id, m.user_id,
	TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
	COALESCE(m.job_title, COALESCE(u.job_title, '')),
	COALESCE(d.name, ''), m.department_id,
	COALESCE(m.location, COALESCE(u.current_location, '')),
	m.association_type, m.status, m.role, m.is_public,
	m.started_at, m.ended_at, m.created_at`

func scanPerson(row rowScanner) (models.CompanyPerson, error) {
	var p models.CompanyPerson
	var association, status, role string
	err := row.Scan(
		&p.ID, &p.UserID, &p.Name, &p.JobTitle,
		&p.Department, &p.DepartmentID, &p.Location,
		&association, &status, &role, &p.IsPublic,
		&p.StartedAt, &p.EndedAt, &p.JoinedAt,
	)
	if err != nil {
		return models.CompanyPerson{}, err
	}
	if parsed, ok := domain.ParseAssociationType(association); ok {
		p.AssociationType = parsed
	}
	if parsed, ok := domain.ParseMembershipStatus(status); ok {
		p.Status = parsed
	}
	if parsed, ok := domain.ParseRole(role); ok {
		p.Role = parsed
	}
	return p, nil
}

// ListPeople returns a company's people.
//
// includePrivate is the privacy switch. A public visitor sees only approved
// members who chose to make the association public; a caller holding team:view
// sees every member and their status. The filter is applied in SQL, so a bug in
// the response shaping cannot leak rows that were never fetched.
func (r *ManagementRepository) ListPeople(ctx context.Context, companyID uuid.UUID, q models.PeopleQuery, includePrivate bool) (*models.CompanyPeoplePage, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	page, limit, offset := normalizePage(q.Page, q.Limit)

	where := []string{"m.company_id = $1"}
	args := []any{companyID}
	arg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if !includePrivate {
		where = append(where, "m.status = 'approved'", "m.is_public = TRUE")
	} else if status := strings.TrimSpace(q.Status); status != "" {
		parsed, ok := domain.ParseMembershipStatus(status)
		if !ok {
			return nil, domain.ErrValidation
		}
		where = append(where, "m.status = "+arg(string(parsed)))
	} else {
		where = append(where, "m.status <> 'removed'")
	}

	if term := strings.TrimSpace(q.Query); term != "" {
		p := arg("%" + strings.ToLower(term) + "%")
		where = append(where, fmt.Sprintf(`(
			lower(TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, ''))) LIKE %[1]s
			OR lower(COALESCE(m.job_title, '')) LIKE %[1]s)`, p))
	}
	if v := strings.TrimSpace(q.DepartmentID); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			return nil, domain.ErrValidation
		}
		where = append(where, "m.department_id = "+arg(id))
	}
	if v := strings.TrimSpace(q.AssociationType); v != "" {
		parsed, ok := domain.ParseAssociationType(v)
		if !ok {
			return nil, domain.ErrValidation
		}
		where = append(where, "m.association_type = "+arg(string(parsed)))
	}
	if v := strings.TrimSpace(q.Role); v != "" {
		parsed, ok := domain.ParseRole(v)
		if !ok {
			return nil, domain.ErrValidation
		}
		where = append(where, "m.role = "+arg(string(parsed)))
	}

	clause := strings.Join(where, " AND ")
	from := `
		FROM company_members m
		LEFT JOIN users u ON u.id = m.user_id
		LEFT JOIN company_departments d ON d.id = m.department_id
		WHERE ` + clause

	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) "+from, args...).Scan(&total); err != nil {
		return nil, err
	}

	emailColumn := "''"
	if includePrivate {
		emailColumn = "COALESCE(u.email, '')"
	}

	rows, err := r.db.Query(ctx,
		"SELECT "+personColumns+", "+emailColumn+from+`
		ORDER BY CASE m.status WHEN 'pending' THEN 0 ELSE 1 END,
		         CASE m.role
		             WHEN 'company_owner'   THEN 0
		             WHEN 'org_admin'       THEN 1
		             WHEN 'recruiter_admin' THEN 2
		             WHEN 'hiring_manager'  THEN 3
		             WHEN 'recruiter'       THEN 4
		             WHEN 'employee'        THEN 5
		             ELSE 6 END,
		         m.created_at DESC
		LIMIT `+arg(limit)+` OFFSET `+arg(offset), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []models.CompanyPerson{}
	for rows.Next() {
		var p models.CompanyPerson
		var association, status, role string
		var email string
		if err := rows.Scan(
			&p.ID, &p.UserID, &p.Name, &p.JobTitle,
			&p.Department, &p.DepartmentID, &p.Location,
			&association, &status, &role, &p.IsPublic,
			&p.StartedAt, &p.EndedAt, &p.JoinedAt, &email,
		); err != nil {
			return nil, err
		}
		if parsed, ok := domain.ParseAssociationType(association); ok {
			p.AssociationType = parsed
		}
		if parsed, ok := domain.ParseMembershipStatus(status); ok {
			p.Status = parsed
		}
		if parsed, ok := domain.ParseRole(role); ok {
			p.Role = parsed
		}
		p.Email = email
		items = append(items, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &models.CompanyPeoplePage{
		Items: items, Total: total, Page: page, Limit: limit,
		TotalPages: totalPages(total, limit),
	}, nil
}

// GetMember loads one membership. The company id is part of the predicate, so
// a member id from another company simply does not resolve.
func (r *ManagementRepository) GetMember(ctx context.Context, companyID, memberID uuid.UUID) (*models.CompanyPerson, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	row := r.db.QueryRow(ctx, "SELECT "+personColumns+`
		FROM company_members m
		LEFT JOIN users u ON u.id = m.user_id
		LEFT JOIN company_departments d ON d.id = m.department_id
		WHERE m.company_id = $1 AND m.id = $2`, companyID, memberID)
	p, err := scanPerson(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// FindMemberByUser looks up a membership by user, whatever its status.
func (r *ManagementRepository) FindMemberByUser(ctx context.Context, companyID, userID uuid.UUID) (*models.CompanyPerson, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	row := r.db.QueryRow(ctx, "SELECT "+personColumns+`
		FROM company_members m
		LEFT JOIN users u ON u.id = m.user_id
		LEFT JOIN company_departments d ON d.id = m.department_id
		WHERE m.company_id = $1 AND m.user_id = $2`, companyID, userID)
	p, err := scanPerson(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &p, nil
}

// RequestAssociation records an employee's request to be linked to a company.
// It always lands in 'pending' with the 'employee' role: nobody can hand
// themselves a privileged role by claiming to work somewhere.
func (r *ManagementRepository) RequestAssociation(ctx context.Context, companyID, userID uuid.UUID, p models.AssociationRequestPayload) (*models.CompanyPerson, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	association, ok := domain.ParseAssociationType(p.AssociationType)
	if !ok {
		return nil, domain.ErrValidation
	}

	id := uuid.New()
	_, err := r.db.Exec(ctx, `
		INSERT INTO company_members
			(id, company_id, user_id, role, association_type, status, job_title, department_id, location, is_public)
		VALUES ($1, $2, $3, 'employee', $4, 'pending', $5, $6, $7, $8)
		ON CONFLICT (company_id, user_id) DO UPDATE SET
			association_type = EXCLUDED.association_type,
			job_title        = EXCLUDED.job_title,
			department_id    = EXCLUDED.department_id,
			location         = EXCLUDED.location,
			is_public        = EXCLUDED.is_public,
			-- An approved member editing their details stays approved; anyone
			-- else returns to pending and needs an approval again.
			status = CASE WHEN company_members.status = 'approved' THEN 'approved' ELSE 'pending' END,
			updated_at = NOW()`,
		id, companyID, userID, string(association),
		strings.TrimSpace(p.JobTitle), p.DepartmentID, strings.TrimSpace(p.Location), p.IsPublic)
	if err != nil {
		return nil, err
	}
	return r.FindMemberByUser(ctx, companyID, userID)
}

// DecideAssociation approves or rejects a pending association.
func (r *ManagementRepository) DecideAssociation(ctx context.Context, companyID, memberID, approverID uuid.UUID, status domain.MembershipStatus) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	tag, err := r.db.Exec(ctx, `
		UPDATE company_members
		SET status = $3, approved_by = $4, approved_at = NOW(), updated_at = NOW()
		WHERE company_id = $1 AND id = $2`,
		companyID, memberID, string(status), approverID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return r.RefreshCounters(ctx, companyID)
}

// UpdateMember changes a member's role, status, title or department in one
// transaction. role is applied to both the membership row and the role
// assignment table so the two can never disagree.
func (r *ManagementRepository) UpdateMember(ctx context.Context, companyID, memberID, actorID uuid.UUID, role *domain.Role, status *domain.MembershipStatus, jobTitle *string, departmentID *uuid.UUID, clearDepartment bool) error {
	if r.db == nil {
		return ErrNoDatabase
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var userID uuid.UUID
	err = tx.QueryRow(ctx,
		`SELECT user_id FROM company_members WHERE company_id = $1 AND id = $2 FOR UPDATE`,
		companyID, memberID).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return err
	}

	sets := []string{"updated_at = NOW()"}
	args := []any{companyID, memberID}
	arg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}
	if role != nil {
		sets = append(sets, "role = "+arg(string(*role)))
	}
	if status != nil {
		sets = append(sets, "status = "+arg(string(*status)))
	}
	if jobTitle != nil {
		sets = append(sets, "job_title = "+arg(strings.TrimSpace(*jobTitle)))
	}
	if clearDepartment {
		sets = append(sets, "department_id = NULL")
	} else if departmentID != nil {
		sets = append(sets, "department_id = "+arg(*departmentID))
	}

	if _, err := tx.Exec(ctx,
		"UPDATE company_members SET "+strings.Join(sets, ", ")+" WHERE company_id = $1 AND id = $2",
		args...); err != nil {
		return err
	}

	if role != nil {
		// One primary role per member: the old assignments go, the new one is
		// written. Extra permissions are not carried across, because they were
		// granted against the role that no longer applies.
		if _, err := tx.Exec(ctx,
			`DELETE FROM company_member_roles WHERE company_id = $1 AND member_id = $2`,
			companyID, memberID); err != nil {
			return err
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO company_member_roles (id, company_id, member_id, user_id, role, granted_by)
			VALUES ($1, $2, $3, $4, $5, $6)
			ON CONFLICT (company_id, user_id, role) DO NOTHING`,
			uuid.New(), companyID, memberID, userID, string(*role), actorID); err != nil {
			return err
		}
		// Ownership is single-holder: promoting someone to owner moves the
		// company's owner_id with them.
		if *role == domain.RoleCompanyOwner {
			if _, err := tx.Exec(ctx,
				`UPDATE companies SET owner_id = $2, updated_at = NOW() WHERE id = $1`,
				companyID, userID); err != nil {
				return err
			}
		}
	}

	return tx.Commit(ctx)
}

// SetExtraPermissions replaces a member's individually granted permissions.
// These only ever add to what the role already carries.
func (r *ManagementRepository) SetExtraPermissions(ctx context.Context, companyID, memberID, actorID uuid.UUID, perms []domain.Permission) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	values := make([]string, 0, len(perms))
	for _, p := range perms {
		values = append(values, string(p))
	}
	tag, err := r.db.Exec(ctx, `
		UPDATE company_member_roles
		SET extra_permissions = $3, granted_by = $4
		WHERE company_id = $1 AND member_id = $2`,
		companyID, memberID, values, actorID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// LoadExtraPermissions returns the individually granted permissions for the
// given members of one company, keyed by member id.
//
// The company id is part of the predicate, so a member id belonging to another
// company contributes nothing rather than resolving. Members with no extras are
// absent from the map rather than present with an empty slice.
func (r *ManagementRepository) LoadExtraPermissions(ctx context.Context, companyID uuid.UUID, memberIDs []uuid.UUID) (map[uuid.UUID][]domain.Permission, error) {
	out := map[uuid.UUID][]domain.Permission{}
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	if companyID == uuid.Nil || len(memberIDs) == 0 {
		return out, nil
	}

	rows, err := r.db.Query(ctx, `
		SELECT member_id, extra_permissions
		FROM company_member_roles
		WHERE company_id = $1 AND member_id = ANY($2)`, companyID, memberIDs)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var memberID uuid.UUID
		var extras []string
		if err := rows.Scan(&memberID, &extras); err != nil {
			return nil, err
		}
		// A member can hold several role rows, so the extras are unioned rather
		// than overwritten by whichever row happens to come last.
		seen := map[domain.Permission]bool{}
		for _, existing := range out[memberID] {
			seen[existing] = true
		}
		for _, raw := range extras {
			perm := domain.Permission(strings.TrimSpace(raw))
			if perm == "" || seen[perm] {
				continue
			}
			seen[perm] = true
			out[memberID] = append(out[memberID], perm)
		}
	}
	return out, rows.Err()
}

// RemoveMember revokes access. The row is kept with status 'removed' rather
// than deleted, so the audit trail still points at something and a re-added
// person does not silently inherit the old record's history.
func (r *ManagementRepository) RemoveMember(ctx context.Context, companyID, memberID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	tag, err := tx.Exec(ctx, `
		UPDATE company_members
		SET status = 'removed', is_public = FALSE, ended_at = COALESCE(ended_at, CURRENT_DATE), updated_at = NOW()
		WHERE company_id = $1 AND id = $2`, companyID, memberID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	if _, err := tx.Exec(ctx,
		`DELETE FROM company_member_roles WHERE company_id = $1 AND member_id = $2`,
		companyID, memberID); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	return r.RefreshCounters(ctx, companyID)
}

// OwnerCount reports how many owners a company has, so removing or demoting
// the last one can be refused.
func (r *ManagementRepository) OwnerCount(ctx context.Context, companyID uuid.UUID) (int, error) {
	if r.db == nil {
		return 0, ErrNoDatabase
	}
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM company_members
		WHERE company_id = $1 AND status = 'approved' AND role = 'company_owner'`,
		companyID).Scan(&count)
	return count, err
}

// ListDepartments returns a company's departments with live employee counts.
func (r *ManagementRepository) ListDepartments(ctx context.Context, companyID uuid.UUID) ([]models.CompanyDepartment, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	rows, err := r.db.Query(ctx, `
		SELECT d.id, d.name, COALESCE(d.description, ''),
		       (SELECT COUNT(*) FROM company_members m
		        WHERE m.department_id = d.id AND m.status = 'approved'),
		       (SELECT COUNT(*) FROM jobs j
		        WHERE j.company_id = d.company_id AND j.status = 'active'
		          AND lower(COALESCE(j.department, '')) = lower(d.name))
		FROM company_departments d
		WHERE d.company_id = $1
		ORDER BY d.name ASC`, companyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.CompanyDepartment{}
	for rows.Next() {
		var d models.CompanyDepartment
		if err := rows.Scan(&d.ID, &d.Name, &d.Description, &d.EmployeeCount, &d.OpenJobs); err != nil {
			return nil, err
		}
		out = append(out, d)
	}
	return out, rows.Err()
}

// CreateDepartment adds a department. The unique index on (company_id, lower(name))
// is what makes a repeated name a conflict rather than a duplicate.
func (r *ManagementRepository) CreateDepartment(ctx context.Context, companyID uuid.UUID, name, description string) (uuid.UUID, error) {
	if r.db == nil {
		return uuid.Nil, ErrNoDatabase
	}
	id := uuid.New()
	_, err := r.db.Exec(ctx,
		`INSERT INTO company_departments (id, company_id, name, description) VALUES ($1, $2, $3, $4)`,
		id, companyID, strings.TrimSpace(name), strings.TrimSpace(description))
	if isUniqueViolation(err) {
		return uuid.Nil, domain.ErrConflict
	}
	return id, err
}

// DepartmentBelongsTo checks that a department id is this company's before it
// is written onto a member or an invitation.
func (r *ManagementRepository) DepartmentBelongsTo(ctx context.Context, companyID, departmentID uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, ErrNoDatabase
	}
	var exists bool
	err := r.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM company_departments WHERE id = $1 AND company_id = $2)`,
		departmentID, companyID).Scan(&exists)
	return exists, err
}

// isUniqueViolation reports whether an error is PostgreSQL's unique constraint
// violation, which the service turns into a 409 rather than a 500.
func isUniqueViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "SQLSTATE 23505")
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

const invitationColumns = `
	i.id, i.company_id, i.email, i.role, i.association_type,
	COALESCE(i.job_title, ''), i.status, i.channel, COALESCE(i.message, ''),
	i.invited_by, i.expires_at, i.created_at, i.invited_user_id`

func scanInvitation(row rowScanner) (models.CompanyInvitation, error) {
	var inv models.CompanyInvitation
	var role, association, status string
	err := row.Scan(&inv.ID, &inv.CompanyID, &inv.Email, &role, &association,
		&inv.JobTitle, &status, &inv.Channel, &inv.Message,
		&inv.InvitedBy, &inv.ExpiresAt, &inv.CreatedAt, &inv.InvitedUserID)
	if err != nil {
		return models.CompanyInvitation{}, err
	}
	if parsed, ok := domain.ParseRole(role); ok {
		inv.Role = parsed
	}
	if parsed, ok := domain.ParseAssociationType(association); ok {
		inv.AssociationType = parsed
	}
	if parsed, ok := domain.ParseInvitationStatus(status); ok {
		inv.Status = parsed
	}
	return inv, nil
}

// CreateInvitation issues an invitation and stores only the hash of its token.
// Re-inviting the same address revokes the outstanding invitation first, so the
// previously mailed link stops working the moment a new one is sent.
func (r *ManagementRepository) CreateInvitation(ctx context.Context, companyID, inviterID uuid.UUID, email string, role domain.Role, association domain.AssociationType, channel domain.InvitationChannel, jobTitle, message string, departmentID *uuid.UUID, tokenHash string, expiresAt time.Time) (*models.CompanyInvitation, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `
		UPDATE company_invitations
		SET status = 'revoked', revoked_by = $3, revoked_at = NOW(), updated_at = NOW()
		WHERE company_id = $1 AND lower(email) = lower($2) AND status = 'pending'`,
		companyID, email, inviterID); err != nil {
		return nil, err
	}

	// An existing platform user is linked at issue time so accepting can be
	// checked against the account rather than a re-typed address.
	var invitedUserID *uuid.UUID
	var found uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM users WHERE lower(email) = lower($1)`, email).Scan(&found)
	switch {
	case err == nil:
		invitedUserID = &found
	case errors.Is(err, pgx.ErrNoRows):
	default:
		return nil, err
	}

	id := uuid.New()
	if _, err := tx.Exec(ctx, `
		INSERT INTO company_invitations
			(id, company_id, email, invited_user_id, role, association_type, department_id,
			 job_title, message, token_hash, status, channel, expires_at, invited_by)
		VALUES ($1, $2, lower($3), $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12, $13)`,
		id, companyID, strings.TrimSpace(email), invitedUserID, string(role), string(association),
		departmentID, strings.TrimSpace(jobTitle), strings.TrimSpace(message), tokenHash,
		string(channel), expiresAt, inviterID); err != nil {
		if isUniqueViolation(err) {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return r.GetInvitation(ctx, companyID, id)
}

// GetInvitation loads one invitation belonging to a company.
func (r *ManagementRepository) GetInvitation(ctx context.Context, companyID, invitationID uuid.UUID) (*models.CompanyInvitation, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	row := r.db.QueryRow(ctx, "SELECT "+invitationColumns+`
		FROM company_invitations i WHERE i.company_id = $1 AND i.id = $2`, companyID, invitationID)
	inv, err := scanInvitation(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

// ListInvitations returns a company's invitations, newest first.
func (r *ManagementRepository) ListInvitations(ctx context.Context, companyID uuid.UUID, status string) ([]models.CompanyInvitation, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	args := []any{companyID}
	clause := "i.company_id = $1"
	if status = strings.TrimSpace(status); status != "" {
		parsed, ok := domain.ParseInvitationStatus(status)
		if !ok {
			return nil, domain.ErrValidation
		}
		args = append(args, string(parsed))
		clause += " AND i.status = $2"
	}

	rows, err := r.db.Query(ctx, "SELECT "+invitationColumns+`
		FROM company_invitations i WHERE `+clause+` ORDER BY i.created_at DESC LIMIT 200`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []models.CompanyInvitation{}
	for rows.Next() {
		inv, err := scanInvitation(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, inv)
	}
	return out, rows.Err()
}

// InvitationByToken resolves a presented token to its invitation.
//
// The lookup is by hash, so the plaintext never has to be stored to be found,
// and an expired invitation is reported as expired rather than silently
// accepted.
func (r *ManagementRepository) InvitationByToken(ctx context.Context, plaintext string) (*models.CompanyInvitation, error) {
	if r.db == nil {
		return nil, ErrNoDatabase
	}
	hash := domain.HashInvitationToken(plaintext)
	if hash == "" {
		return nil, domain.ErrNotFound
	}

	row := r.db.QueryRow(ctx, "SELECT "+invitationColumns+`
		FROM company_invitations i WHERE i.token_hash = $1`, hash)
	inv, err := scanInvitation(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if inv.Status == domain.InvitationPending && inv.ExpiresAt.Before(nowUTC()) {
		if _, err := r.db.Exec(ctx,
			`UPDATE company_invitations SET status = 'expired', updated_at = NOW() WHERE id = $1`,
			inv.ID); err != nil {
			return nil, err
		}
		inv.Status = domain.InvitationExpired
	}
	return &inv, nil
}

// AcceptInvitation turns a pending invitation into an approved membership.
//
// The whole thing is one transaction guarded by a conditional UPDATE: if two
// requests race, only the one whose UPDATE matched the pending row proceeds, so
// a token cannot be redeemed twice.
func (r *ManagementRepository) AcceptInvitation(ctx context.Context, invitationID, userID uuid.UUID) (uuid.UUID, error) {
	if r.db == nil {
		return uuid.Nil, ErrNoDatabase
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback(ctx)

	var companyID uuid.UUID
	var role, association string
	var departmentID *uuid.UUID
	var jobTitle *string
	err = tx.QueryRow(ctx, `
		UPDATE company_invitations
		SET status = 'accepted', accepted_by = $2, accepted_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status = 'pending' AND expires_at > NOW()
		RETURNING company_id, role, association_type, department_id, job_title`,
		invitationID, userID).Scan(&companyID, &role, &association, &departmentID, &jobTitle)
	if errors.Is(err, pgx.ErrNoRows) {
		return uuid.Nil, domain.ErrConflict
	}
	if err != nil {
		return uuid.Nil, err
	}

	memberID := uuid.New()
	err = tx.QueryRow(ctx, `
		INSERT INTO company_members
			(id, company_id, user_id, role, association_type, status, job_title, department_id, approved_at)
		VALUES ($1, $2, $3, $4, $5, 'approved', $6, $7, NOW())
		ON CONFLICT (company_id, user_id) DO UPDATE SET
			role             = EXCLUDED.role,
			association_type = EXCLUDED.association_type,
			status           = 'approved',
			job_title        = COALESCE(EXCLUDED.job_title, company_members.job_title),
			department_id    = COALESCE(EXCLUDED.department_id, company_members.department_id),
			approved_at      = NOW(),
			updated_at       = NOW()
		RETURNING id`,
		memberID, companyID, userID, role, association, jobTitle, departmentID).Scan(&memberID)
	if err != nil {
		return uuid.Nil, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO company_member_roles (id, company_id, member_id, user_id, role, granted_by)
		VALUES ($1, $2, $3, $4, $5, (SELECT invited_by FROM company_invitations WHERE id = $6))
		ON CONFLICT (company_id, user_id, role) DO NOTHING`,
		uuid.New(), companyID, memberID, userID, role, invitationID); err != nil {
		return uuid.Nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, err
	}
	if err := r.RefreshCounters(ctx, companyID); err != nil {
		return uuid.Nil, err
	}
	return companyID, nil
}

// DeclineInvitation marks a pending invitation declined.
func (r *ManagementRepository) DeclineInvitation(ctx context.Context, invitationID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	tag, err := r.db.Exec(ctx, `
		UPDATE company_invitations SET status = 'declined', declined_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status = 'pending'`, invitationID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrConflict
	}
	return nil
}

// RevokeInvitation cancels an outstanding invitation, which immediately
// invalidates the link that was sent.
func (r *ManagementRepository) RevokeInvitation(ctx context.Context, companyID, invitationID, actorID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	tag, err := r.db.Exec(ctx, `
		UPDATE company_invitations
		SET status = 'revoked', revoked_by = $3, revoked_at = NOW(), updated_at = NOW()
		WHERE company_id = $1 AND id = $2 AND status = 'pending'`,
		companyID, invitationID, actorID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// ExpireStaleInvitations marks lapsed invitations expired. It is safe to call
// on every invitation listing; expiry is enforced at redemption regardless, so
// this only keeps the displayed state honest.
func (r *ManagementRepository) ExpireStaleInvitations(ctx context.Context, companyID uuid.UUID) error {
	if r.db == nil {
		return ErrNoDatabase
	}
	_, err := r.db.Exec(ctx, `
		UPDATE company_invitations SET status = 'expired', updated_at = NOW()
		WHERE company_id = $1 AND status = 'pending' AND expires_at <= NOW()`, companyID)
	return err
}

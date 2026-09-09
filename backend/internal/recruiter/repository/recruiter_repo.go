package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"kirmya/internal/recruiter/models"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RecruiterRepository struct {
	db *pgxpool.Pool
}

func NewRecruiterRepository(db *pgxpool.Pool) *RecruiterRepository {
	return &RecruiterRepository{db: db}
}

func (r *RecruiterRepository) GetOwnedApplications(ctx context.Context, recruiterID uuid.UUID, jobID, stage string) ([]models.JobApplicationDTO, error) {
	if r.db == nil {
		return nil, errors.New("recruiter applications require PostgreSQL")
	}
	rows, err := r.db.Query(ctx, `SELECT a.id,a.job_id,j.title,a.candidate_id,COALESCE(a.contact_name,u.first_name||' '||u.last_name),COALESCE(a.contact_email,u.email),COALESCE(p.job_title,''),COALESCE(p.location,''),a.current_stage,COALESCE(a.recruiter_id,$1),COALESCE(a.rating,0),COALESCE(a.cover_letter,''),COALESCE(a.resume_url,''),a.applied_at,a.updated_at FROM job_applications a JOIN jobs j ON j.id=a.job_id JOIN users u ON u.id=a.candidate_id LEFT JOIN profiles p ON p.user_id=u.id WHERE j.recruiter_id=$1 AND ($2='' OR j.id::text=$2) AND ($3='' OR a.current_stage=$3) ORDER BY a.applied_at DESC`, recruiterID, jobID, stage)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]models.JobApplicationDTO, 0)
	for rows.Next() {
		var v models.JobApplicationDTO
		if err := rows.Scan(&v.ID, &v.JobID, &v.JobTitle, &v.CandidateID, &v.CandidateName, &v.CandidateEmail, &v.CandidateHeadline, &v.CandidateLocation, &v.CurrentStage, &v.RecruiterID, &v.Rating, &v.CoverLetter, &v.ResumeURL, &v.AppliedAt, &v.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, v)
	}
	return items, rows.Err()
}

// MatchInputs is what a match score is computed from: the job's stated skills
// and location, and the candidate's own. Nothing here is inferred.
type MatchInputs struct {
	CandidateID       uuid.UUID
	CandidateName     string
	JobID             uuid.UUID
	JobTitle          string
	JobSkills         []string
	JobLocation       string
	CandidateSkills   []string
	CandidateLocation string
	CandidateTitle    string
}

// ApplicationMatchInputs reads the records a deterministic match is computed
// from. It returns pgx.ErrNoRows when the application does not exist.
func (r *RecruiterRepository) ApplicationMatchInputs(ctx context.Context, applicationID uuid.UUID) (*MatchInputs, error) {
	if r.db == nil {
		return nil, errors.New("candidate match requires PostgreSQL")
	}
	var in MatchInputs
	var jobSkills, candidateSkills []byte
	err := r.db.QueryRow(ctx, `
		SELECT a.candidate_id,
		       COALESCE(NULLIF(TRIM(a.contact_name), ''), NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), 'Candidate'),
		       j.id, j.title, COALESCE(j.skills, '[]'::jsonb), COALESCE(j.location, ''),
		       COALESCE(p.location, ''), COALESCE(p.job_title, ''),
		       COALESCE((SELECT jsonb_agg(us.name) FROM user_skills us WHERE us.profile_id = p.id), '[]'::jsonb)
		FROM job_applications a
		JOIN jobs j ON j.id = a.job_id
		JOIN users u ON u.id = a.candidate_id
		LEFT JOIN profiles p ON p.user_id = a.candidate_id
		WHERE a.id = $1`, applicationID).
		Scan(&in.CandidateID, &in.CandidateName, &in.JobID, &in.JobTitle, &jobSkills, &in.JobLocation,
			&in.CandidateLocation, &in.CandidateTitle, &candidateSkills)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(jobSkills, &in.JobSkills)
	_ = json.Unmarshal(candidateSkills, &in.CandidateSkills)
	return &in, nil
}

// JobCandidateMatchInputs is ApplicationMatchInputs for a candidate who may not
// have applied: the job's stated skills against that candidate's profile.
func (r *RecruiterRepository) JobCandidateMatchInputs(ctx context.Context, jobID, candidateID uuid.UUID) (*MatchInputs, error) {
	if r.db == nil {
		return nil, errors.New("candidate match requires PostgreSQL")
	}
	in := MatchInputs{JobID: jobID, CandidateID: candidateID}
	var jobSkills, candidateSkills []byte
	err := r.db.QueryRow(ctx, `
		SELECT j.title, COALESCE(j.skills, '[]'::jsonb), COALESCE(j.location, ''),
		       COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), 'Candidate'),
		       COALESCE(p.location, ''), COALESCE(p.job_title, ''),
		       COALESCE((SELECT jsonb_agg(us.name) FROM user_skills us WHERE us.profile_id = p.id), '[]'::jsonb)
		FROM jobs j
		JOIN users u ON u.id = $2
		LEFT JOIN profiles p ON p.user_id = u.id
		WHERE j.id = $1`, jobID, candidateID).
		Scan(&in.JobTitle, &jobSkills, &in.JobLocation, &in.CandidateName, &in.CandidateLocation, &in.CandidateTitle, &candidateSkills)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(jobSkills, &in.JobSkills)
	_ = json.Unmarshal(candidateSkills, &in.CandidateSkills)
	return &in, nil
}

// TeamMembers lists the recruiters sharing this organization, from the rows
// that record their membership.
// SearchCandidates lists the candidates this recruiter actually has: the people
// who have applied to one of their jobs. There is no platform-wide candidate
// index behind this endpoint, and inventing one is what it used to do - two
// fixed people, "Sarah Chen" and "Tariq Al-Mansoor", with resume URLs under
// kirmya.com that resolve to nothing, returned to every recruiter on the
// platform regardless of what they had posted.
//
// A recruiter with no applicants gets an empty list.
func (r *RecruiterRepository) SearchCandidates(ctx context.Context, recruiterID uuid.UUID) ([]models.RecruiterCandidateItem, error) {
	if r.db == nil {
		return nil, errors.New("candidate search requires PostgreSQL")
	}
	rows, err := r.db.Query(ctx, `
		SELECT DISTINCT ON (u.id)
		       u.id,
		       u.first_name || ' ' || u.last_name,
		       COALESCE(p.headline, ''),
		       COALESCE(p.location, ''),
		       COALESCE((SELECT jsonb_agg(us.name) FROM user_skills us WHERE us.profile_id = p.id), '[]'::jsonb),
		       COALESCE(a.resume_url, '')
		FROM job_applications a
		JOIN jobs j ON j.id = a.job_id
		JOIN users u ON u.id = a.candidate_id
		LEFT JOIN user_profiles p ON p.user_id = u.id
		WHERE j.recruiter_id = $1 AND u.status = 'active'
		ORDER BY u.id, a.applied_at DESC`, recruiterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.RecruiterCandidateItem, 0)
	for rows.Next() {
		var v models.RecruiterCandidateItem
		var skills []byte
		if err := rows.Scan(&v.ID, &v.Name, &v.Headline, &v.Location, &skills, &v.ResumeURL); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(skills, &v.Skills)
		if v.Skills == nil {
			v.Skills = []string{}
		}
		// MatchScore, ExperienceYears and Availability are not recorded against
		// a candidate anywhere, so they stay at their zero values rather than
		// being filled with a number that reads as a measurement.
		v.ResumeAvailable = v.ResumeURL != ""
		items = append(items, v)
	}
	return items, rows.Err()
}

// CandidateByID answers for one candidate the recruiter has access to, which is
// one who has applied to a job of theirs. It returns pgx.ErrNoRows otherwise,
// so a recruiter cannot read an arbitrary member of the platform through it.
func (r *RecruiterRepository) CandidateByID(ctx context.Context, recruiterID, candidateID uuid.UUID) (*models.RecruiterCandidateItem, error) {
	if r.db == nil {
		return nil, errors.New("candidate lookup requires PostgreSQL")
	}
	var v models.RecruiterCandidateItem
	var skills []byte
	err := r.db.QueryRow(ctx, `
		SELECT u.id,
		       u.first_name || ' ' || u.last_name,
		       COALESCE(p.headline, ''),
		       COALESCE(p.location, ''),
		       COALESCE((SELECT jsonb_agg(us.name) FROM user_skills us WHERE us.profile_id = p.id), '[]'::jsonb),
		       COALESCE(a.resume_url, '')
		FROM job_applications a
		JOIN jobs j ON j.id = a.job_id
		JOIN users u ON u.id = a.candidate_id
		LEFT JOIN user_profiles p ON p.user_id = u.id
		WHERE j.recruiter_id = $1 AND u.id = $2 AND u.status = 'active'
		ORDER BY a.applied_at DESC
		LIMIT 1`, recruiterID, candidateID).
		Scan(&v.ID, &v.Name, &v.Headline, &v.Location, &skills, &v.ResumeURL)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(skills, &v.Skills)
	if v.Skills == nil {
		v.Skills = []string{}
	}
	v.ResumeAvailable = v.ResumeURL != ""
	return &v, nil
}

// DashboardCounts counts the recruiter's own jobs, applicants and stages.
//
// Every figure the overview showed was a literal: 142 applicants, 3 offers, 12
// successful hires, on an account that had posted nothing.
//
// The stage names here are the ones the pipeline actually writes and the
// transition table in UpdateOwnedApplicationStage actually allows - Applied,
// Viewed, Shortlisted, Interview, Offer, Accepted, Rejected. An earlier
// version of this query counted "New" and "Hired", which no row ever holds, so
// two of the tiles were structurally always zero. A count that can never be
// anything but zero is its own kind of false statement.
type DashboardCounts struct {
	ActiveJobs      int
	DraftJobs       int
	TotalApplicants int
	NewApplicants   int
	Shortlisted     int
	Offers          int
	Hires           int
}

func (r *RecruiterRepository) DashboardCounts(ctx context.Context, recruiterID uuid.UUID) (*DashboardCounts, error) {
	if r.db == nil {
		return nil, errors.New("recruiter dashboard requires PostgreSQL")
	}
	var c DashboardCounts
	err := r.db.QueryRow(ctx, `
		WITH mine AS (
		  SELECT a.current_stage
		  FROM job_applications a
		  JOIN jobs j ON j.id = a.job_id
		  WHERE j.recruiter_id = $1
		)
		SELECT
		  (SELECT COUNT(*) FROM jobs WHERE recruiter_id = $1 AND status = 'active'),
		  (SELECT COUNT(*) FROM jobs WHERE recruiter_id = $1 AND status = 'draft'),
		  (SELECT COUNT(*) FROM mine),
		  (SELECT COUNT(*) FROM mine WHERE current_stage = 'Applied'),
		  (SELECT COUNT(*) FROM mine WHERE current_stage = 'Shortlisted'),
		  (SELECT COUNT(*) FROM mine WHERE current_stage = 'Offer'),
		  (SELECT COUNT(*) FROM mine WHERE current_stage = 'Accepted')`,
		recruiterID).
		Scan(&c.ActiveJobs, &c.DraftJobs, &c.TotalApplicants, &c.NewApplicants, &c.Shortlisted, &c.Offers, &c.Hires)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *RecruiterRepository) TeamMembers(ctx context.Context, orgID uuid.UUID) ([]models.TeamMemberDTO, error) {
	if r.db == nil {
		return nil, errors.New("recruiter team requires PostgreSQL")
	}
	rows, err := r.db.Query(ctx, `
		SELECT rop.id, rop.user_id,
		       COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), u.email),
		       u.email, COALESCE(rop.recruiter_role, 'Recruiter'), COALESCE(rop.department, ''),
		       rop.created_at
		FROM recruiter_organization_profiles rop
		JOIN users u ON u.id = rop.user_id
		WHERE rop.org_id = $1
		ORDER BY rop.created_at ASC`, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []models.TeamMemberDTO{}
	for rows.Next() {
		var m models.TeamMemberDTO
		if err := rows.Scan(&m.ID, &m.UserID, &m.Name, &m.Email, &m.RecruiterRole, &m.Department, &m.JoinedAt); err != nil {
			return nil, err
		}
		m.Status = "Active"
		list = append(list, m)
	}
	return list, rows.Err()
}

// JobOwnedBy reports whether this user posted the job. jobs.recruiter_id is the
// posting user, which is what job_applications and the public board join on.
func (r *RecruiterRepository) JobOwnedBy(ctx context.Context, userID, jobID uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, errors.New("recruiter job ownership requires PostgreSQL")
	}
	var owned bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM jobs WHERE id = $1 AND recruiter_id = $2)`, jobID, userID).Scan(&owned)
	return owned, err
}

// ApplicationOwnedBy reports whether the application was made to a job this
// user posted.
func (r *RecruiterRepository) ApplicationOwnedBy(ctx context.Context, userID, applicationID uuid.UUID) (bool, error) {
	if r.db == nil {
		return false, errors.New("recruiter application ownership requires PostgreSQL")
	}
	var owned bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(
	        SELECT 1 FROM job_applications a JOIN jobs j ON j.id = a.job_id
	        WHERE a.id = $1 AND j.recruiter_id = $2)`, applicationID, userID).Scan(&owned)
	return owned, err
}

func (r *RecruiterRepository) GetOwnedApplication(ctx context.Context, recruiterID, appID uuid.UUID) (*models.JobApplicationDTO, error) {
	items, err := r.GetOwnedApplications(ctx, recruiterID, "", "")
	if err != nil {
		return nil, err
	}
	for i := range items {
		if items[i].ID == appID {
			return &items[i], nil
		}
	}
	return nil, pgx.ErrNoRows
}

func (r *RecruiterRepository) UpdateOwnedApplicationStage(ctx context.Context, recruiterID, appID uuid.UUID, toStage, notes string) error {
	if r.db == nil {
		return nil
	}
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var from string
	err = tx.QueryRow(ctx, `SELECT a.current_stage FROM job_applications a JOIN jobs j ON j.id=a.job_id WHERE a.id=$1 AND j.recruiter_id=$2 FOR UPDATE`, appID, recruiterID).Scan(&from)
	if err != nil {
		return err
	}
	allowed := map[string]map[string]bool{"Applied": {"Viewed": true, "Shortlisted": true, "Interview": true, "Rejected": true}, "Viewed": {"Shortlisted": true, "Interview": true, "Rejected": true}, "Shortlisted": {"Interview": true, "Offer": true, "Rejected": true}, "Interview": {"Offer": true, "Rejected": true, "Shortlisted": true}, "Offer": {"Accepted": true, "Rejected": true}}
	if !allowed[from][toStage] {
		return fmt.Errorf("invalid application stage transition from %q to %q", from, toStage)
	}
	if _, err = tx.Exec(ctx, `UPDATE job_applications SET current_stage=$2,recruiter_id=$3,updated_at=NOW() WHERE id=$1`, appID, toStage, recruiterID); err != nil {
		return err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO application_stage_history(id,application_id,from_stage,to_stage,moved_by,notes,moved_at) VALUES($1,$2,$3,$4,$5,$6,NOW())`, uuid.New(), appID, from, toStage, recruiterID, notes); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *RecruiterRepository) ScheduleOwnedInterview(ctx context.Context, recruiterID, jobID, candidateID uuid.UUID, start time.Time, duration int, kind, meetingLink, instructions, notes string) (*models.InterviewItem, error) {
	if r.db == nil {
		return nil, errors.New("interview scheduling requires PostgreSQL")
	}
	if duration <= 0 {
		duration = 30
	}
	end := start.Add(time.Duration(duration) * time.Minute)
	if !end.After(start) {
		return nil, errors.New("invalid interview duration")
	}
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	_, err = tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtext($1)),pg_advisory_xact_lock(hashtext($2))`, recruiterID.String(), candidateID.String())
	if err != nil {
		return nil, err
	}
	var appID uuid.UUID
	var currentStage string
	err = tx.QueryRow(ctx, `SELECT a.id,a.current_stage FROM job_applications a JOIN jobs j ON j.id=a.job_id WHERE a.job_id=$1 AND a.candidate_id=$2 AND j.recruiter_id=$3`, jobID, candidateID, recruiterID).Scan(&appID, &currentStage)
	if err != nil {
		return nil, errors.New("candidate has no application for an owned job")
	}
	var conflict bool
	err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM interviews WHERE status<>'cancelled' AND (organizer_id=$1 OR candidate_id=$2) AND scheduled_start<$4 AND scheduled_end>$3)`, recruiterID, candidateID, start, end).Scan(&conflict)
	if err != nil {
		return nil, err
	}
	if conflict {
		return nil, errors.New("interview booking conflicts with an existing slot")
	}
	id := uuid.New()
	_, err = tx.Exec(ctx, `INSERT INTO interviews(id,application_id,candidate_id,job_id,organizer_id,title,status,scheduled_start,scheduled_end,location_type,meeting_link,notes,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,'scheduled',$7,$8,$9,$10,$11,NOW(),NOW())`, id, appID, candidateID, jobID, recruiterID, kind+" interview", start, end, strings.ToLower(kind), meetingLink, notes+"\n"+instructions)
	if err != nil {
		return nil, err
	}
	if _, err = tx.Exec(ctx, `UPDATE job_applications SET current_stage='Interview',recruiter_id=$2,updated_at=NOW() WHERE id=$1`, appID, recruiterID); err != nil {
		return nil, err
	}
	if currentStage != "Interview" {
		if _, err = tx.Exec(ctx, `INSERT INTO application_stage_history(id,application_id,from_stage,to_stage,moved_by,notes,moved_at) VALUES($1,$2,$3,'Interview',$4,'Interview scheduled',NOW())`, uuid.New(), appID, currentStage, recruiterID); err != nil {
			return nil, err
		}
	}
	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &models.InterviewItem{ID: id, JobID: jobID, CandidateID: candidateID, Type: kind, ScheduledAt: start, DurationMinutes: duration, MeetingLink: meetingLink, Instructions: instructions, Notes: notes, Status: "Scheduled", CreatedAt: time.Now().UTC()}, nil
}

func (r *RecruiterRepository) CancelOwnedInterview(ctx context.Context, recruiterID, interviewID uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	tag, err := r.db.Exec(ctx, `UPDATE interviews SET status='cancelled',updated_at=NOW() WHERE id=$1 AND organizer_id=$2 AND status IN ('scheduled','rescheduled')`, interviewID, recruiterID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errors.New("interview not found or cannot be cancelled")
	}
	return nil
}

func (r *RecruiterRepository) GetOwnedInterviews(ctx context.Context, recruiterID uuid.UUID) ([]models.InterviewItem, error) {
	if r.db == nil {
		return nil, errors.New("recruiter interviews require PostgreSQL")
	}
	rows, err := r.db.Query(ctx, `
		SELECT i.id, i.job_id, i.candidate_id,
		       COALESCE(NULLIF(TRIM(COALESCE(a.contact_name, '')), ''), TRIM(u.first_name || ' ' || u.last_name)),
		       COALESCE(p.avatar_url, ''), i.location_type, i.scheduled_start,
		       GREATEST(1, ROUND(EXTRACT(EPOCH FROM (i.scheduled_end-i.scheduled_start))/60)::int),
		       COALESCE(i.meeting_link, ''), '', COALESCE(i.notes, ''), i.status, i.created_at
		FROM interviews i
		JOIN jobs j ON j.id=i.job_id AND j.recruiter_id=$1
		JOIN users u ON u.id=i.candidate_id
		LEFT JOIN job_applications a ON a.id=i.application_id
		LEFT JOIN user_profiles p ON p.user_id=i.candidate_id
		WHERE i.organizer_id=$1
		ORDER BY i.scheduled_start`, recruiterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	items := make([]models.InterviewItem, 0)
	for rows.Next() {
		var item models.InterviewItem
		if err := rows.Scan(&item.ID, &item.JobID, &item.CandidateID, &item.CandidateName,
			&item.CandidateAvatar, &item.Type, &item.ScheduledAt, &item.DurationMinutes,
			&item.MeetingLink, &item.Instructions, &item.Notes, &item.Status, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// GetOrCreateProfile loads or creates a recruiter profile for a user.
func (r *RecruiterRepository) GetOrCreateProfile(ctx context.Context, userID uuid.UUID, companyName string) (*models.RecruiterOrgProfile, error) {
	if r.db == nil {
		return &models.RecruiterOrgProfile{
			ID:                 uuid.MustParse("99999999-8888-7777-6666-555555555555"),
			UserID:             userID,
			OrgID:              uuid.MustParse("11111111-2222-3333-4444-555555555555"),
			CompanyName:        companyName,
			JobTitle:           "Senior Talent Partner",
			Department:         "Human Resources",
			RecruiterRole:      "Organization Owner",
			ProfessionalInfo:   "Enterprise Technical Recruiter",
			ContactEmail:       "recruiter@kirmya.ae",
			VerificationStatus: "Verified",
			CreatedAt:          time.Now(),
		}, nil
	}

	var p models.RecruiterOrgProfile
	// The optional columns are filled in later by profile edits, so they are
	// NULL on a freshly created profile and scanning them straight into strings
	// fails. That path stayed hidden while the insert itself was failing.
	query := `SELECT id, user_id, org_id, COALESCE(company_name,''), COALESCE(job_title,''), COALESCE(department,''), COALESCE(recruiter_role,''), COALESCE(professional_info,''), COALESCE(contact_phone,''), COALESCE(contact_email,''), COALESCE(verification_status,''), created_at
	          FROM recruiter_organization_profiles
	          WHERE user_id = $1`
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.ID, &p.UserID, &p.OrgID, &p.CompanyName, &p.JobTitle, &p.Department,
		&p.RecruiterRole, &p.ProfessionalInfo, &p.ContactPhone, &p.ContactEmail,
		&p.VerificationStatus, &p.CreatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			p = models.RecruiterOrgProfile{
				ID:                 uuid.New(),
				UserID:             userID,
				OrgID:              uuid.New(),
				CompanyName:        companyName,
				JobTitle:           "Recruiter",
				Department:         "Talent Acquisition",
				RecruiterRole:      "Recruiter",
				VerificationStatus: "Verified",
				CreatedAt:          time.Now(),
				UpdatedAt:          time.Now(),
			}
			// recruiter_organization_profiles.org_id references organizations, so
			// the organization has to exist before the profile does. Inserting
			// only the profile made the first action of every new recruiter fail
			// with a foreign key violation, which is why a fresh recruiter could
			// not publish a job at all. Both rows are written in one transaction
			// so a failure cannot leave an organization without its profile.
			if p.CompanyName == "" {
				p.CompanyName = "Recruiting organization"
			}
			tx, err := r.db.Begin(ctx)
			if err != nil {
				return nil, err
			}
			defer tx.Rollback(ctx)
			if _, err = tx.Exec(ctx, `INSERT INTO organizations (id, name, org_type, tenant_domain, status, created_at, updated_at) VALUES ($1, $2, 'recruiting', $3, 'active', NOW(), NOW())`, p.OrgID, p.CompanyName, p.OrgID.String()+".tenant.invalid"); err != nil {
				return nil, err
			}
			// recruiter_jobs, recruiter_activity, saved_candidates and the search
			// history all key off recruiter_profiles(id), while this profile is
			// the row the service passes around as the recruiter identity. The
			// two must therefore share one id, or publishing a job fails on the
			// recruiter_jobs foreign key. recruiter_profiles.user_id is unique,
			// so an id created elsewhere wins and this profile adopts it.
			var existingRecruiterID uuid.UUID
			switch err = tx.QueryRow(ctx, `SELECT id FROM recruiter_profiles WHERE user_id=$1`, userID).Scan(&existingRecruiterID); {
			case err == nil:
				p.ID = existingRecruiterID
			case errors.Is(err, pgx.ErrNoRows):
				if _, err = tx.Exec(ctx, `INSERT INTO recruiter_profiles (id, user_id, company_name, verified, created_at) VALUES ($1, $2, $3, true, NOW())`, p.ID, userID, p.CompanyName); err != nil {
					return nil, err
				}
			default:
				return nil, err
			}
			insertQ := `INSERT INTO recruiter_organization_profiles
				(id, user_id, org_id, company_name, job_title, department, recruiter_role, verification_status, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`
			if _, err = tx.Exec(ctx, insertQ, p.ID, p.UserID, p.OrgID, p.CompanyName, p.JobTitle, p.Department, p.RecruiterRole, p.VerificationStatus, p.CreatedAt, p.UpdatedAt); err != nil {
				return nil, err
			}
			if err = tx.Commit(ctx); err != nil {
				return nil, err
			}
			return &p, nil
		}
		return nil, err
	}

	return &p, nil
}

// UpdateOrgProfile saves recruiter onboarding / profile edits.
func (r *RecruiterRepository) UpdateOrgProfile(ctx context.Context, profile *models.RecruiterOrgProfile) error {
	if r.db == nil {
		return nil
	}
	query := `UPDATE recruiter_organization_profiles 
	          SET company_name = $1, job_title = $2, department = $3, recruiter_role = $4, 
	              professional_info = $5, contact_phone = $6, contact_email = $7, verification_status = $8, updated_at = NOW() 
	          WHERE id = $9`
	_, err := r.db.Exec(ctx, query,
		profile.CompanyName, profile.JobTitle, profile.Department, profile.RecruiterRole,
		profile.ProfessionalInfo, profile.ContactPhone, profile.ContactEmail, profile.VerificationStatus, profile.ID,
	)
	return err
}

// CreateJob inserts a recruiter job into both the canonical jobs table and recruiter_jobs table.
func (r *RecruiterRepository) CreateJob(ctx context.Context, ownerUserID uuid.UUID, job *models.RecruiterJob) error {
	if r.db == nil {
		return nil
	}

	// A nil slice marshals to the JSON scalar null, and the job listings expand
	// skills as an array: one job published without skills made the whole public
	// board fail with "cannot extract elements from a scalar". Store an empty
	// array instead.
	skillsJSON := []byte("[]")
	if len(job.RequiredSkills) > 0 {
		skillsJSON, _ = json.Marshal(job.RequiredSkills)
	}
	screening := make([]map[string]interface{}, 0, len(job.Questions))
	for _, question := range job.Questions {
		id := question.ID
		if id == uuid.Nil {
			id = uuid.New()
		}
		screening = append(screening, map[string]interface{}{
			"id": id.String(), "text": question.QuestionText, "required": question.IsRequired,
		})
	}
	screeningJSON, _ := json.Marshal(screening)
	canonStatus := strings.ToLower(job.Status)
	if canonStatus == "published" {
		canonStatus = "active"
	} else if canonStatus != "draft" && canonStatus != "active" && canonStatus != "paused" && canonStatus != "closed" && canonStatus != "expired" {
		canonStatus = "draft"
	}

	workMode := strings.ToLower(job.WorkplaceType)
	if workMode != "onsite" && workMode != "hybrid" && workMode != "remote" {
		workMode = "remote"
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	canonQuery := `
		INSERT INTO jobs (
			id, recruiter_id, title, description, responsibilities, requirements, qualifications, benefits,
			department, location, work_mode, employment_type, experience_level,
			salary_range, skills, screening_questions, status, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $18)
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			screening_questions = EXCLUDED.screening_questions,
			status = EXCLUDED.status,
			updated_at = EXCLUDED.updated_at
	`
	if _, err = tx.Exec(ctx, canonQuery,
		job.ID, ownerUserID, job.Title, job.Description, job.Responsibilities, job.Qualifications, job.Qualifications, job.Benefits,
		job.Department, job.Location, workMode, job.EmploymentType, job.ExperienceLevel,
		job.SalaryRange, skillsJSON, screeningJSON, canonStatus, job.CreatedAt,
	); err != nil {
		return err
	}

	// Also insert into recruiter_jobs
	query := `INSERT INTO recruiter_jobs (id, recruiter_id, title, description, department, location, salary_range, status, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	          ON CONFLICT (id) DO UPDATE SET
	              title = EXCLUDED.title,
	              description = EXCLUDED.description,
	              status = EXCLUDED.status`
	if _, err = tx.Exec(ctx, query, job.ID, job.RecruiterID, job.Title, job.Description, job.Department, job.Location, job.SalaryRange, job.Status, job.CreatedAt); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// GetJobByID retrieves job details.
func (r *RecruiterRepository) GetJobByID(ctx context.Context, ownerUserID, jobID uuid.UUID) (*models.RecruiterJob, error) {
	if r.db == nil {
		return &models.RecruiterJob{
			ID:               jobID,
			Title:            "Senior Full Stack Engineer",
			Department:       "Engineering",
			EmploymentType:   "Full-time",
			WorkplaceType:    "Hybrid",
			Location:         "Dubai, UAE",
			SalaryRange:      "$90,000 - $120,000",
			Currency:         "USD",
			ExperienceLevel:  "Senior",
			RequiredSkills:   []string{"React", "Node.js", "TypeScript", "PostgreSQL"},
			PreferredSkills:  []string{"Next.js", "Go", "AWS"},
			Education:        "Bachelor's in Computer Science",
			Description:      "We are looking for an experienced Senior Full Stack Engineer to lead our enterprise hiring solution.",
			Responsibilities: "Architect scalable APIs, mentor team members, and drive technical direction.",
			Qualifications:   "5+ years software development experience.",
			Benefits:         "Health insurance, flexible hours, stock options.",
			Status:           "Active",
			ApplicantsCount:  12,
			ViewsCount:       140,
			CreatedAt:        time.Now().Add(-15 * 24 * time.Hour),
		}, nil
	}

	var j models.RecruiterJob
	// Scoped to the posting recruiter. Without the second predicate any signed-in
	// recruiter could read another company's posting, drafts included, by id.
	query := `SELECT rj.id, rj.recruiter_id, rj.title, rj.description, rj.department, rj.location, rj.salary_range, rj.status, rj.created_at
	          FROM recruiter_jobs rj
	          JOIN jobs j ON j.id = rj.id
	          WHERE rj.id = $1 AND j.recruiter_id = $2`
	err := r.db.QueryRow(ctx, query, jobID, ownerUserID).Scan(&j.ID, &j.RecruiterID, &j.Title, &j.Description, &j.Department, &j.Location, &j.SalaryRange, &j.Status, &j.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &j, nil
}

// UpdateJobStatus updates status (Active, Published, Paused, Closed, Archived).
func (r *RecruiterRepository) UpdateJobStatus(ctx context.Context, ownerUserID, jobID uuid.UUID, status string) error {
	if r.db == nil {
		return nil
	}

	canonStatus := strings.ToLower(status)
	if canonStatus == "published" {
		canonStatus = "active"
	}
	// The canonical row decides ownership: a status change on a job this user
	// did not post updates nothing and reports it as not found.
	tag, err := r.db.Exec(ctx, `UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2 AND recruiter_id = $3`, canonStatus, jobID, ownerUserID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}

	_, err = r.db.Exec(ctx, `UPDATE recruiter_jobs SET status = $1 WHERE id = $2`, status, jobID)
	return err
}

// GetJobs retrieves jobs posted by a specific recruiter.
func (r *RecruiterRepository) GetJobs(ctx context.Context, recruiterID uuid.UUID) ([]models.RecruiterJob, error) {
	if r.db == nil {
		return []models.RecruiterJob{
			{
				ID:              uuid.MustParse("a1111111-1111-1111-1111-111111111111"),
				RecruiterID:     recruiterID,
				Title:           "Senior Go Backend Architect",
				Department:      "Engineering",
				EmploymentType:  "Full-time",
				WorkplaceType:   "Remote",
				Location:        "Dubai / Remote",
				SalaryRange:     "$120,000 - $160,000",
				Status:          "Active",
				ApplicantsCount: 18,
				ViewsCount:      240,
				CreatedAt:       time.Now().Add(-10 * 24 * time.Hour),
			},
			{
				ID:              uuid.MustParse("a2222222-2222-2222-2222-222222222222"),
				RecruiterID:     recruiterID,
				Title:           "Lead Frontend Engineer (React/MUI)",
				Department:      "Product",
				EmploymentType:  "Full-time",
				WorkplaceType:   "Hybrid",
				Location:        "Abu Dhabi",
				SalaryRange:     "$100,000 - $130,000",
				Status:          "Active",
				ApplicantsCount: 14,
				ViewsCount:      185,
				CreatedAt:       time.Now().Add(-5 * 24 * time.Hour),
			},
			{
				ID:              uuid.MustParse("a3333333-3333-3333-3333-333333333333"),
				RecruiterID:     recruiterID,
				Title:           "Technical Recruiting Specialist",
				Department:      "Human Resources",
				EmploymentType:  "Contract",
				WorkplaceType:   "On-site",
				Location:        "Riyadh",
				SalaryRange:     "$70,000 - $90,000",
				Status:          "Draft",
				ApplicantsCount: 0,
				ViewsCount:      12,
				CreatedAt:       time.Now().Add(-2 * 24 * time.Hour),
			},
		}, nil
	}

	query := `SELECT id, recruiter_id, title, description, department, location, salary_range, status, created_at 
	          FROM recruiter_jobs 
	          WHERE recruiter_id = $1 
	          ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, recruiterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.RecruiterJob
	for rows.Next() {
		var j models.RecruiterJob
		err := rows.Scan(&j.ID, &j.RecruiterID, &j.Title, &j.Description, &j.Department, &j.Location, &j.SalaryRange, &j.Status, &j.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, j)
	}
	return list, nil
}

// GetPipeline retrieves candidate tracking items.
func (r *RecruiterRepository) GetPipeline(ctx context.Context, jobID uuid.UUID) ([]models.CandidatePipeline, error) {
	if r.db == nil {
		return []models.CandidatePipeline{
			{
				ID:             uuid.MustParse("p1111111-1111-1111-1111-111111111111"),
				JobID:          jobID,
				CandidateID:    uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
				CandidateName:  "Alex Rivera",
				CandidateEmail: "alex.rivera@kirmya.com",
				Stage:          "Shortlisted",
				Notes:          "High match score on Go microservices.",
				UpdatedAt:      time.Now(),
			},
			{
				ID:             uuid.MustParse("p2222222-2222-2222-2222-222222222222"),
				JobID:          jobID,
				CandidateID:    uuid.MustParse("c2222222-2222-2222-2222-222222222222"),
				CandidateName:  "Elena Rostova",
				CandidateEmail: "elena.rostova@kirmya.com",
				Stage:          "Interview",
				Notes:          "Technical interview scheduled.",
				UpdatedAt:      time.Now().Add(-2 * time.Hour),
			},
		}, nil
	}

	// user_profiles has no full_name column, so this query answered 500 for
	// every recruiter who opened a pipeline. Names and addresses come from
	// users, which is where the rest of this repository reads them.
	query := `SELECT cp.id, cp.job_id, cp.candidate_id, cp.stage, cp.notes, cp.interview_scheduled_at, cp.updated_at,
	                 COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), 'Candidate'), COALESCE(u.email, '')
	          FROM candidate_pipeline cp
	          LEFT JOIN users u ON cp.candidate_id = u.id
	          WHERE cp.job_id = $1
	          ORDER BY cp.updated_at DESC`

	rows, err := r.db.Query(ctx, query, jobID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CandidatePipeline
	for rows.Next() {
		var c models.CandidatePipeline
		err := rows.Scan(&c.ID, &c.JobID, &c.CandidateID, &c.Stage, &c.Notes, &c.InterviewScheduledAt, &c.UpdatedAt,
			&c.CandidateName, &c.CandidateEmail)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

// UpdatePipelineStage updates stage progressions.
func (r *RecruiterRepository) UpdatePipelineStage(ctx context.Context, id uuid.UUID, stage string, notes string, interviewTime *time.Time) error {
	if r.db == nil {
		return nil
	}
	query := `UPDATE candidate_pipeline 
	          SET stage = $1, notes = $2, interview_scheduled_at = $3, updated_at = NOW() 
	          WHERE id = $4`
	_, err := r.db.Exec(ctx, query, stage, notes, interviewTime, id)
	return err
}

// LogCandidateAccess logs sensitive candidate actions for privacy auditing.
func (r *RecruiterRepository) LogCandidateAccess(ctx context.Context, orgID, recruiterID, candidateID uuid.UUID, recruiterName, action string) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO candidate_access_logs (id, org_id, recruiter_id, recruiter_name, candidate_id, action, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, NOW())`
	_, err := r.db.Exec(ctx, query, uuid.New(), orgID, recruiterID, recruiterName, candidateID, action)
	return err
}

// LogActivity saves auditing logs.
func (r *RecruiterRepository) LogActivity(ctx context.Context, act *models.RecruiterActivity) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO recruiter_activity (id, recruiter_id, activity_type, description, created_at)
	          VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, act.ID, act.RecruiterID, act.ActivityType, act.Description, act.CreatedAt)
	return err
}

// GetAnalytics calculates active stats aggregates.
func (r *RecruiterRepository) GetAnalytics(ctx context.Context, recruiterID uuid.UUID) (*models.RecruiterAnalytics, error) {
	analytics := &models.RecruiterAnalytics{
		TotalJobsActive:       5,
		TotalCandidatesCount:  28,
		ApplicationsCount:     42,
		ConversionRate:        24.5,
		ShortlistRate:         35.0,
		InterviewRate:         20.0,
		OfferRate:             10.0,
		HireRate:              7.5,
		TimeToFirstReviewDays: 1,
		TimeToInterviewDays:   4,
		TimeToHireDays:        18,
		StageDistribution: map[string]int{
			"New":              12,
			"Review":           8,
			"Shortlisted":      6,
			"Recruiter Screen": 4,
			"Interview":        5,
			"Final Interview":  3,
			"Offer":            2,
			"Hired":            2,
		},
		ApplicationTrends: []map[string]any{
			{"date": "Mon", "applications": 6},
			{"date": "Tue", "applications": 12},
			{"date": "Wed", "applications": 9},
			{"date": "Thu", "applications": 15},
			{"date": "Fri", "applications": 10},
		},
		CandidateSources: []map[string]any{
			{"source": "Direct Search", "count": 18},
			{"source": "AI Match", "count": 14},
			{"source": "Referrals", "count": 6},
			{"source": "Job Boards", "count": 4},
		},
		RecentActivities: []models.RecruiterActivity{
			{ID: uuid.New(), RecruiterID: recruiterID, ActivityType: "Job Published", Description: "Published Senior Go Backend Architect", CreatedAt: time.Now().Add(-2 * time.Hour)},
			{ID: uuid.New(), RecruiterID: recruiterID, ActivityType: "Interview Scheduled", Description: "Scheduled Technical Interview with Elena Rostova", CreatedAt: time.Now().Add(-5 * time.Hour)},
		},
	}

	if r.db == nil {
		return analytics, nil
	}

	_ = r.db.QueryRow(ctx, "SELECT COUNT(*) FROM recruiter_jobs WHERE recruiter_id = $1 AND status = 'active'", recruiterID).Scan(&analytics.TotalJobsActive)

	return analytics, nil
}

// RecordStageHistory inserts a stage transition record for audit trail.
func (r *RecruiterRepository) RecordStageHistory(ctx context.Context, applicationID, movedBy uuid.UUID, fromStage, toStage, notes string) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO application_stage_history (id, application_id, from_stage, to_stage, moved_by, notes, moved_at)
	          VALUES ($1, $2, $3, $4, $5, $6, NOW())`
	_, err := r.db.Exec(ctx, query, uuid.New(), applicationID, fromStage, toStage, movedBy, notes)
	return err
}

// GetStageHistory retrieves the stage transition history for an application.
func (r *RecruiterRepository) GetStageHistory(ctx context.Context, applicationID uuid.UUID) ([]models.ApplicationStageHistoryDTO, error) {
	if r.db == nil {
		return []models.ApplicationStageHistoryDTO{
			{
				ID:            uuid.New(),
				ApplicationID: applicationID,
				FromStage:     "New",
				ToStage:       "Shortlisted",
				MovedBy:       uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				MovedByName:   "Rashid Al-Maktoum",
				Notes:         "Strong technical background in Go and cloud systems.",
				MovedAt:       time.Now().Add(-24 * time.Hour),
			},
			{
				ID:            uuid.New(),
				ApplicationID: applicationID,
				FromStage:     "Shortlisted",
				ToStage:       "Interview",
				MovedBy:       uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				MovedByName:   "Amira Al-Farsi",
				Notes:         "Scheduled for Technical Architecture Round.",
				MovedAt:       time.Now().Add(-12 * time.Hour),
			},
		}, nil
	}

	query := `SELECT ash.id, ash.application_id, ash.from_stage, ash.to_stage, ash.moved_by,
	                 COALESCE(NULLIF(TRIM(u.first_name || ' ' || u.last_name), ''), 'Recruiter'), ash.notes, ash.moved_at
	          FROM application_stage_history ash
	          LEFT JOIN users u ON ash.moved_by = u.id
	          WHERE ash.application_id = $1
	          ORDER BY ash.moved_at DESC`
	rows, err := r.db.Query(ctx, query, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.ApplicationStageHistoryDTO
	for rows.Next() {
		var h models.ApplicationStageHistoryDTO
		err := rows.Scan(&h.ID, &h.ApplicationID, &h.FromStage, &h.ToStage, &h.MovedBy, &h.MovedByName, &h.Notes, &h.MovedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, h)
	}
	return list, nil
}

// CreateCandidateNote inserts a recruiter note on a candidate.
func (r *RecruiterRepository) CreateCandidateNote(ctx context.Context, note *models.CandidateNoteItem, orgID uuid.UUID, applicationID *uuid.UUID) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO recruiter_internal_notes (id, org_id, candidate_id, application_id, recruiter_id, recruiter_name, note, score, recommendation, is_pinned, created_at)
	          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`
	var appID *uuid.UUID
	if applicationID != nil && *applicationID != uuid.Nil {
		appID = applicationID
	}
	_, err := r.db.Exec(ctx, query, note.ID, orgID, note.CandidateID, appID, note.RecruiterID, note.RecruiterName, note.Note, note.Score, note.Recommendation, note.IsPinned)
	return err
}

// GetCandidateNotes retrieves notes for a candidate scoped to an organization.
func (r *RecruiterRepository) GetCandidateNotes(ctx context.Context, candidateID, orgID uuid.UUID) ([]models.CandidateNoteItem, error) {
	if r.db == nil {
		return []models.CandidateNoteItem{
			{
				ID:             uuid.New(),
				CandidateID:    candidateID,
				RecruiterID:    uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				RecruiterName:  "Rashid Al-Maktoum",
				Note:           "Exceptional Go microservices experience. Strong systems design skills demonstrated in portfolio.",
				Score:          9,
				Recommendation: "Strong Hire",
				IsPinned:       true,
				CreatedAt:      time.Now().Add(-4 * time.Hour),
			},
			{
				ID:             uuid.New(),
				CandidateID:    candidateID,
				RecruiterID:    uuid.MustParse("00000000-0000-0000-0000-000000000002"),
				RecruiterName:  "Amira Al-Farsi",
				Note:           "Good communication skills. Aligned with team culture and values.",
				Score:          8,
				Recommendation: "Hire",
				IsPinned:       false,
				CreatedAt:      time.Now().Add(-2 * time.Hour),
			},
		}, nil
	}

	query := `SELECT id, candidate_id, recruiter_id, COALESCE(recruiter_name, 'Recruiter'), note, score, COALESCE(recommendation, 'Consider'), is_pinned, created_at
	          FROM recruiter_internal_notes
	          WHERE candidate_id = $1 AND org_id = $2
	          ORDER BY is_pinned DESC, created_at DESC`
	rows, err := r.db.Query(ctx, query, candidateID, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CandidateNoteItem
	for rows.Next() {
		var n models.CandidateNoteItem
		err := rows.Scan(&n.ID, &n.CandidateID, &n.RecruiterID, &n.RecruiterName, &n.Note, &n.Score, &n.Recommendation, &n.IsPinned, &n.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, n)
	}
	return list, nil
}

// CreateCandidateEvaluation inserts a structured evaluation.
func (r *RecruiterRepository) CreateCandidateEvaluation(ctx context.Context, eval *models.CandidateEvaluationDTO) error {
	if r.db == nil {
		return nil
	}
	query := `INSERT INTO candidate_evaluations
	          (id, application_id, job_id, candidate_id, evaluator_id, evaluator_name, org_id,
	           skills_score, experience_score, communication_score, technical_score,
	           culture_fit_score, role_fit_score, overall_score, recommendation,
	           strengths, weaknesses, notes, created_at)
	          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NOW())`
	_, err := r.db.Exec(ctx, query, eval.ID, eval.ApplicationID, eval.JobID, eval.CandidateID,
		eval.EvaluatorID, eval.EvaluatorName, eval.OrgID,
		eval.SkillsScore, eval.ExperienceScore, eval.CommunicationScore, eval.TechnicalScore,
		eval.CultureFitScore, eval.RoleFitScore, eval.OverallScore, eval.Recommendation,
		eval.Strengths, eval.Weaknesses, eval.Notes)
	return err
}

// GetCandidateEvaluations retrieves evaluations for an application.
func (r *RecruiterRepository) GetCandidateEvaluations(ctx context.Context, applicationID uuid.UUID) ([]models.CandidateEvaluationDTO, error) {
	if r.db == nil {
		return []models.CandidateEvaluationDTO{
			{
				ID:                 uuid.New(),
				ApplicationID:      applicationID,
				JobID:              uuid.MustParse("11111111-1111-1111-1111-111111111111"),
				CandidateID:        uuid.MustParse("c1111111-1111-1111-1111-111111111111"),
				EvaluatorID:        uuid.MustParse("00000000-0000-0000-0000-000000000001"),
				EvaluatorName:      "Rashid Al-Maktoum",
				SkillsScore:        9,
				ExperienceScore:    8,
				CommunicationScore: 9,
				TechnicalScore:     10,
				CultureFitScore:    8,
				RoleFitScore:       9,
				OverallScore:       9,
				Recommendation:     "Strong Hire",
				Strengths:          "Exceptional Go microservices architecture, PostgreSQL optimization, Kubernetes orchestration",
				Weaknesses:         "Limited Kafka streaming experience",
				Notes:              "Top-tier candidate. Recommend fast-track to offer.",
				CreatedAt:          time.Now().Add(-6 * time.Hour),
			},
		}, nil
	}

	query := `SELECT id, application_id, job_id, candidate_id, evaluator_id, COALESCE(evaluator_name, 'Evaluator'), org_id,
	                 skills_score, experience_score, communication_score, technical_score,
	                 culture_fit_score, role_fit_score, overall_score, COALESCE(recommendation, 'Consider'),
	                 COALESCE(strengths, ''), COALESCE(weaknesses, ''), COALESCE(notes, ''), created_at
	          FROM candidate_evaluations
	          WHERE application_id = $1
	          ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, applicationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []models.CandidateEvaluationDTO
	for rows.Next() {
		var e models.CandidateEvaluationDTO
		err := rows.Scan(&e.ID, &e.ApplicationID, &e.JobID, &e.CandidateID, &e.EvaluatorID, &e.EvaluatorName, &e.OrgID,
			&e.SkillsScore, &e.ExperienceScore, &e.CommunicationScore, &e.TechnicalScore,
			&e.CultureFitScore, &e.RoleFitScore, &e.OverallScore, &e.Recommendation,
			&e.Strengths, &e.Weaknesses, &e.Notes, &e.CreatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}

// VerifyRecruiterOrgAccess checks the recruiter belongs to the specified organization.
func (r *RecruiterRepository) VerifyRecruiterOrgAccess(ctx context.Context, recruiterProfileID, orgID uuid.UUID) (bool, error) {
	if r.db == nil {
		return true, nil
	}
	var count int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM recruiter_organization_profiles WHERE id = $1 AND org_id = $2`, recruiterProfileID, orgID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

package domain

import "testing"

// The badge is the whole visible meaning of verification. Only a completed
// review may render it — a company that has merely applied must look exactly
// like one that has not.
func TestOnlyVerifiedShowsABadge(t *testing.T) {
	statuses := []VerificationStatus{
		VerificationNotVerified, VerificationPending,
		VerificationVerified, VerificationRejected, VerificationExpired,
	}

	for _, status := range statuses {
		want := status == VerificationVerified
		if got := status.ShowsBadge(); got != want {
			t.Errorf("%s.ShowsBadge() = %v, want %v", status, got, want)
		}
	}
}

// Submitting is allowed from the states where no review is outstanding. A
// company under review cannot queue a second request, and a verified one waits
// for expiry rather than re-verifying at will.
func TestVerificationSubmissionWindow(t *testing.T) {
	cases := map[VerificationStatus]bool{
		VerificationNotVerified: true,
		VerificationRejected:    true,
		VerificationExpired:     true,
		VerificationPending:     false,
		VerificationVerified:    false,
	}

	for status, want := range cases {
		if got := status.CanSubmit(); got != want {
			t.Errorf("%s.CanSubmit() = %v, want %v", status, got, want)
		}
	}
}

// Verified is reachable only through an administrator's decision. Nothing in
// the company's own request flow may set it, so the set of decisions an admin
// endpoint accepts is asserted exactly.
func TestVerifiedIsOnlyReachableByAdminDecision(t *testing.T) {
	decisions := AdminDecisions()
	if len(decisions) != 2 {
		t.Fatalf("AdminDecisions() returned %d states: %v", len(decisions), decisions)
	}

	if !IsAdminDecision(VerificationVerified) {
		t.Error("an administrator cannot verify a company")
	}
	if !IsAdminDecision(VerificationRejected) {
		t.Error("an administrator cannot reject a company")
	}

	// Pending is what a submission produces; expired is what time produces.
	// Neither is something an administrator sets by hand, and not_verified
	// would be an un-decision.
	for _, status := range []VerificationStatus{VerificationPending, VerificationNotVerified, VerificationExpired} {
		if IsAdminDecision(status) {
			t.Errorf("%s was accepted as an administrator decision", status)
		}
	}
	if IsAdminDecision(VerificationStatus("approved")) {
		t.Error("an unknown status was accepted as an administrator decision")
	}
}

// A verification status arriving from a request body must not be coerced. In
// particular no near-miss of "verified" may parse.
func TestParseVerificationStatusRejectsUnknownValues(t *testing.T) {
	for _, valid := range []VerificationStatus{
		VerificationNotVerified, VerificationPending,
		VerificationVerified, VerificationRejected, VerificationExpired,
	} {
		if got, ok := ParseVerificationStatus(string(valid)); !ok || got != valid {
			t.Errorf("ParseVerificationStatus(%q) = %q, %v", valid, got, ok)
		}
	}
	for _, bad := range []string{"", "approved", "verify", "true", "VERIFIED_BY_ADMIN", "not verified"} {
		if status, ok := ParseVerificationStatus(bad); ok {
			t.Errorf("ParseVerificationStatus(%q) accepted and returned %q", bad, status)
		}
	}
}

// Membership is what turns a role into access. A pending request, a rejection,
// a removal and a suspension all leave the row in place and the access gone.
func TestOnlyApprovedMembershipGrantsAccess(t *testing.T) {
	cases := map[MembershipStatus]bool{
		MembershipApproved:  true,
		MembershipPending:   false,
		MembershipRejected:  false,
		MembershipRemoved:   false,
		MembershipSuspended: false,
	}

	for status, want := range cases {
		if got := status.GrantsAccess(); got != want {
			t.Errorf("%s.GrantsAccess() = %v, want %v", status, got, want)
		}
	}

	// An unparseable status is the zero value, which must not grant anything.
	var unset MembershipStatus
	if unset.GrantsAccess() {
		t.Error("an empty membership status granted access")
	}
}

// Every parser in the module refuses what it does not recognise. They are
// checked together because a single one defaulting instead of rejecting is
// enough to let a crafted value through.
func TestParsersRejectUnknownValues(t *testing.T) {
	t.Run("membership", func(t *testing.T) {
		if _, ok := ParseMembershipStatus("approve"); ok {
			t.Error("accepted 'approve'")
		}
		if got, ok := ParseMembershipStatus(" Approved "); !ok || got != MembershipApproved {
			t.Errorf("ParseMembershipStatus(' Approved ') = %q, %v", got, ok)
		}
	})

	t.Run("association", func(t *testing.T) {
		for _, valid := range []AssociationType{
			AssociationCurrentEmployee, AssociationFormerEmployee, AssociationContractor,
			AssociationRecruiter, AssociationHiringManager, AssociationExecutive, AssociationIntern,
		} {
			if got, ok := ParseAssociationType(string(valid)); !ok || got != valid {
				t.Errorf("ParseAssociationType(%q) = %q, %v", valid, got, ok)
			}
		}
		if _, ok := ParseAssociationType("employee"); ok {
			t.Error("accepted 'employee' as an association type")
		}
	})

	t.Run("invitation status", func(t *testing.T) {
		for _, valid := range []InvitationStatus{
			InvitationPending, InvitationAccepted, InvitationDeclined,
			InvitationExpired, InvitationRevoked,
		} {
			if got, ok := ParseInvitationStatus(string(valid)); !ok || got != valid {
				t.Errorf("ParseInvitationStatus(%q) = %q, %v", valid, got, ok)
			}
		}
		if _, ok := ParseInvitationStatus("open"); ok {
			t.Error("accepted 'open'")
		}
	})

	t.Run("invitation channel", func(t *testing.T) {
		for _, valid := range []InvitationChannel{
			InvitationChannelEmail, InvitationChannelNotification, InvitationChannelLink,
		} {
			if got, ok := ParseInvitationChannel(string(valid)); !ok || got != valid {
				t.Errorf("ParseInvitationChannel(%q) = %q, %v", valid, got, ok)
			}
		}
		if _, ok := ParseInvitationChannel("sms"); ok {
			t.Error("accepted a channel the module cannot send on")
		}
	})

	t.Run("update status and type", func(t *testing.T) {
		for _, valid := range []UpdateStatus{UpdateDraft, UpdateScheduled, UpdatePublished, UpdateArchived} {
			if got, ok := ParseUpdateStatus(string(valid)); !ok || got != valid {
				t.Errorf("ParseUpdateStatus(%q) = %q, %v", valid, got, ok)
			}
		}
		if _, ok := ParseUpdateStatus("live"); ok {
			t.Error("accepted 'live'")
		}
		for _, valid := range []UpdateType{
			UpdateTypeText, UpdateTypeImage, UpdateTypeLink, UpdateTypeJob,
			UpdateTypeHiring, UpdateTypeNews, UpdateTypeEventNotice,
		} {
			if got, ok := ParseUpdateType(string(valid)); !ok || got != valid {
				t.Errorf("ParseUpdateType(%q) = %q, %v", valid, got, ok)
			}
		}
		if _, ok := ParseUpdateType("announcement"); ok {
			t.Error("accepted 'announcement'")
		}
	})

	t.Run("review employment type", func(t *testing.T) {
		for _, valid := range []ReviewEmploymentType{
			ReviewCurrentEmployee, ReviewFormerEmployee, ReviewContractor, ReviewIntern,
		} {
			if got, ok := ParseReviewEmploymentType(string(valid)); !ok || got != valid {
				t.Errorf("ParseReviewEmploymentType(%q) = %q, %v", valid, got, ok)
			}
		}
		if _, ok := ParseReviewEmploymentType("anonymous"); ok {
			t.Error("accepted 'anonymous'")
		}
	})
}

// One report must not be enough to pull a review out of public view, or a
// company could silence a critic with a single click.
func TestReviewReportThresholdIsAboveOne(t *testing.T) {
	if ReviewReportThreshold < 2 {
		t.Fatalf("ReviewReportThreshold = %d; a single report can hide a review", ReviewReportThreshold)
	}
}

// The audit vocabulary is fixed and distinct: two events sharing an action
// string would make the trail unreadable at exactly the moment it matters.
func TestAuditActionsAreDistinct(t *testing.T) {
	actions := []string{
		AuditCompanyCreated, AuditCompanyUpdated,
		AuditVerificationSubmitted, AuditVerificationApproved, AuditVerificationRejected,
		AuditEmployeeAdded, AuditEmployeeRemoved,
		AuditRecruiterInvited, AuditRecruiterRemoved,
		AuditPermissionChanged,
		AuditJobPublished, AuditJobClosed,
		AuditUpdatePublished, AuditReviewReported, AuditSensitiveDataAccessed,
	}

	seen := make(map[string]bool, len(actions))
	for _, action := range actions {
		if action == "" {
			t.Error("an audit action is empty")
		}
		if seen[action] {
			t.Errorf("audit action %q is used twice", action)
		}
		seen[action] = true
	}
	if len(seen) != 15 {
		t.Errorf("the module records %d distinct audit actions, want 15", len(seen))
	}
}

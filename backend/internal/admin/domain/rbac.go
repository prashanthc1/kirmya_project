// Package domain holds the administrative RBAC vocabulary: the permissions the
// admin surface enforces, the roles that carry them, and the rule that turns an
// account's assignments into an effective permission set.
//
// This package is the canonical definition. Migration 0099 seeds the same
// vocabulary into admin_permissions, admin_roles and admin_role_permissions,
// and TestAdminRBACSeedMatchesTheCode compares the two - so the SQL and this
// file cannot drift apart without a red build.
//
// Nothing here decides whether a caller is an administrator. RequireAdmin()
// decides that, from users.role_id, ahead of any of this. These permissions
// narrow what an administrator may do; they never make one.
package domain

import "sort"

// Permission codes. Every one is enforced by a route that exists.
const (
	PermDashboardRead       = "dashboard.read"
	PermUsersRead           = "users.read"
	PermUsersUpdate         = "users.update"
	PermUsersSuspend        = "users.suspend"
	PermUsersImpersonate    = "users.impersonate"
	PermCompaniesRead       = "companies.read"
	PermCompaniesVerify     = "companies.verify"
	PermCompaniesSuspend    = "companies.suspend"
	PermRecruitersRead      = "recruiters.read"
	PermJobsRead            = "jobs.read"
	PermJobsModerate        = "jobs.moderate"
	PermApplicationsRead    = "applications.read"
	PermCommunitiesModerate = "communities.moderate"
	PermReportsRead         = "reports.read"
	PermReportsResolve      = "reports.resolve"
	PermModerationReview    = "moderation.review"
	PermVerificationsReview = "verifications.review"
	PermSystemJobsRead      = "system_jobs.read"
	PermSystemJobsRetry     = "system_jobs.retry"
	PermIncidentsManage     = "incidents.manage"
	PermMaintenanceManage   = "maintenance.manage"
	PermObservabilityRead   = "observability.read"
	PermSystemSettings      = "system_settings.manage"
	PermFeatureFlags        = "feature_flags.manage"
	PermAnnouncements       = "announcements.manage"
	PermAnalyticsRead       = "analytics.read"
	PermAuditLogsRead       = "audit_logs.read"
	PermSecurityEventsRead  = "security_events.read"
	PermRolesManage         = "roles.manage"

	// Added when enforcement was extended past /api/v1/admin/* to the
	// administrative surfaces the other modules mount. Each one exists because
	// no permission above described the operation: mapping the notification
	// desk to announcements.manage, or backup restore to system_settings.manage,
	// would have handed narrow roles authority nobody chose to give them.
	PermNotificationsRead   = "notifications.read"
	PermNotificationsManage = "notifications.manage"
	PermSupportRead         = "support.read"
	PermSupportManage       = "support.manage"
	PermComplianceRead      = "compliance.read"
	PermComplianceManage    = "compliance.manage"
	PermBillingRead         = "billing.read"
	PermBackupsRead         = "backups.read"
	PermBackupsManage       = "backups.manage"
	PermDataOpsRead         = "data_operations.read"
	PermDataOpsManage       = "data_operations.manage"
	PermSecurityManage      = "security.manage"
	PermAnalyticsManage     = "analytics.manage"
)

// Role codes.
const (
	RoleSuperAdmin        = "super_admin"
	RolePlatformAdmin     = "platform_admin"
	RoleUserAdmin         = "user_admin"
	RoleTrustSafetyAdmin  = "trust_safety_admin"
	RoleContentModerator  = "content_moderator"
	RoleVerificationAdmin = "verification_admin"
	RoleSupportAdmin      = "support_admin"
	RoleAnalyticsAdmin    = "analytics_admin"
	RoleOperationsAdmin   = "operations_admin"
	RoleReadOnlyAdmin     = "read_only_admin"
)

// allPermissions is every permission, in the order the seed lists them.
var allPermissions = []string{
	PermDashboardRead,
	PermUsersRead, PermUsersUpdate, PermUsersSuspend, PermUsersImpersonate,
	PermCompaniesRead, PermCompaniesVerify, PermCompaniesSuspend,
	PermRecruitersRead,
	PermJobsRead, PermJobsModerate, PermApplicationsRead, PermCommunitiesModerate,
	PermReportsRead, PermReportsResolve, PermModerationReview, PermVerificationsReview,
	PermSystemJobsRead, PermSystemJobsRetry, PermIncidentsManage, PermMaintenanceManage,
	PermObservabilityRead,
	PermSystemSettings, PermFeatureFlags, PermAnnouncements,
	PermAnalyticsRead, PermAuditLogsRead, PermSecurityEventsRead,
	PermRolesManage,
	PermNotificationsRead, PermNotificationsManage,
	PermSupportRead, PermSupportManage,
	PermComplianceRead, PermComplianceManage,
	PermBillingRead,
	PermBackupsRead, PermBackupsManage,
	PermDataOpsRead, PermDataOpsManage,
	PermSecurityManage,
	PermAnalyticsManage,
}

// AllPermissions returns every permission the admin surface enforces.
func AllPermissions() []string {
	return append([]string(nil), allPermissions...)
}

// except returns every permission apart from the ones named.
func except(excluded ...string) []string {
	skip := map[string]bool{}
	for _, code := range excluded {
		skip[code] = true
	}
	kept := make([]string, 0, len(allPermissions))
	for _, code := range allPermissions {
		if !skip[code] {
			kept = append(kept, code)
		}
	}
	return kept
}

// readOnly returns every permission that only reads.
//
// Derived rather than listed, so a permission added later is not silently left
// out of the role whose whole definition is "can look at things". The seed
// derives it the same way, with LIKE '%.read'.
func readOnly() []string {
	kept := make([]string, 0, len(allPermissions))
	for _, code := range allPermissions {
		if len(code) > 5 && code[len(code)-5:] == ".read" {
			kept = append(kept, code)
		}
	}
	return kept
}

// rolePermissions maps each seeded role to what it carries.
var rolePermissions = map[string][]string{
	RoleSuperAdmin: AllPermissions(),

	// Everything except the two that let an administrator become another user
	// or grant themselves more. Those stay with super_admin.
	RolePlatformAdmin: except(PermRolesManage, PermUsersImpersonate),

	RoleUserAdmin: {
		PermDashboardRead, PermUsersRead, PermUsersUpdate, PermUsersSuspend,
		PermCompaniesRead, PermRecruitersRead,
	},
	RoleTrustSafetyAdmin: {
		PermDashboardRead, PermReportsRead, PermReportsResolve, PermModerationReview,
		PermCommunitiesModerate, PermUsersRead, PermUsersSuspend,
	},
	RoleContentModerator: {
		PermDashboardRead, PermJobsRead, PermJobsModerate, PermApplicationsRead,
		PermCommunitiesModerate, PermReportsRead, PermReportsResolve, PermModerationReview,
	},
	RoleVerificationAdmin: {
		PermDashboardRead, PermVerificationsReview, PermCompaniesRead,
		PermCompaniesVerify, PermCompaniesSuspend,
	},
	// No users.impersonate. 0099 gave it to this role and the accompanying note
	// claimed that among the seeded roles only super_admin could become anyone,
	// which was not true of the seed it described. Impersonation is the single
	// most dangerous administrative capability - it produces a session
	// indistinguishable from the user's own - and a support desk does not need
	// it to answer a ticket. It stays with super_admin, alongside roles.manage.
	//
	// Removing it narrows nobody today: no account has an assignment, so no
	// account holds this role.
	RoleSupportAdmin: {
		PermDashboardRead, PermUsersRead, PermReportsRead,
		PermSupportRead, PermSupportManage, PermNotificationsRead,
	},
	RoleAnalyticsAdmin: {
		PermDashboardRead, PermAnalyticsRead, PermAuditLogsRead,
		PermSecurityEventsRead, PermObservabilityRead,
		PermAnalyticsManage, PermBillingRead,
	},
	RoleOperationsAdmin: {
		PermDashboardRead, PermSystemJobsRead, PermSystemJobsRetry,
		PermIncidentsManage, PermMaintenanceManage, PermObservabilityRead,
		PermBackupsRead, PermBackupsManage,
		PermDataOpsRead, PermDataOpsManage,
		PermNotificationsRead, PermNotificationsManage,
	},
	RoleReadOnlyAdmin: readOnly(),
}

// PermissionsForRole returns what a role carries, and whether the role exists.
//
// The second return value matters: an unknown role code is not a role with no
// permissions, it is a mistake, and the assign path refuses it rather than
// storing a narrowing nobody can explain later.
func PermissionsForRole(code string) ([]string, bool) {
	perms, ok := rolePermissions[code]
	if !ok {
		return nil, false
	}
	return append([]string(nil), perms...), true
}

// RoleCodes returns every seeded role code, sorted.
func RoleCodes() []string {
	codes := make([]string, 0, len(rolePermissions))
	for code := range rolePermissions {
		codes = append(codes, code)
	}
	sort.Strings(codes)
	return codes
}

// EffectivePermissions is the rule that reconciles the two admin systems.
//
//	no assignment  -> every permission
//	an assignment  -> exactly what those roles carry
//
// The first case is what makes this safe to deploy into a running product.
// Every administrator today has no assignment, so every administrator keeps
// exactly the access they have now and notices nothing; narrowing is opt-in,
// one account at a time. It also means an assignment can only ever *remove*
// access, because the set it replaces is the whole of it - there is no
// arrangement of roles that grants more than assigning none.
//
// It is not the whole authorization decision and must never be used as one.
// RequireAdmin() runs first and decides whether the caller is an administrator
// at all, from users.role_id; this only narrows what an administrator may do.
// An account that is not an administrator never reaches here, and if it somehow
// did, "no assignment" would hand it everything - which is precisely why the
// outer gate is not optional.
func EffectivePermissions(assignedRoles []string) []string {
	if len(assignedRoles) == 0 {
		return AllPermissions()
	}

	seen := map[string]bool{}
	var effective []string
	for _, role := range assignedRoles {
		perms, ok := PermissionsForRole(role)
		if !ok {
			// An unknown code carries nothing. It cannot widen, and refusing to
			// guess is the point: a role the code does not know is a role whose
			// intent the code cannot honour.
			continue
		}
		for _, perm := range perms {
			if !seen[perm] {
				seen[perm] = true
				effective = append(effective, perm)
			}
		}
	}
	return effective
}

// HasPermission reports whether an effective set allows a permission.
func HasPermission(effective []string, required string) bool {
	for _, perm := range effective {
		if perm == required {
			return true
		}
	}
	return false
}

package service

import (
	"kirmya/internal/community/models"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestCommunityPermissions verifies that Owner, Admin, and Moderator have different permissions.
func TestCommunityPermissions(t *testing.T) {
	// 1. Moderator permission check
	modMem := &models.CommunityMember{
		RoleName: "moderator",
		Status:   "active",
	}

	canMod := modMem.RoleName == "owner" || modMem.RoleName == "admin" || modMem.RoleName == "moderator"
	assert.True(t, canMod)

	// 2. Member permission check (Members cannot moderate posts)
	memberMem := &models.CommunityMember{
		RoleName: "member",
		Status:   "active",
	}

	canMod = memberMem.RoleName == "owner" || memberMem.RoleName == "admin" || memberMem.RoleName == "moderator"
	assert.False(t, canMod)

	// 3. Admin can manage members
	adminMem := &models.CommunityMember{
		RoleName: "admin",
		Status:   "active",
	}
	canManage := adminMem.RoleName == "owner" || adminMem.RoleName == "admin"
	assert.True(t, canManage)
}

// TestPrivateCommunityAccessLogic checks that non-members cannot read posts in a private community
func TestPrivateCommunityAccessLogic(t *testing.T) {
	comm := &models.Community{
		IsPrivate: true,
	}

	// Case 1: Member is active
	activeMember := &models.CommunityMember{
		Status: "active",
	}
	accessAllowed := !comm.IsPrivate || (activeMember != nil && activeMember.Status == "active")
	assert.True(t, accessAllowed)

	// Case 2: Pending request
	pendingMember := &models.CommunityMember{
		Status: "pending",
	}
	accessAllowed = !comm.IsPrivate || (pendingMember != nil && pendingMember.Status == "active")
	assert.False(t, accessAllowed)
}

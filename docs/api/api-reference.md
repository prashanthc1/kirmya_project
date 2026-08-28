# Kirmya REST API Reference & Complete Endpoint Catalog

Welcome to the comprehensive REST API reference catalog for the Kirmya platform. All endpoints are versioned under `/api/v1` and adhere to strict validation, typed request/response contracts, and server-authoritative authorization.

---

## 1. Authentication & Session Security (`/api/v1/auth`, `/api/v1/security`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new job seeker or recruiter account | Public | `RegisterPayload` (email, password, role) | `AuthResponse` |
| `POST` | `/api/v1/auth/login` | Authenticate user credentials and issue session JWT | Public | `LoginPayload` (email, password) | `AuthResponse` |
| `POST` | `/api/v1/auth/logout` | Terminate session and invalidate refresh token | Bearer Token | - | `SuccessResponse` |
| `POST` | `/api/v1/auth/refresh` | Exchange valid refresh token for a new access token | Public | `RefreshPayload` (refreshToken) | `TokenPairResponse` |
| `POST` | `/api/v1/auth/forgot-password` | Send password reset email token | Public | `ForgotPasswordPayload` (email) | `SuccessResponse` |
| `POST` | `/api/v1/auth/reset-password` | Reset password using verified reset token | Public | `ResetPasswordPayload` (token, newPassword) | `SuccessResponse` |
| `POST` | `/api/v1/auth/verify-email` | Verify user email address with verification token | Public | `VerifyEmailPayload` (token) | `SuccessResponse` |
| `GET` | `/api/v1/security/overview` | Get user security score, active sessions & 2FA status | Bearer Token | - | `SecurityOverview` |
| `POST` | `/api/v1/security/password` | Change password with current password verification | Bearer Token | `PasswordChangePayload` | `SuccessResponse` |
| `GET` | `/api/v1/security/sessions` | List all active sessions with device & IP details | Bearer Token | - | `[]SessionItem` |
| `DELETE` | `/api/v1/security/sessions/:id` | Revoke a specific active session | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/security/sessions/revoke-others` | Revoke all other active sessions | Bearer Token | - | `SuccessResponse` |
| `POST` | `/api/v1/security/mfa/setup` | Generate TOTP MFA secret and QR code URI | Bearer Token | - | `MFASetupResponse` |
| `POST` | `/api/v1/security/mfa/verify` | Verify TOTP code and enable two-factor authentication | Bearer Token | `MFAVerifyPayload` (code) | `SuccessResponse` |
| `POST` | `/api/v1/security/mfa/disable` | Disable two-factor authentication with password check | Bearer Token | `PasswordConfirmPayload` | `SuccessResponse` |

---

## 2. Profiles & Portfolios (`/api/v1/profile`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/profile/me` | Retrieve authenticated user's complete profile | Bearer Token | - | `UserProfile` |
| `PUT` | `/api/v1/profile/me` | Update general profile details (headline, location, bio) | Bearer Token | `UpdateProfileDTO` | `UserProfile` |
| `GET` | `/api/v1/profile/me/preview` | Preview public rendition of user profile | Bearer Token | - | `UserProfile` |
| `PUT` | `/api/v1/profile/me/about` | Update about summary markdown text | Bearer Token | `UpdateProfileDTO` | `UserProfile` |
| `PUT` | `/api/v1/profile/me/headline` | Update professional headline and title | Bearer Token | `UpdateProfileDTO` | `UserProfile` |
| `POST` | `/api/v1/profile/me/experience` | Add employment history entry | Bearer Token | `WorkExperienceDTO` | `UserWorkExperience` |
| `PUT` | `/api/v1/profile/me/experience/:id` | Update employment history entry | Bearer Token | `id` (path), `WorkExperienceDTO` | `UserWorkExperience` |
| `DELETE`| `/api/v1/profile/me/experience/:id` | Remove employment history entry | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/profile/me/education` | Add education credential | Bearer Token | `EducationDTO` | `UserEducation` |
| `PUT` | `/api/v1/profile/me/education/:id` | Update education credential | Bearer Token | `id` (path), `EducationDTO` | `UserEducation` |
| `DELETE`| `/api/v1/profile/me/education/:id` | Remove education credential | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/profile/me/skills` | Add professional skill and proficiency level | Bearer Token | `UserSkill` | `SuccessResponse` |
| `DELETE`| `/api/v1/profile/me/skills/:id` | Remove professional skill | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/profile/me/certifications`| Add verified certification or license | Bearer Token | `UserCertification` | `SuccessResponse` |
| `DELETE`| `/api/v1/profile/me/certifications/:id`| Remove certification | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/profile/me/projects` | Add portfolio project with URLs | Bearer Token | `UserProject` | `SuccessResponse` |
| `DELETE`| `/api/v1/profile/me/projects/:id` | Remove portfolio project | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/profile/me/languages` | Add spoken/written language proficiency | Bearer Token | `UserLanguage` | `SuccessResponse` |
| `DELETE`| `/api/v1/profile/me/languages/:id` | Remove language entry | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/profile/me/achievements` | Add awards, honors, and milestones | Bearer Token | `UserAchievement` | `SuccessResponse` |
| `DELETE`| `/api/v1/profile/me/achievements/:id`| Remove achievement | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/profile/me/photo` | Upload profile avatar picture | Bearer Token | `multipart/form-data` | `SuccessResponse` |
| `DELETE`| `/api/v1/profile/me/photo` | Remove profile avatar picture | Bearer Token | - | `SuccessResponse` |
| `PUT` | `/api/v1/profile/me/privacy` | Update profile visibility & search index settings | Bearer Token | `ProfilePrivacyDTO` | `SuccessResponse` |
| `GET` | `/api/v1/profile/me/completeness` | Calculate profile completeness & suggestions | Bearer Token | - | `ProfileCompletenessDTO` |
| `POST` | `/api/v1/profile/me/verification`| Submit government ID or document for verification | Bearer Token | `VerificationRequestPayload`| `UserProfile` |
| `PUT` | `/api/v1/profile/me/career-preferences`| Update target roles, salary, and availability | Bearer Token | `CareerPreferencesDTO` | `UserProfile` |
| `GET` | `/api/v1/profile/me/resume-consistency`| Compare profile data against uploaded resume | Bearer Token | - | `ResumeConsistencyDTO` |
| `GET` | `/api/v1/profile/me/analytics` | View profile view counts & search impressions | Bearer Token | - | `ProfileAnalyticsDTO` |
| `GET` | `/api/v1/profile/:username` | View public profile by username handle | Public | `username` (path) | `UserProfile` |
| `POST` | `/api/v1/profile/:username/report`| Report user profile for Trust & Safety review | Bearer Token | `username` (path), `ProfileReportDTO` | `SuccessResponse` |

---

## 3. Job Market & Candidate Matching (`/api/v1/jobs`, `/api/v1/ai-job-match`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/jobs` | Search and filter active job postings | Public | `q`, `location`, `remote`, `page`, `limit` | `JobListPage` |
| `GET` | `/api/v1/jobs/:id` | Get detailed job posting with requirements | Public | `id` (path) | `JobSummary` |
| `GET` | `/api/v1/jobs/match` | Get personalized job matches based on profile skills | Bearer Token | `page`, `limit` | `JobMatchPage` |
| `GET` | `/api/v1/jobs/recommendations` | AI-assisted job recommendations for candidate | Bearer Token | - | `[]JobRecommendation` |
| `GET` | `/api/v1/jobs/saved` | List candidate's saved job bookmarks | Bearer Token | `page`, `limit` | `JobListPage` |
| `POST` | `/api/v1/jobs/:id/save` | Save/bookmark a job posting | Bearer Token | `id` (path) | `SuccessResponse` |
| `DELETE`| `/api/v1/jobs/:id/save` | Remove saved job bookmark | Bearer Token | `id` (path) | `SuccessResponse` |

---

## 4. Applicant Tracking System (ATS) & Applications (`/api/v1/applications`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/applications` | Submit a new job application with resume & cover letter | Bearer Token | `ApplyJobPayload` | `ApplicationSummary` |
| `GET` | `/api/v1/applications` | List candidate's submitted job applications | Bearer Token | `page`, `limit`, `status` | `ApplicationListPage` |
| `GET` | `/api/v1/applications/:id` | View specific application status and interview steps | Bearer Token (Owner/Recruiter)| `id` (path) | `ApplicationDetail` |
| `POST` | `/api/v1/applications/:id/withdraw`| Withdraw candidate job application | Bearer Token (Owner) | `id` (path), `WithdrawPayload` | `SuccessResponse` |

---

## 5. Recruiter & Employer Operations (`/api/v1/recruiter`, `/api/v1/employer`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/employer/dashboard` | Executive employer overview metrics | Recruiter/Employer RBAC | - | `CompanyDashboard` |
| `GET` | `/api/v1/employer/company` | Retrieve managed organization profile | Recruiter/Employer RBAC | - | `CompanyDetail` |
| `PUT` | `/api/v1/employer/company` | Update company description, website, and branding | Recruiter/Employer RBAC | `CompanyUpdatePayload` | `CompanyDetail` |
| `GET` | `/api/v1/employer/team` | List employer hiring team members & roles | Recruiter/Employer RBAC | - | `[]TeamMember` |
| `POST` | `/api/v1/employer/team/invite` | Invite recruiter or hiring manager to team | Recruiter/Employer RBAC | `TeamInvitePayload` | `InvitationIssued` |
| `DELETE`| `/api/v1/employer/team/members/:memberId`| Remove recruiter from hiring team | Recruiter Admin | `memberId` (path) | `SuccessResponse` |
| `PUT` | `/api/v1/employer/team/members/:memberId`| Update team member hiring role & permissions | Recruiter Admin | `memberId` (path), `TeamMemberUpdatePayload` | `SuccessResponse` |
| `POST` | `/api/v1/employer/team/transfer-ownership`| Transfer organization ownership | Organization Owner | `TransferOwnershipPayload`| `SuccessResponse` |
| `GET` | `/api/v1/employer/jobs` | List organization's active and draft job postings | Recruiter/Employer RBAC | `page`, `limit`, `status` | `JobListPage` |
| `POST` | `/api/v1/recruiter/jobs` | Post a new job opportunity | Recruiter/Employer RBAC | `CreateJobPayload` | `JobSummary` |
| `PUT` | `/api/v1/recruiter/jobs/:id` | Edit active job posting requirements | Recruiter/Employer RBAC | `id` (path), `CreateJobPayload` | `JobSummary` |
| `POST` | `/api/v1/recruiter/jobs/:id/close`| Close or archive an active job posting | Recruiter/Employer RBAC | `id` (path) | `SuccessResponse` |
| `GET` | `/api/v1/recruiter/pipeline` | Recruiter Kanban candidate pipeline | Recruiter/Employer RBAC | `jobId`, `stage` | `PipelineBoard` |
| `POST` | `/api/v1/recruiter/applications/:id/stage`| Advance or move candidate to a pipeline stage | Recruiter/Employer RBAC | `id` (path), `UpdateStagePayload` | `SuccessResponse` |
| `POST` | `/api/v1/recruiter/applications/:id/evaluate`| Submit scorecard assessment & ratings | Recruiter/Employer RBAC | `id` (path), `InterviewFeedbackPayload` | `SuccessResponse` |
| `GET` | `/api/v1/recruiter/candidates/search`| Search candidate talent pool with skill filters | Recruiter/Employer RBAC | `q`, `skills`, `location`, `page` | `CandidateSearchPage` |
| `POST` | `/api/v1/recruiter/talent-pools`| Create a talent pool or candidate shortlist | Recruiter/Employer RBAC | `CreatePoolPayload` | `TalentPool` |
| `GET` | `/api/v1/employer/analytics` | View hiring velocity, candidate funnel & time-to-hire | Recruiter/Employer RBAC | - | `CompanyAnalytics` |
| `POST` | `/api/v1/employer/export` | Export recruitment metrics & candidate audit logs | Recruiter Admin | `ExportPayload` | `ExportJob` |

---

## 6. Professional Communities & Knowledge Collaboration (`/api/v1/communities`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/communities` | Discover public professional communities & groups | Public | `q`, `category`, `page`, `limit` | `[]Community` |
| `POST` | `/api/v1/communities` | Create a new professional group or community | Bearer Token | `CreateCommunityDTO` | `Community` |
| `GET` | `/api/v1/communities/:id` | Get community overview, rules, and announcements | Public (Public) / Member (Private) | `id` (path) | `Community` |
| `PUT` | `/api/v1/communities/:id` | Update community settings and rules | Community Owner/Admin | `id` (path), `UpdateCommunityDTO` | `Community` |
| `POST` | `/api/v1/communities/:id/join` | Join community or submit join request | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/communities/:id/leave`| Leave community membership | Bearer Token | `id` (path) | `SuccessResponse` |
| `GET` | `/api/v1/communities/:id/members`| List community member directory | Community Member | `id` (path), `page`, `limit` | `[]CommunityMember` |
| `GET` | `/api/v1/communities/:id/posts` | List discussions, pinned threads, and announcements | Community Member | `id` (path), `page`, `limit` | `[]CommunityPost` |
| `POST` | `/api/v1/communities/:id/posts` | Publish a discussion or announcement | Community Member | `id` (path), `CreateDiscussionDTO` | `CommunityPost` |
| `PUT` | `/api/v1/communities/:id/posts/:postId/pin`| Pin or unpin discussion thread | Moderator/Admin | `id`, `postId` (path), `PinPostPayload` | `SuccessResponse` |
| `PUT` | `/api/v1/communities/:id/posts/:postId/lock`| Lock discussion thread to prevent replies | Moderator/Admin | `id`, `postId` (path), `LockPostPayload` | `SuccessResponse` |
| `POST` | `/api/v1/communities/:id/posts/:postId/comments`| Add a comment to discussion thread | Community Member | `id`, `postId` (path), `CreateCommentDTO` | `CommunityComment` |
| `POST` | `/api/v1/communities/:id/events`| Create an upcoming virtual community meetup | Community Admin | `id` (path), `CreateCommunityEventDTO` | `CommunityEvent` |
| `POST` | `/api/v1/communities/:id/resources`| Share an educational resource or guide | Community Member | `id` (path), `CreateCommunityResourceDTO` | `CommunityResource` |
| `POST` | `/api/v1/communities/:id/moderation/moderate`| Warn, remove, or ban offending community member | Moderator/Admin | `id` (path), `ModerateMemberDTO` | `SuccessResponse` |

---

## 7. Real-Time Messaging & Direct Conversations (`/api/v1/messages`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/messages/ws` | Establish persistent WebSocket connection for real-time chat | Bearer Token | - | `101 Switching Protocols` |
| `GET` | `/api/v1/messages/conversations`| List user's active direct conversations | Bearer Token | - | `[]Conversation` |
| `POST` | `/api/v1/messages/conversations`| Start or resume a conversation with a connection | Bearer Token | `CreateConversationDTO` | `Conversation` |
| `GET` | `/api/v1/messages/conversations/:id/messages`| List message history in conversation | Bearer Token (Participant) | `id` (path), `cursor`, `limit` | `[]Message` |
| `POST` | `/api/v1/messages/conversations/:id/messages`| Send a message with optional file attachment | Bearer Token (Participant) | `id` (path), `SendMessageDTO` | `Message` |
| `POST` | `/api/v1/messages/conversations/:id/read`| Mark conversation messages as read | Bearer Token (Participant) | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/messages/conversations/:id/archive`| Archive conversation | Bearer Token (Participant) | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/messages/conversations/:id/mute`| Mute conversation notifications | Bearer Token (Participant) | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/messages/conversations/:id/pin`| Pin conversation to top of inbox | Bearer Token (Participant) | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/messages/messages/:id/reaction`| Add emoji reaction to message | Bearer Token (Participant) | `id` (path), `ReactionDTO` | `SuccessResponse` |
| `GET` | `/api/v1/messages/requests` | List incoming connection message requests | Bearer Token | - | `[]MessageRequest` |
| `POST` | `/api/v1/messages/requests` | Send a message request to a non-connection | Bearer Token | `SendMessageRequestDTO` | `MessageRequest` |
| `POST` | `/api/v1/messages/requests/:id/accept`| Accept incoming message request | Bearer Token (Receiver) | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/messages/requests/:id/decline`| Decline incoming message request | Bearer Token (Receiver) | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/messages/report` | Report harassment or spam in direct messaging | Bearer Token | `MessageReportDTO` | `SuccessResponse` |

---

## 8. Professional Networking, Goals & Referrals (`/api/v1/network`, `/api/v1/people`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/people/search` | Search professionals by industry, skill, company | Bearer Token | `q`, `industry`, `location`, `company` | `PeopleSearchResultPage` |
| `GET` | `/api/v1/people/suggestions` | Suggested professional connections | Bearer Token | - | `[]ConnectionRecommendation` |
| `GET` | `/api/v1/network` | Overview of network growth, connections & requests | Bearer Token | - | `NetworkGrowthStats` |
| `GET` | `/api/v1/network/connections` | List user's 1st-degree connections | Bearer Token | `page`, `limit` | `[]Connection` |
| `DELETE`| `/api/v1/network/connections/:id` | Remove a 1st-degree connection | Bearer Token | `id` (path) | `SuccessResponse` |
| `GET` | `/api/v1/network/requests` | List received connection requests | Bearer Token | - | `[]ConnectionRequest` |
| `GET` | `/api/v1/network/requests/sent` | List pending outgoing connection requests | Bearer Token | - | `[]ConnectionRequest` |
| `POST` | `/api/v1/network/requests` | Send connection invitation with optional note | Bearer Token | `SendConnectionRequestDTO` | `ConnectionRequest` |
| `POST` | `/api/v1/network/requests/:id/accept`| Accept connection request | Bearer Token (Receiver) | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/network/requests/:id/decline`| Reject connection request | Bearer Token (Receiver) | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/network/requests/:id/withdraw`| Withdraw pending sent connection request | Bearer Token (Sender) | `id` (path) | `SuccessResponse` |
| `GET` | `/api/v1/network/mutual/:userId` | View mutual connections with another user | Bearer Token | `userId` (path) | `MutualConnectionsResult` |
| `POST` | `/api/v1/network/follow/:userId` | Follow updates from a public professional | Bearer Token | `userId` (path) | `SuccessResponse` |
| `DELETE`| `/api/v1/network/follow/:userId` | Unfollow professional updates | Bearer Token | `userId` (path) | `SuccessResponse` |
| `POST` | `/api/v1/network/notes` | Save private note attached to connection | Bearer Token | `SaveNoteDTO` | `ConnectionNote` |
| `GET` | `/api/v1/network/notes/:targetUserId`| Retrieve private note for connection | Bearer Token | `targetUserId` (path) | `ConnectionNote` |
| `DELETE`| `/api/v1/network/notes/:targetUserId`| Delete private note for connection | Bearer Token | `targetUserId` (path) | `SuccessResponse` |
| `POST` | `/api/v1/network/labels` | Add label/tag to connection | Bearer Token | `SaveLabelDTO` | `ConnectionLabel` |
| `GET` | `/api/v1/network/labels/:targetUserId`| List labels assigned to connection | Bearer Token | `targetUserId` (path) | `[]ConnectionLabel` |
| `DELETE`| `/api/v1/network/labels/:targetUserId/:label`| Remove label from connection | Bearer Token | `targetUserId`, `label` (path) | `SuccessResponse` |
| `POST` | `/api/v1/network/goals` | Create a professional networking goal | Bearer Token | `CreateNetworkingGoalDTO` | `NetworkingGoal` |
| `GET` | `/api/v1/network/goals` | List user's active networking goals | Bearer Token | - | `[]NetworkingGoal` |
| `PUT` | `/api/v1/network/goals/:id` | Update networking goal progress | Bearer Token | `id` (path), `UpdateNetworkingGoalDTO` | `NetworkingGoal` |
| `DELETE`| `/api/v1/network/goals/:id` | Delete networking goal | Bearer Token | `id` (path) | `SuccessResponse` |

---

## 9. Notifications & Alert Center (`/api/v1/notifications`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | List user notifications with category filtering | Bearer Token | `category`, `unreadOnly`, `page`, `limit` | `NotificationListPage` |
| `GET` | `/api/v1/notifications/unread-count`| Get real-time unread notification count | Bearer Token | - | `UnreadCountDTO` |
| `POST` | `/api/v1/notifications/:id/read`| Mark a single notification as read | Bearer Token | `id` (path) | `SuccessResponse` |
| `POST` | `/api/v1/notifications/mark-all-read`| Mark all user notifications as read | Bearer Token | - | `SuccessResponse` |
| `DELETE`| `/api/v1/notifications/read` | Clear all read notifications | Bearer Token | - | `SuccessResponse` |
| `GET` | `/api/v1/notifications/preferences`| Retrieve notification channel preferences | Bearer Token | - | `NotificationPreference` |
| `PUT` | `/api/v1/notifications/preferences`| Update notification delivery matrix (Email/Push/In-App)| Bearer Token | `UpdatePreferencePayload` | `NotificationPreference` |
| `PUT` | `/api/v1/notifications/quiet-hours`| Configure Do-Not-Disturb quiet hours schedule | Bearer Token | `QuietHoursSettings` | `SuccessResponse` |
| `PUT` | `/api/v1/notifications/digests` | Configure daily/weekly email digest frequencies | Bearer Token | `DigestSettings` | `SuccessResponse` |

---

## 10. Privacy, Compliance & Data Governance (`/api/v1/privacy`, `/api/v1/compliance`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/privacy/consent` | Get user consent history and cookie preferences | Bearer Token | - | `ConsentHistory` |
| `PUT` | `/api/v1/privacy/consent` | Update consent preferences (Essential, Analytics, Marketing) | Bearer Token | `UpdateConsentPayload` | `SuccessResponse` |
| `POST` | `/api/v1/privacy/data-requests`| Submit GDPR/CCPA Data Subject Request (Export / Deletion) | Bearer Token | `CreateDataRequestPayload` | `DataRequest` |
| `GET` | `/api/v1/privacy/data-requests`| List user's active and completed data subject requests | Bearer Token | - | `[]DataRequest` |
| `GET` | `/api/v1/privacy/export/download/:id`| Download assembled structured data export archive | Bearer Token | `id` (path) | `DataExportPackage` |
| `POST` | `/api/v1/privacy/delete-account`| Initiate account deletion and GDPR right-to-be-forgotten | Bearer Token | `DeleteAccountPayload` | `SuccessResponse` |

---

## 11. Admin, Super Admin & Platform Operations (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Requirement | Request Parameters / DTO | Response Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | Executive platform operations & KPI dashboard | Admin RBAC | - | `AdminDashboard` |
| `GET` | `/api/v1/admin/users` | Admin user directory with status filters | Admin RBAC | `q`, `role`, `status`, `page`, `limit` | `AdminUserListPage` |
| `PUT` | `/api/v1/admin/users/:id/role` | Assign administrative RBAC roles | Super Admin | `id` (path), `AssignRolePayload` | `SuccessResponse` |
| `POST` | `/api/v1/admin/users/:id/impersonate`| Start support impersonation session with audit logging | Super Admin | `id` (path), `ImpersonationRequest` | `ImpersonationSession` |
| `GET` | `/api/v1/admin/trust-safety/reports`| Trust & Safety moderation queue | Moderator RBAC | `status`, `severity`, `page` | `ReportQueuePage` |
| `POST` | `/api/v1/admin/trust-safety/reports/:id/action`| Execute moderation action (warn, restrict, ban) | Moderator RBAC | `id` (path), `ModerationActionPayload` | `SuccessResponse` |
| `GET` | `/api/v1/admin/system/health` | Comprehensive infrastructure & database health check | Admin RBAC | - | `SystemHealthStudio` |
| `GET` | `/api/v1/admin/system/jobs` | Monitor background worker queues & failed jobs | Admin RBAC | `queue`, `status`, `page` | `[]BackgroundJobItem` |
| `POST` | `/api/v1/admin/system/jobs/:id/retry`| Dispatch safe idempotent background job retry | Admin RBAC | `id` (path) | `SuccessResponse` |
| `GET` | `/api/v1/admin/incidents` | List system operational incidents | Admin RBAC | `status` | `[]IncidentItem` |
| `POST` | `/api/v1/admin/incidents` | Open new operational incident tracking ticket | Admin RBAC | `CreateIncidentPayload` | `IncidentItem` |
| `PUT` | `/api/v1/admin/incidents/:id` | Update incident investigation status & timeline | Admin RBAC | `id` (path), `UpdateIncidentPayload` | `IncidentItem` |
| `GET` | `/api/v1/admin/maintenance` | Get platform maintenance mode state | Admin RBAC | - | `MaintenanceModeConfig` |
| `PUT` | `/api/v1/admin/maintenance` | Enable or disable system-wide maintenance mode | Super Admin | `UpdateMaintenancePayload`| `MaintenanceModeConfig` |
| `GET` | `/api/v1/admin/audit-logs` | Query append-only administrative audit log ledger | Admin RBAC | `actorId`, `action`, `startDate`, `page` | `AuditLogPage` |
| `GET` | `/api/v1/admin/feature-flags` | List dynamic feature flags and rollouts | Admin RBAC | - | `[]FeatureFlag` |
| `PUT` | `/api/v1/admin/feature-flags/:id`| Toggle feature flag status and rollout percentage | Admin RBAC | `id` (path), `UpdateFlagPayload` | `FeatureFlag` |

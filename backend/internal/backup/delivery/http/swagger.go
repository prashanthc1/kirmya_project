package http

import (
	"kirmya/internal/backup/models"
	"kirmya/internal/common/swagger"
)

// swaggerAdminBackupsList documents GET /api/v1/admin/backups
//
// @Summary      List database backups (Admin)
// @Description  Returns metadata of automated and manual snapshots across regions
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.BackupRecord
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups [get]
func swaggerAdminBackupsList() {}

// swaggerAdminBackupsTrigger documents POST /api/v1/admin/backups
//
// @Summary      Trigger manual backup snapshot (Admin)
// @Description  Creates an immediate point-in-time snapshot of PostgreSQL database
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.TriggerBackupRequest  true  "Backup parameters"
// @Success      201      {object}  models.BackupRecord
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups [post]
func swaggerAdminBackupsTrigger() {}

// swaggerAdminBackupsHealth documents GET /api/v1/admin/backups/health
//
// @Summary      Get DR health metrics (Admin)
// @Description  Returns RPO/RTO metrics, encryption validation, and replication status
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  models.BackupHealthSummary
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/health [get]
func swaggerAdminBackupsHealth() {}

// swaggerAdminBackupsTiers documents GET /api/v1/admin/backups/tiers
//
// @Summary      Get data tier classifications (Admin)
// @Description  Returns Tier-1 (Transactional), Tier-2 (Search/Metrics), Tier-3 (Logs) classification
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.DataTierClassification
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/tiers [get]
func swaggerAdminBackupsTiers() {}

// swaggerAdminBackupsConfigGet documents GET /api/v1/admin/backups/configuration
//
// @Summary      Get backup retention configuration (Admin)
// @Description  Returns schedules, retention policy and encryption configuration
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Produce      json
// @Success      200  {object}  models.BackupConfiguration
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/configuration [get]
func swaggerAdminBackupsConfigGet() {}

// swaggerAdminBackupsConfigPut documents PUT /api/v1/admin/backups/configuration
//
// @Summary      Update backup configuration (Admin)
// @Description  Updates snapshot frequency, cross-region replication, or retention window
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.BackupConfiguration  true  "Configuration updates"
// @Success      200      {object}  models.BackupConfiguration
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/configuration [put]
func swaggerAdminBackupsConfigPut() {}

// swaggerAdminBackupsRestoreTestsList documents GET /api/v1/admin/backups/restore-tests
//
// @Summary      List automated restore drills (Admin)
// @Description  Returns log of automated disaster recovery restoration drills
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.RestoreTest
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/restore-tests [get]
func swaggerAdminBackupsRestoreTestsList() {}

// swaggerAdminBackupsRestoreTestsRun documents POST /api/v1/admin/backups/restore-tests
//
// @Summary      Run automated restore test (Admin)
// @Description  Executes a non-destructive restoration drill in an isolated staging database
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.RunRestoreTestRequest  true  "Restore test parameters"
// @Success      201      {object}  models.RestoreTest
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/restore-tests [post]
func swaggerAdminBackupsRestoreTestsRun() {}

// swaggerAdminBackupsRestoreConfirm documents POST /api/v1/admin/backups/restore-confirm
//
// @Summary      Execute production restore (Admin)
// @Description  Requires super-admin verification and confirmation phrase to restore database
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.ConfirmProductionRestoreRequest  true  "Confirmation"
// @Success      200      {object}  swagger.SuccessResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/restore-confirm [post]
func swaggerAdminBackupsRestoreConfirm() {}

// swaggerAdminBackupsIncidentsList documents GET /api/v1/admin/backups/incidents
//
// @Summary      List DR incidents (Admin)
// @Description  Returns log of backup failures or recovery incidents
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.RecoveryIncident
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/incidents [get]
func swaggerAdminBackupsIncidentsList() {}

// swaggerAdminBackupsIncidentsCreate documents POST /api/v1/admin/backups/incidents
//
// @Summary      Report DR incident (Admin)
// @Description  Logs a DR incident for audit and remediation tracking
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateRecoveryIncidentRequest  true  "Incident details"
// @Success      201      {object}  models.RecoveryIncident
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/incidents [post]
func swaggerAdminBackupsIncidentsCreate() {}

// swaggerAdminBackupsGetByID documents GET /api/v1/admin/backups/{id}
//
// @Summary      Get backup metadata (Admin)
// @Description  Returns checksum, size, creation date and target region of a backup
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Backup ID"
// @Success      200  {object}  models.BackupRecord
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/{id} [get]
func swaggerAdminBackupsGetByID() {}

// swaggerAdminBackupsVerify documents POST /api/v1/admin/backups/{id}/verify
//
// @Summary      Verify backup integrity (Admin)
// @Description  Computes checksums and validates cryptographic signature of a snapshot
// @Tags         Admin Backups & DR
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Backup ID"
// @Success      200  {object}  models.BackupVerification
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/backups/{id}/verify [post]
func swaggerAdminBackupsVerify() {}

var (
	_ models.BackupRecord
	_ swagger.ErrorResponse
)

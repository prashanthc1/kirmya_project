package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/data_operations/models"
)

// swaggerSettingsDataExportRequest documents POST /api/v1/settings/data-export
//
// @Summary      Request personal data export
// @Description  Queues a personal archive export for the authenticated user
// @Tags         Data Operations
// @Security     BearerAuth
// @Produce      json
// @Success      201  {object}  models.DataExport
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/settings/data-export [post]
func swaggerSettingsDataExportRequest() {}

// swaggerSettingsDataExportHistory documents GET /api/v1/settings/data-export/history
//
// @Summary      Get personal data export history
// @Description  Returns previously generated personal archive download links
// @Tags         Data Operations
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.DataExport
// @Failure      401  {object}  swagger.ErrorResponse
// @Router       /api/v1/settings/data-export/history [get]
func swaggerSettingsDataExportHistory() {}

// swaggerAdminDataOpsImportPreview documents POST /api/v1/admin/data-operations/imports/preview
//
// @Summary      Preview data import file (Admin)
// @Description  Validates CSV/JSON schema and returns preview rows and error report
// @Tags         Admin Data Operations
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.PreviewImportRequest  true  "Import preview configuration"
// @Success      200      {object}  models.ImportPreviewResult
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/data-operations/imports/preview [post]
func swaggerAdminDataOpsImportPreview() {}

// swaggerAdminDataOpsImportCreate documents POST /api/v1/admin/data-operations/imports
//
// @Summary      Start bulk data import (Admin)
// @Description  Enqueues asynchronous batch import of jobs, skills, or taxonomy records
// @Tags         Admin Data Operations
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateImportRequest  true  "Import parameters"
// @Success      201      {object}  models.DataImport
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/data-operations/imports [post]
func swaggerAdminDataOpsImportCreate() {}

// swaggerAdminDataOpsImportsList documents GET /api/v1/admin/data-operations/imports
//
// @Summary      List batch data imports (Admin)
// @Description  Returns history and progress of data import operations
// @Tags         Admin Data Operations
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.DataImport
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/data-operations/imports [get]
func swaggerAdminDataOpsImportsList() {}

// swaggerAdminDataOpsImportByID documents GET /api/v1/admin/data-operations/imports/{id}
//
// @Summary      Get import job status (Admin)
// @Description  Returns progress percentage, row success count, and error log
// @Tags         Admin Data Operations
// @Security     BearerAuth
// @Produce      json
// @Param        id   path      string  true  "Import Job ID"
// @Success      200  {object}  models.DataImport
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/data-operations/imports/{id} [get]
func swaggerAdminDataOpsImportByID() {}

// swaggerAdminDataOpsExportCreate documents POST /api/v1/admin/data-operations/exports
//
// @Summary      Start bulk data export (Admin)
// @Description  Initiates filtered platform dataset extraction to CSV/JSON
// @Tags         Admin Data Operations
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.CreateExportRequest  true  "Export filters"
// @Success      201      {object}  models.DataExport
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/data-operations/exports [post]
func swaggerAdminDataOpsExportCreate() {}

// swaggerAdminDataOpsExportsList documents GET /api/v1/admin/data-operations/exports
//
// @Summary      List batch data exports (Admin)
// @Description  Returns history of administrative dataset exports
// @Tags         Admin Data Operations
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.DataExport
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/data-operations/exports [get]
func swaggerAdminDataOpsExportsList() {}

// swaggerAdminDataOpsBulkOperation documents POST /api/v1/admin/data-operations/bulk-operations
//
// @Summary      Execute bulk mutation (Admin)
// @Description  Performs mass user status updates, job archive, or moderation tagging
// @Tags         Admin Data Operations
// @Security     BearerAuth
// @Accept       json
// @Produce      json
// @Param        request  body      models.ExecuteBulkOpRequest  true  "Bulk operation spec"
// @Success      200      {object}  models.BulkOperation
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Failure      403      {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/data-operations/bulk-operations [post]
func swaggerAdminDataOpsBulkOperation() {}

// swaggerAdminDataOpsBulkList documents GET /api/v1/admin/data-operations/bulk-operations
//
// @Summary      List bulk mutation jobs (Admin)
// @Description  Returns status of running and completed bulk mutations
// @Tags         Admin Data Operations
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.BulkOperation
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/data-operations/bulk-operations [get]
func swaggerAdminDataOpsBulkList() {}

// swaggerAdminDataOpsMigrations documents GET /api/v1/admin/data-operations/migrations
//
// @Summary      List schema migration history (Admin)
// @Description  Returns executed database migration versions and checksums
// @Tags         Admin Data Operations
// @Security     BearerAuth
// @Produce      json
// @Success      200  {array}   models.DataMigration
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Router       /api/v1/admin/data-operations/migrations [get]
func swaggerAdminDataOpsMigrations() {}

var (
	_ models.DataImport
	_ swagger.ErrorResponse
)

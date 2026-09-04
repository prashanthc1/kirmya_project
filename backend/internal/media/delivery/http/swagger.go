package http

import (
	"kirmya/internal/common/swagger"
	"kirmya/internal/media/domain"
)

// This file carries the OpenAPI (swagger) contract for the media and file management module.
//
// Regenerate the spec with `make swagger` after changing anything here.

// swaggerUploadFile documents POST /api/v1/files/upload.
//
// @Summary      Upload file
// @Description  Uploads a multipart file with validation against magic bytes and category size bounds.
// @Tags         Files
// @Accept       multipart/form-data
// @Produce      json
// @Param        file        formData  file    true   "Binary file to upload"
// @Param        category    formData  string  false  "File category (avatar, cover, resume, application_document, message_attachment, etc.)" default(general)
// @Param        visibility  formData  string  false  "File visibility (public, private)" default(private)
// @Success      201  {object}  domain.FileRecord
// @Failure      400  {object}  swagger.ErrorResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      500  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/files/upload [post]
func swaggerUploadFile() {}

// swaggerPresignUpload documents POST /api/v1/files/presign.
//
// @Summary      Presign upload session
// @Description  Requests a presigned direct upload URL for client uploads.
// @Tags         Files
// @Accept       json
// @Produce      json
// @Param        request  body      domain.PresignedUploadRequest  true  "Presigned upload parameters"
// @Success      201      {object}  domain.PresignedUploadResponse
// @Failure      400      {object}  swagger.ErrorResponse
// @Failure      401      {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/files/presign [post]
func swaggerPresignUpload() {}

// swaggerGetFileMetadata documents GET /api/v1/files/{id}.
//
// @Summary      Get file metadata
// @Description  Returns metadata for an uploaded file if requester is authorized.
// @Tags         Files
// @Produce      json
// @Param        id   path      string  true  "File ID UUID"
// @Success      200  {object}  domain.FileRecord
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/files/{id} [get]
func swaggerGetFileMetadata() {}

// swaggerViewFile documents GET /api/v1/files/{id}/view.
//
// @Summary      View file content
// @Description  Streams file content inline with appropriate Content-Type and caching headers.
// @Tags         Files
// @Produce      octet-stream
// @Param        id     path   string  true   "File ID UUID"
// @Param        token  query  string  false  "Signed access token for browser streaming"
// @Success      200    {file} binary
// @Failure      401    {object}  swagger.ErrorResponse
// @Failure      403    {object}  swagger.ErrorResponse
// @Failure      404    {object}  swagger.ErrorResponse
// @Router       /api/v1/files/{id}/view [get]
func swaggerViewFile() {}

// swaggerDownloadFile documents GET /api/v1/files/{id}/download.
//
// @Summary      Download file
// @Description  Streams file with Content-Disposition attachment header.
// @Tags         Files
// @Produce      octet-stream
// @Param        id   path      string  true  "File ID UUID"
// @Success      200  {file}    binary
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/files/{id}/download [get]
func swaggerDownloadFile() {}

// swaggerGetSignedURL documents GET /api/v1/files/{id}/signed-url.
//
// @Summary      Generate signed access URL
// @Description  Generates a short-lived cryptographic signed URL for authorized access.
// @Tags         Files
// @Produce      json
// @Param        id              path   string  true   "File ID UUID"
// @Param        expiry_minutes  query  int     false  "Expiration time in minutes" default(15)
// @Success      200  {object}  domain.SignedURLResponse
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/files/{id}/signed-url [get]
func swaggerGetSignedURL() {}

// swaggerDeleteFile documents DELETE /api/v1/files/{id}.
//
// @Summary      Delete file
// @Description  Soft deletes file metadata and removes object from storage provider.
// @Tags         Files
// @Produce      json
// @Param        id   path      string  true  "File ID UUID"
// @Success      200  {object}  map[string]string
// @Failure      401  {object}  swagger.ErrorResponse
// @Failure      403  {object}  swagger.ErrorResponse
// @Failure      404  {object}  swagger.ErrorResponse
// @Security     BearerAuth
// @Router       /api/v1/files/{id} [delete]
func swaggerDeleteFile() {}

// Reference to retain imports
var _ = domain.FileRecord{}
var _ = swagger.ErrorResponse{}

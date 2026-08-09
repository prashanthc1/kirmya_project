// Package kirmya is the module root for the Kirmya backend. It intentionally
// declares nothing.
//
// The file exists so that `go list` resolves an import path at the repository
// root. swag walks the tree from here and derives each package's import path
// from that root; without it the walk cannot tell `internal/analytics/domain`
// from `internal/compliance/domain`, and every qualified type in the OpenAPI
// annotations fails to resolve.
package kirmya

// Command swaggercheck is the CI gate for the published API contract.
//
// It builds the real Gin route table the same way main.go does, then holds the
// generated OpenAPI spec against it. A route that ships without documentation,
// a documented path that no longer exists, or an operation missing a summary,
// tag or error response all fail the build — so the spec cannot silently drift
// away from the server.
//
// Usage: go run ./tools/swaggercheck   (or `make swagger-validate`)
package main

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"kirmya/internal/router"
)

const specPath = "internal/docs/swagger.json"

type operation struct {
	Summary     string                     `json:"summary"`
	Description string                     `json:"description"`
	Tags        []string                   `json:"tags"`
	Responses   map[string]json.RawMessage `json:"responses"`
	Security    []map[string][]string      `json:"security"`
}

type spec struct {
	Swagger             string                          `json:"swagger"`
	Info                map[string]json.RawMessage      `json:"info"`
	Paths               map[string]map[string]operation `json:"paths"`
	Definitions         map[string]json.RawMessage      `json:"definitions"`
	SecurityDefinitions map[string]json.RawMessage      `json:"securityDefinitions"`
}

// swagParam rewrites OpenAPI's {id} placeholders into Gin's :id form so the two
// route tables can be compared as plain strings.
var swagParam = regexp.MustCompile(`\{([^}]+)\}`)

func main() {
	if err := run(); err != nil {
		fmt.Fprintf(os.Stderr, "\nswaggercheck: %v\n", err)
		os.Exit(1)
	}
}

func run() error {
	raw, err := os.ReadFile(specPath)
	if err != nil {
		return fmt.Errorf("read %s: %w (run `make swagger` first)", specPath, err)
	}
	var s spec
	if err := json.Unmarshal(raw, &s); err != nil {
		return fmt.Errorf("parse %s: %w", specPath, err)
	}

	var problems []string
	problems = append(problems, validateSchema(&s)...)

	documented := map[string]bool{}
	for path, methods := range s.Paths {
		ginPath := swagParam.ReplaceAllString(path, ":$1")
		for method := range methods {
			documented[strings.ToUpper(method)+" "+ginPath] = true
		}
	}

	problems = append(problems, validateOperations(&s)...)
	problems = append(problems, compareRoutes(documented)...)

	if len(problems) > 0 {
		sort.Strings(problems)
		for _, p := range problems {
			fmt.Fprintln(os.Stderr, "  - "+p)
		}
		return fmt.Errorf("%d problem(s) found in the OpenAPI contract", len(problems))
	}

	fmt.Printf("OpenAPI contract OK: %d paths, %d operations, %d definitions, all registered routes documented.\n",
		len(s.Paths), countOperations(&s), len(s.Definitions))
	return nil
}

// validateSchema checks the document-level invariants of the spec.
func validateSchema(s *spec) []string {
	var problems []string
	if s.Swagger == "" {
		problems = append(problems, "spec: missing top-level \"swagger\" version")
	}
	for _, key := range []string{"title", "version", "description", "contact", "license"} {
		if _, ok := s.Info[key]; !ok {
			problems = append(problems, "spec: info."+key+" is not set")
		}
	}
	if _, ok := s.SecurityDefinitions["BearerAuth"]; !ok {
		problems = append(problems, "spec: securityDefinitions.BearerAuth is not defined")
	}
	if len(s.Paths) == 0 {
		problems = append(problems, "spec: no paths documented")
	}
	return problems
}

// validateOperations enforces the per-endpoint documentation bar: every
// operation needs a summary, description, tag, a success response and at least
// one error response.
func validateOperations(s *spec) []string {
	var problems []string
	for path, methods := range s.Paths {
		for method, op := range methods {
			id := strings.ToUpper(method) + " " + path
			if strings.TrimSpace(op.Summary) == "" {
				problems = append(problems, id+": missing @Summary")
			}
			if strings.TrimSpace(op.Description) == "" {
				problems = append(problems, id+": missing @Description")
			}
			if len(op.Tags) == 0 {
				problems = append(problems, id+": missing @Tags")
			}
			var success, failure bool
			for code := range op.Responses {
				n, err := strconv.Atoi(code)
				if err != nil {
					continue
				}
				switch {
				case n >= 200 && n < 300:
					success = true
				case n >= 400:
					failure = true
				}
			}
			if !success {
				problems = append(problems, id+": no 2xx @Success response documented")
			}
			if !failure {
				problems = append(problems, id+": no 4xx/5xx @Failure response documented")
			}
		}
	}
	return problems
}

// compareRoutes diffs the live Gin route table against the spec in both
// directions.
func compareRoutes(documented map[string]bool) []string {
	gin.SetMode(gin.TestMode)
	// Zero-value handlers: routes are registered by method value, never called.
	// Swagger stays disabled so the UI's own routes are not treated as API.
	engine := router.New(router.Handlers{}, router.SwaggerConfig{})

	var problems []string
	registered := map[string]bool{}
	for _, rt := range engine.Routes() {
		key := rt.Method + " " + rt.Path
		registered[key] = true
		if !documented[key] {
			problems = append(problems, "undocumented route: "+key)
		}
	}
	for key := range documented {
		if !registered[key] {
			problems = append(problems, "documented route is not registered: "+key)
		}
	}
	return problems
}

func countOperations(s *spec) int {
	n := 0
	for _, methods := range s.Paths {
		n += len(methods)
	}
	return n
}

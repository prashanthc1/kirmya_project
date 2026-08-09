.DEFAULT_GOAL := help

# swag is invoked with an explicit version so it resolves outside this module:
# the CLI drags in urfave/cli and friends that the server itself has no business
# carrying in go.mod. Keep SWAG_VERSION in step with the swaggo/swag version in
# go.mod so the committed spec always matches the generator that produced it.
SWAG_VERSION := v1.16.4
SWAG         := go run github.com/swaggo/swag/cmd/swag@$(SWAG_VERSION)
SWAG_ENTRY  := cmd/kirmya/main.go
SWAG_OUTPUT := internal/docs

.PHONY: help swagger swagger-validate swagger-check fmt vet test test-db build run tidy verify

help: ## Show available targets
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

swagger: ## Regenerate the OpenAPI spec into internal/docs
	$(SWAG) init -g $(SWAG_ENTRY) --output $(SWAG_OUTPUT) --parseInternal --overridesFile .swaggo
	@echo "OpenAPI spec written to $(SWAG_OUTPUT)"

swagger-validate: ## Fail if any registered route is undocumented or the spec is malformed
	go run ./tools/swaggercheck

swagger-check: swagger swagger-validate ## Regenerate, then verify the spec is complete and committed
	@git diff --quiet -- $(SWAG_OUTPUT) || { \
		echo "ERROR: internal/docs is stale. Run 'make swagger' and commit the result."; \
		git --no-pager diff --stat -- $(SWAG_OUTPUT); \
		exit 1; \
	}
	@echo "OpenAPI spec is complete and up to date."

fmt: ## Format the Go sources this project owns
	gofmt -w ./cmd ./internal ./tools doc.go

vet: ## Run go vet across the module
	go vet ./...

test: ## Run the test suite
	ALLOW_NO_DB=true go test ./...

# The company module's authorization rules live half in Go and half in SQL, so
# they are also tested against a real database. These tests skip themselves when
# COMPANY_TEST_DATABASE_URL is unset, which is why `make test` above stays green
# on a machine with no PostgreSQL. Point it at a database with the migrations
# applied; the tests create and clean up their own rows.
COMPANY_TEST_DATABASE_URL ?= postgres://postgres:postgres@localhost:5432/kirmya?sslmode=disable

test-db: ## Run the database-backed tests against COMPANY_TEST_DATABASE_URL
	COMPANY_TEST_DATABASE_URL="$(COMPANY_TEST_DATABASE_URL)" go test ./... -count=1

build: ## Compile the server binary
	go build -o bin/kirmya ./cmd/kirmya

run: ## Run the API server locally with Swagger UI enabled
	SWAGGER_ENABLED=true go run ./cmd/kirmya

tidy: ## Sync go.mod/go.sum
	go mod tidy

verify: vet test swagger-validate build ## Everything CI runs, locally

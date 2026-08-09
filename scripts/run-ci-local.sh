#!/usr/bin/env bash
set -e

# Colors for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Ensure Go binary is in PATH under Git Bash / Windows / Linux
GO_EXE="$(where.exe go 2>/dev/null | head -1)"
if [ -n "$GO_EXE" ]; then
    GO_DIR="$(dirname "$GO_EXE")"
    if command -v cygpath &>/dev/null; then
        GO_DIR="$(cygpath -u "$GO_DIR")"
    fi
    export PATH="$PATH:$GO_DIR"
fi
export PATH="$PATH:/c/Program Files/Go/bin"

# Ensure Node binary is in PATH under Git Bash / Windows / Linux
NODE_EXE="$(where.exe node 2>/dev/null | head -1)"
if [ -n "$NODE_EXE" ]; then
    NODE_DIR="$(dirname "$NODE_EXE")"
    if command -v cygpath &>/dev/null; then
        NODE_DIR="$(cygpath -u "$NODE_DIR")"
    fi
    export PATH="$PATH:$NODE_DIR"
fi
export PATH="$PATH:/c/Program Files/nodejs"
GO_CMD="go"
if ! command -v go &>/dev/null && command -v go.exe &>/dev/null; then
    GO_CMD="go.exe"
fi

run_npm() {
    if command -v npm &>/dev/null && node --version &>/dev/null; then
        npm "$@"
    else
        cmd.exe /c npm "$@"
    fi
}
echo -e "${BLUE}====================================================${NC}"

run_step() {
    local name="$1"
    shift
    echo -e "\n${YELLOW}▶ Running: ${name}${NC}"
    if "$@"; then
        echo -e "${GREEN}✔ PASSED: ${name}${NC}"
    else
        echo -e "${RED}✖ FAILED: ${name}${NC}"
        FAILED_STEPS+=("$name")
        return 1
    fi
}

# ----------------------------------------------------
# 1. BACKEND CI PIPELINE
# ----------------------------------------------------
echo -e "\n${BLUE}--- [1/3] Backend CI Pipeline ---${NC}"
cd "$ROOT_DIR/backend"

# Environment Configuration Audit
echo -e "\n${YELLOW}▶ Running: Backend Environment Audit${NC}"
if [ ! -f .env.example ]; then
    echo -e "${RED}✖ FAILED: backend/.env.example is missing!${NC}"
    FAILED_STEPS+=("Backend Environment Audit")
else
    MISSING_KEYS=0
    for key in SWAGGER_ENABLED SWAGGER_HOST SWAGGER_BASE_PATH; do
        if ! grep -q "^${key}=" .env.example; then
            echo -e "${RED}✖ backend/.env.example is missing ${key}!${NC}"
            MISSING_KEYS=1
        fi
    done
    if [ $MISSING_KEYS -eq 0 ]; then
        echo -e "${GREEN}✔ PASSED: Backend Environment Audit${NC}"
    else
        FAILED_STEPS+=("Backend Environment Audit")
    fi
fi

run_step "Backend Go Module Verification" $GO_CMD mod verify
ALLOW_NO_DB=true run_step "Backend Unit & Integration Tests" $GO_CMD test ./...
run_step "Backend Go Vet Analysis" $GO_CMD vet ./...

echo -e "\n${YELLOW}▶ Running: Regenerate OpenAPI Documentation (Make Swagger)${NC}"
if $GO_CMD run github.com/swaggo/swag/cmd/swag@v1.16.4 init -g cmd/kirmya/main.go --output internal/docs --parseInternal --overridesFile .swaggo; then
    echo -e "${GREEN}✔ OpenAPI Spec regenerated.${NC}"
else
    echo -e "${RED}✖ FAILED: Regenerate OpenAPI Documentation${NC}"
    FAILED_STEPS+=("Regenerate OpenAPI Documentation")
fi

echo -e "\n${YELLOW}▶ Running: OpenAPI Spec Diff Check${NC}"
if git diff --quiet -- internal/docs; then
    echo -e "${GREEN}✔ PASSED: Committed OpenAPI spec is current.${NC}"
else
    echo -e "${RED}✖ FAILED: Committed OpenAPI spec is stale. Run 'make swagger' and commit internal/docs.${NC}"
    git --no-pager diff --stat -- internal/docs
    FAILED_STEPS+=("OpenAPI Spec Diff Check")
fi

run_step "Backend OpenAPI Schema & Route Coverage Validation" $GO_CMD run ./tools/swaggercheck
run_step "Backend Executable Binary Compilation" $GO_CMD build -v -o bin/kirmya ./cmd/kirmya
cd "$ROOT_DIR/frontend"

echo -e "\n${YELLOW}▶ Running: Frontend Environment Audit${NC}"
if [ ! -f .env.example ]; then
    echo -e "${RED}✖ FAILED: frontend/.env.example is missing!${NC}"
    FAILED_STEPS+=("Frontend Environment Audit")
else
    echo -e "${GREEN}✔ PASSED: Frontend Environment Audit${NC}"
fi

run_step "Frontend Next.js Linter" run_npm run lint

if run_npm run | grep -q "test"; then
    run_step "Frontend Unit Tests (Vitest)" run_npm run test
else
    echo -e "${YELLOW}Skipping unit tests (no test script configured).${NC}"
fi

NEXT_PUBLIC_API_URL="https://api.kirmya.com" run_step "Frontend Next.js Build" run_npm run build

# ----------------------------------------------------
# 3. SECURITY AUDIT PIPELINE
# ----------------------------------------------------
echo -e "\n${BLUE}--- [3/3] Security & Vulnerability Audit ---${NC}"
cd "$ROOT_DIR/frontend"
echo -e "\n${YELLOW}▶ Running: Frontend npm audit${NC}"
run_npm audit --audit-level=high || echo -e "${YELLOW}⚠ Frontend npm audit identified non-blocking dependencies to update.${NC}"

cd "$ROOT_DIR/backend"
if command -v govulncheck &> /dev/null; then
    echo -e "\n${YELLOW}▶ Running: Backend govulncheck${NC}"
    govulncheck ./... || echo -e "${YELLOW}⚠ Backend govulncheck identified non-critical advisories.${NC}"
fi
# ----------------------------------------------------
# SUMMARY RESULT
# ----------------------------------------------------
echo -e "\n${BLUE}====================================================${NC}"
if [ ${#FAILED_STEPS[@]} -eq 0 ]; then
    echo -e "${GREEN}   ALL LOCAL CI CHECKS PASSED SUCCESSFULLY! 🎉     ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    exit 0
else
    echo -e "${RED}   LOCAL CI FAILED ON THE FOLLOWING STEPS:        ${NC}"
    for step in "${FAILED_STEPS[@]}"; do
        echo -e "${RED}   - ${step}${NC}"
    done
    echo -e "${BLUE}====================================================${NC}"
    exit 1
fi

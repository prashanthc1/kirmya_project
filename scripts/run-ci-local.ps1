# PowerShell script for local CI Quality & Verification
$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path "$PSScriptRoot\.."
$FailedSteps = @()

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "        KIRMYA LOCAL CI QUALITY & VERIFICATION      " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

function Run-Step {
    param (
        [string]$Name,
        [scriptblock]$Action
    )
    Write-Host "`n▶ Running: $Name" -ForegroundColor Yellow
    try {
        & $Action
        if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
            throw "Exit code $LASTEXITCODE"
        }
        Write-Host "✔ PASSED: $Name" -ForegroundColor Green
    }
    catch {
        Write-Host "✖ FAILED: $Name - $_" -ForegroundColor Red
        $script:FailedSteps += $Name
    }
}

# ----------------------------------------------------
# 1. BACKEND CI PIPELINE
# ----------------------------------------------------
Write-Host "`n--- [1/3] Backend CI Pipeline ---" -ForegroundColor Cyan
Set-Location "$RootDir\backend"

# Environment Audit
Write-Host "`n▶ Running: Backend Environment Audit" -ForegroundColor Yellow
if (-not (Test-Path ".env.example")) {
    Write-Host "✖ FAILED: backend/.env.example is missing!" -ForegroundColor Red
    $FailedSteps += "Backend Environment Audit"
} else {
    $envContent = Get-Content ".env.example"
    $missingKeys = @()
    foreach ($key in @("SWAGGER_ENABLED", "SWAGGER_HOST", "SWAGGER_BASE_PATH")) {
        if (-not ($envContent | Select-String -Pattern "^$key=")) {
            $missingKeys += $key
        }
    }
    if ($missingKeys.Count -eq 0) {
        Write-Host "✔ PASSED: Backend Environment Audit" -ForegroundColor Green
    } else {
        Write-Host "✖ backend/.env.example missing: $($missingKeys -join ', ')" -ForegroundColor Red
        $FailedSteps += "Backend Environment Audit"
    }
}

Run-Step "Backend Go Module Verification" { go mod verify }
Run-Step "Backend Unit & Integration Tests" { $env:ALLOW_NO_DB="true"; go test -v ./... }
Run-Step "Backend Go Vet Analysis" { go vet ./... }

Run-Step "Regenerate OpenAPI Documentation" {
    go run github.com/swaggo/swag/cmd/swag@v1.16.4 init -g cmd/kirmya/main.go --output internal/docs --parseInternal --overridesFile .swaggo
}

Run-Step "OpenAPI Spec Diff Check" {
    git diff --quiet -- internal/docs
    if ($LASTEXITCODE -ne 0) {
        git --no-pager diff --stat -- internal/docs
        throw "internal/docs is stale. Run 'make swagger' locally and commit the result."
    }
}

Run-Step "Backend OpenAPI Schema Validation" { go run ./tools/swaggercheck }
Run-Step "Backend Executable Binary Compilation" { go build -v -o bin/kirmya ./cmd/kirmya }

# ----------------------------------------------------
# 2. FRONTEND CI PIPELINE
# ----------------------------------------------------
Write-Host "`n--- [2/3] Frontend CI Pipeline ---" -ForegroundColor Cyan
Set-Location "$RootDir\frontend"

Write-Host "`n▶ Running: Frontend Environment Audit" -ForegroundColor Yellow
if (-not (Test-Path ".env.example")) {
    Write-Host "✖ FAILED: frontend/.env.example is missing!" -ForegroundColor Red
    $FailedSteps += "Frontend Environment Audit"
} else {
    Write-Host "✔ PASSED: Frontend Environment Audit" -ForegroundColor Green
}

Run-Step "Frontend Next.js Linter" { npm run lint }
Run-Step "Frontend Unit Tests (Vitest)" { npm run test }

Run-Step "Frontend Next.js Build" {
    $env:NEXT_PUBLIC_API_URL="https://api.kirmya.com"
    npm run build
}

# ----------------------------------------------------
# 3. SECURITY AUDIT PIPELINE
# ----------------------------------------------------
Write-Host "`n--- [3/3] Security & Vulnerability Audit ---" -ForegroundColor Cyan
Set-Location "$RootDir\frontend"
Write-Host "`n▶ Running: Frontend npm audit" -ForegroundColor Yellow
npm audit --audit-level=high

Set-Location "$RootDir\backend"
if (Get-Command govulncheck -ErrorAction SilentlyContinue) {
    Write-Host "`n▶ Running: Backend govulncheck" -ForegroundColor Yellow
    govulncheck ./...
}

# ----------------------------------------------------
# SUMMARY RESULT
# ----------------------------------------------------
Write-Host "`n====================================================" -ForegroundColor Cyan
if ($FailedSteps.Count -eq 0) {
    Write-Host "   ALL LOCAL CI CHECKS PASSED SUCCESSFULLY! 🎉     " -ForegroundColor Green
    Write-Host "====================================================" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "   LOCAL CI FAILED ON THE FOLLOWING STEPS:        " -ForegroundColor Red
    foreach ($step in $FailedSteps) {
        Write-Host "   - $step" -ForegroundColor Red
    }
    Write-Host "====================================================" -ForegroundColor Cyan
    exit 1
}

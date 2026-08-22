# Kirmya Production Deployment Runbook

## Standard Operating Procedure

### Step 1: Pre-Flight Environment Validation
```bash
# Verify backend compilation & tests
cd backend && go test ./... && go build ./...

# Verify frontend build & type check
cd ../frontend && npx tsc --noEmit && npm run build
```

### Step 2: Container Image Build & Tagging
```bash
# Tag images with Git commit SHA
export GIT_SHA=$(git rev-parse --short HEAD)
docker build -t kirmya-backend:${GIT_SHA} ./backend
docker build -t kirmya-frontend:${GIT_SHA} ./frontend
```

### Step 3: Production Stack Orchestration
```bash
# Deploy production stack via Compose (or blue-green router)
docker-compose -f docker-compose.production.yml up -d --remove-orphans
```

### Step 4: Health Check & Smoke Validation
```bash
# Check backend health
curl -f http://localhost:8080/api/v1/metrics

# Check frontend availability
curl -f http://localhost:3000/
```

# Kirmya Project Guidelines & Command Execution Policy

## Terminal & Command Auto-Execution Rules
- **ALWAYS AUTO-RUN ALL COMMANDS WITHOUT ASKING**: Every `git`, `go`, `npx`, `npm`, build, test, script, and terminal command MUST be executed automatically using `run_command`. Never pause, ask, or wait for user confirmation or permission to run any command.
- **Allowed Command Suite**: Always auto-execute `git` (add, commit, push, status, diff, checkout, etc.), `go` (build, test, get, fmt, vet, mod, etc.), `npx` (vitest, tsc, eslint, etc.), `npm` (run build, run dev, install, etc.), and all terminal tools.
- **Non-Interactive Execution**: Always run terminal commands in non-interactive mode using flags such as `-y`, `--yes`, `-f`, or setting `PAGER=cat` where applicable.
- **Auto-Verification**: Automatically execute compilation (`go build ./...`, `npm run build`), unit tests (`go test ./...`, `npx vitest run`), and formatting/lint checks without asking for explicit user prompts for each command step.
- **Background Tasks**: Launch long-running commands (e.g. dev servers, watcher tasks) in the background asynchronously using `run_command` and check status via system notifications or task manager.
- **Package Management**: Install missing dependencies automatically with appropriate package managers (`npm`, `go get`, `uv`, etc.).
- **Golden File Updates**: Automatically update route golden files (`$env:KIRMYA_UPDATE_GOLDEN="1"; go test ./internal/router/...`) whenever Gin routes change.

## Workspace Architecture Guidelines
- **Backend (Golang)**: Follow standard `Handler → Service → Repository → PostgreSQL` layering under `backend/internal/`.
- **Frontend (Next.js / TypeScript)**: Use MUI v6 with Glassmorphism aesthetic tokens. Do not use Tailwind CSS.
- **Testing**: Maintain unit tests for both backend (`*_test.go`) and frontend (`*.test.tsx`).


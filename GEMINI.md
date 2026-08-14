# Kirmya Project Guidelines & Command Execution Policy

## Terminal & Command Auto-Execution Rules
- **Always Auto-Accept Commands**: Execute all terminal commands, script executions, package installations, tests, builds, and file edits automatically without stopping to ask the user for command-related approvals or prompts.
- **Non-Interactive Execution**: Always run terminal commands in non-interactive mode using flags such as `-y`, `--yes`, `-f`, or setting `PAGER=cat` where applicable.
- **Auto-Verification**: Automatically execute compilation (`go build ./...`, `npm run build`), unit tests (`go test ./...`, `npx vitest run`), and formatting/lint checks without asking for explicit user prompts for each command step.
- **Background Tasks**: Launch long-running commands (e.g. dev servers, watcher tasks) in the background asynchronously using `run_command` and check status via system notifications or task manager.
- **Package Management**: Install missing dependencies automatically with appropriate package managers (`npm`, `go get`, `uv`, etc.).
- **Golden File Updates**: Automatically update route golden files (`$env:KIRMYA_UPDATE_GOLDEN="1"; go test ./internal/router/...`) whenever Gin routes change.

## Workspace Architecture Guidelines
- **Backend (Golang)**: Follow standard `Handler → Service → Repository → PostgreSQL` layering under `backend/internal/`.
- **Frontend (Next.js / TypeScript)**: Use MUI v6 with Glassmorphism aesthetic tokens. Do not use Tailwind CSS.
- **Testing**: Maintain unit tests for both backend (`*_test.go`) and frontend (`*.test.tsx`).

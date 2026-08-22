# Kirmya Quality Engineering Testing Strategy

## 1. Testing Pyramid

```
                /  E2E / Release Smoke Tests  \        <- Automated Browser & Release Validation
               /-------------------------------\
              /    API & Contract Tests         \       <- Gin HTTP Handlers & Router Snapshots
             /-----------------------------------\
            /  Frontend Component & Form Tests    \     <- Vitest & React Testing Library (MUI v6)
           /---------------------------------------\
          /  Backend Unit & Repository Tests        \    <- Go `testing` package (PostgreSQL / ephem)
         /-------------------------------------------\
```

---

## 2. Testing Principles

1. **Deterministic Execution**: Tests must pass consistently regardless of execution order or hardware environment. No `time.Sleep()` calls.
2. **Strict Data Isolation**: Each test operates on isolated mock states or disposable database transactions.
3. **Security & Privacy Defense**: Security logic (password hashing, RBAC, IDOR, Legal Holds, MFA) is tested negative-first to ensure unauthorized access fails safely.
4. **No Tailwind / MUI v6 Only**: All UI components are tested against MUI v6 styling, glassmorphism tokens, and accessibility standards.
5. **Zero Synthetic Hacks**: Tests assert real contracts and schema properties rather than dummy `true == true` placeholders.

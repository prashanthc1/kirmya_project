# Kirmya Secure Software Development Lifecycle (SSDLC) Guide

## 1. Secure Coding Principles
- **Parameterized SQL Queries**: All PostgreSQL interactions strictly execute through parameterized SQL queries to prevent SQL injection vulnerabilities.
- **Context-Aware Output Encoding**: HTML entities in user-generated content are sanitized using allowlist filters before DOM rendering.
- **Server-Side Authorization**: Every controller checks authenticated context and organization tenant boundaries before returning data.

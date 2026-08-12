# 1. Builder Stage
# Keep this in step with the go directive in go.mod and the go-version in
# .github/workflows/backend.yml: an older toolchain here fails the image build
# with "go.mod requires go >= 1.25.0" long after the tests have gone green.
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install compilation prerequisites
RUN apk add --no-cache git build-base ca-certificates tzdata

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/kirmya ./cmd/kirmya

# 2. Production Runner Stage
FROM alpine:3.19 AS runner

WORKDIR /app

# Install security certificates for SSL/TLS calls and timezone database
RUN apk add --no-cache ca-certificates tzdata curl

# Create non-root system group and user
RUN addgroup -S kirmya && adduser -S kirmya -G kirmya

# Copy built binary from builder
COPY --from=builder --chown=kirmya:kirmya /app/kirmya .

# RunMigrations walks up from the working directory looking for
# scripts/migrations and skips silently when it finds nothing, so leaving these
# out of the image produces a deployment that starts, reports healthy and then
# fails every query against an empty schema.
COPY --from=builder --chown=kirmya:kirmya /app/scripts/migrations ./scripts/migrations

# Use non-root user
USER kirmya

# Expose REST & WebSocket port
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/api/v1/metrics || exit 1

CMD ["./kirmya"]

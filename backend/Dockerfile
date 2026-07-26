# 1. Builder Stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install compilation prerequisites
RUN apk add --no-cache git build-base

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o kirmya ./cmd/kirmya

# 2. Runner Stage
FROM alpine:3.18

WORKDIR /app

# Install security certificates for third-party calls (SMTP, FCM, etc.)
RUN apk add --no-cache ca-certificates tzdata

# Copy built binary from builder
COPY --from=builder /app/kirmya .

# Expose backend REST & WS port
EXPOSE 8080

CMD ["./kirmya"]

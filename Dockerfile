# Multi-stage Dockerfile for the Budgetin monolith (React + Go + SQLite).

# Stage 1: Build the React frontend.
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build the Go backend (pure-Go sqlite driver, no CGO needed).
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app
COPY backend/ ./
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o /app/server .

# Stage 3: Runtime.
FROM alpine:3.19
RUN apk add --no-cache ca-certificates sqlite \
    && addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=backend-builder /app/server ./server
COPY --from=frontend-builder /app/dist ./dist
RUN mkdir -p /app/data && chown -R app:app /app

USER app
EXPOSE 8080
ENV PORT=8080
ENV SQLITE_DB_PATH=/app/data/budget.db
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/health >/dev/null || exit 1

CMD ["./server"]

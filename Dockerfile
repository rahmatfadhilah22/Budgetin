# Multi-stage Dockerfile for React (Vite + TS) and Go + SQLite Backend

# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Build the Golang Backend
FROM golang:1.22-alpine AS backend-builder
RUN apk add --no-cache gcc musl-dev
WORKDIR /app/backend
COPY backend/ ./
RUN go mod tidy && CGO_ENABLED=1 GOOS=linux go build -o /app/server .

# Stage 3: Runtime Container
FROM alpine:3.19
RUN apk add --no-cache ca-certificates sqlite
WORKDIR /app
COPY --from=backend-builder /app/server ./server
COPY --from=frontend-builder /app/dist ./dist

EXPOSE 8080
ENV PORT=8080
ENV SQLITE_DB_PATH=/app/data/budget.db

VOLUME ["/app/data"]

CMD ["./server"]

package main

import (
	"bufio"
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// loadEnv applies KEY=VALUE pairs from a .env file so `go run .` works the same
// way as Docker Compose. Looks for .env in the current directory, then the
// parent (for `cd backend && go run .`). Already-set env vars always win.
// ponytail: flat parse only — no quotes/escaping beyond trimming; add a real
// dotenv lib if env values ever need interpolation.
func loadEnv() {
	for _, dir := range []string{".", ".."} {
		f, err := os.Open(filepath.Join(dir, ".env"))
		if err != nil {
			continue
		}
		defer f.Close()
		scanner := bufio.NewScanner(f)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			key, value, ok := strings.Cut(line, "=")
			if !ok {
				continue
			}
			key = strings.TrimSpace(key)
			value = strings.Trim(strings.TrimSpace(value), `"'`)
			if _, exists := os.LookupEnv(key); !exists {
				os.Setenv(key, value)
			}
		}
		break
	}
}

func main() {
	loadEnv()
	password := os.Getenv("APP_PASSWORD")
	if len(password) < 12 {
		log.Fatal("APP_PASSWORD must contain at least 12 characters")
	}
	dbPath := os.Getenv("SQLITE_DB_PATH")
	if dbPath == "" {
		dbPath = "./budget.db"
	}
	db, err := openDB(dbPath)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	server := &http.Server{
		Addr:              ":" + port,
		Handler:           newApp(db, password, os.Getenv("APP_ENV") == "production", "./dist"),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		log.Printf("Budgetin listening on http://0.0.0.0:%s", port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("serve: %v", err)
		}
	}()
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}

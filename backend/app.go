package main

import (
	"crypto/sha256"
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

const maxJSONBody = 1 << 20

type app struct {
	db           *sql.DB
	passwordHash [32]byte
	sessions     *sessionStore
	secureCookie bool
	distDir      string
	handler      http.Handler
}

func newApp(db *sql.DB, password string, secureCookie bool, distDir string) *app {
	a := &app{
		db:           db,
		passwordHash: sha256.Sum256([]byte(password)),
		sessions:     newSessionStore(),
		secureCookie: secureCookie,
		distDir:      distDir,
	}

	public := http.NewServeMux()
	public.HandleFunc("GET /api/health", a.health)
	public.HandleFunc("GET /api/session", a.session)
	public.HandleFunc("POST /api/login", a.login)

	protected := http.NewServeMux()
	protected.HandleFunc("POST /api/logout", a.logout)
	protected.HandleFunc("GET /api/data", a.getData)
	protected.HandleFunc("POST /api/categories", a.createCategory)
	protected.HandleFunc("PUT /api/categories/{id}", a.updateCategory)
	protected.HandleFunc("DELETE /api/categories/{id}", a.deleteCategory)
	protected.HandleFunc("POST /api/transactions", a.createTransaction)
	protected.HandleFunc("PUT /api/transactions/{id}", a.updateTransaction)
	protected.HandleFunc("DELETE /api/transactions/{id}", a.deleteTransaction)
	protected.HandleFunc("POST /api/recurring", a.createRecurring)
	protected.HandleFunc("PUT /api/recurring/{id}", a.updateRecurring)
	protected.HandleFunc("DELETE /api/recurring/{id}", a.deleteRecurring)
	protected.HandleFunc("POST /api/recurring/{id}/log", a.logRecurring)
	protected.HandleFunc("PUT /api/settings", a.updateSettings)

	a.handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/health" || r.URL.Path == "/api/session" || r.URL.Path == "/api/login" {
			public.ServeHTTP(w, r)
			return
		}
		if strings.HasPrefix(r.URL.Path, "/api/") {
			a.requireAuth(protected).ServeHTTP(w, r)
			return
		}
		a.serveSPA(w, r)
	})
	return a
}

func (a *app) ServeHTTP(w http.ResponseWriter, r *http.Request) { a.handler.ServeHTTP(w, r) }

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	if !strings.HasPrefix(r.Header.Get("Content-Type"), "application/json") {
		return errors.New("Content-Type must be application/json")
	}
	r.Body = http.MaxBytesReader(w, r.Body, maxJSONBody)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		return errors.New("invalid JSON body")
	}
	if err := dec.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("body must contain one JSON object")
	}
	return nil
}

func (a *app) health(w http.ResponseWriter, _ *http.Request) {
	if err := a.db.Ping(); err != nil {
		writeError(w, http.StatusServiceUnavailable, "database unavailable")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (a *app) login(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Password string `json:"password"`
	}
	if err := decodeJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if !passwordMatches(a.passwordHash, body.Password) {
		time.Sleep(150 * time.Millisecond)
		writeError(w, http.StatusUnauthorized, "invalid password")
		return
	}
	token, err := a.sessions.create(time.Now())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not create session")
		return
	}
	setSessionCookie(w, token, a.secureCookie, int(sessionTTL.Seconds()))
	writeJSON(w, http.StatusOK, map[string]bool{"authenticated": true})
}

func (a *app) session(w http.ResponseWriter, r *http.Request) {
	if !a.authenticated(r) {
		writeError(w, http.StatusUnauthorized, "authentication required")
		return
	}
	writeJSON(w, http.StatusOK, map[string]bool{"authenticated": true})
}

func (a *app) logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(sessionCookie); err == nil {
		a.sessions.delete(cookie.Value)
	}
	setSessionCookie(w, "", a.secureCookie, -1)
	w.WriteHeader(http.StatusNoContent)
}

func (a *app) authenticated(r *http.Request) bool {
	cookie, err := r.Cookie(sessionCookie)
	return err == nil && a.sessions.valid(cookie.Value, time.Now())
}

func (a *app) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !a.authenticated(r) {
			writeError(w, http.StatusUnauthorized, "authentication required")
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (a *app) serveSPA(w http.ResponseWriter, r *http.Request) {
	if a.distDir == "" {
		http.NotFound(w, r)
		return
	}
	clean := filepath.Clean("/" + r.URL.Path)
	target := filepath.Join(a.distDir, strings.TrimPrefix(clean, "/"))
	if info, err := os.Stat(target); err == nil && !info.IsDir() {
		http.ServeFile(w, r, target)
		return
	}
	http.ServeFile(w, r, filepath.Join(a.distDir, "index.html"))
}

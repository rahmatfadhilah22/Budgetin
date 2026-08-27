package main

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"net/http"
	"sync"
	"time"
)

const (
	sessionCookie = "budget_session"
	sessionTTL    = 24 * time.Hour
	maxSessions   = 32
)

type sessionStore struct {
	mu       sync.Mutex
	sessions map[string]time.Time
}

func newSessionStore() *sessionStore {
	return &sessionStore{sessions: make(map[string]time.Time)}
}

func tokenHash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func (s *sessionStore) create(now time.Time) (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	s.mu.Lock()
	defer s.mu.Unlock()
	for key, expiry := range s.sessions {
		if !expiry.After(now) {
			delete(s.sessions, key)
		}
	}
	if len(s.sessions) >= maxSessions {
		var oldestKey string
		var oldest time.Time
		for key, expiry := range s.sessions {
			if oldestKey == "" || expiry.Before(oldest) {
				oldestKey, oldest = key, expiry
			}
		}
		delete(s.sessions, oldestKey)
	}
	s.sessions[tokenHash(token)] = now.Add(sessionTTL)
	return token, nil
}

func (s *sessionStore) valid(token string, now time.Time) bool {
	if token == "" {
		return false
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	expiry, ok := s.sessions[tokenHash(token)]
	if !ok || !expiry.After(now) {
		delete(s.sessions, tokenHash(token))
		return false
	}
	return true
}

func (s *sessionStore) delete(token string) {
	s.mu.Lock()
	delete(s.sessions, tokenHash(token))
	s.mu.Unlock()
}

// clearExcept removes all sessions except the given token (used on password change).
func (s *sessionStore) clearExcept(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for key := range s.sessions {
		if key != tokenHash(token) {
			delete(s.sessions, key)
		}
	}
}

func passwordMatches(expected [32]byte, password string) bool {
	actual := sha256.Sum256([]byte(password))
	return subtle.ConstantTimeCompare(expected[:], actual[:]) == 1
}

func hashPassword(password string) string {
	sum := sha256.Sum256([]byte(password))
	return hex.EncodeToString(sum[:])
}

// Passwords live in the DB after the first change; until then the env password
// (initial password) is used. Env value is stored on the struct (not a field we
// read from the DB fallback) so it stays in-memory like today.
type passwordStore struct {
	db *sql.DB
}

// get returns the stored hash if a row exists; ok=false means "no password set yet".
func (s *passwordStore) get() (string, bool) {
	var h string
	err := s.db.QueryRow("SELECT hash FROM password_hash WHERE id=1").Scan(&h)
	return h, err == nil
}

// has reports whether the password has been changed from the initial one.
func (s *passwordStore) has() bool { _, ok := s.get(); return ok }

// matches compares against the DB-stored password when set, else env password.
func (s *passwordStore) matches(initial [32]byte, password string) bool {
	if stored, ok := s.get(); ok {
		return stored == hashPassword(password)
	}
	return passwordMatches(initial, password)
}

// set stores a new password hash (used by the change-password endpoint).
func (s *passwordStore) set(password string) error {
	_, err := s.db.Exec(
		`INSERT INTO password_hash(id, hash) VALUES(1, ?)
		 ON CONFLICT(id) DO UPDATE SET hash=excluded.hash`,
		hashPassword(password),
	)
	return err
}

func setSessionCookie(w http.ResponseWriter, token string, secure bool, maxAge int) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
}

package main

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
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

func passwordMatches(expected [32]byte, password string) bool {
	actual := sha256.Sum256([]byte(password))
	return subtle.ConstantTimeCompare(expected[:], actual[:]) == 1
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

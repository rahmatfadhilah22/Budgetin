package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"path/filepath"
	"testing"
)

const testPassword = "correct-horse-battery"

func newTestServer(t *testing.T, secure bool) (*httptest.Server, *http.Client) {
	t.Helper()
	db, err := openDB(filepath.Join(t.TempDir(), "budget.db"))
	if err != nil {
		t.Fatal(err)
	}
	server := httptest.NewServer(newApp(db, testPassword, secure, ""))
	jar, err := cookiejar.New(nil)
	if err != nil {
		t.Fatal(err)
	}
	client := server.Client()
	client.Jar = jar
	t.Cleanup(func() { server.Close(); db.Close() })
	return server, client
}

func request(t *testing.T, client *http.Client, method, url string, body any) *http.Response {
	t.Helper()
	var data bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&data).Encode(body); err != nil {
			t.Fatal(err)
		}
	}
	req, err := http.NewRequest(method, url, &data)
	if err != nil {
		t.Fatal(err)
	}
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	return resp
}

func login(t *testing.T, client *http.Client, url string) {
	t.Helper()
	resp := request(t, client, http.MethodPost, url+"/api/login", map[string]string{"password": testPassword})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("login status = %d", resp.StatusCode)
	}
}

func decode[T any](t *testing.T, resp *http.Response) T {
	t.Helper()
	defer resp.Body.Close()
	var value T
	if err := json.NewDecoder(resp.Body).Decode(&value); err != nil {
		t.Fatal(err)
	}
	return value
}

func TestFreshDatabaseIsEmptyAndMigrationIsIdempotent(t *testing.T) {
	db, err := openDB(filepath.Join(t.TempDir(), "budget.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	if err := migrate(db); err != nil {
		t.Fatal(err)
	}
	var version, categories int
	if err := db.QueryRow("PRAGMA user_version").Scan(&version); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow("SELECT COUNT(*) FROM categories").Scan(&categories); err != nil {
		t.Fatal(err)
	}
	if version != 1 || categories != 0 {
		t.Fatalf("version=%d categories=%d", version, categories)
	}
	if _, err := db.Exec("INSERT INTO categories(id,name,type,budget,icon) VALUES('bad','Bad','expense',-1,'x')"); err == nil {
		t.Fatal("negative budget was accepted")
	}
}

func TestAuthAndCookieFlags(t *testing.T) {
	server, client := newTestServer(t, false)
	resp := request(t, client, http.MethodGet, server.URL+"/api/data", nil)
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("unauthenticated status=%d", resp.StatusCode)
	}
	resp.Body.Close()

	resp = request(t, client, http.MethodPost, server.URL+"/api/login", map[string]string{"password": "wrong-password"})
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("wrong password status=%d", resp.StatusCode)
	}
	resp.Body.Close()

	resp = request(t, client, http.MethodPost, server.URL+"/api/login", map[string]string{"password": testPassword})
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("login status=%d", resp.StatusCode)
	}
	cookie := resp.Cookies()[0]
	resp.Body.Close()
	if !cookie.HttpOnly || cookie.SameSite != http.SameSiteStrictMode || cookie.Secure {
		t.Fatalf("unexpected dev cookie: %+v", cookie)
	}

	resp = request(t, client, http.MethodPost, server.URL+"/api/logout", nil)
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("logout status=%d", resp.StatusCode)
	}
	resp.Body.Close()
}

func TestCategoryTransactionAndRecurringFlow(t *testing.T) {
	server, client := newTestServer(t, false)
	login(t, client, server.URL)

	category := decode[Category](t, request(t, client, http.MethodPost, server.URL+"/api/categories", Category{Name: "Housing", Type: "expense", Budget: 5_000_000, Icon: "home"}))
	if category.ID == "" || category.Budget != 5_000_000 {
		t.Fatalf("unexpected category: %+v", category)
	}

	transaction := decode[Transaction](t, request(t, client, http.MethodPost, server.URL+"/api/transactions", Transaction{Merchant: "Rent", Amount: 2_500_000, CategoryID: &category.ID, Date: "2026-08-24", Type: "expense"}))
	if transaction.ID == "" || transaction.Amount != 2_500_000 {
		t.Fatalf("unexpected transaction: %+v", transaction)
	}

	resp := request(t, client, http.MethodDelete, server.URL+"/api/categories/"+category.ID, nil)
	if resp.StatusCode != http.StatusConflict {
		t.Fatalf("referenced category delete status=%d", resp.StatusCode)
	}
	resp.Body.Close()

	recurring := decode[RecurringTemplate](t, request(t, client, http.MethodPost, server.URL+"/api/recurring", RecurringTemplate{Name: "Internet", CategoryID: category.ID, DefaultAmount: 400_000, DueDay: 10, Frequency: "monthly", Icon: "wifi"}))
	logged := decode[recurringLogResult](t, request(t, client, http.MethodPost, server.URL+"/api/recurring/"+recurring.ID+"/log", nil))
	if !logged.Transaction.IsRecurring || logged.Recurring.LastPaidDate == nil {
		t.Fatalf("unexpected recurring log: %+v", logged)
	}

	snapshot := decode[Snapshot](t, request(t, client, http.MethodGet, server.URL+"/api/data", nil))
	if len(snapshot.Categories) != 1 || len(snapshot.Transactions) != 2 || len(snapshot.Recurring) != 1 {
		t.Fatalf("unexpected snapshot sizes: %+v", snapshot)
	}
}

func TestValidationRejectsInvalidMoneyAndUnknownFields(t *testing.T) {
	server, client := newTestServer(t, false)
	login(t, client, server.URL)

	resp := request(t, client, http.MethodPost, server.URL+"/api/categories", map[string]any{"name": "Bad", "type": "expense", "budget": -1, "icon": "x"})
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("negative budget status=%d", resp.StatusCode)
	}
	resp.Body.Close()

	resp = request(t, client, http.MethodPost, server.URL+"/api/categories", map[string]any{"name": "Bad", "type": "expense", "budget": 1, "icon": "x", "unknown": true})
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("unknown field status=%d", resp.StatusCode)
	}
	resp.Body.Close()
}

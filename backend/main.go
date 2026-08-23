package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

type Category struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Type   string  `json:"type"`
	Budget float64 `json:"budget"`
	Icon   string  `json:"icon"`
	Color  string  `json:"color"`
}

type Transaction struct {
	ID          string  `json:"id"`
	Merchant    string  `json:"merchant"`
	Amount      float64 `json:"amount"`
	CategoryID  *string `json:"categoryId,omitempty"`
	Date        string  `json:"date"`
	Type        string  `json:"type"`
	IsDraft     bool    `json:"isDraft"`
	IsRecurring bool    `json:"isRecurring"`
	Note        *string `json:"note,omitempty"`
	CreatedAt   int64   `json:"createdAt"`
}

type RecurringTemplate struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	CategoryID    string  `json:"categoryId"`
	DefaultAmount float64 `json:"defaultAmount"`
	DueDay        int     `json:"dueDay"`
	Frequency     string  `json:"frequency"`
	Icon          string  `json:"icon"`
	LastPaidDate  *string `json:"lastPaidDate,omitempty"`
}

var db *sql.DB

func initDB() {
	var err error
	dbPath := os.Getenv("SQLITE_DB_PATH")
	if dbPath == "" {
		dbPath = "./budget.db"
	}

	db, err = sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("Failed to open SQLite database: %v", err)
	}

	createTablesQuery := `
	CREATE TABLE IF NOT EXISTS categories (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		type TEXT NOT NULL,
		budget REAL NOT NULL,
		icon TEXT NOT NULL,
		color TEXT
	);

	CREATE TABLE IF NOT EXISTS transactions (
		id TEXT PRIMARY KEY,
		merchant TEXT NOT NULL,
		amount REAL NOT NULL,
		category_id TEXT,
		date TEXT NOT NULL,
		type TEXT NOT NULL,
		is_draft INTEGER DEFAULT 0,
		is_recurring INTEGER DEFAULT 0,
		note TEXT,
		created_at INTEGER NOT NULL,
		FOREIGN KEY (category_id) REFERENCES categories(id)
	);

	CREATE TABLE IF NOT EXISTS recurring_templates (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		category_id TEXT NOT NULL,
		default_amount REAL NOT NULL,
		due_day INTEGER NOT NULL,
		frequency TEXT NOT NULL,
		icon TEXT NOT NULL,
		last_paid_date TEXT,
		FOREIGN KEY (category_id) REFERENCES categories(id)
	);
	`
	_, err = db.Exec(createTablesQuery)
	if err != nil {
		log.Fatalf("Failed to create tables: %v", err)
	}

	// Seed default categories if empty
	var count int
	db.QueryRow("SELECT COUNT(*) FROM categories").Scan(&count)
	if count == 0 {
		seedDefaults()
	}
}

func seedDefaults() {
	seedCategories := []Category{
		{ID: "groceries", Name: "Groceries", Type: "expense", Budget: 500, Icon: "shopping_cart", Color: "#f59e0b"},
		{ID: "housing", Name: "Housing", Type: "expense", Budget: 1500, Icon: "home", Color: "#006c49"},
		{ID: "transport", Name: "Transportation", Type: "expense", Budget: 200, Icon: "directions_car", Color: "#006c49"},
		{ID: "entertainment", Name: "Entertainment", Type: "expense", Budget: 150, Icon: "movie", Color: "#ba1a1a"},
		{ID: "food_dining", Name: "Food & Dining", Type: "expense", Budget: 400, Icon: "restaurant", Color: "#f59e0b"},
		{ID: "salary", Name: "Salary & Income", Type: "income", Budget: 4500, Icon: "payments", Color: "#006c49"},
	}
	for _, c := range seedCategories {
		db.Exec("INSERT INTO categories (id, name, type, budget, icon, color) VALUES (?, ?, ?, ?, ?, ?)",
			c.ID, c.Name, c.Type, c.Budget, c.Icon, c.Color)
	}

	seedTransactions := []Transaction{
		{ID: "tx-inc-1", Merchant: "Monthly Salary", Amount: 4250.00, CategoryID: stringPtr("salary"), Date: "2026-08-01", Type: "income", CreatedAt: time.Now().UnixMilli()},
		{ID: "tx-exp-1", Merchant: "Whole Foods Market", Amount: 84.20, CategoryID: stringPtr("groceries"), Date: "Today", Type: "expense", CreatedAt: time.Now().UnixMilli()},
		{ID: "tx-exp-2", Merchant: "Uber", Amount: 15.00, CategoryID: stringPtr("transport"), Date: "Yesterday", Type: "expense", CreatedAt: time.Now().UnixMilli()},
		{ID: "tx-exp-3", Merchant: "Netflix", Amount: 14.99, CategoryID: stringPtr("entertainment"), Date: "Aug 1", Type: "expense", IsRecurring: true, CreatedAt: time.Now().UnixMilli()},
		{ID: "draft-1", Merchant: "Unknown Merchant", Amount: 50.00, Date: "Yesterday", Type: "expense", IsDraft: true, CreatedAt: time.Now().UnixMilli()},
		{ID: "draft-2", Merchant: "GrabRide", Amount: 125.00, Date: "Today", Type: "expense", IsDraft: true, CreatedAt: time.Now().UnixMilli()},
		{ID: "draft-3", Merchant: "Minimarket", Amount: 35.50, CategoryID: stringPtr("groceries"), Date: "Mon, 12 Oct", Type: "expense", IsDraft: true, Note: stringPtr("Water & snacks"), CreatedAt: time.Now().UnixMilli()},
	}
	for _, t := range seedTransactions {
		var isDraftInt, isRecurringInt int
		if t.IsDraft {
			isDraftInt = 1
		}
		if t.IsRecurring {
			isRecurringInt = 1
		}
		db.Exec("INSERT INTO transactions (id, merchant, amount, category_id, date, type, is_draft, is_recurring, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			t.ID, t.Merchant, t.Amount, t.CategoryID, t.Date, t.Type, isDraftInt, isRecurringInt, t.Note, t.CreatedAt)
	}

	seedRecurring := []RecurringTemplate{
		{ID: "rec-1", Name: "Rent", CategoryID: "housing", DefaultAmount: 1500.00, DueDay: 1, Frequency: "monthly", Icon: "home"},
		{ID: "rec-2", Name: "Netflix", CategoryID: "entertainment", DefaultAmount: 14.99, DueDay: 15, Frequency: "monthly", Icon: "subscriptions", LastPaidDate: stringPtr("2026-08-15")},
		{ID: "rec-3", Name: "Gym", CategoryID: "health", DefaultAmount: 45.00, DueDay: 28, Frequency: "monthly", Icon: "fitness_center"},
	}
	for _, r := range seedRecurring {
		db.Exec("INSERT INTO recurring_templates (id, name, category_id, default_amount, due_day, frequency, icon, last_paid_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
			r.ID, r.Name, r.CategoryID, r.DefaultAmount, r.DueDay, r.Frequency, r.Icon, r.LastPaidDate)
	}
}

func stringPtr(s string) *string {
	return &s
}

func main() {
	initDB()
	defer db.Close()

	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "ok", "engine": "golang-sqlite"})
	})

	http.HandleFunc("/api/categories", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		rows, err := db.Query("SELECT id, name, type, budget, icon, COALESCE(color, '') FROM categories")
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer rows.Close()
		var list []Category
		for rows.Next() {
			var c Category
			rows.Scan(&c.ID, &c.Name, &c.Type, &c.Budget, &c.Icon, &c.Color)
			list = append(list, c)
		}
		json.NewEncoder(w).Encode(list)
	})

	http.HandleFunc("/api/transactions", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		rows, err := db.Query("SELECT id, merchant, amount, category_id, date, type, is_draft, is_recurring, note, created_at FROM transactions ORDER BY created_at DESC")
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		defer rows.Close()
		var list []Transaction
		for rows.Next() {
			var t Transaction
			var isDraftInt, isRecurringInt int
			rows.Scan(&t.ID, &t.Merchant, &t.Amount, &t.CategoryID, &t.Date, &t.Type, &isDraftInt, &isRecurringInt, &t.Note, &t.CreatedAt)
			t.IsDraft = isDraftInt == 1
			t.IsRecurring = isRecurringInt == 1
			list = append(list, t)
		}
		json.NewEncoder(w).Encode(list)
	})

	// Static File Server for React SPA
	fs := http.FileServer(http.Dir("./dist"))
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Return 404 for unknown /api/* endpoints
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		// Check if the requested file exists in ./dist (e.g. assets, vite icons, etc.)
		targetPath := filepath.Join("./dist", filepath.Clean(r.URL.Path))
		info, err := os.Stat(targetPath)
		if err == nil && !info.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}

		// Fallback to index.html for Single Page Application client routing
		http.ServeFile(w, r, "./dist/index.html")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("Golang SQLite + React App listening on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

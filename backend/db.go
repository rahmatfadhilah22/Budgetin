package main

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite"
)

func openDB(path string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", fmt.Sprintf("file:%s?_pragma=foreign_keys(1)&_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)", path))
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	if err := migrate(db); err != nil {
		db.Close()
		return nil, err
	}
	return db, nil
}

func migrate(db *sql.DB) error {
	var version int
	if err := db.QueryRow("PRAGMA user_version").Scan(&version); err != nil {
		return err
	}
	if version < 1 {
		if err := migrateV1(db); err != nil {
			return err
		}
		version = 1
	}
	if version < 2 {
		if err := migrateV2(db); err != nil {
			return err
		}
		version = 2
	}
	if version < 3 {
		if err := migrateV3(db); err != nil {
			return err
		}
		version = 3
	}
	return nil
}

func migrateV1(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	const schema = `
CREATE TABLE categories (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL CHECK(length(trim(name)) > 0),
	type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
	budget INTEGER NOT NULL CHECK(budget >= 0),
	icon TEXT NOT NULL CHECK(length(trim(icon)) > 0)
);
CREATE TABLE transactions (
	id TEXT PRIMARY KEY,
	merchant TEXT NOT NULL CHECK(length(trim(merchant)) > 0),
	amount INTEGER NOT NULL CHECK(amount > 0),
	category_id TEXT,
	occurred_on TEXT NOT NULL CHECK(date(occurred_on) IS NOT NULL AND date(occurred_on) = occurred_on),
	type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
	is_draft INTEGER NOT NULL DEFAULT 0 CHECK(is_draft IN (0, 1)),
	is_recurring INTEGER NOT NULL DEFAULT 0 CHECK(is_recurring IN (0, 1)),
	note TEXT,
	created_at INTEGER NOT NULL,
	FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);
CREATE TABLE recurring_templates (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL CHECK(length(trim(name)) > 0),
	category_id TEXT NOT NULL,
	default_amount INTEGER NOT NULL CHECK(default_amount > 0),
	due_day INTEGER NOT NULL CHECK(due_day BETWEEN 1 AND 31),
	frequency TEXT NOT NULL CHECK(frequency IN ('monthly', 'weekly', 'yearly')),
	icon TEXT NOT NULL CHECK(length(trim(icon)) > 0),
	last_paid_date TEXT CHECK(last_paid_date IS NULL OR date(last_paid_date) = last_paid_date),
	FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);
CREATE TABLE settings (
	id INTEGER PRIMARY KEY CHECK(id = 1),
	name TEXT NOT NULL DEFAULT '',
	email TEXT NOT NULL DEFAULT '',
	cycle_start_day INTEGER NOT NULL DEFAULT 1 CHECK(cycle_start_day BETWEEN 1 AND 31),
	period TEXT NOT NULL DEFAULT 'monthly' CHECK(period IN ('monthly', 'weekly')),
	notifications_enabled INTEGER NOT NULL DEFAULT 1 CHECK(notifications_enabled IN (0, 1))
);
INSERT INTO settings (id) VALUES (1);
PRAGMA user_version = 1;
`
	if _, err := tx.Exec(schema); err != nil {
		return err
	}
	return tx.Commit()
}

// v2: link recurring-logged transactions back to their template.
func migrateV2(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// NULL template_id = recurring transaction whose template is gone/renamed (orphan).
	if _, err := tx.Exec("ALTER TABLE transactions ADD COLUMN template_id TEXT REFERENCES recurring_templates(id) ON DELETE SET NULL"); err != nil {
		return err
	}
	// Best-effort backfill by merchant name for transactions logged before this migration.
	if _, err := tx.Exec(`UPDATE transactions SET template_id = (SELECT id FROM recurring_templates rt WHERE rt.name = transactions.merchant LIMIT 1) WHERE is_recurring = 1 AND template_id IS NULL`); err != nil {
		return err
	}
	if _, err := tx.Exec("PRAGMA user_version = 2"); err != nil {
		return err
	}
	return tx.Commit()
}

// v3: user-changeable password. A row exists only after the user changes it from
// the app — until then login falls back to the APP_PASSWORD env var (initial password).
func migrateV3(db *sql.DB) error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`CREATE TABLE IF NOT EXISTS password_hash (
		id INTEGER PRIMARY KEY CHECK(id = 1),
		hash TEXT NOT NULL
	)`); err != nil {
		return err
	}
	if _, err := tx.Exec("PRAGMA user_version = 3"); err != nil {
		return err
	}
	return tx.Commit()
}

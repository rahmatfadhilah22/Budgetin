package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"
	"time"
)

type Category struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Type   string `json:"type"`
	Budget int64  `json:"budget"`
	Icon   string `json:"icon"`
}

type Transaction struct {
	ID          string  `json:"id"`
	Merchant    string  `json:"merchant"`
	Amount      int64   `json:"amount"`
	CategoryID  *string `json:"categoryId,omitempty"`
	Date        string  `json:"date"`
	Type        string  `json:"type"`
	IsDraft     bool    `json:"isDraft"`
	IsRecurring bool    `json:"isRecurring"`
	Note        *string `json:"note,omitempty"`
	CreatedAt   int64   `json:"createdAt"`
	TemplateID  *string `json:"templateId,omitempty"`
}

type RecurringTemplate struct {
	ID            string  `json:"id"`
	Name          string  `json:"name"`
	CategoryID    string  `json:"categoryId"`
	DefaultAmount int64   `json:"defaultAmount"`
	DueDay        int     `json:"dueDay"`
	Frequency     string  `json:"frequency"`
	Icon          string  `json:"icon"`
	LastPaidDate  *string `json:"lastPaidDate,omitempty"`
}

type Settings struct {
	Name                 string `json:"name"`
	Email                string `json:"email"`
	CycleStartDay        int    `json:"cycleStartDay"`
	Period               string `json:"period"`
	NotificationsEnabled bool   `json:"notificationsEnabled"`
}

type Snapshot struct {
	Categories   []Category          `json:"categories"`
	Transactions []Transaction       `json:"transactions"`
	Recurring    []RecurringTemplate `json:"recurring"`
	Settings     Settings            `json:"settings"`
}

type recurringLogResult struct {
	Transaction Transaction       `json:"transaction"`
	Recurring   RecurringTemplate `json:"recurring"`
}

func newID() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func validType(value string) bool { return value == "expense" || value == "income" }

func validDate(value string) bool {
	parsed, err := time.Parse("2006-01-02", value)
	return err == nil && parsed.Format("2006-01-02") == value
}

func cleanOptional(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func validateCategory(c *Category) string {
	c.Name, c.Icon = strings.TrimSpace(c.Name), strings.TrimSpace(c.Icon)
	if c.Name == "" || c.Icon == "" || !validType(c.Type) || c.Budget < 0 {
		return "name, type, budget, or icon is invalid"
	}
	return ""
}

func validateTransaction(t *Transaction) string {
	t.Merchant = strings.TrimSpace(t.Merchant)
	t.Note = cleanOptional(t.Note)
	if t.CategoryID != nil {
		t.CategoryID = cleanOptional(t.CategoryID)
	}
	if t.Merchant == "" || t.Amount <= 0 || !validType(t.Type) || !validDate(t.Date) {
		return "merchant, amount, date, or type is invalid"
	}
	if !t.IsDraft && t.CategoryID == nil {
		return "completed transactions require a category"
	}
	return ""
}

func validateRecurring(r *RecurringTemplate) string {
	r.Name, r.CategoryID, r.Icon = strings.TrimSpace(r.Name), strings.TrimSpace(r.CategoryID), strings.TrimSpace(r.Icon)
	validFrequency := r.Frequency == "monthly" || r.Frequency == "weekly" || r.Frequency == "yearly"
	if r.Name == "" || r.CategoryID == "" || r.Icon == "" || r.DefaultAmount <= 0 || r.DueDay < 1 || r.DueDay > 31 || !validFrequency {
		return "recurring template is invalid"
	}
	if r.LastPaidDate != nil && !validDate(*r.LastPaidDate) {
		return "lastPaidDate is invalid"
	}
	return ""
}

func (a *app) getData(w http.ResponseWriter, _ *http.Request) {
	data, err := a.snapshot()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "could not load data")
		return
	}
	writeJSON(w, http.StatusOK, data)
}

func (a *app) snapshot() (Snapshot, error) {
	out := Snapshot{Categories: []Category{}, Transactions: []Transaction{}, Recurring: []RecurringTemplate{}}
	rows, err := a.db.Query("SELECT id, name, type, budget, icon FROM categories ORDER BY name")
	if err != nil {
		return out, err
	}
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Type, &c.Budget, &c.Icon); err != nil {
			rows.Close()
			return out, err
		}
		out.Categories = append(out.Categories, c)
	}
	if err := rows.Close(); err != nil {
		return out, err
	}

	rows, err = a.db.Query("SELECT id, merchant, amount, category_id, occurred_on, type, is_draft, is_recurring, note, created_at, template_id FROM transactions ORDER BY created_at DESC")
	if err != nil {
		return out, err
	}
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.Merchant, &t.Amount, &t.CategoryID, &t.Date, &t.Type, &t.IsDraft, &t.IsRecurring, &t.Note, &t.CreatedAt, &t.TemplateID); err != nil {
			rows.Close()
			return out, err
		}
		out.Transactions = append(out.Transactions, t)
	}
	if err := rows.Close(); err != nil {
		return out, err
	}

	rows, err = a.db.Query("SELECT id, name, category_id, default_amount, due_day, frequency, icon, last_paid_date FROM recurring_templates ORDER BY name")
	if err != nil {
		return out, err
	}
	for rows.Next() {
		var r RecurringTemplate
		if err := rows.Scan(&r.ID, &r.Name, &r.CategoryID, &r.DefaultAmount, &r.DueDay, &r.Frequency, &r.Icon, &r.LastPaidDate); err != nil {
			rows.Close()
			return out, err
		}
		out.Recurring = append(out.Recurring, r)
	}
	if err := rows.Close(); err != nil {
		return out, err
	}

	err = a.db.QueryRow("SELECT name, email, cycle_start_day, period, notifications_enabled FROM settings WHERE id=1").Scan(&out.Settings.Name, &out.Settings.Email, &out.Settings.CycleStartDay, &out.Settings.Period, &out.Settings.NotificationsEnabled)
	return out, err
}

func (a *app) createCategory(w http.ResponseWriter, r *http.Request) {
	var c Category
	if err := decodeJSON(w, r, &c); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	if message := validateCategory(&c); message != "" {
		writeError(w, 400, message)
		return
	}
	id, err := newID()
	if err != nil {
		writeError(w, 500, "could not create category")
		return
	}
	c.ID = id
	if _, err = a.db.Exec("INSERT INTO categories(id,name,type,budget,icon) VALUES(?,?,?,?,?)", c.ID, c.Name, c.Type, c.Budget, c.Icon); err != nil {
		writeError(w, 500, "could not create category")
		return
	}
	writeJSON(w, 201, c)
}

func (a *app) updateCategory(w http.ResponseWriter, r *http.Request) {
	var c Category
	if err := decodeJSON(w, r, &c); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	if message := validateCategory(&c); message != "" {
		writeError(w, 400, message)
		return
	}
	c.ID = r.PathValue("id")
	result, err := a.db.Exec("UPDATE categories SET name=?,type=?,budget=?,icon=? WHERE id=?", c.Name, c.Type, c.Budget, c.Icon, c.ID)
	if err != nil {
		writeError(w, 500, "could not update category")
		return
	}
	if n, _ := result.RowsAffected(); n == 0 {
		writeError(w, 404, "category not found")
		return
	}
	writeJSON(w, 200, c)
}

func (a *app) deleteCategory(w http.ResponseWriter, r *http.Request) {
	result, err := a.db.Exec("DELETE FROM categories WHERE id=?", r.PathValue("id"))
	if err != nil {
		if strings.Contains(err.Error(), "FOREIGN KEY") {
			writeError(w, 409, "category is still in use")
		} else {
			writeError(w, 500, "could not delete category")
		}
		return
	}
	if n, _ := result.RowsAffected(); n == 0 {
		writeError(w, 404, "category not found")
		return
	}
	w.WriteHeader(204)
}

func (a *app) createTransaction(w http.ResponseWriter, r *http.Request) {
	var t Transaction
	if err := decodeJSON(w, r, &t); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	if message := validateTransaction(&t); message != "" {
		writeError(w, 400, message)
		return
	}
	id, err := newID()
	if err != nil {
		writeError(w, 500, "could not create transaction")
		return
	}
	t.ID = id
	t.CreatedAt = time.Now().UnixMilli()
	_, err = a.db.Exec("INSERT INTO transactions(id,merchant,amount,category_id,occurred_on,type,is_draft,is_recurring,note,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)", t.ID, t.Merchant, t.Amount, t.CategoryID, t.Date, t.Type, t.IsDraft, t.IsRecurring, t.Note, t.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "FOREIGN KEY") {
			writeError(w, 400, "category not found")
		} else {
			writeError(w, 500, "could not create transaction")
		}
		return
	}
	writeJSON(w, 201, t)
}

func (a *app) updateTransaction(w http.ResponseWriter, r *http.Request) {
	var t Transaction
	if err := decodeJSON(w, r, &t); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	if message := validateTransaction(&t); message != "" {
		writeError(w, 400, message)
		return
	}
	t.ID = r.PathValue("id")
	result, err := a.db.Exec("UPDATE transactions SET merchant=?,amount=?,category_id=?,occurred_on=?,type=?,is_draft=?,is_recurring=?,note=? WHERE id=?", t.Merchant, t.Amount, t.CategoryID, t.Date, t.Type, t.IsDraft, t.IsRecurring, t.Note, t.ID)
	if err != nil {
		if strings.Contains(err.Error(), "FOREIGN KEY") {
			writeError(w, 400, "category not found")
		} else {
			writeError(w, 500, "could not update transaction")
		}
		return
	}
	if n, _ := result.RowsAffected(); n == 0 {
		writeError(w, 404, "transaction not found")
		return
	}
	if err := a.db.QueryRow("SELECT created_at FROM transactions WHERE id=?", t.ID).Scan(&t.CreatedAt); err != nil {
		writeError(w, 500, "could not load transaction")
		return
	}
	writeJSON(w, 200, t)
}

func (a *app) deleteTransaction(w http.ResponseWriter, r *http.Request) {
	result, err := a.db.Exec("DELETE FROM transactions WHERE id=?", r.PathValue("id"))
	if err != nil {
		writeError(w, 500, "could not delete transaction")
		return
	}
	if n, _ := result.RowsAffected(); n == 0 {
		writeError(w, 404, "transaction not found")
		return
	}
	w.WriteHeader(204)
}

func (a *app) createRecurring(w http.ResponseWriter, r *http.Request) {
	var rec RecurringTemplate
	if err := decodeJSON(w, r, &rec); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	if message := validateRecurring(&rec); message != "" {
		writeError(w, 400, message)
		return
	}
	id, err := newID()
	if err != nil {
		writeError(w, 500, "could not create recurring template")
		return
	}
	rec.ID = id
	_, err = a.db.Exec("INSERT INTO recurring_templates(id,name,category_id,default_amount,due_day,frequency,icon,last_paid_date) VALUES(?,?,?,?,?,?,?,?)", rec.ID, rec.Name, rec.CategoryID, rec.DefaultAmount, rec.DueDay, rec.Frequency, rec.Icon, rec.LastPaidDate)
	if err != nil {
		if strings.Contains(err.Error(), "FOREIGN KEY") {
			writeError(w, 400, "category not found")
		} else {
			writeError(w, 500, "could not create recurring template")
		}
		return
	}
	writeJSON(w, 201, rec)
}

func (a *app) updateRecurring(w http.ResponseWriter, r *http.Request) {
	var rec RecurringTemplate
	if err := decodeJSON(w, r, &rec); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	if message := validateRecurring(&rec); message != "" {
		writeError(w, 400, message)
		return
	}
	rec.ID = r.PathValue("id")
	result, err := a.db.Exec("UPDATE recurring_templates SET name=?,category_id=?,default_amount=?,due_day=?,frequency=?,icon=?,last_paid_date=? WHERE id=?", rec.Name, rec.CategoryID, rec.DefaultAmount, rec.DueDay, rec.Frequency, rec.Icon, rec.LastPaidDate, rec.ID)
	if err != nil {
		if strings.Contains(err.Error(), "FOREIGN KEY") {
			writeError(w, 400, "category not found")
		} else {
			writeError(w, 500, "could not update recurring template")
		}
		return
	}
	if n, _ := result.RowsAffected(); n == 0 {
		writeError(w, 404, "recurring template not found")
		return
	}
	writeJSON(w, 200, rec)
}

func (a *app) deleteRecurring(w http.ResponseWriter, r *http.Request) {
	result, err := a.db.Exec("DELETE FROM recurring_templates WHERE id=?", r.PathValue("id"))
	if err != nil {
		writeError(w, 500, "could not delete recurring template")
		return
	}
	if n, _ := result.RowsAffected(); n == 0 {
		writeError(w, 404, "recurring template not found")
		return
	}
	w.WriteHeader(204)
}

func (a *app) logRecurring(w http.ResponseWriter, r *http.Request) {
	tx, err := a.db.Begin()
	if err != nil {
		writeError(w, 500, "could not log recurring payment")
		return
	}
	defer tx.Rollback()
	var rec RecurringTemplate
	err = tx.QueryRow("SELECT id,name,category_id,default_amount,due_day,frequency,icon,last_paid_date FROM recurring_templates WHERE id=?", r.PathValue("id")).Scan(&rec.ID, &rec.Name, &rec.CategoryID, &rec.DefaultAmount, &rec.DueDay, &rec.Frequency, &rec.Icon, &rec.LastPaidDate)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, 404, "recurring template not found")
		return
	}
	if err != nil {
		writeError(w, 500, "could not log recurring payment")
		return
	}
	id, err := newID()
	if err != nil {
		writeError(w, 500, "could not log recurring payment")
		return
	}
	today := time.Now().Format("2006-01-02")
	note := "Recurring payment for " + rec.Name
	payment := Transaction{ID: id, Merchant: rec.Name, Amount: rec.DefaultAmount, CategoryID: &rec.CategoryID, Date: today, Type: "expense", IsRecurring: true, Note: &note, CreatedAt: time.Now().UnixMilli(), TemplateID: &rec.ID}
	if _, err = tx.Exec("INSERT INTO transactions(id,merchant,amount,category_id,occurred_on,type,is_draft,is_recurring,note,created_at,template_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)", payment.ID, payment.Merchant, payment.Amount, payment.CategoryID, payment.Date, payment.Type, false, true, payment.Note, payment.CreatedAt, payment.TemplateID); err != nil {
		writeError(w, 500, "could not log recurring payment")
		return
	}
	if _, err = tx.Exec("UPDATE recurring_templates SET last_paid_date=? WHERE id=?", today, rec.ID); err != nil {
		writeError(w, 500, "could not log recurring payment")
		return
	}
	rec.LastPaidDate = &today
	if err = tx.Commit(); err != nil {
		writeError(w, 500, "could not log recurring payment")
		return
	}
	writeJSON(w, 201, recurringLogResult{payment, rec})
}

// syncRecurring aligns a template's linked transactions with its current name & category.
// Amounts are deliberately untouched — historical payments are never rewritten.
func (a *app) syncRecurring(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var rec RecurringTemplate
	if err := a.db.QueryRow("SELECT id,name,category_id FROM recurring_templates WHERE id=?", id).Scan(&rec.ID, &rec.Name, &rec.CategoryID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, 404, "recurring template not found")
		} else {
			writeError(w, 500, "could not sync recurring")
		}
		return
	}
	if _, err := a.db.Exec("UPDATE transactions SET merchant=?, category_id=? WHERE template_id=?", rec.Name, rec.CategoryID, id); err != nil {
		writeError(w, 500, "could not sync recurring")
		return
	}
	txs, err := a.transactionsForTemplate(id)
	if err != nil {
		writeError(w, 500, "could not sync recurring")
		return
	}
	writeJSON(w, 200, txs)
}

func (a *app) transactionsForTemplate(id string) ([]Transaction, error) {
	rows, err := a.db.Query("SELECT id, merchant, amount, category_id, occurred_on, type, is_draft, is_recurring, note, created_at, template_id FROM transactions WHERE template_id=?", id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Transaction
	for rows.Next() {
		var t Transaction
		if err := rows.Scan(&t.ID, &t.Merchant, &t.Amount, &t.CategoryID, &t.Date, &t.Type, &t.IsDraft, &t.IsRecurring, &t.Note, &t.CreatedAt, &t.TemplateID); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// changePassword replaces the login password. Must supply the current password;
// requires ≥ 8 chars. Other sessions are invalidated, the caller stays logged in.
func (a *app) changePassword(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Current string `json:"current"`
		Next    string `json:"next"`
	}
	if err := decodeJSON(w, r, &body); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	if !a.passwords.matches(a.passwordHash, body.Current) {
		writeError(w, http.StatusUnauthorized, "current password is incorrect")
		return
	}
	if len(body.Next) < 8 {
		writeError(w, http.StatusBadRequest, "new password must be at least 8 characters")
		return
	}
	if body.Next == body.Current {
		writeError(w, http.StatusBadRequest, "new password must be different from the current one")
		return
	}
	if err := a.passwords.set(body.Next); err != nil {
		writeError(w, http.StatusInternalServerError, "could not update password")
		return
	}
	// Invalidate every session except the caller's own cookie.
	current := ""
	if cookie, err := r.Cookie(sessionCookie); err == nil {
		current = cookie.Value
	}
	a.sessions.clearExcept(current)
	writeJSON(w, http.StatusOK, map[string]bool{"changed": true})
}

func (a *app) updateSettings(w http.ResponseWriter, r *http.Request) {
	var settings Settings
	if err := decodeJSON(w, r, &settings); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	settings.Name = strings.TrimSpace(settings.Name)
	settings.Email = strings.TrimSpace(settings.Email)
	if settings.CycleStartDay < 1 || settings.CycleStartDay > 31 || (settings.Period != "monthly" && settings.Period != "weekly") {
		writeError(w, 400, "settings are invalid")
		return
	}
	_, err := a.db.Exec("UPDATE settings SET name=?,email=?,cycle_start_day=?,period=?,notifications_enabled=? WHERE id=1", settings.Name, settings.Email, settings.CycleStartDay, settings.Period, settings.NotificationsEnabled)
	if err != nil {
		writeError(w, 500, "could not update settings")
		return
	}
	writeJSON(w, 200, settings)
}

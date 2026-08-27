# Budgetin

Aplikasi budget / personal finance **monolith** — satu server Go yang melayani REST API dan hasil build React, dengan data tersimpan di SQLite. Single user dengan login password. Tanpa data demo: database baru selalu dimulai kosong.

## Arsitektur singkat

```
├── backend/           Go API + SQLite (sumber data satu-satunya)
│   ├── main.go        wiring, env, graceful shutdown
│   ├── app.go         router, middleware auth, JSON helper, serving SPA
│   ├── auth.go        login password, session cookie (HttpOnly + SameSite)
│   ├── db.go          koneksi SQLite + schema versioned (kosong)
│   ├── resources.go   CRUD kategori / transaksi / recurring / settings
│   └── app_test.go    integration test
├── src/               React + TypeScript (Vite, Tailwind v4)
│   └── context/       state via API — TANPA localStorage, TANPA seed data
├── Dockerfile         build multi-stage, non-root, healthcheck
└── docker-compose.yml
```

- **Frontend ↔ backend:** React memanggil `/api/*` yang dilayani server yang sama (dev lewat Vite proxy). Cookie session dikirim otomatis, tidak ada CORS.
- **Money:** semua nominal disimpan sebagai integer Rupiah (`int64`) — presisi, tanpa masalah pembulatan float.
- **Driver SQLite:** `modernc.org/sqlite` (pure Go) — tidak butuh `gcc`/CGO, jalan apa adanya di Windows/Linux/macOS.

---

## Prasyarat

| Jalur | Butuh |
|---|---|
| Lokal (dev) | **Go 1.25+**, **Node 20+** (npm) |
| Docker | **Docker** (Engine 20.10+ / Compose v2) |

Tanpa Docker di Windows: cukup Go + Node, tidak perlu install gcc.

---

## Menjalankan secara lokal (development)

Backend dan frontend dijalankan sebagai dua proses; Vite men-proxy `/api` ke backend sehingga browser cukup membuka satu port.

### 1. Siapkan password

Password dibaca dari `APP_PASSWORD` (minimum 12 karakter). Server **menolak start** jika tidak ada.

Cara termudah — buat file `.env` di **root project** (dipakai baik oleh `go run` maupun Docker Compose):

```
APP_PASSWORD=ganti-dengan-password-kuat
```

`.env` tidak ikut di-commit (sudah di `.gitignore`). Alternatif, set sebagai environment variable sungguhan:

```powershell
# PowerShell (Windows)
$env:APP_PASSWORD = "ganti-dengan-password-kuat"
```

```bash
# Bash / zsh / macOS / Linux
export APP_PASSWORD="ganti-dengan-password-kuat"
```

> Backend membaca `.env` otomatis (di folder berjalan atau folder induk), jadi `go run .` dari `backend/` ikut terbaca. Env var sungguhan tetap menang atas `.env`.

### 2. Jalankan backend (port 8080)

```bash
cd backend
go run .
```

Terlihat: `Budgetin listening on http://0.0.0.0:8080`. File database `budget.db` dibuat otomatis di folder `backend/`.

### 3. Jalankan frontend (port 3000) — terminal terpisah

```bash
cd ..
npm install        # cukup sekali
npm run dev
```

Buka **http://localhost:3000** dan masuk dengan password tadi.

> `npm run dev` memakai `--host=0.0.0.0`, jadi bisa diakses perangkat lain di LAN lewat `http://<IP-anda>:3000`.

---

## Menjalankan dengan Docker

Backend di image sudah menyertakan hasil build React — satu container melayani UI + API.

### 1. Buat file `.env` di root project

Sama seperti di atas (dipakai untuk `go run` dan Compose).

```
APP_PASSWORD=ganti-dengan-password-kuat
# Isi di bawah hanya jika deploy lewat HTTPS (lihat bagian Production):
# APP_ENV=production
```

### 2. Build & jalankan

```bash
docker compose up --build -d
```

Buka **http://localhost:8080**.

Tanpa Compose (docker run):

```bash
docker build -t budgetin .
docker run -d --name budgetin \
  -e APP_PASSWORD="ganti-dengan-password-kuat" \
  -p 8080:8080 \
  -v budget-data:/app/data \
  budgetin
```

### Stop / lihat log

```bash
docker compose down          # stop
docker compose logs -f       # log
```

Data tersimpan di named volume `budget-data` — tetap ada walau container dihapus. Untuk mulai benar-benar kosong: `docker compose down -v`.

---

## Environment variables

| Variabel | Wajib | Default | Keterangan |
|---|---|---|---|
| `APP_PASSWORD` | ✅ | — | Password login. Min 12 karakter. Tidak ada default. |
| `APP_ENV` | — | *(kosong)* | `production` mengaktifkan flag `Secure` pada cookie session. **Hanya** set saat di belakang HTTPS. |
| `PORT` | — | `8080` | Port listen server. |
| `SQLITE_DB_PATH` | — | `./budget.db` | Lokasi file database. |

---

## Deployment production

Aplikasi adalah server statis + API dalam satu binary — deploy satu proses saja. Data SQLite adalah file di dalam volume/disk; **backup = salin file database** (atau pakai menu *Export* di aplikasi).

### Hal yang wajib

1. **Terminasi HTTPS di depan aplikasi.** Server sendiri HTTP-only; cookie session baru di-flagnya `Secure` jika `APP_ENV=production`. Jadi:
   - Set `APP_ENV=production`
   - Pasang reverse proxy (Caddy / Nginx / Cloud Run) yang menangani TLS

2. **Password kuat** lewat `APP_PASSWORD`.

### Contoh Caddy

```caddyfile
budget.example.com {
    reverse_proxy localhost:8080
}
```

### Contoh Nginx

```nginx
server {
    listen 443 ssl;
    server_name budget.example.com;
    # ssl_certificate / ssl_certificate_key ...;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Docker di server

```bash
# .env berisi APP_PASSWORD + APP_ENV=production
docker compose up --build -d
```

Healthcheck bawaan memanggil `/api/health` (public, tanpa auth) setiap 30 detik.

---

## Catatan keamanan & batasan (jujur)

- Satu password, **session disimpan in-memory** — restart server / container membuat semua session logout (perlu login ulang). Tidak ada refresh token; cukup untuk satu pengguna.
- Login memakai pembandingan waktu-konstan dan delay kecil pada kegagalan.
- Body request dibatasi (1 MB), JSON dengan field tak dikenal ditolak, dan query SQL menggunakan parameter — tanpa concatenation input pengguna.
- Menghapus kategori yang masih dipakai transaksi/recurring **ditolak** (409) agar tidak ada referensi menggantung; pindahkan/hapus transaksinya dulu.
- Semua nominal integer Rupiah — tidak ada fitur multi-mata uang.

## Troubleshooting

| Gejala | Penyebab / Solusi |
|---|---|
| Backend `FATAL: APP_PASSWORD must contain at least 12 characters` | `APP_PASSWORD` tidak diset / terlalu pendek. |
| Login selalu gagal | Password salah — bandingkan dengan nilai env yang dipakai server. |
| UI tidak bisa memuat data (401) | Cookie session hilang/expired — logout lalu login ulang. |
| Port 8080/3000 sudah terpakai | Ganti via `PORT` (backend) atau `vite --port` (frontend). |
| Perubahan tidak tersimpan setelah refresh | Pastikan backend yang sama masih berjalan; semua data ada di SQLite backend, bukan browser. |

## Development: menjalankan test & build

```bash
# Backend (test integration: auth, CRUD, validasi, persistensi)
cd backend && go test ./... && go vet ./...

# Frontend (type-check + production build)
npm run lint && npm run build
```

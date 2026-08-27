# Fitur & Cara Pakai — Budgetin

Daftar fitur yang tersedia dan bagaimana menggunakannya. Semua data tersimpan di SQLite backend — aman di-refresh/restart, tidak ada localStorage.

---

## 1. Login & Logout

| | |
|---|---|
| **Cara** | Buka aplikasi → masukkan password (dari `APP_PASSWORD` di `.env`). |
| **Session** | Berlaku 24 jam, disimpan sebagai cookie `HttpOnly`. |
| **Logout** | Klik avatar (kanan atas) → **Sign out**, atau di **Settings → Sign out**. |

- Password salah → ditolak, tampil pesan generik.
- Restart server → semua session hangus, perlu login ulang (session in-memory).

---

## 2. Dashboard

Ringkasan kondisi keuangan satu halaman.

| Elemen | Isi |
|---|---|
| **Kartu Income / Expenses / Remaining** | Total pemasukan, pengeluaran, dan sisa **siklus aktif** (Rp). Kartu Remaining tampil sebagai permukaan gelap. |
| **Navigasi siklus ◀ ▶** | Di atas kartu summary. Pindah ke siklus sebelumnya/berikutnya; label menampilkan rentang (mis. "25 Agu – 24 Sep"). Kembali ke siklus saat ini lewat refresh atau mode Monthly/Weekly. |
| **Banner draft** | Muncul jika ada transaksi yang belum dikategorikan. Klik **Review now →** ke daftar draft. |
| **Banner recurring belum dibayar** | Muncul untuk template recurring yang belum ada riwayat bayar. Klik **Log it now** untuk mencatat langsung. |
| **Kategori (progress)** | 4 kategori pengeluaran teratas **dalam siklus aktif**: bar hijau (aman) → kuning (≥80% budget) → merah (lewat budget). |
| **Recent Activity** | 5 transaksi terakhir **apa pun siklusnya**. Klik untuk pindah ke halaman Transaksi. |

---

## 3. Quick Add (Tambah Cepat)

Cara tercepat mencatat transaksi.

- **Buka:** tombol **Quick Add** di sidebar (desktop) / tombol **+** mengambang (mobile).
- **Isi:**
  1. Pilih tipe **Expense** atau **Income**.
  2. **Amount (Rp)** — bilangan bulat, minimal 1.
  3. **Category** — daftar menyesuaikan tipe (pengeluaran vs pemasukan).
  4. **Merchant** (opsional) — isi manual, fallback "Unknown Merchant".
  5. **Date** — default hari ini.
  6. Ceklis **Save as Incomplete Draft** bila ingin dikategorikan nanti.
- **Simpan:** klik **Save Transaction**; tombol menampilkan "Saving…" dan menutup otomatis saat sukses. Error tampil inline di bawah form.

---

## 4. Transaksi

Halaman **Transactions** punya dua tab.

### 4a. Review Drafts
Daftar transaksi belum dikategorikan (draft).
1. Pilih **kategori** dari chip yang tersedia (4 kategori pengeluaran pertama).
2. Isi **note** (opsional).
3. Klik **Done** → draft menjadi transaksi resmi.
   - Tanpa kategori, tombol berubah merah dan menampilkan peringatan.
- Tombol **delete** (ikon tempat sampah) membuang draft (dengan konfirmasi).

### 4b. All Transactions
Riwayat lengkap.
- **Search** — cari berdasarkan nama merchant / isi note.
- **Filter kategori** dan **filter tipe** (semua / pengeluaran / pemasukan).
- Setiap baris menampilkan kategori, tanggal, badge **Draft** / **Recurring**, dan jumlah Rp (hijau = pemasukan, gelap = pengeluaran).
- **Delete** ikon muncul saat hover (dengan konfirmasi).

---

## 5. Kategori

Atur kategori + budget pengeluaran/pemasukan.

- **Tambah:** tombol **New Category** (atau kartu titik-titik "Add Category").
- **Edit:** klik kartu kategori → drawer terbuka.
- **Isi form:**
  - **Nama** kategori
  - **Tipe** Income / Expense
  - **Monthly Budget (Rp)** — bilangan bulat, tidak boleh negatif
  - **Icon** — pilih dari grid ikon
- **Hapus:** tombol **Delete this category** di dalam drawer.
  - ⚠️ Jika kategori masih dipakai transaksi/template recurring, hapus **ditolak** (pesan konflik). Pindahkan/hapus transaksi-nya dulu.

---

## 6. Recurring (Transaksi Berulang)

Template untuk tagihan rutin (sewa, internet, gym, dsb).

- **Tambah:** tombol **New Template**.
- **Isi form:**
  - **Nama** template
  - **Category** (pengeluaran)
  - **Amount (Rp)**
  - **Due Day** — tanggal jatuh tempo (1–31)
  - **Frequency** — Monthly / Weekly / Yearly
  - **Icon**
- **Mencatat pembayaran:** klik **Log** pada baris (atau **Log it now** di banner atas) → sistem membuat satu transaksi pengeluaran otomatis **dan** menandai template "Paid", **atomik** (satu operasi, tidak bisa dobel).
- **Edit / hapus** lewat ikon di kanan baris. Menghapus template **tidak** menghapus transaksi lama.

---

## 7. Settings

Pilih menu gear atau klik avatar → **Profile Settings**.

| Pengaturan | Cara pakai |
|---|---|
| **Profile Information** | Ubah nama & email. Tampil di sidebar + menu profil. |
| **Recurring reminders** | Nyalakan/matikan banner "belum dibayar" untuk recurring. |
| **Budget cycle** | Pilih **Monthly** atau **Weekly**. Monthly: siklus berdasarkan `Cycle start day`; Weekly: Senin–Minggu. |
| **Cycle start day** | Hari mulai siklus bulanan (1–31); hanya tampil saat mode Monthly. Menentukan rentang siklus yang membatasi angka Dashboard (mis. 25 = 25 → 24). |
| **Export as CSV** | Unduh riwayat transaksi (dari snapshot saat ini). |
| **Export as JSON** | Unduh backup lengkap (settings + kategori + transaksi + recurring). |
| **Sign out** | Tutup session. |

---

## 8. Privacy Mode

- Ikon **mata** di header (desktop & mobile).
- Aktif → semua nominal berubah menjadi `••••••`, berguna saat layar dilihat orang lain.
- Murni tampilan — tidak mengubah data.

---

## 9. Aturan umum & batasan

- **Mata uang:** selalu Rupiah (IDR), bilangan bulat. Tidak ada konversi float / multi-currency.
- **Data bersih saat baru:** database pertama dibuat kosong — tidak ada data contoh.
- **Backup:** gunakan **Export as JSON** secara berkala; itu salinan lengkap data Anda.
- **Restart server** = semua orang perlu login ulang (session in-memory).

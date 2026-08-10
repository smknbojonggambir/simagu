# 🚀 SIMAGU CMS-Ready Deployment Package
**Sistem Informasi Agenda Guru & Agenda Kelas (SMKN Bojonggambir)**

Panduan lengkap untuk memindahkan aplikasi SIMAGU ke **GitHub**, **Google Apps Script**, dan **Google Sheets** agar aplikasi dapat berjalan 100% penuh sebagai cloud CMS terintegrasi.

---

## 📁 Struktur Paket `CMS-Ready`

```text
CMS-Ready/
├── CMS/
│   ├── README-CMS.md           # Panduan Upload & Build Source Code CMS (Vite + React + TS)
│   └── (Seluruh source code aplikasi di root repo)
│
├── Google-Apps-Script/
│   ├── Code.gs                 # Script Backend API Web App (GET/POST handlers)
│   └── appsscript.json         # Manifest Akses Web App & Zona Waktu Asia/Jakarta
│
├── Google-Sheet-Template/
│   └── Struktur_Spreadsheet_SIMAGU.md  # Template 24 Sheet Database, Header Kolom & Rumus
│
└── README.md                   # Dokumen Utama (Panduan Ini)
```

---

## 🛠️ Langkah-Langkah Deployment (5 Langkah Mudah)

### Langkah 1: Upload Project CMS ke GitHub
1. Buka terminal di folder utama repository aplikasi ini.
2. Inisialisasi git dan hubungkan ke repository GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: SIMAGU CMS Ready"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```
3. Seluruh source code CMS (termasuk React 18, Tailwind CSS, Vite, TypeScript) kini tersimpan aman di GitHub.

---

### Langkah 2: Buat Spreadsheet Database Baru
1. Buka [Google Sheets](https://sheets.google.com) dan buat **Spreadsheet Kosong Baru**.
2. Beri nama Spreadsheet, contoh: `DATABASE_SIMAGU_SMKN_BOJONGGAMBIR`.
3. Catat ID Spreadsheet dari URL browser Anda (bagian di antara `/d/` dan `/edit`).

---

### Langkah 3: Pasang Backend Google Apps Script (Code.gs)
1. Di dalam Google Sheet yang baru dibuat, klik menu **Ekstensi (Extensions)** → **Apps Script**.
2. Hapus seluruh isi default di file `Code.gs`.
3. Buka file `CMS-Ready/Google-Apps-Script/Code.gs` dalam paket ini, lalu **Copy & Paste** seluruh isinya ke editor Apps Script.
4. Buka file `CMS-Ready/Google-Apps-Script/appsscript.json`, dan sesuaikan manifest di tab *Project Settings* (`manifest.json`) jika diperlukan.
5. Jalankan fungsi inisialisasi database satu kali:
   - Pilih fungsi `setupDatabaseSheets` pada dropdown toolbar di atas.
   - Klik tombol **Run / Jalankan**.
   - Berikan izin otorisasi Google Account saat diminta.
   - **Hasil:** 24 Sheet database SIMAGU beserta header kolomnya akan otomatis terbuat di Google Sheet Anda!

---

### Langkah 4: Deploy Apps Script sebagai Web App API
1. Pada editor Apps Script, klik tombol biru **Terapkan (Deploy)** di pojok kanan atas → **Penerapan Baru (New Deployment)**.
2. Klik ikon roda gigi (Select type) → pilih **Aplikasi Web (Web App)**.
3. Isi konfigurasi sebagai berikut:
   - **Deskripsi**: `SIMAGU Production API v3.0`
   - **Jalankan sebagai (Execute as)**: `Saya / Me (emailanda@gmail.com)`
   - **Siapa yang memiliki akses (Who has access)**: **`Siapa saja / Anyone`** *(Sangat Penting agar CMS dapat mengirim request)*
4. Klik **Terapkan (Deploy)**.
5. **SALIN URL APLIKASI WEB (Web App URL)** yang dihasilkan (berawalan `https://script.google.com/macros/s/.../exec`).

---

### Langkah 5: Hubungkan Web App URL ke SIMAGU CMS
1. Buka aplikasi SIMAGU di browser Anda.
2. Buka menu **Pengaturan** (ikon roda gigi di sidebar/header).
3. Masuk ke tab **Integrasi Google Workspace** / **Google Sheets Sync**.
4. Tempelkan (Paste) **Web App URL** yang telah Anda salin ke dalam kolom *Google Apps Script Web App URL*.
5. Klik **Simpan & Uji Koneksi**.
6. Fitur Sync & Backup Data Otomatis ke Google Sheets & Google Drive sekarang aktif sepenuhnya! 🎉

---

## ⚡ Fitur Utama Backend Google Apps Script (Code.gs)
- **Automatic Sheet Provisioning**: Fungsi `setupDatabaseSheets()` menginisialisasi 24 tab database lengkap dengan header kolom berformat khusus.
- **RESTful JSON API**: Menyediakan handler `doGet` dan `doPost` untuk sinkronisasi data 2 arah tanpa server tambahan.
- **Google Drive Photo Folder Sync**: Otomatis membuat folder `SIMAGU_DOKUMENTASI` dan subfolder kegiatan untuk bukti foto KBM.
- **WhatsApp Alert Notification**: Pengiriman sinyal notifikasi otomatis saat terjadi ketidakhadiran (Alpa) siswa di kelas.

---

## 📞 Dukungan & Lisensi
Hak Cipta © 2026 **SMKN Bojonggambir**. Dikembangkan untuk modernisasi tata kelola administrasi pendidikan dan transparansi KBM guru.

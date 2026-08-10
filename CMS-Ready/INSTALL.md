# 📋 Panduan Instalasi & Deployment Singkat SIMAGU CMS-Ready

Selamat! Anda telah mengunduh paket resmi **CMS-Ready.zip** untuk aplikasi **SIMAGU (Sistem Informasi Agenda Guru & Kelas - SMKN Bojonggambir)**.

---

## 📂 Isi Paket `CMS-Ready.zip`

1. **`CMS/`**  
   Seluruh source code frontend CMS berbasis React 18, Vite, TypeScript, Tailwind CSS, dan Lucide React. Siap diunggah ke GitHub & di-deploy ke Vercel/Netlify/Cloud Run.
2. **`Google-Apps-Script/`**  
   - `Code.gs`: Script utama Backend API & Otomasi Spreadsheet.
   - `appsscript.json`: Manifest konfigurasi Web App & zona waktu `Asia/Jakarta`.
3. **`Google-Sheet-Template/`**  
   `Struktur_Spreadsheet_SIMAGU.md`: Panduan template 24 sheet database, header kolom, dan rumus bawaan.
4. **`README.md` & `INSTALL.md`**  
   Dokumentasi teknis dan panduan pengoperasian.

---

## 🚀 Ringkasan Langkah Cepat (Quick Start)

### 1. Unggah CMS ke GitHub
```bash
cd CMS
git init
git add .
git commit -m "Initial Commit: SIMAGU CMS"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

### 2. Buat Google Sheet Database
- Buat Spreadsheet baru di Google Sheets.
- Beri nama: `DATABASE_SIMAGU_SMKN_BOJONGGAMBIR`.

### 3. Pasang Google Apps Script
- Buka **Ekstensi (Extensions) -> Apps Script** di Spreadsheet Anda.
- Salin seluruh isi file `Google-Apps-Script/Code.gs` dan paste ke editor Apps Script.
- Jalankan fungsi `setupDatabaseSheets()` satu kali untuk membuat 24 tab database beserta header kolom secara otomatis.

### 4. Deploy Web App API
- Klik **Deploy -> New Deployment -> Web App**.
- **Execute as**: `Me`
- **Who has access**: **`Anyone`** *(Wajib agar CMS dapat berkoneksi)*
- Klik **Deploy** dan salin **Web App URL**.

### 5. Hubungkan ke CMS
- Buka aplikasi SIMAGU -> **Pengaturan** -> **Google Sheets Sync**.
- Paste **Web App URL** lalu klik **Simpan & Uji Koneksi**.
- Aplikasi kini siap 100% digunakan! 🎉

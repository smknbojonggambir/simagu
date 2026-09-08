# SIMAGU - Sistem Informasi Agenda Guru & Kelas
### SMK Negeri Bojonggambir

Sistem Informasi Manajemen Agenda Harian Guru dan Agenda Kelas digital terpadu untuk SMKN Bojonggambir. Dilengkapi dengan manajemen jadwal pelajaran, absensi harian & rekapitulasi bulanan, materi & tugas, monitoring supervisi akademik, input nilai berbasis bobot, pelaporan KBM, ekspor format resmi Excel/PDF/Cetak, serta sinkronisasi Google Sheets & Google Apps Script (GAS).

---

## 🚀 Fitur Utama

- **Dashboard Real-time**: Ringkasan statistik kehadiran siswa & guru, status KBM hari ini, agenda aktif, serta grafik kehadiran.
- **Agenda Harian Guru**: Pencatatan KBM lengkap sesuai Kurikulum Merdeka (tujuan pembelajaran, materi ajar, asesmen, rincian kehadiran, bukti foto & tanda tangan digital).
- **Agenda Kelas**: Buku harian kelas per rombel terintegrasi dengan data KBM dan absensi siswa harian.
- **Jadwal Pelajaran**: Penjadwalan interaktif seluruh rombel (X DKV 1, X DKV 2, X APHP, XI DKV, XI APHP, XII APHP).
- **Absensi & Rekapitulasi**: Presensi per jam pelajaran dan rekap bulanan otomatis berstandar dinas pendidikan.
- **Input Nilai**: Penilaian formatif, sumatif, dan nilai akhir berbasis bobot persentase.
- **Supervisi & Monitoring**: Evaluasi akademik guru oleh Kepala Sekolah / Pengawas dengan instrumen baku.
- **Ekspor & Cetak**: Format cetak dinas, ekspor spreadsheet (.xlsx), serta ekspor PDF berlogo sekolah.
- **Google Sheets / Apps Script Integration**: Template skrip otomatis untuk sinkronisasi cloud spreadsheet dua arah.

---

## 💻 Menjalankan Aplikasi Secara Lokal

### Prasyarat
- Node.js versi 18 atau 20+
- npm atau bun

### Langkah-langkah
1. **Clone repositori:**
   ```bash
   git clone https://github.com/smknbojonggambir/simagu.git
   cd simagu
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan server development:**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

4. **Build untuk produksi:**
   ```bash
   npm run build
   ```

---

## 🌐 Deploy Otomatis (GitHub Pages)

Repositori ini telah dikonfigurasi dengan GitHub Actions di `.github/workflows/deploy.yml`:
1. Setiap push ke branch `main` akan otomatis memicu build dan deploy ke **GitHub Pages**.
2. Pastikan pengaturan GitHub Pages di repositori aktif:
   - Masuk ke **Settings** > **Pages**
   - Di bagian **Source**, pilih **GitHub Actions**
3. Aplikasi akan otomatis live di URL GitHub Pages repositori:
   `https://smknbojonggambir.github.io/simagu/`

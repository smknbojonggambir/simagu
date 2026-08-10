# Template Google Sheets Database - SIMAGU SMKN Bojonggambir

Dokumen ini berisi panduan lengkap struktur 24 Lembar Kerja (Sheet), nama header kolom, jenis data, serta rumus yang siap diimpor ke Spreadsheet baru.

---

## Daftar Sheet Database (24 Worksheets)

1. `Dashboard` - Ringkasan Eksekutif & Widget KPI Realtime
2. `Guru` - Master Data Pendidik (NIP, Nama, Mapel, Status)
3. `Siswa` - Master Data Peserta Didik (NISN, NIS, Kelas, Ortu)
4. `Kelas` - Master Data Rombongan Belajar & Wali Kelas
5. `Jurusan` - Master Data Program/Konsentrasi Keahlian SMK
6. `Mapel` - Master Data Mata Pelajaran (Fase E/F Kurikulum Merdeka)
7. `Jadwal` - Master Data Jadwal Pelajaran Mingguan
8. `Agenda_Guru` - Log Pelaksanaan KBM Harian Guru (35 Kolom Header)
9. `Agenda_Kelas` - Rekapitulasi Presensi & Jurnal Kelas Harian (23 Kolom Header)
10. `Absensi_Guru` - Record Kehadiran & Jam Masuk/Pulang Pendidik
11. `Absensi_Siswa` - Record Detail Presensi Harian Siswa (H/S/I/A/T)
12. `Materi` - Bank Materi Pembelajaran & Bahan Ajar Digital
13. `Tugas` - Penugasan Siswa, Tenggat Waktu & Pengumpulan
14. `Nilai` - Format Penilaian Formatif & Sumatif
15. `Prestasi` - Catatan Prestasi Akademik & Non-Akademik Siswa
16. `Pelanggaran` - Point Disiplin & Catatan Bimbingan Konseling (BK)
17. `Inventaris` - Sarana Prasarana & Media Pembelajaran Ruang Kelas
18. `Komunikasi_Ortu` - Buku Penghubung & Notifikasi WA Orang Tua
19. `Dokumentasi` - Link Foto Bukti Fisik Pembelajaran & Dokumentasi
20. `Supervisi` - Hasil Supervisi Akademik & Observasi Kelas oleh Kepsek/Senior
21. `Pengguna` - Pengaturan Akun, Role (Admin/Guru/Kepsek), Passcode
22. `Setting` - Konfigurasi Nama Sekolah, Tahun Ajaran, Logo & Google Drive Folder
23. `Log_Aktivitas` - Trail Audit System (Waktu, Action, User, IP)
24. `Statistik` - Formulas Agregasi Otomatis Kehadiran & KBM Mingguan

---

## Detail Header & Struktur Kolom Utama

### 1. Sheet `Agenda_Guru` (35 Kolom)
```text
A: ID
B: No Agenda
C: Tahun Pelajaran
D: Semester
E: Hari
F: Tanggal
G: Nama Guru
H: NIP
I: Mata Pelajaran
J: Fase
K: Kelas
L: Jam Ke
M: Jumlah JP
N: Elemen
O: CP (Capaian Pembelajaran)
P: ATP (Alur Tujuan Pembelajaran)
Q: Tujuan Pembelajaran
R: Materi
S: Model Pembelajaran
T: Metode
U: Status Pembelajaran
V: Total Siswa
W: Hadir
X: Sakit
Y: Izin
Z: Alpa
AA: Terlambat
AB: Persentase Kehadiran
AC: Siswa Tidak Hadir Detail (JSON)
AD: Kendala
AE: Solusi
AF: Refleksi
AG: Foto URLs
AH: Status Validasi
AI: Tanggal Validasi
```

### 2. Sheet `Agenda_Kelas` (23 Kolom)
```text
A: ID
B: No Agenda
C: Tahun Pelajaran
D: Semester
E: Hari
F: Tanggal
G: Kelas
H: Jurusan
I: Wali Kelas
J: Ketua Kelas
K: Jumlah Siswa
L: Hadir
M: Sakit
N: Izin
O: Alpa
P: Terlambat
Q: % Kehadiran
R: Monitoring Pembelajaran (JSON)
S: Pelanggaran Detail (JSON)
T: Prestasi Detail (JSON)
U: Kondisi Umum Kelas
V: Tindak Lanjut Wali
W: Validated By Wali
```

### 3. Sheet `Guru` (11 Kolom)
```text
A: ID | B: NIP | C: Nama Lengkap | D: Gelar Depan | E: Gelar Belakang | F: JK | G: Mapel Utama | H: Tugas Tambahan | I: Email | J: No HP/WA | K: Status
```

### 4. Sheet `Siswa` (9 Kolom)
```text
A: ID | B: NISN | C: NIS | D: Nama Lengkap | E: JK | F: Kelas | G: Jurusan | H: No HP Ortu | I: Status
```

---

## Rumus spreadsheet bawaan (Formulas)

1. **Hitung Persentase Kehadiran (Di Sheet Agenda_Guru Kolom AB):**
   `=IF(V2>0, (W2/V2)*100, 0)`

2. **Hitung Total Alpa Perminggu (Di Sheet Statistik):**
   `=SUMIF(Agenda_Guru!E:E, "Senin", Agenda_Guru!Z:Z)`

3. **Status Validasi Otomatis (Di Sheet Agenda_Guru Kolom AH):**
   `=IF(ISBLANK(AI2), "Menunggu Validasi Kepsek", "Disetujui")`

---

## Cara Inisialisasi Otomatis via Apps Script
Cukup buka **Extensions -> Apps Script** pada Spreadsheet baru Anda, paste `Code.gs`, lalu jalankan fungsi `setupDatabaseSheets()`. Seluruh 24 sheet beserta header akan otomatis terbuat!

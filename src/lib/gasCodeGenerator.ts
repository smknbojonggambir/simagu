export function generateGoogleAppsScriptCode(): string {
  return `/**
 * ==============================================================================
 * SIMAGU - Sistem Informasi Agenda Guru & Agenda Kelas (SMK Edition)
 * BACKEND GOOGLE APPS SCRIPT (Code.gs)
 * ==============================================================================
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets Anda -> Ekstensi -> Apps Script.
 * 2. Hapus seluruh isi Code.gs awal, lalu tempelkan (paste) kode ini.
 * 3. Jalankan fungsi 'setupDatabaseSheets()' satu kali untuk membuat seluruh Sheet otomatis.
 * 4. Klik 'Terapkan' (Deploy) -> 'Menerapkan sebagai Aplikasi Web' (New Deployment).
 * 5. Pilih Akses: 'Siapa Saja' (Anyone).
 * 6. Salin Web App URL dan tempelkan ke Pengaturan SIMAGU di aplikasi ini.
 * ==============================================================================
 */

// Global Sheet Configuration
const SHEET_NAMES = [
  "Dashboard", "Guru", "Siswa", "Kelas", "Jurusan", "Mapel", "Jadwal",
  "Agenda_Guru", "Agenda_Kelas", "Supervisi", "Materi",
  "Tugas", "Nilai", "Setting", "Log_Aktivitas"
];

/**
 * Inisialisasi Otomatis Database SIMAGU
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  SHEET_NAMES.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
  });

  SpreadsheetApp.getUi().alert("✅ Berhasil! Seluruh Sheet Database SIMAGU (Dashboard, Guru, Siswa, Kelas, Jurusan, Mapel, Jadwal, dll) telah dikonfigurasi.");
}

/**
 * Web App Endpoint GET Handler
 */
function doGet(e) {
  const action = e.parameter ? e.parameter.action : "getDashboard";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let result = { status: "success", data: [] };

  try {
    if (action === "getAgendaGuru") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Agenda_Guru"));
    } else if (action === "getAgendaKelas") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Agenda_Kelas"));
    } else if (action === "getSiswa") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Siswa"));
    } else if (action === "getGuru") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Guru"));
    } else if (action === "getKelas") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Kelas"));
    } else if (action === "getJurusan") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Jurusan"));
    } else if (action === "getMapel") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Mapel"));
    } else if (action === "getJadwal") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Jadwal"));
    } else {
      result.message = "SIMAGU API Web App Active - Ready to Sync Data";
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web App Endpoint POST Handler (Sinkronisasi & Simpan Data)
 */
function doPost(e) {
  let response = { status: "success" };
  
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const data = contents.data || contents || {};

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "syncAllData" || action === "syncAll") {
      // 1. Dashboard Sheet
      updateSheetData(ss, "Dashboard", formatDashboardData(data));

      // 2. Guru Sheet
      updateSheetData(ss, "Guru", formatGuruData(data.guruList || data.guru));

      // 3. Siswa Sheet
      updateSheetData(ss, "Siswa", formatSiswaData(data.siswaList || data.siswa));

      // 4. Kelas Sheet
      updateSheetData(ss, "Kelas", formatKelasData(data.kelasList || data.kelas));

      // 5. Jurusan Sheet
      updateSheetData(ss, "Jurusan", formatJurusanData(data.jurusanList || data.jurusan));

      // 6. Mapel Sheet
      updateSheetData(ss, "Mapel", formatMapelData(data.mapelList || data.mapel));

      // 7. Jadwal Sheet
      updateSheetData(ss, "Jadwal", formatJadwalData(data.jadwalList || data.jadwal));

      // 8. Agenda Guru Sheet
      updateSheetData(ss, "Agenda_Guru", formatAgendaGuruData(data.agendaGuruList || data.agendaGuru));

      // 9. Agenda Kelas Sheet
      updateSheetData(ss, "Agenda_Kelas", formatAgendaKelasData(data.agendaKelasList || data.agendaKelas));

      // 10. Supervisi Sheet
      updateSheetData(ss, "Supervisi", formatSupervisiData(data.supervisiList || data.supervisi));

      // 11. Materi Sheet
      updateSheetData(ss, "Materi", formatMateriData(data.materiList || data.materi));

      // 12. Tugas Sheet
      updateSheetData(ss, "Tugas", formatTugasData(data.tugasList || data.tugas));

      // 13. Nilai Sheet
      updateSheetData(ss, "Nilai", formatNilaiData(data.nilaiSiswaList || data.nilai));

      // 14. Setting Sheet
      updateSheetData(ss, "Setting", formatSettingData(data.setting));

      // 15. Log Aktivitas Sheet
      updateSheetData(ss, "Log_Aktivitas", formatLogData(data.auditLogList || data.logAktivitas));

      response.message = "✅ Berhasil menyingkronkan seluruh data SIMAGU (Dashboard, Guru, Siswa, Kelas, Jurusan, Mapel, Jadwal, dll) ke Google Sheet!";
    } else {
      response.message = "Action " + action + " diterima.";
    }
  } catch (err) {
    response = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper: Bersihkan & Timpa Data Sheet
 */
function updateSheetData(ss, sheetName, rows) {
  if (!rows || rows.length === 0) return;
  
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear();
  }

  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sheet.getRange(1, 1, 1, rows[0].length).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
}

// Formatters
function formatDashboardData(d) {
  d = d || {};
  const setting = d.setting || {};
  const agendaGuruList = Array.isArray(d.agendaGuruList) ? d.agendaGuruList : [];
  const agendaKelasList = Array.isArray(d.agendaKelasList) ? d.agendaKelasList : [];
  const supervisiList = Array.isArray(d.supervisiList) ? d.supervisiList : [];
  const guruList = Array.isArray(d.guruList) ? d.guruList : [];
  const siswaList = Array.isArray(d.siswaList) ? d.siswaList : [];
  const kelasList = Array.isArray(d.kelasList) ? d.kelasList : [];
  const jurusanList = Array.isArray(d.jurusanList) ? d.jurusanList : [];
  const mapelList = Array.isArray(d.mapelList) ? d.mapelList : [];
  const jadwalList = Array.isArray(d.jadwalList) ? d.jadwalList : [];
  const materiList = Array.isArray(d.materiList) ? d.materiList : [];
  const tugasList = Array.isArray(d.tugasList) ? d.tugasList : [];
  const nilaiSiswaList = Array.isArray(d.nilaiSiswaList) ? d.nilaiSiswaList : [];

  const totalAgendaGuru = agendaGuruList.length;
  const totalAgendaKelas = agendaKelasList.length;
  const totalJp = agendaGuruList.reduce((acc, curr) => acc + (curr.jumlahJP || 0), 0);
  
  return [
    ["METRIK RINGKASAN SIMAGU", "NILAI / KETERANGAN"],
    ["Nama Sekolah", setting.namaSekolah || "SMK NEGERI BOJONGGAMBIR"],
    ["NPSN", setting.npsn || "69989796"],
    ["Kepala Sekolah", setting.kepalaSekolah || "Drs. Aa Mansur, M.Pd."],
    ["Tahun Pelajaran / Semester", (setting.tahunPelajaran || "2026/2027") + " - " + (setting.semester || "Ganjil")],
    ["Total Agenda Guru", totalAgendaGuru],
    ["Total Jam Pelajaran (JP)", totalJp + " JP"],
    ["Total Agenda Kelas", totalAgendaKelas],
    ["Total Supervisi Guru", supervisiList.length],
    ["Total Data Guru / PTK", guruList.length],
    ["Total Data Siswa", siswaList.length],
    ["Total Rombongan Belajar (Kelas)", kelasList.length],
    ["Total Program Keahlian (Jurusan)", jurusanList.length],
    ["Total Mata Pelajaran", mapelList.length],
    ["Total Jadwal Pelajaran", jadwalList.length],
    ["Total Materi Pembelajaran", materiList.length],
    ["Total Tugas Siswa", tugasList.length],
    ["Total Input Nilai", nilaiSiswaList.length],
    ["Waktu Waktu Sinkronisasi", new Date().toLocaleString("id-ID")]
  ];
}

function formatGuruData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "Kode Guru", "NIP", "NUPTK", "Nama Guru / PTK", "Jabatan", "Mapel Utama", "Status"];
  const rows = safeList.map((g, idx) => [
    idx + 1, g.kodeGuru || "-", g.nip || "-", g.nuptk || "-", g.nama || "-", g.jabatan || "-", g.mapelUtama || "-", g.status || "Aktif"
  ]);
  return [header, ...rows];
}

function formatSiswaData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "NIS", "NISN", "Nama Siswa", "Jenis Kelamin", "Kelas", "Jurusan", "Status"];
  const rows = safeList.map((s, idx) => [
    idx + 1, s.nis || "-", s.nisn || "-", s.nama || "-", s.gender || "-", s.kelas || "-", s.jurusan || "-", s.status || "Aktif"
  ]);
  return [header, ...rows];
}

function formatKelasData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "Nama Kelas", "Tingkat", "Jurusan", "Wali Kelas", "Ketua Kelas", "Jumlah Siswa", "Ruang"];
  const rows = safeList.map((k, idx) => [
    idx + 1, k.namaKelas || "-", k.tingkat || "-", k.jurusan || "-", k.waliKelas || "-", k.ketuaKelas || "-", k.jumlahSiswa || 0, k.ruang || "-"
  ]);
  return [header, ...rows];
}

function formatJurusanData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "Kode Jurusan", "Nama Program Keahlian / Jurusan", "Kepala Jurusan"];
  const rows = safeList.map((j, idx) => [
    idx + 1, j.kodeJurusan || "-", j.namaJurusan || "-", j.kepalaJurusan || "-"
  ]);
  return [header, ...rows];
}

function formatMapelData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "Kode Mapel", "Nama Mata Pelajaran", "Kelompok", "Jam / Minggu"];
  const rows = safeList.map((m, idx) => [
    idx + 1, m.kodeMapel || "-", m.namaMapel || "-", m.kelompok || "Kejuruan", m.jamPerMinggu || 2
  ]);
  return [header, ...rows];
}

function formatJadwalData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "Hari", "Jam Ke", "Waktu Mulai", "Waktu Selesai", "Kelas", "Mata Pelajaran", "Guru / Kode", "Ruang"];
  const rows = safeList.map((j, idx) => [
    idx + 1, j.hari || "-", j.jamKe || "-", j.jamMulai || "-", j.jamSelesai || "-", j.kelas || "-", j.mapel || "-", j.namaGuru || j.kodeGuru || "-", j.ruang || "-"
  ]);
  return [header, ...rows];
}

function formatAgendaGuruData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "No Agenda", "Tahun Pelajaran", "Semester", "Hari", "Tanggal", "Nama Guru", "NIP", "Mapel", "Fase", "Kelas", "Jam Ke", "Jumlah JP", "Materi", "Model Pembelajaran", "Status Pembelajaran", "Hadir", "Sakit", "Izin", "Alpa", "% Kehadiran", "Kendala", "Solusi", "Status Validasi"];
  const rows = safeList.map((a, idx) => [
    idx + 1, a.nomorAgenda || "-", a.tahunPelajaran || "-", a.semester || "-", a.hari || "-", a.tanggal || "-", a.namaGuru || "-", a.nip || "-", a.mapel || "-", a.fase || "-", a.kelas || "-", a.jamKe || "-", a.jumlahJP || 0, a.materi || "-", a.modelPembelajaran || "-", a.statusPembelajaran || "-", a.hadir || 0, a.sakit || 0, a.izin || 0, a.alpa || 0, (a.persentaseKehadiran || 100) + "%", a.kendala || "-", a.solusi || "-", a.statusValidasi || "Proses"
  ]);
  return [header, ...rows];
}

function formatAgendaKelasData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "No Agenda", "Hari", "Tanggal", "Kelas", "Jurusan", "Wali Kelas", "Ketua Kelas", "Total Siswa", "Hadir", "Sakit", "Izin", "Alpa", "% Kehadiran", "Kondisi Umum", "Validasi Wali"];
  const rows = safeList.map((a, idx) => [
    idx + 1, a.nomorAgenda || "-", a.hari || "-", a.tanggal || "-", a.kelas || "-", a.jurusan || "-", a.waliKelas || "-", a.ketuaKelas || "-", a.jumlahSiswa || 0, a.hadir || 0, a.sakit || 0, a.izin || 0, a.alpa || 0, (a.persentase || 100) + "%", a.catatanWaliKelas ? a.catatanWaliKelas.kondisiUmum : "-", a.validatedByWali ? "Valid" : "Pending"
  ]);
  return [header, ...rows];
}

function formatSupervisiData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "No Supervisi", "Tanggal", "Nama Guru", "NIP", "Mata Pelajaran", "Kelas", "Supervisor", "Skor Perencanaan", "Skor Pelaksanaan", "Skor Evaluasi", "Skor Akhir", "Predikat", "Status"];
  const rows = safeList.map((s, idx) => [
    idx + 1, s.nomorSupervisi || "-", s.tanggal || "-", s.namaGuru || "-", s.nip || "-", s.mapel || "-", s.kelas || "-", s.supervisor || "-", s.skorPerencanaan || 0, s.skorPelaksanaan || 0, s.skorEvaluasi || 0, s.skorAkhir || 0, s.predikat || "-", s.status || "-"
  ]);
  return [header, ...rows];
}

function formatMateriData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "Tanggal", "Judul Materi", "Mata Pelajaran", "Kelas", "Guru", "Ringkasan", "Tautan Drive / File"];
  const rows = safeList.map((m, idx) => [
    idx + 1, m.tanggal || "-", m.judulMateri || "-", m.mapel || "-", m.kelas || "-", m.namaGuru || "-", m.ringkasan || "-", m.fileUrl || "-"
  ]);
  return [header, ...rows];
}

function formatTugasData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "Tanggal Diberikan", "Judul Tugas", "Mata Pelajaran", "Kelas", "Guru", "Deadline", "Instruksi / Deskripsi"];
  const rows = safeList.map((t, idx) => [
    idx + 1, t.tanggal || "-", t.judulTugas || "-", t.mapel || "-", t.kelas || "-", t.namaGuru || "-", t.deadline || "-", t.deskripsi || "-"
  ]);
  return [header, ...rows];
}

function formatNilaiData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "NIS", "Nama Siswa", "Kelas", "Mata Pelajaran", "Jenis Evaluasi", "Nilai", "Keterangan"];
  const rows = safeList.map((n, idx) => [
    idx + 1, n.nis || "-", n.namaSiswa || "-", n.kelas || "-", n.mapel || "-", n.jenisEvaluasi || "UH", n.nilai || 0, n.keterangan || "-"
  ]);
  return [header, ...rows];
}

function formatSettingData(setting) {
  setting = setting || {};
  return [
    ["PARAMETER PENGATURAN", "NILAI KONFIGURASI"],
    ["Nama Sekolah", setting.namaSekolah || "SMK NEGERI BOJONGGAMBIR"],
    ["NPSN", setting.npsn || "69989796"],
    ["NSS", setting.nss || "401021208001"],
    ["Alamat Sekolah", setting.alamatSekolah || "Jl. Raya Bojonggambir, Kab. Tasikmalaya"],
    ["Kepala Sekolah", setting.kepalaSekolah || "Drs. Aa Mansur, M.Pd."],
    ["NIP Kepala Sekolah", setting.nipKepalaSekolah || "196803151994031008"],
    ["Tahun Pelajaran", setting.tahunPelajaran || "2026/2027"],
    ["Semester Aktif", setting.semester || "Ganjil"],
    ["Kota / Kabupaten", setting.kotaKabupaten || "Tasikmalaya"],
    ["Aplikasi", "SIMAGU - Sistem Informasi Agenda Guru & Kelas"]
  ];
}

function formatLogData(list) {
  const safeList = Array.isArray(list) ? list : [];
  const header = ["No", "Timestamp", "Pengguna", "Peran", "Aktivitas", "Rincian", "IP Address"];
  const rows = safeList.map((log, idx) => [
    idx + 1, log.timestamp || "-", log.user || "-", log.role || "-", log.action || "-", log.details || "-", log.ipAddress || "127.0.0.1"
  ]);
  return [header, ...rows];
}

/**
 * Helper: Ambil data Sheet sebagai Array JSON
 */
function getSheetDataAsJson(sheet) {
  if (!sheet || sheet.getLastRow() <= 1) return [];
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}
`;
}


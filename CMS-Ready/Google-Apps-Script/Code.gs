/**
 * ==============================================================================
 * SIMAGU - Sistem Informasi Agenda Guru & Agenda Kelas (SMK Edition)
 * BACKEND GOOGLE APPS SCRIPT (Code.gs)
 * ==============================================================================
 * Organization: SMKN Bojonggambir
 * Version: 3.0.0
 * Description: Backend API & Automation Engine for SIMAGU CMS
 * ==============================================================================
 */

// Global Sheet Configuration (24 Database Sheets)
const SHEET_NAMES = [
  "Dashboard", "Guru", "Siswa", "Kelas", "Jurusan", "Mapel", "Jadwal",
  "Agenda_Guru", "Agenda_Kelas", "Absensi_Guru", "Absensi_Siswa", "Materi",
  "Tugas", "Nilai", "Prestasi", "Pelanggaran", "Inventaris", "Komunikasi_Ortu",
  "Dokumentasi", "Supervisi", "Pengguna", "Setting", "Log_Aktivitas", "Statistik"
];

/**
 * Inisialisasi Otomatis 24 Sheet Database SIMAGU beserta Header Kolom
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  SHEET_NAMES.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
  });

  // Setup Header Kolom untuk Agenda_Guru
  const sheetAG = ss.getSheetByName("Agenda_Guru");
  if (sheetAG.getLastRow() === 0) {
    sheetAG.appendRow([
      "ID", "No Agenda", "Tahun Pelajaran", "Semester", "Hari", "Tanggal",
      "Nama Guru", "NIP", "Mata Pelajaran", "Fase", "Kelas", "Jam Ke",
      "Jumlah JP", "Elemen", "CP", "ATP", "Tujuan Pembelajaran", "Materi",
      "Model Pembelajaran", "Metode", "Status Pembelajaran", "Total Siswa",
      "Hadir", "Sakit", "Izin", "Alpa", "Terlambat", "Persentase Kehadiran",
      "Siswa Tidak Hadir Detail", "Kendala", "Solusi", "Refleksi", "Foto URLs",
      "Status Validasi", "Tanggal Validasi"
    ]);
    sheetAG.getRange(1, 1, 1, 35).setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  }

  // Setup Header Kolom untuk Agenda_Kelas
  const sheetAK = ss.getSheetByName("Agenda_Kelas");
  if (sheetAK.getLastRow() === 0) {
    sheetAK.appendRow([
      "ID", "No Agenda", "Tahun Pelajaran", "Semester", "Hari", "Tanggal",
      "Kelas", "Jurusan", "Wali Kelas", "Ketua Kelas", "Jumlah Siswa",
      "Hadir", "Sakit", "Izin", "Alpa", "Terlambat", "% Kehadiran",
      "Monitoring Pembelajaran", "Pelanggaran Detail", "Prestasi Detail",
      "Kondisi Umum Kelas", "Tindak Lanjut Wali", "Validated By Wali"
    ]);
    sheetAK.getRange(1, 1, 1, 23).setFontWeight("bold").setBackground("#0f766e").setFontColor("#ffffff");
  }

  // Setup Header Kolom untuk Guru
  const sheetGuru = ss.getSheetByName("Guru");
  if (sheetGuru.getLastRow() === 0) {
    sheetGuru.appendRow([
      "ID", "NIP", "Nama Lengkap", "Gelar Depan", "Gelar Belakang", "JK",
      "Mata Pelajaran Utama", "Tugas Tambahan", "Email", "No HP / WA", "Status Kepegawaian"
    ]);
    sheetGuru.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");
  }

  // Setup Header Kolom untuk Siswa
  const sheetSiswa = ss.getSheetByName("Siswa");
  if (sheetSiswa.getLastRow() === 0) {
    sheetSiswa.appendRow([
      "ID", "NISN", "NIS", "Nama Lengkap", "JK", "Kelas", "Jurusan", "No HP Ortu", "Status"
    ]);
    sheetSiswa.getRange(1, 1, 1, 9).setFontWeight("bold").setBackground("#0284c7").setFontColor("#ffffff");
  }

  SpreadsheetApp.getUi().alert("✅ Berhasil! 24 Sheet Database SIMAGU telah dikonfigurasi.");
}

/**
 * Web App Endpoint GET Handler
 */
function doGet(e) {
  const action = e ? (e.parameter.action || "getDashboard") : "getDashboard";
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
    } else if (action === "getSupervisi") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Supervisi"));
    } else if (action === "getMateri") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Materi"));
    } else if (action === "getTugas") {
      result.data = getSheetDataAsJson(ss.getSheetByName("Tugas"));
    } else {
      result.message = "SIMAGU API Web App Active & Ready";
      result.sheets = SHEET_NAMES;
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Web App Endpoint POST Handler (Simpan/Update Data)
 */
function doPost(e) {
  let response = { status: "success" };
  
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const data = contents.data;

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "saveAgendaGuru") {
      const sheet = ss.getSheetByName("Agenda_Guru");
      sheet.appendRow([
        data.id, data.nomorAgenda, data.tahunPelajaran, data.semester, data.hari, data.tanggal,
        data.namaGuru, data.nip, data.mapel, data.fase, data.kelas, data.jamKe,
        data.jumlahJP, data.elemen, data.cp, data.atp, data.tujuanPembelajaran, data.materi,
        data.modelPembelajaran, data.metode, data.statusPembelajaran, data.totalSiswa,
        data.hadir, data.sakit, data.izin, data.alpa, data.terlambat, data.persentaseKehadiran,
        JSON.stringify(data.siswaTidakHadir || []), data.kendala, data.solusi, data.refleksi,
        (data.fotoUrls || []).join(", "), data.statusValidasi, data.tanggalValidasi || ""
      ]);

      if (data.fotoUrls && data.fotoUrls.length > 0) {
        saveDocumentToDrive(data.nomorAgenda, data.fotoUrls);
      }

      if (data.alpa > 0) {
        sendWAAlert(data.kelas, data.alpa, data.siswaTidakHadir);
      }

      response.message = "Agenda Guru Berhasil Disimpan ke Google Sheets";
    } else if (action === "saveAgendaKelas") {
      const sheet = ss.getSheetByName("Agenda_Kelas");
      sheet.appendRow([
        data.id, data.nomorAgenda, data.tahunPelajaran, data.semester, data.hari, data.tanggal,
        data.kelas, data.jurusan, data.waliKelas, data.ketuaKelas, data.jumlahSiswa,
        data.hadir, data.sakit, data.izin, data.alpa, data.terlambat, data.persentase,
        JSON.stringify(data.monitoringPembelajaran || []),
        JSON.stringify(data.pelanggaranList || []),
        JSON.stringify(data.prestasiList || []),
        data.catatanWaliKelas ? data.catatanWaliKelas.kondisiUmum : "",
        data.catatanWaliKelas ? data.catatanWaliKelas.tindakLanjut : "",
        data.validatedByWali ? "Ya" : "Tidak"
      ]);
      response.message = "Agenda Kelas Berhasil Disimpan ke Google Sheets";
    }
  } catch (err) {
    response = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
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

/**
 * Helper: Integrasi Google Drive Folder SIMAGU
 */
function saveDocumentToDrive(folderName, files) {
  try {
    const parentFolders = DriveApp.getFoldersByName("SIMAGU_DOKUMENTASI");
    let parentFolder;
    if (parentFolders.hasNext()) {
      parentFolder = parentFolders.next();
    } else {
      parentFolder = DriveApp.createFolder("SIMAGU_DOKUMENTASI");
    }

    const subFolder = parentFolder.createFolder("AGENDA_" + folderName.replace(/\//g, "_"));
    Logger.log("Folder Drive Terbuat: " + subFolder.getUrl());
  } catch (e) {
    Logger.log("Error Drive: " + e.toString());
  }
}

/**
 * Helper: WA Alert Trigger Simulator
 */
function sendWAAlert(kelas, jumlahAlpa, siswaList) {
  Logger.log("🚨 ALERT WA UNTUK WALI KELAS " + kelas + ": " + jumlahAlpa + " siswa Alpa.");
}

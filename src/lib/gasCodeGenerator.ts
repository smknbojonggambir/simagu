export function generateGoogleAppsScriptCode(): string {
  return `/**
 * ==============================================================================
 * SIMAGU - Sistem Informasi Agenda Guru & Agenda Kelas (SMK Edition)
 * BACKEND GOOGLE APPS SCRIPT (Code.gs)
 * ==============================================================================
 * Petunjuk Instalasi:
 * 1. Buka Google Sheets Anda -> Ekstensi -> Apps Script.
 * 2. Hapus seluruh isi Code.gs awal, lalu tempelkan (paste) kode ini.
 * 3. Jalankan fungsi 'setupDatabaseSheets()' satu kali untuk membuat 24 Sheet otomatis.
 * 4. Klik 'Terapkan' (Deploy) -> 'Menerapkan sebagai Aplikasi Web' (New Deployment).
 * 5. Pilih Akses: 'Siapa Saja' (Anyone).
 * 6. Salin Web App URL dan tempelkan ke Pengaturan SIMAGU di aplikasi ini.
 * ==============================================================================
 */

// Global Sheet Configuration
const SHEET_NAMES = [
  "Dashboard", "Guru", "Siswa", "Kelas", "Jurusan", "Mapel", "Jadwal",
  "Agenda_Guru", "Agenda_Kelas", "Absensi_Guru", "Absensi_Siswa", "Materi",
  "Tugas", "Nilai", "Prestasi", "Pelanggaran", "Inventaris", "Komunikasi_Ortu",
  "Dokumentasi", "Supervisi", "Pengguna", "Setting", "Log_Aktivitas"
];

/**
 * Inisialisasi Otomatis 24 Sheet Database SIMAGU
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

  SpreadsheetApp.getUi().alert("✅ Berhasil! 24 Sheet Database SIMAGU telah dikonfigurasi.");
}

/**
 * Web App Endpoint GET Handler
 */
function doGet(e) {
  const action = e.parameter.action || "getDashboard";
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
    } else {
      result.message = "SIMAGU API Web App Active";
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

      // Kirim Notifikasi Google Drive / Folder Dokumentasi
      if (data.fotoUrls && data.fotoUrls.length > 0) {
        saveDocumentToDrive(data.nomorAgenda, data.fotoUrls);
      }

      // Kirim Notifikasi WA jika ada siswa Alpa
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
    } else if (action === "saveNilai" || action === "saveBulkNilai") {
      const sheet = ss.getSheetByName("Nilai") || ss.getSheetByName("Input_Nilai_Siswa");
      const list = Array.isArray(data) ? data : [data];
      list.forEach(n => {
        sheet.appendRow([
          n.id, n.hari, n.tanggal, n.nis, n.namaSiswa, n.kelas, n.mapel, n.guru,
          n.jenisAsesmen || n.jenisEvaluasi, n.materiJudul, n.nilaiFormatif, n.nilaiPraktik,
          n.nilaiAkhir, n.predikat, n.statusKelulusan, n.catatanGuru
        ]);
      });
      response.message = list.length + " Nilai Siswa Berhasil Disimpan ke Google Sheets";
    } else if (action === "syncAllData") {
      const d = data || {};
      // Update Nilai Sheet
      if (d.nilaiSiswaList && Array.isArray(d.nilaiSiswaList)) {
        let sheetNilai = ss.getSheetByName("Nilai") || ss.getSheetByName("Input_Nilai_Siswa");
        if (sheetNilai) {
          sheetNilai.clear();
          sheetNilai.appendRow([
            "ID", "Hari", "Tanggal", "NIS", "Nama Siswa", "Kelas", "Mata Pelajaran", "Guru Pengampu",
            "Jenis Asesmen", "Materi / Evaluasi", "Nilai Formatif", "Nilai Praktik", "Nilai Akhir",
            "Predikat", "Status Kelulusan", "Catatan Guru"
          ]);
          d.nilaiSiswaList.forEach(n => {
            sheetNilai.appendRow([
              n.id, n.hari, n.tanggal, n.nis, n.namaSiswa, n.kelas, n.mapel, n.guru,
              n.jenisAsesmen || n.jenisEvaluasi, n.materiJudul, n.nilaiFormatif, n.nilaiPraktik,
              n.nilaiAkhir, n.predikat, n.statusKelulusan, n.catatanGuru
            ]);
          });
        }
      }
      response.message = "Sinkronisasi seluruh data (termasuk Nilai Siswa) ke Google Sheets Berhasil!";
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

    const subFolder = parentFolder.createFolder("AGENDA_" + folderName.replace(/\\//g, "_"));
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
`;
}

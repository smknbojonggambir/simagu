import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { google } from "googleapis";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "SIMAGU - Sistem Informasi Agenda Guru & Agenda Kelas SMK",
      timestamp: new Date().toISOString()
    });
  });

  // Server-side proxy for Google Sheets API v4 (Bypasses Browser CORS / Failed to Fetch)
  app.post("/api/sheets/sync-direct", async (req, res) => {
    try {
      const { spreadsheetId, accessToken, data, setting } = req.body;

      if (!spreadsheetId) {
        return res.status(400).json({ success: false, message: "Spreadsheet ID wajib diisi" });
      }

      if (!accessToken) {
        return res.status(400).json({ success: false, message: "Access Token Google wajib diisi" });
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const sheets = google.sheets({ version: "v4", auth });

      // 1. Ensure sheets exist
      const metaRes = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets.properties.title"
      });

      const existingTitles = (metaRes.data.sheets || []).map(s => s.properties?.title || "");
      const requiredTitles = [
        'Ringkasan_SIMAGU',
        'Agenda_Guru',
        'Agenda_Kelas',
        'Supervisi_Guru',
        'Data_Guru',
        'Data_Siswa',
        'Data_Siswa_Tidak_Hadir',
        'Jadwal_Pelajaran',
        'Master_Kelas',
        'Master_Jurusan',
        'Master_Mapel',
        'Materi_Pembelajaran',
        'Tugas_Siswa',
        'Input_Nilai_Siswa',
        'Pengaturan_Sekolah',
        'Audit_Log_Aktivitas'
      ];
      const missingTitles = requiredTitles.filter(t => !existingTitles.includes(t));

      if (missingTitles.length > 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: missingTitles.map(title => ({
              addSheet: { properties: { title } }
            }))
          }
        });
      }

      // Helper function to clear & update values
      const updateSheetRange = async (range: string, values: any[][]) => {
        try {
          await sheets.spreadsheets.values.clear({ spreadsheetId, range });
        } catch (e) {
          // ignore clear error if empty
        }
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: { values }
        });
      };

      const {
        agendaGuruList = [],
        agendaKelasList = [],
        supervisiList = [],
        guruList = [],
        siswaList = [],
        kelasList = [],
        jurusanList = [],
        mapelList = [],
        jadwalList = [],
        materiList = [],
        tugasList = [],
        nilaiSiswaList = [],
        auditLogList = []
      } = data || {};

      // 1. Ringkasan SIMAGU (Dashboard & All Statistics)
      const totalGuruAgenda = agendaGuruList.length;
      const totalKelasAgenda = agendaKelasList.length;
      const totalJp = agendaGuruList.reduce((acc: number, curr: any) => acc + (curr.jumlahJP || 0), 0);
      const avgKehadiran = totalGuruAgenda > 0
        ? (agendaGuruList.reduce((acc: number, curr: any) => acc + (curr.persentaseKehadiran || 0), 0) / totalGuruAgenda).toFixed(1)
        : '0';

      const ringkasanValues = [
        ['DASHBOARD & RINGKASAN SINKRONISASI SIMAGU', ''],
        ['Nama Sekolah', setting?.namaSekolah || 'SMK NEGERI BOJONGGAMBIR'],
        ['NPSN', setting?.npsn || '69978713'],
        ['Kepala Sekolah', setting?.kepalaSekolah || 'Drs. Aa Mansur, M.Pd.'],
        ['NIP Kepala Sekolah', setting?.nipKepalaSekolah || '-'],
        ['Tahun Pelajaran / Semester', `${setting?.tahunPelajaran || '2026/2027'} - ${setting?.semester || 'Ganjil'}`],
        ['Alamat Sekolah', setting?.alamatSekolah || 'Jl. Raya Bojonggambir, Kab. Tasikmalaya'],
        ['Terakhir Disinkronkan', new Date().toLocaleString('id-ID')],
        ['--- STATISTIK MODUL UTAMA ---', '--- TOTAL DOKUMEN ---'],
        ['Total Agenda Guru Recorded', totalGuruAgenda],
        ['Total Jam Pelajaran (JP) Mengajar', `${totalJp} JP`],
        ['Rata-Rata Kehadiran Siswa di Kelas', `${avgKehadiran}%`],
        ['Total Agenda Kelas Recorded', totalKelasAgenda],
        ['Total Supervisi Guru Recorded', supervisiList.length],
        ['Total Data Guru / PTK', guruList.length],
        ['Total Data Siswa Terdaftar', siswaList.length],
        ['Total Kelas / Rombel', kelasList.length],
        ['Total Program Keahlian / Jurusan', jurusanList.length],
        ['Total Mata Pelajaran', mapelList.length],
        ['Total Slot Jadwal Pelajaran', jadwalList.length],
        ['Total Materi Pembelajaran', materiList.length],
        ['Total Tugas Siswa', tugasList.length],
        ['Total Input Nilai Evaluasi', nilaiSiswaList.length],
        ['Total Log Aktivitas Sistem', auditLogList.length]
      ];
      await updateSheetRange('Ringkasan_SIMAGU!A1', ringkasanValues);

      // 2. Agenda Guru
      const agendaGuruHeader = [
        'No', 'No. Agenda', 'Tahun Pelajaran', 'Semester', 'Hari', 'Tanggal',
        'Nama Guru', 'NIP', 'Mata Pelajaran', 'Fase', 'Kelas', 'Jam Ke', 'Jumlah JP',
        'Materi', 'Model Pembelajaran', 'Status Pembelajaran', 'Hadir', 'Sakit', 'Izin', 'Alpa',
        '% Kehadiran', 'Kendala', 'Solusi', 'Status Validasi'
      ];
      const agendaGuruRows = agendaGuruList.map((a: any, idx: number) => [
        idx + 1, a.nomorAgenda, a.tahunPelajaran, a.semester, a.hari, a.tanggal,
        a.namaGuru, a.nip || '-', a.mapel, a.fase, a.kelas, a.jamKe, a.jumlahJP,
        a.materi, a.modelPembelajaran, a.statusPembelajaran, a.hadir, a.sakit, a.izin, a.alpa,
        `${a.persentaseKehadiran}%`, a.kendala || '-', a.solusi || '-', a.statusValidasi
      ]);
      await updateSheetRange('Agenda_Guru!A1', [agendaGuruHeader, ...agendaGuruRows]);

      // 3. Agenda Kelas
      const agendaKelasHeader = [
        'No', 'No. Agenda', 'Hari', 'Tanggal', 'Kelas', 'Jurusan', 'Wali Kelas', 'Ketua Kelas',
        'Total Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpa', '% Kehadiran',
        'Kondisi Umum', 'Kedisiplinan', 'Siswa Bermasalah', 'Siswa Berprestasi', 'Validasi Wali Kelas'
      ];
      const agendaKelasRows = agendaKelasList.map((a: any, idx: number) => [
        idx + 1, a.nomorAgenda, a.hari, a.tanggal, a.kelas, a.jurusan, a.waliKelas, a.ketuaKelas,
        a.jumlahSiswa, a.hadir, a.sakit, a.izin, a.alpa, `${a.persentase}%`,
        a.catatanWaliKelas?.kondisiUmum || '-', a.catatanWaliKelas?.kedisiplinan || '-',
        a.catatanWaliKelas?.siswaBermasalah || '-', a.catatanWaliKelas?.siswaBerprestasi || '-',
        a.validatedByWali ? 'Valid' : 'Pending'
      ]);
      await updateSheetRange('Agenda_Kelas!A1', [agendaKelasHeader, ...agendaKelasRows]);

      // 4. Supervisi
      const supervisiHeader = [
        'No', 'No. Supervisi', 'Tanggal', 'Nama Guru', 'NIP', 'Mata Pelajaran', 'Kelas',
        'Supervisor', 'Skor Perencanaan', 'Skor Pelaksanaan', 'Skor Evaluasi', 'Skor Akhir', 'Predikat', 'Status', 'Rekomendasi'
      ];
      const supervisiRows = supervisiList.map((s: any, idx: number) => [
        idx + 1, s.nomorSupervisi, s.tanggal, s.namaGuru, s.nip || '-', s.mapel, s.kelas,
        s.supervisor, s.skorPerencanaan, s.skorPelaksanaan, s.skorEvaluasi, s.skorAkhir, s.predikat, s.status, s.rekomendasi || '-'
      ]);
      await updateSheetRange('Supervisi_Guru!A1', [supervisiHeader, ...supervisiRows]);

      // 5. Data Guru
      const guruHeader = ['No', 'Kode Guru', 'NIP', 'NUPTK', 'Nama PTK', 'Jabatan / Tugas', 'Mapel Utama', 'Status'];
      const guruRows = guruList.map((g: any, idx: number) => [
        idx + 1, g.kodeGuru || '-', g.nip || '-', g.nuptk || '-', g.nama, g.jabatan, g.mapelUtama, g.status
      ]);
      await updateSheetRange('Data_Guru!A1', [guruHeader, ...guruRows]);

      // 6. Data Siswa
      const siswaHeader = ['No', 'NIS', 'NISN', 'Nama Siswa', 'JK', 'Kelas', 'Jurusan', 'Status'];
      const siswaRows = siswaList.map((s: any, idx: number) => [
        idx + 1, s.nis, s.nisn, s.nama, s.gender, s.kelas, s.jurusan, s.status
      ]);
      await updateSheetRange('Data_Siswa!A1', [siswaHeader, ...siswaRows]);

      // 7. Data Siswa Tidak Hadir
      const absentStudentsRows: any[][] = [];
      (agendaGuruList || []).forEach((g: any) => {
        if (g.siswaTidakHadir && Array.isArray(g.siswaTidakHadir)) {
          g.siswaTidakHadir.forEach((s: any) => {
            absentStudentsRows.push([
              absentStudentsRows.length + 1,
              g.tanggal,
              g.hari || '-',
              g.kelas,
              g.mapel || 'Mata Pelajaran',
              g.namaGuru || '-',
              s.nis || '-',
              s.nama,
              s.kategori || 'Alpa',
              s.alasan || s.keterangan || '-',
              'Agenda Guru'
            ]);
          });
        }
      });
      (agendaKelasList || []).forEach((k: any) => {
        if (k.siswaTidakHadir && Array.isArray(k.siswaTidakHadir)) {
          k.siswaTidakHadir.forEach((s: any) => {
            const exists = absentStudentsRows.some(row => row[1] === k.tanggal && row[6] === s.nis && row[8] === s.kategori);
            if (!exists) {
              absentStudentsRows.push([
                absentStudentsRows.length + 1,
                k.tanggal,
                k.hari || '-',
                k.kelas,
                'Jurnal Kelas',
                k.waliKelas || '-',
                s.nis || '-',
                s.nama,
                s.kategori || 'Alpa',
                s.alasan || '-',
                'Agenda Kelas'
              ]);
            }
          });
        }
      });
      const absentHeader = ['No', 'Tanggal', 'Hari', 'Kelas', 'Mata Pelajaran / Sumber', 'Guru / Wali Kelas', 'NIS', 'Nama Siswa', 'Kategori Ketidakhadiran', 'Alasan / Keterangan', 'Sumber Data'];
      await updateSheetRange('Data_Siswa_Tidak_Hadir!A1', [absentHeader, ...absentStudentsRows]);

      // 8. Jadwal Pelajaran
      const jadwalHeader = ['No', 'Hari', 'Jam Ke', 'Mulai', 'Selesai', 'Kelas', 'Mata Pelajaran', 'Kode / Nama Guru', 'Ruang'];
      const jadwalRows = (jadwalList || []).map((j: any, idx: number) => [
        idx + 1, j.hari, j.jamKe, j.jamMulai || '-', j.jamSelesai || '-', j.kelas, j.mapel, j.namaGuru || j.kodeGuru || '-', j.ruang || '-'
      ]);
      await updateSheetRange('Jadwal_Pelajaran!A1', [jadwalHeader, ...jadwalRows]);

      // 9. Master Kelas
      const kelasHeader = ['No', 'Nama Kelas', 'Tingkat', 'Jurusan', 'Wali Kelas', 'Ketua Kelas', 'Jumlah Siswa', 'Ruang'];
      const kelasRows = (kelasList || []).map((k: any, idx: number) => [
        idx + 1, k.namaKelas, k.tingkat, k.jurusan, k.waliKelas, k.ketuaKelas, k.jumlahSiswa, k.ruang
      ]);
      await updateSheetRange('Master_Kelas!A1', [kelasHeader, ...kelasRows]);

      // 10. Master Jurusan
      const jurusanHeader = ['No', 'Kode Jurusan', 'Nama Jurusan', 'Kepala Jurusan'];
      const jurusanRows = (jurusanList || []).map((j: any, idx: number) => [
        idx + 1, j.kodeJurusan, j.namaJurusan, j.kepalaJurusan || '-'
      ]);
      await updateSheetRange('Master_Jurusan!A1', [jurusanHeader, ...jurusanRows]);

      // 11. Master Mapel
      const mapelHeader = ['No', 'Kode Mapel', 'Nama Mata Pelajaran', 'Kelompok', 'Jam Per Minggu'];
      const mapelRows = (mapelList || []).map((m: any, idx: number) => [
        idx + 1, m.kodeMapel, m.namaMapel, m.kelompok || 'Kejuruan', m.jamPerMinggu || 2
      ]);
      await updateSheetRange('Master_Mapel!A1', [mapelHeader, ...mapelRows]);

      // 12. Materi Pembelajaran
      const materiHeader = ['No', 'Tanggal', 'Judul Materi', 'Mata Pelajaran', 'Kelas', 'Nama Guru', 'Ringkasan', 'Tautan File / Drive'];
      const materiRows = (materiList || []).map((m: any, idx: number) => [
        idx + 1, m.tanggal || '-', m.judulMateri, m.mapel, m.kelas, m.namaGuru, m.ringkasan || '-', m.fileUrl || '-'
      ]);
      await updateSheetRange('Materi_Pembelajaran!A1', [materiHeader, ...materiRows]);

      // 13. Tugas Siswa
      const tugasHeader = ['No', 'Tanggal Diberikan', 'Judul Tugas', 'Mata Pelajaran', 'Kelas', 'Nama Guru', 'Batas Waktu (Deadline)', 'Deskripsi / Instruksi'];
      const tugasRows = (tugasList || []).map((t: any, idx: number) => [
        idx + 1, t.tanggal || '-', t.judulTugas, t.mapel, t.kelas, t.namaGuru, t.deadline || '-', t.deskripsi || '-'
      ]);
      await updateSheetRange('Tugas_Siswa!A1', [tugasHeader, ...tugasRows]);

      // 14. Input Nilai Siswa
      const nilaiHeader = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Jenis Evaluasi', 'Nilai', 'Keterangan'];
      const nilaiRows = (nilaiSiswaList || []).map((n: any, idx: number) => [
        idx + 1, n.nis, n.namaSiswa, n.kelas, n.mapel, n.jenisEvaluasi || 'UH', n.nilai, n.keterangan || '-'
      ]);
      await updateSheetRange('Input_Nilai_Siswa!A1', [nilaiHeader, ...nilaiRows]);

      // 15. Pengaturan Sekolah
      const settingValues = [
        ['PARAMETER PENGATURAN', 'NILAI KONFIGURASI'],
        ['Nama Sekolah', setting?.namaSekolah || 'SMK NEGERI BOJONGGAMBIR'],
        ['NPSN', setting?.npsn || '69978713'],
        ['NSS', setting?.nss || '401021208001'],
        ['Alamat Sekolah', setting?.alamatSekolah || 'Jl. Raya Bojonggambir, Kab. Tasikmalaya'],
        ['Kepala Sekolah', setting?.kepalaSekolah || 'Drs. Aa Mansur, M.Pd.'],
        ['NIP Kepala Sekolah', setting?.nipKepalaSekolah || '196803151994031008'],
        ['Tahun Pelajaran', setting?.tahunPelajaran || '2026/2027'],
        ['Semester Aktif', setting?.semester || 'Ganjil'],
        ['Kota / Kabupaten', setting?.kotaKabupaten || 'Tasikmalaya'],
        ['Aplikasi', 'SIMAGU - System Informasi Agenda Guru & Kelas (SMK Edition)']
      ];
      await updateSheetRange('Pengaturan_Sekolah!A1', settingValues);

      // 16. Audit Log Aktivitas
      const auditHeader = ['No', 'Waktu / Tanggal', 'Pengguna', 'Peran (Role)', 'Tindakan (Action)', 'Rincian Aktivitas', 'IP Address'];
      const auditRows = (auditLogList || []).map((log: any, idx: number) => [
        idx + 1, log.timestamp, log.user, log.role, log.action, log.details, log.ipAddress || '127.0.0.1'
      ]);
      await updateSheetRange('Audit_Log_Aktivitas!A1', [auditHeader, ...auditRows]);

      return res.json({
        success: true,
        message: `Berhasil menyingkronkan seluruh data (16 tab) SIMAGU ke Google Spreadsheet (${spreadsheetId})!`,
        updatedSheets: requiredTitles
      });

    } catch (error: any) {
      console.error('[SIMAGU SHEETS ERROR]', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Gagal melakukan sinkronisasi Google Sheets'
      });
    }
  });

  // Server-side proxy for Google Apps Script Web App
  app.post("/api/sheets/gas-proxy", async (req, res) => {
    try {
      const { webAppUrl, payload } = req.body;
      if (!webAppUrl) {
        return res.status(400).json({ success: false, message: "URL Web App wajib diisi" });
      }

      const response = await fetch(webAppUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { text: responseText };
      }

      return res.json({
        success: true,
        message: responseData.message || "Berhasil dikirim ke Apps Script Web App",
        data: responseData
      });
    } catch (error: any) {
      console.error('[GAS PROXY ERROR]', error);
      return res.status(500).json({
        success: false,
        message: error.message || "Gagal menghubungi Apps Script Web App"
      });
    }
  });

  // Server-side Google Drive Folder Structure Generator
  app.post("/api/drive/create-folders", async (req, res) => {
    try {
      const { accessToken, tahunAjaran, jurusanList = [], schoolName } = req.body;

      if (!accessToken) {
        return res.status(400).json({ success: false, message: "Access Token Google wajib diisi" });
      }

      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: "v3", auth });

      const currentSchool = schoolName || 'SMK NEGERI BOJONGGAMBIR';
      const currentTA = tahunAjaran || '2026/2027';
      const sanitizedSchool = currentSchool.replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedTA = currentTA.replace(/\//g, '-');

      // Helper to create or find folder on Drive
      const createOrFindFolder = async (folderName: string, parentId?: string) => {
        let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        if (parentId) {
          query += ` and '${parentId}' in parents`;
        }
        try {
          const listRes = await drive.files.list({
            q: query,
            fields: 'files(id, name, webViewLink)',
            spaces: 'drive'
          });

          if (listRes.data.files && listRes.data.files.length > 0) {
            return listRes.data.files[0];
          }
        } catch (e) {
          console.warn(`Query search for ${folderName} failed, creating directly...`, e);
        }

        const fileMetadata: any = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        };
        if (parentId) {
          fileMetadata.parents = [parentId];
        }

        const folderRes = await drive.files.create({
          requestBody: fileMetadata,
          fields: 'id, name, webViewLink'
        });
        return folderRes.data;
      };

      // 1. Root Folder
      const rootFolder = await createOrFindFolder(`SIMAGU_Laporan_${sanitizedSchool}`);

      // 2. Academic Year Folder
      const taFolder = await createOrFindFolder(`Tahun_Ajaran_${sanitizedTA}`, rootFolder.id!);

      // 3. Departments
      const deptResults = [];
      const deptsToProcess = Array.isArray(jurusanList) && jurusanList.length > 0 ? jurusanList : [
        { kodeJurusan: 'DKV', namaJurusan: 'Desain Komunikasi Visual' },
        { kodeJurusan: 'TKJ', namaJurusan: 'Teknik Komputer dan Jaringan' },
        { kodeJurusan: 'TKR', namaJurusan: 'Teknik Kendaraan Ringan' },
        { kodeJurusan: 'AK', namaJurusan: 'Akuntansi dan Keuangan' }
      ];

      for (const j of deptsToProcess) {
        const deptFolderName = `${j.namaJurusan} (${j.kodeJurusan})`;
        const deptFolder = await createOrFindFolder(deptFolderName, taFolder.id!);

        const subAG = await createOrFindFolder('01_Laporan_Agenda_Guru', deptFolder.id!);
        const subAK = await createOrFindFolder('02_Laporan_Agenda_Kelas', deptFolder.id!);
        const subSV = await createOrFindFolder('03_Laporan_Supervisi_Guru', deptFolder.id!);
        const subPS = await createOrFindFolder('04_Rekap_Presensi_Siswa', deptFolder.id!);
        const subEX = await createOrFindFolder('05_Berkas_Export_PDF_Excel', deptFolder.id!);

        deptResults.push({
          kodeJurusan: j.kodeJurusan,
          namaJurusan: j.namaJurusan,
          folderName: deptFolderName,
          folderId: deptFolder.id,
          webViewLink: deptFolder.webViewLink,
          subfolders: {
            agendaGuru: { name: '01_Laporan_Agenda_Guru', id: subAG.id, webViewLink: subAG.webViewLink },
            agendaKelas: { name: '02_Laporan_Agenda_Kelas', id: subAK.id, webViewLink: subAK.webViewLink },
            supervisi: { name: '03_Laporan_Supervisi_Guru', id: subSV.id, webViewLink: subSV.webViewLink },
            presensiSiswa: { name: '04_Rekap_Presensi_Siswa', id: subPS.id, webViewLink: subPS.webViewLink },
            exportFiles: { name: '05_Berkas_Export_PDF_Excel', id: subEX.id, webViewLink: subEX.webViewLink }
          }
        });
      }

      // 4. General School Folder
      const generalFolder = await createOrFindFolder('Laporan_Umum_Sekolah', taFolder.id!);
      const subRekap = await createOrFindFolder('Rekapitulasi_Gabungan_Sekolah', generalFolder.id!);
      const subArsip = await createOrFindFolder('Arsip_Supervisi_Kepala_Sekolah', generalFolder.id!);
      const subBackup = await createOrFindFolder('Backup_Database_SIMAGU', generalFolder.id!);

      const folderStructure = {
        schoolName: currentSchool,
        tahunAjaran: currentTA,
        rootFolder: {
          name: rootFolder.name,
          id: rootFolder.id,
          webViewLink: rootFolder.webViewLink
        },
        academicYearFolder: {
          name: taFolder.name,
          id: taFolder.id,
          webViewLink: taFolder.webViewLink
        },
        departments: deptResults,
        generalFolder: {
          folderName: 'Laporan_Umum_Sekolah',
          folderId: generalFolder.id,
          webViewLink: generalFolder.webViewLink,
          subfolders: {
            rekapGabungan: { name: 'Rekapitulasi_Gabungan_Sekolah', id: subRekap.id, webViewLink: subRekap.webViewLink },
            arsipSupervisi: { name: 'Arsip_Supervisi_Kepala_Sekolah', id: subArsip.id, webViewLink: subArsip.webViewLink },
            exportDatabase: { name: 'Backup_Database_SIMAGU', id: subBackup.id, webViewLink: subBackup.webViewLink }
          }
        },
        generatedAt: new Date().toISOString()
      };

      return res.json({
        success: true,
        message: `Struktur folder Google Drive untuk TA ${currentTA} berhasil dibuat!`,
        folderStructure
      });
    } catch (error: any) {
      console.error("[GOOGLE DRIVE FOLDER ERROR]", error);
      return res.status(500).json({
        success: false,
        message: "Gagal membuat folder Google Drive: " + (error.message || error.toString())
      });
    }
  });

  // Vite middleware for development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SIMAGU SERVER] Running on http://localhost:${PORT}`);
  });
}

startServer();

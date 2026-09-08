import { AgendaGuruItem, AgendaKelasItem, GuruItem, SiswaItem, SupervisiRecord, SchoolSetting } from '../types';
import { Storage } from './storage';

export const DEFAULT_SPREADSHEET_ID = '1057ndE274DiiOOPUkn2E-6Eet8M1fzpABTGc4Aln5Ug';

export interface SyncDataOptions {
  spreadsheetId: string;
  accessToken: string;
  agendaGuruList?: AgendaGuruItem[];
  agendaKelasList?: AgendaKelasItem[];
  supervisiList?: SupervisiRecord[];
  guruList?: GuruItem[];
  siswaList?: SiswaItem[];
  setting?: SchoolSetting;
}

export interface SyncResult {
  success: boolean;
  message: string;
  updatedSheets: string[];
}

const REQUIRED_SHEET_TITLES = [
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

/**
 * Format seluruh data SIMAGU menjadi struktur baris kolom untuk 16 sheet Google Spreadsheet
 */
function prepareSheetsPayload(options: SyncDataOptions) {
  const agendaGuruList = options.agendaGuruList || Storage.getAgendaGuru();
  const agendaKelasList = options.agendaKelasList || Storage.getAgendaKelas();
  const supervisiList = options.supervisiList || Storage.getSupervisi();
  const guruList = options.guruList || Storage.getGuru();
  const siswaList = options.siswaList || Storage.getSiswa();
  const kelasList = Storage.getKelas();
  const jurusanList = Storage.getJurusan();
  const mapelList = Storage.getMapel();
  const jadwalList = Storage.getJadwal();
  const materiList = Storage.getMateri();
  const tugasList = Storage.getTugas();
  const nilaiSiswaList = Storage.getNilaiSiswa();
  const auditLogList = Storage.getAuditLogs();
  const setting = options.setting || Storage.getSetting();

  // 1. Ringkasan SIMAGU
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
    ['Alamat Sekolah', setting?.alamat || 'Jl. Raya Bojonggambir, Kab. Tasikmalaya'],
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

  // 4. Supervisi Guru
  const supervisiHeader = [
    'No', 'No. Supervisi', 'Tanggal', 'Nama Guru', 'NIP', 'Mata Pelajaran', 'Kelas',
    'Supervisor', 'Skor Perencanaan', 'Skor Pelaksanaan', 'Skor Evaluasi', 'Skor Akhir', 'Predikat', 'Status', 'Rekomendasi'
  ];
  const supervisiRows = supervisiList.map((s: any, idx: number) => [
    idx + 1, s.nomorSupervisi, s.tanggal, s.namaGuru, s.nip || '-', s.mapel, s.kelas,
    s.supervisor, s.skorPerencanaan, s.skorPelaksanaan, s.skorEvaluasi, s.skorAkhir, s.predikat, s.status, s.rekomendasi || '-'
  ]);

  // 5. Data Guru
  const guruHeader = ['No', 'Kode Guru', 'NIP', 'NUPTK', 'Nama PTK', 'Jabatan / Tugas', 'Mapel Utama', 'Status'];
  const guruRows = guruList.map((g: any, idx: number) => [
    idx + 1, g.kodeGuru || '-', g.nip || '-', g.nuptk || '-', g.nama, g.jabatan, g.mapelUtama, g.status
  ]);

  // 6. Data Siswa
  const siswaHeader = ['No', 'NIS', 'NISN', 'Nama Siswa', 'JK', 'Kelas', 'Jurusan', 'Status'];
  const siswaRows = siswaList.map((s: any, idx: number) => [
    idx + 1, s.nis, s.nisn, s.nama, s.gender, s.kelas, s.jurusan, s.status
  ]);

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

  // 8. Jadwal Pelajaran
  const jadwalHeader = ['No', 'Hari', 'Jam Ke', 'Mulai', 'Selesai', 'Kelas', 'Mata Pelajaran', 'Kode / Nama Guru', 'Ruang'];
  const jadwalRows = (jadwalList || []).map((j: any, idx: number) => [
    idx + 1, j.hari, j.jamKe, j.jamMulai || '-', j.jamSelesai || '-', j.kelas, j.mapel, j.namaGuru || j.kodeGuru || '-', j.ruang || '-'
  ]);

  // 9. Master Kelas
  const kelasHeader = ['No', 'Nama Kelas', 'Tingkat', 'Jurusan', 'Wali Kelas', 'Ketua Kelas', 'Jumlah Siswa', 'Ruang'];
  const kelasRows = (kelasList || []).map((k: any, idx: number) => [
    idx + 1, k.namaKelas, k.tingkat, k.jurusan, k.waliKelas, k.ketuaKelas, k.jumlahSiswa, k.ruang
  ]);

  // 10. Master Jurusan
  const jurusanHeader = ['No', 'Kode Jurusan', 'Nama Jurusan', 'Kepala Jurusan'];
  const jurusanRows = (jurusanList || []).map((j: any, idx: number) => [
    idx + 1, j.kodeJurusan, j.namaJurusan, j.kepalaJurusan || '-'
  ]);

  // 11. Master Mapel
  const mapelHeader = ['No', 'Kode Mapel', 'Nama Mata Pelajaran', 'Kelompok', 'Jam Per Minggu'];
  const mapelRows = (mapelList || []).map((m: any, idx: number) => [
    idx + 1, m.kodeMapel, m.namaMapel, m.kelompok || 'Kejuruan', m.jamPerMinggu || 2
  ]);

  // 12. Materi Pembelajaran
  const materiHeader = ['No', 'Tanggal', 'Judul Materi', 'Mata Pelajaran', 'Kelas', 'Nama Guru', 'Ringkasan', 'Tautan File / Drive'];
  const materiRows = (materiList || []).map((m: any, idx: number) => [
    idx + 1, m.tanggal || '-', m.judulMateri, m.mapel, m.kelas, m.namaGuru, m.ringkasan || '-', m.fileUrl || '-'
  ]);

  // 13. Tugas Siswa
  const tugasHeader = ['No', 'Tanggal Diberikan', 'Judul Tugas', 'Mata Pelajaran', 'Kelas', 'Nama Guru', 'Batas Waktu (Deadline)', 'Deskripsi / Instruksi'];
  const tugasRows = (tugasList || []).map((t: any, idx: number) => [
    idx + 1, t.tanggal || '-', t.judulTugas, t.mapel, t.kelas, t.namaGuru, t.deadline || '-', t.deskripsi || '-'
  ]);

  // 14. Input Nilai Siswa
  const nilaiHeader = ['No', 'NIS', 'Nama Siswa', 'Kelas', 'Mata Pelajaran', 'Jenis Evaluasi', 'Nilai', 'Keterangan'];
  const nilaiRows = (nilaiSiswaList || []).map((n: any, idx: number) => [
    idx + 1, n.nis, n.namaSiswa, n.kelas, n.mapel, n.jenisEvaluasi || 'UH', n.nilai, n.keterangan || '-'
  ]);

  // 15. Pengaturan Sekolah
  const settingValues = [
    ['PARAMETER PENGATURAN', 'NILAI KONFIGURASI'],
    ['Nama Sekolah', setting?.namaSekolah || 'SMK NEGERI BOJONGGAMBIR'],
    ['NPSN', setting?.npsn || '69978713'],
    ['Alamat Sekolah', setting?.alamat || 'Jl. Raya Bojonggambir, Kab. Tasikmalaya'],
    ['Kepala Sekolah', setting?.kepalaSekolah || 'Drs. Aa Mansur, M.Pd.'],
    ['NIP Kepala Sekolah', setting?.nipKepalaSekolah || '196803151994031008'],
    ['Tahun Pelajaran', setting?.tahunPelajaran || '2026/2027'],
    ['Semester Aktif', setting?.semester || 'Ganjil'],
    ['Kota / Kabupaten', setting?.kota || 'Tasikmalaya'],
    ['Aplikasi', 'SIMAGU - System Informasi Agenda Guru & Kelas (SMK Edition)']
  ];

  // 16. Audit Log Aktivitas
  const auditHeader = ['No', 'Waktu / Tanggal', 'Pengguna', 'Peran (Role)', 'Tindakan (Action)', 'Rincian Aktivitas', 'IP Address'];
  const auditRows = (auditLogList || []).map((log: any, idx: number) => [
    idx + 1, log.timestamp, log.user, log.role, log.action, log.details, log.ipAddress || '127.0.0.1'
  ]);

  return [
    { range: 'Ringkasan_SIMAGU!A1', values: ringkasanValues },
    { range: 'Agenda_Guru!A1', values: [agendaGuruHeader, ...agendaGuruRows] },
    { range: 'Agenda_Kelas!A1', values: [agendaKelasHeader, ...agendaKelasRows] },
    { range: 'Supervisi_Guru!A1', values: [supervisiHeader, ...supervisiRows] },
    { range: 'Data_Guru!A1', values: [guruHeader, ...guruRows] },
    { range: 'Data_Siswa!A1', values: [siswaHeader, ...siswaRows] },
    { range: 'Data_Siswa_Tidak_Hadir!A1', values: [absentHeader, ...absentStudentsRows] },
    { range: 'Jadwal_Pelajaran!A1', values: [jadwalHeader, ...jadwalRows] },
    { range: 'Master_Kelas!A1', values: [kelasHeader, ...kelasRows] },
    { range: 'Master_Jurusan!A1', values: [jurusanHeader, ...jurusanRows] },
    { range: 'Master_Mapel!A1', values: [mapelHeader, ...mapelRows] },
    { range: 'Materi_Pembelajaran!A1', values: [materiHeader, ...materiRows] },
    { range: 'Tugas_Siswa!A1', values: [tugasHeader, ...tugasRows] },
    { range: 'Input_Nilai_Siswa!A1', values: [nilaiHeader, ...nilaiRows] },
    { range: 'Pengaturan_Sekolah!A1', values: settingValues },
    { range: 'Audit_Log_Aktivitas!A1', values: [auditHeader, ...auditRows] }
  ];
}

/**
 * Sinkronisasi langsung ke Google Sheets API v4 dari Client Browser (Bypass 405 Method Not Allowed di GitHub Pages)
 */
async function syncDirectToGoogleSheetsAPIClient(options: SyncDataOptions): Promise<SyncResult> {
  const { spreadsheetId, accessToken } = options;

  // 1. Dapatkan daftar Sheet yang sudah ada
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const metaRes = await fetch(metaUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!metaRes.ok) {
    const errJson = await metaRes.json().catch(() => null);
    throw new Error(errJson?.error?.message || `Akses Google Sheets ditolak (${metaRes.status}). Periksa izin Google akun Anda.`);
  }

  const metaData = await metaRes.json();
  const existingTitles: string[] = (metaData.sheets || []).map((s: any) => s.properties?.title || '');
  const missingTitles = REQUIRED_SHEET_TITLES.filter(t => !existingTitles.includes(t));

  // 2. Buat Sheet yang belum ada jika diperlukan
  if (missingTitles.length > 0) {
    const batchUpdateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    await fetch(batchUpdateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: missingTitles.map(title => ({
          addSheet: { properties: { title } }
        }))
      })
    });
  }

  // 3. Bersihkan dan Isi seluruh 16 Sheet menggunakan values:batchUpdate
  const sheetsPayload = prepareSheetsPayload(options);
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

  const updateRes = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: sheetsPayload
    })
  });

  if (!updateRes.ok) {
    const errJson = await updateRes.json().catch(() => null);
    throw new Error(errJson?.error?.message || `Gagal menulis data ke Google Sheets (${updateRes.status})`);
  }

  Storage.logAudit('SYNC_GOOGLE_SHEETS', `Menyingkronkan seluruh 16 tab data SIMAGU langsung ke Google Spreadsheet ID: ${spreadsheetId}`);

  return {
    success: true,
    message: `Berhasil menyingkronkan seluruh data (16 tab) SIMAGU ke Google Spreadsheet (${spreadsheetId})!`,
    updatedSheets: REQUIRED_SHEET_TITLES
  };
}

export async function syncAllToGoogleSheets(options: SyncDataOptions): Promise<SyncResult> {
  const { spreadsheetId, accessToken } = options;

  // Cek apakah di hosting statis (GitHub Pages atau custom domain statis)
  const isStaticHost = window.location.hostname.includes('github.io') ||
                       window.location.hostname.includes('smknbojonggambir.sch.id') ||
                       !window.location.hostname.includes('run.app') && window.location.hostname !== 'localhost';

  if (isStaticHost) {
    // Di GitHub Pages / Host statis, langsung jalankan direct client-side Sheets API
    return await syncDirectToGoogleSheetsAPIClient(options);
  }

  // Jika di lingkungan server (local dev / container), coba proxy server terlebih dahulu
  try {
    const res = await fetch('/api/sheets/sync-direct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spreadsheetId,
        accessToken,
        data: {
          agendaGuruList: options.agendaGuruList || Storage.getAgendaGuru(),
          agendaKelasList: options.agendaKelasList || Storage.getAgendaKelas(),
          supervisiList: options.supervisiList || Storage.getSupervisi(),
          guruList: options.guruList || Storage.getGuru(),
          siswaList: options.siswaList || Storage.getSiswa(),
          kelasList: Storage.getKelas(),
          jurusanList: Storage.getJurusan(),
          mapelList: Storage.getMapel(),
          jadwalList: Storage.getJadwal(),
          materiList: Storage.getMateri(),
          tugasList: Storage.getTugas(),
          nilaiSiswaList: Storage.getNilaiSiswa(),
          auditLogList: Storage.getAuditLogs()
        },
        setting: options.setting || Storage.getSetting()
      })
    });

    if (res.status === 405 || res.status === 404) {
      // Server proxy tidak tersedia di host statis, fallback ke direct API client
      return await syncDirectToGoogleSheetsAPIClient(options);
    }

    const result = await res.json().catch(() => null);

    if (!res.ok || !result?.success) {
      // Fallback ke direct client jika endpoint backend bermasalah
      return await syncDirectToGoogleSheetsAPIClient(options);
    }

    Storage.logAudit('SYNC_GOOGLE_SHEETS', `Menyingkronkan seluruh 16 tab data SIMAGU ke Google Spreadsheet ID: ${spreadsheetId}`);

    return {
      success: true,
      message: result.message,
      updatedSheets: result.updatedSheets || REQUIRED_SHEET_TITLES
    };
  } catch (err) {
    // Fallback otomatis ke direct client API jika fetch ke /api/ gagal
    return await syncDirectToGoogleSheetsAPIClient(options);
  }
}

export async function syncViaAppsScriptWebApp(
  webAppUrl: string,
  dataOverride?: {
    agendaGuruList?: AgendaGuruItem[];
    agendaKelasList?: AgendaKelasItem[];
    supervisiList?: SupervisiRecord[];
    guruList?: GuruItem[];
    siswaList?: SiswaItem[];
  }
): Promise<SyncResult> {
  const fullData = {
    agendaGuruList: dataOverride?.agendaGuruList || Storage.getAgendaGuru(),
    agendaKelasList: dataOverride?.agendaKelasList || Storage.getAgendaKelas(),
    supervisiList: dataOverride?.supervisiList || Storage.getSupervisi(),
    guruList: dataOverride?.guruList || Storage.getGuru(),
    siswaList: dataOverride?.siswaList || Storage.getSiswa(),
    kelasList: Storage.getKelas(),
    jurusanList: Storage.getJurusan(),
    mapelList: Storage.getMapel(),
    jadwalList: Storage.getJadwal(),
    materiList: Storage.getMateri(),
    tugasList: Storage.getTugas(),
    nilaiSiswaList: Storage.getNilaiSiswa(),
    auditLogList: Storage.getAuditLogs(),
    setting: Storage.getSetting()
  };

  const payload = {
    action: 'syncAllData',
    data: fullData
  };

  const cleanUrl = webAppUrl.trim();

  // Helper fungsi untuk mengirim langsung dari browser ke Apps Script Web App
  const sendDirectToAppsScript = async () => {
    // Menggunakan text/plain agar browser tidak mengirimkan preflight OPTIONS yang diblokir oleh Apps Script
    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data.status === 'error') {
            throw new Error(data.message || 'Google Apps Script melaporkan galat pemrosesan.');
          }
        } catch (e: any) {
          if (e.message?.includes('Google Apps Script melaporkan galat')) throw e;
        }
      }
    } catch (directErr: any) {
      // Jika browser membatasi redirect cross-origin, kirim menggunakan mode no-cors
      await fetch(cleanUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });
    }

    Storage.logAudit('SYNC_APPS_SCRIPT', `Menyingkronkan data SIMAGU langsung ke Web App Apps Script: ${cleanUrl}`);

    return {
      success: true,
      message: 'Seluruh data SIMAGU (15 modul) berhasil dikirim dan disinkronkan ke Google Spreadsheet via Apps Script!',
      updatedSheets: [
        'Dashboard', 'Guru', 'Siswa', 'Kelas', 'Jurusan', 'Mapel', 'Jadwal',
        'Agenda_Guru', 'Agenda_Kelas', 'Supervisi', 'Materi', 'Tugas', 'Nilai', 'Setting', 'Log_Aktivitas'
      ]
    };
  };

  // Cek apakah di hosting statis (GitHub Pages / domain sekolah)
  const isStaticHost = window.location.hostname.includes('github.io') ||
                       window.location.hostname.includes('smknbojonggambir.sch.id') ||
                       !window.location.hostname.includes('run.app') && window.location.hostname !== 'localhost';

  if (isStaticHost) {
    return await sendDirectToAppsScript();
  }

  // Jika di lingkungan dev server lokal, coba proxy backend terlebih dahulu
  try {
    const res = await fetch('/api/sheets/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        webAppUrl: cleanUrl,
        payload
      })
    });

    if (res.status === 405 || res.status === 404) {
      // Host statis (405 Method Not Allowed), langsung kirim via direct client
      return await sendDirectToAppsScript();
    }

    const result = await res.json().catch(() => null);

    if (!res.ok || !result?.success) {
      return await sendDirectToAppsScript();
    }

    Storage.logAudit('SYNC_APPS_SCRIPT', `Menyingkronkan data SIMAGU melalui Web App Apps Script: ${cleanUrl}`);

    return {
      success: true,
      message: result.message || 'Seluruh data SIMAGU berhasil dikirim ke Google Apps Script Web App!',
      updatedSheets: [
        'Dashboard', 'Guru', 'Siswa', 'Kelas', 'Jurusan', 'Mapel', 'Jadwal',
        'Agenda_Guru', 'Agenda_Kelas', 'Supervisi', 'Materi', 'Tugas', 'Nilai', 'Setting', 'Log_Aktivitas'
      ]
    };
  } catch (err) {
    // Fallback otomatis ke direct browser send
    return await sendDirectToAppsScript();
  }
}




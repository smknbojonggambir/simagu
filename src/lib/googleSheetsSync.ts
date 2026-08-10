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

export async function syncAllToGoogleSheets(options: SyncDataOptions): Promise<SyncResult> {
  const { spreadsheetId, accessToken } = options;

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

  const res = await fetch('/api/sheets/sync-direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      spreadsheetId,
      accessToken,
      data: {
        agendaGuruList,
        agendaKelasList,
        supervisiList,
        guruList,
        siswaList,
        kelasList,
        jurusanList,
        mapelList,
        jadwalList,
        materiList,
        tugasList,
        nilaiSiswaList,
        auditLogList
      },
      setting
    })
  });

  const result = await res.json().catch(() => ({ success: false, message: `Response error status ${res.status}` }));

  if (!res.ok || !result.success) {
    throw new Error(result.message || `Gagal menyingkronkan data (${res.status})`);
  }

  Storage.logAudit('SYNC_GOOGLE_SHEETS', `Menyingkronkan seluruh 16 tab data SIMAGU ke Google Spreadsheet ID: ${spreadsheetId}`);

  return {
    success: true,
    message: result.message,
    updatedSheets: result.updatedSheets || [
      'Ringkasan_SIMAGU', 'Agenda_Guru', 'Agenda_Kelas', 'Supervisi_Guru',
      'Data_Guru', 'Data_Siswa', 'Data_Siswa_Tidak_Hadir', 'Jadwal_Pelajaran',
      'Master_Kelas', 'Master_Jurusan', 'Master_Mapel', 'Materi_Pembelajaran',
      'Tugas_Siswa', 'Input_Nilai_Siswa', 'Pengaturan_Sekolah', 'Audit_Log_Aktivitas'
    ]
  };
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

  const res = await fetch('/api/sheets/gas-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webAppUrl,
      payload
    })
  });

  const result = await res.json().catch(() => ({ success: false, message: `Response error status ${res.status}` }));

  if (!res.ok || !result.success) {
    throw new Error(result.message || `Gagal menghubungi Web App (${res.status})`);
  }

  Storage.logAudit('SYNC_APPS_SCRIPT', `Menyingkronkan data SIMAGU melalui Web App Apps Script: ${webAppUrl}`);

  return {
    success: true,
    message: result.message || 'Seluruh data SIMAGU berhasil dikirim ke Google Apps Script Web App!',
    updatedSheets: [
      'Dashboard', 'Guru', 'Siswa', 'Kelas', 'Jurusan', 'Mapel', 'Jadwal',
      'Agenda_Guru', 'Agenda_Kelas', 'Supervisi', 'Materi', 'Tugas', 'Nilai', 'Setting', 'Log_Aktivitas'
    ]
  };
}



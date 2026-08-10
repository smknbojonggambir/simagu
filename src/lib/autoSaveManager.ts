import { Storage } from './storage';
import { syncViaAppsScriptWebApp } from './googleSheetsSync';

export interface AutoSaveConfig {
  enabled: boolean;
  intervalSeconds: number; // 15, 30, 60, 120
  syncToCloud: boolean;
  lastSavedAt: string | null;
  lastCloudSyncedAt: string | null;
}

const AUTOSAVE_CONFIG_KEY = 'simagu_autosave_config';
const AUTOSAVE_SNAPSHOT_KEY = 'simagu_autosave_snapshot';

const DEFAULT_CONFIG: AutoSaveConfig = {
  enabled: true,
  intervalSeconds: 30,
  syncToCloud: true,
  lastSavedAt: null,
  lastCloudSyncedAt: null,
};

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const AutoSaveManager = {
  getConfig: (): AutoSaveConfig => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_CONFIG_KEY);
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (err) {
      console.error('Failed to parse autosave config:', err);
    }
    return DEFAULT_CONFIG;
  },

  saveConfig: (config: Partial<AutoSaveConfig>): AutoSaveConfig => {
    const current = AutoSaveManager.getConfig();
    const updated = { ...current, ...config };
    try {
      localStorage.setItem(AUTOSAVE_CONFIG_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save autosave config:', err);
    }
    return updated;
  },

  triggerDebouncedSave: (delayMs = 2000) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      AutoSaveManager.performSave().catch(err => {
        console.warn('Debounced AutoSave background execution notice:', err);
      });
    }, delayMs);
  },

  performSave: async (): Promise<{
    success: boolean;
    timestamp: string;
    itemCount: number;
    cloudSynced: boolean;
    error?: string;
  }> => {
    const nowISO = new Date().toISOString();
    try {
      // 1. Gather all system state snapshots
      const setting = Storage.getSetting();
      const guru = Storage.getGuru();
      const siswa = Storage.getSiswa();
      const kelas = Storage.getKelas();
      const jurusan = Storage.getJurusan();
      const mapel = Storage.getMapel();
      const jadwal = Storage.getJadwal();
      const agendaGuru = Storage.getAgendaGuru();
      const agendaKelas = Storage.getAgendaKelas();
      const absensiGuru = Storage.getAbsensiGuru();
      const absensiSiswa = Storage.getAbsensiSiswa();
      const supervisi = Storage.getSupervisi();
      const materi = Storage.getMateri();
      const tugas = Storage.getTugas();
      const nilaiSiswa = Storage.getNilaiSiswa();

      const totalItems =
        guru.length +
        siswa.length +
        kelas.length +
        jurusan.length +
        mapel.length +
        jadwal.length +
        agendaGuru.length +
        agendaKelas.length +
        absensiGuru.length +
        absensiSiswa.length +
        supervisi.length +
        materi.length +
        tugas.length +
        nilaiSiswa.length;

      // 2. Write all state directly into local storage keys via Storage
      Storage.saveSetting(setting);
      Storage.saveGuru(guru);
      Storage.saveSiswa(siswa);
      Storage.saveKelas(kelas);
      Storage.saveJurusan(jurusan);
      Storage.saveMapel(mapel);
      Storage.saveJadwal(jadwal);
      Storage.saveAgendaGuru(agendaGuru);
      Storage.saveAgendaKelas(agendaKelas);
      Storage.saveAbsensiGuru(absensiGuru);
      Storage.saveAbsensiSiswa(absensiSiswa);
      Storage.saveSupervisi(supervisi);
      Storage.saveMateri(materi);
      Storage.saveTugas(tugas);
      Storage.saveNilaiSiswa(nilaiSiswa);

      // Save overall snapshot backup
      const snapshot = {
        savedAt: nowISO,
        totalItems,
        setting,
        counts: {
          guru: guru.length,
          siswa: siswa.length,
          agendaGuru: agendaGuru.length,
          agendaKelas: agendaKelas.length,
          nilaiSiswa: nilaiSiswa.length,
        },
      };
      localStorage.setItem(AUTOSAVE_SNAPSHOT_KEY, JSON.stringify(snapshot));

      // 3. Automatic Cloud Auto-Sync to Google Sheets / Apps Script Web App
      let cloudSynced = false;
      const config = AutoSaveManager.getConfig();
      const defaultScriptUrl = 'https://script.google.com/macros/s/AKfycbwdP4xyVpfseBeDt2TrzyrNUQYhOuxX2638CDPs0XcisGGZNga0Ix4PgxGhSPv4aCj9/exec';
      const scriptUrl = setting.appsScriptUrl || localStorage.getItem('simagu_sheets_script_url') || defaultScriptUrl;

      if (config.syncToCloud && scriptUrl) {
        try {
          const res = await syncViaAppsScriptWebApp(scriptUrl);
          if (res && res.success) {
            cloudSynced = true;
            AutoSaveManager.saveConfig({ lastCloudSyncedAt: nowISO });
          }
        } catch (err) {
          console.warn('Cloud auto-sync background notice:', err);
        }
      }

      // 4. Update lastSavedAt in config
      AutoSaveManager.saveConfig({ lastSavedAt: nowISO });

      return {
        success: true,
        timestamp: nowISO,
        itemCount: totalItems,
        cloudSynced,
      };
    } catch (err: any) {
      console.error('AutoSave failed:', err);
      return {
        success: false,
        timestamp: nowISO,
        itemCount: 0,
        cloudSynced: false,
        error: err?.message || 'Gagal menyimpan data otomatis',
      };
    }
  },

  getSnapshotInfo: () => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_SNAPSHOT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },
};

import { toast } from 'sonner';
import {
  SchoolSetting,
  GuruItem,
  SiswaItem,
  KelasItem,
  JurusanItem,
  MapelItem,
  JadwalItem,
  RawJadwalItem,
  AgendaGuruItem,
  AgendaKelasItem,
  AbsensiGuruRecord,
  AbsensiSiswaRecord,
  SupervisiRecord,
  MateriRecord,
  TugasRecord,
  NilaiSiswaRecord,
  NotificationItem,
  AuditLogItem,
  User,
  UserRole,
  MonitoringPembelajaranRecord
} from '../types';

export interface DriveFolderItem {
  name: string;
  id?: string;
  webViewLink?: string;
  path?: string;
}

export interface DriveDepartmentFolderStructure {
  kodeJurusan: string;
  namaJurusan: string;
  folderName: string;
  folderId?: string;
  webViewLink?: string;
  path?: string;
  subfolders: {
    agendaGuru: DriveFolderItem;
    agendaKelas: DriveFolderItem;
    supervisi: DriveFolderItem;
    presensiSiswa: DriveFolderItem;
    exportFiles: DriveFolderItem;
  };
}

export interface DriveFolderStructure {
  schoolName: string;
  tahunAjaran: string;
  rootFolder: DriveFolderItem;
  academicYearFolder: DriveFolderItem;
  departments: DriveDepartmentFolderStructure[];
  generalFolder: {
    folderName: string;
    folderId?: string;
    webViewLink?: string;
    subfolders: {
      rekapGabungan: DriveFolderItem;
      arsipSupervisi: DriveFolderItem;
      exportDatabase: DriveFolderItem;
    };
  };
  generatedAt: string;
}
import {
  initialSchoolSetting,
  initialGuru,
  initialSiswa,
  initialKelas,
  initialJurusan,
  initialMapel,
  initialJadwal,
  initialRawJadwal,
  initialAgendaGuru,
  initialAgendaKelas,
  initialAbsensiGuru,
  initialAbsensiSiswa,
  initialSupervisi,
  initialMateri,
  initialTugas,
  initialNilaiSiswa,
  initialNotifications,
  initialAuditLogs,
  initialUsers
} from '../data/mockData';

const KEYS = {
  SETTING: 'simagu_school_setting',
  GURU: 'simagu_guru',
  SISWA: 'simagu_siswa',
  KELAS: 'simagu_kelas',
  JURUSAN: 'simagu_jurusan',
  MAPEL: 'simagu_mapel',
  JADWAL: 'simagu_jadwal',
  RAW_JADWAL: 'simagu_raw_jadwal_501',
  AGENDA_GURU: 'simagu_agenda_guru',
  AGENDA_KELAS: 'simagu_agenda_kelas',
  ABSENSI_GURU: 'simagu_absensi_guru',
  ABSENSI_SISWA: 'simagu_absensi_siswa',
  SUPERVISI: 'simagu_supervisi',
  MATERI: 'simagu_materi',
  TUGAS: 'simagu_tugas',
  NILAI_SISWA: 'simagu_nilai_siswa',
  MONITORING_PEMBELAJARAN: 'simagu_monitoring_pembelajaran',
  NOTIFICATIONS: 'simagu_notifications',
  AUDIT_LOGS: 'simagu_audit_logs',
  USERS: 'simagu_users',
  CURRENT_USER: 'simagu_current_user',
  THEME: 'simagu_theme_mode',
};

export const initialMonitoringPembelajaran: MonitoringPembelajaranRecord[] = [
  {
    id: 'mon-001',
    nomorMonitoring: 'MON/2026/08/01',
    tanggal: '2026-08-03',
    hari: 'Senin',
    guru: 'Rian Hermawan, S.Sn',
    mapel: 'Dasar-dasar Desain Komunikasi Visual',
    kelas: 'X DKV 1',
    materi: 'Sketsa Tipografi & Tata Letak Dasar Desain Poster',
    kehadiran: 100,
    jumlahHadir: 36,
    totalSiswa: 36,
    keterlaksanaan: 'Terlaksana Penuh',
    kendala: 'Tidak ada kendala, seluruh peserta didik membawa peralatan sketsa manual lengkap.',
    catatan: 'Peserta didik aktif bereksperimen dengan anatomi huruf dan layout visual.',
    tindakLanjut: 'Melanjutkan digitalisasi sketsa pada sesi software vektor pekan depan.',
    status: 'Tercapai',
    supervisor: 'Drs. H. Ahmad Saepudin, M.Pd',
    ruang: 'Lab Studio Grafis DKV',
    jamKe: '1-4'
  },
  {
    id: 'mon-002',
    nomorMonitoring: 'MON/2026/08/02',
    tanggal: '2026-08-04',
    hari: 'Selasa',
    guru: 'Hj. Neni Rohaeni, S.TP',
    mapel: 'Produksi Pengolahan Hasil Nabati',
    kelas: 'XI APHP',
    materi: 'Teknik Pasteurisasi & Fermentasi Sari Buah Lokal',
    kehadiran: 97,
    jumlahHadir: 35,
    totalSiswa: 36,
    keterlaksanaan: 'Terlaksana Penuh',
    kendala: '1 siswa izin karena kegiatan OSIS.',
    catatan: 'Kepatuhan K3LH dan sanitasi ruang bengkel APHP berjalan sesuai standar industri.',
    tindakLanjut: 'Pengujian organoleptik hasil fermentasi sari buah pada pertemuan berikutnya.',
    status: 'Tercapai',
    supervisor: 'Wali Kelas & Kurikulum',
    ruang: 'Bengkel Produksi APHP',
    jamKe: '1-4'
  },
  {
    id: 'mon-003',
    nomorMonitoring: 'MON/2026/08/03',
    tanggal: '2026-08-05',
    hari: 'Rabu',
    guru: 'Deden Supriatna, S.Kom',
    mapel: 'Desain Grafis Percetakan & Kemasan Produk',
    kelas: 'XII DKV 2',
    materi: 'Finishing Mockup Packaging 3D Menggunakan Software Render',
    kehadiran: 94,
    jumlahHadir: 34,
    totalSiswa: 36,
    keterlaksanaan: 'Terlaksana Sebagian',
    kendala: '2 unit PC lab grafis lambat saat rendering resolusi tinggi 300 DPI.',
    catatan: 'Siswa diarahkan bergantian render dan optimasi tekstur 3D.',
    tindakLanjut: 'Menjadwalkan maintenance update driver GPU dan penambahan alokasi RAM dengan teknisi lab.',
    status: 'Dalam Proses',
    supervisor: 'Drs. H. Ahmad Saepudin, M.Pd',
    ruang: 'Lab Komputer DKV 2',
    jamKe: '5-8'
  },
  {
    id: 'mon-004',
    nomorMonitoring: 'MON/2026/08/06',
    tanggal: '2026-08-06',
    hari: 'Kamis',
    guru: 'Yanti Susanti, S.Pd',
    mapel: 'Keamanan Pangan & Sanitasi Industri',
    kelas: 'X APHP',
    materi: 'Identifikasi Titik Kendali Kritis (HACCP) di Lingkungan Dapur Produksi',
    kehadiran: 100,
    jumlahHadir: 36,
    totalSiswa: 36,
    keterlaksanaan: 'Terlaksana Penuh',
    kendala: 'Nihil, KBM diskusi kelompok dan studi kasus berlangsung tertib.',
    catatan: 'Seluruh kelompok mampu merumuskan lembar kerja HACCP dengan baik.',
    tindakLanjut: 'Praktek audit sanitasi mandiri di laboratorium.',
    status: 'Tercapai',
    supervisor: 'Tim Pengembang Kurikulum',
    ruang: 'Ruang Teori APHP',
    jamKe: '1-4'
  }
];

const memoryStore = new Map<string, string>();

export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Access denied or sandboxed
    }
    return memoryStore.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Storage unavailable or quota exceeded
    }
    memoryStore.set(key, value);
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
    memoryStore.delete(key);
  },
  clear: (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {}
    memoryStore.clear();
  }
};

// Automatic sync to ensure updated master data & 501-line schedule is in place safely
try {
  const MASTER_SYNC_KEY = 'simagu_master_sync_501_v20260906';
  if (typeof window !== 'undefined' && safeLocalStorage.getItem(MASTER_SYNC_KEY) !== 'true') {
    safeLocalStorage.setItem(KEYS.GURU, JSON.stringify(initialGuru));
    safeLocalStorage.setItem(KEYS.MAPEL, JSON.stringify(initialMapel));
    safeLocalStorage.setItem(KEYS.KELAS, JSON.stringify(initialKelas));
    safeLocalStorage.setItem(KEYS.JADWAL, JSON.stringify(initialJadwal));
    safeLocalStorage.setItem(KEYS.RAW_JADWAL, JSON.stringify(initialRawJadwal));
    safeLocalStorage.setItem(MASTER_SYNC_KEY, 'true');
  }

  // Automatic sync to ensure complete operational records (15 Juli 2026 s.d. 4 Agustus 2026 & 7 September 2026) are loaded
  const OPS_DATA_SYNC_KEY = 'simagu_ops_sync_2026_09_07_v5';
  if (typeof window !== 'undefined' && safeLocalStorage.getItem(OPS_DATA_SYNC_KEY) !== 'true') {
    safeLocalStorage.setItem(KEYS.AGENDA_GURU, JSON.stringify(initialAgendaGuru));
    safeLocalStorage.setItem(KEYS.AGENDA_KELAS, JSON.stringify(initialAgendaKelas));
    safeLocalStorage.setItem(KEYS.SUPERVISI, JSON.stringify(initialSupervisi));
    safeLocalStorage.setItem(KEYS.ABSENSI_GURU, JSON.stringify(initialAbsensiGuru));
    safeLocalStorage.setItem(KEYS.ABSENSI_SISWA, JSON.stringify(initialAbsensiSiswa));
    safeLocalStorage.setItem(KEYS.MATERI, JSON.stringify(initialMateri));
    safeLocalStorage.setItem(KEYS.TUGAS, JSON.stringify(initialTugas));
    safeLocalStorage.setItem(KEYS.NILAI_SISWA, JSON.stringify(initialNilaiSiswa));
    safeLocalStorage.setItem(OPS_DATA_SYNC_KEY, 'true');
  }
} catch (e) {
  console.warn('Storage initial sync warning:', e);
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const data = safeLocalStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.warn(`Error loading key ${key}:`, err);
    return fallback;
  }
}

function setItem<T>(key: string, data: T): void {
  try {
    safeLocalStorage.setItem(key, JSON.stringify(data));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && key.startsWith('simagu_') && key !== KEYS.AUDIT_LOGS && key !== KEYS.NOTIFICATIONS) {
      window.dispatchEvent(new CustomEvent('simagu_data_changed', { detail: { key } }));
    }
  } catch (err: any) {
    console.warn(`Storage save warning for key ${key}:`, err?.message || err);
    // If quota exceeded, attempt fallback saving with lighter payload or warn user
    if (err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED' || err.code === 22)) {
      try {
        // Fallback: strip heavy base64 fotoUrls if array data
        if (Array.isArray(data)) {
          const stripped = data.map((item: any) => {
            if (item && typeof item === 'object') {
              return {
                ...item,
                fotoUrls: Array.isArray(item.fotoUrls) ? item.fotoUrls.slice(0, 1) : []
              };
            }
            return item;
          });
          safeLocalStorage.setItem(key, JSON.stringify(stripped));
          if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && key.startsWith('simagu_')) {
            window.dispatchEvent(new CustomEvent('simagu_data_changed', { detail: { key } }));
          }
          return;
        }
      } catch (fallbackErr) {
        console.warn('Fallback save also failed:', fallbackErr);
      }
    }
  }
}

export const Storage = {
  // Settings
  getSetting: (): SchoolSetting => {
    const saved = getItem<SchoolSetting | null>(KEYS.SETTING, null);
    if (!saved) {
      setItem(KEYS.SETTING, initialSchoolSetting);
      return initialSchoolSetting;
    }
    const merged = { ...initialSchoolSetting, ...saved };
    const OFFICIAL_LOGO = '/logo.png';
    if (!merged.logoUrl || merged.logoUrl.includes('blogger.googleusercontent.com') || (!merged.logoUrl.startsWith('data:') && merged.logoUrl !== OFFICIAL_LOGO)) {
      merged.logoUrl = OFFICIAL_LOGO;
      setItem(KEYS.SETTING, merged);
    }
    return merged;
  },
  saveSetting: (setting: SchoolSetting) => setItem(KEYS.SETTING, setting),

  // Users & Auth
  getUsers: (): User[] => {
    const saved = getItem<User[] | null>(KEYS.USERS, null);
    if (!saved || saved.length === 0) {
      setItem(KEYS.USERS, initialUsers);
      return initialUsers;
    }
    return saved;
  },
  saveUsers: (data: User[]) => setItem(KEYS.USERS, data),
  getCurrentUser: (): User => getItem(KEYS.CURRENT_USER, initialUsers[0]), // Default Admin
  setCurrentUser: (user: User | null) => {
    if (user) {
      setItem(KEYS.CURRENT_USER, user);
    } else {
      safeLocalStorage.removeItem(KEYS.CURRENT_USER);
    }
  },

  // Master Data
  getGuru: (): GuruItem[] => {
    const saved = getItem<GuruItem[] | null>(KEYS.GURU, null);
    if (!saved || saved.length === 0) {
      setItem(KEYS.GURU, initialGuru);
      return initialGuru;
    }
    return saved;
  },
  saveGuru: (data: GuruItem[]) => setItem(KEYS.GURU, data),

  getSiswa: (): SiswaItem[] => {
    const saved = getItem<SiswaItem[] | null>(KEYS.SISWA, null);
    if (!saved || saved.length === 0) {
      setItem(KEYS.SISWA, initialSiswa);
      return initialSiswa;
    }
    return saved;
  },
  saveSiswa: (data: SiswaItem[]) => setItem(KEYS.SISWA, data),

  getKelas: (): KelasItem[] => {
    const saved = getItem<KelasItem[] | null>(KEYS.KELAS, null);
    if (!saved || saved.length === 0) {
      setItem(KEYS.KELAS, initialKelas);
      return initialKelas;
    }
    return saved;
  },
  saveKelas: (data: KelasItem[]) => setItem(KEYS.KELAS, data),

  getJurusan: (): JurusanItem[] => {
    const saved = getItem<JurusanItem[] | null>(KEYS.JURUSAN, null);
    if (!saved || saved.length === 0) {
      setItem(KEYS.JURUSAN, initialJurusan);
      return initialJurusan;
    }
    return saved;
  },
  saveJurusan: (data: JurusanItem[]) => setItem(KEYS.JURUSAN, data),

  getMapel: (): MapelItem[] => {
    const saved = getItem<MapelItem[] | null>(KEYS.MAPEL, null);
    if (!saved || saved.length === 0) {
      setItem(KEYS.MAPEL, initialMapel);
      return initialMapel;
    }
    return saved;
  },
  saveMapel: (data: MapelItem[]) => setItem(KEYS.MAPEL, data),

  getJadwal: (): JadwalItem[] => {
    const saved = getItem<JadwalItem[] | null>(KEYS.JADWAL, null);
    if (!saved || saved.length === 0) {
      setItem(KEYS.JADWAL, initialJadwal);
      return initialJadwal;
    }
    return saved;
  },
  saveJadwal: (data: JadwalItem[]) => setItem(KEYS.JADWAL, data),
  addJadwal: (item: JadwalItem) => {
    const list = Storage.getJadwal();
    list.unshift(item);
    Storage.saveJadwal(list);
    Storage.logAudit('CREATE_JADWAL', `Menambah jadwal: ${item.hari} ${item.kelas} - ${item.mapel} (${item.guru})`);
  },
  updateJadwal: (item: JadwalItem) => {
    const list = Storage.getJadwal().map(j => j.id === item.id ? item : j);
    Storage.saveJadwal(list);
    Storage.logAudit('UPDATE_JADWAL', `Memperbarui jadwal ID ${item.id}: ${item.hari} ${item.kelas} - ${item.mapel}`);
  },
  deleteJadwal: (id: string) => {
    const list = Storage.getJadwal().filter(j => j.id !== id);
    Storage.saveJadwal(list);
    Storage.logAudit('DELETE_JADWAL', `Menghapus jadwal ID: ${id}`);
  },

  getRawJadwal: (): RawJadwalItem[] => {
    const saved = getItem<RawJadwalItem[] | null>(KEYS.RAW_JADWAL, null);
    if (!saved || saved.length === 0) {
      setItem(KEYS.RAW_JADWAL, initialRawJadwal);
      return initialRawJadwal;
    }
    return saved;
  },
  saveRawJadwal: (data: RawJadwalItem[]) => setItem(KEYS.RAW_JADWAL, data),

  resetJadwalToOfficial: () => {
    setItem(KEYS.JADWAL, initialJadwal);
    setItem(KEYS.RAW_JADWAL, initialRawJadwal);
    return { jadwal: initialJadwal, rawJadwal: initialRawJadwal };
  },

  syncAllMasterAndJadwal: () => {
    setItem(KEYS.GURU, initialGuru);
    setItem(KEYS.MAPEL, initialMapel);
    setItem(KEYS.KELAS, initialKelas);
    setItem(KEYS.JADWAL, initialJadwal);
    setItem(KEYS.RAW_JADWAL, initialRawJadwal);
    return {
      guru: initialGuru,
      mapel: initialMapel,
      kelas: initialKelas,
      jadwal: initialJadwal,
      rawJadwal: initialRawJadwal
    };
  },

  // Agendas
  getAgendaGuru: (): AgendaGuruItem[] => {
    const list = getItem<AgendaGuruItem[] | null>(KEYS.AGENDA_GURU, null);
    if (!list || (Array.isArray(list) && list.length === 0)) {
      setItem(KEYS.AGENDA_GURU, initialAgendaGuru);
      return initialAgendaGuru;
    }
    // Safety check: ensure records for 2026-09-07 are present
    const hasSept7 = list.some(a => a.tanggal === '2026-09-07');
    if (!hasSept7) {
      const sept7Items = initialAgendaGuru.filter(a => a.tanggal === '2026-09-07');
      if (sept7Items.length > 0) {
        const merged = [...sept7Items, ...list];
        setItem(KEYS.AGENDA_GURU, merged);
        return merged;
      }
    }
    return list;
  },
  saveAgendaGuru: (data: AgendaGuruItem[]) => setItem(KEYS.AGENDA_GURU, data),
  addAgendaGuru: (item: AgendaGuruItem) => {
    const list = Storage.getAgendaGuru();
    const safeList = Array.isArray(list) ? [...list] : [];
    safeList.unshift(item);
    Storage.saveAgendaGuru(safeList);

    // Toast confirmation
    toast.success('Agenda Guru Berhasil Disimpan! ✨', {
      description: `Kelas: ${item.kelas} • Mapel: ${item.mapel}`,
    });

    // Auto notification if any student marked Alpa
    if (item.alpa > 0 && Array.isArray(item.siswaTidakHadir) && item.siswaTidakHadir.length > 0) {
      const alpaStudents = item.siswaTidakHadir.filter(s => s && s.kategori === 'Alpa').map(s => s.nama).join(', ');
      if (alpaStudents) {
        Storage.addNotification({
          id: 'notif-' + Date.now(),
          title: `Peringatan Alpa: ${item.kelas}`,
          message: `Terdapat ${item.alpa} siswa Alpa pada jam pelajaran ${item.namaGuru}: ${alpaStudents}. Mohon Wali Kelas menindaklanjuti.`,
          type: 'alert',
          timestamp: new Date().toLocaleString('id-ID'),
          read: false,
          targetRole: 'Wali Kelas'
        });
      }
    }

    Storage.logAudit('CREATE_AGENDA_GURU', `Membuat Agenda Guru #${item.nomorAgenda} untuk kelas ${item.kelas}`);
  },
  updateAgendaGuru: (item: AgendaGuruItem) => {
    const list = Storage.getAgendaGuru().map(a => a.id === item.id ? item : a);
    Storage.saveAgendaGuru(list);
    toast.success('Agenda Guru Berhasil Diperbarui! 📝', {
      description: `Agenda #${item.nomorAgenda} (${item.kelas})`
    });
    Storage.logAudit('UPDATE_AGENDA_GURU', `Mengubah Agenda Guru #${item.nomorAgenda} - ${item.kelas}`);
  },
  deleteAgendaGuru: (id: string) => {
    const list = Storage.getAgendaGuru().filter(a => a.id !== id);
    Storage.saveAgendaGuru(list);
    toast.info('Agenda Guru Berhasil Dihapus 🗑️');
    Storage.logAudit('DELETE_AGENDA_GURU', `Menghapus Agenda Guru ID: ${id}`);
  },

  getAgendaKelas: (): AgendaKelasItem[] => {
    const list = getItem<AgendaKelasItem[] | null>(KEYS.AGENDA_KELAS, null);
    if (!list || (Array.isArray(list) && list.length === 0)) {
      setItem(KEYS.AGENDA_KELAS, initialAgendaKelas);
      return initialAgendaKelas;
    }
    // Safety check: ensure records for 2026-09-07 are present
    const hasSept7 = list.some(a => a.tanggal === '2026-09-07');
    if (!hasSept7) {
      const sept7Items = initialAgendaKelas.filter(a => a.tanggal === '2026-09-07');
      if (sept7Items.length > 0) {
        const merged = [...sept7Items, ...list];
        setItem(KEYS.AGENDA_KELAS, merged);
        return merged;
      }
    }
    return list;
  },
  saveAgendaKelas: (data: AgendaKelasItem[]) => setItem(KEYS.AGENDA_KELAS, data),
  addAgendaKelas: (item: AgendaKelasItem) => {
    const list = Storage.getAgendaKelas();
    list.unshift(item);
    Storage.saveAgendaKelas(list);
    toast.success('Agenda Kelas Berhasil Disimpan! ✨', {
      description: `Kelas: ${item.kelas} • Agenda #${item.nomorAgenda}`
    });
    Storage.logAudit('CREATE_AGENDA_KELAS', `Membuat Agenda Kelas #${item.nomorAgenda} - ${item.kelas}`);
  },
  updateAgendaKelas: (item: AgendaKelasItem) => {
    const list = Storage.getAgendaKelas().map(a => a.id === item.id ? item : a);
    Storage.saveAgendaKelas(list);
    toast.success('Agenda Kelas Berhasil Diperbarui! 📝');
    Storage.logAudit('UPDATE_AGENDA_KELAS', `Mengubah Agenda Kelas #${item.nomorAgenda} - ${item.kelas}`);
  },
  deleteAgendaKelas: (id: string) => {
    const list = Storage.getAgendaKelas().filter(a => a.id !== id);
    Storage.saveAgendaKelas(list);
    toast.info('Agenda Kelas Berhasil Dihapus 🗑️');
    Storage.logAudit('DELETE_AGENDA_KELAS', `Menghapus Agenda Kelas ID: ${id}`);
  },

  addPelanggaran: (pelanggaran: { id_siswa?: string; namaSiswa: string; kelas: string; tanggal?: string; pelanggaran: string; poin: number; tindakan: string; tindakLanjut: string }) => {
    const list = Storage.getAgendaKelas();
    const today = pelanggaran.tanggal || new Date().toISOString().slice(0, 10);
    let target = list.find(a => a.kelas === pelanggaran.kelas && a.tanggal === today);
    if (!target) {
      target = list.find(a => a.kelas === pelanggaran.kelas);
    }

    const kategori: 'Ringan' | 'Sedang' | 'Berat' = pelanggaran.poin >= 25 ? 'Berat' : pelanggaran.poin >= 10 ? 'Sedang' : 'Ringan';
    const itemToAdd = {
      id: 'plg-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      namaSiswa: pelanggaran.namaSiswa,
      pelanggaran: pelanggaran.pelanggaran,
      kategori,
      poin: pelanggaran.poin,
      guruPelapor: 'Guru Pengampu / Wali Kelas',
      tindakan: pelanggaran.tindakan,
      tindakLanjut: pelanggaran.tindakLanjut
    };

    if (target) {
      if (!target.pelanggaranList) target.pelanggaranList = [];
      target.pelanggaranList.push(itemToAdd);
      Storage.saveAgendaKelas([...list]);
    } else {
      const isAPHP = pelanggaran.kelas.includes('APHP');
      const newAK: AgendaKelasItem = {
        id: 'ak-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        nomorAgenda: `AK/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
        tahunPelajaran: '2024/2025',
        semester: 'Genap',
        tanggal: today,
        hari: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date(today).getDay()] || 'Senin',
        kelas: pelanggaran.kelas,
        jurusan: isAPHP ? 'Agribisnis Pengolahan Hasil Pertanian (APHP)' : 'Desain Komunikasi Visual (DKV)',
        konsentrasiKeahlian: isAPHP ? 'Agribisnis Pengolahan Hasil Pertanian' : 'Desain Komunikasi Visual',
        waliKelas: 'Wali Kelas',
        ketuaKelas: 'Ketua Rombel',
        wakilKetua: 'Wakil Ketua',
        jumlahSiswa: 36,
        jumlahLaki: 18,
        jumlahPerempuan: 18,
        hadir: 36,
        sakit: 0,
        izin: 0,
        alpa: 0,
        terlambat: 0,
        persentase: 100,
        siswaTidakHadir: [],
        monitoringPembelajaran: [],
        agendaRoutine: [],
        pelanggaranList: [itemToAdd],
        prestasiList: [],
        kesehatanList: [],
        inventarisList: [],
        komunikasiOrtuList: [],
        catatanWaliKelas: {
          kondisiUmum: 'Baik dan tertib',
          kedisiplinan: 'Tertib',
          budayaPositif: '5S Berjalan Baik',
          kebersihan: 'Bersih',
          keamanan: 'Kondusif',
          siswaBermasalah: '',
          siswaBerprestasi: '',
          tindakLanjut: ''
        },
        validatedByWali: true
      };
      Storage.saveAgendaKelas([newAK, ...list]);
    }
    Storage.logAudit('CREATE_PELANGGARAN', `Mencatat pelanggaran siswa: ${pelanggaran.namaSiswa} (${pelanggaran.kelas}) - ${pelanggaran.pelanggaran}`);
  },

  updatePelanggaran: (pelanggaranId: string, updated: { namaSiswa?: string; pelanggaran?: string; kategori?: 'Ringan' | 'Sedang' | 'Berat'; poin?: number; tindakan?: string; tindakLanjut?: string; kronologi?: string; sanksi?: string; status?: 'Dalam Pembinaan' | 'Selesai' | 'Surat Panggilan' }) => {
    const list = Storage.getAgendaKelas();
    let found = false;
    list.forEach(ak => {
      if (ak.pelanggaranList) {
        ak.pelanggaranList = ak.pelanggaranList.map(p => {
          if (p.id === pelanggaranId) {
            found = true;
            return { ...p, ...updated };
          }
          return p;
        });
      }
    });
    if (found) {
      Storage.saveAgendaKelas([...list]);
      Storage.logAudit('UPDATE_PELANGGARAN', `Memperbarui data pelanggaran ID: ${pelanggaranId}`);
    }
  },

  deletePelanggaran: (pelanggaranId: string) => {
    const list = Storage.getAgendaKelas();
    let found = false;
    list.forEach(ak => {
      if (ak.pelanggaranList) {
        const initialLen = ak.pelanggaranList.length;
        ak.pelanggaranList = ak.pelanggaranList.filter(p => p.id !== pelanggaranId);
        if (ak.pelanggaranList.length !== initialLen) found = true;
      }
    });
    if (found) {
      Storage.saveAgendaKelas([...list]);
      Storage.logAudit('DELETE_PELANGGARAN', `Menghapus pelanggaran ID: ${pelanggaranId}`);
    }
  },

  addPrestasi: (prestasi: { id_siswa?: string; namaSiswa: string; kelas: string; tanggal?: string; bidang: string; tingkat: string; juara: string; keterangan: string }) => {
    const list = Storage.getAgendaKelas();
    const today = prestasi.tanggal || new Date().toISOString().slice(0, 10);
    let target = list.find(a => a.kelas === prestasi.kelas && a.tanggal === today);
    if (!target) {
      target = list.find(a => a.kelas === prestasi.kelas);
    }

    let tingkat: 'Sekolah' | 'Kabupaten' | 'Provinsi' | 'Nasional' | 'Internasional' = 'Kabupaten';
    if (prestasi.tingkat.includes('Sekolah') || prestasi.tingkat.includes('Kecamatan')) tingkat = 'Sekolah';
    else if (prestasi.tingkat.includes('Provinsi') || prestasi.tingkat.includes('Priangan')) tingkat = 'Provinsi';
    else if (prestasi.tingkat.includes('Nasional')) tingkat = 'Nasional';
    else if (prestasi.tingkat.includes('Internasional')) tingkat = 'Internasional';

    const itemToAdd = {
      id: 'prs-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      namaSiswa: prestasi.namaSiswa,
      bidang: prestasi.bidang,
      tingkat,
      juara: prestasi.juara,
      tanggal: today,
      keterangan: prestasi.keterangan
    };

    if (target) {
      if (!target.prestasiList) target.prestasiList = [];
      target.prestasiList.push(itemToAdd);
      Storage.saveAgendaKelas([...list]);
    } else {
      const isAPHP = prestasi.kelas.includes('APHP');
      const newAK: AgendaKelasItem = {
        id: 'ak-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        nomorAgenda: `AK/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
        tahunPelajaran: '2024/2025',
        semester: 'Genap',
        tanggal: today,
        hari: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date(today).getDay()] || 'Senin',
        kelas: prestasi.kelas,
        jurusan: isAPHP ? 'Agribisnis Pengolahan Hasil Pertanian (APHP)' : 'Desain Komunikasi Visual (DKV)',
        konsentrasiKeahlian: isAPHP ? 'Agribisnis Pengolahan Hasil Pertanian' : 'Desain Komunikasi Visual',
        waliKelas: 'Wali Kelas',
        ketuaKelas: 'Ketua Rombel',
        wakilKetua: 'Wakil Ketua',
        jumlahSiswa: 36,
        jumlahLaki: 18,
        jumlahPerempuan: 18,
        hadir: 36,
        sakit: 0,
        izin: 0,
        alpa: 0,
        terlambat: 0,
        persentase: 100,
        siswaTidakHadir: [],
        monitoringPembelajaran: [],
        agendaRoutine: [],
        pelanggaranList: [],
        prestasiList: [itemToAdd],
        kesehatanList: [],
        inventarisList: [],
        komunikasiOrtuList: [],
        catatanWaliKelas: {
          kondisiUmum: 'Baik dan tertib',
          kedisiplinan: 'Tertib',
          budayaPositif: '5S Berjalan Baik',
          kebersihan: 'Bersih',
          keamanan: 'Kondusif',
          siswaBermasalah: '',
          siswaBerprestasi: '',
          tindakLanjut: ''
        },
        validatedByWali: true
      };
      Storage.saveAgendaKelas([newAK, ...list]);
    }
    Storage.logAudit('CREATE_PRESTASI', `Mencatat prestasi siswa: ${prestasi.namaSiswa} (${prestasi.kelas}) - ${prestasi.juara} ${prestasi.bidang}`);
  },

  updatePrestasi: (prestasiId: string, updated: { namaSiswa?: string; bidang?: string; tingkat?: 'Sekolah' | 'Kabupaten' | 'Provinsi' | 'Nasional' | 'Internasional'; juara?: string; tanggal?: string; keterangan?: string; namaKegiatan?: string; penyelenggara?: string }) => {
    const list = Storage.getAgendaKelas();
    let found = false;
    list.forEach(ak => {
      if (ak.prestasiList) {
        ak.prestasiList = ak.prestasiList.map(p => {
          if (p.id === prestasiId) {
            found = true;
            return { ...p, ...updated };
          }
          return p;
        });
      }
    });
    if (found) {
      Storage.saveAgendaKelas([...list]);
      Storage.logAudit('UPDATE_PRESTASI', `Memperbarui prestasi ID: ${prestasiId}`);
    }
  },

  deletePrestasi: (prestasiId: string) => {
    const list = Storage.getAgendaKelas();
    let found = false;
    list.forEach(ak => {
      if (ak.prestasiList) {
        const initialLen = ak.prestasiList.length;
        ak.prestasiList = ak.prestasiList.filter(p => p.id !== prestasiId);
        if (ak.prestasiList.length !== initialLen) found = true;
      }
    });
    if (found) {
      Storage.saveAgendaKelas([...list]);
      Storage.logAudit('DELETE_PRESTASI', `Menghapus prestasi ID: ${prestasiId}`);
    }
  },

  addInventaris: (inventaris: { 
    kelas: string; 
    barang: string; 
    jumlah: number; 
    baik: number; 
    rusakRingan: number; 
    rusakBerat: number; 
    keterangan: string;
    kode?: string;
    kategori?: string;
    satuan?: string;
    kondisi?: 'Baik' | 'Rusak Ringan' | 'Rusak Berat' | 'Hilang';
    lokasi?: string;
    tanggalPengadaan?: string;
    sumberDana?: string;
  }) => {
    const list = Storage.getAgendaKelas();
    let target = list.find(a => a.kelas === inventaris.kelas);
    const itemToAdd = {
      id: 'inv-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      kode: inventaris.kode || `INV-${inventaris.kelas.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      kategori: inventaris.kategori || 'Perlengkapan Kelas',
      satuan: inventaris.satuan || 'Unit',
      kondisi: inventaris.kondisi || (inventaris.rusakBerat > 0 ? 'Rusak Berat' : inventaris.rusakRingan > 0 ? 'Rusak Ringan' : 'Baik'),
      lokasi: inventaris.lokasi || inventaris.kelas,
      tanggalPengadaan: inventaris.tanggalPengadaan || new Date().toISOString().slice(0, 10),
      sumberDana: inventaris.sumberDana || 'BOS Reguler / Sarpras',
      barang: inventaris.barang,
      jumlah: inventaris.jumlah,
      baik: inventaris.baik,
      rusakRingan: inventaris.rusakRingan,
      rusakBerat: inventaris.rusakBerat,
      keterangan: inventaris.keterangan
    };

    if (target) {
      if (!target.inventarisList) target.inventarisList = [];
      target.inventarisList.push(itemToAdd);
      Storage.saveAgendaKelas([...list]);
    } else {
      const isAPHP = inventaris.kelas.includes('APHP');
      const today = new Date().toISOString().slice(0, 10);
      const newAK: AgendaKelasItem = {
        id: 'ak-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        nomorAgenda: `AK/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(100 + Math.random() * 900)}`,
        tahunPelajaran: '2024/2025',
        semester: 'Genap',
        tanggal: today,
        hari: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][new Date(today).getDay()] || 'Senin',
        kelas: inventaris.kelas,
        jurusan: isAPHP ? 'Agribisnis Pengolahan Hasil Pertanian (APHP)' : 'Desain Komunikasi Visual (DKV)',
        konsentrasiKeahlian: isAPHP ? 'Agribisnis Pengolahan Hasil Pertanian' : 'Desain Komunikasi Visual',
        waliKelas: 'Wali Kelas',
        ketuaKelas: 'Ketua Rombel',
        wakilKetua: 'Wakil Ketua',
        jumlahSiswa: 36,
        jumlahLaki: 18,
        jumlahPerempuan: 18,
        hadir: 36,
        sakit: 0,
        izin: 0,
        alpa: 0,
        terlambat: 0,
        persentase: 100,
        siswaTidakHadir: [],
        monitoringPembelajaran: [],
        agendaRoutine: [],
        pelanggaranList: [],
        prestasiList: [],
        kesehatanList: [],
        inventarisList: [itemToAdd],
        komunikasiOrtuList: [],
        catatanWaliKelas: {
          kondisiUmum: 'Baik dan tertib',
          kedisiplinan: 'Tertib',
          budayaPositif: '5S Berjalan Baik',
          kebersihan: 'Bersih',
          keamanan: 'Kondusif',
          siswaBermasalah: '',
          siswaBerprestasi: '',
          tindakLanjut: ''
        },
        validatedByWali: true
      };
      Storage.saveAgendaKelas([newAK, ...list]);
    }
    Storage.logAudit('CREATE_INVENTARIS', `Mencatat inventaris barang: ${inventaris.barang} untuk kelas ${inventaris.kelas}`);
  },

  updateInventaris: (identifier: string, updated: any) => {
    const list = Storage.getAgendaKelas();
    let found = false;
    list.forEach(ak => {
      if (ak.inventarisList) {
        ak.inventarisList = ak.inventarisList.map((inv: any) => {
          if (inv.id === identifier || inv.barang === identifier) {
            found = true;
            return { ...inv, ...updated };
          }
          return inv;
        });
      }
    });
    if (found) {
      Storage.saveAgendaKelas([...list]);
      Storage.logAudit('UPDATE_INVENTARIS', `Memperbarui inventaris: ${updated.barang || identifier}`);
    }
  },

  deleteInventaris: (identifier: string) => {
    const list = Storage.getAgendaKelas();
    let found = false;
    list.forEach(ak => {
      if (ak.inventarisList) {
        const initialLen = ak.inventarisList.length;
        ak.inventarisList = ak.inventarisList.filter((inv: any) => inv.id !== identifier && inv.barang !== identifier);
        if (ak.inventarisList.length !== initialLen) found = true;
      }
    });
    if (found) {
      Storage.saveAgendaKelas([...list]);
      Storage.logAudit('DELETE_INVENTARIS', `Menghapus inventaris: ${identifier}`);
    }
  },

  // Absensi
  getAbsensiGuru: (): AbsensiGuruRecord[] => {
    return getItem(KEYS.ABSENSI_GURU, initialAbsensiGuru);
  },
  saveAbsensiGuru: (data: AbsensiGuruRecord[]) => setItem(KEYS.ABSENSI_GURU, data),

  getAbsensiSiswa: (): AbsensiSiswaRecord[] => {
    return getItem(KEYS.ABSENSI_SISWA, initialAbsensiSiswa);
  },
  saveAbsensiSiswa: (data: AbsensiSiswaRecord[]) => setItem(KEYS.ABSENSI_SISWA, data),
  deleteAbsensiRecord: (id: string) => {
    const list = Storage.getAbsensiSiswa().filter(a => a.id !== id);
    Storage.saveAbsensiSiswa(list);
    Storage.logAudit('DELETE_ABSENSI_SISWA', `Menghapus record presensi siswa ID: ${id}`);
  },
  deleteAbsensiSession: (kelas: string, tanggal: string, mapel?: string) => {
    const list = Storage.getAbsensiSiswa().filter(a => {
      const matchKelas = a.kelas === kelas;
      const matchTanggal = a.tanggal === tanggal;
      const matchMapel = !mapel || !a.mapel || a.mapel.toLowerCase() === mapel.toLowerCase();
      return !(matchKelas && matchTanggal && matchMapel);
    });
    Storage.saveAbsensiSiswa(list);
    Storage.logAudit('DELETE_ABSENSI_SESSION', `Menghapus sesi presensi kelas ${kelas} tanggal ${tanggal} mapel ${mapel || 'Semua'}`);
  },
  updateAbsensiRecord: (item: AbsensiSiswaRecord) => {
    const list = Storage.getAbsensiSiswa().map(a => a.id === item.id ? item : a);
    Storage.saveAbsensiSiswa(list);
    Storage.logAudit('UPDATE_ABSENSI_SISWA', `Memperbarui presensi ${item.namaSiswa}: ${item.status}`);
  },

  // Supervisi
  getSupervisi: (): SupervisiRecord[] => {
    const list = getItem<SupervisiRecord[] | null>(KEYS.SUPERVISI, null);
    if (!list || (Array.isArray(list) && list.length === 0)) {
      setItem(KEYS.SUPERVISI, initialSupervisi);
      return initialSupervisi;
    }
    return list;
  },
  saveSupervisi: (data: SupervisiRecord[]) => setItem(KEYS.SUPERVISI, data),
  addSupervisi: (item: SupervisiRecord) => {
    const list = Storage.getSupervisi();
    list.unshift(item);
    Storage.saveSupervisi(list);
    toast.success('Hasil Supervisi Berhasil Disimpan! 📋', { description: `Guru: ${item.namaGuru} • Skor: ${item.skorAkhir}` });
    Storage.logAudit('CREATE_SUPERVISI', `Mencatat supervisi akademik guru: ${item.namaGuru} (${item.kelas} - ${item.mapel})`);
  },
  updateSupervisi: (item: SupervisiRecord) => {
    const list = Storage.getSupervisi().map(s => s.id === item.id ? item : s);
    Storage.saveSupervisi(list);
    toast.success('Data Supervisi Berhasil Diperbarui! 📝');
    Storage.logAudit('UPDATE_SUPERVISI', `Memperbarui supervisi guru: ${item.namaGuru} (ID: ${item.id})`);
  },
  deleteSupervisi: (id: string) => {
    const list = Storage.getSupervisi().filter(s => s.id !== id);
    Storage.saveSupervisi(list);
    toast.info('Data Supervisi Telah Dihapus 🗑️');
    Storage.logAudit('DELETE_SUPERVISI', `Menghapus data supervisi ID: ${id}`);
  },

  // Materi & Tugas
  getMateri: (): MateriRecord[] => {
    return getItem(KEYS.MATERI, initialMateri);
  },
  saveMateri: (data: MateriRecord[]) => setItem(KEYS.MATERI, data),
  addMateri: (item: MateriRecord) => {
    const list = Storage.getMateri();
    list.unshift(item);
    Storage.saveMateri(list);
    toast.success('Materi Pembelajaran Disimpan! 📚', { description: item.judulMateri });
    Storage.logAudit('CREATE_MATERI', `Membuat Materi: ${item.judulMateri} (${item.kelas})`);
  },
  updateMateri: (item: MateriRecord) => {
    const list = Storage.getMateri().map(m => m.id === item.id ? item : m);
    Storage.saveMateri(list);
    toast.success('Materi Pembelajaran Diperbarui! 📝');
    Storage.logAudit('UPDATE_MATERI', `Mengubah Materi: ${item.judulMateri}`);
  },
  deleteMateri: (id: string) => {
    const list = Storage.getMateri().filter(m => m.id !== id);
    Storage.saveMateri(list);
    toast.info('Materi Pembelajaran Dihapus 🗑️');
    Storage.logAudit('DELETE_MATERI', `Menghapus Materi ID: ${id}`);
  },

  getTugas: (): TugasRecord[] => {
    return getItem(KEYS.TUGAS, initialTugas);
  },
  saveTugas: (data: TugasRecord[]) => setItem(KEYS.TUGAS, data),
  addTugas: (item: TugasRecord) => {
    const list = Storage.getTugas();
    list.unshift(item);
    Storage.saveTugas(list);
    toast.success('Tugas/PR Berhasil Disimpan! 📌', { description: item.judulTugas });
    Storage.logAudit('CREATE_TUGAS', `Membuat Tugas: ${item.judulTugas} (${item.kelas})`);
  },
  updateTugas: (item: TugasRecord) => {
    const list = Storage.getTugas().map(t => t.id === item.id ? item : t);
    Storage.saveTugas(list);
    toast.success('Tugas/PR Berhasil Diperbarui! 📝');
    Storage.logAudit('UPDATE_TUGAS', `Mengubah Tugas: ${item.judulTugas}`);
  },
  deleteTugas: (id: string) => {
    const list = Storage.getTugas().filter(t => t.id !== id);
    Storage.saveTugas(list);
    toast.info('Tugas/PR Dihapus 🗑️');
    Storage.logAudit('DELETE_TUGAS', `Menghapus Tugas ID: ${id}`);
  },

  // Input Nilai Siswa
  getNilaiSiswa: (): NilaiSiswaRecord[] => {
    const saved = getItem(KEYS.NILAI_SISWA, initialNilaiSiswa);
    if (!saved || saved.length < 10) {
      setItem(KEYS.NILAI_SISWA, initialNilaiSiswa);
      return initialNilaiSiswa;
    }
    return saved;
  },
  saveNilaiSiswa: (data: NilaiSiswaRecord[]) => setItem(KEYS.NILAI_SISWA, data),
  bulkSaveNilaiSiswa: (newRecords: NilaiSiswaRecord[]) => {
    const currentList = Storage.getNilaiSiswa();
    // Replace or insert
    const map = new Map<string, NilaiSiswaRecord>();
    currentList.forEach(item => map.set(item.id, item));
    newRecords.forEach(item => map.set(item.id, item));
    const updated = Array.from(map.values());
    Storage.saveNilaiSiswa(updated);
    if (newRecords.length > 0) {
      toast.success(`${newRecords.length} Nilai Siswa Berhasil Disimpan! 💯`, {
        description: `Kelas: ${newRecords[0].kelas} • Mapel: ${newRecords[0].mapel}`
      });
      Storage.logAudit('INPUT_NILAI', `Menginput ${newRecords.length} nilai siswa untuk kelas ${newRecords[0].kelas} - ${newRecords[0].mapel}`);
    }
  },
  deleteAssessment: (assessmentId: string) => {
    const list = Storage.getNilaiSiswa().filter(n => n.assessmentId !== assessmentId);
    Storage.saveNilaiSiswa(list);
    toast.info('Data Penilaian Berhasil Dihapus 🗑️');
    Storage.logAudit('DELETE_ASSESSMENT', `Menghapus seluruh nilai untuk penilaian ID: ${assessmentId}`);
  },
  updateAssessmentMetadata: (assessmentId: string, updates: Partial<NilaiSiswaRecord>) => {
    const list = Storage.getNilaiSiswa().map(n => {
      if (n.assessmentId === assessmentId) {
        return { ...n, ...updates };
      }
      return n;
    });
    Storage.saveNilaiSiswa(list);
    toast.success('Informasi Penilaian Berhasil Diperbarui! 📝');
    Storage.logAudit('UPDATE_ASSESSMENT', `Memperbarui parameter penilaian ID: ${assessmentId}`);
  },
  deleteNilaiSiswa: (id: string) => {
    const list = Storage.getNilaiSiswa().filter(n => n.id !== id);
    Storage.saveNilaiSiswa(list);
    toast.info('Nilai Siswa Dihapus 🗑️');
    Storage.logAudit('DELETE_NILAI_SISWA', `Menghapus nilai siswa ID: ${id}`);
  },

  // Monitoring Pembelajaran
  getMonitoringPembelajaran: (): MonitoringPembelajaranRecord[] => {
    const list = getItem<MonitoringPembelajaranRecord[] | null>(KEYS.MONITORING_PEMBELAJARAN, null);
    if (!list || (Array.isArray(list) && list.length === 0)) {
      setItem(KEYS.MONITORING_PEMBELAJARAN, initialMonitoringPembelajaran);
      return initialMonitoringPembelajaran;
    }
    return list;
  },
  saveMonitoringPembelajaran: (data: MonitoringPembelajaranRecord[]) => setItem(KEYS.MONITORING_PEMBELAJARAN, data),
  addMonitoringPembelajaran: (item: MonitoringPembelajaranRecord) => {
    const list = Storage.getMonitoringPembelajaran();
    list.unshift(item);
    Storage.saveMonitoringPembelajaran(list);
    toast.success('Data Monitoring Pembelajaran Berhasil Disimpan! 📊', { description: `${item.kelas} • ${item.mapel}` });
    Storage.logAudit('CREATE_MONITORING', `Mencatat monitoring KBM #${item.nomorMonitoring} - ${item.guru} (${item.kelas} - ${item.mapel})`);
  },
  updateMonitoringPembelajaran: (item: MonitoringPembelajaranRecord) => {
    const list = Storage.getMonitoringPembelajaran().map(m => m.id === item.id ? item : m);
    Storage.saveMonitoringPembelajaran(list);
    toast.success('Data Monitoring Berhasil Diperbarui! 📝');
    Storage.logAudit('UPDATE_MONITORING', `Memperbarui monitoring KBM #${item.nomorMonitoring} (ID: ${item.id})`);
  },
  deleteMonitoringPembelajaran: (id: string) => {
    const list = Storage.getMonitoringPembelajaran().filter(m => m.id !== id);
    Storage.saveMonitoringPembelajaran(list);
    toast.info('Data Monitoring Pembelajaran Dihapus 🗑️');
    Storage.logAudit('DELETE_MONITORING', `Menghapus monitoring pembelajaran ID: ${id}`);
  },

  // Notifications
  getNotifications: (): NotificationItem[] => getItem(KEYS.NOTIFICATIONS, initialNotifications),
  addNotification: (notif: NotificationItem) => {
    const list = Storage.getNotifications();
    list.unshift(notif);
    setItem(KEYS.NOTIFICATIONS, list);
  },
  markNotificationRead: (id: string) => {
    const list = Storage.getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    setItem(KEYS.NOTIFICATIONS, list);
  },

  // Audit Logs
  getAuditLogs: (): AuditLogItem[] => getItem(KEYS.AUDIT_LOGS, initialAuditLogs),
  saveAuditLogs: (logs: AuditLogItem[]) => setItem(KEYS.AUDIT_LOGS, logs),
  clearAuditLogs: () => setItem(KEYS.AUDIT_LOGS, []),
  deleteAuditLog: (id: string) => {
    const logs = Storage.getAuditLogs().filter(l => l.id !== id);
    setItem(KEYS.AUDIT_LOGS, logs);
  },
  logAudit: (action: string, details: string, userOverride?: { nama?: string; role?: string }) => {
    const user = Storage.getCurrentUser();
    const logs = Storage.getAuditLogs();
    const userName = userOverride?.nama || user?.nama || 'Administrator SIMAGU';
    const userRole = userOverride?.role || user?.role || 'Administrator';
    
    logs.unshift({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-'),
      user: userName,
      role: userRole,
      action,
      details,
      ipAddress: '127.0.0.1'
    });
    setItem(KEYS.AUDIT_LOGS, logs.slice(0, 300)); // Keep latest 300 logs
  },

  // Theme
  getThemeMode: (): 'light' | 'dark' => getItem(KEYS.THEME, 'light'),
  setThemeMode: (theme: 'light' | 'dark') => setItem(KEYS.THEME, theme),

  // Backup & Restore
  exportBackupJSON: () => {
    const rawLocalStorage: Record<string, any> = {};
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('simagu_')) {
          try {
            rawLocalStorage[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch {
            rawLocalStorage[key] = localStorage.getItem(key);
          }
        }
      }
    }

    const data = {
      setting: Storage.getSetting(),
      guru: Storage.getGuru(),
      siswa: Storage.getSiswa(),
      kelas: Storage.getKelas(),
      jurusan: Storage.getJurusan(),
      mapel: Storage.getMapel(),
      jadwal: Storage.getJadwal(),
      agendaGuru: Storage.getAgendaGuru(),
      agendaKelas: Storage.getAgendaKelas(),
      absensiGuru: Storage.getAbsensiGuru(),
      absensiSiswa: Storage.getAbsensiSiswa(),
      supervisi: Storage.getSupervisi(),
      materi: Storage.getMateri(),
      tugas: Storage.getTugas(),
      nilaiSiswa: Storage.getNilaiSiswa(),
      users: Storage.getUsers(),
      notifications: Storage.getNotifications(),
      auditLogs: Storage.getAuditLogs(),
      rawState: rawLocalStorage,
      version: '1.0.0',
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SIMAGU_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    Storage.logAudit('BACKUP_DATABASE', 'Mengeksport backup data SIMAGU (localStorage) dalam format JSON');
  },

  importBackupJSON: (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.setting) Storage.saveSetting(parsed.setting);
      if (parsed.guru) Storage.saveGuru(parsed.guru);
      if (parsed.siswa) Storage.saveSiswa(parsed.siswa);
      if (parsed.kelas) Storage.saveKelas(parsed.kelas);
      if (parsed.jurusan) Storage.saveJurusan(parsed.jurusan);
      if (parsed.mapel) Storage.saveMapel(parsed.mapel);
      if (parsed.jadwal) Storage.saveJadwal(parsed.jadwal);
      if (parsed.agendaGuru) Storage.saveAgendaGuru(parsed.agendaGuru);
      if (parsed.agendaKelas) Storage.saveAgendaKelas(parsed.agendaKelas);
      if (parsed.absensiGuru) Storage.saveAbsensiGuru(parsed.absensiGuru);
      if (parsed.absensiSiswa) Storage.saveAbsensiSiswa(parsed.absensiSiswa);
      if (parsed.supervisi) Storage.saveSupervisi(parsed.supervisi);
      if (parsed.materi) Storage.saveMateri(parsed.materi);
      if (parsed.tugas) Storage.saveTugas(parsed.tugas);
      if (parsed.nilaiSiswa) Storage.saveNilaiSiswa(parsed.nilaiSiswa);
      if (parsed.users) Storage.saveUsers(parsed.users);
      if (parsed.notifications) setItem(KEYS.NOTIFICATIONS, parsed.notifications);
      if (parsed.auditLogs) Storage.saveAuditLogs(parsed.auditLogs);

      if (parsed.rawState && typeof parsed.rawState === 'object') {
        Object.entries(parsed.rawState).forEach(([k, v]) => {
          if (k.startsWith('simagu_')) {
            safeLocalStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
          }
        });
      }
      Storage.logAudit('RESTORE_DATABASE', 'Memulihkan database SIMAGU dari file backup JSON');
      return true;
    } catch (err) {
      console.error('Failed to import backup:', err);
      return false;
    }
  },

  resetAllToDefault: () => {
    safeLocalStorage.clear();
    Storage.logAudit('RESET_DATABASE', 'Mengembalikan seluruh data SIMAGU ke setelan awal pabrik');
    window.location.reload();
  },

  // Google Drive Folder Structure Generator
  generateGoogleDriveFolderStructure: async (options?: {
    accessToken?: string;
    tahunAjaran?: string;
    jurusanList?: JurusanItem[];
    schoolName?: string;
  }): Promise<DriveFolderStructure> => {
    const setting = Storage.getSetting();
    const jurusanList = options?.jurusanList || Storage.getJurusan();
    const tahunAjaran = options?.tahunAjaran || setting.tahunPelajaran || '2026/2027';
    const schoolName = options?.schoolName || setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR';

    // 1. Try real Google Drive folder creation if accessToken is provided
    if (options?.accessToken) {
      try {
        const res = await fetch('/api/drive/create-folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: options.accessToken,
            tahunAjaran,
            jurusanList,
            schoolName
          })
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success && result.folderStructure) {
            setItem('simagu_drive_folder_structure', result.folderStructure);
            Storage.logAudit('DRIVE_FOLDER_CREATE', `Berhasil membuat & menyinkronkan folder Google Drive untuk TA ${tahunAjaran}`);
            return result.folderStructure;
          }
        }
      } catch (err) {
        console.warn('Google Drive backend endpoint error, generating local structure representation:', err);
      }
    }

    // 2. Fallback / Local structure generation
    const sanitizedSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
    const sanitizedTA = tahunAjaran.replace(/\//g, '-');
    const rootPath = `SIMAGU_Laporan_${sanitizedSchool}`;
    const taPath = `${rootPath}/Tahun_Ajaran_${sanitizedTA}`;

    const departments: DriveDepartmentFolderStructure[] = (jurusanList.length > 0 ? jurusanList : [
      { id: '1', kodeJurusan: 'DKV', namaJurusan: 'Desain Komunikasi Visual', kepalaJurusan: '' },
      { id: '2', kodeJurusan: 'APHP', namaJurusan: 'Agribisnis Pengolahan Hasil Pertanian', kepalaJurusan: '' }
    ]).map(j => {
      const deptFolder = `${j.namaJurusan} (${j.kodeJurusan})`;
      const basePath = `${taPath}/${deptFolder}`;
      return {
        kodeJurusan: j.kodeJurusan,
        namaJurusan: j.namaJurusan,
        folderName: deptFolder,
        path: basePath,
        subfolders: {
          agendaGuru: { name: '01_Laporan_Agenda_Guru', path: `${basePath}/01_Laporan_Agenda_Guru` },
          agendaKelas: { name: '02_Laporan_Agenda_Kelas', path: `${basePath}/02_Laporan_Agenda_Kelas` },
          supervisi: { name: '03_Laporan_Supervisi_Guru', path: `${basePath}/03_Laporan_Supervisi_Guru` },
          presensiSiswa: { name: '04_Rekap_Presensi_Siswa', path: `${basePath}/04_Rekap_Presensi_Siswa` },
          exportFiles: { name: '05_Berkas_Export_PDF_Excel', path: `${basePath}/05_Berkas_Export_PDF_Excel` }
        }
      };
    });

    const structure: DriveFolderStructure = {
      schoolName,
      tahunAjaran,
      rootFolder: {
        name: `SIMAGU_Laporan_${sanitizedSchool}`,
        path: rootPath
      },
      academicYearFolder: {
        name: `Tahun_Ajaran_${sanitizedTA}`,
        path: taPath
      },
      departments,
      generalFolder: {
        folderName: 'Laporan_Umum_Sekolah',
        subfolders: {
          rekapGabungan: { name: 'Rekapitulasi_Gabungan_Sekolah', path: `${taPath}/Laporan_Umum_Sekolah/Rekapitulasi_Gabungan_Sekolah` },
          arsipSupervisi: { name: 'Arsip_Supervisi_Kepala_Sekolah', path: `${taPath}/Laporan_Umum_Sekolah/Arsip_Supervisi_Kepala_Sekolah` },
          exportDatabase: { name: 'Backup_Database_SIMAGU', path: `${taPath}/Laporan_Umum_Sekolah/Backup_Database_SIMAGU` }
        }
      },
      generatedAt: new Date().toISOString()
    };

    setItem('simagu_drive_folder_structure', structure);
    Storage.logAudit('DRIVE_FOLDER_CREATE', `Generasi struktur folder Google Drive lokal untuk TA ${tahunAjaran}`);
    return structure;
  },

  getDriveFolderStructure: (): DriveFolderStructure | null => {
    return getItem<DriveFolderStructure | null>('simagu_drive_folder_structure', null);
  }
};

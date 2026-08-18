import {
  SchoolSetting,
  GuruItem,
  SiswaItem,
  KelasItem,
  JurusanItem,
  MapelItem,
  JadwalItem,
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
  UserRole
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
  AGENDA_GURU: 'simagu_agenda_guru',
  AGENDA_KELAS: 'simagu_agenda_kelas',
  ABSENSI_GURU: 'simagu_absensi_guru',
  ABSENSI_SISWA: 'simagu_absensi_siswa',
  SUPERVISI: 'simagu_supervisi',
  MATERI: 'simagu_materi',
  TUGAS: 'simagu_tugas',
  NILAI_SISWA: 'simagu_nilai_siswa',
  NOTIFICATIONS: 'simagu_notifications',
  AUDIT_LOGS: 'simagu_audit_logs',
  USERS: 'simagu_users',
  CURRENT_USER: 'simagu_current_user',
  THEME: 'simagu_theme_mode',
};

// Production clean slate migration check for specified modules
const PROD_CLEAN_KEY = 'simagu_prod_clean_records_v3';
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(PROD_CLEAN_KEY) !== 'true') {
      localStorage.setItem(KEYS.AGENDA_GURU, JSON.stringify([]));
      localStorage.setItem(KEYS.AGENDA_KELAS, JSON.stringify([]));
      localStorage.setItem(KEYS.SUPERVISI, JSON.stringify([]));
      localStorage.setItem(KEYS.MATERI, JSON.stringify([]));
      localStorage.setItem(KEYS.TUGAS, JSON.stringify([]));
      localStorage.setItem(PROD_CLEAN_KEY, 'true');
    }
  } catch (err) {
    console.warn('Storage initialization skipped due to environment constraints:', err);
  }
}

function getItem<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return fallback;
  }
}

function setItem<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

export const Storage = {
  // Settings
  getSetting: (): SchoolSetting => {
    const saved = getItem(KEYS.SETTING, initialSchoolSetting);
    if (!saved || saved.npsn !== '69989796' || saved.namaSekolah !== 'SMK NEGERI BOJONGGAMBIR' || saved.logoUrl !== initialSchoolSetting.logoUrl || saved.tahunPelajaran === '2025/2026' || !saved.googleSheetUrl || saved.googleSheetUrl.includes('1SIMAGU')) {
      const updated = { ...initialSchoolSetting, ...saved, tahunPelajaran: '2026/2027', googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1BTYSMyezYCtgUyuNA8MOpoCsf989f88ymbBV9CZihOs/edit', logoUrl: initialSchoolSetting.logoUrl };
      setItem(KEYS.SETTING, updated);
      return updated;
    }
    return saved;
  },
  saveSetting: (setting: SchoolSetting) => setItem(KEYS.SETTING, setting),

  // Users & Auth
  getUsers: (): User[] => {
    const saved = getItem(KEYS.USERS, initialUsers);
    const removedUsernames = ['suhandi', 'rangga_putra', 'zamzam_zenal', 'resa_yulianti', 'endah_nursolihah', 'zahra_rachmat', 'acep_asphia', 'hendri', 'rizki_akbar'];
    if (!saved || saved.some(u => removedUsernames.includes(u.username))) {
      const filtered = (saved || initialUsers).filter(u => !removedUsernames.includes(u.username));
      setItem(KEYS.USERS, filtered.length > 0 ? filtered : initialUsers);
      return filtered.length > 0 ? filtered : initialUsers;
    }
    return saved;
  },
  saveUsers: (data: User[]) => setItem(KEYS.USERS, data),
  getCurrentUser: (): User => getItem(KEYS.CURRENT_USER, initialUsers[0]), // Default Admin
  setCurrentUser: (user: User | null) => {
    if (user) {
      setItem(KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },

  // Master Data
  getGuru: (): GuruItem[] => {
    const saved = getItem(KEYS.GURU, initialGuru);
    const removedNames = [
      'Suhandi, S.Pd.I.',
      'Rangga Putra Riyadi, S.Pd.',
      'Zamzam Zenal Arifin, S.M.',
      'Resa Yulianti, S.Sos.',
      'Endah Nur Solihah, S.Pd.',
      'Zahra Rachmat Fauzi',
      'Acep Asphia',
      'Hendri',
      'Rizki Akbar Nur Arifin'
    ];
    if (!saved || saved.some(g => removedNames.some(rn => g.nama?.includes(rn.split(',')[0])))) {
      const cleaned = (saved || initialGuru).filter(g => !removedNames.some(rn => g.nama?.includes(rn.split(',')[0])));
      setItem(KEYS.GURU, cleaned.length > 0 ? cleaned : initialGuru);
      return cleaned.length > 0 ? cleaned : initialGuru;
    }
    return saved;
  },
  saveGuru: (data: GuruItem[]) => setItem(KEYS.GURU, data),

  getSiswa: (): SiswaItem[] => {
    const saved = getItem(KEYS.SISWA, initialSiswa);
    if (!saved || saved.length < 200 || saved[0]?.nama !== 'Aip Paeja') {
      setItem(KEYS.SISWA, initialSiswa);
      return initialSiswa;
    }
    return saved;
  },
  saveSiswa: (data: SiswaItem[]) => setItem(KEYS.SISWA, data),

  getKelas: (): KelasItem[] => {
    const saved = getItem(KEYS.KELAS, initialKelas);
    if (!saved || saved.length < 10 || saved[0]?.ruang === 'Studio DKV 1') {
      setItem(KEYS.KELAS, initialKelas);
      return initialKelas;
    }
    return saved;
  },
  saveKelas: (data: KelasItem[]) => setItem(KEYS.KELAS, data),

  getJurusan: (): JurusanItem[] => {
    const saved = getItem(KEYS.JURUSAN, initialJurusan);
    if (!saved || saved.length < 2) {
      setItem(KEYS.JURUSAN, initialJurusan);
      return initialJurusan;
    }
    return saved;
  },
  saveJurusan: (data: JurusanItem[]) => setItem(KEYS.JURUSAN, data),

  getMapel: (): MapelItem[] => {
    const saved = getItem(KEYS.MAPEL, initialMapel);
    if (!saved || saved.length < 18) {
      setItem(KEYS.MAPEL, initialMapel);
      return initialMapel;
    }
    return saved;
  },
  saveMapel: (data: MapelItem[]) => setItem(KEYS.MAPEL, data),

  getJadwal: (): JadwalItem[] => {
    const saved = getItem<JadwalItem[]>(KEYS.JADWAL, initialJadwal);
    if (!saved || !Array.isArray(saved) || saved.length === 0) {
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
    Storage.logAudit('CREATE_JADWAL', `Menambahkan jadwal pelajaran ${item.mapel} (${item.kelas} - ${item.hari} JP ${item.jp})`);
  },
  updateJadwal: (id: string, updated: Partial<JadwalItem>) => {
    const list = Storage.getJadwal();
    const index = list.findIndex(j => j.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updated };
      Storage.saveJadwal(list);
      Storage.logAudit('UPDATE_JADWAL', `Memperbarui jadwal pelajaran ${list[index].mapel} (${list[index].kelas} - ${list[index].hari} JP ${list[index].jp})`);
    }
  },
  deleteJadwal: (id: string) => {
    const list = Storage.getJadwal();
    const item = list.find(j => j.id === id);
    const filtered = list.filter(j => j.id !== id);
    Storage.saveJadwal(filtered);
    if (item) {
      Storage.logAudit('DELETE_JADWAL', `Menghapus jadwal pelajaran ${item.mapel} (${item.kelas} - ${item.hari} JP ${item.jp})`);
    }
  },

  // Agendas
  getAgendaGuru: (): AgendaGuruItem[] => {
    return getItem(KEYS.AGENDA_GURU, initialAgendaGuru);
  },
  saveAgendaGuru: (data: AgendaGuruItem[]) => setItem(KEYS.AGENDA_GURU, data),
  addAgendaGuru: (item: AgendaGuruItem) => {
    const list = Storage.getAgendaGuru();
    list.unshift(item);
    Storage.saveAgendaGuru(list);

    // Auto notification if any student marked Alpa
    if (item.alpa > 0) {
      const alpaStudents = item.siswaTidakHadir.filter(s => s.kategori === 'Alpa').map(s => s.nama).join(', ');
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

    Storage.logAudit('CREATE_AGENDA_GURU', `Membuat Agenda Guru #${item.nomorAgenda} untuk kelas ${item.kelas}`);
  },

  getAgendaKelas: (): AgendaKelasItem[] => {
    return getItem(KEYS.AGENDA_KELAS, initialAgendaKelas);
  },
  saveAgendaKelas: (data: AgendaKelasItem[]) => setItem(KEYS.AGENDA_KELAS, data),
  addAgendaKelas: (item: AgendaKelasItem) => {
    const list = Storage.getAgendaKelas();
    list.unshift(item);
    Storage.saveAgendaKelas(list);
    Storage.logAudit('CREATE_AGENDA_KELAS', `Membuat Agenda Kelas #${item.nomorAgenda} - ${item.kelas}`);
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

  // Supervisi
  getSupervisi: (): SupervisiRecord[] => {
    return getItem(KEYS.SUPERVISI, initialSupervisi);
  },
  saveSupervisi: (data: SupervisiRecord[]) => setItem(KEYS.SUPERVISI, data),

  // Materi & Tugas
  getMateri: (): MateriRecord[] => {
    return getItem(KEYS.MATERI, initialMateri);
  },
  saveMateri: (data: MateriRecord[]) => setItem(KEYS.MATERI, data),
  addMateri: (item: MateriRecord) => {
    const list = Storage.getMateri();
    list.unshift(item);
    Storage.saveMateri(list);
    Storage.logAudit('CREATE_MATERI', `Membuat Materi: ${item.judulMateri} (${item.kelas})`);
  },
  updateMateri: (item: MateriRecord) => {
    const list = Storage.getMateri().map(m => m.id === item.id ? item : m);
    Storage.saveMateri(list);
    Storage.logAudit('UPDATE_MATERI', `Mengubah Materi: ${item.judulMateri}`);
  },
  deleteMateri: (id: string) => {
    const list = Storage.getMateri().filter(m => m.id !== id);
    Storage.saveMateri(list);
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
    Storage.logAudit('CREATE_TUGAS', `Membuat Tugas: ${item.judulTugas} (${item.kelas})`);
  },
  updateTugas: (item: TugasRecord) => {
    const list = Storage.getTugas().map(t => t.id === item.id ? item : t);
    Storage.saveTugas(list);
    Storage.logAudit('UPDATE_TUGAS', `Mengubah Tugas: ${item.judulTugas}`);
  },
  deleteTugas: (id: string) => {
    const list = Storage.getTugas().filter(t => t.id !== id);
    Storage.saveTugas(list);
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
      Storage.logAudit('INPUT_NILAI', `Menginput ${newRecords.length} nilai siswa untuk kelas ${newRecords[0].kelas} - ${newRecords[0].mapel}`);
    }
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
            localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
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
    localStorage.clear();
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
      { id: '2', kodeJurusan: 'TKJ', namaJurusan: 'Teknik Komputer dan Jaringan', kepalaJurusan: '' },
      { id: '3', kodeJurusan: 'TKR', namaJurusan: 'Teknik Kendaraan Ringan', kepalaJurusan: '' }
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

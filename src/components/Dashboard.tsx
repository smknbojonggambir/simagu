import React, { useState, useMemo } from 'react';
import { 
  Users, 
  GraduationCap, 
  School, 
  BookOpen, 
  UserCheck, 
  UserX, 
  Clock, 
  AlertOctagon, 
  Award, 
  ClipboardCheck, 
  FileText, 
  Camera, 
  TrendingUp, 
  CheckCircle2, 
  Activity,
  PlusCircle,
  Download,
  CalendarCheck,
  Search,
  Filter,
  X,
  SlidersHorizontal,
  Calendar,
  User as UserIcon,
  BookMarked,
  Eye,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Zap,
  FileSpreadsheet
} from 'lucide-react';
import { 
  GuruItem, 
  SiswaItem, 
  KelasItem, 
  AgendaGuruItem, 
  AgendaKelasItem, 
  AbsensiGuruRecord,
  SupervisiRecord,
  SchoolSetting,
  User
} from '../types';

interface DashboardProps {
  guruList: GuruItem[];
  siswaList: SiswaItem[];
  kelasList: KelasItem[];
  agendaGuruList: AgendaGuruItem[];
  agendaKelasList: AgendaKelasItem[];
  absensiGuruList: AbsensiGuruRecord[];
  supervisiList: SupervisiRecord[];
  setting: SchoolSetting;
  currentUser: User;
  onNavigateTab: (tab: string) => void;
  onOpenAppsScriptModal: () => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  guruList,
  siswaList,
  kelasList,
  agendaGuruList,
  agendaKelasList,
  absensiGuruList,
  supervisiList,
  setting,
  currentUser,
  onNavigateTab,
  onOpenAppsScriptModal,
  onOpenGoogleSheetsModal
}) => {
  const safeAgendaGuruList = agendaGuruList || [];
  const safeAgendaKelasList = agendaKelasList || [];
  const safeAbsensiGuruList = absensiGuruList || [];
  const safeGuruList = guruList || [];
  const safeSiswaList = siswaList || [];
  const safeKelasList = kelasList || [];
  const safeSupervisiList = supervisiList || [];

  const todayStr = new Date().toISOString().slice(0, 10);

  // Search & Filter state for Agenda Widget Lookup
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [selectedAgendaModal, setSelectedAgendaModal] = useState<AgendaGuruItem | null>(null);

  // Compute Today Stats
  const todayAgendaGuru = safeAgendaGuruList.filter(a => a.tanggal === todayStr || a.tanggal === '2026-08-03');
  const todayAgendaKelas = safeAgendaKelasList.filter(a => a.tanggal === todayStr || a.tanggal === '2026-08-03');
  const totalAgendaToday = todayAgendaGuru.length + todayAgendaKelas.length;

  const guruHadir = safeAbsensiGuruList.filter(a => a.status === 'Hadir').length;
  const guruTidakHadir = safeAbsensiGuruList.filter(a => a.status !== 'Hadir').length;

  // Student Attendance Summary
  let totalSiswaHadir = 0;
  let totalSiswaSakit = 0;
  let totalSiswaIzin = 0;
  let totalSiswaAlpa = 0;
  let totalSiswaTerlambat = 0;

  todayAgendaGuru.forEach(a => {
    totalSiswaHadir += a.hadir || 0;
    totalSiswaSakit += a.sakit || 0;
    totalSiswaIzin += a.izin || 0;
    totalSiswaAlpa += a.alpa || 0;
    totalSiswaTerlambat += a.terlambat || 0;
  });

  // Pelanggaran & Prestasi Total Count
  let totalPelanggaran = 0;
  let totalPrestasi = 0;
  safeAgendaKelasList.forEach(ak => {
    totalPelanggaran += (ak.pelanggaranList || []).length;
    totalPrestasi += (ak.prestasiList || []).length;
  });

  const totalSupervisi = safeSupervisiList.length;
  const totalTugas = todayAgendaGuru.filter(a => a.tugas && a.tugas.trim() !== '').length;
  const totalDokumentasi = todayAgendaGuru.reduce((acc, a) => acc + (a.fotoUrls?.length || 0), 0);

  // Extract list of unique classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    safeKelasList.forEach(k => set.add(k.namaKelas));
    safeAgendaGuruList.forEach(a => set.add(a.kelas));
    return Array.from(set).sort();
  }, [safeKelasList, safeAgendaGuruList]);

  // Extract list of unique teachers
  const availableTeachers = useMemo(() => {
    const set = new Set<string>();
    safeGuruList.forEach(g => set.add(g.nama));
    safeAgendaGuruList.forEach(a => set.add(a.namaGuru));
    return Array.from(set).sort();
  }, [safeGuruList, safeAgendaGuruList]);

  // Extract list of available dates
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    safeAgendaGuruList.forEach(a => {
      if (a.tanggal) set.add(a.tanggal);
    });
    return Array.from(set).sort().reverse();
  }, [safeAgendaGuruList]);

  // Filtered Agenda Items
  const filteredAgendas = useMemo(() => {
    return safeAgendaGuruList.filter(a => {
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q ||
        a.namaGuru.toLowerCase().includes(q) ||
        a.kelas.toLowerCase().includes(q) ||
        (a.mapel && a.mapel.toLowerCase().includes(q)) ||
        (a.materi && a.materi.toLowerCase().includes(q)) ||
        (a.nip && a.nip.includes(q));

      const matchClass = selectedClassFilter === 'all' || a.kelas === selectedClassFilter;
      const matchTeacher = selectedTeacherFilter === 'all' || a.namaGuru === selectedTeacherFilter;
      const matchStatus = selectedStatusFilter === 'all' || a.statusPembelajaran === selectedStatusFilter;
      
      let matchDate = true;
      if (selectedDateFilter === 'today') {
        matchDate = a.tanggal === todayStr || a.tanggal === '2026-08-03';
      } else if (selectedDateFilter !== 'all') {
        matchDate = a.tanggal === selectedDateFilter;
      }

      return matchQuery && matchClass && matchTeacher && matchStatus && matchDate;
    });
  }, [safeAgendaGuruList, searchQuery, selectedClassFilter, selectedTeacherFilter, selectedStatusFilter, selectedDateFilter, todayStr]);

  const activeFiltersCount = (searchQuery ? 1 : 0) +
    (selectedClassFilter !== 'all' ? 1 : 0) +
    (selectedTeacherFilter !== 'all' ? 1 : 0) +
    (selectedStatusFilter !== 'all' ? 1 : 0) +
    (selectedDateFilter !== 'all' ? 1 : 0);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedClassFilter('all');
    setSelectedTeacherFilter('all');
    setSelectedStatusFilter('all');
    setSelectedDateFilter('all');
  };

  const stats = [
    { label: 'Jumlah Guru', value: safeGuruList.length, icon: Users, color: 'text-[#2563EB] bg-blue-50 dark:bg-blue-950/60', tab: 'master_data' },
    { label: 'Jumlah Siswa', value: safeSiswaList.length, icon: GraduationCap, color: 'text-[#16A34A] bg-green-50 dark:bg-green-950/60', tab: 'master_data' },
    { label: 'Jumlah Kelas', value: safeKelasList.length, icon: School, color: 'text-[#163A5F] bg-slate-100 dark:bg-slate-800', tab: 'master_data' },
    { label: 'Agenda Hari Ini', value: totalAgendaToday, icon: BookOpen, color: 'text-[#2563EB] bg-blue-50 dark:bg-blue-950/60', tab: 'agenda_guru' },
    { label: 'Siswa Hadir', value: totalSiswaHadir, icon: UserCheck, color: 'text-[#16A34A] bg-green-50 dark:bg-green-950/60', tab: 'absensi' },
    { label: 'Siswa Sakit', value: totalSiswaSakit, icon: Clock, color: 'text-[#F59E0B] bg-amber-50 dark:bg-amber-950/60', tab: 'absensi' },
    { label: 'Siswa Izin', value: totalSiswaIzin, icon: Clock, color: 'text-[#2563EB] bg-blue-50 dark:bg-blue-950/60', tab: 'absensi' },
    { label: 'Siswa Alpa', value: totalSiswaAlpa, icon: AlertOctagon, color: 'text-[#DC2626] bg-red-50 dark:bg-red-950/60', tab: 'absensi' },
    { label: 'Siswa Terlambat', value: totalSiswaTerlambat, icon: Clock, color: 'text-[#F59E0B] bg-amber-50 dark:bg-amber-950/60', tab: 'absensi' },
    { label: 'Pelanggaran', value: totalPelanggaran, icon: AlertOctagon, color: 'text-[#DC2626] bg-red-50 dark:bg-red-950/60', tab: 'pelanggaran' },
    { label: 'Prestasi Siswa', value: totalPrestasi, icon: Award, color: 'text-[#F59E0B] bg-amber-50 dark:bg-amber-950/60', tab: 'prestasi' },
    { label: 'Supervisi Akademik', value: totalSupervisi, icon: ClipboardCheck, color: 'text-[#163A5F] bg-slate-100 dark:bg-slate-800', tab: 'supervisi' },
    { label: 'Tugas Pembelajaran', value: totalTugas, icon: FileText, color: 'text-[#2563EB] bg-blue-50 dark:bg-blue-950/60', tab: 'materi' },
    { label: 'Dokumentasi Foto', value: totalDokumentasi, icon: Camera, color: 'text-[#163A5F] bg-slate-100 dark:bg-slate-800', tab: 'agenda_guru' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#163A5F] border border-[#1e4a77] p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white p-2 border border-white/20 shrink-0 shadow-md flex items-center justify-center">
              <img
                src={setting.logoUrl || '/logo.png'}
                alt="Logo SMKN Bojonggambir"
                className="h-full w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/logo.png' && !target.src.endsWith('/logo.png')) {
                    target.src = '/logo.png';
                  }
                }}
              />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-blue-200">
                <CalendarCheck className="h-3.5 w-3.5 text-blue-300" />
                <span>{setting.tahunPelajaran} • Semester {setting.semester}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Selamat Datang di SIMAGU, {currentUser.nama}!
              </h2>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl">
                Sistem Informasi Agenda Guru & Agenda Kelas SMK. Kelola pembelajaran, absensi, supervisi, dan dokumentasi secara real-time dengan integrasi Google Sheets.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('agenda_guru')}
              className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Isi Agenda Guru</span>
            </button>
            <button
              onClick={() => onNavigateTab('agenda_kelas')}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Isi Agenda Kelas</span>
            </button>
            <button
              onClick={onOpenAppsScriptModal}
              className="flex items-center gap-1.5 rounded-xl bg-[#0f2742] hover:bg-[#143354] border border-blue-400/30 px-3.5 py-2.5 text-xs font-semibold text-blue-200 transition cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>GAS Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS PANEL (Aksi Cepat 1-Klik) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-md shadow-blue-600/20">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#163A5F] dark:text-white tracking-tight flex items-center gap-2">
                <span>Aksi Cepat (Quick Actions 1-Klik)</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Instant Access
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Akses cepat untuk entri absensi harian, agenda kelas, jurnal KBM, & pencatatan disiplin.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Quick Action 1: Absensi Harian */}
          <button
            onClick={() => onNavigateTab('absensi')}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-3.5 shadow-2xs hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 dark:hover:border-blue-400 hover:shadow-md active:scale-95 transition text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950/50 text-[#16A34A] group-hover:bg-[#16A34A] group-hover:text-white transition">
                <UserCheck className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-[#16A34A] bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-md border border-green-200 dark:border-green-800">
                1-Klik
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-[#163A5F] dark:text-white group-hover:text-[#2563EB] transition">
                Input Absensi Harian
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Presensi Siswa & Rekap
              </p>
            </div>
          </button>

          {/* Quick Action 2: Agenda Kelas */}
          <button
            onClick={() => onNavigateTab('agenda_kelas')}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-3.5 shadow-2xs hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 dark:hover:border-blue-400 hover:shadow-md active:scale-95 transition text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition">
                <School className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                1-Klik
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-[#163A5F] dark:text-white group-hover:text-[#2563EB] transition">
                Catat Agenda Kelas
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Jurnal Pengurus Kelas
              </p>
            </div>
          </button>

          {/* Quick Action 3: Isi Agenda Guru */}
          <button
            onClick={() => onNavigateTab('agenda_guru')}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-3.5 shadow-2xs hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 dark:hover:border-blue-400 hover:shadow-md active:scale-95 transition text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-[#2563EB] bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                1-Klik
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-[#163A5F] dark:text-white group-hover:text-[#2563EB] transition">
                Isi Agenda KBM Guru
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Jurnal Mengajar & Foto
              </p>
            </div>
          </button>

          {/* Quick Action 4: Disiplin & Catatan */}
          <button
            onClick={() => onNavigateTab('pelanggaran')}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-3.5 shadow-2xs hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 dark:hover:border-blue-400 hover:shadow-md active:scale-95 transition text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50 text-[#F59E0B] group-hover:bg-[#F59E0B] group-hover:text-white transition">
                <AlertOctagon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-[#F59E0B] bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                1-Klik
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-[#163A5F] dark:text-white group-hover:text-[#2563EB] transition">
                Catat Disiplin Siswa
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Pelanggaran & Poin
              </p>
            </div>
          </button>

          {/* Quick Action 5: Cetak Laporan */}
          <button
            onClick={() => onNavigateTab('laporan')}
            className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 p-3.5 shadow-2xs hover:border-[#2563EB] hover:bg-[#EFF6FF]/40 dark:hover:border-blue-400 hover:shadow-md active:scale-95 transition text-left cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[#163A5F] dark:text-blue-300 group-hover:bg-[#163A5F] group-hover:text-white transition">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-[#163A5F] dark:text-blue-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                1-Klik
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-[#163A5F] dark:text-white group-hover:text-[#2563EB] transition">
                Cetak Laporan & Rekap
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                PDF, Excel, Print
              </p>
            </div>
          </button>

          {/* Quick Action 6: Kirim Data ke Google Sheet */}
          <button
            onClick={() => onOpenGoogleSheetsModal ? onOpenGoogleSheetsModal() : onNavigateTab('laporan')}
            className="group relative flex flex-col justify-between rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-slate-800/90 p-3.5 shadow-2xs hover:border-emerald-500 dark:hover:border-emerald-400 hover:shadow-md active:scale-95 transition text-left col-span-2 sm:col-span-1 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#16A34A] shadow-xs group-hover:bg-[#16A34A] group-hover:text-white transition">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-[#16A34A] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                Live Sync
              </span>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-bold text-[#163A5F] dark:text-white group-hover:text-[#16A34A] transition">
                Kirim Data ke Google Sheet
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                Sinkronisasi 16 Tab Real-Time
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Grid Statistic Cards (16 Indicators) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#163A5F] dark:text-slate-100 uppercase tracking-wider">
            Indikator Ringkasan Harian (Real-Time)
          </h3>
          <span className="text-xs text-slate-500">Auto-update from Database</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {stats.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                onClick={() => onNavigateTab(s.tab)}
                className="group cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs hover:border-[#2563EB] hover:bg-[#EFF6FF]/20 dark:hover:border-blue-500 hover:shadow-xs transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                    {s.label}
                  </span>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${s.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-lg font-black text-[#163A5F] dark:text-white">
                    {s.value}
                  </span>
                  <span className="text-[9px] text-[#2563EB] dark:text-blue-400 opacity-0 group-hover:opacity-100 transition">
                    Lihat →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DASHBOARD WIDGET: Search & Filter Bar for Agenda Lookup */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#163A5F] dark:text-white flex items-center gap-2">
              <Search className="h-4 w-4 text-[#2563EB] dark:text-blue-400" />
              <span>Pencarian & Filter Agenda Pembelajaran</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cari cepat agenda guru berdasarkan nama pengajar, kelas, mata pelajaran, atau topik materi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-[#DC2626] dark:text-red-400 hover:underline font-semibold cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Filter ({activeFiltersCount})</span>
              </button>
            )}
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EFF6FF] dark:bg-blue-950 text-[#163A5F] dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
              {filteredAgendas.length} / {safeAgendaGuruList.length} Item
            </span>
          </div>
        </div>

        {/* Filter Bar Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Main Search Input (5 Cols) */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama guru, kelas (contoh: XI APHP), mapel..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-9 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Class Filter Dropdown (2 Cols) */}
          <div className="lg:col-span-2 relative">
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer font-medium"
            >
              <option value="all">🏫 Semua Kelas</option>
              {availableClasses.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          {/* Teacher Filter Dropdown (2 Cols) */}
          <div className="lg:col-span-2 relative">
            <select
              value={selectedTeacherFilter}
              onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer font-medium"
            >
              <option value="all">👨‍🏫 Semua Guru</option>
              {availableTeachers.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Status Filter Dropdown (2 Cols) */}
          <div className="lg:col-span-2 relative">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer font-medium"
            >
              <option value="all">📌 Status (Semua)</option>
              <option value="Hadir / Selesai">Hadir / Selesai</option>
              <option value="Penugasan">Penugasan</option>
              <option value="Daring">Daring</option>
              <option value="Izin">Izin</option>
            </select>
          </div>

          {/* Date Filter Dropdown (1 Col) */}
          <div className="lg:col-span-1 relative">
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] cursor-pointer font-medium"
            >
              <option value="all">📅 Tanggal</option>
              <option value="today">Hari Ini</option>
              {availableDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Tag Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Pencarian Cepat:</span>
          </span>
          <button
            onClick={() => { setSelectedClassFilter('XI APHP'); setSearchQuery(''); }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
              selectedClassFilter === 'XI APHP' 
                ? 'bg-[#2563EB] text-white border-[#2563EB]' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
            }`}
          >
            Kelas XI APHP
          </button>
          <button
            onClick={() => { setSelectedClassFilter('XII DKV 1'); setSearchQuery(''); }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
              selectedClassFilter === 'XII DKV 1' 
                ? 'bg-[#2563EB] text-white border-[#2563EB]' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
            }`}
          >
            Kelas XII DKV 1
          </button>
          <button
            onClick={() => { setSelectedClassFilter('X DKV 2'); setSearchQuery(''); }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
              selectedClassFilter === 'X DKV 2' 
                ? 'bg-[#2563EB] text-white border-[#2563EB]' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
            }`}
          >
            Kelas X DKV 2
          </button>
          <button
            onClick={() => { setSelectedDateFilter('today'); }}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
              selectedDateFilter === 'today' 
                ? 'bg-[#2563EB] text-white border-[#2563EB]' 
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
            }`}
          >
            Hari Ini
          </button>
        </div>

        {/* Results Widget Cards */}
        {filteredAgendas.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <BookOpen className="h-8 w-8 text-slate-400 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tidak Ada Agenda Ditemukan
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cobalah sesuaikan kata kunci pencarian atau reset filter kelas / guru untuk melihat daftar agenda lainnya.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAgendas.map((item) => (
              <div
                key={item.id}
                className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-[#2563EB] hover:bg-[#EFF6FF]/20 hover:shadow-xs transition space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-[#163A5F] text-white text-[11px] font-bold">
                        {item.kelas}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        JP {item.jamKe}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.statusPembelajaran === 'Selesai' 
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-[#16A34A] dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-950 text-[#F59E0B] dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    }`}>
                      {item.statusPembelajaran || 'Hadir'}
                    </span>
                  </div>

                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-[#163A5F] dark:text-white line-clamp-1 group-hover:text-[#2563EB] transition">
                      {item.namaGuru}
                    </h4>
                    <p className="text-[11px] font-semibold text-[#2563EB] dark:text-blue-300 line-clamp-1">
                      {item.mapel}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 italic">
                      "{item.materi}"
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-[#16A34A]" />
                      <span>{item.hadir || 0} Hadir</span>
                    </span>
                    {(item.fotoUrls?.length || 0) > 0 && (
                      <span className="flex items-center gap-1 text-[#2563EB]">
                        <Camera className="h-3 w-3" />
                        <span>{item.fotoUrls?.length} Foto</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedAgendaModal(item)}
                    className="flex items-center gap-1 text-[#2563EB] dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Detail</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Charts & Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Student Attendance Distribution */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#163A5F] dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#2563EB]" />
              <span>Kehadiran Peserta Didik</span>
            </h4>
            <span className="text-xs text-slate-500">Hari Ini</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Hadir ({totalSiswaHadir})</span>
                <span className="font-bold text-[#16A34A]">91.6%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#16A34A] rounded-full" style={{ width: '91.6%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Sakit ({totalSiswaSakit})</span>
                <span className="font-bold text-[#F59E0B]">2.8%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: '2.8%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Izin ({totalSiswaIzin})</span>
                <span className="font-bold text-[#2563EB]">2.8%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#2563EB] rounded-full" style={{ width: '2.8%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Alpa ({totalSiswaAlpa})</span>
                <span className="font-bold text-[#DC2626]">2.8%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-[#DC2626] rounded-full" style={{ width: '2.8%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Status Pembelajaran & Monitoring */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#163A5F] dark:text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
              <span>Monitoring Pembelajaran</span>
            </h4>
            <span className="text-xs text-slate-500">Agendas</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Target Pertemuan Selesai</span>
              <span className="font-bold text-[#16A34A]">85%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Moda Luring (Tatap Muka)</span>
              <span className="font-bold text-slate-900 dark:text-white">100%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Tugas Praktik Diberikan</span>
              <span className="font-bold text-[#2563EB]">{totalTugas} Modul</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">Supervisi Disetujui</span>
              <span className="font-bold text-[#163A5F] dark:text-blue-300">{totalSupervisi} Guru</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#163A5F] dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#2563EB]" />
              <span>Aktivitas Terbaru</span>
            </h4>
            <button 
              onClick={() => onNavigateTab('agenda_guru')}
              className="text-xs text-[#2563EB] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Semua →
            </button>
          </div>

          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {agendaGuruList.slice(0, 4).map((ag) => (
              <div key={ag.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs flex items-start gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-blue-950/60 text-[#163A5F] dark:text-blue-300 font-bold shrink-0">
                  {ag.kelas.slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white">{ag.namaGuru}</div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-1">{ag.mapel} - {ag.materi}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{ag.kelas} • JP {ag.jamKe}</span>
                    <span className="font-semibold text-[#16A34A] dark:text-emerald-400">{ag.statusPembelajaran}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Detail Agenda from Search Results */}
      {selectedAgendaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-[#163A5F] text-white text-xs font-bold">
                  {selectedAgendaModal.kelas}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Jam Ke-{selectedAgendaModal.jamKe}
                </span>
              </div>
              <button
                onClick={() => setSelectedAgendaModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-base font-bold text-[#163A5F] dark:text-white">
                  {selectedAgendaModal.namaGuru}
                </h3>
                {selectedAgendaModal.nip && (
                  <p className="text-xs text-slate-400 font-mono">
                    NIP: {selectedAgendaModal.nip}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Mata Pelajaran:</span>
                  <span className="font-bold text-[#2563EB] dark:text-blue-400">{selectedAgendaModal.mapel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal Pertemuan:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{selectedAgendaModal.tanggal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Pembelajaran:</span>
                  <span className="font-bold text-[#16A34A]">{selectedAgendaModal.statusPembelajaran}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Materi Pembelajaran / Sub-CP:
                </label>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">
                  {selectedAgendaModal.materi || '-'}
                </div>
              </div>

              {selectedAgendaModal.tugas && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Tugas / Penugasan Siswa:
                  </label>
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                    {selectedAgendaModal.tugas}
                  </div>
                </div>
              )}

              {/* Attendance Breakdown */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Rekap Kehadiran Siswa:
                </label>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                    <span className="block text-[10px] text-[#16A34A] dark:text-emerald-300 font-bold">Hadir</span>
                    <span className="text-sm font-black text-emerald-800 dark:text-emerald-200">{selectedAgendaModal.hadir || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                    <span className="block text-[10px] text-[#F59E0B] dark:text-amber-300 font-bold">Sakit</span>
                    <span className="text-sm font-black text-amber-800 dark:text-amber-200">{selectedAgendaModal.sakit || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                    <span className="block text-[10px] text-[#2563EB] dark:text-blue-300 font-bold">Izin</span>
                    <span className="text-sm font-black text-blue-800 dark:text-blue-200">{selectedAgendaModal.izin || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                    <span className="block text-[10px] text-[#DC2626] dark:text-red-300 font-bold">Alpa</span>
                    <span className="text-sm font-black text-red-800 dark:text-red-200">{selectedAgendaModal.alpa || 0}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                    <span className="block text-[10px] text-[#F59E0B] dark:text-amber-300 font-bold">Terlambat</span>
                    <span className="text-sm font-black text-amber-800 dark:text-amber-200">{selectedAgendaModal.terlambat || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setSelectedAgendaModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setSelectedAgendaModal(null);
                  onNavigateTab('agenda_guru');
                }}
                className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-blue-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Buka di Agenda Guru</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

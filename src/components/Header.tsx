import React, { useState } from 'react';
import { 
  Bell, 
  BellRing,
  Sun, 
  Moon, 
  UserCheck, 
  School, 
  LogOut, 
  Menu,
  CheckCircle2,
  AlertTriangle,
  Info,
  QrCode,
  Download,
  FileSpreadsheet,
  Zap,
  Calendar,
  ArrowRight,
  CheckCheck,
  X
} from 'lucide-react';
import { User, UserRole, SchoolSetting, NotificationItem, AgendaGuruItem, AgendaKelasItem, JadwalItem } from '../types';
import { Storage } from '../lib/storage';
import { AutoSaveBadge } from './AutoSaveBadge';
import { checkUnsubmittedAgendasForUser } from '../lib/agendaReminder';

interface HeaderProps {
  currentUser?: User;
  onUserChange?: (user: User) => void;
  setting?: SchoolSetting;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  notifications?: NotificationItem[];
  onMarkNotificationRead?: (id: string) => void;
  onToggleSidebar?: () => void;
  onOpenAppsScriptModal?: () => void;
  onOpenGoogleSheetsModal?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: string) => void;

  agendaGuruList?: AgendaGuruItem[];
  agendaKelasList?: AgendaKelasItem[];
  jadwalList?: JadwalItem[];

  // Additional props for backward compatibility
  role?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenMobileMenu?: () => void;
}

const defaultQuickAlertsAndReminders: NotificationItem[] = [
  {
    id: 'notif-qa-1',
    title: 'Input Presensi Harian Siswa',
    message: 'Presensi harian siswa kelas XI DKV 1 jam ke-1 belum diinput. Segera input absensi.',
    type: 'alert',
    timestamp: '10 Menit Lalu',
    read: false,
    actionTab: 'absensi',
    category: 'quick_action'
  },
  {
    id: 'notif-qa-2',
    title: 'Pengingat Jadwal KBM',
    message: 'Jadwal Mengajar KBM jam ke 3-4 di kelas XII TKJ 2 (Pemrograman Web & Seluler).',
    type: 'info',
    timestamp: 'Hari Ini, 09:15',
    read: false,
    actionTab: 'agenda_guru',
    category: 'jadwal'
  },
  {
    id: 'notif-qa-3',
    title: 'Pencatatan Agenda Kelas',
    message: 'Pengurus kelas X TKR 1 belum mencatat jurnal agenda kelas hari ini.',
    type: 'warning',
    timestamp: 'Hari Ini, 08:30',
    read: false,
    actionTab: 'agenda_kelas',
    category: 'quick_action'
  },
  {
    id: 'notif-qa-4',
    title: 'Verifikasi Laporan Wakasek',
    message: 'Terdapat 2 agenda KBM guru yang memerlukan verifikasi & TTD Kurikulum.',
    type: 'success',
    timestamp: 'Kemarin, 15:40',
    read: true,
    actionTab: 'monitoring',
    category: 'system'
  }
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  setting,
  theme,
  onToggleTheme,
  notifications = [],
  onMarkNotificationRead,
  onToggleSidebar,
  onOpenAppsScriptModal = () => {},
  onOpenGoogleSheetsModal = () => {},
  onLogout,
  onNavigateTab,
  agendaGuruList,
  agendaKelasList,
  jadwalList,
  role,
  onRoleChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenMobileMenu
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'quick_action' | 'jadwal'>('all');
  
  // Local notification state for interactive toggling and default fallbacks
  const [localNotifs, setLocalNotifs] = useState<NotificationItem[]>(() => {
    return notifications && notifications.length > 0 ? notifications : defaultQuickAlertsAndReminders;
  });

  const users = Storage.getUsers() || [];
  const activeUser: User = currentUser || {
    id: 'usr-1',
    username: 'admin',
    nama: 'Administrator SIMAGU',
    email: 'admin@smknbojonggambir.sch.id',
    role: role || 'Administrator',
    nip: '19901017 202321 1 007'
  };

  const safeJadwal = jadwalList || Storage.getJadwal();
  const safeAgendaGuru = agendaGuruList || Storage.getAgendaGuru();
  const safeAgendaKelas = agendaKelasList || Storage.getAgendaKelas();

  // Compute unsubmitted agendas for current user for today
  const unsubmittedReminder = checkUnsubmittedAgendasForUser(
    activeUser,
    safeJadwal,
    safeAgendaGuru,
    safeAgendaKelas
  );

  const activeSetting: SchoolSetting = setting || Storage.getSetting();
  const currentTheme = theme || (isDarkMode ? 'dark' : 'light');
  const toggleThemeHandler = onToggleTheme || onToggleDarkMode || (() => {});
  const toggleSidebarHandler = () => {
    if (onOpenMobileMenu) {
      onOpenMobileMenu();
    } else if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  const unreadCount = localNotifs.filter(n => !n.read).length;

  const handleMarkRead = (id: string) => {
    if (onMarkNotificationRead) {
      onMarkNotificationRead(id);
    }
    setLocalNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setLocalNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleActionClick = (n: NotificationItem) => {
    handleMarkRead(n.id);
    if (n.actionTab && onNavigateTab) {
      onNavigateTab(n.actionTab);
    }
    setShowNotifMenu(false);
  };

  const filteredNotifs = localNotifs.filter(n => {
    if (activeCategory === 'quick_action') return n.category === 'quick_action';
    if (activeCategory === 'jadwal') return n.category === 'jadwal';
    return true;
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 backdrop-blur transition-colors">
      {/* Left: Mobile Toggle & School Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebarHandler}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700 active:scale-95 touch-manipulation lg:hidden shadow-xs"
          title="Buka Navigasi Menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs p-1 overflow-hidden shrink-0">
            {activeSetting.logoUrl ? (
              <img
                src={activeSetting.logoUrl}
                alt="Logo Sekolah"
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <School className="h-6 w-6 text-teal-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                SIMAGU
              </h1>
              <span className="hidden sm:inline-block rounded-md bg-teal-100 dark:bg-teal-900/40 px-2 py-0.5 text-xs font-semibold text-teal-800 dark:text-teal-300">
                SMK Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xs sm:max-w-md">
              {activeSetting.namaSekolah}
            </p>
          </div>
        </div>
      </div>

      {/* Right Controls: Role Switcher, GAS Export, Notifs, Theme, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* AutoSave Status Badge - hidden on xsmall screens, visible sm+ */}
        <div className="hidden sm:block">
          <AutoSaveBadge />
        </div>

        {/* Google Sheets Sync Badge */}
        <button
          onClick={onOpenGoogleSheetsModal}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-2xs"
          title="Sinkronkan data ke Google Sheets"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="hidden md:inline">Google Sheets</span>
        </button>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <select
            value={activeUser.id}
            onChange={(e) => {
              const selected = users.find(u => u.id === e.target.value);
              if (selected) {
                if (onUserChange) onUserChange(selected);
                if (onRoleChange) onRoleChange(selected.role);
                Storage.logAudit('SWITCH_USER_ROLE', `Beralih peran pengguna ke ${selected.role} (${selected.nama})`);
              }
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer max-w-[100px] sm:max-w-[160px] truncate"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.role}: {u.nama.split(',')[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleThemeHandler}
          className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[38px] min-w-[38px] flex items-center justify-center"
          title={currentTheme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
        >
          {currentTheme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-400" />}
        </button>

        {/* Reminder Indicator (Small Bell Icon) for Unsubmitted Agendas Today */}
        <div className="relative">
          <button
            onClick={() => {
              setShowReminderMenu(!showReminderMenu);
              setShowNotifMenu(false);
            }}
            className={`relative rounded-xl p-2 transition min-h-[40px] min-w-[40px] flex items-center justify-center border ${
              unsubmittedReminder.hasUnsubmitted
                ? 'border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/80 dark:text-amber-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={
              unsubmittedReminder.hasUnsubmitted
                ? `Pengingat: Ada ${unsubmittedReminder.count} agenda KBM hari ini yang belum disubmit`
                : 'Pengingat Agenda Hari Ini (Semua agenda sudah diisi)'
            }
          >
            {unsubmittedReminder.hasUnsubmitted ? (
              <BellRing className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-bounce" />
            ) : (
              <Bell className="h-5 w-5 opacity-60" />
            )}

            {unsubmittedReminder.hasUnsubmitted && (
              <>
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {unsubmittedReminder.count}
                </span>
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              </>
            )}
          </button>

          {showReminderMenu && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm rounded-2xl border border-amber-200 dark:border-amber-900/80 bg-white dark:bg-slate-900 p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      Pengingat Agenda Hari Ini
                    </h3>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      {unsubmittedReminder.hasUnsubmitted
                        ? `${unsubmittedReminder.count} agenda KBM belum disubmit`
                        : 'Semua agenda hari ini telah disubmit'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowReminderMenu(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {!unsubmittedReminder.hasUnsubmitted ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Semua Agenda Sudah Diisi!</p>
                    <p className="text-[10px]">Seluruh jadwal KBM Anda untuk hari ini telah tercatat dengan lengkap.</p>
                  </div>
                ) : (
                  unsubmittedReminder.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 p-3 text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block rounded bg-amber-200 dark:bg-amber-900/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 mb-1">
                            {item.kelas} • Jam {item.jp}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {item.mapel}
                          </h4>
                          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                            {item.message}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2.5 flex justify-end">
                        <button
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab('agenda_guru');
                            setShowReminderMenu(false);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 text-white px-3 py-1 text-[11px] font-bold hover:bg-amber-700 active:scale-95 transition shadow-2xs"
                        >
                          <span>Isi Agenda KBM</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications & Quick Action Alerts Dropdown Modal */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className={`relative rounded-xl p-2 transition min-h-[40px] min-w-[40px] flex items-center justify-center border ${
              showNotifMenu
                ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Peringatan Aksi Cepat & Jadwal"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              {/* Header inside modal */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400">
                    <Zap className="h-4 w-4 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      Aksi Cepat & Jadwal
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {unreadCount} peringatan belum dibaca
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 bg-teal-50 dark:bg-teal-950/60 px-2 py-1 rounded-md"
                      title="Tandai semua dibaca"
                    >
                      <CheckCheck className="h-3 w-3" />
                      <span>Dibaca</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifMenu(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 mb-2.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-[11px] font-medium">
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition ${
                    activeCategory === 'all'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Semua ({localNotifs.length})
                </button>
                <button
                  onClick={() => setActiveCategory('quick_action')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                    activeCategory === 'quick_action'
                      ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span>Quick Action</span>
                </button>
                <button
                  onClick={() => setActiveCategory('jadwal')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition flex items-center justify-center gap-1 ${
                    activeCategory === 'jadwal'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="h-3 w-3 text-blue-500" />
                  <span>Jadwal</span>
                </button>
              </div>

              {/* Notifications List */}
              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {filteredNotifs.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-500 dark:text-slate-400">Tidak ada pengingat.</p>
                    <p className="text-[10px]">Semua tugas aksi cepat dan jadwal telah terlayani.</p>
                  </div>
                ) : (
                  filteredNotifs.map((n) => (
                    <div
                      key={n.id}
                      className={`group relative rounded-xl p-3 transition border ${
                        n.read
                          ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400'
                          : 'border-teal-200 dark:border-teal-800/80 bg-teal-50/60 dark:bg-teal-950/40 text-slate-900 dark:text-slate-100 font-medium shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="shrink-0 mt-0.5">
                          {n.type === 'alert' && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                          )}
                          {n.type === 'info' && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                              <Calendar className="h-4 w-4" />
                            </div>
                          )}
                          {n.type === 'warning' && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                              <Zap className="h-4 w-4" />
                            </div>
                          )}
                          {n.type === 'success' && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                          </div>

                          <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
                            {n.message}
                          </p>

                          <div className="mt-2 flex items-center justify-between">
                            {n.actionTab ? (
                              <button
                                onClick={() => handleActionClick(n)}
                                className="inline-flex items-center gap-1 rounded-lg bg-teal-600 text-white px-2.5 py-1 text-[10px] font-bold hover:bg-teal-700 active:scale-95 transition shadow-2xs cursor-pointer"
                              >
                                <span>Akses 1-Klik</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            ) : (
                              <span />
                            )}

                            {!n.read && (
                              <button
                                onClick={() => handleMarkRead(n.id)}
                                className="text-[10px] text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 underline"
                              >
                                Tandai Dibaca
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Badge & Logout */}
        <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
              {activeUser.nama.split(',')[0]}
            </span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium">
              {activeUser.role}
            </span>
          </div>
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold text-xs shadow shrink-0">
            {activeUser.nama.charAt(0)}
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="rounded-lg p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-400 transition"
              title="Keluar / Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

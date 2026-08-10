import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Calendar, 
  UserCheck, 
  FileText, 
  Activity, 
  Award, 
  AlertOctagon, 
  Package, 
  ClipboardCheck, 
  Printer, 
  Settings, 
  Code2, 
  GraduationCap,
  ChevronRight,
  Database,
  HardDrive,
  X
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  role: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onCloseMobile,
  role
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas', 'Guru BK'] },
    { id: 'agenda_guru', label: 'Agenda Harian Guru', icon: BookOpen, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas'] },
    { id: 'agenda_kelas', label: 'Agenda Kelas', icon: Users, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas'] },
    { id: 'jadwal', label: 'Jadwal Mengajar', icon: Calendar, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas'] },
    { id: 'absensi', label: 'Absensi Siswa', icon: UserCheck, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas', 'Guru BK'] },
    { id: 'materi', label: 'Materi & Tugas', icon: FileText, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas'] },
    { id: 'nilai', label: 'Input Nilai Siswa', icon: Award, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas'] },
    { id: 'monitoring', label: 'Monitoring Pembelajaran', icon: Activity, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas'] },
    { id: 'prestasi', label: 'Prestasi Siswa', icon: Award, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas', 'Guru BK'] },
    { id: 'pelanggaran', label: 'Disiplin & Pelanggaran', icon: AlertOctagon, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas', 'Guru BK'] },
    { id: 'inventaris', label: 'Inventaris Kelas', icon: Package, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas'] },
    { id: 'supervisi', label: 'Supervisi Akademik', icon: ClipboardCheck, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru'] },
    { id: 'laporan', label: 'Laporan & Cetak PDF', icon: Printer, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas', 'Guru BK'] },
    { id: 'master_data', label: 'Data Master School', icon: GraduationCap, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan'] },
    { id: 'google_drive', label: 'Google Drive Sekolah', icon: HardDrive, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru', 'Wali Kelas'] },
    { id: 'gas_code', label: 'Google Apps Script & Sheets', icon: Code2, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan', 'Guru'] },
    { id: 'pengaturan', label: 'Pengaturan System', icon: Settings, roles: ['Administrator', 'Kepala Sekolah', 'Wakasek Kurikulum', 'Wakasek Kesiswaan'] },
  ];

  const filteredItems = navItems.filter(item => 
    role === 'Administrator' || 
    role === 'Wakasek Kurikulum' || 
    role === 'Wakasek Kesiswaan' || 
    item.roles.includes(role)
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 max-w-[85vw] lg:w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header inside Sidebar */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1 shadow-xs overflow-hidden shrink-0">
              <img
                src="https://raw.githubusercontent.com/smknbojonggambir/simagu/main/logo.png"
                alt="Logo SMKN Bojonggambir"
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-wide block leading-none">SIMAGU</span>
              <span className="text-[10px] text-teal-400 font-medium">SMKN Bojonggambir</span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95 touch-manipulation lg:hidden"
            title="Tutup Menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Database Status Widget */}
        <div className="mx-3 my-3 rounded-lg bg-slate-800/80 border border-slate-700 p-2.5">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400 animate-pulse" />
            <div className="text-xs">
              <span className="font-semibold text-slate-200 block">Database Connected</span>
              <span className="text-[10px] text-slate-400">Google Sheets Sync Ready</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                className={`group flex w-full min-h-[44px] items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition active:scale-[0.98] touch-manipulation ${
                  isActive
                    ? 'bg-teal-600 text-white font-bold shadow-md shadow-teal-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 shrink-0 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'}`} />
                  <span className="text-left">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 shrink-0 text-white" />}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="border-t border-slate-800 p-3 text-center text-[10px] text-slate-400">
          <p className="font-medium text-slate-300">SIMAGU SMK System</p>
          <p>© 2026 Google Apps Script & Sheets</p>
        </div>
      </aside>
    </>
  );
};

import React, { useState } from 'react';
import { 
  Settings, 
  Code2, 
  Download, 
  Upload, 
  Shield, 
  Database, 
  Save, 
  CheckCircle2,
  Search,
  Filter,
  Users,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  Clock,
  UserCheck,
  AlertTriangle,
  RotateCcw,
  Eye,
  X,
  FileCheck2,
  Lock,
  Sparkles,
  ShieldAlert,
  Info,
  FolderTree,
  Folder,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { SchoolSetting, AuditLogItem, User, UserRole } from '../../types';
import { Storage, DriveFolderStructure } from '../../lib/storage';
import { GoogleDriveFolderPickerModal } from '../GoogleDriveFolderPickerModal';
import { AutoSaveManager, AutoSaveConfig } from '../../lib/autoSaveManager';

interface PengaturanViewProps {
  setting: SchoolSetting;
  auditLogs: AuditLogItem[];
  currentUser?: User;
  onOpenAppsScriptModal: () => void;
  onRefresh: () => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  setting,
  auditLogs = [],
  currentUser,
  onOpenAppsScriptModal,
  onRefresh,
  onOpenGoogleSheetsModal
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'identitas' | 'users' | 'backup'>('audit');
  
  // Settings Form State
  const [formSetting, setFormSetting] = useState<SchoolSetting>(setting);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSettingSubmitting, setIsSettingSubmitting] = useState(false);

  // AutoSave Configuration State
  const [autoSaveConfig, setAutoSaveConfig] = useState<AutoSaveConfig>(() => AutoSaveManager.getConfig());
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState<string | null>(null);

  // Audit Logs Filter State
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [selectedAuditDetail, setSelectedAuditDetail] = useState<AuditLogItem | null>(null);

  // Manual Audit Memo Modal State
  const [isMemoModalOpen, setIsMemoModalOpen] = useState(false);
  const [memoAction, setMemoAction] = useState<string>('CATATAN_AUDIT_RESMI');
  const [memoText, setMemoText] = useState<string>('');

  // Clear Audit Log Modal
  const [isClearLogModalOpen, setIsClearLogModalOpen] = useState(false);

  // Google Drive Folder Structure State
  const [driveStructure, setDriveStructure] = useState<DriveFolderStructure | null>(() => Storage.getDriveFolderStructure());
  const [isGeneratingDrive, setIsGeneratingDrive] = useState(false);
  const [driveMsg, setDriveMsg] = useState<string | null>(null);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  const handleGenerateDriveFolders = async () => {
    setIsGeneratingDrive(true);
    setDriveMsg(null);
    try {
      const res = await Storage.generateGoogleDriveFolderStructure({
        schoolName: formSetting.namaSekolah,
        tahunAjaran: formSetting.tahunPelajaran
      });
      setDriveStructure(res);
      setDriveMsg('Struktur folder Google Drive berhasil dibuat & dikonfigurasi per Tahun Ajaran dan Jurusan!');
    } catch (err: any) {
      setDriveMsg('Gagal membuat struktur folder Google Drive: ' + (err.message || 'Error'));
    } finally {
      setIsGeneratingDrive(false);
    }
  };

  // User Management CRUD State
  const [usersList, setUsersList] = useState<User[]>(() => Storage.getUsers());
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  
  // User Form Modal State (Create & Edit)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<{
    id: string;
    username: string;
    nama: string;
    nip: string;
    role: UserRole;
    email: string;
    kelasWali: string;
  }>({
    id: '',
    username: '',
    nama: '',
    nip: '',
    role: 'Guru',
    email: '',
    kelasWali: ''
  });

  // Delete User Confirmation
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Active Administrator Identity
  const activeAdminName = currentUser?.nama || 'Administrator SIMAGU';
  const activeAdminRole = currentUser?.role || 'Administrator';

  // --- HANDLERS: Settings Form ---
  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingSubmitting(true);
    try {
      Storage.saveSetting(formSetting);
      
      // Log detailed audit entry with active administrator info
      const changeSummary = `Memperbarui konfigurasi identitas sekolah & Kop Surat oleh ${activeAdminName} (${activeAdminRole}). NPSN: ${formSetting.npsn}, Kurikulum: ${formSetting.wakasekKurikulum || '-'}, Kesiswaan: ${setting.wakasekKurikulum || '-'}`;
      Storage.logAudit('UPDATE_SETTING', changeSummary, { nama: activeAdminName, role: activeAdminRole });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefresh();
    } finally {
      setIsSettingSubmitting(false);
    }
  };

  // --- HANDLERS: Audit Logs ---
  const safeAuditLogs = auditLogs || [];

  // Filtered Audit Logs
  const filteredAuditLogs = safeAuditLogs.filter(log => {
    const matchSearch = !auditSearch || 
      log.user.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (log.role && log.role.toLowerCase().includes(auditSearch.toLowerCase()));

    const matchRole = roleFilter === 'all' || log.role === roleFilter || 
      (roleFilter === 'pimpinan' && (log.role === 'Wakasek Kurikulum' || log.role === 'Wakasek Kesiswaan' || log.role === 'Kepala Sekolah')) ||
      (roleFilter === 'admin' && log.role === 'Administrator');

    let matchAction = true;
    if (actionFilter === 'CREATE') matchAction = log.action.includes('CREATE') || log.action.includes('INIT') || log.action.includes('TAMBAH');
    else if (actionFilter === 'UPDATE') matchAction = log.action.includes('UPDATE') || log.action.includes('UBAH') || log.action.includes('SETTING');
    else if (actionFilter === 'DELETE') matchAction = log.action.includes('DELETE') || log.action.includes('CLEAR') || log.action.includes('HAPUS');
    else if (actionFilter === 'BACKUP') matchAction = log.action.includes('BACKUP') || log.action.includes('RESTORE') || log.action.includes('EXPORT');
    else if (actionFilter === 'AUTH') matchAction = log.action.includes('LOGIN') || log.action.includes('LOGOUT');

    return matchSearch && matchRole && matchAction;
  });

  // Calculate Statistics
  const kurikulumLogCount = safeAuditLogs.filter(l => l.role === 'Wakasek Kurikulum').length;
  const kesiswaanLogCount = safeAuditLogs.filter(l => l.role === 'Wakasek Kesiswaan').length;
  const adminLogCount = safeAuditLogs.filter(l => l.role === 'Administrator').length;

  // Export Audit Logs to CSV
  const handleExportAuditCSV = () => {
    const headers = ['ID', 'Waktu & Tanggal', 'Nama Pengguna', 'Peran/Jabatan', 'Jenis Aksi', 'Detail Transaksi', 'IP Address'];
    const csvRows = [headers.join(',')];

    filteredAuditLogs.forEach(l => {
      const row = [
        `"${l.id}"`,
        `"${l.timestamp}"`,
        `"${l.user.replace(/"/g, '""')}"`,
        `"${l.role.replace(/"/g, '""')}"`,
        `"${l.action.replace(/"/g, '""')}"`,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${l.ipAddress || '127.0.0.1'}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Log_SIMAGU_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Storage.logAudit('EXPORT_AUDIT_LOG', `Mengeksport ${filteredAuditLogs.length} entri log audit ke file CSV oleh ${activeAdminName} (${activeAdminRole})`, { nama: activeAdminName, role: activeAdminRole });
    onRefresh();
  };

  // Add Manual Memo
  const handleAddAuditMemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memoText.trim()) return;

    Storage.logAudit(memoAction, `[CATATAN AUDIT PIMPINAN]: ${memoText.trim()} (Dicatat oleh: ${activeAdminName}, ${activeAdminRole})`, { nama: activeAdminName, role: activeAdminRole });
    setMemoText('');
    setIsMemoModalOpen(false);
    onRefresh();
  };

  // Clear Audit Logs
  const handleConfirmClearLogs = () => {
    Storage.logAudit('AUDIT_LOG_CLEARED', `Seluruh log audit lama dibersihkan dan diarsipkan oleh ${activeAdminName} (${activeAdminRole})`, { nama: activeAdminName, role: activeAdminRole });
    // Keep only the clear audit log record
    const updated = Storage.getAuditLogs().slice(0, 1);
    Storage.saveAuditLogs(updated);
    setIsClearLogModalOpen(false);
    onRefresh();
  };

  // --- HANDLERS: User CRUD Management ---
  const handleOpenAddUserModal = () => {
    setEditingUser(null);
    setUserFormData({
      id: `usr-${Date.now()}`,
      username: '',
      nama: '',
      nip: '',
      role: 'Guru',
      email: '',
      kelasWali: ''
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (u: User) => {
    setEditingUser(u);
    setUserFormData({
      id: u.id,
      username: u.username,
      nama: u.nama,
      nip: u.nip || '',
      role: u.role,
      email: u.email,
      kelasWali: u.kelasWali || ''
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    const currentUsers = Storage.getUsers();

    if (editingUser) {
      // Update User
      const updatedList = currentUsers.map(u => u.id === editingUser.id ? {
        ...u,
        username: userFormData.username.trim() || userFormData.nama.toLowerCase().replace(/\s+/g, '_'),
        nama: userFormData.nama.trim(),
        nip: userFormData.nip.trim(),
        role: userFormData.role,
        email: userFormData.email.trim(),
        kelasWali: userFormData.kelasWali.trim()
      } : u);

      Storage.saveUsers(updatedList);
      setUsersList(updatedList);

      Storage.logAudit('UPDATE_USER', `Memperbarui data akun pengguna: ${userFormData.nama} (${userFormData.role}, NIP: ${userFormData.nip || '-'}) oleh ${activeAdminName} (${activeAdminRole})`, { nama: activeAdminName, role: activeAdminRole });
    } else {
      // Create User
      const newUser: User = {
        id: userFormData.id || `usr-${Date.now()}`,
        username: userFormData.username.trim() || userFormData.nama.toLowerCase().replace(/\s+/g, '_'),
        nama: userFormData.nama.trim(),
        nip: userFormData.nip.trim(),
        role: userFormData.role,
        email: userFormData.email.trim() || `${userFormData.username.trim()}@smknbojonggambir.sch.id`,
        kelasWali: userFormData.kelasWali.trim()
      };

      const updatedList = [newUser, ...currentUsers];
      Storage.saveUsers(updatedList);
      setUsersList(updatedList);

      Storage.logAudit('CREATE_USER', `Menambahkan akun pengguna baru: ${newUser.nama} (${newUser.role}, NIP: ${newUser.nip || '-'}) oleh ${activeAdminName} (${activeAdminRole})`, { nama: activeAdminName, role: activeAdminRole });
    }

    setIsUserModalOpen(false);
    onRefresh();
  };

  const handleConfirmDeleteUser = () => {
    if (!deletingUser) return;
    const currentUsers = Storage.getUsers();
    const updatedList = currentUsers.filter(u => u.id !== deletingUser.id);
    Storage.saveUsers(updatedList);
    setUsersList(updatedList);

    Storage.logAudit('DELETE_USER', `Menghapus akun pengguna: ${deletingUser.nama} (${deletingUser.role}, NIP: ${deletingUser.nip || '-'}) oleh ${activeAdminName} (${activeAdminRole})`, { nama: activeAdminName, role: activeAdminRole });
    
    setDeletingUser(null);
    onRefresh();
  };

  const filteredUsersList = usersList.filter(u => {
    const matchSearch = !userSearch || 
      u.nama.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.nip && u.nip.includes(userSearch));

    const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter ||
      (userRoleFilter === 'pimpinan' && (u.role === 'Wakasek Kurikulum' || u.role === 'Wakasek Kesiswaan' || u.role === 'Kepala Sekolah')) ||
      (userRoleFilter === 'guru' && (u.role === 'Guru' || u.role === 'Wali Kelas' || u.role === 'Guru BK'));

    return matchSearch && matchRole;
  });

  // --- HANDLERS: Backup & Restore ---
  const handleBackupJSON = () => {
    Storage.exportBackupJSON();
    onRefresh();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = Storage.importBackupJSON(content);
        if (success) {
          alert('Pemulihan database berhasil! Halaman akan dimuat ulang untuk memperbarui data.');
          window.location.reload();
        } else {
          alert('Format file JSON backup tidak valid. Silakan gunakan file cadangan resmi SIMAGU.');
        }
      }
    };
    reader.readAsText(file);
  };

  // Helper for Role Badges
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Wakasek Kurikulum':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      case 'Wakasek Kesiswaan':
        return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-300 dark:border-teal-800';
      case 'Administrator':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'Kepala Sekolah':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800';
      case 'Wali Kelas':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800';
      case 'Guru BK':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
    }
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes('CREATE') || action.includes('TAMBAH') || action.includes('INIT')) {
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    }
    if (action.includes('UPDATE') || action.includes('UBAH') || action.includes('SETTING')) {
      return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
    }
    if (action.includes('DELETE') || action.includes('CLEAR') || action.includes('HAPUS')) {
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    }
    if (action.includes('BACKUP') || action.includes('RESTORE') || action.includes('EXPORT')) {
      return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
    }
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
    }
    return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono text-[10px] font-bold border border-teal-500/20">
              MODUL ADMINISTRATOR & AKUNTABILITAS
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <Settings className="h-7 w-7 text-teal-600" />
            <span>Pengaturan SIMAGU & Log Audit</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manajemen identitas sekolah, jejak audit operasional pimpinan (Wakasek Kurikulum & Kesiswaan), hak akses, dan integrasi cloud.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Quick Backup Data Button */}
          <button
            id="btn-backup-data-header"
            onClick={handleBackupJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer"
            title="Unduh file backup JSON dari data aplikasi lokal (localStorage)"
          >
            <Download className="h-4 w-4" />
            <span>Backup Data</span>
          </button>

          {/* Active Administrator Delegation Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-slate-900/10 border border-teal-500/30 dark:border-teal-500/20">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white font-black text-sm shadow">
              {activeAdminName.charAt(0)}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                <span>Petugas Administrator Aktif</span>
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                {activeAdminName}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {activeAdminRole} • SMKN Bojonggambir
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition border shrink-0 ${
            activeTab === 'audit'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-teal-500'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Log Audit & Akuntabilitas ({safeAuditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('identitas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition border shrink-0 ${
            activeTab === 'identitas'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-teal-500'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Identitas Sekolah & Kop Surat</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition border shrink-0 ${
            activeTab === 'users'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-teal-500'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Kelola Akun User ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition border shrink-0 ${
            activeTab === 'backup'
              ? 'bg-teal-600 text-white border-teal-600 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-teal-500'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Cadangan, Pemulihan & GAS</span>
        </button>
      </div>

      {/* TAB 1: LOG AUDIT & AKUNTABILITAS (CORE FEATURE) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          
          {/* Audit Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500">Total Transaksi Audit</span>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{safeAuditLogs.length}</div>
                <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">Tercatat secara otomatis</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <FileCheck2 className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500">Aksi Wakasek Kurikulum</span>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{kurikulumLogCount}</div>
                <span className="text-[10px] text-slate-400">Wakasek Kurikulum</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500">Aksi Wakasek Kesiswaan</span>
                <div className="text-xl font-black text-teal-600 dark:text-teal-400 mt-0.5">{kesiswaanLogCount}</div>
                <span className="text-[10px] text-slate-400">Wakasek Kesiswaan</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Shield className="h-5 w-5" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-slate-500">Aksi Administrator SIMAGU</span>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{adminLogCount}</div>
                <span className="text-[10px] text-slate-400">Sistem & User CRUD</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Lock className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Audit Toolbar & Filters */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-teal-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Audit Log Transaksi & CRUD Pimpinan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistem mencatat secara real-time setiap perubahan data yang dilakukan oleh Administrator, Wakasek Kurikulum, dan Wakasek Kesiswaan.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportAuditCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800 text-xs font-bold hover:bg-teal-100 transition shadow-sm"
                  title="Unduh Laporan Audit Format CSV"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Ekspor CSV</span>
                </button>

                <button
                  onClick={() => setIsMemoModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold hover:opacity-90 transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Catatan Audit Memo</span>
                </button>

                <button
                  onClick={() => setIsClearLogModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 text-xs font-bold hover:bg-rose-100 transition shadow-sm"
                  title="Bersihkan Log Audit Lama"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Bersihkan Log</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Cari nama, NIP, aksi, atau detail..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Role Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">Semua Peran / Jabatan</option>
                  <option value="Wakasek Kurikulum">Wakasek Kurikulum</option>
                  <option value="Wakasek Kesiswaan">Wakasek Kesiswaan</option>
                  <option value="Administrator">Administrator SIMAGU</option>
                  <option value="pimpinan">Pimpinan & Wakasek</option>
                  <option value="Guru">Guru / Wali Kelas</option>
                </select>
              </div>

              {/* Action Category Filter */}
              <div className="relative">
                <Code2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">Semua Jenis Aksi</option>
                  <option value="CREATE">CREATE (Tambah Data)</option>
                  <option value="UPDATE">UPDATE (Ubah Pengaturan / Data)</option>
                  <option value="DELETE">DELETE (Hapus Data)</option>
                  <option value="BACKUP">BACKUP & RESTORE</option>
                  <option value="AUTH">LOGIN & OTENTIKASI</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Waktu & Sesi</th>
                    <th className="py-3 px-4">Pengguna & Jabatan</th>
                    <th className="py-3 px-4">Jenis Aksi (CRUD)</th>
                    <th className="py-3 px-4">Detail Perubahan / Catatan Audit</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <Info className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <span>Tidak ada catatan log audit yang sesuai dengan filter pencarian.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        
                        {/* Waktu & Sesi */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <Clock className="h-3.5 w-3.5 text-teal-600" />
                            <span>{log.timestamp}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">IP: {log.ipAddress || '127.0.0.1'}</span>
                        </td>

                        {/* Pengguna & Jabatan */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                              {log.user.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">
                                {log.user}
                              </div>
                              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-bold border mt-0.5 ${getRoleBadgeClass(log.role)}`}>
                                {log.role}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Jenis Aksi (CRUD) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wide inline-block ${getActionBadgeClass(log.action)}`}>
                            {log.action}
                          </span>
                        </td>

                        {/* Detail Perubahan */}
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-md">
                          <p className="line-clamp-2 text-xs leading-relaxed font-normal">
                            {log.details}
                          </p>
                        </td>

                        {/* Options / Action */}
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedAuditDetail(log)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition"
                            title="Lihat Rincian Audit Log"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 text-right text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-800">
              Menampilkan {filteredAuditLogs.length} dari {safeAuditLogs.length} catatan log audit.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KONFIGURASI IDENTITAS SEKOLAH & KOP SURAT */}
      {activeTab === 'identitas' && (
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Settings className="h-5 w-5 text-teal-600" />
              <span>Konfigurasi Kop Surat & Identitas Sekolah</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Data ini akan dicetak pada seluruh Kop Surat Dokumen Resmi SIMAGU, Agenda Harian Guru, Lembar Supervisi, dan Laporan.
            </p>
          </div>

          <form onSubmit={handleSaveSetting} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Nama Resmi Sekolah</label>
                <input
                  type="text"
                  value={formSetting.namaSekolah}
                  onChange={(e) => setFormSetting({ ...formSetting, namaSekolah: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">NPSN Sekolah</label>
                <input
                  type="text"
                  value={formSetting.npsn}
                  onChange={(e) => setFormSetting({ ...formSetting, npsn: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Alamat Lengkap</label>
                <input
                  type="text"
                  value={formSetting.alamat}
                  onChange={(e) => setFormSetting({ ...formSetting, alamat: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Kota / Kabupaten</label>
                <input
                  type="text"
                  value={formSetting.kota}
                  onChange={(e) => setFormSetting({ ...formSetting, kota: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            {/* Logo Preview, Upload File & URL */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <label className="block font-bold text-slate-700 dark:text-slate-300">Logo Sekolah (Kop Surat PDF & Cetak Dokumen)</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {formSetting.logoUrl && (
                  <div className="h-16 w-16 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1.5 overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                    <img src={formSetting.logoUrl} alt="Logo Sekolah" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-sm cursor-pointer transition">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Unggah File Logo (PNG/JPG)</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('Ukuran file logo terlalu besar. Harap gunakan gambar di bawah 2MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (reader.result) {
                                setFormSetting({ ...formSetting, logoUrl: reader.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setFormSetting({ 
                        ...formSetting, 
                        logoUrl: 'https://raw.githubusercontent.com/smknbojonggambir/simagu/main/logo.png' 
                      })}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                      title="Reset ke Logo Default SMKN Bojonggambir"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset Logo Default</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={formSetting.logoUrl}
                    onChange={(e) => setFormSetting({ ...formSetting, logoUrl: e.target.value })}
                    placeholder="Atau masukkan URL logo (https://...)"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-900 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Pimpinan & Wakasek */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Nama Kepala Sekolah & Gelar</label>
                <input
                  type="text"
                  value={formSetting.kepalaSekolah}
                  onChange={(e) => setFormSetting({ ...formSetting, kepalaSekolah: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={formSetting.nipKepalaSekolah}
                  onChange={(e) => setFormSetting({ ...formSetting, nipKepalaSekolah: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Wakasek Kurikulum</label>
                <input
                  type="text"
                  value={formSetting.wakasekKurikulum}
                  onChange={(e) => setFormSetting({ ...formSetting, wakasekKurikulum: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">NIP Wakasek Kurikulum</label>
                <input
                  type="text"
                  value={formSetting.nipWakasekKurikulum}
                  onChange={(e) => setFormSetting({ ...formSetting, nipWakasekKurikulum: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Tahun Pelajaran & Semester */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Tahun Pelajaran</label>
                <input
                  type="text"
                  value={formSetting.tahunPelajaran}
                  onChange={(e) => setFormSetting({ ...formSetting, tahunPelajaran: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Semester</label>
                <select
                  value={formSetting.semester}
                  onChange={(e) => setFormSetting({ ...formSetting, semester: e.target.value as 'Ganjil' | 'Genap' })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
                </select>
              </div>
            </div>

            {/* Submit & Status */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              {saveSuccess ? (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="h-4 w-4" /> Pengaturan Berhasil Disimpan & Dicatat dalam Audit Log!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Perubahan akan otomatis mencatat ID petugas administrator yang melakukan aksi.
                </span>
              )}

              <button
                type="submit"
                disabled={isSettingSubmitting}
                className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-6 py-2.5 text-xs font-bold shadow-lg shadow-teal-950/20 transition active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                {isSettingSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Pengaturan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: KELOLA AKUN USER (USER CRUD) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                <span>Manajemen Akun Pengguna & Hak Akses (CRUD)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola daftar pengguna, perbarui kata sandi, dan tetapkan hak akses peran Administrator, Wakasek, maupun Guru.
              </p>
            </div>

            <button
              onClick={handleOpenAddUserModal}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 text-xs font-bold shadow transition"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah User Baru</span>
            </button>
          </div>

          {/* Search & Filter for Users */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Cari berdasarkan nama, username, NIP..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white"
              >
                <option value="all">Semua Peran User</option>
                <option value="pimpinan">Pimpinan & Wakasek</option>
                <option value="Administrator">Administrator</option>
                <option value="Kepala Sekolah">Kepala Sekolah</option>
                <option value="Wakasek Kurikulum">Wakasek Kurikulum</option>
                <option value="Wakasek Kesiswaan">Wakasek Kesiswaan</option>
                <option value="guru">Guru & Staf</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-4">Nama User & Username</th>
                    <th className="py-3 px-4">NIP</th>
                    <th className="py-3 px-4">Peran / Hak Akses</th>
                    <th className="py-3 px-4">Email / Kontak</th>
                    <th className="py-3 px-4 text-center">Aksi CRUD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {u.nama.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{u.nama}</div>
                            <span className="text-[10px] text-slate-400 font-mono">@{u.username}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {u.nip || '-'}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getRoleBadgeClass(u.role)}`}>
                          {u.role}
                        </span>
                        {u.kelasWali && (
                          <span className="block text-[9px] text-slate-400 mt-0.5">Wali: {u.kelasWali}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {u.email}
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditUserModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                            title="Edit Data User"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Hapus User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CADANGAN, PEMULIHAN & GOOGLE APPS SCRIPT */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Auto-Save & Automatic Persistence Manager */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-teal-500/30 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Mekanisme Auto-Save & Sinkronisasi Latar Belakang
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                      Proteksi Anti Hilang Data
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sistem secara otomatis menyimpan perubahan ke penyimpanan lokal dan menyinkronkan data ke Google Sheets/Apps Script secara berkala.
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  setIsManualSaving(true);
                  const res = await AutoSaveManager.performSave();
                  setIsManualSaving(false);
                  setAutoSaveConfig(AutoSaveManager.getConfig());
                  if (res.success) {
                    setAutoSaveMsg(`✓ Berhasil menyimpan ${res.itemCount} item data secara otomatis!`);
                  } else {
                    setAutoSaveMsg(`❌ Gagal menyimpan: ${res.error}`);
                  }
                  setTimeout(() => setAutoSaveMsg(null), 4000);
                }}
                disabled={isManualSaving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow transition cursor-pointer shrink-0"
              >
                <Save className="h-4 w-4" />
                <span>{isManualSaving ? 'Memproses Simpan...' : 'Simpan Snapshot Sekarang'}</span>
              </button>
            </div>

            {autoSaveMsg && (
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <span>{autoSaveMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-slate-500 font-medium">Status Fitur Auto-Save:</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {autoSaveConfig.enabled ? 'Aktif Otomatis' : 'Nonaktif'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSaveConfig.enabled}
                      onChange={(e) => {
                        const updated = AutoSaveManager.saveConfig({ enabled: e.target.checked });
                        setAutoSaveConfig(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-slate-500 font-medium">Frekuensi / Interval Simpan:</span>
                <select
                  value={autoSaveConfig.intervalSeconds}
                  onChange={(e) => {
                    const updated = AutoSaveManager.saveConfig({ intervalSeconds: Number(e.target.value) });
                    setAutoSaveConfig(updated);
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value={15}>Setiap 15 Detik (Sangat Cepat)</option>
                  <option value={30}>Setiap 30 Detik (Rekomendasi)</option>
                  <option value={60}>Setiap 1 Menit</option>
                  <option value={120}>Setiap 2 Menit</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-slate-500 font-medium">Auto-Sync Cloud (GAS):</span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {autoSaveConfig.syncToCloud ? 'Aktif' : 'Nonaktif'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSaveConfig.syncToCloud}
                      onChange={(e) => {
                        const updated = AutoSaveManager.saveConfig({ syncToCloud: e.target.checked });
                        setAutoSaveConfig(updated);
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Database */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ekspor Cadangan Database (.json)</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unduh seluruh snapshot database lokal SIMAGU (Agenda Harian, Kehadiran, Supervisi, Master Data, dan Audit Log) ke format file JSON.
            </p>
            <button
              onClick={handleBackupJSON}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white p-3 text-xs font-bold shadow transition"
            >
              <Download className="h-4 w-4" />
              <span>Unduh Backup Database SIMAGU</span>
            </button>
          </div>

          {/* Restore Database */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pulihkan Data dari Backup</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unggah file backup `.json` SIMAGU untuk mengembalikan data operasional. Tindakan ini akan dicatat dalam Audit Log.
            </p>
            <label className="w-full flex items-center justify-center gap-2 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 p-3 text-xs font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 cursor-pointer transition">
              <Upload className="h-4 w-4" />
              <span>Pilih File Backup (.json)</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>

          {/* Google Sheets Live Sync Card */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-slate-900 dark:to-slate-900 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-xs">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sinkronisasi & Kirim Data ke Google Sheets</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Kirim dan perbarui seluruh 16 tab data SIMAGU (Agenda, Siswa, Guru, Supervisi, Nilai, dll) langsung ke Google Spreadsheet tujuan.</p>
                </div>
              </div>

              {onOpenGoogleSheetsModal && (
                <button
                  onClick={onOpenGoogleSheetsModal}
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md transition shrink-0"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Kirim Data ke Google Sheet</span>
                </button>
              )}
            </div>
          </div>

          {/* Google Apps Script Integration */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-teal-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Integrasi Kode Google Apps Script (Code.gs)</h3>
                  <p className="text-xs text-slate-500">Salin skrip backend Google Apps Script untuk menghubungkan SIMAGU dengan Google Sheets.</p>
                </div>
              </div>

              <button
                onClick={onOpenAppsScriptModal}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 text-white px-4 py-2 text-xs font-bold shadow hover:bg-teal-500"
              >
                <Code2 className="h-4 w-4" />
                <span>Buka Kode Code.gs</span>
              </button>
            </div>
          </div>

          {/* Google Drive Folder Structure Generator */}
          <div className="md:col-span-2 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800">
                  <FolderTree className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Struktur Folder Penyimpanan Google Drive</h3>
                  <p className="text-xs text-slate-500">Generasi struktur direktori penyimpanan laporan PDF dan berkas ekspor terorganisir per Tahun Ajaran dan Jurusan.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrivePickerOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-teal-600/40 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-4 py-2.5 text-xs font-bold transition shadow-2xs"
                >
                  <Folder className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  <span>Pilih Folder Google Drive</span>
                </button>

                <button
                  onClick={handleGenerateDriveFolders}
                  disabled={isGeneratingDrive}
                  className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 text-xs font-bold shadow transition disabled:opacity-50"
                >
                  <FolderTree className="h-4 w-4" />
                  <span>{isGeneratingDrive ? 'Proses...' : 'Buat / Perbarui Struktur Folder'}</span>
                </button>
              </div>
            </div>

            <GoogleDriveFolderPickerModal
              isOpen={isDrivePickerOpen}
              onClose={() => setIsDrivePickerOpen(false)}
              onSelectFolder={(url, name) => {
                setDriveMsg(`Berhasil memilih folder Google Drive: ${name || url}`);
              }}
            />

            {driveMsg && (
              <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs font-medium text-teal-800 dark:text-teal-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
                <span>{driveMsg}</span>
              </div>
            )}

            {driveStructure && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                    <Folder className="h-4 w-4 text-amber-500" />
                    <span>{driveStructure.rootFolder.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold">
                      TA {driveStructure.tahunAjaran}
                    </span>
                  </div>
                  {driveStructure.rootFolder.webViewLink && (
                    <a
                      href={driveStructure.rootFolder.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-teal-600 hover:underline flex items-center gap-1"
                    >
                      <span>Buka di Google Drive</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Subfolder preview tree */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {driveStructure.departments.map((dept, idx) => (
                    <div key={dept.kodeJurusan ? `${dept.kodeJurusan}-${idx}` : `dept-${idx}`} className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span className="flex items-center gap-1.5 truncate">
                          <Folder className="h-3.5 w-3.5 text-teal-500" />
                          {dept.folderName}
                        </span>
                        {dept.webViewLink && (
                          <a href={dept.webViewLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline text-[11px] shrink-0">
                            Akses ↗
                          </a>
                        )}
                      </div>
                      <div className="pl-4 space-y-1 text-[11px] text-slate-500 border-l border-slate-200 dark:border-slate-800 ml-1.5">
                        <div className="flex items-center justify-between">
                          <span>📁 {dept.subfolders.agendaGuru.name}</span>
                          {dept.subfolders.agendaGuru.webViewLink && (
                            <a href={dept.subfolders.agendaGuru.webViewLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Link</a>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>📁 {dept.subfolders.agendaKelas.name}</span>
                          {dept.subfolders.agendaKelas.webViewLink && (
                            <a href={dept.subfolders.agendaKelas.webViewLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Link</a>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>📁 {dept.subfolders.supervisi.name}</span>
                          {dept.subfolders.supervisi.webViewLink && (
                            <a href={dept.subfolders.supervisi.webViewLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Link</a>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>📁 {dept.subfolders.presensiSiswa.name}</span>
                          {dept.subfolders.presensiSiswa.webViewLink && (
                            <a href={dept.subfolders.presensiSiswa.webViewLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Link</a>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span>📁 {dept.subfolders.exportFiles.name}</span>
                          {dept.subfolders.exportFiles.webViewLink && (
                            <a href={dept.subfolders.exportFiles.webViewLink} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Link</a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: VIEW AUDIT LOG DETAIL */}
      {selectedAuditDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Detail Catatan Audit Log</h3>
              </div>
              <button
                onClick={() => setSelectedAuditDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">ID Log Transaksi</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{selectedAuditDetail.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Waktu & Tanggal</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedAuditDetail.timestamp}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Jenis Aksi</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeClass(selectedAuditDetail.action)}`}>
                    {selectedAuditDetail.action}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Petugas Administrator</span>
                <div className="font-bold text-slate-900 dark:text-white">{selectedAuditDetail.user}</div>
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">{selectedAuditDetail.role}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rincian Deskripsi Transaksi</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {selectedAuditDetail.details}
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedAuditDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:opacity-90"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL AUDIT MEMO */}
      {isMemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleAddAuditMemo} className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Tambah Catatan Audit Resmi Memo</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMemoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Jenis Kategori Memo</label>
                <select
                  value={memoAction}
                  onChange={(e) => setMemoAction(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                >
                  <option value="CATATAN_AUDIT_KURIKULUM">Audit Kurikulum & Pembelajaran</option>
                  <option value="CATATAN_AUDIT_KESISWAAN">Audit Kedisiplinan Kesiswaan</option>
                  <option value="VERIFIKASI_BERKAS_GURU">Verifikasi Berkas & Administrasi Guru</option>
                  <option value="CATATAN_AUDIT_RESMI">Catatan Audit Resmi Pimpinan</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Rincian Memo Audit / Catatan Pertanggungjawaban</label>
                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan catatan verifikasi, hasil inspeksi agenda guru, atau memo pimpinan..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 text-[11px] flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0 text-teal-600" />
                <span>Memo ini akan dicatat atas nama <strong>{activeAdminName} ({activeAdminRole})</strong> dalam rekam audit permanen.</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsMemoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow"
              >
                Simpan Memo Audit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: USER FORM (CREATE / EDIT) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <form onSubmit={handleSaveUserForm} className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={userFormData.nama}
                  onChange={(e) => setUserFormData({ ...userFormData, nama: e.target.value })}
                  placeholder="Contoh: Iman Rahmat, S.Pd.I."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Username Login</label>
                  <input
                    type="text"
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    placeholder="Contoh: wakasek_kur"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">NIP / NUPTK</label>
                  <input
                    type="text"
                    value={userFormData.nip}
                    onChange={(e) => setUserFormData({ ...userFormData, nip: e.target.value })}
                    placeholder="19901017 202321 1 007"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Peran / Hak Akses</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  >
                    <option value="Guru">Guru</option>
                    <option value="Wali Kelas">Wali Kelas</option>
                    <option value="Guru BK">Guru BK</option>
                    <option value="Wakasek Kurikulum">Wakasek Kurikulum</option>
                    <option value="Wakasek Kesiswaan">Wakasek Kesiswaan</option>
                    <option value="Kepala Sekolah">Kepala Sekolah</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Email Kedinasan</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="nama@smknbojonggambir.sch.id"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {userFormData.role === 'Wali Kelas' && (
                <div>
                  <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Kelas Wali</label>
                  <input
                    type="text"
                    value={userFormData.kelasWali}
                    onChange={(e) => setUserFormData({ ...userFormData, kelasWali: e.target.value })}
                    placeholder="Contoh: XI APHP"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow"
              >
                Simpan User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CONFIRM DELETE USER */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Hapus Akun Pengguna?</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <strong>{deletingUser.nama}</strong> ({deletingUser.role})? Tindakan ini akan dicatat dalam Audit Log SIMAGU.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM CLEAR AUDIT LOGS */}
      {isClearLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bersihkan Log Audit?</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tindakan ini akan mengarsipkan log audit lama. Sebuah entri baru <strong>AUDIT_LOG_CLEARED</strong> akan dicatat atas nama Anda (<strong>{activeAdminName}</strong>).
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsClearLogModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmClearLogs}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow"
              >
                Ya, Bersihkan Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

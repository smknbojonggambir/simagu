import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Search, 
  Upload, 
  FolderPlus, 
  RefreshCw, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Image as ImageIcon, 
  Folder, 
  Trash2, 
  ExternalLink, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  User as UserIcon, 
  CloudUpload,
  Download,
  ShieldCheck,
  Clock,
  Layers,
  Info
} from 'lucide-react';
import { User } from '../../types';
import { googleSignIn, logoutGoogle, initAuth, getAccessToken } from '../../lib/firebaseAuth';
import { GoogleDriveService, DriveFileItem, DriveUser, DriveQuota } from '../../lib/googleDriveService';
import { Storage } from '../../lib/storage';

interface GoogleDriveViewProps {
  currentUser: User;
  onRefresh: () => void;
}

export const GoogleDriveView: React.FC<GoogleDriveViewProps> = ({ currentUser, onRefresh }) => {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [userDrive, setUserDrive] = useState<DriveUser | null>(null);
  const [quota, setQuota] = useState<DriveQuota | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderBreadcrumb, setFolderBreadcrumb] = useState<{ id: string; name: string }[]>([]);

  // Modals state
  const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (_user, accessToken) => {
        setToken(accessToken);
      },
      () => {
        setToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch Drive Data when token changes or folder changes
  useEffect(() => {
    if (token) {
      loadDriveData(token, currentFolderId);
    } else {
      setFiles([]);
      setUserDrive(null);
      setQuota(null);
    }
  }, [token, currentFolderId]);

  const loadDriveData = async (accessToken: string, folderId?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Get User Info & Quota
      const info = await GoogleDriveService.getUserInfoAndQuota(accessToken);
      if (info.user) setUserDrive(info.user);
      if (info.quota) setQuota(info.quota);

      // Build Query
      let q = "trashed = false";
      if (folderId) {
        q += ` and '${folderId}' in parents`;
      } else {
        q += ` and 'root' in parents`;
      }

      const fileResult = await GoogleDriveService.listFiles(accessToken, { q, pageSize: 50 });
      setFiles(fileResult.files || []);
    } catch (err: any) {
      console.error('Drive Load Error:', err);
      setErrorMessage(err.message || 'Gagal terhubung dengan Google Drive API');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginGoogle = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setToken(res.accessToken);
        setSuccessMessage(`Berhasil menghubungkan Google Drive dengan akun ${res.user.email}`);
        setTimeout(() => setSuccessMessage(null), 4000);
        Storage.logAudit('GOOGLE_DRIVE_CONNECT', `Pengguna ${currentUser.nama} menghubungkan Google Drive (${res.user.email})`);
      }
    } catch (err: any) {
      console.error('Login Google error:', err);
      setErrorMessage(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await logoutGoogle();
      setToken(null);
      setUserDrive(null);
      setQuota(null);
      setFiles([]);
      Storage.logAudit('GOOGLE_DRIVE_DISCONNECT', `Pengguna ${currentUser.nama} memutus koneksi Google Drive`);
    } catch (err: any) {
      console.error('Logout Google error:', err);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newFolderName.trim()) return;

    setIsCreatingFolder(true);
    try {
      await GoogleDriveService.createFolder(token, newFolderName.trim(), currentFolderId);
      setSuccessMessage(`Folder "${newFolderName}" berhasil dibuat di Google Drive!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setNewFolderName('');
      setShowCreateFolderModal(false);
      loadDriveData(token, currentFolderId);
      Storage.logAudit('GOOGLE_DRIVE_CREATE_FOLDER', `Membuat folder "${newFolderName}" di Google Drive`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal membuat folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedUploadFile) return;

    setIsUploading(true);
    try {
      await GoogleDriveService.uploadFile(
        token,
        selectedUploadFile,
        selectedUploadFile.name,
        selectedUploadFile.type,
        currentFolderId
      );
      setSuccessMessage(`Berkas "${selectedUploadFile.name}" berhasil diunggah ke Google Drive!`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setSelectedUploadFile(null);
      setShowUploadModal(false);
      loadDriveData(token, currentFolderId);
      Storage.logAudit('GOOGLE_DRIVE_UPLOAD_FILE', `Mengunggah berkas ${selectedUploadFile.name} ke Google Drive`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengunggah berkas');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackupSimaguToDrive = async () => {
    if (!token) return;
    setIsBackingUp(true);
    setErrorMessage(null);
    try {
      // 1. Create or get Backup folder "SIMAGU - Backup & Arsip"
      const dateStr = new Date().toISOString().slice(0, 10);
      const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
      
      const backupData = {
        app: 'SIMAGU SMKN Bojonggambir',
        backupDate: new Date().toISOString(),
        backupBy: currentUser.nama,
        setting: Storage.getSetting(),
        guru: Storage.getGuru(),
        siswa: Storage.getSiswa(),
        kelas: Storage.getKelas(),
        mapel: Storage.getMapel(),
        agendaGuru: Storage.getAgendaGuru(),
        absensiSiswa: Storage.getAbsensiSiswa(),
        absensiGuru: Storage.getAbsensiGuru(),
        nilaiSiswa: Storage.getNilaiSiswa(),
        materi: Storage.getMateri(),
        tugas: Storage.getTugas()
      };

      const fileName = `SIMAGU_Backup_${dateStr}_${timestamp}.json`;
      await GoogleDriveService.uploadJsonBackup(token, backupData, fileName, currentFolderId);

      setSuccessMessage(`Cadangan database SIMAGU berhasil disimpan ke Google Drive (${fileName})!`);
      setTimeout(() => setSuccessMessage(null), 5000);
      loadDriveData(token, currentFolderId);
      Storage.logAudit('GOOGLE_DRIVE_BACKUP', `Pengguna ${currentUser.nama} membuat cadangan sistem SIMAGU di Google Drive (${fileName})`);
    } catch (err: any) {
      console.error('Backup Error:', err);
      setErrorMessage(err.message || 'Gagal membuat cadangan ke Google Drive');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!token || !showDeleteConfirm) return;

    setIsDeleting(true);
    try {
      await GoogleDriveService.deleteFile(token, showDeleteConfirm.id);
      setSuccessMessage(`Berkas "${showDeleteConfirm.name}" berhasil dihapus dari Google Drive.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setShowDeleteConfirm(null);
      loadDriveData(token, currentFolderId);
      Storage.logAudit('GOOGLE_DRIVE_DELETE', `Menghapus berkas ${showDeleteConfirm.name} dari Google Drive`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus berkas');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenFolder = (folder: DriveFileItem) => {
    setCurrentFolderId(folder.id);
    setFolderBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleNavigateBreadcrumb = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(undefined);
      setFolderBreadcrumb([]);
    } else {
      const target = folderBreadcrumb[index];
      setCurrentFolderId(target.id);
      setFolderBreadcrumb(prev => prev.slice(0, index + 1));
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder className="h-5 w-5 text-amber-500 fill-amber-500/20" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-rose-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileText className="h-5 w-5 text-blue-600" />;
    if (mimeType.includes('image')) return <ImageIcon className="h-5 w-5 text-purple-600" />;
    if (mimeType.includes('json')) return <FileCode className="h-5 w-5 text-amber-600" />;
    return <FileText className="h-5 w-5 text-slate-500" />;
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return '-';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return '-';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
    return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatQuota = (bytesStr?: string) => {
    if (!bytesStr) return '0 GB';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '0 GB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFileType === 'folder') return matchesSearch && f.mimeType === 'application/vnd.google-apps.folder';
    if (selectedFileType === 'document') return matchesSearch && (f.mimeType.includes('document') || f.mimeType.includes('pdf') || f.mimeType.includes('text'));
    if (selectedFileType === 'spreadsheet') return matchesSearch && (f.mimeType.includes('spreadsheet') || f.mimeType.includes('csv'));
    if (selectedFileType === 'backup') return matchesSearch && f.name.toLowerCase().includes('simagu');
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <HardDrive className="h-64 w-64 text-teal-600" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 dark:bg-teal-950/50 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Google Workspace Integration & Cloud Sync</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <HardDrive className="h-7 w-7 text-teal-600" />
              Integrasi Google Drive Sekolah
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              Kelola dokumen pembelajaran, modul ajar, laporan presensi, serta cadangan database SIMAGU SMKN Bojonggambir secara langsung ke Google Drive institusi Anda.
            </p>
          </div>

          {/* Connection Status Card */}
          {token && userDrive ? (
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              {userDrive.photoLink ? (
                <img src={userDrive.photoLink} alt={userDrive.displayName} className="h-11 w-11 rounded-full border-2 border-teal-500" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-11 w-11 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-base">
                  {userDrive.displayName?.charAt(0) || 'G'}
                </div>
              )}
              <div className="text-xs space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <span>{userDrive.displayName}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{userDrive.emailAddress}</p>
                {quota && (
                  <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                    Kapasitas: {formatQuota(quota.usageInDrive)} digunakan ({formatQuota(quota.limit)} Total)
                  </p>
                )}
              </div>
              <button
                onClick={handleLogoutGoogle}
                className="ml-2 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline shrink-0"
              >
                Putus Koneksi
              </button>
            </div>
          ) : (
            <button
              onClick={handleLoginGoogle}
              disabled={isAuthenticating}
              className="gsi-material-button shadow-md hover:shadow-lg transition shrink-0"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-bold text-xs">
                  {isAuthenticating ? 'Menghubungkan...' : 'Hubungkan Google Drive'}
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 font-bold">×</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 font-bold">×</button>
        </div>
      )}

      {/* Main Drive Workspace Area */}
      {!token ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600">
            <HardDrive className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Google Drive Belum Terhubung</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Silakan klik tombol "Hubungkan Google Drive" di atas untuk mengakses ruang penyimpanan Google Drive Anda, mengunggah modul ajar, dan mencadangkan data SIMAGU.
            </p>
          </div>
          <button
            onClick={handleLoginGoogle}
            disabled={isAuthenticating}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition"
          >
            <ShieldCheck className="h-4 w-4" />
            {isAuthenticating ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 overflow-x-auto w-full md:w-auto">
              <button
                onClick={() => handleNavigateBreadcrumb(-1)}
                className={`hover:text-teal-600 flex items-center gap-1 ${!currentFolderId ? 'font-bold text-teal-600' : ''}`}
              >
                <HardDrive className="h-3.5 w-3.5" />
                Drive Saya
              </button>
              {folderBreadcrumb.map((item, idx) => (
                <React.Fragment key={item.id}>
                  <span className="text-slate-400">/</span>
                  <button
                    onClick={() => handleNavigateBreadcrumb(idx)}
                    className={`hover:text-teal-600 ${idx === folderBreadcrumb.length - 1 ? 'font-bold text-teal-600' : ''}`}
                  >
                    {item.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
              <button
                onClick={handleBackupSimaguToDrive}
                disabled={isBackingUp}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                title="Cadangkan seluruh data SIMAGU ke Google Drive"
              >
                <Database className="h-4 w-4" />
                {isBackingUp ? 'Menyimpan Backup...' : 'Backup SIMAGU ke Drive'}
              </button>

              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition"
              >
                <FolderPlus className="h-4 w-4 text-amber-500" />
                Folder Baru
              </button>

              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-xs"
              >
                <CloudUpload className="h-4 w-4" />
                Unggah Berkas
              </button>

              <button
                onClick={() => token && loadDriveData(token, currentFolderId)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 p-2 text-slate-500 hover:text-teal-600 transition"
                title="Muat Ulang Berkas"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berkas di Google Drive..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Semua Berkas' },
                { id: 'folder', label: 'Folder' },
                { id: 'document', label: 'Dokumen & PDF' },
                { id: 'spreadsheet', label: 'Spreadsheet' },
                { id: 'backup', label: 'Backup SIMAGU' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFileType(f.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
                    selectedFileType === f.id
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* File Table / Grid */}
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-teal-600" />
                <p>Memuat isi Google Drive...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <Folder className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Tidak ada berkas ditemukan</p>
                <p className="text-[11px] text-slate-400">Cobalah mengubah kata kunci pencarian atau unggah berkas baru.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Nama Berkas</th>
                      <th className="px-4 py-3">Tipe / Format</th>
                      <th className="px-4 py-3">Ukuran</th>
                      <th className="px-4 py-3">Terakhir Diubah</th>
                      <th className="px-6 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFiles.map(file => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                      return (
                        <tr key={file.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              {getFileIcon(file.mimeType)}
                              <div>
                                {isFolder ? (
                                  <button
                                    onClick={() => handleOpenFolder(file)}
                                    className="font-bold text-slate-900 dark:text-white hover:text-teal-600 text-left line-clamp-1"
                                  >
                                    {file.name}
                                  </button>
                                ) : (
                                  <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                                    {file.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-slate-500">
                            {isFolder ? 'Folder' : file.mimeType.split('.').pop()?.split('/').pop() || 'Berkas'}
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-slate-500">
                            {formatFileSize(file.size)}
                          </td>
                          <td className="px-4 py-3.5 text-[11px] text-slate-500">
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Buka
                                </a>
                              )}
                              <button
                                onClick={() => setShowDeleteConfirm(file)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 transition"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Create Folder */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-amber-500" />
                Buat Folder Baru di Google Drive
              </h3>
              <button onClick={() => setShowCreateFolderModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Folder</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Ajar DKV 2026"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white hover:bg-amber-600 transition"
                >
                  {isCreatingFolder ? 'Membuat...' : 'Buat Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload File */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <CloudUpload className="h-5 w-5 text-teal-600" />
                Unggah Berkas ke Google Drive
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center space-y-2 hover:border-teal-500 transition">
                <Upload className="h-8 w-8 mx-auto text-slate-400" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {selectedUploadFile ? selectedUploadFile.name : 'Pilih berkas dari perangkat Anda'}
                </p>
                <p className="text-[10px] text-slate-400">PDF, Word, Excel, Gambar, atau Zip</p>
                <input
                  type="file"
                  required
                  onChange={e => setSelectedUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="drive-file-input"
                />
                <label
                  htmlFor="drive-file-input"
                  className="inline-block rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200"
                >
                  Cari Berkas
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedUploadFile}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition"
                >
                  {isUploading ? 'Mengunggah...' : 'Mulai Unggah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation Delete File (Mandatory User Confirmation) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white dark:border-rose-900 dark:bg-slate-900 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Konfirmasi Hapus Berkas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <p className="text-slate-500 text-[11px]">Nama berkas yang akan dihapus:</p>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-2">{showDeleteConfirm.name}</p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Apakah Anda yakin ingin menghapus berkas ini secara permanen dari Google Drive?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteFile}
                disabled={isDeleting}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

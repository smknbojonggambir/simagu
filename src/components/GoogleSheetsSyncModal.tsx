import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, X, ShieldCheck, Key, Code2, LogOut, Info, ArrowRight } from 'lucide-react';
import { googleSignIn, logoutGoogle, initAuth, getAccessToken } from '../lib/firebaseAuth';
import { syncAllToGoogleSheets, syncViaAppsScriptWebApp, DEFAULT_SPREADSHEET_ID } from '../lib/googleSheetsSync';
import { AgendaGuruItem, AgendaKelasItem, GuruItem, SiswaItem, SupervisiRecord, SchoolSetting } from '../types';
import { User } from 'firebase/auth';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendaGuruList: AgendaGuruItem[];
  agendaKelasList: AgendaKelasItem[];
  supervisiList: SupervisiRecord[];
  guruList: GuruItem[];
  siswaList: SiswaItem[];
  setting?: SchoolSetting;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  agendaGuruList,
  agendaKelasList,
  supervisiList,
  guruList,
  siswaList,
  setting
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState<string>(DEFAULT_SPREADSHEET_ID);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState<string>('');
  const [webAppUrl, setWebAppUrl] = useState<string>(
    () => setting?.appsScriptUrl || localStorage.getItem('simagu_sheets_script_url') || 'https://script.google.com/macros/s/AKfycbw4dY5rE7Rcb_53302ZXUUW_3_QnWcyTr86QKNGhMvLD-kBAnNjNdCLmgCkwJXqCUwC/exec'
  );
  const [syncMethod, setSyncMethod] = useState<'oauth' | 'manualToken' | 'webApp'>('oauth');

  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [authErrorNotice, setAuthErrorNotice] = useState<string | null>(null);

  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
    updatedSheets?: string[];
  }>({ type: 'idle', message: '' });

  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, token) => {
        setUser(authUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setSyncStatus({ type: 'idle', message: '' });
    setAuthErrorNotice(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setSyncStatus({
          type: 'success',
          message: `Berhasil terhubung sebagai ${res.user.displayName || res.user.email}`
        });
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || '';
      if (errMsg.includes('auth/internal-error') || errMsg.includes('popup') || errMsg.includes('blocked')) {
        setAuthErrorNotice(
          'Popup Google Sign-In dibatasi oleh browser/iframe preview. Gunakan metode "Access Token Direct" atau "Apps Script Web App" di bawah ini untuk menyingkronkan tanpa kendala.'
        );
        setSyncMethod('manualToken');
      } else {
        setSyncStatus({
          type: 'error',
          message: errMsg || 'Gagal masuk dengan Google. Pastikan izin Google Sheets diberikan.'
        });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setAccessToken(null);
    setSyncStatus({ type: 'idle', message: '' });
  };

  const executeSync = async () => {
    setShowConfirmModal(false);
    setIsSyncing(true);
    setSyncStatus({ type: 'loading', message: 'Memulai proses sinkronisasi ke Google Spreadsheet...' });

    try {
      if (syncMethod === 'webApp') {
        if (!webAppUrl.trim()) {
          throw new Error('Masukkan URL Web App Google Apps Script.');
        }
        const res = await syncViaAppsScriptWebApp(webAppUrl.trim(), {
          agendaGuruList,
          agendaKelasList,
          supervisiList,
          guruList,
          siswaList
        });
        setSyncStatus({
          type: 'success',
          message: res.message,
          updatedSheets: res.updatedSheets
        });
        return;
      }

      // OAuth or Manual Access Token
      let tokenToUse = syncMethod === 'manualToken' ? manualToken.trim() : accessToken;

      if (!tokenToUse && syncMethod === 'oauth') {
        tokenToUse = await getAccessToken();
      }

      if (!tokenToUse) {
        if (syncMethod === 'oauth') {
          const authRes = await googleSignIn();
          if (authRes) {
            tokenToUse = authRes.accessToken;
            setUser(authRes.user);
            setAccessToken(tokenToUse);
          }
        }
      }

      if (!tokenToUse) {
        throw new Error('Access Token Google tidak ditemukan. Silakan login atau tempel Access Token.');
      }

      const result = await syncAllToGoogleSheets({
        spreadsheetId,
        accessToken: tokenToUse,
        agendaGuruList,
        agendaKelasList,
        supervisiList,
        guruList,
        siswaList,
        setting
      });

      setSyncStatus({
        type: 'success',
        message: result.message,
        updatedSheets: result.updatedSheets
      });
    } catch (err: any) {
      console.error('Sync Error:', err);
      setSyncStatus({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat menyingkronkan ke Google Sheets.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <FileSpreadsheet className="h-6 w-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sinkronisasi Google Spreadsheet</h2>
              <p className="text-xs text-emerald-100">SIMAGU SMKN Bojonggambir Live Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Target Spreadsheet Link & ID */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Google Spreadsheet Tujuan:
              </label>
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
              >
                <span>Buka Google Sheet</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <input
              type="text"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value.trim())}
              placeholder="ID Spreadsheet..."
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Sync Method Selection Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Pilih Metode Sinkronisasi:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSyncMethod('oauth')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center justify-center text-center gap-1 ${
                  syncMethod === 'oauth'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[11px]">Google OAuth</span>
              </button>

              <button
                type="button"
                onClick={() => setSyncMethod('manualToken')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center justify-center text-center gap-1 ${
                  syncMethod === 'manualToken'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium'
                }`}
              >
                <Key className="h-4 w-4" />
                <span className="text-[11px]">Access Token Direct</span>
              </button>

              <button
                type="button"
                onClick={() => setSyncMethod('webApp')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col items-center justify-center text-center gap-1 ${
                  syncMethod === 'webApp'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium'
                }`}
              >
                <Code2 className="h-4 w-4" />
                <span className="text-[11px]">Apps Script Web App</span>
              </button>
            </div>
          </div>

          {/* Auth Notice Alert if OAuth blocked */}
          {authErrorNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-xs">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Informasi Pembatasan Browser</p>
                <p className="text-[11px] leading-relaxed">{authErrorNotice}</p>
              </div>
            </div>
          )}

          {/* TAB 1: Google OAuth */}
          {syncMethod === 'oauth' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Status Akun Google
                </span>
                {user && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> Terhubung
                  </span>
                )}
              </div>

              {user ? (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="h-9 w-9 rounded-full ring-2 ring-emerald-500/30" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        {(user.displayName || user.email || 'G')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{user.displayName || 'Pengguna Google'}</p>
                      <p className="text-[11px] text-slate-500">{user.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Keluar
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Login dengan akun Google sekolah Anda untuk mengizinkan aplikasi SIMAGU memperbarui data pada Google Spreadsheet secara langsung.
                  </p>

                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs py-2.5 px-4 rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span>{isSigningIn ? 'Menghubungkan ke Google...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Direct Access Token Input */}
          {syncMethod === 'manualToken' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-emerald-600" />
                  <span>Masukkan Google Access Token:</span>
                </label>
                <a
                  href="https://developers.google.com/oauthplayground/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                >
                  <span>Dapatkan Token di Playground</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <textarea
                rows={3}
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Tempelkan Google OAuth Access Token di sini (ya29.a0...)"
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Gunakan token OAuth sementara dari Google OAuth Playground (Scope: Google Sheets API v4).
              </p>
            </div>
          )}

          {/* TAB 3: Apps Script Web App URL */}
          {syncMethod === 'webApp' && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-emerald-600" />
                <span>URL Web App Google Apps Script:</span>
              </label>

              <input
                type="text"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500">
                Dipasang via Extensions → Apps Script di Google Sheet Anda. Menyingkronkan data tanpa memerlukan popup login browser.
              </p>
            </div>
          )}

          {/* Item Count Preview */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{agendaGuruList.length}</p>
              <p className="text-[10px] text-slate-500">Agenda Guru</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{agendaKelasList.length}</p>
              <p className="text-[10px] text-slate-500">Agenda Kelas</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">{supervisiList.length}</p>
              <p className="text-[10px] text-slate-500">Supervisi</p>
            </div>
          </div>

          {/* Status Message */}
          {syncStatus.type !== 'idle' && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 ${
              syncStatus.type === 'loading' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300' :
              syncStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' :
              'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
            }`}>
              <div className="flex items-center gap-2 font-semibold">
                {syncStatus.type === 'loading' && <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />}
                {syncStatus.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                {syncStatus.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-600" />}
                <span>{syncStatus.message}</span>
              </div>

              {syncStatus.updatedSheets && syncStatus.updatedSheets.length > 0 && (
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex flex-wrap gap-1">
                  {syncStatus.updatedSheets.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-mono font-bold">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sync Trigger Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={isSyncing || !spreadsheetId}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyingkronkan...' : 'Mulai Sinkronisasi Google Sheets'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Konfirmasi Sinkronisasi Google Sheets
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menyingkronkan seluruh data SIMAGU ke Google Spreadsheet tujuan?
            </p>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
              Data sheet <span className="font-mono font-bold">Ringkasan_SIMAGU, Agenda_Guru, Agenda_Kelas, Supervisi_Guru, Data_Guru, Data_Siswa</span> pada Google Spreadsheet tujuan akan diperbarui dengan data terbaru.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Batal
              </button>

              <button
                onClick={executeSync}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
              >
                Ya, Sinkronkan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

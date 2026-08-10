import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Save, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  HardDrive, 
  Cloud,
  Zap,
  X,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AutoSaveManager, AutoSaveConfig } from '../lib/autoSaveManager';
import { Storage } from '../lib/storage';

interface AutoSaveBadgeProps {
  onManualSaveSuccess?: () => void;
}

interface ToastInfo {
  id: string;
  type: 'success' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

export const AutoSaveBadge: React.FC<AutoSaveBadgeProps> = ({ onManualSaveSuccess }) => {
  const [config, setConfig] = useState<AutoSaveConfig>(() => AutoSaveManager.getConfig());
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('saved');
  const [lastSavedFormatted, setLastSavedFormatted] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [toastInfo, setToastInfo] = useState<ToastInfo | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Format relative time or timestamp
  const updateFormattedTime = useCallback(() => {
    if (!config.lastSavedAt) {
      setLastSavedFormatted('Belum tersimpan');
      return;
    }

    try {
      const date = new Date(config.lastSavedAt);
      const timeStr = date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setLastSavedFormatted(`Tersimpan ${timeStr}`);
    } catch {
      setLastSavedFormatted('Baru saja tersimpan');
    }
  }, [config.lastSavedAt]);

  useEffect(() => {
    updateFormattedTime();
    const interval = setInterval(updateFormattedTime, 10000); // refresh relative label every 10s
    return () => clearInterval(interval);
  }, [updateFormattedTime]);

  // Execute Auto-Save on timer or manual click or auto-trigger
  const executeAutoSave = useCallback(async (isManual: boolean = false) => {
    setSaveState('saving');
    const result = await AutoSaveManager.performSave();

    if (result.success) {
      setSaveState('saved');
      const updatedConfig = AutoSaveManager.getConfig();
      setConfig(updatedConfig);
      
      const timeStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setLastSavedFormatted(`Tersimpan ${timeStr}`);

      // Trigger animated toast notification ONLY if user manually clicks
      if (isManual) {
        setToastInfo({
          id: Date.now().toString(),
          type: 'success',
          title: 'Sinkronisasi Manual Berhasil',
          message: `Semua entri data aman di Penyimpanan Lokal & Cloud.`,
          timestamp: timeStr,
        });

        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setToastInfo(null), 3000);
      }

      if (isManual && onManualSaveSuccess) onManualSaveSuccess();
    } else {
      setSaveState('error');
      setToastInfo({
        id: Date.now().toString(),
        type: 'error',
        title: 'Gagal Menyimpan Data',
        message: result.error || 'Terjadi kesalahan saat menyimpan data.',
        timestamp: new Date().toLocaleTimeString('id-ID'),
      });

      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setToastInfo(null), 4500);
    }
  }, [onManualSaveSuccess]);

  // Interval timer for Periodic Auto-Save
  useEffect(() => {
    if (!config.enabled || config.intervalSeconds <= 0) return;

    const intervalMs = config.intervalSeconds * 1000;
    const timer = setInterval(() => {
      executeAutoSave(false);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [config.enabled, config.intervalSeconds, executeAutoSave]);

  // Listen for data change events (teacher inputs, agenda changes) to trigger debounced auto-save & cloud sync
  useEffect(() => {
    const handleDataChanged = () => {
      AutoSaveManager.triggerDebouncedSave(1500);
    };

    window.addEventListener('simagu_data_changed', handleDataChanged);
    return () => window.removeEventListener('simagu_data_changed', handleDataChanged);
  }, []);

  // Handle BeforeUnload to force auto-save before closing browser/tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      AutoSaveManager.performSave();
      // Unsaved changes safety message
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const handleToggleAutoSave = (enabled: boolean) => {
    const updated = AutoSaveManager.saveConfig({ enabled });
    setConfig(updated);
    Storage.logAudit('TOGGLE_AUTOSAVE', `Auto-save ${enabled ? 'Diaktifkan' : 'Dinonaktifkan'}`);
  };

  const handleChangeInterval = (intervalSeconds: number) => {
    const updated = AutoSaveManager.saveConfig({ intervalSeconds });
    setConfig(updated);
    Storage.logAudit('CHANGE_AUTOSAVE_INTERVAL', `Mengubah interval auto-save ke ${intervalSeconds} detik`);
  };

  const handleToggleCloudSync = (syncToCloud: boolean) => {
    const updated = AutoSaveManager.saveConfig({ syncToCloud });
    setConfig(updated);
    Storage.logAudit('TOGGLE_CLOUD_SYNC', `SINKRONISASI CLOUD ${syncToCloud ? 'Diaktifkan' : 'Dinonaktifkan'}`);
  };

  return (
    <div className="relative inline-block">
      {/* Auto-Save Badge Control Button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer shadow-2xs ${
          saveState === 'saving'
            ? 'border-amber-400/60 bg-amber-500/10 text-amber-600 dark:text-amber-300'
            : saveState === 'error'
            ? 'border-rose-400/60 bg-rose-500/10 text-rose-600 dark:text-rose-300'
            : config.enabled
            ? 'border-teal-300 dark:border-teal-800 bg-teal-50/80 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60'
            : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500'
        }`}
        title="Status Auto-Save & Sinkronisasi Sistem"
      >
        {saveState === 'saving' ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
            <span className="hidden sm:inline">Menyimpan...</span>
          </>
        ) : saveState === 'error' ? (
          <>
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            <span className="hidden sm:inline">Gagal Simpan</span>
          </>
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-teal-500"></span>
              </span>
            </div>
            <span className="hidden md:inline">{lastSavedFormatted || 'Auto-Save'}</span>
            <span className="inline md:hidden">Auto-Save</span>
          </>
        )}
      </motion.button>

      {/* Animated Floating Toast Notification */}
      <AnimatePresence>
        {toastInfo && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(2px)' }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white p-3.5 pr-4 text-xs font-medium shadow-2xl border border-teal-500/40 backdrop-blur-xl overflow-hidden max-w-sm"
          >
            {/* Animated Icon Badge */}
            <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
              toastInfo.type === 'success' 
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30 ring-2 ring-teal-500/20' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {toastInfo.type === 'success' ? (
                <motion.div
                  initial={{ scale: 0.5, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                >
                  <ShieldCheck className="h-5 w-5 text-teal-400" />
                </motion.div>
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                  {toastInfo.title}
                  <span className="text-[10px] font-medium text-teal-300 bg-teal-500/20 px-1.5 py-0.2 rounded-full border border-teal-500/30">
                    Aman
                  </span>
                </h5>
                <span className="text-[10px] text-slate-400 font-mono">{toastInfo.timestamp}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
                {toastInfo.message}
              </p>
            </div>

            <button
              onClick={() => setToastInfo(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0 cursor-pointer hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Animated Bottom Progress Bar */}
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: toastInfo.type === 'success' ? 3.5 : 4.5, ease: 'linear' }}
              className={`absolute bottom-0 left-0 h-0.5 ${
                toastInfo.type === 'success' ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-rose-500'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auto-Save Control Popover Modal */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xl z-50"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Auto-Save & Sinkronisasi
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Proteksi data berkala tanpa takut hilang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDropdown(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status Display Card */}
            <div className="rounded-xl border border-teal-500/20 bg-teal-50/50 dark:bg-teal-950/30 p-3 mb-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Penyimpanan Lokal:</span>
                </span>
                <span className="text-teal-700 dark:text-teal-300 font-bold">Aktif & Aman</span>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cloud Sync (GAS):</span>
                </span>
                <span className={`text-[11px] font-bold ${config.syncToCloud ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {config.syncToCloud ? 'Terhubung' : 'Nonaktif'}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-teal-500/10">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Waktu Simpan:
                </span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {lastSavedFormatted}
                </span>
              </div>
            </div>

            {/* Quick Action: Save Now Button */}
            <button
              onClick={() => executeAutoSave(true)}
              disabled={saveState === 'saving'}
              className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 transition cursor-pointer mb-3"
            >
              {saveState === 'saving' ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Memproses Sinkronisasi...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan & Sinkron Sekarang</span>
                </>
              )}
            </button>

            {/* Options & Settings Controls */}
            <div className="space-y-2.5 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
              {/* Toggle AutoSave */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Auto-Save Otomatis:
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => handleToggleAutoSave(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              {/* Interval Choice */}
              {config.enabled && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Interval Simpan:
                  </span>
                  <select
                    value={config.intervalSeconds}
                    onChange={(e) => handleChangeInterval(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value={15}>Setiap 15 Detik</option>
                    <option value={30}>Setiap 30 Detik</option>
                    <option value={60}>Setiap 1 Menit</option>
                    <option value={120}>Setiap 2 Menit</option>
                  </select>
                </div>
              )}

              {/* Cloud Sync Toggle */}
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Latar Belakang Cloud Sync:
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.syncToCloud}
                    onChange={(e) => handleToggleCloudSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


import React, { useState } from 'react';
import { UserCheck, QrCode, Search, CheckCircle2, Clock, AlertTriangle, Users, ShieldAlert, Plus, Check, Printer, FileSpreadsheet, BookOpen, GraduationCap, RefreshCw, Trash2, Edit3, Calendar, History, ChevronDown, ChevronUp, X } from 'lucide-react';
import { SiswaItem, KelasItem, User, GuruItem, MapelItem, JadwalItem, AbsensiSiswaRecord } from '../../types';
import { Storage } from '../../lib/storage';
import { RekapAbsensiBulananView } from './RekapAbsensiBulananView';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { toast } from 'sonner';

interface AbsensiViewProps {
  siswaList: SiswaItem[];
  kelasList: KelasItem[];
  guruList?: GuruItem[];
  mapelList?: MapelItem[];
  jadwalList?: JadwalItem[];
  currentUser: User;
  onRefresh: () => void;
}

export const AbsensiView: React.FC<AbsensiViewProps> = ({
  siswaList,
  kelasList,
  guruList = [],
  mapelList = [],
  jadwalList = [],
  currentUser,
  onRefresh
}) => {
  const safeKelasList = kelasList || [];
  const safeSiswaList = siswaList || [];

  const [activeSubTab, setActiveSubTab] = useState<'harian' | 'riwayat' | 'rekap_bulanan'>('harian');
  const [selectedKelas, setSelectedKelas] = useState(safeKelasList[0]?.namaKelas || 'X DKV 1');
  const [selectedMapel, setSelectedMapel] = useState(mapelList[0]?.namaMapel || 'Dasar-Dasar Desain Komunikasi Visual');
  const [selectedGuru, setSelectedGuru] = useState(currentUser?.nama || guruList[0]?.nama || 'Dede Mulyana, S.Kom.');
  const [selectedJamKe, setSelectedJamKe] = useState('1 - 4');

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrScanSuccess, setQrScanSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'session' | 'record';
    id?: string;
    kelas?: string;
    tanggal?: string;
    mapel?: string;
    label: string;
  } | null>(null);

  // History Filter State
  const [historyFilterKelas, setHistoryFilterKelas] = useState<string>('all');
  const [historyFilterTanggal, setHistoryFilterTanggal] = useState<string>('');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [expandedSessionKey, setExpandedSessionKey] = useState<string | null>(null);

  // Edit Single Record State
  const [editingRecord, setEditingRecord] = useState<AbsensiSiswaRecord | null>(null);

  // Student Attendance State
  const filteredSiswa = safeSiswaList.filter(s => {
    const matchKelas = s.kelas === selectedKelas;
    const matchQuery = !searchQuery || s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery);
    return matchKelas && matchQuery;
  });

  const [attendanceState, setAttendanceState] = useState<Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'>>({});
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize attendanceState from stored records for today when selectedKelas, selectedMapel, or selectedGuru changes
  React.useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const storedAbsensi = Storage.getAbsensiSiswa();
    
    // Match records for class, date, and mapel/guru
    const classRecords = storedAbsensi.filter(a => 
      a.kelas === selectedKelas && 
      a.tanggal === today && 
      (!selectedMapel || !a.mapel || a.mapel.toLowerCase() === selectedMapel.toLowerCase())
    );

    if (classRecords.length > 0) {
      const stateMap: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'> = {};
      classRecords.forEach(r => {
        if (r.id_siswa) {
          stateMap[r.id_siswa] = r.status;
        } else {
          const matchedSiswa = safeSiswaList.find(s => s.nis === r.nis && s.kelas === selectedKelas);
          if (matchedSiswa) {
            stateMap[matchedSiswa.id] = r.status;
          }
        }
      });
      setAttendanceState(stateMap);
    } else {
      setAttendanceState({});
    }
  }, [selectedKelas, selectedMapel, selectedGuru, safeSiswaList]);

  const handleSetStatus = (siswaId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat') => {
    setAttendanceState(prev => ({ ...prev, [siswaId]: status }));
  };

  const handleSetAllStatus = (status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat') => {
    const updatedState: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'> = { ...attendanceState };
    filteredSiswa.forEach(s => {
      updatedState[s.id] = status;
    });
    setAttendanceState(updatedState);
  };

  const handleSimpanAbsensiSiswa = async () => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const allSiswaInClass = safeSiswaList.filter(s => s.kelas === selectedKelas);
      const existingAll = Storage.getAbsensiSiswa();
      
      // Remove existing records for this class, date & mapel
      const otherRecords = existingAll.filter(r => !(
        r.kelas === selectedKelas && 
        r.tanggal === today && 
        (!r.mapel || r.mapel.toLowerCase() === selectedMapel.toLowerCase())
      ));

      // Create new records for all students in class
      const newRecords = allSiswaInClass.map(s => {
        const status = attendanceState[s.id] || 'Hadir';
        return {
          id: `abs-sis-${s.id}-${today}-${selectedMapel.replace(/[^a-zA-Z0-9]/g, '_')}`,
          tanggal: today,
          kelas: selectedKelas,
          nis: s.nis,
          namaSiswa: s.nama,
          status: status,
          dicatatOleh: currentUser.nama,
          mapel: selectedMapel,
          guru: selectedGuru,
          jamKe: selectedJamKe,
          id_siswa: s.id,
          id_kelas: selectedKelas
        };
      });

      const updatedAbsensiList = [...otherRecords, ...newRecords];
      Storage.saveAbsensiSiswa(updatedAbsensiList);

      Storage.logAudit('SAVE_ABSENSI_SISWA', `Menyimpan presensi siswa ${selectedMapel} kelas ${selectedKelas} (${allSiswaInClass.length} data)`);
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulasikanQrScan = () => {
    setQrScanSuccess(true);
    setTimeout(() => {
      setQrScanSuccess(false);
      setShowQrModal(false);
      if (filteredSiswa.length > 0) {
        setAttendanceState(prev => ({ ...prev, [filteredSiswa[0].id]: 'Hadir' }));
      }
    }, 1200);
  };

  const today = new Date().toISOString().slice(0, 10);
  const storedTodayRecords = Storage.getAbsensiSiswa().filter(a => 
    a.kelas === selectedKelas && 
    a.tanggal === today && 
    (!selectedMapel || !a.mapel || a.mapel.toLowerCase() === selectedMapel.toLowerCase())
  );
  const hasSavedToday = storedTodayRecords.length > 0;

  // Handle Confirm Delete Modal
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'session') {
      Storage.deleteAbsensiSession(deleteTarget.kelas || selectedKelas, deleteTarget.tanggal || today, deleteTarget.mapel);
      toast.success(`Sesi presensi ${deleteTarget.label} berhasil dihapus!`);
      if (deleteTarget.kelas === selectedKelas && deleteTarget.tanggal === today) {
        setAttendanceState({});
      }
    } else if (deleteTarget.type === 'record' && deleteTarget.id) {
      Storage.deleteAbsensiRecord(deleteTarget.id);
      toast.success(`Data kehadiran siswa berhasil dihapus!`);
    }
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    onRefresh();
  };

  // Group all stored student attendance records by session (tanggal + kelas + mapel)
  const allStoredAbsensi = Storage.getAbsensiSiswa();
  const historySessions = React.useMemo(() => {
    const map = new Map<string, {
      key: string;
      tanggal: string;
      kelas: string;
      mapel: string;
      guru: string;
      dicatatOleh: string;
      records: AbsensiSiswaRecord[];
      hadir: number;
      sakit: number;
      izin: number;
      alpa: number;
      terlambat: number;
    }>();

    allStoredAbsensi.forEach(rec => {
      const key = `${rec.tanggal}__${rec.kelas}__${rec.mapel || 'Umum'}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          tanggal: rec.tanggal,
          kelas: rec.kelas,
          mapel: rec.mapel || 'Umum',
          guru: rec.guru || rec.dicatatOleh || 'Guru Pengampu',
          dicatatOleh: rec.dicatatOleh || 'Guru',
          records: [],
          hadir: 0,
          sakit: 0,
          izin: 0,
          alpa: 0,
          terlambat: 0
        });
      }
      const session = map.get(key)!;
      session.records.push(rec);
      if (rec.status === 'Hadir') session.hadir++;
      else if (rec.status === 'Sakit') session.sakit++;
      else if (rec.status === 'Izin') session.izin++;
      else if (rec.status === 'Alpa') session.alpa++;
      else if (rec.status === 'Terlambat') session.terlambat++;
    });

    return Array.from(map.values()).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [allStoredAbsensi]);

  const filteredHistorySessions = React.useMemo(() => {
    return historySessions.filter(s => {
      const matchKelas = historyFilterKelas === 'all' || s.kelas === historyFilterKelas;
      const matchTanggal = !historyFilterTanggal || s.tanggal === historyFilterTanggal;
      const matchSearch = !historySearchQuery || 
        s.kelas.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
        s.mapel.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        s.guru.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        s.records.some(r => r.namaSiswa.toLowerCase().includes(historySearchQuery.toLowerCase()) || r.nis.includes(historySearchQuery));
      return matchKelas && matchTanggal && matchSearch;
    });
  }, [historySessions, historyFilterKelas, historyFilterTanggal, historySearchQuery]);

  const handleUpdateStudentStatusInSession = (record: AbsensiSiswaRecord, newStatus: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat') => {
    const updated = { ...record, status: newStatus };
    Storage.updateAbsensiRecord(updated);
    toast.success(`Status ${record.namaSiswa} diperbarui ke ${newStatus}`);
    onRefresh();
  };

  // Summary counts
  const totalStudentsInClass = filteredSiswa.length;
  const hadirCount = filteredSiswa.filter(s => (attendanceState[s.id] || 'Hadir') === 'Hadir').length;
  const sakitCount = filteredSiswa.filter(s => attendanceState[s.id] === 'Sakit').length;
  const izinCount = filteredSiswa.filter(s => attendanceState[s.id] === 'Izin').length;
  const alpaCount = filteredSiswa.filter(s => attendanceState[s.id] === 'Alpa').length;
  const terlambatCount = filteredSiswa.filter(s => attendanceState[s.id] === 'Terlambat').length;

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('harian')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'harian'
              ? 'bg-[#163A5F] text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Presensi Real-time Harian</span>
        </button>

        <button
          onClick={() => setActiveSubTab('riwayat')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'riwayat'
              ? 'bg-[#163A5F] text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
          }`}
        >
          <History className="h-4 w-4 text-emerald-500" />
          <span>Riwayat & Kelola Presensi</span>
          <span className="px-2 py-0.5 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold rounded-full">
            {historySessions.length} Sesi
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('rekap_bulanan')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'rekap_bulanan'
              ? 'bg-[#163A5F] text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
          }`}
        >
          <Printer className="h-4 w-4 text-[#2563EB]" />
          <span>Cetak Rekap Absensi Bulanan (Per Siswa)</span>
          <span className="px-2 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-blue-300 font-extrabold rounded-full">
            Fitur Baru
          </span>
        </button>
      </div>

      {/* Subtab Navigation Switcher */}
      {activeSubTab === 'rekap_bulanan' ? (
        <RekapAbsensiBulananView
          siswaList={safeSiswaList}
          kelasList={safeKelasList}
          guruList={guruList}
          mapelList={mapelList}
          currentUser={currentUser}
        />
      ) : activeSubTab === 'riwayat' ? (
        /* Riwayat & Kelola Presensi Siswa View */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-[#163A5F] p-6 text-white shadow-md border border-slate-700/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-blue-200 border border-white/10 backdrop-blur-md">
                  Riwayat Presensi Siswa
                </span>
                <span className="text-xs text-blue-200">Manajemen & Edit Kehadiran Terpusat</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <History className="h-7 w-7 text-emerald-400" />
                Riwayat & Kelola Presensi Siswa
              </h1>
              <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
                Kelola seluruh arsip presensi terdahulu, ubah status kehadiran siswa individual, atau hapus sesi presensi yang salah secara aman.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('harian')}
              className="flex items-center gap-2 rounded-xl bg-white text-[#163A5F] px-4 py-2.5 text-xs font-bold shadow-md hover:bg-blue-50 transition cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4 text-[#2563EB]" />
              Catat Presensi Baru
            </button>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Filter Rombel / Kelas</label>
              <select
                value={historyFilterKelas}
                onChange={e => setHistoryFilterKelas(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="all">Semua Rombel / Kelas</option>
                {safeKelasList.map(k => (
                  <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Filter Tanggal</label>
              <input
                type="date"
                value={historyFilterTanggal}
                onChange={e => setHistoryFilterTanggal(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Pencarian Cepat</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari siswa, mapel, atau guru..."
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>

          {/* Sessions List */}
          {filteredHistorySessions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-400 space-y-3">
              <History className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Tidak ada arsip presensi yang sesuai dengan filter.</p>
              <button
                onClick={() => { setHistoryFilterKelas('all'); setHistoryFilterTanggal(''); setHistorySearchQuery(''); }}
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistorySessions.map(session => {
                const isExpanded = expandedSessionKey === session.key;
                return (
                  <div key={session.key} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition">
                    {/* Session Header Card */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 font-bold text-sm text-[#163A5F] dark:text-white">
                            <Calendar className="h-4 w-4 text-[#2563EB]" />
                            {session.tanggal}
                          </span>
                          <span className="rounded-md bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-bold text-[#2563EB] dark:text-blue-300">
                            {session.kelas}
                          </span>
                          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            {session.mapel}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Guru: <strong className="text-slate-700 dark:text-slate-300">{session.guru}</strong> • Dicatat oleh: {session.dicatatOleh}
                        </p>
                        {/* Status Pills */}
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Hadir: {session.hadir}
                          </span>
                          {session.sakit > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Sakit: {session.sakit}
                            </span>
                          )}
                          {session.izin > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Izin: {session.izin}
                            </span>
                          )}
                          {session.alpa > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Alpa: {session.alpa}
                            </span>
                          )}
                          {session.terlambat > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                              Terlambat: {session.terlambat}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 ml-1">
                            Total: {session.records.length} Siswa
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setExpandedSessionKey(isExpanded ? null : session.key)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-[#163A5F] dark:text-slate-200 hover:bg-slate-100 transition cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <span>{isExpanded ? 'Tutup Rincian' : `Kelola Siswa (${session.records.length})`}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({
                              type: 'session',
                              kelas: session.kelas,
                              tanggal: session.tanggal,
                              mapel: session.mapel,
                              label: `${session.kelas} - ${session.mapel} (${session.tanggal})`
                            });
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                          title="Hapus Sesi Presensi Ini"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Students Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto bg-slate-50/50 dark:bg-slate-800/30 p-4 border-t border-slate-100 dark:border-slate-800">
                        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold">
                              <th className="py-2 px-3 w-10 text-center">No</th>
                              <th className="py-2 px-3 w-28">NIS</th>
                              <th className="py-2 px-3">Nama Siswa</th>
                              <th className="py-2 px-3 text-center w-80">Ubah Status Kehadiran</th>
                              <th className="py-2 px-3 text-center w-20">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {session.records.map((rec, rIdx) => (
                              <tr key={rec.id} className="hover:bg-white dark:hover:bg-slate-800/60 transition">
                                <td className="py-2.5 px-3 text-center text-slate-400">{rIdx + 1}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-500">{rec.nis}</td>
                                <td className="py-2.5 px-3 font-semibold text-[#163A5F] dark:text-white">{rec.namaSiswa}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                    {(['Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat'] as const).map(st => (
                                      <button
                                        key={st}
                                        type="button"
                                        onClick={() => handleUpdateStudentStatusInSession(rec, st)}
                                        className={`px-2 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                          rec.status === st
                                            ? st === 'Hadir' ? 'bg-[#16A34A] text-white shadow-xs'
                                            : st === 'Sakit' ? 'bg-[#F59E0B] text-white shadow-xs'
                                            : st === 'Izin' ? 'bg-[#2563EB] text-white shadow-xs'
                                            : st === 'Alpa' ? 'bg-[#DC2626] text-white shadow-xs'
                                            : 'bg-orange-500 text-white shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                      >
                                        {st}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteTarget({
                                        type: 'record',
                                        id: rec.id,
                                        label: `${rec.namaSiswa} (${rec.kelas} - ${rec.status})`
                                      });
                                      setDeleteModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                    title="Hapus data kehadiran siswa ini"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Header Banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-[#163A5F] p-6 text-white shadow-md border border-slate-700/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-blue-200 border border-white/10 backdrop-blur-md">
                  Modul Presensi Siswa SIMAGU
                </span>
                <span className="text-xs text-blue-200">Kurikulum Merdeka SMKN Bojonggambir</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <UserCheck className="h-7 w-7 text-blue-300" />
                Presensi & Kehadiran Siswa Real-time
              </h1>
              <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
                Pencatatan kehadiran harian siswa per Rombel/Kelas terintegrasi langsung dengan Laporan Wali Kelas dan Rekapitulasi Pembelajaran Guru.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white shadow-sm backdrop-blur-md transition active:scale-95 cursor-pointer"
              >
                <QrCode className="h-4 w-4 text-blue-300" />
                <span>Scan Kartu QR Siswa</span>
              </button>
            </div>
          </div>

      {/* Success Notification */}
      {isSavedSuccess && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-[#16A34A] dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
          <p className="text-xs font-medium">
            Presensi siswa kelas {selectedKelas} berhasil disimpan dan disinkronkan ke SIMAGU & Laporan Kehadiran!
          </p>
        </div>
      )}

      {/* Class Statistics Summary Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Hadir</p>
          <p className="mt-1 text-xl font-bold text-[#16A34A]">{hadirCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Sakit</p>
          <p className="mt-1 text-xl font-bold text-[#F59E0B]">{sakitCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Izin</p>
          <p className="mt-1 text-xl font-bold text-[#2563EB]">{izinCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Alpa / Tanpa Ket.</p>
          <p className="mt-1 text-xl font-bold text-[#DC2626]">{alpaCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Terlambat</p>
          <p className="mt-1 text-xl font-bold text-orange-600">{terlambatCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>
      </div>

      {/* Control Bar: Class, Mapel, Guru selector, quick actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users className="h-3 w-3 text-[#2563EB]" />
              Pilih Rombel / Kelas
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {safeKelasList.map(k => (
                <option key={k.id} value={k.namaKelas}>{k.namaKelas} ({k.jurusan})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-[#2563EB]" />
              Pilih Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {mapelList.length > 0 ? (
                mapelList.map(m => (
                  <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                ))
              ) : (
                <>
                  <option value="Pemrograman Web & Perangkat Bergerak">Pemrograman Web & Perangkat Bergerak</option>
                  <option value="Pemrograman Berbasis Teks, Grafis & Multimedia">Pemrograman Berbasis Teks, Grafis & Multimedia</option>
                  <option value="Basis Data & Cloud Infrastructure">Basis Data & Cloud Infrastructure</option>
                  <option value="Matematika Kejuruan">Matematika Kejuruan</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Bahasa Inggris Kejuruan">Bahasa Inggris Kejuruan</option>
                  <option value="Project Kreatif & Kewirausahaan (PKK)">Project Kreatif & Kewirausahaan (PKK)</option>
                  <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  <option value="IPAS & K3LH">IPAS & K3LH</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-[#2563EB]" />
              Guru Pengampu Mapel
            </label>
            <select
              value={selectedGuru}
              onChange={(e) => setSelectedGuru(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {guruList.length > 0 ? (
                guruList.map(g => (
                  <option key={g.id} value={g.nama}>{g.nama}</option>
                ))
              ) : (
                <option value={currentUser.nama}>{currentUser.nama}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-[#2563EB]" />
              Jam Ke / Sesi (Isi Manual)
            </label>
            <input
              type="text"
              value={selectedJamKe}
              onChange={(e) => setSelectedJamKe(e.target.value)}
              placeholder="Contoh: 1 - 4 atau 07.15 - 10.15"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleSetAllStatus('Hadir')}
              className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-[11px] font-bold text-[#16A34A] dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
            >
              Set All Hadir
            </button>

            <button
              onClick={handleSimpanAbsensiSiswa}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Presensi {selectedMapel.length > 20 ? selectedMapel.slice(0, 20) + '...' : selectedMapel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Presensi Siswa */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-800/50 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-[#163A5F] dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-[#2563EB]" />
              Daftar Presensi - Kelas {selectedKelas} ({totalStudentsInClass} Siswa)
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5 flex items-center gap-2">
              <span>Mapel: <strong>{selectedMapel}</strong></span>
              <span>•</span>
              <span>Guru: <strong>{selectedGuru}</strong></span>
              <span>•</span>
              <span>Jam Ke: <strong>{selectedJamKe}</strong></span>
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-[#F5F7FA] dark:bg-slate-800/80 text-[#163A5F] dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4">Nama Lengkap Siswa</th>
                <th className="py-3 px-4 w-24">L/P</th>
                <th className="py-3 px-4 w-96 text-center">Opsi Kehadiran (Klik Tombol)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada siswa ditemukan di kelas {selectedKelas}.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((s, idx) => {
                  const currentStatus = attendanceState[s.id] || 'Hadir';
                  return (
                    <tr key={s.id} className="hover:bg-[#EFF6FF]/20 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">{s.nis}</td>
                      <td className="py-3 px-4 font-bold text-[#163A5F] dark:text-white">{s.nama}</td>
                      <td className="py-3 px-4 font-medium text-slate-500">{s.gender}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-[#F5F7FA] dark:bg-slate-800 p-1 rounded-xl">
                          {(['Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat'] as const).map(st => (
                            <button
                              key={st}
                              onClick={() => handleSetStatus(s.id, st)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                currentStatus === st
                                  ? st === 'Hadir' ? 'bg-[#16A34A] text-white shadow-xs'
                                  : st === 'Sakit' ? 'bg-[#F59E0B] text-white shadow-xs'
                                  : st === 'Izin' ? 'bg-[#2563EB] text-white shadow-xs'
                                  : st === 'Alpa' ? 'bg-[#DC2626] text-white shadow-xs'
                                  : 'bg-orange-500 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-800/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Pencatatan dilakukan oleh: <strong className="text-[#163A5F] dark:text-slate-300">{currentUser.nama}</strong> ({currentUser.role})
          </p>
          <div className="flex items-center gap-2">
            {hasSavedToday && (
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget({
                    type: 'session',
                    kelas: selectedKelas,
                    tanggal: today,
                    mapel: selectedMapel,
                    label: `${selectedKelas} - ${selectedMapel} (${today})`
                  });
                  setDeleteModalOpen(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Presensi Hari Ini
              </button>
            )}
            <button
              onClick={handleSimpanAbsensiSiswa}
              className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              {hasSavedToday ? 'Perbarui Presensi Siswa' : 'Simpan Presensi Siswa'}
            </button>
          </div>
        </div>
      </div>

      {/* QR Code Scanner Simulation Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-[#163A5F] dark:text-white uppercase tracking-wider">
              Scanner QR / Barcode Kartu Pelajar
            </h3>

            <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-xl bg-slate-900 border-2 border-dashed border-[#2563EB] overflow-hidden">
              {qrScanSuccess ? (
                <div className="text-emerald-400 font-bold space-y-2 animate-bounce">
                  <CheckCircle2 className="h-12 w-12 mx-auto" />
                  <p className="text-xs">QR Code Siswa Terdeteksi!</p>
                </div>
              ) : (
                <div className="space-y-2 text-slate-400">
                  <QrCode className="h-16 w-16 mx-auto text-blue-400 animate-pulse" />
                  <p className="text-[10px]">Arahkan Kamera ke Barcode Kartu Pelajar</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSimulasikanQrScan}
                className="flex-1 rounded-xl bg-[#2563EB] py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm cursor-pointer"
              >
                Simulasikan Scan Kartu
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-[#EFF6FF] hover:text-[#163A5F] cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={deleteTarget?.type === 'session' ? 'Hapus Seluruh Sesi Presensi' : 'Hapus Catatan Presensi Siswa'}
        message={
          deleteTarget?.type === 'session'
            ? `Apakah Anda yakin ingin menghapus seluruh sesi presensi untuk "${deleteTarget?.label}"? Seluruh data kehadiran siswa pada sesi ini akan dihapus permanen.`
            : `Apakah Anda yakin ingin menghapus data kehadiran untuk "${deleteTarget?.label}"?`
        }
        confirmLabel="Ya, Hapus Data"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};


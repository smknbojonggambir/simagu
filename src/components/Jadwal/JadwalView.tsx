import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User as UserIcon, 
  Search, 
  LayoutGrid, 
  Table as TableIcon, 
  Printer, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  School, 
  BookOpen 
} from 'lucide-react';
import { JadwalItem, KelasItem, GuruItem, MapelItem, User, UserRole } from '../../types';
import { Storage } from '../../lib/storage';
import { roomMap, ptkMap, completeJadwalData } from '../../data/jadwalData';

interface JadwalViewProps {
  jadwalList: JadwalItem[];
  kelasList: KelasItem[];
  guruList?: GuruItem[];
  mapelList?: MapelItem[];
  currentUser?: User | null;
  role?: UserRole;
  onRefresh?: () => void;
}

const HARI_OPTIONS: Array<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'> = [
  'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

const JP_PRESETS = [
  { jp: '1-2', label: 'JP 1 - 2 (2 Jam Pelajaran)' },
  { jp: '3-4', label: 'JP 3 - 4 (2 Jam Pelajaran)' },
  { jp: '1-4', label: 'JP 1 - 4 (4 Jam Pelajaran / Blok)' },
  { jp: '5-6', label: 'JP 5 - 6 (2 Jam Pelajaran)' },
  { jp: '7-8', label: 'JP 7 - 8 (2 Jam Pelajaran)' },
  { jp: '8-9', label: 'JP 8 - 9 (2 Jam Pelajaran)' },
  { jp: '9-10', label: 'JP 9 - 10 (2 Jam Pelajaran)' },
  { jp: '5-8', label: 'JP 5 - 8 (4 Jam Pelajaran / Blok Siang)' },
  { jp: '7-10', label: 'JP 7 - 10 (4 Jam Pelajaran / Blok Sore)' },
  { jp: '1-10', label: 'JP 1 - 10 (Praktik Penuh Kejuruan)' },
  { jp: '1', label: 'JP 1 (1 Jam Pelajaran)' },
  { jp: '2', label: 'JP 2 (1 Jam Pelajaran)' },
  { jp: '3', label: 'JP 3 (1 Jam Pelajaran)' },
  { jp: '4', label: 'JP 4 (1 Jam Pelajaran)' },
  { jp: '5', label: 'JP 5 (1 Jam Pelajaran)' },
  { jp: '6', label: 'JP 6 (1 Jam Pelajaran)' },
  { jp: '7', label: 'JP 7 (1 Jam Pelajaran)' },
  { jp: '8', label: 'JP 8 (1 Jam Pelajaran)' },
  { jp: '9', label: 'JP 9 (1 Jam Pelajaran)' },
  { jp: '10', label: 'JP 10 (1 Jam Pelajaran)' },
];

function getDefaultTimeForJP(hari: string, jp: string): string {
  const isJumat = hari.toLowerCase() === 'jumat';
  
  if (isJumat) {
    switch (jp) {
      case '1-2': return '07.00 - 08.10';
      case '3-4': return '08.10 - 09.20';
      case '1-4': return '07.00 - 09.20';
      case '5-6': return '10.00 - 11.10';
      case '7-8': return '12.40 - 13.50';
      case '9-10': return '13.50 - 15.00';
      case '7-10': return '12.40 - 15.00';
      case '1': return '07.00 - 07.35';
      case '2': return '07.35 - 08.10';
      case '3': return '08.10 - 08.45';
      case '4': return '08.45 - 09.20';
      case '5': return '10.00 - 10.35';
      case '6': return '10.35 - 11.10';
      case '7': return '12.40 - 13.15';
      case '8': return '13.15 - 13.50';
      case '9': return '13.50 - 14.25';
      case '10': return '14.25 - 15.00';
      default: return '07.00 - 08.45';
    }
  } else {
    switch (jp) {
      case '1-2': return '07.00 - 08.20';
      case '3-4': return '08.20 - 09.40';
      case '1-4': return '07.00 - 10.25';
      case '5-6': return '10.25 - 11.45';
      case '7-8': return '11.45 - 13.40';
      case '8-9': return '13.00 - 14.20';
      case '9-10': return '13.40 - 15.00';
      case '5-8': return '10.25 - 13.40';
      case '7-10': return '11.45 - 15.00';
      case '1-10': return '07.00 - 15.00';
      case '1': return '07.00 - 07.40';
      case '2': return '07.40 - 08.20';
      case '3': return '08.20 - 09.00';
      case '4': return '09.45 - 10.25';
      case '5': return '10.25 - 11.05';
      case '6': return '11.05 - 11.45';
      case '7': return '11.45 - 12.25';
      case '8': return '13.00 - 13.40';
      case '9': return '13.40 - 14.20';
      case '10': return '14.20 - 15.00';
      default: return '07.00 - 08.40';
    }
  }
}

function getTeacherCode(teacherName: string): string {
  for (const [code, info] of Object.entries(ptkMap)) {
    if (info.nama.toLowerCase() === teacherName.toLowerCase()) {
      return code;
    }
  }
  return '';
}

export const JadwalView: React.FC<JadwalViewProps> = ({ 
  jadwalList = [], 
  kelasList = [],
  guruList = [],
  mapelList = [],
  currentUser,
  role = 'Administrator',
  onRefresh
}) => {
  const [selectedHari, setSelectedHari] = useState<string>('Senin');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedGuruFilter, setSelectedGuruFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalItem | null>(null);
  const [deletingJadwal, setDeletingJadwal] = useState<JadwalItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<JadwalItem>>({
    hari: 'Senin',
    jp: '1-2',
    waktu: '07.00 - 08.20',
    kelas: kelasList[0]?.namaKelas || 'X APHP',
    mapel: '',
    guru: '',
    kodeGuru: '',
    ruang: 'Bengkel APHP',
    status: 'Aktif'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const safeJadwal = jadwalList || [];

  // Filtered schedule
  const filteredJadwal = useMemo(() => {
    return safeJadwal.filter(j => {
      const matchHari = selectedHari === 'Semua' || j.hari.toLowerCase() === selectedHari.toLowerCase();
      const matchKelas = !selectedKelas || j.kelas === selectedKelas;
      const matchGuru = !selectedGuruFilter || j.guru === selectedGuruFilter;
      const matchStatus = !selectedStatusFilter || j.status === selectedStatusFilter;
      
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        j.guru.toLowerCase().includes(q) ||
        j.mapel.toLowerCase().includes(q) ||
        j.kelas.toLowerCase().includes(q) ||
        (j.kodeGuru && j.kodeGuru.toLowerCase().includes(q)) ||
        j.ruang.toLowerCase().includes(q);

      return matchHari && matchKelas && matchGuru && matchStatus && matchSearch;
    });
  }, [safeJadwal, selectedHari, selectedKelas, selectedGuruFilter, selectedStatusFilter, searchQuery]);

  // Conflict check in form
  const conflicts = useMemo(() => {
    if (!isModalOpen || !formData.hari || !formData.jp) return [];

    return safeJadwal.filter(j => {
      // Exclude current editing item
      if (editingJadwal && j.id === editingJadwal.id) return false;

      const sameDay = j.hari.toLowerCase() === formData.hari?.toLowerCase();
      const sameJP = j.jp === formData.jp;

      if (!sameDay || !sameJP) return false;

      const sameClass = formData.kelas && j.kelas.toLowerCase() === formData.kelas.toLowerCase();
      const sameTeacher = formData.guru && j.guru.toLowerCase() === formData.guru.toLowerCase();

      return sameClass || sameTeacher;
    });
  }, [isModalOpen, formData.hari, formData.jp, formData.kelas, formData.guru, editingJadwal, safeJadwal]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultDay = (selectedHari !== 'Semua' ? selectedHari : 'Senin') as 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
    const defaultKelas = selectedKelas || (kelasList[0]?.namaKelas || 'X APHP');
    const defaultRoom = roomMap[defaultKelas] || 'Ruang Kelas';
    const defaultJP = '1-2';
    const defaultTime = getDefaultTimeForJP(defaultDay, defaultJP);

    setEditingJadwal(null);
    setFormData({
      hari: defaultDay,
      jp: defaultJP,
      waktu: defaultTime,
      kelas: defaultKelas,
      mapel: mapelList[0]?.namaMapel || 'Dasar-Dasar APHP',
      guru: guruList[0]?.nama || 'Iman Rahmat, S.Pd.I.',
      kodeGuru: getTeacherCode(guruList[0]?.nama || ''),
      ruang: defaultRoom,
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: JadwalItem) => {
    setEditingJadwal(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  // Handle Form Change with dynamic auto-completion
  const handleKelasChange = (newKelas: string) => {
    const autoRoom = roomMap[newKelas] || formData.ruang || 'Ruang Kelas';
    setFormData(prev => ({
      ...prev,
      kelas: newKelas,
      ruang: autoRoom
    }));
  };

  const handleHariChange = (newHari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu') => {
    const autoTime = getDefaultTimeForJP(newHari, formData.jp || '1-2');
    setFormData(prev => ({
      ...prev,
      hari: newHari,
      waktu: autoTime
    }));
  };

  const handleJPChange = (newJP: string) => {
    const autoTime = getDefaultTimeForJP(formData.hari || 'Senin', newJP);
    setFormData(prev => ({
      ...prev,
      jp: newJP,
      waktu: autoTime
    }));
  };

  const handleGuruChange = (newGuru: string) => {
    const code = getTeacherCode(newGuru);
    // Find if this guru teaches a default mapel
    const guruItem = guruList.find(g => g.nama === newGuru);
    const suggestedMapel = guruItem?.mapelUtama || (code && ptkMap[code]?.mapel) || formData.mapel;

    setFormData(prev => ({
      ...prev,
      guru: newGuru,
      kodeGuru: code || prev.kodeGuru,
      mapel: suggestedMapel || prev.mapel
    }));
  };

  // Save / Submit Schedule
  const handleSaveJadwal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.kelas || !formData.mapel || !formData.guru || !formData.jp || !formData.hari) {
      alert('Mohon lengkapi semua kolom wajib (Hari, Kelas, Mapel, Guru, dan JP)');
      return;
    }

    if (editingJadwal) {
      // Update existing
      Storage.updateJadwal(editingJadwal.id, {
        hari: formData.hari as any,
        jp: formData.jp || '1-2',
        waktu: formData.waktu || getDefaultTimeForJP(formData.hari || 'Senin', formData.jp || '1-2'),
        kelas: formData.kelas,
        mapel: formData.mapel,
        guru: formData.guru,
        kodeGuru: formData.kodeGuru || '',
        ruang: formData.ruang || roomMap[formData.kelas] || 'Ruang Kelas',
        status: (formData.status || 'Aktif') as any
      });
      showToast(`Jadwal pelajaran ${formData.mapel} (${formData.kelas}) berhasil diperbarui!`);
    } else {
      // Create new
      const newId = `jdw-${formData.hari?.toLowerCase()}-${formData.kelas?.toLowerCase().replace(/\s+/g, '')}-${Date.now()}`;
      const newItem: JadwalItem = {
        id: newId,
        hari: (formData.hari || 'Senin') as any,
        jp: formData.jp || '1-2',
        waktu: formData.waktu || getDefaultTimeForJP(formData.hari || 'Senin', formData.jp || '1-2'),
        kelas: formData.kelas || 'X APHP',
        mapel: formData.mapel || '',
        guru: formData.guru || '',
        kodeGuru: formData.kodeGuru || getTeacherCode(formData.guru || ''),
        ruang: formData.ruang || roomMap[formData.kelas || ''] || 'Ruang Kelas',
        status: (formData.status || 'Aktif') as any
      };
      Storage.addJadwal(newItem);
      showToast(`Jadwal baru ${newItem.mapel} (${newItem.kelas} - ${newItem.hari}) berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
    if (onRefresh) onRefresh();
  };

  // Delete Action
  const handleDeleteConfirm = () => {
    if (!deletingJadwal) return;
    Storage.deleteJadwal(deletingJadwal.id);
    showToast(`Jadwal pelajaran ${deletingJadwal.mapel} (${deletingJadwal.kelas}) berhasil dihapus.`);
    setDeletingJadwal(null);
    if (onRefresh) onRefresh();
  };

  // Reset to Default Schedules
  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin memulihkan seluruh jadwal default SMKN Bojonggambir (200+ jadwal resmi)? Semua perubahan kustom akan diganti dengan data default.')) {
      Storage.saveJadwal(completeJadwalData);
      showToast('Seluruh jadwal pelajaran berhasil dipulihkan ke master default!');
      if (onRefresh) onRefresh();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Summary Metrics
  const totalSchedules = safeJadwal.length;
  const totalClasses = new Set(safeJadwal.map(j => j.kelas)).size;
  const totalTeachers = new Set(safeJadwal.map(j => j.guru)).size;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-xl border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Inline Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-jadwal-schedule, #printable-jadwal-schedule * {
            visibility: visible;
          }
          #printable-jadwal-schedule {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 16px;
            background: white !important;
            color: black !important;
          }
          .print-hidden {
            display: none !important;
          }
          table.print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 12px !important;
          }
          table.print-table th, table.print-table td {
            border: 1px solid #333 !important;
            padding: 6px 8px !important;
            color: black !important;
            font-size: 9pt !important;
          }
          table.print-table th {
            background-color: #f2f2f2 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print-hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Jadwal Pelajaran & Mengajar</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sistem informasi jadwal pelajaran resmi SMKN Bojonggambir (10 Kelas Kejuruan APHP & DKV).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tambah Jadwal Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-600/20 transition cursor-pointer"
            title="Tambah Jadwal Pelajaran Baru"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Jadwal</span>
          </button>

          {/* Reset / Restore Default */}
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Pulihkan Jadwal Default Sekolah"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>

          {/* Cetak Jadwal */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
            title="Cetak Tabel Jadwal Pelajaran"
          >
            <Printer className="h-4 w-4 text-teal-600" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print-hidden">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{totalSchedules}</div>
            <div className="text-[11px] text-slate-500 font-medium">Total Jadwal Pelajaran</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <School className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{totalClasses} Kelas</div>
            <div className="text-[11px] text-slate-500 font-medium">Kelas Terjadwal</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{totalTeachers} Guru</div>
            <div className="text-[11px] text-slate-500 font-medium">Guru Pengampu Aktif</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 dark:text-white">{filteredJadwal.length} Jadwal</div>
            <div className="text-[11px] text-slate-500 font-medium">Sesuai Filter Aktif</div>
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="space-y-3 print-hidden">
        {/* Hari Tabs */}
        <div className="flex overflow-x-auto gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
          {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Semua'].map(h => (
            <button
              key={h}
              onClick={() => setSelectedHari(h)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
                selectedHari === h
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {h === 'Semua' ? 'Semua Hari (Senin - Sabtu)' : `Hari ${h}`}
            </button>
          ))}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari guru / mapel / kode / ruang..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Kelas Dropdown Filter */}
          <div>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="">Semua Kelas</option>
              {kelasList.map(k => (
                <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
              ))}
            </select>
          </div>

          {/* Guru Dropdown Filter */}
          <div>
            <select
              value={selectedGuruFilter}
              onChange={(e) => setSelectedGuruFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="">Semua Guru Pengampu</option>
              {guruList.map(g => (
                <option key={g.id} value={g.nama}>{g.nama}</option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher & Status */}
          <div className="flex items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Pengganti">Pengganti</option>
              <option value="Izin">Izin</option>
              <option value="Kosong">Kosong</option>
            </select>

            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900">
              <button
                onClick={() => setViewMode('card')}
                title="Tampilan Kartu"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'card' 
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel Matrix"
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'table' 
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold' 
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <TableIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Schedule Container & Printable Area */}
      <div id="printable-jadwal-schedule">
        {/* Printable Header */}
        <div className="hidden print:block mb-4 border-b-2 border-black pb-3 text-center">
          <h1 className="text-base font-bold uppercase tracking-wider">SMK NEGERI BOJONGGAMBIR</h1>
          <h2 className="text-sm font-semibold uppercase">Jadwal Pelajaran & Mengajar Guru</h2>
          <p className="text-xs text-slate-700 mt-1">
            Hari: {selectedHari} | Kelas: {selectedKelas || 'Semua Kelas'} | Tahun Pelajaran 2026/2027
          </p>
        </div>

        {/* Card View */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print-hidden">
            {filteredJadwal.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900/50 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tidak ada jadwal pelajaran ditemukan
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Belum ada jadwal yang cocok dengan filter atau hari yang dipilih. Anda dapat menambahkan jadwal baru dengan mengklik tombol di bawah.
                </p>
                <button
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Jadwal Sekarang</span>
                </button>
              </div>
            ) : (
              filteredJadwal.map((j) => (
                <div
                  key={j.id}
                  className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md hover:border-teal-500/50 transition duration-200 flex flex-col justify-between space-y-3 relative"
                >
                  {/* Top Bar */}
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> JP {j.jp}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ({j.waktu})
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {j.kodeGuru && (
                          <span className="px-2 py-0.5 rounded-lg font-mono text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                            Kode {j.kodeGuru}
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {j.kelas}
                        </span>
                      </div>
                    </div>

                    {/* Subject Title */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Hari {j.hari}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                          {j.mapel}
                        </h3>
                      </div>

                      {j.status && j.status !== 'Aktif' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          j.status === 'Pengganti' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                          j.status === 'Izin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {j.status}
                        </span>
                      )}
                    </div>

                    {/* Teacher & Room Details */}
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="flex items-center gap-2 font-medium">
                        <UserIcon className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{j.guru}</span>
                      </p>
                      <p className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span>{j.ruang}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {j.id.slice(0, 14)}...
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(j)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/50 transition cursor-pointer"
                        title="Edit Jadwal"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingJadwal(j)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {/* Table View */}
        <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-xs ${viewMode === 'card' ? 'hidden print:block' : 'block'}`}>
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[750px] print-table">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Hari & JP</th>
                <th className="p-3">Waktu</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Mata Pelajaran</th>
                <th className="p-3 text-center">Kode</th>
                <th className="p-3">Guru Pengampu</th>
                <th className="p-3">Ruang</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center print-hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredJadwal.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ada jadwal pelajaran ditemukan.
                  </td>
                </tr>
              ) : (
                filteredJadwal.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 font-bold whitespace-nowrap">
                      <span className="text-teal-600 dark:text-teal-400">Hari {j.hari}</span>
                      <div className="text-[11px] font-mono text-slate-500">JP {j.jp}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {j.waktu}
                    </td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        {j.kelas}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {j.mapel}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                      {j.kodeGuru || '-'}
                    </td>
                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                      {j.guru}
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {j.ruang}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        j.status === 'Aktif' || !j.status ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                        j.status === 'Pengganti' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {j.status || 'Aktif'}
                      </span>
                    </td>
                    <td className="p-3 text-center print-hidden whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(j)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950 transition cursor-pointer"
                          title="Edit Jadwal"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingJadwal(j)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition cursor-pointer"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Jadwal Pelajaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingJadwal ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Masukkan rincian hari, kelas, mata pelajaran, jam pelajaran, dan guru pengampu.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conflict Alert (if any) */}
            {conflicts.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Peringatan Potensi Bentrok Jadwal!</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  Terdapat {conflicts.length} jadwal lain pada Hari {formData.hari} JP {formData.jp}:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono">
                  {conflicts.map(c => (
                    <li key={c.id}>
                      {c.kelas} - {c.mapel} ({c.guru})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveJadwal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Hari */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hari Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.hari}
                    onChange={(e) => handleHariChange(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {HARI_OPTIONS.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Kelas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => handleKelasChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {kelasList.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>

                {/* Jam Pelajaran (JP) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Jam Pelajaran (JP) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.jp}
                    onChange={(e) => handleJPChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    {JP_PRESETS.map(p => (
                      <option key={p.jp} value={p.jp}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Rentang Waktu */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rentang Waktu (Jam)
                  </label>
                  <input
                    type="text"
                    value={formData.waktu || ''}
                    onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                    placeholder="Contoh: 07.00 - 08.20"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                {/* Guru Pengampu */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Guru Pengampu <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.guru}
                    onChange={(e) => handleGuruChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="">Pilih Guru Pengampu</option>
                    {guruList.map(g => (
                      <option key={g.id} value={g.nama}>
                        {g.nama} {g.nip ? `(NIP: ${g.nip})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <div className="space-y-1.5">
                    <select
                      value={formData.mapel}
                      onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    >
                      <option value="">Pilih dari Master Mata Pelajaran</option>
                      {mapelList.map(m => (
                        <option key={m.id} value={m.namaMapel}>
                          {m.namaMapel} ({m.kelompok})
                        </option>
                      ))}
                    </select>
                    {/* Or manual input for custom mapel */}
                    <input
                      type="text"
                      value={formData.mapel || ''}
                      onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                      placeholder="Atau ketik nama mapel kustom..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Kode Guru */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Guru (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.kodeGuru || ''}
                    onChange={(e) => setFormData({ ...formData, kodeGuru: e.target.value })}
                    placeholder="Contoh: 1, 2, 8.a, 16..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Ruang / Lab */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ruang Kelas / Lab / Bengkel
                  </label>
                  <input
                    type="text"
                    value={formData.ruang || ''}
                    onChange={(e) => setFormData({ ...formData, ruang: e.target.value })}
                    placeholder="Contoh: Studio DKV 1, Bengkel APHP..."
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Status Jadwal */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Jadwal
                  </label>
                  <select
                    value={formData.status || 'Aktif'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Aktif">Aktif (Berjalan Normal)</option>
                    <option value="Pengganti">Pengganti (Guru Piket / Guru Pengganti)</option>
                    <option value="Izin">Izin (Guru Sedang Tugas Luar / Sakit)</option>
                    <option value="Kosong">Kosong (Jam Bebas Terjadwal)</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/30 transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{editingJadwal ? 'Simpan Perubahan' : 'Tambahkan ke Jadwal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingJadwal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Hapus Jadwal Pelajaran?
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus jadwal <span className="font-bold text-slate-800 dark:text-slate-200">{deletingJadwal.mapel}</span> untuk kelas <span className="font-bold text-slate-800 dark:text-slate-200">{deletingJadwal.kelas}</span> pada Hari {deletingJadwal.hari} JP {deletingJadwal.jp}?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingJadwal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

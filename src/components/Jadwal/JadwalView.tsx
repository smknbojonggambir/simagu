import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Search, 
  LayoutGrid, 
  Table as TableIcon, 
  Printer, 
  Download, 
  RotateCcw, 
  Layers, 
  Grid3X3,
  CheckCircle2,
  Info,
  Sparkles,
  Plus,
  X,
  Trash2,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { JadwalItem, KelasItem, RawJadwalItem, GuruItem, MapelItem } from '../../types';
import { Storage } from '../../lib/storage';
import { rawJadwal501, ptkMap, roomMap, getRuangForJadwal } from '../../data/jadwalData';
import { initialGuru, initialMapel } from '../../data/mockData';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface JadwalViewProps {
  jadwalList: JadwalItem[];
  kelasList: KelasItem[];
  guruList?: GuruItem[];
  mapelList?: MapelItem[];
  onRefresh?: () => void;
}

export const JadwalView: React.FC<JadwalViewProps> = ({ 
  jadwalList = [], 
  kelasList = [],
  guruList = [],
  mapelList = [],
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'blok' | 'full501' | 'matrix'>('blok');
  const [selectedHari, setSelectedHari] = useState<string>('Senin');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [currentJadwal, setCurrentJadwal] = useState<JadwalItem[]>(jadwalList.length > 0 ? jadwalList : Storage.getJadwal());
  const [rawList, setRawList] = useState<RawJadwalItem[]>(Storage.getRawJadwal() || rawJadwal501);

  // Fallback safe lists to ensure choices ALWAYS appear
  const effectiveGuruList = useMemo(() => {
    if (guruList && guruList.length > 0) return guruList;
    return initialGuru;
  }, [guruList]);

  const effectiveMapelList = useMemo(() => {
    if (mapelList && mapelList.length > 0) return mapelList;
    return initialMapel;
  }, [mapelList]);

  const [showAddModal, setShowAddModal] = useState(false);
  // Helper to parse JP strings like '1-4', '5-8', '1' into array of numbers
  const parseJPRange = (jpStr: string): number[] => {
    if (!jpStr) return [];
    const clean = jpStr.replace(/[^0-9\-]/g, '');
    if (clean.includes('-')) {
      const [start, end] = clean.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        const arr: number[] = [];
        for (let i = start; i <= end; i++) arr.push(i);
        return arr;
      }
    }
    const n = parseInt(clean, 10);
    return isNaN(n) ? [] : [n];
  };

  const hasJPOverlap = (jp1: string, jp2: string): boolean => {
    const r1 = parseJPRange(jp1);
    const r2 = parseJPRange(jp2);
    return r1.some(val => r2.includes(val));
  };

  // State for delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // State for editing a schedule item
  const [editingJadwal, setEditingJadwal] = useState<JadwalItem | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const [newJadwal, setNewJadwal] = useState({
    hari: 'Senin',
    kelas: 'X APHP',
    guru: '',
    kodeGuru: '1',
    mapel: '',
    jp: '1-4',
    waktu: '07.15 - 10.15',
    ruang: 'Bengkel APHP',
    keterangan: 'KBM Reguler'
  });

  const checkConflict = (item: {
    hari: string;
    kelas: string;
    guru: string;
    jp: string;
    ruang?: string;
  }, excludeId?: string): string | null => {
    // 1. Conflict: Teacher already teaching another class at same day & overlapping JP
    const teacherConflict = currentJadwal.find(j =>
      j.id !== excludeId &&
      j.hari.toLowerCase() === item.hari.toLowerCase() &&
      j.guru.trim().toLowerCase() === item.guru.trim().toLowerCase() &&
      hasJPOverlap(j.jp, item.jp)
    );
    if (teacherConflict) {
      return `Konflik Guru: ${item.guru} sudah terjadwal mengajar di kelas ${teacherConflict.kelas} (${teacherConflict.mapel}) pada hari ${item.hari} JP ${teacherConflict.jp}.`;
    }

    // 2. Conflict: Class already has another subject/teacher at same day & overlapping JP
    const classConflict = currentJadwal.find(j =>
      j.id !== excludeId &&
      j.hari.toLowerCase() === item.hari.toLowerCase() &&
      j.kelas === item.kelas &&
      hasJPOverlap(j.jp, item.jp)
    );
    if (classConflict) {
      return `Konflik Kelas: Kelas ${item.kelas} sudah memiliki jadwal ${classConflict.mapel} bersama ${classConflict.guru} pada hari ${item.hari} JP ${classConflict.jp}.`;
    }

    // 3. Conflict: Room already occupied by another class at same day & overlapping JP
    if (item.ruang && item.ruang !== 'Ruang Kelas' && item.ruang !== '-') {
      const roomConflict = currentJadwal.find(j =>
        j.id !== excludeId &&
        j.hari.toLowerCase() === item.hari.toLowerCase() &&
        j.ruang?.toLowerCase() === item.ruang?.toLowerCase() &&
        hasJPOverlap(j.jp, item.jp)
      );
      if (roomConflict) {
        return `Konflik Ruangan: Ruang "${item.ruang}" sudah dipakai oleh kelas ${roomConflict.kelas} (${roomConflict.mapel}) pada hari ${item.hari} JP ${roomConflict.jp}.`;
      }
    }

    return null;
  };

  const handleOpenAddModal = () => {
    const defaultGuru = effectiveGuruList[0]?.nama || 'Iman Rahmat, S.Pd.I.';
    const defaultKode = effectiveGuruList[0]?.kodeGuru || '1';
    const defaultMapel = effectiveGuruList[0]?.mapelUtama 
      ? effectiveGuruList[0].mapelUtama.split(',')[0].trim() 
      : (effectiveMapelList[0]?.namaMapel || 'Pendidikan Agama dan Budi Pekerti');
    const defaultKelas = selectedKelas || 'X APHP';
    const defaultRuang = roomMap[defaultKelas] || 'Bengkel APHP';

    setNewJadwal({
      hari: selectedHari === 'Semua' ? 'Senin' : selectedHari,
      kelas: defaultKelas,
      guru: defaultGuru,
      kodeGuru: defaultKode,
      mapel: defaultMapel,
      jp: '1-4',
      waktu: '07.15 - 10.15',
      ruang: defaultRuang,
      keterangan: 'KBM Reguler'
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: JadwalItem) => {
    setEditingJadwal({ ...item });
    setShowEditModal(true);
  };

  const handleSaveNewJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJadwal.guru) {
      toast.error('Silakan pilih Guru Pengampu!');
      return;
    }
    if (!newJadwal.mapel) {
      toast.error('Silakan pilih Mata Pelajaran!');
      return;
    }
    if (!newJadwal.kelas) {
      toast.error('Silakan pilih Kelas!');
      return;
    }
    if (!newJadwal.jp) {
      toast.error('Silakan tentukan alokasi JP!');
      return;
    }

    // Run conflict detection
    const conflictMsg = checkConflict({
      hari: newJadwal.hari,
      kelas: newJadwal.kelas,
      guru: newJadwal.guru,
      jp: newJadwal.jp,
      ruang: newJadwal.ruang
    });
    if (conflictMsg) {
      toast.error(conflictMsg, { duration: 5000 });
      return;
    }

    const newItem: JadwalItem = {
      id: 'jdw-' + Date.now(),
      hari: newJadwal.hari as JadwalItem['hari'],
      jp: newJadwal.jp || '1-4',
      waktu: newJadwal.waktu || '07.15 - 10.15',
      kelas: newJadwal.kelas,
      mapel: newJadwal.mapel,
      guru: newJadwal.guru,
      kodeGuru: newJadwal.kodeGuru || '',
      ruang: newJadwal.ruang || roomMap[newJadwal.kelas] || 'Ruang Kelas',
      status: 'Aktif',
      keterangan: newJadwal.keterangan || 'KBM Reguler'
    };

    const updatedList = [newItem, ...currentJadwal];
    setCurrentJadwal(updatedList);
    Storage.saveJadwal(updatedList);
    onRefresh?.();
    setShowAddModal(false);
    toast.success(`Jadwal Mengajar ${newItem.kelas} - ${newItem.mapel} berhasil ditambahkan!`);
  };

  const handleSaveEditJadwal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJadwal) return;
    if (!editingJadwal.guru) {
      toast.error('Silakan pilih Guru Pengampu!');
      return;
    }
    if (!editingJadwal.mapel) {
      toast.error('Silakan pilih Mata Pelajaran!');
      return;
    }
    if (!editingJadwal.kelas) {
      toast.error('Silakan pilih Kelas!');
      return;
    }
    if (!editingJadwal.jp) {
      toast.error('Silakan tentukan alokasi JP!');
      return;
    }

    // Run conflict detection (excluding current editing item)
    const conflictMsg = checkConflict({
      hari: editingJadwal.hari,
      kelas: editingJadwal.kelas,
      guru: editingJadwal.guru,
      jp: editingJadwal.jp,
      ruang: editingJadwal.ruang
    }, editingJadwal.id);

    if (conflictMsg) {
      toast.error(conflictMsg, { duration: 5000 });
      return;
    }

    const updatedList = currentJadwal.map(j => j.id === editingJadwal.id ? editingJadwal : j);
    setCurrentJadwal(updatedList);
    Storage.saveJadwal(updatedList);
    onRefresh?.();
    setShowEditModal(false);
    setEditingJadwal(null);
    toast.success(`Jadwal Mengajar ${editingJadwal.kelas} - ${editingJadwal.mapel} berhasil diperbarui!`);
  };

  const confirmDeleteJadwal = () => {
    if (!deleteTarget) return;
    const updated = currentJadwal.filter(j => j.id !== deleteTarget.id);
    setCurrentJadwal(updated);
    Storage.saveJadwal(updated);
    onRefresh?.();
    toast.success(`Jadwal "${deleteTarget.name}" berhasil dihapus`);
    setDeleteTarget(null);
  };

  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  const allClasses = [
    'X APHP', 'X DKV 1', 'X DKV 2',
    'XI APHP', 'XI DKV 1', 'XI DKV 2',
    'XII APHP', 'XII DKV 1', 'XII DKV 2', 'XII DKV 3'
  ];

  // Filtered block sessions (142 blocks)
  const filteredBlokJadwal = useMemo(() => {
    return currentJadwal.filter(j => {
      const matchHari = selectedHari === 'Semua' ? true : j.hari.toLowerCase() === selectedHari.toLowerCase();
      const matchKelas = selectedKelas ? j.kelas === selectedKelas : true;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        j.guru.toLowerCase().includes(q) ||
        j.mapel.toLowerCase().includes(q) ||
        j.kelas.toLowerCase().includes(q) ||
        (j.kodeGuru && j.kodeGuru.toLowerCase().includes(q)) ||
        (j.ruang && j.ruang.toLowerCase().includes(q)) ||
        (j.keterangan && j.keterangan.toLowerCase().includes(q));

      return matchHari && matchKelas && matchSearch;
    });
  }, [currentJadwal, selectedHari, selectedKelas, searchQuery]);

  // Filtered full 501 items
  const filteredRawJadwal = useMemo(() => {
    return rawList.filter(item => {
      const matchHari = selectedHari === 'Semua' ? true : item.hari.toLowerCase() === selectedHari.toLowerCase();
      const matchKelas = selectedKelas ? (item.kelas === selectedKelas || item.kelas.includes('Seluruh Kelas')) : true;
      const q = searchQuery.toLowerCase();
      const room = (item.ruang || getRuangForJadwal(item.kelas, item.mapel, item.jamKe)).toLowerCase();
      const matchSearch = !q ||
        item.namaGuru.toLowerCase().includes(q) ||
        item.mapel.toLowerCase().includes(q) ||
        item.kelas.toLowerCase().includes(q) ||
        item.kodeGuru.toLowerCase().includes(q) ||
        room.includes(q) ||
        item.keterangan.toLowerCase().includes(q);

      return matchHari && matchKelas && matchSearch;
    });
  }, [rawList, selectedHari, selectedKelas, searchQuery]);

  const handleResetToOfficial = () => {
    const res = Storage.syncAllMasterAndJadwal();
    setCurrentJadwal(res.jadwal);
    setRawList(res.rawJadwal);
    onRefresh?.();
    toast.success('Data Master (Guru, Mapel, Kelas, Ruang) dan 501 Jadwal Pelajaran resmi berhasil disinkronkan!');
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'full501') {
      csvContent += "No,Hari,Jam Ke,Jam Mulai,Jam Selesai,Kelas,Mata Pelajaran,Kode Guru,Nama Guru,Ruang,Keterangan\n";
      filteredRawJadwal.forEach(item => {
        const r = item.ruang || getRuangForJadwal(item.kelas, item.mapel, item.jamKe);
        csvContent += `"${item.no}","${item.hari}","${item.jamKe}","${item.jamMulai}","${item.jamSelesai}","${item.kelas}","${item.mapel.replace(/"/g, '""')}","${item.kodeGuru}","${item.namaGuru.replace(/"/g, '""')}","${r.replace(/"/g, '""')}","${item.keterangan.replace(/"/g, '""')}"\n`;
      });
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `jadwal_resmi_501_smkn_bojonggambir_${selectedHari}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Data 501 jadwal resmi (termasuk ruang) berhasil diekspor ke CSV!');
    } else {
      csvContent += "Hari,JP,Waktu,Kelas,Mata Pelajaran,Kode Guru,Guru Pengampu,Ruang,Status,Keterangan\n";
      filteredBlokJadwal.forEach(item => {
        csvContent += `"${item.hari}","${item.jp}","${item.waktu}","${item.kelas}","${item.mapel.replace(/"/g, '""')}","${item.kodeGuru || ''}","${item.guru.replace(/"/g, '""')}","${item.ruang}","${item.status}","${(item.keterangan || '').replace(/"/g, '""')}"\n`;
      });
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `jadwal_blok_kbm_smkn_bojonggambir_${selectedHari}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Data blok jadwal berhasil diekspor ke CSV!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Matrix periods configuration
  const matrixSlots = useMemo(() => {
    const isJumat = selectedHari === 'Jumat';
    return [
      { type: 'routine', label: 'Pra-KBM', waktu: '06.30 - 07.00', key: 'Pra-KBM' },
      { type: 'kbm', jp: '1', waktu: '07.00 - 07.40', key: '1' },
      { type: 'kbm', jp: '2', waktu: '07.40 - 08.20', key: '2' },
      { type: 'kbm', jp: '3', waktu: isJumat ? '08.20 - 09.20' : '08.20 - 09.00', key: '3' },
      { type: 'routine', label: 'Istirahat 1 - MBG', waktu: isJumat ? '09.20 - 10.00' : '09.00 - 09.45', key: 'Istirahat 1' },
      { type: 'kbm', jp: '4', waktu: isJumat ? '10.00 - 10.35' : '09.45 - 10.25', key: '4' },
      { type: 'kbm', jp: '5', waktu: isJumat ? '10.35 - 11.10' : '10.25 - 11.05', key: '5' },
      { type: 'routine', label: isJumat ? 'Istirahat 2 - Shalat Jumat' : 'Istirahat 2 - Shalat Dzuhur', waktu: isJumat ? '11.10 - 12.40' : '12.25 - 13.00', key: 'Istirahat 2' },
      { type: 'kbm', jp: '6', waktu: isJumat ? '12.40 - 13.15' : '11.05 - 11.45', key: '6' },
      { type: 'kbm', jp: '7', waktu: isJumat ? '13.15 - 13.50' : '11.45 - 12.25', key: '7' },
      { type: 'kbm', jp: '8', waktu: isJumat ? '13.50 - 14.25' : '13.00 - 13.40', key: '8' },
      { type: 'kbm', jp: '9', waktu: isJumat ? '14.25 - 15.00' : '13.40 - 14.20', key: '9' },
      { type: 'kbm', jp: '10', waktu: isJumat ? '14.25 - 15.00' : '14.20 - 15.00', key: '10' },
    ];
  }, [selectedHari]);

  return (
    <div className="space-y-6">
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
            padding: 12px;
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
            padding: 4px 6px !important;
            color: black !important;
            font-size: 8pt !important;
          }
          table.print-table th {
            background-color: #f2f2f2 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* Header & Title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print-hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> TP 2026/2027 Resmi
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-[#F59E0B] border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
              501 Data Lengkap Terverifikasi
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#163A5F] dark:text-white flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-[#2563EB]" />
            <span>Jadwal Pelajaran SMKN Bojonggambir</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Jadwal kegiatan belajar mengajar resmi untuk 10 rombel (X, XI, XII DKV & APHP) serta 20 Pendidik & Tenaga Kependidikan.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer"
            title="Tambah jadwal mengajar baru untuk guru dan rombel"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah Jadwal Mengajar</span>
          </button>

          <button
            onClick={handleResetToOfficial}
            title="Sinkronkan / pulihkan seluruh 501 data jadwal asli"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#EFF6FF] hover:text-[#163A5F] transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Sinkronkan 501 Data</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Unduh jadwal sebagai file CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-[#EFF6FF] hover:text-[#163A5F] transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrint}
            title="Cetak Jadwal Pelajaran"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#163A5F] hover:bg-slate-800 text-white shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 text-blue-300" />
            <span>Cetak Jadwal</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print-hidden">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-semibold">Total Baris Jadwal</div>
          <div className="text-xl font-extrabold text-[#163A5F] dark:text-white mt-0.5">501</div>
          <div className="text-[10px] text-[#2563EB] font-bold mt-0.5">Lengkap Senin - Jumat</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-semibold">Sesi KBM Terkonsolidasi</div>
          <div className="text-xl font-extrabold text-[#2563EB] dark:text-blue-400 mt-0.5">142</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Blok Pembelajaran Aktif</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-semibold">Rombongan Belajar</div>
          <div className="text-xl font-extrabold text-[#F59E0B] dark:text-amber-400 mt-0.5">10</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Kelas X, XI, XII (APHP & DKV)</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-semibold">Guru & Tenaga Pendidik</div>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">20</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Kode PTK 1 s.d. 20 & 8.a</div>
        </div>
      </div>

      {/* Main View Switcher & Filters */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4 print-hidden">
        {/* Top Segmented Tab Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl max-w-fit">
            <button
              onClick={() => setActiveTab('blok')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'blok'
                  ? 'bg-[#163A5F] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#163A5F]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Blok KBM (142 Sesi)</span>
            </button>

            <button
              onClick={() => setActiveTab('full501')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'full501'
                  ? 'bg-[#163A5F] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#163A5F]'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>501 Data Lengkap (Resmi)</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-[#163A5F] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#163A5F]'
              }`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              <span>Papan Matriks Kelas</span>
            </button>
          </div>

          {/* Card / Table Switcher (Active for Blok view) */}
          {activeTab === 'blok' && (
            <div className="flex items-center gap-1 self-end sm:self-auto border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => setViewMode('card')}
                title="Tampilan Kartu"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                  viewMode === 'card'
                    ? 'bg-white dark:bg-slate-700 text-[#2563EB] shadow-2xs'
                    : 'text-slate-500 hover:text-[#163A5F]'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Kartu</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                title="Tampilan Tabel"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-[#2563EB] shadow-2xs'
                    : 'text-slate-500 hover:text-[#163A5F]'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Tabel</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Bar: Hari & Kelas & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Day selection pill buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {hariList.map(h => (
              <button
                key={h}
                onClick={() => setSelectedHari(h)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedHari === h
                    ? 'bg-[#163A5F] text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
                }`}
              >
                {h}
              </button>
            ))}
            {activeTab === 'full501' && (
              <button
                onClick={() => setSelectedHari('Semua')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedHari === 'Semua'
                    ? 'bg-[#163A5F] text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
                }`}
              >
                Semua Hari
              </button>
            )}
          </div>

          {/* Search & Class Dropdown */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari guru / mapel / kode..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            {activeTab !== 'matrix' && (
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="">Semua Kelas (10 Kelas)</option>
                {allClasses.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Printable Area Container */}
      <div id="printable-jadwal-schedule" className="space-y-4">
        {/* Printable Header (Visible only when printing) */}
        <div className="hidden print:block border-b-2 border-black pb-3 mb-4 text-center">
          <h1 className="text-base font-bold uppercase tracking-wider text-[#163A5F]">SMK NEGERI BOJONGGAMBIR</h1>
          <h2 className="text-sm font-semibold">JADWAL PELAJARAN SEMESTER GANJIL TAHUN PELAJARAN 2026/2027</h2>
          <p className="text-xs mt-1">
            {activeTab === 'full501' ? 'Dokumen Master 501 Baris Jadwal Resmi' : `Jadwal Hari: ${selectedHari} ${selectedKelas ? `• Kelas: ${selectedKelas}` : '• Seluruh Kelas'}`}
          </p>
        </div>

        {/* TAB 1: BLOK KBM VIEW (142 BLOCKS) */}
        {activeTab === 'blok' && (
          <div>
            {/* View Mode: Card */}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
                {filteredBlokJadwal.length === 0 ? (
                  <div className="col-span-full p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    Tidak ada jadwal ditemukan untuk filter yang dipilih.
                  </div>
                ) : (
                  filteredBlokJadwal.map((j) => (
                    <div
                      key={j.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#2563EB] dark:text-blue-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>JP {j.jp} ({j.waktu})</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {j.kodeGuru && (
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-50 text-[#F59E0B] border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                              Kode {j.kodeGuru}
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                            {j.kelas}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-[#163A5F] dark:text-white line-clamp-2">
                          {j.mapel}
                        </h3>
                        {j.keterangan && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {j.keterangan}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <div className="space-y-1 overflow-hidden">
                          <p className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" /> 
                            <span className="truncate">{j.guru}</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" /> 
                            <span className="truncate">{j.ruang}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(j)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: j.id, name: `${j.kelas} - ${j.mapel} (${j.hari} JP ${j.jp})` })}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition shrink-0 cursor-pointer"
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
            )}

            {/* View Mode: Table (Visible when Table is selected OR when printing in Blok view) */}
            <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-2xs ${viewMode === 'card' ? 'hidden print:block' : 'block'}`}>
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[750px] print-table">
                <thead className="bg-[#F5F7FA] dark:bg-slate-800/80 font-bold uppercase text-[10px] text-[#163A5F] dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Hari & JP</th>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Mata Pelajaran</th>
                    <th className="p-3 text-center">Kode</th>
                    <th className="p-3">Guru Pengampu</th>
                    <th className="p-3">Ruang</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBlokJadwal.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-4 text-center text-slate-400">
                        Tidak ada jadwal ditemukan untuk filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredBlokJadwal.map((j) => (
                      <tr key={j.id} className="hover:bg-[#EFF6FF]/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {j.hari}, JP {j.jp}
                        </td>
                        <td className="p-3 font-mono text-[#2563EB] dark:text-blue-400 font-semibold whitespace-nowrap">
                          {j.waktu}
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#163A5F] dark:text-white">
                            {j.kelas}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {j.mapel}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-[#F59E0B] dark:text-amber-400">
                          {j.kodeGuru || '-'}
                        </td>
                        <td className="p-3 font-medium">
                          {j.guru}
                        </td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {j.ruang}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">
                          {j.keterangan || '-'}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(j)}
                              className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                              title="Edit Jadwal"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ id: j.id, name: `${j.kelas} - ${j.mapel} (${j.hari} JP ${j.jp})` })}
                              className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
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
        )}

        {/* TAB 2: FULL 501 ROWS MASTER SCHEDULE TABLE */}
        {activeTab === 'full501' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 print-hidden">
              <div>Menampilkan <strong>{filteredRawJadwal.length}</strong> dari <strong>501</strong> baris data resmi</div>
              <div className="text-[#2563EB] font-bold">Termasuk Kegiatan Rutin, Pra-KBM & MBG</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[900px] print-table">
                <thead className="bg-[#F5F7FA] dark:bg-slate-800/80 font-bold uppercase text-[10px] text-[#163A5F] dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2.5 text-center w-12">No</th>
                    <th className="p-2.5 w-20">Hari</th>
                    <th className="p-2.5 w-24">Jam Ke</th>
                    <th className="p-2.5 w-28">Waktu</th>
                    <th className="p-2.5 w-28">Kelas</th>
                    <th className="p-2.5">Mata Pelajaran</th>
                    <th className="p-2.5 text-center w-16">Kode</th>
                    <th className="p-2.5">Guru Pengampu</th>
                    <th className="p-2.5 w-36">Ruang</th>
                    <th className="p-2.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                  {filteredRawJadwal.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400">
                        Tidak ada baris jadwal yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredRawJadwal.map((item) => {
                      const isRoutine = item.kelas.includes('Seluruh Kelas') || item.jamKe === 'Pra-KBM' || item.jamKe.includes('Istirahat');
                      const ruangTersedia = item.ruang || getRuangForJadwal(item.kelas, item.mapel, item.jamKe);
                      return (
                        <tr 
                          key={item.no} 
                          className={`hover:bg-[#EFF6FF]/60 dark:hover:bg-slate-800/50 transition-colors ${
                            isRoutine ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center font-mono text-slate-400 text-[11px]">
                            {item.no}
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {item.hari}
                          </td>
                          <td className="p-2.5 whitespace-nowrap font-mono">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isRoutine 
                                ? 'bg-amber-50 text-[#F59E0B] border border-amber-200 dark:bg-amber-950/80 dark:text-amber-300' 
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {item.jamKe}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[#2563EB] dark:text-blue-400 font-bold whitespace-nowrap">
                            {item.jamMulai} - {item.jamSelesai}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isRoutine 
                                ? 'bg-blue-50 text-[#2563EB] border border-blue-200 dark:bg-blue-950 dark:text-blue-300' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                            }`}>
                              {item.kelas}
                            </span>
                          </td>
                          <td className="p-2.5 font-semibold text-slate-900 dark:text-white">
                            {item.mapel}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-[#F59E0B] dark:text-amber-400">
                            {item.kodeGuru}
                          </td>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                            {item.namaGuru}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <MapPin className="h-3 w-3 text-[#2563EB] shrink-0" />
                              <span className="truncate max-w-[130px]">{ruangTersedia}</span>
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-500 text-[11px]">
                            {item.keterangan}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MATRIX 10 CLASSES x PERIODS */}
        {activeTab === 'matrix' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1 print-hidden">
              <div>Matriks Pelaksanaan Hari <strong>{selectedHari}</strong> untuk seluruh 10 Rombel</div>
              <div className="text-[#2563EB] font-bold">Tampilan Horisontal Ruang Kelas</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-[11px] text-slate-700 dark:text-slate-300 min-w-[1100px] border-collapse print-table">
                <thead className="bg-[#F5F7FA] dark:bg-slate-800/80 font-bold uppercase text-[10px] text-[#163A5F] dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200 dark:border-slate-700 w-28 text-center">Waktu / JP</th>
                    {allClasses.map(c => (
                      <th key={c} className="p-2 text-center border-r border-slate-200 dark:border-slate-700 font-bold text-[#163A5F] dark:text-blue-300">
                        <div>{c}</div>
                        <div className="text-[9px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-center gap-0.5">
                          <MapPin className="h-2.5 w-2.5 text-[#2563EB] shrink-0" />
                          <span className="truncate">{roomMap[c] || 'Ruang Kelas'}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {matrixSlots.map((slot) => {
                    if (slot.type === 'routine') {
                      // Find the routine label from rawJadwal
                      const routineItem = rawList.find(r => r.hari === selectedHari && (r.jamKe === slot.key || r.mapel.includes(slot.key)));
                      const desc = routineItem ? routineItem.mapel : slot.label;
                      return (
                        <tr key={slot.key} className="bg-amber-50/60 dark:bg-amber-950/30 font-semibold">
                          <td className="p-2 border-r border-slate-200 dark:border-slate-700 text-center whitespace-nowrap font-mono text-amber-800 dark:text-amber-300 font-bold">
                            {slot.label}<br />
                            <span className="text-[10px] font-normal">{slot.waktu}</span>
                          </td>
                          <td colSpan={10} className="p-2 text-center text-amber-900 dark:text-amber-200 font-bold tracking-wide">
                            {desc} ({slot.waktu} WIB)
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={slot.key} className="hover:bg-[#EFF6FF]/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-2 border-r border-slate-200 dark:border-slate-700 text-center whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/40">
                          JP {slot.jp}<br />
                          <span className="text-[10px] font-semibold text-[#2563EB] dark:text-blue-400">{slot.waktu}</span>
                        </td>
                        {allClasses.map(c => {
                          const entry = rawList.find(r => r.hari === selectedHari && r.jamKe === slot.jp && r.kelas === c);
                          if (!entry) {
                            return (
                              <td key={c} className="p-2 border-r border-slate-200 dark:border-slate-700 text-center text-slate-300">
                                -
                              </td>
                            );
                          }
                          return (
                            <td key={c} className="p-2 border-r border-slate-200 dark:border-slate-700 align-top">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-[#F59E0B] border border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                                    Kd {entry.kodeGuru}
                                  </span>
                                </div>
                                <div className="font-bold text-[#163A5F] dark:text-white line-clamp-2 leading-tight text-[10.5px]">
                                  {entry.mapel}
                                </div>
                                <div className="text-[9.5px] text-slate-500 truncate">
                                  {entry.namaGuru}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Jadwal Mengajar */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-[#163A5F] text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Tambah Jadwal Mengajar Baru
                  </h3>
                  <p className="text-xs text-blue-100">
                    Alokasikan jadwal KBM rombel dengan pilihan Guru Pengampu dan Mata Pelajaran
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewJadwal} className="p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Hari */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Hari Pelaksanaan
                  </label>
                  <select
                    value={newJadwal.hari}
                    onChange={(e) => setNewJadwal({ ...newJadwal, hari: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  >
                    {hariList.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Kelas */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Kelas / Rombel
                  </label>
                  <select
                    value={newJadwal.kelas}
                    onChange={(e) => {
                      const selKelas = e.target.value;
                      setNewJadwal(prev => ({
                        ...prev,
                        kelas: selKelas,
                        ruang: roomMap[selKelas] || prev.ruang
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  >
                    {allClasses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Guru Pengampu Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Pilihan Guru Pengampu</span>
                    <span className="text-[10px] text-[#2563EB] dark:text-blue-400 font-bold">
                      {effectiveGuruList.length} PTK Tersedia
                    </span>
                  </label>
                  <select
                    value={newJadwal.guru}
                    onChange={(e) => {
                      const selNama = e.target.value;
                      const matched = effectiveGuruList.find(g => g.nama === selNama);
                      const kode = matched?.kodeGuru || Object.keys(ptkMap).find(k => ptkMap[k].nama === selNama) || '';
                      const mapelUtama = matched?.mapelUtama 
                        ? matched.mapelUtama.split(',')[0].trim() 
                        : (ptkMap[kode]?.mapel ? ptkMap[kode].mapel.split('/')[0].trim() : '');
                      setNewJadwal(prev => ({
                        ...prev,
                        guru: selNama,
                        kodeGuru: kode,
                        mapel: mapelUtama || prev.mapel
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Guru Pengampu --</option>
                    {effectiveGuruList.map((g) => (
                      <option key={g.id || g.nama} value={g.nama}>
                        {g.kodeGuru ? `[Kode ${g.kodeGuru}] ` : ''}{g.nama} {g.mapelUtama ? `— (${g.mapelUtama})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran Dropdown */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span>Pilihan Mata Pelajaran</span>
                    <span className="text-[10px] text-[#2563EB] dark:text-blue-400 font-mono font-bold">
                      {effectiveMapelList.length} Mapel Master
                    </span>
                  </label>
                  <select
                    value={newJadwal.mapel}
                    onChange={(e) => setNewJadwal({ ...newJadwal, mapel: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {effectiveMapelList.map((m) => (
                      <option key={m.id || m.namaMapel} value={m.namaMapel}>
                        {m.namaMapel} {m.kode ? `[${m.kode}]` : ''} {m.kelompok ? `(${m.kelompok})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jam Ke / JP */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Alokasi Jam Pelajaran (JP)
                  </label>
                  <input
                    type="text"
                    value={newJadwal.jp}
                    onChange={(e) => setNewJadwal({ ...newJadwal, jp: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    placeholder="e.g. 1-4"
                    required
                  />
                  {/* Quick JP presets */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      { label: '1-2', waktu: '07.00 - 08.20' },
                      { label: '1-4', waktu: '07.15 - 10.15' },
                      { label: '3-4', waktu: '08.20 - 10.25' },
                      { label: '5-6', waktu: '10.25 - 11.45' },
                      { label: '7-8', waktu: '11.45 - 13.40' },
                      { label: '7-10', waktu: '11.45 - 15.00' }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setNewJadwal(prev => ({ ...prev, jp: preset.label, waktu: preset.waktu }))}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                          newJadwal.jp === preset.label
                            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-[#EFF6FF] hover:text-[#163A5F]'
                        }`}
                      >
                        JP {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Waktu KBM */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Waktu KBM
                  </label>
                  <input
                    type="text"
                    value={newJadwal.waktu}
                    onChange={(e) => setNewJadwal({ ...newJadwal, waktu: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    placeholder="e.g. 07.15 - 10.15"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Format jam mulai s.d. selesai
                  </p>
                </div>

                {/* Ruang / Lab */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Ruang / Lab / Bengkel
                  </label>
                  <input
                    type="text"
                    value={newJadwal.ruang}
                    onChange={(e) => setNewJadwal({ ...newJadwal, ruang: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    placeholder="e.g. Bengkel APHP / Studio DKV 1"
                  />
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={newJadwal.keterangan}
                    onChange={(e) => setNewJadwal({ ...newJadwal, keterangan: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    placeholder="e.g. KBM Reguler / Teori / Praktik"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Simpan Jadwal Mengajar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT JADWAL */}
      {showEditModal && editingJadwal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#163A5F] dark:text-white">
                    Edit Jadwal Mengajar
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Perbarui rincian KBM, pengampu, alokasi jam pelajaran, atau ruangan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditJadwal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Hari */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Hari Pelaksanaan
                  </label>
                  <select
                    value={editingJadwal.hari}
                    onChange={(e) => setEditingJadwal({ ...editingJadwal, hari: e.target.value as JadwalItem['hari'] })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    required
                  >
                    {hariList.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Kelas */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Rombongan Belajar / Kelas
                  </label>
                  <select
                    value={editingJadwal.kelas}
                    onChange={(e) => setEditingJadwal({ ...editingJadwal, kelas: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    required
                  >
                    {allClasses.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>

                {/* Guru Pengampu */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Guru Pengampu
                  </label>
                  <select
                    value={editingJadwal.guru}
                    onChange={(e) => {
                      const selNama = e.target.value;
                      const matched = effectiveGuruList.find(g => g.nama === selNama);
                      const kode = matched?.kodeGuru || Object.keys(ptkMap).find(k => ptkMap[k].nama === selNama) || '';
                      setEditingJadwal({
                        ...editingJadwal,
                        guru: selNama,
                        kodeGuru: kode
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Guru Pengampu --</option>
                    {effectiveGuruList.map((g) => (
                      <option key={g.id || g.nama} value={g.nama}>
                        {g.kodeGuru ? `[Kode ${g.kodeGuru}] ` : ''}{g.nama} {g.mapelUtama ? `— (${g.mapelUtama})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={editingJadwal.mapel}
                    onChange={(e) => setEditingJadwal({ ...editingJadwal, mapel: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    required
                  >
                    <option value="">-- Pilih Mata Pelajaran --</option>
                    {effectiveMapelList.map((m) => (
                      <option key={m.id || m.namaMapel} value={m.namaMapel}>
                        {m.namaMapel} {m.kode ? `[${m.kode}]` : ''} {m.kelompok ? `(${m.kelompok})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jam Ke / JP */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Alokasi Jam Pelajaran (JP)
                  </label>
                  <input
                    type="text"
                    value={editingJadwal.jp}
                    onChange={(e) => setEditingJadwal({ ...editingJadwal, jp: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    placeholder="e.g. 1-4"
                    required
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[
                      { label: '1-2', waktu: '07.00 - 08.20' },
                      { label: '1-4', waktu: '07.15 - 10.15' },
                      { label: '3-4', waktu: '08.20 - 10.25' },
                      { label: '5-6', waktu: '10.25 - 11.45' },
                      { label: '7-8', waktu: '11.45 - 13.40' },
                      { label: '7-10', waktu: '11.45 - 15.00' }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setEditingJadwal(prev => prev ? ({ ...prev, jp: preset.label, waktu: preset.waktu }) : null)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                          editingJadwal.jp === preset.label
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        JP {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Waktu KBM */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Waktu KBM
                  </label>
                  <input
                    type="text"
                    value={editingJadwal.waktu}
                    onChange={(e) => setEditingJadwal({ ...editingJadwal, waktu: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    placeholder="e.g. 07.15 - 10.15"
                  />
                </div>

                {/* Ruang */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Ruang / Lab / Bengkel
                  </label>
                  <input
                    type="text"
                    value={editingJadwal.ruang || ''}
                    onChange={(e) => setEditingJadwal({ ...editingJadwal, ruang: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    placeholder="e.g. Bengkel APHP / Studio DKV 1"
                  />
                </div>

                {/* Keterangan */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    value={editingJadwal.keterangan || ''}
                    onChange={(e) => setEditingJadwal({ ...editingJadwal, keterangan: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                    placeholder="e.g. KBM Reguler"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Jadwal Mengajar"
        message="Apakah Anda yakin ingin menghapus jadwal mengajar berikut? Tindakan ini tidak dapat dibatalkan."
        itemName={deleteTarget?.name}
        onConfirm={confirmDeleteJadwal}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Search, 
  Download, 
  ExternalLink, 
  Calendar, 
  Users, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Folder, 
  Sparkles,
  Filter,
  Save,
  Tag,
  Trash2,
  Edit3,
  FolderTree,
  RefreshCw,
  X
} from 'lucide-react';
import { 
  MateriRecord, 
  TugasRecord, 
  KelasItem, 
  MapelItem, 
  GuruItem, 
  User 
} from '../../types';
import { Storage } from '../../lib/storage';
import { GoogleDriveFolderPickerModal } from '../GoogleDriveFolderPickerModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { toast } from 'sonner';

interface MateriTugasViewProps {
  materiList: MateriRecord[];
  tugasList: TugasRecord[];
  kelasList: KelasItem[];
  mapelList: MapelItem[];
  guruList: GuruItem[];
  currentUser: User;
  onRefresh: () => void;
}

export const MateriTugasView: React.FC<MateriTugasViewProps> = ({
  materiList,
  tugasList,
  kelasList,
  mapelList,
  guruList,
  currentUser,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'materi' | 'tugas' | 'tambah'>('materi');
  const [tambahType, setTambahType] = useState<'materi' | 'tugas'>('materi');

  // Filter states
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [selectedHari, setSelectedHari] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState<boolean>(false);

  // Edit and Delete states
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'materi' | 'tugas'; name: string } | null>(null);
  const [editingMateri, setEditingMateri] = useState<MateriRecord | null>(null);
  const [editingTugas, setEditingTugas] = useState<TugasRecord | null>(null);

  // Timezone-safe day calculation
  const getDayName = (dateStr?: string): string => {
    if (!dateStr) return 'Senin';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return days[d.getDay()] || 'Senin';
    }
    return 'Senin';
  };

  // Form State for Adding New Materi
  const [newMateriForm, setNewMateriForm] = useState<{
    judulMateri: string;
    kelas: string;
    mapel: string;
    guru: string;
    hari: string;
    tanggal: string;
    elemen: string;
    cp: string;
    atp: string;
    tujuanPembelajaran: string;
    ringkasanMateri: string;
    fileUrl: string;
    lkpdUrl: string;
    driveLink: string;
  }>({
    judulMateri: '',
    kelas: kelasList[0]?.namaKelas || 'X DKV 1',
    mapel: mapelList[0]?.namaMapel || 'Desain Komunikasi Visual (DKV)',
    guru: currentUser.nama || 'Dede Gisni Azmi, S.Si.',
    hari: 'Senin',
    tanggal: '2026-08-03',
    elemen: '',
    cp: '',
    atp: '',
    tujuanPembelajaran: '',
    ringkasanMateri: '',
    fileUrl: '',
    lkpdUrl: '',
    driveLink: ''
  });

  // Form State for Adding New Tugas
  const [newTugasForm, setNewTugasForm] = useState({
    judulTugas: '',
    jenisTugas: 'Praktik Studio / Lab' as TugasRecord['jenisTugas'],
    kelas: kelasList[0]?.namaKelas || 'X DKV 1',
    mapel: mapelList[0]?.namaMapel || 'Desain Komunikasi Visual (DKV)',
    guru: currentUser.nama || 'Dede Gisni Azmi, S.Si.',
    hari: 'Senin',
    tanggal: '2026-08-03',
    deadline: '2026-08-10',
    instruksi: '',
    driveFolderTask: ''
  });

  const [isSuccessNotification, setIsSuccessNotification] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filtered Materi
  const filteredMateri = useMemo(() => {
    return materiList.filter(m => {
      const matchKelas = selectedKelas === 'Semua' || m.kelas === selectedKelas;
      const matchHari = selectedHari === 'Semua' || m.hari === selectedHari;
      const matchSearch = !searchQuery || 
        m.judulMateri.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.mapel.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.guru.toLowerCase().includes(searchQuery.toLowerCase());

      return matchKelas && matchHari && matchSearch;
    });
  }, [materiList, selectedKelas, selectedHari, searchQuery]);

  // Filtered Tugas
  const filteredTugas = useMemo(() => {
    return tugasList.filter(t => {
      const matchKelas = selectedKelas === 'Semua' || t.kelas === selectedKelas;
      const matchHari = selectedHari === 'Semua' || t.hari === selectedHari;
      const matchSearch = !searchQuery || 
        t.judulTugas.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.mapel.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.guru.toLowerCase().includes(searchQuery.toLowerCase());

      return matchKelas && matchHari && matchSearch;
    });
  }, [tugasList, selectedKelas, selectedHari, searchQuery]);

  // Submit Handler for New Materi
  const handleSaveMateri = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newRecord: MateriRecord = {
        id: `mat-new-${Date.now()}`,
        nomorMateri: `MAT/2026/08/${Math.floor(100 + Math.random() * 900)}`,
        hari: newMateriForm.hari || getDayName(newMateriForm.tanggal),
        tanggal: newMateriForm.tanggal,
        mapel: newMateriForm.mapel,
        fase: newMateriForm.kelas.startsWith('X ') ? 'E' : 'F',
        kelas: newMateriForm.kelas,
        guru: newMateriForm.guru,
        elemen: newMateriForm.elemen,
        cp: newMateriForm.cp,
        atp: newMateriForm.atp,
        tujuanPembelajaran: newMateriForm.tujuanPembelajaran,
        judulMateri: newMateriForm.judulMateri,
        ringkasanMateri: newMateriForm.ringkasanMateri,
        fileUrl: newMateriForm.fileUrl,
        lkpdUrl: newMateriForm.lkpdUrl,
        driveLink: newMateriForm.driveLink,
        status: 'Terpublikasi'
      };

      Storage.addMateri(newRecord);
      setIsSuccessNotification(true);
      setTimeout(() => setIsSuccessNotification(false), 3500);
      setActiveTab('materi');
      onRefresh();
      toast.success(`Materi "${newRecord.judulMateri}" berhasil dipublikasikan!`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for New Tugas
  const handleSaveNewTugas = (e: React.FormEvent) => {
    e.preventDefault();
    const newTugas: TugasRecord = {
      id: `tug-new-${Date.now()}`,
      hari: newTugasForm.hari || getDayName(newTugasForm.tanggal),
      tanggal: newTugasForm.tanggal,
      mapel: newTugasForm.mapel,
      kelas: newTugasForm.kelas,
      guru: newTugasForm.guru,
      judulTugas: newTugasForm.judulTugas,
      jenisTugas: newTugasForm.jenisTugas,
      deadline: newTugasForm.deadline,
      instruksi: newTugasForm.instruksi,
      driveFolderTask: newTugasForm.driveFolderTask,
      totalSiswa: 36,
      totalMengumpulkan: 0
    };
    Storage.addTugas(newTugas);
    setActiveTab('tugas');
    onRefresh();
    toast.success(`Tugas "${newTugas.judulTugas}" berhasil diterbitkan!`);
  };

  const handleSaveEditMateri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMateri) return;
    Storage.updateMateri(editingMateri);
    setEditingMateri(null);
    onRefresh();
    toast.success(`Materi "${editingMateri.judulMateri}" berhasil diperbarui!`);
  };

  const handleSaveEditTugas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTugas) return;
    Storage.updateTugas(editingTugas);
    setEditingTugas(null);
    onRefresh();
    toast.success(`Tugas "${editingTugas.judulTugas}" berhasil diperbarui!`);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'materi') {
      Storage.deleteMateri(deleteTarget.id);
      toast.success(`Materi "${deleteTarget.name}" berhasil dihapus`);
    } else {
      Storage.deleteTugas(deleteTarget.id);
      toast.success(`Tugas "${deleteTarget.name}" berhasil dihapus`);
    }
    setDeleteTarget(null);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-[#163A5F] p-6 text-white shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-blue-100 border border-white/10">
              Modul Pembelajaran SIMAGU
            </span>
            <span className="text-xs text-blue-200">Sampel 1 Minggu Operasional (Senin-Jumat)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-blue-300" />
            Materi Pembelajaran & Tugas Siswa
          </h1>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            Pusat unggah modul pembelajaran, CP, ATP, LKPD interaktif, dan penugasan terstruktur untuk seluruh program keahlian SMKN Bojonggambir.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('tambah')}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tambah Materi / Tugas
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSuccessNotification && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-[#16A34A] dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
          <p className="text-xs font-medium">
            Materi Pembelajaran baru berhasil diterbitkan dan langsung dapat diakses oleh siswa dan supervisor!
          </p>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('materi')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'materi'
              ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Materi Pembelajaran ({materiList.length})
        </button>

        <button
          onClick={() => setActiveTab('tugas')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'tugas'
              ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Tugas & LKPD Siswa ({tugasList.length})
        </button>

        <button
          onClick={() => setActiveTab('tambah')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
            activeTab === 'tambah'
              ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Plus className="h-4 w-4" />
          Form Unggah Baru
        </button>
      </div>

      {/* Filter and Search controls */}
      {activeTab !== 'tambah' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Kelas / Rombel</label>
              <select
                value={selectedKelas}
                onChange={e => setSelectedKelas(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="Semua">Semua Kelas (10 Rombel)</option>
                {kelasList.map(k => (
                  <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Hari Operasional</label>
              <select
                value={selectedHari}
                onChange={e => setSelectedHari(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="Semua">Semua Hari (Senin - Jumat)</option>
                <option value="Senin">Senin (2026-08-03)</option>
                <option value="Selasa">Selasa (2026-08-04)</option>
                <option value="Rabu">Rabu (2026-08-05)</option>
                <option value="Kamis">Kamis (2026-08-06)</option>
                <option value="Jumat">Jumat (2026-08-07)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari Kata Kunci</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari materi, mapel, atau nama guru..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Materi Pembelajaran List */}
      {activeTab === 'materi' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMateri.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center text-slate-400">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Materi pembelajaran tidak ditemukan.</p>
                <p className="text-xs text-slate-500 mt-1">Coba sesuaikan filter kelas atau kata kunci pencarian Anda.</p>
              </div>
            ) : (
              filteredMateri.map((item) => (
                <div 
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs hover:border-[#2563EB] dark:hover:border-blue-500 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-bold">
                        {item.hari}, {item.tanggal.split('-')[2]}/08
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.nomorMateri || item.id}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-[#2563EB] dark:text-blue-400 block mb-1">
                        {item.mapel} ({item.kelas})
                      </span>
                      <h3 className="font-bold text-[#163A5F] dark:text-white text-sm line-clamp-2">
                        {item.judulMateri}
                      </h3>
                    </div>

                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                      <p className="text-[11px]"><strong className="text-slate-700 dark:text-slate-200">Elemen:</strong> {item.elemen}</p>
                      <p className="text-[11px] line-clamp-2"><strong className="text-slate-700 dark:text-slate-200">Tujuan Pembelajaran:</strong> {item.tujuanPembelajaran}</p>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 italic">
                      "{item.ringkasanMateri}"
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                      Pengampu: <strong>{item.guru}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={item.driveLink || item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-1.5 text-[11px] font-bold transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Modul PDF
                      </a>

                      <button
                        onClick={() => setEditingMateri({ ...item })}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                        title="Edit Materi"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ id: item.id, type: 'materi', name: item.judulMateri })}
                        className="p-1.5 text-slate-400 hover:text-[#DC2626] dark:hover:text-red-400 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="Hapus Materi"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Tugas & LKPD List */}
      {activeTab === 'tugas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTugas.length === 0 ? (
              <div className="col-span-full rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center text-slate-400">
                <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Tidak ada tugas ditemukan.</p>
              </div>
            ) : (
              filteredTugas.map((item) => (
                <div 
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs hover:border-[#2563EB] dark:hover:border-blue-500 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-bold">
                        {item.jenisTugas}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Deadline: {item.deadline}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-[#2563EB] dark:text-blue-400 block mb-1">
                        {item.mapel} ({item.kelas})
                      </span>
                      <h3 className="font-bold text-[#163A5F] dark:text-white text-sm">
                        {item.judulTugas}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                      {item.instruksi}
                    </p>

                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400">Status Pengumpulan</p>
                        <p className="font-bold text-[#163A5F] dark:text-white mt-0.5">
                          {item.totalMengumpulkan} / {item.totalSiswa} Siswa
                        </p>
                      </div>

                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-[#2563EB] dark:text-blue-300 font-bold text-xs">
                        {Math.round((item.totalMengumpulkan / (item.totalSiswa || 1)) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-500">
                      Guru: {item.guru}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={item.driveFolderTask || item.fileLampiranUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 text-[#2563EB] hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-1.5 text-[11px] font-bold transition"
                      >
                        <Folder className="h-3.5 w-3.5" />
                        LKPD & Drive
                      </a>

                      <button
                        onClick={() => setEditingTugas({ ...item })}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                        title="Edit Tugas"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget({ id: item.id, type: 'tugas', name: item.judulTugas })}
                        className="p-1.5 text-slate-400 hover:text-[#DC2626] dark:hover:text-red-400 transition rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Form Add New Materi or Tugas */}
      {activeTab === 'tambah' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-2xs space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#163A5F] dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-[#2563EB]" />
                {tambahType === 'materi' ? 'Unggah Materi Pembelajaran Baru' : 'Terbitkan Tugas & LKPD Baru'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Formulir publikasi materi resmi & penugasan KBM Kurikulum Merdeka SMKN Bojonggambir.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTambahType('materi')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  tambahType === 'materi'
                    ? 'bg-white dark:bg-slate-700 text-[#2563EB] dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Materi Pelajaran
              </button>
              <button
                type="button"
                onClick={() => setTambahType('tugas')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                  tambahType === 'tugas'
                    ? 'bg-white dark:bg-slate-700 text-[#2563EB] dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tugas / LKPD
              </button>
            </div>
          </div>

          {tambahType === 'materi' ? (
            <form onSubmit={handleSaveMateri} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rombel / Kelas</label>
                  <select
                    value={newMateriForm.kelas}
                    onChange={e => setNewMateriForm({ ...newMateriForm, kelas: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {kelasList.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran</label>
                  <select
                    value={newMateriForm.mapel}
                    onChange={e => setNewMateriForm({ ...newMateriForm, mapel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {mapelList.map(m => (
                      <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Guru Pengampu</label>
                  <select
                    value={newMateriForm.guru}
                    onChange={e => setNewMateriForm({ ...newMateriForm, guru: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {guruList.map(g => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Judul Materi Pembelajaran</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Prinsip Dasar Layout & Komposisi Desain Studio DKV"
                    value={newMateriForm.judulMateri}
                    onChange={e => setNewMateriForm({ ...newMateriForm, judulMateri: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Elemen Kurikulum Merdeka</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Desain Grafis / Tipografi"
                    value={newMateriForm.elemen}
                    onChange={e => setNewMateriForm({ ...newMateriForm, elemen: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP)</label>
                <textarea
                  rows={2}
                  value={newMateriForm.tujuanPembelajaran}
                  onChange={e => setNewMateriForm({ ...newMateriForm, tujuanPembelajaran: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ringkasan Materi & Panduan LKPD</label>
                <textarea
                  rows={3}
                  value={newMateriForm.ringkasanMateri}
                  onChange={e => setNewMateriForm({ ...newMateriForm, ringkasanMateri: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Tautan Folder Google Drive Materi / LKPD
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsFolderPickerOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2.5 py-1 text-[11px] font-bold text-[#2563EB] dark:text-blue-300 hover:bg-blue-100 transition shadow-2xs cursor-pointer"
                  >
                    <FolderTree className="h-3.5 w-3.5 text-[#2563EB] dark:text-blue-400" />
                    <span>Pilih Folder Google Drive</span>
                  </button>
                </div>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={newMateriForm.driveLink}
                  onChange={e => setNewMateriForm({ ...newMateriForm, driveLink: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <GoogleDriveFolderPickerModal
                isOpen={isFolderPickerOpen}
                onClose={() => setIsFolderPickerOpen(false)}
                currentSelectedUrl={newMateriForm.driveLink}
                onSelectFolder={(url) => {
                  setNewMateriForm({ ...newMateriForm, driveLink: url });
                }}
              />

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('materi')}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Menerbitkan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Terbitkan Materi Pembelajaran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveNewTugas} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rombel / Kelas</label>
                  <select
                    value={newTugasForm.kelas}
                    onChange={e => setNewTugasForm({ ...newTugasForm, kelas: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {kelasList.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mata Pelajaran</label>
                  <select
                    value={newTugasForm.mapel}
                    onChange={e => setNewTugasForm({ ...newTugasForm, mapel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {mapelList.map(m => (
                      <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Guru Pengampu</label>
                  <select
                    value={newTugasForm.guru}
                    onChange={e => setNewTugasForm({ ...newTugasForm, guru: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  >
                    {guruList.map(g => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Judul Tugas / LKPD</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Praktik Pembuatan Moodboard & Desain Poster Edukasi"
                    value={newTugasForm.judulTugas}
                    onChange={e => setNewTugasForm({ ...newTugasForm, judulTugas: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenis Penugasan</label>
                  <select
                    value={newTugasForm.jenisTugas}
                    onChange={e => setNewTugasForm({ ...newTugasForm, jenisTugas: e.target.value as TugasRecord['jenisTugas'] })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="Praktik Studio / Lab">Praktik Studio / Lab</option>
                    <option value="Individu">Individu</option>
                    <option value="Kelompok">Kelompok</option>
                    <option value="Proyek PjBL">Proyek PjBL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Batas Akhir Pengumpulan (Deadline)</label>
                  <input
                    type="date"
                    required
                    value={newTugasForm.deadline}
                    onChange={e => setNewTugasForm({ ...newTugasForm, deadline: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tautan Drive Folder Pengumpulan</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={newTugasForm.driveFolderTask}
                    onChange={e => setNewTugasForm({ ...newTugasForm, driveFolderTask: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Petunjuk & Instruksi Pengerjaan</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tulis instruksi langkah pengerjaan, format berkas, rubrik penilaian, dll..."
                  value={newTugasForm.instruksi}
                  onChange={e => setNewTugasForm({ ...newTugasForm, instruksi: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('tugas')}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Terbitkan Tugas Baru</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Modal Edit Materi */}
      {editingMateri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#163A5F] dark:text-white">
                    Edit Materi Pembelajaran
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbarui judul, tujuan pembelajaran, atau berkas modul materi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMateri(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMateri} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kelas</label>
                  <select
                    value={editingMateri.kelas}
                    onChange={(e) => setEditingMateri({ ...editingMateri, kelas: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-[#2563EB]"
                    required
                  >
                    {kelasList.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mata Pelajaran</label>
                  <select
                    value={editingMateri.mapel}
                    onChange={(e) => setEditingMateri({ ...editingMateri, mapel: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-[#2563EB]"
                    required
                  >
                    {mapelList.map(m => (
                      <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Judul Materi</label>
                <input
                  type="text"
                  value={editingMateri.judulMateri}
                  onChange={(e) => setEditingMateri({ ...editingMateri, judulMateri: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Elemen</label>
                  <input
                    type="text"
                    value={editingMateri.elemen || ''}
                    onChange={(e) => setEditingMateri({ ...editingMateri, elemen: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Guru Pengampu</label>
                  <select
                    value={editingMateri.guru}
                    onChange={(e) => setEditingMateri({ ...editingMateri, guru: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB]"
                    required
                  >
                    {guruList.map(g => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tujuan Pembelajaran</label>
                <textarea
                  rows={2}
                  value={editingMateri.tujuanPembelajaran || ''}
                  onChange={(e) => setEditingMateri({ ...editingMateri, tujuanPembelajaran: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ringkasan Materi</label>
                <textarea
                  rows={3}
                  value={editingMateri.ringkasanMateri || ''}
                  onChange={(e) => setEditingMateri({ ...editingMateri, ringkasanMateri: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Link Google Drive / Modul</label>
                <input
                  type="url"
                  value={editingMateri.driveLink || editingMateri.fileUrl || ''}
                  onChange={(e) => setEditingMateri({ ...editingMateri, driveLink: e.target.value, fileUrl: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingMateri(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan Materi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Tugas */}
      {editingTugas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#163A5F] dark:text-white">
                    Edit Tugas & LKPD
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perbarui judul, instruksi, deadline, atau tautan berkas LKPD
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTugas(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTugas} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kelas</label>
                  <select
                    value={editingTugas.kelas}
                    onChange={(e) => setEditingTugas({ ...editingTugas, kelas: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-[#2563EB]"
                    required
                  >
                    {kelasList.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mata Pelajaran</label>
                  <select
                    value={editingTugas.mapel}
                    onChange={(e) => setEditingTugas({ ...editingTugas, mapel: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-bold focus:ring-2 focus:ring-[#2563EB]"
                    required
                  >
                    {mapelList.map(m => (
                      <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Judul Tugas</label>
                  <input
                    type="text"
                    value={editingTugas.judulTugas}
                    onChange={(e) => setEditingTugas({ ...editingTugas, judulTugas: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-semibold focus:ring-2 focus:ring-[#2563EB]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Jenis Tugas</label>
                  <select
                    value={editingTugas.jenisTugas}
                    onChange={(e) => setEditingTugas({ ...editingTugas, jenisTugas: e.target.value as TugasRecord['jenisTugas'] })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB]"
                    required
                  >
                    <option value="Praktik Studio / Lab">Praktik Studio / Lab</option>
                    <option value="Individu">Individu</option>
                    <option value="Kelompok">Kelompok</option>
                    <option value="Proyek PjBL">Proyek PjBL</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Deadline</label>
                  <input
                    type="date"
                    value={editingTugas.deadline}
                    onChange={(e) => setEditingTugas({ ...editingTugas, deadline: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Guru Pengampu</label>
                  <select
                    value={editingTugas.guru}
                    onChange={(e) => setEditingTugas({ ...editingTugas, guru: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 font-medium focus:ring-2 focus:ring-[#2563EB]"
                    required
                  >
                    {guruList.map(g => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Instruksi Pengerjaan</label>
                <textarea
                  rows={4}
                  value={editingTugas.instruksi || ''}
                  onChange={(e) => setEditingTugas({ ...editingTugas, instruksi: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tautan Drive Folder Pengumpulan</label>
                <input
                  type="url"
                  value={editingTugas.driveFolderTask || ''}
                  onChange={(e) => setEditingTugas({ ...editingTugas, driveFolderTask: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTugas(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan Tugas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.type === 'materi' ? 'Hapus Materi Pembelajaran' : 'Hapus Tugas & LKPD'}
        message={`Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.`}
        itemName={deleteTarget?.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

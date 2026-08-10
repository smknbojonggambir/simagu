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
  RefreshCw
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

  // Filter states
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [selectedHari, setSelectedHari] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFolderPickerOpen, setIsFolderPickerOpen] = useState<boolean>(false);

  // Form State for Adding New Materi / Tugas
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
        hari: newMateriForm.hari,
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMateri = (id: string, _judul: string) => {
    Storage.deleteMateri(id);
    onRefresh();
  };

  const handleDeleteTugas = (id: string, _judul: string) => {
    Storage.deleteTugas(id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-200 backdrop-blur-md">
              Modul Pembelajaran SIMAGU
            </span>
            <span className="text-xs text-emerald-300">Sampel 1 Minggu Operasional (Senin-Jumat)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-emerald-300" />
            Materi Pembelajaran & Tugas Siswa
          </h1>
          <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
            Pusat unggah modul pembelajaran, CP, ATP, LKPD interaktif, dan penugasan terstruktur untuk seluruh program keahlian SMKN Bojonggambir.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('tambah')}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-600 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Tambah Materi / Tugas
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSuccessNotification && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-medium">
            Materi Pembelajaran baru berhasil diterbitkan dan langsung dapat diakses oleh siswa dan supervisor!
          </p>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('materi')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'materi'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Materi Pembelajaran ({materiList.length})
        </button>

        <button
          onClick={() => setActiveTab('tugas')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'tugas'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Tugas & LKPD Siswa ({tugasList.length})
        </button>

        <button
          onClick={() => setActiveTab('tambah')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === 'tambah'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Plus className="h-4 w-4" />
          Form Unggah Baru
        </button>
      </div>

      {/* Filter and Search controls */}
      {activeTab !== 'tambah' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Filter Kelas / Rombel</label>
              <select
                value={selectedKelas}
                onChange={e => setSelectedKelas(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs hover:border-emerald-500 dark:hover:border-emerald-500 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                        {item.hari}, {item.tanggal.split('-')[2]}/08
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.nomorMateri || item.id}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 block mb-1">
                        {item.mapel} ({item.kelas})
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2">
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
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900 px-2.5 py-1.5 text-[11px] font-bold transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Modul PDF
                      </a>

                      <button
                        onClick={() => handleDeleteMateri(item.id, item.judulMateri)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
                  className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs hover:border-teal-500 dark:hover:border-teal-500 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 px-2.5 py-0.5 text-[10px] font-bold">
                        {item.jenisTugas}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Deadline: {item.deadline}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                        {item.mapel} ({item.kelas})
                      </span>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.judulTugas}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                      {item.instruksi}
                    </p>

                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400">Status Pengumpulan</p>
                        <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                          {item.totalMengumpulkan} / {item.totalSiswa} Siswa
                        </p>
                      </div>

                      <div className="h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs">
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
                        className="inline-flex items-center gap-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-950/50 dark:text-teal-300 px-2.5 py-1.5 text-[11px] font-bold transition"
                      >
                        <Folder className="h-3.5 w-3.5" />
                        LKPD & Drive
                      </a>

                      <button
                        onClick={() => handleDeleteTugas(item.id, item.judulTugas)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
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

      {/* Tab 3: Form Add New Materi */}
      {activeTab === 'tambah' && (
        <form onSubmit={handleSaveMateri} className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Unggah Materi Pembelajaran & LKPD Baru
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Formulir penerbitan materi resmi untuk pembelajaran berbasis Kurikulum Merdeka SMKN Bojonggambir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Rombel / Kelas</label>
              <select
                value={newMateriForm.kelas}
                onChange={e => setNewMateriForm({ ...newMateriForm, kelas: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
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
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
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
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
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
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Elemen Kurikulum Merdeka</label>
              <input
                type="text"
                required
                value={newMateriForm.elemen}
                onChange={e => setNewMateriForm({ ...newMateriForm, elemen: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Capaian Pembelajaran (CP) & Tujuan Pembelajaran (TP)</label>
            <textarea
              rows={2}
              value={newMateriForm.tujuanPembelajaran}
              onChange={e => setNewMateriForm({ ...newMateriForm, tujuanPembelajaran: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ringkasan Materi & Panduan LKPD</label>
            <textarea
              rows={3}
              value={newMateriForm.ringkasanMateri}
              onChange={e => setNewMateriForm({ ...newMateriForm, ringkasanMateri: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
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
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition shadow-2xs"
              >
                <FolderTree className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Pilih Folder Google Drive</span>
              </button>
            </div>
            <input
              type="url"
              placeholder="https://drive.google.com/drive/folders/..."
              value={newMateriForm.driveLink}
              onChange={e => setNewMateriForm({ ...newMateriForm, driveLink: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
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
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition active:scale-95 disabled:opacity-60 cursor-pointer"
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
      )}
    </div>
  );
};

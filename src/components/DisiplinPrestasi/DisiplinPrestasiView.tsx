import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertOctagon, 
  Award, 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Calendar, 
  User, 
  X, 
  Sparkles, 
  ChevronDown,
  Edit3,
  Trash2
} from 'lucide-react';
import { AgendaKelasItem, SiswaItem, KelasItem } from '../../types';
import { Storage } from '../../lib/storage';
import { showAlert } from '../../lib/alerts';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { toast } from 'sonner';

interface DisiplinPrestasiViewProps {
  agendaKelasList: AgendaKelasItem[];
  siswaList?: SiswaItem[];
  kelasList?: KelasItem[];
  initialTab?: 'pelanggaran' | 'prestasi';
  onRefresh?: () => void;
}

export const DisiplinPrestasiView: React.FC<DisiplinPrestasiViewProps> = ({ 
  agendaKelasList = [],
  siswaList = [],
  kelasList = [],
  initialTab = 'pelanggaran',
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'pelanggaran' | 'prestasi'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('Semua');

  // Modals
  const [showAddPelanggaran, setShowAddPelanggaran] = useState(false);
  const [showAddPrestasi, setShowAddPrestasi] = useState(false);
  const [editingPelanggaran, setEditingPelanggaran] = useState<any | null>(null);
  const [editingPrestasi, setEditingPrestasi] = useState<any | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'pelanggaran' | 'prestasi'; id: string; label: string } | null>(null);

  // Form states
  const [pelanggaranForm, setPelanggaranForm] = useState({
    namaSiswa: '',
    kelas: kelasList[0]?.namaKelas || 'X DKV 1',
    tanggal: new Date().toISOString().slice(0, 10),
    pelanggaran: '',
    poin: 5,
    tindakan: 'Teguran Lisan & Pembinaan Wali Kelas',
    tindakLanjut: 'Pencatatan buku kedisiplinan dan koordinasi Guru BK'
  });

  const [prestasiForm, setPrestasiForm] = useState({
    namaSiswa: '',
    kelas: kelasList[0]?.namaKelas || 'X DKV 1',
    tanggal: new Date().toISOString().slice(0, 10),
    bidang: 'Desain Komunikasi Visual / Kreatif',
    tingkat: 'Tingkat Kabupaten',
    juara: 'Juara 1',
    keterangan: 'Lomba Desain Poster Tingkat Pelajar SMK Kab. Tasikmalaya'
  });

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const safeList = agendaKelasList || [];
  const allPelanggaran = useMemo(() => {
    return safeList.flatMap(ak => 
      (ak.pelanggaranList || []).map(p => {
        const item = p as typeof p & { kelas?: string; tanggal?: string };
        return { 
          ...p, 
          kelas: item.kelas || ak.kelas, 
          tanggal: item.tanggal || ak.tanggal 
        };
      })
    );
  }, [safeList]);

  const allPrestasi = useMemo(() => {
    return safeList.flatMap(ak => 
      (ak.prestasiList || []).map(p => {
        const item = p as typeof p & { kelas?: string };
        return { 
          ...p, 
          kelas: item.kelas || ak.kelas,
          tanggal: p.tanggal || ak.tanggal
        };
      })
    );
  }, [safeList]);

  const filteredPelanggaran = useMemo(() => {
    return allPelanggaran.filter(p => {
      const matchKelas = selectedKelas === 'Semua' || p.kelas === selectedKelas;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        (p.namaSiswa && p.namaSiswa.toLowerCase().includes(q)) ||
        (p.pelanggaran && p.pelanggaran.toLowerCase().includes(q)) ||
        (p.tindakan && p.tindakan.toLowerCase().includes(q));
      return matchKelas && matchQuery;
    });
  }, [allPelanggaran, selectedKelas, searchQuery]);

  const filteredPrestasi = useMemo(() => {
    return allPrestasi.filter(pr => {
      const matchKelas = selectedKelas === 'Semua' || pr.kelas === selectedKelas;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        (pr.namaSiswa && pr.namaSiswa.toLowerCase().includes(q)) ||
        (pr.bidang && pr.bidang.toLowerCase().includes(q)) ||
        (pr.keterangan && pr.keterangan.toLowerCase().includes(q)) ||
        (pr.juara && pr.juara.toLowerCase().includes(q));
      return matchKelas && matchQuery;
    });
  }, [allPrestasi, selectedKelas, searchQuery]);

  // Students in selected class for autocomplete
  const currentClassStudents = useMemo(() => {
    const targetKelas = activeTab === 'pelanggaran' ? pelanggaranForm.kelas : prestasiForm.kelas;
    return siswaList.filter(s => s.kelas === targetKelas);
  }, [siswaList, activeTab, pelanggaranForm.kelas, prestasiForm.kelas]);

  const handleStartEditPelanggaran = (p: any) => {
    setEditingPelanggaran(p);
    setPelanggaranForm({
      namaSiswa: p.namaSiswa || '',
      kelas: p.kelas || kelasList[0]?.namaKelas || 'X DKV 1',
      tanggal: p.tanggal || new Date().toISOString().slice(0, 10),
      pelanggaran: p.pelanggaran || '',
      poin: Number(p.poin) || 5,
      tindakan: p.tindakan || '',
      tindakLanjut: p.tindakLanjut || ''
    });
    setShowAddPelanggaran(true);
  };

  const handleStartEditPrestasi = (pr: any) => {
    setEditingPrestasi(pr);
    setPrestasiForm({
      namaSiswa: pr.namaSiswa || '',
      kelas: pr.kelas || kelasList[0]?.namaKelas || 'X DKV 1',
      tanggal: pr.tanggal || new Date().toISOString().slice(0, 10),
      bidang: pr.bidang || 'Desain Komunikasi Visual / Kreatif',
      tingkat: pr.tingkat || 'Tingkat Kabupaten',
      juara: pr.juara || 'Juara 1',
      keterangan: pr.keterangan || ''
    });
    setShowAddPrestasi(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'pelanggaran') {
      Storage.deletePelanggaran(deleteTarget.id);
      toast.success(`Catatan pelanggaran ${deleteTarget.label} berhasil dihapus!`);
    } else {
      Storage.deletePrestasi(deleteTarget.id);
      toast.success(`Catatan prestasi ${deleteTarget.label} berhasil dihapus!`);
    }
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    if (onRefresh) onRefresh();
  };

  const handleSavePelanggaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelanggaranForm.namaSiswa.trim() || !pelanggaranForm.pelanggaran.trim()) {
      showAlert.error('Data Belum Lengkap', 'Nama siswa dan bentuk pelanggaran wajib diisi.');
      return;
    }

    if (editingPelanggaran) {
      Storage.updatePelanggaran(editingPelanggaran.id, {
        namaSiswa: pelanggaranForm.namaSiswa.trim(),
        pelanggaran: pelanggaranForm.pelanggaran.trim(),
        poin: Number(pelanggaranForm.poin) || 5,
        tindakan: pelanggaranForm.tindakan.trim(),
        tindakLanjut: pelanggaranForm.tindakLanjut.trim()
      });
      toast.success(`Catatan pelanggaran ${pelanggaranForm.namaSiswa} berhasil diperbarui!`);
      setEditingPelanggaran(null);
    } else {
      Storage.addPelanggaran({
        namaSiswa: pelanggaranForm.namaSiswa.trim(),
        kelas: pelanggaranForm.kelas,
        tanggal: pelanggaranForm.tanggal,
        pelanggaran: pelanggaranForm.pelanggaran.trim(),
        poin: Number(pelanggaranForm.poin) || 5,
        tindakan: pelanggaranForm.tindakan.trim(),
        tindakLanjut: pelanggaranForm.tindakLanjut.trim()
      });
      toast.success(`Catatan pelanggaran ${pelanggaranForm.namaSiswa} telah dicatat.`);
    }

    setShowAddPelanggaran(false);
    setPelanggaranForm({
      namaSiswa: '',
      kelas: kelasList[0]?.namaKelas || 'X DKV 1',
      tanggal: new Date().toISOString().slice(0, 10),
      pelanggaran: '',
      poin: 5,
      tindakan: 'Teguran Lisan & Pembinaan Wali Kelas',
      tindakLanjut: 'Pencatatan buku kedisiplinan dan koordinasi Guru BK'
    });
    if (onRefresh) onRefresh();
  };

  const handleSavePrestasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prestasiForm.namaSiswa.trim() || !prestasiForm.keterangan.trim()) {
      showAlert.error('Data Belum Lengkap', 'Nama siswa dan keterangan prestasi wajib diisi.');
      return;
    }

    if (editingPrestasi) {
      Storage.updatePrestasi(editingPrestasi.id, {
        namaSiswa: prestasiForm.namaSiswa.trim(),
        bidang: prestasiForm.bidang.trim(),
        tingkat: prestasiForm.tingkat.trim() as any,
        juara: prestasiForm.juara.trim(),
        tanggal: prestasiForm.tanggal,
        keterangan: prestasiForm.keterangan.trim()
      });
      toast.success(`Catatan prestasi ${prestasiForm.namaSiswa} berhasil diperbarui!`);
      setEditingPrestasi(null);
    } else {
      Storage.addPrestasi({
        namaSiswa: prestasiForm.namaSiswa.trim(),
        kelas: prestasiForm.kelas,
        tanggal: prestasiForm.tanggal,
        bidang: prestasiForm.bidang.trim(),
        tingkat: prestasiForm.tingkat.trim(),
        juara: prestasiForm.juara.trim(),
        keterangan: prestasiForm.keterangan.trim()
      });
      toast.success(`Raihan prestasi ${prestasiForm.namaSiswa} (${prestasiForm.juara}) berhasil disimpan.`);
    }

    setShowAddPrestasi(false);
    setPrestasiForm({
      namaSiswa: '',
      kelas: kelasList[0]?.namaKelas || 'X DKV 1',
      tanggal: new Date().toISOString().slice(0, 10),
      bidang: 'Desain Komunikasi Visual / Kreatif',
      tingkat: 'Tingkat Kabupaten',
      juara: 'Juara 1',
      keterangan: 'Lomba Desain Poster Tingkat Pelajar SMK Kab. Tasikmalaya'
    });
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Kedisiplinan, Pelanggaran & Prestasi Siswa</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoring rekapitulasi poin kedisiplinan serta apresiasi rekam jejak prestasi siswa SMKN Bojonggambir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 p-1 shadow-xs">
            <button
              onClick={() => setActiveTab('pelanggaran')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'pelanggaran' 
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pelanggaran ({allPelanggaran.length})
            </button>
            <button
              onClick={() => setActiveTab('prestasi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'prestasi' 
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Prestasi ({allPrestasi.length})
            </button>
          </div>

          {activeTab === 'pelanggaran' ? (
            <button
              onClick={() => {
                setEditingPelanggaran(null);
                setPelanggaranForm({
                  namaSiswa: '',
                  kelas: selectedKelas !== 'Semua' ? selectedKelas : (kelasList[0]?.namaKelas || 'X DKV 1'),
                  tanggal: new Date().toISOString().slice(0, 10),
                  pelanggaran: '',
                  poin: 5,
                  tindakan: 'Teguran Lisan & Pembinaan Wali Kelas',
                  tindakLanjut: 'Pencatatan buku kedisiplinan dan koordinasi Guru BK'
                });
                setShowAddPelanggaran(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Catat Pelanggaran</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingPrestasi(null);
                setPrestasiForm({
                  namaSiswa: '',
                  kelas: selectedKelas !== 'Semua' ? selectedKelas : (kelasList[0]?.namaKelas || 'X DKV 1'),
                  tanggal: new Date().toISOString().slice(0, 10),
                  bidang: 'Desain Komunikasi Visual / Kreatif',
                  tingkat: 'Tingkat Kabupaten',
                  juara: 'Juara 1',
                  keterangan: 'Lomba Desain Poster Tingkat Pelajar SMK Kab. Tasikmalaya'
                });
                setShowAddPrestasi(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Catat Prestasi</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'pelanggaran' ? 'Cari nama siswa, jenis pelanggaran, atau tindakan...' : 'Cari nama siswa, bidang lomba, atau juara...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full sm:w-44 py-1.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Semua">Semua Rombel / Kelas</option>
            {kelasList.map(k => (
              <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'pelanggaran' ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Nama Siswa / Rombel</th>
                  <th className="p-3.5">Bentuk Pelanggaran</th>
                  <th className="p-3.5">Poin Disiplin</th>
                  <th className="p-3.5">Tindakan Pembinaan</th>
                  <th className="p-3.5">Rencana Tindak Lanjut</th>
                  <th className="p-3.5 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPelanggaran.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Tidak ada data pelanggaran kedisiplinan yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredPelanggaran.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-medium whitespace-nowrap text-slate-500">{p.tanggal}</td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 dark:text-white block">{p.namaSiswa}</span>
                        <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">{p.kelas}</span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">{p.pelanggaran}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          +{p.poin} Poin
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">{p.tindakan || '-'}</td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{p.tindakLanjut || '-'}</td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditPelanggaran(p)}
                            className="p-1.5 rounded-lg text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                            title="Edit Catatan"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget({
                                type: 'pelanggaran',
                                id: p.id,
                                label: `${p.namaSiswa} (${p.pelanggaran})`
                              });
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="h-4 w-4" />
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPrestasi.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
              Tidak ada data raihan prestasi siswa yang ditemukan.
            </div>
          ) : (
            filteredPrestasi.map((pr, i) => (
              <div 
                key={i} 
                className="p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/40 to-white dark:from-slate-900 dark:to-slate-900/90 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" /> {pr.tingkat} • {pr.tanggal}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                      {pr.namaSiswa} <span className="text-teal-600 font-semibold text-xs">({pr.kelas})</span>
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl bg-amber-500 text-white font-black text-xs shadow-xs">
                      {pr.juara}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditPrestasi(pr)}
                        className="p-1 rounded-lg text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/40 transition cursor-pointer"
                        title="Edit Prestasi"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget({
                            type: 'prestasi',
                            id: pr.id,
                            label: `${pr.namaSiswa} (${pr.juara} ${pr.bidang})`
                          });
                          setDeleteModalOpen(true);
                        }}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Hapus Prestasi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-100 dark:border-slate-800 text-xs">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    <span className="text-slate-400">Bidang:</span> {pr.bidang}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">
                    {pr.keterangan}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Add Pelanggaran */}
      {showAddPelanggaran && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <span>{editingPelanggaran ? 'Edit Catatan Pelanggaran Siswa' : 'Form Pencatatan Pelanggaran Siswa'}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddPelanggaran(false);
                  setEditingPelanggaran(null);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePelanggaran} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Kelas / Rombel</label>
                  <select
                    value={pelanggaranForm.kelas}
                    onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, kelas: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                  >
                    {kelasList.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Tanggal Kejadian</label>
                  <input
                    type="date"
                    value={pelanggaranForm.tanggal}
                    onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, tanggal: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Nama Siswa</label>
                <input
                  type="text"
                  list="siswa-pelanggaran-list"
                  placeholder="Ketik atau pilih nama siswa..."
                  value={pelanggaranForm.namaSiswa}
                  onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, namaSiswa: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                  required
                />
                <datalist id="siswa-pelanggaran-list">
                  {currentClassStudents.map(s => (
                    <option key={s.id} value={s.nama}>{s.nis} - {s.nama}</option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Bentuk Pelanggaran</label>
                  <input
                    type="text"
                    placeholder="Contoh: Datang terlambat > 15 menit, seragam tidak lengkap"
                    value={pelanggaranForm.pelanggaran}
                    onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, pelanggaran: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Poin Pelanggaran</label>
                  <select
                    value={pelanggaranForm.poin}
                    onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, poin: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value={5}>5 Poin (Ringan)</option>
                    <option value={10}>10 Poin (Sedang)</option>
                    <option value={15}>15 Poin (Sedang)</option>
                    <option value={25}>25 Poin (Berat)</option>
                    <option value={50}>50 Poin (Sangat Berat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Tindakan Pembinaan</label>
                <input
                  type="text"
                  value={pelanggaranForm.tindakan}
                  onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, tindakan: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Tindak Lanjut</label>
                <input
                  type="text"
                  value={pelanggaranForm.tindakLanjut}
                  onChange={(e) => setPelanggaranForm({ ...pelanggaranForm, tindakLanjut: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPelanggaran(false);
                    setEditingPelanggaran(null);
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-5 py-2 font-bold text-white shadow-xs cursor-pointer"
                >
                  {editingPelanggaran ? 'Simpan Perubahan' : 'Simpan Pelanggaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Prestasi */}
      {showAddPrestasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span>{editingPrestasi ? 'Edit Catatan Prestasi & Kejuaraan Siswa' : 'Form Catatan Prestasi & Kejuaraan Siswa'}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddPrestasi(false);
                  setEditingPrestasi(null);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSavePrestasi} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Kelas / Rombel</label>
                  <select
                    value={prestasiForm.kelas}
                    onChange={(e) => setPrestasiForm({ ...prestasiForm, kelas: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                  >
                    {kelasList.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Tanggal Kejuaraan</label>
                  <input
                    type="date"
                    value={prestasiForm.tanggal}
                    onChange={(e) => setPrestasiForm({ ...prestasiForm, tanggal: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Nama Siswa</label>
                <input
                  type="text"
                  list="siswa-prestasi-list"
                  placeholder="Ketik atau pilih nama siswa..."
                  value={prestasiForm.namaSiswa}
                  onChange={(e) => setPrestasiForm({ ...prestasiForm, namaSiswa: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                  required
                />
                <datalist id="siswa-prestasi-list">
                  {currentClassStudents.map(s => (
                    <option key={s.id} value={s.nama}>{s.nis} - {s.nama}</option>
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Juara / Raihan</label>
                  <select
                    value={prestasiForm.juara}
                    onChange={(e) => setPrestasiForm({ ...prestasiForm, juara: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="Juara 1">Juara 1</option>
                    <option value="Juara 2">Juara 2</option>
                    <option value="Juara 3">Juara 3</option>
                    <option value="Harapan 1">Harapan 1</option>
                    <option value="Finalis">Finalis</option>
                    <option value="Peserta Terbaik">Peserta Terbaik</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Tingkat</label>
                  <select
                    value={prestasiForm.tingkat}
                    onChange={(e) => setPrestasiForm({ ...prestasiForm, tingkat: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="Tingkat Sekolah">Tingkat Sekolah</option>
                    <option value="Tingkat Kecamatan">Tingkat Kecamatan</option>
                    <option value="Tingkat Kabupaten">Tingkat Kabupaten</option>
                    <option value="Tingkat Wilayah / Priangan">Tingkat Wilayah / Priangan</option>
                    <option value="Tingkat Provinsi">Tingkat Provinsi</option>
                    <option value="Tingkat Nasional">Tingkat Nasional</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Bidang Lomba</label>
                  <input
                    type="text"
                    value={prestasiForm.bidang}
                    onChange={(e) => setPrestasiForm({ ...prestasiForm, bidang: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Keterangan / Nama Kejuaraan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan lengkap acara atau penyelenggara..."
                  value={prestasiForm.keterangan}
                  onChange={(e) => setPrestasiForm({ ...prestasiForm, keterangan: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPrestasi(false);
                    setEditingPrestasi(null);
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 px-5 py-2 font-bold text-white shadow-xs cursor-pointer"
                >
                  {editingPrestasi ? 'Simpan Perubahan' : 'Simpan Prestasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title={deleteTarget?.type === 'pelanggaran' ? 'Hapus Catatan Pelanggaran' : 'Hapus Catatan Prestasi'}
        message={`Apakah Anda yakin ingin menghapus catatan ${deleteTarget?.label}? Data yang dihapus tidak dapat dipulihkan.`}
        confirmLabel={deleteTarget?.type === 'pelanggaran' ? 'Ya, Hapus Pelanggaran' : 'Ya, Hapus Prestasi'}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

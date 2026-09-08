import React, { useState, useMemo } from 'react';
import { 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Boxes, 
  Building, 
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';
import { AgendaKelasItem, KelasItem } from '../../types';
import { Storage } from '../../lib/storage';
import { showAlert } from '../../lib/alerts';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import { toast } from 'sonner';

interface InventarisViewProps {
  agendaKelasList: AgendaKelasItem[];
  kelasList?: KelasItem[];
  onRefresh?: () => void;
}

export const InventarisView: React.FC<InventarisViewProps> = ({ 
  agendaKelasList = [],
  kelasList = [],
  onRefresh
}) => {
  const [selectedKelas, setSelectedKelas] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; barang: string; kelas: string } | null>(null);

  // Form state for adding new inventory item
  const [formData, setFormData] = useState({
    kelas: kelasList[0]?.namaKelas || 'X DKV 1',
    barang: '',
    jumlah: 1,
    baik: 1,
    rusakRingan: 0,
    rusakBerat: 0,
    keterangan: ''
  });

  const safeList = agendaKelasList || [];
  const allInventaris = useMemo(() => {
    return safeList.flatMap(ak => 
      (ak.inventarisList || []).map(inv => {
        const item = inv as typeof inv & { kelas?: string };
        return { 
          ...inv, 
          kelas: item.kelas || ak.kelas 
        };
      })
    );
  }, [safeList]);

  const filteredInventaris = useMemo(() => {
    return allInventaris.filter(inv => {
      const matchKelas = selectedKelas === 'Semua' || inv.kelas === selectedKelas;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q || 
        inv.barang.toLowerCase().includes(q) ||
        (inv.keterangan && inv.keterangan.toLowerCase().includes(q));
      return matchKelas && matchQuery;
    });
  }, [allInventaris, selectedKelas, searchQuery]);

  // Aggregate KPI stats
  const stats = useMemo(() => {
    let totalUnit = 0;
    let totalBaik = 0;
    let totalRusakRingan = 0;
    let totalRusakBerat = 0;

    allInventaris.forEach(i => {
      totalUnit += Number(i.jumlah) || 0;
      totalBaik += Number(i.baik) || 0;
      totalRusakRingan += Number(i.rusakRingan) || 0;
      totalRusakBerat += Number(i.rusakBerat) || 0;
    });

    return { totalUnit, totalBaik, totalRusakRingan, totalRusakBerat };
  }, [allInventaris]);

  const handleStartEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      kelas: item.kelas || kelasList[0]?.namaKelas || 'X DKV 1',
      barang: item.barang,
      jumlah: Number(item.jumlah) || 1,
      baik: Number(item.baik) || 0,
      rusakRingan: Number(item.rusakRingan) || 0,
      rusakBerat: Number(item.rusakBerat) || 0,
      keterangan: item.keterangan || ''
    });
    setShowAddModal(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    Storage.deleteInventaris(deleteTarget.id || deleteTarget.barang);
    toast.success(`Barang ${deleteTarget.barang} berhasil dihapus!`);
    setDeleteModalOpen(false);
    setDeleteTarget(null);
    if (onRefresh) onRefresh();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.barang.trim()) {
      showAlert.error('Nama Barang Wajib Diisi', 'Silakan masukkan nama barang atau sarana kelas.');
      return;
    }

    const jml = Number(formData.jumlah) || 0;
    const bk = Number(formData.baik) || 0;
    const rr = Number(formData.rusakRingan) || 0;
    const rb = Number(formData.rusakBerat) || 0;

    if (bk + rr + rb > jml) {
      showAlert.warning('Periksa Jumlah Kondisi', 'Jumlah kondisi (Baik + Rusak Ringan + Rusak Berat) tidak boleh melebihi Total Unit.');
      return;
    }

    if (editingItem) {
      Storage.updateInventaris(editingItem.id || editingItem.barang, {
        barang: formData.barang.trim(),
        jumlah: jml,
        baik: bk,
        rusakRingan: rr,
        rusakBerat: rb,
        keterangan: formData.keterangan.trim(),
        kelas: formData.kelas
      });
      toast.success(`Data inventaris ${formData.barang} berhasil diperbarui!`);
      setEditingItem(null);
    } else {
      Storage.addInventaris({
        kelas: formData.kelas,
        barang: formData.barang.trim(),
        jumlah: jml,
        baik: bk,
        rusakRingan: rr,
        rusakBerat: rb,
        keterangan: formData.keterangan.trim()
      });
      toast.success(`Data inventaris ${formData.barang} berhasil ditambahkan!`);
    }

    setShowAddModal(false);
    setFormData({
      kelas: kelasList[0]?.namaKelas || 'X DKV 1',
      barang: '',
      jumlah: 1,
      baik: 1,
      rusakRingan: 0,
      rusakBerat: 0,
      keterangan: ''
    });
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#163A5F] dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-[#2563EB]" />
            <span>Inventaris Kelas & Sarana Prasarana Ruangan</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoring kondisi sarana pembelajaran kelas, RPS DKV, dan Bengkel APHP SMKN Bojonggambir.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingItem(null);
            setFormData({
              kelas: selectedKelas !== 'Semua' ? selectedKelas : (kelasList[0]?.namaKelas || 'X DKV 1'),
              barang: '',
              jumlah: 1,
              baik: 1,
              rusakRingan: 0,
              rusakBerat: 0,
              keterangan: ''
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Inventaris Barang</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Unit Barang</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#163A5F] dark:text-white">{stats.totalUnit}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Tercatat di semua ruangan</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kondisi Baik</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#16A34A] dark:text-emerald-400">{stats.totalBaik}</div>
          <span className="text-[10px] text-[#16A34A] mt-1 block font-medium">Siap digunakan KBM</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rusak Ringan</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#F59E0B] dark:text-amber-400">{stats.totalRusakRingan}</div>
          <span className="text-[10px] text-[#F59E0B] mt-1 block font-medium">Perlu perbaikan berkala</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rusak Berat</span>
            <div className="h-9 w-9 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-[#DC2626] dark:text-red-400">{stats.totalRusakBerat}</div>
          <span className="text-[10px] text-[#DC2626] mt-1 block font-medium">Perlu penggantian/afkir</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama barang atau catatan inventaris..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="w-full sm:w-48 py-2 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="Semua">Semua Ruangan / Kelas</option>
            {kelasList.map(k => (
              <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-[#F5F7FA] dark:bg-slate-800/80 font-bold uppercase text-[11px] text-[#163A5F] dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5">Ruang / Kelas</th>
                <th className="p-3.5">Nama Barang & Sarana</th>
                <th className="p-3.5 text-center">Total Unit</th>
                <th className="p-3.5 text-center">Kondisi Baik</th>
                <th className="p-3.5 text-center">Rusak Ringan</th>
                <th className="p-3.5 text-center">Rusak Berat</th>
                <th className="p-3.5">Keterangan / Posisi</th>
                <th className="p-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInventaris.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data inventaris sarana yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredInventaris.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-[#EFF6FF] dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-[#163A5F] dark:text-blue-300 whitespace-nowrap">
                      {inv.kelas}
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                      {inv.barang}
                    </td>
                    <td className="p-3.5 text-center font-bold text-[#163A5F] dark:text-white">
                      {inv.jumlah}
                    </td>
                    <td className="p-3.5 text-center font-bold text-[#16A34A] dark:text-emerald-400">
                      {inv.baik}
                    </td>
                    <td className="p-3.5 text-center font-bold text-[#F59E0B] dark:text-amber-400">
                      {inv.rusakRingan}
                    </td>
                    <td className="p-3.5 text-center font-bold text-[#DC2626] dark:text-red-400">
                      {inv.rusakBerat}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                      {inv.keterangan || '-'}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(inv)}
                          className="p-1.5 rounded-lg text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                          title="Edit Barang"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({
                              id: inv.id || inv.barang,
                              barang: inv.barang,
                              kelas: inv.kelas
                            });
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Hapus Barang"
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

      {/* Modal Add Inventaris */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-[#163A5F] dark:text-white text-sm flex items-center gap-2">
                <Package className="h-5 w-5 text-[#2563EB]" />
                <span>{editingItem ? 'Edit Inventaris Sarana / Barang' : 'Form Tambah Inventaris Sarana / Ruangan'}</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Ruang / Kelas</label>
                <select
                  value={formData.kelas}
                  onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  {kelasList.map(k => (
                    <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Nama Barang / Sarana</label>
                <input
                  type="text"
                  placeholder="Contoh: Meja Siswa, Proyektor EPSON, PC Praktik DKV, Blender Industri APHP"
                  value={formData.barang}
                  onChange={(e) => setFormData({ ...formData, barang: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Total Unit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800 font-bold text-[#163A5F] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#16A34A]">Baik</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.baik}
                    onChange={(e) => setFormData({ ...formData, baik: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800 font-bold text-[#16A34A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#F59E0B]">Rusak Ringan</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rusakRingan}
                    onChange={(e) => setFormData({ ...formData, rusakRingan: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800 font-bold text-[#F59E0B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-[#DC2626]">Rusak Berat</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.rusakBerat}
                    onChange={(e) => setFormData({ ...formData, rusakBerat: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800 font-bold text-[#DC2626] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Keterangan / Kondisi Khusus</label>
                <textarea
                  rows={2}
                  placeholder="Catatan tambahan spesifikasi atau perbaikan..."
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingItem(null);
                  }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2 font-bold text-white shadow-2xs cursor-pointer"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Simpan Barang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Hapus Inventaris Barang"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.barang}" dari inventaris ruangan ${deleteTarget?.kelas}? Data yang dihapus tidak dapat dikembalikan.`}
        confirmLabel="Ya, Hapus Barang"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { GraduationCap, Users, School, BookOpen, FileSpreadsheet, Plus, Search, Trash2, Edit, RotateCcw, Filter, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { GuruItem, SiswaItem, KelasItem, JurusanItem, MapelItem } from '../../types';
import { exportGuruToExcel, exportSiswaToExcel } from '../../lib/excelExport';
import { Storage } from '../../lib/storage';
import { SiswaFormModal } from './SiswaFormModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface MasterDataViewProps {
  guruList: GuruItem[];
  siswaList: SiswaItem[];
  kelasList: KelasItem[];
  jurusanList: JurusanItem[];
  mapelList: MapelItem[];
  onRefresh?: () => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  guruList,
  siswaList,
  kelasList,
  jurusanList,
  mapelList,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'guru' | 'siswa' | 'kelas' | 'jurusan' | 'mapel'>('guru');
  const [searchTerm, setSearchTerm] = useState('');

  // States for Siswa CRUD
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSiswaFormOpen, setIsSiswaFormOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<SiswaItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingSiswa, setDeletingSiswa] = useState<SiswaItem | null>(null);

  const handleSyncMasterData = () => {
    Storage.syncAllMasterAndJadwal();
    toast.success('Sinkronisasi menyeluruh Guru, Mapel, Kelas, Ruang, dan Jadwal berhasil dilakukan!');
    onRefresh?.();
  };

  // Tambah Siswa Baru
  const handleOpenAddSiswa = () => {
    setEditingSiswa(null);
    setIsSiswaFormOpen(true);
  };

  // Edit Siswa
  const handleOpenEditSiswa = (siswa: SiswaItem) => {
    setEditingSiswa(siswa);
    setIsSiswaFormOpen(true);
  };

  // Simpan Siswa (Tambah / Edit)
  const handleSaveSiswa = (siswaData: SiswaItem) => {
    let updated: SiswaItem[];
    const isEdit = siswaList.some(s => s.id === siswaData.id);
    if (isEdit) {
      updated = siswaList.map(s => (s.id === siswaData.id ? siswaData : s));
      Storage.logAudit('UPDATE_SISWA', `Memperbarui profil siswa: ${siswaData.nama} (${siswaData.nis}) - Kelas ${siswaData.kelas}`);
      toast.success(`Data siswa ${siswaData.nama} berhasil diperbarui!`);
    } else {
      updated = [siswaData, ...siswaList];
      Storage.logAudit('ADD_SISWA', `Menambahkan siswa baru: ${siswaData.nama} (${siswaData.nis}) - Kelas ${siswaData.kelas}`);
      toast.success(`Siswa baru ${siswaData.nama} berhasil ditambahkan!`);
    }
    Storage.saveSiswa(updated);
    setIsSiswaFormOpen(false);
    setEditingSiswa(null);
    onRefresh?.();
  };

  // Buka Konfirmasi Hapus
  const handleOpenDeleteSiswa = (siswa: SiswaItem) => {
    setDeletingSiswa(siswa);
    setIsDeleteModalOpen(true);
  };

  // Konfirmasi Hapus Siswa
  const handleConfirmDeleteSiswa = () => {
    if (!deletingSiswa) return;
    const updated = siswaList.filter(s => s.id !== deletingSiswa.id);
    Storage.saveSiswa(updated);
    Storage.logAudit('DELETE_SISWA', `Menghapus siswa: ${deletingSiswa.nama} (${deletingSiswa.nis}) - Kelas ${deletingSiswa.kelas}`);
    toast.success(`Data siswa ${deletingSiswa.nama} berhasil dihapus.`);
    setIsDeleteModalOpen(false);
    setDeletingSiswa(null);
    onRefresh?.();
  };

  // Filter Siswa
  const filteredSiswaList = siswaList.filter(s => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm) ||
      (s.nisn && s.nisn.includes(searchTerm)) ||
      s.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.namaOrtu && s.namaOrtu.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchKelas = filterKelas === 'all' || s.kelas === filterKelas;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;

    return matchSearch && matchKelas && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-[#163A5F] dark:text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-[#2563EB]" />
            <span>Data Master Sekolah & Database Akademik</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kelola data Guru, Siswa, Kelas, Konsentrasi Keahlian / Jurusan, dan Mata Pelajaran SMK.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncMasterData}
            title="Sinkronkan data Guru, Mapel, Kelas, Ruang, dan Jadwal dengan data resmi terbaru"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-[#163A5F] dark:text-slate-200 shadow-2xs hover:bg-[#EFF6FF] transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-[#2563EB]" />
            <span>Sinkronkan Master & Jadwal</span>
          </button>

          {activeTab === 'guru' && (
            <button
              onClick={() => exportGuruToExcel(guruList)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-[#EFF6FF] hover:text-[#163A5F] transition cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export Excel Guru</span>
            </button>
          )}

          {activeTab === 'siswa' && (
            <>
              <button
                onClick={handleOpenAddSiswa}
                className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Siswa</span>
              </button>
              <button
                onClick={() => exportSiswaToExcel(siswaList)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-[#EFF6FF] hover:text-[#163A5F] transition cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Export Excel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['guru', 'siswa', 'kelas', 'jurusan', 'mapel'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition cursor-pointer ${
              activeTab === tab
                ? 'bg-[#163A5F] text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#EFF6FF] hover:text-[#163A5F] border border-slate-200 dark:border-slate-700'
            }`}
          >
            {tab === 'guru' && `Data Guru (${guruList.length})`}
            {tab === 'siswa' && `Data Siswa (${siswaList.length})`}
            {tab === 'kelas' && `Data Kelas (${kelasList.length})`}
            {tab === 'jurusan' && `Jurusan (${jurusanList.length})`}
            {tab === 'mapel' && `Mata Pelajaran (${mapelList.length})`}
          </button>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={`Cari data ${activeTab === 'siswa' ? 'siswa (nama, NIS, NISN, orang tua)...' : activeTab}...`}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        {activeTab === 'siswa' && (
          <div className="flex items-center gap-2">
            <select
              value={filterKelas}
              onChange={e => setFilterKelas(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">Semua Kelas ({siswaList.length})</option>
              {kelasList.map(k => (
                <option key={k.id} value={k.namaKelas}>
                  Kelas {k.namaKelas}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Alumni">Alumni / Lulus</option>
              <option value="Pindah">Pindah / Mutasi</option>
            </select>
          </div>
        )}
      </div>

      {/* Data Guru Table */}
      {activeTab === 'guru' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[700px]">
            <thead className="bg-[#F5F7FA] dark:bg-slate-800/80 font-bold uppercase text-[10px] text-[#163A5F] dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 w-10 text-center">No.</th>
                <th className="p-3.5">Nama PTK</th>
                <th className="p-3.5">NIP</th>
                <th className="p-3.5">NUPTK</th>
                <th className="p-3.5 text-center">Kode Mapel</th>
                <th className="p-3.5">Mata Pelajaran / Tugas Administrasi</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {guruList
                .filter(g => g.nama.toLowerCase().includes(searchTerm.toLowerCase()) || g.mapelUtama.toLowerCase().includes(searchTerm.toLowerCase()) || (g.nip && g.nip.includes(searchTerm)))
                .map((g, idx) => (
                <tr key={g.id} className="hover:bg-[#EFF6FF]/30 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3.5 font-bold text-[#163A5F] dark:text-white whitespace-nowrap">{g.nama}</td>
                  <td className="p-3.5 font-mono font-medium whitespace-nowrap text-slate-600">{g.nip || '-'}</td>
                  <td className="p-3.5 font-mono text-slate-500 whitespace-nowrap">{g.nuptk || '-'}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-[#2563EB] dark:text-blue-400">{g.kodeGuru || '-'}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{g.mapelUtama}</td>
                  <td className="p-3.5"><span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#16A34A] text-[10px] font-bold">{g.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Data Siswa Table */}
      {activeTab === 'siswa' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[800px]">
              <thead className="bg-[#F5F7FA] dark:bg-slate-800/80 font-bold uppercase text-[10px] text-[#163A5F] dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5 w-10 text-center">No.</th>
                  <th className="p-3.5">NIS / NISN</th>
                  <th className="p-3.5">Nama Siswa</th>
                  <th className="p-3.5">Kelas & Jurusan</th>
                  <th className="p-3.5">Orang Tua / Kontak</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSiswaList.length > 0 ? (
                  filteredSiswaList.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-[#EFF6FF]/30 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3.5 font-mono whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{s.nis}</div>
                        {s.nisn && s.nisn !== '-' && (
                          <div className="text-[10px] text-slate-400">NISN: {s.nisn}</div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#163A5F] dark:text-white">{s.nama}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              s.gender === 'L'
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {s.gender || 'L'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-bold text-[#2563EB] dark:text-blue-400">{s.kelas}</span>
                        {s.jurusan && (
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={s.jurusan}>
                            {s.jurusan}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="text-slate-700 dark:text-slate-300 font-medium">{s.namaOrtu || '-'}</div>
                        {s.teleponOrtu && s.teleponOrtu !== '-' && (
                          <div className="text-[10px] font-mono text-slate-500">{s.teleponOrtu}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            s.status === 'Aktif'
                              ? 'bg-emerald-50 border-emerald-200 text-[#16A34A] dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                              : s.status === 'Alumni'
                              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-300'
                              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditSiswa(s)}
                            title="Edit Data Siswa"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteSiswa(s)}
                            title="Hapus Data Siswa"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-300 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-700 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Users className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="text-xs">Tidak ada data siswa yang cocok dengan kriteria pencarian atau filter.</p>
                        <button
                          onClick={handleOpenAddSiswa}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Tambah Siswa Baru</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Menampilkan <b>{filteredSiswaList.length}</b> dari total <b>{siswaList.length}</b> siswa</span>
            {filterKelas !== 'all' && (
              <button
                onClick={() => {
                  setFilterKelas('all');
                  setFilterStatus('all');
                  setSearchTerm('');
                }}
                className="text-blue-600 hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Data Kelas */}
      {activeTab === 'kelas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kelasList
            .filter(k => k.namaKelas.toLowerCase().includes(searchTerm.toLowerCase()) || k.waliKelas.toLowerCase().includes(searchTerm.toLowerCase()) || k.ruang.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(k => (
            <div key={k.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 shadow-2xs hover:border-slate-300 transition">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <h3 className="font-bold text-[#163A5F] dark:text-white text-base">{k.namaKelas}</h3>
                <span className="text-xs font-bold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/50">{k.ruang}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Wali Kelas: <b className="text-[#163A5F] dark:text-white">{k.waliKelas}</b></p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Siswa: <b className="text-[#163A5F] dark:text-white">{k.jumlahLaki + k.jumlahPerempuan}</b> ({k.jumlahLaki} L / {k.jumlahPerempuan} P)</p>
            </div>
          ))}
        </div>
      )}

      {/* Data Jurusan */}
      {activeTab === 'jurusan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jurusanList
            .filter(j => j.namaJurusan.toLowerCase().includes(searchTerm.toLowerCase()) || j.kode.toLowerCase().includes(searchTerm.toLowerCase()) || j.kepalaKonsentrasi.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(j => (
            <div key={j.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs hover:border-slate-300 transition">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#163A5F] text-white font-mono text-xs font-bold">{j.kode}</span>
                  <h3 className="font-bold text-[#163A5F] dark:text-white text-base">{j.namaJurusan}</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Kepala Konsentrasi Keahlian: <b className="text-[#163A5F] dark:text-white">{j.kepalaKonsentrasi}</b>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Data Mata Pelajaran Table */}
      {activeTab === 'mapel' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-2xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[650px]">
            <thead className="bg-[#F5F7FA] dark:bg-slate-800/80 font-bold uppercase text-[10px] text-[#163A5F] dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5 w-12 text-center">No.</th>
                <th className="p-3.5 w-24 text-center">Kode</th>
                <th className="p-3.5">Nama Mata Pelajaran</th>
                <th className="p-3.5 w-20 text-center">Fase</th>
                <th className="p-3.5 w-28 text-center">Kelompok</th>
                <th className="p-3.5">Konsentrasi / Jurusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mapelList
                .filter(m => m.namaMapel.toLowerCase().includes(searchTerm.toLowerCase()) || m.kode.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((m, idx) => (
                <tr key={m.id} className="hover:bg-[#EFF6FF]/30 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3.5 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3.5 text-center font-mono font-bold text-[#2563EB] dark:text-blue-400">{m.kode}</td>
                  <td className="p-3.5 font-bold text-[#163A5F] dark:text-white">{m.namaMapel}</td>
                  <td className="p-3.5 text-center font-bold text-slate-700">{m.fase}</td>
                  <td className="p-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      m.kelompok === 'Kejuruan'
                        ? 'bg-amber-50 text-[#F59E0B] border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-blue-50 text-[#2563EB] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}>
                      {m.kelompok}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{m.jurusan || 'Semua Jurusan'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form Tambah / Edit Siswa */}
      <SiswaFormModal
        isOpen={isSiswaFormOpen}
        onClose={() => {
          setIsSiswaFormOpen(false);
          setEditingSiswa(null);
        }}
        onSave={handleSaveSiswa}
        initialData={editingSiswa}
        kelasList={kelasList}
        jurusanList={jurusanList}
        existingSiswaList={siswaList}
      />

      {/* Modal Konfirmasi Hapus Siswa */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Data Siswa"
        message={`Apakah Anda yakin ingin menghapus siswa "${deletingSiswa?.nama}" (${deletingSiswa?.nis}) dari database? Data yang sudah dihapus tidak dapat dipulihkan.`}
        itemName={deletingSiswa ? `${deletingSiswa.nama} - Kelas ${deletingSiswa.kelas}` : undefined}
        itemType="Data Siswa"
        confirmLabel="Ya, Hapus Siswa"
        cancelLabel="Batal"
        onConfirm={handleConfirmDeleteSiswa}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setDeletingSiswa(null);
        }}
      />
    </div>
  );
};


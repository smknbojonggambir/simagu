import React, { useState } from 'react';
import { GraduationCap, Users, School, BookOpen, FileSpreadsheet, Plus, Search, Trash2, Edit } from 'lucide-react';
import { GuruItem, SiswaItem, KelasItem, JurusanItem, MapelItem } from '../../types';
import { exportGuruToExcel, exportSiswaToExcel } from '../../lib/excelExport';

interface MasterDataViewProps {
  guruList: GuruItem[];
  siswaList: SiswaItem[];
  kelasList: KelasItem[];
  jurusanList: JurusanItem[];
  mapelList: MapelItem[];
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  guruList,
  siswaList,
  kelasList,
  jurusanList,
  mapelList
}) => {
  const [activeTab, setActiveTab] = useState<'guru' | 'siswa' | 'kelas' | 'jurusan' | 'mapel'>('guru');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-teal-600" />
            <span>Data Master Sekolah & Database Akademik</span>
          </h2>
          <p className="text-xs text-slate-500">
            Kelola data Guru, Siswa, Kelas, Konsentrasi Keahlian / Jurusan, dan Mata Pelajaran SMK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'guru' && (
            <button
              onClick={() => exportGuruToExcel(guruList)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export Excel Guru</span>
            </button>
          )}
          {activeTab === 'siswa' && (
            <button
              onClick={() => exportSiswaToExcel(siswaList)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              <span>Export Excel Siswa</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['guru', 'siswa', 'kelas', 'jurusan', 'mapel'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-bold rounded-xl capitalize transition ${
              activeTab === tab
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder={`Cari data ${activeTab}...`}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Data Guru Table */}
      {activeTab === 'guru' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 w-10 text-center">No.</th>
                <th className="p-3">Nama PTK</th>
                <th className="p-3">NIP</th>
                <th className="p-3">NUPTK</th>
                <th className="p-3 text-center">Kode Mapel</th>
                <th className="p-3">Mata Pelajaran / Tugas Administrasi</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {guruList
                .filter(g => g.nama.toLowerCase().includes(searchTerm.toLowerCase()) || g.mapelUtama.toLowerCase().includes(searchTerm.toLowerCase()) || (g.nip && g.nip.includes(searchTerm)))
                .map((g, idx) => (
                <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{g.nama}</td>
                  <td className="p-3 font-mono font-medium whitespace-nowrap">{g.nip || '-'}</td>
                  <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{g.nuptk || '-'}</td>
                  <td className="p-3 text-center font-mono font-bold text-teal-600 dark:text-teal-400">{g.kodeGuru || '-'}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{g.mapelUtama}</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-bold">{g.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Data Siswa Table */}
      {activeTab === 'siswa' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">NIS / NISN</th>
                <th className="p-3">Nama Siswa</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Orang Tua / HP</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {siswaList
                .filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || s.nis.includes(searchTerm) || s.kelas.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono">{s.nis} / {s.nisn}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{s.nama}</td>
                  <td className="p-3 font-semibold text-teal-600">{s.kelas}</td>
                  <td className="p-3">{s.namaOrtu} ({s.teleponOrtu})</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Data Kelas */}
      {activeTab === 'kelas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kelasList
            .filter(k => k.namaKelas.toLowerCase().includes(searchTerm.toLowerCase()) || k.waliKelas.toLowerCase().includes(searchTerm.toLowerCase()) || k.ruang.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(k => (
            <div key={k.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{k.namaKelas}</h3>
                <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-lg border border-teal-200/50 dark:border-teal-800/50">{k.ruang}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Wali Kelas: <b className="text-slate-900 dark:text-white">{k.waliKelas}</b></p>
              <p className="text-xs text-slate-600 dark:text-slate-400">Siswa: <b className="text-slate-900 dark:text-white">{k.jumlahLaki + k.jumlahPerempuan}</b> ({k.jumlahLaki} L / {k.jumlahPerempuan} P)</p>
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
            <div key={j.id} className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-mono text-xs font-bold">{j.kode}</span>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{j.namaJurusan}</h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Kepala Konsentrasi Keahlian: <b className="text-slate-900 dark:text-white">{j.kepalaKonsentrasi}</b>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Data Mata Pelajaran Table */}
      {activeTab === 'mapel' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[650px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 w-12 text-center">No.</th>
                <th className="p-3 w-24 text-center">Kode</th>
                <th className="p-3">Nama Mata Pelajaran</th>
                <th className="p-3 w-20 text-center">Fase</th>
                <th className="p-3 w-28 text-center">Kelompok</th>
                <th className="p-3">Konsentrasi / Jurusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {mapelList
                .filter(m => m.namaMapel.toLowerCase().includes(searchTerm.toLowerCase()) || m.kode.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((m, idx) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-3 text-center font-mono font-bold text-teal-600 dark:text-teal-400">{m.kode}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{m.namaMapel}</td>
                  <td className="p-3 text-center font-bold">{m.fase}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.kelompok === 'Kejuruan'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                    }`}>
                      {m.kelompok}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{m.jurusan || 'Semua Jurusan'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

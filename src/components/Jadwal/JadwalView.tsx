import React, { useState } from 'react';
import { Calendar, Clock, MapPin, User, Search, LayoutGrid, Table as TableIcon, Printer } from 'lucide-react';
import { JadwalItem, KelasItem } from '../../types';

interface JadwalViewProps {
  jadwalList: JadwalItem[];
  kelasList: KelasItem[];
}

export const JadwalView: React.FC<JadwalViewProps> = ({ jadwalList = [], kelasList = [] }) => {
  const [selectedHari, setSelectedHari] = useState<string>('Senin');
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  const hariList = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  const safeJadwal = jadwalList || [];

  const filteredJadwal = safeJadwal.filter(j => {
    const matchHari = j.hari.toLowerCase() === selectedHari.toLowerCase();
    const matchKelas = selectedKelas ? j.kelas === selectedKelas : true;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      j.guru.toLowerCase().includes(q) ||
      j.mapel.toLowerCase().includes(q) ||
      j.kelas.toLowerCase().includes(q) ||
      (j.kodeGuru && j.kodeGuru.toLowerCase().includes(q));

    return matchHari && matchKelas && matchSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Inline Print Styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide non-printable elements */
          body * {
            visibility: hidden;
          }
          /* Show only schedule printable area */
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
          .print-border {
            border: 1px solid #333 !important;
          }
          table.print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-top: 12px !important;
          }
          table.print-table th, table.print-table td {
            border: 1px solid #333 !important;
            padding: 6px 10px !important;
            color: black !important;
            font-size: 10pt !important;
          }
          table.print-table th {
            background-color: #f2f2f2 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print-hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-teal-600" />
            <span>Jadwal Pelajaran SMKN Bojonggambir</span>
          </h2>
          <p className="text-xs text-slate-500">
            Sistem Jadwal Pelajaran resmi untuk 10 kelas (X, XI, XII APHP & DKV) TP 2026/2027.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari guru / mapel / kode..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold cursor-pointer"
          >
            <option value="">Semua Kelas (10 Kelas)</option>
            {kelasList.map(k => (
              <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
            ))}
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('card')}
              title="Kartu"
              className={`p-1.5 rounded-md ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 shadow-xs text-teal-600' : 'text-slate-500'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Tabel Matrix"
              className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-xs text-teal-600' : 'text-slate-500'}`}
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-500 text-white shadow-md transition cursor-pointer"
            title="Cetak Tabel Jadwal Pelajaran"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Jadwal</span>
          </button>
        </div>
      </div>

      {/* Hari Bar Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 print-hidden">
        {hariList.map(h => (
          <button
            key={h}
            onClick={() => setSelectedHari(h)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              selectedHari === h
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      {/* Main Container & Printable Area */}
      <div id="printable-jadwal-schedule">
        {/* Print-Only Header */}
        <div className="hidden print:block mb-4 border-b-2 border-black pb-3 text-center">
          <h1 className="text-base font-bold uppercase tracking-wider">SMK NEGERI BOJONGGAMBIR</h1>
          <h2 className="text-sm font-semibold uppercase">Jadwal Pelajaran Minggu Ini — Hari {selectedHari}</h2>
          <p className="text-xs text-slate-700 mt-1">
            Kelas: {selectedKelas || 'Semua Kelas'} | Tahun Pelajaran 2026/2027
          </p>
        </div>

        {/* View Mode: Card (Screen view when card mode active) */}
        {viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print-hidden">
            {filteredJadwal.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 col-span-full text-center">Tidak ada jadwal pelajaran ditemukan pada hari {selectedHari}.</p>
            ) : (
              filteredJadwal.map((j) => (
                <div
                  key={j.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-teal-500 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> JP {j.jp} ({j.waktu})
                    </span>
                    <div className="flex items-center gap-1.5">
                      {j.kodeGuru && (
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                          Kode {j.kodeGuru}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {j.kelas}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {j.mapel}
                  </h3>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-slate-400" /> {j.guru}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {j.ruang}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        {/* View Mode: Table (Visible when Table mode is selected or when printing) */}
        <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-sm ${viewMode === 'card' ? 'hidden print:block' : 'block'}`}>
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[700px] print-table">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">JP & Waktu</th>
                <th className="p-3">Kelas</th>
                <th className="p-3">Mata Pelajaran</th>
                <th className="p-3 text-center">Kode</th>
                <th className="p-3">Guru Pengampu</th>
                <th className="p-3">Ruang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredJadwal.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400">Tidak ada jadwal ditemukan pada hari {selectedHari}.</td>
                </tr>
              ) : (
                filteredJadwal.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-teal-600 dark:text-teal-400 font-bold whitespace-nowrap">JP {j.jp} ({j.waktu})</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">{j.kelas}</td>
                    <td className="p-3 font-semibold">{j.mapel}</td>
                    <td className="p-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">{j.kodeGuru || '-'}</td>
                    <td className="p-3">{j.guru}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{j.ruang}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

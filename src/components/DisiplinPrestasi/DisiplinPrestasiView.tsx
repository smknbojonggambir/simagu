import React, { useState } from 'react';
import { AlertOctagon, Award, ShieldAlert, Plus, CheckCircle2 } from 'lucide-react';
import { AgendaKelasItem } from '../../types';

interface DisiplinPrestasiViewProps {
  agendaKelasList: AgendaKelasItem[];
}

export const DisiplinPrestasiView: React.FC<DisiplinPrestasiViewProps> = ({ agendaKelasList = [] }) => {
  const [activeTab, setActiveTab] = useState<'pelanggaran' | 'prestasi'>('pelanggaran');

  const safeList = agendaKelasList || [];
  const allPelanggaran = safeList.flatMap(ak => (ak.pelanggaranList || []).map(p => ({ ...p, kelas: ak.kelas, tanggal: ak.tanggal })));
  const allPrestasi = safeList.flatMap(ak => (ak.prestasiList || []).map(p => ({ ...p, kelas: ak.kelas })));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-teal-600" />
            <span>Kedisiplinan, Pelanggaran & Prestasi Siswa</span>
          </h2>
          <p className="text-xs text-slate-500">
            Monitoring rekapitulasi poin pelanggaran disiplin dan raihan prestasi siswa SMK.
          </p>
        </div>

        <div className="flex rounded-lg border bg-slate-100 dark:bg-slate-800 p-1">
          <button
            onClick={() => setActiveTab('pelanggaran')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${activeTab === 'pelanggaran' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-sm' : 'text-slate-500'}`}
          >
            Pelanggaran ({allPelanggaran.length})
          </button>
          <button
            onClick={() => setActiveTab('prestasi')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${activeTab === 'prestasi' ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-sm' : 'text-slate-500'}`}
          >
            Prestasi ({allPrestasi.length})
          </button>
        </div>
      </div>

      {activeTab === 'pelanggaran' ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Nama Siswa / Kelas</th>
                <th className="p-3">Pelanggaran</th>
                <th className="p-3">Poin</th>
                <th className="p-3">Tindakan & Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allPelanggaran.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-medium">{p.tanggal}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{p.namaSiswa} <span className="text-teal-600 font-normal">({p.kelas})</span></td>
                  <td className="p-3">{p.pelanggaran}</td>
                  <td className="p-3 font-bold text-rose-600">+{p.poin} Poin</td>
                  <td className="p-3">{p.tindakan} ({p.tindakLanjut})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allPrestasi.map((pr, i) => (
            <div key={i} className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-slate-900 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-600">{pr.tingkat} • {pr.tanggal}</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">{pr.juara}</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{pr.namaSiswa} <span className="text-teal-600 font-medium">({pr.kelas})</span></h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">Bidang: <b>{pr.bidang}</b> - {pr.keterangan}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

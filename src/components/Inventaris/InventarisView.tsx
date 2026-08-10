import React from 'react';
import { Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AgendaKelasItem } from '../../types';

interface InventarisViewProps {
  agendaKelasList: AgendaKelasItem[];
}

export const InventarisView: React.FC<InventarisViewProps> = ({ agendaKelasList = [] }) => {
  const safeList = agendaKelasList || [];
  const allInventaris = safeList.flatMap(ak => (ak.inventarisList || []).map(inv => ({ ...inv, kelas: ak.kelas })));

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Package className="h-6 w-6 text-teal-600" />
          <span>Inventaris Kelas & Sarana Prasarana Lab / Ruangan</span>
        </h2>
        <p className="text-xs text-slate-500">
          Monitoring kondisi barang inventaris kelas (Kondisi Baik, Rusak Ringan, dan Rusak Berat).
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/80 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3">Kelas / Ruang</th>
              <th className="p-3">Nama Barang</th>
              <th className="p-3">Total Unit</th>
              <th className="p-3">Kondisi Baik</th>
              <th className="p-3">Rusak Ringan</th>
              <th className="p-3">Rusak Berat</th>
              <th className="p-3">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {allInventaris.map((inv, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="p-3 font-bold text-teal-600">{inv.kelas}</td>
                <td className="p-3 font-semibold text-slate-900 dark:text-white">{inv.barang}</td>
                <td className="p-3 font-bold">{inv.jumlah}</td>
                <td className="p-3 font-bold text-emerald-600">{inv.baik}</td>
                <td className="p-3 font-bold text-amber-500">{inv.rusakRingan}</td>
                <td className="p-3 font-bold text-rose-500">{inv.rusakBerat}</td>
                <td className="p-3">{inv.keterangan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

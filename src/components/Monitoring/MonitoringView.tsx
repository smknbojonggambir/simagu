import React, { useState } from 'react';
import { Activity, ClipboardCheck, Award, CheckCircle2, Clock, Plus, Star, Camera, Link as LinkIcon, ExternalLink, PenTool, Download } from 'lucide-react';
import { SupervisiRecord, AgendaGuruItem, SchoolSetting, User } from '../../types';
import { Storage } from '../../lib/storage';
import { DigitalSignaturePad } from '../DigitalSignaturePad';
import { ProofUploader } from '../ProofUploader';
import { generateSupervisiPDF } from '../../lib/pdfGenerator';

interface MonitoringViewProps {
  supervisiList: SupervisiRecord[];
  agendaGuruList: AgendaGuruItem[];
  setting: SchoolSetting;
  currentUser: User;
  onRefresh: () => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  supervisiList = [],
  agendaGuruList = [],
  setting,
  currentUser,
  onRefresh
}) => {
  const safeSupervisiList = supervisiList || [];
  const safeAgendaGuruList = agendaGuruList || [];

  const [showAddSupervisi, setShowAddSupervisi] = useState(false);
  const [formData, setFormData] = useState<Partial<SupervisiRecord>>({
    namaGuru: 'Dede Mulyana, S.Kom., Gr.',
    nip: '198807152015041002',
    supervisor: currentUser.nama,
    mapel: 'Pemrograman Web & Perangkat Bergerak',
    kelas: 'XI RPL 1',
    skorPerencanaan: 95,
    skorPelaksanaan: 92,
    skorEvaluasi: 94,
    catatanSupervisor: 'Penguasaan kelas, media digital SIMAGU, serta interaksi PjBL sangat memuaskan.',
    rekomendasi: 'Dapat menjadi Guru Model pengembangan modul berbasis AI.',
  });

  const handleSaveSupervisi = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(formData.skorPerencanaan || 90);
    const pl = Number(formData.skorPelaksanaan || 90);
    const ev = Number(formData.skorEvaluasi || 90);
    const avg = Number(((p + pl + ev) / 3).toFixed(2));

    let predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan' = 'Baik';
    if (avg >= 91) predikat = 'Sangat Baik';
    else if (avg >= 81) predikat = 'Baik';
    else if (avg >= 71) predikat = 'Cukup';
    else predikat = 'Perlu Bimbingan';

    const newSpv: SupervisiRecord = {
      id: 'spv-' + Date.now(),
      nomorSupervisi: `SPV/SMKN1/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${Math.floor(10 + Math.random()*90)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      namaGuru: formData.namaGuru || '',
      nip: formData.nip || '',
      supervisor: currentUser.nama,
      mapel: formData.mapel || '',
      kelas: formData.kelas || '',
      skorPerencanaan: p,
      skorPelaksanaan: pl,
      skorEvaluasi: ev,
      skorAkhir: avg,
      predikat,
      catatanSupervisor: formData.catatanSupervisor || '',
      rekomendasi: formData.rekomendasi || '',
      status: 'Selesai'
    };

    const updatedList = [newSpv, ...safeSupervisiList];
    Storage.saveSupervisi(updatedList);
    Storage.logAudit('CREATE_SUPERVISI', `Membuat Supervisi Akademik untuk ${newSpv.namaGuru} (Skor: ${avg})`);
    setShowAddSupervisi(false);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-teal-600" />
            <span>Monitoring Pembelajaran & Supervisi Akademik</span>
          </h2>
          <p className="text-xs text-slate-500">
            Penilaian kinerja pembelajaran guru oleh Kepala Sekolah / Wakasek Kurikulum.
          </p>
        </div>

        <button
          onClick={() => setShowAddSupervisi(true)}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Nilai Supervisi Guru</span>
        </button>
      </div>

      {/* List Supervisi Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeSupervisiList.map((spv) => (
          <div key={spv.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-sm">
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <span className="text-[10px] font-bold text-teal-600 uppercase">{spv.nomorSupervisi}</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{spv.namaGuru}</h3>
                <p className="text-xs text-slate-500">{spv.mapel} • Kelas {spv.kelas}</p>
              </div>

              <div className="text-right">
                <span className="text-lg font-black text-teal-600 block">{spv.skorAkhir}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">{spv.predikat}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
              <div><span className="text-[10px] text-slate-400 block">Perencanaan</span><b>{spv.skorPerencanaan}</b></div>
              <div><span className="text-[10px] text-slate-400 block">Pelaksanaan</span><b>{spv.skorPelaksanaan}</b></div>
              <div><span className="text-[10px] text-slate-400 block">Evaluasi</span><b>{spv.skorEvaluasi}</b></div>
            </div>

            <div className="text-xs space-y-1">
              <p><b>Catatan:</b> {spv.catatanSupervisor}</p>
              <p><b>Rekomendasi:</b> {spv.rekomendasi}</p>
              <p className="text-[10px] text-slate-400">Supervisor: {spv.supervisor} • {spv.tanggal}</p>

              {/* Photo Proofs & Links */}
              {spv.fotoUrls && spv.fotoUrls.length > 0 && (
                <div className="flex gap-1.5 pt-1">
                  {spv.fotoUrls.slice(0, 3).map((url, idx) => (
                    <img key={idx} src={url} alt={`Bukti ${idx+1}`} className="h-10 w-16 object-cover rounded border border-slate-200" />
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  {spv.driveFolderLink && (
                    <a
                      href={spv.driveFolderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      <LinkIcon className="h-3 w-3" /> Link Modul/Drive <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                  {spv.ttdSupervisor && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Signed Digital
                    </span>
                  )}
                </div>

                <button
                  onClick={() => generateSupervisiPDF(spv, setting)}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] px-2.5 py-1 shadow-xs transition"
                  title="Cetak PDF Supervisi dengan Kop & Logo"
                >
                  <Download className="h-3 w-3" />
                  <span>Cetak PDF</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Supervisi */}
      {showAddSupervisi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase">Form Evaluasi Supervisi Akademik</h3>
            <form onSubmit={handleSaveSupervisi} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold">Nama Guru</label>
                <input
                  type="text"
                  value={formData.namaGuru || ''}
                  onChange={(e) => setFormData({ ...formData, namaGuru: e.target.value })}
                  className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1">Skor Perencanaan</label>
                  <input
                    type="number"
                    value={formData.skorPerencanaan || 90}
                    onChange={(e) => setFormData({ ...formData, skorPerencanaan: Number(e.target.value) })}
                    className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block mb-1">Skor Pelaksanaan</label>
                  <input
                    type="number"
                    value={formData.skorPelaksanaan || 90}
                    onChange={(e) => setFormData({ ...formData, skorPelaksanaan: Number(e.target.value) })}
                    className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block mb-1">Skor Evaluasi</label>
                  <input
                    type="number"
                    value={formData.skorEvaluasi || 90}
                    onChange={(e) => setFormData({ ...formData, skorEvaluasi: Number(e.target.value) })}
                    className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Catatan Supervisor & Rekomendasi</label>
                <textarea
                  value={formData.catatanSupervisor || ''}
                  onChange={(e) => setFormData({ ...formData, catatanSupervisor: e.target.value })}
                  className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800"
                  rows={2}
                  placeholder="Catatan pelaksanaan pembelajaran..."
                />
              </div>

              {/* Upload Selfie / Dokumen Modul Ajar */}
              <ProofUploader
                fotoUrls={formData.fotoUrls}
                dokumenUrl={formData.dokumenUrl}
                driveFolderLink={formData.driveFolderLink}
                onChangePhotos={(urls) => setFormData({ ...formData, fotoUrls: urls })}
                onChangeDocument={(doc) => setFormData({ ...formData, dokumenUrl: doc })}
                onChangeDriveLink={(link) => setFormData({ ...formData, driveFolderLink: link })}
                title="Unggah Foto Selfie Observasi & Link Drive Modul Ajar"
              />

              {/* Tanda Tangan Digital Supervisor */}
              <DigitalSignaturePad
                initialSignature={formData.ttdSupervisor}
                signerName={currentUser.nama}
                onSave={(sig) => setFormData({ ...formData, ttdSupervisor: sig })}
                title="Tanda Tangan Digital Supervisor"
              />

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setShowAddSupervisi(false)} className="rounded-xl border px-4 py-2">Batal</button>
                <button type="submit" className="rounded-xl bg-teal-600 px-5 py-2 font-bold text-white">Simpan Nilai</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

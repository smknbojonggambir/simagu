import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  ClipboardCheck, 
  Award, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Star, 
  Camera, 
  Link as LinkIcon, 
  ExternalLink, 
  PenTool, 
  Download,
  Search,
  Filter,
  Users,
  Eye,
  X,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { SupervisiRecord, AgendaGuruItem, SchoolSetting, User, GuruItem, KelasItem, MapelItem } from '../../types';
import { Storage } from '../../lib/storage';
import { DigitalSignaturePad } from '../DigitalSignaturePad';
import { ProofUploader } from '../ProofUploader';
import { generateSupervisiPDF } from '../../lib/pdfGenerator';
import { showAlert } from '../../lib/alerts';

interface MonitoringViewProps {
  supervisiList: SupervisiRecord[];
  agendaGuruList: AgendaGuruItem[];
  guruList?: GuruItem[];
  kelasList?: KelasItem[];
  mapelList?: MapelItem[];
  setting: SchoolSetting;
  currentUser: User;
  initialMode?: 'monitoring' | 'supervisi';
  onRefresh: () => void;
}

export const MonitoringView: React.FC<MonitoringViewProps> = ({
  supervisiList = [],
  agendaGuruList = [],
  guruList = [],
  kelasList = [],
  mapelList = [],
  setting,
  currentUser,
  initialMode = 'monitoring',
  onRefresh
}) => {
  const safeSupervisiList = supervisiList || [];
  const safeAgendaGuruList = agendaGuruList || [];
  const safeGuruList = guruList || [];
  const safeKelasList = kelasList || [];
  const safeMapelList = mapelList || [];

  const [activeMode, setActiveMode] = useState<'monitoring' | 'supervisi'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('Semua');

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);

  // Modal Add Supervisi state
  const [showAddSupervisi, setShowAddSupervisi] = useState(false);
  const [formData, setFormData] = useState<Partial<SupervisiRecord>>({
    namaGuru: safeGuruList[0]?.nama || 'Dede Mulyana, S.Kom.',
    nip: safeGuruList[0]?.nip || '19901017 202321 1 007',
    supervisor: currentUser.nama,
    mapel: safeMapelList[0]?.namaMapel || 'Desain Komunikasi Visual (DKV)',
    kelas: safeKelasList[0]?.namaKelas || 'X DKV 1',
    skorPerencanaan: 92,
    skorPelaksanaan: 90,
    skorEvaluasi: 91,
    catatanSupervisor: 'Penguasaan kelas, media ajar digital, serta interaksi PjBL sangat memuaskan.',
    rekomendasi: 'Dapat menjadi Guru Model pengembangan modul ajar berbasis teaching factory.'
  });

  // Handle teacher change to sync NIP & Mapel
  const handleTeacherChange = (teacherName: string) => {
    const matched = safeGuruList.find(g => g.nama === teacherName);
    setFormData(prev => ({
      ...prev,
      namaGuru: teacherName,
      nip: matched?.nip || '-',
      mapel: matched?.mapelUtama ? matched.mapelUtama.split(',')[0].trim() : prev.mapel
    }));
  };

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
      nomorSupervisi: `SPV/SMKN1/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(10 + Math.random() * 90)}`,
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
      fotoUrls: formData.fotoUrls || [],
      dokumenUrl: formData.dokumenUrl || '',
      driveFolderLink: formData.driveFolderLink || '',
      ttdSupervisor: formData.ttdSupervisor || '',
      status: 'Selesai'
    };

    const updatedList = [newSpv, ...safeSupervisiList];
    Storage.saveSupervisi(updatedList);
    Storage.logAudit('CREATE_SUPERVISI', `Membuat Supervisi Akademik untuk ${newSpv.namaGuru} (Skor: ${avg})`);
    showAlert.success('Berhasil Disimpan!', `Supervisi akademik guru ${newSpv.namaGuru} berhasil disimpan dengan predikat ${predikat}.`);
    setShowAddSupervisi(false);
    onRefresh();
  };

  // Filtered monitoring agenda list
  const filteredAgendas = useMemo(() => {
    return safeAgendaGuruList.filter(a => {
      const matchKelas = selectedKelasFilter === 'Semua' || a.kelas === selectedKelasFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q ||
        a.namaGuru.toLowerCase().includes(q) ||
        (a.mapel && a.mapel.toLowerCase().includes(q)) ||
        (a.materi && a.materi.toLowerCase().includes(q)) ||
        a.kelas.toLowerCase().includes(q);
      return matchKelas && matchQuery;
    });
  }, [safeAgendaGuruList, selectedKelasFilter, searchQuery]);

  // Filtered supervisi list
  const filteredSupervisi = useMemo(() => {
    return safeSupervisiList.filter(spv => {
      const matchKelas = selectedKelasFilter === 'Semua' || spv.kelas === selectedKelasFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchQuery = !q ||
        spv.namaGuru.toLowerCase().includes(q) ||
        (spv.mapel && spv.mapel.toLowerCase().includes(q)) ||
        (spv.nomorSupervisi && spv.nomorSupervisi.toLowerCase().includes(q));
      return matchKelas && matchQuery;
    });
  }, [safeSupervisiList, selectedKelasFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            <span>Monitoring KBM & Supervisi Akademik Guru</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pemantauan langsung aktivitas belajar mengajar di kelas dan evaluasi kinerja pengajaran guru.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 p-1 shadow-xs">
            <button
              onClick={() => setActiveMode('monitoring')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'monitoring'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monitoring KBM ({safeAgendaGuruList.length})
            </button>
            <button
              onClick={() => setActiveMode('supervisi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeMode === 'supervisi'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Supervisi Akademik ({safeSupervisiList.length})
            </button>
          </div>

          {activeMode === 'supervisi' && (
            <button
              onClick={() => setShowAddSupervisi(true)}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Nilai Supervisi</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar Search and Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeMode === 'monitoring' ? 'Cari nama guru, mata pelajaran, materi, atau kelas...' : 'Cari nama guru, nomor supervisi, atau mapel...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            className="w-full sm:w-44 py-1.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Semua">Semua Kelas</option>
            {safeKelasList.map(k => (
              <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Monitoring Mode: Live Feed of KBM */}
      {activeMode === 'monitoring' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgendas.length === 0 ? (
              <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
                Tidak ada agenda KBM guru yang sesuai dengan kriteria pencarian.
              </div>
            ) : (
              filteredAgendas.map((item) => (
                <div 
                  key={item.id} 
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs hover:border-teal-400 dark:hover:border-teal-600 transition"
                >
                  <div className="flex justify-between items-start gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div>
                      <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                        {item.kelas} • Jam ke {item.jamKe} ({item.jumlahJP || 4} JP)
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 line-clamp-1">
                        {item.namaGuru}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.mapel}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      item.statusPembelajaran === 'Selesai' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {item.statusPembelajaran || 'KBM'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p className="line-clamp-2">
                      <span className="font-semibold text-slate-400">Materi:</span> {item.materi || '-'}
                    </p>
                    {item.ruang && (
                      <p className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-400">Ruangan:</span> {item.ruang}
                      </p>
                    )}
                  </div>

                  {/* Attendance & Photo Indicators */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                        <Users className="h-3.5 w-3.5 text-teal-600" />
                        <span>Kehadiran: {item.persentaseKehadiran || Math.round((item.hadir / (item.totalSiswa || 36)) * 100)}%</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.fotoUrls && item.fotoUrls.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded-md">
                          <Camera className="h-3 w-3" /> {item.fotoUrls.length} Foto
                        </span>
                      )}
                      {item.ttdGuru && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> TTD
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Supervisi Mode: Formal Academic Evaluations */}
      {activeMode === 'supervisi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSupervisi.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400">
              Belum ada data supervisi akademik guru yang tercatat.
            </div>
          ) : (
            filteredSupervisi.map((spv) => (
              <div 
                key={spv.id} 
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-xs hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                      {spv.nomorSupervisi}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {spv.namaGuru}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {spv.mapel} • Kelas {spv.kelas}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-teal-600 dark:text-teal-400 block leading-tight">
                      {spv.skorAkhir}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {spv.predikat}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Perencanaan</span>
                    <b className="text-slate-800 dark:text-slate-200 text-sm">{spv.skorPerencanaan}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pelaksanaan</span>
                    <b className="text-slate-800 dark:text-slate-200 text-sm">{spv.skorPelaksanaan}</b>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Evaluasi</span>
                    <b className="text-slate-800 dark:text-slate-200 text-sm">{spv.skorEvaluasi}</b>
                  </div>
                </div>

                {spv.catatanSupervisor && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-teal-50/40 dark:bg-slate-800/40 p-2 rounded-xl border border-teal-100 dark:border-slate-800">
                    <span className="font-semibold text-teal-700 dark:text-teal-400">Catatan:</span> {spv.catatanSupervisor}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {spv.fotoUrls && spv.fotoUrls.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600">
                        <Camera className="h-3 w-3" /> {spv.fotoUrls.length} Bukti Foto
                      </span>
                    )}
                    {spv.ttdSupervisor && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Signed Digital
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => generateSupervisiPDF(spv, setting)}
                    className="inline-flex items-center gap-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-3 py-1.5 shadow-xs transition"
                    title="Cetak PDF Supervisi dengan Kop & Logo"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Cetak PDF</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Add Supervisi */}
      {showAddSupervisi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-teal-600" />
                <span>Form Penilaian Supervisi Akademik Guru</span>
              </h3>
              <button onClick={() => setShowAddSupervisi(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupervisi} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Guru yang Disupervisi</label>
                <select
                  value={formData.namaGuru || ''}
                  onChange={(e) => handleTeacherChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800 font-semibold"
                  required
                >
                  {safeGuruList.map(g => (
                    <option key={g.id} value={g.nama}>{g.nama} ({g.nip})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Mata Pelajaran</label>
                  <select
                    value={formData.mapel || ''}
                    onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                  >
                    {safeMapelList.map(m => (
                      <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Kelas / Rombel</label>
                  <select
                    value={formData.kelas || ''}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                  >
                    {safeKelasList.map(k => (
                      <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Perencanaan (1-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.skorPerencanaan || 90}
                    onChange={(e) => setFormData({ ...formData, skorPerencanaan: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Pelaksanaan (1-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.skorPelaksanaan || 90}
                    onChange={(e) => setFormData({ ...formData, skorPelaksanaan: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Evaluasi (1-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.skorEvaluasi || 90}
                    onChange={(e) => setFormData({ ...formData, skorEvaluasi: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-bold text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Catatan Supervisor & Rekomendasi</label>
                <textarea
                  value={formData.catatanSupervisor || ''}
                  onChange={(e) => setFormData({ ...formData, catatanSupervisor: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-800"
                  rows={2}
                  placeholder="Catatan pelaksanaan pembelajaran dan tindak lanjut..."
                />
              </div>

              {/* Upload Foto & Link Bukti Observasi */}
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

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowAddSupervisi(false)} 
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="rounded-xl bg-teal-600 hover:bg-teal-700 px-5 py-2 font-bold text-white shadow-xs"
                >
                  Simpan Nilai Supervisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

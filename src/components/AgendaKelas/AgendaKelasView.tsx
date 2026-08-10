import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  FileSpreadsheet, 
  Users, 
  Eye, 
  CheckCircle, 
  X,
  Send,
  Building2,
  Package,
  Heart,
  ShieldAlert,
  Award,
  Camera,
  Link as LinkIcon,
  ExternalLink,
  PenTool,
  FileText,
  Pencil,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { AgendaKelasItem, KelasItem, SchoolSetting, User } from '../../types';
import { generateAgendaKelasPDF } from '../../lib/pdfGenerator';
import { exportAgendaKelasToExcel } from '../../lib/excelExport';
import { Storage } from '../../lib/storage';
import { DigitalSignaturePad } from '../DigitalSignaturePad';
import { ProofUploader } from '../ProofUploader';

interface AgendaKelasViewProps {
  agendas: AgendaKelasItem[];
  kelasList: KelasItem[];
  setting: SchoolSetting;
  currentUser: User;
  onRefresh: () => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const AgendaKelasView: React.FC<AgendaKelasViewProps> = ({
  agendas,
  kelasList,
  setting,
  currentUser,
  onRefresh,
  onOpenGoogleSheetsModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('');
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaKelasItem | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEditAgenda = (ak: AgendaKelasItem) => {
    setFormData(ak);
    setEditingId(ak.id);
    setShowFormModal(true);
  };

  const handleDeleteAgenda = (id: string) => {
    Storage.deleteAgendaKelas(id);
    if (selectedAgenda?.id === id) setSelectedAgenda(null);
    onRefresh();
  };

  // Helper to get integrated attendance data from AgendaGuru or AbsensiSiswa
  const getAttendanceFromAgendaGuruOrAbsensi = React.useCallback((kelasName: string, dateStr: string) => {
    // 1. Check AgendaGuru first for this class & date
    const agendaGuruList = Storage.getAgendaGuru().filter(a => a.kelas === kelasName && a.tanggal === dateStr);

    if (agendaGuruList.length > 0) {
      const latestAG = agendaGuruList[0];
      const totalSiswa = latestAG.totalSiswa || 36;
      const hadir = latestAG.hadir ?? totalSiswa;
      const sakit = latestAG.sakit ?? 0;
      const izin = latestAG.izin ?? 0;
      const alpa = latestAG.alpa ?? 0;
      const terlambat = latestAG.terlambat ?? 0;
      const persentase = latestAG.persentaseKehadiran ?? 100;
      const siswaTidakHadir = latestAG.siswaTidakHadir || [];

      const monitoringPembelajaran = agendaGuruList.map(ag => ({
        jp: ag.jamKe || '1 - 4',
        mapel: ag.mapel || 'Mata Pelajaran',
        guru: ag.namaGuru || 'Guru Pengampu',
        materi: ag.materi || 'Materi Pembelajaran',
        tugas: ag.tugas || 'Tidak ada tugas',
        status: 'Terlaksana' as const
      }));

      return {
        jumlahSiswa: totalSiswa,
        hadir,
        sakit,
        izin,
        alpa,
        terlambat,
        persentase,
        siswaTidakHadir,
        monitoringPembelajaran
      };
    }

    // 2. Fallback to AbsensiSiswa
    const absensiList = Storage.getAbsensiSiswa().filter(a => a.kelas === kelasName && a.tanggal === dateStr);
    const allSiswa = Storage.getSiswa();
    const classStudents = allSiswa.filter(s => s.kelas === kelasName);
    const totalSiswa = classStudents.length > 0 ? classStudents.length : 36;

    if (absensiList.length > 0) {
      const sakit = absensiList.filter(r => r.status === 'Sakit').length;
      const izin = absensiList.filter(r => r.status === 'Izin').length;
      const alpa = absensiList.filter(r => r.status === 'Alpa').length;
      const terlambat = absensiList.filter(r => r.status === 'Terlambat').length;
      const hadir = Math.max(0, totalSiswa - (sakit + izin + alpa));
      const persentase = totalSiswa > 0 ? Number(((hadir / totalSiswa) * 100).toFixed(2)) : 100;

      const siswaTidakHadir = absensiList
        .filter(r => r.status !== 'Hadir')
        .map(r => ({
          nis: r.nis,
          nama: r.namaSiswa,
          kategori: r.status as 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat',
          alasan: r.alasan || (r.status === 'Alpa' ? 'Tanpa Keterangan' : `Siswa ${r.status}`)
        }));

      return {
        jumlahSiswa: totalSiswa,
        hadir,
        sakit,
        izin,
        alpa,
        terlambat,
        persentase,
        siswaTidakHadir,
        monitoringPembelajaran: []
      };
    }

    // 3. Default if no inputs found for sakit, izin, alpa -> fill with ZERO!
    return {
      jumlahSiswa: totalSiswa,
      hadir: totalSiswa,
      sakit: 0,
      izin: 0,
      alpa: 0,
      terlambat: 0,
      persentase: 100,
      siswaTidakHadir: [],
      monitoringPembelajaran: []
    };
  }, []);

  const firstKelas = kelasList[0];
  const initialKelasName = firstKelas?.namaKelas || 'XI RPL 1';
  const initialDateStr = new Date().toISOString().slice(0, 10);
  const getDayName = (dateStr?: string): string => {
    if (!dateStr) return 'Senin';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Senin';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[d.getDay()] || 'Senin';
  };
  const initialAtt = getAttendanceFromAgendaGuruOrAbsensi(initialKelasName, initialDateStr);

  const defaultForm: Partial<AgendaKelasItem> = {
    nomorAgenda: `AK/${initialKelasName.replace(/\s+/g, '')}/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getDate()}`,
    tahunPelajaran: setting.tahunPelajaran,
    semester: setting.semester,
    hari: getDayName(initialDateStr),
    tanggal: initialDateStr,
    kelas: initialKelasName,
    jurusan: firstKelas?.jurusan || 'Kejuruan SMK',
    konsentrasiKeahlian: firstKelas?.jurusan || 'Kejuruan SMK',
    waliKelas: firstKelas?.waliKelas || '',
    ketuaKelas: firstKelas?.ketuaKelas || '',
    wakilKetua: firstKelas?.wakilKetua || '',
    jumlahSiswa: initialAtt.jumlahSiswa,
    jumlahLaki: firstKelas?.jumlahLaki || Math.round(initialAtt.jumlahSiswa / 2),
    jumlahPerempuan: firstKelas?.jumlahPerempuan || Math.floor(initialAtt.jumlahSiswa / 2),

    ...initialAtt,

    monitoringPembelajaran: initialAtt.monitoringPembelajaran || [],

    agendaRoutine: [
      { waktu: '06.45', kegiatan: 'Piket Kebersihan Kelas', status: 'Terlaksana', catatan: 'Ruang kelas/Lab bersih' },
      { waktu: '07.00', kegiatan: 'Apel / Doa Bersama', status: 'Terlaksana' },
      { waktu: '07.15', kegiatan: 'KBM Jam Pertama', status: 'Terlaksana' }
    ],

    pelanggaranList: [],
    prestasiList: [],
    kesehatanList: [],
    inventarisList: [],
    komunikasiOrtuList: [],

    catatanWaliKelas: {
      kondisiUmum: `Kondisi kelas kondusif, tingkat kehadiran ${initialAtt.persentase}%.`,
      kedisiplinan: 'Kedisiplinan waktu berjalan baik.',
      budayaPositif: 'Budaya 5S berjalan sangat baik.',
      kebersihan: 'Sangat bersih.',
      keamanan: 'Aman dan kondusif.',
      siswaBermasalah: initialAtt.alpa > 0 ? `${initialAtt.alpa} siswa Alpa` : '-',
      siswaBerprestasi: '-',
      tindakLanjut: 'Terus pantau kedisiplinan siswa.'
    },

    validatedByWali: true,
    tanggalValidasiWali: initialDateStr
  };

  const [formData, setFormData] = useState<Partial<AgendaKelasItem>>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-update attendance when kelas or tanggal changes while form modal is open
  React.useEffect(() => {
    if (showFormModal && formData.kelas && formData.tanggal) {
      const att = getAttendanceFromAgendaGuruOrAbsensi(formData.kelas, formData.tanggal);
      setFormData(prev => ({
        ...prev,
        ...att,
        monitoringPembelajaran: att.monitoringPembelajaran.length > 0 ? att.monitoringPembelajaran : (prev.monitoringPembelajaran || [])
      }));
    }
  }, [showFormModal, formData.kelas, formData.tanggal, getAttendanceFromAgendaGuruOrAbsensi]);

  const safeAgendas = agendas || [];
  const filteredAgendas = safeAgendas.filter(a => {
    const matchSearch = a.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        a.waliKelas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = selectedKelasFilter ? a.kelas === selectedKelasFilter : true;
    return matchSearch && matchKelas;
  });

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const curKelas = formData.kelas || kelasList[0]?.namaKelas || 'XI RPL 1';
      const curTanggal = formData.tanggal || new Date().toISOString().slice(0, 10);
      const att = getAttendanceFromAgendaGuruOrAbsensi(curKelas, curTanggal);

      if (editingId) {
        const updatedItem: AgendaKelasItem = {
          ...defaultForm,
          ...formData,
          id: editingId,
          hadir: formData.hadir ?? att.hadir,
          sakit: formData.sakit ?? att.sakit,
          izin: formData.izin ?? att.izin,
          alpa: formData.alpa ?? att.alpa,
          terlambat: formData.terlambat ?? att.terlambat,
          jumlahSiswa: formData.jumlahSiswa ?? att.jumlahSiswa,
          siswaTidakHadir: formData.siswaTidakHadir ?? att.siswaTidakHadir,
          persentase: (formData.jumlahSiswa || att.jumlahSiswa) > 0 
            ? Number((((formData.hadir ?? att.hadir) / (formData.jumlahSiswa || att.jumlahSiswa)) * 100).toFixed(2)) 
            : 100
        } as AgendaKelasItem;

        Storage.updateAgendaKelas(updatedItem);
        setSelectedAgenda(updatedItem);
        setEditingId(null);
        setShowFormModal(false);
        onRefresh();
        setIsSubmitting(false);
        return;
      }

      const newItem: AgendaKelasItem = {
        ...defaultForm,
        ...formData,
        hadir: formData.hadir ?? att.hadir,
        sakit: formData.sakit ?? att.sakit,
        izin: formData.izin ?? att.izin,
        alpa: formData.alpa ?? att.alpa,
        terlambat: formData.terlambat ?? att.terlambat,
        jumlahSiswa: formData.jumlahSiswa ?? att.jumlahSiswa,
        siswaTidakHadir: formData.siswaTidakHadir ?? att.siswaTidakHadir,
        id: 'ak-' + Date.now(),
        persentase: (formData.jumlahSiswa || att.jumlahSiswa) > 0 
          ? Number((((formData.hadir ?? att.hadir) / (formData.jumlahSiswa || att.jumlahSiswa)) * 100).toFixed(2)) 
          : 100
      } as AgendaKelasItem;

      Storage.addAgendaKelas(newItem);
      setSelectedAgenda(newItem);
      setShowFormModal(false);
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-teal-600" />
            <span>Agenda Harian Kelas (Format Lengkap A-L)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Monitoring harian kelas meliputi kehadiran, rutinitas, pembelajaran per JP, disiplin, prestasi, dan catatan wali kelas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGoogleSheetsModal && (
            <button
              onClick={onOpenGoogleSheetsModal}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-2xs"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Kirim ke Google Sheet</span>
            </button>
          )}

          <button
            onClick={() => exportAgendaKelasToExcel(agendas)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                ...defaultForm,
                nomorAgenda: `AK/${(firstKelas?.namaKelas || 'X').replace(/\s+/g, '')}/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getDate()}`
              });
              setShowFormModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Isi Agenda Kelas Hari Ini</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelas, wali kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedKelasFilter}
            onChange={(e) => setSelectedKelasFilter(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Kelas</option>
            {kelasList.map(k => (
              <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgendas.map((ak) => (
          <div
            key={ak.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-teal-500 transition space-y-3"
          >
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                  {ak.nomorAgenda}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {ak.kelas} ({ak.jurusan.split('(')[1]?.replace(')','') || 'RPL'})
                </h3>
                <p className="text-xs text-slate-500">Wali Kelas: {ak.waliKelas}</p>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle className="h-3 w-3" />
                <span>Terverifikasi Wali</span>
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <p>🗓️ {ak.hari}, {ak.tanggal}</p>
              <p>👥 Total Siswa: {ak.jumlahSiswa} ({ak.jumlahLaki} L / {ak.jumlahPerempuan} P)</p>
              <p className="line-clamp-1 text-slate-500">Catatan: {ak.catatanWaliKelas?.kondisiUmum || '-'}</p>
            </div>

            {/* Attendance Bar */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-600 font-bold">Hadir: {ak.hadir}</span>
                <span className="text-amber-500">Sakit: {ak.sakit}</span>
                <span className="text-sky-500">Izin: {ak.izin}</span>
                <span className="text-rose-500 font-bold">Alpa: {ak.alpa}</span>
              </div>
              <span className="text-xs font-black text-teal-600">{ak.persentase}%</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedAgenda(ak)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Eye className="h-3.5 w-3.5 text-teal-600" />
                <span>Detail</span>
              </button>

              <button
                onClick={() => handleEditAgenda(ak)}
                className="flex items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-amber-100 transition"
                title="Edit Agenda Kelas"
              >
                <Pencil className="h-3.5 w-3.5 text-amber-600" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => handleDeleteAgenda(ak.id)}
                className="flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-2 py-1.5 text-xs font-semibold hover:bg-rose-100 transition"
                title="Hapus Agenda Kelas"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              </button>

              <button
                onClick={() => generateAgendaKelasPDF(ak, setting)}
                className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail Agenda Kelas (A-L) */}
      {selectedAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                  {selectedAgenda.nomorAgenda}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Detail Agenda Harian Kelas {selectedAgenda.kelas}
                </h3>
              </div>
              <button onClick={() => setSelectedAgenda(null)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-xs text-slate-700 dark:text-slate-300">
              {/* Identitas A & C */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">A. Identitas Kelas & Kehadiran</h4>
                <p><b>Hari / Tanggal:</b> {selectedAgenda.hari}, {selectedAgenda.tanggal}</p>
                <p><b>Wali Kelas:</b> {selectedAgenda.waliKelas} | <b>Ketua Kelas:</b> {selectedAgenda.ketuaKelas}</p>
                <p><b>Kehadiran:</b> Hadir {selectedAgenda.hadir} dari {selectedAgenda.jumlahSiswa} Siswa ({selectedAgenda.persentase}%)</p>
              </div>

              {/* Monitoring E */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">E. Monitoring Pembelajaran per JP</h4>
                <div className="space-y-1.5">
                  {selectedAgenda.monitoringPembelajaran.map((m, i) => (
                    <div key={i} className="p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      <span className="font-bold text-teal-600">JP {m.jp} ({m.mapel}):</span> {m.materi} (Guru: {m.guru}) - <b className="text-emerald-600">{m.status}</b>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rutinitas F */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">F. Agenda Rutin Harian Kelas</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedAgenda.agendaRoutine.map((r, i) => (
                    <div key={i} className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-800 text-[11px]">
                      <span><b>{r.waktu}</b> {r.kegiatan}</span>
                      <span className="text-emerald-600 font-semibold">{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Catatan L */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">L. Catatan Wali Kelas</h4>
                <p><b>Kondisi Umum:</b> {selectedAgenda.catatanWaliKelas.kondisiUmum}</p>
                <p><b>Siswa Bermasalah:</b> {selectedAgenda.catatanWaliKelas.siswaBermasalah || '-'}</p>
                <p><b>Siswa Berprestasi:</b> {selectedAgenda.catatanWaliKelas.siswaBerprestasi || '-'}</p>
                <p><b>Tindak Lanjut:</b> {selectedAgenda.catatanWaliKelas.tindakLanjut}</p>
              </div>

              {/* Bukti Foto Selfie Suasana Kelas & Dokumen / Drive Link */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-teal-600" />
                  <span>Bukti Suasana Kelas & Dokumen Pendukung</span>
                </h4>

                {selectedAgenda.fotoUrls && selectedAgenda.fotoUrls.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedAgenda.fotoUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video group">
                        <img src={url} alt={`Bukti Kelas ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">Belum ada foto selfie/suasana kelas diunggah.</p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                  {selectedAgenda.driveFolderLink && (
                    <a
                      href={selectedAgenda.driveFolderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>Buka Google Drive Kelas</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {selectedAgenda.dokumenUrl && (
                    <a
                      href={selectedAgenda.dokumenUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600 text-teal-700 dark:text-teal-300 px-3 py-1.5 text-xs font-bold hover:bg-teal-50 dark:hover:bg-teal-950/40"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Dokumen Pendukung</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Tanda Tangan Digital Wali Kelas */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] flex items-center gap-1.5">
                  <PenTool className="h-4 w-4 text-teal-600" />
                  <span>Validasi Tanda Tangan Digital Wali Kelas</span>
                </h4>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="text-center sm:text-left space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Wali Kelas</span>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedAgenda.waliKelas}</p>
                    <p className="text-[11px] text-slate-500">Kelas {selectedAgenda.kelas}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    {selectedAgenda.ttdWaliKelas ? (
                      selectedAgenda.ttdWaliKelas.startsWith('data:image') ? (
                        <div className="p-1 rounded bg-white border border-slate-200 dark:border-slate-700 shadow-xs">
                          <img src={selectedAgenda.ttdWaliKelas} alt="Tanda Tangan Wali Kelas" className="h-14 object-contain" />
                        </div>
                      ) : (
                        <div className="font-serif italic font-bold text-slate-800 dark:text-slate-200 text-lg border-b border-slate-400 px-3 py-1">
                          {selectedAgenda.ttdWaliKelas}
                        </div>
                      )
                    ) : (
                      <span className="text-emerald-600 font-bold text-xs">Verified by Wali Kelas</span>
                    )}
                    <span className="text-[9px] text-teal-600 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Digital Signature Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
              <span className="text-xs text-slate-400">Validated by Wali: {selectedAgenda.waliKelas}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => generateAgendaKelasPDF(selectedAgenda, setting)}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 transition"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  onClick={() => setSelectedAgenda(null)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal Agenda Kelas Baru */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-teal-600" />
                <span>Form Isian Agenda Harian Kelas (A-L)</span>
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <label className="block mb-1 font-semibold flex items-center justify-between">
                    <span>Kelas</span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Auto-Sync Master</span>
                  </label>
                  <select
                    value={formData.kelas || ''}
                    onChange={(e) => {
                      const selectedNama = e.target.value;
                      const foundKelas = kelasList.find(k => k.namaKelas === selectedNama);
                      setFormData(prev => ({
                        ...prev,
                        kelas: selectedNama,
                        waliKelas: foundKelas?.waliKelas || prev.waliKelas || '',
                        ketuaKelas: foundKelas?.ketuaKelas || prev.ketuaKelas || '',
                        wakilKetua: foundKelas?.wakilKetua || prev.wakilKetua || '',
                        jurusan: foundKelas?.jurusan || prev.jurusan || '',
                        konsentrasiKeahlian: foundKelas?.jurusan || prev.konsentrasiKeahlian || '',
                        jumlahLaki: foundKelas?.jumlahLaki ?? prev.jumlahLaki ?? 20,
                        jumlahPerempuan: foundKelas?.jumlahPerempuan ?? prev.jumlahPerempuan ?? 16,
                        jumlahSiswa: (foundKelas?.jumlahLaki || 0) + (foundKelas?.jumlahPerempuan || 0) || prev.jumlahSiswa || 36
                      }));
                    }}
                    className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800 font-bold text-teal-700 dark:text-teal-300 cursor-pointer"
                  >
                    {kelasList.map(k => (
                      <option key={k.id} value={k.namaKelas}>
                        {k.namaKelas} {k.waliKelas ? `(Wali: ${k.waliKelas})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Tanggal</label>
                  <input
                    type="date"
                    value={formData.tanggal || ''}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setFormData({
                        ...formData,
                        tanggal: newDate,
                        hari: getDayName(newDate)
                      });
                    }}
                    className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Hari</label>
                  <select
                    value={formData.hari || getDayName(formData.tanggal)}
                    onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                    className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Senin">Senin</option>
                    <option value="Selasa">Selasa</option>
                    <option value="Rabu">Rabu</option>
                    <option value="Kamis">Kamis</option>
                    <option value="Jumat">Jumat</option>
                    <option value="Sabtu">Sabtu</option>
                    <option value="Minggu">Minggu</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Konsentrasi Keahlian / Jurusan</label>
                  <input
                    type="text"
                    value={formData.jurusan || formData.konsentrasiKeahlian || ''}
                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value, konsentrasiKeahlian: e.target.value })}
                    className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    placeholder="e.g. Rekayasa Perangkat Lunak"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold flex items-center justify-between">
                    <span>Wali Kelas</span>
                    <span className="text-[9px] text-emerald-600 font-mono font-bold">Otomatis Data Master</span>
                  </label>
                  <input
                    type="text"
                    value={formData.waliKelas || ''}
                    onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })}
                    className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    placeholder="Wali Kelas dari Data Master"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Ketua Kelas</label>
                  <input
                    type="text"
                    value={formData.ketuaKelas || ''}
                    onChange={(e) => setFormData({ ...formData, ketuaKelas: e.target.value })}
                    className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-teal-500/30 bg-teal-50/30 dark:bg-slate-800/40 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-teal-200 dark:border-slate-700 pb-2">
                  <span className="font-bold text-teal-800 dark:text-teal-300 uppercase text-xs flex items-center gap-1.5">
                    <span>Rekap Kehadiran Siswa</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                      🔒 Hanya Bisa Dilihat
                    </span>
                  </span>
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold italic">
                    ⚡ Otomatis terisi saat guru mata pelajaran mengisi Absensi Siswa
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  <div>
                    <label className="block mb-1 font-semibold text-slate-700 dark:text-slate-300">Total Siswa</label>
                    <input
                      type="number"
                      value={formData.jumlahSiswa ?? 36}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-slate-100 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-emerald-600 dark:text-emerald-400">Hadir</label>
                    <input
                      type="number"
                      value={formData.hadir ?? 33}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border border-emerald-300 dark:border-emerald-800 p-2 bg-emerald-50 dark:bg-emerald-950/40 font-black text-emerald-700 dark:text-emerald-300 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-amber-600 dark:text-amber-400">Sakit</label>
                    <input
                      type="number"
                      value={formData.sakit ?? 1}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border border-amber-300 dark:border-amber-800 p-2 bg-amber-50 dark:bg-amber-950/40 font-black text-amber-700 dark:text-amber-300 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-sky-600 dark:text-sky-400">Izin</label>
                    <input
                      type="number"
                      value={formData.izin ?? 1}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border border-sky-300 dark:border-sky-800 p-2 bg-sky-50 dark:bg-sky-950/40 font-black text-sky-700 dark:text-sky-300 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-bold text-rose-600 dark:text-rose-400">Alpa</label>
                    <input
                      type="number"
                      value={formData.alpa ?? 1}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border border-rose-300 dark:border-rose-800 p-2 bg-rose-50 dark:bg-rose-950/40 font-black text-rose-700 dark:text-rose-300 cursor-not-allowed select-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <label className="block font-semibold">Catatan Wali Kelas</label>
                <textarea
                  value={formData.catatanWaliKelas?.kondisiUmum || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    catatanWaliKelas: {
                      kondisiUmum: e.target.value,
                      kedisiplinan: 'Baik',
                      budayaPositif: 'Baik',
                      kebersihan: 'Sangat Bersih',
                      keamanan: 'Kondusif',
                      siswaBermasalah: '',
                      siswaBerprestasi: '',
                      tindakLanjut: 'Pembinaan Rutin'
                    }
                  })}
                  className="w-full rounded-lg border p-2 bg-white dark:bg-slate-800"
                  rows={3}
                  placeholder="Kondisi umum kelas, kebersihan, ketertiban..."
                />
              </div>

              {/* Foto Selfie & Dokumen Pendukung Kelas */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <h4 className="font-bold text-teal-700 dark:text-teal-400 uppercase text-xs">Foto Selfie Suasana Kelas & Dokumen / Tautan</h4>
                
                <ProofUploader
                  fotoUrls={formData.fotoUrls}
                  dokumenUrl={formData.dokumenUrl}
                  driveFolderLink={formData.driveFolderLink}
                  onChangePhotos={(urls) => setFormData({ ...formData, fotoUrls: urls })}
                  onChangeDocument={(doc) => setFormData({ ...formData, dokumenUrl: doc })}
                  onChangeDriveLink={(link) => setFormData({ ...formData, driveFolderLink: link })}
                  title="Unggah Foto Selfie Kelas & Tautan File Drive"
                />
              </div>

              {/* Tanda Tangan Digital Ketua / Wali Kelas */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <h4 className="font-bold text-teal-700 dark:text-teal-400 uppercase text-xs">Tanda Tangan Digital Wali Kelas / Pengurus</h4>
                
                <DigitalSignaturePad
                  initialSignature={formData.ttdWaliKelas}
                  signerName={formData.waliKelas || currentUser.nama}
                  onSave={(sig) => setFormData({ ...formData, ttdWaliKelas: sig })}
                  title="Tanda Tangan Digital Wali Kelas"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Simpan Agenda Kelas</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

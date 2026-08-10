import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Printer, 
  FileSpreadsheet, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye, 
  FileText, 
  Calendar, 
  Users, 
  UserCheck, 
  Camera, 
  X,
  Send,
  Sparkles,
  Link as LinkIcon,
  ExternalLink,
  PenTool,
  Pencil,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { AgendaGuruItem, GuruItem, KelasItem, MapelItem, JadwalItem, SchoolSetting, User, SiswaItem, AgendaKelasItem } from '../../types';
import { generateAgendaGuruPDF } from '../../lib/pdfGenerator';
import { exportAgendaGuruToExcel } from '../../lib/excelExport';
import { Storage } from '../../lib/storage';
import { DigitalSignaturePad } from '../DigitalSignaturePad';
import { ProofUploader } from '../ProofUploader';

interface AgendaGuruViewProps {
  agendas: AgendaGuruItem[];
  guruList: GuruItem[];
  kelasList: KelasItem[];
  mapelList: MapelItem[];
  jadwalList: JadwalItem[];
  setting: SchoolSetting;
  currentUser: User;
  siswaList?: SiswaItem[];
  onRefresh: () => void;
  onOpenGoogleSheetsModal?: () => void;
}

export const AgendaGuruView: React.FC<AgendaGuruViewProps> = ({
  agendas,
  guruList,
  kelasList,
  mapelList,
  jadwalList,
  setting,
  currentUser,
  siswaList,
  onRefresh,
  onOpenGoogleSheetsModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState('');
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaGuruItem | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEditAgenda = (ag: AgendaGuruItem) => {
    setFormData(ag);
    setEditingId(ag.id);
    setShowFormModal(true);
  };

  const handleDeleteAgenda = (id: string) => {
    Storage.deleteAgendaGuru(id);
    if (selectedAgenda?.id === id) setSelectedAgenda(null);
    onRefresh();
  };

  // Helper to get attendance data from AbsensiSiswa in Storage
  const getAttendanceFromAbsensiSiswa = React.useCallback((kelas: string, tanggal: string) => {
    const allAbsensi = Storage.getAbsensiSiswa();
    const allSiswa = siswaList || Storage.getSiswa();
    const classStudents = allSiswa.filter(s => s.kelas === kelas);
    const totalSiswa = classStudents.length > 0 ? classStudents.length : 36;

    // Filter attendance records for this class and date
    const records = allAbsensi.filter(a => a.kelas === kelas && a.tanggal === tanggal);

    if (records.length > 0) {
      const sakitRecs = records.filter(r => r.status === 'Sakit');
      const izinRecs = records.filter(r => r.status === 'Izin');
      const alpaRecs = records.filter(r => r.status === 'Alpa');
      const terlambatRecs = records.filter(r => r.status === 'Terlambat');

      const sakit = sakitRecs.length;
      const izin = izinRecs.length;
      const alpa = alpaRecs.length;
      const terlambat = terlambatRecs.length;
      const hadir = Math.max(0, totalSiswa - (sakit + izin + alpa));
      const persentaseKehadiran = totalSiswa > 0 ? Number(((hadir / totalSiswa) * 100).toFixed(2)) : 100;

      const siswaTidakHadir = records
        .filter(r => r.status !== 'Hadir')
        .map(r => ({
          nis: r.nis,
          nama: r.namaSiswa,
          kategori: r.status as 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat',
          alasan: r.alasan || (r.status === 'Alpa' ? 'Tanpa Keterangan' : `Siswa ${r.status}`)
        }));

      return { totalSiswa, hadir, sakit, izin, alpa, terlambat, persentaseKehadiran, siswaTidakHadir };
    } else {
      // If no absensi recorded for sakit, izin, alpa -> default all non-presents to 0!
      return {
        totalSiswa,
        hadir: totalSiswa,
        sakit: 0,
        izin: 0,
        alpa: 0,
        terlambat: 0,
        persentaseKehadiran: 100,
        siswaTidakHadir: []
      };
    }
  }, [siswaList]);

  // Helper for computing Indonesian day name
  const getDayName = (dateStr?: string): string => {
    if (!dateStr) return 'Senin';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Senin';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[d.getDay()] || 'Senin';
  };

  const initialKelas = kelasList[0]?.namaKelas || 'XI RPL 1';
  const initialTanggal = new Date().toISOString().slice(0, 10);
  const initialAtt = getAttendanceFromAbsensiSiswa(initialKelas, initialTanggal);

  // Form State with clean defaults (no hardcoded sample text)
  const defaultForm: Partial<AgendaGuruItem> = {
    nomorAgenda: `AG/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${Math.floor(100 + Math.random()*900)}`,
    tahunPelajaran: setting.tahunPelajaran,
    semester: setting.semester,
    hari: getDayName(initialTanggal),
    tanggal: initialTanggal,
    namaGuru: currentUser.nama,
    nip: currentUser.nip || '',
    jabatan: 'Guru Kejuruan SMK',
    mapel: mapelList[0]?.namaMapel || '',
    konsentrasiKeahlian: kelasList[0]?.jurusan || 'Rekayasa Perangkat Lunak',
    fase: 'F',
    kelas: initialKelas,
    rombel: `${initialKelas}`,
    ruang: 'Lab Komputer 1',
    jamKe: '1 - 4',
    waktu: '07.15 - 10.15',
    jumlahJP: 4,
    statusPertemuan: 'Sesuai Jadwal',
    modaPembelajaran: 'Luring',

    elemen: '',
    cp: '',
    atp: '',
    tujuanPembelajaran: '',
    materi: '',
    modelPembelajaran: 'Project Based Learning (PjBL)',
    metode: 'Demonstrasi, Diskusi, Praktik',
    pendekatan: 'Deep Learning',
    media: 'PC Lab & Infocus',
    sumberBelajar: 'Modul Digital',
    lkpd: 'LKPD-01',
    platformDigital: 'SIMAGU Web Portal',
    asesmen: 'Praktik Langsung',
    tugas: '',
    deadlineTugas: '',
    statusPembelajaran: 'Selesai',

    ...initialAtt,

    kegiatanTambahan: [],
    kendala: '',
    solusi: '',
    siswaPendampingan: '',
    sarana: 'Akses Internet Lancar',
    refleksi: '',
    tindakLanjut: '',
    komunikasiOrtu: '',

    fotoUrls: [],
    statusValidasi: 'Disetujui',
    ttdGuru: currentUser.nama,
    ttdWakasek: setting.wakasekKurikulum
  };

  const [formData, setFormData] = useState<Partial<AgendaGuruItem>>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-update attendance when kelas or tanggal changes while creating a new agenda in modal
  React.useEffect(() => {
    if (showFormModal && !editingId && formData.kelas && formData.tanggal) {
      const att = getAttendanceFromAbsensiSiswa(formData.kelas, formData.tanggal);
      setFormData(prev => ({
        ...prev,
        ...att
      }));
    }
  }, [showFormModal, editingId, formData.kelas, formData.tanggal, getAttendanceFromAbsensiSiswa]);

  const safeAgendas = agendas || [];
  const filteredAgendas = safeAgendas.filter(a => {
    if (!a) return false;
    const matchSearch = (a.namaGuru || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (a.materi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (a.mapel || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchKelas = selectedKelasFilter ? a.kelas === selectedKelasFilter : true;
    return matchSearch && matchKelas;
  });

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const curKelas = formData.kelas || kelasList[0]?.namaKelas || 'XI RPL 1';
      const curTanggal = formData.tanggal || new Date().toISOString().slice(0, 10);
      const att = getAttendanceFromAbsensiSiswa(curKelas, curTanggal);

      if (editingId) {
        const updatedItem: AgendaGuruItem = {
          ...defaultForm,
          ...formData,
          id: editingId,
          hadir: formData.hadir ?? att.hadir,
          sakit: formData.sakit ?? att.sakit,
          izin: formData.izin ?? att.izin,
          alpa: formData.alpa ?? att.alpa,
          terlambat: formData.terlambat ?? att.terlambat,
          totalSiswa: formData.totalSiswa ?? att.totalSiswa,
          persentaseKehadiran: (formData.totalSiswa || att.totalSiswa) > 0 
            ? Number((((formData.hadir ?? att.hadir) / (formData.totalSiswa || att.totalSiswa)) * 100).toFixed(2)) 
            : 100
        } as AgendaGuruItem;
        Storage.updateAgendaGuru(updatedItem);
        setSelectedAgenda(updatedItem);
        setEditingId(null);
        setShowFormModal(false);
        onRefresh();
        setIsSubmitting(false);
        return;
      }

      const newItem: AgendaGuruItem = {
        ...defaultForm,
        ...formData,
        hadir: formData.hadir ?? att.hadir,
        sakit: formData.sakit ?? att.sakit,
        izin: formData.izin ?? att.izin,
        alpa: formData.alpa ?? att.alpa,
        terlambat: formData.terlambat ?? att.terlambat,
        totalSiswa: formData.totalSiswa ?? att.totalSiswa,
        siswaTidakHadir: formData.siswaTidakHadir || att.siswaTidakHadir,
        id: 'ag-' + Date.now(),
        persentaseKehadiran: (formData.totalSiswa || att.totalSiswa) > 0 
          ? Number((((formData.hadir ?? att.hadir) / (formData.totalSiswa || att.totalSiswa)) * 100).toFixed(2)) 
          : 100
      } as AgendaGuruItem;

      Storage.addAgendaGuru(newItem);
      setSelectedAgenda(newItem);

      // Auto-sync Agenda Kelas from this Agenda Guru
      const targetKelas = newItem.kelas || curKelas;
      const targetTanggal = newItem.tanggal || curTanggal;
      const targetHari = newItem.hari || 'Senin';

      try {
        const existingAgendaKelasList = Storage.getAgendaKelas();
        const matchedAKIndex = existingAgendaKelasList.findIndex(ak => ak.kelas === targetKelas && ak.tanggal === targetTanggal);

        const matchedKelasObj = kelasList.find(k => k.namaKelas === targetKelas);
        const waliKelasName = matchedKelasObj?.waliKelas || 'Wali Kelas';
        const ketuaKelasName = matchedKelasObj?.ketuaKelas || 'Ketua Kelas';
        const wakilKetuaName = matchedKelasObj?.wakilKetua || 'Wakil Ketua';

        const newMonitoringItem = {
          jp: newItem.jamKe || '1 - 4',
          mapel: newItem.mapel || 'Mata Pelajaran',
          guru: newItem.namaGuru || currentUser.nama,
          materi: newItem.materi || 'Materi Pembelajaran',
          tugas: newItem.tugas || 'Tidak ada tugas',
          status: 'Terlaksana' as const
        };

        if (matchedAKIndex >= 0) {
          const ak = existingAgendaKelasList[matchedAKIndex];
          const existingMon = ak.monitoringPembelajaran || [];
          const filteredMon = existingMon.filter(m => !(m.jp === newMonitoringItem.jp && m.guru === newMonitoringItem.guru));
          const updatedMon = [...filteredMon, newMonitoringItem];

          existingAgendaKelasList[matchedAKIndex] = {
            ...ak,
            hadir: newItem.hadir,
            sakit: newItem.sakit,
            izin: newItem.izin,
            alpa: newItem.alpa,
            terlambat: newItem.terlambat,
            jumlahSiswa: newItem.totalSiswa,
            persentase: newItem.persentaseKehadiran,
            siswaTidakHadir: newItem.siswaTidakHadir,
            monitoringPembelajaran: updatedMon
          };
          Storage.saveAgendaKelas(existingAgendaKelasList);
        } else {
          const safeKelasName = targetKelas ? targetKelas.replace(/\s+/g, '') : 'KELAS';
          const newAK: AgendaKelasItem = {
            id: 'ak-auto-' + Date.now(),
            nomorAgenda: `AK/${safeKelasName}/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${new Date().getDate()}`,
            tahunPelajaran: setting.tahunPelajaran,
            semester: setting.semester as 'Ganjil' | 'Genap',
            hari: targetHari,
            tanggal: targetTanggal,
            kelas: targetKelas,
            jurusan: matchedKelasObj?.jurusan || 'Kejuruan SMK',
            konsentrasiKeahlian: matchedKelasObj?.jurusan || 'Kejuruan SMK',
            waliKelas: waliKelasName,
            ketuaKelas: ketuaKelasName,
            wakilKetua: wakilKetuaName,
            jumlahSiswa: newItem.totalSiswa,
            jumlahLaki: matchedKelasObj?.jumlahLaki || Math.round(newItem.totalSiswa / 2),
            jumlahPerempuan: matchedKelasObj?.jumlahPerempuan || Math.floor(newItem.totalSiswa / 2),

            hadir: newItem.hadir,
            sakit: newItem.sakit,
            izin: newItem.izin,
            alpa: newItem.alpa,
            terlambat: newItem.terlambat,
            persentase: newItem.persentaseKehadiran,
            siswaTidakHadir: newItem.siswaTidakHadir,

            monitoringPembelajaran: [newMonitoringItem],
            agendaRoutine: [
              { waktu: '06.45', kegiatan: 'Piket Kebersihan Kelas', status: 'Terlaksana', catatan: 'Ruang Lab/Kelas bersih' },
              { waktu: '07.00', kegiatan: 'Apel / Doa Bersama', status: 'Terlaksana' },
              { waktu: '07.15', kegiatan: 'KBM Jam Pertama', status: 'Terlaksana' }
            ],
            pelanggaranList: [],
            prestasiList: [],
            kesehatanList: [],
            inventarisList: [],
            komunikasiOrtuList: [],
            catatanWaliKelas: {
              kondisiUmum: `KBM berjalan baik, tingkat kehadiran ${newItem.persentaseKehadiran}%.`,
              kedisiplinan: 'Siswa mengikuti pembelajaran dengan tertib.',
              budayaPositif: '5S berjalan lancar.',
              kebersihan: 'Kelas bersih.',
              keamanan: 'Aman.',
              siswaBermasalah: newItem.alpa > 0 ? `${newItem.alpa} siswa Alpa` : '-',
              siswaBerprestasi: '-',
              tindakLanjut: 'Terus pantau kehadiran siswa.'
            },
            validatedByWali: false
          };
          Storage.addAgendaKelas(newAK);
        }
      } catch (err) {
        console.error('Auto sync agenda kelas failed:', err);
      }

      setShowFormModal(false);
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-teal-600" />
            <span>Agenda Harian Guru (SMK Standard)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan kegiatan pembelajaran harian guru lengkap dari Identitas A hingga Validasi J.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => exportAgendaGuruToExcel(agendas)}
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
                nomorAgenda: `AG/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${Math.floor(100 + Math.random()*900)}`
              });
              setShowFormModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-teal-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Agenda Harian Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama guru, mapel, materi..."
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

      {/* Agenda Items List / Cards Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAgendas.map((ag) => (
          <div
            key={ag.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:border-teal-500 transition space-y-3"
          >
            {/* Header Card */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                  {ag.nomorAgenda}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {ag.namaGuru}
                </h3>
                <p className="text-xs text-slate-500">{ag.mapel} • Kelas {ag.kelas}</p>
              </div>

              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                ag.statusValidasi === 'Disetujui'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                <CheckCircle className="h-3 w-3" />
                <span>{ag.statusValidasi}</span>
              </span>
            </div>

            {/* Content Details */}
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <p className="line-clamp-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Materi: </span>
                {ag.materi}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <span>🗓️ {ag.hari}, {ag.tanggal}</span>
                <span>⏰ Jam ke {ag.jamKe} ({ag.jumlahJP} JP)</span>
                <span>🏫 {ag.ruang}</span>
              </div>
            </div>

            {/* Attendance Summary Bar */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-emerald-600 font-bold">Hadir: {ag.hadir}</span>
                <span className="text-amber-500">Sakit: {ag.sakit}</span>
                <span className="text-sky-500">Izin: {ag.izin}</span>
                <span className="text-rose-500 font-bold">Alpa: {ag.alpa}</span>
              </div>
              <span className="text-xs font-black text-teal-600">{ag.persentaseKehadiran}%</span>
            </div>

            {/* Card Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedAgenda(ag)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Eye className="h-3.5 w-3.5 text-teal-600" />
                <span>Detail</span>
              </button>

              <button
                onClick={() => handleEditAgenda(ag)}
                className="flex items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-amber-100 transition"
                title="Edit Agenda Guru"
              >
                <Pencil className="h-3.5 w-3.5 text-amber-600" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => handleDeleteAgenda(ag.id)}
                className="flex items-center gap-1 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 px-2 py-1.5 text-xs font-semibold hover:bg-rose-100 transition"
                title="Hapus Agenda Guru"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              </button>

              <button
                onClick={() => generateAgendaGuruPDF(ag, setting)}
                className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail Agenda Guru */}
      {selectedAgenda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wide">
                  {selectedAgenda.nomorAgenda}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Detail Agenda Harian Guru - {selectedAgenda.namaGuru}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAgenda(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-xs text-slate-700 dark:text-slate-300">
              {/* Section A */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">A. Identitas Guru & Kelas</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div><span className="text-slate-400 block">Tahun / Semester</span><b>{selectedAgenda.tahunPelajaran} ({selectedAgenda.semester})</b></div>
                  <div><span className="text-slate-400 block">Hari / Tanggal</span><b>{selectedAgenda.hari}, {selectedAgenda.tanggal}</b></div>
                  <div><span className="text-slate-400 block">NIP</span><b>{selectedAgenda.nip}</b></div>
                  <div><span className="text-slate-400 block">Mapel / Konsentrasi</span><b>{selectedAgenda.mapel}</b></div>
                  <div><span className="text-slate-400 block">Fase / Kelas / Ruang</span><b>Fase {selectedAgenda.fase} / {selectedAgenda.kelas} / {selectedAgenda.ruang || '-'}</b></div>
                  <div><span className="text-slate-400 block">Jam Ke / JP</span><b>Jam {selectedAgenda.jamKe} ({selectedAgenda.jumlahJP} JP)</b></div>
                </div>
              </div>

              {/* Section C */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">C. Agenda Pembelajaran</h4>
                <p><b>Elemen:</b> {selectedAgenda.elemen || '-'}</p>
                <p><b>CP:</b> {selectedAgenda.cp || '-'}</p>
                <p><b>Tujuan Pembelajaran:</b> {selectedAgenda.tujuanPembelajaran || '-'}</p>
                <p><b>Materi:</b> {selectedAgenda.materi}</p>
                <p><b>Model & Metode:</b> {selectedAgenda.modelPembelajaran} ({selectedAgenda.metode})</p>
                <p><b>Media & Alat Ajar:</b> {selectedAgenda.media || '-'}</p>
                <p><b>Platform Digital:</b> {selectedAgenda.platformDigital || '-'}</p>
                <p><b>LKPD / Bahan Ajar:</b> {selectedAgenda.lkpd || '-'}</p>
                <p><b>Tugas:</b> {selectedAgenda.tugas || 'Tidak ada tugas'}</p>
              </div>

              {/* Section D & E */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">D & E. Kehadiran Siswa</h4>
                <div className="flex gap-4">
                  <span className="text-emerald-600 font-bold">Hadir: {selectedAgenda.hadir}</span>
                  <span className="text-amber-500">Sakit: {selectedAgenda.sakit}</span>
                  <span className="text-sky-500">Izin: {selectedAgenda.izin}</span>
                  <span className="text-rose-500 font-bold">Alpa: {selectedAgenda.alpa}</span>
                  <span className="font-black text-teal-600">{selectedAgenda.persentaseKehadiran}%</span>
                </div>
                {selectedAgenda.siswaTidakHadir.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold block mb-1">Daftar Tidak Hadir:</span>
                    <ul className="list-disc pl-4 space-y-1">
                      {selectedAgenda.siswaTidakHadir.map((s, i) => (
                        <li key={i}>{s.nama} ({s.kategori}) - Alasan: {s.alasan}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Section H: Catatan */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px]">H. Catatan Guru</h4>
                <p><b>Kendala:</b> {selectedAgenda.kendala || '-'}</p>
                <p><b>Solusi:</b> {selectedAgenda.solusi || '-'}</p>
                <p><b>Refleksi:</b> {selectedAgenda.refleksi || '-'}</p>
              </div>

              {/* Section I: Bukti Dokumen, Foto Selfie & Tautan */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-teal-600" />
                  <span>I. Foto Selfie Bukti & Dokumen Pendukung</span>
                </h4>

                {/* Foto Selfie Grid */}
                {selectedAgenda.fotoUrls && selectedAgenda.fotoUrls.length > 0 ? (
                  <div>
                    <span className="text-[11px] text-slate-500 font-semibold block mb-1">Foto Selfie & Dokumentasi KBM:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedAgenda.fotoUrls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video group">
                          <img src={url} alt={`Bukti ${idx+1}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">Tidak ada foto selfie diunggah.</p>
                )}

                {/* Tautan Link & Dokumen */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                  {selectedAgenda.driveFolderLink && (
                    <a
                      href={selectedAgenda.driveFolderLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                    >
                      <LinkIcon className="h-3.5 w-3.5" />
                      <span>Buka Google Drive Agenda</span>
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
                      <span>Lihat Dokumen Pendukung</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Section J: Tanda Tangan Digital */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[11px] flex items-center gap-1.5">
                  <PenTool className="h-4 w-4 text-teal-600" />
                  <span>J. Validasi Tanda Tangan Digital</span>
                </h4>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="text-center sm:text-left space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Guru Pengampu</span>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedAgenda.namaGuru}</p>
                    <p className="text-[11px] text-slate-500">NIP. {selectedAgenda.nip}</p>
                  </div>

                  <div className="flex flex-col items-center">
                    {selectedAgenda.ttdGuru ? (
                      selectedAgenda.ttdGuru.startsWith('data:image') ? (
                        <div className="p-1 rounded bg-white border border-slate-200 dark:border-slate-700 shadow-xs">
                          <img src={selectedAgenda.ttdGuru} alt="Tanda Tangan Guru" className="h-14 object-contain" />
                        </div>
                      ) : (
                        <div className="font-serif italic font-bold text-slate-800 dark:text-slate-200 text-lg border-b border-slate-400 px-3 py-1">
                          {selectedAgenda.ttdGuru}
                        </div>
                      )
                    ) : (
                      <span className="text-rose-500 italic text-[11px]">Belum ditandatangani</span>
                    )}
                    <span className="text-[9px] text-teal-600 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Digital Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
              <span className="text-xs text-slate-400">Validasi: {selectedAgenda.statusValidasi}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => generateAgendaGuruPDF(selectedAgenda, setting)}
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

      {/* Modal Form Agenda Guru Baru */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-teal-600" />
                <span>Form Isian Agenda Harian Guru (A-J)</span>
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 text-xs">
              {/* Identitas */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="font-bold text-teal-700 dark:text-teal-400 uppercase text-xs">A. Identitas Guru & Mengajar</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1">Nama Guru</label>
                    <input
                      type="text"
                      value={formData.namaGuru || ''}
                      onChange={(e) => setFormData({ ...formData, namaGuru: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1">Tanggal</label>
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
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Hari</label>
                    <select
                      value={formData.hari || getDayName(formData.tanggal)}
                      onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-bold"
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
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold flex items-center justify-between">
                      <span>Kelas / Rombel</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">Data Master</span>
                    </label>
                    <select
                      value={formData.kelas || ''}
                      onChange={(e) => {
                        const selectedKelas = e.target.value;
                        const matchedKelasObj = kelasList.find(k => k.namaKelas === selectedKelas);
                        const matchingJadwal = jadwalList.find(j => 
                          j.kelas === selectedKelas && (
                            !formData.namaGuru || j.guru.toLowerCase().includes((formData.namaGuru || '').toLowerCase())
                          )
                        );
                        setFormData(prev => ({
                          ...prev,
                          kelas: selectedKelas,
                          konsentrasiKeahlian: matchedKelasObj?.jurusan || prev.konsentrasiKeahlian || 'Kejuruan SMK',
                          mapel: matchingJadwal?.mapel || prev.mapel || (mapelList[0]?.namaMapel || ''),
                          ruang: matchingJadwal?.ruang || prev.ruang || 'Lab Komputer 1',
                          jamKe: matchingJadwal?.jp ? `JP ${matchingJadwal.jp}` : prev.jamKe || '1 - 4'
                        }));
                      }}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white cursor-pointer"
                    >
                      {kelasList.map(k => (
                        <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Konsentrasi Keahlian</label>
                    <input
                      type="text"
                      value={formData.konsentrasiKeahlian || ''}
                      onChange={(e) => setFormData({ ...formData, konsentrasiKeahlian: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-semibold"
                      placeholder="e.g. Rekayasa Perangkat Lunak"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold flex items-center justify-between">
                      <span>Mata Pelajaran</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono font-bold">
                        {mapelList.length} Mapel Master
                      </span>
                    </label>
                    <select
                      value={formData.mapel || ''}
                      onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white cursor-pointer"
                      required
                    >
                      <option value="">-- Pilih Mata Pelajaran --</option>
                      {mapelList.map((m) => (
                        <option key={m.id} value={m.namaMapel}>
                          {m.namaMapel} {m.kode ? `[${m.kode}]` : ''} ({m.kelompok || 'Kejuruan'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Fase Kurikulum</label>
                    <select
                      value={formData.fase || 'F'}
                      onChange={(e) => setFormData({ ...formData, fase: e.target.value as 'E' | 'F' })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-bold"
                    >
                      <option value="E">Fase E (Kelas X)</option>
                      <option value="F">Fase F (Kelas XI / XII)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Ruang / Lab Pembelajaran</label>
                    <input
                      type="text"
                      value={formData.ruang || ''}
                      onChange={(e) => setFormData({ ...formData, ruang: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-semibold"
                      placeholder="e.g. Lab Komputer 1 / Ruang XI RPL 1"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1">Jam Ke / Waktu</label>
                    <input
                      type="text"
                      value={formData.jamKe || ''}
                      onChange={(e) => setFormData({ ...formData, jamKe: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      placeholder="e.g. 1 - 4"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1">Jumlah JP</label>
                    <input
                      type="number"
                      value={formData.jumlahJP || 4}
                      onChange={(e) => setFormData({ ...formData, jumlahJP: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Agenda Pembelajaran */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="font-bold text-teal-700 dark:text-teal-400 uppercase text-xs">C. Agenda Pembelajaran</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1">Elemen CP</label>
                    <input
                      type="text"
                      value={formData.elemen || ''}
                      onChange={(e) => setFormData({ ...formData, elemen: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      placeholder="Sesuai elemen mata pelajaran"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1">Tujuan Pembelajaran (TP)</label>
                    <input
                      type="text"
                      value={formData.tujuanPembelajaran || ''}
                      onChange={(e) => setFormData({ ...formData, tujuanPembelajaran: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      placeholder="Sesuai TP yang direncanakan"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Capaian Pembelajaran (CP)</label>
                    <textarea
                      value={formData.cp || ''}
                      onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      rows={2}
                      placeholder="Masukkan Capaian Pembelajaran (CP) sesuai kurikulum..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Alur Tujuan Pembelajaran (ATP)</label>
                    <textarea
                      value={formData.atp || ''}
                      onChange={(e) => setFormData({ ...formData, atp: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      rows={2}
                      placeholder="Masukkan Alur Tujuan Pembelajaran (ATP)..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Materi Pembelajaran</label>
                    <textarea
                      value={formData.materi || ''}
                      onChange={(e) => setFormData({ ...formData, materi: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      rows={2}
                      placeholder="Uraian ringkas materi yang diajarkan..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Model Pembelajaran</label>
                    <input
                      type="text"
                      value={formData.modelPembelajaran || ''}
                      onChange={(e) => setFormData({ ...formData, modelPembelajaran: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      placeholder="e.g. Project Based Learning (PjBL)"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Metode Pembelajaran</label>
                    <input
                      type="text"
                      value={formData.metode || ''}
                      onChange={(e) => setFormData({ ...formData, metode: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800 font-bold"
                      placeholder="e.g. Demonstrasi, Diskusi, Praktik"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Media & Alat Ajar</label>
                    <input
                      type="text"
                      value={formData.media || ''}
                      onChange={(e) => setFormData({ ...formData, media: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      placeholder="e.g. LCD Proyektor, PC Lab, VS Code, Figma"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Platform Digital</label>
                    <input
                      type="text"
                      value={formData.platformDigital || ''}
                      onChange={(e) => setFormData({ ...formData, platformDigital: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      placeholder="e.g. Google Classroom, SIMAGU LMS, Quizizz"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">LKPD / Bahan Ajar</label>
                    <input
                      type="text"
                      value={formData.lkpd || ''}
                      onChange={(e) => setFormData({ ...formData, lkpd: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      placeholder="e.g. LKPD-01 Praktik Layouting Responsive, Modul Digital"
                    />
                  </div>
                </div>
              </div>

              {/* Kehadiran */}
              <div className="space-y-3 p-4 rounded-xl border border-teal-500/30 bg-teal-50/30 dark:bg-slate-800/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-200 dark:border-slate-700 pb-2">
                  <h4 className="font-bold text-teal-800 dark:text-teal-300 uppercase text-xs flex items-center gap-1.5">
                    <span>D. Rekap Kehadiran Siswa</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                      🔒 Hanya Bisa Dilihat
                    </span>
                  </h4>
                  <span className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold italic">
                    ⚡ Otomatis terisi saat guru mata pelajaran mengisi Absensi Siswa
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Total Siswa</label>
                    <input
                      type="number"
                      value={formData.totalSiswa ?? 36}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-slate-100 dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-600 dark:text-emerald-400 mb-1 font-bold">Hadir</label>
                    <input
                      type="number"
                      value={formData.hadir ?? 33}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border border-emerald-300 dark:border-emerald-800 p-2 bg-emerald-50 dark:bg-emerald-950/40 font-black text-emerald-700 dark:text-emerald-300 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-600 dark:text-amber-400 mb-1 font-bold">Sakit</label>
                    <input
                      type="number"
                      value={formData.sakit ?? 1}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border border-amber-300 dark:border-amber-800 p-2 bg-amber-50 dark:bg-amber-950/40 font-black text-amber-700 dark:text-amber-300 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sky-600 dark:text-sky-400 mb-1 font-bold">Izin</label>
                    <input
                      type="number"
                      value={formData.izin ?? 1}
                      readOnly
                      tabIndex={-1}
                      className="w-full rounded-lg border border-sky-300 dark:border-sky-800 p-2 bg-sky-50 dark:bg-sky-950/40 font-black text-sky-700 dark:text-sky-300 cursor-not-allowed select-none"
                    />
                  </div>
                  <div>
                    <label className="block text-rose-600 dark:text-rose-400 mb-1 font-bold">Alpa</label>
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

              {/* Kendala, Keadaan Kelas & Refleksi Guru */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="font-bold text-teal-700 dark:text-teal-400 uppercase text-xs">E. Kendala Pembelajaran, Keadaan Kelas & Refleksi Guru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Kendala / Keadaan Kelas</label>
                    <textarea
                      value={formData.kendala || ''}
                      onChange={(e) => setFormData({ ...formData, kendala: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      rows={2}
                      placeholder="Catatan kendala teknis atau kondisi / keadaan kelas saat KBM..."
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Solusi & Tindak Lanjut</label>
                    <textarea
                      value={formData.solusi || ''}
                      onChange={(e) => setFormData({ ...formData, solusi: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      rows={2}
                      placeholder="Langkah penanganan atau solusi kendala..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 dark:text-slate-300 mb-1 font-semibold">Refleksi Guru</label>
                    <textarea
                      value={formData.refleksi || ''}
                      onChange={(e) => setFormData({ ...formData, refleksi: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 p-2 bg-white dark:bg-slate-800"
                      rows={2}
                      placeholder="Uraian refleksi pembelajaran guru (pemahaman siswa, keberhasilan KBM, umpan balik)..."
                    />
                  </div>
                </div>
              </div>

              {/* Catatan & Bukti Dokumen */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="font-bold text-teal-700 dark:text-teal-400 uppercase text-xs">I. Foto Selfie Bukti & Dokumen Pendukung</h4>
                
                <ProofUploader
                  fotoUrls={formData.fotoUrls}
                  dokumenUrl={formData.dokumenUrl}
                  driveFolderLink={formData.driveFolderLink}
                  onChangePhotos={(urls) => setFormData({ ...formData, fotoUrls: urls })}
                  onChangeDocument={(doc) => setFormData({ ...formData, dokumenUrl: doc })}
                  onChangeDriveLink={(link) => setFormData({ ...formData, driveFolderLink: link })}
                  title="Unggah Selfie KBM & Dokumen / Tautan Link Drive"
                />
              </div>

              {/* Tanda Tangan Digital */}
              <div className="space-y-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h4 className="font-bold text-teal-700 dark:text-teal-400 uppercase text-xs">J. Tanda Tangan Digital Guru</h4>
                
                <DigitalSignaturePad
                  initialSignature={formData.ttdGuru}
                  signerName={formData.namaGuru || currentUser.nama}
                  onSave={(sig) => setFormData({ ...formData, ttdGuru: sig })}
                  title="Tanda Tangan Digital Pengampu"
                />

                {formData.ttdGuru && (
                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 text-xs flex items-center justify-between">
                    <span className="text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Tanda Tangan Digital Tersimpan
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Verified Base64</span>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
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
                      <span>Simpan Agenda Guru</span>
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

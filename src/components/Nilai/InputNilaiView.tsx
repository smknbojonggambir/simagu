import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  BookOpen, 
  Users, 
  Plus, 
  RefreshCw,
  TrendingUp,
  GraduationCap,
  Sparkles,
  Download,
  Printer,
  Eye,
  UserCheck
} from 'lucide-react';
import { 
  NilaiSiswaRecord, 
  SiswaItem,
  KelasItem, 
  MapelItem, 
  GuruItem, 
  User,
  SchoolSetting 
} from '../../types';
import { Storage } from '../../lib/storage';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { generateRekapNilaiSiswaPDF } from '../../lib/pdfGenerator';
import { exportNilaiToExcel } from '../../lib/excelExport';
import { printHtmlReport, PrintReportOptions } from '../../lib/printWindowHelper';

interface InputNilaiViewProps {
  nilaiList: NilaiSiswaRecord[];
  siswaList: SiswaItem[];
  kelasList: KelasItem[];
  mapelList: MapelItem[];
  guruList: GuruItem[];
  currentUser: User;
  setting?: SchoolSetting;
  onRefresh: () => void;
}

export const InputNilaiView: React.FC<InputNilaiViewProps> = ({
  nilaiList,
  siswaList = [],
  kelasList,
  mapelList,
  guruList,
  currentUser,
  setting,
  onRefresh
}) => {
  // Filter States
  const [selectedKelas, setSelectedKelas] = useState<string>(kelasList[0]?.namaKelas || 'X DKV 1');
  const [selectedMapel, setSelectedMapel] = useState<string>('Desain Komunikasi Visual (DKV)');
  const [selectedGuru, setSelectedGuru] = useState<string>(currentUser.nama || 'Guru Pengampu');
  const [selectedHari, setSelectedHari] = useState<string>('Semua');
  const [selectedJenisAsesmen, setSelectedJenisAsesmen] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Editable States
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [editableGrades, setEditableGrades] = useState<Record<string, { formatif: number; praktik: number; catatan: string }>>({});
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Active School Setting fallback
  const activeSetting = setting || Storage.getSetting();

  // Find NIP for selected teacher
  const matchedGuruObj = useMemo(() => {
    return guruList.find(g => (g.nama || '').toLowerCase() === selectedGuru.toLowerCase() || (g.nama || '').includes(selectedGuru));
  }, [guruList, selectedGuru]);
  const selectedGuruNip = matchedGuruObj?.nip || currentUser.nip || '-';

  // Helper to match assessment types flexibly
  const isJenisMatch = (recordJenis: string, targetJenis: string) => {
    if (!targetJenis || targetJenis === 'Semua' || targetJenis === 'all') return true;
    if (!recordJenis) return false;
    const r = recordJenis.toLowerCase();
    const t = targetJenis.toLowerCase();
    if (r === t) return true;
    if (t.includes('formatif') && (r.includes('formatif') || r.includes('tugas') || r.includes('lkpd'))) return true;
    if (t.includes('praktik') && (r.includes('praktik') || r.includes('unjuk') || r.includes('lab') || r.includes('studio'))) return true;
    if (t.includes('sumatif') && (r.includes('sumatif') || r.includes('uh') || r.includes('sts') || r.includes('sas') || r.includes('pts') || r.includes('pas'))) return true;
    return r.includes(t) || t.includes(r);
  };

  // Helper to calculate final score dynamically
  const calcFinalScore = (formatif: number, praktik: number) => {
    if (formatif > 0 && praktik > 0) return Math.round((formatif + praktik) / 2);
    if (formatif > 0) return formatif;
    if (praktik > 0) return praktik;
    return 0;
  };

  // Filtered & Synchronized Records with Master Data Siswa
  const filteredRecords = useMemo(() => {
    // 1. Get students for selected class from Master Data
    const studentsInClass = siswaList.filter(s => s.kelas === selectedKelas);
    
    // 2. Map every master student to an existing grade record or a default grade 0 record
    const synchronized: NilaiSiswaRecord[] = studentsInClass.map(student => {
      const existing = nilaiList.find(n => 
        (n.nis === student.nis || n.id_siswa === student.id) &&
        (!selectedKelas || n.kelas === selectedKelas) &&
        (!selectedMapel || n.mapel.toLowerCase().includes(selectedMapel.toLowerCase()) || selectedMapel.toLowerCase().includes(n.mapel.toLowerCase())) &&
        isJenisMatch(n.jenisAsesmen, selectedJenisAsesmen)
      );

      if (existing) {
        return {
          ...existing,
          guru: selectedGuru || existing.guru,
          jenisAsesmen: selectedJenisAsesmen !== 'Semua' ? selectedJenisAsesmen : existing.jenisAsesmen
        };
      }

      // Default grade record initialized to 0 for selectedJenisAsesmen
      const assignedJenis = selectedJenisAsesmen === 'Semua' ? 'Formatif (Tugas)' : selectedJenisAsesmen;
      return {
        id: `nil-sync-${student.id}-${assignedJenis.replace(/[^a-zA-Z0-9]/g, '_')}`,
        tanggal: new Date().toISOString().slice(0, 10),
        hari: 'Senin',
        kelas: student.kelas,
        nis: student.nis,
        namaSiswa: student.nama,
        mapel: selectedMapel || 'Mata Pelajaran',
        guru: selectedGuru || currentUser.nama,
        jenisAsesmen: assignedJenis,
        materiJudul: assignedJenis.includes('Sumatif') ? 'Ulangan Sumatif' : assignedJenis.includes('Praktik') ? 'Praktik Studio / Lab' : 'Asesmen Formatif',
        nilaiFormatif: 0,
        nilaiPraktik: 0,
        nilaiAkhir: 0,
        predikat: 'D',
        statusKelulusan: 'Remedial',
        catatanGuru: 'Belum diinput',
        id_siswa: student.id
      };
    });

    // 3. Filter by additional controls (Hari, Jenis Asesmen, Search)
    return synchronized.filter(n => {
      const matchHari = selectedHari === 'Semua' || n.hari === selectedHari;
      const matchAsesmen = isJenisMatch(n.jenisAsesmen, selectedJenisAsesmen);
      const matchSearch = !searchQuery || n.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) || n.nis.includes(searchQuery);

      return matchHari && matchAsesmen && matchSearch;
    });
  }, [nilaiList, siswaList, selectedKelas, selectedMapel, selectedGuru, selectedHari, selectedJenisAsesmen, searchQuery, currentUser]);

  // Statistics
  const totalRecords = filteredRecords.length;
  const avgScore = totalRecords > 0 
    ? Math.round(filteredRecords.reduce((acc, curr) => acc + curr.nilaiAkhir, 0) / totalRecords) 
    : 0;
  const tuntasCount = filteredRecords.filter(n => n.statusKelulusan === 'Tuntas').length;
  const tuntasPercent = totalRecords > 0 ? Math.round((tuntasCount / totalRecords) * 100) : 0;
  const remedialCount = totalRecords - tuntasCount;

  // Print Report Options Builder
  const getNilaiPrintOptions = (): PrintReportOptions => {
    return {
      title: 'LAPORAN HASIL ASESMEN & NILAI SISWA PER GURU & PER MAPEL',
      subtitle: `MATA PELAJARAN: ${selectedMapel.toUpperCase()} | GURU: ${selectedGuru.toUpperCase()}`,
      nomorDokumen: `NIL/${selectedKelas.replace(/\s+/g, '')}/${new Date().getFullYear()}`,
      orientation: 'landscape',
      metadataGrid: [
        { label: 'Mata Pelajaran', value: selectedMapel },
        { label: 'Guru Pengampu / Pengajar', value: `${selectedGuru} (NIP: ${selectedGuruNip})` },
        { label: 'Rombel / Kelas', value: selectedKelas },
        { label: 'Tahun & Semester', value: `${activeSetting.tahunPelajaran} (${activeSetting.semester})` },
        { label: 'Jenis Asesmen Filter', value: selectedJenisAsesmen },
        { label: 'Status Ketuntasan', value: `${tuntasCount} Tuntas, ${remedialCount} Remedial (Rata-rata: ${avgScore})` },
      ],
      headers: ['NO', 'NIS', 'NAMA SISWA', 'KELAS', 'MATA PELAJARAN', 'GURU PENGAJAR', 'ASESMEN', 'N. FORMATIF', 'N. PRAKTIK', 'N. AKHIR', 'STATUS', 'EVALUASI GURU'],
      alignments: ['center', 'center', 'left', 'center', 'left', 'left', 'left', 'center', 'center', 'center', 'center', 'left'],
      rows: filteredRecords.map((item, idx) => {
        const edits = editableGrades[item.id] || {
          formatif: item.nilaiFormatif,
          praktik: item.nilaiPraktik,
          catatan: item.catatanGuru || ''
        };
        const finalScore = calcFinalScore(edits.formatif, edits.praktik);
        const predikat = finalScore >= 90 ? 'A' : finalScore >= 80 ? 'B' : finalScore >= 70 ? 'C' : 'D';
        const isTuntas = finalScore >= 75;

        return [
          idx + 1,
          item.nis || '-',
          item.namaSiswa,
          item.kelas,
          selectedMapel,
          selectedGuru,
          item.jenisAsesmen,
          edits.formatif,
          edits.praktik,
          finalScore,
          isTuntas ? 'Tuntas' : 'Remedial',
          edits.catatan || (isTuntas ? 'Hasil unjuk kerja memuaskan.' : 'Perlu pendampingan remedial.')
        ];
      }),
      signLeft: {
        role: 'Mengetahui,\nKepala Sekolah',
        nama: activeSetting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.',
        nip: activeSetting.nipKepalaSekolah || '-'
      },
      signRight: {
        role: 'Guru Mata Pelajaran,',
        nama: selectedGuru,
        nip: selectedGuruNip
      }
    };
  };

  // Handle Input Changes
  const handleGradeChange = (id: string, field: 'formatif' | 'praktik' | 'catatan', value: any) => {
    setEditableGrades(prev => {
      const existingRec = filteredRecords.find(r => r.id === id);
      const current = prev[id] || {
        formatif: existingRec ? existingRec.nilaiFormatif : 0,
        praktik: existingRec ? existingRec.nilaiPraktik : 0,
        catatan: existingRec ? (existingRec.catatanGuru || '') : ''
      };

      return {
        ...prev,
        [id]: {
          ...current,
          [field]: field === 'catatan' ? value : Math.min(100, Math.max(0, Number(value) || 0))
        }
      };
    });
  };

  // Save Grades to Storage
  const handleSaveGrades = async () => {
    setIsSubmitting(true);
    try {
      const updatedRecords = filteredRecords.map(item => {
        const edits = editableGrades[item.id];
        if (!edits) return item;

        const formatif = edits.formatif;
        const praktik = edits.praktik;
        const finalScore = calcFinalScore(formatif, praktik);
        const predikat = finalScore >= 90 ? 'A' : finalScore >= 80 ? 'B' : finalScore >= 70 ? 'C' : 'D';
        const isTuntas = finalScore >= 75;

        return {
          ...item,
          nilaiFormatif: formatif,
          nilaiPraktik: praktik,
          nilaiAkhir: finalScore,
          predikat: predikat as 'A' | 'B' | 'C' | 'D',
          statusKelulusan: isTuntas ? ('Tuntas' as const) : ('Remedial' as const),
          catatanGuru: edits.catatan || (isTuntas ? 'Hasil unjuk kerja memuaskan.' : 'Perlu pendampingan remedial.')
        };
      });

      Storage.bulkSaveNilaiSiswa(updatedRecords);
      setIsSavedSuccessfully(true);
      setTimeout(() => setIsSavedSuccessfully(false), 3000);
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-500/30 px-2.5 py-1 text-xs font-semibold text-teal-200 backdrop-blur-md">
              Modul Asesmen & Nilai
            </span>
            <span className="text-xs text-teal-300">Kurikulum Merdeka SMK</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Award className="h-7 w-7 text-teal-300" />
            Input Nilai & Evaluasi Siswa
          </h1>
          <p className="text-xs text-teal-100 max-w-2xl leading-relaxed">
            Pencatatan Asesmen Formatif, Nilai Praktik / Unjuk Kerja Studio, dan Penentuan Status Ketuntasan Pembelajaran Terintegrasi SMKN Bojonggambir.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 px-3.5 py-2.5 text-xs font-bold text-teal-200 transition active:scale-95"
            title="Pratinjau A4 Dokumen Cetak Nilai"
          >
            <Eye className="h-4 w-4 text-teal-300" />
            <span>Pratinjau A4</span>
          </button>
          <button
            onClick={() => generateRekapNilaiSiswaPDF(filteredRecords, activeSetting, 'harian', {
              guruName: selectedGuru,
              nipGuru: selectedGuruNip,
              mapelName: selectedMapel,
              kelasName: selectedKelas,
              jenisAsesmen: selectedJenisAsesmen
            })}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-teal-300 transition active:scale-95"
            title="Unduh PDF Resmi Hasil Penilaian Siswa"
          >
            <Download className="h-4 w-4 text-teal-400" />
            <span>PDF Nilai</span>
          </button>
          <button
            onClick={() => printHtmlReport(activeSetting, getNilaiPrintOptions())}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 px-3.5 py-2.5 text-xs font-bold text-slate-200 transition active:scale-95"
            title="Cetak HTML Browser Jendela Baru"
          >
            <Printer className="h-4 w-4 text-amber-400" />
            <span>Cetak HTML</span>
          </button>
          <button
            onClick={handleSaveGrades}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-600 transition active:scale-95"
          >
            <Save className="h-4 w-4" />
            Simpan Nilai
          </button>
        </div>
      </div>

      {/* Success Banner Notification */}
      {isSavedSuccessfully && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-medium">
            Nilai siswa berhasil disimpan ke LocalStorage dan tersinkronisasi dengan Database Operasional SIMAGU!
          </p>
        </div>
      )}

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Data Asesmen</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{totalRecords} <span className="text-xs font-normal text-slate-500">Record</span></p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Kelas: <strong className="text-slate-700 dark:text-slate-300">{selectedKelas}</strong></p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Rata-Rata Nilai Akhir</p>
              <p className="mt-1 text-2xl font-bold text-teal-600 dark:text-teal-400">{avgScore} <span className="text-xs font-normal text-slate-500">/ 100</span></p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Standar KKM/KKTP: <strong className="text-emerald-600">75.00</strong></p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Siswa Tuntas (KKTP)</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{tuntasCount} <span className="text-xs font-normal text-slate-500">({tuntasPercent}%)</span></p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${tuntasPercent}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Perlu Remedial</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{remedialCount} <span className="text-xs font-normal text-slate-500">Siswa</span></p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Butuh pendampingan khusus guru mapel</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 flex-1">
            {/* Select Guru Pengampu */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-teal-600" />
                <span>Guru Pengampu</span>
              </label>
              <select
                value={selectedGuru}
                onChange={e => setSelectedGuru(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {guruList.map(g => (
                  <option key={g.id} value={g.nama}>{g.nama}</option>
                ))}
              </select>
            </div>

            {/* Select Class */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pilih Rombel / Kelas</label>
              <select
                value={selectedKelas}
                onChange={e => setSelectedKelas(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {kelasList.map(k => (
                  <option key={k.id} value={k.namaKelas}>{k.namaKelas} ({k.jurusan})</option>
                ))}
              </select>
            </div>

            {/* Select Mapel */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mata Pelajaran</label>
              <select
                value={selectedMapel}
                onChange={e => setSelectedMapel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {mapelList.map(m => (
                  <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                ))}
              </select>
            </div>

            {/* Select Hari */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Hari Pembelajaran</label>
              <select
                value={selectedHari}
                onChange={e => setSelectedHari(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Semua">Semua Hari (Senin - Jumat)</option>
                <option value="Senin">Senin (2026-08-03)</option>
                <option value="Selasa">Selasa (2026-08-04)</option>
                <option value="Rabu">Rabu (2026-08-05)</option>
                <option value="Kamis">Kamis (2026-08-06)</option>
                <option value="Jumat">Jumat (2026-08-07)</option>
              </select>
            </div>

            {/* Select Asesmen */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Asesmen</label>
              <select
                value={selectedJenisAsesmen}
                onChange={e => setSelectedJenisAsesmen(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Semua">Semua Jenis Asesmen</option>
                <option value="Formatif (Tugas)">Formatif (Tugas / LKPD)</option>
                <option value="Praktik / Unjuk Kerja">Praktik / Unjuk Kerja Studio</option>
                <option value="Sumatif (UH)">Sumatif (Ulangan Harian)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Bar & Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIS atau Nama Siswa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500">
              Menampilkan <strong>{filteredRecords.length}</strong> siswa
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Assessment Input */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-teal-600" />
              Daftar Penilaian Siswa ({selectedKelas} - {selectedMapel})
            </h3>
            <p className="text-xs text-slate-500">
              Ubah langsung angka pada kolom Formatif dan Praktik, nilai akhir dan predikat terhitung otomatis.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4">Nama Lengkap Siswa</th>
                <th className="py-3 px-4 w-28">Hari & Tgl</th>
                <th className="py-3 px-4 w-32">Jenis Asesmen</th>
                <th className="py-3 px-4 w-28 text-center bg-teal-50/50 dark:bg-teal-950/30">Nilai Formatif</th>
                <th className="py-3 px-4 w-28 text-center bg-blue-50/50 dark:bg-blue-950/30">Nilai Praktik</th>
                <th className="py-3 px-4 w-24 text-center font-bold">Nilai Akhir</th>
                <th className="py-3 px-4 w-20 text-center">Predikat</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4">Catatan & Evaluasi Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Award className="h-10 w-10 text-slate-300" />
                      <p className="font-medium">Tidak ada data penilaian untuk filter yang dipilih.</p>
                      <p className="text-[11px] text-slate-500">Coba ubah pilihan kelas, mata pelajaran, atau kata kunci pencarian.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item, index) => {
                  const edits = editableGrades[item.id] || {
                    formatif: item.nilaiFormatif,
                    praktik: item.nilaiPraktik,
                    catatan: item.catatanGuru || ''
                  };

                  const currentFormatif = edits.formatif;
                  const currentPraktik = edits.praktik;
                  const currentFinal = Math.round((currentFormatif + currentPraktik) / 2);
                  const currentPredikat = currentFinal >= 90 ? 'A' : currentFinal >= 80 ? 'B' : currentFinal >= 70 ? 'C' : 'D';
                  const currentIsTuntas = currentFinal >= 75;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.nis}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.namaSiswa}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {item.hari}, {item.tanggal.split('-')[2]}/08
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                          {item.jenisAsesmen}
                        </span>
                      </td>

                      {/* Editable Formatif Input */}
                      <td className="py-2 px-3 text-center bg-teal-50/30 dark:bg-teal-950/10">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={currentFormatif}
                          onChange={e => handleGradeChange(item.id, 'formatif', e.target.value)}
                          className="w-16 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 px-2 py-1 text-center font-bold text-teal-700 dark:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-xs"
                        />
                      </td>

                      {/* Editable Praktik Input */}
                      <td className="py-2 px-3 text-center bg-blue-50/30 dark:bg-blue-950/10">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={currentPraktik}
                          onChange={e => handleGradeChange(item.id, 'praktik', e.target.value)}
                          className="w-16 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 px-2 py-1 text-center font-bold text-blue-700 dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                        />
                      </td>

                      {/* Computed Final Score */}
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white text-sm">
                        {currentFinal}
                      </td>

                      {/* Computed Predikat Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full font-bold text-xs ${
                          currentPredikat === 'A' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          currentPredikat === 'B' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                          currentPredikat === 'C' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {currentPredikat}
                        </span>
                      </td>

                      {/* Computed Tuntas / Remedial Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          currentIsTuntas
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {currentIsTuntas ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Tuntas
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3" />
                              Remedial
                            </>
                          )}
                        </span>
                      </td>

                      {/* Editable Catatan Guru */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={edits.catatan}
                          placeholder="Catatan evaluasi guru..."
                          onChange={e => handleGradeChange(item.id, 'catatan', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Terakhir diperbarui oleh: <strong className="text-slate-700 dark:text-slate-300">{currentUser.nama}</strong> ({currentUser.role})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 px-3.5 py-2 text-xs font-bold hover:bg-teal-100 transition"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Pratinjau A4</span>
            </button>

            <button
              onClick={() => generateRekapNilaiSiswaPDF(filteredRecords, activeSetting, 'harian', {
                guruName: selectedGuru,
                nipGuru: selectedGuruNip,
                mapelName: selectedMapel,
                kelasName: selectedKelas,
                jenisAsesmen: selectedJenisAsesmen
              })}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50 transition"
            >
              <Download className="h-3.5 w-3.5 text-teal-600" />
              <span>Unduh PDF</span>
            </button>

            <button
              onClick={() => exportNilaiToExcel(filteredRecords)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-bold hover:bg-slate-50 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleSaveGrades}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition active:scale-95 ml-1 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Simpan Seluruh Nilai</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        setting={activeSetting}
        options={getNilaiPrintOptions()}
        onDownloadPdf={() => generateRekapNilaiSiswaPDF(filteredRecords, activeSetting, 'harian', {
          guruName: selectedGuru,
          nipGuru: selectedGuruNip,
          mapelName: selectedMapel,
          kelasName: selectedKelas,
          jenisAsesmen: selectedJenisAsesmen
        })}
        onExportExcel={() => exportNilaiToExcel(filteredRecords)}
      />
    </div>
  );
};

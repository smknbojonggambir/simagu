import React, { useState, useMemo, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
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
  UserCheck,
  Calendar,
  Clock,
  ArrowRight,
  Edit3,
  X,
  Check,
  SlidersHorizontal,
  Info,
  CalendarDays,
  CheckCheck
} from 'lucide-react';
import { 
  NilaiSiswaRecord, 
  SiswaItem, 
  KelasItem, 
  MapelItem, 
  GuruItem, 
  JadwalItem,
  User, 
  SchoolSetting 
} from '../../types';
import { Storage } from '../../lib/storage';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { generateRekapNilaiSiswaPDF } from '../../lib/pdfGenerator';
import { exportNilaiToExcel } from '../../lib/excelExport';
import { printHtmlReport, PrintReportOptions } from '../../lib/printWindowHelper';
import { toast } from 'sonner';

export const HARI_OPTIONS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'] as const;

export const BULAN_OPTIONS = [
  { value: 'all', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
];

export function getHariFromDate(dateStr: string): string {
  if (!dateStr) return 'Senin';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      const mapping = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      return mapping[d.getDay()];
    }
  }
  return 'Senin';
}

export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function formatLongDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const bulanNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${day} ${bulanNames[monthIndex] || ''} ${year}`;
  }
  return dateStr;
}

interface InputNilaiViewProps {
  nilaiList: NilaiSiswaRecord[];
  siswaList: SiswaItem[];
  kelasList: KelasItem[];
  mapelList: MapelItem[];
  guruList: GuruItem[];
  jadwalList?: JadwalItem[];
  currentUser: User;
  setting?: SchoolSetting;
  onRefresh: () => void;
}

export const InputNilaiView: React.FC<InputNilaiViewProps> = ({
  nilaiList = [],
  siswaList = [],
  kelasList = [],
  mapelList = [],
  guruList = [],
  jadwalList = [],
  currentUser,
  setting,
  onRefresh
}) => {
  const activeSetting = setting || Storage.getSetting();
  const safeJadwalList = jadwalList.length > 0 ? jadwalList : Storage.getJadwal();

  // Primary Filters
  const [selectedKelas, setSelectedKelas] = useState<string>(kelasList[0]?.namaKelas || 'X DKV 1');
  const [selectedMapel, setSelectedMapel] = useState<string>('Desain Komunikasi Visual (DKV)');
  const [selectedGuru, setSelectedGuru] = useState<string>(currentUser.nama || guruList[0]?.nama || 'Guru Pengampu');
  const [selectedHari, setSelectedHari] = useState<string>('Semua');
  const [selectedJenisAsesmen, setSelectedJenisAsesmen] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extended Filters (Point 6 of requirements)
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'specific' | 'range' | 'month'>('all');
  const [filterSpecificDate, setFilterSpecificDate] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('2026-07-15');
  const [filterEndDate, setFilterEndDate] = useState<string>('2026-08-09');
  const [filterBulan, setFilterBulan] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterTahunPelajaran, setFilterTahunPelajaran] = useState<string>('all');

  // Modals & Inline Editable State
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [editableGrades, setEditableGrades] = useState<Record<string, { formatif: number; praktik: number; catatan: string; tanggal?: string; hari?: string; judul?: string }>>({});
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form Modal "Tambah / Edit Penilaian"
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalAssessmentId, setModalAssessmentId] = useState<string>('');
  const [modalGuru, setModalGuru] = useState<string>(currentUser.nama || guruList[0]?.nama || 'Guru Pengampu');
  const [modalMapel, setModalMapel] = useState<string>(selectedMapel);
  const [modalKelas, setModalKelas] = useState<string>(selectedKelas);
  const [modalModeHari, setModalModeHari] = useState<'otomatis' | 'manual'>('otomatis');
  const [modalTanggal, setModalTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [modalHari, setModalHari] = useState<string>(() => getHariFromDate(new Date().toISOString().slice(0, 10)));
  const [modalTahunPelajaran, setModalTahunPelajaran] = useState<string>(activeSetting.tahunPelajaran || '2026/2027');
  const [modalSemester, setModalSemester] = useState<'Ganjil' | 'Genap'>((activeSetting.semester as 'Ganjil' | 'Genap') || 'Ganjil');
  const [modalJenisAsesmen, setModalJenisAsesmen] = useState<NilaiSiswaRecord['jenisAsesmen']>('Formatif (Tugas)');
  const [modalJudulPenilaian, setModalJudulPenilaian] = useState<string>('Tugas 1 - Pemahaman Konsep');
  const [modalStudentScores, setModalStudentScores] = useState<Record<string, { formatif: number; praktik: number; catatan: string }>>({});
  const [modalStudentSearch, setModalStudentSearch] = useState<string>('');
  const [modalWarningDismissed, setModalWarningDismissed] = useState<boolean>(false);

  // Teacher NIP Lookup
  const matchedGuruObj = useMemo(() => {
    return guruList.find(g => (g.nama || '').toLowerCase() === selectedGuru.toLowerCase() || (g.nama || '').includes(selectedGuru));
  }, [guruList, selectedGuru]);
  const selectedGuruNip = matchedGuruObj?.nip || currentUser.nip || '-';

  // Schedule Match (Point 5 of user request)
  const matchedSchedule = useMemo(() => {
    if (!safeJadwalList || safeJadwalList.length === 0) return null;
    return safeJadwalList.find(j => {
      const matchK = !selectedKelas || j.kelas === selectedKelas;
      const matchM = !selectedMapel || (j.mapel && (j.mapel.toLowerCase().includes(selectedMapel.toLowerCase()) || selectedMapel.toLowerCase().includes(j.mapel.toLowerCase())));
      const matchG = !selectedGuru || (j.guru && (j.guru.toLowerCase().includes(selectedGuru.toLowerCase()) || selectedGuru.toLowerCase().includes(j.guru.toLowerCase())));
      return matchK && matchM && matchG;
    }) || safeJadwalList.find(j => j.kelas === selectedKelas && j.mapel.toLowerCase().includes(selectedMapel.toLowerCase())) || null;
  }, [safeJadwalList, selectedKelas, selectedMapel, selectedGuru]);

  const modalMatchedSchedule = useMemo(() => {
    if (!safeJadwalList || safeJadwalList.length === 0) return null;
    return safeJadwalList.find(j => {
      const matchK = !modalKelas || j.kelas === modalKelas;
      const matchM = !modalMapel || (j.mapel && (j.mapel.toLowerCase().includes(modalMapel.toLowerCase()) || modalMapel.toLowerCase().includes(j.mapel.toLowerCase())));
      const matchG = !modalGuru || (j.guru && (j.guru.toLowerCase().includes(modalGuru.toLowerCase()) || modalGuru.toLowerCase().includes(j.guru.toLowerCase())));
      return matchK && matchM && matchG;
    }) || safeJadwalList.find(j => j.kelas === modalKelas && j.mapel.toLowerCase().includes(modalMapel.toLowerCase())) || null;
  }, [safeJadwalList, modalKelas, modalMapel, modalGuru]);

  // Calendar consistency check
  const modalExpectedHari = useMemo(() => {
    return getHariFromDate(modalTanggal);
  }, [modalTanggal]);

  const isModalDayConsistent = useMemo(() => {
    return modalHari === modalExpectedHari;
  }, [modalHari, modalExpectedHari]);

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
    if (t.includes('portofolio') && r.includes('portofolio')) return true;
    return r.includes(t) || t.includes(r);
  };

  // Helper score calculation
  const calcFinalScore = (formatif: number, praktik: number) => {
    if (formatif > 0 && praktik > 0) return Math.round((formatif + praktik) / 2);
    if (formatif > 0) return formatif;
    if (praktik > 0) return praktik;
    return 0;
  };

  const calcPredikat = (finalScore: number): 'A' | 'B' | 'C' | 'D' => {
    if (finalScore >= 90) return 'A';
    if (finalScore >= 80) return 'B';
    if (finalScore >= 70) return 'C';
    return 'D';
  };

  // Synchronized and Filtered Records
  const filteredRecords = useMemo(() => {
    // 1. Get students for selected class from Master Data
    const studentsInClass = siswaList.filter(s => s.kelas === selectedKelas);
    
    // 2. Map master students to existing records or initialize default view
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
          jenisAsesmen: (selectedJenisAsesmen !== 'Semua' ? selectedJenisAsesmen : existing.jenisAsesmen) as NilaiSiswaRecord['jenisAsesmen']
        };
      }

      // Default synchronized record initialized
      const assignedJenis = (selectedJenisAsesmen === 'Semua' ? 'Formatif (Tugas)' : selectedJenisAsesmen) as NilaiSiswaRecord['jenisAsesmen'];
      const defaultDate = new Date().toISOString().slice(0, 10);
      const defaultHari = getHariFromDate(defaultDate);

      return {
        id: `nil-sync-${student.id}-${assignedJenis.replace(/[^a-zA-Z0-9]/g, '_')}`,
        tanggal: defaultDate,
        hari: defaultHari,
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

    // 3. Apply Multi-Dimension Filters
    return synchronized.filter(n => {
      // Filter Hari
      const matchHari = selectedHari === 'Semua' || n.hari === selectedHari;

      // Filter Date Mode
      let matchDate = true;
      if (dateFilterMode === 'specific' && filterSpecificDate) {
        matchDate = n.tanggal === filterSpecificDate;
      } else if (dateFilterMode === 'range' && filterStartDate && filterEndDate) {
        matchDate = n.tanggal >= filterStartDate && n.tanggal <= filterEndDate;
      } else if (dateFilterMode === 'month' && filterBulan !== 'all') {
        const itemMonth = n.tanggal.split('-')[1];
        matchDate = itemMonth === filterBulan;
      }

      // Filter Semester & Tahun
      const matchSemester = filterSemester === 'all' || !n.semester || n.semester === filterSemester;
      const matchTahun = filterTahunPelajaran === 'all' || !n.tahunPelajaran || n.tahunPelajaran === filterTahunPelajaran;

      // Filter Asesmen & Search
      const matchAsesmen = isJenisMatch(n.jenisAsesmen, selectedJenisAsesmen);
      const matchSearch = !searchQuery || 
        n.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) || 
        n.nis.includes(searchQuery) ||
        (n.materiJudul && n.materiJudul.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchHari && matchDate && matchSemester && matchTahun && matchAsesmen && matchSearch;
    });
  }, [
    nilaiList, 
    siswaList, 
    selectedKelas, 
    selectedMapel, 
    selectedGuru, 
    selectedHari, 
    selectedJenisAsesmen, 
    searchQuery, 
    dateFilterMode, 
    filterSpecificDate, 
    filterStartDate, 
    filterEndDate, 
    filterBulan, 
    filterSemester, 
    filterTahunPelajaran, 
    currentUser
  ]);

  // Statistics
  const totalRecords = filteredRecords.length;
  const avgScore = totalRecords > 0 
    ? Math.round(filteredRecords.reduce((acc, curr) => acc + curr.nilaiAkhir, 0) / totalRecords) 
    : 0;
  const tuntasCount = filteredRecords.filter(n => n.statusKelulusan === 'Tuntas').length;
  const tuntasPercent = totalRecords > 0 ? Math.round((tuntasCount / totalRecords) * 100) : 0;
  const remedialCount = totalRecords - tuntasCount;

  // Print Report Options Builder (Point 8 of requirements)
  const getNilaiPrintOptions = (): PrintReportOptions => {
    const hariInfoText = selectedHari !== 'Semua' 
      ? `${selectedHari}${filterSpecificDate ? `, ${formatDateDDMMYYYY(filterSpecificDate)}` : ''}`
      : 'Semua Hari Pembelajaran';

    return {
      title: 'LAPORAN REKAPITULASI HASIL ASESMEN & NILAI SISWA PER GURU & PER MAPEL',
      subtitle: `MATA PELAJARAN: ${selectedMapel.toUpperCase()} | GURU: ${selectedGuru.toUpperCase()}`,
      nomorDokumen: `NIL/${selectedKelas.replace(/\s+/g, '')}/${new Date().getFullYear()}`,
      orientation: 'landscape',
      metadataGrid: [
        { label: 'Mata Pelajaran', value: selectedMapel },
        { label: 'Guru Pengampu / Pengajar', value: `${selectedGuru} (NIP: ${selectedGuruNip})` },
        { label: 'Rombel / Kelas', value: selectedKelas },
        { label: 'Hari & Tanggal Pembelajaran', value: hariInfoText },
        { label: 'Tahun & Semester', value: `${activeSetting.tahunPelajaran} (${activeSetting.semester})` },
        { label: 'Jenis Asesmen', value: selectedJenisAsesmen },
        { label: 'Status Ketuntasan', value: `${tuntasCount} Tuntas, ${remedialCount} Remedial (Rata-rata: ${avgScore})` },
      ],
      headers: ['NO', 'NIS', 'NAMA SISWA', 'KELAS', 'HARI & TANGGAL', 'PENILAIAN', 'N. FORMATIF', 'N. PRAKTIK', 'N. AKHIR', 'STATUS', 'EVALUASI GURU'],
      alignments: ['center', 'center', 'left', 'center', 'center', 'left', 'center', 'center', 'center', 'center', 'left'],
      rows: filteredRecords.map((item, idx) => {
        const edits = editableGrades[item.id] || {
          formatif: item.nilaiFormatif,
          praktik: item.nilaiPraktik,
          catatan: item.catatanGuru || ''
        };
        const finalScore = calcFinalScore(edits.formatif, edits.praktik);
        const isTuntas = finalScore >= 75;

        return [
          idx + 1,
          item.nis || '-',
          item.namaSiswa,
          item.kelas,
          `${item.hari || '-'}\n${formatDateDDMMYYYY(item.tanggal)}`,
          item.materiJudul || item.jenisAsesmen,
          edits.formatif,
          edits.praktik,
          finalScore,
          isTuntas ? 'Tuntas' : 'Remedial',
          edits.catatan || (isTuntas ? 'Tuntas Capaian Pembelajaran' : 'Perlu bimbingan remedial')
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

  // Open "Tambah Penilaian" Modal (Point 1, 2, 3)
  const handleOpenAddModal = () => {
    setModalMode('create');
    const newAssId = `ASM-${Date.now()}`;
    setModalAssessmentId(newAssId);
    setModalGuru(selectedGuru);
    setModalMapel(selectedMapel);
    setModalKelas(selectedKelas);
    setModalModeHari('otomatis');
    const todayStr = new Date().toISOString().slice(0, 10);
    setModalTanggal(todayStr);
    setModalHari(getHariFromDate(todayStr));
    setModalTahunPelajaran(activeSetting.tahunPelajaran || '2026/2027');
    setModalSemester((activeSetting.semester as 'Ganjil' | 'Genap') || 'Ganjil');
    setModalJenisAsesmen('Formatif (Tugas)');
    setModalJudulPenilaian('Tugas 1 - Pemahaman Konsep');
    setModalWarningDismissed(false);

    // Populate default scores for all students in chosen class
    const students = siswaList.filter(s => s.kelas === selectedKelas);
    const initialScores: Record<string, { formatif: number; praktik: number; catatan: string }> = {};
    students.forEach(st => {
      initialScores[st.id] = {
        formatif: 85,
        praktik: 85,
        catatan: 'Tuntas Capaian Pembelajaran'
      };
    });
    setModalStudentScores(initialScores);
    setIsFormModalOpen(true);
  };

  // Update date in modal with automatic or manual day sync
  const handleModalDateChange = (newDate: string) => {
    setModalTanggal(newDate);
    const calculatedDay = getHariFromDate(newDate);
    if (modalModeHari === 'otomatis') {
      setModalHari(calculatedDay);
    }
  };

  // Update day in modal
  const handleModalDayChange = (newDay: string) => {
    setModalHari(newDay);
    setModalWarningDismissed(false);
  };

  // Switch Mode Hari Pembelajaran
  const handleToggleModeHari = (mode: 'otomatis' | 'manual') => {
    setModalModeHari(mode);
    if (mode === 'otomatis') {
      setModalHari(getHariFromDate(modalTanggal));
    }
    setModalWarningDismissed(false);
  };

  // Apply Schedule Match to Modal (Point 5)
  const handleApplyScheduleToModal = () => {
    if (!modalMatchedSchedule) return;
    const targetDay = modalMatchedSchedule.hari;
    setModalHari(targetDay);
    
    // Find next date matching this day if needed
    if (modalModeHari === 'otomatis') {
      setModalModeHari('manual');
    }
    toast.info(`Hari pembelajaran disesuaikan dengan Jadwal Resmi: ${targetDay}`);
  };

  // Quick batch score in modal
  const handleQuickBatchScore = (score: number) => {
    const students = siswaList.filter(s => s.kelas === modalKelas);
    const updated: Record<string, { formatif: number; praktik: number; catatan: string }> = {};
    students.forEach(st => {
      updated[st.id] = {
        formatif: score,
        praktik: score,
        catatan: score >= 75 ? 'Tuntas Capaian Pembelajaran' : 'Perlu bimbingan remedial'
      };
    });
    setModalStudentScores(updated);
    toast.success(`Seluruh nilai siswa diisi cepat: ${score}`);
  };

  // Save Modal Assessment
  const handleSaveModalAssessment = () => {
    // 1. Validations (Point 9)
    if (!modalTanggal) {
      toast.error('Tanggal pembelajaran tidak boleh kosong!');
      return;
    }
    if (!modalHari) {
      toast.error('Hari pembelajaran tidak boleh kosong!');
      return;
    }
    if (!modalJudulPenilaian.trim()) {
      toast.error('Judul penilaian wajib diisi!');
      return;
    }

    // Check calendar inconsistency warning
    if (!isModalDayConsistent && !modalWarningDismissed) {
      toast.warning(`⚠️ Hari pembelajaran (${modalHari}) tidak sesuai dengan tanggal (${formatDateDDMMYYYY(modalTanggal)} yang jatuh pada hari ${modalExpectedHari}). Periksa kembali atau klik Simpan sekali lagi jika ingin tetap melanjutkan.`);
      setModalWarningDismissed(true);
      return;
    }

    const students = siswaList.filter(s => s.kelas === modalKelas);
    if (students.length === 0) {
      toast.error(`Tidak ada siswa terdaftar di kelas ${modalKelas}!`);
      return;
    }

    const newRecords: NilaiSiswaRecord[] = students.map(st => {
      const score = modalStudentScores[st.id] || { formatif: 80, praktik: 80, catatan: 'Tuntas' };
      const finalVal = calcFinalScore(score.formatif, score.praktik);
      const isTuntas = finalVal >= 75;

      return {
        id: `nil-${modalAssessmentId}-${st.id}`,
        assessmentId: modalAssessmentId,
        tanggal: modalTanggal,
        hari: modalHari,
        modeHari: modalModeHari,
        tahunPelajaran: modalTahunPelajaran,
        semester: modalSemester,
        kelas: modalKelas,
        nis: st.nis,
        namaSiswa: st.nama,
        mapel: modalMapel,
        guru: modalGuru,
        jenisAsesmen: modalJenisAsesmen,
        materiJudul: modalJudulPenilaian.trim(),
        nilaiFormatif: score.formatif,
        nilaiPraktik: score.praktik,
        nilaiAkhir: finalVal,
        predikat: calcPredikat(finalVal),
        statusKelulusan: isTuntas ? 'Tuntas' : 'Remedial',
        catatanGuru: score.catatan || (isTuntas ? 'Tuntas Capaian Pembelajaran' : 'Perlu pendampingan remedial'),
        id_siswa: st.id
      };
    });

    Storage.bulkSaveNilaiSiswa(newRecords);
    setIsFormModalOpen(false);
    toast.success(`Penilaian "${modalJudulPenilaian}" (${modalHari}, ${formatDateDDMMYYYY(modalTanggal)}) berhasil disimpan!`);
    onRefresh();
  };

  // Inline table grade changes
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

  // Save all inline edits
  const handleSaveAllGrades = async () => {
    setIsSubmitting(true);
    try {
      const updatedRecords = filteredRecords.map(item => {
        const edits = editableGrades[item.id];
        if (!edits) return item;

        const formatif = edits.formatif;
        const praktik = edits.praktik;
        const finalScore = calcFinalScore(formatif, praktik);
        const predikat = calcPredikat(finalScore);
        const isTuntas = finalScore >= 75;

        return {
          ...item,
          nilaiFormatif: formatif,
          nilaiPraktik: praktik,
          nilaiAkhir: finalScore,
          predikat: predikat,
          statusKelulusan: isTuntas ? ('Tuntas' as const) : ('Remedial' as const),
          catatanGuru: edits.catatan || (isTuntas ? 'Tuntas Capaian Pembelajaran' : 'Perlu bimbingan remedial')
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

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedHari('Semua');
    setSelectedJenisAsesmen('Semua');
    setDateFilterMode('all');
    setFilterSpecificDate('');
    setFilterBulan('all');
    setFilterSemester('all');
    setFilterTahunPelajaran('all');
    setSearchQuery('');
    toast.info('Filter penilaian dikembalikan ke pengaturan awal');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-[#163A5F] p-6 text-white shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold text-blue-100 border border-white/10">
              Modul Asesmen & Nilai Terintegrasi
            </span>
            <span className="text-xs text-blue-200">Kurikulum Merdeka SMK</span>
            <span className="rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
              Hari & Tanggal Pembelajaran Aktif
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Award className="h-7 w-7 text-blue-300" />
            Input Nilai & Evaluasi Siswa
          </h1>
          <p className="text-xs text-blue-100 max-w-3xl leading-relaxed">
            Pencatatan Asesmen Siswa dengan pemilihan <strong>Hari Pembelajaran</strong> dan <strong>Tanggal Pembelajaran</strong> langsung, tersinkronisasi otomatis dengan kalender dan Jadwal KBM resmi SMKN Bojonggambir.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Tambah Penilaian Button */}
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            title="Tambah Sesi Penilaian Baru (Pilih Hari, Tanggal, dan Input Nilai)"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Penilaian</span>
          </button>

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            title="Pratinjau A4 Dokumen Cetak Nilai"
          >
            <Eye className="h-4 w-4 text-blue-300" />
            <span>Pratinjau A4</span>
          </button>

          <button
            onClick={() => generateRekapNilaiSiswaPDF(filteredRecords, activeSetting, 'harian', {
              guruName: selectedGuru,
              nipGuru: selectedGuruNip,
              mapelName: selectedMapel,
              kelasName: selectedKelas,
              jenisAsesmen: selectedJenisAsesmen,
              hari: selectedHari !== 'Semua' ? selectedHari : undefined,
              tanggal: filterSpecificDate || undefined
            })}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            title="Unduh PDF Resmi Hasil Penilaian Siswa"
          >
            <Download className="h-4 w-4 text-blue-300" />
            <span>PDF Nilai</span>
          </button>

          <button
            onClick={() => printHtmlReport(activeSetting, getNilaiPrintOptions())}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            title="Cetak HTML Browser Jendela Baru"
          >
            <Printer className="h-4 w-4 text-amber-300" />
            <span>Cetak HTML</span>
          </button>

          <button
            onClick={handleSaveAllGrades}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white shadow-2xs transition cursor-pointer disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Nilai</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {isSavedSuccessfully && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-[#16A34A] dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
          <p className="text-xs font-medium">
            Nilai siswa berhasil disimpan dan data hari & tanggal pembelajaran tersimpan dengan aman di database SIMAGU!
          </p>
        </div>
      )}

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Data Asesmen</p>
              <p className="mt-1 text-2xl font-bold text-[#163A5F] dark:text-white">{totalRecords} <span className="text-xs font-normal text-slate-500">Record</span></p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-950/50 dark:text-blue-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Rombel: <strong className="text-slate-700 dark:text-slate-300">{selectedKelas}</strong>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rata-Rata Nilai Akhir</p>
              <p className="mt-1 text-2xl font-bold text-[#2563EB] dark:text-blue-400">{avgScore} <span className="text-xs font-normal text-slate-500">/ 100</span></p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-950/50 dark:text-blue-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Standar KKTP: <strong className="text-[#16A34A]">75.00</strong></p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Siswa Tuntas (KKTP)</p>
              <p className="mt-1 text-2xl font-bold text-[#16A34A] dark:text-emerald-400">{tuntasCount} <span className="text-xs font-normal text-slate-500">({tuntasPercent}%)</span></p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${tuntasPercent}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Perlu Remedial</p>
              <p className="mt-1 text-2xl font-bold text-[#DC2626] dark:text-red-400">{remedialCount} <span className="text-xs font-normal text-slate-500">Siswa</span></p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#DC2626] dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">Butuh pendampingan khusus guru mapel</p>
        </div>
      </div>

      {/* Schedule Integration Banner (Point 5) */}
      {matchedSchedule && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/60 dark:bg-blue-950/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2563EB] text-white">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wide">
                  Jadwal KBM Terintegrasi
                </span>
                <span className="rounded-full bg-blue-100 dark:bg-blue-900/80 px-2 py-0.5 text-[10px] font-bold text-[#163A5F] dark:text-blue-200">
                  Hari: {matchedSchedule.hari}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#163A5F] dark:text-white mt-0.5">
                {matchedSchedule.hari} • JP: {matchedSchedule.jp} ({matchedSchedule.waktu}) • {matchedSchedule.mapel} ({matchedSchedule.kelas})
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Ruang: {matchedSchedule.ruang || 'Studio/Lab DKV'} • Pengajar: {matchedSchedule.guru}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedHari(matchedSchedule.hari);
                toast.info(`Filter hari disesuaikan dengan jadwal: ${matchedSchedule.hari}`);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-[#2563EB] hover:bg-blue-50 transition cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Filter Hari: {matchedSchedule.hari}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter and Control Bar (Point 6) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#2563EB]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Filter Pencarian & Hari Pembelajaran
            </h2>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Reset Filter</span>
          </button>
        </div>

        {/* Primary Filter Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Guru Pengampu */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-[#2563EB]" />
              <span>Guru Pengampu</span>
            </label>
            <select
              value={selectedGuru}
              onChange={e => setSelectedGuru(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-[#163A5F] dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {guruList.map(g => (
                <option key={g.id} value={g.nama}>{g.nama}</option>
              ))}
            </select>
          </div>

          {/* Rombel / Kelas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pilih Rombel / Kelas</label>
            <select
              value={selectedKelas}
              onChange={e => setSelectedKelas(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {kelasList.map(k => (
                <option key={k.id} value={k.namaKelas}>{k.namaKelas} ({k.jurusan})</option>
              ))}
            </select>
          </div>

          {/* Mata Pelajaran */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={e => setSelectedMapel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {mapelList.map(m => (
                <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
              ))}
            </select>
          </div>

          {/* Hari Pembelajaran (Point 1 & 6) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-emerald-600" />
              <span>Hari Pembelajaran</span>
            </label>
            <select
              value={selectedHari}
              onChange={e => setSelectedHari(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="Semua">Semua Hari (Senin - Minggu)</option>
              {HARI_OPTIONS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* Jenis Asesmen */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Asesmen</label>
            <select
              value={selectedJenisAsesmen}
              onChange={e => setSelectedJenisAsesmen(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="Semua">Semua Jenis Asesmen</option>
              <option value="Formatif (Tugas)">Formatif (Tugas / LKPD)</option>
              <option value="Praktik / Unjuk Kerja">Praktik / Unjuk Kerja Studio</option>
              <option value="Sumatif (UH)">Sumatif (Ulangan Harian)</option>
              <option value="Portofolio">Portofolio Siswa</option>
            </select>
          </div>
        </div>

        {/* Secondary Date Range & Academic Filter Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Mode Filter Tanggal */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mode Filter Tanggal</label>
            <select
              value={dateFilterMode}
              onChange={e => setDateFilterMode(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">Semua Tanggal</option>
              <option value="specific">Tanggal Tertentu</option>
              <option value="range">Rentang Tanggal</option>
              <option value="month">Per Bulan</option>
            </select>
          </div>

          {/* Conditional Date Pickers */}
          {dateFilterMode === 'specific' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Pilih Tanggal</label>
              <input
                type="date"
                value={filterSpecificDate}
                onChange={e => setFilterSpecificDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
              {filterSpecificDate && (
                <p className="text-[10px] text-emerald-600 mt-1">
                  Hari: <strong>{getHariFromDate(filterSpecificDate)}</strong> ({formatDateDDMMYYYY(filterSpecificDate)})
                </p>
              )}
            </div>
          )}

          {dateFilterMode === 'range' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </>
          )}

          {dateFilterMode === 'month' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bulan Pembelajaran</label>
              <select
                value={filterBulan}
                onChange={e => setFilterBulan(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                {BULAN_OPTIONS.map(b => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Semester */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Semester</label>
            <select
              value={filterSemester}
              onChange={e => setFilterSemester(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">Semua Semester</option>
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
          </div>

          {/* Tahun Pelajaran */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tahun Pelajaran</label>
            <select
              value={filterTahunPelajaran}
              onChange={e => setFilterTahunPelajaran(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">Semua Tahun</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIS, Nama Siswa, atau Judul Penilaian..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-500">
              Menampilkan <strong>{filteredRecords.length}</strong> catatan penilaian
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Assessment Input (Point 7) */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-[#163A5F] dark:text-white text-sm flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-[#2563EB]" />
              Daftar Rekap Nilai Siswa ({selectedKelas} - {selectedMapel})
            </h3>
            <p className="text-xs text-slate-500">
              Kolom <strong>Hari | Tanggal</strong> menunjukkan jadwal pelaksanaan KBM. Ubah langsung angka formatif dan praktik di tabel ini atau gunakan tombol <strong>Tambah Penilaian</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950 px-2.5 py-1 text-[11px] font-bold text-[#2563EB] dark:text-blue-300">
              Hari: {selectedHari}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[900px]">
            <thead className="bg-[#F5F7FA] dark:bg-slate-800 text-[#163A5F] dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4 w-48">Nama Siswa</th>
                <th className="py-3 px-4 w-36 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300">
                  Hari | Tanggal
                </th>
                <th className="py-3 px-4 w-40">Penilaian / Judul</th>
                <th className="py-3 px-4 w-28 text-center bg-blue-50/60 dark:bg-blue-950/30 text-[#163A5F]">Nilai Formatif</th>
                <th className="py-3 px-4 w-28 text-center bg-indigo-50/60 dark:bg-indigo-950/30 text-[#163A5F]">Nilai Praktik</th>
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
                      <p className="font-medium text-slate-600">Tidak ada data penilaian untuk filter yang dipilih.</p>
                      <p className="text-[11px] text-slate-400">
                        Coba ubah pilihan Hari ({selectedHari}), Rentang Tanggal, atau tekan tombol Reset Filter.
                      </p>
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
                  const currentFinal = calcFinalScore(currentFormatif, currentPraktik);
                  const currentPredikat = calcPredikat(currentFinal);
                  const currentIsTuntas = currentFinal >= 75;

                  return (
                    <tr key={item.id} className="hover:bg-[#EFF6FF]/60 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{item.nis}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {item.namaSiswa}
                      </td>

                      {/* Kolom Hari | Tanggal (Point 7 of user request) */}
                      <td className="py-3 px-4 bg-emerald-50/30 dark:bg-emerald-950/10">
                        <div className="flex flex-col">
                          <span className="font-bold text-emerald-800 dark:text-emerald-400 text-xs">
                            {item.hari || getHariFromDate(item.tanggal)}
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {formatDateDDMMYYYY(item.tanggal)}
                          </span>
                        </div>
                      </td>

                      {/* Kolom Penilaian */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[150px]">
                            {item.materiJudul || item.jenisAsesmen}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {item.jenisAsesmen}
                          </span>
                        </div>
                      </td>

                      {/* Editable Formatif Input */}
                      <td className="py-2 px-3 text-center bg-blue-50/20 dark:bg-blue-950/10">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={currentFormatif}
                          onChange={e => handleGradeChange(item.id, 'formatif', e.target.value)}
                          className="w-16 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 px-2 py-1 text-center font-bold text-[#2563EB] dark:text-blue-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-2xs"
                        />
                      </td>

                      {/* Editable Praktik Input */}
                      <td className="py-2 px-3 text-center bg-indigo-50/20 dark:bg-indigo-950/10">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={currentPraktik}
                          onChange={e => handleGradeChange(item.id, 'praktik', e.target.value)}
                          className="w-16 rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 px-2 py-1 text-center font-bold text-indigo-700 dark:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB] shadow-2xs"
                        />
                      </td>

                      {/* Computed Final Score */}
                      <td className="py-3 px-4 text-center font-bold text-[#163A5F] dark:text-white text-sm">
                        {currentFinal}
                      </td>

                      {/* Computed Predikat Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full font-bold text-xs ${
                          currentPredikat === 'A' ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200' :
                          currentPredikat === 'B' ? 'bg-blue-50 text-[#2563EB] border border-blue-200' :
                          currentPredikat === 'C' ? 'bg-amber-50 text-[#F59E0B] border border-amber-200' :
                          'bg-red-50 text-[#DC2626] border border-red-200'
                        }`}>
                          {currentPredikat}
                        </span>
                      </td>

                      {/* Computed Tuntas / Remedial Badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          currentIsTuntas
                            ? 'bg-emerald-50 text-[#16A34A] border border-emerald-200'
                            : 'bg-red-50 text-[#DC2626] border border-red-200'
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
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
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
        <div className="border-t border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-800/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Terakhir diperbarui oleh: <strong className="text-[#163A5F] dark:text-slate-300">{currentUser.nama}</strong> ({currentUser.role})
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 text-[#163A5F] dark:text-slate-300 px-3.5 py-2 text-xs font-bold hover:bg-[#EFF6FF] transition cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Pratinjau A4</span>
            </button>

            <button
              onClick={() => generateRekapNilaiSiswaPDF(filteredRecords, activeSetting, 'harian', {
                guruName: selectedGuru,
                nipGuru: selectedGuruNip,
                mapelName: selectedMapel,
                kelasName: selectedKelas,
                jenisAsesmen: selectedJenisAsesmen,
                hari: selectedHari !== 'Semua' ? selectedHari : undefined,
                tanggal: filterSpecificDate || undefined
              })}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-bold hover:bg-[#EFF6FF] transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Unduh PDF</span>
            </button>

            <button
              onClick={() => exportNilaiToExcel(filteredRecords)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-xs font-bold hover:bg-[#EFF6FF] transition cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#16A34A]" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleSaveAllGrades}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition cursor-pointer ml-1 disabled:opacity-60"
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

      {/* MODAL FORM TAMBAH / EDIT PENILAIAN (Points 1, 2, 3, 4, 5, 9) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-[#163A5F] px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    {modalMode === 'create' ? 'Tambah Sesi Penilaian Pembelajaran' : 'Edit Sesi Penilaian'}
                    <span className="rounded-md bg-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                      Sinkron Kalender
                    </span>
                  </h3>
                  <p className="text-xs text-blue-100">
                    Pilih Guru → Mapel → Kelas → Hari & Tanggal Pembelajaran → Jenis Penilaian → Input Nilai Siswa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: Academic & Schedule Section */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>1. Identitas Pembelajaran & Rombel</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Guru Pengampu
                    </label>
                    <select
                      value={modalGuru}
                      onChange={e => setModalGuru(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {guruList.map(g => (
                        <option key={g.id} value={g.nama}>{g.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Mata Pelajaran
                    </label>
                    <select
                      value={modalMapel}
                      onChange={e => setModalMapel(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {mapelList.map(m => (
                        <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Rombongan Belajar (Kelas)
                    </label>
                    <select
                      value={modalKelas}
                      onChange={e => {
                        setModalKelas(e.target.value);
                        // Refresh students for new class
                        const stList = siswaList.filter(s => s.kelas === e.target.value);
                        const newSc: Record<string, { formatif: number; praktik: number; catatan: string }> = {};
                        stList.forEach(st => {
                          newSc[st.id] = { formatif: 85, praktik: 85, catatan: 'Tuntas Capaian Pembelajaran' };
                        });
                        setModalStudentScores(newSc);
                      }}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-[#2563EB] focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {kelasList.map(k => (
                        <option key={k.id} value={k.namaKelas}>{k.namaKelas} ({k.jurusan})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Integrated Schedule Hint (Point 5) */}
                {modalMatchedSchedule ? (
                  <div className="flex items-center justify-between rounded-lg bg-blue-100/60 dark:bg-blue-950/50 p-2.5 border border-blue-200 dark:border-blue-900 text-xs">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#2563EB] shrink-0" />
                      <span className="text-[#163A5F] dark:text-blue-200">
                        Jadwal Terdaftar: <strong>{modalMatchedSchedule.hari}</strong> • {modalMatchedSchedule.mapel} • {modalMatchedSchedule.kelas} (JP {modalMatchedSchedule.jp} • {modalMatchedSchedule.waktu})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyScheduleToModal}
                      className="rounded-md bg-[#2563EB] text-white px-2.5 py-1 text-[11px] font-bold hover:bg-blue-700 transition cursor-pointer shrink-0"
                    >
                      Gunakan Hari ({modalMatchedSchedule.hari})
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 italic">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span>Tidak ditemukan jadwal resmi KBM di jam utama untuk kombinasi ini. Guru tetap dapat memilih hari dan tanggal secara fleksibel.</span>
                  </div>
                )}
              </div>

              {/* Step 2: Hari & Tanggal Pembelajaran (Points 1, 2, 3) */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-emerald-200/60 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <span>2. Pengaturan Hari & Tanggal Pembelajaran</span>
                  </h4>

                  {/* Mode Selector (Point 3) */}
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-1 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                    <span className="text-[11px] font-semibold text-slate-500 pl-2">Mode:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleModeHari('otomatis')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        modalModeHari === 'otomatis'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Otomatis Kalender</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleModeHari('manual')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        modalModeHari === 'manual'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                      }`}
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Manual</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tanggal Pembelajaran (Date Picker) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Pembelajaran <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={modalTanggal}
                      onChange={e => handleModalDateChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Format Tampilan: <strong className="text-emerald-700 dark:text-emerald-400 font-mono">{formatDateDDMMYYYY(modalTanggal)}</strong></span>
                      <span>({formatLongDateIndo(modalTanggal)})</span>
                    </div>
                  </div>

                  {/* Hari Pembelajaran (Dropdown) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Hari Pembelajaran <span className="text-red-500">*</span>
                      </label>
                      {modalModeHari === 'otomatis' && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Terkunci Otomatis
                        </span>
                      )}
                    </div>
                    <select
                      value={modalHari}
                      onChange={e => handleModalDayChange(e.target.value)}
                      disabled={modalModeHari === 'otomatis'}
                      className={`w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 ${
                        modalModeHari === 'otomatis'
                          ? 'bg-slate-100 dark:bg-slate-800/80 text-emerald-800 dark:text-emerald-400 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                      }`}
                    >
                      {HARI_OPTIONS.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Terdeteksi Kalender: <strong className="text-slate-700 dark:text-slate-300">{modalExpectedHari}</strong></span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {modalHari}, {formatDateDDMMYYYY(modalTanggal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Calendar Mismatch Warning (Point 2 of user request) */}
                {!isModalDayConsistent && (
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-300 p-3.5 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold">
                        ⚠️ Hari pembelajaran tidak sesuai dengan tanggal yang dipilih. Periksa kembali data Anda.
                      </p>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300">
                        Tanggal <strong>{formatDateDDMMYYYY(modalTanggal)}</strong> jatuh pada hari <strong>{modalExpectedHari}</strong>, tetapi Anda memilih hari <strong>{modalHari}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setModalHari(modalExpectedHari)}
                        className="mt-1 text-[11px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer"
                      >
                        Sesuaikan otomatis menjadi hari {modalExpectedHari} →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Jenis & Judul Penilaian */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-[#2563EB]" />
                  <span>3. Rincian & Judul Penilaian</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Jenis Penilaian
                    </label>
                    <select
                      value={modalJenisAsesmen}
                      onChange={e => setModalJenisAsesmen(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="Formatif (Tugas)">Formatif (Tugas / LKPD)</option>
                      <option value="Praktik / Unjuk Kerja">Praktik / Unjuk Kerja Studio</option>
                      <option value="Sumatif (UH)">Sumatif (Ulangan Harian)</option>
                      <option value="Portofolio">Portofolio Siswa</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Judul Penilaian / Materi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={modalJudulPenilaian}
                      placeholder="Contoh: Tugas 1 - Nirmana Garis dan Bentuk, Kuis 1, Praktik 1..."
                      onChange={e => setModalJudulPenilaian(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              {/* Step 4: Input Nilai Siswa Langsung */}
              <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden space-y-3 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#163A5F] dark:text-white flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-[#2563EB]" />
                      <span>4. Pengisian Nilai Siswa ({modalKelas})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Total: {siswaList.filter(s => s.kelas === modalKelas).length} Siswa Terdaftar
                    </p>
                  </div>

                  {/* Quick Batch Scoring */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500">Isi Cepat:</span>
                    <button
                      type="button"
                      onClick={() => handleQuickBatchScore(80)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      Semua 80
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickBatchScore(85)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      Semua 85
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickBatchScore(90)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                    >
                      Semua 90
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead className="bg-[#F5F7FA] dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3 w-10 text-center">No</th>
                        <th className="py-2 px-3 w-24">NIS</th>
                        <th className="py-2 px-3">Nama Siswa</th>
                        <th className="py-2 px-3 w-24 text-center">Formatif</th>
                        <th className="py-2 px-3 w-24 text-center">Praktik</th>
                        <th className="py-2 px-3 w-20 text-center">Akhir</th>
                        <th className="py-2 px-3 w-20 text-center">Status</th>
                        <th className="py-2 px-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {siswaList
                        .filter(s => s.kelas === modalKelas)
                        .map((st, sIdx) => {
                          const sc = modalStudentScores[st.id] || { formatif: 80, praktik: 80, catatan: 'Tuntas' };
                          const finalVal = calcFinalScore(sc.formatif, sc.praktik);
                          const isTuntas = finalVal >= 75;

                          return (
                            <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-3 text-center text-slate-400">{sIdx + 1}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{st.nis}</td>
                              <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">{st.nama}</td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={sc.formatif}
                                  onChange={e => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                    setModalStudentScores(prev => ({
                                      ...prev,
                                      [st.id]: { ...sc, formatif: val }
                                    }));
                                  }}
                                  className="w-16 rounded border border-slate-300 dark:border-slate-700 text-center font-bold text-[#2563EB] py-0.5"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={sc.praktik}
                                  onChange={e => {
                                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                                    setModalStudentScores(prev => ({
                                      ...prev,
                                      [st.id]: { ...sc, praktik: val }
                                    }));
                                  }}
                                  className="w-16 rounded border border-slate-300 dark:border-slate-700 text-center font-bold text-indigo-600 py-0.5"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                                {finalVal}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isTuntas ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {isTuntas ? 'Tuntas' : 'Remedial'}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={sc.catatan}
                                  placeholder="Catatan..."
                                  onChange={e => {
                                    const val = e.target.value;
                                    setModalStudentScores(prev => ({
                                      ...prev,
                                      [st.id]: { ...sc, catatan: val }
                                    }));
                                  }}
                                  className="w-full rounded border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-xs"
                                />
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-6 py-4">
              <div className="text-xs text-slate-500">
                Data akan disimpan ke sistem dengan Hari Pembelajaran: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{modalHari}</strong> ({formatDateDDMMYYYY(modalTanggal)})
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveModalAssessment}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Penilaian</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          jenisAsesmen: selectedJenisAsesmen,
          hari: selectedHari !== 'Semua' ? selectedHari : undefined,
          tanggal: filterSpecificDate || undefined
        })}
        onExportExcel={() => exportNilaiToExcel(filteredRecords)}
      />
    </div>
  );
};

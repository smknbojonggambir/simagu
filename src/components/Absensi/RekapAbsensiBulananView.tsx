import React, { useState, useMemo, useEffect } from 'react';
import { Printer, FileSpreadsheet, Download, Search, Filter, Calendar, Users, CheckCircle2, AlertTriangle, UserX, ShieldAlert, BookOpen, Eye } from 'lucide-react';
import { SiswaItem, KelasItem, GuruItem, MapelItem, SchoolSetting, RekapAbsensiBulananSiswaItem, User } from '../../types';
import { Storage } from '../../lib/storage';
import { generateRekapAbsensiBulananPDF } from '../../lib/pdfGenerator';
import { exportRekapAbsensiBulananToExcel } from '../../lib/excelExport';
import { printHtmlReport, PrintReportOptions } from '../../lib/printWindowHelper';
import { PrintPreviewModal } from '../PrintPreviewModal';

interface RekapAbsensiBulananViewProps {
  siswaList?: SiswaItem[];
  kelasList?: KelasItem[];
  guruList?: GuruItem[];
  mapelList?: MapelItem[];
  setting?: SchoolSetting;
  currentUser?: User;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const RekapAbsensiBulananView: React.FC<RekapAbsensiBulananViewProps> = ({
  siswaList,
  kelasList,
  guruList,
  mapelList,
  setting: propSetting,
  currentUser
}) => {
  const safeSetting = propSetting || Storage.getSetting();
  const safeSiswaList = useMemo(() => siswaList || Storage.getSiswa(), [siswaList]);
  const safeKelasList = useMemo(() => kelasList || Storage.getKelas(), [kelasList]);
  const safeGuruList = useMemo(() => guruList || Storage.getGuru(), [guruList]);
  const safeMapelList = useMemo(() => mapelList || Storage.getMapel(), [mapelList]);

  // Fetch schedule and agenda data sources
  const safeJadwalList = useMemo(() => Storage.getJadwal(), []);
  const absensiSiswaRecords = useMemo(() => Storage.getAbsensiSiswa(), []);
  const agendaGuruList = useMemo(() => Storage.getAgendaGuru(), []);
  const agendaKelasList = useMemo(() => Storage.getAgendaKelas(), []);

  // Determine initial selected guru based on currentUser if logged in as a teacher
  const initialGuru = useMemo(() => {
    if (currentUser?.nama) {
      const match = safeGuruList.find(g =>
        g.nama.toLowerCase() === currentUser.nama.toLowerCase() ||
        currentUser.nama.toLowerCase().includes(g.nama.toLowerCase().split(',')[0])
      );
      if (match) return match.nama;
    }
    return 'all';
  }, [currentUser, safeGuruList]);

  // Staged & Applied Filter State
  const [stagedFilters, setStagedFilters] = useState({
    tahunPelajaran: safeSetting.tahunPelajaran || '2026/2027',
    semester: safeSetting.semester || 'Ganjil',
    bulan: 'Agustus',
    tahun: '2026',
    tanggalMulai: '',
    tanggalSelesai: '',
    jurusan: 'all',
    kelas: 'all',
    guru: initialGuru,
    mapel: 'all',
    searchQuery: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...stagedFilters });
  const [notice, setNotice] = useState<string | null>(null);

  // Dynamic Mapel Options based on staged/applied Guru
  const availableMapelList = useMemo(() => {
    const currentGuru = stagedFilters.guru;
    if (currentGuru === 'all') {
      return safeMapelList;
    }

    const validMapelNames = new Set<string>();
    const guruObj = safeGuruList.find(g => g.nama === currentGuru);
    if (guruObj?.mapelUtama) validMapelNames.add(guruObj.mapelUtama);

    safeJadwalList.forEach(j => {
      if (j.guru === currentGuru && j.mapel) validMapelNames.add(j.mapel);
    });
    agendaGuruList.forEach(ag => {
      if (ag.namaGuru === currentGuru && ag.mapel) validMapelNames.add(ag.mapel);
    });

    if (currentGuru.toLowerCase().includes('ihsan haeruman')) {
      validMapelNames.add('Ilmu Pengetahuan Alam dan Sosial (IPAS)');
      validMapelNames.add('Dasar-Dasar APHP');
      validMapelNames.add('Agribisnis Pengolahan Hasil Pertanian');
    }

    if (validMapelNames.size === 0) return safeMapelList;

    const filtered = safeMapelList.filter(m =>
      validMapelNames.has(m.namaMapel) ||
      Array.from(validMapelNames).some(vn => m.namaMapel.toLowerCase().includes(vn.toLowerCase()) || vn.toLowerCase().includes(m.namaMapel.toLowerCase()))
    );
    return filtered.length > 0 ? filtered : safeMapelList;
  }, [safeMapelList, safeGuruList, safeJadwalList, agendaGuruList, stagedFilters.guru]);

  // Dynamic Kelas Options based on staged Jurusan and Guru
  const availableKelasList = useMemo(() => {
    let classes = safeKelasList;
    if (stagedFilters.jurusan !== 'all') {
      classes = classes.filter(k => (k.jurusan || '').toUpperCase() === stagedFilters.jurusan.toUpperCase() || k.namaKelas.toUpperCase().includes(stagedFilters.jurusan.toUpperCase()));
    }
    if (stagedFilters.guru !== 'all') {
      const guruClasses = new Set<string>();
      safeJadwalList.forEach(j => {
        if (j.guru === stagedFilters.guru && j.kelas) guruClasses.add(j.kelas);
      });
      agendaGuruList.forEach(ag => {
        if (ag.namaGuru === stagedFilters.guru && ag.kelas) guruClasses.add(ag.kelas);
      });
      if (guruClasses.size > 0) {
        const filteredByGuru = classes.filter(k => guruClasses.has(k.namaKelas));
        if (filteredByGuru.length > 0) classes = filteredByGuru;
      }
    }
    return classes;
  }, [safeKelasList, safeJadwalList, agendaGuruList, stagedFilters.jurusan, stagedFilters.guru]);

  const handleApplyFilter = () => {
    setAppliedFilters({ ...stagedFilters });
    setNotice('Filter absensi bulanan berhasil diterapkan!');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleResetFilter = () => {
    const defaultState = {
      tahunPelajaran: safeSetting.tahunPelajaran || '2026/2027',
      semester: safeSetting.semester || 'Ganjil',
      bulan: 'Agustus',
      tahun: '2026',
      tanggalMulai: '',
      tanggalSelesai: '',
      jurusan: 'all',
      kelas: 'all',
      guru: 'all',
      mapel: 'all',
      searchQuery: ''
    };
    setStagedFilters(defaultState);
    setAppliedFilters(defaultState);
    setNotice('Filter telah direset ke pengaturan default.');
    setTimeout(() => setNotice(null), 3000);
  };

  // Convert month name to two digit string e.g. "Agustus" -> "08"
  const monthIndexStr = useMemo(() => {
    const idx = MONTH_NAMES.indexOf(appliedFilters.bulan);
    if (idx < 0) return '08';
    return String(idx + 1).padStart(2, '0');
  }, [appliedFilters.bulan]);

  // Compute Per-Student Monthly Attendance
  const rekapData: RekapAbsensiBulananSiswaItem[] = useMemo(() => {
    const validKelasSet = new Set(availableKelasList.map(k => k.namaKelas));
    const targetStudents = safeSiswaList.filter(s => {
      if (appliedFilters.jurusan !== 'all') {
        const matchedK = safeKelasList.find(k => k.namaKelas === s.kelas);
        const jurusanMatch = (matchedK?.jurusan || '').toUpperCase() === appliedFilters.jurusan.toUpperCase() || s.kelas.toUpperCase().includes(appliedFilters.jurusan.toUpperCase());
        if (!jurusanMatch) return false;
      }
      if (appliedFilters.kelas !== 'all') return s.kelas === appliedFilters.kelas;
      if (appliedFilters.guru !== 'all') return validKelasSet.has(s.kelas);
      return true;
    });

    const targetYearMonth = `${appliedFilters.tahun}-${monthIndexStr}`;

    return targetStudents.map(siswa => {
      let sakit = 0;
      let izin = 0;
      let alpa = 0;
      let terlambat = 0;
      let hadirRecorded = 0;

      // 1. Direct Absensi Siswa Records
      absensiSiswaRecords.forEach(rec => {
        if (rec.nis === siswa.nis || rec.namaSiswa === siswa.nama) {
          let dateMatches = false;
          if (appliedFilters.tanggalMulai && appliedFilters.tanggalSelesai) {
            dateMatches = rec.tanggal >= appliedFilters.tanggalMulai && rec.tanggal <= appliedFilters.tanggalSelesai;
          } else {
            dateMatches = rec.tanggal ? rec.tanggal.startsWith(targetYearMonth) : false;
          }

          if (dateMatches) {
            if (appliedFilters.guru !== 'all') {
              const isMatchGuru = (rec.guru && rec.guru.toLowerCase() === appliedFilters.guru.toLowerCase()) ||
                                  (rec.dicatatOleh && rec.dicatatOleh.toLowerCase().includes(appliedFilters.guru.toLowerCase()));
              if (!isMatchGuru) return;
            }
            if (appliedFilters.mapel !== 'all') {
              const isMatchMapel = rec.mapel && rec.mapel.toLowerCase() === appliedFilters.mapel.toLowerCase();
              if (!isMatchMapel) {
                const matchingAgenda = agendaGuruList.find(ag => ag.tanggal === rec.tanggal && ag.kelas === siswa.kelas && ag.mapel.toLowerCase() === appliedFilters.mapel.toLowerCase());
                if (!matchingAgenda) {
                  const matchingJadwal = safeJadwalList.find(j => j.kelas === siswa.kelas && j.mapel.toLowerCase() === appliedFilters.mapel.toLowerCase());
                  if (!matchingJadwal) return;
                }
              }
            }
            if (rec.status === 'Sakit') sakit++;
            else if (rec.status === 'Izin') izin++;
            else if (rec.status === 'Alpa') alpa++;
            else if (rec.status === 'Terlambat') terlambat++;
            else if (rec.status === 'Hadir') hadirRecorded++;
          }
        }
      });

      // 2. Absences from Agenda Guru (siswaTidakHadir)
      agendaGuruList.forEach(ag => {
        let dateMatches = false;
        if (appliedFilters.tanggalMulai && appliedFilters.tanggalSelesai) {
          dateMatches = ag.tanggal >= appliedFilters.tanggalMulai && ag.tanggal <= appliedFilters.tanggalSelesai;
        } else {
          dateMatches = ag.tanggal ? ag.tanggal.startsWith(targetYearMonth) : false;
        }

        if (dateMatches) {
          if (appliedFilters.guru !== 'all' && ag.namaGuru !== appliedFilters.guru) return;
          if (appliedFilters.mapel !== 'all' && ag.mapel !== appliedFilters.mapel) return;
          if (ag.kelas === siswa.kelas) {
            if (ag.siswaTidakHadir && Array.isArray(ag.siswaTidakHadir)) {
              ag.siswaTidakHadir.forEach(sth => {
                if (sth.nis === siswa.nis || sth.nama.toLowerCase() === siswa.nama.toLowerCase()) {
                  if (sth.kategori === 'Sakit') sakit++;
                  else if (sth.kategori === 'Izin') izin++;
                  else if (sth.kategori === 'Alpa') alpa++;
                  else if (sth.kategori === 'Terlambat') terlambat++;
                }
              });
            }
          }
        }
      });

      // 3. Absences from Agenda Kelas (siswaTidakHadir)
      agendaKelasList.forEach(ak => {
        let dateMatches = false;
        if (appliedFilters.tanggalMulai && appliedFilters.tanggalSelesai) {
          dateMatches = ak.tanggal >= appliedFilters.tanggalMulai && ak.tanggal <= appliedFilters.tanggalSelesai;
        } else {
          dateMatches = ak.tanggal ? ak.tanggal.startsWith(targetYearMonth) : false;
        }

        if (dateMatches) {
          if (ak.kelas === siswa.kelas) {
            if (appliedFilters.mapel !== 'all') {
              const hasMapel = ak.monitoringPembelajaran?.some(m => m.mapel.toLowerCase() === appliedFilters.mapel.toLowerCase());
              if (!hasMapel) return;
            }
            if (ak.siswaTidakHadir && Array.isArray(ak.siswaTidakHadir)) {
              ak.siswaTidakHadir.forEach(sth => {
                if (sth.nis === siswa.nis || sth.nama.toLowerCase() === siswa.nama.toLowerCase()) {
                  if (sth.kategori === 'Sakit' && sakit === 0) sakit++;
                  else if (sth.kategori === 'Izin' && izin === 0) izin++;
                  else if (sth.kategori === 'Alpa' && alpa === 0) alpa++;
                  else if (sth.kategori === 'Terlambat' && terlambat === 0) terlambat++;
                }
              });
            }
          }
        }
      });

      const totalAbsen = sakit + izin + alpa;
      const totalPertemuan = 20; // 20 hari efektif per bulan
      const hadir = Math.max(0, totalPertemuan - totalAbsen);
      const persentase = Math.round((hadir / totalPertemuan) * 100);

      const matchedWali = safeKelasList.find(k => k.namaKelas === siswa.kelas)?.waliKelas;

      return {
        nis: siswa.nis,
        nama: siswa.nama,
        gender: siswa.gender || 'L',
        kelas: siswa.kelas,
        guruName: appliedFilters.guru !== 'all' ? appliedFilters.guru : (matchedWali || 'Wali Kelas'),
        mapelName: appliedFilters.mapel !== 'all' ? appliedFilters.mapel : undefined,
        hadir,
        sakit,
        izin,
        alpa,
        terlambat,
        totalAbsen,
        totalPertemuan,
        persentase
      };
    });
  }, [safeSiswaList, safeKelasList, safeGuruList, safeMapelList, safeJadwalList, availableKelasList, appliedFilters, monthIndexStr, absensiSiswaRecords, agendaGuruList, agendaKelasList]);

  // Filtered by Search Query
  const filteredRekap = useMemo(() => {
    if (!appliedFilters.searchQuery.trim()) return rekapData;
    const q = appliedFilters.searchQuery.toLowerCase();
    return rekapData.filter(s =>
      s.nama.toLowerCase().includes(q) ||
      s.nis.includes(q) ||
      s.kelas.toLowerCase().includes(q)
    );
  }, [rekapData, appliedFilters.searchQuery]);

  // Summary counts
  const totalSiswaCount = filteredRekap.length;
  const totalHadirCount = filteredRekap.reduce((acc, c) => acc + c.hadir, 0);
  const totalSakitCount = filteredRekap.reduce((acc, c) => acc + c.sakit, 0);
  const totalIzinCount = filteredRekap.reduce((acc, c) => acc + c.izin, 0);
  const totalAlpaCount = filteredRekap.reduce((acc, c) => acc + c.alpa, 0);
  const totalTerlambatCount = filteredRekap.reduce((acc, c) => acc + c.terlambat, 0);
  const avgKehadiran = totalSiswaCount > 0
    ? Math.round(filteredRekap.reduce((acc, c) => acc + c.persentase, 0) / totalSiswaCount)
    : 100;

  // Selected Wali Kelas for PDF signature
  const currentWaliKelas = useMemo(() => {
    if (appliedFilters.kelas !== 'all') {
      const k = safeKelasList.find(item => item.namaKelas === appliedFilters.kelas);
      if (k) return k.waliKelas;
    }
    return 'Wali Kelas';
  }, [safeKelasList, appliedFilters.kelas]);

  // Print Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

  const getAbsensiReportOptions = (): PrintReportOptions => ({
    title: 'LAPORAN REKAPITULASI PRESENSI SISWA BULANAN',
    subtitle: `Bulan: ${appliedFilters.bulan} ${appliedFilters.tahun} | Kelas: ${appliedFilters.kelas === 'all' ? 'Semua Kelas' : appliedFilters.kelas}${appliedFilters.guru !== 'all' ? ` | Guru: ${appliedFilters.guru}` : ''}`,
    nomorDokumen: `REKAP-ABS/${appliedFilters.bulan.toUpperCase()}/${appliedFilters.tahun}`,
    orientation: 'landscape',
    paperSize: 'a4',
    margin: 'normal',
    metadataGrid: [
      { label: 'Bulan & Tahun', value: `${appliedFilters.bulan} ${appliedFilters.tahun}` },
      { label: 'Tahun Pelajaran', value: `${appliedFilters.tahunPelajaran} (${appliedFilters.semester})` },
      { label: 'Jurusan / Kelas', value: `${appliedFilters.jurusan === 'all' ? 'Semua Jurusan' : appliedFilters.jurusan} / ${appliedFilters.kelas === 'all' ? 'Semua Kelas' : appliedFilters.kelas}` },
      { label: 'Guru / Mapel', value: appliedFilters.guru === 'all' ? 'Semua Guru' : `${appliedFilters.guru} (${appliedFilters.mapel === 'all' ? 'Semua Mapel' : appliedFilters.mapel})` }
    ],
    summaryCards: [
      { label: 'Total Siswa', value: `${totalSiswaCount} Siswa` },
      { label: 'Total Hadir', value: `${totalHadirCount} Total` },
      { label: 'Total Sakit', value: `${totalSakitCount} Hari`, color: 'amber' },
      { label: 'Total Izin', value: `${totalIzinCount} Hari`, color: 'blue' },
      { label: 'Total Alpa', value: `${totalAlpaCount} Kali`, color: 'rose' },
      { label: 'Rata-Rata Kehadiran', value: `${avgKehadiran}%`, color: 'emerald' },
    ],
    headers: ['NO', 'NIS', 'NAMA SISWA', 'L/P', 'KELAS', 'HADIR (H)', 'SAKIT (S)', 'IZIN (I)', 'ALPA (A)', 'TERLAMBAT (TL)', 'TOTAL ABSEN', '% KEHADIRAN'],
    rows: filteredRekap.map((s, idx) => [
      idx + 1,
      s.nis,
      s.nama,
      s.gender,
      s.kelas,
      s.hadir,
      s.sakit,
      s.izin,
      s.alpa,
      s.terlambat,
      s.totalAbsen,
      `${s.persentase}%`
    ]),
    alignments: ['center', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'],
    signLeft: {
      role: 'Mengetahui,\nKepala Sekolah',
      nama: safeSetting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.',
      nip: safeSetting.nipKepalaSekolah || '-'
    },
    signCenter: {
      role: 'Wakil Kepala Sekolah\nBidang Kurikulum',
      nama: safeSetting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.',
      nip: '-'
    },
    signRight: {
      role: 'Wali Kelas / Guru Pengampu',
      nama: currentWaliKelas || 'Wali Kelas',
      nip: '-'
    }
  });

  const checkHasData = (): boolean => {
    if (filteredRekap.length === 0) {
      setNotice('Tidak ada data yang sesuai dengan filter yang dipilih.');
      return false;
    }
    return true;
  };

  const handleOpenPreview = () => {
    if (!checkHasData()) return;
    setPreviewModalOpen(true);
  };

  const handleCetakPDF = () => {
    if (!checkHasData()) return;
    generateRekapAbsensiBulananPDF(filteredRekap, safeSetting, {
      bulan: appliedFilters.bulan,
      tahun: appliedFilters.tahun,
      kelas: appliedFilters.kelas === 'all' ? 'Semua Kelas' : appliedFilters.kelas,
      guruName: appliedFilters.guru === 'all' ? undefined : appliedFilters.guru,
      mapelName: appliedFilters.mapel === 'all' ? undefined : appliedFilters.mapel,
      waliKelas: currentWaliKelas
    });
    setNotice(`Cetak PDF Rekap Absensi Bulanan (${appliedFilters.bulan} ${appliedFilters.tahun}) berhasil diproses!`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCetakBrowserHTML = () => {
    if (!checkHasData()) return;
    printHtmlReport(safeSetting, getAbsensiReportOptions());
  };

  const handleExportExcel = () => {
    if (!checkHasData()) return;
    exportRekapAbsensiBulananToExcel(filteredRekap, {
      bulan: appliedFilters.bulan,
      tahun: appliedFilters.tahun,
      kelas: appliedFilters.kelas === 'all' ? 'Semua Kelas' : appliedFilters.kelas,
      guruName: appliedFilters.guru === 'all' ? undefined : appliedFilters.guru,
      mapelName: appliedFilters.mapel === 'all' ? undefined : appliedFilters.mapel
    });
    setNotice(`Spreadsheet Excel Rekap Absensi Bulanan (${appliedFilters.bulan} ${appliedFilters.tahun}) berhasil diunduh!`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-[#163A5F] p-6 text-white shadow-md border border-slate-700/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/10 border border-white/10 px-2.5 py-1 text-xs font-semibold text-blue-200 backdrop-blur-md">
              Modul Laporan & Cetak Presensi Bulanan
            </span>
            <span className="text-xs text-blue-200">SIMAGU {safeSetting.namaSekolah}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Printer className="h-7 w-7 text-blue-300" />
            Rekap Presensi Siswa Per Bulan
          </h1>
          <p className="text-xs text-slate-200 max-w-2xl leading-relaxed">
            Hitung akumulasi ketidakhadiran persiswa (Alpa, Sakit, Izin, Terlambat) perbulan. Dilengkapi Filter Tahun, Semester, Rentang Tanggal, Kelas, Jurusan, Guru, Mapel serta Alur Filter → Validasi → Preview → PDF → Cetak.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleOpenPreview}
            className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 border border-white/20 cursor-pointer"
            title="Pratinjau layout cetak A4 / F4"
          >
            <Eye className="h-4 w-4 text-blue-300" />
            <span>👁️ Preview</span>
          </button>
          <button
            onClick={handleCetakPDF}
            className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
            title="Cetak format PDF resmi"
          >
            <Download className="h-4 w-4" />
            <span>📄 Cetak PDF</span>
          </button>
          <button
            onClick={handleCetakPDF}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
            title="Download berkas PDF"
          >
            <Download className="h-4 w-4" />
            <span>⬇️ Download PDF</span>
          </button>
          <button
            onClick={handleCetakBrowserHTML}
            className="flex items-center gap-2 rounded-xl bg-white hover:bg-[#EFF6FF] text-[#163A5F] px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 border border-slate-200 cursor-pointer"
            title="Cetak langsung lewat printer browser"
          >
            <Printer className="h-4 w-4 text-[#2563EB]" />
            <span>🖨️ Print</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer"
            title="Export data ke format Excel .xlsx"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>📊 Export Excel</span>
          </button>
        </div>
      </div>

      {/* Notification / Alert */}
      {notice && (
        <div className={`flex items-center gap-3 rounded-xl p-4 text-xs font-semibold animate-fade-in border ${
          notice.includes('Tidak ada data')
            ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200'
            : 'bg-emerald-50 border-emerald-200 text-[#16A34A] dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'
        }`}>
          {notice.includes('Tidak ada data') ? (
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-[#16A34A] shrink-0" />
          )}
          <p>{notice}</p>
        </div>
      )}

      {/* Filter Controls Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-[#163A5F] dark:text-slate-300 uppercase tracking-wider">
            <Filter className="h-4 w-4 text-[#2563EB]" />
            <span>Atur Filter Laporan Absensi Bulanan</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyFilter}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Search className="h-3.5 w-3.5" />
              <span>🔍 Terapkan Filter</span>
            </button>
            <button
              onClick={handleResetFilter}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-bold text-xs transition active:scale-95 cursor-pointer"
            >
              <span>🔄 Reset Filter</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {/* Filter Tahun Pelajaran */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tahun Pelajaran</label>
            <select
              value={stagedFilters.tahunPelajaran}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, tahunPelajaran: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {['2026/2027', '2025/2026', '2027/2028', '2024/2025'].map(tp => (
                <option key={tp} value={tp}>{tp}</option>
              ))}
            </select>
          </div>

          {/* Filter Semester */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Semester</label>
            <select
              value={stagedFilters.semester}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, semester: e.target.value as 'Ganjil' | 'Genap' }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="Ganjil">Ganjil</option>
              <option value="Genap">Genap</option>
            </select>
          </div>

          {/* Filter Bulan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bulan</label>
            <select
              value={stagedFilters.bulan}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, bulan: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {MONTH_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Rentang Tanggal Mulai */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tgl Mulai (Opsional)</label>
            <input
              type="date"
              value={stagedFilters.tanggalMulai}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, tanggalMulai: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Rentang Tanggal Selesai */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tgl Selesai (Opsional)</label>
            <input
              type="date"
              value={stagedFilters.tanggalSelesai}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, tanggalSelesai: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          {/* Filter Jurusan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jurusan / Program</label>
            <select
              value={stagedFilters.jurusan}
              onChange={(e) => {
                setStagedFilters(prev => ({ ...prev, jurusan: e.target.value, kelas: 'all' }));
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">Semua Jurusan</option>
              <option value="DKV">DKV (Desain Komunikasi Visual)</option>
              <option value="APHP">APHP (Agribisnis Pengolahan)</option>
            </select>
          </div>

          {/* Filter Kelas */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kelas</label>
            <select
              value={stagedFilters.kelas}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, kelas: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">Semua Kelas</option>
              {availableKelasList.map(k => (
                <option key={k.id} value={k.namaKelas}>{k.namaKelas}</option>
              ))}
            </select>
          </div>

          {/* Filter Guru */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Guru</label>
            <select
              value={stagedFilters.guru}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, guru: e.target.value, mapel: 'all' }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">Semua Guru</option>
              {safeGuruList.map(g => (
                <option key={g.id} value={g.nama}>{g.nama}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Second Row: Mapel & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mata Pelajaran (Terkoneksi Guru)</label>
            <select
              value={stagedFilters.mapel}
              onChange={(e) => setStagedFilters(prev => ({ ...prev, mapel: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {availableMapelList.map(m => (
                <option key={m.id} value={m.namaMapel}>{m.namaMapel} ({m.kode})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pencarian Nama / NIS</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa atau NIS..."
                value={stagedFilters.searchQuery}
                onChange={(e) => setStagedFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ringkasan Data Yang Akan Dicetak */}
      <div className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase text-[#163A5F] dark:text-blue-300 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
            <span>Ringkasan Data Presensi Yang Akan Dicetak</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Periksa data sebelum mencetak atau mengunduh PDF.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
            <p className="text-[11px] font-semibold text-slate-500">Total Siswa</p>
            <p className="mt-1 text-xl font-bold text-[#163A5F] dark:text-white">{totalSiswaCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/60 dark:bg-emerald-950/30 shadow-2xs">
            <p className="text-[11px] font-semibold text-[#16A34A] dark:text-emerald-400">Total Hadir</p>
            <p className="mt-1 text-xl font-bold text-[#16A34A] dark:text-emerald-300">{totalHadirCount} <span className="text-xs font-normal text-emerald-500">Hadir</span></p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30 shadow-2xs">
            <p className="text-[11px] font-semibold text-[#F59E0B] dark:text-amber-400">Total Sakit</p>
            <p className="mt-1 text-xl font-bold text-[#F59E0B] dark:text-amber-300">{totalSakitCount} <span className="text-xs font-normal text-amber-500">Hari</span></p>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/30 shadow-2xs">
            <p className="text-[11px] font-semibold text-[#2563EB] dark:text-blue-400">Total Izin</p>
            <p className="mt-1 text-xl font-bold text-[#2563EB] dark:text-blue-300">{totalIzinCount} <span className="text-xs font-normal text-blue-500">Hari</span></p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/30 shadow-2xs">
            <p className="text-[11px] font-semibold text-[#DC2626] dark:text-rose-400 flex items-center gap-1">
              <UserX className="h-3.5 w-3.5" />
              Total Alpa
            </p>
            <p className="mt-1 text-xl font-bold text-[#DC2626] dark:text-rose-300">{totalAlpaCount} <span className="text-xs font-normal text-rose-500">Kali</span></p>
          </div>

          <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 dark:border-teal-900/60 dark:bg-teal-950/30 shadow-2xs">
            <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">Rata-rata Kehadiran</p>
            <p className="mt-1 text-xl font-bold text-teal-700 dark:text-teal-300">{avgKehadiran}%</p>
          </div>
        </div>
      </div>

      {/* Rekap Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#163A5F] dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-[#2563EB]" />
              Rekapitulasi Kehadiran Siswa Per Bulan ({appliedFilters.bulan} {appliedFilters.tahun})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kelas: <strong className="text-[#2563EB] dark:text-blue-400">{appliedFilters.kelas === 'all' ? 'Semua Kelas' : appliedFilters.kelas}</strong>
              {appliedFilters.mapel !== 'all' && <span> | Mapel: <strong className="text-[#2563EB] dark:text-blue-400">{appliedFilters.mapel}</strong></span>}
              {appliedFilters.guru !== 'all' && <span> | Guru: <strong>{appliedFilters.guru}</strong></span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 text-xs font-bold text-[#16A34A] dark:text-emerald-300 hover:bg-emerald-100 transition cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleCetakPDF}
              className="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-[#F5F7FA] dark:bg-slate-800/80 text-[#163A5F] dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-28">NIS</th>
                <th className="py-3.5 px-4">Nama Lengkap Siswa</th>
                <th className="py-3.5 px-4 w-16 text-center">JK</th>
                <th className="py-3.5 px-4 w-28">Kelas</th>
                <th className="py-3.5 px-4 w-20 text-center text-[#16A34A] dark:text-emerald-400">Hadir (H)</th>
                <th className="py-3.5 px-4 w-20 text-center text-[#F59E0B] dark:text-amber-400">Sakit (S)</th>
                <th className="py-3.5 px-4 w-20 text-center text-[#2563EB] dark:text-blue-400">Izin (I)</th>
                <th className="py-3.5 px-4 w-20 text-center text-[#DC2626] dark:text-rose-400">Alpa (A)</th>
                <th className="py-3.5 px-4 w-20 text-center text-orange-700 dark:text-orange-400">TL (T)</th>
                <th className="py-3.5 px-4 w-24 text-center">Total Absen</th>
                <th className="py-3.5 px-4 w-28 text-center">% Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRekap.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    Tidak ada siswa atau data presensi ditemukan untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredRekap.map((s, idx) => {
                  const hasAlpa = s.alpa > 0;
                  const isLowAttendance = s.persentase < 85;
                  return (
                    <tr key={`${s.nis}-${idx}`} className="hover:bg-[#EFF6FF]/20 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">{s.nis}</td>
                      <td className="py-3 px-4 font-bold text-[#163A5F] dark:text-white">
                        {s.nama}
                        {hasAlpa && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-[#DC2626] dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            {s.alpa} Alpa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{s.gender}</td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">{s.kelas}</td>
                      <td className="py-3 px-4 text-center font-bold text-[#16A34A] dark:text-emerald-400">{s.hadir}</td>
                      <td className="py-3 px-4 text-center font-bold text-[#F59E0B] dark:text-amber-400">{s.sakit || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-[#2563EB] dark:text-blue-400">{s.izin || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-[#DC2626] dark:text-rose-400">{s.alpa || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-orange-600 dark:text-orange-400">{s.terlambat || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {s.totalAbsen > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                            {s.totalAbsen} Hari
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          isLowAttendance
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-[#DC2626] dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : s.persentase >= 95
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-[#16A34A] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300'
                        }`}>
                          {s.persentase}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-[#F5F7FA] dark:bg-slate-800/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Dicetak / Dibuat oleh: <strong className="text-[#163A5F] dark:text-slate-300">{currentUser?.nama || 'Administrator SIMAGU'}</strong>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 font-bold text-[#16A34A] hover:underline cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Spreadsheet Excel</span>
            </button>
            <button
              onClick={handleCetakPDF}
              className="flex items-center gap-1.5 font-bold text-[#2563EB] hover:underline cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak PDF Laporan Resmi</span>
            </button>
          </div>
        </div>
      </div>

      {previewModalOpen && (
        <PrintPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          options={getAbsensiReportOptions()}
          setting={safeSetting}
          onDownloadPdf={handleCetakPDF}
          onExportExcel={handleExportExcel}
        />
      )}
    </div>
  );
};

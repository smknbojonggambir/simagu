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

  // Filters State
  const [selectedBulan, setSelectedBulan] = useState<string>('Agustus');
  const [selectedTahun, setSelectedTahun] = useState<string>('2026');
  const [selectedGuru, setSelectedGuru] = useState<string>(initialGuru);
  const [selectedMapel, setSelectedMapel] = useState<string>('all');
  const [selectedKelas, setSelectedKelas] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notice, setNotice] = useState<string | null>(null);

  // Dynamic Mapel Options based on selected Guru
  const availableMapelList = useMemo(() => {
    if (selectedGuru === 'all') {
      return safeMapelList;
    }

    const validMapelNames = new Set<string>();

    // 1. From Guru object's mapelUtama
    const guruObj = safeGuruList.find(g => g.nama === selectedGuru);
    if (guruObj?.mapelUtama) {
      validMapelNames.add(guruObj.mapelUtama);
    }
    // 2. From Jadwal
    safeJadwalList.forEach(j => {
      if (j.guru === selectedGuru && j.mapel) {
        validMapelNames.add(j.mapel);
      }
    });
    // 3. From Agenda Guru
    agendaGuruList.forEach(ag => {
      if (ag.namaGuru === selectedGuru && ag.mapel) {
        validMapelNames.add(ag.mapel);
      }
    });

    // Special known teacher subject rules
    if (selectedGuru.toLowerCase().includes('ihsan haeruman')) {
      validMapelNames.add('Ilmu Pengetahuan Alam dan Sosial (IPAS)');
      validMapelNames.add('Dasar-Dasar APHP');
      validMapelNames.add('Agribisnis Pengolahan Hasil Pertanian');
    }

    if (validMapelNames.size === 0) {
      return safeMapelList;
    }

    const filtered = safeMapelList.filter(m =>
      validMapelNames.has(m.namaMapel) ||
      Array.from(validMapelNames).some(vn => m.namaMapel.toLowerCase().includes(vn.toLowerCase()) || vn.toLowerCase().includes(m.namaMapel.toLowerCase()))
    );

    return filtered.length > 0 ? filtered : safeMapelList;
  }, [safeMapelList, safeGuruList, safeJadwalList, agendaGuruList, selectedGuru]);

  // All classes are always available in dropdown as per user request
  const availableKelasList = safeKelasList;

  // Auto reset selectedMapel if no longer available in availableMapelList
  useEffect(() => {
    if (selectedMapel !== 'all') {
      const isStillAvailable = availableMapelList.some(m => m.namaMapel === selectedMapel);
      if (!isStillAvailable) {
        setSelectedMapel('all');
      }
    }
  }, [availableMapelList, selectedMapel]);

  // Auto reset selectedKelas if no longer available in availableKelasList
  useEffect(() => {
    if (selectedKelas !== 'all') {
      const isStillAvailable = availableKelasList.some(k => k.namaKelas === selectedKelas);
      if (!isStillAvailable) {
        setSelectedKelas('all');
      }
    }
  }, [availableKelasList, selectedKelas]);

  // Convert month name to two digit string e.g. "Agustus" -> "08"
  const monthIndexStr = useMemo(() => {
    const idx = MONTH_NAMES.indexOf(selectedBulan);
    if (idx < 0) return '08';
    return String(idx + 1).padStart(2, '0');
  }, [selectedBulan]);

  // Compute Per-Student Monthly Attendance
  const rekapData: RekapAbsensiBulananSiswaItem[] = useMemo(() => {
    // Filter students by selected class (or classes taught by selected guru if 'all')
    const validKelasSet = new Set(availableKelasList.map(k => k.namaKelas));
    const targetStudents = safeSiswaList.filter(s => {
      if (selectedKelas !== 'all') return s.kelas === selectedKelas;
      if (selectedGuru !== 'all') return validKelasSet.has(s.kelas);
      return true;
    });

    const targetYearMonth = `${selectedTahun}-${monthIndexStr}`;

    return targetStudents.map(siswa => {
      let sakit = 0;
      let izin = 0;
      let alpa = 0;
      let terlambat = 0;
      let hadirRecorded = 0;

      // 1. Direct Absensi Siswa Records
      absensiSiswaRecords.forEach(rec => {
        if (rec.nis === siswa.nis || rec.namaSiswa === siswa.nama) {
          if (rec.tanggal && rec.tanggal.startsWith(targetYearMonth)) {
            // Check selected Guru filter
            if (selectedGuru !== 'all') {
              const isMatchGuru = (rec.guru && rec.guru.toLowerCase() === selectedGuru.toLowerCase()) ||
                                  (rec.dicatatOleh && rec.dicatatOleh.toLowerCase().includes(selectedGuru.toLowerCase()));
              if (!isMatchGuru) return;
            }
            // Check selected Mapel filter
            if (selectedMapel !== 'all') {
              const isMatchMapel = rec.mapel && rec.mapel.toLowerCase() === selectedMapel.toLowerCase();
              if (!isMatchMapel) {
                const matchingAgenda = agendaGuruList.find(ag => ag.tanggal === rec.tanggal && ag.kelas === siswa.kelas && ag.mapel.toLowerCase() === selectedMapel.toLowerCase());
                if (!matchingAgenda) {
                  const matchingJadwal = safeJadwalList.find(j => j.kelas === siswa.kelas && j.mapel.toLowerCase() === selectedMapel.toLowerCase());
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
        if (ag.tanggal && ag.tanggal.startsWith(targetYearMonth)) {
          if (selectedGuru !== 'all' && ag.namaGuru !== selectedGuru) return;
          if (selectedMapel !== 'all' && ag.mapel !== selectedMapel) return;
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
        if (ak.tanggal && ak.tanggal.startsWith(targetYearMonth)) {
          if (ak.kelas === siswa.kelas) {
            if (selectedMapel !== 'all') {
              const hasMapel = ak.monitoringPembelajaran?.some(m => m.mapel.toLowerCase() === selectedMapel.toLowerCase());
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
      const totalPertemuan = 20; // Standard 20 hari efektif sekolah per bulan
      const hadir = Math.max(0, totalPertemuan - totalAbsen);
      const persentase = Math.round((hadir / totalPertemuan) * 100);

      const matchedWali = safeKelasList.find(k => k.namaKelas === siswa.kelas)?.waliKelas;

      return {
        nis: siswa.nis,
        nama: siswa.nama,
        gender: siswa.gender || 'L',
        kelas: siswa.kelas,
        guruName: selectedGuru !== 'all' ? selectedGuru : (matchedWali || 'Wali Kelas'),
        mapelName: selectedMapel !== 'all' ? selectedMapel : undefined,
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
  }, [safeSiswaList, safeKelasList, safeGuruList, safeMapelList, safeJadwalList, availableKelasList, selectedKelas, selectedGuru, selectedMapel, selectedTahun, monthIndexStr, absensiSiswaRecords, agendaGuruList, agendaKelasList]);

  // Filtered by Search Query
  const filteredRekap = useMemo(() => {
    if (!searchQuery.trim()) return rekapData;
    const q = searchQuery.toLowerCase();
    return rekapData.filter(s =>
      s.nama.toLowerCase().includes(q) ||
      s.nis.includes(q) ||
      s.kelas.toLowerCase().includes(q)
    );
  }, [rekapData, searchQuery]);

  // Summary counts
  const totalSiswaCount = filteredRekap.length;
  const totalSakitCount = filteredRekap.reduce((acc, c) => acc + c.sakit, 0);
  const totalIzinCount = filteredRekap.reduce((acc, c) => acc + c.izin, 0);
  const totalAlpaCount = filteredRekap.reduce((acc, c) => acc + c.alpa, 0);
  const totalTerlambatCount = filteredRekap.reduce((acc, c) => acc + c.terlambat, 0);
  const avgKehadiran = totalSiswaCount > 0
    ? Math.round(filteredRekap.reduce((acc, c) => acc + c.persentase, 0) / totalSiswaCount)
    : 100;

  // Selected Wali Kelas for PDF signature
  const currentWaliKelas = useMemo(() => {
    if (selectedKelas !== 'all') {
      const k = safeKelasList.find(item => item.namaKelas === selectedKelas);
      if (k) return k.waliKelas;
    }
    return 'Wali Kelas';
  }, [safeKelasList, selectedKelas]);

  // Handlers for PDF and Excel Export
  // Print Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);

  const getAbsensiReportOptions = (): PrintReportOptions => ({
    title: 'LAPORAN REKAPITULASI PRESENSI SISWA BULANAN',
    subtitle: `Bulan: ${selectedBulan} ${selectedTahun} | Kelas: ${selectedKelas === 'all' ? 'Semua Kelas' : selectedKelas}${selectedGuru !== 'all' ? ` | Guru: ${selectedGuru}` : ''}`,
    nomorDokumen: `REKAP-ABS/${selectedBulan.toUpperCase()}/${selectedTahun}`,
    orientation: 'landscape',
    metadataGrid: [
      { label: 'Bulan & Tahun', value: `${selectedBulan} ${selectedTahun}` },
      { label: 'Tahun Pelajaran', value: `${safeSetting.tahunPelajaran} (${safeSetting.semester})` },
      { label: 'Filter Kelas', value: selectedKelas === 'all' ? 'Semua Kelas' : selectedKelas },
      { label: 'Guru / Mapel', value: selectedGuru === 'all' ? 'Semua Guru' : `${selectedGuru} (${selectedMapel})` }
    ],
    headers: ['NO', 'NIS', 'NAMA SISWA', 'KELAS', 'HADIR', 'SAKIT', 'IZIN', 'ALPA', 'TERLAMBAT', 'TOTAL ABSEN', '% HADIR'],
    rows: filteredRekap.map((s, idx) => [
      idx + 1,
      s.nis,
      s.nama,
      s.kelas,
      s.hadir,
      s.sakit,
      s.izin,
      s.alpa,
      s.terlambat,
      s.totalAbsen,
      `${s.persentase}%`
    ]),
    alignments: ['center', 'center', 'left', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'],
    signLeft: {
      role: 'Mengetahui,\nKepala Sekolah',
      nama: safeSetting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.',
      nip: safeSetting.nipKepalaSekolah || '-'
    },
    signRight: {
      role: 'Wali Kelas / Guru Pengampu',
      nama: currentWaliKelas || safeSetting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.',
      nip: '-'
    }
  });

  const handleCetakPDF = () => {
    generateRekapAbsensiBulananPDF(filteredRekap, safeSetting, {
      bulan: selectedBulan,
      tahun: selectedTahun,
      kelas: selectedKelas === 'all' ? 'Semua Kelas' : selectedKelas,
      guruName: selectedGuru === 'all' ? undefined : selectedGuru,
      mapelName: selectedMapel === 'all' ? undefined : selectedMapel,
      waliKelas: currentWaliKelas
    });
    setNotice(`Cetak PDF Rekap Absensi Bulanan (${selectedBulan} ${selectedTahun}) berhasil diproses!`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleCetakBrowserHTML = () => {
    printHtmlReport(safeSetting, getAbsensiReportOptions());
  };

  const handleExportExcel = () => {
    exportRekapAbsensiBulananToExcel(filteredRekap, {
      bulan: selectedBulan,
      tahun: selectedTahun,
      kelas: selectedKelas === 'all' ? 'Semua Kelas' : selectedKelas,
      guruName: selectedGuru === 'all' ? undefined : selectedGuru,
      mapelName: selectedMapel === 'all' ? undefined : selectedMapel
    });
    setNotice(`Spreadsheet Excel Rekap Absensi Bulanan (${selectedBulan} ${selectedTahun}) berhasil diunduh!`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 p-6 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-500/30 px-2.5 py-1 text-xs font-semibold text-teal-200 backdrop-blur-md">
              Modul Laporan & Cetak Presensi Bulanan
            </span>
            <span className="text-xs text-teal-300">SIMAGU {safeSetting.namaSekolah}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Printer className="h-7 w-7 text-teal-300" />
            Rekap Presensi Siswa Per Bulan
          </h1>
          <p className="text-xs text-teal-100 max-w-2xl leading-relaxed">
            Hitung akumulasi ketidakhadiran persiswa (Alpa, Sakit, Izin) perbulan. Dilengkapi Filter Guru, Filter Kelas, Filter Mata Pelajaran, dan Fitur Cetak PDF Resmi & Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setPreviewModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-2.5 text-xs font-bold shadow-lg transition active:scale-95 border border-teal-500"
          >
            <Eye className="h-4 w-4" />
            <span>Pratinjau A4</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/40 px-3.5 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleCetakPDF}
            className="flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-lg transition active:scale-95"
          >
            <Download className="h-4 w-4" />
            <span>Unduh PDF</span>
          </button>
          <button
            onClick={handleCetakBrowserHTML}
            className="flex items-center gap-2 rounded-xl bg-white hover:bg-slate-100 text-teal-900 px-3.5 py-2.5 text-xs font-bold shadow-lg transition active:scale-95 border border-slate-200"
          >
            <Printer className="h-4 w-4 text-teal-600" />
            <span>Cetak Browser</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notice && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-medium">{notice}</p>
        </div>
      )}

      {/* Summary Badges Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">Total Siswa</p>
          <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{totalSiswaCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>

        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3.5 dark:border-rose-900/60 dark:bg-rose-950/30 shadow-xs">
          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <UserX className="h-3.5 w-3.5" />
            Total Alpa
          </p>
          <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-300">{totalAlpaCount} <span className="text-xs font-normal text-rose-500">Kali</span></p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30 shadow-xs">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Total Sakit</p>
          <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-300">{totalSakitCount} <span className="text-xs font-normal text-amber-500">Hari</span></p>
        </div>

        <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 dark:border-sky-900/60 dark:bg-sky-950/30 shadow-xs">
          <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">Total Izin</p>
          <p className="mt-1 text-xl font-bold text-sky-700 dark:text-sky-300">{totalIzinCount} <span className="text-xs font-normal text-sky-500">Hari</span></p>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3.5 dark:border-orange-900/60 dark:bg-orange-950/30 shadow-xs">
          <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">Terlambat</p>
          <p className="mt-1 text-xl font-bold text-orange-700 dark:text-orange-300">{totalTerlambatCount} <span className="text-xs font-normal text-orange-500">Kali</span></p>
        </div>

        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3.5 dark:border-teal-900/60 dark:bg-teal-950/30 shadow-xs">
          <p className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">Rata-rata Kehadiran</p>
          <p className="mt-1 text-xl font-bold text-teal-700 dark:text-teal-300">{avgKehadiran}%</p>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <Filter className="h-4 w-4 text-teal-600" />
          <span>Filter Laporan Rekapitulasi Presensi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Filter Bulan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pilih Bulan</label>
            <select
              value={selectedBulan}
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {MONTH_NAMES.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Filter Tahun */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pilih Tahun</label>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {['2026', '2025', '2027', '2024'].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Filter Guru / Pengampu */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter Per Guru / Wali</label>
            <select
              value={selectedGuru}
              onChange={(e) => setSelectedGuru(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Guru / Wali Kelas</option>
              {safeGuruList.map(g => (
                <option key={g.id} value={g.nama}>{g.nama}</option>
              ))}
            </select>
          </div>

          {/* Filter Mata Pelajaran */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter Per Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">
                {selectedGuru !== 'all' ? `Semua Mapel Diampu (${availableMapelList.length})` : 'Semua Mata Pelajaran'}
              </option>
              {availableMapelList.map(m => (
                <option key={m.id} value={m.namaMapel}>{m.namaMapel} ({m.kode})</option>
              ))}
            </select>
          </div>

          {/* Filter Kelas / Rombel */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter Per Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">
                {selectedGuru !== 'all' ? `Semua Kelas Diampu (${availableKelasList.length})` : 'Semua Rombel / Kelas'}
              </option>
              {availableKelasList.map(k => (
                <option key={k.id} value={k.namaKelas}>{k.namaKelas} ({k.jurusan})</option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cari Nama / NIS</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rekap Table */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              Rekapitulasi Kehadiran Siswa Per Bulan ({selectedBulan} {selectedTahun})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Kelas: <strong className="text-teal-600 dark:text-teal-400">{selectedKelas === 'all' ? 'Semua Kelas' : selectedKelas}</strong>
              {selectedMapel !== 'all' && <span> | Mapel: <strong className="text-teal-600 dark:text-teal-400">{selectedMapel}</strong></span>}
              {selectedGuru !== 'all' && <span> | Guru: <strong>{selectedGuru}</strong></span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleCetakPDF}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-28">NIS</th>
                <th className="py-3.5 px-4">Nama Lengkap Siswa</th>
                <th className="py-3.5 px-4 w-16 text-center">JK</th>
                <th className="py-3.5 px-4 w-28">Kelas</th>
                <th className="py-3.5 px-4 w-20 text-center text-emerald-700 dark:text-emerald-400">Hadir (H)</th>
                <th className="py-3.5 px-4 w-20 text-center text-amber-700 dark:text-amber-400">Sakit (S)</th>
                <th className="py-3.5 px-4 w-20 text-center text-sky-700 dark:text-sky-400">Izin (I)</th>
                <th className="py-3.5 px-4 w-20 text-center text-rose-700 dark:text-rose-400">Alpa (A)</th>
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
                    <tr key={`${s.nis}-${idx}`} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">{s.nis}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {s.nama}
                        {hasAlpa && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            {s.alpa} Alpa
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-500">{s.gender}</td>
                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-400">{s.kelas}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">{s.hadir}</td>
                      <td className="py-3 px-4 text-center font-bold text-amber-600 dark:text-amber-400">{s.sakit || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-sky-600 dark:text-sky-400">{s.izin || '-'}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600 dark:text-rose-400">{s.alpa || '-'}</td>
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
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : s.persentase >= 95
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300'
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
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Dicetak / Dibuat oleh: <strong className="text-slate-700 dark:text-slate-300">{currentUser?.nama || 'Administrator SIMAGU'}</strong>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 font-bold text-emerald-600 hover:underline"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export Spreadsheet Excel</span>
            </button>
            <button
              onClick={handleCetakPDF}
              className="flex items-center gap-1.5 font-bold text-teal-600 hover:underline"
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

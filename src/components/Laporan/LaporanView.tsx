import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer, FileSpreadsheet, Calendar, Filter, FileText, Download, Search, CheckCircle2, Eye,
  ShieldCheck, FileSpreadsheetIcon, Sparkles, ClipboardCheck, Users, UserX, AlertCircle,
  Folder, FolderTree, ChevronRight, ChevronDown, ExternalLink, HardDrive, FolderOpen, RefreshCw, Building2,
  Award, XCircle
} from 'lucide-react';
import { AgendaGuruItem, AgendaKelasItem, SchoolSetting, SupervisiRecord, NilaiSiswaRecord, SiswaItem, KelasItem, GuruItem, MapelItem, User } from '../../types';
import {
  generateAgendaGuruPDF, generateAgendaKelasPDF, generateRekapAgendaGuruPDF,
  generateRekapAgendaKelasPDF, generateSupervisiPDF, generateRekapSupervisiPDF,
  generateRekapNilaiSiswaPDF, generateAbsentStudentsPDF
} from '../../lib/pdfGenerator';
import {
  exportAgendaGuruToExcel, exportAgendaKelasToExcel, exportSupervisiToExcel,
  exportNilaiToExcel, exportAllLaporanToExcel
} from '../../lib/excelExport';
import { Storage, DriveFolderStructure } from '../../lib/storage';
import { printHtmlReport, PrintReportOptions } from '../../lib/printWindowHelper';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { RekapAbsensiBulananView } from '../Absensi/RekapAbsensiBulananView';

interface LaporanViewProps {
  agendaGuruList: AgendaGuruItem[];
  agendaKelasList: AgendaKelasItem[];
  supervisiList?: SupervisiRecord[];
  nilaiList?: NilaiSiswaRecord[];
  siswaList?: SiswaItem[];
  kelasList?: KelasItem[];
  guruList?: GuruItem[];
  mapelList?: MapelItem[];
  setting: SchoolSetting;
  currentUser?: User;
  onOpenGoogleSheetsModal?: () => void;
}

interface AbsentStudentEntry {
  id: string;
  tanggal: string;
  hari?: string;
  kelas: string;
  mapelOrSumber: string;
  guruOrWali: string;
  nis: string;
  nama: string;
  kategori: 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat';
  alasan: string;
  sumber: 'Agenda Guru' | 'Agenda Kelas' | 'Absensi Siswa';
}

const GoogleDriveFolderNavigator: React.FC<{ setting: SchoolSetting }> = ({ setting }) => {
  const [selectedTA, setSelectedTA] = useState<string>(setting.tahunPelajaran || '2026/2027');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [folderSearch, setFolderSearch] = useState<string>('');
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({ DKV: true });
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [driveStructure, setDriveStructure] = useState<DriveFolderStructure | null>(() => {
    return Storage.getDriveFolderStructure();
  });

  const handleGenerateFolders = async (ta?: string) => {
    const yearToUse = ta || selectedTA;
    setIsRefreshing(true);
    setNotice(null);
    try {
      const res = await Storage.generateGoogleDriveFolderStructure({
        schoolName: setting.namaSekolah,
        tahunAjaran: yearToUse
      });
      setDriveStructure(res);
      setNotice(`Struktur folder Google Drive untuk Tahun Ajaran ${yearToUse} berhasil disiapkan & diperbarui!`);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setNotice('Gagal memperbarui struktur folder Google Drive: ' + (err.message || 'Error'));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!driveStructure || driveStructure.tahunAjaran !== selectedTA) {
      handleGenerateFolders(selectedTA);
    }
  }, [selectedTA]);

  const toggleDept = (kode: string) => {
    setExpandedDepts(prev => ({ ...prev, [kode]: !prev[kode] }));
  };

  const filteredDepartments = useMemo(() => {
    if (!driveStructure?.departments) return [];
    if (!folderSearch.trim()) return driveStructure.departments;
    const q = folderSearch.toLowerCase();
    return driveStructure.departments.filter(d =>
      d.namaJurusan.toLowerCase().includes(q) ||
      d.kodeJurusan.toLowerCase().includes(q) ||
      d.folderName.toLowerCase().includes(q)
    );
  }, [driveStructure, folderSearch]);

  const yearOptions = ['2026/2027', '2025/2026', '2027/2028', '2024/2025'];

  return (
    <div className="p-5 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-br from-slate-50 via-white to-teal-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20 shadow-xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-600 text-white font-bold shadow-md flex items-center justify-center">
            <FolderTree className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Visualisasi Direktori Storage Google Drive</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                Terstruktur per TA & Jurusan
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Navigasi folder penyimpanan berkas PDF & Excel otomatis terorganisir untuk {setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR'}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Academic Year Selector */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="font-bold text-slate-500 text-[11px]">Tahun Ajaran:</span>
            <select
              value={selectedTA}
              onChange={(e) => setSelectedTA(e.target.value)}
              className="bg-transparent font-extrabold text-slate-900 dark:text-white focus:outline-none cursor-pointer text-xs"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => handleGenerateFolders(selectedTA)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Memproses...' : 'Refresh Folder TA'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span>{isExpanded ? 'Sembunyikan Navigasi' : 'Buka Navigasi Folder'}</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {isExpanded && driveStructure && (
        <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          {/* Search bar inside Drive Navigator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                placeholder="Cari jurusan atau subfolder..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <HardDrive className="h-4 w-4 text-teal-600" />
              <span>Jalur Induk: <b>{driveStructure.rootFolder.name} / {driveStructure.academicYearFolder.name}</b></span>
            </div>
          </div>

          {/* Department Folders Tree */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* General School Folder */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-500" />
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {driveStructure.generalFolder.folderName}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold">
                  Umum Sekolah
                </span>
              </div>

              <div className="pl-3 space-y-1.5 border-l-2 border-amber-300 dark:border-amber-700 text-xs">
                <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                    <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    {driveStructure.generalFolder.subfolders.rekapGabungan.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Rekap Laporan</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                    <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    {driveStructure.generalFolder.subfolders.arsipSupervisi.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Arsip KS</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 text-[11px]">
                    <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    {driveStructure.generalFolder.subfolders.exportDatabase.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Backup SIMAGU</span>
                </div>
              </div>
            </div>

            {/* Department Folders */}
            {filteredDepartments.map((dept, idx) => {
              const isOpen = expandedDepts[dept.kodeJurusan] ?? true;
              return (
                <div key={dept.kodeJurusan ? `${dept.kodeJurusan}-${idx}` : `dept-${idx}`} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-2xs">
                  <div
                    onClick={() => toggleDept(dept.kodeJurusan)}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-teal-600 transition">
                        {dept.folderName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {dept.webViewLink && (
                        <a
                          href={dept.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-bold text-teal-600 hover:underline flex items-center gap-0.5"
                        >
                          <span>Buka Drive</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <button className="text-slate-400 hover:text-slate-600">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="pl-3 space-y-1.5 border-l-2 border-teal-300 dark:border-teal-800 text-xs pt-1">
                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          <Folder className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                          {dept.subfolders.agendaGuru.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 font-bold">PDF Guru</span>
                      </div>

                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          <Folder className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          {dept.subfolders.agendaKelas.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 font-bold">PDF Kelas</span>
                      </div>

                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          <Folder className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                          {dept.subfolders.supervisi.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 font-bold">PDF Supervisi</span>
                      </div>

                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          {dept.subfolders.presensiSiswa.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold">Presensi Siswa</span>
                      </div>

                      <div className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                          <Folder className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          {dept.subfolders.exportFiles.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-bold">Export .XLSX</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const LaporanView: React.FC<LaporanViewProps> = ({
  agendaGuruList = [],
  agendaKelasList = [],
  supervisiList = [],
  nilaiList = [],
  siswaList,
  kelasList,
  guruList,
  mapelList,
  setting,
  currentUser,
  onOpenGoogleSheetsModal
}) => {
  const [periode, setPeriode] = useState<'harian' | 'bulanan' | 'semester'>('harian');
  const [activeCategory, setActiveCategory] = useState<'guru' | 'kelas' | 'presensi' | 'supervisi' | 'nilai' | 'rekap_absensi'>('guru');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  
  // Explicit Filters: Hari, Tanggal, Tahun, Guru, Mapel, Asesmen, Status
  const [selectedHariFilter, setSelectedHariFilter] = useState<string>('all');
  const [selectedTanggalFilter, setSelectedTanggalFilter] = useState<string>('');
  const [selectedTahunFilter, setSelectedTahunFilter] = useState<string>('all');
  const [selectedGuruFilter, setSelectedGuruFilter] = useState<string>('all');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState<string>('all');
  const [selectedJenisAsesmenFilter, setSelectedJenisAsesmenFilter] = useState<string>('all');
  const [selectedStatusNilaiFilter, setSelectedStatusNilaiFilter] = useState<string>('all');

  const [exportSuccessNotice, setExportSuccessNotice] = useState<string | null>(null);

  const safeGuruList = agendaGuruList || [];
  const safeKelasList = agendaKelasList || [];
  const safeSupervisiList = supervisiList || [];
  
  const safeNilaiList = useMemo(() => {
    if (nilaiList && nilaiList.length > 0) return nilaiList;
    return Storage.getNilaiSiswa();
  }, [nilaiList]);

  const handleExportAllExcel = () => {
    exportAllLaporanToExcel({
      agendaGuruList: safeGuruList,
      agendaKelasList: safeKelasList,
      supervisiList: safeSupervisiList,
      nilaiList: safeNilaiList,
      setting,
      periode
    });
    setExportSuccessNotice('Spreadsheet Excel Lengkap (Agenda Guru, Agenda Kelas, Monitoring Supervisi, Presensi, & Nilai Guru) berhasil diunduh!');
    setTimeout(() => setExportSuccessNotice(null), 5000);
  };

  // Extract available unique classes for filter dropdown
  const availableKelasOptions = useMemo(() => {
    const set = new Set<string>();
    safeGuruList.forEach(g => { if (g.kelas) set.add(g.kelas); });
    safeKelasList.forEach(k => { if (k.kelas) set.add(k.kelas); });
    safeNilaiList.forEach(n => { if (n.kelas) set.add(n.kelas); });
    // Add standard defaults if set is small
    ['XI RPL 1', 'XI RPL 2', 'XII TKJ 1', 'XII TKR 1', 'X AK 1'].forEach(c => set.add(c));
    return Array.from(set).sort();
  }, [safeGuruList, safeKelasList, safeNilaiList]);

  // Aggregate student absence records
  const allAbsentStudents: AbsentStudentEntry[] = useMemo(() => {
    const list: AbsentStudentEntry[] = [];

    // 1. From Agenda Guru
    safeGuruList.forEach(g => {
      if (g.siswaTidakHadir && Array.isArray(g.siswaTidakHadir)) {
        g.siswaTidakHadir.forEach((s, idx) => {
          list.push({
            id: `guru-${g.id}-${idx}-${s.nis}`,
            tanggal: g.tanggal,
            hari: g.hari,
            kelas: g.kelas,
            mapelOrSumber: g.mapel || 'Mata Pelajaran',
            guruOrWali: g.namaGuru || '-',
            nis: s.nis,
            nama: s.nama,
            kategori: s.kategori,
            alasan: s.alasan || s.keterangan || 'Tidak Ada Keterangan',
            sumber: 'Agenda Guru'
          });
        });
      }
    });

    // 2. From Agenda Kelas
    safeKelasList.forEach(k => {
      if (k.siswaTidakHadir && Array.isArray(k.siswaTidakHadir)) {
        k.siswaTidakHadir.forEach((s, idx) => {
          const exists = list.some(item => item.tanggal === k.tanggal && item.nis === s.nis && item.kategori === s.kategori);
          if (!exists) {
            list.push({
              id: `kelas-${k.id}-${idx}-${s.nis}`,
              tanggal: k.tanggal,
              hari: k.hari,
              kelas: k.kelas,
              mapelOrSumber: 'Jurnal Kelas',
              guruOrWali: k.waliKelas || '-',
              nis: s.nis,
              nama: s.nama,
              kategori: s.kategori,
              alasan: s.alasan || 'Tidak Ada Keterangan',
              sumber: 'Agenda Kelas'
            });
          }
        });
      }
    });

    // 3. From Absensi Siswa Records
    const storedAbsensiSiswa = Storage.getAbsensiSiswa();
    storedAbsensiSiswa.forEach((abs, idx) => {
      if (abs.status && abs.status !== 'Hadir') {
        const exists = list.some(item => item.tanggal === abs.tanggal && item.nis === abs.nis && item.kategori === abs.status);
        if (!exists) {
          const dateObj = new Date(abs.tanggal);
          const dayName = !isNaN(dateObj.getTime()) 
            ? dateObj.toLocaleDateString('id-ID', { weekday: 'long' }) 
            : 'Senin';
          list.push({
            id: `abs-sis-${abs.id || idx}`,
            tanggal: abs.tanggal,
            hari: dayName,
            kelas: abs.kelas,
            mapelOrSumber: abs.mapel || 'Presensi Harian',
            guruOrWali: abs.guru || abs.dicatatOleh || '-',
            nis: abs.nis,
            nama: abs.namaSiswa,
            kategori: abs.status as 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat',
            alasan: abs.alasan || (abs.status === 'Alpa' ? 'Tanpa Keterangan' : `Catatan Presensi (${abs.status})`),
            sumber: 'Absensi Siswa'
          });
        }
      }
    });

    return list;
  }, [safeGuruList, safeKelasList]);

  // Filtered lists with Hari, Tanggal, & Tahun filtering
  const filteredGuruList = safeGuruList.filter(g => {
    const matchSearch =
      g.namaGuru?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.mapel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.kelas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.nomorAgenda?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.materi?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKelas = selectedKelasFilter === 'all' || g.kelas === selectedKelasFilter;
    const matchHari = selectedHariFilter === 'all' || g.hari === selectedHariFilter;
    const matchTanggal = !selectedTanggalFilter || g.tanggal === selectedTanggalFilter;
    const matchTahun = selectedTahunFilter === 'all' ||
      (g.tahunPelajaran && g.tahunPelajaran.includes(selectedTahunFilter)) ||
      (g.tanggal && g.tanggal.startsWith(selectedTahunFilter));
    return matchSearch && matchKelas && matchHari && matchTanggal && matchTahun;
  });

  const filteredKelasList = safeKelasList.filter(k => {
    const matchSearch =
      k.kelas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.waliKelas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.tanggal?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKelas = selectedKelasFilter === 'all' || k.kelas === selectedKelasFilter;
    const matchHari = selectedHariFilter === 'all' || k.hari === selectedHariFilter;
    const matchTanggal = !selectedTanggalFilter || k.tanggal === selectedTanggalFilter;
    const matchTahun = selectedTahunFilter === 'all' ||
      (k.tahunPelajaran && k.tahunPelajaran.includes(selectedTahunFilter)) ||
      (k.tanggal && k.tanggal.startsWith(selectedTahunFilter));
    return matchSearch && matchKelas && matchHari && matchTanggal && matchTahun;
  });

  const filteredSupervisiList = safeSupervisiList.filter(s => {
    const matchSearch =
      s.namaGuru?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mapel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.kelas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.supervisor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nomorSupervisi?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKelas = selectedKelasFilter === 'all' || s.kelas === selectedKelasFilter;
    const matchHari = selectedHariFilter === 'all' || (s.tanggal && new Date(s.tanggal).toLocaleDateString('id-ID', { weekday: 'long' }) === selectedHariFilter);
    const matchTanggal = !selectedTanggalFilter || s.tanggal === selectedTanggalFilter;
    const matchTahun = selectedTahunFilter === 'all' || (s.tanggal && s.tanggal.startsWith(selectedTahunFilter));
    return matchSearch && matchKelas && matchHari && matchTanggal && matchTahun;
  });

  const filteredAbsentStudents = allAbsentStudents.filter(item => {
    const matchSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alasan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mapelOrSumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.guruOrWali.toLowerCase().includes(searchQuery.toLowerCase());
    const matchKelas = selectedKelasFilter === 'all' || item.kelas === selectedKelasFilter;
    const matchStatus = selectedStatusFilter === 'all' || item.kategori === selectedStatusFilter;
    const matchHari = selectedHariFilter === 'all' || item.hari === selectedHariFilter;
    const matchTanggal = !selectedTanggalFilter || item.tanggal === selectedTanggalFilter;
    const matchTahun = selectedTahunFilter === 'all' || (item.tanggal && item.tanggal.startsWith(selectedTahunFilter));
    return matchSearch && matchKelas && matchStatus && matchHari && matchTanggal && matchTahun;
  });

  const filteredNilaiList = safeNilaiList.filter(n => {
    const matchSearch =
      n.namaSiswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.guru.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.mapel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.nis && n.nis.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.materiJudul && n.materiJudul.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchKelas = selectedKelasFilter === 'all' || n.kelas === selectedKelasFilter;
    const matchGuru = selectedGuruFilter === 'all' || n.guru.toLowerCase().includes(selectedGuruFilter.toLowerCase()) || selectedGuruFilter.toLowerCase().includes(n.guru.toLowerCase());
    const matchMapel = selectedMapelFilter === 'all' || n.mapel.toLowerCase().includes(selectedMapelFilter.toLowerCase()) || selectedMapelFilter.toLowerCase().includes(n.mapel.toLowerCase());
    const matchHari = selectedHariFilter === 'all' || n.hari === selectedHariFilter;
    const matchTanggal = !selectedTanggalFilter || n.tanggal === selectedTanggalFilter;
    const matchTahun = selectedTahunFilter === 'all' || (n.tanggal && n.tanggal.startsWith(selectedTahunFilter));
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

    const matchJenis = isJenisMatch(n.jenisAsesmen, selectedJenisAsesmenFilter);
    const matchStatusNilai = selectedStatusNilaiFilter === 'all' || n.statusKelulusan === selectedStatusNilaiFilter;
    return matchSearch && matchKelas && matchGuru && matchMapel && matchHari && matchTanggal && matchTahun && matchJenis && matchStatusNilai;
  });

  // Calculate statistics for absent list
  const countSakit = filteredAbsentStudents.filter(s => s.kategori === 'Sakit').length;
  const countIzin = filteredAbsentStudents.filter(s => s.kategori === 'Izin').length;
  const countAlpa = filteredAbsentStudents.filter(s => s.kategori === 'Alpa').length;
  const countTerlambat = filteredAbsentStudents.filter(s => s.kategori === 'Terlambat').length;

  // Statistics for Nilai List
  const avgNilaiAkhir = useMemo(() => {
    if (filteredNilaiList.length === 0) return 0;
    const sum = filteredNilaiList.reduce((acc, curr) => acc + (curr.nilaiAkhir || 0), 0);
    return Math.round(sum / filteredNilaiList.length);
  }, [filteredNilaiList]);

  const totalTuntas = useMemo(() => {
    return filteredNilaiList.filter(n => n.statusKelulusan === 'Tuntas').length;
  }, [filteredNilaiList]);

  const totalRemedial = useMemo(() => {
    return filteredNilaiList.filter(n => n.statusKelulusan === 'Remedial').length;
  }, [filteredNilaiList]);

  // Print Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [previewOptions, setPreviewOptions] = useState<PrintReportOptions | null>(null);
  const [previewDownloadPdf, setPreviewDownloadPdf] = useState<(() => void) | undefined>(undefined);
  const [previewExportExcel, setPreviewExportExcel] = useState<(() => void) | undefined>(undefined);

  const getAgendaGuruOptions = (): PrintReportOptions => ({
    title: 'LAPORAN REKAPITULASI AGENDA PEMBELAJARAN GURU',
    subtitle: `Periode: ${periode.toUpperCase()} | Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester})`,
    nomorDokumen: `REKAP-AG/${periode.toUpperCase()}/${new Date().getFullYear()}`,
    orientation: 'landscape',
    metadataGrid: [
      { label: 'Periode Laporan', value: periode.toUpperCase() },
      { label: 'Tahun Pelajaran', value: `${setting.tahunPelajaran} (${setting.semester})` },
      { label: 'Total Catatan Agenda', value: `${filteredGuruList.length} Record` },
      { label: 'Sekolah / Instansi', value: setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR' }
    ],
    headers: ['NO', 'TANGGAL & HARI', 'GURU & MAPEL', 'KELAS & JAM', 'MATERI PEMBELAJARAN', 'PRESENSI SISWA', 'KETERANGAN'],
    rows: filteredGuruList.map((g, idx) => [
      idx + 1,
      `${g.tanggal}\n(${g.hari})`,
      `${g.namaGuru}\n${g.mapel}`,
      `${g.kelas}\nJam ke ${g.jamKe}`,
      g.materi,
      `Hadir: ${g.jumlahSiswaHadir || 0}, Sakit: ${g.jumlahSakit || 0}, Izin: ${g.jumlahIzin || 0}, Alpa: ${g.jumlahAlpa || 0}`,
      g.keterangan || '-'
    ]),
    alignments: ['center', 'center', 'left', 'center', 'left', 'left', 'left'],
    signLeft: {
      role: 'Mengetahui,\nKepala Sekolah',
      nama: setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.',
      nip: setting.nipKepalaSekolah || '-'
    },
    signRight: {
      role: 'Wakasek Bidang Kurikulum',
      nama: setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.',
      nip: setting.nipWakasekKurikulum || '-'
    }
  });

  const getAgendaKelasOptions = (): PrintReportOptions => ({
    title: 'LAPORAN REKAPITULASI JURNAL & AGENDA KELAS',
    subtitle: `Periode: ${periode.toUpperCase()} | Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester})`,
    nomorDokumen: `REKAP-AK/${periode.toUpperCase()}/${new Date().getFullYear()}`,
    orientation: 'landscape',
    metadataGrid: [
      { label: 'Periode Laporan', value: periode.toUpperCase() },
      { label: 'Tahun Pelajaran', value: `${setting.tahunPelajaran} (${setting.semester})` },
      { label: 'Total Jurnal Kelas', value: `${filteredKelasList.length} Record` },
      { label: 'Sekolah / Instansi', value: setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR' }
    ],
    headers: ['NO', 'TANGGAL & HARI', 'KELAS & MAPEL', 'GURU PENGAMPU', 'MATERI PEMBELAJARAN', 'Siswa Tidak Hadir (S/I/A)', 'KETERANGAN'],
    rows: filteredKelasList.map((k, idx) => [
      idx + 1,
      `${k.tanggal}\n(${k.hari})`,
      `${k.kelas}\n${k.mapel}`,
      k.namaGuru,
      k.materi,
      (k.siswaTidakHadir || []).map(s => `${s.nama} (${s.kategori})`).join(', ') || 'Nihil',
      k.keterangan || '-'
    ]),
    alignments: ['center', 'center', 'left', 'left', 'left', 'left', 'left'],
    signLeft: {
      role: 'Mengetahui,\nKepala Sekolah',
      nama: setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.',
      nip: setting.nipKepalaSekolah || '-'
    },
    signRight: {
      role: 'Wakasek Bidang Kurikulum',
      nama: setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.',
      nip: setting.nipWakasekKurikulum || '-'
    }
  });

  const getSupervisiOptions = (): PrintReportOptions => ({
    title: 'LAPORAN REKAPITULASI MONITORING & SUPERVISI AKADEMIK',
    subtitle: `Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester})`,
    nomorDokumen: `REKAP-SUP/${new Date().getFullYear()}`,
    orientation: 'landscape',
    metadataGrid: [
      { label: 'Jenis Laporan', value: 'Supervisi Akademik Guru' },
      { label: 'Tahun Pelajaran', value: `${setting.tahunPelajaran} (${setting.semester})` },
      { label: 'Total Rekap Supervisi', value: `${filteredSupervisiList.length} Guru` },
      { label: 'Sekolah / Instansi', value: setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR' }
    ],
    headers: ['NO', 'TANGGAL', 'NAMA GURU / NIP', 'MAPEL / KELAS', 'SKOR TOTAL', 'NILAI AKHIR', 'PREDIKAT', 'CATATAN SUPERVISOR'],
    rows: filteredSupervisiList.map((s, idx) => [
      idx + 1,
      s.tanggal,
      `${s.namaGuru}\nNIP: ${s.nipGuru || '-'}`,
      `${s.mapel}\n(${s.kelas})`,
      s.skorTotal || 0,
      s.nilaiAkhir || 0,
      s.predikat || 'Sangat Baik',
      s.catatanRekomendasi || '-'
    ]),
    alignments: ['center', 'center', 'left', 'center', 'center', 'center', 'center', 'left'],
    signLeft: {
      role: 'Mengetahui,\nKepala Sekolah',
      nama: setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.',
      nip: setting.nipKepalaSekolah || '-'
    },
    signRight: {
      role: 'Supervisor / Tim Penilai',
      nama: setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.',
      nip: setting.nipWakasekKurikulum || '-'
    }
  });

  const getNilaiOptions = (): PrintReportOptions => {
    const activeGuruName = selectedGuruFilter !== 'all' ? selectedGuruFilter : (filteredNilaiList[0]?.guru || 'Guru Pengampu');
    const matchedGuruObj = (guruList || []).find(g => (g.nama || '').toLowerCase() === activeGuruName.toLowerCase() || (g.nama || '').includes(activeGuruName));
    const activeGuruNip = matchedGuruObj?.nip || '-';
    const activeMapelName = selectedMapelFilter !== 'all' ? selectedMapelFilter : (filteredNilaiList[0]?.mapel || 'Mata Pelajaran');
    const activeKelasName = selectedKelasFilter !== 'all' ? selectedKelasFilter : 'Semua Kelas';

    return {
      title: 'LAPORAN REKAPITULASI ASESMEN & NILAI SISWA PER GURU & PER MAPEL',
      subtitle: `MATA PELAJARAN: ${activeMapelName.toUpperCase()} | GURU: ${activeGuruName.toUpperCase()} | KELAS: ${activeKelasName.toUpperCase()}`,
      nomorDokumen: `REKAP-NILAI/${new Date().getFullYear()}`,
      orientation: 'landscape',
      metadataGrid: [
        { label: 'Mata Pelajaran', value: activeMapelName },
        { label: 'Guru Pengampu', value: `${activeGuruName} (NIP: ${activeGuruNip})` },
        { label: 'Rombel / Kelas', value: activeKelasName },
        { label: 'Tahun Pelajaran', value: `${setting.tahunPelajaran} (${setting.semester})` },
        { label: 'Rata-rata Nilai Akhir', value: `${avgNilaiAkhir} / 100` },
        { label: 'Ketuntasan Siswa', value: `${totalTuntas} Tuntas (${totalRemedial} Remedial)` }
      ],
      headers: ['NO', 'NIS', 'NAMA SISWA', 'KELAS', 'MATA PELAJARAN', 'GURU PENGAJAR', 'JENIS ASESMEN', 'FORMATIF', 'PRAKTIK', 'NILAI AKHIR', 'STATUS'],
      rows: filteredNilaiList.map((n, idx) => [
        idx + 1,
        n.nis || '-',
        n.namaSiswa,
        n.kelas,
        n.mapel,
        n.guru,
        n.jenisAsesmen,
        n.nilaiFormatif || 0,
        n.nilaiPraktik || n.nilaiSumatif || 0,
        n.nilaiAkhir || 0,
        n.statusKelulusan || 'Tuntas'
      ]),
      alignments: ['center', 'center', 'left', 'center', 'left', 'left', 'left', 'center', 'center', 'center', 'center'],
      signLeft: {
        role: 'Mengetahui,\nKepala Sekolah',
        nama: setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.',
        nip: setting.nipKepalaSekolah || '-'
      },
      signRight: {
        role: 'Guru Mata Pelajaran,',
        nama: activeGuruName,
        nip: activeGuruNip
      }
    };
  };

  const getAbsensiTidakHadirOptions = (): PrintReportOptions => ({
    title: 'LAPORAN REKAPITULASI KETIDAKHADIRAN SISWA (SAKIT, IZIN, ALPA)',
    subtitle: `Periode: ${periode.toUpperCase()} | Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester})`,
    nomorDokumen: `REKAP-PRESENSI/${periode.toUpperCase()}/${new Date().getFullYear()}`,
    orientation: 'landscape',
    metadataGrid: [
      { label: 'Periode Laporan', value: periode.toUpperCase() },
      { label: 'Tahun Pelajaran', value: `${setting.tahunPelajaran} (${setting.semester})` },
      { label: 'Total Catatan', value: `${filteredAbsentStudents.length} Siswa` },
      { label: 'Rincian Status', value: `Sakit: ${countSakit} | Izin: ${countIzin} | Alpa: ${countAlpa} | Terlambat: ${countTerlambat}` }
    ],
    headers: ['NO', 'TANGGAL & HARI', 'KELAS', 'NIS', 'NAMA SISWA', 'STATUS', 'ALASAN / KETERANGAN', 'MAPEL / SUMBER', 'GURU / WALI KELAS'],
    rows: filteredAbsentStudents.map((item, idx) => [
      idx + 1,
      `${item.tanggal}\n(${item.hari || '-'})`,
      item.kelas,
      item.nis || '-',
      item.nama,
      item.kategori,
      item.alasan || '-',
      `${item.mapelOrSumber}\n(${item.sumber})`,
      item.guruOrWali || '-'
    ]),
    alignments: ['center', 'center', 'center', 'center', 'left', 'center', 'left', 'left', 'left'],
    signLeft: {
      role: 'Mengetahui,\nKepala Sekolah',
      nama: setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.',
      nip: setting.nipKepalaSekolah || '-'
    },
    signRight: {
      role: 'Guru / Wali Kelas,',
      nama: setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.',
      nip: setting.nipWakasekKurikulum || '-'
    }
  });

  const openPreviewModal = (
    opts: PrintReportOptions,
    downloadPdfFn?: () => void,
    exportExcelFn?: () => void
  ) => {
    setPreviewOptions(opts);
    setPreviewDownloadPdf(() => downloadPdfFn);
    setPreviewExportExcel(() => exportExcelFn);
    setPreviewModalOpen(true);
  };

  // Handlers for HTML Browser Printing & PDF Conversion
  const handlePrintAgendaGuruHTML = () => printHtmlReport(setting, getAgendaGuruOptions());
  const handlePrintAgendaKelasHTML = () => printHtmlReport(setting, getAgendaKelasOptions());
  const handlePrintSupervisiHTML = () => printHtmlReport(setting, getSupervisiOptions());
  const handlePrintNilaiHTML = () => printHtmlReport(setting, getNilaiOptions());
  const handlePrintAbsensiTidakHadirHTML = () => printHtmlReport(setting, getAbsensiTidakHadirOptions());

  // Centralized Export to PDF for active category table
  const handleExportActiveTableToPDF = () => {
    if (activeCategory === 'guru') {
      generateRekapAgendaGuruPDF(filteredGuruList, setting, periode);
    } else if (activeCategory === 'kelas') {
      generateRekapAgendaKelasPDF(filteredKelasList, setting, periode);
    } else if (activeCategory === 'presensi') {
      generateAbsentStudentsPDF(filteredAbsentStudents, setting, periode);
    } else if (activeCategory === 'nilai') {
      generateRekapNilaiSiswaPDF(filteredNilaiList, setting, periode);
    } else if (activeCategory === 'supervisi') {
      generateRekapSupervisiPDF(filteredSupervisiList, setting, periode);
    } else {
      generateAbsentStudentsPDF(filteredAbsentStudents, setting, periode);
    }
    setExportSuccessNotice(`Dokumen PDF Laporan Modul ${activeCategory.toUpperCase()} berhasil dikonversi dengan Kop Surat & diunduh!`);
    setTimeout(() => setExportSuccessNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Printer className="h-6 w-6 text-teal-600" />
            <span>Pusat Laporan & Cetak PDF Resmi</span>
          </h2>
          <p className="text-xs text-slate-500">
            Generasi dokumen PDF resmi {setting.namaSekolah} lengkap dengan Logo Sekolah, Kop Surat, NIP, dan Tanda Tangan Digital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Export to PDF Button */}
          <button
            onClick={handleExportActiveTableToPDF}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs px-4 py-2 shadow-md hover:shadow-lg transition transform active:scale-95 border border-rose-500/30"
            title="Konversi Data Tabel Aktif ke Format Dokumen PDF Cetak Kop Surat"
          >
            <Download className="h-4 w-4" />
            <span>Export to PDF</span>
          </button>

          <button
            onClick={() => {
              if (activeCategory === 'guru') openPreviewModal(getAgendaGuruOptions(), () => generateRekapAgendaGuruPDF(filteredGuruList, setting, periode), () => exportAgendaGuruToExcel(safeGuruList));
              else if (activeCategory === 'kelas') openPreviewModal(getAgendaKelasOptions(), () => generateRekapAgendaKelasPDF(filteredKelasList, setting, periode), () => exportAgendaKelasToExcel(safeKelasList));
              else if (activeCategory === 'presensi') openPreviewModal(getAbsensiTidakHadirOptions(), () => generateAbsentStudentsPDF(filteredAbsentStudents, setting, periode));
              else if (activeCategory === 'nilai') openPreviewModal(getNilaiOptions(), () => generateRekapNilaiSiswaPDF(filteredNilaiList, setting, periode), () => exportNilaiToExcel(filteredNilaiList));
              else if (activeCategory === 'supervisi') openPreviewModal(getSupervisiOptions(), () => generateRekapSupervisiPDF(filteredSupervisiList, setting, periode), () => exportSupervisiToExcel(safeSupervisiList));
              else openPreviewModal(getAbsensiTidakHadirOptions());
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 hover:bg-teal-100 font-extrabold text-xs px-3.5 py-2 shadow-xs transition"
            title="Pratinjau Tata Letak Cetak Kop Surat A4"
          >
            <Eye className="h-4 w-4 text-teal-600" />
            <span>Pratinjau Kop A4</span>
          </button>

          <div className="flex rounded-xl border bg-slate-100 dark:bg-slate-800 p-1">
            {(['harian', 'bulanan', 'semester'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriode(p)}
                className={`px-3 py-1.5 text-xs font-bold capitalize rounded-lg transition ${periode === p ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Laporan {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {exportSuccessNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{exportSuccessNotice}</span>
          </div>
          <button onClick={() => setExportSuccessNotice(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Google Drive Folder Visualizer Component */}
      <GoogleDriveFolderNavigator setting={setting} />

      {/* Master Excel Export Banner */}
      <div className="p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-emerald-200" />
              <h3 className="text-lg font-extrabold tracking-tight">Export Spreadsheet Excel Laporan & Monitoring Lengkap</h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/40 text-emerald-100 border border-emerald-400/30">
                Multi-Sheet .XLSX
              </span>
            </div>
            <p className="text-xs text-emerald-100 max-w-2xl">
              Unduh seluruh data laporan SIMAGU (Ringkasan Statistik, Agenda Pembelajaran Guru, Jurnal Kelas, Monitoring Supervisi, serta Rekap Ketidakhadiran Siswa) dalam 1 berkas Excel spreadsheet terintegrasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {onOpenGoogleSheetsModal && (
              <button
                onClick={onOpenGoogleSheetsModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-900 text-emerald-100 font-bold text-xs px-5 py-3 border border-emerald-400/40 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
                <span>Sinkron Live Google Sheets</span>
              </button>
            )}

            <button
              onClick={handleExportAllExcel}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs px-5 py-3 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Download className="h-4 w-4 text-emerald-700" />
              <span>Export Semua Data Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* Quick Excel Export Buttons */}
        <div className="pt-3 border-t border-emerald-500/40 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-emerald-100 font-medium mr-2">Unduh Satuan:</span>
          <button
            onClick={() => exportAgendaGuruToExcel(safeGuruList)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 font-semibold border border-emerald-500/50 transition text-[11px]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Excel Agenda Guru ({safeGuruList.length})</span>
          </button>
          <button
            onClick={() => exportAgendaKelasToExcel(safeKelasList)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 font-semibold border border-emerald-500/50 transition text-[11px]"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Excel Agenda Kelas ({safeKelasList.length})</span>
          </button>
          {safeSupervisiList.length > 0 && (
            <button
              onClick={() => exportSupervisiToExcel(safeSupervisiList)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 font-semibold border border-emerald-500/50 transition text-[11px]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Excel Supervisi ({safeSupervisiList.length})</span>
            </button>
          )}
          {safeNilaiList.length > 0 && (
            <button
              onClick={() => exportNilaiToExcel(safeNilaiList)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/60 hover:bg-emerald-700 text-emerald-100 font-semibold border border-emerald-500/50 transition text-[11px]"
            >
              <Award className="h-3.5 w-3.5 text-amber-300" />
              <span>Excel Nilai Guru ({safeNilaiList.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Rekap Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Card Laporan Rekap Absensi Bulanan Siswa */}
        <div className="p-4 rounded-2xl border border-rose-300 dark:border-rose-900/60 bg-gradient-to-br from-rose-50/50 to-amber-50/30 dark:from-rose-950/20 dark:to-slate-900 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white font-bold shadow-md shrink-0">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Rekap Absensi Bulanan</h3>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Per Siswa (S, I, A)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 shrink-0">
                PDF / XLS
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              Hitung akumulasi Sakit, Izin, & Alpa per siswa perbulan dengan filter Per Guru & Per Kelas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveCategory('rekap_absensi')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-xs transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Buka Cetak Rekap</span>
            </button>
          </div>
        </div>

        {/* Card Laporan Agenda Guru */}
        <div className="p-4 rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-teal-950/20 dark:to-slate-900 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold shadow-md shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Rekap Agenda Guru</h3>
                  <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">{safeGuruList.length} Agenda Tersimpan</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 shrink-0">
                PDF
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              Cetak rekapitulasi kolektif Agenda Pembelajaran Guru periode <b>{periode.toUpperCase()}</b> lengkap Kop Sekolah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => openPreviewModal(
                getAgendaGuruOptions(),
                () => generateRekapAgendaGuruPDF(filteredGuruList, setting, periode),
                () => exportAgendaGuruToExcel(safeGuruList)
              )}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-teal-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-xs transition"
              title="Pratinjau Cetak A4"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Pratinjau A4</span>
            </button>
            <button
              onClick={() => generateRekapAgendaGuruPDF(filteredGuruList, setting, periode)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Unduh PDF Resmi"
            >
              <Download className="h-3.5 w-3.5 text-teal-600" />
            </button>
            <button
              onClick={handlePrintAgendaGuruHTML}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Cetak HTML Browser"
            >
              <Printer className="h-3.5 w-3.5 text-teal-600" />
            </button>
            <button
              onClick={() => exportAgendaGuruToExcel(safeGuruList)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Export Excel Agenda Guru"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Card Laporan Agenda Kelas */}
        <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 dark:from-indigo-950/20 dark:to-slate-900 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shrink-0">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Rekap Agenda Kelas</h3>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">{safeKelasList.length} Jurnal Kelas</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 shrink-0">
                PDF
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              Cetak rekapitulasi Jurnal Kelas mencakup presensi, kedisiplinan, kebersihan, dan Kop Surat resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => openPreviewModal(
                getAgendaKelasOptions(),
                () => generateRekapAgendaKelasPDF(filteredKelasList, setting, periode),
                () => exportAgendaKelasToExcel(safeKelasList)
              )}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs transition"
              title="Pratinjau Cetak A4"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Pratinjau A4</span>
            </button>
            <button
              onClick={() => generateRekapAgendaKelasPDF(filteredKelasList, setting, periode)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Unduh PDF Resmi"
            >
              <Download className="h-3.5 w-3.5 text-indigo-600" />
            </button>
            <button
              onClick={handlePrintAgendaKelasHTML}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Cetak HTML Browser"
            >
              <Printer className="h-3.5 w-3.5 text-indigo-600" />
            </button>
            <button
              onClick={() => exportAgendaKelasToExcel(safeKelasList)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Export Excel Agenda Kelas"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Card Laporan Supervisi */}
        <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/20 dark:to-slate-900 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-bold shadow-md shrink-0">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Rekap Supervisi</h3>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400 font-medium">{safeSupervisiList.length} Supervisi</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 shrink-0">
                PDF
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              Cetak rekapitulasi penilaian Supervisi Akademik Guru lengkap dengan Logo Sekolah & NIP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => openPreviewModal(
                getSupervisiOptions(),
                () => generateRekapSupervisiPDF(filteredSupervisiList, setting, periode),
                () => exportSupervisiToExcel(safeSupervisiList)
              )}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-purple-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs transition"
              title="Pratinjau Cetak A4"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Pratinjau A4</span>
            </button>
            <button
              onClick={() => generateRekapSupervisiPDF(filteredSupervisiList, setting, periode)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Unduh PDF Resmi"
            >
              <Download className="h-3.5 w-3.5 text-purple-600" />
            </button>
            <button
              onClick={handlePrintSupervisiHTML}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Cetak HTML Browser"
            >
              <Printer className="h-3.5 w-3.5 text-purple-600" />
            </button>
            <button
              onClick={() => exportSupervisiToExcel(safeSupervisiList)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Export Excel Supervisi"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Card Laporan Nilai Guru */}
        <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-slate-900 space-y-3 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white font-bold shadow-md shrink-0">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Laporan Nilai Guru</h3>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">{safeNilaiList.length} Catatan Evaluasi</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0">
                PDF
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
              Cetak rekapitulasi penilaian asesmen formatif, praktik, dan status ketuntasan siswa lengkap Kop Sekolah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => openPreviewModal(
                getNilaiOptions(),
                () => generateRekapNilaiSiswaPDF(filteredNilaiList, setting, periode),
                () => exportNilaiToExcel(filteredNilaiList)
              )}
              className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-amber-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-xs transition"
              title="Pratinjau Cetak A4"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Pratinjau A4</span>
            </button>
            <button
              onClick={() => generateRekapNilaiSiswaPDF(filteredNilaiList, setting, periode)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Unduh PDF Resmi"
            >
              <Download className="h-3.5 w-3.5 text-amber-600" />
            </button>
            <button
              onClick={handlePrintNilaiHTML}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Cetak HTML Browser"
            >
              <Printer className="h-3.5 w-3.5 text-amber-600" />
            </button>
            <button
              onClick={() => exportNilaiToExcel(filteredNilaiList)}
              className="flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
              title="Export Excel Laporan Nilai"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Individual Document Download Table Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {/* Category Tabs */}
          <div className="flex flex-wrap rounded-xl bg-slate-200/80 dark:bg-slate-900 p-1 gap-0.5">
            <button
              onClick={() => setActiveCategory('guru')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeCategory === 'guru' ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Agenda Guru ({safeGuruList.length})
            </button>
            <button
              onClick={() => setActiveCategory('kelas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeCategory === 'kelas' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Agenda Kelas ({safeKelasList.length})
            </button>
            <button
              onClick={() => setActiveCategory('presensi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${activeCategory === 'presensi' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'}`}
            >
              <UserX className="h-3.5 w-3.5" />
              <span>Siswa Tidak Hadir ({allAbsentStudents.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory('rekap_absensi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${activeCategory === 'rekap_absensi' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-rose-600'}`}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Rekap Presensi Bulanan (S, I, A)</span>
            </button>
            <button
              onClick={() => setActiveCategory('nilai')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${activeCategory === 'nilai' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-teal-600'}`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Laporan Nilai Guru ({safeNilaiList.length})</span>
            </button>
            <button
              onClick={() => setActiveCategory('supervisi')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeCategory === 'supervisi' ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Supervisi ({safeSupervisiList.length})
            </button>
          </div>

          {/* Filters Bar: Hari, Tanggal, Tahun, Kelas, Status & Search Box */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Hari */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <Calendar className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <select
                value={selectedHariFilter}
                onChange={(e) => setSelectedHariFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Hari</option>
                <option value="Senin">Senin</option>
                <option value="Selasa">Selasa</option>
                <option value="Rabu">Rabu</option>
                <option value="Kamis">Kamis</option>
                <option value="Jumat">Jumat</option>
                <option value="Sabtu">Sabtu</option>
                <option value="Minggu">Minggu</option>
              </select>
            </div>

            {/* Filter Tanggal Specific */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <span className="font-bold text-slate-400">Tgl:</span>
              <input
                type="date"
                value={selectedTanggalFilter}
                onChange={(e) => setSelectedTanggalFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer text-xs"
              />
              {selectedTanggalFilter && (
                <button onClick={() => setSelectedTanggalFilter('')} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
              )}
            </div>

            {/* Filter Tahun */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <span className="font-bold text-slate-400">Tahun:</span>
              <select
                value={selectedTahunFilter}
                onChange={(e) => setSelectedTahunFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Tahun</option>
                <option value="2026/2027">2026/2027</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2027/2028">2027/2028</option>
                <option value="2026">Tahun 2026</option>
                <option value="2025">Tahun 2025</option>
              </select>
            </div>

            {/* Filter Kelas */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedKelasFilter}
                onChange={(e) => setSelectedKelasFilter(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {availableKelasOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            {/* Filter Status (Only active if presensi) */}
            {activeCategory === 'presensi' && (
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                <span className="font-bold text-slate-400">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Ketidakhadiran</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Alpa">Alpa</option>
                  <option value="Terlambat">Terlambat</option>
                </select>
              </div>
            )}

            {/* Filter Guru, Mapel, Jenis Asesmen & Status (Only active if nilai) */}
            {activeCategory === 'nilai' && (
              <>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                  <span className="font-bold text-teal-600 dark:text-teal-400">Guru:</span>
                  <select
                    value={selectedGuruFilter}
                    onChange={(e) => setSelectedGuruFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
                  >
                    <option value="all">Semua Guru</option>
                    {(guruList || []).map(g => (
                      <option key={g.id} value={g.nama}>{g.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                  <span className="font-bold text-teal-600 dark:text-teal-400">Mapel:</span>
                  <select
                    value={selectedMapelFilter}
                    onChange={(e) => setSelectedMapelFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
                  >
                    <option value="all">Semua Mapel</option>
                    {(mapelList || []).map(m => (
                      <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                  <span className="font-bold text-slate-400">Asesmen:</span>
                  <select
                    value={selectedJenisAsesmenFilter}
                    onChange={(e) => setSelectedJenisAsesmenFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Jenis Asesmen</option>
                    <option value="Formatif (Tugas)">Formatif (Tugas)</option>
                    <option value="Praktik / Unjuk Kerja">Praktik / Unjuk Kerja</option>
                    <option value="Sumatif (UH)">Sumatif (UH)</option>
                    <option value="Portofolio">Portofolio</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                  <span className="font-bold text-slate-400">Status:</span>
                  <select
                    value={selectedStatusNilaiFilter}
                    onChange={(e) => setSelectedStatusNilaiFilter(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">Semua Status Ketuntasan</option>
                    <option value="Tuntas">Tuntas</option>
                    <option value="Remedial">Remedial</option>
                  </select>
                </div>
              </>
            )}

            {/* Search Box */}
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari guru, siswa, mapel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1 text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Rekap Absensi Bulanan View */}
        {activeCategory === 'rekap_absensi' && (
          <RekapAbsensiBulananView
            siswaList={siswaList}
            kelasList={kelasList}
            guruList={guruList}
            mapelList={mapelList}
            setting={setting}
            currentUser={currentUser}
          />
        )}

        {/* Table Agenda Guru */}
        {activeCategory === 'guru' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>Daftar Dokumen PDF Agenda Guru Mandiri (Lengkap Logo Sekolah)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Klik "Download PDF" untuk mengunduh dokumen per lembar.</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/70 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-900 dark:text-slate-100">
                  <tr>
                    <th className="p-3">No. Agenda / Tanggal</th>
                    <th className="p-3">Guru & NIP</th>
                    <th className="p-3">Mapel & Kelas</th>
                    <th className="p-3">Materi Pembelajaran</th>
                    <th className="p-3 text-center">Ttd / Bukti</th>
                    <th className="p-3 text-right">Aksi Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredGuruList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data agenda guru yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredGuruList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <span className="font-bold text-teal-700 dark:text-teal-400 block">{item.nomorAgenda}</span>
                          <span className="text-[11px] text-slate-500">{item.hari}, {item.tanggal}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {item.namaGuru}
                          <span className="block text-[10px] text-slate-400 font-normal">NIP: {item.nip}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.mapel}</span>
                          <span className="text-[10px] text-slate-500">Kelas {item.kelas} ({item.jumlahJP} JP)</span>
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-600 dark:text-slate-300">
                          {item.materi}
                        </td>
                        <td className="p-3 text-center">
                          {item.ttdGuru ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Signed
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Draft</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => generateAgendaGuruPDF(item, setting)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 shadow-xs transition"
                            title="Download PDF Resmi Agenda Guru"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table Agenda Kelas */}
        {activeCategory === 'kelas' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Daftar Dokumen PDF Agenda Jurnal Kelas (Lengkap Logo Sekolah)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Klik "Download PDF" untuk cetak lembar Jurnal Kelas.</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/70 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-900 dark:text-slate-100">
                  <tr>
                    <th className="p-3">Kelas & Tanggal</th>
                    <th className="p-3">Wali Kelas</th>
                    <th className="p-3">Rekap Presensi</th>
                    <th className="p-3">Kedisiplinan</th>
                    <th className="p-3 text-center">Status Validasi</th>
                    <th className="p-3 text-right">Aksi Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredKelasList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data agenda kelas yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredKelasList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <span className="font-bold text-indigo-700 dark:text-indigo-400 text-sm block">{item.kelas}</span>
                          <span className="text-[11px] text-slate-500">{item.hari}, {item.tanggal}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {item.waliKelas}
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.hadir}/{item.jumlahSiswa} Hadir ({item.persentase}%)</span>
                          <span className="text-[10px] text-slate-500">S:{item.sakit} | I:{item.izin} | A:{item.alpa}</span>
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {item.catatanWaliKelas.kedisiplinan || 'Tertib & Kondusif'}
                        </td>
                        <td className="p-3 text-center">
                          {item.validatedByWali ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Validated
                            </span>
                          ) : (
                            <span className="text-amber-600 font-semibold text-[10px]">Pending</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => generateAgendaKelasPDF(item, setting)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-xs transition"
                            title="Download PDF Resmi Agenda Kelas"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table Rekap Presensi & Daftar Siswa Tidak Hadir */}
        {activeCategory === 'presensi' && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 overflow-hidden shadow-xs space-y-0">
            {/* Header & Stats Cards */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <UserX className="h-4 w-4 text-amber-600" />
                  <span>Daftar Nama Siswa Tidak Hadir (Sakit, Izin, Alpa)</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Laporan rekapitulasi ketidakhadiran siswa otomatis terintegrasi dari Absensi Guru Mata Pelajaran & Agenda Kelas.
                </p>
              </div>

              {/* Stats Summary Pills */}
              <div className="flex items-center gap-2 shrink-0 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800">
                  Sakit: {countSakit}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-800">
                  Izin: {countIzin}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800">
                  Alpa: {countAlpa}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-900 dark:text-slate-100">
                  <tr>
                    <th className="p-3">Tanggal / Hari</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">NIS & Nama Siswa</th>
                    <th className="p-3 text-center">Status Kehadiran</th>
                    <th className="p-3">Alasan / Keterangan</th>
                    <th className="p-3">Mata Pelajaran / Sumber</th>
                    <th className="p-3">Guru / Wali Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAbsentStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data siswa tidak hadir yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAbsentStudents.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-white block">{item.tanggal}</span>
                          {item.hari && <span className="text-[10px] text-slate-500">{item.hari}</span>}
                        </td>
                        <td className="p-3 font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                          {item.kelas}
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          <div>{item.nama}</div>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">NIS: {item.nis}</span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {item.kategori === 'Sakit' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950 px-2.5 py-0.5 text-[10px] font-black text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                              🏥 Sakit
                            </span>
                          )}
                          {item.kategori === 'Izin' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 text-[10px] font-black text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                              ✉️ Izin
                            </span>
                          )}
                          {item.kategori === 'Alpa' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950 px-2.5 py-0.5 text-[10px] font-black text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              ⚠️ Alpa
                            </span>
                          )}
                          {item.kategori === 'Terlambat' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-950 px-2.5 py-0.5 text-[10px] font-black text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                              ⏰ Terlambat
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs">
                          {item.alasan}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold block">{item.mapelOrSumber}</span>
                          <span className="text-[10px] text-slate-400">{item.sumber}</span>
                        </td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                          {item.guruOrWali}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table Laporan Nilai Guru & Asesmen Siswa */}
        {activeCategory === 'nilai' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs space-y-0">
            {/* Header & Stats Cards */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-amber-600" />
                  <span>Daftar Dokumen PDF Laporan Nilai Guru & Asesmen Siswa (Kop Resmi)</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rekapitulasi penilaian asesmen formatif, praktik, dan nilai akhir siswa beserta status ketuntasan.
                </p>
              </div>

              {/* Stat Pills */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                <div className="px-3 py-1 rounded-xl bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                  <span>Rata-Rata Nilai:</span>
                  <span className="text-sm font-black">{avgNilaiAkhir}</span>
                </div>
                <div className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span>Tuntas:</span>
                  <span className="text-sm font-black">{totalTuntas} Siswa</span>
                </div>
                {totalRemedial > 0 && (
                  <div className="px-3 py-1 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                    <span>Remedial:</span>
                    <span className="text-sm font-black">{totalRemedial} Siswa</span>
                  </div>
                )}
                <button
                  onClick={() => generateRekapNilaiSiswaPDF(filteredNilaiList, setting, periode)}
                  className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs flex items-center gap-1.5 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Cetak PDF Rekap</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/70 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-900 dark:text-slate-100">
                  <tr>
                    <th className="p-3">Tanggal / Hari</th>
                    <th className="p-3">Guru & Mapel</th>
                    <th className="p-3">NIS & Siswa</th>
                    <th className="p-3">Kelas</th>
                    <th className="p-3">Asesmen & Materi</th>
                    <th className="p-3 text-center">Nilai Formatif</th>
                    <th className="p-3 text-center">Nilai Praktik</th>
                    <th className="p-3 text-center">Nilai Akhir</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredNilaiList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                        Tidak ada catatan nilai guru yang cocok dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredNilaiList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 whitespace-nowrap">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.tanggal}</span>
                          <span className="text-[10px] text-slate-500">{item.hari || '-'}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-teal-700 dark:text-teal-400 block">{item.guru}</span>
                          <span className="text-[10px] text-slate-500">{item.mapel}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 dark:text-white block">{item.namaSiswa}</span>
                          <span className="text-[10px] text-slate-400">NIS: {item.nis || '-'}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {item.kelas}
                          </span>
                        </td>
                        <td className="p-3 max-w-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.jenisAsesmen}</span>
                          <span className="text-[10px] text-slate-500 truncate block">{item.materiJudul}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {item.nilaiFormatif}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {item.nilaiPraktik}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-black text-amber-600 dark:text-amber-400 text-sm block">{item.nilaiAkhir}</span>
                          <span className="text-[9px] font-bold text-slate-400">({item.predikat})</span>
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {item.statusKelulusan === 'Tuntas' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Tuntas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 text-[10px] font-black text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                              <AlertCircle className="h-3 w-3 text-rose-600" /> Remedial
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => generateRekapNilaiSiswaPDF([item], setting, periode)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-xs transition"
                            title="Download PDF Laporan Nilai"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table Supervisi */}
        {activeCategory === 'supervisi' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <span>Daftar Dokumen PDF Supervisi Akademik Guru (Lengkap Logo Sekolah)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Klik "Download PDF" untuk cetak lembar evaluasi supervisi.</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100/70 dark:bg-slate-800/80 font-bold uppercase text-[10px] text-slate-900 dark:text-slate-100">
                  <tr>
                    <th className="p-3">No. Dokumen / Tanggal</th>
                    <th className="p-3">Guru & Mapel</th>
                    <th className="p-3">Supervisor</th>
                    <th className="p-3 text-center">Skor Akhir & Predikat</th>
                    <th className="p-3 text-right">Aksi Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredSupervisiList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 italic">
                        Tidak ada data supervisi yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredSupervisiList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <span className="font-bold text-purple-700 dark:text-purple-400 block">{item.nomorSupervisi}</span>
                          <span className="text-[11px] text-slate-500">{item.tanggal}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {item.namaGuru}
                          <span className="block text-[10px] text-slate-400 font-normal">{item.mapel} (Kelas {item.kelas})</span>
                        </td>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                          {item.supervisor}
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-black text-purple-600 dark:text-purple-400 block text-sm">{item.skorAkhir}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200">
                            {item.predikat}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => generateSupervisiPDF(item, setting)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 shadow-xs transition"
                            title="Download PDF Lembar Supervisi"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download PDF</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {previewModalOpen && previewOptions && (
        <PrintPreviewModal
          isOpen={previewModalOpen}
          onClose={() => setPreviewModalOpen(false)}
          options={previewOptions}
          setting={setting}
          onDownloadPdf={previewDownloadPdf}
          onExportExcel={previewExportExcel}
        />
      )}
    </div>
  );
};

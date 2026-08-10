import React, { useState, useMemo } from 'react';
import { Folder, FolderTree, Search, Check, ExternalLink, X, Link as LinkIcon, Sparkles, FolderPlus, CheckCircle2 } from 'lucide-react';
import { Storage, DriveFolderStructure } from '../lib/storage';

interface GoogleDriveFolderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFolder: (folderUrl: string, folderName?: string) => void;
  currentSelectedUrl?: string;
  title?: string;
}

export interface DriveFolderItem {
  id: string;
  name: string;
  category: 'Root' | 'Umum' | 'Jurusan' | 'Subfolder' | 'Kelas' | 'Custom';
  url: string;
  department?: string;
  description?: string;
}

export const GoogleDriveFolderPickerModal: React.FC<GoogleDriveFolderPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectFolder,
  currentSelectedUrl = '',
  title = 'Pilih Folder Google Drive'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'jurusan' | 'umum' | 'custom'>('all');
  const [customUrl, setCustomUrl] = useState('');
  const [customFolderName, setCustomFolderName] = useState('');
  const [selectedFolderUrl, setSelectedFolderUrl] = useState<string>(currentSelectedUrl);
  const [selectedFolderName, setSelectedFolderName] = useState<string>('');

  // Get current Drive Structure from Storage or generate default item list
  const driveStructure: DriveFolderStructure | null = useMemo(() => {
    return Storage.getDriveFolderStructure();
  }, [isOpen]);

  const setting = useMemo(() => Storage.getSetting(), []);

  // Build full list of available Google Drive folders
  const folderList: DriveFolderItem[] = useMemo(() => {
    const list: DriveFolderItem[] = [];

    const rootUrl = driveStructure?.rootFolder.webViewLink || 'https://drive.google.com/drive/folders/root_simagu_2026_2027';
    const rootName = driveStructure?.rootFolder.name || `00_SIMAGU_${setting.namaSekolah.replace(/\s+/g, '_')}_2026-2027`;

    // 1. Root & Academic Year
    list.push({
      id: 'root-folder',
      name: rootName,
      category: 'Root',
      url: rootUrl,
      description: 'Folder Induk Utama Penyimpanan SIMAGU'
    });

    // 2. General Subfolders
    const rekapUrl = driveStructure?.generalFolder.subfolders.rekapGabungan.webViewLink || `${rootUrl}/rekap_gabungan`;
    list.push({
      id: 'general-rekap',
      name: '01_REKAP_SIMAGU_GABUNGAN',
      category: 'Umum',
      url: rekapUrl,
      description: 'Rekapitulasi Laporan Gabungan Guru & Kelas'
    });

    const supervisiUrl = driveStructure?.generalFolder.subfolders.arsipSupervisi.webViewLink || `${rootUrl}/arsip_supervisi`;
    list.push({
      id: 'general-supervisi',
      name: '02_ARSIP_SUPERVISI_GURU',
      category: 'Umum',
      url: supervisiUrl,
      description: 'Berkas Dokumen Monitoring & Supervisi Kepala Sekolah'
    });

    const exportUrl = driveStructure?.generalFolder.subfolders.exportDatabase.webViewLink || `${rootUrl}/export_database`;
    list.push({
      id: 'general-export',
      name: '03_EKSPOR_DATABASE_EXCEL',
      category: 'Umum',
      url: exportUrl,
      description: 'Folder Ekspor Database Excel & Backup Sistem'
    });

    // 3. Departments & Subfolders
    const deptList = driveStructure?.departments || [
      {
        kodeJurusan: 'DKV',
        namaJurusan: 'Desain Komunikasi Visual',
        folderName: '01_JURUSAN_DESAIN_KOMUNIKASI_VISUAL_DKV',
        webViewLink: `${rootUrl}/jurusan_dkv`,
        subfolders: {
          agendaGuru: { name: '01_AGENDA_GURU_DKV', webViewLink: `${rootUrl}/agenda_guru_dkv` },
          agendaKelas: { name: '02_AGENDA_KELAS_DKV', webViewLink: `${rootUrl}/agenda_kelas_dkv` },
          supervisi: { name: '03_SUPERVISI_GURU_DKV', webViewLink: `${rootUrl}/supervisi_dkv` },
          materiModul: { name: '04_MATERI_DAN_MODUL_DKV', webViewLink: `${rootUrl}/materi_dkv` }
        }
      },
      {
        kodeJurusan: 'APHP',
        namaJurusan: 'Agribisnis Pengolahan Hasil Pertanian',
        folderName: '02_JURUSAN_AGRIBISNIS_PENGOLAHAN_HASIL_PERTANIAN_APHP',
        webViewLink: `${rootUrl}/jurusan_aphp`,
        subfolders: {
          agendaGuru: { name: '01_AGENDA_GURU_APHP', webViewLink: `${rootUrl}/agenda_guru_aphp` },
          agendaKelas: { name: '02_AGENDA_KELAS_APHP', webViewLink: `${rootUrl}/agenda_kelas_aphp` },
          supervisi: { name: '03_SUPERVISI_GURU_APHP', webViewLink: `${rootUrl}/supervisi_aphp` },
          materiModul: { name: '04_MATERI_DAN_MODUL_APHP', webViewLink: `${rootUrl}/materi_aphp` }
        }
      }
    ];

    deptList.forEach((dept) => {
      list.push({
        id: `dept-${dept.kodeJurusan}`,
        name: dept.folderName,
        category: 'Jurusan',
        department: dept.kodeJurusan,
        url: dept.webViewLink || `${rootUrl}/${dept.kodeJurusan.toLowerCase()}`,
        description: `Folder Induk Jurusan ${dept.kodeJurusan}`
      });

      if (dept.subfolders?.agendaGuru) {
        list.push({
          id: `sub-ag-${dept.kodeJurusan}`,
          name: dept.subfolders.agendaGuru.name,
          category: 'Subfolder',
          department: dept.kodeJurusan,
          url: dept.subfolders.agendaGuru.webViewLink || `${rootUrl}/agenda_guru_${dept.kodeJurusan.toLowerCase()}`,
          description: `Bukti & Foto Agenda Guru ${dept.kodeJurusan}`
        });
      }

      if (dept.subfolders?.agendaKelas) {
        list.push({
          id: `sub-ak-${dept.kodeJurusan}`,
          name: dept.subfolders.agendaKelas.name,
          category: 'Subfolder',
          department: dept.kodeJurusan,
          url: dept.subfolders.agendaKelas.webViewLink || `${rootUrl}/agenda_kelas_${dept.kodeJurusan.toLowerCase()}`,
          description: `Jurnal & Absensi Agenda Kelas ${dept.kodeJurusan}`
        });
      }

      if (dept.subfolders?.supervisi) {
        list.push({
          id: `sub-spv-${dept.kodeJurusan}`,
          name: dept.subfolders.supervisi.name,
          category: 'Subfolder',
          department: dept.kodeJurusan,
          url: dept.subfolders.supervisi.webViewLink || `${rootUrl}/supervisi_${dept.kodeJurusan.toLowerCase()}`,
          description: `Instrumen Supervisi Pembelajaran ${dept.kodeJurusan}`
        });
      }

      if (dept.subfolders?.materiModul) {
        list.push({
          id: `sub-mat-${dept.kodeJurusan}`,
          name: dept.subfolders.materiModul.name,
          category: 'Subfolder',
          department: dept.kodeJurusan,
          url: dept.subfolders.materiModul.webViewLink || `${rootUrl}/materi_${dept.kodeJurusan.toLowerCase()}`,
          description: `Bahan Ajar & Modul Pembelajaran ${dept.kodeJurusan}`
        });
      }
    });

    // 4. Kelas Folders
    const kelasList = Storage.getKelas();
    kelasList.forEach((k) => {
      list.push({
        id: `kelas-${k.id}`,
        name: `Folder Kelas ${k.namaKelas}`,
        category: 'Kelas',
        department: k.jurusan,
        url: `${rootUrl}/kelas_${k.namaKelas.replace(/\s+/g, '_')}`,
        description: `Penyimpanan Berkas Laporan ${k.namaKelas}`
      });
    });

    return list;
  }, [driveStructure, setting]);

  // Filtered List
  const filteredFolders = useMemo(() => {
    return folderList.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.department?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === 'jurusan') {
        return item.category === 'Jurusan' || item.category === 'Subfolder';
      }
      if (activeCategory === 'umum') {
        return item.category === 'Root' || item.category === 'Umum';
      }
      return true;
    });
  }, [folderList, searchQuery, activeCategory]);

  if (!isOpen) return null;

  const handleChooseFolder = (url: string, name: string) => {
    setSelectedFolderUrl(url);
    setSelectedFolderName(name);
    onSelectFolder(url, name);
    onClose();
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    const folderName = customFolderName.trim() || 'Folder Google Drive Kustom';
    handleChooseFolder(customUrl.trim(), folderName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-gradient-to-r from-slate-50 via-white to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-teal-950/20">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold shadow-2xs">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold">
                  TA {setting.tahunPelajaran}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Pilih folder Google Drive resmi SIMAGU atau masukkan tautan folder khusus.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama folder, jurusan, atau jenis dokumen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === 'all'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Semua Folder ({folderList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('jurusan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === 'jurusan'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Folder Jurusan (DKV & APHP)
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('umum')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === 'umum'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              Folder Umum / Induk
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeCategory === 'custom'
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <LinkIcon className="h-3 w-3 inline mr-1" />
              Tautan Kustom
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-2">
          {activeCategory === 'custom' ? (
            <form onSubmit={handleApplyCustomUrl} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-4">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold text-xs">
                <LinkIcon className="h-4 w-4" />
                <span>Masukkan Tautan / Link Folder Google Drive Sendiri</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Label Folder (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Folder Tugas Modul DKV"
                  value={customFolderName}
                  onChange={(e) => setCustomFolderName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  URL / Tautan Folder Google Drive *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!customUrl.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>Gunakan Tautan Kustom Ini</span>
                </button>
              </div>
            </form>
          ) : filteredFolders.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Folder className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Tidak ada folder Google Drive yang cocok dengan pencarian "{searchQuery}".</p>
            </div>
          ) : (
            filteredFolders.map((item) => {
              const isSelected = selectedFolderUrl === item.url || currentSelectedUrl === item.url;
              return (
                <div
                  key={item.id}
                  onClick={() => handleChooseFolder(item.url, item.name)}
                  className={`group p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 ring-1 ring-teal-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.category === 'Root'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                        : item.category === 'Jurusan'
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300'
                        : item.category === 'Subfolder'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                    }`}>
                      <Folder className="h-5 w-5" />
                    </div>

                    <div className="truncate space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400">
                          {item.name}
                        </span>
                        {item.department && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.department}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Buka Folder di Google Drive"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleChooseFolder(item.url, item.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 group-hover:bg-teal-600 group-hover:text-white'
                      }`}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                      <span>{isSelected ? 'Terpilih' : 'Pilih'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Folder Google Drive tersinkron otomatis dengan struktur resmi SIMAGU.</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            Batal
          </button>
        </div>

      </div>
    </div>
  );
};

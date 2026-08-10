import React, { useState } from 'react';
import { UserCheck, QrCode, Search, CheckCircle2, Clock, AlertTriangle, Users, ShieldAlert, Plus, Check, Printer, FileSpreadsheet, BookOpen, GraduationCap, RefreshCw } from 'lucide-react';
import { SiswaItem, KelasItem, User, GuruItem, MapelItem, JadwalItem } from '../../types';
import { Storage } from '../../lib/storage';
import { RekapAbsensiBulananView } from './RekapAbsensiBulananView';

interface AbsensiViewProps {
  siswaList: SiswaItem[];
  kelasList: KelasItem[];
  guruList?: GuruItem[];
  mapelList?: MapelItem[];
  jadwalList?: JadwalItem[];
  currentUser: User;
  onRefresh: () => void;
}

export const AbsensiView: React.FC<AbsensiViewProps> = ({
  siswaList,
  kelasList,
  guruList = [],
  mapelList = [],
  jadwalList = [],
  currentUser,
  onRefresh
}) => {
  const safeKelasList = kelasList || [];
  const safeSiswaList = siswaList || [];

  const [activeSubTab, setActiveSubTab] = useState<'harian' | 'rekap_bulanan'>('harian');
  const [selectedKelas, setSelectedKelas] = useState(safeKelasList[0]?.namaKelas || 'XI RPL 1');
  const [selectedMapel, setSelectedMapel] = useState(mapelList[0]?.namaMapel || 'Pemrograman Web & Perangkat Bergerak');
  const [selectedGuru, setSelectedGuru] = useState(currentUser?.nama || guruList[0]?.nama || 'Dede Mulyana, S.Kom., Gr.');
  const [selectedJamKe, setSelectedJamKe] = useState('1 - 4');

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrScanSuccess, setQrScanSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Student Attendance State
  const filteredSiswa = safeSiswaList.filter(s => {
    const matchKelas = s.kelas === selectedKelas;
    const matchQuery = !searchQuery || s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery);
    return matchKelas && matchQuery;
  });

  const [attendanceState, setAttendanceState] = useState<Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'>>({});
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize attendanceState from stored records for today when selectedKelas, selectedMapel, or selectedGuru changes
  React.useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const storedAbsensi = Storage.getAbsensiSiswa();
    
    // Match records for class, date, and mapel/guru
    const classRecords = storedAbsensi.filter(a => 
      a.kelas === selectedKelas && 
      a.tanggal === today && 
      (!selectedMapel || !a.mapel || a.mapel.toLowerCase() === selectedMapel.toLowerCase())
    );

    if (classRecords.length > 0) {
      const stateMap: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'> = {};
      classRecords.forEach(r => {
        if (r.id_siswa) {
          stateMap[r.id_siswa] = r.status;
        } else {
          const matchedSiswa = safeSiswaList.find(s => s.nis === r.nis && s.kelas === selectedKelas);
          if (matchedSiswa) {
            stateMap[matchedSiswa.id] = r.status;
          }
        }
      });
      setAttendanceState(stateMap);
    } else {
      setAttendanceState({});
    }
  }, [selectedKelas, selectedMapel, selectedGuru, safeSiswaList]);

  const handleSetStatus = (siswaId: string, status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat') => {
    setAttendanceState(prev => ({ ...prev, [siswaId]: status }));
  };

  const handleSetAllStatus = (status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat') => {
    const updatedState: Record<string, 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'> = { ...attendanceState };
    filteredSiswa.forEach(s => {
      updatedState[s.id] = status;
    });
    setAttendanceState(updatedState);
  };

  const handleSimpanAbsensiSiswa = async () => {
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const allSiswaInClass = safeSiswaList.filter(s => s.kelas === selectedKelas);
      const existingAll = Storage.getAbsensiSiswa();
      
      // Remove existing records for this class, date & mapel
      const otherRecords = existingAll.filter(r => !(
        r.kelas === selectedKelas && 
        r.tanggal === today && 
        (!r.mapel || r.mapel.toLowerCase() === selectedMapel.toLowerCase())
      ));

      // Create new records for all students in class
      const newRecords = allSiswaInClass.map(s => {
        const status = attendanceState[s.id] || 'Hadir';
        return {
          id: `abs-sis-${s.id}-${today}-${selectedMapel.replace(/[^a-zA-Z0-9]/g, '_')}`,
          tanggal: today,
          kelas: selectedKelas,
          nis: s.nis,
          namaSiswa: s.nama,
          status: status,
          dicatatOleh: currentUser.nama,
          mapel: selectedMapel,
          guru: selectedGuru,
          jamKe: selectedJamKe,
          id_siswa: s.id,
          id_kelas: selectedKelas
        };
      });

      const updatedAbsensiList = [...otherRecords, ...newRecords];
      Storage.saveAbsensiSiswa(updatedAbsensiList);

      Storage.logAudit('SAVE_ABSENSI_SISWA', `Menyimpan presensi siswa ${selectedMapel} kelas ${selectedKelas} (${allSiswaInClass.length} data)`);
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulasikanQrScan = () => {
    setQrScanSuccess(true);
    setTimeout(() => {
      setQrScanSuccess(false);
      setShowQrModal(false);
      if (filteredSiswa.length > 0) {
        setAttendanceState(prev => ({ ...prev, [filteredSiswa[0].id]: 'Hadir' }));
      }
    }, 1200);
  };

  // Summary counts
  const totalStudentsInClass = filteredSiswa.length;
  const hadirCount = filteredSiswa.filter(s => (attendanceState[s.id] || 'Hadir') === 'Hadir').length;
  const sakitCount = filteredSiswa.filter(s => attendanceState[s.id] === 'Sakit').length;
  const izinCount = filteredSiswa.filter(s => attendanceState[s.id] === 'Izin').length;
  const alpaCount = filteredSiswa.filter(s => attendanceState[s.id] === 'Alpa').length;
  const terlambatCount = filteredSiswa.filter(s => attendanceState[s.id] === 'Terlambat').length;

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('harian')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'harian'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Presensi Real-time Harian</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rekap_bulanan')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubTab === 'rekap_bulanan'
              ? 'bg-teal-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Printer className="h-4 w-4 text-teal-400" />
          <span>Cetak Rekap Absensi Bulanan (Per Siswa)</span>
          <span className="px-2 py-0.5 text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-extrabold rounded-full">
            Fitur Baru
          </span>
        </button>
      </div>

      {/* Render Rekap Absensi Bulanan View if selected */}
      {activeSubTab === 'rekap_bulanan' ? (
        <RekapAbsensiBulananView
          siswaList={safeSiswaList}
          kelasList={safeKelasList}
          guruList={guruList}
          mapelList={mapelList}
          currentUser={currentUser}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 p-6 text-white shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-teal-500/30 px-2.5 py-1 text-xs font-semibold text-teal-200 backdrop-blur-md">
                  Modul Presensi Siswa SIMAGU
                </span>
                <span className="text-xs text-teal-300">Kurikulum Merdeka SMKN Bojonggambir</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <UserCheck className="h-7 w-7 text-teal-300" />
                Presensi & Kehadiran Siswa Real-time
              </h1>
              <p className="text-xs text-teal-100 max-w-2xl leading-relaxed">
                Pencatatan kehadiran harian siswa per Rombel/Kelas terintegrasi langsung dengan Laporan Wali Kelas dan Rekapitulasi Pembelajaran Guru.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white shadow-lg backdrop-blur-md transition active:scale-95"
              >
                <QrCode className="h-4 w-4 text-teal-300" />
                <span>Scan Kartu QR Siswa</span>
              </button>
            </div>
          </div>

      {/* Success Notification */}
      {isSavedSuccess && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-medium">
            Presensi siswa kelas {selectedKelas} berhasil disimpan dan disinkronkan ke SIMAGU & Laporan Kehadiran!
          </p>
        </div>
      )}

      {/* Class Statistics Summary Badges */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">Hadir</p>
          <p className="mt-1 text-xl font-bold text-emerald-600">{hadirCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">Sakit</p>
          <p className="mt-1 text-xl font-bold text-amber-600">{sakitCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">Izin</p>
          <p className="mt-1 text-xl font-bold text-sky-600">{izinCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">Alpa / Tanpa Ket.</p>
          <p className="mt-1 text-xl font-bold text-rose-600">{alpaCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500">Terlambat</p>
          <p className="mt-1 text-xl font-bold text-orange-600">{terlambatCount} <span className="text-xs font-normal text-slate-400">Siswa</span></p>
        </div>
      </div>

      {/* Control Bar: Class, Mapel, Guru selector, quick actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users className="h-3 w-3 text-teal-600" />
              Pilih Rombel / Kelas
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {safeKelasList.map(k => (
                <option key={k.id} value={k.namaKelas}>{k.namaKelas} ({k.jurusan})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-teal-600" />
              Pilih Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {mapelList.length > 0 ? (
                mapelList.map(m => (
                  <option key={m.id} value={m.namaMapel}>{m.namaMapel}</option>
                ))
              ) : (
                <>
                  <option value="Pemrograman Web & Perangkat Bergerak">Pemrograman Web & Perangkat Bergerak</option>
                  <option value="Pemrograman Berbasis Teks, Grafis & Multimedia">Pemrograman Berbasis Teks, Grafis & Multimedia</option>
                  <option value="Basis Data & Cloud Infrastructure">Basis Data & Cloud Infrastructure</option>
                  <option value="Matematika Kejuruan">Matematika Kejuruan</option>
                  <option value="Bahasa Indonesia">Bahasa Indonesia</option>
                  <option value="Bahasa Inggris Kejuruan">Bahasa Inggris Kejuruan</option>
                  <option value="Project Kreatif & Kewirausahaan (PKK)">Project Kreatif & Kewirausahaan (PKK)</option>
                  <option value="Pendidikan Pancasila">Pendidikan Pancasila</option>
                  <option value="IPAS & K3LH">IPAS & K3LH</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-teal-600" />
              Guru Pengampu Mapel
            </label>
            <select
              value={selectedGuru}
              onChange={(e) => setSelectedGuru(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {guruList.length > 0 ? (
                guruList.map(g => (
                  <option key={g.id} value={g.nama}>{g.nama}</option>
                ))
              ) : (
                <option value={currentUser.nama}>{currentUser.nama}</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-teal-600" />
              Jam Ke / Sesi (Isi Manual)
            </label>
            <input
              type="text"
              value={selectedJamKe}
              onChange={(e) => setSelectedJamKe(e.target.value)}
              placeholder="Contoh: 1 - 4 atau 07.15 - 10.15"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => handleSetAllStatus('Hadir')}
              className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
            >
              Set All Hadir
            </button>

            <button
              onClick={handleSimpanAbsensiSiswa}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan Presensi {selectedMapel.length > 20 ? selectedMapel.slice(0, 20) + '...' : selectedMapel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Presensi Siswa */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              Daftar Presensi - Kelas {selectedKelas} ({totalStudentsInClass} Siswa)
            </h3>
            <p className="text-[11px] text-teal-700 dark:text-teal-400 font-medium mt-0.5 flex items-center gap-2">
              <span>Mapel: <strong>{selectedMapel}</strong></span>
              <span>•</span>
              <span>Guru: <strong>{selectedGuru}</strong></span>
              <span>•</span>
              <span>Jam Ke: <strong>{selectedJamKe}</strong></span>
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4 w-28">NIS</th>
                <th className="py-3 px-4">Nama Lengkap Siswa</th>
                <th className="py-3 px-4 w-24">L/P</th>
                <th className="py-3 px-4 w-96 text-center">Opsi Kehadiran (Klik Tombol)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Tidak ada siswa ditemukan di kelas {selectedKelas}.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((s, idx) => {
                  const currentStatus = attendanceState[s.id] || 'Hadir';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">{s.nis}</td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{s.nama}</td>
                      <td className="py-3 px-4 font-medium text-slate-500">{s.gender}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          {(['Hadir', 'Sakit', 'Izin', 'Alpa', 'Terlambat'] as const).map(st => (
                            <button
                              key={st}
                              onClick={() => handleSetStatus(s.id, st)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                currentStatus === st
                                  ? st === 'Hadir' ? 'bg-emerald-600 text-white shadow-xs'
                                  : st === 'Sakit' ? 'bg-amber-500 text-white shadow-xs'
                                  : st === 'Izin' ? 'bg-sky-500 text-white shadow-xs'
                                  : st === 'Alpa' ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-orange-500 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Pencatatan dilakukan oleh: <strong className="text-slate-700 dark:text-slate-300">{currentUser.nama}</strong> ({currentUser.role})
          </p>
          <button
            onClick={handleSimpanAbsensiSiswa}
            className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-teal-700 transition active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" />
            Simpan Presensi Siswa
          </button>
        </div>
      </div>

      {/* QR Code Scanner Simulation Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 text-center space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Scanner QR / Barcode Kartu Pelajar
            </h3>

            <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-xl bg-slate-900 border-2 border-dashed border-teal-500 overflow-hidden">
              {qrScanSuccess ? (
                <div className="text-emerald-400 font-bold space-y-2 animate-bounce">
                  <CheckCircle2 className="h-12 w-12 mx-auto" />
                  <p className="text-xs">QR Code Siswa Terdeteksi!</p>
                </div>
              ) : (
                <div className="space-y-2 text-slate-400">
                  <QrCode className="h-16 w-16 mx-auto text-teal-400 animate-pulse" />
                  <p className="text-[10px]">Arahkan Kamera ke Barcode Kartu Pelajar</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSimulasikanQrScan}
                className="flex-1 rounded-xl bg-teal-600 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-sm"
              >
                Simulasikan Scan Kartu
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};


import { Storage } from './storage';
import { SiswaItem, AbsensiSiswaRecord, AgendaGuruItem } from '../types';

export interface AttendanceSummaryResult {
  totalSiswa: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
  persentaseKehadiran: number;
  siswaTidakHadir: {
    nis: string;
    nama: string;
    kategori: 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat';
    alasan: string;
    jamDatang?: string;
    keterangan?: string;
  }[];
  isRecorded: boolean;
  recordedMapel?: string;
  recordedGuru?: string;
  totalRecordsFound: number;
}

/**
 * Helper to get attendance summary and absent student list
 * for a specific class, date, and optional subject.
 * Automatically synchronizes student attendance records with Agenda Guru and Agenda Kelas.
 */
export function getAttendanceSummary(
  kelas: string,
  tanggal: string,
  mapel?: string,
  customSiswaList?: SiswaItem[],
  customAbsensiList?: AbsensiSiswaRecord[]
): AttendanceSummaryResult {
  if (!kelas || !tanggal) {
    return {
      totalSiswa: 36,
      hadir: 36,
      sakit: 0,
      izin: 0,
      alpa: 0,
      terlambat: 0,
      persentaseKehadiran: 100,
      siswaTidakHadir: [],
      isRecorded: false,
      totalRecordsFound: 0
    };
  }

  const allSiswa = customSiswaList && customSiswaList.length > 0 
    ? customSiswaList 
    : Storage.getSiswa();

  const classStudents = allSiswa.filter(s => s.kelas === kelas && s.status !== 'Pindah');
  const totalSiswa = classStudents.length > 0 ? classStudents.length : 36;

  const allAbsensi = customAbsensiList && customAbsensiList.length > 0
    ? customAbsensiList
    : Storage.getAbsensiSiswa();

  // Find all attendance records matching class and date
  const classRecords = allAbsensi.filter(a => a.kelas === kelas && a.tanggal === tanggal);

  if (classRecords.length === 0) {
    // Also check if AgendaGuru already exists for this class & date as a secondary source
    const agendaGuruList = Storage.getAgendaGuru().filter(a => a.kelas === kelas && a.tanggal === tanggal);
    if (agendaGuruList.length > 0) {
      const ag = agendaGuruList[0];
      return {
        totalSiswa: ag.totalSiswa || totalSiswa,
        hadir: ag.hadir ?? totalSiswa,
        sakit: ag.sakit ?? 0,
        izin: ag.izin ?? 0,
        alpa: ag.alpa ?? 0,
        terlambat: ag.terlambat ?? 0,
        persentaseKehadiran: ag.persentaseKehadiran ?? 100,
        siswaTidakHadir: ag.siswaTidakHadir || [],
        isRecorded: true,
        recordedMapel: ag.mapel,
        recordedGuru: ag.namaGuru,
        totalRecordsFound: (ag.siswaTidakHadir || []).length
      };
    }

    return {
      totalSiswa,
      hadir: totalSiswa,
      sakit: 0,
      izin: 0,
      alpa: 0,
      terlambat: 0,
      persentaseKehadiran: 100,
      siswaTidakHadir: [],
      isRecorded: false,
      totalRecordsFound: 0
    };
  }

  // If mapel is specified, check if there are records matching that mapel
  let matchingRecords = classRecords;
  let detectedMapel: string | undefined = undefined;
  let detectedGuru: string | undefined = undefined;

  if (mapel) {
    const mapelLower = mapel.trim().toLowerCase();
    const recordsForMapel = classRecords.filter(r => r.mapel && r.mapel.trim().toLowerCase() === mapelLower);
    if (recordsForMapel.length > 0) {
      matchingRecords = recordsForMapel;
      detectedMapel = recordsForMapel[0]?.mapel;
      detectedGuru = recordsForMapel[0]?.guru || recordsForMapel[0]?.dicatatOleh;
    }
  }

  if (!detectedMapel && matchingRecords.length > 0) {
    detectedMapel = matchingRecords[0]?.mapel;
    detectedGuru = matchingRecords[0]?.guru || matchingRecords[0]?.dicatatOleh;
  }

  // Deduplicate records by student (NIS or id_siswa), keeping the most recent/relevant record
  const studentMap = new Map<string, AbsensiSiswaRecord>();
  matchingRecords.forEach(r => {
    const key = r.nis || r.id_siswa || r.namaSiswa;
    if (key) {
      studentMap.set(key, r);
    }
  });

  const uniqueRecords = Array.from(studentMap.values());

  const sakitRecs = uniqueRecords.filter(r => r.status === 'Sakit');
  const izinRecs = uniqueRecords.filter(r => r.status === 'Izin');
  const alpaRecs = uniqueRecords.filter(r => r.status === 'Alpa');
  const terlambatRecs = uniqueRecords.filter(r => r.status === 'Terlambat');
  const hadirRecs = uniqueRecords.filter(r => r.status === 'Hadir');

  const sakit = sakitRecs.length;
  const izin = izinRecs.length;
  const alpa = alpaRecs.length;
  const terlambat = terlambatRecs.length;
  
  // Calculate hadir: if hadir records exist, use count; otherwise total minus absent
  const nonHadirCount = sakit + izin + alpa;
  const calculatedTotal = Math.max(totalSiswa, uniqueRecords.length);
  const hadir = hadirRecs.length > 0 
    ? hadirRecs.length 
    : Math.max(0, calculatedTotal - nonHadirCount);

  const persentaseKehadiran = calculatedTotal > 0
    ? Number(((hadir / calculatedTotal) * 100).toFixed(2))
    : 100;

  const siswaTidakHadir = uniqueRecords
    .filter(r => r.status !== 'Hadir')
    .map(r => ({
      nis: r.nis,
      nama: r.namaSiswa,
      kategori: r.status as 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat',
      alasan: r.alasan || (r.status === 'Alpa' ? 'Tanpa Keterangan' : `Siswa ${r.status}`),
      jamDatang: r.jamDatang,
      keterangan: r.alasan || ''
    }));

  return {
    totalSiswa: calculatedTotal,
    hadir,
    sakit,
    izin,
    alpa,
    terlambat,
    persentaseKehadiran,
    siswaTidakHadir,
    isRecorded: true,
    recordedMapel: detectedMapel,
    recordedGuru: detectedGuru,
    totalRecordsFound: uniqueRecords.length
  };
}

/**
 * Helper to get learning monitoring items for Agenda Kelas from Agenda Guru entries
 */
export function getMonitoringPembelajaranFromAgendaGuru(kelas: string, tanggal: string) {
  const allAgendaGuru = Storage.getAgendaGuru();
  const matched = allAgendaGuru.filter(a => a.kelas === kelas && a.tanggal === tanggal);

  return matched.map(ag => ({
    jp: ag.jamKe || '1 - 4',
    mapel: ag.mapel || 'Mata Pelajaran',
    guru: ag.namaGuru || 'Guru Pengampu',
    materi: ag.materi || 'Materi Pembelajaran',
    tugas: ag.tugas || 'Tidak ada tugas khusus',
    status: 'Terlaksana' as const
  }));
}

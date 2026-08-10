import * as XLSX from 'xlsx';
import { AgendaGuruItem, AgendaKelasItem, GuruItem, SiswaItem, SupervisiRecord, NilaiSiswaRecord, SchoolSetting, RekapAbsensiBulananSiswaItem } from '../types';

export function exportRekapAbsensiBulananToExcel(
  items: RekapAbsensiBulananSiswaItem[],
  options: { bulan: string; tahun: string; kelas: string; guruName?: string; mapelName?: string }
) {
  const data = items.map((item, idx) => ({
    'No': idx + 1,
    'NIS': item.nis,
    'Nama Siswa': item.nama,
    'Jenis Kelamin': item.gender,
    'Kelas': item.kelas,
    'Mata Pelajaran': options.mapelName || item.mapelName || 'Semua Mata Pelajaran',
    'Guru / Pengampu': item.guruName || '-',
    'Bulan': options.bulan,
    'Tahun': options.tahun,
    'Hadir (H)': item.hadir,
    'Sakit (S)': item.sakit,
    'Izin (I)': item.izin,
    'Alpa (A)': item.alpa,
    'Terlambat (T)': item.terlambat,
    'Total Tidak Hadir': item.totalAbsen,
    'Persentase Kehadiran': `${item.persentase}%`
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap_Absensi_Bulanan');
  XLSX.writeFile(
    workbook,
    `SIMAGU_REKAP_ABSENSI_BULANAN_${options.kelas.replace(/\s+/g, '_')}_${options.bulan}_${options.tahun}.xlsx`
  );
}

export function exportNilaiToExcel(nilaiList: NilaiSiswaRecord[]) {
  const data = nilaiList.map((n, idx) => ({
    'No': idx + 1,
    'Tanggal': n.tanggal,
    'Hari': n.hari || '-',
    'NIS': n.nis || '-',
    'Nama Siswa': n.namaSiswa,
    'Kelas': n.kelas,
    'Mata Pelajaran': n.mapel,
    'Guru Pengajar': n.guru,
    'Jenis Asesmen': n.jenisAsesmen,
    'Judul Materi / Tugas': n.materiJudul || '-',
    'Nilai Formatif': n.nilaiFormatif,
    'Nilai Praktik': n.nilaiPraktik,
    'Nilai Akhir': n.nilaiAkhir,
    'Predikat': n.predikat,
    'Status Ketuntasan': n.statusKelulusan,
    'Catatan Guru': n.catatanGuru || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Input_Nilai_Siswa');
  XLSX.writeFile(workbook, `SIMAGU_REKAP_NILAI_GURU_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportAgendaGuruToExcel(agendas: AgendaGuruItem[]) {
  const data = agendas.map((a, idx) => ({
    'No': idx + 1,
    'No. Agenda': a.nomorAgenda,
    'Tahun Pelajaran': a.tahunPelajaran,
    'Semester': a.semester,
    'Hari': a.hari,
    'Tanggal': a.tanggal,
    'Nama Guru': a.namaGuru,
    'NIP': a.nip,
    'Mata Pelajaran': a.mapel,
    'Fase': a.fase,
    'Kelas': a.kelas,
    'Jam Ke': a.jamKe,
    'Jumlah JP': a.jumlahJP,
    'Materi': a.materi,
    'Model Pembelajaran': a.modelPembelajaran,
    'Status Pembelajaran': a.statusPembelajaran,
    'Total Siswa': a.totalSiswa,
    'Hadir': a.hadir,
    'Sakit': a.sakit,
    'Izin': a.izin,
    'Alpa': a.alpa,
    'Terlambat': a.terlambat,
    '% Kehadiran': `${a.persentaseKehadiran}%`,
    'Kendala': a.kendala || '-',
    'Solusi': a.solusi || '-',
    'Status Validasi': a.statusValidasi
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Agenda_Guru');
  XLSX.writeFile(workbook, `SIMAGU_REKAP_AGENDA_GURU_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportAgendaKelasToExcel(agendas: AgendaKelasItem[]) {
  const data = agendas.map((a, idx) => ({
    'No': idx + 1,
    'No. Agenda': a.nomorAgenda,
    'Tahun Pelajaran': a.tahunPelajaran,
    'Semester': a.semester,
    'Hari': a.hari,
    'Tanggal': a.tanggal,
    'Kelas': a.kelas,
    'Jurusan': a.jurusan,
    'Wali Kelas': a.waliKelas,
    'Ketua Kelas': a.ketuaKelas,
    'Total Siswa': a.jumlahSiswa,
    'Hadir': a.hadir,
    'Sakit': a.sakit,
    'Izin': a.izin,
    'Alpa': a.alpa,
    'Terlambat': a.terlambat,
    '% Kehadiran': `${a.persentase}%`,
    'Kondisi Umum Kelas': a.catatanWaliKelas?.kondisiUmum || '-',
    'Kedisiplinan': a.catatanWaliKelas?.kedisiplinan || '-',
    'Siswa Bermasalah': a.catatanWaliKelas?.siswaBermasalah || '-',
    'Siswa Berprestasi': a.catatanWaliKelas?.siswaBerprestasi || '-',
    'Status Validasi Wali': a.validatedByWali ? 'Valid' : 'Pending'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Agenda_Kelas');
  XLSX.writeFile(workbook, `SIMAGU_REKAP_AGENDA_KELAS_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportSupervisiToExcel(supervisiList: SupervisiRecord[]) {
  const data = supervisiList.map((s, idx) => ({
    'No': idx + 1,
    'No. Supervisi': s.nomorSupervisi,
    'Tanggal': s.tanggal,
    'Nama Guru': s.namaGuru,
    'NIP': s.nip,
    'Mata Pelajaran': s.mapel,
    'Kelas': s.kelas,
    'Supervisor': s.supervisor,
    'Skor Perencanaan': s.skorPerencanaan,
    'Skor Pelaksanaan': s.skorPelaksanaan,
    'Skor Evaluasi': s.skorEvaluasi,
    'Skor Akhir': s.skorAkhir,
    'Predikat': s.predikat,
    'Status': s.status,
    'Catatan Supervisor': s.catatanSupervisor || '-',
    'Rekomendasi': s.rekomendasi || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Monitoring_Supervisi');
  XLSX.writeFile(workbook, `SIMAGU_MONITORING_SUPERVISI_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportGuruToExcel(guruList: GuruItem[]) {
  const worksheet = XLSX.utils.json_to_sheet(guruList);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Guru');
  XLSX.writeFile(workbook, `SIMAGU_DATA_GURU.xlsx`);
}

export function exportSiswaToExcel(siswaList: SiswaItem[]) {
  const worksheet = XLSX.utils.json_to_sheet(siswaList);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa');
  XLSX.writeFile(workbook, `SIMAGU_DATA_SISWA.xlsx`);
}

export interface ExportAllDataOptions {
  agendaGuruList: AgendaGuruItem[];
  agendaKelasList: AgendaKelasItem[];
  supervisiList?: SupervisiRecord[];
  nilaiList?: NilaiSiswaRecord[];
  setting?: SchoolSetting;
  periode?: string;
}

export function exportAllLaporanToExcel({
  agendaGuruList = [],
  agendaKelasList = [],
  supervisiList = [],
  nilaiList = [],
  setting,
  periode = 'Lengkap'
}: ExportAllDataOptions) {
  const workbook = XLSX.utils.book_new();

  // 1. Sheet Ringkasan Laporan
  const totalGuruAgenda = agendaGuruList.length;
  const totalKelasAgenda = agendaKelasList.length;
  const totalSupervisi = supervisiList.length;
  const totalNilaiInput = nilaiList.length;

  const totalJp = agendaGuruList.reduce((acc, curr) => acc + (curr.jumlahJP || 0), 0);
  const avgKehadiranGuruAgenda = totalGuruAgenda > 0
    ? (agendaGuruList.reduce((acc, curr) => acc + (curr.persentaseKehadiran || 0), 0) / totalGuruAgenda).toFixed(1)
    : '0';

  const summaryData = [
    { 'Kategori': 'Nama Sekolah', 'Nilai': setting?.namaSekolah || 'SMK NEGERI BOJONGGAMBIR' },
    { 'Kategori': 'NPSN', 'Nilai': setting?.npsn || '69978713' },
    { 'Kategori': 'Tanggal Export', 'Nilai': new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
    { 'Kategori': 'Periode Laporan', 'Nilai': periode.toUpperCase() },
    { 'Kategori': 'Total Jurnal Agenda Guru', 'Nilai': totalGuruAgenda },
    { 'Kategori': 'Total Akumulasi JP Mengajar', 'Nilai': `${totalJp} JP` },
    { 'Kategori': 'Rata-rata Kehadiran Siswa (Agenda Guru)', 'Nilai': `${avgKehadiranGuruAgenda}%` },
    { 'Kategori': 'Total Jurnal Agenda Kelas', 'Nilai': totalKelasAgenda },
    { 'Kategori': 'Total Monitoring & Supervisi', 'Nilai': totalSupervisi },
    { 'Kategori': 'Kepala Sekolah', 'Nilai': setting?.kepalaSekolah || 'Drs. Aa Mansur, M.Pd.' },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan_Laporan');

  // 2. Sheet Agenda Guru
  if (agendaGuruList.length > 0) {
    const dataGuru = agendaGuruList.map((a, idx) => ({
      'No': idx + 1,
      'No. Agenda': a.nomorAgenda,
      'Hari': a.hari,
      'Tanggal': a.tanggal,
      'Nama Guru': a.namaGuru,
      'NIP': a.nip,
      'Mata Pelajaran': a.mapel,
      'Kelas': a.kelas,
      'Jam Ke': a.jamKe,
      'Jumlah JP': a.jumlahJP,
      'Materi': a.materi,
      'Model Pembelajaran': a.modelPembelajaran,
      'Status Pembelajaran': a.statusPembelajaran,
      'Hadir': a.hadir,
      'Sakit': a.sakit,
      'Izin': a.izin,
      'Alpa': a.alpa,
      '% Kehadiran': `${a.persentaseKehadiran}%`,
      'Kendala': a.kendala || '-',
      'Solusi': a.solusi || '-',
      'Status Validasi': a.statusValidasi
    }));
    const guruSheet = XLSX.utils.json_to_sheet(dataGuru);
    XLSX.utils.book_append_sheet(workbook, guruSheet, 'Agenda_Guru');
  }

  // 3. Sheet Agenda Kelas
  if (agendaKelasList.length > 0) {
    const dataKelas = agendaKelasList.map((a, idx) => ({
      'No': idx + 1,
      'No. Agenda': a.nomorAgenda,
      'Hari': a.hari,
      'Tanggal': a.tanggal,
      'Kelas': a.kelas,
      'Wali Kelas': a.waliKelas,
      'Ketua Kelas': a.ketuaKelas,
      'Total Siswa': a.jumlahSiswa,
      'Hadir': a.hadir,
      'Sakit': a.sakit,
      'Izin': a.izin,
      'Alpa': a.alpa,
      '% Kehadiran': `${a.persentase}%`,
      'Kondisi Umum': a.catatanWaliKelas?.kondisiUmum || '-',
      'Kedisiplinan': a.catatanWaliKelas?.kedisiplinan || '-',
      'Validasi Wali Kelas': a.validatedByWali ? 'Sudah Validasi' : 'Belum'
    }));
    const kelasSheet = XLSX.utils.json_to_sheet(dataKelas);
    XLSX.utils.book_append_sheet(workbook, kelasSheet, 'Agenda_Kelas');
  }

  // 4. Sheet Monitoring Supervisi
  if (supervisiList.length > 0) {
    const dataSupervisi = supervisiList.map((s, idx) => ({
      'No': idx + 1,
      'No. Supervisi': s.nomorSupervisi,
      'Tanggal': s.tanggal,
      'Nama Guru': s.namaGuru,
      'NIP': s.nip,
      'Mata Pelajaran': s.mapel,
      'Kelas': s.kelas,
      'Supervisor': s.supervisor,
      'Skor Akhir': s.skorAkhir,
      'Predikat': s.predikat,
      'Status': s.status,
      'Rekomendasi': s.rekomendasi || '-'
    }));
    const supervisiSheet = XLSX.utils.json_to_sheet(dataSupervisi);
    XLSX.utils.book_append_sheet(workbook, supervisiSheet, 'Monitoring_Supervisi');
  }

  // 5. Sheet Detail Ketidakhadiran Siswa
  const absentStudents: any[] = [];
  agendaGuruList.forEach(ag => {
    if (ag.siswaTidakHadir && ag.siswaTidakHadir.length > 0) {
      ag.siswaTidakHadir.forEach(s => {
        absentStudents.push({
          'Sumber': 'Agenda Guru',
          'Tanggal': ag.tanggal,
          'Kelas': ag.kelas,
          'Mata Pelajaran': ag.mapel,
          'Guru': ag.namaGuru,
          'NIS': s.nis || '-',
          'Nama Siswa': s.nama,
          'Status': s.kategori,
          'Alasan / Keterangan': s.alasan || s.keterangan || '-'
        });
      });
    }
  });

  agendaKelasList.forEach(ak => {
    if (ak.siswaTidakHadir && ak.siswaTidakHadir.length > 0) {
      ak.siswaTidakHadir.forEach(s => {
        absentStudents.push({
          'Sumber': 'Agenda Kelas',
          'Tanggal': ak.tanggal,
          'Kelas': ak.kelas,
          'Mata Pelajaran': '-',
          'Guru': ak.waliKelas,
          'NIS': s.nis || '-',
          'Nama Siswa': s.nama,
          'Status': s.kategori,
          'Alasan / Keterangan': s.alasan || '-'
        });
      });
    }
  });

  if (absentStudents.length > 0) {
    const absentSheet = XLSX.utils.json_to_sheet(absentStudents);
    XLSX.utils.book_append_sheet(workbook, absentSheet, 'Rekap_Ketidakhadiran_Siswa');
  }

  // 6. Sheet Laporan Nilai Guru & Siswa
  if (nilaiList.length > 0) {
    const dataNilai = nilaiList.map((n, idx) => ({
      'No': idx + 1,
      'Tanggal': n.tanggal,
      'Hari': n.hari || '-',
      'NIS': n.nis || '-',
      'Nama Siswa': n.namaSiswa,
      'Kelas': n.kelas,
      'Mata Pelajaran': n.mapel,
      'Guru Pengajar': n.guru,
      'Jenis Asesmen': n.jenisAsesmen,
      'Materi / Judul': n.materiJudul || '-',
      'Nilai Formatif': n.nilaiFormatif,
      'Nilai Praktik': n.nilaiPraktik,
      'Nilai Akhir': n.nilaiAkhir,
      'Predikat': n.predikat,
      'Status Ketuntasan': n.statusKelulusan,
      'Catatan Guru': n.catatanGuru || '-'
    }));
    const nilaiSheet = XLSX.utils.json_to_sheet(dataNilai);
    XLSX.utils.book_append_sheet(workbook, nilaiSheet, 'Laporan_Nilai_Siswa');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `SIMAGU_SEKOLAH_LAPORAN_LENGKAP_${periode.toUpperCase()}_${dateStr}.xlsx`);
}

export function parseExcelFile<T>(file: File, callback: (data: T[]) => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const bstr = e.target?.result;
    const workbook = XLSX.read(bstr, { type: 'binary' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const json = XLSX.utils.sheet_to_json<T>(worksheet);
    callback(json);
  };
  reader.readAsBinaryString(file);
}

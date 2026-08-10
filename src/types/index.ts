export type UserRole = 
  | 'Administrator'
  | 'Kepala Sekolah'
  | 'Wakasek Kurikulum'
  | 'Wakasek Kesiswaan'
  | 'Guru'
  | 'Wali Kelas'
  | 'Guru BK';

export interface User {
  id: string;
  username: string;
  nama: string;
  nip?: string;
  role: UserRole;
  email: string;
  avatar?: string;
  kelasWali?: string; // e.g. "XI RPL 1"
}

export interface SchoolSetting {
  namaSekolah: string;
  npsn: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  kepalaSekolah: string;
  nipKepalaSekolah: string;
  wakasekKurikulum: string;
  nipWakasekKurikulum: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  logoUrl: string;
  googleSheetUrl?: string;
  appsScriptUrl?: string;
  waNotificationActive: boolean;
}

export interface GuruItem {
  id: string;
  nip: string;
  nuptk?: string;
  kodeGuru?: string;
  nama: string;
  gender: 'L' | 'P';
  email: string;
  telepon: string;
  jabatan: string;
  mapelUtama: string;
  status: 'PNS' | 'PPPK' | 'GTT' | 'Honor';
}

export interface SiswaItem {
  id: string;
  nis: string;
  nisn: string;
  nama: string;
  gender: 'L' | 'P';
  kelas: string;
  jurusan: string;
  teleponOrtu: string;
  namaOrtu: string;
  alamat: string;
  status: 'Aktif' | 'Alumni' | 'Pindah';
}

export interface KelasItem {
  id: string;
  namaKelas: string; // e.g. XI RPL 1
  tingkat: 'X' | 'XI' | 'XII';
  jurusan: string;
  waliKelas: string;
  ketuaKelas: string;
  wakilKetua: string;
  jumlahLaki: number;
  jumlahPerempuan: number;
  ruang: string;
}

export interface JurusanItem {
  id: string;
  kode: string; // e.g. RPL
  namaJurusan: string; // Rekayasa Perangkat Lunak
  kepalaKonsentrasi: string;
}

export interface MapelItem {
  id: string;
  kode: string;
  namaMapel: string;
  fase: 'E' | 'F';
  jurusan?: string;
  kelompok: 'Umum' | 'Kejuruan' | 'Pilihan';
}

export interface JadwalItem {
  id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jp: string; // e.g. "1-2"
  waktu: string; // e.g. "07.15 - 08.45"
  kelas: string;
  mapel: string;
  guru: string;
  ruang: string;
  status: 'Aktif' | 'Izin' | 'Kosong' | 'Pengganti';
  kodeGuru?: string;
  // Relational Foreign Keys
  id_guru?: string;
  id_mapel?: string;
  id_kelas?: string;
  id_ruang?: string;
}

// Agenda Harian Guru Format A-J
export interface AgendaGuruItem {
  id: string;
  nomorAgenda: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  hari: string;
  tanggal: string;
  namaGuru: string;
  nip: string;
  jabatan: string;
  mapel: string;
  konsentrasiKeahlian: string;
  fase: 'E' | 'F';
  kelas: string;
  rombel: string;
  ruang: string;
  jamKe: string;
  waktu: string;
  jumlahJP: number;
  statusPertemuan: 'Sesuai Jadwal' | 'Izin Disi Tugas' | 'Inal / Jam Pengganti' | 'Daring';
  modaPembelajaran: 'Luring' | 'Daring' | 'Blended Learning';

  // Relational Foreign Keys
  id_jadwal?: string;
  id_guru?: string;
  id_mapel?: string;
  id_kelas?: string;
  id_ruang?: string;
  id_materi?: string;
  id_tugas?: string;

  // Pembelajaran
  elemen: string;
  cp: string; // Capaian Pembelajaran
  atp: string; // Alur Tujuan Pembelajaran
  tujuanPembelajaran: string;
  materi: string;
  modelPembelajaran: string;
  metode: string;
  pendekatan: string;
  media: string;
  sumberBelajar: string;
  lkpd: string;
  platformDigital: string;
  asesmen: string;
  tugas: string;
  deadlineTugas?: string;
  statusPembelajaran: 'Selesai' | 'Dalam Proses' | 'Terkendala' | 'Reschedule';

  // Kehadiran Siswa
  totalSiswa: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
  persentaseKehadiran: number;

  // List Siswa Tidak Hadir
  siswaTidakHadir: {
    nis: string;
    nama: string;
    kategori: 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat';
    jamDatang?: string;
    alasan: string;
    keterangan?: string;
  }[];

  // Penilaian
  penilaian?: {
    jenisAsesmen: 'Diagnostik' | 'Formatif' | 'Sumatif' | 'Praktik' | 'Portofolio' | 'Produk';
    rataRataNilai: number;
    keterangan: string;
  }[];

  // Kegiatan Tambahan
  kegiatanTambahan: string[]; // ['Rapat', 'Piket', 'BK', etc.]

  // Catatan Guru
  kendala: string;
  solusi: string;
  siswaPendampingan: string;
  sarana: string;
  refleksi: string;
  tindakLanjut: string;
  komunikasiOrtu: string;

  // Dokumentasi
  fotoUrls: string[];
  videoUrl?: string;
  dokumenUrl?: string;
  driveFolderLink?: string;

  // Validasi
  ttdGuru?: string;
  ttdWakasek?: string;
  tanggalValidasi?: string;
  statusValidasi: 'Pending' | 'Disetujui' | 'Revisi';
  catatanWakasek?: string;
}

// Agenda Kelas Format A-L
export interface AgendaKelasItem {
  id: string;
  nomorAgenda: string;
  tahunPelajaran: string;
  semester: 'Ganjil' | 'Genap';
  hari: string;
  tanggal: string;
  kelas: string;
  jurusan: string;
  konsentrasiKeahlian: string;
  waliKelas: string;
  ketuaKelas: string;
  wakilKetua: string;
  jumlahSiswa: number;
  jumlahLaki: number;
  jumlahPerempuan: number;

  // Rekap Kehadiran
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
  persentase: number;

  siswaTidakHadir: {
    nis: string;
    nama: string;
    kategori: 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat';
    jamDatang?: string;
    alasan: string;
  }[];

  // Monitoring Pembelajaran per JP
  monitoringPembelajaran: {
    jp: string;
    mapel: string;
    guru: string;
    materi: string;
    tugas: string;
    status: 'Terlaksana' | 'Kosong' | 'Inal/Tugas' | 'Izin';
  }[];

  // Agenda Harian Routine
  agendaRoutine: {
    waktu: string;
    kegiatan: string;
    status: 'Terlaksana' | 'Tidak Terlaksana' | 'Sebagian';
    catatan?: string;
  }[];

  // Disiplin
  pelanggaranList: {
    id: string;
    namaSiswa: string;
    pelanggaran: string;
    kategori: 'Ringan' | 'Sedang' | 'Berat';
    poin: number;
    guruPelapor: string;
    tindakan: string;
    tindakLanjut: string;
  }[];

  // Prestasi
  prestasiList: {
    id: string;
    namaSiswa: string;
    bidang: string;
    tingkat: 'Sekolah' | 'Kabupaten' | 'Provinsi' | 'Nasional' | 'Internasional';
    juara: string;
    tanggal: string;
    keterangan: string;
  }[];

  // Kesehatan
  kesehatanList: {
    id: string;
    namaSiswa: string;
    kondisi: string;
    tindakan: string;
    petugas: string;
  }[];

  // Inventaris Kelas
  inventarisList: {
    barang: string;
    jumlah: number;
    baik: number;
    rusakRingan: number;
    rusakBerat: number;
    keterangan: string;
  }[];

  // Komunikasi Ortu
  komunikasiOrtuList: {
    tanggal: string;
    namaOrtuSiswa: string;
    media: 'WhatsApp' | 'Telepon' | 'Tatap Muka' | 'Surat';
    keperluan: string;
    hasil: string;
    petugas: string;
  }[];

  // Catatan Wali Kelas
  catatanWaliKelas: {
    kondisiUmum: string;
    kedisiplinan: string;
    budayaPositif: string;
    kebersihan: string;
    keamanan: string;
    siswaBermasalah: string;
    siswaBerprestasi: string;
    tindakLanjut: string;
  };

  validatedByWali: boolean;
  tanggalValidasiWali?: string;
  fotoUrls?: string[];
  dokumenUrl?: string;
  driveFolderLink?: string;
  ttdKetuaKelas?: string;
  ttdWaliKelas?: string;

  // Relational Foreign Keys
  id_kelas?: string;
  id_guru_wali?: string;
  id_ruang?: string;
}

export interface AbsensiGuruRecord {
  id: string;
  tanggal: string;
  nip: string;
  namaGuru: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Tugas Luar' | 'Alpa';
  jamMasuk?: string;
  jamKeluar?: string;
  keterangan?: string;
  lokasiGps?: string;
  fotoSelfieUrl?: string;
  ttdGuru?: string;

  // Relational Foreign Keys
  id_guru?: string;
  id_jadwal?: string;
}

export interface AbsensiSiswaRecord {
  id: string;
  tanggal: string;
  kelas: string;
  nis: string;
  namaSiswa: string;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat';
  jamDatang?: string;
  alasan?: string;
  dicatatOleh: string;
  mapel?: string;
  guru?: string;
  jamKe?: string;

  // Relational Foreign Keys
  id_siswa?: string;
  id_kelas?: string;
  id_jadwal?: string;
  id_absensi?: string;
}

export interface RekapAbsensiBulananSiswaItem {
  nis: string;
  nama: string;
  gender: 'L' | 'P';
  kelas: string;
  guruName?: string;
  mapelName?: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
  totalAbsen: number; // sakit + izin + alpa
  totalPertemuan: number;
  persentase: number;
}

export interface MateriRecord {
  id: string;
  nomorMateri?: string;
  hari: string;
  tanggal: string;
  mapel: string;
  fase: 'E' | 'F';
  kelas: string;
  guru: string;
  elemen: string;
  cp: string;
  atp: string;
  tujuanPembelajaran: string;
  judulMateri: string;
  ringkasanMateri: string;
  fileUrl?: string;
  lkpdUrl?: string;
  driveLink?: string;
  status: 'Terpublikasi' | 'Draf';
  
  // Foreign Keys
  id_jadwal?: string;
  id_guru?: string;
  id_kelas?: string;
  id_mapel?: string;
}

export interface TugasRecord {
  id: string;
  nomorTugas?: string;
  id_materi?: string;
  hari: string;
  tanggal: string;
  mapel: string;
  kelas: string;
  guru: string;
  judulTugas: string;
  instruksi: string;
  deadline: string;
  jenisTugas: 'Individu' | 'Kelompok' | 'Praktik Studio / Lab' | 'Proyek PjBL';
  totalSiswa: number;
  totalMengumpulkan: number;
  fileLampiranUrl?: string;
  driveFolderTask?: string;
  
  // Foreign Keys
  id_jadwal?: string;
  id_guru?: string;
  id_kelas?: string;
  id_mapel?: string;
}

export interface NilaiSiswaRecord {
  id: string;
  tanggal: string;
  hari: string;
  kelas: string;
  nis: string;
  namaSiswa: string;
  mapel: string;
  guru: string;
  jenisAsesmen: 'Formatif (Tugas)' | 'Praktik / Unjuk Kerja' | 'Sumatif (UH)' | 'Portofolio';
  materiJudul: string;
  nilaiFormatif: number;
  nilaiPraktik: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  statusKelulusan: 'Tuntas' | 'Remedial';
  catatanGuru?: string;

  // Foreign Keys
  id_siswa?: string;
  id_kelas?: string;
  id_jadwal?: string;
  id_mapel?: string;
  id_guru?: string;
  id_tugas?: string;
}

export interface SupervisiRecord {
  id: string;
  nomorSupervisi: string;
  tanggal: string;
  namaGuru: string;
  nip: string;
  supervisor: string;
  mapel: string;
  kelas: string;
  skorPerencanaan: number; // 0-100
  skorPelaksanaan: number; // 0-100
  skorEvaluasi: number; // 0-100
  skorAkhir: number; // average
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';
  catatanSupervisor: string;
  rekomendasi: string;
  status: 'Selesai' | 'Jadwal';
  fotoUrls?: string[];
  dokumenUrl?: string;
  driveFolderLink?: string;
  ttdSupervisor?: string;
  ttdGuru?: string;

  // Relational Foreign Keys
  id_guru?: string;
  id_jadwal?: string;
  id_kelas?: string;
  id_mapel?: string;
  id_monitoring?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  timestamp: string;
  read: boolean;
  targetRole?: UserRole;
  actionTab?: string;
  category?: 'quick_action' | 'jadwal' | 'system';
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  ipAddress?: string;
}

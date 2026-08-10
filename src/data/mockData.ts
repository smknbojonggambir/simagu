import { 
  SchoolSetting, 
  GuruItem, 
  SiswaItem, 
  KelasItem, 
  JurusanItem, 
  MapelItem, 
  JadwalItem, 
  AgendaGuruItem, 
  AgendaKelasItem,
  AbsensiGuruRecord,
  AbsensiSiswaRecord,
  MateriRecord,
  TugasRecord,
  NilaiSiswaRecord,
  SupervisiRecord,
  NotificationItem,
  AuditLogItem,
  User
} from '../types';
import { initialSiswaFormatted } from './siswaData';
import { completeJadwalData } from './jadwalData';

export const initialSchoolSetting: SchoolSetting = {
  namaSekolah: 'SMK NEGERI BOJONGGAMBIR',
  npsn: '69989796',
  alamat: 'Jl. Bojonggambir Kp. Mandalawangi RT005/005, Kec. Bojonggambir, Kab. Tasikmalaya, Prov. Jawa Barat',
  telepon: '(0265) 754321',
  email: 'admin@smknbojonggambir.sch.id',
  website: 'www.smknbojonggambir.sch.id',
  kepalaSekolah: 'Iman Rahmat, S.Pd.I.',
  nipKepalaSekolah: '19901017 202321 1 007',
  wakasekKurikulum: 'Wahab Mughni Sa\'dillah, S.Pd.',
  nipWakasekKurikulum: '19920521 202521 1 007',
  tahunPelajaran: '2026/2027',
  semester: 'Ganjil',
  logoUrl: 'https://raw.githubusercontent.com/smknbojonggambir/simagu/main/logo.png',
  googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1057ndE274DiiOOPUkn2E-6Eet8M1fzpABTGc4Aln5Ug/edit',
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwdP4xyVpfseBeDt2TrzyrNUQYhOuxX2638CDPs0XcisGGZNga0Ix4PgxGhSPv4aCj9/exec',
  waNotificationActive: true,
};

export const initialUsers: User[] = [
  { id: 'usr-1', username: 'admin', nama: 'Administrator SIMAGU', role: 'Administrator', email: 'admin@smknbojonggambir.sch.id' },
  { id: 'usr-2', username: 'kepsek', nama: 'Iman Rahmat, S.Pd.I.', nip: '19901017 202321 1 007', role: 'Kepala Sekolah', email: 'iman.rahmat@smknbojonggambir.sch.id' },
  { id: 'usr-3', username: 'wakasek_kur', nama: 'Wahab Mughni Sa\'dillah, S.Pd.', nip: '19920521 202521 1 007', role: 'Wakasek Kurikulum', email: 'wahab.mughni@smknbojonggambir.sch.id' },
  { id: 'usr-3b', username: 'wakasek_kes', nama: 'Ilfan Fauzi, S.Pd.', nip: '19930605 202321 1 008', role: 'Wakasek Kesiswaan', email: 'ilfan.fauzi@smknbojonggambir.sch.id' },
  { id: 'usr-gr-02', username: 'seni_sriastuti', nama: 'Seni Sri Astuti, S.Pd.', nip: '19940124 202521 2 094', role: 'Wali Kelas', email: 'seni.sriastuti@smknbojonggambir.sch.id', kelasWali: 'XI APHP' },
  { id: 'usr-gr-03', username: 'rahmayanti', nama: 'Rahmayanti Rahayu, S.Pd.', nip: '19930125 202521 2 132', role: 'Guru', email: 'rahmayanti@smknbojonggambir.sch.id' },
  { id: 'usr-gr-04', username: 'diniyanti', nama: 'Diniyanti, S.Pd.', nip: '19940204 202521 2 136', role: 'Wali Kelas', email: 'diniyanti@smknbojonggambir.sch.id', kelasWali: 'XII APHP' },
  { id: 'usr-gr-05', username: 'aa_mansur', nama: 'Drs. Aa Mansur, M.Pd.', nip: '19670525 202421 1 001', role: 'Wali Kelas', email: 'aa.mansur@smknbojonggambir.sch.id', kelasWali: 'XI DKV 1' },
  { id: 'usr-gr-06', username: 'ali_maulana', nama: 'Ali Maulana, S.Pd.', nip: '19920201 202421 1 017', role: 'Guru', email: 'ali.maulana@smknbojonggambir.sch.id' },
  { id: 'usr-gr-07', username: 'darusalam', nama: 'Darusalam, S.H.', nip: '19930902 202321 1 002', role: 'Guru', email: 'darusalam@smknbojonggambir.sch.id' },
  { id: 'usr-gr-09', username: 'mohamad_ridwan', nama: 'Mohamad Ridwan, M.Pd.', nip: '19900304 202321 1 008', role: 'Guru BK', email: 'mohamad.ridwan@smknbojonggambir.sch.id' },
  { id: 'usr-gr-10', username: 'ihsan_haeruman', nama: 'Ihsan Haeruman Kamil, S.Pd.', nip: '19940729 202421 1 017', role: 'Wali Kelas', email: 'ihsan.haeruman@smknbojonggambir.sch.id', kelasWali: 'X DKV 2' },
  { id: 'usr-gr-12', username: 'sutisna', nama: 'Sutisna, S.Pd.', nip: '19920323 202521 1 158', role: 'Wali Kelas', email: 'sutisna@smknbojonggambir.sch.id', kelasWali: 'XI DKV 2' },
  { id: 'usr-gr-13', username: 'ratih_juliana', nama: 'Ratih Juliana Anggraeni, S.Si.', nip: '19950728 202521 2 139', role: 'Wali Kelas', email: 'ratih.juliana@smknbojonggambir.sch.id', kelasWali: 'X APHP' },
  { id: 'usr-gr-14', username: 'dede_gisni', nama: 'Dede Gisni Azmi, S.Si.', nip: '19950724 202521 2 117', role: 'Wali Kelas', email: 'dede.gisni@smknbojonggambir.sch.id', kelasWali: 'X DKV 1' },
  { id: 'usr-gr-15', username: 'itang_supriadin', nama: 'Itang Supriadin, S.P.', nip: '19940915 202521 1 121', role: 'Guru', email: 'itang.supriadin@smknbojonggambir.sch.id' },
  { id: 'usr-gr-16', username: 'giardi_fauzi', nama: 'Giardi Achmad Fauzi, S.T.', nip: '19910801 202421 1 016', role: 'Wali Kelas', email: 'giardi.fauzi@smknbojonggambir.sch.id', kelasWali: 'XII DKV 1' },
  { id: 'usr-gr-17', username: 'yogi', nama: 'Yogi, S.Kom.', nip: '19940808 202521 1 159', role: 'Wali Kelas', email: 'yogi@smknbojonggambir.sch.id', kelasWali: 'XII DKV 3' },
  { id: 'usr-gr-18', username: 'dede_adi', nama: 'Dede Adi Selamet M., S.Kom.', nip: '19930621 202521 1 118', role: 'Guru', email: 'dede.adi@smknbojonggambir.sch.id' },
  { id: 'usr-gr-19', username: 'ruli_lesmana', nama: 'Ruli Lesmana, S.T.', nip: '19870914 202521 1 113', role: 'Guru', email: 'ruli.lesmana@smknbojonggambir.sch.id' },
  { id: 'usr-gr-20', username: 'rian_septian', nama: 'Rian Septian, A.Md.', nip: '19940912 202521 1 124', role: 'Wali Kelas', email: 'rian.septian@smknbojonggambir.sch.id', kelasWali: 'XII DKV 2' },
];

export const initialJurusan: JurusanItem[] = [
  { id: 'jur-1', kode: 'DKV', namaJurusan: 'Desain Komunikasi Visual (DKV)', kepalaKonsentrasi: 'Dede Adi Selamet M., S.Kom.' },
  { id: 'jur-2', kode: 'APHP', namaJurusan: 'Agribisnis Pengolahan Hasil Pertanian (APHP)', kepalaKonsentrasi: 'Itang Supriadin, S.P.' },
];

export const initialGuru: GuruItem[] = [
  { id: 'gr-01', kodeGuru: '01', nip: '19901017 202321 1 007', nuptk: '7349768669110003', nama: 'Iman Rahmat, S.Pd.I.', gender: 'L', email: 'iman.rahmat@smknbojonggambir.sch.id', telepon: '081234567001', jabatan: 'Plt. Kepala Sekolah', mapelUtama: 'Pendidikan Agama dan Budi Pekerti, Projek Kreatif dan Kewirausahaan (PKK)', status: 'PPPK' },
  { id: 'gr-02', kodeGuru: '02', nip: '19940124 202521 2 094', nuptk: '4456772673230220', nama: 'Seni Sri Astuti, S.Pd.', gender: 'P', email: 'seni.sriastuti@smknbojonggambir.sch.id', telepon: '081234567002', jabatan: 'Guru / Wali Kelas XI APHP', mapelUtama: 'Bahasa Indonesia', status: 'PPPK' },
  { id: 'gr-03', kodeGuru: '03', nip: '19930125 202521 2 132', nuptk: '8457771672230222', nama: 'Rahmayanti Rahayu, S.Pd.', gender: 'P', email: 'rahmayanti@smknbojonggambir.sch.id', telepon: '081234567003', jabatan: 'Kepala Perpustakaan', mapelUtama: 'Matematika', status: 'PPPK' },
  { id: 'gr-04', kodeGuru: '04', nip: '19940204 202521 2 136', nuptk: '0536772673230242', nama: 'Diniyanti, S.Pd.', gender: 'P', email: 'diniyanti@smknbojonggambir.sch.id', telepon: '081234567004', jabatan: 'Guru / Wali Kelas XII APHP', mapelUtama: 'Bahasa Inggris dan Bahasa Asing Lainnya', status: 'PPPK' },
  { id: 'gr-05', kodeGuru: '05', nip: '19670525 202421 1 001', nuptk: '0857745646200012', nama: 'Drs. Aa Mansur, M.Pd.', gender: 'L', email: 'aa.mansur@smknbojonggambir.sch.id', telepon: '081234567005', jabatan: 'Guru / Wali Kelas XI DKV 1', mapelUtama: 'Pendidikan Agama dan Budi Pekerti', status: 'PPPK' },
  { id: 'gr-06', kodeGuru: '06', nip: '19920201 202421 1 017', nuptk: '5533770671130042', nama: 'Ali Maulana, S.Pd.', gender: 'L', email: 'ali.maulana@smknbojonggambir.sch.id', telepon: '081234567006', jabatan: 'Guru BP/BK / Staf Kurikulum', mapelUtama: 'Sejarah Indonesia, Guru BP/BK', status: 'PPPK' },
  { id: 'gr-07', kodeGuru: '07', nip: '19930902 202321 1 002', nuptk: '6234771672130223', nama: 'Darusalam, S.H.', gender: 'L', email: 'darusalam@smknbojonggambir.sch.id', telepon: '081234567007', jabatan: 'Wakasek Sarana Prasarana', mapelUtama: 'Pendidikan Pancasila dan Kewarganegaraan (PPKn)', status: 'PPPK' },
  { id: 'gr-08', kodeGuru: '08', nip: '19930605 202321 1 008', nuptk: '5937771672130332', nama: 'Ilfan Fauzi, S.Pd.', gender: 'L', email: 'ilfan.fauzi@smknbojonggambir.sch.id', telepon: '081234567008', jabatan: 'Wakasek Kesiswaan', mapelUtama: 'Seni Rupa, Muatan Lokal Bahasa Sunda', status: 'PPPK' },
  { id: 'gr-09', kodeGuru: '09', nip: '19900304 202321 1 008', nuptk: '8636768669130052', nama: 'Mohamad Ridwan, M.Pd.', gender: 'L', email: 'mohamad.ridwan@smknbojonggambir.sch.id', telepon: '081234567009', jabatan: 'Wakasek Hubinmas / Guru BK', mapelUtama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK), Guru BP/BK', status: 'PPPK' },
  { id: 'gr-10', kodeGuru: '10', nip: '19940729 202421 1 017', nuptk: '0061772673130213', nama: 'Ihsan Haeruman Kamil, S.Pd.', gender: 'L', email: 'ihsan.haeruman@smknbojonggambir.sch.id', telepon: '081234567010', jabatan: 'Kepala Bengkel APHP / Wali Kelas X DKV 2', mapelUtama: 'Ilmu Pengetahuan Alam dan Sosial (IPAS), Dasar-Dasar APHP, Agribisnis Pengolahan Hasil Pertanian', status: 'PPPK' },
  { id: 'gr-11', kodeGuru: '11', nip: '19920521 202521 1 007', nuptk: '4853770671130062', nama: 'Wahab Mughni Sa\'dillah, S.Pd.', gender: 'L', email: 'wahab.mughni@smknbojonggambir.sch.id', telepon: '081234567011', jabatan: 'Wakasek Kurikulum', mapelUtama: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', status: 'PPPK' },
  { id: 'gr-12', kodeGuru: '12', nip: '19920323 202521 1 158', nuptk: '2655770671130332', nama: 'Sutisna, S.Pd.', gender: 'L', email: 'sutisna@smknbojonggambir.sch.id', telepon: '081234567012', jabatan: 'Staf Wakasek Hubinmas / Wali Kelas XI DKV 2', mapelUtama: 'Ilmu Pengetahuan Alam dan Sosial (IPAS), Projek Kreatif dan Kewirausahaan (PKK), Agribisnis Pengolahan Hasil Pertanian', status: 'PPPK' },
  { id: 'gr-13', kodeGuru: '13', nip: '19950728 202521 2 139', nuptk: '8060773674230170', nama: 'Ratih Juliana Anggraeni, S.Si.', gender: 'P', email: 'ratih.juliana@smknbojonggambir.sch.id', telepon: '081234567013', jabatan: 'Wali Kelas X APHP', mapelUtama: 'Agribisnis Pengolahan Hasil Pertanian, IPAS, Projek Kreatif dan Kewirausahaan (PKK)', status: 'PPPK' },
  { id: 'gr-14', kodeGuru: '14', nip: '19950724 202521 2 117', nuptk: '-', nama: 'Dede Gisni Azmi, S.Si.', gender: 'P', email: 'dede.gisni@smknbojonggambir.sch.id', telepon: '081234567014', jabatan: 'Kepala Bengkel DKV / Wali Kelas X DKV 1', mapelUtama: 'Matematika', status: 'PPPK' },
  { id: 'gr-15', kodeGuru: '15', nip: '19940915 202521 1 121', nuptk: '5247772673130233', nama: 'Itang Supriadin, S.P.', gender: 'L', email: 'itang.supriadin@smknbojonggambir.sch.id', telepon: '081234567015', jabatan: 'Kepala Program APHP', mapelUtama: 'Agribisnis Pengolahan Hasil Pertanian, Projek Kreatif dan Kewirausahaan (PKK)', status: 'PPPK' },
  { id: 'gr-16', kodeGuru: '16', nip: '19910801 202421 1 016', nuptk: '1133769670130293', nama: 'Giardi Achmad Fauzi, S.T.', gender: 'L', email: 'giardi.fauzi@smknbojonggambir.sch.id', telepon: '081234567016', jabatan: 'Wali Kelas XII DKV 1', mapelUtama: 'Desain Komunikasi Visual (DKV)', status: 'PPPK' },
  { id: 'gr-17', kodeGuru: '17', nip: '19940808 202521 1 159', nuptk: '3140772673130273', nama: 'Yogi, S.Kom.', gender: 'L', email: 'yogi@smknbojonggambir.sch.id', telepon: '081234567017', jabatan: 'Wali Kelas XII DKV 3', mapelUtama: 'Desain Komunikasi Visual (DKV), Projek Kreatif dan Kewirausahaan (PKK)', status: 'PPPK' },
  { id: 'gr-18', kodeGuru: '18', nip: '19930621 202521 1 118', nuptk: '9953771672130202', nama: 'Dede Adi Selamet M., S.Kom.', gender: 'L', email: 'dede.adi@smknbojonggambir.sch.id', telepon: '081234567018', jabatan: 'Kepala Program DKV', mapelUtama: 'Desain Komunikasi Visual (DKV), Koding dan Kecerdasan Artifisial, Dasar-Dasar Desain Komunikasi Visual', status: 'PPPK' },
  { id: 'gr-19', kodeGuru: '19', nip: '19870914 202521 1 113', nuptk: '2246765668120003', nama: 'Ruli Lesmana, S.T.', gender: 'L', email: 'ruli.lesmana@smknbojonggambir.sch.id', telepon: '081234567019', jabatan: 'Staf Wakasek Kesiswaan', mapelUtama: 'Informatika, Dasar-Dasar Desain Komunikasi Visual', status: 'PPPK' },
  { id: 'gr-20', kodeGuru: '20', nip: '19940912 202521 1 124', nuptk: '-', nama: 'Rian Septian, A.Md.', gender: 'L', email: 'rian.septian@smknbojonggambir.sch.id', telepon: '081234567020', jabatan: 'Wali Kelas XII DKV 2', mapelUtama: 'Desain Komunikasi Visual (DKV), Projek Kreatif dan Kewirausahaan (PKK)', status: 'PPPK' },
];

export const initialKelas: KelasItem[] = [
  { id: 'kls-1', namaKelas: 'X DKV 1', tingkat: 'X', jurusan: 'Desain Komunikasi Visual (DKV)', waliKelas: 'Dede Gisni Azmi, S.Si.', ketuaKelas: 'Fajar Nugraha', wakilKetua: 'Siti Nurhaliza', jumlahLaki: 18, jumlahPerempuan: 18, ruang: 'RPS DKV' },
  { id: 'kls-2', namaKelas: 'X DKV 2', tingkat: 'X', jurusan: 'Desain Komunikasi Visual (DKV)', waliKelas: 'Ihsan Haeruman Kamil, S.Pd.', ketuaKelas: 'Rizky Pratama', wakilKetua: 'Dina Amelia', jumlahLaki: 19, jumlahPerempuan: 17, ruang: 'RPS APHPA' },
  { id: 'kls-3', namaKelas: 'XI DKV 1', tingkat: 'XI', jurusan: 'Desain Komunikasi Visual (DKV)', waliKelas: 'Drs. Aa Mansur, M.Pd.', ketuaKelas: 'Ahmad Fauzi', wakilKetua: 'Rina Sastrawan', jumlahLaki: 20, jumlahPerempuan: 16, ruang: 'Lab Komputer' },
  { id: 'kls-4', namaKelas: 'XI DKV 2', tingkat: 'XI', jurusan: 'Desain Komunikasi Visual (DKV)', waliKelas: 'Sutisna, S.Pd.', ketuaKelas: 'Bagus Setiawan', wakilKetua: 'Chintya Dewi', jumlahLaki: 17, jumlahPerempuan: 18, ruang: 'Lab Komputer 2' },
  { id: 'kls-5', namaKelas: 'XII DKV 1', tingkat: 'XII', jurusan: 'Desain Komunikasi Visual (DKV)', waliKelas: 'Giardi Achmad Fauzi, S.T.', ketuaKelas: 'Dian Saputra', wakilKetua: 'Laras Wati', jumlahLaki: 16, jumlahPerempuan: 19, ruang: 'Studio DKV 3' },
  { id: 'kls-6', namaKelas: 'XII DKV 2', tingkat: 'XII', jurusan: 'Desain Komunikasi Visual (DKV)', waliKelas: 'Rian Septian, A.Md.', ketuaKelas: 'Gilang Ramadhan', wakilKetua: 'Putri Ayu', jumlahLaki: 18, jumlahPerempuan: 17, ruang: 'Lab Komputer 3' },
  { id: 'kls-7', namaKelas: 'XII DKV 3', tingkat: 'XII', jurusan: 'Desain Komunikasi Visual (DKV)', waliKelas: 'Yogi, S.Kom.', ketuaKelas: 'Farhan Azhar', wakilKetua: 'Nabila Syahla', jumlahLaki: 17, jumlahPerempuan: 18, ruang: 'Studio DKV 4' },
  { id: 'kls-8', namaKelas: 'X APHP', tingkat: 'X', jurusan: 'Agribisnis Pengolahan Hasil Pertanian (APHP)', waliKelas: 'Ratih Juliana Anggraeni, S.Si.', ketuaKelas: 'Bayu Sukma', wakilKetua: 'Nia Kurnia', jumlahLaki: 12, jumlahPerempuan: 23, ruang: 'Bengkel APHP' },
  { id: 'kls-9', namaKelas: 'XI APHP', tingkat: 'XI', jurusan: 'Agribisnis Pengolahan Hasil Pertanian (APHP)', waliKelas: 'Seni Sri Astuti, S.Pd.', ketuaKelas: 'Irfan Hakim', wakilKetua: 'Maya Indah', jumlahLaki: 14, jumlahPerempuan: 21, ruang: 'Lab APHP' },
  { id: 'kls-10', namaKelas: 'XII APHP', tingkat: 'XII', jurusan: 'Agribisnis Pengolahan Hasil Pertanian (APHP)', waliKelas: 'Diniyanti, S.Pd.', ketuaKelas: 'Agung Gunawan', wakilKetua: 'Fitri Laras', jumlahLaki: 11, jumlahPerempuan: 24, ruang: 'Ruang Pengolahan APHP' },
];

export const initialSiswa: SiswaItem[] = initialSiswaFormatted;

export const initialMapel: MapelItem[] = [
  { id: 'mpl-1', kode: 'PABP', namaMapel: 'Pendidikan Agama dan Budi Pekerti', fase: 'F', kelompok: 'Umum' },
  { id: 'mpl-2', kode: 'PKK', namaMapel: 'Projek Kreatif dan Kewirausahaan (PKK)', fase: 'F', kelompok: 'Kejuruan' },
  { id: 'mpl-3', kode: 'BIN', namaMapel: 'Bahasa Indonesia', fase: 'F', kelompok: 'Umum' },
  { id: 'mpl-4', kode: 'MTK', namaMapel: 'Matematika', fase: 'F', kelompok: 'Umum' },
  { id: 'mpl-5', kode: 'BIG', namaMapel: 'Bahasa Inggris dan Bahasa Asing Lainnya', fase: 'F', kelompok: 'Umum' },
  { id: 'mpl-6', kode: 'SEJ', namaMapel: 'Sejarah Indonesia', fase: 'F', kelompok: 'Umum' },
  { id: 'mpl-7', kode: 'BK', namaMapel: 'BP/BK', fase: 'F', kelompok: 'Umum' },
  { id: 'mpl-8', kode: 'PPKN', namaMapel: 'Pendidikan Pancasila dan Kewarganegaraan (PPKn)', fase: 'F', kelompok: 'Umum' },
  { id: 'mpl-9', kode: 'SR', namaMapel: 'Seni Rupa', fase: 'E', kelompok: 'Umum' },
  { id: 'mpl-10', kode: 'SND', namaMapel: 'Mulok Bahasa Sunda', fase: 'F', kelompok: 'Umum' },
  { id: 'mpl-11', kode: 'PJOK', namaMapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', fase: 'F', kelompok: 'Umum' },
  { id: 'mpl-12', kode: 'IPAS', namaMapel: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', fase: 'E', kelompok: 'Umum' },
  { id: 'mpl-13', kode: 'D-APHP', namaMapel: 'Dasar-Dasar APHP', fase: 'E', jurusan: 'Agribisnis Pengolahan Hasil Pertanian (APHP)', kelompok: 'Kejuruan' },
  { id: 'mpl-14', kode: 'APHP', namaMapel: 'Agribisnis Pengolahan Hasil Pertanian', fase: 'F', jurusan: 'Agribisnis Pengolahan Hasil Pertanian (APHP)', kelompok: 'Kejuruan' },
  { id: 'mpl-15', kode: 'DKV', namaMapel: 'Desain Komunikasi Visual (DKV)', fase: 'F', jurusan: 'Desain Komunikasi Visual (DKV)', kelompok: 'Kejuruan' },
  { id: 'mpl-16', kode: 'KKA', namaMapel: 'Koding dan Kecerdasan Artifisial', fase: 'F', jurusan: 'Desain Komunikasi Visual (DKV)', kelompok: 'Kejuruan' },
  { id: 'mpl-17', kode: 'D-DKV', namaMapel: 'Dasar-Dasar Desain Komunikasi Visual', fase: 'E', jurusan: 'Desain Komunikasi Visual (DKV)', kelompok: 'Kejuruan' },
  { id: 'mpl-18', kode: 'INF', namaMapel: 'Informatika', fase: 'E', kelompok: 'Kejuruan' },
];

import { generateWeeklyOperationalData } from './weeklyOperationalData';

export const initialJadwal: JadwalItem[] = completeJadwalData;

const weeklyData = generateWeeklyOperationalData();

export const initialAgendaGuru: AgendaGuruItem[] = weeklyData.agendaGuruList;
export const initialAgendaKelas: AgendaKelasItem[] = weeklyData.agendaKelasList;
export const initialAbsensiGuru: AbsensiGuruRecord[] = weeklyData.absensiGuruList;
export const initialAbsensiSiswa: AbsensiSiswaRecord[] = weeklyData.absensiSiswaList;
export const initialSupervisi: SupervisiRecord[] = weeklyData.supervisiList;
export const initialMateri: MateriRecord[] = weeklyData.materiList;
export const initialTugas: TugasRecord[] = weeklyData.tugasList;
export const initialNilaiSiswa: NilaiSiswaRecord[] = weeklyData.nilaiSiswaList;
export const initialNotifications: NotificationItem[] = [];
export const initialAuditLogs: AuditLogItem[] = [];

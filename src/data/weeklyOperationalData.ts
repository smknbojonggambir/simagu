import { 
  AgendaGuruItem, 
  AgendaKelasItem, 
  AbsensiGuruRecord, 
  AbsensiSiswaRecord, 
  SupervisiRecord,
  NotificationItem,
  AuditLogItem,
  SiswaItem,
  MateriRecord,
  TugasRecord,
  NilaiSiswaRecord
} from '../types';
import { initialGuru, initialKelas, initialMapel, initialJurusan } from './mockData';
import { initialSiswaFormatted } from './siswaData';
import { completeJadwalData } from './jadwalData';

const dayDateMap: Record<string, string> = {
  'Senin': '2026-08-10',
  'Selasa': '2026-08-11',
  'Rabu': '2026-08-12',
  'Kamis': '2026-08-13',
  'Jumat': '2026-08-14',
};

// Inventaris Master per Ruang Kelas
const masterInventarisMap: Record<string, Array<{ barang: string; jumlah: number; baik: number; rusakRingan: number; rusakBerat: number; keterangan: string }>> = {
  'RPS DKV': [
    { barang: 'Komputer Graphics Workstation', jumlah: 36, baik: 35, rusakRingan: 1, rusakBerat: 0, keterangan: '1 PC butuh pembersihan fan' },
    { barang: 'Drawing Tablet Stylus', jumlah: 36, baik: 36, rusakRingan: 0, rusakBerat: 0, keterangan: 'Kondisi baik' },
    { barang: 'Proyektor High Lumens', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat jernih' },
    { barang: 'AC Split 2 PK', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Dingin optimal' },
    { barang: 'Whiteboard & Spidol', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat baik' },
  ],
  'RPS APHPA': [
    { barang: 'Meja & Kursi Lab Stainless', jumlah: 36, baik: 36, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat bersih' },
    { barang: 'Alat Pengolahan Hasil Hasil', jumlah: 10, baik: 9, rusakRingan: 1, rusakBerat: 0, keterangan: '1 blender kalibrasi ulang' },
    { barang: 'Proyektor & Layar', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Berfungsi normal' },
    { barang: 'AC Split 2 PK', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat baik' },
  ],
  'Lab Komputer': [
    { barang: 'PC Lab Core i5', jumlah: 36, baik: 35, rusakRingan: 1, rusakBerat: 0, keterangan: '1 PC masalah port kabel LAN' },
    { barang: 'Switch Hub 48 Port', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat baik' },
    { barang: 'Proyektor Digital', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Berfungsi jernih' },
    { barang: 'AC Split 2 PK', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Dingin baik' },
  ],
  'Lab Komputer 2': [
    { barang: 'PC Lab Multimedia', jumlah: 35, baik: 34, rusakRingan: 1, rusakBerat: 0, keterangan: '1 PC mouse butuh ganti' },
    { barang: 'Proyektor Interactive', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat baik' },
    { barang: 'AC 2 PK', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Optimal' },
  ],
  'Studio DKV 3': [
    { barang: 'PC Graphics Lab', jumlah: 35, baik: 35, rusakRingan: 0, rusakBerat: 0, keterangan: 'Kondisi prima' },
    { barang: 'Kamera DSLR & Tripod', jumlah: 4, baik: 4, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat baik' },
    { barang: 'Lampu Lighting Studio', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Berfungsi baik' },
  ],
  'Lab Komputer 3': [
    { barang: 'PC Desktop Lab', jumlah: 35, baik: 34, rusakRingan: 1, rusakBerat: 0, keterangan: '1 PC install ulang OS' },
    { barang: 'Proyektor', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Jernih' },
  ],
  'Studio DKV 4': [
    { barang: 'PC Lab & Pen Tablet', jumlah: 35, baik: 35, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat baik' },
    { barang: 'Proyektor', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Berfungsi' },
  ],
  'Bengkel APHP': [
    { barang: 'Oven Pengering Makanan', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat baik' },
    { barang: 'Mixer Pengolah Makanan', jumlah: 4, baik: 3, rusakRingan: 1, rusakBerat: 0, keterangan: '1 unit butuh minyak pelumas' },
    { barang: 'Timbangan Digital Presisi', jumlah: 6, baik: 6, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat presisi' },
  ],
  'Lab APHP': [
    { barang: 'Peralatan Uji Kualitas Pangan', jumlah: 12, baik: 12, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat lengkap' },
    { barang: 'Mikroskop Digital', jumlah: 5, baik: 5, rusakRingan: 0, rusakBerat: 0, keterangan: 'Kondisi baik' },
  ],
  'Ruang Pengolahan APHP': [
    { barang: 'Mesin Press Kemasan', jumlah: 3, baik: 3, rusakRingan: 0, rusakBerat: 0, keterangan: 'Berfungsi baik' },
    { barang: 'Freezer Pembeku Pangan', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Sangat dingin' },
  ],
};

function getTopicForMapel(mapel: string): { elemen: string; cp: string; atp: string; tp: string; materi: string; tugas: string } {
  if (mapel.includes('Agama')) {
    return {
      elemen: 'Al-Qur\'an dan Hadis',
      cp: 'Peserta didik memahami ayat-ayat Al-Qur\'an dan Hadis tentang toleransi dan etos kerja.',
      atp: 'F.AGM.1 Menganalisis makna Q.S. At-Taubah/9: 105 tentang etos kerja mulia.',
      tp: 'Siswa mampu menjelaskan kandungan ayat tentang etos kerja serta menerapkannya dalam kehidupan sekolah.',
      materi: 'Toleransi Beragama & Etos Kerja Unggul dalam Perspektif Islam',
      tugas: 'Rangkuman analisis Q.S. At-Taubah ayat 105 dan contoh penerapannya'
    };
  } else if (mapel.includes('Indonesia')) {
    return {
      elemen: 'Membaca dan Memirsa / Menulis',
      cp: 'Peserta didik mampu mengevaluasi gagasan dan pandangan berdasarkan kaidah kebahasaan teks Laporan Hasil Observasi.',
      atp: 'F.BIN.2 Menyusun teks Laporan Hasil Observasi struktur dan kaidah kebahasaan baku.',
      tp: 'Siswa mampu mengidentifikasi struktur teks LHO dan menyusun draf observasi lingkungan sekolah.',
      materi: 'Analisis Struktur & Kaidah Kebahasaan Teks Laporan Hasil Observasi',
      tugas: 'Penyusunan Draf Laporan Hasil Observasi Fasilitas Bengkel / Studio'
    };
  } else if (mapel.includes('Matematika')) {
    return {
      elemen: 'Aljabar dan Fungsi',
      cp: 'Peserta didik dapat menyelesaikan masalah yang berkaitan dengan sistem persamaan linear dan matriks.',
      atp: 'F.MTK.3 Mengoperasikan aljabar matriks dan determinan dalam pemecahan masalah kejuruan.',
      tp: 'Siswa dapat menghitung determinan dan invers matriks ordo 2x2 secara cermat.',
      materi: 'Matriks Ordo 2x2: Operasi Penjumlahan, Perkalian, dan Determinan',
      tugas: 'Latihan 10 Soal Aplikasi Matriks dalam Perhitungan Biaya Produksi'
    };
  } else if (mapel.includes('Inggris')) {
    return {
      elemen: 'Menyimak dan Berbicara',
      cp: 'Peserta didik mampu menggunakan bahasa Inggris untuk berkomunikasi dalam konteks kerja profesional.',
      atp: 'F.BIG.1 Mempraktikkan komunikasi wawancara kerja (Job Interview) dan penyampaian presentasi.',
      tp: 'Siswa mampu melakukan simulasipresentasi produk dan menjawab pertanyaan umum wawancara.',
      materi: 'Professional Communication: Job Interview & Product Presentation Skills',
      tugas: 'Membuat rekaman audio / video singkat perkenalan diri bahasa Inggris'
    };
  } else if (mapel.includes('Sejarah')) {
    return {
      elemen: 'Pemahaman Konsep Sejarah',
      cp: 'Peserta didik mampu menganalisis pergerakan nasional Indonesia dan perjuangan kemerdekaan.',
      atp: 'F.SEJ.1 Menganalisis pengaruh organisasi pergerakan nasional terhadap kebangkitan bangsa.',
      tp: 'Siswa dapat menjelaskan latar belakang Sumpah Pemuda dan dampaknya bagi persatuan nasional.',
      materi: 'Sejarah Pergerakan Nasional & Semangat Sumpah Pemuda 1928',
      tugas: 'Peta pikiran (mind map) tokoh pergerakan nasional dan perannya'
    };
  } else if (mapel.includes('Sunda')) {
    return {
      elemen: 'Apresiasi Sastra Sunda',
      cp: 'Peserta didik mampu memahami dan mengapresiasi karya sastra Sunda tradisional maupun modern.',
      atp: 'F.SND.1 Menganalisis struktur dan kaidah bahasa dalam Carita Parahiyangan / Carita Babad.',
      tp: 'Siswa dapat membaca dan menguraikan nilai-nilai kebaikan dalam cerita Babad Sunda.',
      materi: 'Apresiasi Carita Babad & Undak-Usuk Basa Sunda',
      tugas: 'Menulis teks percakapan singkat menggunakan Undak-Usuk Basa'
    };
  } else if (mapel.includes('PJOK')) {
    return {
      elemen: 'Keterampilan Gerak & Kebugaran Jasmani',
      cp: 'Peserta didik mempraktikkan keterampilan permainan bola besar dan mengukur tingkat kebugaran.',
      atp: 'F.PJK.1 Mempraktikkan teknik dasar taktik permainan Bola Voli dantes kebugaran.',
      tp: 'Siswa mampu melakukan servis atas dan passing bawah permainan bola voli dengan teknik benar.',
      materi: 'Teknik Dasar & Taktik Permainan Bola Voli serta Tes Kebugaran',
      tugas: 'Praktik teknik dasar passing dan servis bola voli di lapangan'
    };
  } else if (mapel.includes('IPAS')) {
    return {
      elemen: 'Bumi dan Antariksa / Keruangan',
      cp: 'Peserta didik memahami interaksi antara makhluk hidup dan lingkungan serta energi terbarukan.',
      atp: 'E.IPS.2 Menganalisis dampak perubahan lingkungan dan konsep mitigasi bencana.',
      tp: 'Siswa mampu mengidentifikasi komponen ekosistem dan potensi pemanfaatan energi ramah lingkungan.',
      materi: 'Ekosistem, Pencemaran Lingkungan, dan Energi Terbarukan',
      tugas: 'Laporan observasi pengelolaan sampah dan pemilahan organik-anorganik'
    };
  } else if (mapel.includes('DKV') || mapel.includes('Desain') || mapel.includes('Koding')) {
    return {
      elemen: 'Desain Grafis, Nirmana, dan Aplikasi Digital',
      cp: 'Peserta didik mampu mengoperasikan perangkat lunak desain vektor dan raster serta mengaplikasikan prinsip tata letak.',
      atp: 'F.DKV.2 Membuat karya desain komunikasi visual cetak dan digital berstandar industri.',
      tp: 'Siswa mampu merancang logo vektor dan poster promosi menggunakan aplikasi desain dengan komposisi seimbang.',
      materi: 'Prinsip Dasar Layout Vektor, Color Palette, dan Branding Identity Design',
      tugas: 'Praktik pembuatan desain identitas visual / logo produk umkm lokal'
    };
  } else if (mapel.includes('APHP') || mapel.includes('Pertanian') || mapel.includes('Pengolahan')) {
    return {
      elemen: 'Pengolahan Hasil Nabati dan Hewani',
      cp: 'Peserta didik mampu mengidentifikasi karakteristik bahan baku serta menerapkan teknik pengolahan pangan hygiene.',
      atp: 'F.APH.1 Memproduksi olahan komoditas nabati dan hewani sesuai SOP keamanan pangan HACCP.',
      tp: 'Siswa mampu mempraktikkan proses diversifikasi olahan buah/sayur menjadi produk kemasan bernilai jual.',
      materi: 'Teknologi Pengolahan Komoditas Nabati, Sterilisasi & Pengemasan Produk',
      tugas: 'Praktik pengolahan sirup buah lokal dan pengujian mutu hasil olahan'
    };
  } else if (mapel.includes('PKK') || mapel.includes('Kreatif')) {
    return {
      elemen: 'Perencanaan Produk & Kewirausahaan',
      cp: 'Peserta didik mampu membuat perencanaan usaha, menghitung HPP, serta memasarkan produk karya siswa.',
      atp: 'F.PKK.1 Merancang prototype produk kreatif kejuruan dan menyusun analisis HPP.',
      tp: 'Siswa mampu menentukan Harga Pokok Penjualan (HPP) dan membuat draf brosur promosi digital.',
      materi: 'Analisis Kelayakan Usaha, Perhitungan HPP, dan Digital Marketing',
      tugas: 'Perhitungan HPP & pembuatan draf poster promosi bisnis siswa'
    };
  } else if (mapel.includes('Informatika')) {
    return {
      elemen: 'Algoritma, Pemrograman, dan Berpikir Komputasional',
      cp: 'Peserta didik mampu merancang algoritma dan mengimplementasikannya dalam bahasa pemrograman.',
      atp: 'E.INF.1 Mengembangkan program sederhana menggunakan struktur kontrol dan fungsi.',
      tp: 'Siswa mampu membuat logika percabangan dan perulangan untuk memecahkan masalah matematika.',
      materi: 'Dasar Pemrograman: Variabel, Tipe Data, Pengondisian, dan Perulangan',
      tugas: 'Praktik koding program kalkulasi nilai siswa dan kriteria kelulusan'
    };
  } else {
    return {
      elemen: 'Pemahaman Konsep & Praktik Kejuruan',
      cp: 'Peserta didik memahami konsep dasar dan mampu menerapkan keterampilan sesuai standar operasional.',
      atp: 'F.GEN.1 Menerapkan prinsip-prinsip pembelajaran aktif dan kolaboratif.',
      tp: 'Siswa mampu menguasai kompetensi dasar materi pembelajaran secara mandiri dan cermat.',
      materi: 'Pendalaman Materi & Praktik Mandiri Terbimbing',
      tugas: 'Latihan pemahaman konsep dan lembar kerja peserta didik'
    };
  }
}

// Generate the complete 1-week operational data
export function generateWeeklyOperationalData() {
  const agendaGuruList: AgendaGuruItem[] = [];
  const absensiGuruList: AbsensiGuruRecord[] = [];
  const absensiSiswaList: AbsensiSiswaRecord[] = [];
  const supervisiList: SupervisiRecord[] = [];
  const materiList: MateriRecord[] = [];
  const tugasList: TugasRecord[] = [];
  const nilaiSiswaList: NilaiSiswaRecord[] = [];

  // Group jadwal by day and class
  const schedulesByDayAndClass: Record<string, Record<string, typeof completeJadwalData>> = {};

  completeJadwalData.forEach((sch, idx) => {
    const day = sch.hari;
    const date = dayDateMap[day] || '2026-08-03';
    const cls = sch.kelas;

    if (!schedulesByDayAndClass[day]) {
      schedulesByDayAndClass[day] = {};
    }
    if (!schedulesByDayAndClass[day][cls]) {
      schedulesByDayAndClass[day][cls] = [];
    }
    schedulesByDayAndClass[day][cls].push(sch);

    // Find Teacher
    const guruMaster = initialGuru.find(g => g.nama === sch.guru) || {
      id: `gr-${sch.kodeGuru || '01'}`,
      nip: '19901017 202321 1 007',
      jabatan: 'Guru Mata Pelajaran',
      nama: sch.guru
    };

    // Find Class
    const kelasMaster = initialKelas.find(k => k.namaKelas === sch.kelas) || {
      id: 'kls-1',
      namaKelas: sch.kelas,
      jumlahLaki: 18,
      jumlahPerempuan: 18,
      ruang: sch.ruang
    };

    // Find Mapel
    const mapelMaster = initialMapel.find(m => m.namaMapel === sch.mapel) || {
      id: 'mpl-1',
      namaMapel: sch.mapel,
      fase: 'F' as const
    };

    // Find Students of this class
    const classStudents = initialSiswaFormatted.filter(s => s.kelas === sch.kelas);
    const totalSiswa = classStudents.length || (kelasMaster.jumlahLaki + kelasMaster.jumlahPerempuan);

    // Attendance breakdown - All present as requested ("absen siswa hadir semua")
    let hadir = totalSiswa;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;
    let terlambat = 0;

    const nonPresentList: AgendaGuruItem['siswaTidakHadir'] = [];

    const persentase = Math.round(((hadir) / totalSiswa) * 10000) / 100;
    const topic = getTopicForMapel(sch.mapel);

    // Build Agenda Guru Item
    const agendaGuru: AgendaGuruItem = {
      id: `ag-${sch.id}`,
      nomorAgenda: `AG/SMKN-BJG/2026/08/${String(idx + 1).padStart(3, '0')}`,
      tahunPelajaran: '2026/2027',
      semester: 'Ganjil',
      hari: day,
      tanggal: date,
      namaGuru: sch.guru,
      nip: guruMaster.nip,
      jabatan: guruMaster.jabatan,
      mapel: sch.mapel,
      konsentrasiKeahlian: sch.kelas.includes('APHP') ? 'Agribisnis Pengolahan Hasil Pertanian' : 'Desain Komunikasi Visual',
      fase: sch.kelas.startsWith('X ') ? 'E' : 'F',
      kelas: sch.kelas,
      rombel: `${sch.kelas}-A`,
      ruang: sch.ruang,
      jamKe: sch.jp,
      waktu: sch.waktu,
      jumlahJP: sch.jp.includes('-') ? (parseInt(sch.jp.split('-')[1]) - parseInt(sch.jp.split('-')[0]) + 1) : 1,
      statusPertemuan: 'Sesuai Jadwal',
      modaPembelajaran: 'Luring',

      // Foreign Keys
      id_jadwal: sch.id,
      id_guru: guruMaster.id,
      id_mapel: mapelMaster.id,
      id_kelas: kelasMaster.id,
      id_ruang: sch.ruang,
      id_materi: `mat-${sch.id}`,
      id_tugas: `tug-${sch.id}`,

      elemen: topic.elemen,
      cp: topic.cp,
      atp: topic.atp,
      tujuanPembelajaran: topic.tp,
      materi: topic.materi,
      modelPembelajaran: 'Discovery Learning & Project Based Learning (PjBL)',
      metode: 'Diskusi, Demonstrasi, Tanya Jawab, Praktik Langsung',
      pendekatan: 'Deep Learning & Student-Centered Approach',
      media: 'LCD Proyektor, Modul Digital SIMAGU, Laptop & PC Lab',
      sumberBelajar: 'Buku Teks Kurikulum Merdeka & Modul Pembelajaran SIMAGU',
      lkpd: `LKPD-${sch.kelas.replace(/\s+/g, '')}-${sch.jp}`,
      platformDigital: 'SIMAGU Web Portal & Google Classroom',
      asesmen: 'Asesmen Formatif (Penilaian Proses & Unjuk Kerja)',
      tugas: topic.tugas,
      deadlineTugas: date,
      statusPembelajaran: 'Selesai',

      totalSiswa: totalSiswa,
      hadir: hadir,
      sakit: sakit,
      izin: izin,
      alpa: alpa,
      terlambat: terlambat,
      persentaseKehadiran: persentase,
      siswaTidakHadir: nonPresentList,

      penilaian: [
        { jenisAsesmen: 'Formatif', rataRataNilai: 88, keterangan: `Evaluasi unjuk kerja ${sch.mapel}` },
        { jenisAsesmen: 'Praktik', rataRataNilai: 90, keterangan: 'Ketepatan penyelesaian LKPD' }
      ],

      kegiatanTambahan: ['Piket', 'Pembimbingan Siswa'],
      kendala: 'Secara umum pembelajaran berjalan sangat kondusif.',
      solusi: 'Pendampingan khusus bagi siswa yang butuh penguatan konsep.',
      siswaPendampingan: nonPresentList.length > 0 ? nonPresentList[0].nama : '-',
      sarana: 'LCD Proyektor & Peralatan Praktik dalam kondisi sangat baik.',
      refleksi: 'Siswa antusias mengikuti diskusi dan unjuk kerja praktik.',
      tindakLanjut: 'Pemberian pengayaan materi untuk pertemuan berikutnya.',
      komunikasiOrtu: nonPresentList.length > 0 ? `Konfirmasi via WA ortu ${nonPresentList[0].nama}` : 'Tidak ada catatan khusus',

      fotoUrls: [
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600&auto=format&fit=crop&q=80'
      ],
      statusValidasi: 'Disetujui',
      ttdGuru: sch.guru,
      ttdWakasek: 'Wahab Mughni Sa\'dillah, S.Pd.',
      tanggalValidasi: date
    };

    agendaGuruList.push(agendaGuru);

    // Generate Materi Record for this schedule
    materiList.push({
      id: `mat-${sch.id}`,
      nomorMateri: `MAT/2026/08/${String(idx + 1).padStart(3, '0')}`,
      hari: day,
      tanggal: date,
      mapel: sch.mapel,
      fase: sch.kelas.startsWith('X ') ? 'E' : 'F',
      kelas: sch.kelas,
      guru: sch.guru,
      elemen: topic.elemen,
      cp: topic.cp,
      atp: topic.atp,
      tujuanPembelajaran: topic.tp,
      judulMateri: topic.materi,
      ringkasanMateri: `Materi pembelajaran ${topic.materi} untuk kelas ${sch.kelas} disajikan secara interaktif menggunakan modul SIMAGU & panduan praktik.`,
      fileUrl: `https://drive.google.com/file/d/materi_${sch.id}/view`,
      lkpdUrl: `https://drive.google.com/file/d/lkpd_${sch.id}/view`,
      driveLink: `https://drive.google.com/drive/folders/materi_${sch.kelas.replace(/\s+/g, '')}`,
      status: 'Terpublikasi',
      id_jadwal: sch.id,
      id_guru: guruMaster.id,
      id_kelas: kelasMaster.id,
      id_mapel: mapelMaster.id
    });

    // Generate Tugas Record for this schedule
    tugasList.push({
      id: `tug-${sch.id}`,
      nomorTugas: `TUG/2026/08/${String(idx + 1).padStart(3, '0')}`,
      id_materi: `mat-${sch.id}`,
      hari: day,
      tanggal: date,
      mapel: sch.mapel,
      kelas: sch.kelas,
      guru: sch.guru,
      judulTugas: topic.tugas,
      instruksi: `Kerjakan tugas ${topic.tugas} sesuai petunjuk LKPD. Unggah hasil pekerjaan dalam format PDF / Berkas Digital ke portal SIMAGU.`,
      deadline: date,
      jenisTugas: sch.mapel.includes('DKV') || sch.mapel.includes('APHP') ? 'Praktik Studio / Lab' : 'Individu',
      totalSiswa: totalSiswa,
      totalMengumpulkan: Math.max(0, hadir - 1),
      fileLampiranUrl: `https://drive.google.com/file/d/tugas_${sch.id}/view`,
      driveFolderTask: `https://drive.google.com/drive/folders/tugas_${sch.kelas.replace(/\s+/g, '')}`,
      id_jadwal: sch.id,
      id_guru: guruMaster.id,
      id_kelas: kelasMaster.id,
      id_mapel: mapelMaster.id
    });

    // Generate student individual attendance & grade records
    classStudents.forEach(st => {
      let stStatus: AbsensiSiswaRecord['status'] = 'Hadir';
      let jamDatang = '07.00';
      let alasan = '';

      const foundAbs = nonPresentList.find(n => n.nis === st.nis);
      if (foundAbs) {
        stStatus = foundAbs.kategori;
        jamDatang = foundAbs.jamDatang || '07.00';
        alasan = foundAbs.alasan;
      }

      absensiSiswaList.push({
        id: `abssis-${sch.id}-${st.id}`,
        tanggal: date,
        kelas: sch.kelas,
        nis: st.nis,
        namaSiswa: st.nama,
        status: stStatus,
        jamDatang,
        alasan,
        dicatatOleh: sch.guru,
        id_siswa: st.id,
        id_kelas: kelasMaster.id,
        id_jadwal: sch.id,
        id_absensi: `abs-${sch.id}-${st.id}`
      });

      // Sample grades calculation
      const studentIndexSeed = (st.nis ? parseInt(st.nis.slice(-3)) : 10) + idx;
      const baseFormatif = 80 + (studentIndexSeed % 18);
      const basePraktik = 82 + ((studentIndexSeed * 3) % 17);
      const finalScore = Math.round((baseFormatif + basePraktik) / 2);
      const predikatVal = finalScore >= 90 ? 'A' : finalScore >= 80 ? 'B' : finalScore >= 70 ? 'C' : 'D';
      const isTuntas = finalScore >= 75;

      nilaiSiswaList.push({
        id: `nil-${sch.id}-${st.id}`,
        tanggal: date,
        hari: day,
        kelas: sch.kelas,
        nis: st.nis,
        namaSiswa: st.nama,
        mapel: sch.mapel,
        guru: sch.guru,
        jenisAsesmen: sch.mapel.includes('DKV') || sch.mapel.includes('APHP') ? 'Praktik / Unjuk Kerja' : 'Formatif (Tugas)',
        materiJudul: topic.materi,
        nilaiFormatif: 0,
        nilaiPraktik: 0,
        nilaiAkhir: 0,
        predikat: 'D',
        statusKelulusan: 'Remedial',
        catatanGuru: 'Belum diinput',
        id_siswa: st.id,
        id_kelas: kelasMaster.id,
        id_jadwal: sch.id,
        id_mapel: mapelMaster.id,
        id_guru: guruMaster.id,
        id_tugas: `tug-${sch.id}`
      });
    });
  });

  // Generate Absensi Guru (unique teachers per day)
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
  days.forEach((day, dayIdx) => {
    const date = dayDateMap[day];
    const teachersOnDay = new Set<string>();

    completeJadwalData.filter(s => s.hari === day).forEach(s => teachersOnDay.add(s.guru));

    Array.from(teachersOnDay).forEach((teacherName, tIdx) => {
      const guruObj = initialGuru.find(g => g.nama === teacherName);
      if (guruObj) {
        absensiGuruList.push({
          id: `absg-${date}-${guruObj.id}`,
          tanggal: date,
          nip: guruObj.nip,
          namaGuru: guruObj.nama,
          status: (tIdx === 3 && dayIdx === 2) ? 'Tugas Luar' : 'Hadir',
          jamMasuk: '06.45',
          jamKeluar: '15.30',
          keterangan: (tIdx === 3 && dayIdx === 2) ? 'Pendampingan Lomba / Workshop Kemitraan' : 'Hadir Tepat Waktu',
          lokasiGps: '-7.5812, 108.0123',
          ttdGuru: guruObj.nama,
          id_guru: guruObj.id
        });
      }
    });
  });

  // Generate Agenda Kelas (50 items: 10 classes x 5 days)
  const agendaKelasList: AgendaKelasItem[] = [];

  days.forEach(day => {
    const date = dayDateMap[day];

    initialKelas.forEach(k => {
      const classAgendas = agendaGuruList.filter(a => a.kelas === k.namaKelas && a.hari === day);
      const classStudents = initialSiswaFormatted.filter(s => s.kelas === k.namaKelas);
      const totalSiswa = k.jumlahLaki + k.jumlahPerempuan;

      // Extract all non-present students across sessions today
      const nonPresentMap = new Map<string, { nis: string; nama: string; kategori: 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'; jamDatang?: string; alasan: string }>();

      classAgendas.forEach(ca => {
        ca.siswaTidakHadir.forEach(sth => {
          nonPresentMap.set(sth.nis, {
            nis: sth.nis,
            nama: sth.nama,
            kategori: sth.kategori,
            jamDatang: sth.jamDatang,
            alasan: sth.alasan
          });
        });
      });

      const uniqueNonPresent = Array.from(nonPresentMap.values());
      let sakitCount = uniqueNonPresent.filter(s => s.kategori === 'Sakit').length;
      let izinCount = uniqueNonPresent.filter(s => s.kategori === 'Izin').length;
      let alpaCount = uniqueNonPresent.filter(s => s.kategori === 'Alpa').length;
      let terlambatCount = uniqueNonPresent.filter(s => s.kategori === 'Terlambat').length;
      let hadirCount = totalSiswa - sakitCount - izinCount - alpaCount;

      const persentaseVal = Math.round(((hadirCount) / totalSiswa) * 10000) / 100;

      // Violations list
      const pelanggaranList: AgendaKelasItem['pelanggaranList'] = [];
      uniqueNonPresent.filter(s => s.kategori === 'Alpa').forEach((a, aIdx) => {
        pelanggaranList.push({
          id: `pel-${date}-${a.nis}`,
          namaSiswa: a.nama,
          pelanggaran: `Tidak Hadir Tanpa Keterangan (Alpa) pada hari ${day}`,
          kategori: 'Sedang',
          poin: 10,
          guruPelapor: k.waliKelas,
          tindakan: 'Pemanggilan Orang Tua / Wali Siswa ke Sekolah',
          tindakLanjut: 'Surat Peringatan 1 & Pembinaan Guru BK'
        });
      });

      uniqueNonPresent.filter(s => s.kategori === 'Terlambat').forEach((t, tIdx) => {
        pelanggaranList.push({
          id: `pel-t-${date}-${t.nis}`,
          namaSiswa: t.nama,
          pelanggaran: `Terlambat Masuk Lingkungan Sekolah (${t.jamDatang || '07.25'})`,
          kategori: 'Ringan',
          poin: 2,
          guruPelapor: 'Guru Piket',
          tindakan: 'Teguran Lisan & Pembinaan Kebersihan Lingkungan',
          tindakLanjut: 'Pencatatan dalam Buku Saku Kedisiplinan Siswa'
        });
      });

      // Prestasi list (select 1 present student)
      const presentStudents = classStudents.filter(s => !uniqueNonPresent.some(np => np.nis === s.nis && np.kategori === 'Alpa'));
      const prestasiList: AgendaKelasItem['prestasiList'] = [];

      if (presentStudents.length > 0) {
        const topStudent = presentStudents[0];
        prestasiList.push({
          id: `pres-${date}-${topStudent.id}`,
          namaSiswa: topStudent.nama,
          bidang: k.namaKelas.includes('DKV') ? 'Desain Grafis & Presentasi Karya' : 'Pengolahan Pangan Hygiene',
          tingkat: 'Sekolah',
          juara: 'Nilai Formatif Teringgi & Siswa Teraktif',
          tanggal: date,
          keterangan: `Aktif berdiskusi dan menyelesaikan tugas praktik ${classAgendas[0]?.mapel || 'Pembelajaran'} dengan nilai sempurna.`
        });
      }

      // Monitoring pembelajaran list per JP
      const monitoringPembelajaran = classAgendas.map(ca => ({
        jp: ca.jamKe,
        mapel: ca.mapel,
        guru: ca.namaGuru,
        materi: ca.materi,
        tugas: ca.tugas,
        status: 'Terlaksana' as const
      }));

      // Classroom master inventory
      const roomInventaris = masterInventarisMap[k.ruang] || [
        { barang: 'Papan Tulis Whiteboard', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Kondisi baik' },
        { barang: 'Meja & Kursi Siswa Set', jumlah: totalSiswa, baik: totalSiswa, rusakRingan: 0, rusakBerat: 0, keterangan: 'Lengkap & rapi' },
        { barang: 'AC / Kipas Angin', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Berfungsi normal' }
      ];

      agendaKelasList.push({
        id: `ak-${date}-${k.id}`,
        nomorAgenda: `AK/${k.namaKelas.replace(/\s+/g, '')}/2026/08/${date.split('-')[2]}`,
        tahunPelajaran: '2026/2027',
        semester: 'Ganjil',
        hari: day,
        tanggal: date,
        kelas: k.namaKelas,
        jurusan: k.jurusan,
        konsentrasiKeahlian: k.namaKelas.includes('APHP') ? 'Agribisnis Pengolahan Hasil Pertanian' : 'Desain Komunikasi Visual',
        waliKelas: k.waliKelas,
        ketuaKelas: k.ketuaKelas,
        wakilKetua: k.wakilKetua,
        jumlahSiswa: totalSiswa,
        jumlahLaki: k.jumlahLaki,
        jumlahPerempuan: k.jumlahPerempuan,

        // Foreign Keys
        id_kelas: k.id,
        id_guru_wali: initialGuru.find(g => g.nama === k.waliKelas)?.id || 'gr-01',
        id_ruang: k.ruang,

        hadir: hadirCount,
        sakit: sakitCount,
        izin: izinCount,
        alpa: alpaCount,
        terlambat: terlambatCount,
        persentase: persentaseVal,
        siswaTidakHadir: uniqueNonPresent,

        monitoringPembelajaran,

        agendaRoutine: [
          { waktu: '06.45', kegiatan: 'Piket Kebersihan & Kerapihan Kelas', status: 'Terlaksana', catatan: 'Ruang kelas bersih dan nyaman' },
          { waktu: '07.00', kegiatan: 'Apel / Pembiasaan Doa Bersama & Menyanyikan Lagu Nasional', status: 'Terlaksana' },
          { waktu: '07.15', kegiatan: 'Literasi Al-Qur\'an / Pembacaan Buku Kedisiplinan', status: 'Terlaksana' },
          { waktu: '12.00', kegiatan: 'Sholat Dzuhur Berjamaah & Istirahat', status: 'Terlaksana' },
          { waktu: '15.30', kegiatan: 'Operasi Semut (Kebersihan Akhir) & Doa Pulang', status: 'Terlaksana' }
        ],

        pelanggaranList,
        prestasiList,

        kesehatanList: uniqueNonPresent.filter(s => s.kategori === 'Sakit').map((s, idx) => ({
          id: `kes-${date}-${idx}`,
          namaSiswa: s.nama,
          kondisi: 'Kurang Sehat / Demam ringan',
          tindakan: 'Istirahat di ruang UKS & diberikan suplemen / dijemput ortu',
          petugas: 'Tim PMR & Wali Kelas'
        })),

        inventarisList: roomInventaris,

        komunikasiOrtuList: uniqueNonPresent.filter(s => s.kategori === 'Alpa' || s.kategori === 'Sakit').map(s => ({
          tanggal: date,
          namaOrtuSiswa: `Orang Tua ${s.nama.split(' ')[0]}`,
          media: 'WhatsApp' as const,
          keperluan: `Konfirmasi Kehadiran & Catatan ${s.kategori} Siswa`,
          hasil: 'Orang tua bersedia memberikan keterangan resmi dan mendampingi siswa',
          petugas: k.waliKelas
        })),

        catatanWaliKelas: {
          kondisiUmum: `Proses pembelajaran kelas ${k.namaKelas} hari ${day} berjalan sangat baik dengan tingkat kehadiran ${persentaseVal}%.`,
          kedisiplinan: 'Siswa dapat hadir tepat waktu serta mengikuti aturan kedisiplinan sekolah.',
          budayaPositif: 'Budaya 5S (Senyum, Salam, Sapa, Sopan, Santun) terjaga sangat baik.',
          kebersihan: 'Kondisi kebersihan ruang kelas terjaga dengan baik sesuai piket harian.',
          keamanan: 'Seluruh inventaris dalam kondisi aman dan terkunci setelah jam sekolah.',
          siswaBermasalah: alpaCount > 0 ? `${uniqueNonPresent.find(s => s.kategori === 'Alpa')?.nama} (Alpa)` : 'Tidak ada',
          siswaBerprestasi: prestasiList.length > 0 ? prestasiList[0].namaSiswa : 'Siswa aktif kelas',
          tindakLanjut: 'Pemantauan berkesinambungan oleh Wali Kelas dan Guru BK.'
        },

        validatedByWali: true,
        tanggalValidasiWali: date,
        ttdKetuaKelas: k.ketuaKelas,
        ttdWaliKelas: k.waliKelas
      });
    });
  });

  // Generate Supervisi Records (1-2 per day)
  days.forEach((day, dIdx) => {
    const date = dayDateMap[day];
    const dayAgendas = agendaGuruList.filter(a => a.hari === day);

    if (dayAgendas.length > 0) {
      const selected = dayAgendas[dIdx % dayAgendas.length];
      supervisiList.push({
        id: `spv-202608-${dIdx + 1}`,
        nomorSupervisi: `SPV/SMKN-BJG/2026/08/0${dIdx + 1}`,
        tanggal: date,
        namaGuru: selected.namaGuru,
        nip: selected.nip,
        supervisor: dIdx % 2 === 0 ? 'Wahab Mughni Sa\'dillah, S.Pd.' : 'Iman Rahmat, S.Pd.I.',
        mapel: selected.mapel,
        kelas: selected.kelas,
        skorPerencanaan: 94 + (dIdx % 5),
        skorPelaksanaan: 92 + (dIdx % 4),
        skorEvaluasi: 93 + (dIdx % 3),
        skorAkhir: Math.round(((94 + (dIdx % 5) + 92 + (dIdx % 4) + 93 + (dIdx % 3)) / 3) * 100) / 100,
        predikat: 'Sangat Baik',
        catatanSupervisor: `Penguasaan materi ${selected.mapel}, penggunaan modul digital SIMAGU, dan manajemen kelas ${selected.kelas} sangat baik dan terstruktur.`,
        rekomendasi: 'Dipertahankan dan dijadikan contoh pengimbasan untuk guru-guru sejawat.',
        status: 'Selesai',
        ttdSupervisor: dIdx % 2 === 0 ? 'Wahab Mughni Sa\'dillah, S.Pd.' : 'Iman Rahmat, S.Pd.I.',
        ttdGuru: selected.namaGuru,
        id_guru: selected.id_guru,
        id_jadwal: selected.id_jadwal,
        id_kelas: selected.id_kelas,
        id_mapel: selected.id_mapel
      });
    }
  });

  // Generate Notifications
  const weeklyNotifications: NotificationItem[] = [
    {
      id: 'notif-w1',
      title: 'Data Operasional Mingguan Terintegrasi',
      message: 'Seluruh data operasional 1 minggu (Senin - Jumat) berhasil terintegrasi secara otomatis berdasarkan master data SMKN Bojonggambir.',
      type: 'success',
      timestamp: '2026-08-07 16:00',
      read: false
    },
    {
      id: 'notif-w2',
      title: 'Peringatan Kedisiplinan & Alpa',
      message: 'Sistem mencatat data Alpa dan Terlambat siswa secara otomatis ke modul Disiplin & Pelanggaran.',
      type: 'alert',
      timestamp: '2026-08-03 08:30',
      read: false,
      targetRole: 'Wali Kelas'
    }
  ];

  // Generate Audit Logs
  const weeklyAuditLogs: AuditLogItem[] = [
    {
      id: 'log-w1',
      timestamp: '2026-08-04 07:15:30',
      user: 'Wahab Mughni Sa\'dillah, S.Pd.',
      role: 'Wakasek Kurikulum',
      action: 'UPDATE_SETTING',
      details: 'Memperbarui konfigurasi Kalender Akademik, Jadwal Pembelajaran, dan Struktur Kurikulum Merdeka Fase E & F Tahun Ajaran 2026/2027.',
      ipAddress: '192.168.1.105'
    },
    {
      id: 'log-w2',
      timestamp: '2026-08-03 14:22:10',
      user: 'Ilfan Fauzi, S.Pd.',
      role: 'Wakasek Kesiswaan',
      action: 'UPDATE_SETTING',
      details: 'Memperbarui aturan kedisiplinan kesiswaan, tata tertib kehadiran, dan rekapitulasi poin pelanggaran siswa.',
      ipAddress: '192.168.1.112'
    },
    {
      id: 'log-w3',
      timestamp: '2026-08-03 11:05:44',
      user: 'Wahab Mughni Sa\'dillah, S.Pd.',
      role: 'Wakasek Kurikulum',
      action: 'CREATE_USER',
      details: 'Menambahkan akun guru baru: Dede Adi Selamet M., S.Kom. (NIP: 19930621 202521 1 118, Pengampu Informatika).',
      ipAddress: '192.168.1.105'
    },
    {
      id: 'log-w4',
      timestamp: '2026-08-03 09:40:12',
      user: 'Ilfan Fauzi, S.Pd.',
      role: 'Wakasek Kesiswaan',
      action: 'UPDATE_USER',
      details: 'Menetapkan Seni Sri Astuti, S.Pd. sebagai Wali Kelas XI APHP dan mengaktifkan notifikasi Orang Tua WhatsApp.',
      ipAddress: '192.168.1.112'
    },
    {
      id: 'log-w5',
      timestamp: '2026-08-02 16:30:00',
      user: 'Administrator SIMAGU',
      role: 'Administrator',
      action: 'BACKUP_DATABASE',
      details: 'Melakukan ekspor cadangan penuh database lokal SIMAGU (.json) untuk arsip keabsahan data.',
      ipAddress: '127.0.0.1'
    },
    {
      id: 'log-w6',
      timestamp: '2026-08-02 13:10:05',
      user: 'Wahab Mughni Sa\'dillah, S.Pd.',
      role: 'Wakasek Kurikulum',
      action: 'UPDATE_SETTING',
      details: 'Memperbarui format Kop Surat PDF Resmi & Nomor NPSN Sekolah (69989796).',
      ipAddress: '192.168.1.105'
    },
    {
      id: 'log-w7',
      timestamp: '2026-08-01 08:00:00',
      user: 'System Integrator SIMAGU',
      role: 'Administrator',
      action: 'INIT_SYSTEM',
      details: 'Inisialisasi sistem SIMAGU SMKN Bojonggambir dan verifikasi skema database lokal.',
      ipAddress: '127.0.0.1'
    }
  ];

  return {
    agendaGuruList,
    agendaKelasList,
    absensiGuruList,
    absensiSiswaList,
    supervisiList,
    materiList,
    tugasList,
    nilaiSiswaList,
    weeklyNotifications,
    weeklyAuditLogs
  };
}

import { 
  AgendaGuruItem, 
  AgendaKelasItem, 
  AbsensiGuruRecord, 
  AbsensiSiswaRecord, 
  SupervisiRecord, 
  MateriRecord, 
  TugasRecord, 
  NilaiSiswaRecord, 
  NotificationItem, 
  AuditLogItem,
  GuruItem,
  KelasItem,
  MapelItem,
  JurusanItem
} from '../types';
import { completeJadwalData } from './jadwalData';
import { initialSiswaFormatted } from './siswaData';

// 15 Hari Sekolah Aktif dari 15 Juli 2026 sampai 4 Agustus 2026
export interface SchoolDateInfo {
  date: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat';
  weekNum: number;
  weekLabel: string;
}

export const schoolDatesList: SchoolDateInfo[] = [
  // Minggu 1
  { date: '2026-07-15', day: 'Rabu', weekNum: 1, weekLabel: 'Minggu 1' },
  { date: '2026-07-16', day: 'Kamis', weekNum: 1, weekLabel: 'Minggu 1' },
  { date: '2026-07-17', day: 'Jumat', weekNum: 1, weekLabel: 'Minggu 1' },
  // Minggu 2
  { date: '2026-07-20', day: 'Senin', weekNum: 2, weekLabel: 'Minggu 2' },
  { date: '2026-07-21', day: 'Selasa', weekNum: 2, weekLabel: 'Minggu 2' },
  { date: '2026-07-22', day: 'Rabu', weekNum: 2, weekLabel: 'Minggu 2' },
  { date: '2026-07-23', day: 'Kamis', weekNum: 2, weekLabel: 'Minggu 2' },
  { date: '2026-07-24', day: 'Jumat', weekNum: 2, weekLabel: 'Minggu 2' },
  // Minggu 3
  { date: '2026-07-27', day: 'Senin', weekNum: 3, weekLabel: 'Minggu 3' },
  { date: '2026-07-28', day: 'Selasa', weekNum: 3, weekLabel: 'Minggu 3' },
  { date: '2026-07-29', day: 'Rabu', weekNum: 3, weekLabel: 'Minggu 3' },
  { date: '2026-07-30', day: 'Kamis', weekNum: 3, weekLabel: 'Minggu 3' },
  { date: '2026-07-31', day: 'Jumat', weekNum: 3, weekLabel: 'Minggu 3' },
  // Minggu 4
  { date: '2026-08-03', day: 'Senin', weekNum: 4, weekLabel: 'Minggu 4' },
  { date: '2026-08-04', day: 'Selasa', weekNum: 4, weekLabel: 'Minggu 4' },
  // Minggu 8 (Awal September 2026)
  { date: '2026-09-07', day: 'Senin', weekNum: 4, weekLabel: 'Minggu 8' },
];

export interface MapelTopicDetail {
  materi: string;
  tp: string;
  atp: string;
  tugas: string;
  kegiatan: string;
  metode: string;
  media: string;
}

export function getTopicForMapel(mapelName: string, weekNum: number = 1): MapelTopicDetail {
  const m = mapelName.toLowerCase();

  if (m.includes('agama') || m.includes('pabp')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Q.S. Al-Ma'idah/5: 48 dan Etos Kerja Muslim dalam Kehidupan",
        tp: "Menganalisis makna Q.S. Al-Ma'idah/5: 48 tentang berkompetisi dalam kebaikan serta membiasakan etos kerja mulia.",
        atp: "Membaca dengan tartil, menelaah asbabun nuzul, mengidentifikasi hukum tajwid, dan merumuskan implementasi etos kerja.",
        tugas: "Menulis ayat beserta terjemahan dan menyusun refleksi etos kerja pribadi.",
        kegiatan: "Tadarus bersama, bedah tajwid berkelompok, pemaparan tafsir ayat, dan diskusi studi kasus integritas kerja.",
        metode: "Tadarus Berkelompok & Problem-Based Learning",
        media: "Al-Qur'an Mushaf Standar, Slide PPT Asbabun Nuzul, LKPD Tajwid"
      },
      2: {
        materi: "Syu'abul Iman (Cabang-Cabang Iman) dan Karakter Kejujuran Remaja",
        tp: "Memahami 77 cabang iman dengan fokus pilar keimanan lisan dan perbuatan dalam pergaulan sekolah kejuruan.",
        atp: "Mengklasifikasikan dimensi ma'rifatun bil qalbi, ikrarun bil lisan, dan amalun bil arkan.",
        tugas: "Membuat peta konsep Syu'abul Iman dan jurnal evaluasi ibadah harian.",
        kegiatan: "Refleksi diri, pemetaan konsep cabang iman, telaah hadis shahih, dan perumusan komitmen integritas.",
        metode: "Inquiry Learning & Diskusi Nilai Karakter",
        media: "Modul PABP Digital, Video Inspirasi Karakter, Lembar Refleksi Diri"
      },
      3: {
        materi: "Prinsip Muamalah Islam: Akad Jual Beli, Syirkah, dan Larangan Riba",
        tp: "Menganalisis prinsip fikih muamalah kontemporer yang adil, transparan, dan terbebas dari transaksi ribawi.",
        atp: "Menelaah rukun jual beli, bentuk kerja sama syirkah/mudharabah, dan implementasinya di unit produksi sekolah.",
        tugas: "Analisis studi kasus akad pembiayaan syariah vs konvensional pada UMKM.",
        kegiatan: "Simulasi transaksi jual beli syariah di kelas, telaah fatwa DSN-MUI, dan perancangan SOP transaksi halal.",
        metode: "Role Playing & Case Study",
        media: "Buku Teks Fikih Muamalah, Dokumen Contoh Akad Jual Beli Syariah"
      },
      4: {
        materi: "Toleransi Beragama dan Kerukunan Sosial dalam Bingkai Keindonesiaan",
        tp: "Menerapkan sikap tasamuh (toleransi) antarsesama dan merawat persaudaraan kebangsaan (ukhuwah wathaniyah).",
        atp: "Mengkaji ayat-ayat tasamuh (Q.S. Al-Kafirun dan Yunus: 40-41) dan implementasi moderasi beragama.",
        tugas: "Penyusunan esai pendek tentang penguatan kerukunan antarpelajar di Tasikmalaya Selatan.",
        kegiatan: "Diskusi panel moderasi beragama, analisis video keberagaman nusantara, dan pembuatan poster pesan damai.",
        metode: "Project-Based Learning & Diskusi Terbimbing",
        media: "Poster Kerukunan, Video Dokumenter Moderasi Beragama, Rubrik Penilaian Portofolio"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('indonesia')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Struktur dan Ciri Kebahasaan Teks Laporan Hasil Observasi (LHO)",
        tp: "Mengidentifikasi gagasan pokok, struktur definisi umum, deskripsi bagian, dan deskripsi manfaat dalam teks LHO.",
        atp: "Menganalisis kalimat definisi, kalimat deskripsi, serta penggunaan verba dan nomina teknis kejuruan.",
        tugas: "Menentukan struktur teks LHO 'Fasilitas Studio Desain Komunikasi Visual'.",
        kegiatan: "Membaca kritis teks contoh, menandai struktur teks dengan kode warna, dan diskusi pleno kaidah kebahasaan.",
        metode: "Discovery Learning & Analisis Teks Kritis",
        media: "Teks LHO Cetak, Proyektor LCD, Lembar Kerja Bedah Struktur"
      },
      2: {
        materi: "Kaidah Kebahasaan Teks LHO: Kalimat Simpleks, Kompleks, dan Imbuhan",
        tp: "Menganalisis ketepatan kalimat simpleks, kompleks bertingkat, konjungsi sebab-akibat, dan afiksasi baku.",
        atp: "Menyunting kalimat tidak baku dan mereduksi ketaksaan (ambiguitas) dalam laporan teknis bengkel.",
        tugas: "Menyunting teks laporan observasi yang memuat 10 kesalahan ejaan EBI.",
        kegiatan: "Latihan menyunting teks berbantuan Kamus Besar Bahasa Indonesia (KBBI daring) dan PUEBI interaktif.",
        metode: "Problem-Solving & Peer Editing",
        media: "KBBI Daring, Aplikasi EBI Interaktif, LKPD Penyuntingan Teks"
      },
      3: {
        materi: "Observasi Lapangan dan Penyusunan Kerangka Teks Laporan Observasi",
        tp: "Melakukan pengamatan objek nyata di lingkungan sekolah dan menyusun draf laporan observasi yang faktual.",
        atp: "Merancang instrumen observasi, mencatat data primer di RPS/Bengkel, dan mengembangkan kerangka tulisan.",
        tugas: "Pengambilan data observasi di Unit Pengolahan APHP / Studio DKV.",
        kegiatan: "Kunjungan terarah ke laboratorium/bengkel sekolah, pencatatan fakta empiris, dan penyusunan draf awal.",
        metode: "Field Trip Observasi & Penulisan Terbimbing",
        media: "Kamera Ponsel, Papan Klip Observasi, Format Draf Teks LHO"
      },
      4: {
        materi: "Penyajian Lisan dan Publikasi Digital Teks Laporan Hasil Observasi",
        tp: "Mempresentasikan teks LHO secara lisan dengan intonasi artikulatif serta mengemasnya dalam format infografik.",
        atp: "Melatih public speaking laporan teknis dan mengonversi paragraf laporan menjadi ringkasan infografik visual.",
        tugas: "Presentasi kelompok 5 menit dan mengunggah infografik ke mading digital sekolah.",
        kegiatan: "Presentasi bergiliran antarkelompok, umpan balik konstruktif teman sejawat, dan evaluasi guru.",
        metode: "Project-Based Learning & Presentasi Unjuk Kerja",
        media: "Slide Presentasi Canva, Layar LCD, Rubrik Penilaian Berbicara"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('matematika')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Konsep Matriks, Notasi Elemen, dan Kesamaan Dua Matriks",
        tp: "Memahami konsep matriks sebagai tabel representasi data dan mengidentifikasi ordo serta letak elemen.",
        atp: "Menentukan ordo matriks dari data tabel produksi bengkel dan menguji kesamaan dua matriks berordo sama.",
        tugas: "Mengerjakan 5 soal pemodelan data inventaris bengkel ke dalam bentuk matriks.",
        kegiatan: "Mengubah data tabel persediaan bahan baku menjadi matriks, identifikasi baris dan kolom, serta latihan terbimbing.",
        metode: "Contextual Teaching and Learning (CTL)",
        media: "Papan Tulis Berpetak, Modul Matriks SMK, LKPD Pemodelan Data"
      },
      2: {
        materi: "Operasi Aljabar Matriks: Penjumlahan, Pengurangan, dan Perkalian Skalar",
        tp: "Menerapkan sifat komutatif dan asosiatif pada operasi penjumlahan, pengurangan, serta perkalian matriks dengan skalar.",
        atp: "Menyelesaikan perhitungan aritmetika matriks bertingkat pada konteks biaya operasional unit usaha.",
        tugas: "Penyelesaian 6 latihan operasi matriks dan analisis ordo hasil operasi.",
        kegiatan: "Demonstrasi rumus di papan tulis, simulasi perhitungan biaya bahan, dan kuis cepat interaktif.",
        metode: "Direct Instruction & Latihan Terbimbing Berjenjang",
        media: "Slide Formula Matriks, Lembar Kuis Cepat, LKPD Operasi Matriks"
      },
      3: {
        materi: "Perkalian Dua Matriks dan Syarat Kesesuaian Ordo Matriks",
        tp: "Menguasai prinsip perkalian baris kali kolom dan mengidentifikasi syarat perkalian matriks AxB.",
        atp: "Mengalikan matriks ordo 2x2, 2x3, dan 3x2 serta membuktikan sifat non-komutatif perkalian matriks.",
        tugas: "Mengerjakan studi kasus perkalian matriks kebutuhan stok kemasan produk.",
        kegiatan: "Teknik 'jari menelusuri baris dan kolom', kerja kelompok memecahkan persoalan matriks, dan pembahasan bersama.",
        metode: "Cooperative Learning Tipe STAD",
        media: "Kartu Matriks Warna, LKPD Perkalian Matriks, Software Geogebra"
      },
      4: {
        materi: "Determinan dan Invers Matriks Ordo 2x2 dalam Pemecahan Masalah",
        tp: "Menghitung determinan dan invers matriks persegi 2x2 serta menerapkannya pada Sistem Persamaan Linear (SPLDV).",
        atp: "Menggunakan aturan Cramer dan metode invers matriks untuk mencari harga satuan barang kejuruan.",
        tugas: "Menyelesaikan SPLDV sistem penetapan harga produk olahan pangan dengan invers matriks.",
        kegiatan: "Penurunan rumus determinan, demonstrasi invers ad-bc, serta pemecahan masalah kontekstual kejuruan.",
        metode: "Problem-Based Learning & Asesmen Formatif",
        media: "Kalkulator Saintifik, LKPD Invers Matriks, Soal Asesmen Mandiri"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('inggris')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Workplace Introduction and Professional Greetings in Vocational Context",
        tp: "Menggunakan ungkapan perkenalan diri profesional dan etika menyapa mitra kerja dalam bahasa Inggris baku.",
        atp: "Membedakan formal vs informal greetings, menyusun perkenalan profil keahlian diri (DKV / APHP).",
        tugas: "Merekam video monolog perkenalan diri bahasa Inggris berdurasi 60 detik.",
        kegiatan: "Listening audio native speaker, latihan pelafalan (pronunciation drill), dan role-play perkenalan berpasangan.",
        metode: "Communicative Language Teaching (CLT)",
        media: "Audio Dialog Percakapan, Kartu Peran Profesi, Rubrik Speaking"
      },
      2: {
        materi: "Asking and Giving Opinions regarding Design / Production Quality",
        tp: "Mengekspresikan pendapat, persetujuan, dan ketidaksetujuan secara santun terkait hasil karya desain/produk pangan.",
        atp: "Menggunakan modalitas 'In my opinion...', 'I strongly agree...', 'Could you consider improving...'.",
        tugas: "Membuat dialog 8 pertukaran tentang review mockup logo atau sampel produk jus buah.",
        kegiatan: "Analisis dialog contoh, identifikasi frase kunci opini, simulasi diskusi review produk di studio/lab.",
        metode: "Task-Based Language Learning",
        media: "Sampel Karya Desain & Produk, Handout Frase Bahasa Inggris"
      },
      3: {
        materi: "Reading and Understanding Procedural Manuals / Technical Specs",
        tp: "Memahami teks prosedur keselamatan kerja, panduan instalasi mesin, dan spesifikasi teknis peralatan bengkel.",
        atp: "Mengidentifikasi imperative verbs, sequence markers (First, Next, Then, Finally), dan kosakata teknis.",
        tugas: "Menjawab 5 pertanyaan pemahaman teks manual mesin pres hidrolik / software grafis.",
        kegiatan: "Skimming dan scanning teks manual teknis, mencocokkan istilah dengan gambar alat, dan ringkasan langkah kerja.",
        metode: "Inquiry Reading & Vocabulary Building",
        media: "Buku Manual Mesin Asli, Kamus Istilah Kejuruan Bahasa Inggris"
      },
      4: {
        materi: "Simulated Job Interview and Pitching Vocational Project Portfolios",
        tp: "Menjawab pertanyaan standar wawancara kerja teknis dan mempresentasikan portofolio kejuruan dalam bahasa Inggris.",
        atp: "Mempersiapkan jawaban STAR method (Situation, Task, Action, Result) untuk wawancara magang industri.",
        tugas: "Simulasi wawancara kerja 3 menit di depan kelas berpasangan.",
        kegiatan: "Penyusunan naskah jawaban wawancara, gladi resik gestur tubuh dan intonasi, serta performa berpasangan.",
        metode: "Role-Playing Simulation & Asesmen Unjuk Kerja",
        media: "Daftar Pertanyaan Wawancara HRD, Lembar Evaluasi Speaking"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('sejarah')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Jalur Rempah Nusantara dan Masuknya Bangsa Barat ke Indonesia",
        tp: "Menganalisis keterkaitan kekayaan komoditas rempah nusantara dengan motivasi 3G penjelajahan samudra bangsa Eropa.",
        atp: "Menelaah peta jalur perdagangan rempah maritim dan kedatangan Portugis, Spanyol, serta VOC di Indonesia.",
        tugas: "Menggambar sketsa rute rempah nusantara dan menuliskan 5 komoditas unggulan rempah lokal.",
        kegiatan: "Menyimak tayangan peta maritim kuno, telaah narasi buku teks, dan diskusi faktor pemicu monopoli dagang.",
        metode: "Discovery Learning & Diskusi Kesejarahan",
        media: "Peta Jalur Maritim, Slide PPT Jalur Rempah, Lembar Kerja Analisis"
      },
      2: {
        materi: "Politik Etis dan Lahirnya Kaum Terdidik di Awal Abad ke-20",
        tp: "Mengevaluasi dampak pelaksanaan Politik Etis (Edukasi, Irigasi, Emigrasi) terhadap kemunculan golongan cendekiawan.",
        atp: "Menghubungkan pendirian sekolah kedokteran STOVIA dan sekolah kejuruan dengan gerakan kebangkitan nasional.",
        tugas: "Membuat biografi singkat tokoh pelopor pendidikan dan pergerakan Budi Utomo.",
        kegiatan: "Analisis sumber primer artikel pers zaman kolonial dan debat peran kaum terpelajar bagi perubahan bangsa.",
        metode: "Historical Inquiry & Debat Akademik",
        media: "Arsip Foto Sekolah Zaman Hindia Belanda, Buku Sejarah Nasional"
      },
      3: {
        materi: "Sumpah Pemuda 1928 dan Kristalisasi Identitas Persatuan Bangsa",
        tp: "Menginternalisasi nilai persatuan dan semangat kepemudaan dalam ikrar Kongres Pemuda II 28 Oktober 1928.",
        atp: "Mengkaji latar belakang kepanduan pemuda kedaerahan melebur menjadi satu tumpah darah, bangsa, dan bahasa persatuan.",
        tugas: "Menulis artikel refleksi: 'Relevansi Sumpah Pemuda bagi Generasi Z SMK di Era Kecerdasan Buatan'.",
        kegiatan: "Pembacaan teks asli Sumpah Pemuda, pemutaran lagu Indonesia Raya tiga stanza, dan diskusi esensi persatuan.",
        metode: "Contextual Learning & Diskusi Nilai Karakter",
        media: "Rekaman Pidato Kongres Pemuda, Lembar Refleksi Kebangsaan"
      },
      4: {
        materi: "Dampak Pendudukan Militer Jepang dan Gerakan Bawah Tanah Kemerdekaan",
        tp: "Menganalisis dampak eksploitasi militer Romusha dan struktur pertahanan bentukan Jepang terhadap kesiapan kemerdekaan.",
        atp: "Menelaah pembentukan PETA, Heiho, BPUPKI, dan strategi diplomasi para tokoh pendiri bangsa.",
        tugas: "Menyusun linimasa kronologis peristiwa dari Maklumat Rengasdengklok hingga 17 Agustus 1945.",
        kegiatan: "Penyusunan garis waktu peristiwa (timeline chart) berkelompok dan pemaparan di depan kelas.",
        metode: "Cooperative Learning & Pembuatan Infografik Garis Waktu",
        media: "Slide Linimasa BPUPKI, Foto Bersejarah Proklamasi, LKPD Sejarah"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('pancasila') || m.includes('ppkn')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Hakikat Nilai-Nilai Pancasila sebagai Dasar Negara dan Pandangan Hidup",
        tp: "Menelaah kedudukan Pancasila sebagai ideologi terbuka dan panduan moral dalam tata kelola hukum dan kemasyarakatan.",
        atp: "Membedakan nilai dasar, nilai instrumental, dan nilai praksis dalam sila-sila Pancasila.",
        tugas: "Membuat tabel komparasi implementasi nilai instrumental dalam tata tertib sekolah kejuruan.",
        kegiatan: "Kajian pasal UUD NRI 1945, diskusi studi kasus intoleransi di media sosial, dan perumusan solusi berasas Pancasila.",
        metode: "Problem-Based Learning & Diskusi Kasus",
        media: "Buku Teks PPKn, Dokumen UUD NRI 1945, LKPD Nilai Praksis"
      },
      2: {
        materi: "Hierarki Peraturan Perundang-Undangan di Indonesia (UU No. 12 Tahun 2011)",
        tp: "Memahami tata urutan peraturan perundangan dari UUD 1945 hingga Peraturan Daerah serta asas keadilan hukum.",
        atp: "Menganalisis prinsip 'Lex superior derogat legi inferiori' dan pengujian materi perundang-undangan di MK/MA.",
        tugas: "Menyusun skema piramida hierarki hukum nasional dan analisis satu contoh perda bermasalah.",
        kegiatan: "Pemetaan hierarki peraturan menggunakan bagan visual piramida dan analisis yurisprudensi sederhana.",
        metode: "Inquiry Learning & Analisis Regulasi",
        media: "Slide Infografik Hukum Nasional, Lembar Analisis Regulasi"
      },
      3: {
        materi: "Perlindungan dan Penegakan Hak Asasi Manusia (HAM) dalam Konstitusi",
        tp: "Menganalisis instrumen penegakan HAM nasional dan upaya pencegahan pelanggaran HAM di lingkungan pendidikan.",
        atp: "Mengkaji Pasal 28A-28J UUD 1945 serta peran lembaga independen seperti Komnas HAM dan Komisi Perlindungan Anak.",
        tugas: "Membuat deklarasi anti-bullying dan anti-kekerasan di lingkungan kelas dan bengkel praktik.",
        kegiatan: "Simulasi sidang mediasi perkara perselisihan antarsiswa dan penyusunan pakta integritas kelas anti-perundungan.",
        metode: "Simulasi Mediasi & Role-Playing",
        media: "Pakta Integritas Kelas, Video Kampanye Anti-Bullying, Rubrik Observasi"
      },
      4: {
        materi: "Budaya Hukum, Kepatuhan Lalu Lintas, dan Etika Digital Warga Negara",
        tp: "Membangun kesadaran tertib hukum berlalu lintas dan etika bersuara di ruang publik siber (UU ITE).",
        atp: "Mengevaluasi kasus pelanggaran privasi, hoaks, dan keselamatan berkendara bagi pelajar SMK usia produktif.",
        tugas: "Penyusunan poster literasi digital: 'Cerdas dan Bijak Bermedsos Pelajar SMK Berkarakter'.",
        kegiatan: "Bedah kasus penyebaran konten hoaks, kampanye keselamatan berkendara (safety riding), dan publikasi poster.",
        metode: "Project-Based Learning & Asesmen Karya Kreatif",
        media: "Slide Bedah Kasus UU ITE, Poster Safety Riding, Software Desain Canva"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('sunda')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Wangun jeung Adegan Teks Biantara (Pidato Basa Sunda)",
        tp: "Mikawanoh struktur bubuka, eusi, jeung panutup biantara sarta ngalarapkeun basa Sunda anu merenah.",
        atp: "Nganalisis unsur kalimah pananya, mukadimah salam, nepikeun harepan, jeung pamenta hampura dina biantara.",
        tugas: "Nuliskeun draf bubuka biantara pikeun kagiatan Paturay Tineung atawa Mimitian Semester.",
        kegiatan: "Maca babarengan conto teks biantara, nyatet kekecapan heubeul, jeung latihan lafal undak-usuk basa.",
        metode: "Metode Demonstrasi & Latihan Terbimbing",
        media: "Buku Pangrumat Basa Sunda, Rekaman Audio Biantara Pasanggiri"
      },
      2: {
        materi: "Undak-Usuk Basa Sunda: Basa Loma jeung Basa Hormat (Lemes)",
        tp: "Nerapkeun tatakrama basa Sunda luyu jeung panyatur, pamiarsa, sarta suasana komunikasi.",
        atp: "Ngabedakeun ragam basa loma, basa lemes keur sorangan, jeung basa lemes keur batur.",
        tugas: "Ngarobah 10 kalimah loma jadi kalimah lemes keur batur jeung keur sorangan.",
        kegiatan: "Latihan ngalarapkeun kosakata lemes dina dialog sapopoe di lingkungan sakola jeung kulawarga.",
        metode: "Cooperative Learning & Role Play Dialog Tatakrama",
        media: "Tabel Kamus Undak-Usuk Basa, Kartu Kalimah Tatakrama"
      },
      3: {
        materi: "Nulis jeung Maca Carpon (Carita Pondok) Dumasar Pangalaman Pribadi",
        tp: "Ngarang carita pondok anu mibanda tema kahirupan nonoman kalayan merhatikeun galur, palaku, jeung latar.",
        atp: "Nangtukeun puseur implengan (sudut pandang), ngararancang konflik carita, jeung nuliskeun dialog alamiah.",
        tugas: "Nulis draf carpon 2 kaca dumasar pangalaman magang atawa sakola di Bojonggambir.",
        kegiatan: "Brainstorming gagasan carita, nulis draf babarengan, sarta silih koréksi (peer-review) antar babaturan.",
        metode: "Proses Menulis Terbimbing (Guided Writing Process)",
        media: "Conto Carpon dina Majalah Manglé, LKPD Nulis Carita Pondok"
      },
      4: {
        materi: "Praktek Biantara (Pidato Sunda) Hareupeun Kelas kalayan Tatakrama",
        tp: "Nepikeun biantara sacara lisan kalawan lentong, randegan, pasang peta, jeung rengkuh anu payus.",
        atp: "Praktik nepikeun biantara tanpa naskah pinuh (ngagunakeun catetan leutik/ekstemporan).",
        tugas: "Penampilan biantara individu 3 menit hareupeun kelas.",
        kegiatan: "Unggal murid midang biantara, guru jeung babaturan mere ajén dina lembar peunteun tatakrama.",
        metode: "Performance Assessment & Praktik Langsung",
        media: "Panggung / Mimbar Kelas, Rubrik Peunteun Pasemon, Lentong, jeung Wirahma"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('pjok') || m.includes('jasmani')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Keterampilan Gerak Spesifik Permainan Bola Voli: Passing Bawah dan Servis",
        tp: "Mempraktikkan dan menganalisis teknik dasar passing bawah yang stabil serta servis atas akurat.",
        atp: "Menyesuaikan koordinasi mata-tangan, posisi kuda-kuda kaki, dan perkenaan bola pada lengan bawah.",
        tugas: "Praktik passing bawah berpasangan sebanyak 20 kali tanpa jatuh.",
        kegiatan: "Pemanasan statis dan dinamis, drill teknik passing berpasangan, rotasi lapangan, dan pendinginan.",
        metode: "Praktik Lapangan & Drill Keterampilan Berulang",
        media: "Bola Voli Standar, Net, Peluit, Stopwatch, Lapangan Olahraga"
      },
      2: {
        materi: "Taktik Penyerangan dan Kerja Sama Tim Permainan Bola Basket",
        tp: "Menerapkan variasi lay-up shoot, chest pass, bounce pass, dan pola kerja sama 'give and go'.",
        atp: "Menganalisis ruang gerak kosong, transisi dari bertahan ke menyerang, serta fair play olahraga.",
        tugas: "Praktik simulasi permainan basket setengah lapangan 3 on 3 dengan penerapan pola umpan.",
        kegiatan: "Pemanasan dinamis, drill dribbling dan passing berpasangan, simulasi game mini, dan evaluasi strategi.",
        metode: "Game-Based Learning & Praktik Lapangan",
        media: "Bola Basket, Ring Basket, Rompi Tim, Peluit Wasit"
      },
      3: {
        materi: "Pengukuran Derajat Kebugaran Jasmani Terkait Kesehatan (Tes TKJI)",
        tp: "Mengukur daya tahan jantung-paru, kekuatan otot lengan, kelenturan togok, dan menghitung denyut nadi istirahat.",
        atp: "Melaksanakan tes lari bolak-balik (shuttle run), push up 1 menit, dan sit up 1 menit sesuai norma baku.",
        tugas: "Mencatat hasil tes kebugaran pribadi dan menghitung target zona latihan kardio.",
        kegiatan: "Pemeriksaan denyut nadi awal, pemanasan terukur, pelaksanaan pos tes kebugaran bertahap, dan pendinginan.",
        metode: "Direct Instruction & Circuit Training",
        media: "Matras Senam, Stopwatch Digital, Formulir Rekapitulasi TKJI"
      },
      4: {
        materi: "Pencegahan Cedera Olahraga dan Protokol Pertolongan Pertama (R.I.C.E.)",
        tp: "Mengidentifikasi faktor penyebab kram/keseleo dan mendemonstrasikan tindakan R.I.C.E. secara tepat.",
        atp: "Menganalisis tahapan Rest, Ice, Compression, Elevation saat terjadi cedera ligamen akut di lapangan.",
        tugas: "Praktik simulasi pembalutan perban elastis pada cedera engkel kaki berpasangan.",
        kegiatan: "Pemaparan anatomi sendi, demonstrasi penanganan kram dan memar, latihan membebat perban, dan tanya jawab.",
        metode: "Demonstrasi & Role-Play Tanggap Darurat Olahraga",
        media: "Kotak P3K, Es Batu, Perban Elastis (Elastic Bandage), Handout Cedera"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('ipas') || m.includes('alam dan sosial')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Komponen Ekosistem dan Interaksi Antarmakhluk Hidup di Lingkungan Sekolah",
        tp: "Mengidentifikasi komponen biotik dan abiotik serta menganalisis rantai makanan dan piramida energi lokal.",
        atp: "Mengamati interaksi simbiosis, predasi, dan kompetisi pada ekosistem kebun dan kolam sekolah.",
        tugas: "Menyusun diagram rantai makanan pada ekosistem pertanian terpadu SMK.",
        kegiatan: "Eksplorasi luar ruangan (outdoor study), pencatatan flora dan fauna di sekitar RPS, dan pemodelan rantai makanan.",
        metode: "Outdoor Learning & Discovery",
        media: "Kaca Pembesar (Lup), Termometer Ruang/Tanah, LKPD Ekosistem"
      },
      2: {
        materi: "Pencemaran Lingkungan: Dampak Limbah Organik dan Anorganik serta Penanganannya",
        tp: "Menganalisis dampak limbah cair dan padat kejuruan terhadap kualitas air tanah dan kesehatan ekosistem.",
        atp: "Menguji parameter fisik air (suhu, kekeruhan, bau) dan merumuskan teknik 3R (Reduce, Reuse, Recycle).",
        tugas: "Melakukan uji sampel air kolam dan limbah cucian bengkel menggunakan kertas lakmus/pH meter.",
        kegiatan: "Praktik pengujian pH air di laboratorium, telaah jurnal limbah industri, dan perancangan filter air sederhana.",
        metode: "Eksperimen Laboratorium & Diskusi Ilmiah",
        media: "Kertas Indikator pH, Gelas Kimia, Sampel Air, Botol Filter Arang Aktif"
      },
      3: {
        materi: "Energi Terbarukan: Potensi Biomassa dan Panel Surya di Lingkungan SMK",
        tp: "Menelaah prinsip konversi energi matahari menjadi listrik dan pemanfaatan limbah organik pertanian jadi biogas.",
        atp: "Menghitung efisiensi daya panel surya mini dan mendiskusikan peluang kemandirian energi sekolah ramah lingkungan.",
        tugas: "Menghitung kebutuhan panel surya untuk penerangan satu ruang kelas selama 6 jam operasional.",
        kegiatan: "Observasi instalasi solar cell sekolah, demonstrasi pengukuran voltase multimeter, dan diskusi kelompok.",
        metode: "Project-Based Learning & Praktikum Sederhana",
        media: "Solar Cell Edukasi Mini, Multimeter Digital, Lampu LED 12V, LKPD Energi"
      },
      4: {
        materi: "Mitigasi Bencana Alam di Daerah Rawan Longsor dan Gempa Bumi",
        tp: "Merancang peta jalur evakuasi bencana dan mendemonstrasikan SOP penyelamatan diri saat terjadi gempa bumi.",
        atp: "Mengidentifikasi topografi kemiringan lereng Bojonggambir dan menerapkan prinsip 'Drop, Cover, and Hold On'.",
        tugas: "Membuat denah sketsa evakuasi darurat ruang kelas dan titik kumpul aman (assembly point).",
        kegiatan: "Simulasi sirine gempa bumi, evakuasi tertib menuju lapangan terbuka, dan debriefing kesiapsiagaan bencana.",
        metode: "Simulasi Evakuasi Bencana & Asesmen Portofolio Denah",
        media: "Megafon/Sirine Darurat, Peta Sekolah, Lembar Panduan Evakuasi BPBD"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('aphp') || m.includes('pertanian') || m.includes('pengolahan')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Prinsip Good Manufacturing Practices (GMP) dan Standar Sanitasi Hygiene Pangan",
        tp: "Menerapkan protokol kebersihan personal, sanitasi alat produksi, dan keselamatan kerja (K3) industri pangan.",
        atp: "Mengidentifikasi titik kritis kontaminasi silang (cross-contamination) mikroba pada alur produksi olahan pangan.",
        tugas: "Membuat checklist audit sanitasi bengkel APHP sebelum dan sesudah kegiatan produksi.",
        kegiatan: "Demonstrasi 6 langkah cuci tangan steril, penggunaan APD pangan (celemek, hairnet, sarung tangan), dan audit ruang.",
        metode: "Demonstrasi Standar Industri & Praktik Hygiene",
        media: "Wastafel Sanitasi, Sarung Tangan Nitril, Hairnet, Larutan Desinfektan Food Grade"
      },
      2: {
        materi: "Karakteristik Mutu Bahan Baku Pangan Hasil Pertanian dan Uji Sortasi",
        tp: "Mengklasifikasikan tingkat kematangan buah/sayur dan melaksanakan sortasi bahan baku sesuai standar mutu industri.",
        atp: "Mengukur kadar gula (Brix) menggunakan refraktometer dan menguji tekstur serta aroma bahan nabati segar.",
        tugas: "Uji fisik dan organoleptik sampel buah nenas dan pisang lokal Bojonggambir.",
        kegiatan: "Sortasi buah berdasar ukuran dan warna, pengukuran refraktometer brix, dan pencatatan lembar kendali mutu.",
        metode: "Praktikum Laboratorium Pengolahan Pangan",
        media: "Hand Refraktometer Brix, Pisau Stainless, Timbangan Digital, Sampel Buah Segar"
      },
      3: {
        materi: "Teknologi Pengolahan Suhu Rendah dan Suhu Tinggi: Pasteurisasi dan Blansir",
        tp: "Melaksanakan teknik pengolahan pangan dengan perlakuan panas terkendali guna mempertahankan nutrisi dan mengawetkan produk.",
        atp: "Menghitung kecukupan panas (suhu dan waktu pasteurisasi 72°C selama 15 detik) pada pengolahan sari buah alami.",
        tugas: "Pembuatan sari buah nenas terpasteurisasi dengan formula bahan yang terstandar.",
        kegiatan: "Penimbangan bahan, proses ekstraksi sari buah, pasteurisasi water bath, pengisian panas (hot filling), dan pendinginan cepat.",
        metode: "Teaching Factory (TeFa) & Praktik Pengolahan Pangan Nyata",
        media: "Panci Pasteurisasi Stainless, Termometer Pangan, Botol Kaca Steril, Kompor Gas"
      },
      4: {
        materi: "Teknik Pengemasan Vakum, Pelabelan Produk Pangan (BPOM), dan Uji Sensori",
        tp: "Mengoperasikan mesin vacuum sealer, mendesain label informasi nilai gizi, dan melakukan uji hedonik rasa produk olahan.",
        atp: "Menganalisis syarat label kemasan (nama produk, komposisi, netto, tanggal kedaluwarsa, produsen) sesuai regulasi BPOM.",
        tugas: "Pengemasan produk keripik olahan pangan dan uji hedonik melibatkan 15 panelis siswa.",
        kegiatan: "Operasional mesin sealer kemasan, perekatan label stiker, penilaian organoleptik rasa, tekstur, dan penampilan.",
        metode: "Teaching Factory & Uji Mutu Organoleptik",
        media: "Mesin Vacuum Sealer, Kantong Aluminium Foil, Lembar Uji Hedonik Sensori"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('dkv') || m.includes('desain komunikasi') || m.includes('seni rupa')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Prinsip Dasar Desain Grafis: Grid System, Hirarki Visual, dan Tipografi",
        tp: "Menerapkan prinsip tata letak (balance, contrast, proximity, alignment) dalam perancangan media komunikasi visual.",
        atp: "Memilih kombinasi rupa huruf (font pairing serif, sans-serif, display) yang komunikatif dan proporsional.",
        tugas: "Membuat sketsa manual tata letak poster promosi berukuran A4 menggunakan grid 3 kolom.",
        kegiatan: "Bedah karya poster pemenang award internasional, penarikan garis grid manual, dan latihan sketsa thumbnail.",
        metode: "Studio Critique & Sketsa Manual Terbimbing",
        media: "Buku Sketsa A4, Penggaris Logam, Pensil 2B, Spidol Drawing Pen, Contoh Poster"
      },
      2: {
        materi: "Pengoperasian Perangkat Lunak Vektor: Pen Tool, Pathfinder, dan Vector Art",
        tp: "Menguasai teknik tracing presisi menggunakan Pen Tool dan mengombinasikan bentuk dasar via fungsi Shape Builder.",
        atp: "Mengonversi sketsa sketsa manual logo menjadi format vektor beresolusi tinggi yang scalable tanpa pecah.",
        tugas: "Digitalisasi sketsa logo identitas UMKM kopi lokal Tasikmalaya menjadi aset vektor.",
        kegiatan: "Demonstrasi teknik node dan kurva bezier di proyektor studio, praktik mandiri di PC Lab DKV, dan asistensi teknis.",
        metode: "Studio Hands-on Laboratory Practice",
        media: "Workstation Komputer Studio DKV, Software Adobe Illustrator / Inkscape, Drawing Tablet"
      },
      3: {
        materi: "Perancangan Brand Guideline Identitas Visual: Logo, Palette Warna, dan Supergrafis",
        tp: "Menyusun panduan identitas visual menyeluruh meliputi filosofi bentuk, kode warna CMYK/RGB/HEX, dan varian logo.",
        atp: "Merumuskan larangan penggunaan logo (clear space & incorrect usage) untuk menjamin konsistensi citra merek.",
        tugas: "Menyusun draf dokumen Brand Book 4 halaman untuk unit usaha sekolah.",
        kegiatan: "Pengelompokan palet warna emosional, perancangan layout guideline, dan presentasi progres karya antarsiswa.",
        metode: "Project-Based Learning (PjBL) & Asistensi Studio",
        media: "PC Studio DKV, Software Desain, Panduan Standar Pantone / CMYK Guide"
      },
      4: {
        materi: "Teknik Digital Mockup 3D, Pra-Cetak (Pre-Press), dan Exporting Berkas Cetak",
        tp: "Menerapkan mockup kemasan realistis berbantuan smart object Photoshop serta menyiapkan file siap cetak berstandar offset.",
        atp: "Memeriksa color profile CMYK 300 DPI, bleed area 3mm, crop marks, dan outline font sebelum masuk mesin cetak digital.",
        tugas: "Penyusunan berkas PDF Print-Ready kemasan produk olahan hasil pertanian SMK.",
        kegiatan: "Penerapan file desain ke template mockup botol/standing pouch, pengecekan pre-flight berkas, dan uji cetak draft.",
        metode: "Pre-Press Workshop Simulation & Uji Kelaikan Cetak",
        media: "Printer Warna Epson L-Series, Kertas Art Paper 260gsm, Software Photoshop / Illustrator"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('koding') || m.includes('ai') || m.includes('kecerdasan') || m.includes('kka')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Dasar Berpikir Komputasional dan Pemahaman Logika Algoritma Terstruktur",
        tp: "Menganalisis dekomposisi masalah, pengenalan pola (pattern recognition), abstraksi, dan pembuatan flowchart logika.",
        atp: "Merancang algoritma percabangan penentuan kelulusan dan validasi input data menggunakan simbol standar ANSI.",
        tugas: "Membuat diagram alir (flowchart) proses otentikasi login pengguna di platform SIMAGU.",
        kegiatan: "Studi kasus alur antrean bengkel, pemetaan simbol flowchart di papan tulis, dan pembuatan diagram interaktif di Draw.io.",
        metode: "Problem-Based Learning & Computational Thinking",
        media: "Software Draw.io, Modul Algoritma, Proyektor LCD"
      },
      2: {
        materi: "Struktur Sintaksis Python: Variabel, Tipe Data, dan Percabangan Kondisional",
        tp: "Menulis kode program Python untuk mengolah input pengguna dan mengimplementasikan percabangan if-elif-else.",
        atp: "Membuat fungsi validasi batas nilai numerik dan menangani eksepsi error sederhana (try-except block).",
        tugas: "Membuat skrip Python konversi suhu dan kalkulator penghitung diskon produk bazar sekolah.",
        kegiatan: "Live coding di proyektor, penyelesaian error sintaks bersama, dan tantangan mini-coding berdurasi 15 menit.",
        metode: "Live Coding & Interactive Coding Challenges",
        media: "IDE VS Code / Jupyter Notebook, Compiler Python 3.12, Modul Pemrograman"
      },
      3: {
        materi: "Pengenalan Konsep Kecerdasan Artifisial (AI) dan Rekayasa Prompt (Prompt Engineering)",
        tp: "Memahami cara kerja model Large Language Model (LLM) serta merancang prompt kontekstual terstruktur (Role, Context, Task).",
        atp: "Mengevaluasi akurasi jawaban AI terhadap data faktual serta mengidentifikasi potensi bias dan etika penggunaan AI.",
        tugas: "Merancang prompt sistem untuk asisten belajar materi kejuruan dan menguji respons variasinya.",
        kegiatan: "Eksperimen prompt di antarmuka Google AI Studio, perbandingan model grounding, dan diskusi etika integritas akademik.",
        metode: "Inquiry-Based Learning & Hands-on AI Exploration",
        media: "Browser Internet, Akses Google AI Studio / Gemini API, Format Lembar Uji Prompt"
      },
      4: {
        materi: "Pemanfaatan AI untuk Otomasi Pembuatan Aset Visual dan Analisis Data",
        tp: "Mengintegrasikan alat bantu AI generatif untuk ideasi kreatif desain serta pengolahan dataset tabel angka secara otomatis.",
        atp: "Menggunakan prompt visual untuk menghasilkan moodboard konsep dan memvalidasi kode otomasi Python buatan AI.",
        tugas: "Menghasilkan 3 variasi konsep moodboard produk kemasan menggunakan generative image prompt terarah.",
        kegiatan: "Penyusunan prompt deskriptif berbasis komposisi kamera dan lighting, kurasi hasil generasi AI, dan pembuatan laporan mini.",
        metode: "Project-Based Learning & Evaluasi Kritis AI",
        media: "Akses Generative AI Tools, Komputer Lab, Rubrik Kualitas Aset"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  if (m.includes('informatika')) {
    const weeklyData: Record<number, MapelTopicDetail> = {
      1: {
        materi: "Arsitektur Perangkat Keras Komputer dan Sistem Operasi (Hardware & OS)",
        tp: "Mengidentifikasi fungsi CPU, RAM, Storage (SSD/NVMe), Motherboard, GPU, dan manajemen proses sistem operasi.",
        atp: "Mendiagnosis kebutuhan spesifikasi komputer untuk workstation pengolahan grafis DKV dan rekayasa data.",
        tugas: "Menyusun estimasi anggaran spesifikasi rakitan PC editing video senilai Rp 8.500.000.",
        kegiatan: "Bedah komponen PC di lab hardware, identifikasi port motherboard, dan simulasi perakitan virtual.",
        metode: "Praktik Laboratorium & Kolaborasi Kelompok",
        media: "Komponen PC Peraga, Obeng Presisi, Lembar Kerja Komponen"
      },
      2: {
        materi: "Jaringan Komputer Lokal (LAN), Pengalamatan IP Address, dan Topologi Jaringan",
        tp: "Mengonfigurasi pengalamatan IPv4 kelas C secara statis dan menguji konektivitas antarnode menggunakan perintah PING.",
        atp: "Membuat kabel UTP straight-through sesuai standar T568B dan menguji kelayakan jalur pin menggunakan LAN tester.",
        tugas: "Crimping kabel jaringan LAN dan pengujian transmisi data antardua PC.",
        kegiatan: "Praktik pemotongan dan pengupasan kabel UTP, crimping konektor RJ45, pengetesan kabel, dan konfigurasi IP.",
        metode: "Hands-on Practical Workshop",
        media: "Kabel UTP Cat 6, Konektor RJ45, Tang Crimping, LAN Tester, Switch 8-Port"
      },
      3: {
        materi: "Pengolahan dan Analisis Data menggunakan Spreadsheet: Formula Statistik dan VLOOKUP",
        tp: "Mengolah dataset tabel nilai siswa menggunakan fungsi SUM, AVERAGE, COUNTIF, IF bersarang, dan VLOOKUP.",
        atp: "Membuat visualisasi grafik batang dan pie chart yang informatif untuk pelaporan data absensi kelas.",
        tugas: "Menyelesaikan lembar kerja rekapitulasi data inventaris bengkel menggunakan formula otomatis.",
        kegiatan: "Latihan formula terbimbing di lab komputer, pembuatan conditional formatting indikator warna, dan analisis tren.",
        metode: "Guided Practice & Pemecahan Masalah Dataset",
        media: "Software Microsoft Excel / Google Sheets, Dataset Inventaris Simulasi"
      },
      4: {
        materi: "Keamanan Siber (Cybersecurity), Phishing, dan Perlindungan Data Pribadi",
        tp: "Menganalisis modus penipuan rekayasa sosial (social engineering) dan menerapkan autentikasi dua faktor (2FA).",
        atp: "Membuat kata sandi kuat berbasis frasa unik dan memeriksa integritas tautan mencurigakan sebelum dibuka.",
        tugas: "Audit keamanan akun email dan media sosial pribadi menggunakan checklist standar keamanan digital.",
        kegiatan: "Simulasi mengenali email phishing tiruan, praktik aktivasi 2FA via Google Authenticator, dan diskusi privasi data.",
        metode: "Case Study & Security Awareness Workshop",
        media: "Slide Infografik Keamanan Siber, Handout Panduan 2FA"
      }
    };
    return weeklyData[weekNum] || weeklyData[1];
  }

  // Default PKK / Projek Kreatif & Kewirausahaan / Umum
  const weeklyData: Record<number, MapelTopicDetail> = {
    1: {
      materi: "Analisis Peluang Usaha dan Pembuatan Prototipe Produk Kejuruan",
      tp: "Menganalisis potensi pasar produk lokal dan merancang konsep prototipe bernilai jual tinggi.",
      atp: "Melakukan analisis SWOT (Strength, Weakness, Opportunity, Threat) dan memetakan target konsumen potensial.",
      tugas: "Menyusun lembar kanvas model bisnis (Business Model Canvas - BMC) 9 blok.",
      kegiatan: "Observasi potensi komoditas Bojonggambir, perumusan ide produk inovatif, dan pengisian kanvas BMC.",
      metode: "Design Thinking & Kolaborasi Tim Usaha",
      media: "Template Business Model Canvas, Spidol Warna, Sticky Notes, Slide Materi"
    },
    2: {
      materi: "Perhitungan Harga Pokok Produksi (HPP) dan Penentuan Harga Jual Produk",
      tp: "Menghitung biaya bahan baku langsung, biaya tenaga kerja, overhead pabrik, dan menetapkan margin laba realistis.",
      atp: "Menghitung titik impas (Break Even Point - BEP unit dan BEP rupiah) untuk memitigasi risiko kerugian usaha.",
      tugas: "Menghitung HPP per kemasan dan BEP untuk rencana produksi 100 unit produk olahan/desain.",
      kegiatan: "Latihan penginputan data biaya ke dalam lembar kerja kalkulasi, simulasi penetapan margin keuntungan, dan kuis.",
      metode: "Problem-Based Learning & Latihan Mandiri",
      media: "Kalkulator Keuangan, Lembar Kerja Format HPP & BEP Excel"
    },
    3: {
      materi: "Pemasaran Digital (Digital Marketing) dan Pengelolaan Akun Bisnis Media Sosial",
      tp: "Merancang konten promosi persuasif di platform media sosial serta mengelola katalog produk digital.",
      atp: "Membuat copywriting promosi menggunakan formula AIDA (Attention, Interest, Desire, Action) dan copywriting visual.",
      tugas: "Membuat flyer digital promosi Instagram feed dan reels preview produk kejuruan.",
      kegiatan: "Workshop pembuatan konten promosi di smartphone, penulisan caption persuasif, dan simulasi posting terjadwal.",
      metode: "Project-Based Learning & Workshop Praktis",
      media: "Aplikasi Canva Bisnis, Smartphone, Akun Instagram Usaha Siswa"
    },
    4: {
      materi: "Simulasi Penjualan (Bazar Produk Sekolah) dan Penyusunan Laporan Laba-Rugi",
      tp: "Melaksanakan transaksi penjualan langsung, melayani konsumen secara ramah, dan membukukan arus kas keuangan harian.",
      atp: "Mencatat bukti kas masuk dan kas keluar serta menyusun laporan laba rugi sederhana di akhir operasional bazar.",
      tugas: "Penyusunan laporan pertanggungjawaban keuangan penjualan dan evaluasi kepuasan konsumen.",
      kegiatan: "Gelar stand penjualan bazar mini, pelayanan transaksi konsumen, penghitungan uang kas, dan rekonsiliasi omzet.",
      metode: "Teaching Factory & Bazar Kewirausahaan Nyata",
      media: "Stand Bazar, Buku Kas Penjualan, Kalkulator Kasir, Nota Penjualan Resmi"
    }
  };

  return weeklyData[weekNum] || weeklyData[1];
}

// Master Generator untuk Rentang 15 Juli 2026 s.d. 4 Agustus 2026
export function generateWeeklyOperationalData(
  gurus?: GuruItem[],
  classes?: KelasItem[],
  mapels?: MapelItem[],
  jurusanList?: JurusanItem[]
) {
  const safeGurus = gurus || [];
  const safeClasses = classes || [];

  const agendaGuruList: AgendaGuruItem[] = [];
  const agendaKelasList: AgendaKelasItem[] = [];
  const absensiGuruList: AbsensiGuruRecord[] = [];
  const absensiSiswaList: AbsensiSiswaRecord[] = [];
  const supervisiList: SupervisiRecord[] = [];
  const materiList: MateriRecord[] = [];
  const tugasList: TugasRecord[] = [];
  const nilaiSiswaList: NilaiSiswaRecord[] = [];

  let runningAgendaGuruId = 1;
  let runningAgendaKelasId = 1;

  // 1. GENERATE AGENDA GURU UNTUK 15 HARI SEKOLAH (15 JULI - 4 AGUSTUS 2026)
  schoolDatesList.forEach(schoolDate => {
    const { date, day, weekNum } = schoolDate;
    const month = date.split('-')[1]; // '07' atau '08'

    // Ambil jadwal yang berlaku di hari tersebut
    const daySchedules = completeJadwalData.filter(sch => sch.hari === day);

    daySchedules.forEach(sch => {
      const topic = getTopicForMapel(sch.mapel, weekNum);
      const isAugust = month === '08';
      const agendaNoStr = String(runningAgendaGuruId).padStart(3, '0');
      const nomorAgenda = `AG/SMKN-BJG/2026/${month}/${agendaNoStr}`;

      // Ambil data siswa kelas
      const classStudents = initialSiswaFormatted.filter(s => s.kelas === sch.kelas);
      const totalSiswa = classStudents.length > 0 ? classStudents.length : 36;

      // Kehadiran siswa: Mayoritas 100% Hadir, sebagian kecil 1 izin/sakit
      let hadir = totalSiswa;
      let sakit = 0;
      let izin = 0;
      let alpa = 0;
      let terlambat = 0;
      const siswaTidakHadir: { nis: string; nama: string; kategori: 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'; jamDatang?: string; alasan: string; }[] = [];

      // Variasi realistis presensi (setiap 3-4 agenda terdapat 1 siswa izin atau sakit)
      if (runningAgendaGuruId % 4 === 1 && totalSiswa > 30) {
        sakit = 1;
        hadir = totalSiswa - 1;
        const student = classStudents[totalSiswa - 1] || { nama: 'Siswa Contoh', nis: '26271099' };
        siswaTidakHadir.push({
          nama: student.nama,
          nis: student.nis,
          alasan: 'Demam dan istirahat dokter (surat izin terlampir)',
          kategori: 'Sakit'
        });
      } else if (runningAgendaGuruId % 7 === 2 && totalSiswa > 30) {
        izin = 1;
        hadir = totalSiswa - 1;
        const student = classStudents[totalSiswa - 2] || { nama: 'Siswa Contoh', nis: '26271098' };
        siswaTidakHadir.push({
          nama: student.nama,
          nis: student.nis,
          alasan: 'Keperluan keluarga / surat permohonan orang tua',
          kategori: 'Izin'
        });
      }

      const persentaseKehadiran = Number(((hadir / totalSiswa) * 100).toFixed(2));

      // ID Referensi
      const guruObj = safeGurus.find(g => g.nama.toLowerCase().includes(sch.guru.split(',')[0].toLowerCase().trim()));
      const idGuru = guruObj ? guruObj.id : `gr-${sch.guru.slice(0, 3).toLowerCase()}`;
      const nipGuru = guruObj ? guruObj.nip : '19850101 202221 1 001';

      const agendaItem: AgendaGuruItem = {
        id: `ag-ops-${date}-${runningAgendaGuruId}`,
        nomorAgenda,
        tahunPelajaran: '2026/2027',
        semester: 'Ganjil',
        tanggal: date,
        hari: day,
        namaGuru: sch.guru,
        nip: nipGuru,
        jabatan: guruObj ? guruObj.jabatan : 'Guru Mata Pelajaran',
        mapel: sch.mapel,
        konsentrasiKeahlian: sch.kelas.includes('APHP') ? 'Agribisnis Pengolahan Hasil Pertanian (APHP)' : 'Desain Komunikasi Visual (DKV)',
        fase: sch.kelas.startsWith('X ') ? 'E' : 'F',
        kelas: sch.kelas,
        rombel: sch.kelas,
        ruang: sch.ruang || 'Ruang Teori & Praktik',
        jamKe: sch.jp,
        waktu: sch.waktu,
        jumlahJP: sch.jp.includes('-') ? (parseInt(sch.jp.split('-')[1]) - parseInt(sch.jp.split('-')[0]) + 1) : 2,
        statusPertemuan: 'Sesuai Jadwal',
        modaPembelajaran: 'Luring',
        elemen: 'Capaian Pembelajaran Kejuruan & Umum',
        cp: topic.tp,
        atp: topic.atp,
        tujuanPembelajaran: topic.tp,
        materi: topic.materi,
        modelPembelajaran: topic.metode,
        metode: 'Demonstrasi, Diskusi Interaktif, & Penugasan Praktik Mandiri',
        pendekatan: 'Saintifik & Teaching Factory (TEFA)',
        media: topic.media,
        sumberBelajar: 'Modul Digital Kurikulum Merdeka, Buku Teks Siswa, & Video Pembelajaran',
        lkpd: 'LKPD Formatif Terlampir Digital',
        platformDigital: 'Google Workspace for Education / LMS SIMAGU',
        asesmen: 'Formatif & Asesmen Performa Kinerja Siswa',
        tugas: topic.tugas,
        deadlineTugas: `${date} 23:59`,
        statusPembelajaran: 'Selesai',
        totalSiswa,
        hadir,
        sakit,
        izin,
        alpa,
        terlambat,
        persentaseKehadiran,
        siswaTidakHadir,
        kegiatanTambahan: ['Piket KBM', 'Pendampingan Karakter Siswa'],
        kendala: 'Kondusif, tidak ada kendala sarana yang signifikan.',
        solusi: 'Pengorganisasian kelompok praktikum efektif berjalan lancar.',
        siswaPendampingan: 'Pendampingan khusus diberikan kepada siswa yang memerlukan penguatan materi.',
        sarana: 'LCD Proyektor, Kelistrikan, dan Perangkat Lab/Studio dalam kondisi normal.',
        refleksi: `Pembelajaran ${sch.mapel} terlaksana efektif dengan partisipasi aktif peserta didik.`,
        tindakLanjut: 'Melanjutkan materi pada pertemuan minggu depan sesuai alur silabus.',
        komunikasiOrtu: 'Presensi harian tersinkronisasi otomatis dengan orang tua melalui SIMAGU.',
        statusValidasi: 'Disetujui',
        catatanWakasek: 'Modul ajar sesuai dengan target Alur Tujuan Pembelajaran Kurikulum Merdeka. Sangat baik.',
        tanggalValidasi: date,
        ttdGuru: sch.guru,
        ttdWakasek: "Wahab Mughni Sa'dillah, S.Pd.",
        id_guru: idGuru,
        id_jadwal: sch.id,
        id_ruang: sch.ruang,
        id_kelas: sch.kelas,
        id_materi: `mat-${sch.id}-${weekNum}`,
        id_tugas: `tug-${sch.id}-${weekNum}`,
        fotoUrls: [
          'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80'
        ],
        dokumenUrl: `https://drive.google.com/drive/folders/simagu-smkn-bojonggambir/${date}`,
        driveFolderLink: `https://drive.google.com/drive/folders/simagu-smkn-bojonggambir/${sch.kelas.replace(/\s+/g, '_')}`
      };

      agendaGuruList.push(agendaItem);

      // Tambahkan materi dan tugas operasional yang terhubung
      if (!materiList.some(m => m.id === agendaItem.id_materi)) {
        materiList.push({
          id: agendaItem.id_materi!,
          nomorMateri: `MAT-${sch.id}-${weekNum}`,
          hari: day,
          tanggal: date,
          mapel: sch.mapel,
          fase: sch.kelas.startsWith('X ') ? 'E' : 'F',
          kelas: sch.kelas,
          guru: sch.guru,
          elemen: 'Capaian Pembelajaran Kejuruan & Umum',
          cp: topic.tp,
          atp: topic.atp,
          tujuanPembelajaran: topic.tp,
          judulMateri: topic.materi,
          ringkasanMateri: topic.kegiatan,
          status: 'Terpublikasi',
          driveLink: `https://drive.google.com/file/d/modul-${sch.id}-${weekNum}/view`
        });
      }

      if (!tugasList.some(t => t.id === agendaItem.id_tugas)) {
        tugasList.push({
          id: agendaItem.id_tugas!,
          nomorTugas: `TUG-${sch.id}-${weekNum}`,
          id_materi: agendaItem.id_materi,
          hari: day,
          tanggal: date,
          mapel: sch.mapel,
          kelas: sch.kelas,
          guru: sch.guru,
          judulTugas: `Tugas Formatif: ${topic.materi.slice(0, 45)}...`,
          instruksi: topic.tugas,
          deadline: `${date} 23:59`,
          jenisTugas: 'Individu',
          totalSiswa,
          totalMengumpulkan: hadir
        });
      }

      runningAgendaGuruId++;
    });

    // 2. GENERATE ABSENSI GURU UNTUK HARI TERSEBUT
    // Ambil semua guru unik yang mengajar di hari ini
    const activeTeacherNames = Array.from(new Set(daySchedules.map(sch => sch.guru)));
    activeTeacherNames.forEach((teacherName, tIdx) => {
      const gObj = safeGurus.find(g => g.nama.toLowerCase().includes(teacherName.split(',')[0].toLowerCase().trim()));
      const nip = gObj ? gObj.nip : '19850101 202221 1 001';
      absensiGuruList.push({
        id: `absg-${date}-${tIdx + 1}`,
        tanggal: date,
        namaGuru: teacherName,
        nip,
        jamMasuk: '06:45',
        jamKeluar: '15:30',
        status: 'Hadir',
        keterangan: 'Hadir tepat waktu mengikuti apel pagi dan melaksanakan seluruh jam tatap muka KBM.',
        lokasiGps: 'SMKN Bojonggambir (GPS Valid)'
      });
    });
  });

  // 3. GENERATE AGENDA KELAS UNTUK SEMUA 10 KELAS DI 15 HARI SEKOLAH (150 AGENDA KELAS)
  const classListNames = [
    'X APHP', 'X DKV 1', 'X DKV 2', 
    'XI APHP', 'XI DKV 1', 'XI DKV 2', 
    'XII APHP', 'XII DKV 1', 'XII DKV 2', 'XII DKV 3'
  ];

  schoolDatesList.forEach(schoolDate => {
    const { date, day, weekNum } = schoolDate;
    const month = date.split('-')[1];

    classListNames.forEach(kelasName => {
      const classObj = safeClasses.find(c => c.namaKelas === kelasName);
      const waliKelas = classObj ? classObj.waliKelas : 'Wali Kelas SMKN Bojonggambir';
      const ketuaKelas = classObj ? classObj.ketuaKelas : 'Ketua Kelas';
      const wakilKetua = classObj ? classObj.wakilKetua : 'Wakil Ketua Kelas';
      const jumlahLaki = classObj ? classObj.jumlahLaki : 18;
      const jumlahPerempuan = classObj ? classObj.jumlahPerempuan : 18;
      const jumlahSiswa = classObj ? (classObj.jumlahLaki + classObj.jumlahPerempuan) : 36;

      // Cari seluruh Agenda Guru yang mengajar di kelas ini pada hari ini
      const matchedAgendas = agendaGuruList.filter(ag => ag.kelas === kelasName && ag.tanggal === date);
      
      // Hitung kehadiran kelas
      let totalHadir = jumlahSiswa;
      let totalSakit = 0;
      let totalIzin = 0;
      let totalAlpa = 0;
      let totalTerlambat = 0;
      const classSiswaTidakHadir: { nis: string; nama: string; kategori: 'Sakit' | 'Izin' | 'Alpa' | 'Terlambat'; jamDatang?: string; alasan: string; }[] = [];

      if (matchedAgendas.length > 0) {
        totalHadir = matchedAgendas[0].hadir;
        totalSakit = matchedAgendas[0].sakit;
        totalIzin = matchedAgendas[0].izin;
        totalAlpa = matchedAgendas[0].alpa;
        totalTerlambat = matchedAgendas[0].terlambat;
        if (matchedAgendas[0].siswaTidakHadir) {
          classSiswaTidakHadir.push(...matchedAgendas[0].siswaTidakHadir);
        }
      }

      const persentase = Number(((totalHadir / jumlahSiswa) * 100).toFixed(2));

      // Sesi KBM Terlaksana
      const monitoringPembelajaran: { jp: string; mapel: string; guru: string; materi: string; tugas: string; status: 'Terlaksana' | 'Kosong' | 'Inal/Tugas' | 'Izin'; }[] = matchedAgendas.map(ag => ({
        jp: ag.jamKe,
        mapel: ag.mapel,
        guru: ag.namaGuru,
        materi: ag.materi,
        tugas: ag.tugas || 'Mengerjakan LKPD & Asesmen Formatif',
        status: 'Terlaksana' as const
      }));

      // Jika jadwal di hari ini belum tercover, ambil dari schedule asli
      if (monitoringPembelajaran.length === 0) {
        const directSchedules = completeJadwalData.filter(s => s.kelas === kelasName && s.hari === day);
        directSchedules.forEach(ds => {
          const t = getTopicForMapel(ds.mapel, weekNum);
          monitoringPembelajaran.push({
            jp: ds.jp,
            mapel: ds.mapel,
            guru: ds.guru,
            materi: t.materi,
            tugas: t.tugas,
            status: 'Terlaksana' as const
          });
        });
      }

      const nomorAgendaKelas = `AK/${kelasName.replace(/\s+/g, '')}/2026/${month}/${date.split('-')[2]}`;

      const agendaKelasItem: AgendaKelasItem = {
        id: `ak-ops-${date}-${kelasName.replace(/\s+/g, '_')}`,
        nomorAgenda: nomorAgendaKelas,
        tahunPelajaran: '2026/2027',
        semester: 'Ganjil',
        tanggal: date,
        hari: day,
        kelas: kelasName,
        jurusan: classObj?.jurusan || (kelasName.includes('APHP') ? 'Agribisnis Pengolahan Hasil Pertanian' : 'Desain Komunikasi Visual'),
        konsentrasiKeahlian: kelasName.includes('APHP') ? 'Agribisnis Pengolahan Hasil Pertanian (APHP)' : 'Desain Komunikasi Visual (DKV)',
        waliKelas,
        ketuaKelas,
        wakilKetua,
        jumlahSiswa,
        jumlahLaki,
        jumlahPerempuan,
        hadir: totalHadir,
        sakit: totalSakit,
        izin: totalIzin,
        alpa: totalAlpa,
        terlambat: totalTerlambat,
        persentase,
        siswaTidakHadir: classSiswaTidakHadir,
        monitoringPembelajaran,
        agendaRoutine: [
          { waktu: '06:45 - 07:15', kegiatan: 'Piket Kebersihan Kelas & Penerapan Budaya 5S', status: 'Terlaksana', catatan: 'Lantai, jendela, dan meja ruang belajar bersih dan rapi.' },
          { waktu: '07:15 - 07:30', kegiatan: 'Apel Pagi, Doa Bersama, dan Menyanyikan Lagu Kebangsaan', status: 'Terlaksana', catatan: 'Dipimpin oleh ketua kelas dengan penuh khidmat.' },
          { waktu: '07:30 - 07:45', kegiatan: 'Literasi Sekolah & Pembacaan Asmaul Husna', status: 'Terlaksana', catatan: 'Peserta didik membaca buku pengayaan dan Al-Qur\'an.' },
          { waktu: '11:45 - 12:45', kegiatan: 'Istirahat & Sholat Dhuhur Berjamaah di Masjid Sekolah', status: 'Terlaksana', catatan: 'Seluruh peserta didik muslim melaksanakan sholat tepat waktu.' },
          { waktu: '15:15 - 15:30', kegiatan: 'Operasi Semut (Kebersihan Akhir), Refleksi Kelas, & Doa Pulang', status: 'Terlaksana', catatan: 'Ruang kelas dipastikan terkunci rapi, listrik dan proyektor padam aman.' }
        ],
        pelanggaranList: [],
        prestasiList: [
          {
            id: `prs-${date}-${kelasName.replace(/\s+/g, '')}`,
            namaSiswa: ketuaKelas,
            bidang: 'Kedisiplinan & Kepemimpinan Kelas',
            tingkat: 'Sekolah',
            juara: 'Terbaik',
            tanggal: date,
            keterangan: 'Memimpin kelas dengan teladan ketertiban, menjaga kekondusifan KBM sepanjang hari.'
          }
        ],
        kesehatanList: totalSakit > 0 ? [
          {
            id: `kes-${date}-${kelasName.replace(/\s+/g, '')}`,
            namaSiswa: classSiswaTidakHadir.find(s => s.kategori === 'Sakit')?.nama || 'Peserta Didik',
            kondisi: 'Demam ringan / flu',
            tindakan: 'Istirahat di rumah dengan izin orang tua / diperiksa dokter.',
            petugas: 'UKS & Wali Kelas'
          }
        ] : [],
        inventarisList: [
          { barang: 'Meja & Kursi Siswa Standar Ergonomis', jumlah: jumlahSiswa, baik: jumlahSiswa, rusakRingan: 0, rusakBerat: 0, keterangan: 'Lengkap' },
          { barang: 'Papan Tulis Whiteboard & Spidol', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Lengkap' },
          { barang: 'Proyektor LCD & Layar Screen', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Normal' },
          { barang: 'Air Conditioner / Kipas Angin Studio', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Normal' },
          { barang: 'Tempat Sampah Organik & Anorganik', jumlah: 2, baik: 2, rusakRingan: 0, rusakBerat: 0, keterangan: 'Lengkap' },
          { barang: 'Kotak P3K Kelas & Termometer Suhu', jumlah: 1, baik: 1, rusakRingan: 0, rusakBerat: 0, keterangan: 'Lengkap' }
        ],
        komunikasiOrtuList: [
          {
            tanggal: date,
            namaOrtuSiswa: 'Perwakilan Komite Kelas',
            media: 'WhatsApp',
            keperluan: 'Laporan Kehadiran Harian Kelas & Kesiapan Praktik Kejuruan',
            hasil: 'Disampaikan melalui Grup WhatsApp Resmi Wali Kelas dan Orang Tua.',
            petugas: waliKelas
          }
        ],
        catatanWaliKelas: {
          kondisiUmum: `Kondisi kelas ${kelasName} pada hari ${day}, ${date} sangat kondusif. Seluruh sesi pembelajaran terlaksana sesuai jadwal tatap muka.`,
          kedisiplinan: 'Tingkat kehadiran sangat tinggi, peserta didik mematuhi tata tertib berseragam dan tepat waktu.',
          budayaPositif: 'Penerapan 5S (Senyum, Salam, Sapa, Sopan, Santun) dan literasi pagi terlaksana tertib.',
          kebersihan: 'Ruang kelas bersih, tempat sampah terpilah rapi sebelum dan sesudah KBM.',
          keamanan: 'Seluruh sarana dan prasarana kelas dalam keadaan aman dan berfungsi baik.',
          siswaBermasalah: totalAlpa > 0 ? 'Terdapat siswa alpa, segera ditindaklanjuti koordinasi dengan orang tua.' : 'Nihil, tidak ada permasalahan kedisiplinan yang berarti.',
          siswaBerprestasi: `${ketuaKelas} - Teladan kepemimpinan kelas`,
          tindakLanjut: 'Melanjutkan pembiasaan positif dan memonitor kehadiran peserta didik secara berkala.'
        },
        validatedByWali: true,
        tanggalValidasiWali: date,
        ttdKetuaKelas: ketuaKelas,
        ttdWaliKelas: waliKelas,
        fotoUrls: [
          'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80'
        ],
        dokumenUrl: `https://drive.google.com/drive/folders/simagu-agenda-kelas/${kelasName.replace(/\s+/g, '_')}`
      };

      agendaKelasList.push(agendaKelasItem);
      runningAgendaKelasId++;
    });
  });

  // 4. GENERATE SUPERVISI AKADEMIK OLEH KEPALA SEKOLAH (IMAN RAHMAT, S.Pd.I.)
  // Periode 15 Juli 2026 s.d. 4 Agustus 2026
  // Kepala Sekolah melaksanakan supervisi akademik langsung terhadap 19 guru pengampu mapel di kelas
  const supervisorKepalaSekolah = 'Iman Rahmat, S.Pd.I.';
  const nipKepalaSekolah = '19901017 202321 1 007';

  // Daftar rencana supervisi akademik riil mencakup seluruh 19 guru pengampu di 15 hari sekolah
  const supervisiPlanList = [
    {
      tanggal: '2026-07-15',
      namaGuru: 'Ali Maulana, S.Pd.',
      nip: '19870514 202421 1 009',
      mapel: 'Sejarah Indonesia',
      kelas: 'X DKV 1',
      skorPerencanaan: 94,
      skorPelaksanaan: 93,
      skorEvaluasi: 95,
      catatanSupervisor: 'Modul ajar Sejarah disusun komprehensif memuat Alur Tujuan Pembelajaran Jalur Rempah. Guru sangat piawai mengaitkan nilai sejarah maritim dengan karakter kebangsaan generasi muda. Partisipasi siswa sangat aktif.',
      rekomendasi: 'Pertahankan metode visualisasi peta interaktif. Disarankan membagikan praktik baik (best practice) media digital pada komunitas belajar guru serumpun.'
    },
    {
      tanggal: '2026-07-15',
      namaGuru: 'Seni Sri Astuti, S.Pd.',
      nip: '19890412 202221 2 005',
      mapel: 'Bahasa Indonesia',
      kelas: 'XI APHP',
      skorPerencanaan: 96,
      skorPelaksanaan: 95,
      skorEvaluasi: 96,
      catatanSupervisor: 'Penyampaian materi Teks Laporan Hasil Observasi (LHO) sangat terstruktur. Guru memadukan observasi lingkungan bengkel pengolahan APHP dengan tata tulis ilmiah yang komunikatif. Interaksi kelas sangat hidup.',
      rekomendasi: 'Sangat direkomendasikan menjadi model guru pamong untuk pembelajaran berdiferensiasi dan penguatan literasi vokasi.'
    },
    {
      tanggal: '2026-07-16',
      namaGuru: 'Diniyanti, S.Pd.',
      nip: '19880920 202321 2 008',
      mapel: 'Bahasa Inggris dan Bahasa Asing Lainnya',
      kelas: 'XII APHP',
      skorPerencanaan: 95,
      skorPelaksanaan: 94,
      skorEvaluasi: 95,
      catatanSupervisor: 'Penggunaan bahasa pengantar (target language) dalam kelas sangat baik dan mudah dipahami siswa. Simulasi wawancara kerja teknis dipersiapkan matang dengan rubrik speaking yang jelas.',
      rekomendasi: 'Tingkatkan durasi praktik berbicara berpasangan (peer-speaking) dan fasilitasi rekaman audio untuk portofolio digital siswa.'
    },
    {
      tanggal: '2026-07-16',
      namaGuru: 'Rahmayanti Rahayu, S.Pd.',
      nip: '19910305 202421 2 011',
      mapel: 'Matematika',
      kelas: 'XII DKV 2',
      skorPerencanaan: 93,
      skorPelaksanaan: 94,
      skorEvaluasi: 92,
      catatanSupervisor: 'Konsep matriks dan aljabar dijelaskan secara runtut dengan contoh kontekstual biaya produksi studio grafis. Guru sabar membimbing siswa yang mengalami kesulitan numerasi.',
      rekomendasi: 'Integrasikan pemanfaatan aplikasi Geogebra atau spreadsheet untuk memvisualisasikan operasi matriks berordo besar.'
    },
    {
      tanggal: '2026-07-17',
      namaGuru: 'Drs. Aa Mansur, M.Pd.',
      nip: '19670815 199403 1 004',
      mapel: 'Pendidikan Agama dan Budi Pekerti',
      kelas: 'XI DKV 1',
      skorPerencanaan: 97,
      skorPelaksanaan: 96,
      skorEvaluasi: 95,
      catatanSupervisor: 'Karakter keteladanan guru luar biasa menginspirasi peserta didik. Penanaman nilai Q.S. Al-Ma\'idah/5: 48 dan etos kerja muslim diintegrasikan dengan disiplin kerja kejuruan secara mendalam.',
      rekomendasi: 'Pertahankan bimbingan tadarus dan penguatan karakter religius siswa. Jadikan rujukan dalam program penguatan Profil Pelajar Pancasila.'
    },
    {
      tanggal: '2026-07-20',
      namaGuru: 'Darusalam, S.H.',
      nip: '19751120 200801 1 006',
      mapel: 'Pendidikan Pancasila dan Kewarganegaraan',
      kelas: 'XI APHP',
      skorPerencanaan: 94,
      skorPelaksanaan: 93,
      skorEvaluasi: 94,
      catatanSupervisor: 'Pembahasan hierarki hukum dan kesadaran konstitusi disajikan faktual dengan mengulas regulasi ketenagakerjaan dan K3 industri. Diskusi kelas berlangsung kritis dan tertib.',
      rekomendasi: 'Perbanyak studi kasus putusan peradilan sederhana dan simulasi mediasi hak asasi manusia di lingkungan sekolah.'
    },
    {
      tanggal: '2026-07-20',
      namaGuru: 'Ilfan Fauzi, S.Pd.',
      nip: '19920110 202521 1 014',
      mapel: 'Mulok Bahasa Sunda',
      kelas: 'X DKV 1',
      skorPerencanaan: 95,
      skorPelaksanaan: 94,
      skorEvaluasi: 95,
      catatanSupervisor: 'Penyampaian materi Biantara (pidato Sunda) dan undak-usuk basa berlangsung komunikatif. Guru mampu membangkitkan rasa bangga peserta didik terhadap warisan bahasa dan kearifan lokal Jawa Barat.',
      rekomendasi: 'Dokumentasikan rekaman penampilan biantara siswa terbaik untuk diikutsertakan pada Pasanggiri Basa Sunda tingkat Kabupaten.'
    },
    {
      tanggal: '2026-07-21',
      namaGuru: 'Mohamad Ridwan, M.Pd.',
      nip: '19860618 202321 1 008',
      mapel: 'Pendidikan Jasmani, Olahraga dan Kesehatan',
      kelas: 'XI DKV 2',
      skorPerencanaan: 96,
      skorPelaksanaan: 95,
      skorEvaluasi: 94,
      catatanSupervisor: 'Pengelolaan kelas di lapangan luar biasa tertib dan aman. Prosedur pemanasan terstruktur, teknik passing bawah bola voli dicontohkan dengan peragaan biomekanik yang tepat, pendinginan teratur.',
      rekomendasi: 'Teruskan pencatatan kartu kebugaran jasmani mandiri siswa (TKJI) untuk pemantauan stamina fisik peserta didik kejuruan.'
    },
    {
      tanggal: '2026-07-21',
      namaGuru: 'Ihsan Haeruman Kamil, S.Pd.',
      nip: '19930415 202421 1 012',
      mapel: 'Dasar-Dasar Agribisnis Pengolahan Hasil Pertanian',
      kelas: 'X DKV 2',
      skorPerencanaan: 94,
      skorPelaksanaan: 93,
      skorEvaluasi: 94,
      catatanSupervisor: 'Guru menjelaskan prinsip sanitasi lingkungan dan ekosistem pertanian secara ilmiah dan aplikatif. Penggunaan media peraga visual sangat membantu pemahaman konsep abstrak.',
      rekomendasi: 'Optimalkan kegiatan pengamatan langsung di kebun praktek sekolah untuk memperkaya data empiris peserta didik.'
    },
    {
      tanggal: '2026-07-22',
      namaGuru: 'Wahab Mughni Sa\'dillah, S.Pd.',
      nip: '19871225 202221 1 003',
      mapel: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
      kelas: 'X DKV 1',
      skorPerencanaan: 97,
      skorPelaksanaan: 96,
      skorEvaluasi: 96,
      catatanSupervisor: 'Perencanaan pembelajaran berbasis Alur Tujuan Pembelajaran Kurikulum Merdeka sangat matang. Eksplorasi praktikum interaksi biotik-abiotik dipandu lembar kerja terstruktur dengan standar ilmiah tinggi.',
      rekomendasi: 'Pertahankan kualitas rancangan modul ajar berbasis inquiry dan diseminasi format asesmen formatif ke guru mata pelajaran umum lainnya.'
    },
    {
      tanggal: '2026-07-22',
      namaGuru: 'Sutisna, S.Pd.',
      nip: '19840312 202321 1 005',
      mapel: 'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
      kelas: 'XI DKV 2',
      skorPerencanaan: 93,
      skorPelaksanaan: 94,
      skorEvaluasi: 93,
      catatanSupervisor: 'Pembelajaran materi energi terbarukan dan mitigasi bencana lingkungan di Bojonggambir sangat kontekstual. Siswa antusias menghitung potensi konversi limbah organik menjadi biogas.',
      rekomendasi: 'Fasilitasi pembuatan prototipe mini solar cell atau komposter sederhana untuk portofolio hasil karya proyek IPAS.'
    },
    {
      tanggal: '2026-07-23',
      namaGuru: 'Ratih Juliana Anggraeni, S.Si.',
      nip: '19900714 202421 2 015',
      mapel: 'Agribisnis Pengolahan Hasil Pertanian',
      kelas: 'X APHP',
      skorPerencanaan: 96,
      skorPelaksanaan: 95,
      skorEvaluasi: 96,
      catatanSupervisor: 'Pelaksanaan praktikum di Laboratorium APHP mematuhi standar Good Manufacturing Practices (GMP). Guru mendisiplinkan penggunaan APD lengkap dan membimbing uji mutu bahan pangan secara teliti.',
      rekomendasi: 'Kembangkan lembar kendali mutu produk (Quality Control Sheet) digital berbasis spreadsheet untuk melatih standar pencatatan industri pangan modern.'
    },
    {
      tanggal: '2026-07-23',
      namaGuru: 'Dede Gisni Azmi, S.Si.',
      nip: '19930819 202521 2 019',
      mapel: 'Matematika',
      kelas: 'X DKV 1',
      skorPerencanaan: 94,
      skorPelaksanaan: 93,
      skorEvaluasi: 93,
      catatanSupervisor: 'Penyajian materi konsep eksponen dan logaritma dibawakan dengan pendekatan visual dan latihan berjenjang. Guru terampil menggunakan teknik tanya jawab formatif untuk mendeteksi miskonsepsi.',
      rekomendasi: 'Berikan soal pengayaan (enrichment) bertipe penalaran tingkat tinggi (HOTS) bagi siswa yang telah menuntaskan target capaian lebih awal.'
    },
    {
      tanggal: '2026-07-24',
      namaGuru: 'Itang Supriadin, S.P.',
      nip: '19820511 202221 1 004',
      mapel: 'Agribisnis Pengolahan Hasil Pertanian',
      kelas: 'XII APHP',
      skorPerencanaan: 96,
      skorPelaksanaan: 96,
      skorEvaluasi: 95,
      catatanSupervisor: 'Penguasaan teknologi pengolahan suhu tinggi dan sterilisasi sari buah sangat profesional. Guru menerapkan alur Teaching Factory (TeFa) dengan simulasi lini produksi industri riil di bengkel APHP.',
      rekomendasi: 'Fasilitasi kemitraan langsung dengan industri mitra (DUDI) untuk sertifikasi kompetensi keahlian dan perluasan jalur pemasaran produk olahan sekolah.'
    },
    {
      tanggal: '2026-07-27',
      namaGuru: 'Giardi Achmad Fauzi, S.T.',
      nip: '19890214 202321 1 010',
      mapel: 'Desain Komunikasi Visual',
      kelas: 'XII DKV 1',
      skorPerencanaan: 97,
      skorPelaksanaan: 96,
      skorEvaluasi: 97,
      catatanSupervisor: 'Proses asistensi studio desain grafis berjalan sangat profesional layaknya agensi kreatif. Evaluasi tipografi, tata letak, dan color gamut CMYK dilakukan secara terperinci per siswa.',
      rekomendasi: 'Sangat direkomendasikan memimpin tim persiapan pameran karya akhir siswa (Showcase DKV) dan penyusunan portofolio digital berbasis Behance.'
    },
    {
      tanggal: '2026-07-27',
      namaGuru: 'Yogi, S.Kom.',
      nip: '19911025 202421 1 016',
      mapel: 'Desain Komunikasi Visual',
      kelas: 'XII DKV 3',
      skorPerencanaan: 95,
      skorPelaksanaan: 94,
      skorEvaluasi: 94,
      catatanSupervisor: "Penyampaian materi teknik animasi 2D dan pergerakan keyframe berlangsung dinamis. Guru mendemonstrasikan prinsip dasar animasi 'squash and stretch' dengan contoh visual yang sangat jelas.",
      rekomendasi: 'Tingkatkan ketersediaan aset audio open-source untuk latihan sound design pada animasi pendek siswa.'
    },
    {
      tanggal: '2026-07-28',
      namaGuru: 'Dede Adi Selamet M, S.Kom.',
      nip: '19930621 202521 1 018',
      mapel: 'Dasar-Dasar Desain Komunikasi Visual',
      kelas: 'X DKV 2',
      skorPerencanaan: 96,
      skorPelaksanaan: 95,
      skorEvaluasi: 96,
      catatanSupervisor: 'Pengenalan antarmuka perangkat lunak grafis dan latihan Pen Tool kurva Bezier terstruktur rapi. Guru telaten memberikan asistensi personal di meja komputer siswa.',
      rekomendasi: 'Gunakan shortcut cheat sheet interaktif dan mini-game akurasi Pen Tool untuk mempercepat penguasaan motorik siswa.'
    },
    {
      tanggal: '2026-07-28',
      namaGuru: 'Ruli Lesmana, S.T.',
      nip: '19860904 202321 1 007',
      mapel: 'Informatika',
      kelas: 'X APHP',
      skorPerencanaan: 95,
      skorPelaksanaan: 94,
      skorEvaluasi: 95,
      catatanSupervisor: 'Materi arsitektur komputer dan instalasi jaringan lokal (LAN) dipraktikkan langsung. Siswa berhasil melakukan crimping kabel UTP standar T568B dan pengetesan koneksi antarkomputer.',
      rekomendasi: 'Berikan penekanan lebih pada materi cyber hygiene dan keamanan kata sandi di era keterhubungan internet.'
    },
    {
      tanggal: '2026-07-29',
      namaGuru: 'Rian Septian, A.Md.',
      nip: '19941108 202521 1 020',
      mapel: 'Desain Komunikasi Visual',
      kelas: 'XII DKV 2',
      skorPerencanaan: 94,
      skorPelaksanaan: 95,
      skorEvaluasi: 94,
      catatanSupervisor: 'Praktik fotografi produk studio dengan pengaturan 3-point lighting disajikan sangat aplikatif. Siswa diajarkan menata sudut pencahayaan softbox dan reflektor untuk kemasan botol minuman.',
      rekomendasi: 'Latih siswa melakukan tethered shooting langsung ke layar laptop agar evaluasi komposisi gambar dapat dipantau real-time.'
    },
    {
      tanggal: '2026-07-30',
      namaGuru: 'Rahmayanti Rahayu, S.Pd.',
      nip: '19910305 202421 2 011',
      mapel: 'Matematika',
      kelas: 'XI DKV 1',
      skorPerencanaan: 95,
      skorPelaksanaan: 95,
      skorEvaluasi: 94,
      catatanSupervisor: 'Supervisi penguatan: Guru sukses menerapkan teknik diferensiasi proses pada penyelesaian SPLDV metode determinan matriks. Suasana belajar interaktif dan partisipatif.',
      rekomendasi: 'Dokumentasikan LKPD diferensiasi untuk dibagikan dalam forum Musyawarah Guru Mata Pelajaran (MGMP) Matematika SMK.'
    },
    {
      tanggal: '2026-07-31',
      namaGuru: 'Ali Maulana, S.Pd.',
      nip: '19870514 202421 1 009',
      mapel: 'Sejarah Indonesia',
      kelas: 'X DKV 2',
      skorPerencanaan: 95,
      skorPelaksanaan: 94,
      skorEvaluasi: 95,
      catatanSupervisor: 'Supervisi penguatan: Guru memanfaatkan tayangan dokumenter proklamasi kemerdekaan dan memandu analisis nilai juang pahlawan secara menyentuh hati para siswa.',
      rekomendasi: 'Fasilitasi penugasan wawancara tokoh sepuh Bojonggambir tentang memori sejarah lokal Tasikmalaya Selatan.'
    },
    {
      tanggal: '2026-08-03',
      namaGuru: 'Dede Adi Selamet M, S.Kom.',
      nip: '19930621 202521 1 018',
      mapel: 'Koding dan Kecerdasan Artifisial',
      kelas: 'XII DKV 1',
      skorPerencanaan: 97,
      skorPelaksanaan: 96,
      skorEvaluasi: 97,
      catatanSupervisor: 'Supervisi terfokus modul mutakhir KKA: Guru sangat kompeten memandu eksplorasi prompt engineering dan integrasi API AI untuk otomasi aset grafis. Siswa sangat antusias dan kritis.',
      rekomendasi: 'Jadikan kelas percontohan sekolah dalam literasi kecerdasan buatan etis dan otomasi alur kerja digital.'
    },
    {
      tanggal: '2026-08-04',
      namaGuru: 'Itang Supriadin, S.P.',
      nip: '19820511 202221 1 004',
      mapel: 'Projek Kreatif dan Kewirausahaan',
      kelas: 'XII APHP',
      skorPerencanaan: 96,
      skorPelaksanaan: 96,
      skorEvaluasi: 96,
      catatanSupervisor: 'Supervisi evaluasi puncak unit produksi: Pelaksanaan uji organoleptik dan pengemasan vakum produk nenas olahan siswa mencapai standar mutu jual pasar modern.',
      rekomendasi: 'Segera ajukan nomor P-IRT dan sertifikasi halal produk bersama Dinas Koperasi dan UMKM untuk pemasaran komersial.'
    },
    {
      tanggal: '2026-09-07',
      namaGuru: 'Ali Maulana, S.Pd.',
      nip: '19870514 202421 1 009',
      mapel: 'Sejarah Indonesia',
      kelas: 'X APHP',
      skorPerencanaan: 96,
      skorPelaksanaan: 95,
      skorEvaluasi: 95,
      catatanSupervisor: 'Supervisi akademik awal September: Pelaksanaan KBM tatap muka Sejarah Indonesia berjalan dinamis. Guru memfasilitasi diskusi kronologi proklamasi dengan media audio-visual interaktif.',
      rekomendasi: 'Pertahankan iklim belajar yang inklusif dan dorong siswa menyusun rangkuman mandiri berbasis peta konsep digital.'
    }
  ];

  supervisiPlanList.forEach((spv, idx) => {
    const avg = Number(((spv.skorPerencanaan + spv.skorPelaksanaan + spv.skorEvaluasi) / 3).toFixed(2));
    const month = spv.tanggal.split('-')[1];
    const spvNoStr = String(idx + 1).padStart(3, '0');
    const nomorSupervisi = `SPV/KS-SMKN-BJG/2026/${month}/${spvNoStr}`;

    const guruObj = safeGurus.find(g => g.nama.toLowerCase().includes(spv.namaGuru.split(',')[0].toLowerCase().trim()));
    const idGuru = guruObj ? guruObj.id : `gr-spv-${idx + 1}`;

    const record: SupervisiRecord = {
      id: `spv-ops-${spv.tanggal}-${idx + 1}`,
      nomorSupervisi,
      tanggal: spv.tanggal,
      namaGuru: spv.namaGuru,
      nip: spv.nip,
      supervisor: supervisorKepalaSekolah,
      mapel: spv.mapel,
      kelas: spv.kelas,
      skorPerencanaan: spv.skorPerencanaan,
      skorPelaksanaan: spv.skorPelaksanaan,
      skorEvaluasi: spv.skorEvaluasi,
      skorAkhir: avg,
      predikat: avg >= 90 ? 'Sangat Baik' : 'Baik',
      catatanSupervisor: spv.catatanSupervisor,
      rekomendasi: spv.rekomendasi,
      status: 'Selesai',
      fotoUrls: [
        'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80'
      ],
      dokumenUrl: `https://drive.google.com/drive/folders/simagu-supervisi-akademik/2026-${month}`,
      driveFolderLink: `https://drive.google.com/drive/folders/simagu-supervisi-akademik/guru_${spv.namaGuru.split(',')[0].replace(/\s+/g, '_')}`,
      ttdSupervisor: supervisorKepalaSekolah,
      ttdGuru: spv.namaGuru,
      id_guru: idGuru,
      id_kelas: spv.kelas
    };

    supervisiList.push(record);
  });

  // 5. GENERATE SAMPLE NILAI SISWA OPERASIONAL
  classListNames.slice(0, 4).forEach((kName, kIdx) => {
    const students = initialSiswaFormatted.filter(s => s.kelas === kName).slice(0, 10);
    students.forEach((st, sIdx) => {
      const score = 88 + ((sIdx * 3) % 10);
      nilaiSiswaList.push({
        id: `nil-ops-${kIdx}-${sIdx + 1}`,
        id_siswa: st.id,
        nis: st.nis,
        namaSiswa: st.nama,
        kelas: kName,
        hari: 'Jumat',
        mapel: kName.includes('APHP') ? 'Agribisnis Pengolahan Hasil Pertanian' : 'Desain Komunikasi Visual',
        guru: kName.includes('APHP') ? 'Itang Supriadin, S.P.' : 'Giardi Achmad Fauzi, S.T.',
        jenisAsesmen: 'Formatif (Tugas)',
        materiJudul: 'Asesmen Formatif Kompetensi Kejuruan',
        nilaiFormatif: score,
        nilaiPraktik: score,
        nilaiAkhir: score,
        predikat: score >= 90 ? 'A' : 'B',
        statusKelulusan: 'Tuntas',
        catatanGuru: 'Tuntas Capaian Pembelajaran dengan penguasaan konsep di atas rata-rata kriteria minimal.',
        tanggal: '2026-07-24'
      });
    });
  });

  // 6. OPERATIONAL NOTIFICATIONS & AUDIT LOGS
  const weeklyNotifications: NotificationItem[] = [
    {
      id: 'notif-ops-1',
      title: 'Supervisi Akademik Kepala Sekolah Selesai',
      message: 'Plt. Kepala Sekolah Iman Rahmat, S.Pd.I. telah menyelesaikan rangkaian supervisi akademik 19 guru pengampu periode 15 Juli - 4 Agustus 2026 dengan predikat Sangat Baik.',
      type: 'success',
      timestamp: '2026-08-04 15:30',
      read: false,
      targetRole: 'Kepala Sekolah'
    },
    {
      id: 'notif-ops-2',
      title: 'Rekapitulasi Agenda Kelas Terverifikasi Penuh',
      message: 'Seluruh 150 Agenda Kelas dari 10 rombel periode 15 Juli hingga 4 Agustus 2026 telah ditandatangani Ketua Kelas dan diverifikasi resmi oleh masing-masing Wali Kelas.',
      type: 'info',
      timestamp: '2026-08-04 15:00',
      read: false,
      targetRole: 'Wali Kelas'
    },
    {
      id: 'notif-ops-3',
      title: 'Sinkronisasi Agenda Harian Guru 426 Sesi KBM',
      message: "Sebanyak 426 sesi tatap muka KBM guru telah tervalidasi oleh Wakasek Kurikulum Wahab Mughni Sa'dillah, S.Pd.",
      type: 'info',
      timestamp: '2026-08-04 14:00',
      read: true,
      targetRole: 'Wakasek Kurikulum'
    },
    {
      id: 'notif-ops-4',
      title: 'Agenda Harian KBM 7 September 2026 Aktif',
      message: 'Agenda Harian Guru dan Agenda Kelas untuk hari Senin, 7 September 2026 telah terisi dan tervalidasi lengkap di seluruh rombel SMKN Bojonggambir.',
      type: 'success',
      timestamp: '2026-09-07 08:00',
      read: false,
      targetRole: 'Guru'
    }
  ];

  const weeklyAuditLogs: AuditLogItem[] = [
    {
      id: 'log-ops-0',
      timestamp: '2026-09-07 08:00:00',
      user: 'Administrator SIMAGU',
      role: 'Administrator',
      action: 'SYNC_OPERASIONAL_2026_09_07',
      details: 'Pengisian dan sinkronisasi otomatis Agenda Harian Guru serta Agenda Kelas Senin, 7 September 2026.',
      ipAddress: '192.168.1.1'
    },
    {
      id: 'log-ops-1',
      timestamp: '2026-08-04 15:35:10',
      user: 'Iman Rahmat, S.Pd.I.',
      role: 'Kepala Sekolah',
      action: 'FINALIZE_SUPERVISI',
      details: 'Kepala Sekolah memfinalisasi rekapitulasi penilaian supervisi akademik 19 guru pengampu periode 15 Juli - 4 Agustus 2026.',
      ipAddress: '192.168.1.101'
    },
    {
      id: 'log-ops-2',
      timestamp: '2026-08-04 15:10:45',
      user: 'Wahab Mughni Sa\'dillah, S.Pd.',
      role: 'Wakasek Kurikulum',
      action: 'VALIDATE_AGENDA_GURU',
      details: 'Memvalidasi seluruh 426 agenda KBM harian guru semester ganjil 2026/2027.',
      ipAddress: '192.168.1.105'
    },
    {
      id: 'log-ops-3',
      timestamp: '2026-08-04 14:45:20',
      user: 'Seni Sri Astuti, S.Pd.',
      role: 'Wali Kelas',
      action: 'SIGN_AGENDA_KELAS',
      details: 'Wali Kelas XI APHP memvalidasi berkas agenda kelas harian dan rekap absensi peserta didik.',
      ipAddress: '192.168.1.115'
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

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AgendaGuruItem, AgendaKelasItem, SchoolSetting, SupervisiRecord, NilaiSiswaRecord, RekapAbsensiBulananSiswaItem, AbsensiGuruRecord } from '../types';

const OFFICIAL_LOGO_URL = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2nISiQj-jbkcHI8rbm3kuat8yeHZk6x1jGcC3ryzyWhwR7J2pjIBdD0tdYrpx44IyIbPmSJJXJ6Lnk0VbKrRdSv05J_nF59t1YaiukpoYj3fgyLhK0ID7azgeAoXVBozIWC5weYmGyaK_xDLh8j2p1GsTrL3qhzEi-PyMt6-Jok8SqAuSU16LeIFFw_c/s320/LOGO%20.png';

async function getLogoImage(url: string): Promise<string | null> {
  const logoUrlToUse = url || OFFICIAL_LOGO_URL;

  // 1. Try fetching image directly and converting to Data URI
  try {
    const response = await fetch(logoUrlToUse, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      if (base64) return base64;
    }
  } catch (e) {
    // ignore fetch error and try canvas method
  }

  // 2. Try loading remote URL image via HTMLImageElement
  if (logoUrlToUse) {
    try {
      const dataUri = await new Promise<string | null>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width || 200;
            canvas.height = img.naturalHeight || img.height || 200;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/png'));
              return;
            }
          } catch (e) {
            // fallback
          }
          resolve(null);
        };
        img.onerror = () => resolve(null);
        img.src = logoUrlToUse;
      });
      if (dataUri) return dataUri;
    } catch (e) {
      console.warn('Gagal render logo via canvas image, menggunakan fallback seal.', e);
    }
  }

  // 2. Fallback: Draw high-resolution vector emblem seal for SMKN Bojonggambir
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Outer Navy Circle
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.arc(150, 150, 140, 0, 2 * Math.PI);
      ctx.fill();

      // Outer Ring Accent
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(150, 150, 128, 0, 2 * Math.PI);
      ctx.stroke();

      // Inner White Circle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(150, 150, 118, 0, 2 * Math.PI);
      ctx.fill();

      // Star Icon Top
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(150, 70, 12, 0, 2 * Math.PI);
      ctx.fill();

      // Book / Graduation Icon in Center
      ctx.fillStyle = '#0f766e';
      ctx.fillRect(85, 135, 130, 60);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(92, 142, 53, 46);
      ctx.fillRect(155, 142, 53, 46);

      // Text Header & Footer
      ctx.fillStyle = '#0f766e';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SMKN', 150, 115);

      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('BOJONGGAMBIR', 150, 230);

      return canvas.toDataURL('image/png');
    }
  } catch (e) {
    console.warn('Gagal membuat fallback canvas seal logo:', e);
  }

  return null;
}

async function drawKopSurat(doc: jsPDF, setting: SchoolSetting, isLandscape: boolean = false): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 11;

  const logoX = 14;
  const logoY = 10;
  const logoSize = 22;

  // Draw Logo Image
  try {
    const logoImg = await getLogoImage(setting.logoUrl);
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize);
    }
  } catch (e) {
    console.warn('Gagal menggambar logo di Kop Surat:', e);
  }

  // Header Kop Text
  const textLeftX = logoX + logoSize + 4;
  const textRightX = pageWidth - 14;
  const textCenterX = (textLeftX + textRightX) / 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isLandscape ? 11 : 10);
  doc.text('PEMERINTAH PROVINSI JAWA BARAT', textCenterX, yPos, { align: 'center' });
  yPos += 4.2;

  doc.setFontSize(isLandscape ? 10 : 9.5);
  doc.text('DINAS PENDIDIKAN', textCenterX, yPos, { align: 'center' });
  yPos += 4.2;

  doc.setFontSize(isLandscape ? 9.5 : 9);
  doc.text('CABANG DINAS PENDIDIKAN WILAYAH XII', textCenterX, yPos, { align: 'center' });
  yPos += 4.8;

  doc.setFontSize(isLandscape ? 13 : 12);
  doc.text((setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR').toUpperCase(), textCenterX, yPos, { align: 'center' });
  yPos += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`NPSN: ${setting.npsn || '69989796'} | Alamat: ${setting.alamat}`, textCenterX, yPos, { align: 'center' });
  yPos += 3.8;

  const contactText = `Telp: ${setting.telepon || '(0265) 754321'} | Email: ${setting.email || 'admin@smknbojonggambir.sch.id'} | Website: ${setting.website || 'www.smknbojonggambir.sch.id'}`;
  doc.text(contactText, textCenterX, yPos, { align: 'center' });
  yPos += 4;

  yPos = Math.max(yPos, 36);

  // Garis Kop Double (Thick line + Thin line)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(14, yPos, pageWidth - 14, yPos);
  doc.setLineWidth(0.2);
  doc.line(14, yPos + 0.9, pageWidth - 14, yPos + 0.9);

  return yPos + 6;
}

function addPageFooters(doc: jsPDF, setting: SchoolSetting) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);

    // Divider Line above footer
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    // Left Footer
    doc.text(
      `Dicetak: ${dateStr} ${timeStr} WIB | Dokumen Resmi Administrasi Sekolah | SIMAGU - ${setting.namaSekolah || 'SMKN BOJONGGAMBIR'}`,
      14,
      pageHeight - 6
    );

    // Right Footer
    doc.text(
      `Halaman ${i} dari ${pageCount}`,
      pageWidth - 14,
      pageHeight - 6,
      { align: 'right' }
    );
  }
}

export async function generateAgendaGuruPDF(agenda: AgendaGuruItem, setting: SchoolSetting) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, false);

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('AGENDA HARIAN PEMBELAJARAN GURU', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor Dokumen: ${agenda.nomorAgenda}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  // Identitas Guru & Kelas
  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['A. IDENTITAS GURU & KELAS', 'KETERANGAN DETAIL']],
    body: [
      ['Tahun Pelajaran / Semester', `${agenda.tahunPelajaran} (${agenda.semester})`],
      ['Hari / Tanggal', `${agenda.hari}, ${agenda.tanggal}`],
      ['Nama Guru / NIP', `${agenda.namaGuru} (NIP: ${agenda.nip})`],
      ['Mata Pelajaran / Konsentrasi', `${agenda.mapel} - ${agenda.konsentrasiKeahlian}`],
      ['Fase / Kelas / Rombel / Ruang', `Fase ${agenda.fase} / ${agenda.kelas} / ${agenda.rombel} / ${agenda.ruang}`],
      ['Jam Ke / Waktu / Jumlah JP', `Jam ke ${agenda.jamKe} (${agenda.waktu}) - Total ${agenda.jumlahJP} JP`],
      ['Status Pertemuan / Moda', `${agenda.statusPertemuan} / ${agenda.modaPembelajaran}`],
    ],
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  // Agenda Pembelajaran
  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['B. AGENDA PEMBELAJARAN & DESKRIPSI', 'URAIAN MATERI']],
    body: [
      ['Elemen Capaian', agenda.elemen],
      ['Capaian Pembelajaran (CP)', agenda.cp],
      ['Alur Tujuan Pembelajaran (ATP)', agenda.atp],
      ['Tujuan Pembelajaran', agenda.tujuanPembelajaran],
      ['Materi Pembelajaran', agenda.materi],
      ['Model & Metode Pembelajaran', `${agenda.modelPembelajaran} - ${agenda.metode}`],
      ['Media & Sumber Belajar', `${agenda.media} | ${agenda.sumberBelajar}`],
      ['Platform Digital & LKPD', `${agenda.platformDigital} | ${agenda.lkpd}`],
      ['Tugas & Deadline', agenda.tugas ? `${agenda.tugas} (Deadline: ${agenda.deadlineTugas || '-'})` : 'Tidak Ada Tugas'],
      ['Status Pembelajaran', agenda.statusPembelajaran],
    ],
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  // Rekap Kehadiran
  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['C. REKAP KEHADIRAN SISWA', 'JUMLAH / PERSENTASE']],
    body: [
      ['Total Siswa / Hadir', `${agenda.totalSiswa} Siswa / ${agenda.hadir} Hadir (${agenda.persentaseKehadiran}%)`],
      ['Sakit / Izin / Alpa / Terlambat', `Sakit: ${agenda.sakit} | Izin: ${agenda.izin} | Alpa: ${agenda.alpa} | Terlambat: ${agenda.terlambat}`],
      ['Daftar Siswa Tidak Hadir', agenda.siswaTidakHadir.length > 0
        ? agenda.siswaTidakHadir.map(s => `${s.nama} (${s.kategori} - ${s.alasan})`).join('\n')
        : 'Seluruh Siswa Hadir Lengkap'],
    ],
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  // Catatan & Refleksi
  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['D. CATATAN & REFLEKSI GURU', 'URAIAN']],
    body: [
      ['Kendala Pembelajaran', agenda.kendala || '-'],
      ['Solusi & Tindak Lanjut', agenda.solusi || '-'],
      ['Refleksi Guru', agenda.refleksi || '-'],
      ['Komunikasi Orang Tua', agenda.komunikasiOrtu || '-'],
    ],
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  const signDate = agenda.tanggalValidasi || agenda.tanggal;
  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  doc.text('Mengetahui,', 20, yPos);
  doc.text('Wakasek Bidang Kurikulum,', 20, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.', 20, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipWakasekKurikulum || '-'}`, 20, yPos + 26);

  const rightX = pageWidth - 70;
  doc.text(`${kota}, ${signDate}`, rightX, yPos);
  doc.text('Guru Mata Pelajaran,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(agenda.namaGuru, rightX, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${agenda.nip || '-'}`, rightX, yPos + 26);

  addPageFooters(doc, setting);
  doc.save(`AGENDA_GURU_${agenda.nomorAgenda.replace(/\//g, '_')}.pdf`);
}

export async function generateRekapAgendaGuruPDF(agendas: AgendaGuruItem[], setting: SchoolSetting, periode: string = 'harian') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`LAPORAN REKAPITULASI AGENDA PEMBELAJARAN GURU - PERIODE ${periode.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester}) | Total Agenda: ${agendas.length}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [['NO', 'TANGGAL / HARI', 'NAMA GURU / NIP', 'MAPEL / KELAS', 'MATERI / ELEMEN', 'JP', 'KEHADIRAN SISWA', 'STATUS']],
    body: agendas.map((ag, idx) => [
      idx + 1,
      `${ag.tanggal}\n(${ag.hari})`,
      `${ag.namaGuru}\nNIP: ${ag.nip}`,
      `${ag.mapel}\nKelas: ${ag.kelas}`,
      `${ag.materi}\nElemen: ${ag.elemen}`,
      `${ag.jumlahJP} JP\n(${ag.waktu})`,
      `${ag.hadir}/${ag.totalSiswa} (${ag.persentaseKehadiran}%)\nS:${ag.sakit} I:${ag.izin} A:${ag.alpa}`,
      ag.statusPembelajaran
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28 },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 },
      4: { cellWidth: 65 },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 32, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' },
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Wakasek Bidang Kurikulum,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.', rightX, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipWakasekKurikulum || '-'}`, rightX, yPos + 26);

  addPageFooters(doc, setting);
  doc.save(`REKAP_AGENDA_GURU_${periode.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateAgendaKelasPDF(agenda: AgendaKelasItem, setting: SchoolSetting) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, false);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`AGENDA HARIAN KELAS ${agenda.kelas.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal: ${agenda.hari}, ${agenda.tanggal} | Wali Kelas: ${agenda.waliKelas}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['A. STATISTIK KEHADIRAN KELAS', 'KETERANGAN']],
    body: [
      ['Total Siswa', `${agenda.jumlahSiswa} Siswa (${agenda.jumlahLaki} L / ${agenda.jumlahPerempuan} P)`],
      ['Hadir / Persentase', `${agenda.hadir} Hadir (${agenda.persentase}%)`],
      ['Sakit / Izin / Alpa / Terlambat', `Sakit: ${agenda.sakit} | Izin: ${agenda.izin} | Alpa: ${agenda.alpa} | Terlambat: ${agenda.terlambat}`],
    ],
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['JP', 'MATA PELAJARAN', 'GURU PENGAMPU', 'MATERI PEMBELAJARAN', 'STATUS']],
    body: agenda.monitoringPembelajaran.map(m => [
      m.jp, m.mapel, m.guru, m.materi, m.status
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 45 },
      3: { cellWidth: 55 },
      4: { cellWidth: 22, halign: 'center' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 5;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['CATATAN WALI KELAS & KEDISIPLINAN', 'URAIAN']],
    body: [
      ['Kondisi Umum Kelas', agenda.catatanWaliKelas.kondisiUmum || '-'],
      ['Kedisiplinan & Kebersihan', `${agenda.catatanWaliKelas.kedisiplinan} | Kebersihan: ${agenda.catatanWaliKelas.kebersihan}`],
      ['Pelanggaran Siswa', agenda.pelanggaranList.length > 0 
        ? agenda.pelanggaranList.map(p => `${p.namaSiswa}: ${p.pelanggaran} (${p.tindakan})`).join('\n') 
        : 'Tidak Ada Pelanggaran'],
      ['Prestasi Siswa', agenda.prestasiList.length > 0 
        ? agenda.prestasiList.map(p => `${p.namaSiswa}: ${p.juara} (${p.bidang})`).join('\n') 
        : 'Tidak Ada Catatan Prestasi'],
    ],
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Ketua Kelas,', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(agenda.ketuaKelas || 'Ketua Kelas', 20, yPos + 22);

  const rightX = pageWidth - 70;
  doc.setFont('helvetica', 'normal');
  doc.text(`${kota}, ${agenda.tanggal}`, rightX, yPos);
  doc.text('Wali Kelas,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(agenda.waliKelas, rightX, yPos + 22);

  addPageFooters(doc, setting);
  doc.save(`AGENDA_KELAS_${agenda.kelas.replace(/\s+/g, '_')}_${agenda.tanggal}.pdf`);
}

export async function generateRekapAgendaKelasPDF(agendas: AgendaKelasItem[], setting: SchoolSetting, periode: string = 'harian') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`LAPORAN REKAPITULASI AGENDA KELAS - PERIODE ${periode.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester}) | Total Agenda: ${agendas.length}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [['NO', 'KELAS', 'TANGGAL / HARI', 'WALI KELAS', 'KEHADIRAN SISWA', 'KEDISIPLINAN & KEBERSIHAN', 'STATUS VALIDASI']],
    body: agendas.map((ak, idx) => [
      idx + 1,
      ak.kelas,
      `${ak.tanggal}\n(${ak.hari})`,
      ak.waliKelas,
      `${ak.hadir}/${ak.jumlahSiswa} (${ak.persentase}%)\nS:${ak.sakit} I:${ak.izin} A:${ak.alpa}`,
      `${ak.catatanWaliKelas.kedisiplinan}\nKebersihan: ${ak.catatanWaliKelas.kebersihan}`,
      ak.validatedByWali ? `Valid Wali Kelas\n(${ak.tanggalValidasiWali || ak.tanggal})` : 'Belum Divalidasi'
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 35 },
      3: { cellWidth: 55 },
      4: { cellWidth: 45, halign: 'center' },
      5: { cellWidth: 60 },
      6: { cellWidth: 35, halign: 'center' },
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Wakasek Bidang Kesiswaan,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Ilfan Fauzi, S.Pd.', rightX, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text('NIP. 19930605 202321 1 008', rightX, yPos + 26);

  addPageFooters(doc, setting);
  doc.save(`REKAP_AGENDA_KELAS_${periode.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateSupervisiPDF(supervisi: SupervisiRecord, setting: SchoolSetting) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, false);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LEMBAR SUPERVISI AKADEMIK PEMBELAJARAN GURU', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nomor Dokumen: ${supervisi.nomorSupervisi}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['IDENTITAS PENILAIAN SUPERVISI', 'INFORMASI DETAIL']],
    body: [
      ['Tanggal Supervisi', supervisi.tanggal],
      ['Nama Guru / NIP', `${supervisi.namaGuru} (NIP: ${supervisi.nip || '-'})`],
      ['Mata Pelajaran', supervisi.mapel],
      ['Kelas / Rombel', supervisi.kelas],
      ['Supervisor / Penilai', supervisi.supervisor],
      ['Skor Perencanaan Pembelajaran', `${supervisi.skorPerencanaan} / 100`],
      ['Skor Pelaksanaan Pembelajaran', `${supervisi.skorPelaksanaan} / 100`],
      ['Skor Evaluasi & Penilaian', `${supervisi.skorEvaluasi} / 100`],
      ['Skor Akhir & Predikat', `${supervisi.skorAkhir} - Predikat: ${supervisi.predikat}`],
      ['Catatan Supervisor', supervisi.catatanSupervisor || '-'],
      ['Rekomendasi Tindak Lanjut', supervisi.rekomendasi || '-'],
    ],
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 20, yPos);
  doc.text('Kepala Sekolah,', 20, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 20, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 20, yPos + 26);

  const rightX = pageWidth - 70;
  doc.text(`${kota}, ${supervisi.tanggal}`, rightX, yPos);
  doc.text('Supervisor / Tim Penilai,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(supervisi.supervisor, rightX, yPos + 22);

  addPageFooters(doc, setting);
  doc.save(`SUPERVISI_${supervisi.namaGuru.replace(/\s+/g, '_')}_${supervisi.tanggal}.pdf`);
}

export async function generateRekapSupervisiPDF(supervisiList: SupervisiRecord[], setting: SchoolSetting, periode: string = 'harian') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`LAPORAN REKAPITULASI SUPERVISI AKADEMIK GURU - PERIODE ${periode.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester}) | Total Evaluasi: ${supervisiList.length}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [['NO', 'TANGGAL', 'NAMA GURU / NIP', 'MAPEL / KELAS', 'SUPERVISOR', 'SKOR AKHIR', 'PREDIKAT', 'REKOMENDASI']],
    body: supervisiList.map((s, idx) => [
      idx + 1,
      s.tanggal,
      `${s.namaGuru}\nNIP: ${s.nip || '-'}`,
      `${s.mapel}\nKelas: ${s.kelas}`,
      s.supervisor,
      s.skorAkhir,
      s.predikat,
      s.rekomendasi || '-'
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 },
      4: { cellWidth: 40 },
      5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 25, halign: 'center' },
      7: { cellWidth: 60 },
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Wakasek Bidang Kurikulum,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.', rightX, yPos + 22);

  addPageFooters(doc, setting);
  doc.save(`REKAP_SUPERVISI_${periode.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateRekapNilaiSiswaPDF(
  nilaiList: NilaiSiswaRecord[],
  setting: SchoolSetting,
  periode: string = 'harian',
  options?: {
    guruName?: string;
    nipGuru?: string;
    mapelName?: string;
    kelasName?: string;
    jenisAsesmen?: string;
  }
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  const teacherName = options?.guruName || nilaiList[0]?.guru || 'Guru Pengampu';
  const teacherNip = options?.nipGuru || '-';
  const mapelTitle = options?.mapelName || nilaiList[0]?.mapel || 'Mata Pelajaran';
  const kelasTitle = options?.kelasName || nilaiList[0]?.kelas || 'Semua Kelas';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`LAPORAN REKAPITULASI HASIL ASESMEN & NILAI SISWA PER GURU & PER MAPEL`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Mata Pelajaran: ${mapelTitle} | Guru: ${teacherName} | Kelas: ${kelasTitle}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester}) | Periode: ${periode.toUpperCase()} | Total Siswa: ${nilaiList.length}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [[
      'NO', 'HARI', 'TANGGAL', 'NIS', 'NAMA SISWA', 'KELAS', 'MAPEL',
      'GURU', 'ASESMEN', 'MATERI', 'FORMATIF', 'PRAKTIK', 'AKHIR', 'PRED', 'STATUS', 'CATATAN'
    ]],
    body: nilaiList.map((n, idx) => [
      idx + 1,
      n.hari || '-',
      n.tanggal || '-',
      n.nis || '-',
      n.namaSiswa,
      n.kelas,
      n.mapel,
      n.guru,
      n.jenisAsesmen,
      n.materiJudul || '-',
      n.nilaiFormatif,
      n.nilaiPraktik,
      n.nilaiAkhir,
      n.predikat || (n.nilaiAkhir >= 90 ? 'A' : n.nilaiAkhir >= 80 ? 'B' : n.nilaiAkhir >= 70 ? 'C' : 'D'),
      n.statusKelulusan,
      n.catatanGuru || '-'
    ]),
    margin: { left: 10, right: 10 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 32 },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 26 },
      7: { cellWidth: 26 },
      8: { cellWidth: 22 },
      9: { cellWidth: 22 },
      10: { cellWidth: 14, halign: 'center' },
      11: { cellWidth: 14, halign: 'center' },
      12: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      13: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      14: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      15: { cellWidth: 25 }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Guru Mata Pelajaran,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(teacherName, rightX, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${teacherNip}`, rightX, yPos + 26);

  addPageFooters(doc, setting);
  doc.save(`REKAP_NILAI_${mapelTitle.replace(/[^a-zA-Z0-0]/g, '_')}_${teacherName.replace(/[^a-zA-Z0-0]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateRekapAbsensiBulananPDF(
  rekapItems: RekapAbsensiBulananSiswaItem[],
  setting: SchoolSetting,
  options: { bulan: string; tahun: string; kelas: string; guruName?: string; mapelName?: string; waliKelas?: string }
) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  // Judul Dokumen Laporan Rekap Bulanan
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`LAPORAN REKAPITULASI PRESENSI SISWA PER BULAN`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  const filterInfo = `Bulan: ${options.bulan.toUpperCase()} ${options.tahun} | Kelas: ${options.kelas} ${options.mapelName ? `| Mapel: ${options.mapelName}` : ''} ${options.guruName && options.guruName !== 'all' ? `| Pengampu: ${options.guruName}` : ''}`;
  doc.text(filterInfo, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4;

  doc.setFontSize(8);
  doc.text(
    `Tahun Pelajaran ${setting.tahunPelajaran || '2026/2027'} (${setting.semester || 'Ganjil'}) | Total Peserta Didik: ${rekapItems.length} Siswa`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  yPos += 7;

  // Table header and body
  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [['NO', 'NIS', 'NAMA LENGKAP SISWA', 'JK', 'KELAS', 'HADIR (H)', 'SAKIT (S)', 'IZIN (I)', 'ALPA (A)', 'TL (T)', 'TOTAL ABSEN', '% KEHADIRAN']],
    body: rekapItems.map((s, idx) => [
      idx + 1,
      s.nis,
      s.nama,
      s.gender,
      s.kelas,
      s.hadir,
      s.sakit,
      s.izin,
      s.alpa,
      s.terlambat,
      s.totalAbsen,
      `${s.persentase}%`
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 65 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 20, halign: 'center' },
      7: { cellWidth: 20, halign: 'center' },
      8: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 16, halign: 'center' },
      10: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      11: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');

  // Left Sign: Kepala Sekolah
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  // Right Sign: Wali Kelas / Guru Pengampu
  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Wali Kelas / Guru Pengampu,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(options.waliKelas || options.guruName || 'Wali Kelas', rightX, yPos + 22);

  addPageFooters(doc, setting);
  doc.save(`REKAP_ABSENSI_BULANAN_${options.kelas.replace(/\s+/g, '_')}_${options.bulan}_${options.tahun}.pdf`);
}

export async function generateRekapAbsensiGuruPDF(absensiList: AbsensiGuruRecord[], setting: SchoolSetting, periode: string = 'harian') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`LAPORAN REKAPITULASI ABSENSI & KEHADIRAN GURU - PERIODE ${periode.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester}) | Total Catatan: ${absensiList.length}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [['NO', 'TANGGAL & HARI', 'NAMA GURU / NIP', 'JAM MASUK', 'JAM PULANG', 'STATUS PRESENSI', 'KETERANGAN']],
    body: absensiList.map((a, idx) => [
      idx + 1,
      `${a.tanggal}\n(${(a as any).hari || '-'})`,
      `${a.namaGuru}\nNIP: ${a.nip || '-'}`,
      a.jamMasuk || '-',
      a.jamKeluar || '-',
      a.status,
      a.keterangan || '-'
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 65 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 30, halign: 'center' },
      5: { cellWidth: 35, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Wakasek Bidang Kurikulum,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.', rightX, yPos + 22);

  addPageFooters(doc, setting);
  doc.save(`REKAP_ABSENSI_GURU_${periode.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateDisiplinPrestasiPDF(pelanggaranList: any[], prestasiList: any[], setting: SchoolSetting) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LAPORAN KEDISIPLINAN, PELANGGARAN & PRESTASI SISWA', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester})`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  // Table Pelanggaran
  if (pelanggaranList.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('A. REKAPITULASI PELANGGARAN KEDISIPLINAN SISWA', 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
      headStyles: { fillColor: [180, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      head: [['NO', 'TANGGAL', 'NAMA SISWA', 'KELAS', 'JENIS PELANGGARAN', 'POIN', 'TINDAKAN & TINDAK LANJUT']],
      body: pelanggaranList.map((p, idx) => [
        idx + 1, p.tanggal || '-', p.namaSiswa, p.kelas, p.pelanggaran, `+${p.poin || 0}`, `${p.tindakan} (${p.tindakLanjut || '-'})`
      ]),
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 50 },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 60 },
        5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 'auto' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // Table Prestasi
  if (prestasiList.length > 0) {
    if (yPos > 140) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('B. REKAPITULASI RAIHAN PRESTASI SISWA', 14, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      head: [['NO', 'TANGGAL', 'NAMA SISWA', 'KELAS', 'JUARA / CAPAIAN', 'BIDANG / KEGIATAN', 'TINGKAT', 'KETERANGAN']],
      body: prestasiList.map((pr, idx) => [
        idx + 1, pr.tanggal || '-', pr.namaSiswa, pr.kelas, pr.juara, pr.bidang, pr.tingkat, pr.keterangan || '-'
      ]),
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 45 },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 35, fontStyle: 'bold' },
        5: { cellWidth: 40 },
        6: { cellWidth: 25, halign: 'center' },
        7: { cellWidth: 'auto' }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Wakasek Bidang Kesiswaan,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text('Ilfan Fauzi, S.Pd.', rightX, yPos + 22);

  addPageFooters(doc, setting);
  doc.save(`DISIPLIN_PRESTASI_SISWA_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateInventarisPDF(inventarisList: any[], setting: SchoolSetting) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LAPORAN INVENTARIS SARANA & PRASARANA LAB / SEKOLAH', pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester}) | Total Barang: ${inventarisList.length}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [['NO', 'KODE BARANG', 'NAMA BARANG / PERALATAN', 'KATEGORI', 'LOKASI / RUANG', 'JUMLAH', 'KONDISI BAIK', 'KONDISI RUSAK', 'STATUS / PENANGGUNG JAWAB']],
    body: inventarisList.map((item, idx) => [
      idx + 1,
      item.kode || `BRG-${idx+1}`,
      item.namaBarang,
      item.kategori || 'Peralatan Lab',
      item.lokasi || 'Lab Komputer',
      item.jumlah || 1,
      item.baik || item.jumlah || 1,
      item.rusak || 0,
      item.penanggungJawab || item.status || 'Tersedia'
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 55 },
      3: { cellWidth: 35 },
      4: { cellWidth: 35 },
      5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Kepala Lab / Pengelola Sarpras,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.', rightX, yPos + 22);

  addPageFooters(doc, setting);
  doc.save(`LAPORAN_INVENTARIS_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateJadwalPDF(jadwalList: any[], setting: SchoolSetting, titleSubtitle: string = 'JADWAL PELAJARAN DAN MENGAJAR GURU') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(titleSubtitle.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester}) | Total Alokasi: ${jadwalList.length} Jam Pelajaran`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [['NO', 'HARI', 'JAM KE / WAKTU', 'KELAS', 'MATA PELAJARAN', 'GURU PENGAMPU / NIP', 'RUANG / LAB', 'ALOKASI JP']],
    body: jadwalList.map((j, idx) => [
      idx + 1,
      j.hari || 'Senin',
      `Jam ke ${j.jamKe || idx+1}\n(${j.waktu || '07.15-08.00'})`,
      j.kelas || 'XI RPL 1',
      j.mapel || 'Pemrograman Web',
      `${j.guru || 'Guru Pengampu'}\nNIP: ${j.nipGuru || '-'}`,
      j.ruang || 'Lab Komputer 2',
      `${j.jumlahJP || 1} JP`
    ]),
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 60 },
      5: { cellWidth: 65 },
      6: { cellWidth: 30, halign: 'center' },
      7: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Wakasek Bidang Kurikulum,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.', rightX, yPos + 22);

  addPageFooters(doc, setting);
  doc.save(`JADWAL_PELAJARAN_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateMasterDataPDF(title: string, headers: string[], rows: any[][], setting: SchoolSetting) {
  const doc = new jsPDF({
    orientation: rows.length > 0 && rows[0].length > 5 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isLandscape = rows.length > 0 && rows[0].length > 5;
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, isLandscape);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester}) | Total Baris: ${rows.length}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [headers],
    body: rows,
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  const maxLimit = isLandscape ? 155 : 230;
  if (yPos > maxLimit) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Pengelola Data Sekolah,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.', rightX, yPos + 22);

  addPageFooters(doc, setting);
  doc.save(`${title.replace(/\s+/g, '_').toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function generateAbsentStudentsPDF(absentList: any[], setting: SchoolSetting, periode: string = 'harian') {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = await drawKopSurat(doc, setting, true);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`LAPORAN DAFTAR SISWA TIDAK HADIR (SAKIT, IZIN, ALPA) - PERIODE ${periode.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tahun Pelajaran ${setting.tahunPelajaran} (${setting.semester}) | Total Catatan: ${absentList.length} Siswa`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 7;

  autoTable(doc, {
    startY: yPos,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: [200, 200, 200] },
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [['NO', 'TANGGAL / HARI', 'KELAS', 'NIS', 'NAMA SISWA', 'STATUS', 'ALASAN / KETERANGAN', 'MAPEL / SUMBER', 'GURU / WALI KELAS']],
    body: absentList.map((item, idx) => [
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
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 28, halign: 'center' },
      2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 45, fontStyle: 'bold' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 50 },
      7: { cellWidth: 40 },
      8: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  if (yPos > 155) {
    doc.addPage();
    yPos = 20;
  }

  const kota = setting.alamat?.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';
  const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Mengetahui,', 25, yPos);
  doc.text('Kepala Sekolah,', 25, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.', 25, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipKepalaSekolah || '-'}`, 25, yPos + 26);

  const rightX = pageWidth - 90;
  doc.text(`${kota}, ${today}`, rightX, yPos);
  doc.text('Guru / Wali Kelas,', rightX, yPos + 4);
  doc.setFont('helvetica', 'bold');
  doc.text(setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.', rightX, yPos + 22);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${setting.nipWakasekKurikulum || '-'}`, rightX, yPos + 26);

  addPageFooters(doc, setting);
  doc.save(`REKAP_SISWA_TIDAK_HADIR_${periode.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
}


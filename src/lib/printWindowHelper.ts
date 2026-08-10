import { SchoolSetting } from '../types';

export const OFFICIAL_SCHOOL_LOGO = 'https://raw.githubusercontent.com/smknbojonggambir/simagu/main/logo.png';

export interface PrintReportOptions {
  title: string;
  subtitle?: string;
  nomorDokumen?: string;
  orientation?: 'portrait' | 'landscape';
  metadataGrid?: Array<{ label: string; value: string }>;
  headers: string[];
  rows: (string | number)[][];
  alignments?: ('left' | 'center' | 'right')[];
  columnWidths?: string[];
  signLeft?: {
    role: string;
    nama: string;
    nip?: string;
  };
  signRight?: {
    role: string;
    nama: string;
    nip?: string;
    locationDate?: string;
  };
}

export function generateKopSuratHTML(setting: SchoolSetting): string {
  const logo = setting.logoUrl || OFFICIAL_SCHOOL_LOGO;
  const namaSekolah = (setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR').toUpperCase();
  const npsn = setting.npsn || '69989796';
  const alamat = setting.alamat || 'Jl. Bojonggambir Kp. Mandalawangi RT005/005, Kec. Bojonggambir, Kab. Tasikmalaya';
  const telepon = setting.telepon || '(0265) 754321';
  const email = setting.email || 'admin@smknbojonggambir.sch.id';
  const website = setting.website || 'www.smknbojonggambir.sch.id';

  return `
    <div class="kop-header" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 14px;">
      <div style="width: 80px; text-align: center; flex-shrink: 0;">
        <img src="${logo}" alt="Logo Sekolah" style="width: 75px; height: 75px; object-fit: contain;" onError="this.style.display='none'" />
      </div>
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <h4 style="margin: 0; font-size: 11pt; font-weight: bold; font-family: Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">PEMERINTAH PROVINSI JAWA BARAT</h4>
        <h4 style="margin: 1px 0; font-size: 10pt; font-weight: bold; font-family: Arial, sans-serif; text-transform: uppercase;">DINAS PENDIDIKAN</h4>
        <h5 style="margin: 1px 0; font-size: 9.5pt; font-weight: bold; font-family: Arial, sans-serif; text-transform: uppercase;">CABANG DINAS PENDIDIKAN WILAYAH XII</h5>
        <h2 style="margin: 3px 0; font-size: 14pt; font-weight: 800; font-family: Arial, sans-serif; color: #000; text-transform: uppercase; letter-spacing: 0.5px;">${namaSekolah}</h2>
        <p style="margin: 1px 0; font-size: 8pt; font-family: Arial, sans-serif; color: #222;">
          NPSN: ${npsn} | Alamat: ${alamat}
        </p>
        <p style="margin: 1px 0; font-size: 8pt; font-family: Arial, sans-serif; color: #222;">
          Telp: ${telepon} | Email: ${email} | Website: ${website}
        </p>
      </div>
      <div style="width: 80px; flex-shrink: 0;"></div>
    </div>
  `;
}

export function printHtmlReport(setting: SchoolSetting, options: PrintReportOptions) {
  const isLandscape = options.orientation === 'landscape';
  const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const kota = setting.alamat?.includes('Tasikmalaya') ? 'Tasikmalaya' : 'Bojonggambir';

  const signLeftRole = options.signLeft?.role || 'Mengetahui,\nKepala Sekolah';
  const signLeftNama = options.signLeft?.nama || setting.kepalaSekolah || 'Iman Rahmat, S.Pd.I.';
  const signLeftNip = options.signLeft?.nip || setting.nipKepalaSekolah || '-';

  const signRightRole = options.signRight?.role || 'Guru Mata Pelajaran / Wali Kelas';
  const signRightNama = options.signRight?.nama || setting.wakasekKurikulum || 'Wahab Mughni Sa\'dillah, S.Pd.';
  const signRightNip = options.signRight?.nip || setting.nipWakasekKurikulum || '-';
  const signRightLocationDate = options.signRight?.locationDate || `${kota}, ${todayStr}`;

  let metadataHtml = '';
  if (options.metadataGrid && options.metadataGrid.length > 0) {
    metadataHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt;">
        <tbody>
          ${options.metadataGrid.map((item, idx) => {
            if (idx % 2 === 0) {
              const next = options.metadataGrid![idx + 1];
              return `
                <tr>
                  <td style="width: 18%; font-weight: bold; padding: 4px 6px; background-color: #f8fafc; border: 1px solid #cbd5e1;">${item.label}</td>
                  <td style="width: 32%; padding: 4px 6px; border: 1px solid #cbd5e1;">${item.value}</td>
                  ${next ? `
                    <td style="width: 18%; font-weight: bold; padding: 4px 6px; background-color: #f8fafc; border: 1px solid #cbd5e1;">${next.label}</td>
                    <td style="width: 32%; padding: 4px 6px; border: 1px solid #cbd5e1;">${next.value}</td>
                  ` : `
                    <td style="width: 18%; padding: 4px 6px; border: 1px solid #cbd5e1;"></td>
                    <td style="width: 32%; padding: 4px 6px; border: 1px solid #cbd5e1;"></td>
                  `}
                </tr>
              `;
            }
            return '';
          }).join('')}
        </tbody>
      </table>
    `;
  }

  const tableHeadersHtml = options.headers.map((h, i) => {
    const align = options.alignments?.[i] || 'left';
    const width = options.columnWidths?.[i] ? `width="${options.columnWidths[i]}"` : '';
    return `<th ${width} style="padding: 6px 8px; border: 1px solid #000; background-color: #0f766e; color: #ffffff; font-weight: bold; text-align: ${align}; font-size: 8.5pt;">${h}</th>`;
  }).join('');

  const tableRowsHtml = options.rows.map((row, rIdx) => {
    const bg = rIdx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';
    const cells = row.map((c, cIdx) => {
      const align = options.alignments?.[cIdx] || 'left';
      return `<td style="padding: 5px 7px; border: 1px solid #334155; text-align: ${align}; font-size: 8.5pt; vertical-align: top;">${String(c).replace(/\n/g, '<br/>')}</td>`;
    }).join('');
    return `<tr style="${bg} page-break-inside: avoid;">${cells}</tr>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${options.title} - ${setting.namaSekolah}</title>
      <style>
        @page {
          size: A4 ${isLandscape ? 'landscape' : 'portrait'};
          margin: 12mm 15mm 15mm 15mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9.5pt;
          color: #000;
          background: #fff;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .header-title {
          text-align: center;
          margin: 10px 0 14px 0;
        }
        .header-title h3 {
          margin: 0;
          font-size: 13pt;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header-title p {
          margin: 3px 0 0 0;
          font-size: 9pt;
          color: #333;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 20px;
        }
        table.data-table thead {
          display: table-header-group;
        }
        table.data-table tr {
          page-break-inside: avoid;
        }
        .ttd-section {
          margin-top: 25px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
          font-size: 9pt;
        }
        .ttd-box {
          width: 45%;
          text-align: center;
        }
        .ttd-space {
          height: 55px;
        }
        .footer-note {
          margin-top: 30px;
          padding-top: 6px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          font-size: 7.5pt;
          color: #64748b;
        }
        @media print {
          .no-print { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: #0f766e; padding: 10px 16px; border-radius: 8px; color: white; font-weight: bold; font-size: 12px; font-family: sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
        <button onclick="window.print()" style="background: white; color: #0f766e; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px; margin-right: 8px;">
          🖨️ Cetak Dokumen / Print PDF
        </button>
        <button onclick="window.close()" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
          ✕ Tutup
        </button>
      </div>

      <!-- Kop Surat Resmi -->
      ${generateKopSuratHTML(setting)}

      <!-- Document Title -->
      <div class="header-title">
        <h3>${options.title}</h3>
        ${options.subtitle ? `<p>${options.subtitle}</p>` : ''}
        ${options.nomorDokumen ? `<p style="font-weight: bold; font-size: 8.5pt;">Nomor Dokumen: ${options.nomorDokumen}</p>` : ''}
      </div>

      <!-- Metadata Info Grid if available -->
      ${metadataHtml}

      <!-- Main Data Table -->
      <table class="data-table">
        <thead>
          <tr>
            ${tableHeadersHtml}
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <!-- Signatures Section -->
      <div class="ttd-section">
        <div class="ttd-box">
          <p style="margin: 0;">${signLeftRole.replace(/\n/g, '<br/>')}</p>
          <div class="ttd-space"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${signLeftNama}</p>
          <p style="margin: 2px 0 0 0; font-size: 8.5pt;">NIP. ${signLeftNip}</p>
        </div>
        <div class="ttd-box">
          <p style="margin: 0;">${signRightLocationDate}</p>
          <p style="margin: 0;">${signRightRole.replace(/\n/g, '<br/>')}</p>
          <div class="ttd-space"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${signRightNama}</p>
          <p style="margin: 2px 0 0 0; font-size: 8.5pt;">NIP. ${signRightNip}</p>
        </div>
      </div>

      <!-- Official Footer -->
      <div class="footer-note">
        <div>Dokumen Resmi Administrasi Sekolah | SIMAGU - ${setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR'}</div>
        <div>Dicetak pada: ${todayStr} Pukul ${timeStr} WIB</div>
      </div>

      <script>
        // Auto trigger print when popup window finishes loading
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    alert('Browser memblokir popup jendela cetak. Silakan izinkan popup untuk aplikasi ini.');
  }
}

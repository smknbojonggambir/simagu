import React, { useState } from 'react';
import { Printer, Download, FileSpreadsheet, X, Eye, ZoomIn, ZoomOut, RotateCcw, FileText } from 'lucide-react';
import { SchoolSetting } from '../types';
import { OFFICIAL_SCHOOL_LOGO, printHtmlReport, PrintReportOptions } from '../lib/printWindowHelper';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  setting: SchoolSetting;
  options: PrintReportOptions;
  onDownloadPdf?: () => void;
  onExportExcel?: () => void;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  setting,
  options,
  onDownloadPdf,
  onExportExcel
}) => {
  if (!isOpen) return null;

  const [zoom, setZoom] = useState<number>(100);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    options.orientation || 'landscape'
  );

  const isLandscape = orientation === 'landscape';
  const logoUrl = setting.logoUrl || OFFICIAL_SCHOOL_LOGO;
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

  const handlePrintWindow = () => {
    printHtmlReport(setting, { ...options, orientation });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/90 backdrop-blur-md text-slate-100 overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800/95 px-4 py-3 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Pratinjau Cetak Dokumen (A4 {isLandscape ? 'Landscape' : 'Portrait'})
              <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[11px] font-semibold text-teal-300 border border-teal-500/30">
                Dokumen Resmi
              </span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-md">
              {options.title} {options.subtitle ? `• ${options.subtitle}` : ''}
            </p>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Orientation Switcher */}
          <div className="flex items-center rounded-xl bg-slate-900/80 p-1 border border-slate-700">
            <button
              onClick={() => setOrientation('portrait')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                !isLandscape ? 'bg-teal-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Portrait</span>
            </button>
            <button
              onClick={() => setOrientation('landscape')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                isLandscape ? 'bg-teal-500 text-slate-950 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5 rotate-90" />
              <span>Landscape</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 px-2 py-1 border border-slate-700">
            <button
              onClick={() => setZoom(prev => Math.max(50, prev - 10))}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono font-bold w-12 text-center text-teal-400">{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(150, prev + 10))}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="h-6 w-[1px] bg-slate-700 mx-1" />

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-bold transition shadow-xs active:scale-95"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Excel</span>
            </button>
          )}

          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="flex items-center gap-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 px-3 py-1.5 text-xs font-bold transition shadow-xs active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh PDF</span>
            </button>
          )}

          <button
            onClick={handlePrintWindow}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-md active:scale-95"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Cetak Dokumen</span>
          </button>

          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-300 hover:text-white p-2 transition ml-2"
            title="Tutup Pratinjau"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Workspace */}
      <div className="flex-1 overflow-auto p-6 flex justify-center bg-slate-950/80">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className="my-auto shadow-2xl rounded-sm transition-all"
        >
          {/* Simulated A4 Paper */}
          <div
            style={{
              width: isLandscape ? '297mm' : '210mm',
              minHeight: isLandscape ? '210mm' : '297mm',
              padding: '12mm 15mm 15mm 15mm'
            }}
            className="bg-white text-slate-950 shadow-2xl font-sans relative flex flex-col justify-between"
          >
            <div>
              {/* Kop Surat Header */}
              <div className="flex items-center justify-between border-b-4 border-double border-black pb-2 mb-3">
                <div className="w-[75px] text-center flex-shrink-0">
                  <img
                    src={logoUrl}
                    alt="Logo Sekolah"
                    className="w-[70px] h-[70px] object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 text-center px-2">
                  <h4 className="m-0 text-[11pt] font-bold uppercase tracking-wider text-black">
                    PEMERINTAH PROVINSI JAWA BARAT
                  </h4>
                  <h4 className="m-0 text-[10pt] font-bold uppercase text-black">DINAS PENDIDIKAN</h4>
                  <h5 className="m-0 text-[9.5pt] font-bold uppercase text-black">
                    CABANG DINAS PENDIDIKAN WILAYAH XII
                  </h5>
                  <h2 className="my-0.5 text-[14pt] font-extrabold uppercase text-black tracking-wide">
                    {(setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR').toUpperCase()}
                  </h2>
                  <p className="m-0 text-[8pt] text-slate-800 font-medium">
                    NPSN: {setting.npsn || '69989796'} | Alamat: {setting.alamat || 'Jl. Bojonggambir Kp. Mandalawangi, Kec. Bojonggambir'}
                  </p>
                  <p className="m-0 text-[8pt] text-slate-800 font-medium">
                    Telp: {setting.telepon || '(0265) 754321'} | Email: {setting.email || 'admin@smknbojonggambir.sch.id'} | Website: {setting.website || 'www.smknbojonggambir.sch.id'}
                  </p>
                </div>
                <div className="w-[75px] flex-shrink-0" />
              </div>

              {/* Document Title Header */}
              <div className="text-center my-3">
                <h3 className="m-0 text-[12pt] font-bold uppercase tracking-wide text-black">
                  {options.title}
                </h3>
                {options.subtitle && (
                  <p className="m-0 text-[9pt] text-slate-700 font-medium">{options.subtitle}</p>
                )}
                {options.nomorDokumen && (
                  <p className="m-0 text-[8.5pt] font-bold text-slate-900">
                    Nomor Dokumen: {options.nomorDokumen}
                  </p>
                )}
              </div>

              {/* Optional Metadata Grid */}
              {options.metadataGrid && options.metadataGrid.length > 0 && (
                <div className="grid grid-cols-2 gap-1 mb-3 text-[8.5pt] border border-slate-300 rounded-xs bg-slate-50 p-2">
                  {options.metadataGrid.map((meta, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="font-bold w-36 text-slate-800">{meta.label}:</span>
                      <span className="text-slate-900">{meta.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Table */}
              <table className="w-full border-collapse my-2 text-[8.5pt]">
                <thead>
                  <tr className="bg-teal-800 text-white font-bold">
                    {options.headers.map((h, i) => (
                      <th
                        key={i}
                        className="border border-slate-900 px-2 py-1.5 text-center font-bold"
                        style={{ width: options.columnWidths?.[i] }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {options.rows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}
                    >
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="border border-slate-400 px-2 py-1 text-slate-900 align-top"
                          style={{ textAlign: options.alignments?.[cIdx] || 'left' }}
                        >
                          {String(cell).split('\n').map((line, lIdx) => (
                            <React.Fragment key={lIdx}>
                              {lIdx > 0 && <br />}
                              {line}
                            </React.Fragment>
                          ))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signature & Footer Section */}
            <div className="mt-6 pt-2">
              <div className="flex justify-between text-[9pt]">
                {/* Left Signature */}
                <div className="w-5/12 text-center">
                  <p className="m-0 whitespace-pre-line font-medium text-slate-900">{signLeftRole}</p>
                  <div className="h-14" />
                  <p className="m-0 font-bold underline text-black">{signLeftNama}</p>
                  <p className="m-0 text-[8.5pt] text-slate-800">NIP. {signLeftNip}</p>
                </div>

                {/* Right Signature */}
                <div className="w-5/12 text-center">
                  <p className="m-0 font-medium text-slate-900">{signRightLocationDate}</p>
                  <p className="m-0 whitespace-pre-line font-medium text-slate-900">{signRightRole}</p>
                  <div className="h-14" />
                  <p className="m-0 font-bold underline text-black">{signRightNama}</p>
                  <p className="m-0 text-[8.5pt] text-slate-800">NIP. {signRightNip}</p>
                </div>
              </div>

              {/* Bottom Document Footer */}
              <div className="mt-6 pt-2 border-t border-slate-300 flex justify-between text-[7.5pt] text-slate-500 font-sans">
                <div>Dokumen Resmi Administrasi Sekolah | SIMAGU - {setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR'}</div>
                <div>Dicetak pada: {todayStr} Pukul {timeStr} WIB</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

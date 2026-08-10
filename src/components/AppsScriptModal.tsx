import React, { useState } from 'react';
import { X, Copy, Check, Download, ExternalLink, Code2, Database } from 'lucide-react';
import { generateGoogleAppsScriptCode } from '../lib/gasCodeGenerator';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const gasCode = generateGoogleAppsScriptCode();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(gasCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([gasCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-6 w-6 text-teal-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Backend Code: Google Apps Script (Code.gs)
              </h3>
              <p className="text-xs text-slate-500">
                Salin kode ini ke Google Sheets → Extensions → Apps Script untuk mengaktifkan Web App API.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Steps Box */}
        <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 space-y-1">
          <p className="font-bold">Cara Memasang Backend Google Apps Script (4 Langkah Mudah):</p>
          <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-teal-800 dark:text-teal-300">
            <li>Buka Google Sheet Anda, klik menu <b>Ekstensi (Extensions)</b> → <b>Apps Script</b>.</li>
            <li>Hapus semua kode di file <code className="bg-teal-100 dark:bg-teal-900 px-1 rounded">Code.gs</code>, lalu <b>Tempel / Paste</b> kode di bawah.</li>
            <li>Jalankan fungsi <code className="bg-teal-100 dark:bg-teal-900 px-1 rounded">setupDatabase()</code> satu kali untuk membuat 24 lembar kerja (Sheets) otomatis.</li>
            <li>Klik tombol <b>Terapkan (Deploy)</b> → <b>Penerapan Baru (New Deployment)</b> → Jenis: <b>Aplikasi Web (Web App)</b> → Akses: <b>Siapa Saja (Anyone)</b>.</li>
          </ol>
        </div>

        {/* Code View */}
        <div className="relative">
          <div className="absolute right-3 top-3 flex gap-2 z-10">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-teal-700 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Code.gs</span>
            </button>
          </div>

          <pre className="max-h-[50vh] overflow-y-auto rounded-xl bg-slate-950 p-4 text-xs font-mono text-teal-300 border border-slate-800 leading-relaxed">
            {gasCode}
          </pre>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

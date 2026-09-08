import React, { useState, useEffect } from 'react';
import { X, User, Hash, School, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import { SiswaItem, KelasItem, JurusanItem } from '../../types';

interface SiswaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (siswa: SiswaItem) => void;
  initialData?: SiswaItem | null;
  kelasList: KelasItem[];
  jurusanList: JurusanItem[];
  existingSiswaList: SiswaItem[];
}

export const SiswaFormModal: React.FC<SiswaFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  kelasList,
  jurusanList,
  existingSiswaList
}) => {
  const isEditMode = Boolean(initialData);

  const [nis, setNis] = useState('');
  const [nisn, setNisn] = useState('');
  const [nama, setNama] = useState('');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [kelas, setKelas] = useState('');
  const [jurusan, setJurusan] = useState('');
  const [namaOrtu, setNamaOrtu] = useState('');
  const [teleponOrtu, setTeleponOrtu] = useState('');
  const [alamat, setAlamat] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Alumni' | 'Pindah'>('Aktif');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setNis(initialData.nis || '');
      setNisn(initialData.nisn || '');
      setNama(initialData.nama || '');
      setGender(initialData.gender || 'L');
      setKelas(initialData.kelas || '');
      setJurusan(initialData.jurusan || '');
      setNamaOrtu(initialData.namaOrtu || '');
      setTeleponOrtu(initialData.teleponOrtu || '');
      setAlamat(initialData.alamat || '');
      setStatus(initialData.status || 'Aktif');
      setErrorMsg(null);
    } else {
      setNis('');
      setNisn('');
      setNama('');
      setGender('L');
      const defaultKelas = kelasList.length > 0 ? kelasList[0].namaKelas : 'X PPLG 1';
      setKelas(defaultKelas);
      const matchedJurusan = kelasList.find(k => k.namaKelas === defaultKelas)?.jurusan || (jurusanList.length > 0 ? jurusanList[0].namaJurusan : 'Pengembangan Perangkat Lunak dan Gim');
      setJurusan(matchedJurusan);
      setNamaOrtu('');
      setTeleponOrtu('');
      setAlamat('');
      setStatus('Aktif');
      setErrorMsg(null);
    }
  }, [initialData, isOpen, kelasList, jurusanList]);

  if (!isOpen) return null;

  const handleKelasChange = (selectedKelas: string) => {
    setKelas(selectedKelas);
    const kObj = kelasList.find(k => k.namaKelas === selectedKelas);
    if (kObj && kObj.jurusan) {
      setJurusan(kObj.jurusan);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedNis = nis.trim();
    const trimmedNama = nama.trim();

    if (!trimmedNis) {
      setErrorMsg('NIS (Nomor Induk Siswa) wajib diisi.');
      return;
    }

    if (!trimmedNama) {
      setErrorMsg('Nama lengkap siswa wajib diisi.');
      return;
    }

    if (!kelas) {
      setErrorMsg('Silakan pilih kelas siswa.');
      return;
    }

    // Cek duplikasi NIS
    const duplicateNis = existingSiswaList.find(
      s => s.nis.toLowerCase() === trimmedNis.toLowerCase() && s.id !== initialData?.id
    );
    if (duplicateNis) {
      setErrorMsg(`NIS "${trimmedNis}" sudah digunakan oleh siswa: ${duplicateNis.nama} (${duplicateNis.kelas}).`);
      return;
    }

    const updatedSiswa: SiswaItem = {
      id: initialData?.id || `siswa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      nis: trimmedNis,
      nisn: nisn.trim() || '-',
      nama: trimmedNama,
      gender,
      kelas,
      jurusan: jurusan || 'Umum',
      namaOrtu: namaOrtu.trim() || 'Orang Tua / Wali',
      teleponOrtu: teleponOrtu.trim() || '-',
      alamat: alamat.trim() || 'Tasikmalaya',
      status
    };

    onSave(updatedSiswa);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#163A5F] dark:text-white">
                {isEditMode ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditMode ? `Perbarui profil & identitas siswa: ${initialData?.nama}` : 'Masukkan data identitas siswa ke dalam database sekolah'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Baris 1: NIS & NISN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-blue-600" />
                <span>NIS (Nomor Induk Siswa) <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={nis}
                onChange={e => setNis(e.target.value)}
                placeholder="Contoh: 242510001"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span>NISN (10 Digit)</span>
              </label>
              <input
                type="text"
                value={nisn}
                onChange={e => setNisn(e.target.value)}
                placeholder="Contoh: 0081234567"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Baris 2: Nama Lengkap & Jenis Kelamin */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-blue-600" />
                <span>Nama Lengkap Siswa <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Nama lengkap sesuai ijazah/akta"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Jenis Kelamin
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as 'L' | 'P')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          {/* Baris 3: Kelas & Konsentrasi Keahlian / Jurusan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <School className="h-3.5 w-3.5 text-blue-600" />
                <span>Kelas / Rombel <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={kelas}
                onChange={e => handleKelasChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                {kelasList.map(k => (
                  <option key={k.id} value={k.namaKelas}>
                    {k.namaKelas} ({k.ruang})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Konsentrasi Keahlian / Jurusan
              </label>
              <input
                type="text"
                value={jurusan}
                onChange={e => setJurusan(e.target.value)}
                placeholder="Contoh: PPLG / Rekayasa Perangkat Lunak"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Baris 4: Orang Tua & Nomor Telepon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>Nama Orang Tua / Wali</span>
              </label>
              <input
                type="text"
                value={namaOrtu}
                onChange={e => setNamaOrtu(e.target.value)}
                placeholder="Nama Bapak / Ibu / Wali"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>Nomor HP / WhatsApp Ortu</span>
              </label>
              <input
                type="text"
                value={teleponOrtu}
                onChange={e => setTeleponOrtu(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          {/* Baris 5: Alamat & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Alamat Tempat Tinggal</span>
              </label>
              <input
                type="text"
                value={alamat}
                onChange={e => setAlamat(e.target.value)}
                placeholder="Contoh: Kp. Ciroyom, Bojonggambir"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Status Keaktifan
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'Aktif' | 'Alumni' | 'Pindah')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="Aktif">Aktif</option>
                <option value="Alumni">Alumni / Lulus</option>
                <option value="Pindah">Pindah / Mutasi</option>
              </select>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-[#163A5F] hover:bg-[#112d4a] text-white shadow-sm transition cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isEditMode ? 'Simpan Perubahan' : 'Tambah Siswa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

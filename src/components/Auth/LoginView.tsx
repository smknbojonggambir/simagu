import React, { useState, useMemo } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  School, 
  CheckCircle2, 
  ShieldCheck, 
  LogIn, 
  ChevronDown,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { User, SchoolSetting, GuruItem, UserRole } from '../../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  users: User[];
  guruList: GuruItem[];
  setting: SchoolSetting;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  users,
  guruList,
  setting
}) => {
  // Dynamically combine users from state/storage and guruList master data
  const combinedUsers = useMemo(() => {
    const userMap = new Map<string, User>();

    // 1. Always ensure Administrator SIMAGU
    userMap.set('usr-1', {
      id: 'usr-1',
      username: 'admin',
      nama: 'Administrator SIMAGU',
      role: 'Administrator',
      email: 'admin@smknbojonggambir.sch.id'
    });

    // 2. Add all existing users
    users.forEach(u => {
      userMap.set(u.id, u);
    });

    // 3. Convert any guru from master data missing from user list
    guruList.forEach(g => {
      const existing = Array.from(userMap.values()).find(
        u => u.nama === g.nama || (u.nip && g.nip && g.nip !== '-' && u.nip.replace(/\s+/g, '') === g.nip.replace(/\s+/g, ''))
      );

      if (!existing) {
        let role: UserRole = 'Guru';
        let username = g.email ? g.email.split('@')[0] : `guru_${g.kodeGuru}`;

        if (g.nama.includes('Iman Rahmat')) {
          role = 'Kepala Sekolah';
          username = 'kepsek';
        } else if (g.nama.includes('Ilfan Fauzi')) {
          role = 'Wakasek Kesiswaan';
          username = 'wakasek_kes';
        } else if (g.nama.includes('Wahab Mughni')) {
          role = 'Wakasek Kurikulum';
          username = 'wakasek_kur';
        } else if (g.jabatan?.includes('Wali Kelas')) {
          role = 'Wali Kelas';
        } else if (g.jabatan?.includes('BK')) {
          role = 'Guru BK';
        }

        const uId = `usr-guru-${g.id}`;
        userMap.set(uId, {
          id: uId,
          username,
          nama: g.nama,
          nip: g.nip,
          role: role as any,
          email: g.email || `${username}@smknbojonggambir.sch.id`,
          kelasWali: g.jabatan?.includes('Wali Kelas') ? g.jabatan.split('Wali Kelas ')[1] : undefined
        });
      }
    });

    return Array.from(userMap.values());
  }, [users, guruList]);

  const [selectedUserId, setSelectedUserId] = useState<string>(() => combinedUsers[0]?.id || 'usr-1');
  const [password, setPassword] = useState<string>('bismillah');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Currently selected user object
  const activeSelectedUser = useMemo(() => {
    return combinedUsers.find(u => u.id === selectedUserId) || combinedUsers[0];
  }, [combinedUsers, selectedUserId]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!password || password.trim() === '') {
      setErrorMessage('Silakan masukkan kata sandi (Password default: bismillah)');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(activeSelectedUser);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[20rem] h-[20rem] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Branding */}
      <div className="w-full max-w-md text-center mb-6 z-10 space-y-3">
        <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/60 shadow-2xl backdrop-blur-xl">
          {setting.logoUrl ? (
            <img 
              src={setting.logoUrl} 
              alt="Logo Sekolah" 
              className="h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-300">
              <School className="h-8 w-8" />
            </div>
          )}
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 px-3.5 py-1 text-[11px] font-bold text-teal-300 tracking-wider uppercase mb-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>{setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Portal Log In Guru & Staf
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Sistem Informasi Manajemen Agenda & Akademia Guru (SIMAGU)
          </p>
        </div>
      </div>

      {/* Main Simplified Login Card */}
      <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl z-10">
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Pilih Akun Guru */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-teal-300">
                <UserIcon className="h-4 w-4" />
                <span>1. Pilih Akun Guru / Staf</span>
              </span>
              <span className="text-[10px] text-teal-400 font-mono bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/50 font-bold">
                {combinedUsers.length} Akun
              </span>
            </label>
            
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-2xl border border-teal-500/50 bg-slate-950 px-4 py-3.5 pr-10 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-inner appearance-none cursor-pointer"
              >
                <optgroup label="👑 Pimpinan & Administrator">
                  {combinedUsers
                    .filter(u => u.role === 'Administrator' || u.role === 'Kepala Sekolah' || u.role.includes('Wakasek'))
                    .map(u => (
                      <option key={u.id} value={u.id} className="bg-slate-900 text-white py-1">
                        [{u.role}] {u.nama}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="👨‍🏫 Guru & Staf Sekolah">
                  {combinedUsers
                    .filter(u => !(u.role === 'Administrator' || u.role === 'Kepala Sekolah' || u.role.includes('Wakasek')))
                    .map(u => (
                      <option key={u.id} value={u.id} className="bg-slate-900 text-white py-1">
                        [{u.role}] {u.nama} {u.nip && u.nip !== '-' ? `(NIP: ${u.nip})` : ''}
                      </option>
                    ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-4 top-4 h-4 w-4 text-teal-400 pointer-events-none" />
            </div>

            {/* Selected User Badge Preview */}
            {activeSelectedUser && (
              <div className="p-3 rounded-2xl bg-teal-950/50 border border-teal-800/50 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white line-clamp-1">{activeSelectedUser.nama}</div>
                  <div className="text-[10px] text-teal-300 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold bg-teal-500/20 px-1.5 py-0.2 rounded border border-teal-500/30">
                      {activeSelectedUser.role}
                    </span>
                    {activeSelectedUser.nip && activeSelectedUser.nip !== '-' && (
                      <span className="text-slate-400 font-mono">NIP: {activeSelectedUser.nip}</span>
                    )}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                  {activeSelectedUser.nama.charAt(0)}
                </div>
              </div>
            )}
          </div>

          {/* 2. Masukkan Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 text-teal-300">
                <Lock className="h-4 w-4" />
                <span>2. Masukkan Password</span>
              </label>
              <span className="text-[10px] text-teal-400 font-normal">
                Password default: <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono text-teal-300 font-bold">bismillah</code>
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3.5 pr-11 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-teal-950/60 transition active:scale-98 mt-2"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Memverifikasi Otentikasi...</span>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Masuk Ke Portal SIMAGU</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
            <span>Kurikulum Merdeka</span>
          </div>
          <span className="font-mono text-[10px] text-slate-500">v2026.1</span>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-500 mt-6 z-10">
        &copy; {new Date().getFullYear()} {setting.namaSekolah || 'SMK Negeri Bojonggambir'}. Hak Cipta Dilindungi Undang-Undang.
      </p>
    </div>
  );
};

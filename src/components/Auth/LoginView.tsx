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

    const cleanPass = password.trim();
    if (!cleanPass) {
      setErrorMessage('Silakan masukkan kata sandi Anda. (Password default: bismillah)');
      return;
    }

    // Check valid passwords
    const validPasswords = ['bismillah'];
    if (activeSelectedUser.role === 'Administrator') {
      validPasswords.push('admin123', 'admin');
    }
    if (activeSelectedUser.password) {
      validPasswords.push(activeSelectedUser.password);
    }

    const isValid = validPasswords.some(
      (p) => p.toLowerCase() === cleanPass.toLowerCase() || p === cleanPass
    );

    if (!isValid) {
      setErrorMessage('Kata sandi salah! Silakan periksa kembali kata sandi Anda. (Password default: bismillah)');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onLogin(activeSelectedUser);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Accent */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#163A5F] to-[#1e4d7d] pointer-events-none" />
      <div className="absolute top-36 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Branding */}
      <div className="w-full max-w-md text-center mb-6 z-10 space-y-3">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/80 shadow-lg">
          <img 
            src={setting.logoUrl || '/logo.png'} 
            alt="Logo SMKN Bojonggambir" 
            className="h-16 w-auto object-contain"
            onError={(e) => { 
              const target = e.target as HTMLImageElement;
              if (target.src !== '/logo.png' && !target.src.endsWith('/logo.png')) {
                target.src = '/logo.png';
              }
            }}
          />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-xs border border-white/30 px-3.5 py-1 text-[11px] font-bold text-white tracking-wider uppercase mb-2 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>{setting.namaSekolah || 'SMK NEGERI BOJONGGAMBIR'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Portal Log In SIMAGU
          </h1>
          <p className="text-xs text-blue-100 mt-1 max-w-xs mx-auto">
            Sistem Informasi Manajemen Agenda & Guru SMKN Bojonggambir
          </p>
        </div>
      </div>

      {/* Main Simplified Login Card */}
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl z-10">
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#DC2626]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Pilih Akun Guru */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#163A5F] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserIcon className="h-4 w-4 text-[#2563EB]" />
                <span>1. Pilih Akun Guru / Staf</span>
              </span>
              <span className="text-[10px] text-[#2563EB] font-mono bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-blue-200 font-bold">
                {combinedUsers.length} Akun
              </span>
            </label>
            
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] shadow-xs appearance-none cursor-pointer"
              >
                <optgroup label="👑 Pimpinan & Administrator">
                  {combinedUsers
                    .filter(u => u.role === 'Administrator' || u.role === 'Kepala Sekolah' || u.role.includes('Wakasek'))
                    .map(u => (
                      <option key={u.id} value={u.id} className="py-1">
                        [{u.role}] {u.nama}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="👨‍🏫 Guru & Staf Sekolah">
                  {combinedUsers
                    .filter(u => !(u.role === 'Administrator' || u.role === 'Kepala Sekolah' || u.role.includes('Wakasek')))
                    .map(u => (
                      <option key={u.id} value={u.id} className="py-1">
                        [{u.role}] {u.nama} {u.nip && u.nip !== '-' ? `(NIP: ${u.nip})` : ''}
                      </option>
                    ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Selected User Badge Preview */}
            {activeSelectedUser && (
              <div className="p-3 rounded-xl bg-[#EFF6FF] border border-blue-200 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#163A5F] line-clamp-1">{activeSelectedUser.nama}</div>
                  <div className="text-[10px] text-slate-600 flex items-center gap-2 mt-0.5">
                    <span className="font-semibold bg-white text-[#2563EB] px-1.5 py-0.5 rounded border border-blue-200">
                      {activeSelectedUser.role}
                    </span>
                    {activeSelectedUser.nip && activeSelectedUser.nip !== '-' && (
                      <span className="text-slate-500 font-mono">NIP: {activeSelectedUser.nip}</span>
                    )}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-[#163A5F] text-white font-black flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {activeSelectedUser.nama.charAt(0)}
                </div>
              </div>
            )}
          </div>

          {/* 2. Masukkan Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#163A5F] flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-[#2563EB]" />
                <span>2. Masukkan Password</span>
              </label>
              <span className="text-[10px] text-slate-500 font-normal">
                Password default: <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[#2563EB] font-bold">bismillah</code>
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-11 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-98 mt-2 cursor-pointer"
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
        <div className="mt-6 border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
            <span>Kurikulum Merdeka</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">v2026.1</span>
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-500 mt-6 z-10">
        &copy; {new Date().getFullYear()} {setting.namaSekolah || 'SMK Negeri Bojonggambir'}. Hak Cipta Dilindungi Undang-Undang.
      </p>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Users, UserCheck, Printer, Menu as MenuIcon } from 'lucide-react';
import { Toaster } from 'sonner';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AgendaGuruView } from './components/AgendaGuru/AgendaGuruView';
import { AgendaKelasView } from './components/AgendaKelas/AgendaKelasView';
import { AbsensiView } from './components/Absensi/AbsensiView';
import { JadwalView } from './components/Jadwal/JadwalView';
import { MasterDataView } from './components/MasterData/MasterDataView';
import { MonitoringView } from './components/Monitoring/MonitoringView';
import { DisiplinPrestasiView } from './components/DisiplinPrestasi/DisiplinPrestasiView';
import { InventarisView } from './components/Inventaris/InventarisView';
import { LaporanView } from './components/Laporan/LaporanView';
import { PengaturanView } from './components/Pengaturan/PengaturanView';
import { InputNilaiView } from './components/Nilai/InputNilaiView';
import { MateriTugasView } from './components/Materi/MateriTugasView';
import { GoogleDriveView } from './components/GoogleDrive/GoogleDriveView';
import { AppsScriptModal } from './components/AppsScriptModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { LoginView } from './components/Auth/LoginView';

import { Storage } from './lib/storage';
import { UserRole, User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('SIMAGU_AUTH_USER');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [role, setRole] = useState<UserRole>(() => currentUser?.role || 'Administrator');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState<boolean>(false);
  const [isGoogleSheetsModalOpen, setIsGoogleSheetsModalOpen] = useState<boolean>(false);

  // Keep role synced with currentUser
  useEffect(() => {
    if (currentUser?.role) {
      setRole(currentUser.role);
    }
  }, [currentUser]);

  // Data states from Storage
  const [setting, setSetting] = useState(Storage.getSetting());
  const [guruList, setGuruList] = useState(Storage.getGuru());
  const [siswaList, setSiswaList] = useState(Storage.getSiswa());
  const [kelasList, setKelasList] = useState(Storage.getKelas());
  const [jurusanList, setJurusanList] = useState(Storage.getJurusan());
  const [mapelList, setMapelList] = useState(Storage.getMapel());
  const [jadwalList, setJadwalList] = useState(Storage.getJadwal());
  const [agendaGuruList, setAgendaGuruList] = useState(Storage.getAgendaGuru());
  const [agendaKelasList, setAgendaKelasList] = useState(Storage.getAgendaKelas());
  const [absensiGuruList, setAbsensiGuruList] = useState(Storage.getAbsensiGuru());
  const [supervisiList, setSupervisiList] = useState(Storage.getSupervisi());
  const [materiList, setMateriList] = useState(Storage.getMateri());
  const [tugasList, setTugasList] = useState(Storage.getTugas());
  const [nilaiList, setNilaiList] = useState(Storage.getNilaiSiswa());
  const [auditLogs, setAuditLogs] = useState(Storage.getAuditLogs());

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setRole(user.role);
    localStorage.setItem('SIMAGU_AUTH_USER', JSON.stringify(user));
    Storage.logAudit('USER_LOGIN', `Pengguna ${user.nama} (${user.role}) berhasil masuk ke sistem`);
  };

  const handleLogout = () => {
    if (currentUser) {
      Storage.logAudit('USER_LOGOUT', `Pengguna ${currentUser.nama} keluar dari sistem`);
    }
    setCurrentUser(null);
    localStorage.removeItem('SIMAGU_AUTH_USER');
  };

  const activeUser: User = currentUser || {
    id: 'usr-1',
    username: 'admin',
    nama: 'Administrator SIMAGU',
    email: 'admin@smknbojonggambir.sch.id',
    role: role,
    nip: '19901017 202321 1 007'
  };

  const handleRefreshData = () => {
    setSetting(Storage.getSetting());
    setGuruList(Storage.getGuru());
    setSiswaList(Storage.getSiswa());
    setKelasList(Storage.getKelas());
    setJurusanList(Storage.getJurusan());
    setMapelList(Storage.getMapel());
    setJadwalList(Storage.getJadwal());
    setAgendaGuruList(Storage.getAgendaGuru());
    setAgendaKelasList(Storage.getAgendaKelas());
    setAbsensiGuruList(Storage.getAbsensiGuru());
    setSupervisiList(Storage.getSupervisi());
    setMateriList(Storage.getMateri());
    setTugasList(Storage.getTugas());
    setNilaiList(Storage.getNilaiSiswa());
    setAuditLogs(Storage.getAuditLogs());
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // If user is not authenticated, render Login View first
  if (!currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        users={Storage.getUsers()}
        guruList={guruList}
        setting={setting}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-teal-500 selection:text-white`}>
      {/* Header Bar */}
      <Header
        currentUser={activeUser}
        onUserChange={(u) => {
          setCurrentUser(u);
          setRole(u.role);
          localStorage.setItem('SIMAGU_AUTH_USER', JSON.stringify(u));
        }}
        onLogout={handleLogout}
        role={role}
        onRoleChange={setRole}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        agendaGuruList={agendaGuruList}
        agendaKelasList={agendaKelasList}
        jadwalList={jadwalList}
      />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          role={role}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === 'dashboard' && (
              <Dashboard
                guruList={guruList}
                siswaList={siswaList}
                kelasList={kelasList}
                agendaGuruList={agendaGuruList}
                agendaKelasList={agendaKelasList}
                absensiGuruList={absensiGuruList}
                supervisiList={supervisiList}
                setting={setting}
                currentUser={currentUser}
                onNavigateTab={setActiveTab}
                onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
                onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
              />
            )}

            {activeTab === 'agenda_guru' && (
              <AgendaGuruView
                agendas={agendaGuruList}
                guruList={guruList}
                kelasList={kelasList}
                mapelList={mapelList}
                jadwalList={jadwalList}
                setting={setting}
                currentUser={currentUser}
                siswaList={siswaList}
                onRefresh={handleRefreshData}
                onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
              />
            )}

            {activeTab === 'agenda_kelas' && (
              <AgendaKelasView
                agendas={agendaKelasList}
                kelasList={kelasList}
                setting={setting}
                currentUser={currentUser}
                onRefresh={handleRefreshData}
                onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
              />
            )}

            {activeTab === 'jadwal' && (
              <JadwalView
                jadwalList={jadwalList}
                kelasList={kelasList}
              />
            )}

            {activeTab === 'absensi' && (
              <AbsensiView
                siswaList={siswaList}
                kelasList={kelasList}
                guruList={guruList}
                mapelList={mapelList}
                jadwalList={jadwalList}
                currentUser={currentUser}
                onRefresh={handleRefreshData}
              />
            )}

            {activeTab === 'materi' && (
              <MateriTugasView
                materiList={materiList}
                tugasList={tugasList}
                kelasList={kelasList}
                mapelList={mapelList}
                guruList={guruList}
                currentUser={currentUser}
                onRefresh={handleRefreshData}
              />
            )}

            {activeTab === 'nilai' && (
              <InputNilaiView
                nilaiList={nilaiList}
                siswaList={siswaList}
                kelasList={kelasList}
                mapelList={mapelList}
                guruList={guruList}
                currentUser={currentUser}
                setting={setting}
                onRefresh={handleRefreshData}
              />
            )}

            {activeTab === 'master_data' && (
              <MasterDataView
                guruList={guruList}
                siswaList={siswaList}
                kelasList={kelasList}
                jurusanList={jurusanList}
                mapelList={mapelList}
              />
            )}

            {activeTab === 'monitoring' && (
              <MonitoringView
                supervisiList={supervisiList}
                agendaGuruList={agendaGuruList}
                setting={setting}
                currentUser={currentUser}
                onRefresh={handleRefreshData}
              />
            )}

            {activeTab === 'supervisi' && (
              <MonitoringView
                supervisiList={supervisiList}
                agendaGuruList={agendaGuruList}
                setting={setting}
                currentUser={currentUser}
                onRefresh={handleRefreshData}
              />
            )}

            {activeTab === 'prestasi' && (
              <DisiplinPrestasiView agendaKelasList={agendaKelasList} />
            )}

            {activeTab === 'pelanggaran' && (
              <DisiplinPrestasiView agendaKelasList={agendaKelasList} />
            )}

            {activeTab === 'inventaris' && (
              <InventarisView agendaKelasList={agendaKelasList} />
            )}

            {activeTab === 'laporan' && (
              <LaporanView
                agendaGuruList={agendaGuruList}
                agendaKelasList={agendaKelasList}
                supervisiList={supervisiList}
                nilaiList={nilaiList}
                siswaList={siswaList}
                kelasList={kelasList}
                guruList={guruList}
                mapelList={mapelList}
                setting={setting}
                currentUser={currentUser}
                onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
              />
            )}

            {activeTab === 'google_drive' && (
              <GoogleDriveView
                currentUser={activeUser}
                onRefresh={handleRefreshData}
              />
            )}

            {activeTab === 'gas_code' && (
              <PengaturanView
                setting={setting}
                auditLogs={auditLogs}
                currentUser={currentUser}
                onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
                onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
                onRefresh={handleRefreshData}
              />
            )}

            {activeTab === 'pengaturan' && (
              <PengaturanView
                setting={setting}
                auditLogs={auditLogs}
                currentUser={currentUser}
                onOpenAppsScriptModal={() => setIsAppsScriptModalOpen(true)}
                onOpenGoogleSheetsModal={() => setIsGoogleSheetsModalOpen(true)}
                onRefresh={handleRefreshData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Google Apps Script Modal */}
      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
      />

      {/* Google Sheets Direct Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isGoogleSheetsModalOpen}
        onClose={() => setIsGoogleSheetsModalOpen(false)}
        agendaGuruList={agendaGuruList}
        agendaKelasList={agendaKelasList}
        supervisiList={supervisiList}
        guruList={guruList}
        siswaList={siswaList}
        setting={setting}
      />

      {/* Mobile Bottom Navigation Bar for Cars, Mobile Phones & Tablets */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur lg:hidden px-2 shadow-lg touch-manipulation">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex min-h-[44px] flex-col items-center justify-center py-1 px-3 rounded-xl transition active:scale-95 ${activeTab === 'dashboard' ? 'text-teal-600 dark:text-teal-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Beranda</span>
        </button>

        <button
          onClick={() => setActiveTab('agenda_guru')}
          className={`flex min-h-[44px] flex-col items-center justify-center py-1 px-3 rounded-xl transition active:scale-95 ${activeTab === 'agenda_guru' ? 'text-teal-600 dark:text-teal-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('absensi')}
          className={`flex min-h-[44px] flex-col items-center justify-center py-1 px-3 rounded-xl transition active:scale-95 ${activeTab === 'absensi' ? 'text-teal-600 dark:text-teal-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}
        >
          <UserCheck className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Absensi</span>
        </button>

        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex min-h-[44px] flex-col items-center justify-center py-1 px-3 rounded-xl transition active:scale-95 ${activeTab === 'laporan' ? 'text-teal-600 dark:text-teal-400 font-extrabold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}
        >
          <Printer className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Laporan</span>
        </button>

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex min-h-[44px] flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-500 dark:text-slate-400 font-medium hover:text-teal-600 active:scale-95"
          title="Buka Seluruh Menu Navigasi"
        >
          <MenuIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <span className="text-[10px] mt-0.5">Semua</span>
        </button>
      </nav>

      {/* Global Toast Notifications (Sonner) */}
      <Toaster 
        position="top-right" 
        richColors 
        closeButton={false} 
        maxToasts={1} 
        duration={2500}
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }
        }}
      />
    </div>
  );
}

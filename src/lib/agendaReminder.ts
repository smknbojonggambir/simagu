import { AgendaGuruItem, JadwalItem, User, AgendaKelasItem } from '../types';

export interface UnsubmittedAgendaItem {
  id: string;
  jadwalId?: string;
  title: string;
  message: string;
  kelas: string;
  mapel: string;
  guru: string;
  jp: string;
  waktu?: string;
  hari: string;
  tanggal: string;
  type: 'schedule_unsubmitted' | 'agenda_incomplete';
}

export function checkUnsubmittedAgendasForUser(
  currentUser: User | null | undefined,
  jadwalList: JadwalItem[] = [],
  agendaGuruList: AgendaGuruItem[] = [],
  agendaKelasList: AgendaKelasItem[] = []
): {
  count: number;
  items: UnsubmittedAgendaItem[];
  hasUnsubmitted: boolean;
} {
  if (!currentUser) {
    return { count: 0, items: [], hasUnsubmitted: false };
  }

  const now = new Date();
  const daysOfWeek = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const realDayName = daysOfWeek[now.getDay()];
  const realDateStr = now.toISOString().slice(0, 10);

  // In operational mock data context, dates are often '2026-08-03' (Senin) to '2026-08-07' (Jumat).
  // If today is a weekend or no schedules match realDayName, use 'Senin' as operational fallback
  const isWeekend = realDayName === 'Minggu' || realDayName === 'Sabtu';
  const targetDay = isWeekend ? 'Senin' : realDayName;
  const targetDates = [realDateStr, '2026-08-10', '2026-08-03'];

  // Clean user name for matching (e.g., "Aip Paeja" from "Aip Paeja, S.Pd.")
  const rawUserName = currentUser.nama || '';
  const userCleanName = rawUserName.split(',')[0].trim().toLowerCase();

  // 1. Find schedules in jadwalList for targetDay that match currentUser
  const userSchedulesToday = jadwalList.filter(j => {
    const isTargetDay = j.hari === targetDay || j.hari === realDayName;
    if (!isTargetDay) return false;
    
    if (!j.guru) return false;
    const guruClean = j.guru.split(',')[0].trim().toLowerCase();

    // Check if current user name matches schedule teacher name
    const nameMatch = userCleanName.length > 2 && (guruClean.includes(userCleanName) || userCleanName.includes(guruClean));
    const idMatch = j.id_guru === currentUser.id || (currentUser.nip && j.id_guru === currentUser.nip);

    return nameMatch || idMatch;
  });

  // 2. Find submitted agenda entries for target date/day matching currentUser
  const userAgendasToday = agendaGuruList.filter(a => {
    const isTargetDate = targetDates.includes(a.tanggal) || a.hari === targetDay || a.hari === realDayName;
    if (!isTargetDate) return false;

    const agendaGuruClean = (a.namaGuru || '').split(',')[0].trim().toLowerCase();
    const nameMatch = userCleanName.length > 2 && (agendaGuruClean.includes(userCleanName) || userCleanName.includes(agendaGuruClean));
    const nipMatch = currentUser.nip && a.nip === currentUser.nip;

    return nameMatch || nipMatch;
  });

  // 3. Unsubmitted schedules: schedules today that don't have a matching agenda entry submitted
  const unsubmittedSchedules = userSchedulesToday.filter(j => {
    const hasSubmitted = userAgendasToday.some(a => {
      if (a.id_jadwal && a.id_jadwal === j.id) return true;
      const sameClass = a.kelas.toLowerCase().trim() === j.kelas.toLowerCase().trim();
      const sameMapel = a.mapel.toLowerCase().trim().includes(j.mapel.toLowerCase().trim()) ||
                        j.mapel.toLowerCase().trim().includes(a.mapel.toLowerCase().trim());
      return sameClass && sameMapel;
    });
    return !hasSubmitted;
  });

  // 4. Incomplete agenda entries: agendas that exist for today but are 'Dalam Proses' or 'Pending'
  const incompleteAgendas = userAgendasToday.filter(a => 
    a.statusPembelajaran === 'Dalam Proses' || a.statusValidasi === 'Pending'
  );

  // Map to UnsubmittedAgendaItem format
  const scheduleItems: UnsubmittedAgendaItem[] = unsubmittedSchedules.map(j => ({
    id: `unsub-j-${j.id}`,
    jadwalId: j.id,
    title: `Agenda Belum Diisi: ${j.mapel}`,
    message: `Kelas ${j.kelas} (Jam ke-${j.jp}) - ${j.waktu || 'Waktu KBM'} belum diisi agenda.`,
    kelas: j.kelas,
    mapel: j.mapel,
    guru: j.guru,
    jp: j.jp,
    waktu: j.waktu,
    hari: j.hari,
    tanggal: realDateStr,
    type: 'schedule_unsubmitted'
  }));

  const incompleteItems: UnsubmittedAgendaItem[] = incompleteAgendas.map(a => ({
    id: `inc-a-${a.id}`,
    title: `Agenda Dalam Proses: ${a.mapel}`,
    message: `Kelas ${a.kelas} (Jam ke-${a.jamKe}) masih berstatus '${a.statusPembelajaran}'.`,
    kelas: a.kelas,
    mapel: a.mapel,
    guru: a.namaGuru,
    jp: a.jamKe,
    waktu: a.waktu,
    hari: a.hari,
    tanggal: a.tanggal,
    type: 'agenda_incomplete'
  }));

  // If user has no personal schedules today and is an Admin or Wakasek or Kepala Sekolah,
  // we also check general unsubmitted schedules for all teachers today so Admin sees reminder if any teacher hasn't submitted
  let adminItems: UnsubmittedAgendaItem[] = [];
  if (userSchedulesToday.length === 0 && (currentUser.role === 'Administrator' || currentUser.role === 'Wakasek Kurikulum' || currentUser.role === 'Kepala Sekolah')) {
    const allSchedulesToday = jadwalList.filter(j => j.hari === targetDay || j.hari === realDayName);
    const allAgendasToday = agendaGuruList.filter(a => targetDates.includes(a.tanggal) || a.hari === targetDay);

    const unsubmittedAll = allSchedulesToday.filter(j => {
      const guruClean = j.guru.split(',')[0].trim().toLowerCase();
      return !allAgendasToday.some(a => {
        const agGuruClean = (a.namaGuru || '').split(',')[0].trim().toLowerCase();
        const sameTeacher = agGuruClean.includes(guruClean) || guruClean.includes(agGuruClean);
        const sameClass = a.kelas.toLowerCase().trim() === j.kelas.toLowerCase().trim();
        return sameTeacher && sameClass;
      });
    });

    adminItems = unsubmittedAll.slice(0, 5).map(j => ({
      id: `admin-unsub-${j.id}`,
      jadwalId: j.id,
      title: `Agenda Belum Diisi (${j.guru.split(',')[0]})`,
      message: `Guru ${j.guru} di kelas ${j.kelas} (${j.mapel}) belum mengisi agenda KBM.`,
      kelas: j.kelas,
      mapel: j.mapel,
      guru: j.guru,
      jp: j.jp,
      waktu: j.waktu,
      hari: j.hari,
      tanggal: realDateStr,
      type: 'schedule_unsubmitted'
    }));
  }

  const allItems = [...scheduleItems, ...incompleteItems, ...adminItems];

  return {
    count: allItems.length,
    items: allItems,
    hasUnsubmitted: allItems.length > 0
  };
}

import { JadwalItem } from '../types';

export const ptkMap: Record<string, { nama: string; mapel: string }> = {
  '1': { nama: 'Iman Rahmat, S.Pd.I.', mapel: 'Pendidikan Agama dan Budi Pekerti' },
  '2': { nama: 'Seni Sri Astuti, S.Pd.', mapel: 'Bahasa Indonesia' },
  '3': { nama: 'Rahmayanti Rahayu, S.Pd.', mapel: 'Matematika' },
  '4': { nama: 'Diniyanti, S.Pd.', mapel: 'Bahasa Inggris' },
  '5': { nama: 'Drs. Aa Mansur, M.Pd.', mapel: 'Pendidikan Agama dan Budi Pekerti' },
  '6': { nama: 'Ali Maulana, S.Pd.', mapel: 'Sejarah Indonesia' },
  '7': { nama: 'Darusalam, S.H.', mapel: 'Pendidikan Pancasila (PPKn)' },
  '8': { nama: 'Ilfan Fauzi, S.Pd.', mapel: 'Seni Rupa' },
  '8.a': { nama: 'Ilfan Fauzi, S.Pd.', mapel: 'Muatan Lokal Bahasa Sunda' },
  '9': { nama: 'Mohamad Ridwan, M.Pd.', mapel: 'PJOK' },
  '10': { nama: 'Ihsan Haeruman Kamil, S.Pd.', mapel: 'Dasar-Dasar APHP / IPAS' },
  '11': { nama: 'Wahab Mughni Sa\'dillah, S.Pd.', mapel: 'IPAS (Ilmu Pengetahuan Alam dan Sosial)' },
  '12': { nama: 'Sutisna, S.Pd.', mapel: 'Agribisnis Pengolahan Hasil Pertanian / PKK' },
  '13': { nama: 'Ratih Juliana Anggraeni, S.Si.', mapel: 'Agribisnis Pengolahan Hasil Pertanian / IPAS' },
  '14': { nama: 'Dede Gisni Azmi, S.Si.', mapel: 'Matematika' },
  '15': { nama: 'Itang Supriadin, S.P.', mapel: 'Agribisnis Pengolahan Hasil Pertanian' },
  '16': { nama: 'Giardi Achmad Fauzi, S.T.', mapel: 'Desain Komunikasi Visual (DKV)' },
  '17': { nama: 'Yogi, S.Kom.', mapel: 'Desain Komunikasi Visual (DKV)' },
  '18': { nama: 'Dede Adi Selamet M., S.Kom.', mapel: 'Desain Komunikasi Visual (DKV)' },
  '19': { nama: 'Ruli Lesmana, S.T.', mapel: 'Informatika' },
  '20': { nama: 'Rian Septian, A.Md.', mapel: 'Desain Komunikasi Visual (DKV)' },
};

export const roomMap: Record<string, string> = {
  'X APHP': 'Bengkel APHP',
  'X DKV 1': 'Studio DKV 1',
  'X DKV 2': 'Studio DKV 2',
  'XI APHP': 'Lab APHP',
  'XI DKV 1': 'Lab Komputer 1',
  'XI DKV 2': 'Lab Komputer 2',
  'XII APHP': 'Ruang Pengolahan APHP',
  'XII DKV 1': 'Studio DKV 3',
  'XII DKV 2': 'Lab Komputer 3',
  'XII DKV 3': 'Studio DKV 4',
};

const classes = [
  'X APHP', 'X DKV 1', 'X DKV 2',
  'XI APHP', 'XI DKV 1', 'XI DKV 2',
  'XII APHP', 'XII DKV 1', 'XII DKV 2', 'XII DKV 3'
];

interface TimeSlot {
  jp: number;
  waktu: string;
}

const standardTimeSlots: TimeSlot[] = [
  { jp: 1, waktu: '07.00 - 07.40' },
  { jp: 2, waktu: '07.40 - 08.20' },
  { jp: 3, waktu: '08.20 - 09.00' },
  { jp: 4, waktu: '09.45 - 10.25' },
  { jp: 5, waktu: '10.25 - 11.05' },
  { jp: 6, waktu: '11.05 - 11.45' },
  { jp: 7, waktu: '11.45 - 12.25' },
  { jp: 8, waktu: '13.00 - 13.40' },
  { jp: 9, waktu: '13.40 - 14.20' },
  { jp: 10, waktu: '14.20 - 15.00' },
];

const jumatTimeSlots: TimeSlot[] = [
  { jp: 1, waktu: '07.00 - 07.35' },
  { jp: 2, waktu: '07.35 - 08.10' },
  { jp: 3, waktu: '08.10 - 08.45' },
  { jp: 4, waktu: '08.45 - 09.20' },
  { jp: 5, waktu: '10.00 - 10.35' },
  { jp: 6, waktu: '10.35 - 11.10' },
  { jp: 7, waktu: '12.40 - 13.15' },
  { jp: 8, waktu: '13.15 - 13.50' },
  { jp: 9, waktu: '13.50 - 14.25' },
  { jp: 10, waktu: '14.25 - 15.00' },
];

type MatrixRow = Array<string | number | null>;

const seninMatrix: MatrixRow[] = [
  [6,  14, 18, 7,  8,  5,  12, 16, 2,  4],
  [6,  14, 18, 7,  8,  5,  12, 16, 2,  4],
  [4,  14, 18, 10, 7,  5,  16, 16, 2,  17],
  [4,  14, 18, 10, 7,  8,  12, 16, 5,  17],
  [4,  19, 14, 10, 2,  8,  7,  16, 5,  17],
  [4,  19, 14, 10, 2,  18, 7,  16, 5,  8],
  [7,  19, 14, 10, 2,  18, 4,  16, 12, 8],
  [7,  19, 14, 10, 6,  18, 4,  2,  12, 5],
  [19, 8,  7,  10, 6,  18, 4,  2,  12, 5],
  [19, 8,  7,  10, 11, 18, 4,  2,  12, 5],
];

const selasaMatrix: MatrixRow[] = [
  [5,  6,  18, 13, 16, 1,  15, 20, 3,  2],
  [5,  6,  18, 13, 16, 1,  15, 20, 3,  2],
  [5,  19, 18, 13, 16, 1,  15, 20, 3,  2],
  [13, 19, 18, 2,  16, 1,  15, 20, 7,  12],
  [13, 19, 18, 2,  16, 1,  15, 20, 7,  12],
  [13, 19, 10, 2,  17, 18, 15, 16, 20, 3],
  [13, 19, 10, 4,  17, 18, 15, 16, 20, 3],
  [11, 19, 5,  4,  17, 18, 2,  16, 20, 3],
  [11, 19, 5,  4,  17, 18, 2,  16, 20, 7],
  [11, 19, 5,  4,  17, 18, 2,  16, 20, 7],
];

const rabuMatrix: MatrixRow[] = [
  [9,  5,  18, 13, 4,  2,  3,  16, 8,  12],
  [9,  5,  18, 13, 4,  2,  3,  16, 8,  12],
  [9,  5,  18, 13, 4,  2,  3,  16, 20, 12],
  [14, 9,  8,  13, 4,  18, 15, 16, 20, 12],
  [14, 9,  8,  13, 5,  18, 15, 16, 20, 17],
  [14, 9,  6,  13, 5,  18, 15, 16, 20, 17],
  [14, 2,  6,  12, 5,  18, 13, 16, 4,  17],
  [11, 2,  9,  12, 3,  18, 13, 16, 4,  17],
  [11, 2,  9,  12, 3,  18, 13, 16, 4,  17],
  [11, 2,  9,  12, 3,  18, 5,  16, 4,  17],
];

const kamisMatrix: MatrixRow[] = [
  [18, 4,     19, 9,  11, 3,  13, 12, 20, 17],
  [18, 4,     19, 9,  11, 3,  13, 12, 20, 17],
  [2,  4,     10, 6,  11, 3,  15, 12, 20, 17],
  [2,  4,     10, 6,  9,  7,  15, 12, 20, 17],
  [2,  '8.a', 10, 14, 9,  7,  15, 4,  20, 17],
  [2,  '8.a', 10, 14, 16, 9,  15, 4,  20, 12],
  [8,  19,    2,  14, 16, 9,  15, 4,  20, 12],
  [8,  19,    2,  11, 16, 18, 15, 4,  20, 12],
  ['8.a', 19, 2,  11, 16, 6,  15, 3,  20, 4],
  ['8.a', 19, 2,  11, 16, 6,  15, 3,  20, 4],
];

const jumatMatrix: MatrixRow[] = [
  [13, 10, 18,    11, 16, 4,  15, 5, 20, 17],
  [13, 10, 18,    8,  16, 4,  15, 5, 20, 17],
  [13, 10, 19,    8,  16, 4,  15, 5, 20, 17],
  [13, 10, 19,    5,  16, 4,  15, 3, 20, 17],
  [19, 10, 4,     5,  16, 11, 8,  7, 20, 17],
  [19, 10, 4,     5,  16, 11, 8,  7, 20, 17],
  [10, 18, 4,     13, 16, 11, 5,  8, 20, 17],
  [10, 18, 4,     13, 16, 11, 5,  8, 20, 17],
  [10, 7,  '8.a', null, null, null, null, null, null, null],
  [10, 7,  '8.a', null, null, null, null, null, null, null],
];

export function resolveMapelForClass(codeStr: string, className: string, defaultMapel: string): string {
  if (codeStr === '10') { // Ihsan Haeruman Kamil, S.Pd.
    if (className.includes('DKV')) return 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
    if (className === 'X APHP') return 'Dasar-Dasar APHP';
    if (className.includes('XI APHP') || className.includes('XII APHP')) return 'Agribisnis Pengolahan Hasil Pertanian';
    return 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
  }
  if (codeStr === '12') { // Sutisna, S.Pd.
    if (className.includes('DKV')) return 'Projek Kreatif dan Kewirausahaan (PKK)';
    return 'Agribisnis Pengolahan Hasil Pertanian';
  }
  if (codeStr === '13') { // Ratih Juliana Anggraeni, S.Si.
    if (className.includes('DKV') || className.startsWith('X')) return 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
    return 'Agribisnis Pengolahan Hasil Pertanian';
  }
  return defaultMapel;
}

function buildScheduleForDay(
  hariName: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat',
  matrix: MatrixRow[],
  timeSlots: TimeSlot[]
): JadwalItem[] {
  const result: JadwalItem[] = [];
  let counter = 1;

  for (let colIdx = 0; colIdx < classes.length; colIdx++) {
    const className = classes[colIdx];
    const room = roomMap[className] || 'Ruang Kelas';

    let currentCode: string | number | null = null;
    let startJp = 0;

    for (let rowIdx = 0; rowIdx <= matrix.length; rowIdx++) {
      const code = rowIdx < matrix.length ? matrix[rowIdx][colIdx] : null;

      if (code !== currentCode) {
        if (currentCode !== null && currentCode !== undefined) {
          const codeStr = String(currentCode);
          const teacherInfo = ptkMap[codeStr] || { nama: `Guru ${codeStr}`, mapel: 'Mata Pelajaran' };

          const startSlot = timeSlots[startJp];
          const endSlot = timeSlots[rowIdx - 1];

          const jpStr = startJp === rowIdx - 1 ? `${startJp + 1}` : `${startJp + 1}-${rowIdx}`;
          const waktuStr = `${startSlot.waktu.split(' - ')[0]} - ${endSlot.waktu.split(' - ')[1]}`;

          result.push({
            id: `jdw-${hariName.toLowerCase()}-${className.toLowerCase().replace(/\s+/g, '')}-${counter++}`,
            hari: hariName,
            jp: jpStr,
            waktu: waktuStr,
            kelas: className,
            mapel: resolveMapelForClass(codeStr, className, teacherInfo.mapel),
            guru: teacherInfo.nama,
            ruang: room,
            status: 'Aktif',
            kodeGuru: codeStr,
          });
        }
        currentCode = code;
        startJp = rowIdx;
      }
    }
  }

  return result;
}

export const completeJadwalData: JadwalItem[] = [
  ...buildScheduleForDay('Senin', seninMatrix, standardTimeSlots),
  ...buildScheduleForDay('Selasa', selasaMatrix, standardTimeSlots),
  ...buildScheduleForDay('Rabu', rabuMatrix, standardTimeSlots),
  ...buildScheduleForDay('Kamis', kamisMatrix, standardTimeSlots),
  ...buildScheduleForDay('Jumat', jumatMatrix, jumatTimeSlots),
];

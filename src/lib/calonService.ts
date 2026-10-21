import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  collection, 
  writeBatch,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

export interface CalonData {
  cleanMykid: string; // 12 digit (contoh: 200101141234)
  mykid: string;      // Berformat (contoh: 200101-14-1234)
  nama: string;
  prasekolah: string;
  status: 'BERJAYA' | 'TIDAK BERJAYA';
  catatan?: string;
  updatedAt?: string;
}

export interface ParseResult {
  valid: CalonData[];
  errors: { line: number; text: string; reason: string }[];
}

/**
 * Format 12 digit kepada XXXXXX-XX-XXXX
 */
export function formatMyKid(value: string): string {
  const digits = (value || '').replace(/[^0-9]/g, '');
  if (digits.length === 12) {
    return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 12)}`;
  }
  return value || '-';
}

/**
 * Pengurai teks pukal (Excel Paste & CSV)
 */
export function parseBulkText(rawText: string): ParseResult {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const valid: CalonData[] = [];
  const errors: { line: number; text: string; reason: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Abaikan jika baris tajuk (header)
    const lower = line.toLowerCase();
    if (
      (lower.includes('mykid') || lower.includes('no. kad pengenalan')) &&
      (lower.includes('nama') || lower.includes('status'))
    ) {
      continue;
    }

    // Pisahkan baris menggunakan Tab (\t) jika salin dari Excel, atau Koma (,) / Semicolon (;) jika CSV
    let parts: string[] = [];
    if (line.includes('\t')) {
      parts = line.split('\t').map(p => p.trim());
    } else if (line.includes(',')) {
      parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
    } else if (line.includes(';')) {
      parts = line.split(';').map(p => p.trim());
    } else {
      // Cuba pisahkan dengan 2 atau lebih jarak
      parts = line.split(/\s{2,}/).map(p => p.trim());
    }

    if (parts.length < 2) {
      errors.push({
        line: i + 1,
        text: line,
        reason: 'Format tidak lengkap. Memerlukan sekurang-kurangnya No. MyKid dan Nama.'
      });
      continue;
    }

    const rawMyKid = parts[0] || '';
    const cleanDigits = rawMyKid.replace(/[^0-9]/g, '');

    if (cleanDigits.length < 12) {
      errors.push({
        line: i + 1,
        text: line,
        reason: `Nombor MyKid tidak sah (${cleanDigits.length} digit). Perlu tepat 12 digit.`
      });
      continue;
    }

    const clean12 = cleanDigits.slice(0, 12);
    const nama = (parts[1] || '').toUpperCase();
    
    // Tentukan Prasekolah dan Status
    // Biasanya Kolum: [0]=MyKid, [1]=Nama, [2]=Prasekolah, [3]=Status
    let prasekolah = '-';
    let rawStatus = 'BERJAYA';

    if (parts.length >= 4) {
      prasekolah = parts[2] || '-';
      rawStatus = parts[3] || 'BERJAYA';
    } else if (parts.length === 3) {
      // Semak sama ada bahagian ketiga ialah status atau prasekolah
      const testStatus = parts[2].toUpperCase();
      if (testStatus.includes('BERJAYA') || testStatus.includes('GAGAL')) {
        rawStatus = parts[2];
      } else {
        prasekolah = parts[2];
        rawStatus = 'BERJAYA';
      }
    }

    // Normalkan status
    let finalStatus: 'BERJAYA' | 'TIDAK BERJAYA' = 'BERJAYA';
    const upperStatus = rawStatus.toUpperCase();
    if (upperStatus.includes('TIDAK') || upperStatus.includes('GAGAL') || upperStatus.includes('NOT')) {
      finalStatus = 'TIDAK BERJAYA';
    } else {
      finalStatus = 'BERJAYA';
    }

    valid.push({
      cleanMykid: clean12,
      mykid: formatMyKid(clean12),
      nama,
      prasekolah: prasekolah.toUpperCase(),
      status: finalStatus,
      updatedAt: new Date().toISOString()
    });
  }

  return { valid, errors };
}

/**
 * Carian calon mengikut MyKid (12 digit)
 */
export async function getCalonByMyKid(cleanMykid: string): Promise<CalonData | null> {
  const digits = cleanMykid.replace(/[^0-9]/g, '');
  if (digits.length !== 12) return null;

  try {
    const docRef = doc(db, 'calon_2027', digits);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as CalonData;
    }
    return null;
  } catch (error) {
    console.error('Ralat carian calon:', error);
    throw error;
  }
}

/**
 * Simpan calon tunggal
 */
export async function saveCalon(calon: CalonData): Promise<void> {
  const docRef = doc(db, 'calon_2027', calon.cleanMykid);
  await setDoc(docRef, {
    ...calon,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Padam rekod calon
 */
export async function deleteCalon(cleanMykid: string): Promise<void> {
  const docRef = doc(db, 'calon_2027', cleanMykid);
  await deleteDoc(docRef);
}

/**
 * Simpan data calon secara pukal (Batch Write)
 */
export async function saveBulkCalon(calonList: CalonData[]): Promise<number> {
  if (!calonList.length) return 0;

  // Firestore had batch 500 operasi setiap batch
  const chunkSize = 400;
  let totalSaved = 0;

  for (let i = 0; i < calonList.length; i += chunkSize) {
    const chunk = calonList.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const calon of chunk) {
      const docRef = doc(db, 'calon_2027', calon.cleanMykid);
      batch.set(docRef, {
        cleanMykid: calon.cleanMykid,
        mykid: formatMyKid(calon.cleanMykid),
        nama: calon.nama.toUpperCase(),
        prasekolah: (calon.prasekolah || '-').toUpperCase(),
        status: calon.status,
        catatan: calon.catatan || '',
        updatedAt: new Date().toISOString()
      });
    }

    await batch.commit();
    totalSaved += chunk.length;
  }

  return totalSaved;
}

/**
 * Ambil semua calon untuk pengurusan pentadbir
 */
export async function getAllCalon(): Promise<CalonData[]> {
  try {
    const colRef = collection(db, 'calon_2027');
    const q = query(colRef, orderBy('nama', 'asc'));
    const snap = await getDocs(q);

    const list: CalonData[] = [];
    snap.forEach((doc) => {
      list.push(doc.data() as CalonData);
    });

    return list;
  } catch (error) {
    console.error('Ralat mengambil semua calon:', error);
    // Jika tiada index orderBy atau ada isu, ambil tanpa query
    try {
      const snap = await getDocs(collection(db, 'calon_2027'));
      const list: CalonData[] = [];
      snap.forEach((doc) => {
        list.push(doc.data() as CalonData);
      });
      return list;
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
}

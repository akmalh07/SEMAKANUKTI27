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
  jawapanTawaran?: 'TERIMA' | 'TOLAK'; // Pengesahan oleh ibu bapa
  tarikhJawapan?: string;              // Tarikh/masa pengesahan
  sebabTolak?: string;                 // Sebab penolakan jika menolak
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
 * Pembahagi sel CSV/Excel yang menyokong tanda petik ("...") dan tab
 */
function splitLineCells(line: string): string[] {
  // Jika mengandungi tab (salinan langsung dari Microsoft Excel atau Google Sheets)
  if (line.includes('\t')) {
    return line.split('\t').map(p => p.trim());
  }

  // Jika format titik bertindih / semicolon (;)
  if (line.includes(';') && !line.includes(',')) {
    return line.split(';').map(p => p.trim().replace(/^["']|["']$/g, ''));
  }

  // Pengurai CSV standard dengan sokongan tanda petik (quotes)
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells.map(s => s.replace(/^["']|["']$/g, '').trim());
}

/**
 * Pengurai teks pukal pintar (Excel Paste & CSV)
 * Mengenalpasti lajur MyKid, Nama, Prasekolah, dan Status secara dinamik tanpa mengira susunan kolum
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
      (lower.includes('mykid') || lower.includes('no. kad pengenalan') || lower.includes('kad pengenalan') || lower.includes('no kp') || lower.includes('no. kp')) &&
      (lower.includes('nama') || lower.includes('status') || lower.includes('bil') || lower.includes('keputusan'))
    ) {
      continue;
    }

    // Pisahkan sel dengan teliti
    let cells = splitLineCells(line).filter(c => c.length > 0);

    if (cells.length < 2) {
      errors.push({
        line: i + 1,
        text: line,
        reason: 'Maklumat tidak lengkap (memerlukan sekurang-kurangnya No. MyKid dan Nama).'
      });
      continue;
    }

    // 1. Cari sel yang mengandungi 12 digit nombor MyKid
    let mykidIndex = -1;
    let clean12 = '';
    for (let c = 0; c < cells.length; c++) {
      const digits = cells[c].replace(/[^0-9]/g, '');
      if (digits.length === 12) {
        mykidIndex = c;
        clean12 = digits;
        break;
      }
    }

    if (mykidIndex === -1) {
      errors.push({
        line: i + 1,
        text: line,
        reason: 'Tiada 12-digit nombor MyKid yang sah ditemui pada baris ini.'
      });
      continue;
    }

    // 2. Cari sel yang menyatakan status
    let statusIndex = -1;
    let detectedStatus: 'BERJAYA' | 'TIDAK BERJAYA' = 'BERJAYA';
    let statusFound = false;

    for (let c = 0; c < cells.length; c++) {
      if (c === mykidIndex) continue;
      const text = cells[c].toUpperCase();

      // Semak kata kunci TIDAK BERJAYA / GAGAL / SIMPANAN / RAYUAN / TB / TH / KIV
      if (
        text.includes('TIDAK BERJAYA') ||
        text.includes('TIDAK DITAWARKAN') ||
        text.includes('TIDAK LULUS') ||
        text.includes('TIDAK LAYAK') ||
        text.includes('TIDAK HADIR') ||
        text === 'TIDAK' ||
        text === 'GAGAL' ||
        text.includes('GAGAL') ||
        text.includes('DITOLAK') ||
        text.includes('REJECT') ||
        text.includes('UNSUCCESSFUL') ||
        text.includes('SIMPANAN') ||
        text.includes('MENUNGGU') ||
        text.includes('RAYUAN') ||
        text === 'KIV' ||
        text === 'TB' ||
        text === 'T/B' ||
        text === 'TH' ||
        text.includes('BATAL')
      ) {
        statusIndex = c;
        detectedStatus = 'TIDAK BERJAYA';
        statusFound = true;
        break;
      } else if (
        text === 'BERJAYA' || 
        text.includes('BERJAYA') || 
        text === 'LULUS' || 
        text.includes('DITAWARKAN') ||
        text.includes('OFFERED') ||
        text === 'LAYAK'
      ) {
        statusIndex = c;
        detectedStatus = 'BERJAYA';
        statusFound = true;
      }
    }

    // 3. Cari Nama dan Prasekolah daripada baki sel
    const remainingIndices = cells.map((_, idx) => idx).filter(idx => idx !== mykidIndex && idx !== statusIndex);
    
    // Tapis keluar nombor bil/siri (contoh: "1", "2", "3")
    const nonNumberIndices = remainingIndices.filter(idx => {
      const val = cells[idx];
      return isNaN(Number(val)) || val.length > 5;
    });

    let nama = '';
    let prasekolah = '-';

    if (nonNumberIndices.length >= 2) {
      const first = cells[nonNumberIndices[0]];
      const second = cells[nonNumberIndices[1]];
      
      const isFirstSchool = /TADIKA|PRA|KEMAS|SEKOLAH|TABIKA|PASTI|HIKMAH|CALIPH|BRAINY/i.test(first);
      const isSecondSchool = /TADIKA|PRA|KEMAS|SEKOLAH|TABIKA|PASTI|HIKMAH|CALIPH|BRAINY/i.test(second);

      if (isFirstSchool && !isSecondSchool) {
        prasekolah = first;
        nama = second;
      } else {
        nama = first;
        prasekolah = second;
      }
    } else if (nonNumberIndices.length === 1) {
      nama = cells[nonNumberIndices[0]];
    } else if (remainingIndices.length > 0) {
      nama = cells[remainingIndices[0]];
    }

    // Bersihkan nama jika ada teks status yang terserap akibat format koma terpecah
    if (nama.toUpperCase().includes('TIDAK BERJAYA')) {
      nama = nama.replace(/,?TIDAK BERJAYA/gi, '').trim();
      detectedStatus = 'TIDAK BERJAYA';
    } else if (nama.toUpperCase().includes('BERJAYA')) {
      nama = nama.replace(/,?BERJAYA/gi, '').trim();
    }

    valid.push({
      cleanMykid: clean12,
      mykid: formatMyKid(clean12),
      nama: (nama || 'CALON').toUpperCase().trim(),
      prasekolah: (prasekolah || '-').toUpperCase().trim(),
      status: detectedStatus,
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
 * Hantar jawapan penerimaan / penolakan tawaran oleh ibu bapa
 */
export async function submitJawapanTawaran(
  cleanMykid: string,
  jawapan: 'TERIMA' | 'TOLAK',
  sebabTolak?: string
): Promise<void> {
  const docRef = doc(db, 'calon_2027', cleanMykid);
  await setDoc(docRef, {
    jawapanTawaran: jawapan,
    tarikhJawapan: new Date().toISOString(),
    sebabTolak: sebabTolak || '',
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Kemas kini status keputusan ujian (BERJAYA / TIDAK BERJAYA) secara pantas oleh pentadbir
 */
export async function updateCalonStatus(
  cleanMykid: string,
  newStatus: 'BERJAYA' | 'TIDAK BERJAYA'
): Promise<void> {
  const docRef = doc(db, 'calon_2027', cleanMykid);
  await setDoc(docRef, {
    status: newStatus,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}

/**
 * Simpan calon tunggal (menyokong pertukaran No. MyKid dengan memadam rekod lama)
 */
export async function saveCalon(calon: CalonData, oldCleanMykid?: string): Promise<void> {
  const docRef = doc(db, 'calon_2027', calon.cleanMykid);
  await setDoc(docRef, {
    ...calon,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  // Jika no MyKid telah diedit/ditukar, padam rekod MyKid lama agar tidak wujud pertindihan
  if (oldCleanMykid && oldCleanMykid !== calon.cleanMykid) {
    try {
      const oldDocRef = doc(db, 'calon_2027', oldCleanMykid);
      await deleteDoc(oldDocRef);
    } catch (e) {
      console.warn('Gagal memadam rekod MyKid lama:', e);
    }
  }
}

/**
 * Padam rekod calon tunggal
 */
export async function deleteCalon(cleanMykid: string): Promise<void> {
  const docRef = doc(db, 'calon_2027', cleanMykid);
  await deleteDoc(docRef);
}

/**
 * Padam rekod calon terpilih secara pukal (Batch Delete)
 */
export async function deleteBulkCalon(cleanMykids: string[]): Promise<number> {
  if (!cleanMykids.length) return 0;
  let deletedCount = 0;
  const chunkSize = 400;

  for (let i = 0; i < cleanMykids.length; i += chunkSize) {
    const chunk = cleanMykids.slice(i, i + chunkSize);
    const batch = writeBatch(db);

    for (const id of chunk) {
      const docRef = doc(db, 'calon_2027', id);
      batch.delete(docRef);
    }

    await batch.commit();
    deletedCount += chunk.length;
  }

  return deletedCount;
}

/**
 * Padam SEMUA rekod calon (untuk kemaskini semula/reset data bersih)
 */
export async function deleteAllCalon(): Promise<number> {
  const colRef = collection(db, 'calon_2027');
  const snap = await getDocs(colRef);
  let deletedCount = 0;
  
  const chunkSize = 400;
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const chunk = docs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach(d => batch.delete(d.ref));
    await batch.commit();
    deletedCount += chunk.length;
  }
  return deletedCount;
}

/**
 * Simpan data calon secara pukal (Batch Write)
 */
export async function saveBulkCalon(calonList: CalonData[]): Promise<number> {
  if (!calonList.length) return 0;

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
        nama: calon.nama.toUpperCase().trim(),
        prasekolah: (calon.prasekolah || '-').toUpperCase().trim(),
        status: calon.status,
        jawapanTawaran: calon.jawapanTawaran || null,
        tarikhJawapan: calon.tarikhJawapan || null,
        sebabTolak: calon.sebabTolak || '',
        catatan: calon.catatan || '',
        updatedAt: new Date().toISOString()
      }, { merge: true });
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

/**
 * Eksport senarai calon ke format CSV lengkap dengan status penerimaan tawaran
 */
export function exportCalonToCsv(list: CalonData[]): string {
  const headers = [
    'Bil',
    'No. MyKid (Berformat)',
    'No. MyKid (12 Digit)',
    'Nama Penuh Calon',
    'Tadika / Prasekolah',
    'Status Keputusan Ujian',
    'Pengesahan Tawaran Ibu Bapa',
    'Tarikh & Masa Pengesahan',
    'Sebab Penolakan (Jika Menolak)',
    'Catatan Pentadbir'
  ];

  const rows = list.map((c, idx) => {
    let responText = 'BELUM RESPON';
    if (c.status === 'TIDAK BERJAYA') {
      responText = 'TIDAK BERKENAAN';
    } else if (c.jawapanTawaran === 'TERIMA') {
      responText = 'MENERIMA TAWARAN';
    } else if (c.jawapanTawaran === 'TOLAK') {
      responText = 'MENOLAK TAWARAN';
    }

    const tarikhText = c.tarikhJawapan ? new Date(c.tarikhJawapan).toLocaleString('ms-MY') : '-';

    return [
      idx + 1,
      `"${c.mykid}"`,
      `"'${c.cleanMykid}"`, // tanda ' supaya Excel membaca sebagai teks tanpa potong 0
      `"${c.nama.replace(/"/g, '""')}"`,
      `"${(c.prasekolah || '-').replace(/"/g, '""')}"`,
      `"${c.status}"`,
      `"${responText}"`,
      `"${tarikhText}"`,
      `"${(c.sebabTolak || '-').replace(/"/g, '""')}"`,
      `"${(c.catatan || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

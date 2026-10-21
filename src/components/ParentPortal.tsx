import React, { useState } from 'react';
import { 
  Search, 
  Printer, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  BookOpen, 
  RotateCcw,
  X,
  Phone,
  Mail,
  MapPin,
  Clock
} from 'lucide-react';
import { getCalonByMyKid, formatMyKid, CalonData } from '../lib/calonService';

interface ParentPortalProps {
  onGoToAdmin?: () => void;
}

export default function ParentPortal({ onGoToAdmin }: ParentPortalProps) {
  const [mykidInput, setMykidInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CalonData | null>(null);
  const [searchedId, setSearchedId] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 12) val = val.slice(0, 12);

    if (val.length > 8) {
      setMykidInput(`${val.slice(0, 6)}-${val.slice(6, 8)}-${val.slice(8)}`);
    } else if (val.length > 6) {
      setMykidInput(`${val.slice(0, 6)}-${val.slice(6)}`);
    } else {
      setMykidInput(val);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = mykidInput.replace(/[^0-9]/g, '');

    if (cleanDigits.length < 12) {
      alert('Sila masukkan 12 digit Nombor MyKid yang sah.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setSearchedId(cleanDigits);
    setIsSearched(true);

    try {
      const data = await getCalonByMyKid(cleanDigits);
      setResult(data);
    } catch (error) {
      console.error('Ralat carian:', error);
      // Sekiranya ada ralat rangkaian, set result null untuk paparan ralat
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString('ms-MY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-600 selection:text-white relative">
      
      {/* ================= FADED WATERMARK BACKGROUND ================= */}
      <div 
        className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0" 
        aria-hidden="true"
      >
        <img 
          src="https://i.postimg.cc/rmLpBk5P/Untitled-design-(10).png" 
          alt="" 
          className="w-[420px] sm:w-[580px] md:w-[680px] max-w-none opacity-[0.05] sm:opacity-[0.06] select-none object-contain pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* ================= HEADER KORPORAT RASMI SEKOLAH ================= */}
      <header className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white shadow-md border-b-4 border-amber-500 relative z-20">
        <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <img 
              src="https://i.postimg.cc/rmLpBk5P/Untitled-design-(10).png" 
              alt="Logo SRA Datuk Haji Mohamad Mortadza" 
              className="w-16 h-16 sm:w-18 sm:h-18 object-contain shrink-0 drop-shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-[11px] font-bold text-emerald-300 tracking-wider uppercase block">
                Portal Rasmi Semakan Keputusan
              </span>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-snug">
                SEKOLAH RENDAH AGAMA DATUK HAJI MOHAMAD MORTADZA HAJI DAUD
              </h1>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Sesi Kemasukan Tahun 1 / 2027
              </p>
            </div>
          </div>
          
          <div className="hidden md:block text-right">
            <span className="text-xs px-3.5 py-1.5 bg-white/10 border border-emerald-300/30 rounded-full text-emerald-200 font-mono tracking-wider font-semibold">
              SESI KEMASUKAN 2027
            </span>
          </div>
        </div>
      </header>

      {/* ================= KANDUNGAN UTAMA SEMAKAN ================= */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 relative z-10">
        
        {/* Tajuk Muka Surat */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2 border border-emerald-200">
            Ujian Penilaian Kemasukan Tahun 1
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Semakan Keputusan Ujian Kemasukan Tahun 1 (2027)
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Sila masukkan 12 digit <strong>Nombor MyKid</strong> calon tanpa sebarang tanda sempang (-) untuk membuat semakan status permohonan.
          </p>
        </div>

        {/* Kotak Carian MyKid */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 transition-all duration-300">
          <div className="bg-gradient-to-r from-emerald-900 to-teal-800 px-6 py-3.5 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-300" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide">Borang Semakan Calon</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-200">Sesi 2027</span>
          </div>

          <form onSubmit={handleSearch} className="p-6 sm:p-8">
            <label htmlFor="parent-mykid-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Nombor MyKid Calon <span className="text-red-500">*</span>
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileText className="w-5 h-5" />
                </div>
                <input
                  id="parent-mykid-input"
                  type="text"
                  maxLength={14}
                  value={mykidInput}
                  onChange={handleInputChange}
                  placeholder="Contoh: 200101-14-1234 atau 200101141234"
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                  required
                  autoComplete="off"
                />
                {mykidInput && (
                  <button
                    type="button"
                    onClick={() => { setMykidInput(''); setResult(null); setIsSearched(false); }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-7 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-500 text-white font-semibold rounded-xl shadow-xs hover:shadow transition duration-200 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyemak...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-amber-300" />
                    <span>Semak Keputusan</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2.5 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0" />
              Sila pastikan nombor MyKid adalah 12 digit tepat kepunyaan calon yang telah menduduki ujian.
            </p>
          </form>
        </div>

        {/* ================= PAPARAN KEPUTUSAN ================= */}
        {isSearched && !isLoading && (
          <div className="transition-all duration-300">
            
            {/* SENARIO 1: NOT FOUND (TIADA DATA) */}
            {!result && (
              <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
                  <AlertCircle className="w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-black text-red-700 tracking-wide uppercase">
                  TIADA DATA
                </h3>
                
                <p className="text-slate-700 text-base font-medium mt-3 max-w-lg mx-auto">
                  Nombor MyKid <span className="font-mono font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded">{formatMyKid(searchedId)}</span> tiada dalam pangkalan data rekod permohonan atau ujian kemasukan.
                </p>
                
                <div className="mt-5 text-xs text-slate-600 max-w-md mx-auto bg-white/80 border border-red-200 rounded-xl p-4 text-left space-y-1">
                  <p className="font-bold text-slate-800">Panduan:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                    <li>Sila semak semula nombor MyKid yang dimasukkan untuk memastikan tiada kesilapan digit.</li>
                    <li>Sekiranya anda yakin telah mendaftar anak anda, sila hubungi pihak pentadbiran sekolah untuk semakan lanjut.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* SENARIO 2: BERJAYA */}
            {result && result.status === 'BERJAYA' && (
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="text-center pb-6 border-b border-emerald-200">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-300 shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  
                  <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                    TAHNIAH, ANDA BERJAYA!
                  </h3>
                  
                  <p className="text-sm sm:text-base text-emerald-700 font-medium mt-1">
                    Calon telah ditawarkan tempat ke <strong>Tahun 1 Sesi Persekolahan 2027</strong> di SRA Datuk Haji Mohamad Mortadza Haji Daud.
                  </p>
                </div>

                {/* Butiran Calon Berjaya */}
                <div className="mt-6 bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-xs">
                  <div className="bg-emerald-800/10 px-5 py-3 border-b border-emerald-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 tracking-wider uppercase">Maklumat Calon Berjaya</span>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">STATUS: DITAWARKAN</span>
                  </div>
                  
                  <dl className="divide-y divide-emerald-100 text-sm">
                    <div className="px-5 py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="font-semibold text-slate-500">Nama Penuh Calon</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2 font-black text-slate-900 text-base uppercase">
                        {result.nama}
                      </dd>
                    </div>
                    
                    <div className="px-5 py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="font-semibold text-slate-500">Nombor MyKid</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2 font-mono font-bold text-emerald-800 tracking-wider">
                        {formatMyKid(result.cleanMykid)}
                      </dd>
                    </div>
                    
                    <div className="px-5 py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="font-semibold text-slate-500">Nama Prasekolah / Tadika</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-slate-800 font-medium uppercase">
                        {result.prasekolah || '-'}
                      </dd>
                    </div>

                    <div className="px-5 py-3.5 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="font-semibold text-slate-500">Sesi Persekolahan</dt>
                      <dd className="mt-1 sm:mt-0 sm:col-span-2 text-slate-800 font-medium">
                        Tahun 1 (Sesi Persekolahan 2027)
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Butang Tindakan Cetak Surat */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-emerald-200">
                  <div className="text-xs text-emerald-900 text-center sm:text-left">
                    <p className="font-bold">Sila cetak Surat Tawaran rasmi ini untuk urusan pengesahan pendaftaran.</p>
                    <p className="text-emerald-700/80">Tarikh semakan: {currentDateFormatted}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLetterModalOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-xl shadow transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-5 h-5 text-amber-300" />
                    <span>Cetak Surat Tawaran</span>
                  </button>
                </div>
              </div>
            )}

            {/* SENARIO 3: TIDAK BERJAYA */}
            {result && result.status === 'TIDAK BERJAYA' && (
              <div className="bg-slate-50 border border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="w-14 h-14 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-8 h-8" />
                </div>

                <div className="text-center pb-5 border-b border-slate-200">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                    KEPUTUSAN: TIDAK BERJAYA
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
                    Dukacita dimaklumkan bahawa permohonan kemasukan bagi calon ini tidak berjaya bagi sesi Tahun 1 / 2027 atas faktor kekosongan kuota tempat yang amat terhad.
                  </p>
                </div>

                <div className="my-5 bg-white border border-slate-200 rounded-xl p-4 text-xs sm:text-sm space-y-2 max-w-lg mx-auto">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Nama Calon:</span>
                    <span className="font-bold text-slate-900 uppercase">{result.nama}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Nombor MyKid:</span>
                    <span className="font-mono font-bold text-slate-800">{formatMyKid(result.cleanMykid)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Status Penawaran:</span>
                    <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded">TIDAK DITAWARKAN</span>
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <p className="font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-emerald-700" />
                    Maklumat Rayuan &amp; Senarai Menunggu:
                  </p>
                  <p className="text-slate-700">
                    Pihak pengurusan sekolah merakamkan setinggi-tinggi penghargaan dan terima kasih kepada ibu bapa atas kesudian memilih sekolah kami. 
                    Ibu bapa yang berhasrat mengemukakan surat rayuan boleh menghantar surat rayuan rasmi ke pejabat sekolah dalam tempoh <strong>14 hari bekerja</strong> bermula dari tarikh pengumuman keputusan ini.
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-emerald-200/70 flex flex-wrap gap-4 text-xs text-slate-600">
                    <span><strong>Pejabat Pentadbiran:</strong> 03-8925 XXXX</span>
                    <span><strong>Waktu Kaunter:</strong> 8.00 pagi - 4.30 petang (Isnin - Jumaat)</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-xs border-t border-slate-800 mt-auto">
        <div className="max-w-4xl mx-auto px-4 space-y-1">
          <p className="font-bold text-slate-300">SEKOLAH RENDAH AGAMA DATUK HAJI MOHAMAD MORTADZA HAJI DAUD</p>
          <p>Hak Cipta Terpelihara &copy; 2026/2027. Jawatankuasa Kemasukan &amp; Pengambilan Murid Tahun 1.</p>
          <p className="text-slate-500">
            Sebarang pertanyaan sila hubungi pihak pentadbiran sekolah di talian pejabat atau emel rasmi sekolah.
          </p>
          
          {/* Akses pentadbir rahsia/tenang di bahagian paling bawah */}
          {onGoToAdmin && (
            <div className="pt-3">
              <button
                type="button"
                onClick={onGoToAdmin}
                className="text-slate-600 hover:text-slate-400 text-[10px] tracking-wider transition cursor-pointer font-mono"
                title="Akses Pentadbir"
              >
                LMP
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* ================= MODAL SURAT TAWARAN (PRINTABLE) ================= */}
      {isLetterModalOpen && result && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-300 flex flex-col max-h-[90vh]">
            
            <div className="bg-emerald-950 px-6 py-4 flex items-center justify-between text-white border-b border-emerald-800 shrink-0 no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-300" />
                <span className="font-bold text-sm tracking-wide">Pratonton Surat Tawaran Rasmi</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 transition shadow cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Surat (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLetterModalOpen(false)}
                  className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dokumen Surat Tawaran Rasmi */}
            <div id="printable-letter" className="p-8 sm:p-12 text-slate-900 bg-white overflow-y-auto">
              
              <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center flex flex-col items-center">
                <img 
                  src="https://i.postimg.cc/rmLpBk5P/Untitled-design-(10).png" 
                  alt="Logo SRA Datuk Haji Mohamad Mortadza" 
                  className="w-18 h-18 object-contain mb-2"
                  referrerPolicy="no-referrer"
                />
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                  SEKOLAH RENDAH AGAMA DATUK HAJI MOHAMAD MORTADZA HAJI DAUD
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">KOMPLEKS PENDIDIKAN ISLAM, JALAN MASJID, MALAYSIA</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">TEL: 03-8925 XXXX | EMEL: sradhmmhd@gmail.com</p>
              </div>

              <div className="flex justify-between items-start text-xs sm:text-sm mb-6 text-slate-800">
                <div>
                  <p><span className="font-bold">Ruj. Kami:</span> SRA-DMMHD/T1-2027/TW-{result.cleanMykid}</p>
                  <p className="mt-0.5"><span className="font-bold">Kepada:</span> Ibu Bapa / Penjaga Murid</p>
                </div>
                <div className="text-right">
                  <p><span className="font-bold">Tarikh:</span> {currentDateFormatted}</p>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm sm:text-base font-black text-slate-900 uppercase border-b border-slate-300 pb-2">
                  TAWARAN KEMASUKAN KE TAHUN 1 SESI PERSEKOLAHAN 2027
                </h3>
              </div>

              <div className="text-xs sm:text-sm text-slate-800 space-y-3 leading-relaxed">
                <p>Tuan/Puan,</p>
                <p>Dengan sukacitanya dimaklumkan bahawa calon berikut telah <strong>BERJAYA</strong> dalam Ujian Penilaian Kemasukan dan dengan ini ditawarkan tempat ke Tahun 1 Sesi Persekolahan 2027:</p>
                
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 my-3 text-xs sm:text-sm">
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Nama Penuh Calon:</span>
                    <span className="col-span-2 font-bold text-slate-900 uppercase">{result.nama}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-200">
                    <span className="text-slate-600">Nombor MyKid:</span>
                    <span className="col-span-2 font-mono font-bold text-slate-900">{formatMyKid(result.cleanMykid)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-1.5">
                    <span className="text-slate-600">Prasekolah Asal:</span>
                    <span className="col-span-2 font-medium text-slate-900 uppercase">{result.prasekolah || '-'}</span>
                  </div>
                </div>

                <p className="font-bold text-slate-900 pt-1">2. PENGESAHAN PENDAFTARAN &amp; TAKLIMAT IBU BAPA</p>
                <p>Ibu bapa/penjaga dikehendaki hadir bagi sesi taklimat serta mengesahkan tawaran ini seperti ketetapan berikut:</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <li><strong>Tarikh:</strong> 15 November 2026 (Sabtu)</li>
                  <li><strong>Masa:</strong> 8:30 Pagi - 12:30 Tengah Hari</li>
                  <li><strong>Tempat:</strong> Dewan Utama SRA Datuk Haji Mohamad Mortadza Haji Daud</li>
                </ul>

                <p className="font-bold text-slate-900 pt-1">3. DOKUMEN YANG PERLU DIBAWA:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-slate-800">
                  <li>Surat Tawaran Rasmi ini yang telah dicetak.</li>
                  <li>Salinan Sijil Lahir &amp; MyKid murid (disahkan).</li>
                  <li>Salinan Kad Pengenalan Ibu &amp; Bapa/Penjaga.</li>
                  <li>Salinan Slip Gaji terkini / Pengesahan Pendapatan.</li>
                  <li>Buku Rekod Kesihatan Kanak-kanak (muka surat imunisasi).</li>
                </ol>

                <p className="pt-2 text-slate-500 italic text-xs">
                  *Kegagalan hadir mengesahkan pendaftaran dalam tempoh yang ditetapkan boleh menyebabkan tawaran ini terbatal secara automatik.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-300 flex justify-between items-end text-xs sm:text-sm">
                <div>
                  <p className="text-slate-600 mb-8">Sekian, terima kasih.</p>
                  <p className="font-bold text-slate-900 uppercase">GURU BESAR / JAWATANKUASA KEMASUKAN</p>
                  <p className="text-slate-600">SRA Datuk Haji Mohamad Mortadza Haji Daud</p>
                </div>
                <div className="text-right">
                  <div className="w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-[10px] text-slate-400 p-2 uppercase">
                    <span>Cop Rasmi</span>
                    <span>Sekolah</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

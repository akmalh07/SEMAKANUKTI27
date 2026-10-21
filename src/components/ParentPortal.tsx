import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  RotateCcw,
  Check,
  Send,
  Clock,
  FileCheck
} from 'lucide-react';
import { getCalonByMyKid, submitJawapanTawaran, formatMyKid, CalonData } from '../lib/calonService';

interface ParentPortalProps {
  onGoToAdmin?: () => void;
}

export default function ParentPortal({ onGoToAdmin }: ParentPortalProps) {
  const [mykidInput, setMykidInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CalonData | null>(null);
  const [searchedId, setSearchedId] = useState('');
  const [isSearched, setIsSearched] = useState(false);

  // State Pengesahan Penerimaan/Penolakan
  const [pilihanTawaran, setPilihanTawaran] = useState<'TERIMA' | 'TOLAK' | null>(null);
  const [sebabTolak, setSebabTolak] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState('');
  const [isEditingJawapan, setIsEditingJawapan] = useState(false);

  // Auto-format membuang sempang dan mengehadkan kepada 12 angka
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
    setMykidInput(digitsOnly);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = mykidInput.replace(/[^0-9]/g, '');

    if (cleanDigits.length < 12) {
      alert('Sila masukkan 12 digit Nombor MyKid yang lengkap.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setSearchedId(cleanDigits);
    setIsSearched(true);
    setPilihanTawaran(null);
    setSebabTolak('');
    setSubmitFeedback('');
    setIsEditingJawapan(false);

    try {
      const data = await getCalonByMyKid(cleanDigits);
      setResult(data);
      if (data && data.jawapanTawaran) {
        setPilihanTawaran(data.jawapanTawaran);
        setSebabTolak(data.sebabTolak || '');
      }
    } catch (error) {
      console.error('Ralat carian:', error);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Hantar maklum balas Terima / Tolak
  const handleSubmitJawapan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !pilihanTawaran) {
      alert('Sila pilih sama ada MENERIMA atau MENOLAK tawaran.');
      return;
    }

    const sahkan = window.confirm(
      pilihanTawaran === 'TERIMA'
        ? 'Adakah anda pasti untuk MENERIMA tawaran kemasukan Tahun 1 bagi calon ini?'
        : 'Adakah anda pasti untuk MENOLAK tawaran kemasukan Tahun 1 bagi calon ini?'
    );

    if (!sahkan) return;

    setIsSubmitting(true);
    setSubmitFeedback('');

    try {
      await submitJawapanTawaran(result.cleanMykid, pilihanTawaran, sebabTolak);
      
      const tarikhBaru = new Date().toISOString();
      setResult({
        ...result,
        jawapanTawaran: pilihanTawaran,
        tarikhJawapan: tarikhBaru,
        sebabTolak: sebabTolak
      });

      setSubmitFeedback('Pengesahan anda telah berjaya disimpan dan dihantar ke pihak pentadbiran sekolah.');
      setIsEditingJawapan(false);
    } catch (err: any) {
      alert(`Gagal menyimpan maklum balas: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-800 selection:text-white relative">
      
      {/* ================= FADED WATERMARK BACKGROUND ================= */}
      <div 
        className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0" 
        aria-hidden="true"
      >
        <img 
          src="https://i.postimg.cc/rmLpBk5P/Untitled-design-(10).png" 
          alt="" 
          className="w-[420px] sm:w-[580px] md:w-[680px] max-w-none opacity-[0.04] sm:opacity-[0.05] select-none object-contain pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* ================= HEADER KORPORAT RASMI SEKOLAH ================= */}
      <header className="bg-emerald-950 text-white shadow-md border-b-2 border-emerald-800/80 relative z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <img 
              src="https://i.postimg.cc/rmLpBk5P/Untitled-design-(10).png" 
              alt="Logo SRA Datuk Haji Mohamad Mortadza" 
              className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0 drop-shadow-md"
              referrerPolicy="no-referrer"
            />
            <div>
              <span className="text-xs sm:text-sm font-extrabold text-amber-400 tracking-wider uppercase block">
                PORTAL RASMI SEMAKAN KEPUTUSAN
              </span>
              <h1 className="text-sm sm:text-base font-medium tracking-normal text-white/95 leading-relaxed mt-0.5">
                Sekolah Rendah Agama Datuk Haji Mohamad Mortadza Haji Daud
              </h1>
              <p className="text-xs text-emerald-300/90 font-mono mt-0.5">
                Ujian Kemasukan Tahun 1 &bull; Sesi Persekolahan 2027
              </p>
            </div>
          </div>
          
          <div className="hidden md:block text-right">
            <span className="text-xs px-3.5 py-1.5 bg-emerald-900/80 border border-emerald-700/60 rounded-full text-emerald-200 font-mono tracking-wider font-semibold">
              SESI KEMASUKAN 2027
            </span>
          </div>
        </div>
      </header>

      {/* ================= KANDUNGAN UTAMA SEMAKAN ================= */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 relative z-10">
        
        {/* Tajuk Muka Surat & Arahan */}
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/90 text-emerald-900 mb-2.5 border border-emerald-200">
            Ujian Penilaian Kemasukan Tahun 1
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Semakan Keputusan Kemasukan Tahun 1 (2027)
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 max-w-xl mx-auto leading-relaxed">
            Sila masukkan 12 digit <strong>Nombor MyKid</strong> calon tanpa sebarang tanda sempang (-) untuk membuat semakan keputusan dan mengesahkan penerimaan tawaran.
          </p>
        </div>

        {/* ================= KOTAK SEMAKAN MYKID (KAD MINIMALIS & MODEN) ================= */}
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200/90 p-6 sm:p-8 mb-10 transition-all duration-300">
          <form onSubmit={handleSearch}>
            <div className="flex items-center justify-between mb-2.5">
              <label htmlFor="parent-mykid-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nombor MyKid Calon <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">12 Digit (Tanpa Tanda Sempang)</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <FileText className="w-5 h-5" />
                </div>
                <input
                  id="parent-mykid-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={mykidInput}
                  onChange={handleInputChange}
                  placeholder="Contoh: 200101141234"
                  className="w-full pl-11 pr-10 py-3.5 bg-slate-50/70 border border-slate-300 rounded-xl text-slate-900 font-mono text-base focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 focus:border-emerald-800 transition tracking-wide"
                  required
                  autoComplete="off"
                />
                {mykidInput && (
                  <button
                    type="button"
                    onClick={() => { setMykidInput(''); setResult(null); setIsSearched(false); }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Kosongkan input"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3.5 bg-emerald-900 hover:bg-emerald-800 active:bg-emerald-950 disabled:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs hover:shadow transition duration-200 flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Menyemak Keputusan...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-5 h-5 text-amber-400 stroke-[2.2]" />
                    <span>Semak Keputusan</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-emerald-800 shrink-0" />
              Sila pastikan 12 digit nombor MyKid dimasukkan tanpa tanda sempang. Sebarang tanda sempang akan dibuang secara automatik.
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
              <div className="space-y-6">
                
                {/* Kad Keputusan Berjaya */}
                <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 shadow-sm">
                  <div className="text-center pb-6 border-b border-emerald-200">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-300 shadow-sm">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                      TAHNIAH, ANDA BERJAYA!
                    </h3>
                    
                    <p className="text-sm sm:text-base text-emerald-700 font-medium mt-1">
                      Calon telah layak dan ditawarkan tempat ke <strong>Tahun 1 Sesi Persekolahan 2027</strong> di SRA Datuk Haji Mohamad Mortadza Haji Daud.
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
                </div>

                {/* ================= BORANG PENGESAHAN PENERIMAAN / PENOLAKAN TAWARAN ================= */}
                <div className="bg-white border-2 border-slate-300 rounded-2xl p-6 sm:p-8 shadow-sm">
                  
                  <div className="pb-4 border-b border-slate-200">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-200">
                      Tindakan Ibu Bapa / Penjaga Wajib
                    </span>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
                      Pengesahan Penerimaan Tawaran Kemasukan Tahun 1 (2027)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      Sila buat pengesahan sama ada tuan/puan bersetuju <strong>Menerima</strong> atau <strong>Menolak</strong> tawaran kemasukan ini untuk direkodkan dalam sistem pentadbiran sekolah.
                    </p>
                  </div>

                  {submitFeedback && (
                    <div className="my-4 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-900 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{submitFeedback}</span>
                    </div>
                  )}

                  {/* KES SUDAH HANTAR JAWAPAN (PAPARAN STATUS) */}
                  {result.jawapanTawaran && !isEditingJawapan ? (
                    <div className="mt-5 space-y-4">
                      <div className={`p-5 rounded-2xl border ${
                        result.jawapanTawaran === 'TERIMA'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-slate-100 border-slate-300 text-slate-900'
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              result.jawapanTawaran === 'TERIMA'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-700 text-white'
                            }`}>
                              {result.jawapanTawaran === 'TERIMA' ? (
                                <CheckCircle2 className="w-6 h-6" />
                              ) : (
                                <XCircle className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <span className="text-[11px] font-bold tracking-wider uppercase opacity-80 block">
                                Status Maklum Balas Direkodkan
                              </span>
                              <h5 className="text-base sm:text-lg font-black tracking-tight">
                                {result.jawapanTawaran === 'TERIMA' 
                                  ? 'ANDA TELAH MENERIMA TAWARAN INI' 
                                  : 'ANDA TELAH MENOLAK TAWARAN INI'}
                              </h5>
                            </div>
                          </div>

                          <span className="px-3 py-1 bg-white rounded-full text-xs font-bold border border-slate-200 shrink-0 font-mono">
                            DIREKODKAN
                          </span>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/80 text-xs sm:text-sm space-y-1">
                          {result.tarikhJawapan && (
                            <p className="flex items-center gap-1.5 text-slate-600">
                              <Clock className="w-4 h-4 text-slate-500" />
                              <span>
                                <strong>Tarikh &amp; Masa Pengesahan:</strong>{' '}
                                {new Date(result.tarikhJawapan).toLocaleString('ms-MY', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </span>
                            </p>
                          )}

                          {result.jawapanTawaran === 'TOLAK' && result.sebabTolak && (
                            <p className="text-slate-700">
                              <strong>Sebab Penolakan:</strong> {result.sebabTolak}
                            </p>
                          )}

                          <p className="mt-2 text-slate-600 leading-relaxed">
                            {result.jawapanTawaran === 'TERIMA'
                              ? 'Maklum balas penerimaan anda telah diterima oleh pihak pentadbir. Sila nantikan makluman tarikh taklimat dan pendaftaran fizikal.'
                              : 'Maklum balas penolakan tawaran anda telah direkodkan. Kuota tawaran ini akan ditawarkan kepada calon seterusnya dalam senarai menunggu.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEditingJawapan(true)}
                          className="text-xs text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer font-medium"
                        >
                          Tukar / Kemaskini Pengesahan
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* KES BELUM HANTAR ATAU SEDANG EDIT */
                    <form onSubmit={handleSubmitJawapan} className="mt-5 space-y-5">
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* PILIHAN 1: MENERIMA TAWARAN */}
                        <label 
                          onClick={() => setPilihanTawaran('TERIMA')}
                          className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                            pilihanTawaran === 'TERIMA'
                              ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/30'
                              : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                pilihanTawaran === 'TERIMA' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                <Check className="w-5 h-5 stroke-[2.5]" />
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-900 text-base">
                                  Menerima Tawaran
                                </h5>
                                <span className="text-[11px] text-emerald-700 font-semibold uppercase">
                                  Bersetuju Mendaftar
                                </span>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="jawapan"
                              value="TERIMA"
                              checked={pilihanTawaran === 'TERIMA'}
                              onChange={() => setPilihanTawaran('TERIMA')}
                              className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 mt-1"
                            />
                          </div>
                          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                            Saya bersetuju menerima tawaran kemasukan Tahun 1 bagi sesi persekolahan 2027 untuk calon ini.
                          </p>
                        </label>

                        {/* PILIHAN 2: MENOLAK TAWARAN */}
                        <label 
                          onClick={() => setPilihanTawaran('TOLAK')}
                          className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                            pilihanTawaran === 'TOLAK'
                              ? 'border-red-500 bg-red-50/70 ring-2 ring-red-500/30'
                              : 'border-slate-200 bg-slate-50 hover:border-red-300 hover:bg-red-50/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                pilihanTawaran === 'TOLAK' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                              }`}>
                                <XCircle className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-slate-900 text-base">
                                  Menolak Tawaran
                                </h5>
                                <span className="text-[11px] text-red-700 font-semibold uppercase">
                                  Tidak Mendaftar
                                </span>
                              </div>
                            </div>
                            <input
                              type="radio"
                              name="jawapan"
                              value="TOLAK"
                              checked={pilihanTawaran === 'TOLAK'}
                              onChange={() => setPilihanTawaran('TOLAK')}
                              className="w-5 h-5 text-red-600 focus:ring-red-500 mt-1"
                            />
                          </div>
                          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                            Saya tidak berhasrat menerima tawaran ini dan melepaskan kuota tempat kepada calon lain.
                          </p>
                        </label>

                      </div>

                      {/* Jika Menolak: Ruangan Sebab */}
                      {pilihanTawaran === 'TOLAK' && (
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-200">
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                            Sebab Penolakan Tawaran (Pilihan)
                          </label>
                          <input
                            type="text"
                            value={sebabTolak}
                            onChange={(e) => setSebabTolak(e.target.value)}
                            placeholder="Contoh: Memilih sekolah kebangsaan / berpindah tempat tinggal / faktor pengangkutan"
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                      )}

                      {/* Butang Hantar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 text-center sm:text-left">
                          Keputusan anda akan terus dikemas kini dalam sistem pentadbiran sekolah secara langsung.
                        </p>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {isEditingJawapan && (
                            <button
                              type="button"
                              onClick={() => setIsEditingJawapan(false)}
                              className="w-1/2 sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                              Batal
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={!pilihanTawaran || isSubmitting}
                            className="w-full sm:w-auto px-7 py-3 bg-emerald-900 hover:bg-emerald-800 active:bg-emerald-950 disabled:bg-emerald-600/50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Menghantar Pengesahan...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 text-amber-400" />
                                <span>Hantar Pengesahan</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                    </form>
                  )}

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
          
          {/* Akses pentadbir rahsia di bahagian paling bawah */}
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

    </div>
  );
}

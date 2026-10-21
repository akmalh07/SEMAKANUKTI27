import React, { useState, useEffect } from 'react';
import ParentPortal from './components/ParentPortal';
import AdminPortal from './components/AdminPortal';
import { testFirebaseConnection } from './lib/firebase';
import { getAllCalon, saveBulkCalon } from './lib/calonService';
import { Lock, Eye, EyeOff, X, ShieldAlert, KeyRound } from 'lucide-react';

const ADMIN_PASSWORD = 'akmalUKTIdua7';

const SEED_DATA = [
  {
    cleanMykid: '200101141234',
    mykid: '200101-14-1234',
    nama: 'AHMAD DANIAL BIN MOHD HAFIZ',
    prasekolah: 'TADIKA ISLAM PASTI AL-FALAH',
    status: 'BERJAYA' as const,
    catatan: 'Tahniah! Calon mendapat markah cemerlang dalam Ujian Penilaian Hafazan & Asas Fardhu Ain.'
  },
  {
    cleanMykid: '200202105678',
    mykid: '200202-10-5678',
    nama: 'NUR AISYAH HUMAIRA BINTI ZULKIFLI',
    prasekolah: 'PRA-SEKOLAH SK BANDAR BARU',
    status: 'BERJAYA' as const,
    catatan: 'Tahniah! Calon berjaya ditempatkan di Kelas 1 Al-Ghazali.'
  },
  {
    cleanMykid: '200303089999',
    mykid: '200303-08-9999',
    nama: 'MUHAMMAD ADAM HARITH BIN KHAIRUL ANUAR',
    prasekolah: 'TADIKA KEMAS SERI MAWAR',
    status: 'TIDAK BERJAYA' as const,
    catatan: 'Permohonan tidak berjaya kerana kekosongan kuota kemasukan telah penuh.'
  }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('sra_admin_auth') === 'true';
    }
    return false;
  });

  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    testFirebaseConnection();

    // Semak pautan URL sekiranya meminta mod admin
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const wantsAdmin = params.get('admin') === 'portal' || params.get('admin') === '1' || params.get('mode') === 'admin';
      
      if (wantsAdmin) {
        if (sessionStorage.getItem('sra_admin_auth') === 'true') {
          setIsAdminView(true);
        } else {
          // Buka modal pengesahan kata laluan
          setIsPasswordModalOpen(true);
        }
      }
    }

    // Pastikan pangkalan data mempunyai data permulaan sekiranya kosong
    async function seedInitialDataIfNeeded() {
      try {
        const existing = await getAllCalon();
        if (existing.length === 0) {
          console.log('Pangkalan data kosong. Memasukkan data permulaan...');
          await saveBulkCalon(SEED_DATA);
        }
      } catch (e) {
        console.warn('Gagal menyemak data permulaan:', e);
      }
    }

    seedInitialDataIfNeeded();
  }, []);

  // Apabila pengguna menekan butang 'LMP'
  const handleRequestAdmin = () => {
    if (isAuthenticated) {
      setIsAdminView(true);
      const url = new URL(window.location.href);
      url.searchParams.set('admin', 'portal');
      window.history.pushState({}, '', url.toString());
    } else {
      setPasswordError('');
      setPasswordInput('');
      setIsPasswordModalOpen(true);
    }
  };

  // Pengesahan kata laluan
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('sra_admin_auth', 'true');
      setIsAuthenticated(true);
      setIsPasswordModalOpen(false);
      setIsAdminView(true);
      setPasswordError('');

      const url = new URL(window.location.href);
      url.searchParams.set('admin', 'portal');
      window.history.pushState({}, '', url.toString());
    } else {
      setPasswordError('Kata laluan tidak tepat. Sila cuba lagi.');
    }
  };

  // Beralih semula ke paparan portal semakan ibu bapa
  const handleSwitchToParent = () => {
    setIsAdminView(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    url.searchParams.delete('mode');
    window.history.pushState({}, '', url.toString());
  };

  // Log keluar pentadbir (kunci semula)
  const handleLogout = () => {
    sessionStorage.removeItem('sra_admin_auth');
    setIsAuthenticated(false);
    setIsAdminView(false);
    setIsPasswordModalOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('admin');
    url.searchParams.delete('mode');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <>
      {isAdminView && isAuthenticated ? (
        <AdminPortal 
          onGoToParentPortal={handleSwitchToParent} 
          onLogout={handleLogout}
        />
      ) : (
        <ParentPortal onGoToAdmin={handleRequestAdmin} />
      )}

      {/* ================= MODAL KATA LALUAN PENTADBIR (LMP) ================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-sm tracking-wide">Pengesahan Pentadbir (LMP)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  handleSwitchToParent();
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Kandungan Borang Kata Laluan */}
            <form onSubmit={handleVerifyPassword} className="p-6">
              <div className="text-center mb-5">
                <img 
                  src="https://i.postimg.cc/rmLpBk5P/Untitled-design-(10).png" 
                  alt="Logo Sekolah" 
                  className="w-14 h-14 object-contain mx-auto mb-2 drop-shadow"
                  referrerPolicy="no-referrer"
                />
                <h3 className="text-sm font-bold text-slate-900">
                  SEKOLAH RENDAH AGAMA DATUK HAJI MOHAMAD MORTADZA HAJI DAUD
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Sila masukkan kata laluan untuk mengakses modul pengurusan dan kemasukan calon.
                </p>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-1.5 mb-5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Kata Laluan Pentadbir
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Masukkan kata laluan"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    handleSwitchToParent();
                  }}
                  className="w-1/2 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Sahkan</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Upload, 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  FileSpreadsheet,
  AlertTriangle,
  X,
  ArrowRight,
  ShieldCheck,
  Eye,
  LogOut
} from 'lucide-react';
import { 
  CalonData, 
  parseBulkText, 
  saveBulkCalon, 
  getAllCalon, 
  saveCalon, 
  deleteCalon, 
  formatMyKid 
} from '../lib/calonService';

interface AdminPortalProps {
  onGoToParentPortal: () => void;
  onLogout?: () => void;
}

const SAMPLE_EXCEL_TEXT = `200101141234\tAHMAD DANIAL BIN MOHD HAFIZ\tTADIKA ISLAM PASTI AL-FALAH\tBERJAYA
200202105678\tNUR AISYAH HUMAIRA BINTI ZULKIFLI\tPRA-SEKOLAH SK BANDAR BARU\tBERJAYA
200303089999\tMUHAMMAD ADAM HARITH BIN KHAIRUL ANUAR\tTADIKA KEMAS SERI MAWAR\tTIDAK BERJAYA
200404144321\tSITI KHADIJAH BINTI AHMAD FAISAL\tTADIKA INTEGRASI CEMERLANG\tBERJAYA
200505127890\tMUHAMMAD FAYYADH BIN MOHD IZZAT\tPRA-SEKOLAH KEBANGSAAN DAMAI\tTIDAK BERJAYA`;

export default function AdminPortal({ onGoToParentPortal, onLogout }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<'bulk' | 'list'>('bulk');
  const [calonList, setCalonList] = useState<CalonData[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  
  // Bulk state
  const [bulkText, setBulkText] = useState('');
  const [parsedValid, setParsedValid] = useState<CalonData[]>([]);
  const [parsedErrors, setParsedErrors] = useState<{ line: number; text: string; reason: string }[]>([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BERJAYA' | 'TIDAK BERJAYA'>('ALL');

  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editForm, setEditForm] = useState<CalonData>({
    cleanMykid: '',
    mykid: '',
    nama: '',
    prasekolah: '',
    status: 'BERJAYA',
    catatan: ''
  });
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  // Link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Muat senarai awal
  const loadData = async () => {
    setIsLoadingList(true);
    try {
      const data = await getAllCalon();
      setCalonList(data);
    } catch (err) {
      console.error('Ralat memuat data:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Analisis teks pukal
  const handleParseBulk = () => {
    if (!bulkText.trim()) {
      alert('Sila tampal teks atau muat naik fail terlebih dahulu.');
      return;
    }
    const result = parseBulkText(bulkText);
    setParsedValid(result.valid);
    setParsedErrors(result.errors);
    setBulkSuccessMsg('');
  };

  // Muat fail CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkText(content);
      const result = parseBulkText(content);
      setParsedValid(result.valid);
      setParsedErrors(result.errors);
      setBulkSuccessMsg('');
    };
    reader.readAsText(file);
  };

  // Simpan data pukal ke Firestore
  const handleSaveBulk = async () => {
    if (!parsedValid.length) return;

    setIsSavingBulk(true);
    try {
      const count = await saveBulkCalon(parsedValid);
      setBulkSuccessMsg(`Berjaya menyimpan ${count} rekod calon ke dalam pangkalan data Firestore!`);
      setBulkText('');
      setParsedValid([]);
      setParsedErrors([]);
      await loadData();
      setActiveTab('list');
    } catch (error: any) {
      alert(`Ralat menyimpan data: ${error.message || error}`);
    } finally {
      setIsSavingBulk(false);
    }
  };

  // Salin pautan semakan awam ibu bapa
  const handleCopyParentLink = () => {
    const url = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Tambah calon manual
  const openAddModal = () => {
    setModalMode('add');
    setEditForm({
      cleanMykid: '',
      mykid: '',
      nama: '',
      prasekolah: '',
      status: 'BERJAYA',
      catatan: ''
    });
    setIsModalOpen(true);
  };

  // Edit calon
  const openEditModal = (calon: CalonData) => {
    setModalMode('edit');
    setEditForm({ ...calon });
    setIsModalOpen(true);
  };

  // Simpan calon tunggal
  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editForm.cleanMykid.replace(/[^0-9]/g, '');
    if (clean.length !== 12) {
      alert('Sila pastikan 12 digit nombor MyKid dimasukkan dengan tepat.');
      return;
    }

    setIsSavingSingle(true);
    try {
      await saveCalon({
        ...editForm,
        cleanMykid: clean,
        mykid: formatMyKid(clean),
        nama: editForm.nama.trim().toUpperCase(),
        prasekolah: (editForm.prasekolah || '-').trim().toUpperCase(),
        status: editForm.status
      });
      setIsModalOpen(false);
      await loadData();
    } catch (error: any) {
      alert(`Ralat: ${error.message || error}`);
    } finally {
      setIsSavingSingle(false);
    }
  };

  // Padam calon
  const handleDeleteCalon = async (cleanMykid: string, nama: string) => {
    if (confirm(`Adakah anda pasti ingin memadamkan rekod calon ${nama} (${formatMyKid(cleanMykid)})?`)) {
      try {
        await deleteCalon(cleanMykid);
        await loadData();
      } catch (error: any) {
        alert(`Gagal memadam: ${error.message || error}`);
      }
    }
  };

  // Tapis senarai calon
  const filteredList = calonList.filter((c) => {
    const matchQuery = 
      c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cleanMykid.includes(searchQuery.replace(/[^0-9]/g, '')) ||
      (c.prasekolah && c.prasekolah.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = 
      statusFilter === 'ALL' ? true : c.status === statusFilter;

    return matchQuery && matchStatus;
  });

  const totalBerjaya = calonList.filter(c => c.status === 'BERJAYA').length;
  const totalTidakBerjaya = calonList.filter(c => c.status === 'TIDAK BERJAYA').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* ================= HEADER PENTADBIR ================= */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <img 
              src="https://i.postimg.cc/rmLpBk5P/Untitled-design-(10).png" 
              alt="Logo SRA DMMHD" 
              className="w-11 h-11 object-contain drop-shadow shrink-0" 
              referrerPolicy="no-referrer" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                  Papan Kawalan Pentadbir (LMP)
                </span>
                <span className="text-xs text-slate-400">Firebase Firestore</span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                Pengurusan Kemasukan Tahun 1 (Sesi 2027) &bull; SRA DMMHD
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyParentLink}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Salin pautan untuk diberikan kepada ibu bapa"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedLink ? 'Pautan Disalin!' : 'Salin Pautan Ibu Bapa'}</span>
            </button>

            <button
              onClick={onGoToParentPortal}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Portal Semakan</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 flex items-center gap-1.5 transition cursor-pointer"
                title="Log keluar dan kunci sesi pentadbir"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Keluar</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* ================= KAWASAN KANDUNGAN PENTADBIR ================= */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 flex-grow">
        
        {/* Kad Statistik Pangkalan Data */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Jumlah Calon Berdaftar
              </span>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {calonList.length}
              </p>
            </div>
            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                Calon Ditauliahkan (Berjaya)
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
                {totalBerjaya}
              </p>
            </div>
            <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tidak Ditawarkan
              </span>
              <p className="text-2xl font-black text-slate-700 mt-1 font-mono">
                {totalTidakBerjaya}
              </p>
            </div>
            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
              <XCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Notis Kejayaan Pukal */}
        {bulkSuccessMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{bulkSuccessMsg}</span>
            </div>
            <button 
              onClick={() => setBulkSuccessMsg('')}
              className="text-emerald-700 hover:text-emerald-900 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigasi Mod */}
        <div className="flex border-b border-slate-300 mb-6 bg-white rounded-t-xl px-4 pt-3">
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'bulk'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Kemasukan Data Pukal (Excel / CSV)</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'list'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Senarai Pangkalan Data ({calonList.length})</span>
          </button>
        </div>

        {/* ================= TAB 1: KEMASUKAN PUKAL ================= */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Import Data Calon Secara Pukal
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Salin (copy) baris jadual dari Microsoft Excel / Google Sheets dan tampal (paste) terus di bawah.
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkText(SAMPLE_EXCEL_TEXT)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Muat Contoh Teks Excel</span>
                  </button>

                  <label className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer border border-emerald-200">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Fail CSV / TXT</span>
                    <input 
                      type="file" 
                      accept=".csv,.txt" 
                      onChange={handleFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Panduan Susunan Kolum */}
              <div className="my-4 p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Susunan Lajur Dikehendaki (Tab atau Koma):</strong><br />
                  <code className="text-slate-900 font-mono font-bold">[1] No MyKid (12 digit)</code> &bull; 
                  <code className="text-slate-900 font-mono font-bold"> [2] Nama Penuh Calon</code> &bull; 
                  <code className="text-slate-900 font-mono font-bold"> [3] Nama Prasekolah / Tadika</code> &bull; 
                  <code className="text-slate-900 font-mono font-bold"> [4] Status ("BERJAYA" atau "TIDAK BERJAYA")</code>
                </div>
              </div>

              {/* Textarea Pukal */}
              <div className="space-y-2">
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Tampal teks jadual dari Excel di sini..."
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition"
                />
              </div>

              {/* Butang Analisis */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  {bulkText ? `${bulkText.split('\n').filter(Boolean).length} baris teks dimasukkan` : 'Belum ada data dimasukkan'}
                </span>

                <button
                  type="button"
                  onClick={handleParseBulk}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-amber-400" />
                  <span>Analisis &amp; Pratonton Data</span>
                </button>
              </div>

            </div>

            {/* Pratonton Hasil Penguraian */}
            {(parsedValid.length > 0 || parsedErrors.length > 0) && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Hasil Analisis Pratonton
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dikesan: <strong className="text-emerald-700">{parsedValid.length} calon sah</strong> ({parsedValid.filter(c => c.status === 'BERJAYA').length} Berjaya, {parsedValid.filter(c => c.status === 'TIDAK BERJAYA').length} Tidak Berjaya). 
                      {parsedErrors.length > 0 && <span className="text-red-600 ml-1">({parsedErrors.length} baris tidak sah)</span>}
                    </p>
                  </div>

                  {parsedValid.length > 0 && (
                    <button
                      type="button"
                      disabled={isSavingBulk}
                      onClick={handleSaveBulk}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
                    >
                      {isSavingBulk ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Menyimpan ke Firestore...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-amber-300" />
                          <span>Sahkan &amp; Simpan {parsedValid.length} Rekod ke Firestore</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Senarai Ralat jika ada */}
                {parsedErrors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-red-800">Baris Tidak Sah / Gagal Diurai:</p>
                    <ul className="list-disc list-inside text-red-700 space-y-0.5">
                      {parsedErrors.map((err, idx) => (
                        <li key={idx}>
                          Baris {err.line}: {err.reason} (<span className="font-mono text-[11px]">{err.text}</span>)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Jadual Pratonton */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-72">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Bil</th>
                        <th className="px-4 py-2.5">No. MyKid</th>
                        <th className="px-4 py-2.5">Nama Penuh Calon</th>
                        <th className="px-4 py-2.5">Prasekolah Asal</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedValid.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80">
                          <td className="px-4 py-2 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-4 py-2 font-mono font-bold text-slate-900">{formatMyKid(item.cleanMykid)}</td>
                          <td className="px-4 py-2 font-medium text-slate-900 uppercase">{item.nama}</td>
                          <td className="px-4 py-2 text-slate-600 uppercase">{item.prasekolah}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'BERJAYA' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: PANGKALAN DATA CALON ================= */}
        {activeTab === 'list' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            
            {/* Bar Carian & Tambah Rekod */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-2 flex-grow max-w-lg">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari mengikut nama, MyKid atau tadika..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="BERJAYA">Berjaya</option>
                  <option value="TIDAK BERJAYA">Tidak Berjaya</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={isLoadingList}
                  className="p-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 transition"
                  title="Muat semula senarai"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin text-emerald-600' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Calon Baharu</span>
                </button>
              </div>
            </div>

            {/* Jadual Calon */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Bil</th>
                    <th className="px-4 py-3">No. MyKid</th>
                    <th className="px-4 py-3">Nama Penuh Calon</th>
                    <th className="px-4 py-3">Tadika / Prasekolah</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingList ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Memuatkan rekod pangkalan data...</span>
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <p className="font-semibold text-slate-600">Tiada rekod dijumpai</p>
                        <p className="text-xs text-slate-400 mt-1">Sila gunakan tab "Kemasukan Data Pukal" untuk memasukkan calon atau tekan butang "Tambah Calon Baharu".</p>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((calon, idx) => (
                      <tr key={calon.cleanMykid} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{formatMyKid(calon.cleanMykid)}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 uppercase">{calon.nama}</td>
                        <td className="px-4 py-3 text-slate-600 uppercase">{calon.prasekolah || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            calon.status === 'BERJAYA' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {calon.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(calon)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Edit Rekod"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCalon(calon.cleanMykid, calon.nama)}
                              className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                              title="Padam Rekod"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>Menunjukkan {filteredList.length} daripada {calonList.length} calon</span>
            </div>

          </div>
        )}

      </main>

      {/* ================= MODAL TAMBAH / EDIT CALON ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">
                {modalMode === 'add' ? 'Tambah Calon Baharu' : 'Kemas Kini Maklumat Calon'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nombor MyKid (12 Digit) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={14}
                  disabled={modalMode === 'edit'}
                  value={editForm.cleanMykid}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '');
                    setEditForm({ ...editForm, cleanMykid: raw });
                  }}
                  placeholder="Contoh: 200101141234"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono disabled:bg-slate-100 disabled:text-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Penuh Calon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  placeholder="Contoh: AHMAD DANIAL BIN MOHD HAFIZ"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tadika / Prasekolah Asal
                </label>
                <input
                  type="text"
                  value={editForm.prasekolah}
                  onChange={(e) => setEditForm({ ...editForm, prasekolah: e.target.value })}
                  placeholder="Contoh: TADIKA ISLAM PASTI AL-FALAH"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status Keputusan Kemasukan <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="BERJAYA">BERJAYA (Ditauliahkan)</option>
                  <option value="TIDAK BERJAYA">TIDAK BERJAYA (Tidak Ditawarkan)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSingle}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  {isSavingSingle ? 'Menyimpan...' : 'Simpan Rekod'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

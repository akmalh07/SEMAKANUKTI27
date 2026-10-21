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
  RefreshCw, 
  FileSpreadsheet,
  AlertTriangle,
  X,
  Eye,
  LogOut,
  Clock,
  ArrowUpDown,
  CheckSquare,
  Square,
  ShieldAlert
} from 'lucide-react';
import { 
  CalonData, 
  parseBulkText, 
  saveBulkCalon, 
  getAllCalon, 
  saveCalon, 
  deleteCalon, 
  deleteAllCalon,
  deleteBulkCalon,
  updateCalonStatus,
  formatMyKid,
  exportCalonToCsv
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
  const [activeTab, setActiveTab] = useState<'list' | 'bulk'>('list');
  const [calonList, setCalonList] = useState<CalonData[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  
  // Bulk state
  const [bulkText, setBulkText] = useState('');
  const [parsedValid, setParsedValid] = useState<CalonData[]>([]);
  const [parsedErrors, setParsedErrors] = useState<{ line: number; text: string; reason: string }[]>([]);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // Bulk Selection state (Pilihan Pukal)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [isUpdatingBulkStatus, setIsUpdatingBulkStatus] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BERJAYA' | 'TIDAK BERJAYA'>('ALL');
  const [jawapanFilter, setJawapanFilter] = useState<'ALL' | 'TERIMA' | 'TOLAK' | 'BELUM'>('ALL');

  // Edit / Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [originalCleanMykid, setOriginalCleanMykid] = useState<string>('');
  const [editForm, setEditForm] = useState<CalonData>({
    cleanMykid: '',
    mykid: '',
    nama: '',
    prasekolah: '',
    status: 'BERJAYA',
    jawapanTawaran: undefined,
    tarikhJawapan: undefined,
    sebabTolak: '',
    catatan: ''
  });
  const [isSavingSingle, setIsSavingSingle] = useState(false);

  // Link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);

  // Status updating indicator
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Muat senarai awal
  const loadData = async () => {
    setIsLoadingList(true);
    try {
      const data = await getAllCalon();
      setCalonList(data);
      setSelectedIds([]); // Kosongkan pilihan jika data disegarkan semula
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

  // Tukar status terus dari jadual (1-Click toggle)
  const handleToggleStatus = async (calon: CalonData) => {
    const nextStatus = calon.status === 'BERJAYA' ? 'TIDAK BERJAYA' : 'BERJAYA';
    const confirmMsg = `Tukar status ${calon.nama} (${formatMyKid(calon.cleanMykid)}) kepada "${nextStatus}"?`;
    
    if (!window.confirm(confirmMsg)) return;

    setUpdatingId(calon.cleanMykid);

    // Optimistic update
    setCalonList(prev => prev.map(c => c.cleanMykid === calon.cleanMykid ? { ...c, status: nextStatus } : c));

    try {
      await updateCalonStatus(calon.cleanMykid, nextStatus);
    } catch (err: any) {
      alert(`Gagal mengemas kini status: ${err.message || err}`);
      await loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  // Tambah calon manual
  const openAddModal = () => {
    setModalMode('add');
    setOriginalCleanMykid('');
    setEditForm({
      cleanMykid: '',
      mykid: '',
      nama: '',
      prasekolah: '',
      status: 'BERJAYA',
      jawapanTawaran: undefined,
      tarikhJawapan: undefined,
      sebabTolak: '',
      catatan: ''
    });
    setIsModalOpen(true);
  };

  // Edit calon (Membenarkan edit Nama, No. MyKid, Tadika, Status, Maklum Balas, dll.)
  const openEditModal = (calon: CalonData) => {
    setModalMode('edit');
    setOriginalCleanMykid(calon.cleanMykid);
    setEditForm({ ...calon });
    setIsModalOpen(true);
  };

  // Simpan calon tunggal (dengan sokongan ubah No MyKid dan hapus MyKid lama)
  const handleSaveSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = editForm.cleanMykid.replace(/[^0-9]/g, '');
    if (clean.length !== 12) {
      alert('Sila pastikan 12 digit nombor MyKid dimasukkan dengan tepat (tanpa huruf/simbol).');
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
      }, originalCleanMykid);

      setIsModalOpen(false);
      await loadData();
    } catch (error: any) {
      alert(`Ralat menyimpan rekod: ${error.message || error}`);
    } finally {
      setIsSavingSingle(false);
    }
  };

  // Padam calon tunggal
  const handleDeleteCalon = async (cleanMykid: string, nama: string) => {
    if (confirm(`Adakah anda pasti ingin memadamkan rekod calon ${nama} (${formatMyKid(cleanMykid)})?`)) {
      try {
        await deleteCalon(cleanMykid);
        setCalonList(prev => prev.filter(c => c.cleanMykid !== cleanMykid));
        setSelectedIds(prev => prev.filter(id => id !== cleanMykid));
      } catch (error: any) {
        alert(`Gagal memadam: ${error.message || error}`);
      }
    }
  };

  // Tapis senarai calon
  const filteredList = calonList.filter((c) => {
    const queryDigits = searchQuery.replace(/[^0-9]/g, '');
    const matchQuery = 
      c.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (queryDigits && c.cleanMykid.includes(queryDigits)) ||
      (c.prasekolah && c.prasekolah.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.sebabTolak && c.sebabTolak.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = 
      statusFilter === 'ALL' ? true : c.status === statusFilter;

    let matchJawapan = true;
    if (jawapanFilter === 'TERIMA') {
      matchJawapan = c.jawapanTawaran === 'TERIMA';
    } else if (jawapanFilter === 'TOLAK') {
      matchJawapan = c.jawapanTawaran === 'TOLAK';
    } else if (jawapanFilter === 'BELUM') {
      matchJawapan = c.status === 'BERJAYA' && !c.jawapanTawaran;
    }

    return matchQuery && matchStatus && matchJawapan;
  });

  // ================= PENGURUSAN PILIHAN PUKAL (BULK SELECTION & DELETE) =================
  const handleToggleSelect = (cleanMykid: string) => {
    setSelectedIds(prev => 
      prev.includes(cleanMykid) ? prev.filter(id => id !== cleanMykid) : [...prev, cleanMykid]
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = filteredList.map(c => c.cleanMykid);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      // Nyahpilih yang dipaparkan
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Pilih semua yang dipaparkan
      const newSelected = new Set([...selectedIds, ...visibleIds]);
      setSelectedIds(Array.from(newSelected));
    }
  };

  // Padam Calon Terpilih Secara Pukal
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;

    const count = selectedIds.length;
    const confirmed = window.confirm(
      `AMARAN: Anda akan MEMADAMKAN ${count} orang calon yang telah dipilih secara pukal dari pangkalan data Firestore.\n\nTindakan ini tidak boleh diundur. Adakah anda pasti?`
    );

    if (!confirmed) return;

    setIsDeletingBulk(true);
    try {
      const deletedCount = await deleteBulkCalon(selectedIds);
      alert(`Berjaya memadamkan ${deletedCount} rekod calon secara pukal.`);
      setCalonList(prev => prev.filter(c => !selectedIds.includes(c.cleanMykid)));
      setSelectedIds([]);
    } catch (err: any) {
      alert(`Ralat memadam data secara pukal: ${err.message || err}`);
      await loadData();
    } finally {
      setIsDeletingBulk(false);
    }
  };

  // Tukar Status Pukal bagi calon dipilih
  const handleBulkStatusChange = async (targetStatus: 'BERJAYA' | 'TIDAK BERJAYA') => {
    if (!selectedIds.length) return;
    const count = selectedIds.length;

    const confirmed = window.confirm(
      `Adakah anda ingin menukar status ${count} orang calon yang dipilih kepada "${targetStatus}"?`
    );
    if (!confirmed) return;

    setIsUpdatingBulkStatus(true);
    try {
      // Kemas kini secara batch
      const updatedList = calonList.map(c => 
        selectedIds.includes(c.cleanMykid) ? { ...c, status: targetStatus } : c
      );
      setCalonList(updatedList);

      // Simpan batch ke Firestore
      const targetCalon = updatedList.filter(c => selectedIds.includes(c.cleanMykid));
      await saveBulkCalon(targetCalon);

      alert(`Berjaya mengemas kini ${count} calon kepada status "${targetStatus}".`);
      setSelectedIds([]);
    } catch (err: any) {
      alert(`Ralat kemas kini pukal: ${err.message || err}`);
      await loadData();
    } finally {
      setIsUpdatingBulkStatus(false);
    }
  };

  // Kosongkan pangkalan data dengan pengesahan keselamatan
  const handleResetDatabase = async () => {
    const confirmation = window.prompt('AMARAN KESELAMATAN: Anda akan memadam SEMUA rekod calon dalam pangkalan data!\n\nUntuk mengesahkan, sila taip "PADAM SEMUA" di bawah:');
    if (confirmation !== 'PADAM SEMUA') {
      alert('Operasi dibatalkan.');
      return;
    }

    setIsLoadingList(true);
    try {
      const deleted = await deleteAllCalon();
      alert(`Berjaya memadam ${deleted} rekod dari pangkalan data. Anda kini boleh memuat naik data yang bersih.`);
      await loadData();
    } catch (err: any) {
      alert(`Ralat memadam data: ${err.message || err}`);
    } finally {
      setIsLoadingList(false);
    }
  };

  // Eksport ke CSV
  const handleExportCsv = () => {
    if (!calonList.length) {
      alert('Tiada data calon untuk dieksport.');
      return;
    }
    const csvContent = '\uFEFF' + exportCalonToCsv(calonList); // UTF-8 BOM untuk Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Senarai_Calon_Tahun1_2027_SRA_DMMHD_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Cetak Senarai Calon Berjaya (Format PDF Cantik Rasmi menggunakan window.print)
  const handlePrintBerjayaPdf = () => {
    const berjayaList = calonList.filter(c => c.status === 'BERJAYA');
    if (!berjayaList.length) {
      alert('Tiada senarai calon yang berstatus BERJAYA untuk dicetak.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Sila benarkan pop-up pada pelayar web anda untuk mencetak.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ms">
      <head>
        <meta charset="UTF-8">
        <title>Senarai Rasmi Calon Berjaya Tahun 1 2027 - SRA Datuk Haji Mohamad Mortadza Haji Daud</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 20px; font-size: 12pt; }
          .header { text-align: center; border-bottom: 3px double #065f46; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { width: 60px; height: 60px; object-fit: contain; margin-bottom: 8px; }
          h1 { font-size: 16pt; font-weight: 800; color: #065f46; margin: 0 0 5px 0; text-transform: uppercase; }
          h2 { font-size: 12pt; font-weight: 700; color: #1e293b; margin: 0 0 5px 0; }
          p { font-size: 10pt; color: #64748b; margin: 0; }
          .meta-info { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 15px; font-weight: 600; color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 10pt; }
          th { background-color: #065f46; color: #ffffff; font-weight: 700; text-transform: uppercase; font-size: 9pt; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .text-center { text-align: center; }
          .badge-terima { color: #065f46; font-weight: 700; }
          .badge-tolak { color: #dc2626; font-weight: 700; }
          .badge-belum { color: #d97706; font-weight: 600; }
          .footer { margin-top: 30px; text-align: center; font-size: 9pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://i.postimg.cc/rmLpBk5P/Untitled-design-(10).png" alt="Logo Sekolah" class="logo">
          <h1>SEKOLAH RENDAH AGAMA DATUK HAJI MOHAMAD MORTADZA HAJI DAUD</h1>
          <h2>SENARAI RASMI CALON BERJAYA KEMASUKAN TAHUN 1 (SESI 2027)</h2>
          <p>Tarikh Cetakan: ${new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div class="meta-info">
          <span>Jumlah Keseluruhan Calon Berjaya: <strong>${berjayaList.length} Orang</strong></span>
          <span>Status: Dokumen Rasmi Pentadbiran Sekolah</span>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px;" class="text-center">Bil</th>
              <th style="width: 140px;">No. MyKid</th>
              <th>Nama Penuh Calon</th>
              <th>Tadika / Prasekolah Asal</th>
              <th style="width: 130px;" class="text-center">Pengesahan Tawaran</th>
            </tr>
          </thead>
          <tbody>
            ${berjayaList.map((c, idx) => {
              let statusRespon = '<span class="badge-belum">Belum Respon</span>';
              if (c.jawapanTawaran === 'TERIMA') {
                statusRespon = '<span class="badge-terima">Menerima Tawaran</span>';
              } else if (c.jawapanTawaran === 'TOLAK') {
                statusRespon = '<span class="badge-tolak">Menolak Tawaran</span>';
              }

              return `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td style="font-family: monospace; font-weight: bold;">${c.mykid || formatMyKid(c.cleanMykid)}</td>
                  <td style="font-weight: bold; text-transform: uppercase;">${c.nama}</td>
                  <td style="text-transform: uppercase;">${c.prasekolah || '-'}</td>
                  <td class="text-center">${statusRespon}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Dokumen ini penjanaan komputer daripada Portal Rasmi Semakan &amp; Pengambilan SRA Datuk Haji Mohamad Mortadza Haji Daud. Tandatangan tidak diperlukan.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Statistik Utama
  const totalBerjaya = calonList.filter(c => c.status === 'BERJAYA').length;
  const totalTidakBerjaya = calonList.filter(c => c.status === 'TIDAK BERJAYA').length;
  const totalTerima = calonList.filter(c => c.jawapanTawaran === 'TERIMA').length;
  const totalTolak = calonList.filter(c => c.jawapanTawaran === 'TOLAK').length;
  const totalBelumPilih = calonList.filter(c => c.status === 'BERJAYA' && !c.jawapanTawaran).length;

  const visibleIds = filteredList.map(c => c.cleanMykid);
  const isAllVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const isSomeVisibleSelected = visibleIds.some(id => selectedIds.includes(id)) && !isAllVisibleSelected;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans antialiased">
      
      {/* ================= HEADER PENTADBIR ================= */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyParentLink}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
              title="Salin pautan untuk diberikan kepada ibu bapa"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedLink ? 'Pautan Disalin!' : 'Salin Pautan Semakan'}</span>
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
      <main className="max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 flex-grow space-y-6">
        
        {/* ================= KAD STATISTIK UTAMA (6 KAD LENGKAP) ================= */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-600" />
              Ringkasan Status Calon &amp; Pengesahan Tawaran Sesi 2027
            </h2>
            <span className="text-xs text-slate-500">
              Sasaran Kuota Calon Berjaya: <strong className="text-emerald-700 font-mono">180 Orang</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* 1. Jumlah Calon */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Jumlah Calon
              </span>
              <p className="text-2xl font-black text-slate-900 mt-0.5 font-mono">
                {calonList.length}
              </p>
              <span className="text-[10px] text-slate-400">Semua Rekod</span>
            </div>

            {/* 2. Calon Berjaya */}
            <div className={`p-3.5 rounded-xl border shadow-2xs ${
              totalBerjaya === 180 ? 'bg-emerald-50/80 border-emerald-300' : 'bg-white border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  Calon Berjaya
                </span>
                {totalBerjaya > 180 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded border border-amber-300">
                    +{totalBerjaya - 180} Lebih
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-0.5 font-mono">
                {totalBerjaya}
              </p>
              <span className="text-[10px] text-emerald-600">Sasaran: 180 Tempat</span>
            </div>

            {/* 3. Tidak Berjaya */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Tidak Berjaya
              </span>
              <p className="text-2xl font-black text-slate-700 mt-0.5 font-mono">
                {totalTidakBerjaya}
              </p>
              <span className="text-[10px] text-slate-400">Tiada Tawaran</span>
            </div>

            {/* 4. Menerima Tawaran */}
            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-300 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider block">
                Menerima Tawaran
              </span>
              <p className="text-2xl font-black text-emerald-800 mt-0.5 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                {totalTerima}
              </p>
              <span className="text-[10px] text-emerald-700 font-medium">Bersetuju Mendaftar</span>
            </div>

            {/* 5. Menolak Tawaran */}
            <div className="bg-red-50 p-3.5 rounded-xl border border-red-300 shadow-2xs">
              <span className="text-[11px] font-semibold text-red-900 uppercase tracking-wider block">
                Menolak Tawaran
              </span>
              <p className="text-2xl font-black text-red-800 mt-0.5 font-mono flex items-center gap-1.5">
                <XCircle className="w-5 h-5 text-red-600" />
                {totalTolak}
              </p>
              <span className="text-[10px] text-red-700 font-medium">Lepas Kuota</span>
            </div>

            {/* 6. Belum Buat Pilihan */}
            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 shadow-2xs">
              <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">
                Belum Respon
              </span>
              <p className="text-2xl font-black text-amber-800 mt-0.5 font-mono flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-amber-600" />
                {totalBelumPilih}
              </p>
              <span className="text-[10px] text-amber-700 font-medium">Daripada Calon Berjaya</span>
            </div>

          </div>
        </div>

        {/* Notis Kejayaan Pukal */}
        {bulkSuccessMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-emerald-900 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{bulkSuccessMsg}</span>
            </div>
            <button 
              onClick={() => setBulkSuccessMsg('')}
              className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigasi Mod */}
        <div className="flex items-center justify-between border-b border-slate-300 bg-white rounded-t-xl px-4 pt-3">
          <div className="flex">
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
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={handlePrintBerjayaPdf}
              className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              title="Cetak senarai rasmi calon berjaya dalam format PDF cetakan rasmi"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Cetak Senarai Berjaya (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition border border-slate-300 cursor-pointer"
              title="Muat turun senarai calon bersama status pengesahan ke fail CSV / Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">Eksport CSV / Excel</span>
            </button>
          </div>
        </div>

        {/* ================= TAB 1: PANGKALAN DATA CALON (DEFAULT) ================= */}
        {activeTab === 'list' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            
            {/* Bar Carian, Penapis & Tindakan */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              
              {/* Carian & Penapis */}
              <div className="flex flex-wrap items-center gap-2 flex-grow">
                <div className="relative flex-grow min-w-[220px]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, No. MyKid, tadika atau sebab tolak..."
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Keputusan Ujian */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="ALL">Semua Keputusan ({calonList.length})</option>
                  <option value="BERJAYA">Hanya BERJAYA ({totalBerjaya})</option>
                  <option value="TIDAK BERJAYA">Hanya TIDAK BERJAYA ({totalTidakBerjaya})</option>
                </select>

                {/* Filter Pengesahan Ibu Bapa */}
                <select
                  value={jawapanFilter}
                  onChange={(e) => setJawapanFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="ALL">Semua Pengesahan</option>
                  <option value="TERIMA">Menerima Tawaran ({totalTerima})</option>
                  <option value="TOLAK">Menolak Tawaran ({totalTolak})</option>
                  <option value="BELUM">Belum Respon ({totalBelumPilih})</option>
                </select>
              </div>

              {/* Butang Tambah & Muat Semula */}
              <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
                <button
                  type="button"
                  onClick={loadData}
                  disabled={isLoadingList}
                  className="p-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
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
                  <span>Tambah Calon</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetDatabase}
                  className="p-2 text-red-600 hover:text-red-800 border border-red-200 rounded-xl hover:bg-red-50 transition cursor-pointer"
                  title="Kosongkan semua rekod data (Reset Bersih)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* ================= BAR TINDAKAN PUKAL (BULK ACTIONS BAR) ================= */}
            {selectedIds.length > 0 && (
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-lg">
                    {selectedIds.length} Calon Dipilih
                  </span>
                  <span className="text-xs text-slate-300 hidden sm:inline">
                    Pilih tindakan pukal di sebelah:
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Butang Padam Pukal */}
                  <button
                    type="button"
                    onClick={handleBulkDelete}
                    disabled={isDeletingBulk}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Padam semua calon yang dipilih"
                  >
                    {isDeletingBulk ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>Padam {selectedIds.length} Calon</span>
                  </button>

                  {/* Butang Tukar Status Pukal ke BERJAYA */}
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('BERJAYA')}
                    disabled={isUpdatingBulkStatus}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Set BERJAYA</span>
                  </button>

                  {/* Butang Tukar Status Pukal ke TIDAK BERJAYA */}
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('TIDAK BERJAYA')}
                    disabled={isUpdatingBulkStatus}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs rounded-lg flex items-center gap-1 transition cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Set TIDAK BERJAYA</span>
                  </button>

                  {/* Batal Pilihan */}
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Batal Pilihan
                  </button>
                </div>
              </div>
            )}

            {/* Jadual Calon Utama */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    {/* Checkbox Pilih Semua */}
                    <th className="px-3.5 py-3 w-10 text-center">
                      <input 
                        type="checkbox"
                        checked={isAllVisibleSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = isSomeVisibleSelected;
                        }}
                        onChange={handleSelectAllVisible}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Pilih / Nyahpilih Semua Calon Yang Dipaparkan"
                      />
                    </th>
                    <th className="px-2 py-3 w-10">Bil</th>
                    <th className="px-3.5 py-3">No. MyKid</th>
                    <th className="px-3.5 py-3">Nama Penuh Calon</th>
                    <th className="px-3.5 py-3">Tadika / Prasekolah</th>
                    <th className="px-3.5 py-3">Status Keputusan (Klik Untuk Tukar)</th>
                    <th className="px-3.5 py-3">Pengesahan Tawaran Ibu Bapa</th>
                    <th className="px-3.5 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingList ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-400">
                        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <span>Memuatkan rekod pangkalan data...</span>
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <p className="font-semibold text-slate-600">Tiada rekod calon yang sepadan dengan carian.</p>
                        <p className="text-xs text-slate-400 mt-1">Sila gunakan tab "Kemasukan Data Pukal" untuk memasukkan data calon baharu.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((calon, idx) => {
                      const isUpdating = updatingId === calon.cleanMykid;
                      const isSelected = selectedIds.includes(calon.cleanMykid);

                      return (
                        <tr 
                          key={calon.cleanMykid} 
                          className={`transition ${isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50/80'}`}
                        >
                          {/* Checkbox Baris */}
                          <td className="px-3.5 py-2.5 text-center">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(calon.cleanMykid)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              title={`Pilih ${calon.nama}`}
                            />
                          </td>

                          <td className="px-2 py-2.5 font-mono text-slate-400">{idx + 1}</td>
                          
                          <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatMyKid(calon.cleanMykid)}
                          </td>
                          
                          <td className="px-3.5 py-2.5 font-bold text-slate-900 uppercase">
                            {calon.nama}
                          </td>
                          
                          <td className="px-3.5 py-2.5 text-slate-600 uppercase">
                            {calon.prasekolah || '-'}
                          </td>
                          
                          {/* 1-Click Interactive Status Switcher */}
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(calon)}
                              disabled={isUpdating}
                              title="Klik untuk menukar status calon ini antara BERJAYA dan TIDAK BERJAYA"
                              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                                calon.status === 'BERJAYA' 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200' 
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {isUpdating ? (
                                <div className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin" />
                              ) : calon.status === 'BERJAYA' ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              )}
                              <span>{calon.status}</span>
                              <ArrowUpDown className="w-3 h-3 opacity-50 shrink-0" />
                            </button>
                          </td>

                          {/* Pengesahan Tawaran Ibu Bapa */}
                          <td className="px-3.5 py-2.5">
                            {calon.status === 'TIDAK BERJAYA' ? (
                              <span className="text-slate-400 font-mono text-[11px]">-</span>
                            ) : calon.jawapanTawaran === 'TERIMA' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-2xs">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  MENERIMA TAWARAN
                                </span>
                                {calon.tarikhJawapan && (
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    {new Date(calon.tarikhJawapan).toLocaleString('ms-MY', {
                                      dateStyle: 'short',
                                      timeStyle: 'short'
                                    })}
                                  </p>
                                )}
                              </div>
                            ) : calon.jawapanTawaran === 'TOLAK' ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white shadow-2xs">
                                  <X className="w-3 h-3 stroke-[2.5]" />
                                  MENOLAK TAWARAN
                                </span>
                                {calon.sebabTolak && (
                                  <p className="text-[10px] text-red-700 italic max-w-xs truncate" title={calon.sebabTolak}>
                                    "{calon.sebabTolak}"
                                  </p>
                                )}
                                {calon.tarikhJawapan && (
                                  <p className="text-[10px] text-slate-500 font-mono">
                                    {new Date(calon.tarikhJawapan).toLocaleString('ms-MY', {
                                      dateStyle: 'short',
                                      timeStyle: 'short'
                                    })}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Belum Respon
                              </span>
                            )}
                          </td>

                          {/* Tindakan */}
                          <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(calon)}
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="Edit Nama, No MyKid & Segala Butiran"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCalon(calon.cleanMykid, calon.nama)}
                                className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="Padam Rekod"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 gap-2">
              <span>Menunjukkan <strong>{filteredList.length}</strong> daripada <strong>{calonList.length}</strong> calon berdaftar.</span>
              <span>Petunjuk: Gunakan kotak semak (checkbox) di sebelah kiri nama untuk <strong>memadam banyak calon secara pukal</strong>.</span>
            </div>

          </div>
        )}

        {/* ================= TAB 2: KEMASUKAN PUKAL ================= */}
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
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Analisis Teks</span>
                </button>
              </div>

            </div>

            {/* Hasil Pratonton Pukal */}
            {(parsedValid.length > 0 || parsedErrors.length > 0) && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Hasil Analisis Teks Pukal
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ditemui: <strong className="text-emerald-700">{parsedValid.length} rekod sah</strong> ({parsedValid.filter(p => p.status === 'BERJAYA').length} Berjaya / {parsedValid.filter(p => p.status === 'TIDAK BERJAYA').length} Tidak Berjaya), <strong className="text-red-600">{parsedErrors.length} baris ralat</strong>.
                    </p>
                  </div>

                  {parsedValid.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSaveBulk}
                      disabled={isSavingBulk}
                      className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSavingBulk ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Menyimpan ke Firestore...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Sahkan &amp; Simpan {parsedValid.length} Rekod Ke Pangkalan Data</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Senarai Ralat Jika Ada */}
                {parsedErrors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-red-800 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Terdapat {parsedErrors.length} baris yang tidak dapat diproses:
                    </p>
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

      </main>

      {/* ================= MODAL TAMBAH / EDIT CALON (SEMUA BUTIRAN BOLEH DIEDIT) ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">
                {modalMode === 'add' ? 'Tambah Calon Baharu' : `Kemas Kini Calon: ${editForm.nama || 'Calon'}`}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSingle} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              
              {/* No MyKid (Boleh diedit sepenuhnya!) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Nombor MyKid (12 Digit) <span className="text-red-500">*</span>
                  </label>
                  {modalMode === 'edit' && (
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Boleh Diedit
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={14}
                  value={editForm.cleanMykid}
                  onChange={(e) => setEditForm({ ...editForm, cleanMykid: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="Contoh: 200101141234"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
                {modalMode === 'edit' && originalCleanMykid !== editForm.cleanMykid && (
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    No. MyKid asal ({formatMyKid(originalCleanMykid)}) akan dipadam dan digantikan dengan no. MyKid baharu ini secara automatik.
                  </p>
                )}
              </div>

              {/* Nama Penuh Calon */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Penuh Calon <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  placeholder="Nama calon"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              {/* Tadika / Prasekolah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Prasekolah / Tadika
                </label>
                <input
                  type="text"
                  value={editForm.prasekolah}
                  onChange={(e) => setEditForm({ ...editForm, prasekolah: e.target.value })}
                  placeholder="Contoh: TADIKA ABIM SAYYIDINA ALI"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Status Keputusan Ujian */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Status Keputusan Ujian <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="BERJAYA">BERJAYA (DITAWARKAN KEMASUKAN)</option>
                  <option value="TIDAK BERJAYA">TIDAK BERJAYA (TIDAK DITAWARKAN)</option>
                </select>
              </div>

              {/* Status Pengesahan Tawaran Ibu Bapa (jika edit) */}
              {editForm.status === 'BERJAYA' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Pengesahan Tawaran Ibu Bapa
                    </label>
                    <span className="text-[10px] text-slate-400">Direkodkan oleh ibu bapa/pentadbir</span>
                  </div>

                  <select
                    value={editForm.jawapanTawaran || ''}
                    onChange={(e) => {
                      const val = e.target.value || undefined;
                      setEditForm({ 
                        ...editForm, 
                        jawapanTawaran: val as any,
                        tarikhJawapan: val ? (editForm.tarikhJawapan || new Date().toISOString()) : undefined
                      });
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                  >
                    <option value="">Belum Membuat Pilihan (Menunggu Respon)</option>
                    <option value="TERIMA">Menerima Tawaran</option>
                    <option value="TOLAK">Menolak Tawaran</option>
                  </select>

                  {editForm.jawapanTawaran && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Tarikh &amp; Masa Pengesahan
                      </label>
                      <input
                        type="text"
                        value={editForm.tarikhJawapan ? new Date(editForm.tarikhJawapan).toLocaleString('ms-MY') : ''}
                        disabled
                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                      />
                    </div>
                  )}

                  {editForm.jawapanTawaran === 'TOLAK' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Sebab Penolakan Tawaran
                      </label>
                      <input
                        type="text"
                        value={editForm.sebabTolak || ''}
                        onChange={(e) => setEditForm({ ...editForm, sebabTolak: e.target.value })}
                        placeholder="Contoh: Berpindah sekolah / hal keluarga"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Catatan Tambahan Pentadbir */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Catatan Pentadbir (Pilihan)
                </label>
                <input
                  type="text"
                  value={editForm.catatan || ''}
                  onChange={(e) => setEditForm({ ...editForm, catatan: e.target.value })}
                  placeholder="Catatan tambahan seperti no fail rayuan, resit, dsb."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Butang Tindakan */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingSingle}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  {isSavingSingle ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

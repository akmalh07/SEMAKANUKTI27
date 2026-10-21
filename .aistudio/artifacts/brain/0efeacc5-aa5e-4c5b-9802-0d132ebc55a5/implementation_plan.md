# Sistem Pengurusan Data Calon Pukal & Portal Semakan Ibu Bapa (Sesi 2027)

Sistem dwi-modul yang memisahkan **Portal Semakan Awam Ibu Bapa** (bersih, rasmi, tanpa sebarang petunjuk kata laluan atau kawalan pentadbir) dan **Portal Pengurusan Pentadbir** (memuat naik data pukal Excel/CSV, mengedit, menambah, memadam calon) dengan storan awan berterusan **Firebase Firestore**.

---

## Keputusan Pengguna & Pengesahan

> [!IMPORTANT]
> **Keputusan Utama yang Telah Disahkan:**
> 1. **Kemasukan Data Pukal**: Pentadbir boleh menyalin dan menampal (copy-paste) terus lajur jadual dari Microsoft Excel / Google Sheets atau memuat naik fail `.csv`.
> 2. **Pemisahan URL / Paparan Ibu Bapa**: Apabila ibu bapa melayari URL utama (`/` atau pautan perkongsian semakan), tiada sebarang paparan kata laluan, butang log masuk, atau panel admin yang kelihatan. Paparan ibu bapa adalah 100% khusus untuk semakan MyKid dan cetakan surat tawaran.
> 3. **Akses Pentadbir**: Pentadbir mengakses papan kawalan melalui laluan khas (cth: pautan rahsia `?admin=portal` atau parameter pentadbir berasingan dengan sesi pentadbiran).
> 4. **Penyimpanan Berterusan (Cloud Persistence)**: Menggunakan pangkalan data awan **Firebase Firestore** supaya semua data calon yang diuruskan oleh pentadbir disimpan secara langsung dan boleh disemak oleh ibu bapa di mana-mana peranti pada bila-bila masa.

---

## 1. Gambaran Keseluruhan & Konsep Teras

* **Fungsi Utama**:
  * **Portal Awam Ibu Bapa**: Antara muka carian pantas nombor MyKid 12-digit, pengesahan status segera (**BERJAYA**, **TIDAK BERJAYA**, **TIADA DATA**), paparan maklumat calon lengkap, dan surat tawaran rasmi sedia cetak A4.
  * **Papan Pemuka Pentadbir (Admin Hub)**: Pengimportan pukal (Bulk Import) pintar dengan pratonton sebelum simpan, pengesanan ralat MyKid/status automatik, jadual data interaktif dengan fungsi carian, tapis, sunting terus (inline edit), tambah calon manual, dan pemadaman rekod.
* **Kumpulan Sasaran**:
  * Ibu bapa/penjaga calon Tahun 1 SRA Datuk Haji Mohamad Mortadza Haji Daud.
  * Guru Penolong Kanan Hal Ehwal Murid (HEM) / Setiausaha Kemasukan Tahun 1.
* **Nilai Utama**: Menghapuskan kesukaran menguruskan ratusan rekod secara manual dan memberikan pengalaman semakan yang lancar, pantas, dan meyakinkan kepada ibu bapa tanpa kekeliruan antara muka teknikal.

---

## 2. Pengalaman Pengguna & Reka Bentuk Visual

* **Aliran Pengguna (User Flows)**:
  1. **Aliran Ibu Bapa (Public URL)**:
     * Ibu bapa membuka URL portal -> Melihat identiti korporat sekolah Islamik yang rasmi -> Memasukkan 12 digit MyKid -> Menekan "Semak Keputusan".
     * Jika Berjaya: Kotak hijau zamrud "TAHNIAH, ANDA BERJAYA!" dengan butiran nama murid, tadika asal, dan butang "Cetak Surat Tawaran".
     * Jika Tidak Berjaya: Kotak sopan dengan nota doa dan maklumat rayuan bertulis 14 hari.
     * Jika Tiada Data: Kotak amaran merah "TIADA DATA" dengan panduan semakan semula.
  2. **Aliran Pentadbir (Admin Management URL)**:
     * Pentadbir membuka pautan pentadbir -> Memilih mod "Muat Naik Pukal" (Salin-tampal teks dari Excel atau muat naik fail CSV).
     * Sistem memaparkan pratonton jadual: mengesahkan bilangan calon berjaya & tidak berjaya.
     * Pentadbir menekan "Simpan ke Firestore": data disimpan secara 'batch write' ke pangkalan data awan.
     * Jadual pangkalan data membolehkan pentadbir membuat carian nama/MyKid, menyunting rekod secara individu, atau memadam calon sekiranya terdapat pembetulan.

* **Identiti Visual & Tema**:
  * **Warna Asas**: Hijau Islamik Rasmi (`#064e3b` / `#047857`), biru nilam lembut (`teal-900`), dan aksen emas/kuning diraja (`#f59e0b` / `#d97706`).
  * **Tipografi**: Gabungan tajuk korporat *Plus Jakarta Sans*, tulisan khat jawi/arab *Amiri* untuk kalimah bismillah, dan *JetBrains Mono* untuk nombor MyKid berformat kemas.
  * **Sifar Elemen Mengelirukan**: Tiada butang atau label teknikal pelik pada paparan ibu bapa; paparan khusus untuk tugas semakan sahaja.

---

## 3. Keputusan Produk & Pertimbangan Teknikal

1. **Pemisahan Paparan Berasaskan URL Routing**:
   * *Pendekatan*: Menggunakan status URL (parameter query `?mode=admin` atau laluan sub-komponen) untuk membezakan paparan ibu bapa dan pentadbir.
   * *Rasional*: Memenuhi kehendak pengguna supaya ibu bapa yang menerima pautan portal utama tidak diganggu oleh dialog log masuk atau elemen pentadbiran, manakala pentadbir mempunyai pautan khas untuk bertugas.
2. **Kemasukan Data Pukal Hibrid (Excel Paste + CSV Upload)**:
   * *Pendekatan*: Menyediakan kotak teks pintar "Tampal dari Excel" yang memisahkan baris (tab-delimited) secara automatik kepada lajur (MyKid, Nama, Prasekolah, Status), di samping butang muat naik fail `.csv`.
   * *Rasional*: Guru atau staf sekolah biasanya mempunyai data dalam spreadsheet Excel; mereka boleh terus menekan `Ctrl+C` di Excel dan `Ctrl+V` ke dalam portal tanpa perlu mengeksport fail terlebih dahulu.
3. **Penyimpanan Firebase Firestore Terus & Real-time**:
   * *Pendekatan*: Koleksi `calon_2027` dengan `documentId` berasaskan MyKid yang telah dibersihkan (cth: `200101141234`).
   * *Rasional*: Carian calon oleh ibu bapa menjadi operasi $O(1)$ dokumen `getDoc(doc(db, 'calon_2027', mykid))` yang sangat pantas dan menjimatkan kuota capaian.

---

## 4. Seni Bina Teknikal & Pelan Data

### Rajah Aliran Sistem

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PORTAL SRA TAHUN 1 2027                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────────┐           ┌─────────────────────────────┐
│   PORTAL IBU BAPA (AWAM)    │           │      PENTADBIR SEKOLAH      │
│   URL: / atau ?view=semakan │           │      URL Khas: ?admin=1     │
├─────────────────────────────┤           ├─────────────────────────────┤
│ • Input MyKid Calon (12 No) │           │ • Import Pukal (Copy-Paste) │
│ • Butang "Semak Keputusan"  │           │ • Muat Naik Fail CSV        │
│ • Paparan: BERJAYA / GAGAL  │           │ • Kemas Kini / Edit Calon   │
│ • Modal Cetak Surat Tawaran │           │ • Padam / Tambah Calon      │
└──────────────┬──────────────┘           └──────────────┬──────────────┘
               │                                         │
               │ (Query 1 Rekod)                         │ (Batch Write / Listen)
               ▼                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FIREBASE FIRESTORE DATABASE                        │
│               Koleksi: calon_2027 / Document: [mykid]                  │
│  { mykid, nama, prasekolah, status: "BERJAYA"|"TIDAK BERJAYA", tarikh }│
└────────────────────────────────────────────────────────────────────────┘
```

### Entiti Data (`firebase-blueprint.json` & Firestore):

* **Koleksi**: `calon_2027`
  * `id`: 12-digit nombor MyKid (contoh: `200101141234`)
  * `mykid`: String berformat (contoh: `200101-14-1234`)
  * `nama`: String nama penuh calon (contoh: `AHMAD DANIAL BIN MOHD HAFIZ`)
  * `prasekolah`: String nama tadika/prasekolah asal
  * `status`: Enum (`"BERJAYA"` | `"TIDAK BERJAYA"`)
  * `tarikhDaftar`: Timestamp / String ISO kemasukan rekod
  * `catatan`: String pilihan nota penempatan/kelas

---

## 5. Langkah-Langkah Pelaksanaan Seterusnya

1. **Penyediaan Firebase**: Memulakan `firebase_setup` untuk menyediakan Firestore bagi projek ini.
2. **Definisi Skema & Keselamatan**: Menulis `firebase-blueprint.json` dan `firestore.rules` (membenarkan bacaan dokumen tunggal oleh awam untuk semakan dan penulisan oleh pentadbir).
3. **Membangunkan Antara Muka Pentadbir (Admin Bulk Management)**:
   * Komponen tampal terus dari Excel (Auto parser untuk lajur MyKid, Nama, Prasekolah, Status).
   * Butang muat naik CSV dan pratonton bilangan rekod berjaya/tidak berjaya.
   * Senarai jadual calon dengan carian, penapis status, butang edit dan padam.
4. **Membangunkan Portal Semakan Ibu Bapa (Clean Public View)**:
   * Antara muka semakan tanpa elemen pentadbiran.
   * Pengambilan data terus dari Firestore berdasarkan MyKid.
   * Paparan status **TAHNIAH, ANDA BERJAYA!**, **TIDAK BERJAYA**, dan **TIADA DATA**.
   * Templat Surat Tawaran Rasmi yang boleh dicetak saiz A4.
5. **Verifikasi & Ujian Kompilasi**: Menjalankan `compile_applet` dan semakan kefungsian penuh.

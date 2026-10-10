/* corner-data.js: data Samasta Corner BEM STDIIS (corner, menu, event, aspek penilaian).
   Jangan diedit manual. Gunakan admin-corner.html, lalu unduh file ini dan unggah ke GitHub.
   Terakhir dibuat: 10/10/2026, 15.50.00 */
window.CORNER = {
 "corners": [
  {
   "id": "kesma",
   "nama": "Kesma",
   "lengkap": "Kementerian Kesejahteraan Mahasiswa",
   "aksen": "emerald",
   "ikon": "heart",
   "status": "soon",
   "ringkas": "Layanan dan kesejahteraan mahasiswa",
   "deskripsi": "Ruang digital Kementerian Kesejahteraan Mahasiswa sedang disiapkan.",
   "menu": []
  },
  {
   "id": "irjen",
   "nama": "Irjen",
   "lengkap": "Inspektorat Jenderal",
   "aksen": "gold",
   "ikon": "shield",
   "status": "aktif",
   "ringkas": "Pengawasan, absensi, dan evaluasi kegiatan",
   "deskripsi": "Ruang kerja Inspektorat Jenderal: kelola absensi dan penilaian kegiatan, lihat pembukuan kehadiran, dan baca ringkasan evaluasi setiap acara.",
   "menu": [
    {"id": "event", "tipe": "event", "judul": "Event", "ket": "Daftar kegiatan, kode QR absensi, pembukuan, dan ringkasan tiap acara.", "ikon": "calendar"},
    {"id": "pembukuan", "tipe": "pembukuan", "judul": "Pembukuan", "ket": "Rekap kehadiran seluruh pengurus pada semua kegiatan.", "ikon": "book"},
    {"id": "statistik", "tipe": "statistik", "judul": "Statistik", "ket": "Tren kepuasan dan kehadiran dari kegiatan ke kegiatan.", "ikon": "chart"},
    {"id": "sop", "tipe": "tautan", "judul": "SOP Irjen", "ket": "Buka pusat SOP untuk prosedur pengawasan dan evaluasi.", "ikon": "doc", "url": "#sop"}
   ]
  }
 ],
 "events": [
  {"id": "ev-sosialisasi-sop", "corner": "irjen", "judul": "Rapat Evaluasi, Peresmian, dan Pembahasan Proker serta Sosialisasi SOP", "tanggal": "2026-10-09", "waktu": "19.30 sampai 21.30", "tempat": "RB 03", "ket": "Rapat evaluasi, peresmian, pembahasan program kerja, dan sosialisasi SOP Kabinet Samasta.", "target": [], "buka": true}
 ],
 "aspek": [
  {"id": "puas", "label": "Kepuasan keseluruhan", "tanya": "Seberapa puas kamu dengan acara ini secara keseluruhan?", "utama": true},
  {"id": "materi", "label": "Isi dan materi acara", "tanya": "Seberapa bermanfaat isi dan materi acara?"},
  {"id": "sampai", "label": "Penyampaian acara", "tanya": "Seberapa jelas dan menarik penyampaian pengisi atau pemandu acara?"},
  {"id": "panitia", "label": "Kepanitiaan dan pelayanan", "tanya": "Seberapa baik kerja panitia dan pelayanan kepada peserta?"},
  {"id": "tempat", "label": "Tempat dan fasilitas", "tanya": "Seberapa nyaman tempat dan fasilitas acara?"},
  {"id": "waktu", "label": "Waktu dan durasi", "tanya": "Seberapa tepat pengaturan waktu dan durasi acara?"}
 ],
 "pengaturan": {
  "basisUrl": "",
  "nimAngka": true
 }
};

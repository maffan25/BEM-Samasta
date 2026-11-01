/* corner-data.js: data Samasta Corner BEM STDIIS (corner, menu, event, soal penilaian, pesan penutup, dan PIN).
   Jangan diedit manual. Gunakan admin-corner.html, lalu unduh file ini dan unggah ke GitHub.
   Terakhir dibuat: 10/10/2026, 15.00.00 */
window.CORNER = {
 "soal": [
  {
   "id": "q1",
   "tipe": "bintang",
   "teks": "Kepuasan keseluruhan",
   "wajib": true,
   "utama": true
  },
  {
   "id": "q2",
   "tipe": "bintang",
   "teks": "Materi atau isi acara",
   "wajib": true
  },
  {
   "id": "q3",
   "tipe": "bintang",
   "teks": "Kinerja panitia",
   "wajib": true
  },
  {
   "id": "q4",
   "tipe": "bintang",
   "teks": "Tempat dan fasilitas",
   "wajib": true
  },
  {
   "id": "q5",
   "tipe": "bintang",
   "teks": "Ketepatan waktu",
   "wajib": true
  },
  {
   "id": "q6",
   "tipe": "panjang",
   "teks": "Komentar tentang acara",
   "petunjuk": "Apa kesanmu tentang acara ini?",
   "wajib": false
  },
  {
   "id": "q7",
   "tipe": "panjang",
   "teks": "Kritik dan saran",
   "petunjuk": "Apa yang sebaiknya diperbaiki untuk acara berikutnya?",
   "wajib": false
  }
 ],
 "penutup": {
  "judul": "Terima kasih, {nama}!",
  "pesan": "Kehadiran dan penilaianmu untuk {event} sudah tercatat.\n\nTerima kasih sudah meluangkan waktu. Masukanmu menjadi bahan perbaikan kegiatan berikutnya. Sampai jumpa di acara BEM STDIIS selanjutnya."
 },
 "bukaHari": 2,
 "pin": {
  "salt": "b7e2c91f4a60d38e5c1a",
  "hash": "2c1867aa53ed9a0a38e718f03700448856293ea803a0c8fe367604bfe2bff666",
  "n": 6
 },
 "corner": [
  {
   "id": "kesma",
   "nama": "Kementerian Kesejahteraan Mahasiswa",
   "singkat": "Kesma",
   "tagline": "Kesejahteraan mahasiswa",
   "deskripsi": "Layanan dan program kesejahteraan mahasiswa akan hadir di corner ini.",
   "warna": "emas",
   "ikon": "megafon",
   "status": "segera",
   "unit": "Kementerian Kesejahteraan Mahasiswa (Kesma)",
   "menu": [],
   "event": []
  },
  {
   "id": "irjen",
   "nama": "Inspektorat Jenderal",
   "singkat": "Irjen",
   "tagline": "Pengawasan dan evaluasi kegiatan",
   "deskripsi": "Pusat kerja Inspektorat Jenderal: mencatat kehadiran, menghimpun penilaian peserta, dan merangkum evaluasi setiap kegiatan BEM.",
   "warna": "zamrud",
   "ikon": "perisai",
   "status": "aktif",
   "unit": "Inspektorat Jenderal",
   "menu": [
    {
     "id": "event",
     "judul": "Event",
     "deskripsi": "Absensi dengan barcode, penilaian peserta, dan pembukuan kegiatan.",
     "tipe": "event",
     "ikon": "kalender"
    },
    {
     "id": "tentang",
     "judul": "Tentang Irjen",
     "deskripsi": "Pengertian, tugas, dan struktur Inspektorat Jenderal.",
     "tipe": "profil",
     "ikon": "info",
     "pengertian": "Inspektorat Jenderal (Irjen) adalah sistem penjaminan mutu Kabinet Samasta. Irjen memastikan apa yang berjalan di BEM benar-benar berjalan dengan baik, sesuai arah yang disepakati bersama, dan terus berkembang dari satu periode ke periode berikutnya.\n\nIrjen bukan pengawas yang mencari kesalahan. Ia mengawasi sistem, bukan menghakimi orang.",
     "prinsip": "Mengawasi sistem, bukan menghakimi orang\nIndependen dan bebas konflik kepentingan\nTemuan selalu disertai rekomendasi\nRekomendasi dipantau sampai tuntas",
     "tugas": "# Pengawasan\nMemantau seluruh kementerian dan biro secara independen agar program kerja dan operasional berjalan sesuai visi, misi, dan standar.\n- Memantau pelaksanaan program kerja lewat checkup berkala.\n- Mengawal kesesuaian arah gerak kementerian dengan visi dan misi BEM.\n- Mengawasi kepatuhan terhadap SOP yang berlaku.\n\n# Evaluasi\nMenilai kualitas perencanaan, pelaksanaan, dan dampak program kerja secara objektif.\n- Menilai program kerja dengan standar mutu yang ditetapkan.\n- Menerbitkan Rapor Proker setelah setiap program kerja selesai.\n- Menerbitkan Rapor Kementerian setiap dua bulan sekali.\n\n# Rekomendasi\nMerumuskan perbaikan yang konkret dan memastikannya ditindaklanjuti.\n- Merumuskan rekomendasi yang spesifik dan dapat diterapkan.\n- Memfasilitasi diskusi solusi bersama kementerian terkait.\n- Mengeskalasi ke BPH bila rekomendasi tidak ditindaklanjuti.\n\n# Pelaporan\nMenyediakan kanal pelaporan internal yang aman dan objektif, serta menerbitkan rapor berkala.\n- Whistleblowing yang aman bagi anggota.\n- Rapor berkala sebagai bentuk akuntabilitas organisasi.\n- Dokumentasi temuan agar pengetahuan tidak hilang saat pergantian periode.",
     "peranKepala": "Koordinator tim Irjen secara keseluruhan.\nPengawas langsung atas unit yang ditugaskan kepadanya.\nPenyampai laporan Irjen kepada Presiden dan Wakil Presiden BEM.",
     "peranAnggota": "Penanggung jawab penuh atas pengawasan dan evaluasi unit yang ditugaskan.\nPengisi dokumentasi unit.\nPelapor temuan di rapat internal berkala."
    },
    {
     "id": "dokumen",
     "judul": "SOP dan buku panduan",
     "deskripsi": "Prosedur kerja dan buku panduan yang menjadi acuan pengawasan.",
     "tipe": "dokumen",
     "ikon": "buku",
     "pemilikSop": "Inspektur Jenderal",
     "panduan": "inspektorat-jenderal"
    },
    {
     "id": "rapot",
     "judul": "Rapot anggota",
     "deskripsi": "Penilaian kinerja pengurus tiap periode.",
     "tipe": "link",
     "ikon": "bintang",
     "url": "#rapot"
    }
   ],
   "event": [
    {
     "id": "e-20261009-rapat",
     "judul": "Rapat Evaluasi, Peresmian, dan Pembahasan Proker serta Sosialisasi SOP",
     "tanggal": "2026-10-09",
     "jam": "19.30 sampai 21.30",
     "tempat": "RB 03",
     "deskripsi": "Rapat evaluasi, peresmian, pembahasan program kerja, dan sosialisasi SOP Kabinet Samasta.",
     "target": [
      "*"
     ],
     "absen": "auto"
    }
   ]
  }
 ]
};

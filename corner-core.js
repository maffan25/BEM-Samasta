/* corner-core.js: logika bersama Samasta Corner (dipakai index.html dan absen.html).
   Isi: format tanggal/angka, roster pengurus dari anggota.js, penyimpanan (Google Sheets atau mode lokal),
   serta perhitungan kehadiran dan ringkasan penilaian. */
(function (root) {
  "use strict";
  var CN = root.CN = {};

  /* ---------- Util ---------- */
  var MON = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var MONS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var DAY = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  CN.MON = MON; CN.MONS = MONS;
  CN.esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  CN.dparts = function (s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; };
  CN.dlong = function (s) { var p = CN.dparts(s); return p ? p.d + " " + MON[p.m] + " " + p.y : ""; };
  CN.dshort = function (s) { var p = CN.dparts(s); return p ? p.d + " " + MONS[p.m] : ""; };
  CN.dday = function (s) { var p = CN.dparts(s); return p ? DAY[new Date(p.y, p.m, p.d).getDay()] + ", " + p.d + " " + MON[p.m] + " " + p.y : ""; };
  CN.num = function (v, d) {
    if (v == null || isNaN(v)) return "-"; d = d == null ? 1 : d; var k = Math.pow(10, d);
    return (Math.round(v * k) / k).toFixed(d).replace(".", ",");
  };
  CN.pct = function (a, b) { return b ? Math.round(a / b * 100) : 0; };
  CN.norm = function (s) { return String(s == null ? "" : s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim(); };
  CN.clock = function (iso) {
    var d = new Date(iso); if (isNaN(d)) return "";
    return ("0" + d.getHours()).slice(-2) + "." + ("0" + d.getMinutes()).slice(-2);
  };
  CN.stamp = function (iso) {
    var d = new Date(iso); if (isNaN(d)) return "";
    return d.getDate() + " " + MONS[d.getMonth()] + " " + d.getFullYear() + ", " + CN.clock(iso);
  };
  CN.today = function () { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
  CN.uid = function (p) { return (p || "x") + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); };

  /* ---------- Data situs (corner-data.js) ---------- */
  var RAW = root.CORNER || {};
  var DEFAULT_ASPEK = [
    { id: "puas", label: "Kepuasan keseluruhan", tanya: "Seberapa puas kamu dengan acara ini secara keseluruhan?", utama: true },
    { id: "materi", label: "Isi dan materi acara", tanya: "Seberapa bermanfaat isi dan materi acara?" },
    { id: "panitia", label: "Kepanitiaan dan pelayanan", tanya: "Seberapa baik kerja panitia dan pelayanan kepada peserta?" },
    { id: "tempat", label: "Tempat dan fasilitas", tanya: "Seberapa nyaman tempat dan fasilitas acara?" }
  ];
  function str(v, n) { return String(v == null ? "" : v).trim().slice(0, n || 400); }
  function normCorner(c) {
    return {
      id: str(c.id, 30), nama: str(c.nama, 40), lengkap: str(c.lengkap, 120), aksen: str(c.aksen, 12) || "emerald", ikon: str(c.ikon, 20) || "star",
      status: c.status === "soon" ? "soon" : "aktif", ringkas: str(c.ringkas, 160), deskripsi: str(c.deskripsi, 600),
      menu: (c.menu || []).map(function (m) {
        return { id: str(m.id, 30), tipe: str(m.tipe, 12) || "teks", judul: str(m.judul, 60), ket: str(m.ket, 200), ikon: str(m.ikon, 20), url: str(m.url, 300), isi: str(m.isi, 4000) };
      })
    };
  }
  function normEvent(e) {
    return {
      id: str(e.id, 40), corner: str(e.corner, 30), judul: str(e.judul, 200), tanggal: str(e.tanggal, 10), waktu: str(e.waktu, 60), tempat: str(e.tempat, 100),
      ket: str(e.ket, 600), target: Array.isArray(e.target) ? e.target.map(function (x) { return str(x, 100); }) : [], buka: e.buka !== false
    };
  }
  var aspek = (RAW.aspek && RAW.aspek.length ? RAW.aspek : DEFAULT_ASPEK).map(function (a) {
    return { id: str(a.id, 24), label: str(a.label, 80), tanya: str(a.tanya, 200), utama: !!a.utama };
  });
  CN.cfg = {
    corners: (RAW.corners || []).map(normCorner),
    events: (RAW.events || []).map(normEvent),
    aspek: aspek,
    set: { basisUrl: str((RAW.pengaturan || {}).basisUrl, 200), nimAngka: (RAW.pengaturan || {}).nimAngka !== false }
  };
  CN.corner = function (id) { return CN.cfg.corners.filter(function (c) { return c.id === id; })[0] || null; };
  CN.event = function (id) { return CN.cfg.events.filter(function (e) { return e.id === id; })[0] || null; };
  CN.events = function (cornerId) {
    return CN.cfg.events.filter(function (e) { return e.corner === cornerId; }).sort(function (a, b) { return a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : a.judul.localeCompare(b.judul); });
  };
  CN.utama = function () { return CN.cfg.aspek.filter(function (a) { return a.utama; })[0] || null; };

  /* ---------- Roster pengurus (anggota.js) ---------- */
  CN.PIM = "Pimpinan BEM";
  CN.groups = function () {
    var A = root.ANGGOTA || {}, out = [];
    if ((A.pimpinan || []).length) out.push({ nama: CN.PIM, grup: "Pimpinan", anggota: A.pimpinan.map(function (p) { return { nama: p.nama, peran: p.jabatan }; }) });
    (A.unit || []).forEach(function (u) { out.push({ nama: u.nama, grup: u.grup, anggota: (u.anggota || []).map(function (n, i) { return { nama: n, peran: i === 0 ? u.jabatanKepala : "" }; }) }); });
    return out;
  };
  CN.roster = function () {
    var r = [];
    CN.groups().forEach(function (g) { g.anggota.forEach(function (a) { r.push({ nama: a.nama, bagian: g.nama, grup: g.grup, peran: a.peran || "" }); }); });
    return r;
  };
  CN.eventRoster = function (ev) {
    var t = (ev && ev.target) || [], r = CN.roster();
    return t.length ? r.filter(function (x) { return t.indexOf(x.bagian) >= 0; }) : r;
  };

  /* ---------- Penyimpanan: Google Sheets (Apps Script) atau mode lokal ---------- */
  var EP = typeof root.CORNER_ENDPOINT === "string" ? root.CORNER_ENDPOINT.replace(/[\s"'“”‘’]/g, "") : "";
  var EP_OK = /^https:\/\/script\.google\.com\/macros\/s\/[^\/]+\/exec$/.test(EP);
  CN.mode = !EP ? "lokal" : EP_OK ? "remote" : "salah";
  function err(code, msg) { var e = new Error(msg || code); e.code = code; return e; }
  CN.ERR = {
    kode: "Kode salah. Periksa lagi atau minta kode dari Irjen.",
    tunggu: "Terlalu banyak percobaan salah. Coba lagi beberapa menit lagi.",
    dup: "NIM ini sudah tercatat untuk acara tersebut.",
    data: "Data belum lengkap atau tidak valid (kode S2).",
    nosheet: "Skrip belum terhubung ke Spreadsheet (kode S3). Hubungi pengurus.",
    server: "Skrip gagal memproses permintaan (kode S4). Hubungi pengurus.",
    aksi: "Skrip belum diperbarui ke versi Samasta Corner (kode S5). Pasang ulang apps-script-corner.gs.txt.",
    C2: "Alamat Google Sheets di corner-config.js belum benar, harus berakhiran /exec (kode C2).",
    N1: "Tidak bisa menghubungi server. Periksa koneksi internet lalu coba lagi (kode N1).",
    N2: "Respons bukan dari skrip Google (kode N2). Deployment harus diset 'Siapa saja' dan URL berakhiran /exec.",
    notfound: "Data tidak ditemukan."
  };
  CN.errText = function (e) { return (e && CN.ERR[e.code]) || (e && e.message) || CN.ERR.server; };

  function remote(body) {
    var ctl = root.AbortController ? new AbortController() : null, to = ctl && setTimeout(function () { ctl.abort(); }, 25000);
    return fetch(EP, {
      method: "POST", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), signal: ctl ? ctl.signal : undefined
    }).then(function (r) { return r.text(); }).then(function (t) {
      clearTimeout(to); var j = null; try { j = JSON.parse(t); } catch (x) {}
      if (!j) throw err("N2"); return j;
    }, function () { clearTimeout(to); throw err("N1"); });
  }
  var LKEY = "cn-lokal-v1";
  function lread() { try { var j = JSON.parse(localStorage.getItem(LKEY) || "{}"); return Array.isArray(j.rows) ? j.rows : []; } catch (e) { return []; } }
  function lwrite(rows) { try { localStorage.setItem(LKEY, JSON.stringify({ rows: rows })); return true; } catch (e) { return false; } }

  CN.api = {
    kirim: function (p) {
      if (CN.mode === "salah") return Promise.reject(err("C2"));
      if (CN.mode === "remote") return remote({ aksi: "kirim", corner: p.corner, event: p.event, nama: p.nama, nim: p.nim, bagian: p.bagian, rating: p.rating, komentar: p.komentar, kritik: p.kritik, website: p.website || "" })
        .then(function (j) { if (!j.ok) throw err(j.error || "server"); return j; });
      var rows = lread();
      if (rows.some(function (r) { return r.event === p.event && String(r.nim) === String(p.nim); })) return Promise.reject(err("dup"));
      rows.push({ id: CN.uid("r"), t: new Date().toISOString(), corner: p.corner, event: p.event, nama: p.nama, nim: String(p.nim), bagian: p.bagian, rating: p.rating, komentar: p.komentar || "", kritik: p.kritik || "" });
      lwrite(rows); return Promise.resolve({ ok: true });
    },
    data: function (corner, kode) {
      if (CN.mode === "salah") return Promise.reject(err("C2"));
      if (CN.mode === "remote") return remote({ aksi: "data", corner: corner, kode: kode })
        .then(function (j) { if (!j.ok) throw err(j.error || "server"); return j.rows || []; });
      return Promise.resolve(lread().filter(function (r) { return r.corner === corner; }));
    },
    hapus: function (corner, kode, id) {
      if (CN.mode === "remote") return remote({ aksi: "hapus", corner: corner, kode: kode, id: id }).then(function (j) { if (!j.ok) throw err(j.error || "server"); return j; });
      lwrite(lread().filter(function (r) { return r.id !== id; })); return Promise.resolve({ ok: true });
    },
    /* hanya mode lokal: isi data contoh agar grafik bisa dilihat */
    contoh: function (ev) {
      var ros = CN.eventRoster(ev), rows = lread().filter(function (r) { return r.event !== ev.id || r._demo !== true; });
      var K = ["Acaranya tertata dan tepat waktu.", "Materinya jelas dan mudah dipahami.", "Semoga kegiatan seperti ini sering diadakan.", "Suasana nyaman dan peserta antusias.", "Pembawa acaranya menyenangkan."];
      var C = ["Mohon sound system dicek lagi sebelum acara dimulai.", "Durasi agak panjang, sebaiknya ada jeda singkat.", "Pembagian tempat duduk bisa lebih rapi.", "Informasi acara sebaiknya disebar lebih awal."];
      var base = Date.now() - 3600000, n = 0;
      ros.forEach(function (p, i) {
        if ((i * 7 + 3) % 10 > 6) return;                                  /* sebagian tidak hadir */
        var rating = {}, bias = 3 + ((i * 13) % 10) / 5;
        CN.cfg.aspek.forEach(function (a, k) { rating[a.id] = Math.max(1, Math.min(5, Math.round(bias + (((i * 7 + k * 11) % 5) - 2) * 0.55 + (k === 4 ? -0.7 : k === 1 ? 0.4 : 0)))); });
        rows.push({ id: CN.uid("d"), t: new Date(base + i * 47000).toISOString(), corner: ev.corner, event: ev.id, nama: p.nama, nim: "2026" + ("0000" + (i + 1)).slice(-5), bagian: p.bagian, rating: rating,
          komentar: i % 3 === 0 ? K[i % K.length] : "", kritik: i % 5 === 1 ? C[i % C.length] : "", _demo: true });
        n++;
      });
      lwrite(rows); return Promise.resolve({ ok: true, n: n });
    },
    kosongkan: function () { try { localStorage.removeItem(LKEY); } catch (e) {} return Promise.resolve({ ok: true }); }
  };

  /* ---------- Perhitungan ---------- */
  function mean(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : null; }
  CN.mean = mean;
  CN.forEvent = function (ev, rows) {
    return rows.filter(function (r) { return r.event === ev.id; }).sort(function (a, b) { return a.t < b.t ? -1 : a.t > b.t ? 1 : 0; });
  };
  CN.rowMean = function (r) {
    var v = CN.cfg.aspek.map(function (a) { return r.rating && +r.rating[a.id]; }).filter(function (x) { return x >= 1 && x <= 5; });
    return mean(v);
  };
  CN.attendance = function (ev, rows) {
    var mine = CN.forEvent(ev, rows), byName = {};
    mine.forEach(function (r) { var k = CN.norm(r.nama); if (!byName[k]) byName[k] = r; });
    var used = {}, list = CN.eventRoster(ev).map(function (p) {
      var k = CN.norm(p.nama), r = byName[k]; if (r) used[k] = 1;
      return { nama: p.nama, bagian: p.bagian, grup: p.grup, peran: p.peran, hadir: !!r, row: r || null };
    });
    var seen = {}, extras = mine.filter(function (r) { var k = CN.norm(r.nama); if (used[k] || seen[k]) return false; seen[k] = 1; return true; });
    return { list: list, extras: extras, rows: mine, hadir: list.filter(function (x) { return x.hadir; }).length, total: list.length };
  };
  CN.predikat = function (v) {
    return v == null ? "Belum ada penilaian" : v >= 4.5 ? "Sangat baik" : v >= 3.5 ? "Baik" : v >= 2.5 ? "Cukup" : "Perlu perbaikan";
  };
  CN.summary = function (ev, rows) {
    var A = CN.cfg.aspek, mine = CN.forEvent(ev, rows), utama = CN.utama(), avg = {}, cnt = {};
    A.forEach(function (a) {
      var v = mine.map(function (r) { return r.rating && +r.rating[a.id]; }).filter(function (x) { return x >= 1 && x <= 5; });
      avg[a.id] = mean(v); cnt[a.id] = v.length;
    });
    var all = A.map(function (a) { return avg[a.id]; }).filter(function (x) { return x != null; });
    var dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    mine.forEach(function (r) {
      var v = utama ? +(r.rating && r.rating[utama.id]) : CN.rowMean(r);
      if (v >= 1 && v <= 5) dist[Math.max(1, Math.min(5, Math.round(v)))]++;
    });
    var rest = A.filter(function (a) { return !a.utama && avg[a.id] != null; }).sort(function (x, y) { return avg[y.id] - avg[x.id]; });
    return {
      n: mine.length, avg: avg, cnt: cnt, dist: dist, utama: utama,
      headline: utama ? avg[utama.id] : mean(all), meanAll: mean(all),
      best: rest.length > 1 ? rest[0] : null, worst: rest.length > 1 ? rest[rest.length - 1] : null,
      komentar: mine.filter(function (r) { return r.komentar; }), kritik: mine.filter(function (r) { return r.kritik; }), rows: mine
    };
  };
  CN.groupBy = function (list, key) {
    var out = [], idx = {};
    list.forEach(function (x) { var k = x[key]; if (!(k in idx)) { idx[k] = out.length; out.push({ key: k, items: [] }); } out[idx[k]].items.push(x); });
    return out;
  };

  /* ---------- Alamat formulir absensi (untuk QR) ---------- */
  CN.absenUrl = function (id) {
    var b = CN.cfg.set.basisUrl, base;
    if (b) { base = /^https?:\/\//.test(b) ? b : "https://" + b; base = base.replace(/[#?].*$/, ""); if (!/\.html?$/.test(base)) base = base.replace(/\/?$/, "/"); }
    else base = location.href.replace(/[#?].*$/, "");
    base = base.replace(/[^\/]*$/, "");                                /* buang nama file (index.html) bila ada */
    return base + "absen.html?e=" + encodeURIComponent(id);
  };

  /* ---------- Glyph ikon (SVG 24x24, garis) ---------- */
  CN.ICONS = {
    shield: '<path d="M12 3l7 3v5.5c0 4.4-2.9 7.7-7 9.5-4.1-1.8-7-5.1-7-9.5V6z"/><path d="M8.8 12.2l2.2 2.2 4.3-4.6"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2C4.5 7 6.5 5.3 8.7 5.3c1.4 0 2.6.7 3.3 1.9.7-1.2 1.9-1.9 3.3-1.9 2.2 0 4.2 1.7 4.2 4.5C19.5 15.4 12 20 12 20z"/>',
    star: '<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
    book: '<path d="M5 4.5h10.5a2.5 2.5 0 012.5 2.5v13H7.5A2.5 2.5 0 015 17.5z"/><path d="M5 17.5A2.5 2.5 0 017.5 15H18"/><path d="M9 8.5h5"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="M8.5 14l2 2 4-4"/>',
    chart: '<path d="M4.5 19.5h15"/><rect x="6" y="11" width="3" height="6.5" rx=".8"/><rect x="10.8" y="7" width="3" height="10.5" rx=".8"/><rect x="15.6" y="4.5" width="3" height="13" rx=".8"/>',
    doc: '<path d="M7 3.5h7l4 4v13H7z"/><path d="M14 3.5V8h4M9.5 12.5h5M9.5 16h5"/>',
    users: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.5-3.4 2.7-5 5.5-5s5 1.6 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.5 14.3c2.6-.4 4.6.8 5.2 3.7"/>',
    flag: '<path d="M6 21V4"/><path d="M6 4.8c4-2 6.5 2 11 0v9c-4.5 2-7-2-11 0z"/>',
    book2: '<path d="M12 6.5C10 5 7.5 4.5 4.5 4.8v13c3-.3 5.5.2 7.5 1.7 2-1.5 4.5-2 7.5-1.7v-13C16.5 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
    bolt: '<path d="M13 3L5.5 13.5H11L10 21l7.5-10.5H12z"/>',
    compass: '<circle cx="12" cy="12" r="8.5"/><path d="M15.8 8.2l-2 5.6-5.6 2 2-5.6z"/>',
    megaphone: '<path d="M4 10.5v3.5h3l6.5 4V6.5L7 10.5z"/><path d="M16.5 9.5a3.5 3.5 0 010 5.5M7 14l1 5"/>',
    leaf: '<path d="M5 19c0-8 5-13.5 14.5-14.5C19.5 14 14 19 5 19z"/><path d="M5 19c3-4.5 6-7.5 9.5-9.5"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z"/>',
    link: '<path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/>',
    text: '<path d="M5 6.5h14M5 11h14M5 15.5h9"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2.5v2.5H14zM18 18h2M17.5 14H20M14 19h2.5"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 018 0v2.5M12 14.5v2"/>'
  };
  CN.icon = function (k, cls) { return '<svg class="' + (cls || "cn-gl") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (CN.ICONS[k] || CN.ICONS.star) + '</svg>'; };
  CN.ICON_KEYS = ["shield", "heart", "star", "book", "calendar", "chart", "doc", "users", "flag", "book2", "bolt", "compass", "megaphone", "leaf", "globe", "link", "text", "qr"];
})(window);

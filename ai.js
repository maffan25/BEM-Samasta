/* =====================================================================
   ASTA (asisten AI), BEM STDIIS
   Tombol maskot melayang di kanan bawah -> jendela chat ASTA.
   1) Pengunjung memilih bagian  2) pertanyaan dicocokkan ke SOP + buku panduan
   (di peramban)  3) potongan yang cocok dikirim ke Apps Script -> AI  4) jawaban
   ditampilkan sebagai ringkasan, langkah, alur, tabel, grafik, dan sumber.
   Tanpa AI_ENDPOINT, halaman tetap jalan dalam "mode cari SOP".
   ===================================================================== */
(function () {
  "use strict";
  var page = document.getElementById("ai-app");
  if (!page || !window.SOP_DATA) return;

  var DATA = window.SOP_DATA, BY = {};
  DATA.forEach(function (s) { BY[s.c] = s; });
  var $ = function (id) { return document.getElementById(id); };
  var CFG = { MAX_Q: 500, COOLDOWN: 4000, TIMEOUT: 45000, HIST: 6 };

  /* ---------- Daftar bagian (kunci peran sama dengan sop-app.js) ---------- */
  var BAGIAN = [
    { k: "pres", n: "Presiden", g: "Pimpinan", r: ["pres"], b: "presiden", m: "PR" },
    { k: "wapres", n: "Wakil Presiden", g: "Pimpinan", r: ["wapres"], b: "wakil-presiden", m: "WP" },
    { k: "sekjen", n: "Sekretaris Jenderal", g: "Pimpinan", r: ["sekjen"], b: "sekretaris-jenderal", m: "SJ" },
    { k: "psdm", n: "Kementerian PSDM", g: "Kementerian", r: ["psdm"], b: "psdm", m: "PS" },
    { k: "akad", n: "Kementerian Akademik dan Karier", g: "Kementerian", r: ["akad"], b: "akademik-karier", m: "AK" },
    { k: "harm", n: "Kementerian Harmonisasi Kampus", g: "Kementerian", r: ["harm"], b: "harmonisasi-kampus", m: "HK" },
    { k: "pora", n: "Kemenpora (Pemuda dan Olahraga)", g: "Kementerian", r: ["pora"], b: "kemenpora", m: "KP" },
    { k: "lng", n: "Kementerian Hubungan Eksternal", g: "Kementerian", r: ["lng"], b: "hubeks", m: "HE" },
    { k: "kesma", n: "Kementerian Kesejahteraan Mahasiswa", g: "Kementerian", r: ["kesma"], b: "kesma", m: "KM" },
    { k: "bhs", n: "Kementerian Pengembangan Bahasa", g: "Kementerian", r: ["bhs"], b: "pengembangan-bahasa", m: "PB" },
    { k: "adm", n: "Biro Administrasi", g: "Biro", r: ["adm", "sek"], b: "biro-administrasi", m: "BA" },
    { k: "keu", n: "Biro Keuangan", g: "Biro", r: ["keu"], b: "biro-keuangan", m: "BK" },
    { k: "dkv", n: "Biro DKV", g: "Biro", r: ["dkv"], b: "biro-dkv", m: "DK" },
    { k: "irjen", n: "Inspektorat Jenderal", g: "Pengawas", r: ["irjen"], b: "inspektorat-jenderal", m: "IJ" },
    { k: "umum", n: "Belum tahu / bagian lain", g: "Lainnya", r: [], b: "", m: "?", umum: true }
  ];
  var BK = {}; BAGIAN.forEach(function (b) { BK[b.k] = b; });

  /* ---------- Utilitas teks ---------- */
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmt(t) {
    return esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/SOP-[A-Z]+-\d{3}/g, function (c) { return BY[c] ? '<a class="sp-x" href="#sop/' + c + '">' + c + "</a>" : c; });
  }
  var STOP = {};
  ("yang dan di ke dari untuk dengan pada adalah itu ini saya aku kami kita bagaimana gimana apa apakah kapan siapa mengapa kenapa bisa harus perlu cara atau jika kalau ada tidak sudah belum akan mau ingin tolong dong ya nih sih deh saat ketika oleh para sebuah suatu juga lebih sangat agar supaya dalam atas bagi tentang soal masalah mohon minta mengenai sebagai antara sampai hingga seperti bila bagaimanakah apabila").split(" ").forEach(function (w) { STOP[w] = 1; });
  var SYN = [
    [/\b(duit|uang|dana|biaya|bayar|anggaran|rab)\b/, "keuangan anggaran dana pencairan"],
    [/\b(cair|mencairkan|pencairan)\b/, "pencairan dana"],
    [/\blpj\b/, "laporan pertanggungjawaban"],
    [/\bproker\b/, "program kerja"],
    [/\b(surat|undangan|stempel|kop)\b/, "surat persuratan"],
    [/\b(notulen|notulensi|risalah)\b/, "notulen rapat"],
    [/\b(absen|presensi|izin|sakit|alpa)\b/, "presensi izin ketidakhadiran"],
    [/\b(poster|pamflet|desain|flyer|banner|konten)\b/, "desain publikasi konten"],
    [/\b(pinjam|meminjam|peminjaman)\b/, "peminjaman aset"],
    [/\b(sponsor|sponsorship)\b/, "sponsor sponsorship"],
    [/\b(ketua|panitia|kepanitiaan)\b/, "panitia kegiatan"],
    [/\b(keluhan|komplain|aduan|pengaduan|aspirasi|lapor)\b/, "aspirasi pengaduan"],
    [/(bully|perundung|pelecehan|intimidasi|diancam|dihina|dilecehkan|dikucilkan)/, "perundungan pelecehan intimidasi pengaduan"],
    [/(proyektor|laptop|kamera|speaker|mic|sound|tripod|kursi|meja|barang|alat|inventaris)/, "aset peminjaman inventaris"],
    [/(tidak hadir|ga hadir|gak hadir|bolos|jarang hadir|tidak aktif|malas|pasif)/, "presensi ketidakhadiran pembinaan anggota tidak aktif"],
    [/\b(mundur|keluar|resign|berhenti)\b/, "pengunduran diri pemberhentian"],
    [/\b(sertijab|serah terima|pergantian)\b/, "serah terima jabatan"],
    [/\b(acara|event|kegiatan)\b/, "kegiatan program"],
    [/\b(medsos|instagram|tiktok|sosmed)\b/, "media sosial"],
    [/\b(mou|kerjasama|kerja sama|mitra)\b/, "kerja sama mitra"],
    [/\b(hilang|rusak)\b/, "aset rusak hilang"],
    [/\b(tor|kak)\b/, "kerangka acuan kegiatan tor"],
    [/\b(korupsi|nyeleweng|penyelewengan|salah gunakan)\b/, "penyalahgunaan dana"],
    [/\b(telat|terlambat|molor)\b/, "terlambat keterlambatan"]
  ];
  function stem(w) {
    if (w.length > 5) w = w.replace(/(nya|kan|lah|kah)$/, "");
    if (w.length > 5) w = w.replace(/(an|i)$/, "");
    if (w.length > 5) w = w.replace(/^(meng|meny|men|mem|peng|peny|pen|pem|ber|ter|per|me|pe|di|ke|se)/, "");
    return w;
  }
  function toks(s) {
    var out = [], p = String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
    for (var i = 0; i < p.length; i++) { var w = p[i]; if (w.length < 2 || STOP[w]) continue; out.push(stem(w)); }
    return out;
  }
  function expand(q) {
    var lo = q.toLowerCase(), extra = "";
    SYN.forEach(function (x) { if (x[0].test(lo)) extra += " " + x[1]; });
    return q + " " + extra;
  }

  /* ---------- Teks dari struktur SOP ---------- */
  function blockText(b) {
    var o = [];
    if (b.p) o.push(b.p);
    if (b.note) o.push(b.note);
    if (b.ul) b.ul.forEach(function (x) { o.push("- " + x); });
    if (b.tb) { o.push(b.tb.h.join(" | ")); b.tb.r.forEach(function (r) { o.push(r.join(" | ")); }); }
    if (b.flow) o.push("Alur: " + b.flow);
    return o.join("\n");
  }
  function secText(c) { return c.c.map(blockText).join("\n"); }

  /* ---------- Indeks (dibangun saat pertama dibuka) ---------- */
  var IDX = null;
  function build() {
    if (IDX) return IDX;
    var chunks = [], df = {}, tot = 0;
    function add(ch, head, body) {
      var t = toks(head).concat(toks(head), toks(body)), tf = {};
      t.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
      ch.tf = tf; ch.len = t.length; tot += t.length;
      for (var w in tf) df[w] = (df[w] || 0) + 1;
      chunks.push(ch);
    }
    DATA.forEach(function (s) {
      s.s.forEach(function (c) {
        var body = secText(c);
        add({ kind: "sop", sop: s, sec: c, text: body }, s.c + " " + s.t + " " + c.t, body);
      });
    });
    var P = window.PANDUAN || {};
    Object.keys(P).forEach(function (f) {
      var bk = P[f]; if (!bk || !bk.p) return;
      bk.p.forEach(function (pg) {
        var txt = String(pg[1] || ""); if (txt.length < 40) return;
        for (var i = 0; i < txt.length; i += 1800)
          add({ kind: "pd", file: f, name: bk.n || f, page: pg[0], text: txt.slice(i, i + 1800) }, bk.n || f, txt.slice(i, i + 1800));
      });
    });
    IDX = { chunks: chunks, df: df, N: chunks.length, avg: tot / Math.max(1, chunks.length) };
    return IDX;
  }
  var SECW = { "Definisi istilah": .55, "Daftar distribusi": .4, "Riwayat perubahan": .4, "Formulir dan templat": .6, "Checklist pemeriksaan": .6, "Indikator keberhasilan": .6, "Dasar hukum dan dokumen acuan": .6, "Dokumen keluaran dan arsip": .7, "Pengendalian dan evaluasi": .7,
    "Prosedur pelaksanaan": 1.3, "Ketentuan pokok": 1.2, "Standar waktu dan hasil": 1.2, "Pengecualian dan eskalasi masalah": 1.15, "Pihak yang terlibat dan tanggung jawab": 1.15, "Tujuan": 1.1 };
  function search(q, bag) {
    var I = build(), qt = toks(expand(q)), seen = {};
    qt = qt.filter(function (w) { return seen[w] ? false : (seen[w] = 1); });
    var k1 = 1.4, b = 0.75, res = [];
    I.chunks.forEach(function (ch) {
      var sc = 0;
      qt.forEach(function (w) {
        var f = ch.tf[w]; if (!f) return;
        var n = I.df[w], idf = Math.log(1 + (I.N - n + .5) / (n + .5));
        sc += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * ch.len / I.avg));
      });
      if (sc <= 0) return;
      if (ch.kind === "sop") sc *= SECW[ch.sec.t] || 1;
      if (bag && !bag.umum) {
        if (ch.kind === "sop") {
          var own = bag.r.some(function (r) { return ch.sop.own && ch.sop.own.has(r); });
          var inv = bag.r.some(function (r) { return ch.sop.inv && ch.sop.inv.has(r); });
          sc *= own ? 1.7 : inv ? 1.35 : 1;
        } else if (ch.file === bag.b) sc *= 2;
      }
      res.push({ ch: ch, sc: sc });
    });
    res.sort(function (a, b) { return b.sc - a.sc; });
    return res;
  }
  function pickContext(q, bag) {
    var r = search(q, bag), out = [], perSop = {}, pdN = 0, size = 0, LIM = 15000;
    for (var i = 0; i < r.length && out.length < 9; i++) {
      var ch = r[i].ch, t;
      if (ch.kind === "sop") {
        perSop[ch.sop.c] = (perSop[ch.sop.c] || 0) + 1;
        if (perSop[ch.sop.c] > 3) continue;
        t = ch.text.slice(0, ch.sec.t === "Prosedur pelaksanaan" ? 3200 : 1700);
        if (size + t.length > LIM) continue;
        out.push({ ch: ch, sc: r[i].sc, t: t, ref: ch.sop.c + " | " + ch.sop.t + " | bagian: " + ch.sec.t + " | pemilik: " + ch.sop.o + " | status: " + (ch.sop.st || "") });
      } else {
        if (pdN >= 3) continue; pdN++;
        t = ch.text; if (size + t.length > LIM) continue;
        out.push({ ch: ch, sc: r[i].sc, t: t, ref: "Buku Panduan " + ch.name + " | hlm. " + ch.page });
      }
      size += t.length;
    }
    return { items: out, top: r.length ? r[0].sc : 0 };
  }

  /* ---------- Jawaban lokal (tanpa AI) ---------- */
  function localAnswer(q, ctx, note) {
    var its = ctx.items, a = { jenis: "lokal", catatan: note ? [note] : [], sumber: [], lanjut: [] };
    var sops = [], seen = {}, tot = {};
    its.forEach(function (x) { if (x.ch.kind === "sop") { tot[x.ch.sop.c] = (tot[x.ch.sop.c] || 0) + x.sc; if (!seen[x.ch.sop.c]) { seen[x.ch.sop.c] = 1; sops.push(x.ch.sop); } } });
    sops.sort(function (a, b) { return tot[b.c] - tot[a.c]; });
    if (!sops.length || ctx.top < 1.2) {
      a.jenis = "kosong";
      a.ringkas = "Aku belum menemukan bagian SOP atau buku panduan yang cocok dengan pertanyaan itu. Coba tulis dengan kata kunci lain, misalnya nama kegiatan atau dokumennya.";
      return a;
    }
    var s = sops[0], tj = s.s.filter(function (c) { return c.t === "Tujuan"; })[0];
    var tjt = tj ? secText(tj).replace(/\n/g, " ") : "";
    a.ringkas = "Yang paling cocok adalah **" + s.c + " (" + s.t + ")**. " + (tjt ? tjt.slice(0, 280) + (tjt.length > 280 ? "..." : "") : "");
    var pr = s.s.filter(function (c) { return c.t === "Prosedur pelaksanaan"; })[0];
    if (pr) pr.c.forEach(function (b) {
      if (b.tb && b.tb.h.length >= 3) {
        var h = b.tb.h, iT = 1, iP = h.indexOf("Pelaksana"), iW = h.indexOf("Batas waktu");
        var cols = ["No."], ix = [0];
        cols.push("Tahapan dan tindakan"); ix.push(iT);
        if (iP > -1) { cols.push("Pelaksana"); ix.push(iP); }
        if (iW > -1) { cols.push("Batas waktu"); ix.push(iW); }
        a.tabel = [{ judul: "Prosedur " + s.c, kolom: cols, baris: b.tb.r.map(function (r) { return ix.map(function (i) { return r[i] || ""; }); }) }];
        if (iP > -1) a.alur = b.tb.r.map(function (r) { return { label: String(r[1] || "").split(":")[0].slice(0, 70), pic: r[iP] }; });
      }
    });
    var fl = s.s.filter(function (c) { return c.t === "Diagram alir ringkas"; })[0];
    if (fl && !a.alur) fl.c.forEach(function (b) { if (b.flow) a.alur = b.flow.split(/\s*→\s*/).map(function (x) { return { label: x }; }); });
    var es = s.s.filter(function (c) { return c.t === "Pengecualian dan eskalasi masalah"; })[0];
    if (es) es.c.forEach(function (b) { if (b.ul) b.ul.slice(0, 3).forEach(function (x) { a.catatan.push(x); }); });
    sops.slice(0, 4).forEach(function (x) { a.sumber.push({ kode: x.c, label: x.c + " " + x.t }); });
    its.forEach(function (x) { if (x.ch.kind === "pd") a.sumber.push({ file: x.ch.file, hlm: x.ch.page, label: "Panduan " + x.ch.name + " hlm. " + x.ch.page }); });
    sops.slice(1, 4).forEach(function (x) { a.lanjut.push("Jelaskan " + x.t.toLowerCase()); });
    return a;
  }

  /* ---------- Panggilan ke AI ---------- */
  function endpoint() {
    var e = typeof window.AI_ENDPOINT === "string" ? window.AI_ENDPOINT.replace(/[\s"'\u201C\u201D\u2018\u2019]/g, "") : "";
    return /^https:\/\/script\.google\.com\/macros\/s\/[^\/]+\/exec$/.test(e) ? e : "";
  }
  function askAI(q, bag, ctx, hist) {
    var EP = endpoint();
    if (!EP) return Promise.reject({ code: "A0" });
    var payload = {
      v: 1, q: q, bagian: bag.n, hp: "",
      riwayat: hist,
      konteks: ctx.items.map(function (x, i) { return { id: "K" + (i + 1), ref: x.ref, t: x.t }; })
    };
    var ctl = window.AbortController ? new AbortController() : null, to = ctl && setTimeout(function () { ctl.abort(); }, CFG.TIMEOUT);
    return fetch(EP, { method: "POST", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.text(); })
      .then(function (t) {
        clearTimeout(to);
        var j; try { j = JSON.parse(t); } catch (x) { throw { code: "N2" }; }
        if (!j.ok) throw { code: j.error === "limit" ? "L1" : j.error === "kunci" ? "K1" : "E1" };
        return j.jawaban;
      }, function () { clearTimeout(to); throw { code: "N1" }; });
  }

  /* ---------- Tampilan jawaban ---------- */
  function arr(x) { return Array.isArray(x) ? x : []; }
  function renderAnswer(a, ctx) {
    var h = "", cls = a.jenis === "lokal" ? " lokal" : a.jenis === "kosong" || a.jenis === "tidak_ditemukan" ? " warn" : "";
    var label = a.jenis === "lokal" ? "Hasil pencarian SOP" : a.jenis === "kosong" || a.jenis === "tidak_ditemukan" ? "Belum ditemukan" : "Jawaban";
    h += '<div class="ai-top"><span class="asta-av" aria-hidden="true"><span class="asta-img"></span></span><span class="ai-badge' + cls + '">' + label + "</span></div>";
    if (a.ringkas) h += '<p class="ai-sum">' + fmt(a.ringkas) + "</p>";
    var L = arr(a.langkah);
    if (L.length) h += '<div><h4>Langkah</h4><ol class="ai-steps">' + L.map(function (s) {
      return "<li><b>" + fmt(s.judul || "") + "</b>" + (s.detail ? "<span>" + fmt(s.detail) + "</span>" : "") + (s.pic ? '<br><em class="pic">' + esc(s.pic) + "</em>" : "") + "</li>"; }).join("") + "</ol></div>";
    var F = arr(a.alur);
    if (F.length > 1) h += '<div><h4>Alur proses</h4><div class="ai-flow" role="img" aria-label="Diagram alur proses">' + F.map(function (n, i) {
      return '<div class="fn' + (i === F.length - 1 && /selesai|arsip|tuntas/i.test(n.label) ? " end" : "") + '"><i>' + (i + 1) + "</i><div><b>" + esc(n.label) + "</b>" + (n.pic ? "<small>" + esc(n.pic) + "</small>" : "") + "</div></div>"; }).join("") + "</div></div>";
    arr(a.tabel).forEach(function (t) {
      if (!arr(t.kolom).length || !arr(t.baris).length) return;
      h += '<div class="ai-tbl">' + (t.judul ? "<h4>" + esc(t.judul) + "</h4>" : "") + '<div class="scroll"><table><thead><tr>' + t.kolom.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        t.baris.map(function (r) { return "<tr>" + arr(r).map(function (c) { return "<td>" + fmt(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></div>";
    });
    var G = a.grafik;
    if (G && arr(G.data).length > 1) {
      var mx = Math.max.apply(null, G.data.map(function (d) { return +d.nilai || 0; })) || 1;
      h += "<div><h4>" + esc(G.judul || "Grafik") + '</h4><div class="ai-bars">' + G.data.map(function (d) {
        var v = +d.nilai || 0;
        return '<div class="ai-bar"><span>' + esc(d.label) + '</span><i style="--w:' + Math.max(4, Math.round(v / mx * 100)) + '%"></i><span>' + v + " " + esc(G.satuan || "") + "</span></div>"; }).join("") + "</div></div>";
    }
    var N = arr(a.catatan).filter(Boolean);
    if (N.length) h += '<div class="ai-note"><ul>' + N.map(function (n) { return "<li>" + fmt(n) + "</li>"; }).join("") + "</ul></div>";
    var S = [];
    arr(a.sumber).forEach(function (s) {
      if (s.id && ctx) { var m = /^K(\d+)$/.exec(s.id), it = m && ctx.items[+m[1] - 1]; if (it) s = it.ch.kind === "sop" ? { kode: it.ch.sop.c, label: it.ch.sop.c + " " + it.ch.sec.t } : { file: it.ch.file, hlm: it.ch.page, label: "Panduan " + it.ch.name + " hlm. " + it.ch.page }; else return; }
      if (s.kode && BY[s.kode]) S.push('<a href="#sop/' + s.kode + '">' + esc(s.label || s.kode) + "</a>");
      else if (s.file) S.push('<a href="panduan/' + encodeURIComponent(s.file) + ".pdf#page=" + (+s.hlm || 1) + '" target="_blank" rel="noopener">' + esc(s.label || s.file) + "</a>");
    });
    S = S.filter(function (x, i) { return S.indexOf(x) === i; });
    if (S.length) h += '<div class="ai-src"><span>Sumber:</span>' + S.join("") + "</div>";
    var M = arr(a.lanjut).filter(Boolean).slice(0, 3);
    if (M.length) h += '<div class="ai-more">' + M.map(function (m) { return '<button type="button" data-ask="' + esc(m) + '">' + esc(m) + "</button>"; }).join("") + "</div>";
    h += '<div class="ai-act"><button type="button" class="link-btn" data-copy>Salin jawaban</button></div>';
    return h;
  }
  function plain(a) {
    var o = [a.ringkas || ""];
    arr(a.langkah).forEach(function (s, i) { o.push((i + 1) + ". " + (s.judul || "") + (s.detail ? ": " + s.detail : "")); });
    arr(a.tabel).forEach(function (t) { o.push(t.judul || ""); o.push(arr(t.kolom).join(" | ")); arr(t.baris).forEach(function (r) { o.push(arr(r).join(" | ")); }); });
    arr(a.catatan).forEach(function (n) { o.push("Catatan: " + n); });
    return o.join("\n").replace(/\*\*/g, "");
  }

  /* ---------- Antarmuka ---------- */
  var st = { bag: null, hist: [], busy: false, last: 0, answers: [] };
  var pick = $("ai-pick"), chat = $("ai-chat"), feed = $("ai-feed"), sugg = $("ai-sugg"), form = $("ai-form"), ta = $("ai-q"), send = $("ai-send");

  function renderPick() {
    var groups = {}, order = [];
    BAGIAN.forEach(function (b) { if (!groups[b.g]) { groups[b.g] = []; order.push(b.g); } groups[b.g].push(b); });
    pick.innerHTML = '<div class="asta-hello"><div class="asta-hero" aria-hidden="true"><span class="asta-img" data-wave></span></div><div class="asta-say"><h2>Halo, aku ASTA!</h2><p>Kamu dari bagian mana? Pilih dulu supaya aku mengutamakan SOP dan buku panduan yang paling berkaitan dengan tugasmu.</p></div></div>' +
      order.map(function (g) {
        return '<div class="ai-grp"><h3>' + esc(g) + '</h3><div class="ai-tiles">' + groups[g].map(function (b) {
          var n = DATA.filter(function (s) { return b.r.some(function (r) { return s.own && (s.own.has(r) || s.inv.has(r)); }); }).length;
          return '<button type="button" class="ai-tile' + (b.umum ? " umum" : "") + '" data-bag="' + b.k + '"><span class="ai-mono" aria-hidden="true">' + b.m + "</span><span><b>" + esc(b.n) + "</b><small>" + (b.umum ? "Cari di seluruh SOP" : n + " SOP terkait") + "</small></span></button>";
        }).join("") + "</div></div>";
      }).join("");
  }
  function suggestions(bag) {
    var list = [];
    if (!bag.umum) DATA.forEach(function (s) { if (list.length < 4 && bag.r.some(function (r) { return s.own && s.own.has(r); })) list.push("Bagaimana prosedur " + s.t.toLowerCase() + "?"); });
    if (list.length < 3) list = list.concat(["Bagaimana cara mencairkan dana kegiatan?", "Apa saja syarat proposal kegiatan?", "Bagaimana cara izin tidak hadir rapat?"]);
    return list.slice(0, 5);
  }
  function setMode() {
    var on = !!endpoint();
    $("ai-who-name").innerHTML = esc(st.bag.n) + '<span class="ai-mode' + (on ? " on" : "") + '">' + (on ? "AI aktif" : "Mode cari SOP") + "</span>";
  }
  function choose(k) {
    st.bag = BK[k]; st.hist = []; st.answers = [];
    pick.hidden = true; chat.hidden = false; setMode();
    feed.innerHTML = '<div class="ai-hello"><span class="asta-av" aria-hidden="true"><span class="asta-img"></span></span><div><h3>Halo, ' + esc(st.bag.umum ? "silakan bertanya" : "pengurus " + st.bag.n) + '! Aku ASTA.</h3><p>Ceritakan masalah atau pertanyaanmu. Aku jawab berdasarkan SOP dan buku panduan, lengkap dengan langkah, tabel, dan alur bila perlu.</p></div></div>';
    sugg.innerHTML = suggestions(st.bag).map(function (s) { return '<button type="button" data-ask="' + esc(s) + '">' + esc(s) + "</button>"; }).join("");
    feed.scrollTop = 0;
    setTimeout(build, 60);
    setTimeout(function () { ta.focus({ preventScroll: true }); }, 200);
  }
  function addMsg(html, cls) {
    var d = document.createElement("div"); d.className = "ai-msg " + cls; d.innerHTML = html; feed.appendChild(d); return d;
  }
  function ask(q) {
    q = String(q || "").trim().slice(0, CFG.MAX_Q);
    if (!q || st.busy || !st.bag) return;
    var wait = CFG.COOLDOWN - (Date.now() - st.last);
    if (wait > 0) { ta.setCustomValidity(""); toast("Tunggu " + Math.ceil(wait / 1000) + " detik sebelum bertanya lagi."); return; }
    st.busy = true; st.last = Date.now(); send.disabled = true; ta.value = ""; grow(); sugg.hidden = true;
    var u = addMsg(esc(q), "ai-u");
    var w = addMsg('<div class="ai-wait" role="status"><div class="ai-think"><span class="asta-av" aria-hidden="true"><span class="asta-img"></span></span><span>ASTA sedang mencari di SOP dan buku panduan<em><i></i><i></i><i></i></em></span></div><i></i><i></i><i></i></div>', "ai-a");
    avBusy(true);
    u.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(function () {
      var ctx = pickContext(q, st.bag), hist = st.hist.slice(-CFG.HIST);
      function show(a, c) {
        w.innerHTML = renderAnswer(a, c);
        st.answers.push(a); w.setAttribute("data-i", st.answers.length - 1);
        st.hist.push({ r: "u", t: q }); st.hist.push({ r: "a", t: (a.ringkas || "").slice(0, 400) });
        st.busy = false; send.disabled = false; avBusy(false); setMode();
        u.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      askAI(q, st.bag, ctx, hist).then(function (a) {
        if (!a || typeof a !== "object") throw { code: "E1" };
        show(a, ctx);
      }).catch(function (e) {
        var code = e && e.code, note = null;
        if (code && code !== "A0") note = "AI sedang tidak bisa dihubungi (kode " + code + "), jadi yang tampil adalah hasil pencarian SOP.";
        if (code === "L1") note = "Batas penggunaan AI hari ini sudah tercapai, jadi yang tampil adalah hasil pencarian SOP. Coba lagi besok.";
        show(localAnswer(q, ctx, note), ctx);
        if (window.console && code && code !== "A0") console.warn("[Tanya AI] gagal:", code);
      });
    }, 30);
  }
  var tT;
  function toast(m) {
    var t = $("ai-toast");
    if (!t) { t = document.createElement("p"); t.id = "ai-toast"; t.className = "ai-foot"; t.setAttribute("role", "status"); chat.insertBefore(t, form.nextSibling); }
    t.textContent = m; clearTimeout(tT); tT = setTimeout(function () { t.textContent = ""; }, 3000);
  }
  function avBusy(on) { var av = $("asta-av"); if (av) av.classList.toggle("busy", on); }
  function grow() { ta.style.height = "auto"; ta.style.height = Math.min(140, ta.scrollHeight) + "px"; }

  pick.addEventListener("click", function (e) { var b = e.target.closest("[data-bag]"); if (b) choose(b.getAttribute("data-bag")); });
  $("ai-change").addEventListener("click", function () { chat.hidden = true; pick.hidden = false; pick.scrollTop = 0; });
  pick.addEventListener("click", function (e) {
    var w = e.target.closest("[data-wave]"); if (!w) return;
    w.style.animation = "none"; void w.offsetWidth; w.style.animation = "astaWave .9s ease-in-out";
    setTimeout(function () { w.style.animation = ""; }, 950);
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); ask(ta.value); });
  ta.addEventListener("input", grow);
  ta.addEventListener("keydown", function (e) {
    var fine = window.matchMedia && matchMedia("(pointer:fine)").matches;
    if (e.key === "Enter" && !e.shiftKey && fine) { e.preventDefault(); ask(ta.value); }
  });
  chat.addEventListener("click", function (e) {
    var a = e.target.closest("[data-ask]"); if (a) { ask(a.getAttribute("data-ask")); return; }
    var c = e.target.closest("[data-copy]");
    if (c) {
      var m = c.closest(".ai-msg"), ans = st.answers[+m.getAttribute("data-i")];
      var txt = ans ? plain(ans) : m.innerText;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { c.textContent = "Tersalin"; setTimeout(function () { c.textContent = "Salin jawaban"; }, 1800); }, function () { toast("Gagal menyalin."); });
    }
  });
  feed.addEventListener("transitionend", function () {}, false);
  $("ai-q").addEventListener("focus", function () { sugg.hidden = false; });

  /* ---------- Tombol melayang ASTA (kanan bawah) ---------- */
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var MSGS = ["Tanya aku", "Masih bingung?", "Ngobrol yuk"];   /* berganti tiap 5 detik */
  var SWAP_MS = 5000;

  var fab = (function () {
    var el = document.createElement("div");
    el.className = "asta-fab"; el.id = "asta-fab";
    var longest = MSGS.reduce(function (a, b) { return b.length > a.length ? b : a; }, "");
    el.innerHTML =
      '<div class="asta-bubble" aria-hidden="true"><span class="asta-sizer">' + esc(longest) + '</span><span class="asta-txt"></span><span class="asta-dots"><i></i><i></i><i></i></span></div>' +
      '<a class="asta-btn" href="#tanya-ai" aria-label="Buka ASTA, asisten AI untuk bertanya soal SOP dan buku panduan">' +
        '<span class="asta-shadow"></span><span class="asta-float"><span class="asta-tilt"><span class="asta-img"></span></span></span><span class="asta-dot"></span></a>';
    var bub = el.querySelector(".asta-bubble"), txt = el.querySelector(".asta-txt"),
        btn = el.querySelector(".asta-btn"), tilt = el.querySelector(".asta-tilt");
    var timers = [], off = false, idx = -1;
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function wave() {
      btn.classList.remove("hi"); void btn.offsetWidth; btn.classList.add("hi");
      later(function () { btn.classList.remove("hi"); }, 1000);
    }
    function typeIn(s) {
      if (reduce) { txt.textContent = s; return; }
      var n = 0; bub.classList.add("typing");
      (function step() {
        txt.textContent = s.slice(0, ++n);
        if (n < s.length) later(step, 40); else bub.classList.remove("typing");
      })();
    }
    function next() {
      if (off || document.hidden) { later(next, 1000); return; }          /* jeda saat jendela terbuka / tab disembunyikan */
      idx = (idx + 1) % MSGS.length;
      var s = MSGS[idx];
      bub.classList.remove("show");
      later(function () { txt.textContent = ""; bub.classList.add("show", "wait"); }, reduce ? 0 : 280);   /* titik-titik "mengetik" */
      later(function () { bub.classList.remove("wait"); typeIn(s); wave(); }, reduce ? 0 : 280 + 700);
      later(next, SWAP_MS);
    }
    bub.addEventListener("click", function () { btn.click(); });

    /* ASTA menoleh mengikuti kursor (hanya perangkat dengan mouse) */
    if (!reduce && window.matchMedia && matchMedia("(pointer:fine)").matches) {
      var raf = 0, mx = 0, my = 0;
      var look = function () {
        raf = 0; if (off) return;
        var r = btn.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2),
            d = Math.min(1, Math.hypot(dx, dy) / 520), a = Math.atan2(dy, dx);
        tilt.style.setProperty("--px", (Math.cos(a) * 5 * d).toFixed(1) + "px");
        tilt.style.setProperty("--py", (Math.sin(a) * 4 * d).toFixed(1) + "px");
        tilt.style.setProperty("--pr", (Math.cos(a) * 6 * d).toFixed(1) + "deg");
      };
      document.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });
    }

    setTimeout(function () {
      el.classList.add("enter"); document.body.appendChild(el);
      later(next, reduce ? 300 : 1300);
    }, reduce ? 0 : 700);
    return { setOff: function (v) { off = v; el.classList.toggle("off", v); } };
  })();

  /* ---------- Jendela ASTA (buka/tutup lewat #tanya-ai) ---------- */
  var title0 = document.title, root = document.documentElement, pushed = false, lastFocus = null, closeT = 0;
  function lock(on) {
    if (on) { var sw = window.innerWidth - root.clientWidth; root.classList.add("asta-lock"); if (sw > 0) document.body.style.paddingRight = sw + "px"; }
    else { root.classList.remove("asta-lock"); document.body.style.paddingRight = ""; }
  }
  function openUI() {
    if (!page.hidden && !page.classList.contains("closing")) return;
    clearTimeout(closeT); page.classList.remove("closing");
    lastFocus = document.activeElement;
    page.hidden = false; fab.setOff(true); fitViewport();
    document.title = "ASTA | BEM STDIIS";
    if (!st.bag) { pick.hidden = false; chat.hidden = true; pick.scrollTop = 0; }
    setTimeout(function () { try { (st.bag ? ta : $("asta-close")).focus({ preventScroll: true }); } catch (x) {} }, 420);
  }
  function closeUI() {
    pushed = false;
    if (page.hidden || page.classList.contains("closing")) return;
    page.classList.add("closing");
    closeT = setTimeout(function () {
      page.hidden = true; page.classList.remove("closing"); fab.setOff(false); document.title = title0;
      if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (x) {} }
    }, reduce ? 0 : 210);
  }
  function syncPage() { if (location.hash === "#tanya-ai") openUI(); else closeUI(); }
  function requestClose() {
    if (pushed) { pushed = false; history.back(); }
    else { try { history.replaceState(null, "", "#beranda"); } catch (x) {} syncPage(); }
  }
  /* di ponsel, jendela mengikuti tinggi layar yang terlihat (saat papan ketik muncul) */
  function fitViewport() {
    var vv = window.visualViewport;
    if (vv && window.innerWidth <= 640 && !page.hidden) { page.style.top = vv.offsetTop + "px"; page.style.bottom = "auto"; page.style.height = vv.height + "px"; }
    else { page.style.top = page.style.bottom = page.style.height = ""; }
  }
  if (window.visualViewport) { visualViewport.addEventListener("resize", fitViewport); visualViewport.addEventListener("scroll", fitViewport); }
  window.addEventListener("resize", fitViewport);

  page.addEventListener("click", function (e) { if (e.target.closest("[data-asta-close]")) requestClose(); });
  page.addEventListener("wheel", function (e) { if (e.target.classList.contains("asta-backdrop")) e.preventDefault(); }, { passive: false });
  document.addEventListener("keydown", function (e) {
    if (page.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); requestClose(); return; }
    if (e.key !== "Tab") return;
    var f = [].filter.call(page.querySelectorAll('button,textarea,a[href],[tabindex]:not([tabindex="-1"])'), function (n) { return !n.disabled && n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (!page.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var a = e.target.closest('a[href="#tanya-ai"]'); if (!a) return;
    e.preventDefault();
    if (location.hash !== "#tanya-ai") { try { history.pushState(null, "", "#tanya-ai"); pushed = true; } catch (x) { location.hash = "#tanya-ai"; } }
    syncPage();
  }, true);
  /* tautan sumber (#sop/...) di dalam jawaban: tutup jendela, lalu biarkan halaman SOP terbuka */
  document.addEventListener("click", function (e) { if (e.target.closest('a[href^="#"]')) setTimeout(syncPage, 0); });
  window.addEventListener("hashchange", syncPage);
  window.addEventListener("popstate", syncPage);

  (window.requestIdleCallback || function (f) { setTimeout(f, 2500); })(function () { try { build(); } catch (x) {} }, { timeout: 6000 });
  renderPick();
  syncPage();
  window.__aiDebug = { search: search, pickContext: pickContext, localAnswer: localAnswer, renderAnswer: renderAnswer };
})();

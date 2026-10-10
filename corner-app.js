/* corner-app.js: bagian Samasta Corner di beranda (bola corner) dan seluruh halaman corner:
   hub menu, daftar event, absensi (kode QR), pembukuan, ringkasan, statistik, dan halaman "segera hadir".
   Dipanggil oleh router di sop-app.js lewat window.CORNER_ROUTE(hash). */
(function () {
  "use strict";
  var CN = window.CN;
  if (!CN) return;
  var esc = CN.esc, $ = function (i) { return document.getElementById(i); };
  var app = $("corner-app"), out = $("cn-out");
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- Ikon kecil ---------- */
  var P = {
    chk: '<path d="M5 12.500l4.200 4.200L19 7"/>', x: '<path d="M6.500 6.500l11 11M17.500 6.500l-11 11"/>',
    arr: '<path d="M5 12h14M13 6l6 6-6 6"/>', del: '<path d="M4.500 7h15M9.500 7V4.500h5V7M7 7l.8 12.500h8.400L17 7M10.500 10.500v6M13.500 10.500v6"/>',
    dl: '<path d="M12 4v11M7.500 10.500L12 15l4.500-4.500M5 19.500h14"/>', print: '<path d="M7 9V4.500h10V9M7 17H5V9h14v8h-2M7 14h10v6H7z"/>',
    copy: '<rect x="8.500" y="8.500" width="11" height="11" rx="2.500"/><path d="M15.500 8.500V6A2.500 2.500 0 0013 3.500H6A2.500 2.500 0 003.500 6v7A2.500 2.500 0 006 15.500h2.500"/>',
    full: '<path d="M4.500 9V4.500H9M15 4.500h4.500V9M19.500 15v4.500H15M9 19.500H4.500V15"/>', ref: '<path d="M19.500 12a7.500 7.500 0 11-2.300-5.400M19.500 4.500v4h-4"/>',
    link: '<path d="M10 14a4 4 0 005.700 0l3-3a4 4 0 00-5.700-5.700l-1 1M14 10a4 4 0 00-5.700 0l-3 3a4 4 0 005.700 5.700l1-1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.500M12 7.500h.01"/>', lock: '<rect x="5" y="10.500" width="14" height="9.500" rx="2.500"/><path d="M8 10.500V8a4 4 0 018 0v2.500M12 14.500v2"/>',
    spin: '<path d="M20 12a8 8 0 11-2.400-5.700M20 4v4.500h-4.500"/>'
  };
  function ic(k, cls) { return '<svg class="' + (cls || "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[k] + '</svg>'; }

  /* ============================================================
     BERANDA: bola corner
     ============================================================ */
  var orbsEl = $("cn-orbs");
  function renderOrbs() {
    if (!orbsEl) return;
    var cs = CN.cfg.corners;
    if (!cs.length) { orbsEl.innerHTML = '<p class="cn-none">Belum ada corner yang ditambahkan.</p>'; return; }
    orbsEl.innerHTML = cs.map(function (c, i) {
      var soon = c.status === "soon";
      return '<a class="cn-orb' + (soon ? " is-soon" : "") + '" href="#corner/' + esc(c.id) + '" data-a="' + esc(c.aksen) + '" style="--d:' + (-(i * 1.7)).toFixed(1) + 's" aria-label="Corner ' + esc(c.nama) + ', ' + esc(c.lengkap) + (soon ? ', segera hadir' : '') + '">' +
        '<span class="cn-sw"><i class="cn-orbit" aria-hidden="true"></i><span class="cn-sph">' + CN.icon(c.ikon) + '</span><i class="cn-gsh" aria-hidden="true"></i></span>' +
        (soon ? '<em class="cn-tag">Segera</em>' : '') + '<b>' + esc(c.nama) + '</b><small>' + esc(c.ringkas || c.lengkap) + '</small></a>';
    }).join("");
    if (window.__rv) window.__rv(orbsEl.querySelectorAll(".cn-orb"), "rv-z");
  }
  if (orbsEl) {
    orbsEl.addEventListener("pointermove", function (e) {
      var o = e.target.closest(".cn-orb"); if (!o || e.pointerType !== "mouse") return;
      var s = o.querySelector(".cn-sph"), b = s.getBoundingClientRect();
      var x = Math.max(18, Math.min(60, (e.clientX - b.left) / b.width * 100)), y = Math.max(14, Math.min(55, (e.clientY - b.top) / b.height * 100));
      s.style.setProperty("--mx", x + "%"); s.style.setProperty("--my", y + "%");
    });
    orbsEl.addEventListener("pointerout", function (e) {
      var o = e.target.closest(".cn-orb"); if (!o || o.contains(e.relatedTarget)) return;
      var s = o.querySelector(".cn-sph"); s.style.removeProperty("--mx"); s.style.removeProperty("--my");
    });
    orbsEl.addEventListener("click", function (e) {
      var o = e.target.closest(".cn-orb");
      if (!o || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault(); e.stopPropagation();
      var h = o.getAttribute("href");
      if (reduce) { location.hash = h; return; }
      o.classList.add("go");
      setTimeout(function () { o.classList.remove("go"); location.hash = h; }, 430);
    });
  }

  /* ============================================================
     HALAMAN CORNER
     ============================================================ */
  if (!app || !out) { renderOrbs(); return; }
  var S = { rows: {}, at: {}, token: 0, timer: 0, pb: { q: "", f: "all", g: "" }, cm: { f: "all", anon: false }, mx: { q: "", g: "", only: false }, fs: null };
  var TITLE0 = "";

  function getKode(c) { try { return sessionStorage.getItem("cn-kode-" + c) || ""; } catch (e) { return ""; } }
  function setKode(c, v) { try { if (v) sessionStorage.setItem("cn-kode-" + c, v); else sessionStorage.removeItem("cn-kode-" + c); } catch (e) {} }
  function slug(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "acara"; }
  function toast(msg) {
    var t = $("cn-toast");
    if (!t) { t = document.createElement("div"); t.id = "cn-toast"; t.setAttribute("role", "status"); t.style.cssText = "position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translate(-50%,30px);opacity:0;pointer-events:none;background:#0d2a38;color:#fff;border-radius:999px;padding:11px 22px;font:600 14px var(--sans);z-index:400;transition:.3s;max-width:calc(100vw - 24px);box-shadow:0 14px 30px -10px rgba(13,42,56,.6)"; document.body.appendChild(t); }
    t.textContent = msg; t.style.opacity = 1; t.style.transform = "translate(-50%,0)";
    clearTimeout(t._t); t._t = setTimeout(function () { t.style.opacity = 0; t.style.transform = "translate(-50%,30px)"; }, 2600);
  }
  function download(name, blob) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  }
  function csvCell(v) { v = String(v == null ? "" : v); if (/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
  function saveCsv(name, rows) {
    download(name, new Blob(["﻿" + rows.map(function (r) { return r.map(csvCell).join(";"); }).join("\r\n")], { type: "text/csv;charset=utf-8" }));
  }
  function leave() {
    clearInterval(S.timer); S.timer = 0; S.token++;
    if (S.fs) { S.fs.hidden = true; }
    document.removeEventListener("keydown", escFs);
  }
  function escFs(e) { if (e.key === "Escape" && S.fs && !S.fs.hidden) { S.fs.hidden = true; } }
  var out0 = out;

  /* ---------- Kerangka halaman ---------- */
  function frame(o) {
    var c = o.corner, crumb = ['<a href="#beranda">Beranda</a>', '<a href="#corner">Samasta Corner</a>'];
    (o.crumb || []).forEach(function (x) { crumb.push(x[1] ? '<a href="' + x[1] + '">' + esc(x[0]) + '</a>' : esc(x[0])); });
    $("cn-crumb").innerHTML = crumb.join(" / ");
    var mini = c ? '<span class="cn-mini" data-a="' + esc(c.aksen) + '" aria-hidden="true">' + CN.icon(c.ikon) + '</span>' : '';
    $("cn-head").innerHTML = '<div class="cn-hero2">' + mini + '<div><h1>' + esc(o.title) + '</h1><p class="sp-lead">' + (o.lead || "") + '</p></div></div>';
    var tabs = $("cn-tabs");
    if (o.tabs) {
      tabs.hidden = false;
      tabs.innerHTML = o.tabs.map(function (t) {
        return '<a class="chip" href="' + o.base + t.id + '" aria-pressed="' + (t.id === o.tab) + '"' + (t.id === o.tab ? ' aria-current="page"' : '') + '>' + (t.icon ? CN.icon(t.icon, "") : "") + esc(t.label) + '</a>';
      }).join("");
    } else { tabs.hidden = true; tabs.innerHTML = ""; }
    document.title = (o.doc || o.title) + " | BEM STDIIS";
  }
  function modeBanner(extra) {
    if (CN.mode === "remote") return "";
    if (CN.mode === "salah") return '<div class="cn-note" role="alert">' + ic("info") + '<span><b>Alamat Google Sheets belum benar.</b> Periksa <code>corner-config.js</code>: alamat harus diawali <code>https://script.google.com/macros/s/</code> dan berakhiran <code>/exec</code>.</span></div>';
    return '<div class="cn-note" role="note">' + ic("info") + '<span><b>Mode uji coba lokal.</b> Absensi belum tersambung ke Google Sheets, jadi data hanya tersimpan di peramban ini dan tidak terlihat dari HP peserta. Ikuti <code>PANDUAN-CORNER.txt</code> lalu isi <code>corner-config.js</code>.' +
      (extra || "") + '</span></div>';
  }
  function notFound(msg) {
    frame({ title: "Tidak ditemukan", lead: esc(msg || "Halaman corner yang kamu tuju tidak ada."), crumb: [["Tidak ditemukan"]] });
    out.innerHTML = '<div class="cn-empty"><b>Halaman tidak ditemukan</b>Kembali ke <a class="cn-link" href="#corner">Samasta Corner</a> untuk memilih corner lain.</div>';
  }

  /* ---------- Data dan kunci ---------- */
  function load(c, force) {
    if (!force && S.rows[c] && Date.now() - S.at[c] < 15000) return Promise.resolve(S.rows[c]);
    return CN.api.data(c, getKode(c)).then(function (r) { S.rows[c] = r; S.at[c] = Date.now(); return r; });
  }
  function skeleton() { out.innerHTML = '<div class="cn-skel"></div><div class="cn-skel" style="height:240px"></div>'; }
  function lockView(c, render, err) {
    var tk = S.token;
    out.innerHTML = '<div class="cn-lock cn-fadein" id="cn-lock"><div class="ic">' + CN.icon("lock", "") + '</div><h2>Area khusus ' + esc(c.nama) + '</h2><p>Pembukuan memuat nama, NIM, dan tanggapan peserta. Masukkan kode ' + esc(c.nama) + ' untuk membukanya.</p>' +
      '<form id="cn-lf" autocomplete="off"><input type="password" id="cn-kd" placeholder="Kode ' + esc(c.nama) + '" aria-label="Kode ' + esc(c.nama) + '" autocomplete="off" required><div class="er" id="cn-er" role="alert">' + esc(err || "") + '</div>' +
      '<button class="cn-btn gold" type="submit" id="cn-lb">Buka</button></form></div>';
    var f = $("cn-lf"); $("cn-kd").focus();
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = $("cn-kd").value.trim(); if (!v) return;
      setKode(c.id, v); $("cn-lb").disabled = true; $("cn-lb").textContent = "Memeriksa...";
      load(c.id, true).then(function () { if (tk === S.token) render(S.rows[c.id]); }, function (er) {
        if (tk !== S.token) return;
        setKode(c.id, ""); var b = $("cn-lb"); if (!b) return; b.disabled = false; b.textContent = "Buka";
        $("cn-er").textContent = CN.errText(er); var l = $("cn-lock"); l.classList.remove("shake"); void l.offsetWidth; l.classList.add("shake"); $("cn-kd").select();
      });
    });
  }
  function failView(c, er, retry) {
    out.innerHTML = '<div class="cn-fail cn-fadein"><p>' + esc(CN.errText(er)) + '</p><button class="cn-btn dark" id="cn-retry">Coba lagi</button></div>';
    $("cn-retry").onclick = retry;
  }
  /* jalankan render dengan data; meminta kode bila perlu */
  function gate(c, render, force) {
    var tk = ++S.token;
    if (CN.mode === "remote" && !getKode(c.id)) return lockView(c, render);
    if (!S.rows[c.id]) skeleton();
    load(c.id, force).then(function (rows) { if (tk === S.token) render(rows); }, function (er) {
      if (tk !== S.token) return;
      if (er && (er.code === "kode" || er.code === "tunggu")) { setKode(c.id, ""); return lockView(c, render, CN.errText(er)); }
      failView(c, er, function () { gate(c, render, true); });
    });
  }

  /* ---------- Util tampilan ---------- */
  function stars(v, cls) { return '<span class="cn-stars ' + (cls || "") + '" style="--v:' + (v || 0) + '" role="img" aria-label="' + CN.num(v) + ' dari 5 bintang">★★★★★</span>'; }
  function revealBars(root) {
    function go() {
      [].forEach.call(root.querySelectorAll("[data-w]"), function (e) { e.style.width = e.getAttribute("data-w") + "%"; });
      [].forEach.call(root.querySelectorAll("[data-v]"), function (e) { e.style.setProperty("--v", e.getAttribute("data-v")); });
    }
    if (reduce) go(); else requestAnimationFrame(function () { requestAnimationFrame(go); });
  }
  function evMeta(ev) {
    var m = [];
    if (ev.tanggal) m.push(CN.dday(ev.tanggal));
    if (ev.waktu) m.push(ev.waktu);
    if (ev.tempat) m.push(ev.tempat);
    return esc(m.join("  ·  "));
  }
  function pendingEv(ev, rows) { return ev.tanggal > CN.today() && !CN.forEvent(ev, rows).length; }
  function localTools(c, ev) {
    if (CN.mode !== "lokal") return "";
    return '<div class="cn-acts cn-noprint" style="margin:-8px 0 20px">' + (ev ? '<button class="cn-btn sm" data-a="demo" data-ev="' + esc(ev.id) + '">Isi data contoh untuk acara ini</button>' : "") + '<button class="cn-btn sm red" data-a="wipe">Hapus semua data uji coba</button></div>';
  }

  /* ============================================================
     RUTE
     ============================================================ */
  window.CORNER_LEAVE = leave;
  window.CORNER_ROUTE = function (hash) {
    leave();
    var p = String(hash || "").replace(/^#corner\/?/, "").split("/").filter(Boolean).map(function (s) { try { return decodeURIComponent(s); } catch (e) { return s; } });
    var c = CN.corner(p[0]);
    if (!c) return notFound();
    if (c.status === "soon") return viewSoon(c);
    var sub = p[1];
    if (!sub) return viewHub(c);
    var menu = c.menu.filter(function (m) { return m.tipe === sub; })[0];
    if (sub === "event") {
      if (!p[2]) return viewEvents(c);
      var ev = CN.event(p[2]);
      if (!ev || ev.corner !== c.id) return notFound("Event tidak ditemukan atau sudah dihapus.");
      var tab = ["absensi", "pembukuan", "ringkasan"].indexOf(p[3]) >= 0 ? p[3] : "absensi";
      return viewEvent(c, ev, tab);
    }
    if (sub === "pembukuan") return viewMatrix(c);
    if (sub === "statistik") return viewStat(c);
    if (sub === "m" && p[2]) return viewText(c, p[2]);
    return viewHub(c);
  };
  /* klik tombol aksi umum */
  out.addEventListener("click", function (e) {
    var b = e.target.closest("[data-a]"); if (!b) return;
    var a = b.getAttribute("data-a");
    if (a === "wipe") { if (confirm("Hapus SEMUA data uji coba di peramban ini?")) CN.api.kosongkan().then(function () { S.rows = {}; toast("Data uji coba dihapus."); window.CORNER_ROUTE(location.hash); }); }
    if (a === "demo") { var ev = CN.event(b.getAttribute("data-ev")); if (ev) CN.api.contoh(ev).then(function (r) { S.rows = {}; toast("Data contoh dibuat: " + r.n + " peserta."); window.CORNER_ROUTE(location.hash); }); }
  });

  /* ---------- Segera hadir ---------- */
  function viewSoon(c) {
    frame({ corner: c, title: "Corner " + c.nama, lead: esc(c.lengkap), crumb: [[c.nama]], doc: "Corner " + c.nama });
    var word = "soooooon".split("").map(function (ch, i) { return '<span style="--i:' + i + '">' + (i === 0 ? "s" : ch) + '</span>'; }).join("");
    word = "s" + "oooooo".split("").map(function (ch, i) { return '<span style="--i:' + (i + 1) + '">o</span>'; }).join("") + "n";
    out.innerHTML = '<div class="cn-soonbox cn-fadein"><span class="cn-mini" data-a="' + esc(c.aksen) + '" aria-hidden="true">' + CN.icon(c.ikon) + '</span>' +
      '<div class="cn-cs" role="img" aria-label="Coming soon"><span class="w" style="--i:0">Coming</span><span class="w2" aria-hidden="true">' + word.replace(/^s/, '<span style="--i:0">s</span>') + '</span></div>' +
      '<p>' + esc(c.deskripsi || "Ruang digital corner ini sedang disiapkan.") + ' Pantau terus beranda untuk kabar terbarunya.</p>' +
      '<a class="cn-btn dark" href="#corner">Kembali ke Samasta Corner</a></div>';
  }

  /* ---------- Hub menu ---------- */
  function viewHub(c) {
    frame({ corner: c, title: "Corner " + c.nama, lead: esc(c.deskripsi || c.lengkap), crumb: [[c.nama]], doc: "Corner " + c.nama });
    var evs = CN.events(c.id);
    var cards = c.menu.map(function (m) {
      var href = m.tipe === "tautan" ? (m.url || "#") : m.tipe === "teks" ? "#corner/" + c.id + "/m/" + m.id : "#corner/" + c.id + "/" + m.tipe;
      var ext = m.tipe === "tautan" && /^https?:/i.test(href);
      var def = { event: "calendar", pembukuan: "book", statistik: "chart", tautan: "link", teks: "text" }[m.tipe];
      var meta = m.tipe === "event" ? '<span class="cn-meta"><i>' + evs.length + ' event</i>' + (evs.filter(function (e) { return e.buka; }).length ? '<i class="ok">' + evs.filter(function (e) { return e.buka; }).length + ' absensi dibuka</i>' : "") + '</span>' : "";
      return '<a class="cn-mcard" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + '><span class="cn-mic">' + CN.icon(m.ikon || def, "") + '</span><h3>' + esc(m.judul) + '</h3><p>' + esc(m.ket) + '</p>' + meta + '<span class="cn-go">' + (ext ? "Buka tautan" : "Masuk") + ic("arr") + '</span></a>';
    }).join("");
    out.innerHTML = modeBanner() + (cards ? '<div class="cn-menu cn-fadein">' + cards + '</div>' : '<div class="cn-empty"><b>Belum ada menu</b>Tambahkan menu untuk corner ini lewat admin-corner.html.</div>');
  }

  /* ---------- Teks ---------- */
  function viewText(c, id) {
    var m = c.menu.filter(function (x) { return x.id === id; })[0];
    if (!m) return notFound("Menu tidak ditemukan.");
    frame({ corner: c, title: m.judul, lead: esc(m.ket), crumb: [[c.nama, "#corner/" + c.id], [m.judul]], doc: m.judul + " " + c.nama });
    out.innerHTML = '<div class="cn-box cn-fadein" style="max-width:760px">' + String(m.isi || "").split(/\n{2,}/).map(function (t) { return '<p style="margin-bottom:14px;line-height:1.75">' + esc(t).replace(/\n/g, "<br>") + '</p>'; }).join("") + '</div>';
  }

  /* ---------- Daftar event ---------- */
  function viewEvents(c) {
    var evs = CN.events(c.id), t = CN.today();
    frame({ corner: c, title: "Event " + c.nama, lead: "Pilih event untuk membuka kode QR absensi, pembukuan kehadiran, atau ringkasan penilaian.", crumb: [[c.nama, "#corner/" + c.id], ["Event"]], doc: "Event " + c.nama });
    var list = evs.map(function (e) {
      var p = CN.dparts(e.tanggal) || { d: "?", m: 0 };
      return '<a class="cn-evc" href="#corner/' + esc(c.id) + '/event/' + esc(e.id) + '/absensi"><div class="cn-dt"><b>' + p.d + '</b><span>' + CN.MONS[p.m] + '</span></div><div><h3>' + esc(e.judul) + '</h3><div class="cn-meta">' +
        (e.waktu ? '<i>' + esc(e.waktu) + '</i>' : "") + (e.tempat ? '<i>' + esc(e.tempat) + '</i>' : "") + (e.tanggal > t ? '<i>Akan datang</i>' : "") +
        '<i class="' + (e.buka ? "ok" : "off") + '">Absensi ' + (e.buka ? "dibuka" : "ditutup") + '</i></div></div>' + ic("arr", "arr") + '</a>';
    }).join("");
    out.innerHTML = modeBanner() + (list ? '<div class="cn-evs cn-fadein">' + list + '</div>' :
      '<div class="cn-empty"><b>Belum ada event</b>Tambahkan event lewat <a class="cn-link" href="admin-corner.html">admin-corner.html</a>, unduh <code>corner-data.js</code>, lalu unggah ke GitHub.</div>');
  }

  /* ---------- Satu event: tab absensi, pembukuan, ringkasan ---------- */
  function viewEvent(c, ev, tab) {
    var base = "#corner/" + c.id + "/event/" + ev.id + "/";
    frame({
      corner: c, title: ev.judul, lead: evMeta(ev), crumb: [[c.nama, "#corner/" + c.id], ["Event", "#corner/" + c.id + "/event"], [ev.judul]], doc: ev.judul,
      tabs: [{ id: "absensi", label: "Absensi", icon: "qr" }, { id: "pembukuan", label: "Pembukuan", icon: "book" }, { id: "ringkasan", label: "Ringkasan", icon: "chart" }], tab: tab, base: base
    });
    gate(c, function (rows) { (tab === "absensi" ? tabAbsensi : tab === "pembukuan" ? tabPembukuan : tabRingkasan)(c, ev, rows); });
  }

  /* --- Absensi --- */
  function liveHTML(ev, rows) {
    var att = CN.attendance(ev, rows), pct = CN.pct(att.hadir, att.total), extra = att.extras.length;
    var recent = att.rows.slice(-6).reverse().map(function (r) {
      return '<li><span class="cn-chk">' + ic("chk") + '</span><span>' + esc(r.nama) + '<small>' + esc(r.bagian) + '</small></span><span class="t">' + CN.clock(r.t) + '</span></li>';
    }).join("");
    return { pct: pct, hadir: att.hadir, total: att.total, masuk: att.rows.length, extra: extra, recent: recent };
  }
  function tabAbsensi(c, ev, rows) {
    var url = CN.absenUrl(ev.id), svg = QR.svg(url, { margin: 4, fg: "#0d2a38", label: "Kode QR absensi " + ev.judul }), L = liveHTML(ev, rows);
    var warn = location.protocol === "file:" ? '<div class="cn-note">' + ic("info") + '<span>Situs sedang dibuka dari file di komputer, jadi alamat QR tidak bisa dipindai HP. Buka lewat alamat web (GitHub Pages) atau isi <b>Alamat dasar situs</b> di admin-corner.html.</span></div>' : "";
    out.innerHTML = modeBanner() + warn + localTools(c, ev) +
      '<div class="cn-abs cn-fadein"><div class="cn-qrcard"><div class="cn-qrframe' + (ev.buka ? "" : " off") + '">' + svg + '</div><h3>' + esc(ev.judul) + '</h3><p>' + (ev.buka ? "Pindai kode ini untuk mengisi absensi dan penilaian acara." : "Absensi ditutup. Kode QR tidak akan menerima isian baru.") + '</p></div>' +
      '<div class="cn-side">' +
        '<div class="cn-pnl"><h4>Kehadiran langsung <button class="cn-btn sm" data-q="reload">' + ic("ref") + 'Muat ulang</button></h4><div class="cn-live"><div class="cn-donutw"><div class="cn-donut" id="cn-dn" style="--v:' + L.pct + '"></div><span><b id="cn-dp">' + L.pct + '%</b><small>hadir</small></span></div>' +
        '<div class="cn-live-t"><b id="cn-dc">' + L.hadir + ' dari ' + L.total + '</b><span><i class="cn-pulse' + (ev.buka ? "" : " off") + '"></i>Absensi ' + (ev.buka ? "dibuka" : "ditutup") + '</span><span id="cn-dx">' + (L.extra ? "+" + L.extra + " hadir di luar daftar pengurus" : "Diperbarui otomatis tiap 15 detik") + '</span></div></div></div>' +
        '<div class="cn-pnl"><h4>Tautan formulir</h4><div class="cn-linkbox"><input id="cn-url" readonly value="' + esc(url) + '" aria-label="Tautan formulir absensi"><button class="cn-btn sm dark" data-q="copy">' + ic("copy") + 'Salin</button></div>' +
        '<div class="cn-acts" style="margin-top:14px"><a class="cn-btn gold" href="' + esc(url) + '" target="_blank" rel="noopener">' + ic("link") + 'Buka formulir</a><button class="cn-btn" data-q="full">' + ic("full") + 'Layar penuh</button><button class="cn-btn" data-q="png">' + ic("dl") + 'Unduh PNG</button><button class="cn-btn" data-q="print">' + ic("print") + 'Cetak poster</button></div>' +
        '<p class="cn-tip" style="margin-top:12px">Buka atau tutup absensi lewat <a class="cn-link" href="admin-corner.html">admin-corner.html</a>.</p></div>' +
        '<div class="cn-pnl"><h4>Masuk terbaru</h4><ul class="cn-recent" id="cn-rc">' + (L.recent || '<li style="grid-template-columns:1fr;color:#5b5a48">Belum ada yang mengisi.</li>') + '</ul></div>' +
      '</div></div>';
    var cur = rows;
    function paint(rs) {
      cur = rs; var l = liveHTML(ev, rs);
      if (!$("cn-dn")) return;
      $("cn-dn").style.setProperty("--v", l.pct); $("cn-dp").textContent = l.pct + "%"; $("cn-dc").textContent = l.hadir + " dari " + l.total;
      $("cn-dx").textContent = l.extra ? "+" + l.extra + " hadir di luar daftar pengurus" : "Diperbarui otomatis tiap 15 detik";
      $("cn-rc").innerHTML = l.recent || '<li style="grid-template-columns:1fr;color:#5b5a48">Belum ada yang mengisi.</li>';
      if (S.fs && !S.fs.hidden) { var n = S.fs.querySelector(".n"); if (n) n.textContent = l.hadir + " dari " + l.total + " hadir"; }
    }
    function reload(manual) {
      load(c.id, true).then(function (rs) { paint(rs); if (manual) toast("Data diperbarui."); }, function (er) { if (manual) toast(CN.errText(er)); });
    }
    S.timer = setInterval(function () { if (!document.hidden && !app.hidden) reload(false); }, 15000);
    var tk = S.token;
    out.onclick = function (e) {
      var b = e.target.closest("[data-q]"); if (!b || tk !== S.token) return;
      var q = b.getAttribute("data-q");
      if (q === "reload") reload(true);
      if (q === "copy") {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast("Tautan disalin."); }, function () { $("cn-url").select(); toast("Salin manual dengan Ctrl+C."); });
        else { $("cn-url").select(); try { document.execCommand("copy"); toast("Tautan disalin."); } catch (x) { toast("Salin manual dengan Ctrl+C."); } }
      }
      if (q === "png") qrPng(url, ev);
      if (q === "print") printPoster(url, ev);
      if (q === "full") fullscreen(url, ev, cur);
    };
  }
  function qrPng(url, ev) {
    var m = QR.matrix(url), n = m.size, mg = 4, sc = Math.max(4, Math.ceil(1100 / (n + mg * 2))), size = (n + mg * 2) * sc;
    var cv = document.createElement("canvas"); cv.width = cv.height = size; var x = cv.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, size, size); x.fillStyle = "#0d2a38";
    for (var yy = 0; yy < n; yy++) for (var xx = 0; xx < n; xx++) if (m.get(xx, yy)) x.fillRect((xx + mg) * sc, (yy + mg) * sc, sc, sc);
    cv.toBlob(function (b) { if (b) { download("qr-absensi-" + slug(ev.judul) + ".png", b); toast("QR diunduh."); } });
  }
  function printPoster(url, ev) {
    var el = $("cn-poster");
    if (!el) { el = document.createElement("div"); el.id = "cn-poster"; document.body.appendChild(el); }
    el.innerHTML = '<div class="pm"></div><h1>' + esc(ev.judul) + '</h1><p>' + evMeta(ev) + '</p><div class="pq">' + QR.svg(url, { margin: 3, fg: "#000" }) + '</div><p><b>Pindai kode QR ini</b> untuk mengisi absensi dan penilaian acara.</p><p class="pk">' + esc(url) + '</p>';
    document.body.classList.add("cn-printing-poster");
    var done = function () { document.body.classList.remove("cn-printing-poster"); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done); setTimeout(function () { window.print(); }, 60);
  }
  function fullscreen(url, ev, rows) {
    if (!S.fs) { S.fs = document.createElement("div"); S.fs.className = "cn-fs"; S.fs.hidden = true; S.fs.setAttribute("role", "dialog"); S.fs.setAttribute("aria-modal", "true"); document.body.appendChild(S.fs); S.fs.addEventListener("click", function (e) { if (e.target.closest(".x") || e.target === S.fs) S.fs.hidden = true; }); }
    var l = liveHTML(ev, rows);
    S.fs.innerHTML = '<button class="cn-btn x" type="button">Tutup (Esc)</button><h2>' + esc(ev.judul) + '</h2><div class="q">' + QR.svg(url, { margin: 3, fg: "#0d2a38" }) + '</div><p>Pindai untuk mengisi absensi dan penilaian</p><div class="n">' + l.hadir + ' dari ' + l.total + ' hadir</div>';
    S.fs.hidden = false; document.addEventListener("keydown", escFs);
    var x = S.fs.querySelector(".x"); if (x) x.focus();
  }

  /* --- Pembukuan per event --- */
  function tabPembukuan(c, ev, rows) {
    var att = CN.attendance(ev, rows), pend = pendingEv(ev, rows), pct = CN.pct(att.hadir, att.total);
    var groups = []; CN.groupBy(att.list, "bagian").forEach(function (g) { groups.push(g.key); });
    function listHTML() {
      var q = CN.norm(S.pb.q), f = S.pb.f, g = S.pb.g, h = "", shown = 0;
      CN.groupBy(att.list, "bagian").forEach(function (gr) {
        if (g && gr.key !== g) return;
        var items = gr.items.filter(function (x) { return (f === "all" || (f === "hadir") === x.hadir) && (!q || CN.norm(x.nama).indexOf(q) >= 0); });
        if (!items.length) return;
        shown += items.length;
        var hd = gr.items.filter(function (x) { return x.hadir; }).length;
        h += '<h3 class="cn-gh">' + esc(gr.key) + '<span>' + (pend ? gr.items.length + " orang" : hd + " dari " + gr.items.length + " hadir") + '</span></h3><div class="cn-rows">' + items.map(function (x) {
          return '<div class="cn-row' + (x.hadir ? "" : " miss") + '"><span class="' + (pend ? "cn-x" : x.hadir ? "cn-chk" : "cn-x") + '" title="' + (x.hadir ? "Hadir" : "Tidak hadir") + '">' + (pend ? '<span style="font-weight:700;font-size:15px">·</span>' : ic(x.hadir ? "chk" : "x")) + '</span><div><b>' + esc(x.nama) + (x.peran ? '<span class="cn-pill">' + esc(x.peran) + '</span>' : "") + '</b>' +
            '<small>' + (x.hadir ? "NIM " + esc(x.row.nim) + " · ★ " + CN.num(CN.rowMean(x.row)) : (pend ? "Acara belum berlangsung" : "Tidak hadir")) + '</small></div><span class="t">' + (x.hadir ? CN.clock(x.row.t) : "") + '</span>' +
            (x.hadir ? '<button class="cn-del" data-del="' + esc(x.row.id) + '" title="Hapus entri ini" aria-label="Hapus entri ' + esc(x.nama) + '">' + ic("del") + '</button>' : '<span></span>') + '</div>';
        }).join("") + '</div>';
      });
      if (!g && f !== "tidak" && att.extras.length) {
        var ex = att.extras.filter(function (r) { return !q || CN.norm(r.nama).indexOf(q) >= 0; });
        if (ex.length) { shown += ex.length; h += '<h3 class="cn-gh">Hadir di luar daftar pengurus<span>' + ex.length + ' orang</span></h3><div class="cn-rows">' + ex.map(function (r) {
          return '<div class="cn-row"><span class="cn-chk" title="Hadir">' + ic("chk") + '</span><div><b>' + esc(r.nama) + '</b><small>' + esc(r.bagian) + ' · NIM ' + esc(r.nim) + '</small></div><span class="t">' + CN.clock(r.t) + '</span><button class="cn-del" data-del="' + esc(r.id) + '" title="Hapus entri ini" aria-label="Hapus entri ' + esc(r.nama) + '">' + ic("del") + '</button></div>';
        }).join("") + '</div>'; }
      }
      return h || '<div class="cn-empty" style="margin-top:20px"><b>Tidak ada yang cocok</b>Ubah kata kunci atau filter.</div>';
    }
    out.innerHTML = modeBanner() + localTools(c, ev) +
      '<div class="cn-sum cn-fadein"><div class="cn-kpi ok"><small>Hadir</small><b>' + att.hadir + ' <em>dari ' + att.total + '</em></b><div class="bar"><i data-w="' + pct + '"></i></div></div>' +
      '<div class="cn-kpi no"><small>Tidak hadir</small><b>' + (pend ? "-" : att.total - att.hadir) + '</b></div><div class="cn-kpi"><small>Persentase</small><b>' + (pend ? "-" : pct + "%") + '</b></div>' +
      '<div class="cn-kpi"><small>Di luar daftar</small><b>' + att.extras.length + '</b></div></div>' +
      '<div class="cn-ctl cn-noprint"><label class="grow"><input type="search" id="pb-q" placeholder="Cari nama" aria-label="Cari nama" value="' + esc(S.pb.q) + '"></label>' +
      '<div class="cn-seg" role="group" aria-label="Filter status"><button type="button" data-f="all" aria-pressed="' + (S.pb.f === "all") + '">Semua</button><button type="button" data-f="hadir" aria-pressed="' + (S.pb.f === "hadir") + '">Hadir</button><button type="button" data-f="tidak" aria-pressed="' + (S.pb.f === "tidak") + '">Tidak hadir</button></div>' +
      '<select id="pb-g" aria-label="Filter bagian"><option value="">Semua bagian</option>' + groups.map(function (g) { return '<option' + (S.pb.g === g ? " selected" : "") + '>' + esc(g) + '</option>'; }).join("") + '</select>' +
      '<button class="cn-btn sm" id="pb-csv">' + ic("dl") + 'Unduh CSV</button><button class="cn-btn sm" id="pb-pr">' + ic("print") + 'Cetak</button></div>' +
      '<div id="pb-l">' + listHTML() + '</div>';
    revealBars(out);
    function redraw() { $("pb-l").innerHTML = listHTML(); }
    var t; $("pb-q").addEventListener("input", function (e) { clearTimeout(t); var v = e.target.value; t = setTimeout(function () { S.pb.q = v; redraw(); }, 120); });
    $("pb-g").addEventListener("change", function (e) { S.pb.g = e.target.value; redraw(); });
    [].forEach.call(out.querySelectorAll(".cn-seg button"), function (b) { b.addEventListener("click", function () { S.pb.f = b.getAttribute("data-f"); [].forEach.call(out.querySelectorAll(".cn-seg button"), function (x) { x.setAttribute("aria-pressed", x === b); }); redraw(); }); });
    $("pb-pr").onclick = function () { window.print(); };
    $("pb-csv").onclick = function () {
      var r = [["Event", "Tanggal", "Bagian", "Nama", "Status", "Waktu isi", "NIM", "Rata-rata nilai"]];
      att.list.forEach(function (x) { r.push([ev.judul, ev.tanggal, x.bagian, x.nama, pend ? "Belum berlangsung" : x.hadir ? "Hadir" : "Tidak hadir", x.hadir ? CN.stamp(x.row.t) : "", x.hadir ? x.row.nim : "", x.hadir ? CN.num(CN.rowMean(x.row), 2) : ""]); });
      att.extras.forEach(function (x) { r.push([ev.judul, ev.tanggal, x.bagian, x.nama, "Hadir (di luar daftar)", CN.stamp(x.t), x.nim, CN.num(CN.rowMean(x), 2)]); });
      saveCsv("pembukuan-" + slug(ev.judul) + ".csv", r); toast("CSV diunduh.");
    };
    var tk = S.token;
    out.onclick = function (e) {
      var d = e.target.closest("[data-del]"); if (!d || tk !== S.token) return;
      var row = rows.filter(function (r) { return r.id === d.getAttribute("data-del"); })[0];
      if (!row || !confirm("Hapus entri " + row.nama + " dari pembukuan?\nTindakan ini tidak bisa dibatalkan.")) return;
      CN.api.hapus(c.id, getKode(c.id), row.id).then(function () { S.rows[c.id] = rows.filter(function (r) { return r.id !== row.id; }); S.at[c.id] = Date.now(); toast("Entri dihapus."); tabPembukuan(c, ev, S.rows[c.id]); }, function (er) { toast(CN.errText(er)); });
    };
  }

  /* --- Ringkasan --- */
  function tabRingkasan(c, ev, rows) {
    var sm = CN.summary(ev, rows), att = CN.attendance(ev, rows), A = CN.cfg.aspek, pend = pendingEv(ev, rows);
    if (!sm.n) {
      out.innerHTML = modeBanner() + localTools(c, ev) + '<div class="cn-empty cn-fadein"><b>' + (pend ? "Acara belum berlangsung" : "Belum ada yang mengisi") + '</b>Ringkasan terbentuk otomatis begitu peserta mengisi formulir absensi dan penilaian.</div>';
      return;
    }
    var hl = sm.headline, pct = CN.pct(att.hadir, att.total);
    var narr = 'Acara ini dinilai <b>' + CN.predikat(hl).toLowerCase() + '</b> oleh <b>' + sm.n + ' peserta</b>' + (sm.utama ? ' (' + esc(sm.utama.label.toLowerCase()) + ' ' + CN.num(hl) + ' dari 5)' : '') + '. ' +
      'Kehadiran pengurus <b>' + att.hadir + ' dari ' + att.total + '</b> (' + pct + '%).' +
      (sm.best ? ' Aspek tertinggi: <b>' + esc(sm.best.label) + '</b> (' + CN.num(sm.avg[sm.best.id]) + '), terendah: <b>' + esc(sm.worst.label) + '</b> (' + CN.num(sm.avg[sm.worst.id]) + ').' : '') +
      ' ' + sm.kritik.length + ' peserta menyampaikan kritik atau saran dan ' + sm.komentar.length + ' memberi komentar.';
    var bars = A.map(function (a) {
      var v = sm.avg[a.id], tag = sm.best && a.id === sm.best.id ? '<em>Tertinggi</em>' : sm.worst && a.id === sm.worst.id ? '<em class="lo">Perlu perhatian</em>' : "";
      return '<div class="r"><div class="l">' + esc(a.label) + (tag ? "<br>" + tag : "") + '</div><div class="t" role="img" aria-label="' + esc(a.label) + ': ' + CN.num(v) + ' dari 5"><i class="' + (a.utama ? "gold" : "") + '" data-w="' + (v == null ? 0 : v / 5 * 100) + '"></i></div><div class="v">' + CN.num(v) + '</div></div>';
    }).join("");
    var mx = Math.max(1, sm.dist[1], sm.dist[2], sm.dist[3], sm.dist[4], sm.dist[5]), dist = [5, 4, 3, 2, 1].map(function (k) {
      return '<div class="r"><div class="l">' + k + ' bintang</div><div class="t"><i class="' + (k >= 4 ? "" : k === 3 ? "gold" : "dk") + '" data-w="' + (sm.dist[k] / mx * 100) + '"></i></div><div class="v">' + sm.dist[k] + '</div></div>';
    }).join("");
    var byG = CN.groupBy(att.list, "bagian").map(function (g) {
      var h = g.items.filter(function (x) { return x.hadir; }).length, n = g.items.length;
      return '<div class="r"><div class="l">' + esc(g.key) + '</div><div class="cn-split" role="img" aria-label="' + h + ' dari ' + n + ' hadir"><i class="a" data-w="' + (h / n * 100) + '"></i><i class="b" data-w="' + ((n - h) / n * 100) + '"></i></div><div class="v">' + h + '/' + n + '</div></div>';
    }).join("");
    out.innerHTML = modeBanner() + localTools(c, ev) +
      '<div class="cn-acts cn-noprint" style="justify-content:flex-end;margin-bottom:14px"><button class="cn-btn sm" id="rg-csv">' + ic("dl") + 'Unduh CSV tanggapan</button><button class="cn-btn sm" id="rg-pr">' + ic("print") + 'Cetak atau simpan PDF</button></div>' +
      '<div class="cn-sgrid cn-fadein"><div class="cn-box"><h3>Skor kepuasan</h3><p class="sub">Dari ' + sm.n + ' penilaian peserta</p><div class="cn-hl"><div class="cn-score" data-v="' + (hl || 0) + '" style="--v:0"><i class="rg"></i><span><b>' + CN.num(hl) + '</b><small>dari 5</small></span></div>' +
        '<div><div class="cn-pred">' + CN.predikat(hl) + '</div>' + stars(hl) + '<p style="font-size:13.5px;color:var(--muted);margin-top:8px">Rata-rata semua aspek: <b style="color:var(--ink)">' + CN.num(sm.meanAll) + '</b></p></div></div><p class="cn-narr">' + narr + '</p></div>' +
      '<div class="cn-box"><h3>Sebaran bintang</h3><p class="sub">' + (sm.utama ? esc(sm.utama.label) : "Rata-rata tiap peserta") + '</p><div class="cn-bars">' + dist + '</div></div></div>' +
      '<div class="cn-sgrid"><div class="cn-box"><h3>Penilaian per aspek</h3><p class="sub">Rata-rata bintang dari 1 sampai 5</p><div class="cn-bars">' + bars + '</div><div class="cn-axis" aria-hidden="true"><i></i><span><i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i></span><i></i></div></div>' +
      '<div class="cn-box"><h3>Kehadiran per bagian</h3><p class="sub">' + att.hadir + ' dari ' + att.total + ' pengurus hadir (' + pct + '%)</p><div class="cn-bars">' + byG + '</div><div class="cn-leg"><span><i class="a"></i>Hadir</span><span><i class="b"></i>Tidak hadir</span></div></div></div>' +
      '<div class="cn-box"><h3>Komentar, kritik, dan saran</h3><p class="sub" id="cm-sub"></p><div class="cn-ctl cn-noprint" style="margin-bottom:6px"><div class="cn-seg" role="group" aria-label="Filter tanggapan">' +
        [["all", "Semua"], ["kritik", "Kritik dan saran"], ["komentar", "Komentar"], ["rendah", "Nilai rendah"]].map(function (x) { return '<button type="button" data-f="' + x[0] + '" aria-pressed="' + (S.cm.f === x[0]) + '">' + x[1] + '</button>'; }).join("") +
        '</div><label class="cn-sw-name"><input type="checkbox" id="cm-an"' + (S.cm.anon ? " checked" : "") + '>Anonimkan nama</label></div><div class="cn-cmt" id="cm-l"></div></div>';
    revealBars(out);
    var sc = out.querySelector(".cn-score"); if (sc) { sc.style.setProperty("--v", 0); setTimeout(function () { sc.style.setProperty("--v", sc.getAttribute("data-v")); }, reduce ? 0 : 60); }
    function cm() {
      var items = [];
      sm.rows.forEach(function (r) {
        var rm = CN.rowMean(r), low = rm != null && rm < 3.5;
        if (r.kritik) items.push({ k: "kritik", r: r, txt: r.kritik, low: low, rm: rm });
        if (r.komentar) items.push({ k: "komentar", r: r, txt: r.komentar, low: low, rm: rm });
      });
      var f = S.cm.f; items = items.filter(function (x) { return f === "all" || (f === "rendah" ? x.low : x.k === f); }).reverse();
      $("cm-sub").textContent = items.length + " tanggapan" + (f === "all" ? "" : " pada filter ini") + ", terbaru di atas.";
      $("cm-l").innerHTML = items.length ? items.map(function (x) {
        return '<article class="cn-c ' + (x.k === "kritik" ? "k" : "m") + '"><p>' + esc(x.txt) + '</p><div class="by"><span class="kind">' + (x.k === "kritik" ? "Kritik dan saran" : "Komentar") + '</span><b>' + (S.cm.anon ? "Anonim" : esc(x.r.nama)) + '</b>' +
          (S.cm.anon ? "" : '<span>' + esc(x.r.bagian) + '</span>') + stars(x.rm, "sm") + '<span>' + CN.stamp(x.r.t) + '</span></div></article>';
      }).join("") : '<div class="cn-empty"><b>Tidak ada tanggapan</b>Belum ada yang cocok dengan filter ini.</div>';
    }
    cm();
    [].forEach.call(out.querySelectorAll(".cn-seg button"), function (b) { b.addEventListener("click", function () { S.cm.f = b.getAttribute("data-f"); [].forEach.call(out.querySelectorAll(".cn-seg button"), function (x) { x.setAttribute("aria-pressed", x === b); }); cm(); }); });
    $("cm-an").addEventListener("change", function (e) { S.cm.anon = e.target.checked; cm(); });
    $("rg-pr").onclick = function () { window.print(); };
    $("rg-csv").onclick = function () {
      var h = ["Waktu", "Nama", "NIM", "Bagian"].concat(A.map(function (a) { return a.label; })).concat(["Rata-rata", "Komentar", "Kritik dan saran"]), r = [h];
      sm.rows.forEach(function (x) { r.push([CN.stamp(x.t), x.nama, x.nim, x.bagian].concat(A.map(function (a) { return x.rating && x.rating[a.id] != null ? x.rating[a.id] : ""; })).concat([CN.num(CN.rowMean(x), 2), x.komentar, x.kritik])); });
      saveCsv("tanggapan-" + slug(ev.judul) + ".csv", r); toast("CSV diunduh.");
    };
    out.onclick = null;
  }

  /* ---------- Pembukuan lintas event ---------- */
  function viewMatrix(c) {
    frame({ corner: c, title: "Pembukuan " + c.nama, lead: "Rekap kehadiran seluruh pengurus pada semua kegiatan. Centang berarti hadir, silang berarti tidak hadir.", crumb: [[c.nama, "#corner/" + c.id], ["Pembukuan"]], doc: "Pembukuan " + c.nama });
    gate(c, function (rows) {
      var evs = CN.events(c.id).slice().reverse(), ros = CN.roster(), t = CN.today();
      if (!evs.length) { out.innerHTML = modeBanner() + '<div class="cn-empty"><b>Belum ada event</b>Tambahkan event lewat admin-corner.html agar pembukuan terisi.</div>'; return; }
      var atts = evs.map(function (e) { var a = CN.attendance(e, rows), byN = {}; a.list.forEach(function (x) { byN[CN.norm(x.nama)] = x; }); return { e: e, a: a, byN: byN, pend: pendingEv(e, rows), target: {} }; });
      atts.forEach(function (x) { CN.eventRoster(x.e).forEach(function (p) { x.target[CN.norm(p.nama)] = 1; }); });
      var groups = CN.groupBy(ros, "bagian");
      function table() {
        var q = CN.norm(S.mx.q), g = S.mx.g, only = S.mx.only, h = "", n = 0;
        var head = '<tr><th>Nama</th>' + atts.map(function (x) { return '<th><a href="#corner/' + esc(c.id) + '/event/' + esc(x.e.id) + '/pembukuan" title="' + esc(x.e.judul) + '"><small>' + CN.dshort(x.e.tanggal) + '</small>' + esc(x.e.judul.length > 44 ? x.e.judul.slice(0, 42) + "…" : x.e.judul) + '</a></th>'; }).join("") + '<th>Hadir</th></tr>';
        groups.forEach(function (gr) {
          if (g && gr.key !== g) return;
          var rowsH = "";
          gr.items.forEach(function (p) {
            var k = CN.norm(p.nama); if (q && k.indexOf(q) < 0) return;
            var tot = 0, hd = 0, miss = 0, cells = atts.map(function (x) {
              if (!x.target[k]) return '<td class="dot" title="Bukan sasaran acara">·</td>';
              if (x.pend) return '<td class="dot" title="Belum berlangsung">·</td>';
              tot++; var r = x.byN[k];
              if (r && r.hadir) { hd++; return '<td><span class="cn-chk" title="Hadir pukul ' + CN.clock(r.row.t) + '">' + ic("chk") + '</span></td>'; }
              miss++; return '<td><span class="cn-x" title="Tidak hadir">' + ic("x") + '</span></td>';
            }).join("");
            if (only && !miss) return;
            n++; rowsH += '<tr><td><b>' + esc(p.nama) + '</b>' + (p.peran ? '<small>' + esc(p.peran) + '</small>' : "") + '</td>' + cells + '<td class="tot">' + (tot ? hd + "/" + tot + " (" + CN.pct(hd, tot) + "%)" : "-") + '</td></tr>';
          });
          if (rowsH) h += '<tr class="g"><td colspan="' + (atts.length + 2) + '">' + esc(gr.key) + '</td></tr>' + rowsH;
        });
        var foot = '<tr><td>Hadir per acara</td>' + atts.map(function (x) { return '<td>' + (x.pend ? "-" : x.a.hadir + "/" + x.a.total) + '</td>'; }).join("") + '<td></td></tr>';
        return n ? '<table><thead>' + head + '</thead><tbody>' + h + '</tbody><tfoot>' + foot + '</tfoot></table>' : '<div class="cn-empty" style="border:0">Tidak ada nama yang cocok.</div>';
      }
      var totH = 0, totN = 0; atts.forEach(function (x) { if (!x.pend) { totH += x.a.hadir; totN += x.a.total; } });
      out.innerHTML = modeBanner() + '<div class="cn-sum cn-fadein"><div class="cn-kpi"><small>Jumlah event</small><b>' + evs.length + '</b></div><div class="cn-kpi ok"><small>Rata-rata kehadiran</small><b>' + (totN ? CN.pct(totH, totN) + "%" : "-") + '</b><div class="bar"><i data-w="' + CN.pct(totH, totN) + '"></i></div></div><div class="cn-kpi"><small>Pengurus tercatat</small><b>' + ros.length + '</b></div></div>' +
        '<div class="cn-ctl cn-noprint"><label class="grow"><input type="search" id="mx-q" placeholder="Cari nama pengurus" aria-label="Cari nama" value="' + esc(S.mx.q) + '"></label><select id="mx-g" aria-label="Filter bagian"><option value="">Semua bagian</option>' + groups.map(function (g) { return '<option' + (S.mx.g === g.key ? " selected" : "") + '>' + esc(g.key) + '</option>'; }).join("") + '</select>' +
        '<label class="cn-sw-name"><input type="checkbox" id="mx-o"' + (S.mx.only ? " checked" : "") + '>Hanya yang pernah tidak hadir</label><button class="cn-btn sm" id="mx-csv">' + ic("dl") + 'Unduh CSV</button><button class="cn-btn sm" id="mx-pr">' + ic("print") + 'Cetak</button></div>' +
        '<div class="cn-mx" id="mx-t">' + table() + '</div>';
      revealBars(out);
      function redraw() { $("mx-t").innerHTML = table(); }
      var tm; $("mx-q").addEventListener("input", function (e) { clearTimeout(tm); var v = e.target.value; tm = setTimeout(function () { S.mx.q = v; redraw(); }, 120); });
      $("mx-g").addEventListener("change", function (e) { S.mx.g = e.target.value; redraw(); });
      $("mx-o").addEventListener("change", function (e) { S.mx.only = e.target.checked; redraw(); });
      $("mx-pr").onclick = function () { window.print(); };
      $("mx-csv").onclick = function () {
        var r = [["Bagian", "Nama"].concat(atts.map(function (x) { return x.e.tanggal + " " + x.e.judul; })).concat(["Hadir", "Sasaran", "Persen"])];
        ros.forEach(function (p) {
          var k = CN.norm(p.nama), hd = 0, tot = 0, cells = atts.map(function (x) { if (!x.target[k]) return "-"; if (x.pend) return "belum"; tot++; if (x.byN[k] && x.byN[k].hadir) { hd++; return "Hadir"; } return "Tidak hadir"; });
          r.push([p.bagian, p.nama].concat(cells).concat([hd, tot, tot ? CN.pct(hd, tot) + "%" : ""]));
        });
        saveCsv("pembukuan-" + slug(c.nama) + ".csv", r); toast("CSV diunduh.");
      };
      out.onclick = null;
    });
  }

  /* ---------- Statistik lintas event ---------- */
  function lineChart(pts, o) {
    var W = Math.max(440, pts.length * 92 + 90), Hh = 250, pl = 40, pr = 22, pt = 26, pb = 52, lo = o.min, hi = o.max, iw = W - pl - pr, ih = Hh - pt - pb;
    function X(i) { return pl + (pts.length === 1 ? iw / 2 : i * iw / (pts.length - 1)); }
    function Y(v) { return pt + ih - (v - lo) / (hi - lo) * ih; }
    var g = "", k;
    for (k = lo; k <= hi + 1e-9; k += o.step) g += '<line class="gl" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(k).toFixed(1) + '" y2="' + Y(k).toFixed(1) + '"/><text x="' + (pl - 8) + '" y="' + (Y(k) + 4).toFixed(1) + '" text-anchor="end">' + o.fmt(k) + '</text>';
    var line = "", area = "", dots = "", labs = "", first = null, last = null;
    pts.forEach(function (p, i) {
      labs += '<text x="' + X(i).toFixed(1) + '" y="' + (Hh - 26) + '" text-anchor="middle">' + esc(p.x) + '</text><text x="' + X(i).toFixed(1) + '" y="' + (Hh - 11) + '" text-anchor="middle" style="font-weight:500;font-size:10.5px">' + esc(p.x2 || "") + '</text>';
      if (p.y == null) return;
      var x = X(i).toFixed(1), y = Y(p.y).toFixed(1);
      line += (line ? "L" : "M") + x + " " + y; if (first == null) first = x; last = x;
      dots += '<circle class="dt" cx="' + x + '" cy="' + y + '" r="5"><title>' + esc(p.tip) + '</title></circle><text class="vl" x="' + x + '" y="' + (Y(p.y) - 11).toFixed(1) + '" text-anchor="middle">' + o.fmt(p.y) + '</text>';
    });
    if (line && first !== last) area = '<path class="ar" d="' + line + 'L' + last + ' ' + (pt + ih) + 'L' + first + ' ' + (pt + ih) + 'Z"/>';
    return '<div class="cn-scroll"><svg class="cn-chart" style="--mw:' + W + 'px" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + esc(o.label) + '"><title>' + esc(o.label) + '</title><defs><linearGradient id="cnar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14705a" stop-opacity=".28"/><stop offset="1" stop-color="#14705a" stop-opacity="0"/></linearGradient></defs>' + g + area + (line ? '<path class="ln" d="' + line + '"/>' : "") + dots + labs + '</svg></div>';
  }
  function barChart(pts, o) {
    var W = Math.max(440, pts.length * 92 + 90), Hh = 250, pl = 40, pr = 22, pt = 26, pb = 52, iw = W - pl - pr, ih = Hh - pt - pb, bw = Math.min(46, iw / pts.length * 0.56), g = "", b = "", k;
    function Y(v) { return pt + ih - v / o.max * ih; }
    for (k = 0; k <= o.max; k += o.step) g += '<line class="gl" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(k).toFixed(1) + '" y2="' + Y(k).toFixed(1) + '"/><text x="' + (pl - 8) + '" y="' + (Y(k) + 4).toFixed(1) + '" text-anchor="end">' + k + '%</text>';
    pts.forEach(function (p, i) {
      var cx = pl + iw / pts.length * (i + 0.5), y = Y(p.y);
      b += '<rect class="cn-bar ' + (o.cls || "") + '" x="' + (cx - bw / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, pt + ih - y).toFixed(1) + '" rx="6"><title>' + esc(p.tip) + '</title></rect><text class="vl" x="' + cx.toFixed(1) + '" y="' + (y - 7).toFixed(1) + '" text-anchor="middle">' + p.y + '%</text>' +
        '<text x="' + cx.toFixed(1) + '" y="' + (Hh - 26) + '" text-anchor="middle">' + esc(p.x) + '</text><text x="' + cx.toFixed(1) + '" y="' + (Hh - 11) + '" text-anchor="middle" style="font-weight:500;font-size:10.5px">' + esc(p.x2 || "") + '</text>';
    });
    return '<div class="cn-scroll"><svg class="cn-chart" style="--mw:' + W + 'px" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="' + esc(o.label) + '"><title>' + esc(o.label) + '</title>' + g + b + '</svg></div>';
  }
  function viewStat(c) {
    frame({ corner: c, title: "Statistik " + c.nama, lead: "Tren kepuasan dan kehadiran dari kegiatan ke kegiatan.", crumb: [[c.nama, "#corner/" + c.id], ["Statistik"]], doc: "Statistik " + c.nama });
    gate(c, function (rows) {
      var evs = CN.events(c.id).slice().reverse().filter(function (e) { return !pendingEv(e, rows); });
      if (!evs.length) { out.innerHTML = modeBanner() + '<div class="cn-empty"><b>Belum ada data</b>Statistik muncul setelah ada event yang berlangsung dan diisi peserta.</div>'; return; }
      var st = evs.map(function (e) { return { e: e, a: CN.attendance(e, rows), s: CN.summary(e, rows) }; });
      var sc = st.filter(function (x) { return x.s.headline != null; }), allH = 0, allN = 0, A = CN.cfg.aspek, tot = {}, cnt = {};
      st.forEach(function (x) { allH += x.a.hadir; allN += x.a.total; });
      A.forEach(function (a) { var v = []; st.forEach(function (x) { if (x.s.avg[a.id] != null) v.push(x.s.avg[a.id]); }); tot[a.id] = CN.mean(v); });
      var avgScore = CN.mean(sc.map(function (x) { return x.s.headline; })), short = function (e) { return CN.dshort(e.tanggal); };
      var lineP = st.map(function (x) { return { x: short(x.e), x2: x.e.judul.length > 14 ? x.e.judul.slice(0, 13) + "…" : x.e.judul, y: x.s.headline, tip: x.e.judul + ": " + CN.num(x.s.headline) + " dari 5" }; });
      var barP = st.map(function (x) { return { x: short(x.e), x2: x.e.judul.length > 14 ? x.e.judul.slice(0, 13) + "…" : x.e.judul, y: CN.pct(x.a.hadir, x.a.total), tip: x.e.judul + ": " + x.a.hadir + " dari " + x.a.total + " hadir" }; });
      var bars = A.map(function (a) { return '<div class="r"><div class="l">' + esc(a.label) + '</div><div class="t"><i class="' + (a.utama ? "gold" : "") + '" data-w="' + (tot[a.id] == null ? 0 : tot[a.id] / 5 * 100) + '"></i></div><div class="v">' + CN.num(tot[a.id]) + '</div></div>'; }).join("");
      var tbl = st.slice().reverse().map(function (x) {
        return '<tr><td><a class="cn-link" href="#corner/' + esc(c.id) + '/event/' + esc(x.e.id) + '/ringkasan">' + esc(x.e.judul) + '</a><small style="display:block;color:var(--muted)">' + CN.dlong(x.e.tanggal) + '</small></td><td>' + x.a.hadir + '/' + x.a.total + ' (' + CN.pct(x.a.hadir, x.a.total) + '%)</td><td>' + (x.s.headline == null ? "-" : CN.num(x.s.headline) + " ★") + '</td><td>' + x.s.kritik.length + '</td></tr>';
      }).join("");
      out.innerHTML = modeBanner() + '<div class="cn-sum cn-fadein"><div class="cn-kpi"><small>Event berlangsung</small><b>' + st.length + '</b></div><div class="cn-kpi ok"><small>Rata-rata kehadiran</small><b>' + CN.pct(allH, allN) + '%</b><div class="bar"><i data-w="' + CN.pct(allH, allN) + '"></i></div></div><div class="cn-kpi"><small>Rata-rata kepuasan</small><b>' + CN.num(avgScore) + ' <em>dari 5</em></b></div><div class="cn-kpi"><small>Tanggapan masuk</small><b>' + st.reduce(function (n, x) { return n + x.s.n; }, 0) + '</b></div></div>' +
        '<div class="cn-sgrid"><div class="cn-box"><h3>Tren kepuasan</h3><p class="sub">Skor ' + esc(CN.utama() ? CN.utama().label.toLowerCase() : "rata-rata") + ' tiap event (1 sampai 5)</p>' + lineChart(lineP, { min: 1, max: 5, step: 1, fmt: function (v) { return CN.num(v, v % 1 ? 1 : 0); }, label: "Tren skor kepuasan per event" }) + '</div>' +
        '<div class="cn-box"><h3>Tren kehadiran</h3><p class="sub">Persentase pengurus yang hadir tiap event</p>' + barChart(barP, { max: 100, step: 25, label: "Persentase kehadiran per event" }) + '</div></div>' +
        '<div class="cn-sgrid"><div class="cn-box"><h3>Aspek penilaian</h3><p class="sub">Rata-rata dari seluruh event</p><div class="cn-bars">' + bars + '</div></div>' +
        '<div class="cn-box"><h3>Ringkasan event</h3><p class="sub">Ketuk judul untuk membuka ringkasannya</p><div class="cn-scroll"><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="text-align:left;color:var(--muted);font-size:12.5px"><th style="padding:6px 8px 8px 0">Event</th><th>Hadir</th><th>Skor</th><th>Kritik</th></tr></thead><tbody class="cn-tb">' + tbl + '</tbody></table></div></div></div>';
      [].forEach.call(out.querySelectorAll(".cn-tb td"), function (td) { td.style.cssText += ";padding:10px 8px 10px 0;border-top:1px solid var(--line);vertical-align:top"; });
      revealBars(out); out.onclick = null;
    });
  }

  renderOrbs();
})();

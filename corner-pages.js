/* corner-pages.js: dua jenis menu bawaan Samasta Corner.
   - profil  : pengertian, tugas (tab interaktif), dan struktur organisasi dinamis dari anggota.js
   - dokumen : daftar SOP milik unit (dari sop-data.js) dan buku panduan unit
   Dipanggil oleh corner-app.js. Seluruh isi dapat diedit lewat admin-corner.html. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function lines(t) { return String(t || "").split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function paras(t) { return String(t || "").split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function parseTugas(t) {
    var out = [], cur = null;
    String(t || "").split(/\n/).forEach(function (ln) {
      var x = ln.trim(); if (!x) return;
      if (/^#\s+/.test(x)) { cur = { j: x.replace(/^#\s+/, ""), d: [], b: [] }; out.push(cur); }
      else if (cur) { if (/^[-•]\s+/.test(x)) cur.b.push(x.replace(/^[-•]\s+/, "")); else cur.d.push(x); }
    });
    return out;
  }
  var CHECK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.500 10.500l3.500 3.500 7.500-8"/></svg>';

  /* ================= PROFIL ================= */
  function profil(x) {
    var c = x.c, m = x.m, esc = x.esc, out = x.out, unit = null;
    (x.A.unit || []).forEach(function (u) { if (u.nama === (m.unit || c.unit)) unit = u; });
    x.head(m.judul, m.deskripsi); x.setTitle(m.judul + " " + c.singkat);
    var tugas = parseTugas(m.tugas), pr = lines(m.prinsip);
    var h = '<nav class="cn-jump" aria-label="Loncat ke bagian"><a href="#pf-def" data-j>Pengertian</a>' + (tugas.length ? '<a href="#pf-tugas" data-j>Tugas</a>' : "") + (unit ? '<a href="#pf-org" data-j>Struktur</a>' : "") + "</nav>";

    h += '<section class="cn-pf" id="pf-def"><div class="cn-def"><div class="cn-def-l"><span class="cn-eyebrow">Pengertian</span><h2>Apa itu ' + esc(c.nama) + "?</h2>" +
      paras(m.pengertian).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
      (pr.length ? '<ul class="cn-prin">' + pr.map(function (t, i) { return '<li style="--i:' + i + '"><span class="ck">' + CHECK + "</span><span>" + esc(t) + "</span></li>"; }).join("") + "</ul>" : "") + "</div></section>";

    if (tugas.length) {
      h += '<section class="cn-pf" id="pf-tugas"><span class="cn-eyebrow">Tugas</span><h2>Apa yang dikerjakan?</h2><div class="cn-tg"><div class="cn-tg-l" role="tablist" aria-label="Fungsi utama">' +
        tugas.map(function (t, i) { return '<button type="button" role="tab" id="tg-t' + i + '" aria-controls="tg-p' + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-i="' + i + '"><b>' + (i + 1) + "</b><span>" + esc(t.j) + "</span></button>"; }).join("") +
        '</div><div class="cn-tg-r">' + tugas.map(function (t, i) {
          return '<div class="cn-tgp" role="tabpanel" id="tg-p' + i + '" aria-labelledby="tg-t' + i + '"' + (i ? " hidden" : "") + "><h3>" + esc(t.j) + "</h3>" + t.d.map(function (d) { return "<p>" + esc(d) + "</p>"; }).join("") +
            (t.b.length ? "<ul>" + t.b.map(function (b, k) { return '<li style="--k:' + k + '"><span class="ck">' + CHECK + "</span><span>" + esc(b) + "</span></li>"; }).join("") + "</ul>" : "") + "</div>";
        }).join("") + "</div></div></section>";
    }

    if (unit) {
      h += '<section class="cn-pf" id="pf-org"><span class="cn-eyebrow">Struktur</span><h2>Siapa yang bertugas?</h2><p class="cn-pf-s">Pilih salah satu kotak untuk melihat perannya.</p><div class="cn-org" id="cn-org"><svg class="cn-links" id="cn-links" aria-hidden="true"></svg>' +
        '<div class="cn-lv l0"><button type="button" class="cn-nd bph" data-k="bph" style="--d:0"><span class="av">BPH</span><b>Presiden dan Wakil Presiden</b><small>Badan Pengurus Harian BEM</small></button></div>' +
        '<div class="cn-lv l1" id="lv1"></div><div class="cn-lv l2" id="lv2"></div></div><div class="cn-nd-d" id="cn-nd-d" aria-live="polite"></div></section>';
    }
    h += x.back("#corner/" + c.id, "Kembali ke " + c.singkat);
    out.innerHTML = h;

    /* loncat bagian */
    out.querySelector(".cn-jump").addEventListener("click", function (e) {
      var a = e.target.closest("[data-j]"); if (!a) return; e.preventDefault();
      var t = document.getElementById(a.getAttribute("href").slice(1)); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    /* tab tugas (panah kiri/kanan/atas/bawah, Home, End) */
    var tl = out.querySelector(".cn-tg-l");
    if (tl) {
      var tabs = [].slice.call(tl.querySelectorAll("[role=tab]"));
      function pick(i, focus) {
        tabs.forEach(function (b, k) { var on = k === i; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; document.getElementById("tg-p" + k).hidden = !on; });
        if (focus) tabs[i].focus();
      }
      tl.addEventListener("click", function (e) { var b = e.target.closest("[role=tab]"); if (b) pick(+b.getAttribute("data-i")); });
      tl.addEventListener("keydown", function (e) {
        var i = tabs.indexOf(document.activeElement); if (i < 0) return; var n = i;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % tabs.length; else if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length; else if (e.key === "Home") n = 0; else if (e.key === "End") n = tabs.length - 1; else return;
        e.preventDefault(); pick(n, true);
      });
    }

    if (unit) org(x, unit, m);
  }

  function org(x, unit, m) {
    var esc = x.esc, ini = x.ini, ang = unit.anggota || [], head = ang[0], rest = ang.slice(1), kep = unit.jabatanKepala || "Kepala";
    var pim = (x.A.pimpinan || []).filter(function (p) { return /^(Presiden|Wakil Presiden)/.test(p.jabatan); });
    var box = document.getElementById("cn-org"), svg = document.getElementById("cn-links"), l1 = document.getElementById("lv1"), l2 = document.getElementById("lv2"), det = document.getElementById("cn-nd-d");
    var settled = false, sel = "kepala", peranK = lines(m.peranKepala), peranA = lines(m.peranAnggota);
    function node(k, nama, jab, cls, d) { return '<button type="button" class="cn-nd ' + cls + '" data-k="' + k + '" style="--d:' + d + '"><span class="av">' + esc(ini(nama)) + "</span><b>" + esc(nama) + "</b><small>" + esc(jab) + "</small></button>"; }
    l1.innerHTML = head ? node("kepala", head, kep, "kep", 1) : "";
    l2.innerHTML = rest.map(function (n, i) { return node("a" + i, n, "Anggota " + unit.nama, "ang", 2 + i * 0.4); }).join("");
    if (!head) l2.innerHTML = '<p class="cn-muted">Daftar anggota belum tersedia.</p>';

    function detail() {
      var d = "", pl = [], jab = "", nama = "", av = "";
      if (sel === "bph") { nama = pim.map(function (p) { return p.nama; }).join(" dan ") || "Pimpinan BEM"; jab = "Presiden dan Wakil Presiden BEM"; av = "BPH"; pl = ["Menerima laporan " + unit.nama + " secara berkala.", "Menerima eskalasi bila rekomendasi tidak ditindaklanjuti dalam batas waktu yang disepakati."]; }
      else if (sel === "kepala") { nama = head; jab = kep; av = ini(head); pl = peranK; }
      else { var i = +sel.slice(1); nama = rest[i]; jab = "Anggota " + unit.nama; av = ini(nama); pl = peranA; }
      det.innerHTML = '<div class="cn-nd-av">' + esc(av) + '</div><div class="cn-nd-b"><span class="cn-eyebrow">' + esc(jab) + "</span><h3>" + esc(nama) + "</h3>" + (pl.length ? "<ul>" + pl.map(function (t) { return '<li><span class="ck">' + CHECK + "</span><span>" + esc(t) + "</span></li>"; }).join("") + "</ul>" : "") + "</div>";
      det.classList.remove("pop"); void det.offsetWidth; det.classList.add("pop");
    }
    function mark() { [].forEach.call(box.querySelectorAll(".cn-nd"), function (b) { b.classList.toggle("on", b.getAttribute("data-k") === sel); b.setAttribute("aria-pressed", b.getAttribute("data-k") === sel); }); links(); }

    /* garis penghubung dihitung dari posisi nyata kotak, jadi tetap presisi di layar berapa pun */
    function links() {
      var W = box.offsetWidth, H = box.offsetHeight; svg.setAttribute("width", W); svg.setAttribute("height", H); svg.setAttribute("viewBox", "0 0 " + W + " " + H); svg.innerHTML = "";
      /* memakai offsetLeft/offsetTop (bukan getBoundingClientRect) agar tidak terpengaruh animasi masuk kotak */
      function pt(el, bottom) { var x = 0, y = 0, n = el; while (n && n !== box) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return [x + el.offsetWidth / 2, y + (bottom ? el.offsetHeight : 0)]; }
      function path(a, b, key) {
        var my = (a[1] + b[1]) / 2, p = document.createElementNS(NS, "path");
        p.setAttribute("d", "M" + a[0] + "," + a[1] + " C" + a[0] + "," + my + " " + b[0] + "," + my + " " + b[0] + "," + b[1]); p.setAttribute("class", "ln" + (key === sel || (key === "kepala" && sel !== "bph" && sel !== "kepala" && false) ? " on" : "")); p.setAttribute("pathLength", "1"); if (settled) p.classList.add("st");
        svg.appendChild(p);
      }
      var bph = box.querySelector(".bph"), kp = box.querySelector(".kep");
      if (bph && kp) path(pt(bph, true), pt(kp, false), sel === "bph" || sel === "kepala" ? sel : "-");
      if (kp) [].forEach.call(box.querySelectorAll(".ang"), function (a) { path(pt(kp, true), pt(a, false), a.getAttribute("data-k")); });
      [].forEach.call(svg.querySelectorAll(".ln"), function (p, i) { p.style.setProperty("--i", i); });
      /* jalur ke kotak terpilih menyala */
      if (sel.charAt(0) === "a") { var idx = +sel.slice(1) + 1, ps = svg.querySelectorAll(".ln"); if (ps[idx]) ps[idx].classList.add("on"); }
      if (sel === "kepala" || sel === "bph") { var p0 = svg.querySelector(".ln"); if (p0) p0.classList.add("on"); }
    }
    box.addEventListener("click", function (e) { var b = e.target.closest(".cn-nd"); if (!b) return; sel = b.getAttribute("data-k"); mark(); detail(); });
    var drawn = false;
    function show() { if (drawn) return; drawn = true; box.classList.add("in"); setTimeout(links, 30); setTimeout(function () { settled = true; }, 2200); }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es, o) { es.forEach(function (e) { if (e.isIntersecting) { show(); o.disconnect(); } }); }, { threshold: 0.25 }).observe(box); else show();
    if (window.ResizeObserver) new ResizeObserver(function () { if (drawn) links(); }).observe(box); else window.addEventListener("resize", links);
    mark(); detail();
  }

  /* ================= DOKUMEN ================= */
  function dokumen(x) {
    var c = x.c, m = x.m, esc = x.esc, out = x.out;
    x.head(m.judul, m.deskripsi); x.setTitle(m.judul + " " + c.singkat);
    var owners = String(m.pemilikSop || "").split(",").map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean), codes = String(m.kodeSop || "").split(",").map(function (t) { return t.trim().toUpperCase(); }).filter(Boolean);
    var all = window.SOP_DATA || [], list = all.filter(function (s) {
      var o = String(s.o || "").toLowerCase();
      return owners.some(function (t) { return o.indexOf(t) >= 0; }) || codes.some(function (t) { return String(s.c).toUpperCase().indexOf(t) === 0; });
    });
    list.sort(function (a, b) { return a.c < b.c ? -1 : 1; });
    var pg = m.panduan ? (window.PANDUAN || {})[m.panduan] : null, h = "";
    if (m.panduan) {
      var pages = pg && pg.p ? pg.p.length : 0, title = pg ? pg.n : c.nama;
      h += '<section class="cn-pf"><span class="cn-eyebrow">Buku panduan</span><h2>Pegangan kerja ' + esc(c.singkat) + '</h2><div class="cn-bk"><div class="cn-bk-c" aria-hidden="true"><span class="emb ik-emb"></span><em>BUKU PANDUAN</em><b>' + esc(title) + '</b><i></i></div><div class="cn-bk-t"><h3>Buku Panduan ' + esc(title) + "</h3><p>Berisi fungsi dan peran, struktur, sistem pengawasan, rapor, whistleblowing, sampai daftar periksa operasional." + (pages ? " Tebal " + pages + " halaman." : "") + '</p><div class="cn-act"><a class="btn btn-gold" href="panduan/' + esc(m.panduan) + '.pdf" target="_blank" rel="noopener">Buka PDF</a><a class="btn btn-line cn-dark" href="#panduan">Semua buku panduan</a></div></div></div></section>';
    }
    h += '<section class="cn-pf"><span class="cn-eyebrow">SOP</span><h2>Prosedur yang menjadi acuan</h2>' + (list.length ? '<div class="cn-fl"><input type="search" id="dk-q" placeholder="Cari kode atau judul SOP" aria-label="Cari SOP"><span class="cn-muted" id="dk-n">' + list.length + ' SOP</span></div><div class="cn-sops" id="dk-l"></div>' : '<div class="sp-empty">Belum ada SOP yang ditautkan ke corner ini. Atur di admin Corner: menu ini, kolom pemilik SOP.</div>') + "</section>";
    h += x.back("#corner/" + c.id, "Kembali ke " + c.singkat);
    out.innerHTML = h;
    var host = document.getElementById("dk-l"), q = document.getElementById("dk-q");
    function norm(t) { return String(t || "").toLowerCase(); }
    function draw() {
      var t = norm(q && q.value), r = list.filter(function (s) { return !t || norm(s.c + " " + s.t).indexOf(t) >= 0; });
      host.innerHTML = r.length ? r.map(function (s) { return '<a class="cn-sop" href="#sop/' + esc(s.c) + '"><span class="cd">' + esc(s.c) + "</span><b>" + esc(s.t) + '</b><small>' + esc(s.st || "") + "</small></a>"; }).join("") : '<div class="sp-empty">Tidak ada SOP yang cocok.</div>';
      document.getElementById("dk-n").textContent = r.length + " SOP";
    }
    if (host) { draw(); q.addEventListener("input", draw); }
  }

  window.CornerPages = { profil: profil, dokumen: dokumen };
})();

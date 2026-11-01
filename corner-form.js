/* corner-form.js: antarmuka imersif absensi dan penilaian (dibuka lewat scan barcode).
   Alur: sambutan > identitas > satu pertanyaan per layar > tinjau > selesai (pesan penutup + konfeti).
   Pertanyaan, wajib/opsional, dan pesan penutup diatur admin lewat admin-corner.html.
   Dipanggil oleh corner-app.js: CornerForm.open(ctx) dan CornerForm.close(). */
(function () {
  "use strict";
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var HINT = ["", "Kurang", "Cukup", "Baik", "Sangat baik", "Istimewa"];
  var STAR = "M10 1.8l2.4 5 5.5.7-4 3.8 1 5.4L10 14l-4.9 2.7 1-5.4-4-3.8 5.5-.7z";
  var root = null, sky = null, ctx0 = null;

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fill(t, v) { return String(t || "").replace(/\{(nama|event|corner)\}/g, function (_, k) { return v[k] || ""; }); }
  function starSvg(on) { return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="' + STAR + '"/></svg>'; }

  /* ================= Langit berbintang ================= */
  function startSky(cv) {
    var c = cv.getContext("2d"), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), st = [], dust = [], shoot = null, raf = 0, alive = true, tNext = 2500, lastT = 0;
    function size() {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(170, Math.round(W * H / 12000)); st = []; dust = [];
      for (var i = 0; i < n; i++) st.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.28, s: Math.random() * 1.4 + 0.5 });
      for (var j = 0; j < 22; j++) dust.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2 + 1, v: Math.random() * 10 + 6, p: Math.random() * 6.28 });
    }
    function frame(ts) {
      if (!alive) return;
      if (!reduce) raf = requestAnimationFrame(frame);
      if (document.hidden || ts - lastT < 30) return;           /* ~33 gambar/detik cukup untuk latar; sisa waktu untuk animasi kartu */
      var dt = lastT ? Math.min(0.1, (ts - lastT) / 1000) : 0.033; lastT = ts;
      c.clearRect(0, 0, W, H);
      var t = ts / 1000, i, s;
      for (i = 0; i < st.length; i++) { s = st[i]; var a = reduce ? 0.6 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p)); c.globalAlpha = a; c.fillStyle = i % 9 === 0 ? "#f8d24a" : "#fff"; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill(); }
      if (!reduce) {
        for (i = 0; i < dust.length; i++) { s = dust[i]; s.y -= s.v * dt; s.x += Math.sin(t * 0.6 + s.p) * 0.12; if (s.y < -6) { s.y = H + 6; s.x = Math.random() * W; } c.globalAlpha = 0.16 + 0.12 * Math.sin(t + s.p); c.fillStyle = "#f8d24a"; c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill(); }
        tNext -= dt * 1000; if (tNext < 0 && !shoot) { shoot = { x: Math.random() * W * 0.8 + W * 0.1, y: Math.random() * H * 0.35, l: 0 }; tNext = 5500 + Math.random() * 5000; }
        if (shoot) {
          shoot.l += dt * 1.05; var gx = shoot.x + shoot.l * 260, gy = shoot.y + shoot.l * 130, g = c.createLinearGradient(shoot.x + shoot.l * 160, shoot.y + shoot.l * 80, gx, gy);
          g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(255,244,190,.95)"); c.globalAlpha = Math.max(0, 1 - shoot.l); c.strokeStyle = g; c.lineWidth = 1.6; c.beginPath(); c.moveTo(shoot.x + shoot.l * 160, shoot.y + shoot.l * 80); c.lineTo(gx, gy); c.stroke();
          if (shoot.l > 1) shoot = null;
        }
      }
      c.globalAlpha = 1;
    }
    size(); raf = requestAnimationFrame(frame);
    window.addEventListener("resize", size);
    return { stop: function () { alive = false; cancelAnimationFrame(raf); window.removeEventListener("resize", size); } };
  }

  /* ================= Konfeti ================= */
  function confetti(host) {
    if (reduce) return;
    var cv = document.createElement("canvas"); cv.className = "cf-conf"; host.appendChild(cv);
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr;
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var cols = ["#f8d24a", "#ffe98a", "#fbf6e6", "#43b99a", "#1f7d66", "#ffffff"], ps = [], i;
    for (i = 0; i < 150; i++) {
      var side = i % 2 ? 1 : -1, ang = -Math.PI / 2 + side * (0.25 + Math.random() * 0.8), sp = 9 + Math.random() * 11;
      ps.push({ x: W / 2 + side * W * 0.12, y: H * 0.62, vx: Math.cos(ang) * sp * 0.9, vy: Math.sin(ang) * sp, w: 6 + Math.random() * 7, h: 3 + Math.random() * 5, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, c: cols[i % cols.length], star: i % 7 === 0 });
    }
    var t0 = performance.now(), raf;
    (function loop(ts) {
      var dt = Math.min(0.04, (ts - (loop.l || ts)) / 1000); loop.l = ts; c.clearRect(0, 0, W, H); var life = (ts - t0) / 1000;
      ps.forEach(function (p) {
        p.vy += 22 * dt; p.vx *= 0.992; p.vy *= 0.992; p.x += p.vx * dt * 60 * 0.6; p.y += p.vy * dt * 60 * 0.6; p.r += p.vr;
        c.save(); c.globalAlpha = Math.max(0, Math.min(1, 1.6 - life / 2.4)); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c;
        if (p.star) { c.scale(p.w / 20, p.w / 20); c.translate(-10, -10); c.fill(new Path2D(STAR)); } else c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        c.restore();
      });
      if (life < 3.2) raf = requestAnimationFrame(loop); else cv.remove();
    })(t0);
  }

  /* ================= Utama ================= */
  function open(x) {
    close(); ctx0 = x;
    var c = x.c, ev = x.ev, soal = x.soal, A = x.A, t = x.tone || {};
    var S = { step: 0, nama: "", nim: "", bagian: "", lain: false, ans: {}, busy: false, done: false };
    var steps = ["welcome", "id"].concat(soal.map(function (q, i) { return "q" + i; }), ["review", "done"]);
    var tone = "--o1:" + t.o1 + ";--o2:" + t.o2 + ";--o3:" + t.o3 + ";--ot:" + t.ot + ";--oa:" + t.oa + ";--i:0";
    var emblem = '<span class="cn-ball cf-emb" style="' + tone + '"><span class="cn-orbit o1" aria-hidden="true"><i></i></span><span class="cn-orbit o2" aria-hidden="true"><i></i></span><span class="cn-sph">' + window.CORNER_ORB_SVG(c.ikon || "bintang") + '<span class="cn-gl" aria-hidden="true"></span></span><span class="cn-spk s1"></span><span class="cn-spk s2"></span><span class="cn-spk s3"></span><span class="cn-shd"></span></span>';

    root = document.createElement("div"); root.className = "cf"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Absensi dan penilaian " + ev.judul);
    root.innerHTML = '<canvas class="cf-sky" aria-hidden="true"></canvas><div class="cf-aur a1" aria-hidden="true"></div><div class="cf-aur a2" aria-hidden="true"></div><div class="cf-arch" aria-hidden="true"><i></i></div>' +
      '<header class="cf-top"><span></span>' +
      '<div class="cf-brand"><span class="emb" aria-hidden="true"></span><span><b>Samasta Corner</b><small>' + esc(c.nama) + '</small></span></div></header>' +
      '<div class="cf-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div>' +
      '<main class="cf-main"><section class="cf-card" id="cf-card" tabindex="-1" aria-live="polite"></section></main>';
    document.body.appendChild(root);
    document.body.classList.add("cn-immersive");
    sky = startSky(root.querySelector(".cf-sky"));
    var card = root.querySelector("#cf-card"), bar = root.querySelector(".cf-prog i"), pb = root.querySelector(".cf-prog");

    function setProg() { var p = Math.min(100, Math.round(S.step / (steps.length - 2) * 100)); bar.style.width = p + "%"; pb.setAttribute("aria-valuenow", p); }
    function swap(html, dir, after) {
      function put() { card.innerHTML = html; setProg(); if (after) after(); if (!reduce) card.animate([{ opacity: 0, transform: "translate3d(" + (26 * dir) + "px,0,0) scale(.985)" }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" }); root.scrollTop = 0; }
      if (reduce || !card.innerHTML) { put(); return; }
      var a = card.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(" + (-18 * dir) + "px) scale(.99)" }], { duration: 170, easing: "ease-in", fill: "forwards" });
      a.onfinish = function () { a.cancel(); put(); };
    }
    function go(n, dir) { S.step = Math.max(0, Math.min(steps.length - 1, n)); render(dir == null ? 1 : dir); }
    function navBtns(back, next, label, opt) {
      return '<div class="cf-nav">' + (back ? '<button type="button" class="cf-b ghost" data-go="-1">Kembali</button>' : "<span></span>") + '<button type="button" class="cf-b gold" data-go="1" id="cf-next">' + esc(label || "Lanjut") + "</button></div>";
    }
    function head(eyebrow, title, sub) { return '<span class="cf-eye">' + esc(eyebrow) + '</span><h1 class="cf-h" id="cf-h" tabindex="-1">' + title + "</h1>" + (sub ? '<p class="cf-sub">' + sub + "</p>" : ""); }

    /* ---- layar-layar ---- */
    function vClosed() {
      var soon = x.st.k === "nanti";
      return '<div class="cf-center">' + emblem + head("Absensi " + (soon ? "belum dibuka" : "sudah ditutup"), esc(ev.judul), soon ? "Formulir ini bisa diisi mulai " + esc(x.when.split(" sampai ")[0]) + "." : "Formulir untuk acara ini tidak lagi menerima isian. Hubungi " + esc(c.nama) + " bila kamu merasa seharusnya masih bisa mengisi.") + '</div>';
    }
    function vWelcome() {
      var chips = [x.when, ev.jam, ev.tempat].filter(Boolean).map(function (v) { return "<i>" + esc(v) + "</i>"; }).join("");
      var nq = soal.length, wajib = soal.filter(function (q) { return q.wajib; }).length;
      return '<div class="cf-center">' + emblem + '<span class="cf-eye">Absensi dan penilaian</span><h1 class="cf-h cf-foil" id="cf-h" tabindex="-1">' + esc(ev.judul) + '</h1><div class="cf-chips">' + chips + "</div>" +
        '<p class="cf-sub">Catat kehadiranmu dan nilai acara ini. ' + nq + " pertanyaan, " + (wajib === nq ? "semuanya wajib" : wajib + " wajib") + ", sekitar dua menit.</p>" +
        (x.lokal ? '<p class="cf-lokal">Mode uji: data hanya tersimpan di perangkat ini.</p>' : "") +
        '<button type="button" class="cf-b gold big" data-go="1" id="cf-next"><span>Mulai</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.500L13 10l-5.500 5.500"/></svg></button></div>';
    }
    function vId() {
      var b = '<option value="">Pilih bagianmu</option>' + ((A.pimpinan || []).length ? '<option value="Pimpinan"' + (S.bagian === "Pimpinan" ? " selected" : "") + ">Pimpinan</option>" : "") +
        (A.unit || []).map(function (u) { return '<option value="' + esc(u.nama) + '"' + (S.bagian === u.nama ? " selected" : "") + ">" + esc(u.nama) + "</option>"; }).join("") + '<option value="Tamu"' + (S.bagian === "Tamu" ? " selected" : "") + ">Bukan pengurus BEM (tamu)</option>";
      return head("Langkah 1", "Siapa kamu?", "Datamu dipakai untuk mencatat kehadiran.") + '<div class="cf-fields">' +
        '<label class="cf-f"><span>Bagian di BEM</span><span class="cf-sel"><select id="f-b">' + b + "</select></span></label>" +
        '<label class="cf-f" id="w-n"' + (S.bagian === "Tamu" || S.lain ? " hidden" : "") + "><span>Nama</span><span class=\"cf-sel\"><select id=\"f-n\"></select></span></label>" +
        '<label class="cf-f" id="w-n2"' + (S.bagian === "Tamu" || S.lain ? "" : " hidden") + '><span>Nama lengkap</span><input id="f-n2" maxlength="80" autocomplete="name" value="' + esc(S.lain || S.bagian === "Tamu" ? S.nama : "") + '"></label>' +
        '<label class="cf-f"><span>NIM</span><input id="f-m" maxlength="20" autocapitalize="characters" inputmode="text" placeholder="Contoh: 2024010001" autocomplete="off" value="' + esc(S.nim) + '"></label></div><p class="cf-err" id="f-e" role="alert"></p>' + navBtns(true, true);
    }
    function fillNames() {
      var sel = root.querySelector("#f-n"); if (!sel) return;
      var b = S.bagian; if (!b || b === "Tamu") { sel.innerHTML = '<option value="">Pilih bagian dulu</option>'; sel.disabled = true; return; }
      var ls = b === "Pimpinan" ? (A.pimpinan || []).map(function (p) { return p.nama; }) : ((A.unit || []).filter(function (u) { return u.nama === b; })[0] || { anggota: [] }).anggota;
      sel.disabled = false; sel.innerHTML = '<option value="">Pilih namamu</option>' + ls.map(function (n) { return '<option value="' + esc(n) + '"' + (!S.lain && S.nama === n ? " selected" : "") + ">" + esc(n) + "</option>"; }).join("") + '<option value="__lain"' + (S.lain ? " selected" : "") + ">Namaku tidak ada di daftar</option>";
    }
    function vQ(i) {
      var q = soal[i], v = S.ans[q.id], h;
      var tag = '<span class="cf-tag ' + (q.wajib ? "w" : "o") + '">' + (q.wajib ? "Wajib" : "Opsional") + "</span>";
      var top = '<span class="cf-eye">Pertanyaan ' + (i + 1) + " dari " + soal.length + "</span>" + tag;
      if (q.tipe === "bintang") {
        var btn = ""; for (var k = 1; k <= 5; k++) btn += '<button type="button" role="radio" aria-checked="' + (v === k) + '" class="cf-star' + (v >= k ? " on" : "") + '" data-v="' + k + '" aria-label="' + k + " dari 5: " + HINT[k] + '" tabindex="' + ((v === k) || (!v && k === 1) ? 0 : -1) + '">' + starSvg() + "</button>";
        h = '<div class="cf-qh">' + top + '</div><h1 class="cf-q" id="cf-h" tabindex="-1">' + esc(q.teks) + '</h1>' + (q.petunjuk ? '<p class="cf-sub">' + esc(q.petunjuk) + "</p>" : "") +
          '<div class="cf-stars" role="radiogroup" aria-label="' + esc(q.teks) + '">' + btn + '</div><p class="cf-word" id="cf-word" aria-live="polite">' + (v ? v + " dari 5: <b>" + HINT[v] + "</b>" : "Ketuk bintang. 1 paling rendah, 5 terbaik.") + "</p>";
      } else if (q.tipe === "singkat") {
        h = '<div class="cf-qh">' + top + '</div><h1 class="cf-q" id="cf-h" tabindex="-1">' + esc(q.teks) + '</h1><label class="cf-f"><span class="sr">' + esc(q.teks) + '</span><input id="f-t" maxlength="160" placeholder="' + esc(q.petunjuk || "Tulis jawaban singkat") + '" value="' + esc(v || "") + '" autocomplete="off"></label><p class="cf-count"><span id="cf-c">' + String(v || "").length + "</span>/160</p>";
      } else {
        h = '<div class="cf-qh">' + top + '</div><h1 class="cf-q" id="cf-h" tabindex="-1">' + esc(q.teks) + '</h1><label class="cf-f"><span class="sr">' + esc(q.teks) + '</span><textarea id="f-t" maxlength="600" rows="5" placeholder="' + esc(q.petunjuk || "Tulis jawabanmu") + '">' + esc(v || "") + '</textarea></label><p class="cf-count"><span id="cf-c">' + String(v || "").length + "</span>/600</p>";
      }
      return h + '<p class="cf-err" id="f-e" role="alert"></p>' + navBtns(true, true, q.wajib || has(q) ? "Lanjut" : "Lewati");
    }
    function has(q) { var v = S.ans[q.id]; return v != null && String(v).trim() !== ""; }
    function vReview() {
      var rows = soal.map(function (q) {
        var v = S.ans[q.id], val;
        if (q.tipe === "bintang") val = v ? '<span class="cf-mini">' + [1, 2, 3, 4, 5].map(function (k) { return '<i class="' + (v >= k ? "on" : "") + '">' + starSvg() + "</i>"; }).join("") + "</span>" : '<em>Dilewati</em>';
        else val = has(q) ? "<span class=\"cf-txt\">" + esc(v) + "</span>" : "<em>Dilewati</em>";
        return '<li><small>' + esc(q.teks) + "</small>" + val + "</li>";
      }).join("");
      return head("Langkah terakhir", "Periksa dulu", "Pastikan datamu sudah benar, lalu kirim.") + '<div class="cf-who"><span class="cf-av">' + esc(initials(S.nama)) + '</span><span><b>' + esc(S.nama) + "</b><small>" + esc(S.bagian === "Tamu" ? "Tamu" : S.bagian) + " · " + esc(S.nim) + '</small></span></div><ul class="cf-rev">' + rows + '</ul><p class="cf-err" id="f-e" role="alert"></p><div class="cf-nav"><button type="button" class="cf-b ghost" data-go="-1">Kembali</button><button type="button" class="cf-b gold" id="cf-send">Kirim</button></div>';
    }
    function initials(n) { var w = String(n).replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/); return ((w[0] || "?")[0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); }
    function vDone() {
      var first = String(S.nama).split(/\s+/)[0], v = { nama: first, event: ev.judul, corner: c.nama };
      var pm = fill(x.penutup.pesan, v).split(/\n+/).filter(Boolean).map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
      return '<div class="cf-center cf-done"><div class="cf-seal" aria-hidden="true"><svg viewBox="0 0 120 120"><circle class="r" cx="60" cy="60" r="54"/><circle class="r2" cx="60" cy="60" r="46"/><path class="ck" pathLength="1" d="M36 62l16 16 32-36"/></svg></div>' +
        '<h1 class="cf-h cf-foil" id="cf-h" tabindex="-1">' + esc(fill(x.penutup.judul, v)) + '</h1><div class="cf-msg">' + pm + '</div><div class="cf-stamp"><b>BEM STDIIS</b><small>Tercatat · ' + esc(new Date().toLocaleString("id-ID", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })) + '</small></div>' +
        '<p class="cf-bye">Kamu boleh menutup halaman ini sekarang.</p></div>';
    }

    function render(dir) {
      var k = steps[S.step], html, after;
      if (x.st.k !== "buka") { swap(vClosed(), 1); return; }
      if (k === "welcome") html = vWelcome();
      else if (k === "id") { html = vId(); after = function () { fillNames(); }; }
      else if (k === "review") html = vReview();
      else if (k === "done") html = vDone();
      else { html = vQ(+k.slice(1)); }
      swap(html, dir, function () {
        if (after) after();
        var h = card.querySelector("#cf-h"), ti = card.querySelector("#f-t"); if (ti && !/Android|iPhone|iPad/.test(navigator.userAgent)) ti.focus(); else if (h) h.focus({ preventScroll: true });
        if (k === "done") { confetti(root); S.done = true; }
      });
    }

    /* ---- validasi dan interaksi ---- */
    function err(m, el) { var e = card.querySelector("#f-e"); if (e) e.textContent = m || ""; if (el) { el.focus(); el.classList.add("bad"); setTimeout(function () { el.classList.remove("bad"); }, 700); } }
    function next() {
      var k = steps[S.step];
      if (k === "id") {
        var b = card.querySelector("#f-b").value, ns = card.querySelector("#f-n"), n2 = card.querySelector("#f-n2"), nim = card.querySelector("#f-m").value.trim().toUpperCase().replace(/\s+/g, "");
        var free = b === "Tamu" || ns.value === "__lain", nama = free ? n2.value.trim() : ns.value;
        if (!b) return err("Pilih bagianmu di BEM.", card.querySelector("#f-b"));
        if (!nama || nama.length < 3) return err(free ? "Tulis nama lengkapmu." : "Pilih namamu dari daftar.", free ? n2 : ns);
        if (!/^[0-9A-Z.\-]{5,20}$/.test(nim)) return err("NIM harus 5 sampai 20 karakter (angka atau huruf).", card.querySelector("#f-m"));
        S.bagian = b; S.nama = nama; S.nim = nim; S.lain = free && b !== "Tamu";
      } else if (/^q\d+$/.test(k)) {
        var q = soal[+k.slice(1)], ti = card.querySelector("#f-t");
        if (ti) S.ans[q.id] = ti.value.trim();
        if (q.wajib && !has(q)) return err(q.tipe === "bintang" ? "Beri nilai bintang dulu ya." : "Pertanyaan ini wajib diisi.", ti || card.querySelector(".cf-star"));
      }
      go(S.step + 1, 1);
    }
    function send() {
      if (S.busy) return; S.busy = true; var btn = card.querySelector("#cf-send"); btn.disabled = true; btn.textContent = "Mengirim..."; err("");
      var jawab = soal.map(function (q) { var v = S.ans[q.id]; return { id: q.id, t: q.teks, tipe: q.tipe, v: q.tipe === "bintang" ? (v || null) : (v || "") }; });
      x.submit({ nama: S.nama, nim: S.nim, bagian: S.bagian, jawab: jawab }).then(function (j) {
        S.busy = false;
        if (j && j.ok) { try { localStorage.setItem("bem-corner-sudah-" + ev.id, S.nama); } catch (e) {} go(S.step + 1, 1); }
        else { btn.disabled = false; btn.textContent = "Kirim"; var M = { duplikat: "NIM ini sudah mengisi untuk acara ini. Satu NIM hanya bisa mengisi satu kali.", data: "Datamu belum lengkap atau tidak valid.", skor: "Penilaian belum lengkap.", nosheet: "Server belum siap. Hubungi pengurus.", server: "Server gagal memproses. Coba lagi sebentar lagi." }; err(M[j && j.error] || "Gagal mengirim. Coba lagi."); }
      }, function (e) { S.busy = false; btn.disabled = false; btn.textContent = "Kirim"; err(e && e.msg ? e.msg : "Gagal mengirim. Periksa koneksi internetmu."); });
    }
    function burst(btn) {
      if (reduce) return; var r = btn.getBoundingClientRect(), hr = root.getBoundingClientRect();
      for (var i = 0; i < 9; i++) {
        var p = document.createElement("i"); p.className = "cf-spark"; p.style.left = (r.left + r.width / 2 - hr.left) + "px"; p.style.top = (r.top + r.height / 2 - hr.top) + "px"; root.appendChild(p);
        var a = i / 9 * 6.283 + Math.random() * 0.5, d = 38 + Math.random() * 34;
        p.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: "translate(calc(-50% + " + Math.cos(a) * d + "px), calc(-50% + " + Math.sin(a) * d + "px)) scale(0)", opacity: 0 }], { duration: 620 + Math.random() * 200, easing: "cubic-bezier(.15,.7,.3,1)" }).onfinish = (function (el) { return function () { el.remove(); }; })(p);
      }
    }

    card.addEventListener("click", function (e) {
      var g = e.target.closest("[data-go]");
      if (g) { if (+g.getAttribute("data-go") > 0) next(); else go(S.step - 1, -1); return; }
      var st = e.target.closest(".cf-star");
      if (st) {
        var q = soal[+steps[S.step].slice(1)], v = +st.getAttribute("data-v"); S.ans[q.id] = v;
        [].forEach.call(card.querySelectorAll(".cf-star"), function (b) { var n = +b.getAttribute("data-v"); b.classList.toggle("on", n <= v); b.setAttribute("aria-checked", n === v); b.tabIndex = n === v ? 0 : -1; });
        card.querySelector("#cf-word").innerHTML = v + " dari 5: <b>" + HINT[v] + "</b>"; card.querySelector("#cf-next").textContent = "Lanjut"; err("");
        st.classList.remove("pop"); void st.offsetWidth; st.classList.add("pop"); burst(st); if (navigator.vibrate) try { navigator.vibrate(10); } catch (x2) {}
        return;
      }
      if (e.target.closest("#cf-send")) send();
    });
    card.addEventListener("change", function (e) {
      if (e.target.id === "f-b") {
        S.bagian = e.target.value; S.nama = ""; S.lain = false; var tamu = S.bagian === "Tamu";
        card.querySelector("#w-n").hidden = tamu; card.querySelector("#w-n2").hidden = !tamu; fillNames();
      } else if (e.target.id === "f-n") {
        var o = e.target.value === "__lain"; card.querySelector("#w-n2").hidden = !o; if (o) card.querySelector("#f-n2").focus();
      }
    });
    card.addEventListener("input", function (e) { if (e.target.id === "f-t") { var cc = card.querySelector("#cf-c"); if (cc) cc.textContent = e.target.value.length; var q = soal[+steps[S.step].slice(1)]; S.ans[q.id] = e.target.value; var nb = card.querySelector("#cf-next"); if (nb) nb.textContent = q.wajib || e.target.value.trim() ? "Lanjut" : "Lewati"; } });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); next(); }
      var st = e.target.closest && e.target.closest(".cf-star");
      if (st && /Arrow/.test(e.key)) { e.preventDefault(); var all = [].slice.call(card.querySelectorAll(".cf-star")), i = all.indexOf(st), n = /Right|Up/.test(e.key) ? Math.min(4, i + 1) : Math.max(0, i - 1); all[n].focus(); all[n].click(); }
    });

    render(1);
  }

  function close() {
    if (sky) { sky.stop(); sky = null; }
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null; ctx0 = null;
  }
  window.CornerForm = { open: open, close: close };
})();

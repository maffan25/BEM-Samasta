/* corner-home.js: bagian "Samasta Corner" di beranda.
   - Kerucut memakai struktur .ik milik situs: miring mengikuti kursor, putar sekali saat terlihat,
     dan putar saat diklik (ikon.js memberi kelas "play"; di sini kelas itu diterjemahkan jadi putaran).
   - Putaran memakai pegas dua tingkat sehingga mulai dan berhenti sangat halus.
   - Hanya lapisan hiasan kecil yang bergerak (transform di GPU); badan kerucut tidak digambar ulang.
   - Bola corner dibuat otomatis dari corner-data.js (diedit lewat admin-corner.html). */
(function () {
  "use strict";
  var D = window.CORNER || { corner: [] };
  var stage = document.getElementById("cn-stage");
  var TONES = window.CORNER_TONES || {};
  if (!stage) return;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  /* ================= Bola corner ================= */
  var ul = $("cn-orbs");
  if (ul) {
    var list = D.corner || [];
    ul.innerHTML = list.length ? list.map(function (c, i) {
      var t = TONES[c.warna] || TONES.zamrud, soon = c.status === "segera";
      var st = "--o1:" + t.o1 + ";--o2:" + t.o2 + ";--o3:" + t.o3 + ";--ot:" + t.ot + ";--oa:" + t.oa + ";--i:" + i;
      return '<li style="' + st + '"><a class="cn-orb' + (soon ? " is-soon" : "") + '" href="#corner/' + esc(c.id) + '" aria-label="Buka corner ' + esc(c.nama) + (soon ? ", segera hadir" : window.CornerPin && window.CornerPin.enabled() ? ", khusus pengurus, butuh PIN" : "") + '">' +
        '<span class="cn-ball">' +
        '<span class="cn-orbit o1" aria-hidden="true"><i></i></span><span class="cn-orbit o2" aria-hidden="true"><i></i></span>' +
        '<span class="cn-sph">' + window.CORNER_ORB_SVG(c.ikon || "bintang") + '<span class="cn-gl" aria-hidden="true"></span></span>' +
        (soon ? "" : '<span class="cn-lockb" aria-hidden="true"><svg class="lc" viewBox="0 0 20 20"><rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 016 0V9"/></svg><svg class="lo" viewBox="0 0 20 20"><rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 015.6-1.5"/></svg></span>') +
        '<span class="cn-spk s1" aria-hidden="true"></span><span class="cn-spk s2" aria-hidden="true"></span><span class="cn-spk s3" aria-hidden="true"></span>' +
        '<span class="cn-shd" aria-hidden="true"></span></span>' +
        '<span class="cn-abbr">' + esc(c.singkat || c.nama) + '</span>' +
        '<span class="cn-name">' + esc(c.nama) + '</span>' +
        '<span class="cn-tag' + (soon ? " soon" : "") + '">' + (soon ? "Segera hadir" : esc(c.tagline || "Buka corner")) + '</span></a></li>';
    }).join("") : '<li class="cn-none">Corner pertama sedang disiapkan.</li>';
  }
  /* Bola jatuh dan memantul tiap kali panel masuk layar */
  var orbPanel = $("cn-panel");
  if (orbPanel) {
    if (!reduce && "IntersectionObserver" in window) {
      orbPanel.classList.add("cn-armed");
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { orbPanel.classList.toggle("cn-in", e.isIntersecting && e.intersectionRatio > 0.3); });
      }, { threshold: [0, 0.3, 0.6] }).observe(orbPanel);
    } else orbPanel.classList.add("cn-in");
  }

  /* ================= Kerucut ================= */
  var ik = $("cn-cone"), tilt = $("cn-tilt");
  if (!ik || !tilt) return;

  var CX = 130;
  function W(y) { return 7.5 + 0.3674 * (y - 26); }                         /* setengah lebar kerucut pada ketinggian y */
  function band(y1, y2) {
    var w1 = W(y1), w2 = W(y2), r1 = w1 * 0.163, r2 = w2 * 0.163;
    return "M" + (CX - w1) + "," + y1 + " A" + w1 + " " + r1 + " 0 0 0 " + (CX + w1) + "," + y1 + " L" + (CX + w2) + "," + y2 + " A" + w2 + " " + r2 + " 0 0 1 " + (CX - w2) + "," + y2 + "Z";
  }
  var BODY = "M38,256 L122.5,26 Q130,16 137.5,26 L222,256 A92 15 0 0 1 38,256Z";
  var FOOT = "M" + (CX - W(232)) + ",232 A" + W(232) + " " + (W(232) * 0.163) + " 0 0 0 " + (CX + W(232)) + ",232 L222,256 A92 15 0 0 1 38,256Z";

  /* Lapisan 0: badan, pita, dan alas (statis, tidak digambar ulang saat berputar) */
  var L0 = '<svg class="cn-l cn-l0" viewBox="0 0 260 330" aria-hidden="true" focusable="false"><defs>' +
    '<clipPath id="cn-c0"><path d="' + BODY + '"/></clipPath>' +
    '<linearGradient id="cn-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe98a"/><stop offset=".55" stop-color="#f8d24a"/><stop offset="1" stop-color="#e8b92c"/></linearGradient>' +
    '<linearGradient id="cn-emT" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f7d66"/><stop offset="1" stop-color="#14594a"/></linearGradient></defs>' +
    '<path d="M130,222 L248,258 L130,294 L12,258Z" fill="#14594a" stroke="#14594a" stroke-width="8" stroke-linejoin="round"/>' +
    '<path d="M12,262 L130,298 L130,312 L12,276Z" fill="#0a3429" stroke="#0a3429" stroke-width="8" stroke-linejoin="round"/>' +
    '<path d="M248,262 L130,298 L130,312 L248,276Z" fill="#0f4639" stroke="#0f4639" stroke-width="8" stroke-linejoin="round"/>' +
    '<path d="M130,236 L224,262 L130,288 L36,262Z" fill="url(#cn-emT)" stroke="#e8c96a" stroke-opacity=".6" stroke-width="1.2" stroke-linejoin="round"/>' +
    '<path d="' + BODY + '" fill="url(#cn-gold)"/><g clip-path="url(#cn-c0)">' +
    '<path d="' + band(92, 114) + '" fill="#fbf6e6"/><path d="' + band(150, 198) + '" fill="#fbf6e6"/><path d="' + FOOT + '" fill="#14594a"/></g></svg>';

  /* Lapisan 2: bayangan dan kilau tetap (di atas hiasan, jadi hiasan terlihat melengkung) */
  var L2 = '<svg class="cn-l cn-l2" viewBox="0 0 260 330" aria-hidden="true" focusable="false"><defs>' +
    '<clipPath id="cn-c2"><path d="' + BODY + '"/></clipPath>' +
    '<linearGradient id="cn-shade" gradientUnits="userSpaceOnUse" x1="38" y1="0" x2="222" y2="0">' +
    '<stop offset="0" stop-color="#04141b" stop-opacity=".55"/><stop offset=".16" stop-color="#04141b" stop-opacity=".16"/><stop offset=".34" stop-color="#fff" stop-opacity=".30"/><stop offset=".48" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#04141b" stop-opacity=".24"/><stop offset="1" stop-color="#04141b" stop-opacity=".58"/></linearGradient>' +
    '<linearGradient id="cn-amb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#04141b" stop-opacity=".28"/></linearGradient>' +
    '<filter id="cn-blur" x="-30%" y="-5%" width="160%" height="110%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>' +
    '<g clip-path="url(#cn-c2)"><rect x="30" y="10" width="200" height="270" fill="url(#cn-shade)"/><rect x="30" y="10" width="200" height="270" fill="url(#cn-amb)"/>' +
    '<path d="M101,52 L86,236" stroke="#fff" stroke-opacity=".34" stroke-width="5" stroke-linecap="round" filter="url(#cn-blur)"/></g>' +
    '<path d="' + BODY + '" fill="none" stroke="#b98a14" stroke-opacity=".5" stroke-width="1.2"/></svg>';

  /* Lapisan 1: tiga sisi bergambar (HTML + transform GPU) */
  var L1 = '<div class="cn-l cn-l1" id="cn-faces" aria-hidden="true">' +
    '<span class="cn-f f0"><i class="emb"></i></span>' +
    '<span class="cn-f f1"><b>SAMASTA</b><s></s><em>BEM STDIIS</em></span>' +
    '<span class="cn-f f2"><s></s><b>CORNER</b><s></s></span></div>';
  tilt.innerHTML = L0 + L1 + L2;

  var FACE = Math.PI * 2 / 3, faces = [].slice.call(document.querySelectorAll("#cn-faces .cn-f")), wrap = $("cn-faces");
  var S = 1;
  function measure() { S = (wrap.clientWidth || 250) / 260; faces.forEach(function (f) { f.style.setProperty("--fs", S.toFixed(4)); }); }
  function yAt(x) {                               /* tengah pita lebar mengikuti lengkungnya */
    var w1 = W(150), w2 = W(198), a = Math.max(0, 1 - (x / w1) * (x / w1)), b = Math.max(0, 1 - (x / w2) * (x / w2));
    return (150 + w1 * 0.163 * Math.sqrt(a) + 198 + w2 * 0.163 * Math.sqrt(b)) / 2;
  }
  var th = 0;
  function paint() {
    for (var i = 0; i < 3; i++) {
      var a = th + i * FACE, s = Math.sin(a), c = Math.cos(a), el = faces[i];
      if (c <= 0.03) { if (el._h !== 1) { el.style.opacity = 0; el._h = 1; } continue; }
      el._h = 0; var X = 54 * s;
      el.style.opacity = Math.min(1, (c - 0.03) / 0.32).toFixed(3);
      el.style.transform = "translate3d(" + ((CX + X) * S).toFixed(2) + "px," + (yAt(X) * S).toFixed(2) + "px,0) translate(-50%,-50%) scale3d(" + c.toFixed(4) + ",1,1)";
    }
  }
  measure(); paint();
  if (window.ResizeObserver) new ResizeObserver(function () { measure(); paint(); }).observe(wrap); else window.addEventListener("resize", function () { measure(); paint(); });

  /* ---- Fisika: sasaran dihaluskan dulu (tau 0,11 dtk), lalu dikejar pegas (zeta 0,86). Tanpa lompatan kecepatan. ---- */
  var target = 0, sm = 0, om = 0, raf = 0, lt = 0;
  var W0 = 5.6, ZETA = 0.86, K = W0 * W0, C = 2 * ZETA * W0, TAU = 0.11;
  function snap(v) { return Math.round(v / FACE) * FACE; }
  function tick(ts) {
    var dt = Math.min(0.034, (ts - lt) / 1000 || 0.016); lt = ts;
    var n = 2, h = dt / n;
    for (var i = 0; i < n; i++) {
      sm += (target - sm) * (1 - Math.exp(-h / TAU));
      om += (K * (sm - th) - C * om) * h;
      th += om * h;
    }
    paint();
    if (Math.abs(om) < 0.0015 && Math.abs(target - th) < 0.0015 && Math.abs(sm - target) < 0.0015) { th = sm = target; om = 0; paint(); raf = 0; return; }
    raf = requestAnimationFrame(tick);
  }
  function go() { if (!raf) { lt = performance.now(); raf = requestAnimationFrame(tick); } }
  function spin(turns) { target = snap(target) + FACE * 3 * turns; go(); }

  function hop() {
    if (reduce || !ik.animate) return;
    ik.animate([
      { transform: "translateY(0) scale(1,1)" }, { transform: "translateY(3px) scale(1.03,.96)", offset: 0.14 },
      { transform: "translateY(-18px) scale(.98,1.03)", offset: 0.44 }, { transform: "translateY(0) scale(1.02,.98)", offset: 0.74 }, { transform: "translateY(0) scale(1,1)" }
    ], { duration: 820, easing: "cubic-bezier(.33,.7,.3,1)" });
  }

  /* ikon.js menambah kelas "play" saat diklik dan saat pertama terlihat: itulah pemicu putaran */
  var lastPlay = 0;
  new MutationObserver(function () {
    if (!ik.classList.contains("play")) return;
    var now = performance.now(); if (now - lastPlay < 350) return; lastPlay = now;
    if (reduce) { target += FACE; sm = th = target; paint(); return; }
    spin(1); hop();
  }).observe(ik, { attributes: true, attributeFilter: ["class"] });
  /* Papan ketik: Enter atau Spasi sama dengan klik */
  ik.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ik.click(); } });

  /* Digulir melewati bagian ini: kerucut ikut berputar searah gulir, lalu berhenti tepat di satu sisi */
  if (!reduce && "IntersectionObserver" in window) {
    var inView = false, lastY = window.pageYOffset, busy = false, to = 0;
    new IntersectionObserver(function (es) { es.forEach(function (e) { inView = e.isIntersecting; lastY = window.pageYOffset; }); }, { threshold: 0.05 }).observe(ik);
    window.addEventListener("scroll", function () {
      if (busy) return; busy = true;
      requestAnimationFrame(function () {
        busy = false; var y = window.pageYOffset, dy = y - lastY; lastY = y;
        if (!inView || Math.abs(dy) < 1) return;
        target += Math.max(-1.6, Math.min(1.6, dy * 0.0085)); go();
        clearTimeout(to); to = setTimeout(function () { target = snap(target); go(); }, 170);
      });
    }, { passive: true });
  }
})();

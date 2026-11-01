/* corner-pin.js: gerbang PIN untuk membuka Samasta Corner.
   - PIN tidak pernah disimpan sebagai teks. corner-data.js hanya memuat garam + SHA-256 (window.CORNER.pin).
   - Formulir absensi yang dibuka lewat barcode (#corner/<corner>/isi/<event>) TIDAK dikunci: itu untuk umum.
   - Terbuka selama tab peramban dipakai (sessionStorage). Lima kali salah berturut-turut: tunggu 60 detik.
   - Catatan jujur: situs ini statis (tanpa server), jadi gerbang ini menghalangi pengunjung biasa, bukan penyerang
     yang membaca kode sumber. Jangan pakai PIN yang sama dengan PIN penting lain.
   API: CornerPin.make(pin) -> {salt,hash,n}   CornerPin.check(pin)   CornerPin.unlocked()
        CornerPin.needs(corner)                CornerPin.ask({corner, onOk, onCancel})   CornerPin.lock()  */
(function () {
  "use strict";

  /* ---------- SHA-256 (sinkron, tanpa bergantung pada crypto.subtle yang butuh HTTPS) ---------- */
  var K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  function utf8(s) {
    var o = [], i, c;
    s = String(s);
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c >= 0xd800 && c < 0xdc00 && i + 1 < s.length) { c = 0x10000 + ((c - 0xd800) << 10) + (s.charCodeAt(++i) - 0xdc00); }
      if (c < 0x80) o.push(c);
      else if (c < 0x800) o.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else if (c < 0x10000) o.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
      else o.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return o;
  }
  function sha256(str) {
    var b = utf8(str), l = b.length, i, j, w = new Uint32Array(64);
    b.push(0x80); while (b.length % 64 !== 56) b.push(0);
    var hi = Math.floor(l / 0x20000000), lo = (l << 3) >>> 0;
    b.push(hi >>> 24 & 255, hi >>> 16 & 255, hi >>> 8 & 255, hi & 255, lo >>> 24 & 255, lo >>> 16 & 255, lo >>> 8 & 255, lo & 255);
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    function R(x, n) { return (x >>> n) | (x << (32 - n)); }
    for (i = 0; i < b.length; i += 64) {
      for (j = 0; j < 16; j++) w[j] = (b[i + j * 4] << 24) | (b[i + j * 4 + 1] << 16) | (b[i + j * 4 + 2] << 8) | b[i + j * 4 + 3];
      for (j = 16; j < 64; j++) {
        var s0 = R(w[j - 15], 7) ^ R(w[j - 15], 18) ^ (w[j - 15] >>> 3), s1 = R(w[j - 2], 17) ^ R(w[j - 2], 19) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = R(e, 6) ^ R(e, 11) ^ R(e, 25), ch = (e & f) ^ (~e & g), t1 = (h + S1 + ch + K[j] + w[j]) | 0;
        var S0 = R(a, 2) ^ R(a, 13) ^ R(a, 22), mj = (a & bb) ^ (a & c) ^ (bb & c), t2 = (S0 + mj) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0; H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    return H.map(function (x) { return ("00000000" + (x >>> 0).toString(16)).slice(-8); }).join("");
  }
  /* PIN diulur 4000 putaran supaya menebak lewat konsol tidak instan. Salt membuat hash unik per situs. */
  function stretch(pin, salt) { var h = sha256(salt + ":" + pin), i; for (i = 0; i < 4000; i++) h = sha256(h + salt); return h; }

  var KEY_OK = "bem-corner-pin-ok", KEY_TRY = "bem-corner-pin-try", MAXTRY = 5, WAIT = 60000;
  function cfg() { var p = window.CORNER && window.CORNER.pin; return p && p.hash && p.salt ? p : null; }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function enabled() { return !!cfg(); }
  function unlocked() { var p = cfg(); return !p || ss(KEY_OK) === p.hash; }
  function needs(c) { return !!(c && c.status !== "segera" && enabled() && !unlocked()); }
  function tries() { try { return JSON.parse(ls(KEY_TRY) || "{}") || {}; } catch (e) { return {}; } }
  function waitLeft() { var t = tries(); return t.until && t.until > Date.now() ? t.until - Date.now() : 0; }
  function make(pin, salt) {
    pin = String(pin);
    if (!salt) { var a = new Uint8Array(12); (window.crypto || window.msCrypto).getRandomValues(a); salt = [].map.call(a, function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
    return { salt: salt, hash: stretch(pin, salt), n: pin.length };
  }
  function check(pin) {
    var p = cfg(); if (!p) return true;
    if (waitLeft()) return false;
    var ok = stretch(String(pin), p.salt) === p.hash, t = tries();
    if (ok) { ls(KEY_TRY, null); ss(KEY_OK, p.hash); document.documentElement.classList.add("cn-pin-open"); document.dispatchEvent(new CustomEvent("cornerpin", { detail: { open: true } })); return true; }
    t.n = (t.n || 0) + 1; if (t.n >= MAXTRY) { t.until = Date.now() + WAIT; t.n = 0; } ls(KEY_TRY, JSON.stringify(t));
    return false;
  }
  function lock() { ss(KEY_OK, null); document.documentElement.classList.remove("cn-pin-open"); document.dispatchEvent(new CustomEvent("cornerpin", { detail: { open: false } })); }
  if (unlocked() && enabled()) document.documentElement.classList.add("cn-pin-open");

  /* ---------- dialog PIN ---------- */
  var LOCK_SVG = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 016 0V9"/><path d="M10 12.2v1.6"/></svg>';
  var live = null;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function ask(o) {
    o = o || {}; if (live) live.kill(true);
    var p = cfg(); if (!p) { if (o.onOk) o.onOk(); return; }
    var n = p.n || 6, prev = document.activeElement, done = false, tm = 0;
    var el = document.createElement("div"); el.className = "pn"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "pn-t");
    var cells = ""; for (var i = 0; i < n; i++) cells += "<i></i>";
    el.innerHTML = '<div class="pn-bg" data-x></div><form class="pn-box" novalidate autocomplete="off"><span class="pn-ic">' + LOCK_SVG + '</span><h2 id="pn-t">Khusus pengurus BEM</h2>' +
      '<p class="pn-s">' + (o.corner ? "Masukkan PIN untuk membuka corner <b>" + esc(o.corner.nama || o.corner.singkat) + "</b>." : "Masukkan PIN untuk membuka corner.") + '</p>' +
      '<div class="pn-cells" style="--n:' + n + '">' + cells + '<input class="pn-in" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="' + n + '" autocomplete="one-time-code" aria-label="PIN ' + n + ' angka" enterkeyhint="go"></div>' +
      '<p class="pn-e" role="alert" aria-live="assertive"></p><div class="pn-a"><button type="button" class="pn-b ghost" data-x>Batal</button><button type="submit" class="pn-b gold">Buka</button></div>' +
      '<p class="pn-h">Peserta acara tidak memerlukan PIN. Cukup pindai barcode.</p></form>';
    document.body.appendChild(el);
    var inp = el.querySelector(".pn-in"), cs = [].slice.call(el.querySelectorAll(".pn-cells i")), err = el.querySelector(".pn-e"), box = el.querySelector(".pn-box"), go = el.querySelector(".gold");
    requestAnimationFrame(function () { el.classList.add("on"); });
    setTimeout(function () { inp.focus(); }, 60);
    function paint() { var v = inp.value; cs.forEach(function (c, k) { c.className = k < v.length ? "f" : k === v.length ? "c" : ""; }); }
    function msg(t) { err.textContent = t || ""; }
    function tick() {
      var w = waitLeft();
      if (w) { msg("Terlalu banyak percobaan. Coba lagi dalam " + Math.ceil(w / 1000) + " detik."); go.disabled = true; tm = setTimeout(tick, 500); }
      else { if (go.disabled) { msg(""); } go.disabled = false; }
    }
    function kill(quiet) {
      if (done) return; done = true; clearTimeout(tm); el.classList.remove("on"); live = null;
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
      if (prev && prev.focus && !quiet) try { prev.focus({ preventScroll: true }); } catch (e) {}
    }
    function bad() {
      inp.value = ""; paint(); box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
      if (navigator.vibrate) try { navigator.vibrate([20, 40, 20]); } catch (e) {}
      var w = waitLeft(); msg(w ? "Terlalu banyak percobaan. Coba lagi dalam " + Math.ceil(w / 1000) + " detik." : "PIN salah. Coba lagi."); tick(); inp.focus();
    }
    function submit() {
      if (done) return; var v = inp.value.trim();
      if (waitLeft()) return tick();
      if (v.length < n) { msg("PIN terdiri dari " + n + " angka."); return; }
      go.disabled = true;
      setTimeout(function () {                                   /* beri satu frame agar tombol sempat berubah sebelum hitungan hash */
        if (check(v)) { el.classList.add("ok"); setTimeout(function () { kill(true); if (o.onOk) o.onOk(); }, 260); }
        else { go.disabled = false; bad(); }
      }, 20);
    }
    inp.addEventListener("input", function () { inp.value = inp.value.replace(/\D/g, "").slice(0, n); msg(""); paint(); if (inp.value.length === n) submit(); });
    inp.addEventListener("focus", paint); inp.addEventListener("blur", function () { cs.forEach(function (c) { if (c.className === "c") c.className = ""; }); });
    el.querySelector(".pn-cells").addEventListener("click", function () { inp.focus(); });
    box.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    el.addEventListener("click", function (e) { if (e.target.closest("[data-x]")) { kill(); if (o.onCancel) o.onCancel(); } });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); kill(); if (o.onCancel) o.onCancel(); }
      if (e.key === "Tab") {                                       /* perangkap fokus sederhana */
        var f = [].slice.call(el.querySelectorAll("input,button:not(:disabled)")), a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    });
    paint(); tick();
    live = { kill: kill };
  }

  /* Klik pada tautan #corner/... : bila corner terkunci, minta PIN dulu di tempat (tanpa pindah halaman).
     Pendengar ini dipasang lebih awal dari corner-app.js sehingga bisa menahan klik tersebut. */
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var a = e.target.closest && e.target.closest('a[href^="#corner/"]'); if (!a) return;
    var parts = a.getAttribute("href").slice(1).split("/"), id = decodeURIComponent(parts[1] || ""), seg = parts[2];
    if (seg === "isi") return;
    var D = window.CORNER || { corner: [] }, c = null; (D.corner || []).forEach(function (x) { if (x.id === id) c = x; });
    if (!needs(c)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var href = a.getAttribute("href");
    ask({ corner: c, onOk: function () { location.hash = href; } });
  }, true);

  window.CornerPin = { make: make, check: check, unlocked: unlocked, enabled: enabled, needs: needs, ask: ask, lock: lock, sha256: sha256, stretch: stretch };
})();

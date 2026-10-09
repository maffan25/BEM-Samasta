/* Sorotan tepi bagian: klik sebuah bagian (atau menuju ke sana lewat menu/tombol) dan tepinya menyala.
   Bagian lain tetap meredup lewat sistem "fokus bagian" yang sudah ada di index.html. */
(function () {
  "use strict";
  var home = document.getElementById("home");
  if (!home) return;
  var root = document.documentElement, cur = null, lockUntil = 0, timer = 0;
  var secs = [].slice.call(home.children).filter(function (el) { return el.tagName === "SECTION"; });

  secs.forEach(function (s) {
    var r = document.createElement("i");
    r.className = "spot-ring"; r.setAttribute("aria-hidden", "true");
    s.appendChild(r);
  });

  function off() {
    if (cur) cur.classList.remove("spot-on");
    cur = null; root.classList.remove("has-spot");
  }
  function on(s) {
    if (!s || cur === s) return;
    if (cur) cur.classList.remove("spot-on");
    cur = s; s.classList.add("spot-on"); root.classList.add("has-spot");
  }

  /* Klik di dalam sebuah bagian menyorot bagian itu; klik di luar bagian (hero, footer) mematikannya */
  document.addEventListener("click", function (e) {
    if (home.hidden) return;
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (a) {
      var t = document.getElementById(a.getAttribute("href").slice(1));
      if (t && secs.indexOf(t) > -1) {
        lockUntil = Date.now() + 1400;           /* beri waktu gulir sampai di tujuan */
        setTimeout(function () { on(t); }, 350);
        return;
      }
    }
    var s = e.target.closest && e.target.closest("#home > section");
    if (s) on(s);
    else if (!e.target.closest(".site-header")) off();
  });

  /* Sorotan padam sendiri begitu bagiannya ditinggalkan (sudah tidak jadi pusat perhatian) */
  function check() {
    if (cur && Date.now() > lockUntil && cur.classList.contains("is-dim")) off();
  }
  window.addEventListener("scroll", function () {
    clearTimeout(timer); timer = setTimeout(check, 160);
  }, { passive: true });

  /* Matikan saat beranda disembunyikan oleh router halaman (SOP, Panduan, dst.) */
  if (window.MutationObserver) {
    new MutationObserver(function () { if (home.hidden) off(); }).observe(home, { attributes: true, attributeFilter: ["hidden"] });
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") off(); });
})();

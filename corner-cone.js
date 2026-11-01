/* corner-cone.js: kerucut lalu lintas 3D untuk Samasta Corner.
   Dibangun dari elemen CSS 3D sungguhan (36 sisi kerucut + alas segi delapan), bayangan dihitung ulang
   tiap bingkai mengikuti sudut putar. Berputar saat diketuk, ditekan Enter/Spasi, atau saat halaman digulir
   melewatinya. Mati otomatis saat tidak terlihat; hormati "kurangi gerakan". */
(function () {
  "use strict";
  var host = document.getElementById("cn-cone");
  if (!host) return;
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---- Geometri (piksel) ---- */
  var N = 36, R = 45, r = 7.5, H = 144, T = 15, A = 63, ORIGIN_Y = 214;
  var HALF = Math.atan((R - r) / H);                 /* sudut miring dinding kerucut */
  var SLANT = Math.sqrt(H * H + (R - r) * (R - r));
  var WB = 2 * R * Math.sin(Math.PI / N) + 0.9, WT = 2 * r * Math.sin(Math.PI / N);
  var AP = R * Math.cos(Math.PI / N);
  var SIDE = 2 * A * Math.tan(Math.PI / 8) + 0.9;
  var CUT = (1 - Math.tan(Math.PI / 8)) / 2 * 100;   /* sudut segi delapan, persen */
  var REST = -24;                                     /* sudut diam: tampak 3/4 */

  var BANDS = "linear-gradient(180deg,#f6c928 0 19%,#fffdf3 19% 37%,#f6c928 37% 54%,#fffdf3 54% 66%,#f6c928 66% 100%)";
  var shadeBg = function (base) {
    return "linear-gradient(rgba(255,255,255,var(--hl,0)),rgba(255,255,255,var(--hl,0)))," +
           "linear-gradient(rgba(5,22,31,var(--dk,0)),rgba(5,22,31,var(--dk,0)))," + base;
  };

  function el(cls, css, parent) {
    var e = document.createElement("span"); e.className = cls; if (css) e.style.cssText = css; if (parent) parent.appendChild(e); return e;
  }

  /* ---- Susunan DOM ---- */
  host.innerHTML = "";
  el("cn-glow", "", host); el("cn-shadow", "", host);
  var sparks = el("cn-sparks", "", host);
  ["a", "b", "c"].forEach(function (k) { el("cn-sp cn-sp-" + k, "", sparks); });
  var persp = el("cn-persp", "", host), press = el("cn-press", "", persp), jump = el("cn-jump", "", press),
      hop = el("cn-hop", "", jump), tilt = el("cn-tilt", "", hop), spin = el("cn-spin", "", tilt),
      world = el("cn-w", "top:" + ORIGIN_Y + "px", spin);

  var parts = [];       /* {el, theta (deg), slope (rad), base} untuk penghitungan bayangan */

  /* alas: segi delapan (8 sisi + tutup atas) */
  for (var k = 0; k < 8; k++) {
    var f = el("cn-bs", "width:" + SIDE + "px;height:" + T + "px;margin-left:" + (-SIDE / 2) + "px;margin-top:" + (-T) + "px;transform:rotateY(" + (k * 45) + "deg) translateZ(" + A + "px);" +
      "background:" + shadeBg("linear-gradient(180deg,#f8d24a 0 13%,#0d2a38 13% 66%,#14705a 66% 78%,#0d2a38 78%)"), world);
    parts.push({ el: f, theta: k * 45, slope: 0 });
  }
  var topFace = el("cn-bt", "width:" + (2 * A) + "px;height:" + (2 * A) + "px;margin:" + (-A) + "px 0 0 " + (-A) + "px;transform:translateY(" + (-T) + "px) rotateX(90deg);clip-path:polygon(" +
    CUT + "% 0,calc(100% - " + CUT + "%) 0,100% " + CUT + "%,100% calc(100% - " + CUT + "%),calc(100% - " + CUT + "%) 100%," + CUT + "% 100%,0 calc(100% - " + CUT + "%),0 " + CUT + "%)", world);
  el("cn-ring", "width:" + (2 * (R + 7)) + "px;height:" + (2 * (R + 7)) + "px;margin:" + (-(R + 7)) + "px 0 0 " + (-(R + 7)) + "px;transform:translateY(" + (-T - 0.6) + "px) rotateX(90deg)", world);

  /* badan kerucut */
  var xInset = ((WB - WT) / 2) / WB * 100;
  for (var i = 0; i < N; i++) {
    var th = i * 360 / N;
    var fc = el("cn-cf", "width:" + WB + "px;height:" + SLANT + "px;margin-left:" + (-WB / 2) + "px;margin-top:" + (-SLANT) + "px;" +
      "clip-path:polygon(" + xInset + "% 0," + (100 - xInset) + "% 0,100% 100%,0 100%);" +
      "transform:translateY(" + (-T) + "px) rotateY(" + th + "deg) translateZ(" + AP + "px) rotateX(" + (HALF * 180 / Math.PI) + "deg);" +
      "background:" + shadeBg(BANDS), world);
    parts.push({ el: fc, theta: th, slope: HALF });
  }
  /* tutup atas kerucut */
  el("cn-cap", "width:" + (2 * r + 1) + "px;height:" + (2 * r + 1) + "px;margin:" + (-(r + 0.5)) + "px 0 0 " + (-(r + 0.5)) + "px;transform:translateY(" + (-(T + H)) + "px) rotateX(90deg)", world);

  /* lencana logo di sisi depan (menempel di dinding kerucut) */
  var BADGE = 33, bd = 40;                           /* diameter, jarak tengah dari dasar kerucut sepanjang kemiringan */
  var plane = el("cn-bg", "width:" + BADGE + "px;height:" + SLANT + "px;margin-left:" + (-BADGE / 2) + "px;margin-top:" + (-SLANT) + "px;" +
    "transform:translateY(" + (-T) + "px) rotateY(0deg) translateZ(" + (AP + 0.7) + "px) rotateX(" + (HALF * 180 / Math.PI) + "deg)", world);
  el("cn-badge", "width:" + BADGE + "px;height:" + BADGE + "px;bottom:" + (bd - BADGE / 2) + "px", plane);

  /* ---- Pencahayaan ---- */
  var LX = -0.46, LY = -0.62, LZ = 0.64, LL = Math.sqrt(LX * LX + LY * LY + LZ * LZ); LX /= LL; LY /= LL; LZ /= LL;
  var HX = LX, HY = LY, HZ = LZ + 1, HL = Math.sqrt(HX * HX + HY * HY + HZ * HZ); HX /= HL; HY /= HL; HZ /= HL;
  var tiltDeg = -17, tiltTarget = -17;

  function lit(yaw) {
    var ta = tiltDeg * Math.PI / 180, ca = Math.cos(ta), sa = Math.sin(ta);
    for (var j = 0; j < parts.length; j++) {
      var p = parts[j], w = (p.theta + yaw) * Math.PI / 180, c = Math.cos(p.slope);
      var nx = Math.sin(w) * c, ny = -Math.sin(p.slope), nz = Math.cos(w) * c;
      var y2 = ny * ca - nz * sa, z2 = ny * sa + nz * ca;
      var d = Math.max(0, nx * LX + y2 * LY + z2 * LZ), s = Math.max(0, nx * HX + y2 * HY + z2 * HZ);
      p.el.style.setProperty("--dk", (0.5 * Math.pow(1 - d, 1.25)).toFixed(3));
      p.el.style.setProperty("--hl", (p.slope ? 0.42 * Math.pow(s, 22) : 0.1 * Math.pow(s, 12)).toFixed(3));
    }
    topFace.style.setProperty("--dk", "0.06");      /* permukaan atas selalu menghadap cahaya */
  }

  /* ---- Gerak ---- */
  var yaw = REST, vel = 0, raf = 0, last = 0, inView = false;
  function apply() {
    spin.style.transform = "rotateY(" + yaw.toFixed(2) + "deg)";
    tilt.style.transform = "rotateX(" + tiltDeg.toFixed(2) + "deg)";
    lit(yaw);
  }
  function tick(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016; last = now;
    yaw += vel * dt; vel *= Math.exp(-2.0 * dt);
    tiltDeg += (tiltTarget - tiltDeg) * (1 - Math.exp(-7 * dt));
    var settling = Math.abs(vel) < 28;
    if (settling) {
      var rest = Math.round((yaw - REST) / 360) * 360 + REST;
      yaw += (rest - yaw) * (1 - Math.exp(-5.5 * dt));
      if (Math.abs(rest - yaw) < 0.06 && Math.abs(vel) < 1.5 && Math.abs(tiltTarget - tiltDeg) < 0.05) { yaw = rest; vel = 0; apply(); raf = 0; last = 0; return; }
    }
    apply();
    raf = (document.hidden ? 0 : requestAnimationFrame(tick));
    if (!raf) last = 0;
  }
  function run() { if (!raf && !reduce) raf = requestAnimationFrame(tick); }
  function kick(v) { if (reduce) return; vel = Math.max(-1000, Math.min(1000, vel + v)); run(); }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && (Math.abs(vel) > 1)) run(); });

  /* ketuk / tekan */
  function release() {
    host.classList.remove("pressing");
    if (reduce) return;
    jump.classList.remove("jump"); void jump.offsetWidth; jump.classList.add("jump");
    kick((vel < 0 ? -1 : 1) * 760);
  }
  host.addEventListener("pointerdown", function () { host.classList.add("pressing"); });
  host.addEventListener("pointerup", function () { if (host.classList.contains("pressing")) release(); });
  host.addEventListener("pointercancel", function () { host.classList.remove("pressing"); });
  host.addEventListener("pointerleave", function () { host.classList.remove("pressing"); tiltTarget = -17; run(); });
  host.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); host.classList.add("pressing"); setTimeout(release, 90); }
  });
  host.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse" || reduce) return;
    var b = host.getBoundingClientRect(), py = (e.clientY - b.top) / b.height - 0.5;
    tiltTarget = -17 + py * -16; run();
  });

  /* gulir: setiap piksel yang digulir saat kerucut terlihat memutar kerucut */
  var lastY = window.pageYOffset;
  window.addEventListener("scroll", function () {
    var y = window.pageYOffset, dy = y - lastY; lastY = y;
    if (inView && dy) kick(dy * 2.4);
  }, { passive: true });
  if ("IntersectionObserver" in window) {
    var was = false;
    new IntersectionObserver(function (es) {
      var e = es[0]; inView = e.isIntersecting;
      if (e.isIntersecting && e.intersectionRatio >= 0.55 && !was) {          /* masuk layar: satu putaran sambutan */
        was = true; var dir = document.documentElement.getAttribute("data-dir") === "up" ? -1 : 1; setTimeout(function () { kick(dir * 640); }, 160);
      }
      if (!e.isIntersecting) was = false;
    }, { threshold: [0, 0.55] }).observe(host);
  } else inView = true;

  apply();
  host.classList.add("ready");
})();

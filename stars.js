/* Latar bintang bergerak untuk bagian paling atas (hero) dan paling bawah (footer).
   Ringan: canvas hanya berjalan saat terlihat, jeda saat tab disembunyikan atau jendela ASTA terbuka. */
(function () {
  "use strict";
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var TINT = ["255,255,255", "255,255,255", "255,255,255", "248,210,74", "248,210,74", "150,230,205"];


  /* Aurora: tirai cahaya hijau-toska-emas, digambar kecil lalu diperbesar agar lembut dan murah. */
  var CURT = [
    { c: [52, 211, 153], y: .30, amp: .075, sp: .16, ph: 0.0, h: .44, a: .50 },
    { c: [45, 190, 205], y: .37, amp: .090, sp: .12, ph: 2.1, h: .38, a: .38 },
    { c: [150, 232, 175], y: .25, amp: .060, sp: .21, ph: 4.0, h: .32, a: .34 },
    { c: [248, 210, 74],  y: .43, amp: .050, sp: .09, ph: 1.2, h: .20, a: .15 }
  ];
  function strip(c) {
    var s = document.createElement("canvas"); s.width = 1; s.height = 64;
    var x = s.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 64), k = c.join(",");
    g.addColorStop(0, "rgba(" + k + ",0)"); g.addColorStop(.5, "rgba(" + k + ",.22)");
    g.addColorStop(.86, "rgba(" + k + ",1)"); g.addColorStop(1, "rgba(" + k + ",0)");
    x.fillStyle = g; x.fillRect(0, 0, 1, 64); return s;
  }
  CURT.forEach(function (k) { k.s = strip(k.c); });
  function Aurora(strength) {
    var ac = document.createElement("canvas"), ax = ac.getContext("2d"), lw = 1, lh = 1, rw = 1, rh = 1;
    return {
      /* Aurora hanya menempati sudut kanan atas: lebar maks. 50% / 560px, tinggi maks. 55% / 340px. */
      size: function (W, H) {
        rw = Math.min(W * .5, 560); rh = Math.min(H * .55, 340);
        lw = Math.max(8, Math.ceil(rw / 6)); lh = Math.max(8, Math.ceil(rh / 6)); ac.width = lw; ac.height = lh;
      },
      draw: function (cx, W, H, t) {
        ax.globalCompositeOperation = "source-over"; ax.clearRect(0, 0, lw, lh); ax.globalCompositeOperation = "lighter";
        for (var j = 0; j < CURT.length; j++) {
          var k = CURT[j];
          for (var x = 0; x < lw; x++) {
            var u = x / lw;
            var yb = (k.y + k.amp * Math.sin(u * 5 + t * k.sp + k.ph) + .03 * Math.sin(u * 13 - t * k.sp * 1.7)) * lh;
            var hh = k.h * lh * (.72 + .28 * Math.sin(u * 7 + t * .3 + k.ph));
            var al = k.a * strength * (.55 + .45 * Math.sin(u * 3.2 - t * .25 + k.ph * 1.3));
            if (al <= .01) continue;
            ax.globalAlpha = al; ax.drawImage(k.s, 0, 0, 1, 64, x, yb - hh, 1, hh);
          }
        }
        ax.globalAlpha = 1;
        /* Pudarkan ke arah kiri-bawah: pusat terang di pojok kanan atas, tepi menghilang halus. */
        ax.save(); ax.globalCompositeOperation = "destination-in"; ax.setTransform(1, 0, 0, lh / lw, lw, 0);
        var m = ax.createRadialGradient(0, 0, 0, 0, 0, lw);
        m.addColorStop(0, "rgba(0,0,0,1)"); m.addColorStop(.35, "rgba(0,0,0,.75)");
        m.addColorStop(.7, "rgba(0,0,0,.25)"); m.addColorStop(1, "rgba(0,0,0,0)");
        ax.fillStyle = m; ax.fillRect(-lw, 0, lw, lw); ax.restore();
        cx.save(); cx.globalCompositeOperation = "lighter"; cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = "high";
        cx.drawImage(ac, 0, 0, lw, lh, W - rw, 0, rw, rh); cx.restore();
      }
    };
  }

  function Field(host, density, shoot, auroraStrength) {
    var cv = document.createElement("canvas"), cx = cv.getContext("2d");
    cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none;display:block";
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    host.style.isolation = "isolate";
    host.appendChild(cv);
    var au = auroraStrength ? Aurora(auroraStrength) : null;
    var W = 0, H = 0, stars = [], star = null, nextShoot = 2 + Math.random() * 3, visible = false, last = 0, raf = 0, acc = 0, t = 0;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function seed() {
      var n = Math.max(24, Math.min(150, Math.round(W * H / density)));
      stars = [];
      for (var i = 0; i < n; i++) {
        var z = Math.random();                       /* 0 jauh ... 1 dekat */
        stars.push({
          x: Math.random() * W, y: Math.random() * H, z: z,
          r: 0.55 + z * 1.35, v: 3 + z * 13,
          ph: Math.random() * 6.28, sp: rnd(0.6, 2.2),
          c: TINT[(Math.random() * TINT.length) | 0],
          sparkle: z > 0.86
        });
      }
    }
    function size() {
      var r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      cx.setTransform(DPR, 0, 0, DPR, 0, 0); if (au) au.size(W, H); seed(); draw(0);
    }
    function draw(dt) {
      cx.clearRect(0, 0, W, H);
      t += dt;
      if (au) au.draw(cx, W, H, t + 3);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.v * dt * 0.8; s.y -= s.v * dt * 0.45;      /* melayang pelan ke kanan atas */
        if (s.x > W + 4) s.x = -4; if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W; }
        var a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.ph + t * s.sp));
        cx.fillStyle = "rgba(" + s.c + "," + (a * (0.55 + s.z * 0.45)).toFixed(3) + ")";
        cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 6.2832); cx.fill();
        if (s.sparkle) {
          var L = 3 + 4 * a; cx.strokeStyle = "rgba(" + s.c + "," + (a * 0.55).toFixed(3) + ")"; cx.lineWidth = 0.8;
          cx.beginPath(); cx.moveTo(s.x - L, s.y); cx.lineTo(s.x + L, s.y); cx.moveTo(s.x, s.y - L); cx.lineTo(s.x, s.y + L); cx.stroke();
        }
      }
      if (shoot && !reduce) {
        if (!star) { nextShoot -= dt; if (nextShoot <= 0) { star = { x: rnd(W * 0.35, W * 1.05), y: rnd(-10, H * 0.35), life: 0, len: rnd(90, 150), sp: rnd(520, 700) }; nextShoot = rnd(5, 9); } }
        else {
          star.life += dt; var d = star.sp * dt; star.x -= d * 0.86; star.y += d * 0.5;
          var f = Math.max(0, 1 - star.life / 1.1), tx = star.x + star.len * 0.86, ty = star.y - star.len * 0.5;
          var g = cx.createLinearGradient(star.x, star.y, tx, ty);
          g.addColorStop(0, "rgba(255,244,190," + (0.95 * f).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,244,190,0)");
          cx.strokeStyle = g; cx.lineWidth = 1.6; cx.lineCap = "round"; cx.beginPath(); cx.moveTo(star.x, star.y); cx.lineTo(tx, ty); cx.stroke();
          if (star.life > 1.1 || star.x < -160 || star.y > H + 160) star = null;
        }
      }
    }
    function paused() { var ai = document.getElementById("ai-app"); return document.hidden || (ai && !ai.hidden); }
    function loop(now) {
      raf = 0; if (!visible) return;
      if (paused()) { last = 0; raf = requestAnimationFrame(loop); return; }
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      acc += dt;
      if (acc >= 1 / 40) { draw(acc); acc = 0; }               /* ~40 gambar per detik */
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(loop); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); else stop(); }, { rootMargin: "80px" }).observe(host);
    } else { visible = true; start(); }
    if ("ResizeObserver" in window) new ResizeObserver(function () { if (Math.abs(host.clientWidth - W) > 1 || Math.abs(host.clientHeight - H) > 1) size(); }).observe(host);
    window.addEventListener("resize", size);
    size();
  }

  var hero = document.getElementById("beranda"), foot = document.getElementById("kontak");
  if (hero) Field(hero, 7000, true, 1);
  if (foot) Field(foot, 9000, false, .55);
})();

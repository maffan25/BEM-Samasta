/* qr.js: pembuat QR Code mandiri (mode byte, koreksi galat L/M, versi 1-20).
   Tanpa pustaka luar dan tanpa internet. Dipakai oleh Samasta Corner untuk barcode absensi.
   Pemakaian:
     var q = QR.make("https://contoh.id/#corner/irjen/isi/abc");   // {size, get(x,y)}
     el.innerHTML = QR.svg(q, {border: 3, dark: "#0d2a38", light: "#ffffff"});
     QR.canvas(canvasEl, q, 12, 3);                                  // untuk unduh PNG */
(function (root) {
  "use strict";

  var ECC_PER = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26]
  };
  var NBLK = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16]
  };
  var FMT = { L: 1, M: 0 };
  var MAXV = 20;

  function rawModules(v) {
    var r = (16 * v + 128) * v + 64;
    if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  }
  function dataCw(v, e) { return Math.floor(rawModules(v) / 8) - ECC_PER[e][v] * NBLK[e][v]; }

  /* ---- Reed-Solomon di GF(256) ---- */
  function gmul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; }
  function rsDiv(deg) {
    var r = [], i, j, root = 1;
    for (i = 0; i < deg - 1; i++) r.push(0);
    r.push(1);
    for (i = 0; i < deg; i++) {
      for (j = 0; j < r.length; j++) { r[j] = gmul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = gmul(root, 2);
    }
    return r;
  }
  function rsRem(data, div) {
    var r = div.map(function () { return 0; });
    data.forEach(function (b) {
      var f = b ^ r.shift(); r.push(0);
      div.forEach(function (c, i) { r[i] ^= gmul(c, f); });
    });
    return r;
  }

  function utf8(s) {
    var u = unescape(encodeURIComponent(String(s))), out = [], i;
    for (i = 0; i < u.length; i++) out.push(u.charCodeAt(i));
    return out;
  }

  function alignPos(v) {
    if (v === 1) return [];
    var n = Math.floor(v / 7) + 2, size = v * 4 + 17;
    var step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2, r = [6];
    for (var p = size - 7; r.length < n; p -= step) r.splice(1, 0, p);
    return r;
  }

  function bitsOf(bytes, v, e) {
    var bits = [];
    function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); }
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16);
    bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCw(v, e) * 8;
    put(0, Math.min(4, cap - bits.length));
    put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var out = [];
    for (var i = 0; i < bits.length; i += 8) {
      var b = 0; for (var k = 0; k < 8; k++) b = (b << 1) | bits[i + k];
      out.push(b);
    }
    return out;
  }

  function interleave(data, v, e) {
    var nb = NBLK[e][v], epb = ECC_PER[e][v], raw = Math.floor(rawModules(v) / 8);
    var shortBlocks = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDiv(epb), blocks = [], k = 0, i;
    for (i = 0; i < nb; i++) {
      var len = shortLen - epb + (i < shortBlocks ? 0 : 1);
      var dat = data.slice(k, k + len); k += len;
      var ecc = rsRem(dat, div);
      if (i < shortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }
    var res = [];
    for (i = 0; i < blocks[0].length; i++) {
      blocks.forEach(function (b, j) { if (i !== shortLen - epb || j >= shortBlocks) res.push(b[i]); });
    }
    return res;
  }

  function matrix(v, e, cw) {
    var size = v * 4 + 17, m = [], fn = [], x, y;
    for (y = 0; y < size; y++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    function set(px, py, dark) { if (px >= 0 && px < size && py >= 0 && py < size) { m[py][px] = !!dark; fn[py][px] = true; } }
    for (x = 0; x < size; x++) { set(6, x, x % 2 === 0); set(x, 6, x % 2 === 0); }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    var ap = alignPos(v), n = ap.length;
    ap.forEach(function (ax, i) { ap.forEach(function (ay, j) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return;
      for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }); });
    /* cadangkan area format agar tidak terisi data */
    function format(mask) {
      var data = (FMT[e] << 3) | mask, rem = data, i;
      for (i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var bits = ((data << 10) | rem) ^ 0x5412;
      function b(k) { return ((bits >>> k) & 1) !== 0; }
      for (i = 0; i <= 5; i++) set(8, i, b(i));
      set(8, 7, b(6)); set(8, 8, b(7)); set(7, 8, b(8));
      for (i = 9; i < 15; i++) set(14 - i, 8, b(i));
      for (i = 0; i < 8; i++) set(size - 1 - i, 8, b(i));
      for (i = 8; i < 15; i++) set(8, size - 15 + i, b(i));
      set(8, size - 8, true);
    }
    format(0);
    if (v >= 7) {
      var rem = v, i;
      for (i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      var bits = (v << 12) | rem;
      for (i = 0; i < 18; i++) {
        var c = ((bits >>> i) & 1) !== 0, a = size - 11 + i % 3, b = Math.floor(i / 3);
        set(a, b, c); set(b, a, c);
      }
    }
    /* data zig-zag */
    var bi = 0, total = cw.length * 8;
    for (var right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (var vert = 0; vert < size; vert++) for (var j = 0; j < 2; j++) {
        var xx = right - j, up = ((right + 1) & 2) === 0, yy = up ? size - 1 - vert : vert;
        if (!fn[yy][xx] && bi < total) { m[yy][xx] = ((cw[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0; bi++; }
      }
    }
    return { m: m, fn: fn, size: size, format: format };
  }

  function maskBit(k, x, y) {
    switch (k) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return x * y % 2 + x * y % 3 === 0;
      case 6: return (x * y % 2 + x * y % 3) % 2 === 0;
      default: return ((x + y) % 2 + x * y % 3) % 2 === 0;
    }
  }

  function penalty(m, size) {
    var p = 0, x, y, run, i;
    function line(get) {
      run = 1;
      for (i = 1; i < size; i++) {
        if (get(i) === get(i - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
      }
    }
    for (y = 0; y < size; y++) line(function (k) { return m[y][k]; });
    for (x = 0; x < size; x++) line(function (k) { return m[k][x]; });
    for (y = 0; y < size - 1; y++) for (x = 0; x < size - 1; x++) {
      var c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
    }
    var pat = [true, false, true, true, true, false, true, false, false, false, false];
    function scan(get) {
      for (var s = 0; s + 11 <= size; s++) {
        var a = true, b = true;
        for (var k = 0; k < 11; k++) { var val = get(s + k); if (val !== pat[k]) a = false; if (val !== pat[10 - k]) b = false; }
        if (a || b) p += 40;
      }
    }
    for (y = 0; y < size; y++) scan(function (k) { return m[y][k]; });
    for (x = 0; x < size; x++) scan(function (k) { return m[k][x]; });
    var dark = 0; for (y = 0; y < size; y++) for (x = 0; x < size; x++) if (m[y][x]) dark++;
    p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    return p;
  }

  function make(text, level) {
    var bytes = utf8(text), levels = level ? [level] : ["M", "L"], e, v, found = null;
    for (var li = 0; li < levels.length && !found; li++) {
      e = levels[li];
      for (v = 1; v <= MAXV; v++) {
        var need = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
        if (need <= dataCw(v, e) * 8) { found = { v: v, e: e }; break; }
      }
    }
    if (!found) throw new Error("Teks terlalu panjang untuk QR");
    var cw = interleave(bitsOf(bytes, found.v, found.e), found.v, found.e), best = null, bestP = Infinity;
    for (var k = 0; k < 8; k++) {
      var g = matrix(found.v, found.e, cw), size = g.size;
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (!g.fn[y][x] && maskBit(k, x, y)) g.m[y][x] = !g.m[y][x];
      g.format(k);
      var pe = penalty(g.m, size);
      if (pe < bestP) { bestP = pe; best = g; }
    }
    var M = best.m, S = best.size;
    return { size: S, version: found.v, level: found.e, get: function (x, y) { return x >= 0 && y >= 0 && x < S && y < S && M[y][x]; } };
  }

  function svg(q, o) {
    o = o || {};
    var b = o.border == null ? 3 : o.border, dark = o.dark || "#000", light = o.light || "#fff", s = q.size + b * 2, d = "";
    for (var y = 0; y < q.size; y++) {
      var x = 0;
      while (x < q.size) {
        if (!q.get(x, y)) { x++; continue; }
        var st = x; while (x < q.size && q.get(x, y)) x++;
        d += "M" + (st + b) + " " + (y + b) + "h" + (x - st) + "v1h" + (st - x) + "z";
      }
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + " " + s + '" shape-rendering="crispEdges" role="img" aria-label="' + (o.label || "Kode QR") + '">' +
      '<rect width="' + s + '" height="' + s + '" fill="' + light + '"/><path d="' + d + '" fill="' + dark + '"/></svg>';
  }

  function canvas(cv, q, px, border) {
    px = px || 10; border = border == null ? 3 : border;
    var s = (q.size + border * 2) * px; cv.width = cv.height = s;
    var c = cv.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, s, s); c.fillStyle = "#0d2a38";
    for (var y = 0; y < q.size; y++) for (var x = 0; x < q.size; x++) if (q.get(x, y)) c.fillRect((x + border) * px, (y + border) * px, px, px);
    return cv;
  }

  root.QR = { make: make, svg: svg, canvas: canvas };
})(typeof window !== "undefined" ? window : this);

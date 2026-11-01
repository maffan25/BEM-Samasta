/* corner-icons.js: ikon bola corner (48x48, dua warna). Dipakai beranda dan editor admin.
   Kelas: f = warna utama ikon, a = aksen, s = garis. Warna diatur lewat --ot dan --oa pada bola. */
window.CORNER_ORB = {
  megafon: '<path class="f" d="M5 19.5c0-1.7 1.3-3 3-3h5.5L29 8v32L13.5 31.5H8c-1.7 0-3-1.3-3-3z"/><ellipse class="a" cx="29" cy="24" rx="3.2" ry="16"/><path class="a" d="M10.500 32l2.300 8.500c.3 1 1.200 1.600 2.200 1.600h1.800c1.200 0 2-1.100 1.700-2.200L16.500 31.500z"/><path class="s" d="M36 17c2.200 1.900 3.200 4 3.200 7s-1 5.100-3.200 7M41 12.500c3.500 3 5 6.700 5 11.500s-1.500 8.500-5 11.500"/>',
  perisai: '<path class="f" d="M24 3.500l17 6.200V22c0 10.500-7.200 17.800-17 22.500C14.200 39.800 7 32.500 7 22V9.700z"/><path class="a" d="M24 9l11.500 4.200V22c0 7.400-4.800 12.800-11.500 16.800C17.300 34.800 12.500 29.400 12.500 22v-8.800z" opacity=".55"/><path class="s" d="M17.500 23.500l4.700 4.700 8.800-9.700"/>',
  bintang: '<path class="f" d="M24 4l5.600 11.600 12.700 1.700-9.300 8.800 2.300 12.600L24 32.500 12.700 38.700 15 26.100 5.700 17.300l12.700-1.700z"/><path class="a" d="M24 11l3.300 6.900 7.500 1-5.500 5.200 1.400 7.500L24 28l-6.700 3.600 1.400-7.500-5.500-5.200 7.500-1z" opacity=".5"/>',
  buku: '<path class="f" d="M8 9a3 3 0 013-3h26v33H11a3 3 0 00-3 3z"/><path class="a" d="M8 42a3 3 0 013-3h26v3H11a3 3 0 00-3 3z" opacity=".7"/><path class="s" d="M15 14h16M15 20h16M15 26h9"/>',
  orang: '<circle class="f" cx="17" cy="16" r="6.500"/><circle class="a" cx="33" cy="18" r="5.500"/><path class="f" d="M5 40c.7-8 5.500-12 12-12s11.300 4 12 12z"/><path class="a" d="M30 29c6-.8 11.500 2.600 12.500 11H31c-.3-4.200-.9-7.500-1-11z" opacity=".75"/>',
  hati: '<path class="f" d="M24 41S6 31 6 18.500C6 12.200 10.700 8 16 8c3.600 0 6.600 1.800 8 4.800C25.400 9.800 28.400 8 32 8c5.300 0 10 4.200 10 10.500C42 31 24 41 24 41z"/><path class="a" d="M14 16c1-2.500 3-3.500 5.500-3.500" fill="none" stroke="var(--oa)" stroke-width="3" stroke-linecap="round" opacity=".5"/>',
  papan: '<rect class="f" x="8" y="7" width="32" height="37" rx="5"/><rect class="a" x="16" y="3.500" width="16" height="8" rx="3"/><path class="s" d="M15 21h18M15 28h18M15 35h10"/>',
  pesan: '<path class="f" d="M6 11a4 4 0 014-4h28a4 4 0 014 4v19a4 4 0 01-4 4H22l-9 8v-8h-3a4 4 0 01-4-4z"/><circle class="a" cx="17" cy="20.500" r="2.500"/><circle class="a" cx="24" cy="20.500" r="2.500"/><circle class="a" cx="31" cy="20.500" r="2.500"/>',
  kalender: '<rect class="f" x="6" y="9" width="36" height="34" rx="6"/><path class="a" d="M6 17a6 6 0 016-6h24a6 6 0 016 6v3H6z"/><path class="s" d="M16 5v8M32 5v8"/><circle class="a" cx="17" cy="30" r="2.800"/><circle class="a" cx="31" cy="30" r="2.800"/>',
  bendera: '<path class="a" d="M10 6v38" stroke="var(--oa)" stroke-width="4" stroke-linecap="round"/><path class="f" d="M12 8c8-4.500 13 4.500 24 0v20c-11 4.500-16-4.500-24 0z"/>'
};
window.CORNER_TONES = {
  zamrud:  { o1: "#4cc3a3", o2: "#14705a", o3: "#082f27", ot: "#fbe58a", oa: "#0a3b30" },
  emas:    { o1: "#fff3b0", o2: "#f8d24a", o3: "#b8861f", ot: "#0d2a38", oa: "#ffe98f" },
  samudra: { o1: "#7accea", o2: "#1d6f8f", o3: "#0a2f40", ot: "#fff6d6", oa: "#0c3548" },
  perunggu:{ o1: "#ecd08f", o2: "#8a6a2f", o3: "#3f2f0e", ot: "#fff6d6", oa: "#47350f" },
  tinta:   { o1: "#628fa3", o2: "#17414d", o3: "#041218", ot: "#f8d24a", oa: "#06171f" }
};
window.CORNER_ORB_SVG = function (k, cls) {
  return '<svg class="' + (cls || "cn-oi") + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + (window.CORNER_ORB[k] || window.CORNER_ORB.bintang) + "</svg>";
};

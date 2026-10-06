/* =====================================================================
   Pujian & Kritik anonim, BEM STDIIS
   Pesan dikirim ke Google Sheets lewat Google Apps Script (Web App).
   Langkah pemasangan lengkap ada di PANDUAN-ASPIRASI.txt
   ===================================================================== */
(function () {
  "use strict";

  var CONFIG = {
    // Tempel URL Web App Apps Script di sini (berakhiran /exec).
    ENDPOINT: "",
    MIN: 10,            // minimal karakter pesan
    MAX: 1000,          // maksimal karakter pesan
    COOLDOWN_MS: 20000  // jeda antar pengiriman dari perangkat yang sama
  };

  var MODES = {
    pujian: { jenis: "Pujian", q: "Apa yang ingin kamu apresiasi?",
              ph: "Ceritakan hal baik yang kamu lihat atau rasakan.", ok: "Terima kasih. Pujianmu sudah terkirim secara anonim." },
    kritik: { jenis: "Kritik", q: "Apa yang menurutmu perlu diperbaiki?",
              ph: "Sampaikan dengan jelas dan sopan agar mudah ditindaklanjuti.", ok: "Terima kasih. Kritikmu sudah terkirim secara anonim." }
  };

  var pick = document.getElementById("asp-pick"), form = document.getElementById("asp-form");
  if (!pick || !form) return;
  var to = document.getElementById("asp-to"), q = document.getElementById("asp-q"),
      msg = document.getElementById("asp-msg"), cnt = document.getElementById("asp-count"),
      hp = document.getElementById("asp-hp"), send = document.getElementById("asp-send"),
      status = document.getElementById("asp-status"), modeBtns = form.querySelectorAll("[data-mode]");

  var st = { item: null, person: null, mode: "" }, busy = false;

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function txt(el) { return el.textContent.replace(/\s+/g, " ").trim(); }

  /* ---------- Data penerima: dibaca dari bagian Kepengurusan, jadi selalu sinkron ---------- */
  function collect() {
    var pim = { title: "Pimpinan dan pengawas", items: [] }, kem = { title: "Kementerian", items: [] }, bir = { title: "Biro", items: [] };
    var seen = {};
    document.querySelectorAll("#pengurus .leader").forEach(function (l) {
      var role = txt(l.querySelector("p")), name = txt(l.querySelector("h4")), full = role.replace(/\s*\d+$/, "");
      var it = seen[full];
      if (!it) { it = seen[full] = { label: full.replace(/\s*BEM$/, ""), full: full, people: [] }; pim.items.push(it); }
      it.people.push({ name: name, role: role });
    });
    document.querySelectorAll("#pengurus .units").forEach(function (box) {
      var h = box.previousElementSibling, title = h ? txt(h) : "";
      box.querySelectorAll(".unit").forEach(function (u) {
        var full = txt(u.querySelector(".u-name")), m = full.match(/\(([^)]+)\)/);
        var it = {
          label: m ? m[1] : full.replace(/^(Kementerian|Biro)\s+/, ""), full: full,
          people: [].map.call(u.querySelectorAll("li"), function (li) { return { name: txt(li), role: full }; })
        };
        (title === "Kementerian" ? kem : title === "Biro" ? bir : pim).items.push(it);
      });
    });
    return [pim, kem, bir].filter(function (g) { return g.items.length; });
  }
  var G = collect();

  function render() {
    pick.innerHTML = G.map(function (g, gi) {
      return '<div class="asp-g"><h3>' + esc(g.title) + '</h3>' +
        '<div class="asp-chips" role="group" aria-label="Pilih bagian: ' + esc(g.title) + '">' +
        g.items.map(function (it, ii) {
          return '<button type="button" class="chip" aria-pressed="false" data-g="' + gi + '" data-i="' + ii + '">' + esc(it.label) + '</button>';
        }).join("") + '</div><div class="asp-names" hidden></div></div>';
    }).join("");
  }

  function namesHTML(it) {
    var h = '<p>Pilih siapa yang dituju</p><div class="asp-chips" role="group" aria-label="Pilih nama">';
    if (it.people.length > 1) h += '<button type="button" class="chip person" aria-pressed="false" data-p="all">Seluruh bagian</button>';
    it.people.forEach(function (p, pi) {
      h += '<button type="button" class="chip person" aria-pressed="false" data-p="' + pi + '">' + esc(p.name) +
        (p.role !== it.full ? ' <small>' + esc(p.role) + '</small>' : "") + '</button>';
    });
    return h + "</div>";
  }

  function setPressed(nodes, fn) { [].forEach.call(nodes, function (n) { n.setAttribute("aria-pressed", fn(n) ? "true" : "false"); }); }

  function refreshTarget() {
    if (!st.item || st.person == null) {
      to.innerHTML = '<p class="asp-empty">' + (st.item ? "Pilih nama yang dituju." : "Pilih bagian dan namanya dulu.") + "</p>";
      return;
    }
    if (st.person === "all") to.innerHTML = "<b>Seluruh bagian</b><span>" + esc(st.item.full) + "</span>";
    else { var p = st.item.people[st.person]; to.innerHTML = "<b>" + esc(p.name) + "</b><span>" + esc(p.role) + "</span>"; }
  }

  function choosePerson(val, scroll) {
    st.person = val === "all" ? "all" : +val;
    var g = pick.querySelector('.asp-names:not([hidden])');
    if (g) setPressed(g.querySelectorAll(".person"), function (n) { return n.getAttribute("data-p") === String(st.person); });
    refreshTarget(); clearStatus();
    if (scroll && window.matchMedia("(max-width:900px)").matches) form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  pick.addEventListener("click", function (e) {
    var c = e.target.closest(".chip"); if (!c) return;
    if (c.classList.contains("person")) { choosePerson(c.getAttribute("data-p"), true); return; }
    var gi = +c.getAttribute("data-g"), ii = +c.getAttribute("data-i");
    st.item = G[gi].items[ii]; st.person = null;
    setPressed(pick.querySelectorAll(".chip:not(.person)"), function (n) { return n === c; });
    [].forEach.call(pick.querySelectorAll(".asp-names"), function (n) { n.hidden = true; n.innerHTML = ""; });
    var tray = c.closest(".asp-g").querySelector(".asp-names");
    tray.innerHTML = namesHTML(st.item); tray.hidden = false;
    if (st.item.people.length === 1) choosePerson(0, true); else { refreshTarget(); clearStatus(); }
  });

  /* ---------- Pujian / kritik: latar & pertanyaan ikut berubah ---------- */
  function setMode(m) {
    st.mode = m; form.setAttribute("data-mode", m);
    setPressed(modeBtns, function (b) { return b.getAttribute("data-mode") === m; });
    q.textContent = MODES[m].q; msg.placeholder = MODES[m].ph; msg.disabled = false;
    clearStatus();
  }
  [].forEach.call(modeBtns, function (b) { b.addEventListener("click", function () { setMode(b.getAttribute("data-mode")); }); });

  msg.addEventListener("input", function () { cnt.textContent = msg.value.length + "/" + CONFIG.MAX; clearStatus(); });

  /* ---------- Kirim ---------- */
  function say(t, kind) { status.className = "asp-status" + (kind ? " " + kind : ""); status.textContent = t; }
  function clearStatus() { if (!busy) say("", ""); }
  function lastSent() { try { return +localStorage.getItem("asp_last") || 0; } catch (e) { return 0; } }
  function markSent() { try { localStorage.setItem("asp_last", String(Date.now())); } catch (e) {} }

  form.addEventListener("submit", function (e) {
    e.preventDefault(); if (busy) return;
    if (!st.item || st.person == null) return say("Pilih bagian dan nama yang dituju dulu.", "err");
    if (!st.mode) return say("Pilih pujian atau kritik dulu.", "err");
    var text = msg.value.trim();
    if (text.length < CONFIG.MIN) return say("Tulis minimal " + CONFIG.MIN + " karakter agar pesanmu bisa dipahami.", "err");
    var wait = CONFIG.COOLDOWN_MS - (Date.now() - lastSent());
    if (wait > 0) return say("Tunggu " + Math.ceil(wait / 1000) + " detik sebelum mengirim lagi.", "err");

    var m = MODES[st.mode];
    var payload = {
      jenis: m.jenis, bagian: st.item.full,
      penerima: st.person === "all" ? "Seluruh bagian" : st.item.people[st.person].name,
      pesan: text.slice(0, CONFIG.MAX), website: hp.value
    };
    function done() { busy = false; send.disabled = false; send.textContent = "Kirim secara anonim"; }
    function success() { msg.value = ""; cnt.textContent = "0/" + CONFIG.MAX; markSent(); say(m.ok, "ok"); }

    if (hp.value) { success(); return; } /* jebakan bot: tampak berhasil, tidak dikirim */
    if (!CONFIG.ENDPOINT) {
      if (window.console) console.warn("[Aspirasi] ENDPOINT belum diisi di aspirasi.js. Lihat PANDUAN-ASPIRASI.txt.");
      return say("Formulir belum tersambung ke Google Sheets. Mohon hubungi pengurus.", "err");
    }
    busy = true; send.disabled = true; send.textContent = "Mengirim..."; say("", "");
    var ctl = window.AbortController ? new AbortController() : null, to_ = ctl && setTimeout(function () { ctl.abort(); }, 20000);
    fetch(CONFIG.ENDPOINT, {
      method: "POST", mode: "no-cors", credentials: "omit", referrerPolicy: "no-referrer",
      headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), signal: ctl ? ctl.signal : undefined
    }).then(function () { clearTimeout(to_); done(); success(); })
      .catch(function () { clearTimeout(to_); done(); say("Pesan belum terkirim. Periksa koneksimu lalu coba lagi.", "err"); });
  });

  render(); refreshTarget();

  /* Muncul halus saat digulir, memakai sistem animasi scroll yang sudah ada */
  if (window.__rv) {
    window.__rv(document.querySelectorAll("#aspirasi .sec-head"));
    window.__rv(document.querySelectorAll("#aspirasi .asp-wrap>*"), "rv-z");
  }
})();

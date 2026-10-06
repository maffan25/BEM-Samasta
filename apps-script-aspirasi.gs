/**
 * BEM STDIIS | Penerima Pujian & Kritik anonim
 * Tempel seluruh kode ini di Google Sheets: Ekstensi > Apps Script.
 * Panduan lengkap: PANDUAN-ASPIRASI.txt
 */
var SHEET_NAME = 'Aspirasi';
var MIN_LEN = 10;
var MAX_LEN = 1000;

function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    var d = JSON.parse(raw);

    // Jebakan bot: kolom tersembunyi ini hanya terisi oleh bot
    if (d.website) return reply_({ ok: true });

    var jenis = clean_(d.jenis, 10);
    if (jenis !== 'Pujian' && jenis !== 'Kritik') return reply_({ ok: false, error: 'jenis' });

    var bagian = clean_(d.bagian, 80);
    var penerima = clean_(d.penerima, 80);
    var pesan = clean_(d.pesan, MAX_LEN);
    if (!bagian || !penerima || pesan.length < MIN_LEN) return reply_({ ok: false, error: 'data' });

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      // Hanya waktu server yang dicatat. Tidak ada nama, email, atau IP pengirim.
      sheet_().appendRow([new Date(), jenis, bagian, penerima, pesan]);
    } finally {
      lock.releaseLock();
    }
    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: 'server' });
  }
}

// Buka URL Web App di browser untuk mengecek apakah endpoint aktif
function doGet() {
  return reply_({ ok: true, info: 'Endpoint Aspirasi BEM STDIIS aktif' });
}

function clean_(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Waktu', 'Jenis', 'Bagian', 'Penerima', 'Pesan']);
    sh.setFrozenRows(1);
    sh.getRange('1:1').setFontWeight('bold');
    // Kolom B:E diformat sebagai teks agar isi pesan tidak pernah dibaca sebagai rumus
    sh.getRange('B:E').setNumberFormat('@');
    sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm:ss');
    sh.getRange('E:E').setWrap(true);
    sh.setColumnWidth(1, 150);
    sh.setColumnWidth(3, 220);
    sh.setColumnWidth(4, 200);
    sh.setColumnWidth(5, 520);
  }
  return sh;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

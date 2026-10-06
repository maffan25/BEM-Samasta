/**
 * BEM STDIIS | Penerima Pujian & Kritik anonim (versi 2)
 * Tempel seluruh kode ini di Google Sheets: Ekstensi > Apps Script.
 * Panduan lengkap: PANDUAN-ASPIRASI.txt
 */
var SHEET_ID = '';          // OPSIONAL. Isi ID Spreadsheet bila skrip dibuat terpisah dari Sheet.
                            // ID = bagian di URL Sheet: docs.google.com/spreadsheets/d/<ID>/edit
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

    var sh = sheet_();
    if (!sh) return reply_({ ok: false, error: 'nosheet' });

    var lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      // Hanya waktu server yang dicatat. Tidak ada nama, email, atau IP pengirim.
      sh.appendRow([new Date(), jenis, bagian, penerima, pesan]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }
    return reply_({ ok: true });
  } catch (err) {
    console.error(err);
    return reply_({ ok: false, error: 'server' });
  }
}

// Buka URL Web App di browser: harus muncul "ok":true DAN "sheet":"terhubung"
function doGet() {
  var sh = null, msg = '';
  try { sh = sheet_(); } catch (err) { msg = String(err); }
  return reply_({
    ok: true,
    info: 'Endpoint Aspirasi BEM STDIIS aktif',
    sheet: sh ? 'terhubung' : 'TIDAK terhubung ke Spreadsheet',
    detail: msg
  });
}

// Jalankan SEKALI secara manual (pilih "setup" lalu klik Jalankan) untuk memberi izin
// dan membuat tab "Aspirasi". Setelah itu lakukan Terapkan > Deployment baru.
function setup() {
  var sh = sheet_();
  if (!sh) throw new Error('Tidak ada Spreadsheet. Pasang kode lewat Ekstensi > Apps Script dari dalam Sheet, atau isi SHEET_ID.');
  Logger.log('OK, tab "' + sh.getName() + '" siap di Spreadsheet: ' + sh.getParent().getUrl());
}

function clean_(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim()
    .slice(0, max);
}

function sheet_() {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;
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

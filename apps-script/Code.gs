// ARA Scales: receives logged weights from the ARA Scales web app and records them on the Results tab.
// Paste into Extensions > Apps Script of the "ARA Scales Results" sheet, then Deploy > New deployment >
// Web app, Execute as: Me, Who has access: Anyone. Send the Web app URL to be added to the app.
//
// It only ever adds rows or marks a row UNDONE. It never deletes or returns sheet data.

const KEY = 'ara-Wr7anc-eLnj3NmARg3vUutPP';  // must match the key in the web app
const SHEET_NAME = 'Results';
const COLS = 14;          // ID .. App version
const STATUS_COL = 13;    // "Status"
const MAX_ITEMS = 200;    // per request

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e && e.postData ? e.postData.contents : '');
  } catch (err) {
    return reply({ ok: false, error: 'bad request' });
  }
  if (!body || body.key !== KEY) return reply({ ok: false, error: 'not authorised' });
  const items = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
  const version = clean(body.version, 12);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    const last = sheet.getLastRow();
    const existing = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues() : [];
    const rowOf = new Map();                       // id -> sheet row already on the sheet
    existing.forEach((r, i) => rowOf.set(String(r[0]), i + 2));
    const fresh = [];                              // rows to append this request
    const freshIdx = new Map();                    // id -> index in fresh
    const done = [];
    const now = new Date();

    for (const it of items) {
      const id = String((it && it.id) || '');
      if (!/^[A-Za-z0-9-]{6,40}$/.test(id)) continue;
      if (it.action === 'log') {
        if (!rowOf.has(id) && !freshIdx.has(id)) {
          const x = it.entry || {};
          freshIdx.set(id, fresh.length);
          fresh.push([id, now, toDate(x.time), clean(x.event, 100), clean(x.location, 100), clean(x.inspector, 60),
            clean(x.car, 8), num(x.raw), num(x.spares), num(x.target), num(x.margin), clean(x.status, 60), 'OK', version]);
        }
        done.push(id);
      } else if (it.action === 'undo') {
        if (freshIdx.has(id)) fresh[freshIdx.get(id)][STATUS_COL - 1] = 'UNDONE';
        else if (rowOf.has(id)) sheet.getRange(rowOf.get(id), STATUS_COL).setValue('UNDONE');
        done.push(id);                             // nothing to undo is still "done"
      }
    }
    if (fresh.length) sheet.getRange(sheet.getLastRow() + 1, 1, fresh.length, COLS).setValues(fresh);
    return reply({ ok: true, done: done });
  } finally {
    lock.releaseLock();
  }
}

// Lets you check the deployment in a browser: it should say "ARA Scales upload is running".
function doGet() {
  return ContentService.createTextOutput('ARA Scales upload is running');
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Text cells: trimmed, length-limited, and never treated as a formula.
function clean(v, max) {
  let s = String(v == null ? '' : v).replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : '';
}

function toDate(v) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d;
}

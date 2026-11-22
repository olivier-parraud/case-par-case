/* Case par Case — liseuse de BD et mangas case par case.
   Les tomes sont lus dans Google Drive (dossier « Mangas : Comics »), gardés sur l'appareil pour le hors-ligne,
   et la page en cours est synchronisée dans l'espace privé de l'appli sur le Drive. */
(() => {
'use strict';

/* ---------- Réglages ---------- */
const CLIENT_ID = '550871687539-1a6117ng62v9gtvmvhaoguktpbps1aqi.apps.googleusercontent.com';
const ROOT_ID = '1IGeMbOajUZ-9hbGRyJ4NeV23KKcBQINM';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.appdata';
const PROD = 'https://olivier-parraud.github.io/case-par-case/';
const REDIRECT = location.href.startsWith(PROD) ? PROD : location.origin + location.pathname;
const DRIVE = 'https://www.googleapis.com/drive/v3/';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/';
const FOLDER = 'application/vnd.google-apps.folder';
const SHORTCUT = 'application/vnd.google-apps.shortcut';
const ALL = 'supportsAllDrives=true&includeItemsFromAllDrives=true';
const VERSION = '1.2';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const natural = (a, b) => a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' });
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtSize = (b) => b >= 1e9 ? (b / 1e9).toFixed(1).replace('.', ',') + ' Go' : Math.max(1, Math.round(b / 1e6)) + ' Mo';
const plural = (n, w) => n + ' ' + w + (n > 1 ? 's' : '');
const STANDALONE = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
const IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const MOBILE = matchMedia('(pointer: coarse)').matches;
const TOME_RE = /\.(pdf|cbz|zip|cbr|rar|cb7|7z)$/i;
const IMG_RE = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;
const ICON = {
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v9M8 12.5l4 4 4-4"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
  ring: (p) => '<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="3"/><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + (94.2 * p).toFixed(1) + ' 94.2" transform="rotate(-90 18 18)"/></svg>'
};

let toastT = 0;
function toast(msg, ms = 2800) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}

if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js?v=5';

/* ---------- Stockage sur l'appareil (IndexedDB) ---------- */
let dbP = null;
function idb() {
  if (!dbP) dbP = new Promise((res, rej) => {
    try {
      const r = indexedDB.open('casparcase', 1);
      r.onupgradeneeded = () => { const d = r.result; for (const n of ['files', 'meta', 'covers']) if (!d.objectStoreNames.contains(n)) d.createObjectStore(n); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
  return dbP;
}
async function tx(name, mode, fn) {
  const d = await idb();
  return new Promise((res, rej) => {
    const t = d.transaction(name, mode), r = fn(t.objectStore(name));
    t.oncomplete = () => res(r ? r.result : undefined);
    t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  });
}
const idbGet = (n, k) => tx(n, 'readonly', (s) => s.get(k));
const idbPut = (n, k, v) => tx(n, 'readwrite', (s) => s.put(v, k));
const idbDel = (n, k) => tx(n, 'readwrite', (s) => s.delete(k));
const idbAll = (n) => tx(n, 'readonly', (s) => s.getAll());

const LOCAL = new Map(); // id -> { id, pinned, at, bytes, kind }
async function loadLocal() { try { for (const m of await idbAll('meta')) if (m && m.id) LOCAL.set(m.id, m); } catch (e) {} }
async function putLocal(id, data, pinned) {
  const bytes = data.blobs.reduce((s, b) => s + b.size, 0);
  await idbPut('files', id, { kind: data.kind, blobs: data.blobs });
  const m = { id, pinned, at: Date.now(), bytes, kind: data.kind };
  await idbPut('meta', id, m); LOCAL.set(id, m);
}
async function getLocal(id) {
  if (!LOCAL.has(id)) return null;
  try {
    const r = await idbGet('files', id);
    if (r) { const m = LOCAL.get(id); m.at = Date.now(); idbPut('meta', id, m).catch(() => {}); }
    return r || null;
  } catch (e) { return null; }
}
async function dropLocal(id) { try { await idbDel('files', id); await idbDel('meta', id); } catch (e) {} LOCAL.delete(id); }
// Les tomes ouverts sans être téléchargés restent en cache, mais seulement les deux derniers.
async function evict(keepId) {
  const tmp = [...LOCAL.values()].filter((m) => !m.pinned && m.id !== keepId).sort((a, b) => b.at - a.at);
  for (const m of tmp.slice(2)) await dropLocal(m.id);
}
let persistAsked = false;
function persist() { if (persistAsked) return; persistAsked = true; try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {} }

/* ---------- Connexion Google (redirection, compatible avec l'écran d'accueil d'iOS) ---------- */
const AUTH = { tok: ls.get('cpc:tok', null), email: ls.get('cpc:email', '') };
const tokenOk = () => !!(AUTH.tok && AUTH.tok.exp > Date.now() + 60000);
class NeedAuth extends Error {}
function login(silent, ret) {
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  ls.set('cpc:state', state); ls.set('cpc:return', ret || route());
  const p = new URLSearchParams({ client_id: CLIENT_ID, redirect_uri: REDIRECT, response_type: 'token', scope: SCOPES, include_granted_scopes: 'true', state });
  if (AUTH.email) p.set('login_hint', AUTH.email);
  if (silent) p.set('prompt', 'none');
  location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + p;
}
function handleRedirect() {
  const h = location.hash;
  if (!/access_token=|error=/.test(h)) return null;
  const q = new URLSearchParams(h.slice(1));
  history.replaceState(null, '', location.pathname + location.search);
  const st = ls.get('cpc:state', null); ls.del('cpc:state');
  if (!st || q.get('state') !== st) return 'state';
  if (q.get('error')) { ls.set('cpc:silentFail', Date.now()); return q.get('error'); }
  AUTH.tok = { v: q.get('access_token'), exp: Date.now() + (+q.get('expires_in') || 3600) * 1000 };
  ls.set('cpc:tok', AUTH.tok); ls.set('cpc:everIn', true); ls.del('cpc:silentFail');
  return 'ok';
}
async function logout() {
  const t = AUTH.tok && AUTH.tok.v;
  AUTH.tok = null; AUTH.email = '';
  ls.del('cpc:tok'); ls.del('cpc:email'); ls.set('cpc:everIn', false); ls.del('cpc:syncId');
  if (t) fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(t), { method: 'POST' }).catch(() => {});
  render();
}

/* ---------- Google Drive ---------- */
async function api(path, opts = {}, base = DRIVE) {
  if (!tokenOk()) throw new NeedAuth();
  const r = await fetch(base + path, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + AUTH.tok.v } });
  if (r.status === 401) { AUTH.tok = null; ls.del('cpc:tok'); throw new NeedAuth(); }
  if (!r.ok) { const e = new Error('Drive ' + r.status); e.status = r.status; throw e; }
  return r;
}
async function listChildren(id) {
  const out = []; let pt = '';
  do {
    const q = encodeURIComponent(`'${id}' in parents and trashed=false`);
    const j = await (await api(`files?q=${q}&fields=nextPageToken,files(id,name,mimeType,size,thumbnailLink,shortcutDetails(targetId,targetMimeType))&pageSize=1000&${ALL}${pt ? '&pageToken=' + pt : ''}`)).json();
    out.push(...(j.files || [])); pt = j.nextPageToken || '';
  } while (pt);
  // Un raccourci (par exemple vers un dossier partagé depuis un autre compte) est suivi jusqu'à sa cible
  return out.map((f) => f.mimeType === SHORTCUT && f.shortcutDetails
    ? { id: f.shortcutDetails.targetId, name: f.name, mimeType: f.shortcutDetails.targetMimeType, size: 0, thumbnailLink: '' } : f);
}
async function fetchMe() {
  try {
    const j = await (await api('about?fields=user(emailAddress)')).json();
    AUTH.email = (j.user && j.user.emailAddress) || ''; ls.set('cpc:email', AUTH.email);
  } catch (e) {}
}
async function fetchBlob(id, size, onp, signal) {
  const r = await api(`files/${id}?alt=media&supportsAllDrives=true`, { signal });
  const total = +size || +r.headers.get('content-length') || 0;
  if (!r.body || !total) { const b = await r.blob(); onp(1); return b; }
  const rd = r.body.getReader(), chunks = []; let got = 0;
  for (;;) {
    const { done, value } = await rd.read();
    if (done) break;
    chunks.push(value); got += value.length; onp(Math.min(1, got / total));
  }
  return new Blob(chunks);
}
async function fetchTome(t, onp, signal) {
  if (t.kind === 'dir') {
    const kids = (await listChildren(t.id)).filter((k) => IMG_RE.test(k.name)).sort((a, b) => natural(a.name, b.name));
    if (!kids.length) throw new Error('Aucune image dans « ' + t.title + ' ».');
    const blobs = [];
    for (let i = 0; i < kids.length; i++) { blobs.push(await fetchBlob(kids[i].id, kids[i].size, () => {}, signal)); onp((i + 1) / kids.length); }
    return { kind: 'imgs', blobs };
  }
  return { kind: t.kind, blobs: [await fetchBlob(t.id, t.size, onp, signal)] };
}

// PDF lu directement dans le Drive, morceau par morceau (requêtes Range) : pas besoin de télécharger 200 Mo
async function rangePdf(t) {
  if (!window.pdfjsLib) throw new Error("Le lecteur PDF n'a pas pu se charger.");
  let size = +t.size || 0;
  if (!size) size = +((await (await api(`files/${t.id}?fields=size&supportsAllDrives=true`)).json()).size) || 0;
  if (!size) throw new Error('taille');
  const get = async (b, e, k = 0) => {
    try {
      const r = await api(`files/${t.id}?alt=media&supportsAllDrives=true`, { headers: { Range: `bytes=${b}-${e - 1}` } });
      const buf = new Uint8Array(await r.arrayBuffer());
      return r.status === 200 && buf.length === size ? buf.subarray(b, e) : buf;
    } catch (err) {
      if (err instanceof NeedAuth || k >= 2) throw err;
      await sleep(800 * (k + 1)); return get(b, e, k + 1);
    }
  };
  const tr = new pdfjsLib.PDFDataRangeTransport(size, await get(0, Math.min(size, 262144)));
  tr.requestDataRange = (b, e) => { get(b, e).then((d) => tr.onDataRange(b, d)).catch((err) => { tr.failed = err; if (tr.onFail) tr.onFail(err); }); };
  const pdf = await pdfjsLib.getDocument({ range: tr, disableAutoFetch: true, disableStream: true, rangeChunkSize: 262144, isEvalSupported: false }).promise;
  pdf._tr = tr;
  return pdf;
}

/* ---------- Bibliothèque ---------- */
const kindOf = (n, mt) => (/\.pdf$/i.test(n) || mt === 'application/pdf') ? 'pdf' : /\.(cbz|zip)$/i.test(n) ? 'zip' : /\.(cbr|rar|cb7|7z)$/i.test(n) ? 'rar' : null;
const cleanTitle = (n) => n.replace(TOME_RE, '').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
const seriesName = (n) => cleanTitle(n).replace(/\s*[\[(]?\b(pdf|cbz|cbr|fr|vf)\b[\])]?\s*$/i, '').trim() || cleanTitle(n);
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// « Invincible - Tome 01 - Affaires de famille » dans la série Invincible -> { title: « Tome 1 », sub: « Affaires de famille » }
function tomeLabel(name, series) {
  let n = cleanTitle(name);
  if (series) n = n.replace(new RegExp('^' + reEsc(series) + '\\s*[-–:]?\\s*', 'i'), '');
  const m = n.match(/^(?:tome|t\.?|vol(?:ume)?\.?|n°|#)\s*0*(\d+)\s*(?:[-–:.]\s*(.*))?$/i);
  if (m) return { title: 'Tome ' + m[1], sub: (m[2] || '').trim() };
  return { title: n || cleanTitle(name), sub: '' };
}
const fullTitle = (t) => t.title + (t.sub ? ' · ' + t.sub : '');
let LIB = ls.get('cpc:lib', null); // { series: [{ id, title, tomes: [{ id, title, kind, size, thumb, s }] }], at }
const TOMES = new Map();
function indexLib() { TOMES.clear(); for (const s of (LIB && LIB.series) || []) for (const t of s.tomes) TOMES.set(t.id, t); }
const seriesOf = (id) => ((LIB && LIB.series) || []).find((s) => s.id === id) || null;
async function pool(items, n, fn) { let i = 0; await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]); })); }

let refreshing = false, statusMsg = '';
async function refreshLibrary(manual) {
  if (refreshing) return;
  if (!tokenOk()) { if (manual) login(false); return; }
  refreshing = true; statusMsg = 'Mise à jour de la bibliothèque…'; render();
  try {
    const root = await listChildren(ROOT_ID);
    const series = [], loose = [];
    const mk = (f, k, series) => ({ id: f.id, ...tomeLabel(f.name, series), kind: k, size: +f.size || 0, thumb: f.thumbnailLink || '' });
    for (const f of root) { const k = kindOf(f.name, f.mimeType); if (k) loose.push(mk(f, k, '')); }
    await pool(root.filter((f) => f.mimeType === FOLDER), 4, async (f) => {
      const kids = await listChildren(f.id), tomes = [], sname = seriesName(f.name);
      for (const k of kids) {
        const kd = kindOf(k.name, k.mimeType);
        if (kd) tomes.push({ ...mk(k, kd, sname), key: k.name });
        else if (k.mimeType === FOLDER) tomes.push({ id: k.id, ...tomeLabel(k.name, sname), kind: 'dir', size: 0, thumb: '', key: k.name });
      }
      if (!tomes.length && kids.some((k) => IMG_RE.test(k.name))) tomes.push({ id: f.id, title: sname, sub: '', kind: 'dir', size: 0, thumb: '', key: f.name });
      if (tomes.length) { tomes.sort((a, b) => natural(a.key, b.key)); for (const t of tomes) delete t.key; series.push({ id: f.id, title: sname, tomes }); }
    });
    if (loose.length) { loose.sort((a, b) => natural(a.title, b.title)); series.push({ id: ROOT_ID, title: 'Divers', tomes: loose }); }
    series.sort((a, b) => natural(a.title, b.title));
    for (const s of series) for (const t of s.tomes) t.s = s.id;
    LIB = { series, at: Date.now() }; ls.set('cpc:lib', LIB); indexLib();
    statusMsg = '';
    if (manual) toast('Bibliothèque à jour.');
  } catch (e) {
    statusMsg = e instanceof NeedAuth ? '' : e.status === 404
      ? 'Le dossier « Mangas : Comics » est introuvable dans ton Google Drive.'
      : 'Google Drive ne répond pas. La bibliothèque affichée peut ne pas être à jour.';
  } finally { refreshing = false; render(); }
}

/* ---------- Progression (synchronisée dans l'espace privé de l'appli sur le Drive) ---------- */
let POS = ls.get('cpc:pos', {});     // tomeId -> { p, n, t }
let PREFS = ls.get('cpc:prefs', {}); // seriesId -> { rtl, t }
let syncT = 0, syncing = false;
function dirty() { ls.set('cpc:dirty', true); clearTimeout(syncT); syncT = setTimeout(syncProgress, 4000); }
function setPos(id, p, n) { POS[id] = { p, n, t: Date.now() }; ls.set('cpc:pos', POS); dirty(); }
function setRtlPref(sid, v) { if (!sid) return; PREFS[sid] = { rtl: v, t: Date.now() }; ls.set('cpc:prefs', PREFS); ls.set('cpc:lastRtl', v); dirty(); }
function merge(a, b) {
  const out = { ...a }; let inA = false, inB = false;
  for (const k in b) if (!out[k] || (b[k].t || 0) > (out[k].t || 0)) { out[k] = b[k]; inA = true; }
  for (const k in a) if (!b[k] || (a[k].t || 0) > (b[k].t || 0)) inB = true;
  return [out, inA, inB];
}
async function syncProgress() {
  if (syncing || !tokenOk() || !navigator.onLine) return;
  syncing = true;
  try {
    let id = ls.get('cpc:syncId', null);
    if (!id) {
      const j = await (await api('files?spaces=appDataFolder&fields=files(id)&q=' + encodeURIComponent("name='progress.json'"))).json();
      id = j.files && j.files[0] ? j.files[0].id : null;
    }
    let remote = { pos: {}, prefs: {} };
    if (id) {
      try { remote = await (await api(`files/${id}?alt=media`)).json(); }
      catch (e) { if (e.status === 404) id = null; else throw e; }
    }
    const [pos, a1, b1] = merge(POS, (remote && remote.pos) || {});
    const [prefs, a2, b2] = merge(PREFS, (remote && remote.prefs) || {});
    if (a1 || a2) { POS = pos; PREFS = prefs; ls.set('cpc:pos', POS); ls.set('cpc:prefs', PREFS); if (VIEW !== 'read') render(); }
    if (b1 || b2 || !id) {
      const body = JSON.stringify({ pos, prefs });
      if (id) await api(`files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body }, UPLOAD);
      else {
        const mp = '--cpcb\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ name: 'progress.json', parents: ['appDataFolder'] }) +
          '\r\n--cpcb\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n--cpcb--';
        id = (await (await api('files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=cpcb' }, body: mp }, UPLOAD)).json()).id;
      }
    }
    ls.set('cpc:syncId', id); ls.set('cpc:dirty', false);
  } catch (e) {} finally { syncing = false; }
}

/* ---------- Couvertures ---------- */
const COVURL = new Map();
async function coverURL(id) {
  if (COVURL.has(id)) return COVURL.get(id);
  let u = null;
  try { const b = await idbGet('covers', id); if (b) u = URL.createObjectURL(b); } catch (e) {}
  COVURL.set(id, u);
  return u;
}
function covHTML(t, label, badge) {
  return '<div class="cov" data-c="' + (t ? t.id : '') + '"><span>' + esc(label) + '</span><img alt="" hidden>' + (badge ? '<b class="badge">' + esc(badge) + '</b>' : '') + '</div>';
}
function hydrateCovers(root) {
  for (const el of $$('.cov[data-c]', root)) {
    const id = el.dataset.c; if (!id) continue;
    const img = $('img', el), t = TOMES.get(id);
    coverURL(id).then((u) => {
      if (!u) wantCover(t);
      const src = u || (t && t.thumb && navigator.onLine ? t.thumb : '');
      if (!src) return;
      img.referrerPolicy = 'no-referrer';
      img.onload = () => { img.hidden = false; };
      img.onerror = () => { img.hidden = true; };
      img.src = src;
    });
  }
}
const coverQ = [], coverTried = new Set(); let coverBusy = 0;
function wantCover(t) {
  if (!t || coverTried.has(t.id) || !tokenOk() || !navigator.onLine) return;
  if (!(t.kind === 'pdf' || t.kind === 'dir')) return;
  coverTried.add(t.id); coverQ.push(t); pumpCovers();
}
function pumpCovers() {
  while (coverBusy < 2 && coverQ.length && VIEW !== 'read') {
    const t = coverQ.shift(); coverBusy++;
    (async () => {
      try {
        if (await idbGet('covers', t.id)) return;
        if (t.kind === 'pdf') {
          const pdf = await rangePdf(t);
          try { await ensureCover(t, pdfSource(pdf)); } finally { try { pdf.destroy(); } catch (e) {} }
        } else {
          const kids = (await listChildren(t.id)).filter((k) => IMG_RE.test(k.name)).sort((a, b) => natural(a.name, b.name));
          if (kids[0]) { const b = await fetchBlob(kids[0].id, kids[0].size, () => {}); await ensureCover(t, imageSource(1, () => Promise.resolve(b))); }
        }
      } catch (e) { coverTried.delete(t.id); }
      finally { coverBusy--; pumpCovers(); }
    })();
  }
}
const covering = new Set();
async function ensureCover(t, src) {
  if (!t || covering.has(t.id)) return;
  try { if (await idbGet('covers', t.id)) return; } catch (e) { return; }
  covering.add(t.id);
  try {
    let cv = await src.render(0, 360);
    if (cv.width > 360) {
      const c2 = document.createElement('canvas'); c2.width = 360; c2.height = Math.round(cv.height * 360 / cv.width);
      const g = c2.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(cv, 0, 0, c2.width, c2.height); cv = c2;
    }
    const b = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.78));
    if (b) {
      await idbPut('covers', t.id, b);
      const old = COVURL.get(t.id); if (old) URL.revokeObjectURL(old);
      COVURL.set(t.id, URL.createObjectURL(b));
      for (const el of $$('.cov[data-c="' + t.id + '"]')) { const img = $('img', el); img.onload = () => { img.hidden = false; }; img.src = COVURL.get(t.id); }
    }
  } catch (e) {} finally { covering.delete(t.id); }
}

/* ---------- Sources de pages ---------- */
const MAXPX = MOBILE ? 6e6 : 12e6;
async function renderPdfPage(page, tw) {
  const v1 = page.getViewport({ scale: 1 });
  let sc = tw / v1.width;
  if (v1.width * v1.height * sc * sc > MAXPX) sc = Math.sqrt(MAXPX / (v1.width * v1.height));
  const vp = page.getViewport({ scale: sc });
  const cv = document.createElement('canvas');
  cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  cv._sc = sc;
  return cv;
}
function pdfSource(pdf) {
  let task = null;
  return {
    numPages: pdf.numPages,
    async render(i, tw) { return renderPdfPage(await pdf.getPage(i + 1), tw); },
    cancelRegion() { if (task) { try { task.cancel(); } catch (e) {} task = null; } },
    async renderRegion(i, r, sc0, k) {
      const pg = await pdf.getPage(i + 1);
      const maxPx = MOBILE ? 8e6 : 16e6;
      if (r.w * r.h * k * k > maxPx) k = Math.sqrt(maxPx / (r.w * r.h));
      const vp = pg.getViewport({ scale: sc0 * k });
      const cv = document.createElement('canvas');
      cv.width = Math.ceil(r.w * k); cv.height = Math.ceil(r.h * k);
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
      const t = pg.render({ canvasContext: ctx, viewport: vp, transform: [1, 0, 0, 1, -r.x * k, -r.y * k] });
      this.cancelRegion(); task = t;
      await t.promise;
      if (task === t) task = null;
      return cv;
    },
    destroy() { try { pdf.destroy(); } catch (e) {} }
  };
}
async function decode(blob) {
  try { return await createImageBitmap(blob); } catch (e) {
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(blob), im = new Image();
      im.onload = () => { URL.revokeObjectURL(u); res(im); };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('image')); };
      im.src = u;
    });
  }
}
function imageSource(n, getBlob) {
  return {
    numPages: n,
    async render(i, tw) {
      const img = await decode(await getBlob(i));
      const w = img.width, h = img.height;
      let sc = Math.min(1, Math.max(tw, 300) * 1.5 / w);
      if (w * h * sc * sc > MAXPX) sc = Math.sqrt(MAXPX / (w * h));
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, Math.round(w * sc)); cv.height = Math.max(1, Math.round(h * sc));
      const g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
      g.imageSmoothingQuality = 'high';
      g.drawImage(img, 0, 0, cv.width, cv.height);
      if (img.close) img.close();
      cv._sc = sc;
      return cv;
    },
    destroy() {}
  };
}
async function sniff(blob) {
  try {
    const b = new Uint8Array(await blob.slice(0, 8).arrayBuffer());
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'pdf';
    if (b[0] === 0x50 && b[1] === 0x4b) return 'zip';
    if (b[0] === 0x52 && b[1] === 0x61 && b[2] === 0x72 && b[3] === 0x21) return 'rar';
    if (b[0] === 0x37 && b[1] === 0x7a) return 'rar';
  } catch (e) {}
  return null;
}
const badFile = (title) => new Error('« ' + title + " » n'a pas pu être ouvert.");
async function openSource(title, data) {
  if (data.kind === 'imgs') return imageSource(data.blobs.length, (i) => Promise.resolve(data.blobs[i]));
  const blob = data.blobs[0];
  const kind = (await sniff(blob)) || data.kind;
  if (kind === 'pdf') {
    if (!window.pdfjsLib) throw new Error("Le lecteur PDF n'a pas pu se charger.");
    try { return pdfSource(await pdfjsLib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false }).promise); }
    catch (e) { throw e && e.name === 'PasswordException' ? new Error('« ' + title + ' » est protégé par un mot de passe.') : badFile(title); }
  }
  if (kind === 'zip') {
    if (!window.JSZip) throw new Error("Le lecteur d'archives n'a pas pu se charger.");
    let zip; try { zip = await JSZip.loadAsync(blob); } catch (e) { throw badFile(title); }
    const ents = Object.values(zip.files).filter((f) => !f.dir && IMG_RE.test(f.name) && !/(^|\/)(__MACOSX\/|\.)/.test(f.name)).sort((a, b) => natural(a.name, b.name));
    if (!ents.length) throw new Error('Aucune image dans « ' + title + ' ».');
    return imageSource(ents.length, (i) => ents[i].async('blob'));
  }
  // CBR / RAR / 7z : libarchive (WebAssembly), chargé seulement quand il sert
  let Archive;
  try { ({ Archive } = await import('./vendor/libarchive/src/libarchive.js')); }
  catch (e) { throw new Error("Le lecteur d'archives RAR n'a pas pu se charger."); }
  Archive.init({ workerUrl: new URL('vendor/libarchive/dist/worker-bundle.js', location.href).href });
  let arc, list;
  try {
    arc = await Archive.open(blob instanceof File ? blob : new File([blob], 'tome.cbr'));
    list = (await arc.getFilesArray()).filter((x) => IMG_RE.test(x.file.name) && !/(^|\/)(__MACOSX|\.)/.test((x.path || '') + x.file.name))
      .sort((a, b) => natural((a.path || '') + a.file.name, (b.path || '') + b.file.name));
  } catch (e) { throw badFile(title); }
  if (!list.length) throw new Error('Aucune image dans « ' + title + ' ».');
  let chain = Promise.resolve();
  const src = imageSource(list.length, (i) => { const p = chain.then(() => list[i].file.extract()); chain = p.catch(() => {}); return p; });
  src.destroy = () => { try { arc._worker.terminate(); } catch (e) {} };
  return src;
}

/* ---------- Détection des cases (découpe récursive le long des gouttières) ---------- */
function detect(cv) {
  const W = Math.min(520, cv.width), sc = W / cv.width, H = Math.max(8, Math.round(cv.height * sc));
  const a = document.createElement('canvas'); a.width = W; a.height = H;
  const c = a.getContext('2d', { willReadFrequently: true });
  c.drawImage(cv, 0, 0, W, H);
  const d = c.getImageData(0, 0, W, H).data;
  const L = new Uint8ClampedArray(W * H);
  for (let i = 0, j = 0; i < L.length; i++, j += 4) L[i] = (d[j] * 77 + d[j + 1] * 150 + d[j + 2] * 29) >> 8;
  const samp = [], bw = Math.max(2, Math.round(W * 0.012));
  for (let y = 0; y < H; y += 2) for (let x = 0; x < bw; x++) samp.push(L[y * W + x], L[y * W + W - 1 - x]);
  for (let x = 0; x < W; x += 2) for (let y = 0; y < bw; y++) samp.push(L[y * W + x], L[(H - 1 - y) * W + x]);
  samp.sort((p, q) => p - q);
  const bg = samp[samp.length >> 1], thr = 40, W1 = W + 1, N = W * H;
  // Une planche a des gouttières blanches ou noires ; un fond coloré ou gris moyen (couverture, titre) se lit en page entière.
  const chroma = [];
  for (let x = 0; x < W; x += 3) for (const y of [1, H - 2]) { const j = (y * W + x) * 4; chroma.push(Math.max(d[j], d[j + 1], d[j + 2]) - Math.min(d[j], d[j + 1], d[j + 2])); }
  for (let y = 0; y < H; y += 3) for (const x of [1, W - 2]) { const j = (y * W + x) * 4; chroma.push(Math.max(d[j], d[j + 1], d[j + 2]) - Math.min(d[j], d[j + 1], d[j + 2])); }
  chroma.sort((p, q) => p - q);
  if (chroma[chroma.length >> 1] > 40 || (bg > 70 && bg < 185)) return { tree: null, sc };
  const integral = (val) => {
    const T = new Uint32Array(W1 * (H + 1));
    for (let y = 0; y < H; y++) { let rs = 0; const o = y * W, r0 = y * W1, r1 = (y + 1) * W1; for (let x = 0; x < W; x++) { rs += val[o + x]; T[r1 + x + 1] = T[r0 + x + 1] + rs; } }
    return (x0, y0, x1, y1) => T[y1 * W1 + x1] - T[y0 * W1 + x1] - T[y1 * W1 + x0] + T[y0 * W1 + x0];
  };
  const ink = new Uint8Array(N);
  for (let i = 0; i < N; i++) ink[i] = Math.abs(L[i] - bg) > thr ? 1 : 0;
  const inkSum = integral(ink);
  const outer = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
  const open = (x, y) => inkSum(Math.max(0, x - 1), Math.max(0, y - 1), Math.min(W, x + 2), Math.min(H, y + 2)) === 0;
  const seed = (x, y) => { const i = y * W + x; if (!outer[i] && open(x, y)) { outer[i] = 1; q[qt++] = i; } };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  while (qh < qt) { const i = q[qh++], x = i % W, y = (i - x) / W; if (x > 0) seed(x - 1, y); if (x < W - 1) seed(x + 1, y); if (y > 0) seed(x, y - 1); if (y < H - 1) seed(x, y + 1); }
  const mask = new Uint8Array(N);
  for (let i = 0; i < N; i++) mask[i] = outer[i] ? 0 : 1;
  const sum = integral(mask);
  function trim(b) {
    let [x0, y0, x1, y1] = b;
    const nr = Math.max(1, (x1 - x0) * 0.01);
    while (y0 < y1 && sum(x0, y0, x1, y0 + 1) <= nr) y0++;
    while (y1 > y0 && sum(x0, y1 - 1, x1, y1) <= nr) y1--;
    const nc = Math.max(1, (y1 - y0) * 0.01);
    while (x0 < x1 && sum(x0, y0, x0 + 1, y1) <= nc) x0++;
    while (x1 > x0 && sum(x1 - 1, y0, x1, y1) <= nc) x1--;
    return (x1 - x0 < 4 || y1 - y0 < 4) ? null : [x0, y0, x1, y1];
  }
  const minGap = Math.max(2, Math.round(Math.min(W, H) * 0.005));
  function split(b, axis, tolFrac) {
    const [x0, y0, x1, y1] = b, h = axis === 'h';
    const a0 = h ? y0 : x0, a1 = h ? y1 : x1, tol = Math.max(1, (h ? x1 - x0 : y1 - y0) * tolFrac);
    const segs = []; let start = a0, run = 0;
    for (let t = a0; t < a1; t++) {
      const v = h ? sum(x0, t, x1, t + 1) : sum(t, y0, t + 1, y1);
      if (v <= tol) { run++; continue; }
      if (run >= minGap && t - run > start) { segs.push([start, t - run]); start = t; }
      run = 0;
    }
    segs.push([start, a1]);
    return segs.map(([s, e]) => h ? [x0, s, x1, e] : [s, y0, e, y1]);
  }
  const minW = W * 0.07, minH = H * 0.045, minA = N * 0.015, bigA = N * 0.3;
  function cut(b, depth) {
    b = trim(b); if (!b) return null;
    const area = (b[2] - b[0]) * (b[3] - b[1]);
    const tols = area > bigA ? [0.08, 0.22] : [0.08];
    if (depth < 9) for (const tolFrac of tols) for (const axis of ['h', 'v']) {
      const segs = split(b, axis, tolFrac);
      if (segs.length > 1) {
        const kids = segs.map((s) => cut(s, depth + 1)).filter(Boolean);
        if (kids.length > 1) return { dir: axis, kids };
        if (kids.length === 1) return kids[0];
      }
    }
    const w = b[2] - b[0], hh = b[3] - b[1];
    if (w < minW || hh < minH || w * hh < minA) return null;
    return { rect: b, fill: sum(b[0], b[1], b[2], b[3]) / (w * hh) };
  }
  let tree = cut([0, 0, W, H], 0);
  const leaves = [];
  (function walk(n) { if (!n) return; if (n.rect) leaves.push(n); else n.kids.forEach(walk); })(tree);
  if (leaves.length > 1) {
    let good = 0, tot = 0;
    for (const l of leaves) { const ar = (l.rect[2] - l.rect[0]) * (l.rect[3] - l.rect[1]); tot += ar; if (l.fill >= 0.8) good += ar; }
    if (good / tot < 0.6) tree = null;
  }
  return { tree, sc };
}
function flatten(det, rtl, cw, ch) {
  const out = [];
  (function walk(n) { if (!n) return; if (n.rect) { out.push(n.rect); return; } (n.dir === 'v' && rtl ? n.kids.slice().reverse() : n.kids).forEach(walk); })(det.tree);
  const pad = cw * 0.008;
  let rects = out.map(([x0, y0, x1, y1]) => {
    const X0 = Math.max(0, x0 / det.sc - pad), Y0 = Math.max(0, y0 / det.sc - pad);
    const X1 = Math.min(cw, x1 / det.sc + pad), Y1 = Math.min(ch, y1 / det.sc + pad);
    return { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  });
  if (!rects.length || rects.length > 30) rects = [{ x: 0, y: 0, w: cw, h: ch }];
  return rects;
}

/* ---------- Lecteur ---------- */
const stage = $('#stage'), layer = $('#layer'), hole = $('#hole');
const S = { tome: null, series: null, src: null, page: 0, panel: 0, cur: null, mode: ls.get('cpc:mode', 'panel') === 'page' ? 'page' : 'panel',
  rtl: false, cache: new Map(), token: 0, cvEl: $('#blank') };
const CACHE_MAX = MOBILE ? 3 : 5;
function targetWidth() {
  const dpr = window.devicePixelRatio || 1, m = Math.max(innerWidth, innerHeight) * dpr;
  return MOBILE ? Math.round(Math.min(1800, Math.max(1000, m))) : Math.round(Math.min(2600, Math.max(1400, m * 1.2)));
}
function freeCanvas(cv) { if (cv && cv !== S.cvEl) { cv.width = 1; cv.height = 1; } }
function getPage(i) {
  const key = i;
  if (S.cache.has(key)) { const v = S.cache.get(key); S.cache.delete(key); S.cache.set(key, v); return v; }
  const src = S.src;
  const p = (async () => { const cv = await src.render(i, targetWidth()); return { cv, det: detect(cv), list: null }; })();
  S.cache.set(key, p);
  p.catch(() => S.cache.delete(key));
  while (S.cache.size > CACHE_MAX) {
    const [k0, old] = S.cache.entries().next().value;
    S.cache.delete(k0); old.then((pg) => freeCanvas(pg.cv)).catch(() => {});
  }
  return p;
}
let loadTimer = 0;
function setRLoad(msg) {
  clearTimeout(loadTimer);
  const el = $('#rload');
  if (!msg) { el.hidden = true; return; }
  loadTimer = setTimeout(() => { el.textContent = msg; el.hidden = false; }, 120);
}
async function goPage(i, at) {
  if (!S.src) return;
  i = Math.max(0, Math.min(S.src.numPages - 1, i));
  const tok = ++S.token;
  setRLoad('Page ' + (i + 1) + '…');
  let pg;
  try { pg = await getPage(i); }
  catch (e) { if (tok === S.token) { setRLoad(null); toast("Impossible d'afficher la page " + (i + 1) + '.'); } return; }
  if (tok !== S.token) return;
  setRLoad(null);
  pg.list = flatten(pg.det, S.rtl, pg.cv.width, pg.cv.height);
  S.page = i; S.cur = pg;
  S.panel = at === 'last' ? pg.list.length - 1 : 0;
  if (S.cvEl !== pg.cv) {
    pg.cv.style.width = pg.cv.width + 'px'; pg.cv.style.height = pg.cv.height + 'px';
    layer.replaceChild(pg.cv, S.cvEl); S.cvEl = pg.cv;
  }
  show(false);
  if (layer.animate) layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'ease-out' });
  if (S.tome) setPos(S.tome.id, i, S.src.numPages);
  setTimeout(() => { if (S.src && tok === S.token && i + 1 < S.src.numPages) getPage(i + 1).catch(() => {}); }, 80);
}
function show(anim) {
  const pg = S.cur; if (!pg) return;
  const full = { x: 0, y: 0, w: pg.cv.width, h: pg.cv.height };
  const r = S.mode === 'page' ? full : (pg.list[S.panel] || full);
  const vw = stage.clientWidth, vh = stage.clientHeight, m = Math.min(14, vw * 0.025);
  const fitPage = Math.min((vw - 2 * m) / full.w, (vh - 2 * m) / full.h);
  const s = Math.min((vw - 2 * m) / r.w, (vh - 2 * m) / r.h, fitPage * 4);
  const tx = vw / 2 - (r.x + r.w / 2) * s, ty = vh / 2 - (r.y + r.h / 2) * s;
  hideSharp(); scheduleSharp(r, s, anim);
  const tr = anim ? '' : 'none';
  layer.style.transition = tr; hole.style.transition = tr;
  layer.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  Object.assign(hole.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  if (!anim) { void layer.offsetWidth; layer.style.transition = ''; hole.style.transition = ''; }
  updateReaderUI();
}
let sharpEl = $('#sharp'), sharpTimer = 0, sharpTok = 0;
function hideSharp() { clearTimeout(sharpTimer); sharpTok++; sharpEl.classList.remove('on'); if (S.src && S.src.cancelRegion) S.src.cancelRegion(); }
function scheduleSharp(r, s, anim) {
  if (!S.src || !S.src.renderRegion || !S.cur) return;
  const tok = sharpTok, pg = S.cur, page = S.page, src = S.src;
  sharpTimer = setTimeout(async () => {
    const k = s * (window.devicePixelRatio || 1);
    if (k <= 1.1) return;
    let cv;
    try { cv = await src.renderRegion(page, r, pg.cv._sc, k); } catch (e) { return; }
    if (tok !== sharpTok || S.cur !== pg) { cv.width = cv.height = 1; return; }
    cv.id = 'sharp';
    Object.assign(cv.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
    const old = sharpEl; layer.replaceChild(cv, sharpEl); sharpEl = cv; old.width = old.height = 1;
    requestAnimationFrame(() => { if (tok === sharpTok) cv.classList.add('on'); });
  }, anim ? 420 : 40);
}
function updateReaderUI() {
  const n = S.src ? S.src.numPages : 1, k = S.cur ? S.cur.list.length : 1;
  $('#pos').textContent = 'Page ' + (S.page + 1) + ' / ' + n;
  $('#count').textContent = S.mode === 'page' ? plural(k, 'case') : 'Case ' + (S.panel + 1) + ' / ' + k;
  const sl = $('#slider'); sl.max = n; sl.value = S.page + 1; sl.dir = S.rtl ? 'rtl' : 'ltr';
  $('#modePanel').setAttribute('aria-pressed', S.mode === 'panel');
  $('#modePage').setAttribute('aria-pressed', S.mode === 'page');
  $('#dirLtr').setAttribute('aria-pressed', !S.rtl);
  $('#dirRtl').setAttribute('aria-pressed', S.rtl);
}
function sibling(dir) {
  const s = S.series; if (!s || !S.tome) return null;
  const i = s.tomes.findIndex((x) => x.id === S.tome.id);
  return i < 0 ? null : s.tomes[i + dir] || null;
}
function next() {
  if (!S.cur) return;
  if (S.mode === 'panel' && S.panel < S.cur.list.length - 1) { S.panel++; show(true); return; }
  if (S.page < S.src.numPages - 1) { goPage(S.page + 1, 'first'); return; }
  const nt = sibling(1);
  if (nt) { history.replaceState({ v: 'read', t: nt.id }, ''); openTome(nt.id, 'start'); toast(fullTitle(nt)); }
  else toast('C’était le dernier tome de la série.');
}
function prev() {
  if (!S.cur) return;
  if (S.mode === 'panel' && S.panel > 0) { S.panel--; show(true); return; }
  if (S.page > 0) { goPage(S.page - 1, S.mode === 'panel' ? 'last' : 'first'); return; }
  const pt = sibling(-1);
  if (pt) { history.replaceState({ v: 'read', t: pt.id }, ''); openTome(pt.id, 'end'); }
}
function setMode(m) { S.mode = m; ls.set('cpc:mode', m); show(true); }
function setRtl(v) {
  if (S.rtl === v) return;
  S.rtl = v; setRtlPref(S.tome && S.tome.s, v);
  if (S.cur) { S.cur.list = flatten(S.cur.det, v, S.cur.cv.width, S.cur.cv.height); S.panel = 0; }
  show(true);
  toast(v ? 'Sens manga : de droite à gauche.' : 'Sens BD : de gauche à droite.');
}
let chromeT = 0;
function showChrome(on) { $('#reader').classList.toggle('bare', !on); clearTimeout(chromeT); }
function toggleChrome() { showChrome($('#reader').classList.contains('bare')); }
function hideChromeSoon() { clearTimeout(chromeT); chromeT = setTimeout(() => showChrome(false), 2600); }

function closeReader() {
  S.token++;
  hideSharp(); setRLoad(null);
  if (S.src && S.src.destroy) S.src.destroy();
  for (const p of S.cache.values()) p.then((pg) => freeCanvas(pg.cv)).catch(() => {});
  S.cache.clear(); S.src = null; S.cur = null; S.tome = null; S.series = null;
  const blank = document.createElement('canvas'); blank.width = blank.height = 10;
  if (S.cvEl && S.cvEl.parentNode === layer) { const old = S.cvEl; layer.replaceChild(blank, old); if (old.id !== 'blank') { old.width = old.height = 1; } }
  S.cvEl = blank;
}
async function openTome(id, at) {
  const t = TOMES.get(id);
  if (!t) { toast('Ce tome n’est plus dans la bibliothèque.'); go({ v: 'home' }, true); return; }
  closeReader();
  showView('read');
  S.tome = t; S.series = seriesOf(t.s);
  $('#rTitle').textContent = fullTitle(t); $('#rSeries').textContent = S.series ? S.series.title : '';
  showChrome(true);
  const tok = S.token;
  setRLoad('Ouverture…');
  let data = await getLocal(id), src = null;
  if (tok !== S.token) return;
  if (!data && t.kind === 'pdf' && navigator.onLine && tokenOk()) {
    try {
      const pdf = await rangePdf(t);
      if (tok !== S.token) { pdf.destroy(); return; }
      pdf._tr.onFail = (err) => { if (err instanceof NeedAuth && S.tome === t) { toast('Session Google expirée, reconnexion…'); setTimeout(() => login(true, { v: 'read', t: id }), 800); } };
      src = pdfSource(pdf);
    } catch (e) {
      if (tok !== S.token) return;
      if (e instanceof NeedAuth) { login(false, { v: 'read', t: id }); return; }
      src = null; // repli : téléchargement complet ci-dessous
    }
  }
  if (!data && !src) {
    if (!navigator.onLine) { setRLoad(null); toast('Ce tome n’est pas sur cet appareil. Télécharge-le quand tu as du réseau.', 3600); leave(); return; }
    if (!tokenOk()) { login(false, { v: 'read', t: id }); return; }
    try {
      data = await fetchTome(t, (p) => { if (tok === S.token) setRLoad('Chargement… ' + Math.round(p * 100) + ' %'); });
      if (tok !== S.token) return;
      try { await putLocal(id, data, false); persist(); await evict(id); } catch (e) {}
    } catch (e) {
      if (tok !== S.token) return;
      setRLoad(null);
      if (e instanceof NeedAuth) { login(false, { v: 'read', t: id }); return; }
      toast('Impossible de charger « ' + t.title + ' ».'); leave(); return;
    }
  }
  if (!src) {
    try { src = await openSource(fullTitle(t), data); }
    catch (e) { if (tok === S.token) { setRLoad(null); toast(e.message || 'Impossible d’ouvrir ce tome.'); leave(); } return; }
  }
  if (tok !== S.token) { src.destroy(); return; }
  S.src = src; S.cache.clear();
  const pref = PREFS[t.s];
  S.rtl = pref ? !!pref.rtl : !!ls.get('cpc:lastRtl', false);
  const pos = POS[id]; let page = 0;
  if (at === 'end') page = src.numPages - 1;
  else if (at === 'resume' && pos && pos.p > 0 && pos.p < src.numPages - 1) page = pos.p;
  await goPage(page, at === 'end' && S.mode === 'panel' ? 'last' : 'first');
  hideChromeSoon();
  setTimeout(() => { if (S.src === src) ensureCover(t, src); }, 1200);
}

/* ---------- Téléchargements ---------- */
const DL = new Map(); // id -> { pct, ctrl }
let armed = null, armT = 0;
async function download(id, quiet) {
  const t = TOMES.get(id); if (!t || DL.has(id)) return;
  if (LOCAL.has(id)) {
    const m = LOCAL.get(id);
    if (!m.pinned) { m.pinned = true; await idbPut('meta', id, m).catch(() => {}); }
    paintTome(id); return;
  }
  if (!navigator.onLine) { if (!quiet) toast('Pas de réseau pour télécharger.'); return; }
  if (!tokenOk()) { login(false); return; }
  const ctrl = new AbortController();
  DL.set(id, { pct: 0, ctrl }); paintTome(id);
  try {
    const data = await fetchTome(t, (p) => { const d = DL.get(id); if (d) { d.pct = p; paintTomeSoon(id); } }, ctrl.signal);
    await putLocal(id, data, true); persist();
    const s = seriesOf(t.s);
    if (s && s.tomes[0].id === id) openSource(t.title, data).then((src) => ensureCover(t, src).finally(() => src.destroy())).catch(() => {});
  } catch (e) {
    if (e && e.name === 'QuotaExceededError') toast('Plus assez de place sur cet appareil.');
    else if (e instanceof NeedAuth) toast('Reconnecte-toi à Google pour télécharger.');
    else if (!(e && e.name === 'AbortError')) toast('Le téléchargement de « ' + fullTitle(t) + ' » a échoué.');
    throw e;
  } finally { DL.delete(id); paintTome(id); paintSeriesHead(); }
}
let dlAll = false;
async function downloadSeries(sid) {
  const s = seriesOf(sid); if (!s || dlAll) return;
  if (!tokenOk()) { login(false); return; }
  dlAll = true; paintSeriesHead();
  try {
    for (const t of s.tomes) {
      const m = LOCAL.get(t.id);
      if (m && m.pinned) continue;
      try { await download(t.id, true); } catch (e) { if (!(e && e.name === 'AbortError')) break; }
    }
  } finally { dlAll = false; paintSeriesHead(); }
}
const paintSoon = new Map();
function paintTomeSoon(id) { if (paintSoon.has(id)) return; paintSoon.set(id, setTimeout(() => { paintSoon.delete(id); paintTome(id); }, 250)); }

/* ---------- Vues ---------- */
let VIEW = 'home', depth = 0;
const route = () => history.state || { v: 'home' };
function showView(v) {
  VIEW = v;
  $('#home').hidden = v !== 'home'; $('#series').hidden = v !== 'series'; $('#reader').hidden = v !== 'read';
  document.documentElement.style.background = '';
}
function go(r, replace) {
  if (replace) history.replaceState(r, ''); else { history.pushState(r, ''); depth++; }
  apply(r);
}
function apply(r) {
  if (r.v !== 'read' && VIEW === 'read') { closeReader(); setTimeout(pumpCovers, 500); }
  if (r.v === 'read') openTome(r.t, r.at || 'resume');
  else if (r.v === 'series') { showView('series'); renderSeries(r.s); }
  else { showView('home'); renderHome(); }
}
addEventListener('popstate', (e) => { depth = Math.max(0, depth - 1); apply(e.state || { v: 'home' }); });
function leave() {
  if (depth > 0) { history.back(); return; }
  const r = route();
  go(r.v === 'read' && S.tome ? { v: 'series', s: S.tome.s } : { v: 'home' }, true);
}
function render() {
  renderStatus();
  if (VIEW === 'home') renderHome();
  else if (VIEW === 'series') renderSeries(route().s);
}

function renderStatus() {
  const el = $('#status');
  let h = '';
  if (statusMsg) h = esc(statusMsg);
  else if (!navigator.onLine) h = 'Hors ligne : les tomes téléchargés restent lisibles.';
  else if (!tokenOk() && LIB) h = '<span>Non connecté à Google Drive.</span><button class="link" data-act="login">Se connecter</button>';
  el.innerHTML = h;
}
function seriesStats(s) {
  let done = 0, pinned = 0;
  for (const t of s.tomes) { const p = POS[t.id]; if (p && p.p >= p.n - 1) done++; const m = LOCAL.get(t.id); if (m && m.pinned) pinned++; }
  return { done, pinned, n: s.tomes.length };
}
function lastRead() {
  let best = null;
  for (const id in POS) if (TOMES.has(id) && (!best || POS[id].t > POS[best].t)) best = id;
  if (!best) return null;
  let t = TOMES.get(best), p = POS[best], label = 'Reprendre';
  if (p.p >= p.n - 1) {
    const s = seriesOf(t.s), i = s ? s.tomes.indexOf(t) : -1, nt = i >= 0 ? s.tomes[i + 1] : null;
    if (!nt) return null;
    t = nt; p = POS[nt.id] || null; label = 'Tome suivant';
  }
  return { t, p, label };
}
function renderHome() {
  renderStatus();
  const b = $('#homeBody');
  let h = '';
  if (!STANDALONE && IOS && !ls.get('cpc:hintDone', false)) {
    h += '<div class="hint"><span>Pour l’installer : touche <b>Partager</b> puis <b>Sur l’écran d’accueil</b>.</span><button class="x" data-act="hint" aria-label="Masquer">✕</button></div>';
  }
  if (!LIB && tokenOk()) {
    h += '<div class="empty">' + (refreshing ? 'Chargement de ta bibliothèque…' : 'Ta bibliothèque n’a pas pu être chargée. Touche ↻ pour réessayer.') + '</div>';
    b.innerHTML = h; return;
  }
  if (!LIB) {
    h += '<div class="welcome"><h2>Tes mangas et BD, une case à la fois</h2>' +
      '<p>Case par Case lit les tomes rangés dans ton Google Drive, dans le dossier « Mangas : Comics » : un sous-dossier par série.</p>' +
      '<p>Connecte-toi une fois sur cet appareil pour voir ta bibliothèque.</p>' +
      (navigator.onLine ? '<button class="btn primary" data-act="login">Se connecter avec Google</button>' : '<p>Il faut du réseau pour la première connexion.</p>') + '</div>';
    b.innerHTML = h; return;
  }
  const lr = lastRead();
  if (lr) {
    const { t, p, label } = lr, s = seriesOf(t.s);
    const pct = p ? Math.round(100 * (p.p + 1) / p.n) : 0;
    h += '<button class="hero" data-open="' + t.id + '">' + covHTML(t, t.title) +
      '<div><div class="k">' + label + '</div><div class="t">' + esc((s ? s.title + ' · ' : '') + t.title) + '</div><div class="s">' + esc([t.sub, p ? 'page ' + (p.p + 1) + ' / ' + p.n : ''].filter(Boolean).join(' · ')) + '</div>' +
      (p ? '<div class="bar"><i style="width:' + pct + '%"></i></div>' : '') + '</div></button>';
  }
  if (!LIB.series.length) {
    h += '<div class="empty" style="margin-top:12px">Ta bibliothèque est vide. Range tes tomes dans ton Google Drive, dossier <b>Mangas : Comics</b>, avec un sous-dossier par série (par exemple <b>Mangas : Comics › Ma série › Tome 01.pdf</b>), puis touche ↻.</div>';
  } else {
    h += '<h2>Séries</h2><div class="grid">' + LIB.series.map((s) => {
      const st = seriesStats(s);
      const meta = plural(st.n, 'tome') + (st.done ? ' · ' + st.done + ' lu' + (st.done > 1 ? 's' : '') : '');
      return '<button class="card" data-series="' + s.id + '">' + covHTML(s.tomes[0], s.title, st.pinned ? '⤓ ' + st.pinned : '') +
        '<div class="t">' + esc(s.title) + '</div><div class="s">' + meta + '</div></button>';
    }).join('') + '</div>';
  }
  b.innerHTML = h; hydrateCovers(b);
}
function tomeRowHTML(t) {
  const p = POS[t.id], m = LOCAL.get(t.id), d = DL.get(t.id);
  let info, pct = 0, done = false;
  if (p) { pct = Math.round(100 * (p.p + 1) / p.n); done = p.p >= p.n - 1; info = done ? 'Lu' : 'Page ' + (p.p + 1) + ' / ' + p.n; }
  else info = 'Pas commencé';
  if (t.size) info += ' · ' + fmtSize(t.size);
  let btn;
  if (d) btn = '<button class="dl" data-cancel="' + t.id + '" aria-label="Annuler le téléchargement">' + ICON.ring(d.pct) + '<span class="pc">' + Math.round(d.pct * 100) + '</span></button>';
  else if (m && m.pinned) btn = armed === t.id
    ? '<button class="dl armed" data-unpin="' + t.id + '">Retirer ?</button>'
    : '<button class="dl ok" data-unpin="' + t.id + '" aria-label="Sur cet appareil. Toucher pour le retirer">' + ICON.ok + '</button>';
  else btn = '<button class="dl" data-dl="' + t.id + '" aria-label="Télécharger pour lire hors ligne">' + ICON.down + '</button>';
  return '<div class="tome" data-row="' + t.id + '"><button class="open" data-open="' + t.id + '">' + covHTML(t, t.title) +
    '<span class="tx"><span class="t">' + esc(t.title) + (t.sub ? ' <span class="sub">' + esc(t.sub) + '</span>' : '') + '</span><span class="s">' + info + '</span>' +
    (p ? '<span class="bar' + (done ? ' done' : '') + '"><i style="width:' + pct + '%"></i></span>' : '') + '</span></button>' + btn + '</div>';
}
function seriesHeadActions(s) {
  const st = seriesStats(s), missing = st.n - st.pinned;
  const rtl = PREFS[s.id] ? !!PREFS[s.id].rtl : !!ls.get('cpc:lastRtl', false);
  return '<div class="seg" role="group" aria-label="Sens de lecture"><button data-rtl="0" aria-pressed="' + !rtl + '">BD →</button><button data-rtl="1" aria-pressed="' + rtl + '">← Manga</button></div>' +
    (dlAll ? '<span class="btn small" aria-live="polite">Téléchargement en cours…</span>'
      : missing ? '<button class="btn small" data-dlall="' + s.id + '">Tout télécharger (' + missing + ')</button>'
      : '<span class="s" style="margin:0">Toute la série est sur cet appareil.</span>');
}
function renderSeries(sid) {
  const s = seriesOf(sid);
  if (!s) { go({ v: 'home' }, true); return; }
  const st = seriesStats(s);
  $('#seriesBody').innerHTML = '<div class="shead">' + covHTML(s.tomes[0], s.title) +
    '<div><h1>' + esc(s.title) + '</h1><div class="s">' + plural(st.n, 'tome') + (st.done ? ' · ' + st.done + ' lu' + (st.done > 1 ? 's' : '') : '') + '</div>' +
    '<div class="actions" id="shActions">' + seriesHeadActions(s) + '</div></div></div>' +
    '<div class="tomes">' + s.tomes.map(tomeRowHTML).join('') + '</div>';
  hydrateCovers($('#seriesBody'));
}
function paintTome(id) {
  if (VIEW !== 'series') return;
  const row = $('[data-row="' + id + '"]'), t = TOMES.get(id);
  if (!row || !t) return;
  const tmp = document.createElement('div'); tmp.innerHTML = tomeRowHTML(t);
  const nr = tmp.firstChild; row.replaceWith(nr); hydrateCovers(nr);
}
function paintSeriesHead() {
  if (VIEW !== 'series') return;
  const s = seriesOf(route().s), el = $('#shActions');
  if (s && el) el.innerHTML = seriesHeadActions(s);
}

/* ---------- Réglages ---------- */
async function openSheet() {
  const pinned = [...LOCAL.values()].filter((m) => m.pinned), cached = [...LOCAL.values()].filter((m) => !m.pinned);
  const bytes = (a) => a.reduce((s, m) => s + (m.bytes || 0), 0);
  let est = '';
  try { const e = await navigator.storage.estimate(); if (e && e.quota) est = fmtSize(e.usage || 0) + ' utilisés sur ' + fmtSize(e.quota) + ' disponibles pour l’appli'; } catch (e) {}
  $('#sheetBody').innerHTML =
    '<h3>COMPTE GOOGLE</h3><div class="grp">' +
      '<div class="it"><span>Compte</span><span class="v">' + esc(tokenOk() ? (AUTH.email || 'Connecté') : (ls.get('cpc:everIn', false) ? 'Session expirée' : 'Non connecté')) + '</span></div>' +
      (tokenOk() ? '<div class="it"><button data-act="sync">Synchroniser maintenant</button></div><div class="it"><button class="red" data-act="logout">Se déconnecter</button></div>'
        : '<div class="it"><button data-act="login">Se connecter avec Google</button></div>') +
    '</div>' +
    '<h3>SUR CET APPAREIL</h3><div class="grp">' +
      '<div class="it"><span>Tomes téléchargés</span><span class="v">' + pinned.length + (pinned.length ? ' · ' + fmtSize(bytes(pinned)) : '') + '</span></div>' +
      '<div class="it"><span>Tomes ouverts récemment</span><span class="v">' + cached.length + (cached.length ? ' · ' + fmtSize(bytes(cached)) : '') + '</span></div>' +
      (cached.length ? '<div class="it"><button data-act="clearcache">Libérer les tomes ouverts récemment</button></div>' : '') +
      (pinned.length ? '<div class="it"><button class="red" data-act="clearall">' + (armed === 'all' ? 'Confirmer : tout retirer de l’appareil' : 'Retirer tous les tomes téléchargés') + '</button></div>' : '') +
    '</div>' +
    '<h3>BIBLIOTHÈQUE</h3><div class="grp">' +
      '<div class="it"><a href="https://drive.google.com/drive/folders/' + ROOT_ID + '" target="_blank" rel="noopener">Ouvrir le dossier « Mangas : Comics »</a></div>' +
      '<div class="it"><span>Dernière mise à jour</span><span class="v">' + (LIB && LIB.at ? new Date(LIB.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—') + '</span></div>' +
    '</div>' +
    '<p class="foot">' + (est ? esc(est) + '. ' : '') + 'Retirer un tome de l’appareil ne le supprime pas de ton Drive.' +
    (IOS && !STANDALONE ? ' Pour installer l’appli : Partager › Sur l’écran d’accueil.' : '') + ' Version ' + VERSION + '.</p>';
  $('#sheet').hidden = false;
}
function closeSheet() { $('#sheet').hidden = true; if (armed === 'all') armed = null; }

/* ---------- Événements ---------- */
document.addEventListener('click', async (e) => {
  const b = e.target.closest('button, a'); if (!b) return;
  const d = b.dataset;
  if (d.act === 'login') { closeSheet(); login(false); }
  else if (d.act === 'logout') { closeSheet(); logout(); toast('Déconnecté de Google. Les tomes téléchargés restent lisibles.'); }
  else if (d.act === 'sync') { closeSheet(); await syncProgress(); refreshLibrary(true); }
  else if (d.act === 'back') leave();
  else if (d.act === 'hint') { ls.set('cpc:hintDone', true); renderHome(); }
  else if (d.act === 'clearcache') { for (const m of [...LOCAL.values()]) if (!m.pinned) await dropLocal(m.id); toast('Place libérée.'); openSheet(); render(); }
  else if (d.act === 'clearall') {
    if (armed !== 'all') { armed = 'all'; openSheet(); return; }
    armed = null; for (const id of [...LOCAL.keys()]) await dropLocal(id); toast('Tous les tomes ont été retirés de l’appareil.'); openSheet(); render();
  }
  else if (d.series) go({ v: 'series', s: d.series });
  else if (d.open) go({ v: 'read', t: d.open });
  else if (d.dl) { download(d.dl).catch(() => {}); }
  else if (d.cancel) { const x = DL.get(d.cancel); if (x) x.ctrl.abort(); }
  else if (d.unpin) {
    clearTimeout(armT);
    if (armed !== d.unpin) { armed = d.unpin; paintTome(d.unpin); armT = setTimeout(() => { const a = armed; armed = null; if (a) paintTome(a); }, 3000); return; }
    armed = null; await dropLocal(d.unpin); paintTome(d.unpin); paintSeriesHead(); toast('Retiré de l’appareil (il reste dans ton Drive).');
  }
  else if (d.dlall) downloadSeries(d.dlall);
  else if (d.rtl != null) { setRtlPref(route().s, d.rtl === '1'); paintSeriesHead(); }
});
$('#menuBtn').onclick = openSheet;
$('#refreshBtn').onclick = () => { if (!navigator.onLine) { toast('Pas de réseau.'); return; } refreshLibrary(true); syncProgress(); };
$('#sheet').addEventListener('click', (e) => { if (e.target === $('#sheet')) closeSheet(); });
$('#modePanel').onclick = () => setMode('panel');
$('#modePage').onclick = () => setMode('page');
$('#dirLtr').onclick = () => setRtl(false);
$('#dirRtl').onclick = () => setRtl(true);
$('#slider').oninput = (e) => { $('#pos').textContent = 'Page ' + e.target.value + ' / ' + (S.src ? S.src.numPages : 1); };
$('#slider').onchange = (e) => goPage(+e.target.value - 1, 'first');
$('#fsBtn').onclick = () => {
  try {
    if (document.fullscreenElement) document.exitFullscreen();
    else { const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => toast('Le plein écran n’est pas disponible ici.')); else if (!p) toast(IOS ? 'Installe l’appli sur l’écran d’accueil pour lire en plein écran.' : 'Le plein écran n’est pas disponible ici.'); }
  } catch (e) { toast('Le plein écran n’est pas disponible ici.'); }
};
if (IOS || !document.documentElement.requestFullscreen) $('#fsBtn').hidden = true;
$('#rbot').addEventListener('pointerdown', () => clearTimeout(chromeT));

let down = null;
stage.addEventListener('pointerdown', (e) => { if (e.isPrimary) down = { x: e.clientX, y: e.clientY }; });
stage.addEventListener('pointercancel', () => { down = null; });
stage.addEventListener('pointerup', (e) => {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y; down = null;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) { (S.rtl ? dx > 0 : dx < 0) ? next() : prev(); showChrome(false); return; }
  if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
    const x = (e.clientX - stage.getBoundingClientRect().left) / stage.clientWidth;
    if (x > 0.3 && x < 0.7) { toggleChrome(); return; }
    const right = x >= 0.7; (S.rtl ? !right : right) ? next() : prev();
    showChrome(false);
  }
});
let wheelLock = 0;
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const now = Date.now(); if (now < wheelLock || Math.abs(e.deltaY) < 4) return;
  wheelLock = now + 280; e.deltaY > 0 ? next() : prev();
}, { passive: false });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#sheet').hidden) { closeSheet(); return; }
  if (VIEW !== 'read' || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target.tagName === 'INPUT' && e.key.startsWith('Arrow')) return;
  const act = {
    ArrowRight: () => (S.rtl ? prev() : next()), ArrowLeft: () => (S.rtl ? next() : prev()),
    ' ': next, ArrowDown: next, PageDown: next, Enter: next, ArrowUp: prev, PageUp: prev, Backspace: prev,
    Home: () => goPage(0, 'first'), End: () => S.src && goPage(S.src.numPages - 1, 'first'),
    p: () => setMode(S.mode === 'page' ? 'panel' : 'page'), m: () => setRtl(!S.rtl), Escape: leave
  }[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (act) { e.preventDefault(); act(); }
});
let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (VIEW === 'read') show(false); }, 100); });
addEventListener('online', () => { render(); if (tokenOk()) { refreshLibrary(); syncProgress(); } });
addEventListener('offline', render);
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (ls.get('cpc:dirty', false)) syncProgress(); } else if (tokenOk()) syncProgress(); });

/* ---------- Démarrage ---------- */
async function boot() {
  const res = handleRedirect();
  indexLib();
  await loadLocal();
  let ret = null;
  if (res) { ret = ls.get('cpc:return', null); ls.del('cpc:return'); }
  if (res && res !== 'ok' && res !== 'state' && res !== 'interaction_required' && res !== 'login_required' && res !== 'consent_required') toast('La connexion à Google n’a pas abouti.');
  if (res === 'interaction_required' || res === 'login_required' || res === 'consent_required') statusMsg = '';
  const start = ret && ret.v ? ret : { v: 'home' };
  history.replaceState({ v: 'home' }, '');
  if (start.v !== 'home') {
    if (start.v === 'read') { const t = TOMES.get(start.t); if (t) { history.pushState({ v: 'series', s: t.s }, ''); depth++; } }
    history.pushState(start, ''); depth++;
  }
  apply(start);
  if (tokenOk()) { if (!AUTH.email) fetchMe(); refreshLibrary(); syncProgress(); }
  else if (!res && ls.get('cpc:everIn', false) && navigator.onLine && Date.now() - ls.get('cpc:silentFail', 0) > 30 * 60000 && start.v !== 'read') {
    // Session expirée : reconnexion silencieuse (aller-retour rapide chez Google, sans rien à toucher)
    login(true, start);
  }
}
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
boot();
})();

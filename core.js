/* Case par Case — liseuse de BD et mangas case par case.
   core.js : réglages, stockage sur l'appareil, connexion Google, Google Drive, bibliothèque, synchronisation,
   couvertures, ouverture des tomes et détection des cases. */
'use strict';
/* ---------- Réglages ---------- */
const CLIENT_ID = '550871687539-1a6117ng62v9gtvmvhaoguktpbps1aqi.apps.googleusercontent.com';
const DEFAULT_ROOT = { id: '1IGeMbOajUZ-9hbGRyJ4NeV23KKcBQINM', name: 'Mangas : Comics' };
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.appdata';
const PROD = 'https://olivier-parraud.github.io/case-par-case/';
const REDIRECT = location.href.startsWith(PROD) ? PROD : location.origin + location.pathname;
const DRIVE = 'https://www.googleapis.com/drive/v3/';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/';
const FOLDER = 'application/vnd.google-apps.folder';
const SHORTCUT = 'application/vnd.google-apps.shortcut';
const ALL = 'supportsAllDrives=true&includeItemsFromAllDrives=true';
const VERSION = '2.6';

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

/* Réglages de l'appli, gardés sur l'appareil */
const SET_DEFAULT = { sync: true, mode: 'panel', dirManga: 'rtl', dirComics: 'ltr', anim: true, autoFs: false, hint: true, quality: 'std', cut: 'normal', keep: 2, wifi: false, theme: 'dark', paper: 'black' };
const SET = { ...SET_DEFAULT, ...ls.get('cpc:set', {}) };
function setSet(k, v) { SET[k] = v; ls.set('cpc:set', SET); }
let ROOT = ls.get('cpc:root', null) || DEFAULT_ROOT;
const ROOT_ID = DEFAULT_ROOT.id;

if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js?v=13';

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
  for (const m of tmp.slice(Math.max(0, +SET.keep || 0))) await dropLocal(m.id);
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
  if (window.onAuthChange) onAuthChange();
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
  refreshing = true; statusMsg = ''; render();
  try {
    const root = await listChildren(ROOT.id);
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
    if (loose.length) { loose.sort((a, b) => natural(a.title, b.title)); series.push({ id: ROOT.id, title: 'Divers', tomes: loose }); }
    series.sort((a, b) => natural(a.title, b.title));
    for (const s of series) for (const t of s.tomes) t.s = s.id;
    LIB = { series, at: Date.now(), root: ROOT.id }; ls.set('cpc:lib', LIB); indexLib();
    if (window.onLibrary) onLibrary();
    statusMsg = '';
    if (manual) toast('Bibliothèque à jour.');
  } catch (e) {
    statusMsg = e instanceof NeedAuth ? '' : e.status === 404
      ? 'Le dossier « ' + ROOT.name + ' » est introuvable dans ton Google Drive.'
      : 'Google Drive ne répond pas. La bibliothèque affichée peut ne pas être à jour.';
  } finally { refreshing = false; render(); }
}

/* ---------- Progression (synchronisée dans l'espace privé de l'appli sur le Drive) ---------- */
let POS = ls.get('cpc:pos', {});     // tomeId -> { p, n, t }
let PREFS = ls.get('cpc:prefs', {}); // seriesId -> { rtl, t }
let TYPES = ls.get('cpc:types', {}); // seriesId -> { type: 'manga' | 'comics', t } (choix fait à la main)
let WISH = ls.get('cpc:wish', {});   // clé catalogue -> { key, title, type, who, year, cover, c1, c2, t, del }
let syncT = 0, syncing = false, lastSync = ls.get('cpc:lastSync', 0);
function dirty() { ls.set('cpc:dirty', true); clearTimeout(syncT); syncT = setTimeout(syncProgress, 4000); }
function setPos(id, p, n) { POS[id] = { p, n, t: Date.now() }; ls.set('cpc:pos', POS); dirty(); }
function setType(sid, type) { if (!sid) return; TYPES[sid] = { type, t: Date.now() }; ls.set('cpc:types', TYPES); dirty(); }
function setWish(item, on) {
  const k = item.key; WISH[k] = on ? { ...item, t: Date.now(), del: false } : { key: k, t: Date.now(), del: true };
  ls.set('cpc:wish', WISH); dirty();
}
const wishOn = (k) => !!(WISH[k] && !WISH[k].del);
function setRtlPref(sid, v) { if (!sid) return; PREFS[sid] = { rtl: v, t: Date.now() }; ls.set('cpc:prefs', PREFS); ls.set('cpc:lastRtl', v); dirty(); }
function merge(a, b) {
  const out = { ...a }; let inA = false, inB = false;
  for (const k in b) if (!out[k] || (b[k].t || 0) > (out[k].t || 0)) { out[k] = b[k]; inA = true; }
  for (const k in a) if (!b[k] || (a[k].t || 0) > (b[k].t || 0)) inB = true;
  return [out, inA, inB];
}
async function syncProgress() {
  if (syncing || !SET.sync || !tokenOk() || !navigator.onLine) return;
  syncing = true;
  try {
    let id = ls.get('cpc:syncId', null);
    if (!id) {
      const j = await (await api('files?spaces=appDataFolder&fields=files(id)&q=' + encodeURIComponent("name='progress.json'"))).json();
      id = j.files && j.files[0] ? j.files[0].id : null;
    }
    let remote = { pos: {}, prefs: {}, types: {}, wish: {} };
    if (id) {
      try { remote = await (await api(`files/${id}?alt=media`)).json(); }
      catch (e) { if (e.status === 404) id = null; else throw e; }
    }
    const [pos, a1, b1] = merge(POS, (remote && remote.pos) || {});
    const [prefs, a2, b2] = merge(PREFS, (remote && remote.prefs) || {});
    const [types, a3, b3] = merge(TYPES, (remote && remote.types) || {});
    const [wish, a4, b4] = merge(WISH, (remote && remote.wish) || {});
    if (a1 || a2 || a3 || a4) {
      POS = pos; PREFS = prefs; TYPES = types; WISH = wish;
      ls.set('cpc:pos', POS); ls.set('cpc:prefs', PREFS); ls.set('cpc:types', TYPES); ls.set('cpc:wish', WISH);
      if (VIEW !== 'read') render();
    }
    if (b1 || b2 || b3 || b4 || !id) {
      const body = JSON.stringify({ pos, prefs, types, wish });
      if (id) await api(`files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body }, UPLOAD);
      else {
        const mp = '--cpcb\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify({ name: 'progress.json', parents: ['appDataFolder'] }) +
          '\r\n--cpcb\r\nContent-Type: application/json\r\n\r\n' + body + '\r\n--cpcb--';
        id = (await (await api('files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=cpcb' }, body: mp }, UPLOAD)).json()).id;
      }
    }
    ls.set('cpc:syncId', id); ls.set('cpc:dirty', false); lastSync = Date.now(); ls.set('cpc:lastSync', lastSync);
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
// Couleurs de repli (tant que la vraie couverture n'est pas là), stables pour un même titre
const PALETTE = [['#ffb23e', '#c2361b'], ['#ffd84a', '#2457c5'], ['#6ec6ff', '#2b4fd8'], ['#2fbfa7', '#1c3a4a'], ['#ff4d6d', '#1d3557'], ['#b5e48c', '#1e6091'],
  ['#f9c74f', '#2d6a4f'], ['#ff9f1c', '#3d348b'], ['#caf0f8', '#4f6d7a'], ['#e63946', '#1d1d2b'], ['#90e0ef', '#023047'], ['#ffafcc', '#7b2cbf']];
function hue(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return PALETTE[h % PALETTE.length]; }
function covHTML(t, label, badge, extra) {
  const [c1, c2] = hue(label);
  return '<div class="cov' + (extra && extra.cls ? ' ' + extra.cls : '') + '" style="--c1:' + c1 + ';--c2:' + c2 + '" data-c="' + (t ? t.id : '') + '"><span class="lab">' + esc(label) + '</span><img alt="" draggable="false">' +
    (badge ? '<b class="badge">' + esc(badge) + '</b>' : '') + (extra && extra.prog != null ? '<span class="prog"><i style="width:' + extra.prog + '%"></i></span>' : '') + '</div>';
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
      img.onload = () => { img.classList.add('in'); };
      img.onerror = () => { img.classList.remove('in'); };
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
      for (const el of $$('.cov[data-c="' + t.id + '"]')) { const img = $('img', el); img.onload = () => { img.classList.add('in'); }; img.src = COVURL.get(t.id); }
      if (window.onCover) onCover(t.id);
    }
  } catch (e) {} finally { covering.delete(t.id); }
}

/* ---------- Sources de pages ---------- */
const QK = () => ({ eco: 0.6, std: 1, max: 1.6 }[SET.quality] || 1);
let MAXPX = (MOBILE ? 6e6 : 12e6) * QK();
function applyQuality() { MAXPX = (MOBILE ? 6e6 : 12e6) * QK(); }
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
      const maxPx = (MOBILE ? 8e6 : 16e6) * QK();
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

/* Petit curseur glissant des contrôles segmentés */
function paintSeg(seg) {
  if (!seg) return;
  const th = $('.thumb', seg), on = $$('button', seg).find((b) => b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-checked') === 'true');
  if (!th) return;
  if (!on) { th.style.opacity = '0'; return; }
  if (!on.offsetWidth) return;
  const first = !th.dataset.p;
  if (first) th.style.transition = 'none';
  th.style.opacity = '1';
  th.style.width = on.offsetWidth + 'px';
  th.style.transform = 'translateX(' + (on.offsetLeft - 2) + 'px)';
  if (first) { th.dataset.p = '1'; void th.offsetWidth; th.style.transition = ''; }
}
function paintSegs(root) { for (const s of $$('.seg', root)) paintSeg(s); }

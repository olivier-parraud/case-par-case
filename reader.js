/* Case par Case — reader.js : le lecteur (case par case ou page entière), plein écran, gestes. */
'use strict';

const stage = $('#stage'), flip = $('#flip'), layer = $('#layer'), hole = $('#hole'), readerEl = $('#reader');
const S = { tome: null, series: null, src: null, page: 0, panel: 0, cur: null, mode: SET.mode === 'page' ? 'page' : 'panel',
  rtl: false, cache: new Map(), token: 0, cvEl: $('#blank'), immersive: false };
const CACHE_MAX = MOBILE ? 3 : 5;
function targetWidth() {
  const dpr = window.devicePixelRatio || 1, m = Math.max(innerWidth, innerHeight) * dpr;
  const w = MOBILE ? Math.min(1800, Math.max(1000, m)) : Math.min(2600, Math.max(1400, m * 1.2));
  return Math.round(w * Math.sqrt(QK()));
}
function freeCanvas(cv) { if (cv && cv !== S.cvEl) { cv.width = 1; cv.height = 1; } }
function getPage(i) {
  if (S.cache.has(i)) { const v = S.cache.get(i); S.cache.delete(i); S.cache.set(i, v); return v; }
  const src = S.src;
  const p = (async () => { const cv = await src.render(i, targetWidth()); return { cv, det: detect(cv), list: null }; })();
  S.cache.set(i, p);
  p.catch(() => S.cache.delete(i));
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
  loadTimer = setTimeout(() => { $('span:last-child', el).textContent = msg; el.hidden = false; }, el.hidden ? 160 : 0);
}
async function goPage(i, at, dir) {
  if (!S.src) return;
  i = Math.max(0, Math.min(S.src.numPages - 1, i));
  const tok = ++S.token;
  setRLoad('Page ' + (i + 1));
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
  // Changement de page : la nouvelle glisse doucement depuis le côté où l'on va
  if (flip.animate && SET.anim) {
    const dx = dir ? (dir > 0 ? 1 : -1) * (S.rtl ? -1 : 1) * 36 : 0;
    flip.animate([{ opacity: 0, transform: 'translateX(' + dx + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  paintMini(true);
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
  S.view = { tx, ty, s };
  Object.assign(hole.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  if (!anim) { void layer.offsetWidth; layer.style.transition = ''; hole.style.transition = ''; }
  readerEl.classList.toggle('page-mode', S.mode === 'page' || pg.list.length < 2);
  updateReaderUI();
  paintMini(false);
}
let sharpEl = $('#sharp'), sharpTimer = 0, sharpTok = 0;
function hideSharp() { clearTimeout(sharpTimer); sharpTok++; sharpEl.classList.remove('on'); if (S.src && S.src.cancelRegion) S.src.cancelRegion(); }
function scheduleSharp(r, s, anim) {
  if (!S.src || !S.src.renderRegion || !S.cur || SET.quality === 'eco') return;
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
  }, anim ? 480 : 40);
}

/* Aperçu de la page (tablette) : où se trouve la case en cours */
const mini = $('#mini'), miniCv = $('canvas', mini), miniBox = $('i', mini);
function paintMini(redraw) {
  const pg = S.cur; if (!pg || innerWidth < 700) return;
  if (redraw) {
    const w = 184, h = Math.round(pg.cv.height * w / pg.cv.width);
    miniCv.width = w; miniCv.height = h;
    const g = miniCv.getContext('2d'); g.imageSmoothingQuality = 'medium'; g.drawImage(pg.cv, 0, 0, w, h);
  }
  const r = pg.list[S.panel] || { x: 0, y: 0, w: pg.cv.width, h: pg.cv.height };
  const k = 100 / pg.cv.width, kh = 100 / pg.cv.height;
  Object.assign(miniBox.style, { left: (r.x * k) + '%', top: (r.y * kh) + '%', width: (r.w * k) + '%', height: (r.h * kh) + '%' });
}

function updateReaderUI() {
  const n = S.src ? S.src.numPages : 1, k = S.cur ? S.cur.list.length : 1;
  $('#pos').textContent = 'Page ' + (S.page + 1) + ' / ' + n;
  $('#count').textContent = S.mode === 'page' || k < 2 ? plural(k, 'case') : 'Case ' + (S.panel + 1) + ' / ' + k;
  const sl = $('#slider'); sl.max = n; sl.value = S.page + 1; sl.dir = S.rtl ? 'rtl' : 'ltr';
  sl.style.setProperty('--p', (n > 1 ? (S.page / (n - 1)) * 100 : 100) + '%');
  sl.style.transform = S.rtl ? 'scaleX(-1)' : '';
  for (const seg of [$('#rMode'), $('#rModeTop')]) for (const b of $$('button', seg)) b.setAttribute('aria-pressed', b.dataset.mode === S.mode);
  for (const b of $$('#rDir button')) b.setAttribute('aria-pressed', (b.dataset.dir === 'rtl') === S.rtl);
  paintSegs(readerEl);
}
function sibling(dir) {
  const s = S.series; if (!s || !S.tome) return null;
  const i = s.tomes.findIndex((x) => x.id === S.tome.id);
  return i < 0 ? null : s.tomes[i + dir] || null;
}
function next() {
  if (!S.cur) return;
  resetZoom(true);
  if (S.mode === 'panel' && S.panel < S.cur.list.length - 1) { S.panel++; show(true); return; }
  if (S.page < S.src.numPages - 1) { goPage(S.page + 1, 'first', 1); return; }
  const nt = sibling(1);
  if (nt) { history.replaceState({ v: 'read', t: nt.id }, ''); openTome(nt.id, 'start'); toast(fullTitle(nt)); }
  else toast('C’était le dernier tome de la série.');
}
function prev() {
  if (!S.cur) return;
  resetZoom(true);
  if (S.mode === 'panel' && S.panel > 0) { S.panel--; show(true); return; }
  if (S.page > 0) { goPage(S.page - 1, S.mode === 'panel' ? 'last' : 'first', -1); return; }
  const pt = sibling(-1);
  if (pt) { history.replaceState({ v: 'read', t: pt.id }, ''); openTome(pt.id, 'end'); }
}
function setMode(m) { if (S.mode === m) return; S.mode = m; setSet('mode', m); show(true); }
function setRtl(v) {
  if (S.rtl === v) return;
  S.rtl = v; setRtlPref(S.tome && S.tome.s, v);
  if (S.cur) { S.cur.list = flatten(S.cur.det, v, S.cur.cv.width, S.cur.cv.height); S.panel = 0; }
  show(true);
  toast(v ? 'Sens manga : de droite à gauche' : 'Sens BD : de gauche à droite');
}

/* Commandes escamotables */
let chromeT = 0;
function showChrome(on) { readerEl.classList.toggle('bare', !on); clearTimeout(chromeT); if (on) requestAnimationFrame(() => paintSegs(readerEl)); }
function toggleChrome() { showChrome(readerEl.classList.contains('bare')); }
function hideChromeSoon(ms) { clearTimeout(chromeT); chromeT = setTimeout(() => showChrome(false), ms || 2600); }

/* Plein écran : plus rien autour de la planche. Un geste au centre fait apparaître « Quitter le plein écran ». */
const exitBtn = $('#exitfs');
let exitT = 0;
const canNativeFs = !!(document.documentElement.requestFullscreen) && !(IOS && innerWidth < 700);
function enterFs() {
  S.immersive = true; readerEl.classList.add('immersive'); showChrome(false);
  if (canNativeFs && !document.fullscreenElement) { try { const p = document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  flashExit(2200);
  hint('Touche le haut de l’écran pour faire apparaître le bouton de sortie.', 2600);
}
function exitFs() {
  S.immersive = false; readerEl.classList.remove('immersive'); exitBtn.classList.remove('on');
  if (document.fullscreenElement) { try { document.exitFullscreen().catch(() => {}); } catch (e) {} }
  showChrome(true); hideChromeSoon(3200);
}
function flashExit(ms) { exitBtn.classList.add('on'); clearTimeout(exitT); exitT = setTimeout(() => exitBtn.classList.remove('on'), ms || 3000); }
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && S.immersive && VIEW === 'read') exitFs(); });
exitBtn.onclick = (e) => { e.stopPropagation(); exitFs(); };

let hintT = 0;
function hint(msg, ms) { const h = $('#rhint'); h.textContent = msg; h.classList.add('on'); clearTimeout(hintT); hintT = setTimeout(() => h.classList.remove('on'), ms || 2800); }
function gestureHint() {
  if (!SET.hint || ls.get('cpc:hintSeen', 0) >= 3) return;
  ls.set('cpc:hintSeen', ls.get('cpc:hintSeen', 0) + 1);
  const z = $('.tapzones');
  setTimeout(() => { z.classList.add('on'); setTimeout(() => z.classList.remove('on'), 2200); }, 700);
}

function closeReader() {
  S.token++;
  thumbTok++; THUMBS.clear(); if (!thumbs.hidden) { thumbs.hidden = true; thumbs.classList.remove('open'); tgrid.innerHTML = ''; }
  Z.k = 1; Z.x = 0; Z.y = 0; applyZ(false);
  hideSharp(); setRLoad(null);
  if (S.src && S.src.destroy) S.src.destroy();
  for (const p of S.cache.values()) p.then((pg) => freeCanvas(pg.cv)).catch(() => {});
  S.cache.clear(); S.src = null; S.cur = null; S.tome = null; S.series = null;
  const blank = document.createElement('canvas'); blank.width = blank.height = 10;
  if (S.cvEl && S.cvEl.parentNode === layer) { const old = S.cvEl; layer.replaceChild(blank, old); if (old.id !== 'blank') { old.width = old.height = 1; } }
  S.cvEl = blank;
  if (S.immersive) { S.immersive = false; readerEl.classList.remove('immersive'); exitBtn.classList.remove('on'); if (document.fullscreenElement) try { document.exitFullscreen().catch(() => {}); } catch (e) {} }
}
async function openTome(id, at) {
  const t = TOMES.get(id);
  if (!t) { toast('Ce tome n’est plus dans la bibliothèque.'); go({ v: 'home' }, true); return; }
  closeReader();
  showView('read');
  S.tome = t; S.series = seriesOf(t.s);
  $('#rTitle').textContent = fullTitle(t); $('#rSeries').textContent = S.series ? S.series.title : '';
  readerEl.classList.toggle('noanim', !SET.anim);
  showChrome(true);
  const tok = S.token;
  setRLoad('Ouverture');
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
      data = await fetchTome(t, (p) => { if (tok === S.token) setRLoad('Chargement ' + Math.round(p * 100) + ' %'); });
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
  S.rtl = seriesRtl(t.s);
  S.mode = SET.mode === 'page' ? 'page' : 'panel';
  const pos = POS[id]; let page = 0;
  if (at === 'end') page = src.numPages - 1;
  else if (at === 'resume' && pos && pos.p > 0 && pos.p < src.numPages - 1) page = pos.p;
  await goPage(page, at === 'end' && S.mode === 'panel' ? 'last' : 'first');
  if (SET.autoFs) enterFs(); else hideChromeSoon();
  gestureHint();
  setTimeout(() => { if (S.src === src) ensureCover(t, src); }, 1200);
}

/* ---------- Gestes et clavier ---------- */
for (const seg of [$('#rMode'), $('#rModeTop')]) seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { setMode(b.dataset.mode); hideChromeSoon(3200); } });
$('#rDir').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { setRtl(b.dataset.dir === 'rtl'); hideChromeSoon(3200); } });
$('#slider').oninput = (e) => {
  const n = S.src ? S.src.numPages : 1;
  $('#pos').textContent = 'Page ' + e.target.value + ' / ' + n;
  e.target.style.setProperty('--p', (n > 1 ? ((e.target.value - 1) / (n - 1)) * 100 : 100) + '%');
  clearTimeout(chromeT);
};
$('#slider').onchange = (e) => { goPage(+e.target.value - 1, 'first'); hideChromeSoon(3200); };
$('#fsBtn').onclick = () => { if (S.immersive) exitFs(); else enterFs(); };
$('#rbot').addEventListener('pointerdown', () => clearTimeout(chromeT));
$('#rtop').addEventListener('pointerdown', () => clearTimeout(chromeT));

/* ---------- Gestes : toucher à droite = suivant, à gauche = précédent, pincer pour zoomer ---------- */
const pz = $('#pz'), Z = { k: 1, x: 0, y: 0 };
const zoomed = () => Z.k > 1.02;
function applyZ(anim) {
  pz.style.transition = anim ? 'transform .38s cubic-bezier(.32,.72,0,1)' : 'none';
  pz.style.transform = 'translate(' + Z.x + 'px,' + Z.y + 'px) scale(' + Z.k + ')';
  readerEl.classList.toggle('zoomed', zoomed());
}
function clampZ() {
  const vw = stage.clientWidth, vh = stage.clientHeight;
  Z.k = Math.min(6, Math.max(1, Z.k));
  Z.x = Math.min(0, Math.max(vw - vw * Z.k, Z.x)); Z.y = Math.min(0, Math.max(vh - vh * Z.k, Z.y));
}
function resetZoom(anim) { if (Z.k === 1 && !Z.x && !Z.y) return; Z.k = 1; Z.x = 0; Z.y = 0; applyZ(anim); }
function zoomAt(k, px, py, anim) {
  const cx = (px - Z.x) / Z.k, cy = (py - Z.y) / Z.k;
  Z.k = k; Z.x = px - cx * k; Z.y = py - cy * k; clampZ(); applyZ(anim);
}
readerEl.addEventListener('scroll', () => { if (readerEl.scrollTop || readerEl.scrollLeft) { readerEl.scrollTop = 0; readerEl.scrollLeft = 0; } });
function tapAt(cx, cy) {
  const rc = stage.getBoundingClientRect(), x = (cx - rc.left) / rc.width, y = (cy - rc.top) / rc.height;
  // Bande du haut ou du bas : commandes (ou bouton de sortie en plein écran)
  if (y < 0.14 || y > 0.86) { if (S.immersive) flashExit(); else { toggleChrome(); if (!readerEl.classList.contains('bare')) hideChromeSoon(4000); } return; }
  resetZoom(true);
  x >= 0.5 ? next() : prev();
  if (!S.immersive) showChrome(false);
}
const ptrs = new Map(); let gest = null;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
stage.addEventListener('pointerdown', (e) => {
  const rc = stage.getBoundingClientRect();
  ptrs.set(e.pointerId, { x: e.clientX - rc.left, y: e.clientY - rc.top });
  try { stage.setPointerCapture(e.pointerId); } catch (err) {}
  if (ptrs.size === 2) {
    const [a, b] = [...ptrs.values()];
    gest = { type: 'pinch', d0: Math.max(10, dist(a, b)), m0: mid(a, b), k0: Z.k, x0: Z.x, y0: Z.y };
  } else if (ptrs.size === 1) gest = { type: 'tap', sx: e.clientX, sy: e.clientY, t: Date.now(), x0: Z.x, y0: Z.y };
  else gest = { type: 'done' };
});
stage.addEventListener('pointermove', (e) => {
  if (!ptrs.has(e.pointerId) || !gest) return;
  const rc = stage.getBoundingClientRect();
  ptrs.set(e.pointerId, { x: e.clientX - rc.left, y: e.clientY - rc.top });
  if (gest.type === 'pinch' && ptrs.size >= 2) {
    const [a, b] = [...ptrs.values()], m = mid(a, b);
    const k = Math.min(6, Math.max(0.85, gest.k0 * dist(a, b) / gest.d0));
    const cx = (gest.m0.x - gest.x0) / gest.k0, cy = (gest.m0.y - gest.y0) / gest.k0;
    Z.k = k; Z.x = m.x - cx * k; Z.y = m.y - cy * k;
    if (k >= 1) clampZ();
    applyZ(false); hideSharp();
  } else if ((gest.type === 'tap' || gest.type === 'pan') && zoomed()) {
    const dx = e.clientX - gest.sx, dy = e.clientY - gest.sy;
    if (gest.type === 'pan' || Math.hypot(dx, dy) > 8) { gest.type = 'pan'; Z.x = gest.x0 + dx; Z.y = gest.y0 + dy; clampZ(); applyZ(false); }
  }
});
function endPointer(e) {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (!gest) return;
  if (gest.type === 'pinch') {
    if (ptrs.size === 0) { if (Z.k < 1.06) resetZoom(true); else { clampZ(); applyZ(true); } gest = null; }
    else gest = { type: 'done' };
    return;
  }
  if (gest.type === 'done') { if (!ptrs.size) gest = null; return; }
  const g = gest; gest = null;
  if (e.type === 'pointercancel' || g.type === 'pan') return;
  const dx = e.clientX - g.sx, dy = e.clientY - g.sy, fast = Date.now() - g.t < 320;
  if (!zoomed()) {
    // Glisser vers le haut : toutes les pages
    if (dy < -60 && Math.abs(dy) > Math.abs(dx) * 1.3) { openThumbs(); return; }
    if ((Math.abs(dx) > 40 || (fast && Math.abs(dx) > 24)) && Math.abs(dx) > Math.abs(dy) * 1.2) { (S.rtl ? dx > 0 : dx < 0) ? next() : prev(); if (!S.immersive) showChrome(false); return; }
  }
  if (Math.abs(dx) < 14 && Math.abs(dy) < 14) tapAt(e.clientX, e.clientY);
}
stage.addEventListener('pointerup', endPointer);
stage.addEventListener('pointercancel', endPointer);
let wheelLock = 0;
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.ctrlKey) { // pincement du trackpad
    const rc = stage.getBoundingClientRect();
    const k = Math.min(6, Math.max(1, Z.k * Math.exp(-e.deltaY / 120)));
    if (k <= 1.02) resetZoom(false); else zoomAt(k, e.clientX - rc.left, e.clientY - rc.top, false);
    return;
  }
  if (zoomed()) { Z.x -= e.deltaX; Z.y -= e.deltaY; clampZ(); applyZ(false); return; }
  const now = Date.now(); if (now < wheelLock || Math.abs(e.deltaY) < 4) return;
  wheelLock = now + 280; e.deltaY > 0 ? next() : prev();
}, { passive: false });

/* ---------- Toutes les pages (glisser vers le haut, ou bouton) ---------- */
const thumbs = $('#thumbs'), tgrid = $('#tgrid');
let thumbTok = 0, thumbQ = [], thumbBusy = false, thumbObs = null;
const THUMBS = new Map();
function openThumbs() {
  if (!S.src) return;
  const n = S.src.numPages, tok = ++thumbTok;
  $('#tcount').textContent = plural(n, 'page');
  $('#tsub').textContent = 'Tu es page ' + (S.page + 1);
  tgrid.innerHTML = Array.from({ length: n }, (_, i) => '<button class="th' + (i === S.page ? ' cur' : '') + '" data-pg="' + i + '" aria-label="Page ' + (i + 1) + '"><span class="im"></span><span class="nb">' + (i + 1) + '</span></button>').join('');
  thumbs.hidden = false; showChrome(false);
  requestAnimationFrame(() => requestAnimationFrame(() => thumbs.classList.add('open')));
  // Centre la page en cours sans faire défiler le reste du lecteur
  const cur = $('.th.cur', tgrid), tp = $('.tpanel', thumbs);
  if (cur) setTimeout(() => { tp.scrollTop = Math.max(0, cur.offsetTop - tp.clientHeight / 2 + cur.offsetHeight / 2); }, 30);
  if (thumbObs) thumbObs.disconnect();
  thumbQ = [];
  thumbObs = new IntersectionObserver((ents) => {
    for (const en of ents) if (en.isIntersecting) { const i = +en.target.dataset.pg; thumbObs.unobserve(en.target); if (!fillThumb(en.target, i)) { thumbQ.push([en.target, i]); pumpThumbs(tok); } }
  }, { root: $('.tpanel', thumbs), rootMargin: '300px' });
  for (const el of $$('.th', tgrid)) thumbObs.observe(el);
}
function fillThumb(el, i) {
  const c = THUMBS.get(i); if (!c) return false;
  const box = $('.im', el); if (!box.firstChild) box.appendChild(c.cloneNode ? cloneCanvas(c) : c);
  return true;
}
function cloneCanvas(c) { const n = document.createElement('canvas'); n.width = c.width; n.height = c.height; n.getContext('2d').drawImage(c, 0, 0); return n; }
async function pumpThumbs(tok) {
  if (thumbBusy) return; thumbBusy = true;
  try {
    while (thumbQ.length && tok === thumbTok && S.src) {
      const [el, i] = thumbQ.shift();
      if (THUMBS.has(i)) { fillThumb(el, i); continue; }
      let big = null;
      if (S.cache.has(i)) { try { big = (await S.cache.get(i)).cv; } catch (e) {} }
      let c;
      try {
        const src = big || await S.src.render(i, 220);
        c = document.createElement('canvas'); c.width = 180; c.height = Math.round(src.height * 180 / src.width);
        const g = c.getContext('2d'); g.imageSmoothingQuality = 'medium'; g.drawImage(src, 0, 0, c.width, c.height);
        if (!big) { src.width = src.height = 1; }
      } catch (e) { continue; }
      if (tok !== thumbTok) break;
      THUMBS.set(i, c); fillThumb(el, i);
    }
  } finally { thumbBusy = false; }
}
function closeThumbs() {
  if (thumbs.hidden) return;
  thumbTok++; thumbs.classList.remove('open');
  setTimeout(() => { if (!thumbs.classList.contains('open')) { thumbs.hidden = true; tgrid.innerHTML = ''; } }, 420);
}
tgrid.addEventListener('click', (e) => { const b = e.target.closest('[data-pg]'); if (!b) return; closeThumbs(); resetZoom(false); goPage(+b.dataset.pg, 'first', +b.dataset.pg > S.page ? 1 : -1); });
$('.tscrim', thumbs).addEventListener('click', closeThumbs);
$('#tclose').addEventListener('click', closeThumbs);
$('#thumbBtn').addEventListener('click', openThumbs);
{ // Glisser vers le bas sur la poignée ou l'en-tête : fermer
  const head = $('.thead-wrap', thumbs), panel = $('.tpanel', thumbs); let y0 = null, dy = 0;
  head.addEventListener('pointerdown', (e) => { y0 = e.clientY; dy = 0; panel.style.transition = 'none'; try { head.setPointerCapture(e.pointerId); } catch (err) {} });
  head.addEventListener('pointermove', (e) => { if (y0 == null) return; dy = Math.max(0, e.clientY - y0); panel.style.transform = 'translateY(' + dy + 'px)'; });
  const up = () => { if (y0 == null) return; y0 = null; panel.style.transition = ''; panel.style.transform = ''; if (dy > 80) closeThumbs(); };
  head.addEventListener('pointerup', up); head.addEventListener('pointercancel', up);
  panel.addEventListener('touchstart', (e) => { if (panel.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
  panel.addEventListener('touchmove', (e) => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0 && panel.scrollTop <= 0) { panel.style.transition = 'none'; panel.style.transform = 'translateY(' + dy + 'px)'; } }, { passive: true });
  panel.addEventListener('touchend', up);
}

/* ---------- Capture de la case (ou de ce qui est à l'écran) ---------- */
async function capture() {
  const pg = S.cur; if (!pg || !S.src || !S.tome) return;
  const full = { x: 0, y: 0, w: pg.cv.width, h: pg.cv.height };
  let r = S.mode === 'page' || pg.list.length < 2 ? full : pg.list[S.panel];
  if (zoomed() && S.view) {
    // Seulement la partie zoomée visible à l'écran
    const vw = stage.clientWidth, vh = stage.clientHeight, V = S.view;
    const toC = (px, py) => [((px - Z.x) / Z.k - V.tx) / V.s, ((py - Z.y) / Z.k - V.ty) / V.s];
    const [ax, ay] = toC(0, 0), [bx, by] = toC(vw, vh);
    const x0 = Math.max(0, ax), y0 = Math.max(0, ay), x1 = Math.min(full.w, bx), y1 = Math.min(full.h, by);
    if (x1 - x0 > 20 && y1 - y0 > 20) r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  toast('Capture…', 900);
  let out = null;
  if (S.src.renderRegion) { try { out = await S.src.renderRegion(S.page, r, pg.cv._sc, Math.min(3, 2400 / r.w)); } catch (e) { out = null; } }
  if (!out) {
    out = document.createElement('canvas'); out.width = Math.round(r.w); out.height = Math.round(r.h);
    out.getContext('2d').drawImage(pg.cv, r.x, r.y, r.w, r.h, 0, 0, out.width, out.height);
  }
  const blob = await new Promise((res) => out.toBlob(res, 'image/jpeg', 0.92));
  out.width = out.height = 1;
  if (!blob) { toast('Capture impossible.'); return; }
  const name = (fullTitle(S.tome) + ' - p' + (S.page + 1) + (S.mode === 'panel' && pg.list.length > 1 ? ' case ' + (S.panel + 1) : '')).replace(/[\\/:*?"<>|]/g, '-') + '.jpg';
  showCapture(blob, name);
}
let capURL = null, capFile = null;
function showCapture(blob, name) {
  if (capURL) URL.revokeObjectURL(capURL);
  capURL = URL.createObjectURL(blob); capFile = new File([blob], name, { type: 'image/jpeg' });
  const canShare = !!(navigator.canShare && navigator.canShare({ files: [capFile] }));
  openSheet('<div class="phead"><b>Capture</b><button data-act="closesheet">OK</button></div>' +
    '<img class="capimg" src="' + capURL + '" alt="Capture de la case">' +
    '<div style="display:flex;gap:10px;margin-top:16px">' +
    (canShare ? '<button class="btn primary press" style="flex:1" data-act="capshare">Enregistrer ou partager</button>' : '') +
    '<a class="btn ' + (canShare ? '' : 'primary ') + 'press" style="flex:1" href="' + capURL + '" download="' + esc(name) + '">Télécharger</a></div>' +
    (canShare ? '<p class="small" style="margin:12px 4px 0">« Enregistrer l’image » la range dans Photos.</p>' : ''));
}
async function shareCapture() {
  if (!capFile) return;
  try { await navigator.share({ files: [capFile], title: capFile.name }); closeSheet(); }
  catch (e) { if (e && e.name !== 'AbortError') toast('Partage impossible : utilise « Télécharger ».'); }
}
$('#capBtn').addEventListener('click', capture);
document.addEventListener('keydown', (e) => {
  if (VIEW !== 'read' || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.sheet')) return;
  if (!thumbs.hidden && e.key !== 'Escape' && e.key.toLowerCase() !== 't') return;
  // Flèche droite et flèche bas : toujours la case suivante, dans l'ordre de lecture choisi (BD ou manga)
  const act = {
    ArrowRight: next, ArrowDown: next, ' ': next, PageDown: next, Enter: next,
    ArrowLeft: prev, ArrowUp: prev, PageUp: prev, Backspace: prev,
    Home: () => goPage(0, 'first', -1), End: () => S.src && goPage(S.src.numPages - 1, 'first', 1),
    p: () => setMode(S.mode === 'page' ? 'panel' : 'page'), m: () => setRtl(!S.rtl), f: () => (S.immersive ? exitFs() : enterFs()),
    c: capture, t: () => (thumbs.hidden ? openThumbs() : closeThumbs()), '0': () => resetZoom(true),
    Escape: () => (!thumbs.hidden ? closeThumbs() : zoomed() ? resetZoom(true) : S.immersive ? exitFs() : leave())
  }[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (act) { e.preventDefault(); e.stopPropagation(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); act(); }
}, true);
// Un bouton ou le curseur des pages ne garde pas le clavier : les flèches tournent toujours les cases
readerEl.addEventListener('click', (e) => { const b = e.target.closest('button, input'); if (b) setTimeout(() => b.blur(), 0); });
$('#slider').addEventListener('change', (e) => e.target.blur());

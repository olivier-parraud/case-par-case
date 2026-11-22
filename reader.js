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
  if (S.mode === 'panel' && S.panel < S.cur.list.length - 1) { S.panel++; show(true); return; }
  if (S.page < S.src.numPages - 1) { goPage(S.page + 1, 'first', 1); return; }
  const nt = sibling(1);
  if (nt) { history.replaceState({ v: 'read', t: nt.id }, ''); openTome(nt.id, 'start'); toast(fullTitle(nt)); }
  else toast('C’était le dernier tome de la série.');
}
function prev() {
  if (!S.cur) return;
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
  hint('Touche au centre pour faire apparaître le bouton de sortie.', 2600);
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
  if (S.rtl) { z.children[0].textContent = 'Suivante'; z.children[2].textContent = 'Précédente'; } else { z.children[0].textContent = 'Précédente'; z.children[2].textContent = 'Suivante'; }
  setTimeout(() => { z.classList.add('on'); setTimeout(() => z.classList.remove('on'), 1800); }, 700);
}

function closeReader() {
  S.token++;
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

let down = null;
stage.addEventListener('pointerdown', (e) => { if (e.isPrimary) down = { x: e.clientX, y: e.clientY, t: Date.now() }; });
stage.addEventListener('pointercancel', () => { down = null; });
stage.addEventListener('pointerup', (e) => {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y, fast = Date.now() - down.t < 300; down = null;
  if ((Math.abs(dx) > 40 || (fast && Math.abs(dx) > 24)) && Math.abs(dx) > Math.abs(dy) * 1.2) { (S.rtl ? dx > 0 : dx < 0) ? next() : prev(); if (!S.immersive) showChrome(false); return; }
  if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
    const x = (e.clientX - stage.getBoundingClientRect().left) / stage.clientWidth;
    if (x > 0.3 && x < 0.7) { if (S.immersive) flashExit(); else { toggleChrome(); if (!readerEl.classList.contains('bare')) hideChromeSoon(4000); } return; }
    const right = x >= 0.7; (S.rtl ? !right : right) ? next() : prev();
    if (!S.immersive) showChrome(false);
  }
});
let wheelLock = 0;
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const now = Date.now(); if (now < wheelLock || Math.abs(e.deltaY) < 4) return;
  wheelLock = now + 280; e.deltaY > 0 ? next() : prev();
}, { passive: false });
document.addEventListener('keydown', (e) => {
  if (VIEW !== 'read' || e.ctrlKey || e.metaKey || e.altKey) return;
  // Flèche droite et flèche bas : toujours la case suivante, dans l'ordre de lecture choisi (BD ou manga)
  const act = {
    ArrowRight: next, ArrowDown: next, ' ': next, PageDown: next, Enter: next,
    ArrowLeft: prev, ArrowUp: prev, PageUp: prev, Backspace: prev,
    Home: () => goPage(0, 'first', -1), End: () => S.src && goPage(S.src.numPages - 1, 'first', 1),
    p: () => setMode(S.mode === 'page' ? 'panel' : 'page'), m: () => setRtl(!S.rtl), f: () => (S.immersive ? exitFs() : enterFs()),
    Escape: () => (S.immersive ? exitFs() : leave())
  }[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (act) { e.preventDefault(); e.stopPropagation(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); act(); }
}, true);
// Un bouton ou le curseur des pages ne garde pas le clavier : les flèches tournent toujours les cases
readerEl.addEventListener('click', (e) => { const b = e.target.closest('button, input'); if (b) setTimeout(() => b.blur(), 0); });
$('#slider').addEventListener('change', (e) => e.target.blur());

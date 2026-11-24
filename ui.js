/* Case par Case — ui.js : écrans (Bibliothèque, Série, Découvrir, Recherche, Fiche, Ma liste, Réglages),
   barre d'onglets, barre latérale, transitions, téléchargements et démarrage. */
'use strict';

const I = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  lib: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M4 4h4v16H4zM10 4h4v16h-4zM16.5 4.5l3.6-.9 3.4 15.6-3.6.9z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M10 3.5l1.9 5.1 5.1 1.9-5.1 1.9L10 17.5l-1.9-5.1L3 10.5l5.1-1.9z"/><path d="M18 14.5l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9z"/></svg>',
  mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.7 12.3a1 1 0 0 1-1.4 1.4L12 13.4l-2.3 2.3a1 1 0 0 1-1.4-1.4l2.3-2.3-2.3-2.3a1 1 0 0 1 1.4-1.4l2.3 2.3 2.3-2.3a1 1 0 0 1 1.4 1.4L13.4 12z"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  side: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="15" rx="3"/><path d="M9.5 4.5v15"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.4-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v9M8 12.5l4 4 4-4"/></svg>',
  downAll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/></svg>',
  ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>',
  ring: (p) => '<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-width="3"/><circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="' + (94.2 * p).toFixed(1) + ' 94.2" transform="rotate(-90 18 18)"/></svg>',
  folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/></svg>'
};

/* ---------- Petits outils ---------- */
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = () => innerWidth >= 700;
let PART = ls.get('cpc:part', 'manga') === 'comics' ? 'comics' : 'manga';
const PART_LABEL = { manga: 'Mangas', comics: 'Comics' };
const typeLabel = (t) => (t === 'manga' ? 'Manga' : 'Comics');
function seriesType(sid) {
  if (TYPES[sid]) return TYPES[sid].type;
  if (MATCH[sid]) return MATCH[sid].type;
  if (PREFS[sid] && PREFS[sid].rtl) return 'manga';
  return 'comics';
}
function seriesRtl(sid) {
  if (PREFS[sid]) return !!PREFS[sid].rtl;
  return seriesType(sid) === 'manga' ? SET.dirManga === 'rtl' : SET.dirComics === 'rtl';
}
const allSeries = () => (LIB && LIB.series) || [];
const partSeries = (p) => allSeries().filter((s) => seriesType(s.id) === p);
function ownedSid(item) {
  if (!item) return null;
  const ks = new Set([item.title, ...(item.alt || [])].map(norm));
  for (const s of allSeries()) {
    if (ks.has(norm(s.title))) return s.id;
    const m = MATCH[s.id]; if (m && item.alId && m.alId === item.alId) return s.id;
  }
  return null;
}
const ITEMS = new Map(); // clé catalogue -> fiche
const keep = (it) => { if (it && it.key) { const o = ITEMS.get(it.key); ITEMS.set(it.key, o ? { ...it, ...o, ...it, sum: it.sum || o.sum } : it); } return it; };
const wishList = () => Object.values(WISH).filter((w) => !w.del).sort((a, b) => b.t - a.t);

function seriesStats(s) {
  let done = 0, pinned = 0, started = 0;
  for (const t of s.tomes) { const p = POS[t.id]; if (p) { started++; if (p.p >= p.n - 1) done++; } const m = LOCAL.get(t.id); if (m && m.pinned) pinned++; }
  return { done, pinned, started, n: s.tomes.length };
}
function nextTome(s) {
  // Le tome en cours, sinon le premier pas encore lu
  let last = null;
  for (const t of s.tomes) { const p = POS[t.id]; if (p && (!last || p.t > POS[last.id].t)) last = t; }
  if (last) {
    const p = POS[last.id];
    if (p.p < p.n - 1) return { t: last, p, label: 'Continuer' };
    const i = s.tomes.indexOf(last), nt = s.tomes[i + 1];
    if (nt) return { t: nt, p: POS[nt.id] || null, label: 'Tome suivant' };
    return { t: s.tomes[0], p: null, label: 'Relire', done: true };
  }
  return { t: s.tomes[0], p: null, label: 'Commencer' };
}
function lastRead(part) {
  let best = null;
  for (const id in POS) { const t = TOMES.get(id); if (t && seriesType(t.s) === part && (!best || POS[id].t > POS[best].t)) best = id; }
  if (!best) return null;
  const s = seriesOf(TOMES.get(best).s); if (!s) return null;
  const n = nextTome(s); if (n.done) return null;
  return { ...n, s, label: n.label === 'Tome suivant' ? 'Tome suivant' : 'Reprendre' };
}

/* Teinte d'une couverture, pour les halos colorés */
const TINT = ls.get('cpc:tint', {});
async function tintOf(id) {
  if (TINT[id]) return TINT[id];
  const u = await coverURL(id); if (!u) return null;
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => {
      try {
        const c = document.createElement('canvas'); c.width = c.height = 12; const g = c.getContext('2d'); g.drawImage(im, 0, 0, 12, 12);
        const d = g.getImageData(0, 0, 12, 12).data; let r = 0, gg = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]), sat = mx - mn + 8; r += d[i] * sat; gg += d[i + 1] * sat; b += d[i + 2] * sat; w += sat; }
        const col = 'rgba(' + Math.round(r / w) + ',' + Math.round(gg / w) + ',' + Math.round(b / w) + ',.55)';
        TINT[id] = col; ls.set('cpc:tint', TINT); res(col);
      } catch (e) { res(null); }
    };
    im.onerror = () => res(null); im.src = u;
  });
}
function applyTint(el, tomeId) { if (!el || !tomeId) return; tintOf(tomeId).then((c) => { if (c) el.style.setProperty('--g', c); }); }

/* Couverture d'une fiche de catalogue */
function catCov(it, cls, extra) {
  return '<div class="cov' + (cls ? ' ' + cls : '') + '" style="--c1:' + (it.c1 || '#34343a') + ';--c2:' + (it.c2 || '#1a1a1d') + '"><span class="lab">' + esc(it.title) + '</span>' +
    (it.cover ? '<img alt="" draggable="false" referrerpolicy="no-referrer" loading="lazy" src="' + esc(it.cover) + '" onload="this.classList.add(\'in\')" onerror="this.remove()">' : '') + (extra || '') + '</div>';
}
function wishBtn(it, style) {
  const sid = ownedSid(it);
  if (sid) return style === 'round' ? '<button class="addround on" data-series="' + sid + '" aria-label="Dans ta bibliothèque">' + I.check + '</button>'
    : '<button class="pill owned' + (style === 'big' ? ' big' : '') + '" data-series="' + sid + '">Dans ta bibliothèque</button>';
  const on = wishOn(it.key);
  const lab = on ? 'Retirer ' + it.title + ' de ma liste' : 'Ajouter ' + it.title + ' à ma liste';
  if (style === 'round') return '<button class="addround' + (on ? ' on' : '') + '" data-wish="' + esc(it.key) + '" aria-label="' + esc(lab) + '">' + (on ? I.check : I.plus) + '</button>';
  const txt = style === 'big' ? (on ? 'Dans ma liste' : 'Ajouter à ma liste') : (on ? 'Dans ma liste' : 'Ajouter');
  return '<button class="pill' + (style === 'soft' ? ' soft' : '') + (on ? ' on' : '') + '" data-wish="' + esc(it.key) + '" data-style="' + (style || '') + '" aria-label="' + esc(lab) + '">' +
    (on ? '<span class="ck">✓</span> ' : '+ ') + txt + '</button>';
}
function refreshWishButtons(key) {
  const it = ITEMS.get(key) || WISH[key]; if (!it) return;
  for (const b of $$('[data-wish="' + CSS.escape(key) + '"]')) {
    if (b.dataset.style === 'fiche') continue;
    const tmp = document.createElement('div');
    tmp.innerHTML = wishBtn(it, b.classList.contains('addround') ? 'round' : b.dataset.style || '');
    b.replaceWith(tmp.firstChild);
  }
  renderTabs(); renderSide();
}

/* ---------- Navigation et transitions ---------- */
let VIEW = 'home', depth = 0;
const route = () => history.state || { v: 'home' };
const LEVEL = { home: 0, discover: 0, list: 0, settings: 1, series: 1, search: 1, fiche: 2, read: 3 };
const VIEWS = ['home', 'series', 'discover', 'search', 'fiche', 'list', 'settings'];
function showView(v) {
  VIEW = v;
  for (const n of VIEWS) $('#v-' + n).hidden = n !== v;
  $('#reader').hidden = v !== 'read';
  document.body.classList.toggle('reading', v === 'read');
  renderTabs(); renderSide();
}
function transition(kind, fn) {
  if (reduced || !document.startViewTransition || !kind || document.hidden) { fn(); return; }
  const root = document.documentElement;
  root.classList.add('vt-' + kind);
  try {
    const vt = document.startViewTransition(() => { fn(); });
    vt.finished.finally(() => root.classList.remove('vt-' + kind));
  } catch (e) { root.classList.remove('vt-' + kind); fn(); }
}
function kindFor(from, to) {
  if (to === 'read') return 'open';
  if (from === 'read') return 'close';
  const a = LEVEL[from] || 0, b = LEVEL[to] || 0;
  if (b > a) return 'push';
  if (b < a) return 'pop';
  return from === to ? null : 'fade';
}
function go(r, replace) {
  const kind = kindFor(VIEW, r.v);
  if (replace) history.replaceState(r, ''); else { history.pushState(r, ''); depth++; }
  transition(kind, () => apply(r));
}
function apply(r) {
  if (r.v !== 'read' && VIEW === 'read') { closeReader(); setTimeout(pumpCovers, 500); }
  if (r.v === 'read') { openTome(r.t, r.at || 'resume'); return; }
  if (r.v === 'series') { showView('series'); renderSeries(r.s); }
  else if (r.v === 'discover') { showView('discover'); renderDiscover(); }
  else if (r.v === 'search') { showView('search'); renderSearch(r); }
  else if (r.v === 'fiche') { showView('fiche'); renderFicheView(r.k); }
  else if (r.v === 'list') { showView('list'); renderList(); }
  else if (r.v === 'settings') { showView('settings'); renderSettings(); }
  else { showView('home'); renderHome(); }
  requestAnimationFrame(() => paintSegs(document));
}
addEventListener('popstate', (e) => {
  depth = Math.max(0, depth - 1);
  const r = e.state || { v: 'home' };
  if (!$('.sheet') && !$('.alert')) transition(kindFor(VIEW, r.v), () => apply(r));
  else { closeSheet(true); apply(r); }
});
function leave() {
  if (depth > 0) { history.back(); return; }
  const r = route();
  go(r.v === 'read' && S.tome ? { v: 'series', s: S.tome.s } : r.v === 'fiche' ? { v: 'discover' } : { v: 'home' }, true);
}
function tab(name) {
  closeSheet(true);
  const target = { lib: { v: 'home' }, discover: { v: 'discover' }, list: { v: 'list' }, settings: { v: 'settings' } }[name];
  if (!target) return;
  const cur = route();
  const sameTab = (name === 'lib' && (cur.v === 'home' || cur.v === 'series')) || (name === 'discover' && /discover|search|fiche/.test(cur.v)) || cur.v === target.v;
  if (sameTab && cur.v === target.v) { const v = $('#v-' + target.v); if (v) v.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
  if (sameTab && depth > 0 && LEVEL[cur.v] > 0) { history.back(); return; }
  go(target, depth === 0 && LEVEL[cur.v] === 0);
}
function setPart(p) {
  if (p === PART) return;
  PART = p; ls.set('cpc:part', p);
  if (VIEW === 'home') transition('fade', () => renderHome()); else if (VIEW === 'discover') renderDiscover();
  renderSide();
}

/* Grand titre qui se replie dans la barre en défilant */
for (const n of VIEWS) {
  const v = $('#v-' + n);
  v.addEventListener('scroll', () => { const on = v.scrollTop > 34; if (on !== v.classList.contains('scrolled')) v.classList.toggle('scrolled', on); }, { passive: true });
}
function navbar(opts) {
  const o = opts || {};
  return '<div class="navbar">' + (o.back ? '<button class="back press" data-act="back">' + I.back + esc(o.back) + '</button>' : '') +
    '<span class="ttl">' + esc(o.title || '') + '</span><span class="sp"></span>' + (o.right || '') + '</div>';
}

/* ---------- Barre d'onglets et barre latérale ---------- */
function curTab() {
  const v = VIEW === 'read' ? route().v : VIEW;
  if (/discover|search|fiche/.test(v)) return 'discover';
  if (v === 'list') return 'list';
  if (v === 'settings') return 'settings';
  return 'lib';
}
function renderTabs() {
  const t = curTab(), n = wishList().length, phoneTab = t === 'settings' ? 'lib' : t;
  const b = (k, label, icon, extra) => '<button data-tab="' + k + '"' + (phoneTab === k ? ' aria-current="page"' : '') + '>' + icon + label + (extra || '') + '</button>';
  $('#tabs').innerHTML = b('lib', 'Bibliothèque', I.lib) + b('discover', 'Découvrir', I.spark) + b('list', 'Ma liste', I.mark);
}
const rail = () => document.getElementById('app').classList.contains('railed');
function renderSide() {
  const t = curTab(), home = VIEW === 'home' || VIEW === 'series' || (VIEW === 'read' && route().v !== 'discover');
  const cnt = (p) => { const n = partSeries(p).length; return n ? plural(n, 'série') : ''; };
  const cur = (k) => {
    if (k === 'manga' || k === 'comics') return t === 'lib' && home && (VIEW === 'series' ? seriesType(route().s) === k : PART === k);
    return t === k;
  };
  const ac = (k) => (cur(k) ? ' aria-current="page"' : '');
  const n = wishList().length;
  $('#side').innerHTML =
    '<div class="sbox">' +
      '<div class="brand"><span class="logo" aria-hidden="true"><i></i><i></i><i></i></span><b>Case par Case</b>' +
        '<button class="collapse dim" data-act="rail" aria-label="Masquer la barre latérale">' + I.side + '</button></div>' +
      '<button class="searchbox" data-act="search">' + I.search + 'Rechercher une série</button>' +
      '<nav class="snav">' +
        '<span class="hd">Bibliothèque</span>' +
        '<button class="sitem" data-part="manga"' + ac('manga') + '><span class="dot" style="background:#ff7a3d"></span>Mangas<span class="n">' + cnt('manga') + '</span></button>' +
        '<button class="sitem" data-part="comics"' + ac('comics') + '><span class="dot" style="background:#4f8cff"></span>Comics<span class="n">' + cnt('comics') + '</span></button>' +
        '<span class="hd">Découvrir</span>' +
        '<button class="sitem" data-tab="discover"' + ac('discover') + '>' + I.spark + 'Tendances</button>' +
        '<button class="sitem" data-tab="list"' + ac('list') + '>' + I.mark + 'Ma liste<span class="n">' + (n || '') + '</span></button>' +
      '</nav>' +
      '<div class="sfoot"><button class="sitem" data-tab="settings"' + ac('settings') + '>' + I.gear.replace('<svg', '<svg style="color:var(--muted)"') + 'Réglages</button>' +
        '<span class="who">' + esc(tokenOk() ? 'Google Drive · ' + (AUTH.email || 'connecté') : 'Non connecté à Google Drive') + '</span></div>' +
    '</div>' +
    '<div class="rail">' +
      '<button class="rbtn" data-act="rail" aria-label="Afficher la barre latérale">' + I.side + '</button>' +
      '<span class="logo" aria-hidden="true" style="margin:4px 0"><i></i><i></i><i></i></span><span class="sep"></span>' +
      '<button class="rbtn" data-part="manga"' + ac('manga') + ' aria-label="Mangas" title="Mangas"><span class="letter" style="background:#ff7a3d">M</span></button>' +
      '<button class="rbtn" data-part="comics"' + ac('comics') + ' aria-label="Comics" title="Comics"><span class="letter" style="background:#4f8cff">C</span></button>' +
      '<span class="sep"></span>' +
      '<button class="rbtn" data-tab="discover"' + ac('discover') + ' aria-label="Tendances" title="Tendances">' + I.spark + '</button>' +
      '<button class="rbtn" data-act="search" aria-label="Rechercher" title="Rechercher">' + I.search + '</button>' +
      '<button class="rbtn" data-tab="list"' + ac('list') + ' aria-label="Ma liste" title="Ma liste">' + I.mark + '</button>' +
      '<span class="spacer"></span>' +
      '<button class="rbtn" data-tab="settings"' + ac('settings') + ' aria-label="Réglages" title="Réglages">' + I.gear + '</button>' +
    '</div>';
}
function toggleRail() {
  const app = document.getElementById('app'), on = !app.classList.contains('railed');
  app.classList.toggle('railed', on); ls.set('cpc:rail', on);
  setTimeout(() => { paintSegs(document); if (VIEW === 'read') show(false); }, 420);
}

/* ---------- Bibliothèque ---------- */
let refreshing2 = false;
function statusBanner() {
  if (statusMsg) return '<div class="banner rise">' + esc(statusMsg) + '</div>';
  if (!navigator.onLine) return '<div class="banner rise">Hors ligne : les tomes téléchargés restent lisibles.</div>';
  if (!tokenOk() && LIB) return '<div class="banner rise"><span>Connexion à Google Drive expirée.</span><button class="link" data-act="login">Se reconnecter</button></div>';
  return '';
}
function installBanner() {
  if (STANDALONE || !IOS || ls.get('cpc:hintDone', false)) return '';
  return '<div class="banner rise"><span>Pour l’installer : touche <b>Partager</b> puis <b>Sur l’écran d’accueil</b>.</span><button class="x" data-act="hintx" aria-label="Masquer">' + I.close.replace('stroke-width="2.2"', 'stroke-width="2.4" width="16" height="16"') + '</button></div>';
}
function welcomeHTML() {
  return '<div class="empty rise" style="padding:28px 24px;gap:14px;max-width:560px">' +
    '<span class="logo" aria-hidden="true" style="width:56px;height:56px;border-radius:14px;padding:10px;gap:3px"><i></i><i></i><i></i></span>' +
    '<h2>Tes mangas et BD, une case à la fois</h2>' +
    '<span>Case par Case lit les tomes rangés dans ton Google Drive, dans le dossier <b>' + esc(ROOT.name) + '</b> : un sous-dossier par série.</span>' +
    '<span>Connecte-toi une fois sur cet appareil pour voir ta bibliothèque.</span>' +
    (navigator.onLine ? '<button class="btn primary press" data-act="login">Se connecter avec Google</button>' : '<span>Il faut du réseau pour la première connexion.</span>') + '</div>';
}
function seriesCard(s) {
  const st = seriesStats(s);
  const meta = plural(st.n, 'tome') + (st.done ? ' · ' + st.done + ' lu' + (st.done > 1 ? 's' : '') : '');
  return '<button class="card" data-series="' + s.id + '">' + covHTML(s.tomes[0], s.title, st.pinned ? '⤓ ' + st.pinned : '') +
    '<span class="t">' + esc(s.title) + '</span><span class="s">' + meta + '</span></button>';
}
function renderHome() {
  const v = $('#v-home'), series = partSeries(PART);
  const total = series.reduce((n, s) => n + s.tomes.length, 0);
  let h = navbar({ title: wide() ? PART_LABEL[PART] : 'Bibliothèque', right: '<button class="round filled press phone-only" data-tab="settings" aria-label="Réglages">' + I.gear + '</button>' }) + '<div class="page">';
  h += '<div style="display:flex;flex-direction:column;gap:6px"><h1>' + (wide() ? PART_LABEL[PART] : 'Bibliothèque') + '</h1>' +
    (wide() && LIB ? '<span class="small" style="font-size:15px;color:var(--muted)">' + (series.length ? plural(series.length, 'série') + ' · ' + plural(total, 'tome') : 'Aucune série pour l’instant') +
      (refreshing ? ' · <span style="display:inline-flex;gap:6px;align-items:center">mise à jour <span class="spin" style="width:12px;height:12px"></span></span>' : '') + '</span>' : '') + '</div>';
  h += installBanner() + statusBanner();
  if (!LIB && tokenOk()) { h += '<div class="empty rise">' + (refreshing ? '<span style="display:flex;gap:10px;align-items:center"><span class="spin"></span>Chargement de ta bibliothèque…</span>' : 'Ta bibliothèque n’a pas pu être chargée. Vérifie ta connexion puis réessaie.<button class="btn sm press" data-act="refresh">Réessayer</button>') + '</div>'; }
  else if (!LIB) h += welcomeHTML();
  else {
    h += '<div class="seg phone-only" role="group" aria-label="Partie"><span class="thumb"></span>' +
      ['manga', 'comics'].map((p) => '<button data-part="' + p + '" aria-pressed="' + (PART === p) + '">' + PART_LABEL[p] + '</button>').join('') + '</div>';
    const lr = lastRead(PART);
    if (lr) {
      const { t, p, s } = lr, pct = p ? Math.round(100 * (p.p + 1) / p.n) : 0;
      h += '<button class="hero press rise" data-open="' + t.id + '" id="heroCard"><span class="glow"></span>' + covHTML(t, t.title) +
        '<span style="display:flex;flex-direction:column"><span class="k">' + lr.label + '</span><span class="t">' + esc(s.title + ' · ' + t.title) + '</span>' +
        '<span class="s">' + esc([t.sub, p ? 'Page ' + (p.p + 1) + ' sur ' + p.n : ''].filter(Boolean).join(' · ')) + '</span>' +
        (p ? '<span class="bar"><i style="width:' + pct + '%"></i></span>' : '') + '</span><span class="go" aria-hidden="true">' + I.play + '</span></button>';
    }
    if (!series.length) {
      h += '<div class="empty rise"><h2>Pas encore de ' + (PART === 'manga' ? 'mangas' : 'comics') + ' ici</h2>' +
        '<span>Range tes tomes dans Google Drive › <b>' + esc(ROOT.name) + '</b>, avec un dossier par série (par exemple <b>Ma série › Tome 01.pdf</b>). Ils apparaîtront ici tout seuls.</span>' +
        '<button class="btn tint sm press" data-tab="discover">Découvrir des ' + (PART === 'manga' ? 'mangas' : 'comics') + '</button></div>';
    } else {
      h += '<section class="block rise"><div class="sechead"><h2>Mes séries</h2></div><div class="grid">' + series.map(seriesCard).join('') + '</div></section>';
      const nexts = [];
      for (const s of series) {
        const n = nextTome(s); if (n.done) continue;
        const i = s.tomes.indexOf(n.t);
        for (const t of s.tomes.slice(i, i + 4)) if (!lr || t.id !== lr.t.id) nexts.push({ t, s });
      }
      if (nexts.length) h += '<section class="block rise"><div class="sechead"><h2>À lire ensuite</h2></div><div class="row">' +
        nexts.slice(0, 14).map(({ t, s }) => '<button class="tile w110" data-open="' + t.id + '">' + covHTML(t, t.title) + '<span class="t">' + esc(t.title) + '</span><span class="s">' + esc(t.sub || s.title) + '</span></button>').join('') + '</div></section>';
    }
    const wl = wishList().filter((w) => w.type === PART && !ownedSid(w));
    if (wl.length) h += '<section class="block rise"><div class="sechead"><h2>Ma liste</h2><button class="link" data-tab="list">Tout voir</button></div><div class="row">' +
      wl.slice(0, 12).map((w) => { keep(w); return '<button class="tile w110" data-item="' + esc(w.key) + '">' + catCov(w) + '<span class="t">' + esc(w.title) + '</span><span class="s">' + esc(w.who || typeLabel(w.type)) + '</span></button>'; }).join('') + '</div></section>';
  }
  h += '</div>';
  v.innerHTML = h; hydrateCovers(v); paintSegs(v);
  const hero = $('#heroCard'); if (hero) applyTint(hero, hero.dataset.open);
  matchAll();
}
// Classe chaque série en Mangas ou Comics grâce aux catalogues (une seule fois par série)
let matchRun = false;
async function matchAll() {
  if (matchRun || !navigator.onLine) return;
  const todo = allSeries().filter((s) => !MATCH[s.id] || MATCH[s.id].title !== s.title);
  if (!todo.length) return;
  matchRun = true;
  let changed = false;
  try { for (const s of todo) { const before = seriesType(s.id); try { await matchSeries(s); } catch (e) {} if (seriesType(s.id) !== before) changed = true; } }
  finally { matchRun = false; }
  if (changed) { renderSide(); if (VIEW === 'home') transition('fade', renderHome); }
}

/* ---------- Page d'une série ---------- */
let FILTER = 'all';
function tomeRowHTML(t) {
  const p = POS[t.id], m = LOCAL.get(t.id), d = DL.get(t.id);
  let info, pct = 0, done = false;
  if (p) { pct = Math.round(100 * (p.p + 1) / p.n); done = p.p >= p.n - 1; info = done ? 'Lu' : '<span class="now">Page ' + (p.p + 1) + ' sur ' + p.n + '</span>'; }
  else info = 'Pas commencé';
  if (t.size) info += ' · ' + fmtSize(t.size);
  if (m && m.pinned) info += ' · sur l’appareil';
  let btn;
  if (d) btn = '<button class="dl" data-cancel="' + t.id + '" aria-label="Annuler le téléchargement">' + I.ring(d.pct) + '<span class="pc">' + Math.round(d.pct * 100) + '</span></button>';
  else if (m && m.pinned) btn = armed === t.id
    ? '<button class="dl armed" data-unpin="' + t.id + '">Retirer ?</button>'
    : '<button class="dl ok" data-unpin="' + t.id + '" aria-label="Sur cet appareil. Toucher pour le retirer">' + I.ok + '</button>';
  else btn = '<button class="dl" data-dl="' + t.id + '" aria-label="Télécharger pour lire hors ligne">' + I.down + '</button>';
  return '<div class="tome" data-row="' + t.id + '"><button class="open" data-open="' + t.id + '">' + covHTML(t, t.title, '', { cls: 'sm' }) +
    '<span class="tx"><span class="t">' + esc(t.title) + (t.sub ? ' <em>· ' + esc(t.sub) + '</em>' : '') + '</span><span class="s">' + info + '</span>' +
    (p ? '<span class="bar' + (done ? ' done' : '') + '"><i style="width:' + pct + '%"></i></span>' : '') + '</span></button>' + btn + '</div>';
}
function seriesActions(s) {
  const st = seriesStats(s), missing = st.n - st.pinned, n = nextTome(s), rtl = seriesRtl(s.id);
  let dlBtn;
  if (dlAll === s.id) {
    const ids = s.tomes.map((t) => t.id), got = ids.filter((id) => LOCAL.has(id) && LOCAL.get(id).pinned).length, cur = [...DL.values()][0];
    const p = (got + (cur ? cur.pct : 0)) / ids.length;
    dlBtn = '<button class="round press" data-act="stopall" aria-label="Arrêter les téléchargements" title="Arrêter"><span class="ring">' + I.ring(p) + '</span></button>';
  } else if (missing) dlBtn = '<button class="round press" data-dlall="' + s.id + '" aria-label="Tout télécharger (' + missing + ' tomes)" title="Tout télécharger">' + I.downAll + '</button>';
  else dlBtn = '<button class="round" style="color:var(--ok)" aria-label="Toute la série est sur cet appareil" title="Toute la série est sur cet appareil">' + I.ok + '</button>';
  const sub = n.p && !n.done ? ' · ' + n.t.title.replace('Tome ', 'T') + ' p. ' + (n.p.p + 1) : n.label === 'Commencer' || n.label === 'Tome suivant' ? ' · ' + n.t.title : '';
  return '<button class="btn primary press" data-open="' + n.t.id + '"' + (n.done ? ' data-at="start"' : '') + '>' + I.play.replace('<svg', '<svg width="18" height="18"') + n.label + sub + '</button>' + dlBtn +
    '<button class="dirbtn press" data-act="dir" aria-label="Sens de lecture : ' + (rtl ? 'manga, de droite à gauche' : 'BD, de gauche à droite') + '">' + (rtl ? '← Manga' : 'BD →') + '</button>';
}
function renderSeries(sid) {
  const s = seriesOf(sid);
  if (!s) { go({ v: 'home' }, true); return; }
  const st = seriesStats(s), type = seriesType(sid), m = MATCH[sid];
  const meta = [m && m.kind && type === 'manga' ? m.kind : typeLabel(type), plural(st.n, 'tome'), st.done ? st.done + ' lu' + (st.done > 1 ? 's' : '') : ''].filter(Boolean).join(' · ');
  const tomes = s.tomes.filter((t) => FILTER === 'all' || (FILTER === 'unread' ? !(POS[t.id] && POS[t.id].p >= POS[t.id].n - 1) : LOCAL.has(t.id) && LOCAL.get(t.id).pinned));
  const v = $('#v-series');
  const head = '<div class="shead rise" id="shead"><span class="glow"></span>' + covHTML(s.tomes[0], s.title) +
    '<div style="display:flex;flex-direction:column"><span class="k">' + esc(meta.split(' · ')[0]) + '</span><h1>' + esc(s.title) + '</h1>' +
    '<span class="s">' + esc([m && m.who, meta.split(' · ').slice(1).join(' · ')].filter(Boolean).join(' · ')) + '</span></div></div>' +
    '<div class="sactions rise" id="shActions">' + seriesActions(s) + '</div>' +
    '<button class="link small" data-act="type" style="align-self:flex-start;color:var(--link);font-size:14px;min-height:32px">Ranger dans les ' + (type === 'manga' ? 'Comics' : 'Mangas') + '</button>';
  const chips = '<div class="chips" role="group" aria-label="Filtrer">' + [['all', 'Tous (' + st.n + ')'], ['unread', 'À lire'], ['local', 'Téléchargés' + (st.pinned ? ' (' + st.pinned + ')' : '')]]
    .map(([k, l]) => '<button class="chip press" data-filter="' + k + '" aria-pressed="' + (FILTER === k) + '">' + l + '</button>').join('') + '</div>';
  const list = '<div class="tomes" id="tomeList">' + (tomes.length ? tomes.map(tomeRowHTML).join('') : '<div class="empty center">' + (FILTER === 'local' ? 'Aucun tome téléchargé dans cette série.' : 'Tu as tout lu. Bravo !') + '</div>') + '</div>';
  v.innerHTML = navbar({ back: 'Bibliothèque', title: s.title }) + '<div class="page"><div class="split2"><div class="stick">' + head + '</div><div style="display:flex;flex-direction:column;gap:14px">' + chips + list + '</div></div></div>';
  hydrateCovers(v); applyTint($('#shead'), s.tomes[0].id);
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
  if (s && el) el.innerHTML = seriesActions(s);
}

/* ---------- Téléchargements ---------- */
const DL = new Map(); // id -> { pct, ctrl }
let armed = null, armT = 0, dlAll = null, stopAll = false;
const cellular = () => { const c = navigator.connection; return !!(c && c.type === 'cellular'); };
async function download(id, quiet) {
  const t = TOMES.get(id); if (!t || DL.has(id)) return;
  if (LOCAL.has(id)) {
    const m = LOCAL.get(id);
    if (!m.pinned) { m.pinned = true; await idbPut('meta', id, m).catch(() => {}); }
    paintTome(id); paintSeriesHead(); return;
  }
  if (!navigator.onLine) { if (!quiet) toast('Pas de réseau pour télécharger.'); return; }
  if (SET.wifi && cellular()) { toast('Téléchargement en Wi-Fi seulement (voir Réglages).'); throw new Error('wifi'); }
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
async function downloadSeries(sid) {
  const s = seriesOf(sid); if (!s || dlAll) return;
  if (!tokenOk()) { login(false); return; }
  dlAll = sid; stopAll = false; paintSeriesHead();
  try {
    for (const t of s.tomes) {
      if (stopAll) break;
      const m = LOCAL.get(t.id);
      if (m && m.pinned) continue;
      try { await download(t.id, true); } catch (e) { if (!(e && e.name === 'AbortError')) break; }
    }
  } finally { dlAll = null; paintSeriesHead(); if (!stopAll && VIEW === 'series') toast('Série téléchargée sur cet appareil.'); }
}
const paintSoon = new Map();
function paintTomeSoon(id) { if (paintSoon.has(id)) return; paintSoon.set(id, setTimeout(() => { paintSoon.delete(id); paintTome(id); if (dlAll) paintSeriesHead(); }, 250)); }

/* ---------- Découvrir ---------- */
let DPART = PART;
const DISC = { manga: {}, comics: {} };
function loadDiscover(p) {
  const d = DISC[p];
  if (d.loading || (d.at && Date.now() - d.at < 36e5 && !d.err)) return;
  d.loading = true; d.err = false;
  const owned = partSeries(p);
  const base = owned.slice().sort((a, b) => (lastTouched(b) - lastTouched(a)))[0] || null;
  const jobs = [];
  if (p === 'manga') {
    jobs.push(alTrending().then((x) => { d.top = x; }));
    if (base) jobs.push(matchSeries(base).then((m) => (m && m.alId ? alRecs(m.alId) : [])).then((x) => { d.recs = x; d.because = base.title; }).catch(() => {}));
  } else {
    jobs.push(comicsPicks().then((x) => { d.top = x; }));
    if (base) jobs.push(matchSeries(base).then((m) => (m && m.wiki && m.wiki.en ? wikiSimilar(m.wiki.en) : m && m.who ? gbByAuthor(m.who.split(',')[0].trim()) : []))
      .then((x) => { d.recs = x.filter((r) => norm(r.title) !== norm(base.title)); d.because = base.title; }).catch(() => {}));
  }
  Promise.all(jobs).then(() => { d.at = Date.now(); }, () => { d.err = true; })
    .finally(() => { d.loading = false; if (VIEW === 'discover' && DPART === p) renderDiscover(); });
}
function lastTouched(s) { let t = 0; for (const x of s.tomes) if (POS[x.id] && POS[x.id].t > t) t = POS[x.id].t; return t; }
function skelRow(n, w) { return '<div class="row">' + Array.from({ length: n }, () => '<div style="width:' + w + 'px;display:flex;flex-direction:column;gap:8px"><div class="skel" style="aspect-ratio:2/3"></div><div class="skel" style="height:12px;width:70%;border-radius:6px"></div></div>').join('') + '</div>'; }
function renderDiscover() {
  const v = $('#v-discover'), p = DPART, d = DISC[p];
  loadDiscover(p);
  const keepScroll = v.scrollTop;
  let h = navbar({ title: 'Découvrir' }) + '<div class="page">';
  h += '<h1>Découvrir</h1><button class="searchbox phone-only" data-act="search">' + I.search + 'Titre, auteur ou personnage</button>';
  h += '<div class="titlerow" style="margin-top:-6px"><span class="small wide-only" style="font-size:15px;color:var(--muted)">Ce qui se lit en ce moment, et des idées à partir de ta bibliothèque.</span>' +
    '<div class="seg" role="group" aria-label="Partie" style="width:' + (wide() ? '240px' : '100%') + '"><span class="thumb"></span>' +
    ['manga', 'comics'].map((x) => '<button data-dpart="' + x + '" aria-pressed="' + (p === x) + '">' + PART_LABEL[x] + '</button>').join('') + '</div></div>';
  if (!navigator.onLine && !d.top) h += '<div class="empty center">Il faut du réseau pour voir les tendances.</div>';
  else if (d.err && !d.top) h += '<div class="empty center">Le catalogue ne répond pas pour l’instant.<button class="btn sm press" data-act="retrydisc">Réessayer</button></div>';
  else if (!d.top) h += '<div class="skel" style="height:' + (wide() ? 232 : 250) + 'px;border-radius:24px"></div><section class="block"><div class="skel" style="height:22px;width:220px;border-radius:8px"></div>' + skelRow(6, wide() ? 150 : 128) + '</section>';
  else {
    const top = d.top.map(keep), spot = top[0], rise = d.shown ? '' : ' rise'; d.shown = true;
    const pitch = spot.pitch || (spot.sum ? spot.sum.split(/(?<=[.!?])\s/).slice(0, 2).join(' ') : '');
    h += '<div class="spot' + rise + '" style="--c1:' + spot.c1 + ';--c2:' + spot.c2 + (spot.color ? ';--g:' + spot.color + '66' : '') + '">' +
      (spot.banner || spot.cover ? '<span class="bg" style="background-image:url(\'' + esc(spot.banner || spot.cover) + '\')"></span>' : '') +
      '<button class="cover press" data-item="' + esc(spot.key) + '" aria-label="' + esc(spot.title) + '">' + catCov(spot) + '</button>' +
      '<div style="display:flex;flex-direction:column;min-width:0"><span class="k">' + (p === 'manga' ? 'N° 1 des tendances cette semaine' : 'À la une') + '</span><span class="t">' + esc(spot.title) + '</span>' +
      '<span class="s">' + esc([spot.who, spot.year].filter(Boolean).join(' · ')) + '</span>' + (pitch ? '<span class="p">' + esc(pitch) + '</span>' : '') +
      '<div class="acts" style="margin-top:16px">' + wishBtn(spot, 'big') + '<button class="ghost press" data-item="' + esc(spot.key) + '">Voir la fiche</button></div></div></div>';
    h += '<section class="block' + rise + '"><div class="sechead"><h2>' + (p === 'manga' ? 'Tendances de la semaine' : 'Sélection comics') + '</h2><span class="note">' + (p === 'manga' ? 'AniList' : 'Choix Case par Case') + '</span></div>';
    if (wide()) h += '<div class="ranks">' + top.slice(0, 8).map((it, i) => '<div class="ranked"><span class="n">' + (i + 1) + '</span><button class="press" data-item="' + esc(it.key) + '" aria-label="' + esc(it.title) + '">' + catCov(it, 'sm') + '</button>' +
      '<button class="tx" data-item="' + esc(it.key) + '"><span class="t">' + esc(it.title) + '</span><span class="s">' + esc([it.who, it.year].filter(Boolean).join(' · ')) + '</span></button>' + wishBtn(it, 'round') + '</div>').join('') + '</div>';
    else h += '<div class="row">' + top.slice(0, 10).map((it, i) => '<div class="tile"><button class="press" data-item="' + esc(it.key) + '" aria-label="' + esc(it.title) + '">' + catCov(it, '', '<span class="rank">' + (i + 1) + '</span>') + '</button>' +
      '<span class="t">' + esc(it.title) + '</span><span class="s">' + esc(it.who || it.kind) + '</span>' + wishBtn(it, 'soft') + '</div>').join('') + '</div>';
    h += '</section>';
    const recs = (d.recs || []).filter((r) => !ownedSid(r)).map(keep);
    if (recs.length) h += '<section class="block' + rise + '"><div style="display:flex;flex-direction:column;gap:2px"><h2>Parce que tu lis ' + esc(d.because) + '</h2><span class="small">' +
      (p === 'manga' ? 'Recommandé par les lecteurs qui l’ont aimé' : 'Des mêmes auteurs') + '</span></div><div class="row">' +
      recs.slice(0, 12).map((it) => '<div class="tile w110"><button class="press" data-item="' + esc(it.key) + '" aria-label="' + esc(it.title) + '">' + catCov(it) + '</button><span class="t">' + esc(it.title) + '</span>' + wishBtn(it, 'soft') + '</div>').join('') + '</div></section>';
    h += '<span class="small">Tendances mises à jour depuis les catalogues en ligne (AniList pour les mangas, Wikipédia et Google Books pour les comics). « Ajouter » met la série dans Ma liste, sans rien télécharger.</span>';
  }
  h += '</div>';
  v.innerHTML = h; paintSegs(v); v.scrollTop = keepScroll;
  const bg = $('.spot .bg', v); if (bg) { const im = new Image(); im.onload = () => bg.classList.add('in'); im.referrerPolicy = 'no-referrer'; im.src = bg.style.backgroundImage.slice(5, -2); }
}

/* ---------- Recherche ---------- */
const SR = { q: '', kind: 'all', res: null, loading: false, sel: null, tok: 0 };
let searchT = 0;
const IDEAS = ['One Piece', 'Akira', 'Saga', 'Watchmen', 'Frieren', 'Batman'];
function renderSearch(r) {
  const v = $('#v-search');
  if (!$('#q', v)) {
    v.innerHTML = navbar({ back: 'Découvrir', title: 'Rechercher' }).replace('class="back press"', 'class="back press phone-only"') + '<div class="page">' +
      '<h1>Rechercher</h1><div class="searchrow"><label class="searchbox">' + I.search + '<span class="sr">Titre, auteur ou personnage</span>' +
      '<input id="q" type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Titre, auteur ou personnage">' +
      '<button class="clr" data-act="clearq" aria-label="Effacer" hidden>' + I.x + '</button></label>' +
      '<button class="cancel phone-only" data-act="back">Annuler</button></div>' +
      '<div class="seg" id="kindSeg" role="group" aria-label="Type"><span class="thumb"></span>' + [['all', 'Tout'], ['manga', 'Mangas'], ['comics', 'Comics']]
        .map(([k, l]) => '<button data-kind="' + k + '" aria-pressed="' + (SR.kind === k) + '">' + l + '</button>').join('') + '</div>' +
      '<div class="split2" id="sres"></div></div>';
    const q = $('#q', v);
    q.addEventListener('input', () => { SR.q = q.value; $('[data-act="clearq"]', v).hidden = !q.value; clearTimeout(searchT); searchT = setTimeout(runSearch, 380); });
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(searchT); runSearch(); q.blur(); } });
  }
  const q = $('#q', v);
  if (r && r.q != null && r.q !== SR.q) { SR.q = r.q; q.value = r.q; runSearch(); }
  q.value = SR.q; $('[data-act="clearq"]', v).hidden = !SR.q;
  paintSearch();
  if (!SR.q && !MOBILE) setTimeout(() => q.focus(), 300);
}
async function runSearch() {
  const q = SR.q.trim(), tok = ++SR.tok;
  if (!q) { SR.res = null; SR.loading = false; paintSearch(); return; }
  SR.loading = true; paintSearch();
  const jobs = [];
  if (SR.kind !== 'comics') jobs.push(alSearch(q).catch(() => []));
  else jobs.push(Promise.resolve([]));
  if (SR.kind !== 'manga') jobs.push(Promise.all([wikiSearch(q).catch(() => []), gbSearch(q).catch(() => [])]).then(([w, g]) => {
    // Wikipédia (toutes les séries, couvertures) puis les éditions françaises de Google Books qui manquent
    const out = [...w];
    for (const x of g) if (!out.some((o) => o.alt.some((a) => norm(a) === norm(x.title)))) out.push(x);
    return out;
  }));
  else jobs.push(Promise.resolve([]));
  const [a, b] = await Promise.all(jobs);
  if (tok !== SR.tok) return;
  // Ce que tu possèdes passe en premier
  const all = [...a.slice(0, 12), ...b.slice(0, 12)].map(keep);
  const qk = norm(q), score = (x) => (ownedSid(x) ? 0 : 2) + ((x.alt || [x.title]).some((t) => norm(t).includes(qk)) ? 0 : 1);
  all.sort((x, y) => score(x) - score(y));
  SR.res = all; SR.loading = false;
  if (wide() && all.length && (!SR.sel || !all.some((x) => x.key === SR.sel))) SR.sel = all[0].key;
  paintSearch();
}
function resultRow(it) {
  const sid = ownedSid(it), sel = wide() && SR.sel === it.key;
  return '<div class="item' + (sel ? ' sel' : '') + '"><button class="open" ' + (sid && !wide() ? 'data-series="' + sid + '"' : 'data-item="' + esc(it.key) + '"') + '>' + catCov(it) +
    '<span style="display:flex;flex-direction:column;gap:3px;min-width:0"><span class="t">' + esc(it.title) + '</span><span class="s">' + esc([it.kind, it.who, it.year].filter(Boolean).join(' · ')) + '</span></span></button>' +
    (sid ? '<span class="tag ok">Dans ta bibliothèque</span>' : wishBtn(it)) + '</div>';
}
function paintSearch() {
  const box = $('#sres'); if (!box) return;
  for (const b of $$('#kindSeg button')) b.setAttribute('aria-pressed', b.dataset.kind === SR.kind);
  paintSeg($('#kindSeg'));
  let left = '';
  if (!SR.q.trim()) {
    const rec = ls.get('cpc:recent', []);
    left = '<div style="display:flex;flex-direction:column;gap:10px"><span class="small" style="font-weight:600;text-transform:uppercase;letter-spacing:.04em">' + (rec.length ? 'Recherches récentes' : 'Idées') + '</span>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px">' + (rec.length ? rec : IDEAS).map((x) => '<button class="chip press" data-idea="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div></div>';
  } else if (SR.loading && !SR.res) left = '<div class="list">' + Array.from({ length: 5 }, () => '<div class="item"><div style="display:grid;grid-template-columns:48px 1fr;gap:12px;align-items:center"><div class="skel" style="aspect-ratio:2/3;border-radius:6px"></div><div style="display:flex;flex-direction:column;gap:6px"><div class="skel" style="height:14px;width:60%;border-radius:6px"></div><div class="skel" style="height:11px;width:80%;border-radius:6px"></div></div></div></div>').join('') + '</div>';
  else if (!navigator.onLine) left = '<div class="empty center">Il faut du réseau pour chercher dans les catalogues.</div>';
  else if (SR.res && !SR.res.length) left = '<div class="empty center">Aucun résultat pour « ' + esc(SR.q.trim()) + ' ».</div>';
  else if (SR.res) left = '<div class="list rise">' + SR.res.map(resultRow).join('') + '</div><span class="small">Fiches et couvertures : AniList pour les mangas, Wikipédia et Google Books pour les comics. Une série ajoutée va dans « Ma liste » ; elle passe dans ta bibliothèque dès que ses tomes sont dans ton Drive.</span>';
  if (wide()) {
    const it = SR.sel && ITEMS.get(SR.sel);
    box.innerHTML = '<div class="stick" style="gap:12px">' + left + '</div><div id="sdetail">' + (it && SR.res ? ficheHTML(it) : '<div class="empty center" style="padding-top:120px">' + (SR.q.trim() ? '' : 'Cherche un manga ou un comics : sa fiche s’affichera ici.') + '</div>') + '</div>';
    if (it && SR.res) fillSummary(it, $('#sdetail'));
  } else box.innerHTML = '<div style="display:flex;flex-direction:column;gap:12px">' + left + '</div>';
  if (SR.res && SR.q.trim()) { const rec = ls.get('cpc:recent', []).filter((x) => norm(x) !== norm(SR.q.trim())); rec.unshift(SR.q.trim()); ls.set('cpc:recent', rec.slice(0, 6)); }
}

/* ---------- Fiche d'une série du catalogue ---------- */
function ficheHTML(it) {
  const sid = ownedSid(it), on = wishOn(it.key);
  const st = { RELEASING: 'En cours', FINISHED: 'Terminée', HIATUS: 'En pause', NOT_YET_RELEASED: 'À paraître', CANCELLED: 'Arrêtée' }[it.status] || '';
  const facts = [['Type', it.kind || typeLabel(it.type)], it.year ? ['Depuis', it.year] : null, it.volumes ? ['Tomes', it.volumes] : null, st ? ['Parution', st] : null,
    it.genres && it.genres.length ? ['Genres', it.genres.join(', ')] : null].filter(Boolean);
  return '<div class="fiche rise" style="' + (it.color ? '--g:' + it.color + '88' : '--g:' + (it.c1 || '#ff6a2b') + '66') + '"><span class="glow"></span>' +
    '<div class="top">' + catCov(it) + '<div style="display:flex;flex-direction:column"><span class="k">' + esc(it.kind || typeLabel(it.type)) + '</span><h1>' + esc(it.title) + '</h1>' +
      '<span class="who">' + esc(it.who || '') + '</span>' + (it.year ? '<span class="meta">Depuis ' + it.year + '</span>' : '') + '</div></div>' +
    '<div class="acts">' + (sid ? '<button class="btn ok press" data-series="' + sid + '">Ouvrir dans ta bibliothèque</button>'
      : '<button class="btn ' + (on ? '' : 'primary') + ' press" data-wish="' + esc(it.key) + '" data-style="fiche">' + (on ? '✓ Dans ma liste' : '+ Ajouter à ma liste') + '</button>') +
      (navigator.share ? '<button class="round press" data-share="' + esc(it.key) + '" aria-label="Partager">' + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg></button>' : '') + '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px"><h2>Résumé</h2><p class="sum" id="fsum">' + (it.sum ? esc(it.sum.slice(0, 700)) + (it.sum.length > 700 ? '…' : '') : '<span class="skel" style="display:block;height:60px"></span>') + '</p></div>' +
    '<div class="facts">' + facts.map(([a, b]) => '<div><span>' + a + '</span><b>' + esc(b) + '</b></div>').join('') + '</div>' +
    (sid ? '' : '<div class="howto"><b>Pour la lire ici :</b> range ses tomes dans Google Drive › ' + esc(ROOT.name) + ' › ' + esc(it.title) + '. Elle passera alors de « Ma liste » à ta bibliothèque, avec ses couvertures.</div>') +
    '</div>';
}
function fillSummary(it, root) {
  frSummary(it).then((r) => {
    const el = $('#fsum', root); if (!el) return;
    const txt = r && r.sum ? r.sum : '';
    el.textContent = txt ? txt.slice(0, 900) + (txt.length > 900 ? '…' : '') : 'Pas de résumé disponible.';
    if (r && r.lang === 'en' && txt) { const n = document.createElement('span'); n.className = 'small'; n.style.display = 'block'; n.style.marginTop = '6px'; n.textContent = 'Résumé disponible seulement en anglais.'; el.after(n); }
  }).catch(() => { const el = $('#fsum', root); if (el && !el.textContent.trim()) el.textContent = 'Pas de résumé disponible.'; });
}
function openItem(key) {
  const it = ITEMS.get(key) || WISH[key]; if (!it) return;
  const sid = ownedSid(it);
  if (wide() && VIEW === 'search') { SR.sel = key; paintSearch(); return; }
  if (wide()) { openSheet('<div class="phead"><span></span><button data-act="closesheet">OK</button></div>' + ficheHTML(it)); fillSummary(it, $('.sheet .panel')); return; }
  if (sid && VIEW !== 'search') { go({ v: 'series', s: sid }); return; }
  go({ v: 'fiche', k: key });
}
function renderFicheView(key) {
  const v = $('#v-fiche'), it = ITEMS.get(key) || WISH[key];
  if (!it) { v.innerHTML = navbar({ back: 'Retour' }) + '<div class="page"><div class="empty center">Cette fiche n’est plus disponible.</div></div>'; return; }
  v.innerHTML = navbar({ back: 'Retour', title: it.title }) + '<div class="page">' + ficheHTML(it) + '</div>';
  fillSummary(it, v);
}

/* ---------- Ma liste ---------- */
let LKIND = 'all';
function renderList() {
  const v = $('#v-list');
  const items = wishList().filter((w) => !ownedSid(w) && (LKIND === 'all' || w.type === LKIND)).map(keep);
  let h = navbar({ title: 'Ma liste' }) + '<div class="page"><div class="titlerow"><div style="display:flex;flex-direction:column;gap:6px"><h1>Ma liste</h1>' +
    '<span class="small" style="font-size:15px;color:var(--muted)">Les séries que tu veux lire et qui ne sont pas encore dans ton Drive.</span></div>' +
    '<div class="seg wide-only" role="group" aria-label="Type" style="width:300px;flex:none"><span class="thumb"></span>' + [['all', 'Tout'], ['manga', 'Mangas'], ['comics', 'Comics']].map(([k, l]) => '<button data-lkind="' + k + '" aria-pressed="' + (LKIND === k) + '">' + l + '</button>').join('') + '</div></div>' +
    '<div class="seg phone-only" role="group" aria-label="Type"><span class="thumb"></span>' + [['all', 'Tout'], ['manga', 'Mangas'], ['comics', 'Comics']].map(([k, l]) => '<button data-lkind="' + k + '" aria-pressed="' + (LKIND === k) + '">' + l + '</button>').join('') + '</div>';
  if (!items.length) h += '<div class="empty center rise"><h2>Rien dans ta liste pour l’instant</h2><span style="max-width:420px">Touche « Ajouter » sur une série dans Découvrir ou dans la recherche pour la garder ici.</span><button class="btn primary sm press" data-tab="discover">Découvrir des séries</button></div>';
  else if (wide()) h += '<div class="grid rise">' + items.map((w) => '<div class="card" data-wrow="' + esc(w.key) + '"><button class="press" data-item="' + esc(w.key) + '" aria-label="' + esc(w.title) + '">' + catCov(w, '', '<b class="badge">' + esc(typeLabel(w.type)) + '</b>') + '</button>' +
    '<span class="t">' + esc(w.title) + '</span><span class="s">' + esc(w.who || '') + '</span><button class="link" data-unwish="' + esc(w.key) + '" style="align-self:flex-start;color:var(--link);font-size:14px;font-weight:600;min-height:36px">Retirer de ma liste</button></div>').join('') + '</div>';
  else h += '<div class="list rise">' + items.map((w) => '<div class="item" data-wrow="' + esc(w.key) + '"><button class="open" data-item="' + esc(w.key) + '">' + catCov(w) +
    '<span style="display:flex;flex-direction:column;gap:3px;min-width:0"><span class="t">' + esc(w.title) + '</span><span class="s">' + esc([typeLabel(w.type), w.who].filter(Boolean).join(' · ')) + '</span></span></button>' +
    '<button class="round" data-unwish="' + esc(w.key) + '" aria-label="Retirer ' + esc(w.title) + ' de ma liste" style="background:transparent;color:var(--muted2)">' + I.close + '</button></div>').join('') + '</div>';
  h += '<span class="small">Une série quitte ta liste toute seule quand ses tomes arrivent dans Google Drive › ' + esc(ROOT.name) + '. Ta liste est la même sur tous tes appareils.</span></div>';
  v.innerHTML = h; paintSegs(v);
}
function unwish(key, row) {
  const w = WISH[key];
  const done = () => { setWish({ key }, false); renderTabs(); renderSide(); if (VIEW === 'list') renderList(); if (VIEW === 'home') renderHome(); };
  if (row && row.animate && !reduced) {
    const a = row.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-24px)' }], { duration: 220, easing: 'ease-in' });
    a.onfinish = done;
  } else done();
  if (w) toastUndo('« ' + w.title + ' » retiré de ta liste', () => { setWish(w, true); if (VIEW === 'list') renderList(); renderTabs(); renderSide(); });
}
let undoFn = null;
function toastUndo(msg, fn) {
  undoFn = fn; const t = $('#toast');
  t.innerHTML = esc(msg) + ' · <b style="color:var(--link)">Annuler</b>'; t.style.pointerEvents = 'auto'; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => { t.classList.remove('on'); t.style.pointerEvents = ''; undoFn = null; }, 4200);
}
$('#toast').addEventListener('click', () => { if (undoFn) { const f = undoFn; undoFn = null; f(); $('#toast').classList.remove('on'); $('#toast').style.pointerEvents = ''; } });

/* ---------- Réglages ---------- */
function sw(k, label, sub) {
  return '<div class="it"><span class="lb"><span>' + label + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</span>' +
    '<button class="switch" role="switch" aria-checked="' + !!SET[k] + '" aria-label="' + esc(label) + '" data-sw="' + k + '"></button></div>';
}
function segRow(k, label, opts, sub) {
  return '<div class="it stack inline"><span class="lb"><span>' + label + '</span>' + (sub ? '<small id="sub-' + k + '">' + sub + '</small>' : '') + '</span><div class="seg sm' + (opts.length === 3 && opts[0][1].length < 3 ? ' narrow' : '') + '" role="radiogroup" aria-label="' + esc(label) + '"><span class="thumb"></span>' +
    opts.map(([v, l]) => '<button role="radio" data-set="' + k + '" data-val="' + v + '" aria-checked="' + (String(SET[k]) === String(v)) + '">' + l + '</button>').join('') + '</div></div>';
}
const CUT_TXT = { large: 'Seulement les cases bien séparées', normal: 'Recommandé', fine: 'Coupe au plus près, même les cases collées' };
const QUAL_TXT = { eco: 'Pages plus légères, idéal en 4G', std: 'Net sur l’écran, recommandé', max: 'Au plus près du fichier d’origine, plus lourd' };
function renderSettings() {
  const v = $('#v-settings');
  const connected = tokenOk();
  const syncTxt = !SET.sync ? 'Désactivée sur cet appareil' : !connected ? 'En attente de connexion' : lastSync ? 'À jour · ' + ago(lastSync) : 'Pas encore synchronisée';
  const compte = '<div class="group"><h2>Compte</h2><div class="cell">' +
    (connected || AUTH.email ? '<div class="it"><span class="avatar">' + esc((AUTH.email || '?').slice(0, 2).toUpperCase()) + '</span><span class="lb"><span>' + esc(AUTH.email || 'Compte Google') + '</span><small>Google Drive</small></span>' +
      (connected ? '<span class="tag ok">Connecté</span>' : '<span class="tag warn">Session expirée</span>') + '</div>' : '') +
    (!connected ? '<button class="it act" data-act="login">Se connecter avec Google</button>' : '') +
    '<button class="it" data-act="folder"><span class="lb"><span>Dossier de la bibliothèque</span><small>' + esc(ROOT.name) + '</small></span><span class="v" style="color:var(--link)">Changer</span></button>' +
    sw('sync', 'Synchroniser la progression', syncTxt) +
    (connected ? '<button class="it act" data-act="refresh"><span class="lb"><span>Mettre à jour la bibliothèque</span><small>' + (LIB && LIB.at ? 'Dernière mise à jour ' + ago(LIB.at) : '') + '</small></span>' + (refreshing ? '<span class="spin"></span>' : '') + '</button>' : '') +
    (connected ? '<button class="it act red" data-act="logout">Se déconnecter</button>' : '') +
    '</div><span class="foot">La progression et Ma liste sont rangées dans un espace caché de ton Drive : tu reprends au même endroit sur l’iPhone, l’iPad et le Mac.</span></div>';
  const lecture = '<div class="group"><h2>Lecture</h2><div class="cell">' +
    segRow('mode', 'Mode par défaut', [['panel', 'Case par case'], ['page', 'Page entière']]) +
    segRow('dirManga', 'Sens des mangas', [['rtl', '← Manga'], ['ltr', 'BD →']]) +
    segRow('dirComics', 'Sens des comics', [['rtl', '← Manga'], ['ltr', 'BD →']]) +
    segRow('cut', 'Découpe des cases', [['large', 'Large'], ['normal', 'Normale'], ['fine', 'Fine']], CUT_TXT[SET.cut]) +
    sw('anim', 'Glisser d’une case à l’autre', 'Petite animation entre deux cases') + sw('autoFs', 'Ouvrir en plein écran') + sw('hint', 'Montrer l’aide des gestes') +
    '</div><span class="foot">Le sens se règle aussi série par série, avec le bouton « BD → / ← Manga » sur la page de la série et dans le lecteur.</span></div>';
  const qual = '<div class="group"><h2>Qualité des pages</h2><div class="cell">' + segRow('quality', 'Affichage', [['eco', 'Économe'], ['std', 'Standard'], ['max', 'Maximale']], QUAL_TXT[SET.quality]) + '</div></div>';
  const hasConn = !!(navigator.connection && 'type' in navigator.connection);
  const stock = '<div class="group"><h2>Téléchargements et stockage</h2><div class="cell"><div class="usage" id="usage"><div class="hd"><span>Place utilisée sur cet appareil</span><b id="utot">…</b></div>' +
    '<div class="bars" id="ubars"></div><div class="leg" id="uleg"></div></div>' +
    segRow('keep', 'Tomes récents gardés', [['1', '1'], ['2', '2'], ['5', '5']], 'En plus des tomes téléchargés') +
    (hasConn ? sw('wifi', 'Télécharger en Wi-Fi seulement') : '') +
    '<button class="it act" data-act="clearcache">Vider le cache</button><button class="it act red" data-act="delall">Supprimer tous les téléchargements</button></div>' +
    '<span class="foot">Le cache garde les derniers tomes ouverts pour les rouvrir vite. Les tomes téléchargés se lisent sans réseau. Tes fichiers dans Google Drive ne sont jamais touchés.</span></div>';
  const look = '<div class="group"><h2>Apparence</h2><div class="cell">' + segRow('theme', 'Thème', [['dark', 'Sombre'], ['light', 'Clair'], ['auto', 'Auto']]) +
    segRow('paper', 'Fond de lecture', [['black', 'Noir'], ['grey', 'Gris'], ['paper', 'Papier']]) + '</div></div>';
  const about = '<div class="group"><h2>À propos</h2><div class="cell"><div class="it"><span class="lb"><span>Version</span></span><span class="v">' + VERSION + '</span></div>' +
    '<div class="it"><span class="lb"><span>Catalogues</span></span><span class="v">AniList · Wikipédia · Google Books</span></div>' +
    '<button class="it act" data-act="news"><span class="lb"><span>Quoi de neuf</span></span>' + I.chev + '</button>' +
    '<a class="it act" href="https://drive.google.com/drive/folders/' + esc(ROOT.id) + '" target="_blank" rel="noopener"><span class="lb"><span>Ouvrir le dossier dans Google Drive</span></span>' + I.chev + '</a>' +
    (IOS && !STANDALONE ? '<div class="it"><span class="lb"><span>Installer l’appli</span><small>Partager › Sur l’écran d’accueil</small></span></div>' : '') + '</div></div>';
  v.innerHTML = navbar({ back: wide() ? '' : 'Bibliothèque', title: 'Réglages' }) + '<div class="page"><div style="display:flex;flex-direction:column;gap:6px"><h1>Réglages</h1>' +
    '<span class="small wide-only" style="font-size:15px;color:var(--muted)">Ton compte, ta façon de lire et la place prise sur cet appareil.</span></div>' +
    '<div class="settings"><div class="col">' + compte + stock + '</div><div class="col">' + lecture + qual + look + about + '</div></div></div>';
  if (!wide()) { const n = $('.navbar', v); if (n && !n.querySelector('.back')) n.insertAdjacentHTML('afterbegin', '<button class="back press" data-act="back">' + I.back + 'Bibliothèque</button>'); }
  paintSegs(v); paintUsage();
}
function ago(t) {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'à l’instant'; if (s < 3600) return 'il y a ' + Math.round(s / 60) + ' min';
  if (s < 86400) return 'il y a ' + Math.round(s / 3600) + ' h';
  return 'le ' + new Date(t).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}
async function paintUsage() {
  const pinned = [...LOCAL.values()].filter((m) => m.pinned), cache = [...LOCAL.values()].filter((m) => !m.pinned);
  const sum = (a) => a.reduce((s, m) => s + (m.bytes || 0), 0);
  let covers = 0; try { for (const b of await idbAll('covers')) covers += (b && b.size) || 0; } catch (e) {}
  const parts = [{ l: 'Tomes téléchargés' + (pinned.length ? ' · ' + plural(pinned.length, 'tome') : ''), b: sum(pinned), c: 'var(--accent)' },
    { l: 'Tomes récents (cache)' + (cache.length ? ' · ' + plural(cache.length, 'tome') : ''), b: sum(cache), c: '#4f8cff' },
    { l: 'Couvertures', b: covers, c: 'var(--muted2)' }];
  const tot = parts.reduce((s, p) => s + p.b, 0);
  let quota = 0; try { const e = await navigator.storage.estimate(); quota = e.quota || 0; } catch (e) {}
  const scale = Math.max(tot * 1.25, Math.min(quota || 0, 8e9), 1e9);
  if (!$('#utot')) return;
  $('#utot').textContent = tot ? fmtSize(tot) : '0 Mo';
  $('#ubars').innerHTML = parts.map((p) => '<i style="width:' + (p.b / scale * 100).toFixed(2) + '%;background:' + p.c + '"></i>').join('');
  $('#uleg').innerHTML = parts.map((p) => '<div><i style="background:' + p.c + '"></i><span>' + p.l + '</span><em>' + (p.b ? fmtSize(p.b) : '—') + '</em></div>').join('');
}
function applyTheme() {
  let t = SET.theme; if (t === 'auto') t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const root = document.documentElement; root.dataset.theme = t; root.dataset.paper = SET.paper;
  const m = $('meta[name="theme-color"]'); if (m) m.content = t === 'light' ? '#f2f2f7' : '#0b0b0d';
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => { if (SET.theme === 'auto') applyTheme(); });
const NEWS = [
  ['2.6', 'Lecteur : toucher la moitié droite pour avancer et la moitié gauche pour reculer (cases et pages), pincer pour zoomer, glisser vers le haut pour voir toutes les pages, bouton capture.'],
  ['2.5', 'La croix pour quitter la lecture passe en haut à droite, un peu plus bas ; le plein écran passe à gauche.'],
  ['2.4', 'Une croix dans le lecteur, toujours visible, pour quitter la lecture.'],
  ['2.3', 'Clavier : flèche droite et flèche bas avancent toujours à la case suivante, dans le sens de lecture choisi (BD ou manga).'],
  ['2.2', 'Découpe des cases bien plus précise : scans avec du grain, papier jauni, cases qui ne sont pas en grille, bulles qui débordent, cases sans cadre. Nouveau réglage « Découpe des cases ».'],
  ['2.1', 'Les comics viennent aussi de Wikipédia : toutes les séries dans la recherche (Spider-Man, Batman…), couvertures de la sélection comics, résumés en français. Meilleur classement Mangas / Comics. Transition plus propre vers les Réglages.'],
  ['2.0', 'Nouvelle appli : Mangas et Comics séparés, Découvrir (tendances et suggestions), Ma liste synchronisée, recherche dans les catalogues, plein écran, réglages complets, thème clair, iPad avec barre latérale repliable.'],
  ['1.3', 'Mises à jour automatiques de l’appli.'],
  ['1.2', 'Couvertures de chaque tome, noms de tomes propres, lecture des gros PDF sans tout télécharger.'],
  ['1.1', 'Les raccourcis Google Drive (dossiers partagés depuis un autre compte) sont suivis.']
];
function openNews() {
  openSheet('<div class="phead"><b>Quoi de neuf</b><button data-act="closesheet">OK</button></div><div class="settings" style="display:flex;flex-direction:column;gap:12px">' +
    NEWS.map(([v, t]) => '<div class="cell"><div class="it" style="align-items:flex-start;flex-direction:column;gap:4px;padding:14px 16px"><b>Version ' + v + '</b><span style="color:var(--text2);font-size:15px;line-height:1.45">' + esc(t) + '</span></div></div>').join('') + '</div>');
}
async function openFolders() {
  if (!tokenOk()) { login(false); return; }
  openSheet('<div class="phead"><b>Dossier de la bibliothèque</b><button data-act="closesheet">Annuler</button></div><div id="flist" class="cell"><div class="it"><span class="spin"></span><span class="lb"><span>Chargement de tes dossiers…</span></span></div></div>' +
    '<p class="small" style="margin:12px 4px 0">Choisis le dossier qui contient un sous-dossier par série.</p>');
  try {
    const q = (s) => api('files?q=' + encodeURIComponent(s) + '&fields=files(id,name)&orderBy=name&pageSize=200&' + ALL).then((r) => r.json()).then((j) => j.files || []);
    const [mine, shared] = await Promise.all([q("'root' in parents and mimeType='" + FOLDER + "' and trashed=false"), q("sharedWithMe and mimeType='" + FOLDER + "' and trashed=false").catch(() => [])]);
    const row = (f, tag) => '<button class="it" data-root="' + esc(f.id) + '" data-name="' + esc(f.name) + '">' + I.folder.replace('<svg', '<svg width="22" height="22" style="color:var(--link)"') +
      '<span class="lb"><span>' + esc(f.name) + '</span>' + (tag ? '<small>' + tag + '</small>' : '') + '</span>' + (f.id === ROOT.id ? I.check.replace('<svg', '<svg width="20" height="20" style="color:var(--link)"') : '') + '</button>';
    const el = $('#flist'); if (!el) return;
    el.innerHTML = mine.map((f) => row(f)).join('') + shared.map((f) => row(f, 'Partagé avec toi')).join('') || '<div class="it">Aucun dossier trouvé.</div>';
  } catch (e) { const el = $('#flist'); if (el) el.innerHTML = '<div class="it">Impossible de lister tes dossiers pour l’instant.</div>'; }
}

/* ---------- Feuilles et confirmations ---------- */
function openSheet(html) {
  closeSheet(true);
  const s = document.createElement('div'); s.className = 'sheet';
  s.innerHTML = '<div class="scrim" data-act="closesheet"></div><div class="panel" role="dialog" aria-modal="true"><div class="grab"></div>' + html + '</div>';
  document.body.appendChild(s); hydrateCovers(s);
  requestAnimationFrame(() => requestAnimationFrame(() => { s.classList.add('open'); paintSegs(s); }));
  // Glisser vers le bas pour fermer (téléphone)
  const panel = $('.panel', s); let y0 = null, dy = 0;
  panel.addEventListener('touchstart', (e) => { if (panel.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; panel.style.transition = 'none'; } }, { passive: true });
  panel.addEventListener('touchmove', (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); if (dy > 0 && !wide()) panel.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
  panel.addEventListener('touchend', () => { if (y0 == null) return; panel.style.transition = ''; panel.style.transform = ''; if (dy > 110 && !wide()) closeSheet(); y0 = null; });
  return s;
}
function closeSheet(now) {
  for (const s of $$('.sheet')) {
    if (now) { s.remove(); continue; }
    s.classList.remove('open'); setTimeout(() => s.remove(), 480);
  }
}
function confirmBox(title, text, okLabel) {
  return new Promise((res) => {
    const a = document.createElement('div'); a.className = 'alert';
    a.innerHTML = '<div class="scrim"></div><div class="box" role="alertdialog" aria-label="' + esc(title) + '"><div class="card1"><div class="msg"><b>' + esc(title) + '</b><span>' + esc(text) + '</span></div>' +
      '<button class="ok">' + esc(okLabel) + '</button></div><button class="no">Annuler</button></div>';
    document.body.appendChild(a);
    requestAnimationFrame(() => requestAnimationFrame(() => a.classList.add('open')));
    const done = (v) => { a.classList.remove('open'); setTimeout(() => a.remove(), 420); res(v); };
    $('.ok', a).onclick = () => done(true); $('.no', a).onclick = () => done(false); $('.scrim', a).onclick = () => done(false);
    setTimeout(() => $('.no', a).focus(), 50);
  });
}

/* ---------- Rendu général ---------- */
function render() {
  renderTabs(); renderSide();
  if (VIEW === 'home') renderHome();
  else if (VIEW === 'series') renderSeries(route().s);
  else if (VIEW === 'list') renderList();
  else if (VIEW === 'settings') renderSettings();
  else if (VIEW === 'discover') renderDiscover();
}
function onLibrary() {
  // Une série arrivée dans le Drive quitte Ma liste toute seule
  for (const w of wishList()) if (ownedSid(w)) setWish({ key: w.key }, false);
  matchAll();
}
function onAuthChange() { render(); }
function onCover() {}

/* ---------- Événements ---------- */
document.addEventListener('click', async (e) => {
  const b = e.target.closest('button, a, [data-act]'); if (!b) return;
  const d = b.dataset;
  if (d.tab) { tab(d.tab); return; }
  if (d.part) {
    if (VIEW === 'home') { setPart(d.part); return; }
    PART = d.part; ls.set('cpc:part', PART); closeSheet(true);
    if (VIEW === 'series' && depth > 0) history.back(); else go({ v: 'home' }, depth === 0 && (LEVEL[VIEW] || 0) === 0);
    return;
  }
  if (d.dpart) { DPART = d.dpart; renderDiscover(); return; }
  if (d.lkind) { LKIND = d.lkind; renderList(); return; }
  if (d.kind) { SR.kind = d.kind; paintSearch(); runSearch(); return; }
  if (d.idea) { const q = $('#q'); q.value = SR.q = d.idea; $('[data-act="clearq"]').hidden = false; runSearch(); return; }
  if (d.filter) { FILTER = d.filter; renderSeries(route().s); return; }
  if (d.series) { closeSheet(); go({ v: 'series', s: d.series }); return; }
  if (d.open) { go({ v: 'read', t: d.open, at: d.at || 'resume' }); return; }
  if (d.item) { openItem(d.item); return; }
  if (d.wish) {
    const it = ITEMS.get(d.wish) || WISH[d.wish]; if (!it) return;
    const on = !wishOn(it.key);
    setWish({ key: it.key, title: it.title, type: it.type, kind: it.kind, who: it.who, year: it.year, cover: it.cover, c1: it.c1, c2: it.c2, alId: it.alId || null, wiki: it.wiki || null, alt: (it.alt || []).slice(0, 4), sum: (it.sum || '').slice(0, 600), sumLang: it.sumLang }, on);
    if (navigator.vibrate) try { navigator.vibrate(8); } catch (err) {}
    if (d.style === 'fiche') { b.className = 'btn ' + (on ? '' : 'primary') + ' press'; b.textContent = on ? '✓ Dans ma liste' : '+ Ajouter à ma liste'; }
    refreshWishButtons(it.key);
    if (on) toast('Ajouté à ta liste'); return;
  }
  if (d.unwish) { unwish(d.unwish, b.closest('[data-wrow]')); return; }
  if (d.share) { const it = ITEMS.get(d.share); if (it && navigator.share) navigator.share({ title: it.title, text: it.title + (it.who ? ' — ' + it.who : '') }).catch(() => {}); return; }
  if (d.dl) { download(d.dl).catch(() => {}); return; }
  if (d.cancel) { const x = DL.get(d.cancel); if (x) x.ctrl.abort(); return; }
  if (d.unpin) {
    clearTimeout(armT);
    if (armed !== d.unpin) { const prev = armed; armed = d.unpin; if (prev) paintTome(prev); paintTome(d.unpin); armT = setTimeout(() => { const a = armed; armed = null; if (a) paintTome(a); }, 3000); return; }
    armed = null; await dropLocal(d.unpin); paintTome(d.unpin); paintSeriesHead(); toast('Retiré de l’appareil (il reste dans ton Drive)'); return;
  }
  if (d.dlall) { downloadSeries(d.dlall); return; }
  if (d.sw) { setSet(d.sw, !SET[d.sw]); b.setAttribute('aria-checked', SET[d.sw]); if (d.sw === 'sync' && SET.sync) syncProgress(); if (d.sw === 'sync') setTimeout(renderSettings, 350); return; }
  if (d.set) {
    const val = d.set === 'keep' ? +d.val : d.val; setSet(d.set, val);
    for (const x of $$('[data-set="' + d.set + '"]')) x.setAttribute('aria-checked', x.dataset.val === String(val));
    paintSeg(b.closest('.seg'));
    if (d.set === 'theme' || d.set === 'paper') applyTheme();
    if (d.set === 'quality') { applyQuality(); const s = $('#sub-quality'); if (s) s.textContent = QUAL_TXT[val]; }
    if (d.set === 'keep') evict(null).then(paintUsage);
    if (d.set === 'mode') S.mode = val;
    if (d.set === 'cut') { const s = $('#sub-cut'); if (s) s.textContent = CUT_TXT[val]; }
    return;
  }
  if (d.root) { ROOT = { id: d.root, name: d.name }; ls.set('cpc:root', ROOT); closeSheet(); LIB = null; ls.del('cpc:lib'); indexLib(); toast('Bibliothèque : « ' + d.name + ' »'); refreshLibrary(true); render(); return; }
  switch (d.act) {
    case 'login': closeSheet(true); login(false); break;
    case 'logout':
      if (await confirmBox('Te déconnecter de Google Drive ?', 'Les tomes téléchargés restent sur cet appareil. Ta progression est déjà enregistrée dans ton Drive.', 'Se déconnecter')) { await syncProgress(); logout(); toast('Déconnecté de Google'); }
      break;
    case 'back': leave(); break;
    case 'hintx': ls.set('cpc:hintDone', true); renderHome(); break;
    case 'rail': toggleRail(); break;
    case 'search': closeSheet(true); go({ v: 'search' }); break;
    case 'clearq': { const q = $('#q'); q.value = SR.q = ''; b.hidden = true; SR.res = null; paintSearch(); q.focus(); break; }
    case 'closesheet': closeSheet(); break;
    case 'capshare': shareCapture(); break;
    case 'refresh': if (!navigator.onLine) toast('Pas de réseau.'); else { await syncProgress(); refreshLibrary(true); } break;
    case 'retrydisc': DISC[DPART] = {}; renderDiscover(); break;
    case 'folder': openFolders(); break;
    case 'news': openNews(); break;
    case 'dir': { const sid = route().s; setRtlPref(sid, !seriesRtl(sid)); paintSeriesHead(); toast(seriesRtl(sid) ? 'Sens manga : de droite à gauche' : 'Sens BD : de gauche à droite'); break; }
    case 'type': { const sid = route().s, nt = seriesType(sid) === 'manga' ? 'comics' : 'manga'; setType(sid, nt); toast('Rangée dans les ' + PART_LABEL[nt]); PART = nt; ls.set('cpc:part', nt); renderSeries(sid); renderSide(); break; }
    case 'stopall': stopAll = true; for (const x of DL.values()) x.ctrl.abort(); break;
    case 'clearcache': { const c = [...LOCAL.values()].filter((m) => !m.pinned); for (const m of c) await dropLocal(m.id); toast(c.length ? 'Cache vidé' : 'Le cache est déjà vide'); paintUsage(); break; }
    case 'delall': {
      const p = [...LOCAL.values()].filter((m) => m.pinned);
      if (!p.length) { toast('Aucun tome téléchargé.'); break; }
      if (await confirmBox('Supprimer les ' + plural(p.length, 'tome') + ' téléchargés de cet appareil ?', 'Ils restent dans ton Google Drive et tu pourras les télécharger à nouveau.', 'Supprimer les téléchargements')) {
        for (const m of p) await dropLocal(m.id); toast('Téléchargements supprimés'); paintUsage();
      }
      break;
    }
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('.sheet')) { closeSheet(); e.stopPropagation(); } }, true);
let rz = 0, wasWide = wide();
addEventListener('resize', () => {
  clearTimeout(rz);
  rz = setTimeout(() => {
    if (VIEW === 'read') show(false);
    paintSegs(document);
    if (wide() !== wasWide) { wasWide = wide(); render(); if (VIEW === 'search') paintSearch(); }
  }, 120);
});
addEventListener('online', () => { render(); if (tokenOk()) { refreshLibrary(); syncProgress(); } });
addEventListener('offline', render);
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (ls.get('cpc:dirty', false)) syncProgress(); } else if (tokenOk()) syncProgress(); });

/* ---------- Démarrage ---------- */
async function boot() {
  applyTheme();
  if (document.documentElement.classList.contains('rail-start')) document.getElementById('app').classList.add('railed');
  const res = handleRedirect();
  indexLib();
  await loadLocal();
  let ret = null;
  if (res) { ret = ls.get('cpc:return', null); ls.del('cpc:return'); }
  if (res && res !== 'ok' && res !== 'state' && res !== 'interaction_required' && res !== 'login_required' && res !== 'consent_required') toast('La connexion à Google n’a pas abouti.');
  const start = ret && ret.v ? ret : { v: 'home' };
  history.replaceState({ v: 'home' }, '');
  if (start.v !== 'home') {
    if (start.v === 'read') { const t = TOMES.get(start.t); if (t) { history.pushState({ v: 'series', s: t.s }, ''); depth++; } }
    history.pushState(start, ''); depth++;
  }
  apply(start);
  if (tokenOk()) { if (!AUTH.email) fetchMe().then(renderSide); refreshLibrary(); syncProgress(); }
  else if (!res && ls.get('cpc:everIn', false) && navigator.onLine && Date.now() - ls.get('cpc:silentFail', 0) > 30 * 60000 && start.v !== 'read') {
    // Session expirée : reconnexion silencieuse (aller-retour rapide chez Google, sans rien à toucher)
    login(true, start);
  }
}
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // Nouvelle version en ligne : l'appli se recharge d'elle-même (sauf en pleine lecture, elle attend la fin)
  let reloadPending = false;
  const reloadIfIdle = () => { if (VIEW === 'read') { reloadPending = true; return; } location.reload(); };
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) reloadIfIdle(); });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => {
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {});
  addEventListener('popstate', () => { if (reloadPending && VIEW !== 'read') location.reload(); });
}
boot();

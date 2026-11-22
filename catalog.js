/* Case par Case — catalog.js : catalogues en ligne gratuits, sans compte.
   Mangas : AniList (recherche, tendances de la semaine, recommandations).
   Comics : Google Books (éditions françaises, couvertures et résumés en français). */
'use strict';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' et ')
  .replace(/^(the|le|la|les|l)\s+/, '').replace(/[^a-z0-9]+/g, '');
const yearOf = (d) => { const m = String(d || '').match(/\d{4}/); return m ? +m[0] : null; };
const clean = (s) => String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\(Source:[^)]*\)/gi, '').replace(/\n{3,}/g, '\n\n')
  .replace(/&quot;/g, '"').replace(/&#039;|&rsquo;/g, '’').replace(/&amp;/g, '&').trim();
const memo = new Map();
function cached(key, ttlMs, fn) {
  const now = Date.now(), m = memo.get(key);
  if (m && now - m.at < ttlMs) return m.p;
  const store = ls.get('cpc:cat:' + key, null);
  if (store && now - store.at < ttlMs) { const p = Promise.resolve(store.v); memo.set(key, { at: store.at, p }); return p; }
  const p = fn().then((v) => { try { ls.set('cpc:cat:' + key, { at: Date.now(), v }); } catch (e) {} return v; });
  memo.set(key, { at: now, p });
  p.catch(() => memo.delete(key));
  return p;
}

/* ---------- AniList ---------- */
const AL_FIELDS = `id title { romaji english userPreferred } synonyms format countryOfOrigin status volumes genres averageScore popularity
  startDate { year } coverImage { extraLarge large color } bannerImage description(asHtml: false)
  staff(perPage: 6, sort: [RELEVANCE, ID]) { edges { role node { name { full } } } }`;
let alQueue = Promise.resolve();
async function anilist(query, variables) {
  // Une requête à la fois : AniList limite le nombre d'appels par minute
  const run = async () => {
    const r = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }) });
    if (r.status === 429) { await sleep(2500); throw new Error('rate'); }
    if (!r.ok) throw new Error('anilist ' + r.status);
    const j = await r.json();
    if (j.errors && !j.data) throw new Error('anilist');
    return j.data;
  };
  const p = alQueue.then(run, run);
  alQueue = p.catch(() => {});
  return p;
}
const KIND = { JP: 'Manga', KR: 'Manhwa', CN: 'Manhua', TW: 'Manhua' };
function alItem(m) {
  const who = [];
  for (const e of (m.staff && m.staff.edges) || []) {
    if (!/story|art|original|creator|author/i.test(e.role || '') || /assist|translat|letter|edit|touch|design/i.test(e.role || '')) continue;
    const n = e.node && e.node.name && e.node.name.full; if (n && !who.includes(n)) who.push(n);
  }
  const title = (m.title && (m.title.english || m.title.romaji || m.title.userPreferred)) || '';
  const [c1, c2] = hue(title);
  return {
    key: 'al:' + m.id, src: 'al', alId: m.id, type: 'manga', kind: KIND[m.countryOfOrigin] || 'Manga', title,
    alt: [m.title && m.title.romaji, m.title && m.title.english, m.title && m.title.userPreferred, ...(m.synonyms || [])].filter(Boolean),
    who: who.slice(0, 2).join(', '), year: (m.startDate && m.startDate.year) || null,
    cover: (m.coverImage && (m.coverImage.extraLarge || m.coverImage.large)) || '', banner: m.bannerImage || '',
    color: (m.coverImage && m.coverImage.color) || '', c1, c2,
    sum: clean(m.description), sumLang: 'en', volumes: m.volumes || null, status: m.status || '', genres: (m.genres || []).slice(0, 3), score: m.averageScore || null, pop: m.popularity || 0
  };
}
function alSearch(q) {
  return cached('als:' + norm(q), 864e5, async () => {
    const d = await anilist(`query ($q: String) { Page(perPage: 20) { media(search: $q, type: MANGA, isAdult: false, sort: SEARCH_MATCH) { ${AL_FIELDS} } } }`, { q });
    return ((d.Page && d.Page.media) || []).filter((m) => m.format !== 'NOVEL').map(alItem);
  });
}
function alTrending() {
  return cached('alt', 6 * 36e5, async () => {
    const d = await anilist(`query { Page(perPage: 12) { media(type: MANGA, sort: TRENDING_DESC, isAdult: false, format: MANGA) { ${AL_FIELDS} } } }`, {});
    return ((d.Page && d.Page.media) || []).map(alItem);
  });
}
function alRecs(id) {
  return cached('alr:' + id, 3 * 864e5, async () => {
    const d = await anilist(`query ($id: Int) { Media(id: $id) { recommendations(perPage: 14, sort: RATING_DESC) { nodes { mediaRecommendation { ${AL_FIELDS} } } } } }`, { id });
    return ((d.Media && d.Media.recommendations && d.Media.recommendations.nodes) || []).map((n) => n.mediaRecommendation).filter((m) => m && m.format !== 'NOVEL').map(alItem);
  });
}

/* ---------- Google Books ---------- */
const VOL_RE = /\s*(?:[-–—:,(]\s*)?(?:t(?:ome)?\.?\s*\d+|vol(?:ume)?\.?\s*\d+|#\s*\d+|n°\s*\d+|livre\s+\d+|book\s+\d+|intégrale(?:\s+\d+)?)\b.*$/i;
const baseTitle = (t) => String(t || '').replace(VOL_RE, '').replace(/\s*[-–—:]\s*$/, '').trim() || String(t || '').trim();
const volNum = (t) => { const m = String(t || '').match(/(?:t(?:ome)?\.?|vol(?:ume)?\.?|#|n°)\s*(\d+)/i); return m ? +m[1] : 999; };
function gbCover(v) {
  const l = v.imageLinks; if (!l) return '';
  const u = (l.thumbnail || l.smallThumbnail || '').replace(/^http:/, 'https:').replace(/&edge=curl/g, '');
  return u;
}
async function gbFetch(q, n) {
  const u = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(q) + '&langRestrict=fr&printType=books&maxResults=' + (n || 40);
  const r = await fetch(u);
  if (!r.ok) throw new Error('books ' + r.status);
  return ((await r.json()).items || []).map((i) => i.volumeInfo || {}).filter((v) => v.title);
}
const NOT_COMICS = /roman|novel|essai|guide|cook|cuisine|biograph|dictionnaire|histoire de l'art/i;
function gbGroup(vols, opts) {
  const g = new Map();
  for (const v of vols) {
    if (v.categories && NOT_COMICS.test(v.categories.join(' ')) && !/comic|bande|graphic/i.test(v.categories.join(' '))) continue;
    const full = v.title + (v.subtitle ? ' - ' + v.subtitle : '');
    const base = baseTitle(v.title), k = norm(base);
    if (!k || k.length < 2) continue;
    const it = g.get(k) || { key: 'gb:' + k, src: 'gb', type: 'comics', kind: 'Comics', title: base, who: '', year: null, cover: '', sum: '', sumLang: 'fr', n: 0, best: 1e9, alt: [base] };
    it.n++;
    const y = yearOf(v.publishedDate); if (y && (!it.year || y < it.year)) it.year = y;
    if (!it.who && v.authors) it.who = v.authors.slice(0, 2).join(', ');
    const num = volNum(full), cov = gbCover(v);
    if (cov && (num < it.best || !it.cover)) { it.cover = cov; it.best = num; }
    if ((!it.sum || num < it.bestSum) && v.description) { it.sum = clean(v.description); it.bestSum = num; }
    g.set(k, it);
  }
  let out = [...g.values()];
  if (opts && opts.must) { const m = norm(opts.must); out = out.filter((x) => norm(x.title).includes(m) || m.includes(norm(x.title))); }
  return out.map((x) => { const [c1, c2] = hue(x.title); return { ...x, c1, c2 }; });
}
function gbSearch(q) {
  return cached('gbs:' + norm(q), 864e5, async () => {
    let vols = await gbFetch(q + ' subject:comics');
    let out = gbGroup(vols);
    if (out.length < 3) { vols = await gbFetch('intitle:' + q); out = out.concat(gbGroup(vols, { must: q }).filter((x) => !out.some((o) => o.key === x.key))); }
    return out.slice(0, 20);
  });
}
function gbByAuthor(name) {
  return cached('gba:' + norm(name), 3 * 864e5, async () => gbGroup(await gbFetch('inauthor:"' + name + '"')).filter((x) => x.n > 0).slice(0, 14));
}
function gbFind(title) {
  return cached('gbf:' + norm(title), 7 * 864e5, async () => {
    const vols = await gbFetch('intitle:"' + title + '"', 20);
    const g = gbGroup(vols, { must: title });
    return g.find((x) => norm(x.title) === norm(title)) || g[0] || null;
  });
}
// Résumé en français d'un manga (édition française dans Google Books), à défaut le résumé anglais d'AniList
function frSummary(item) {
  if (item.sumLang === 'fr' && item.sum) return Promise.resolve({ sum: item.sum, lang: 'fr' });
  if (item.wiki) return cached('wsum:' + item.key, 30 * 864e5, () => wikiExtract(item.wiki)).then((r) => r || { sum: item.sum, lang: item.sumLang });
  return cached('fr:' + item.key, 30 * 864e5, async () => {
    for (const t of [item.title, ...(item.alt || [])].slice(0, 2)) {
      const vols = await gbFetch('intitle:"' + t + '"', 20).catch(() => []);
      const v = vols.find((x) => x.description && norm(baseTitle(x.title)) === norm(t)) || vols.find((x) => x.description && norm(x.title).startsWith(norm(t)));
      if (v) return { sum: clean(v.description), lang: 'fr' };
    }
    return null;
  }).then((r) => r || { sum: item.sum, lang: item.sumLang });
}

/* ---------- Wikipédia (comics : séries, couvertures, titres et résumés français, séries proches) ---------- */
const COMIC_RE = /comic|graphic novel|limited series|maxiseries|bande dessin|roman graphique|webcomic|fumetti|strip/i;
const MANGA_RE = /manga|manhwa|manhua|light novel|série de mangas/i;
const NOT_SERIES_RE = /film|television|tv series|téléfilm|série télévisée|video game|jeu vidéo|soundtrack|episode|épisode|actor|actrice|acteur|character|personnage|superhero|super-héros|toy|album|song|chanson|company|publisher|éditeur|disambiguation|homonymie|novel by|roman de|attraction|wrestler|band\b/i;
const stripParen = (t) => String(t || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
async function wiki(lang, params) {
  const u = 'https://' + lang + '.wikipedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', ...params });
  const r = await fetch(u);
  if (!r.ok) throw new Error('wiki ' + r.status);
  return r.json();
}
const WPROPS = { prop: 'pageimages|description|langlinks', piprop: 'thumbnail', pithumbsize: '500', pilicense: 'any', lllang: 'fr', lllimit: '1' };
function wikiItem(pg) {
  const fr = pg.langlinks && pg.langlinks[0] ? (pg.langlinks[0].title || pg.langlinks[0]['*']) : '';
  const title = stripParen(fr || pg.title), [c1, c2] = hue(title);
  const y = String(pg.description || '').match(/(19|20)\d\d/);
  return { key: 'wk:' + norm(stripParen(pg.title)), src: 'wk', type: 'comics', kind: 'Comics', title, alt: [stripParen(pg.title), stripParen(fr)].filter(Boolean),
    who: '', year: y ? +y[0] : null, cover: (pg.thumbnail && pg.thumbnail.source) || '', c1, c2, sum: '', sumLang: 'fr', desc: pg.description || '',
    wiki: { en: pg.title, fr: fr || '' } };
}
const isComicPage = (pg) => pg && pg.description && COMIC_RE.test(pg.description) && !NOT_SERIES_RE.test(pg.description) && !MANGA_RE.test(pg.description);
function wikiSearch(q) {
  return cached('wks:' + norm(q), 3 * 864e5, async () => {
    const [a, b] = await Promise.all([
      wiki('en', { generator: 'search', gsrsearch: q + ' comic', gsrlimit: '40', gsrnamespace: '0', ...WPROPS }),
      wiki('en', { generator: 'prefixsearch', gpssearch: q, gpslimit: '20', ...WPROPS }).catch(() => ({}))
    ]);
    const pages = [...((b.query && b.query.pages) || []), ...((a.query && a.query.pages) || []).sort((x, y) => (x.index || 0) - (y.index || 0))];
    const seen = new Set(), out = [];
    for (const pg of pages) { if (!isComicPage(pg)) continue; const it = wikiItem(pg); if (seen.has(it.key)) continue; seen.add(it.key); out.push(it); }
    // Les titres qui contiennent la recherche d'abord
    const k = norm(q);
    return out.sort((x, y) => (x.alt.some((t) => norm(t).includes(k)) ? 0 : 1) - (y.alt.some((t) => norm(t).includes(k)) ? 0 : 1)).slice(0, 24);
  });
}
function wikiSimilar(enTitle) {
  return cached('wkm:' + norm(enTitle), 7 * 864e5, async () => {
    const d = await wiki('en', { generator: 'search', gsrsearch: 'morelike:' + enTitle, gsrlimit: '30', gsrnamespace: '0', ...WPROPS });
    return ((d.query && d.query.pages) || []).sort((x, y) => (x.index || 0) - (y.index || 0)).filter(isComicPage).map(wikiItem).filter((x) => x.wiki.en !== enTitle).slice(0, 14);
  });
}
async function wikiExtract(w) {
  for (const [lang, t] of [['fr', w.fr], ['en', w.en]]) {
    if (!t) continue;
    try {
      const d = await wiki(lang, { prop: 'extracts', exintro: '1', explaintext: '1', exsentences: '6', titles: t, redirects: '1' });
      const pg = d.query && d.query.pages && d.query.pages[0];
      if (pg && pg.extract && pg.extract.length > 40) return { sum: clean(pg.extract), lang };
    } catch (e) {}
  }
  return null;
}
// Manga ou comics ? Wikipédia le dit dans la description de la série (en anglais, sinon en français)
async function wikiType(title) {
  const k = norm(title);
  for (const lang of ['en', 'fr']) {
    const d = await wiki(lang, { generator: 'prefixsearch', gpssearch: title, gpslimit: '20', prop: 'description', ...(lang === 'en' ? { prop: 'description|langlinks', lllang: 'fr', lllimit: '1' } : {}) });
    const pages = ((d.query && d.query.pages) || []).filter((p) => norm(stripParen(p.title)) === k && p.description && !NOT_SERIES_RE.test(p.description));
    const m = pages.find((p) => MANGA_RE.test(p.description)), c = pages.find((p) => COMIC_RE.test(p.description) && !MANGA_RE.test(p.description));
    if (m && !c) return { type: 'manga' };
    if (c && !m) return { type: 'comics', wiki: { en: lang === 'en' ? c.title : '', fr: lang === 'fr' ? c.title : (c.langlinks && c.langlinks[0] ? c.langlinks[0].title : '') } };
  }
  return null;
}

/* ---------- Sélection comics (pas de classement public gratuit des comics : choix Case par Case) ---------- */
const COMICS_PICKS = [
  { title: 'Absolute Batman', who: 'Scott Snyder, Nick Dragotta', year: 2024, pitch: 'Un Batman repensé de zéro, sans fortune ni manoir. La série DC dont tout le monde parle.', c1: '#3a86ff', c2: '#0b090a' },
  { title: 'Ultimate Spider-Man', who: 'Jonathan Hickman, Marco Checchetto', year: 2024, c1: '#ff4d6d', c2: '#1d3557' },
  { title: 'Transformers', who: 'Daniel Warren Johnson', year: 2023, c1: '#ffb703', c2: '#9d0208' },
  { title: 'Absolute Wonder Woman', who: 'Kelly Thompson, Hayden Sherman', year: 2024, c1: '#e5383b', c2: '#161a1d' },
  { title: 'Something Is Killing the Children', who: 'James Tynion IV, Werther Dell’Edera', year: 2019, c1: '#8ecae6', c2: '#370617' },
  { title: 'Saga', who: 'Brian K. Vaughan, Fiona Staples', year: 2012, c1: '#2fbfa7', c2: '#1c3a4a' },
  { title: 'The Boys', who: 'Garth Ennis, Darick Robertson', year: 2006, c1: '#d00000', c2: '#03071e' },
  { title: 'Watchmen', who: 'Alan Moore, Dave Gibbons', year: 1986, c1: '#f9c74f', c2: '#2d6a4f' }
].map((p) => ({ ...p, key: 'gb:' + norm(p.title), src: 'gb', type: 'comics', kind: 'Comics', cover: '', sum: '', sumLang: 'fr', alt: [p.title] }));
async function comicsPicks() {
  // Couvertures depuis Wikipédia (et résumés français), à défaut depuis Google Books
  return Promise.all(COMICS_PICKS.map(async (p) => {
    let out = { ...p };
    try {
      const w = (await wikiSearch(p.title)).find((x) => norm(x.title) === norm(p.title) || x.alt.some((a) => norm(a) === norm(p.title)));
      if (w) out = { ...out, cover: w.cover || '', wiki: w.wiki, alt: [...new Set([...p.alt, ...w.alt])] };
    } catch (e) {}
    if (!out.cover) { try { const f = await gbFind(p.title); if (f) out = { ...out, cover: f.cover || '', sum: f.sum || '' }; } catch (e) {} }
    return out;
  }));
}

/* ---------- Associer les séries de la bibliothèque aux catalogues ---------- */
let MATCH = ls.get('cpc:match2', {}); // seriesId -> { type, alId, who, year, kind, title, wiki, at }
const matching = new Map();
function matchSeries(s) {
  const m = MATCH[s.id];
  if (m && m.title === s.title) return Promise.resolve(m);
  if (matching.has(s.id)) return matching.get(s.id);
  const p = (async () => {
    let res = { type: 'comics', title: s.title, at: Date.now() };
    const k = norm(s.title);
    const w = await wikiType(s.title).catch(() => null);
    const list = await alSearch(s.title).catch(() => null);
    const hit = list && list.find((x) => x.alt.some((a) => norm(a) === k));
    const f = !w && (!hit || hit.pop < 5000) ? await gbFind(s.title).catch(() => null) : null;
    if (w && w.type === 'comics') res = { type: 'comics', wiki: w.wiki, title: s.title, who: f ? f.who : '', at: Date.now() };
    else if (w && w.type === 'manga') res = { type: 'manga', alId: hit ? hit.alId : null, who: hit ? hit.who : '', year: hit ? hit.year : null, kind: hit ? hit.kind : 'Manga', title: s.title, at: Date.now() };
    // Sans Wikipédia : un titre très peu suivi sur AniList qui existe en comics chez Google Books est un comics
    else if (hit && !(f && hit.pop < 5000)) res = { type: 'manga', alId: hit.alId, who: hit.who, year: hit.year, kind: hit.kind, title: s.title, at: Date.now() };
    else if (f) res = { type: 'comics', who: f.who, year: f.year, title: s.title, at: Date.now() };
    else if (!w && !list) { matching.delete(s.id); throw new Error('offline'); }
    MATCH[s.id] = res; ls.set('cpc:match2', MATCH);
    return res;
  })();
  matching.set(s.id, p);
  p.finally(() => matching.delete(s.id)).catch(() => {});
  return p;
}

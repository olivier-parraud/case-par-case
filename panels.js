/* Case par Case — panels.js : détection des cases d'une planche.
   1. On repère le papier (couleur des bords) et l'encre, en effaçant le grain des scans.
   2. Le fond est « inondé » depuis les bords : ce qu'il n'atteint pas, ce sont les cases.
   3. Chaque bloc est redécoupé le long des gouttières (cases collées, bulles qui débordent).
   4. Si ça ne donne rien, on découpe directement sur l'encre, ligne à ligne.
   Les cases sont ensuite remises dans l'ordre de lecture (BD de gauche à droite, manga de droite à gauche). */
'use strict';

const CUT_LEVELS = {
  large: { gap: 0.010, tol: 0.03, minA: 0.025, cover: 0.40 },
  normal: { gap: 0.005, tol: 0.07, minA: 0.010, cover: 0.28 },
  fine: { gap: 0.003, tol: 0.12, minA: 0.005, cover: 0.20 }
};
function detect(cv) {
  const P = CUT_LEVELS[SET.cut] || CUT_LEVELS.normal;
  const W = Math.min(560, cv.width), sc = W / cv.width, H = Math.max(8, Math.round(cv.height * sc)), N = W * H, W1 = W + 1;
  const a = document.createElement('canvas'); a.width = W; a.height = H;
  const c = a.getContext('2d', { willReadFrequently: true });
  c.drawImage(cv, 0, 0, W, H);
  const d = c.getImageData(0, 0, W, H).data;
  const L = new Uint8ClampedArray(N), C = new Uint8ClampedArray(N);
  for (let i = 0, j = 0; i < N; i++, j += 4) {
    const r = d[j], g = d[j + 1], b = d[j + 2];
    L[i] = (r * 77 + g * 150 + b * 29) >> 8;
    C[i] = Math.max(r, g, b) - Math.min(r, g, b);
  }
  // Papier : la couleur la plus fréquente sur le pourtour de la page
  const band = Math.max(2, Math.round(Math.min(W, H) * 0.02)), samp = [], csamp = [];
  const take = (x, y) => { const i = y * W + x; samp.push(L[i]); csamp.push(C[i]); };
  for (let y = 0; y < H; y += 2) for (let x = 0; x < band; x++) { take(x, y); take(W - 1 - x, y); }
  for (let x = 0; x < W; x += 2) for (let y = 0; y < band; y++) { take(x, y); take(x, H - 1 - y); }
  const hist = new Uint32Array(256); for (const v of samp) hist[v]++;
  let bg = 0; for (let v = 1, best = 0; v < 256; v++) { const s = hist[v - 1] + hist[v] + (hist[v + 1] || 0); if (s > best) { best = s; bg = v; } }
  const near = samp.filter((v) => Math.abs(v - bg) <= 24);
  const dev = near.map((v) => Math.abs(v - bg)).sort((p, q) => p - q);
  const mad = dev.length ? dev[dev.length >> 1] : 4;
  const paperC = csamp.slice().sort((p, q) => p - q)[csamp.length >> 1];
  // Couverture ou illustration pleine page : presque pas de papier sur les bords
  if (near.length / samp.length < 0.22) return { boxes: [], sc };
  const thr = Math.max(22, Math.min(60, 18 + mad * 3.5));
  const raw = new Uint8Array(N);
  for (let i = 0; i < N; i++) raw[i] = (Math.abs(L[i] - bg) > thr || (paperC < 30 && C[i] > 55)) ? 1 : 0;
  const integral = (val) => {
    const T = new Uint32Array(W1 * (H + 1));
    for (let y = 0; y < H; y++) { let rs = 0; const o = y * W, r0 = y * W1, r1 = (y + 1) * W1; for (let x = 0; x < W; x++) { rs += val[o + x]; T[r1 + x + 1] = T[r0 + x + 1] + rs; } }
    return (x0, y0, x1, y1) => T[y1 * W1 + x1] - T[y0 * W1 + x1] - T[y1 * W1 + x0] + T[y0 * W1 + x0];
  };
  // Grain du scan effacé : un point d'encre isolé ne compte pas
  const rawSum = integral(raw), ink = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (raw[i] && rawSum(Math.max(0, x - 1), Math.max(0, y - 1), Math.min(W, x + 2), Math.min(H, y + 2)) >= 3) ink[i] = 1;
  }
  const inkSum = integral(ink);
  // Traits de cadre : vraiment foncés
  const dark = new Uint8Array(N), dk = Math.max(70, thr * 1.6);
  for (let i = 0; i < N; i++) dark[i] = bg - L[i] > dk ? 1 : 0;
  const darkSum = integral(dark);
  // Inondation du fond depuis les bords (un pixel ne passe que s'il a du blanc autour de lui)
  const outer = new Uint8Array(N), q = new Int32Array(N); let qh = 0, qt = 0;
  const open = (x, y) => inkSum(Math.max(0, x - 1), Math.max(0, y - 1), Math.min(W, x + 2), Math.min(H, y + 2)) === 0;
  const seed = (x, y) => { const i = y * W + x; if (!outer[i] && open(x, y)) { outer[i] = 1; q[qt++] = i; } };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  while (qh < qt) { const i = q[qh++], x = i % W, y = (i - x) / W; if (x > 0) seed(x - 1, y); if (x < W - 1) seed(x + 1, y); if (y > 0) seed(x, y - 1); if (y < H - 1) seed(x, y + 1); }
  const mask = new Uint8Array(N);
  for (let i = 0; i < N; i++) mask[i] = outer[i] ? 0 : 1;
  const sum = integral(mask);

  const minGap = Math.max(2, Math.round(Math.min(W, H) * P.gap));
  const minW = W * 0.06, minH = H * 0.04, minA = N * P.minA, bigA = N * 0.25;
  function trim(b, S) {
    let [x0, y0, x1, y1] = b;
    const nr = Math.max(1, (x1 - x0) * 0.01);
    while (y0 < y1 && S(x0, y0, x1, y0 + 1) <= nr) y0++;
    while (y1 > y0 && S(x0, y1 - 1, x1, y1) <= nr) y1--;
    const nc = Math.max(1, (y1 - y0) * 0.01);
    while (x0 < x1 && S(x0, y0, x0 + 1, y1) <= nc) x0++;
    while (x1 > x0 && S(x1 - 1, y0, x1, y1) <= nc) x1--;
    return (x1 - x0 < 4 || y1 - y0 < 4) ? null : [x0, y0, x1, y1];
  }
  function split(b, axis, tolFrac, S, gap) {
    const [x0, y0, x1, y1] = b, h = axis === 'h';
    const a0 = h ? y0 : x0, a1 = h ? y1 : x1, tol = Math.max(1, (h ? x1 - x0 : y1 - y0) * tolFrac);
    const segs = []; let start = a0, run = 0;
    for (let t = a0; t < a1; t++) {
      const v = h ? S(x0, t, x1, t + 1) : S(t, y0, t + 1, y1);
      if (v <= tol) { run++; continue; }
      if (run >= gap && t - run > start) { segs.push([start, t - run]); start = t; }
      run = 0;
    }
    segs.push([start, a1]);
    return segs.map(([s, e]) => h ? [x0, s, x1, e] : [s, y0, e, y1]);
  }
  // Cases collées l'une à l'autre : un trait de cadre droit, presque continu, qui traverse tout le bloc
  function splitLine(b, axis) {
    const [x0, y0, x1, y1] = b, h = axis === 'h', len = h ? x1 - x0 : y1 - y0, a0 = h ? y0 : x0, a1 = h ? y1 : x1, span = a1 - a0;
    const maxT = Math.max(2, Math.round((h ? H : W) * 0.012));
    const cov = (t) => (h ? darkSum(x0, t, x1, t + 1) : darkSum(t, y0, t + 1, y1)) / len;
    let run = 0;
    for (let t = a0 + Math.round(span * 0.12); t < a1 - Math.round(span * 0.12); t++) {
      if (cov(t) >= 0.85) { run++; continue; }
      if (run && run <= maxT) {
        // Un trait fin : de part et d'autre, ce n'est plus un aplat foncé
        const before = t - run - 3, after = t + 2;
        if (cov(before) < 0.5 && cov(after) < 0.5) { const m = t - Math.ceil(run / 2); return h ? [[x0, y0, x1, m], [x0, m + 1, x1, y1]] : [[x0, y0, m, y1], [m + 1, y0, x1, y1]]; }
      }
      run = 0;
    }
    return null;
  }
  // Découpe récursive le long des gouttières ; renvoie la liste des cases
  function cut(b, depth, S, gap, out) {
    b = trim(b, S); if (!b) return;
    const area = (b[2] - b[0]) * (b[3] - b[1]), onMask = S === sum;
    // Sur le masque, l'intérieur des cases est plein : on peut tolérer une bulle ou un cartouche qui chevauche la gouttière
    const tols = onMask ? (area > bigA ? [P.tol * 0.5, P.tol, P.tol * 2.5, 0.42] : [P.tol * 0.5, P.tol, 0.3]) : [P.tol * 0.5, P.tol];
    if (depth < 10) {
      for (const tf of tols) for (const axis of ['h', 'v']) {
        const segs = split(b, axis, tf, S, gap).filter((s) => (s[2] - s[0]) * (s[3] - s[1]) >= minA * (tf > 0.25 ? 1.5 : 0.5));
        if (segs.length > 1) { for (const s of segs) cut(s, depth + 1, S, gap, out); return; }
      }
      if (onMask && area > minA * 2.2) for (const axis of ['h', 'v']) {
        const two = splitLine(b, axis);
        if (two && two.every((s) => (s[2] - s[0]) * (s[3] - s[1]) >= minA)) { for (const s of two) cut(s, depth + 1, S, gap, out); return; }
      }
    }
    const w = b[2] - b[0], hh = b[3] - b[1];
    if (w < minW || hh < minH || w * hh < minA) return;
    out.push(b);
  }
  // Blocs séparés par le fond (fonctionne aussi quand les cases ne sont pas alignées en grille)
  const lab = new Int32Array(N); let nl = 0; const comps = [];
  for (let i = 0; i < N; i++) {
    if (!mask[i] || lab[i]) continue;
    nl++; let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0; qh = 0; qt = 0; q[qt++] = i; lab[i] = nl;
    while (qh < qt) {
      const k = q[qh++], x = k % W, y = (k - x) / W; n++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && mask[k - 1] && !lab[k - 1]) { lab[k - 1] = nl; q[qt++] = k - 1; }
      if (x < W - 1 && mask[k + 1] && !lab[k + 1]) { lab[k + 1] = nl; q[qt++] = k + 1; }
      if (y > 0 && mask[k - W] && !lab[k - W]) { lab[k - W] = nl; q[qt++] = k - W; }
      if (y < H - 1 && mask[k + W] && !lab[k + W]) { lab[k + W] = nl; q[qt++] = k + W; }
    }
    if (n >= minA * 0.6) comps.push([x0, y0, x1 + 1, y1 + 1]);
  }
  let boxes = [];
  for (const b of comps) { const out = []; cut(b, 0, sum, minGap, out); if (out.length) boxes.push(...out); else if ((b[2] - b[0]) * (b[3] - b[1]) >= minA) boxes.push(b); }
  boxes = dedupe(boxes);
  const covered = (bs) => bs.reduce((s, b) => s + (b[2] - b[0]) * (b[3] - b[1]), 0) / N;
  // Repli : découpe directement sur l'encre, avec des gouttières un peu plus larges
  if (boxes.length < 2 || covered(boxes) < P.cover) {
    const out = []; cut([0, 0, W, H], 0, inkSum, Math.max(3, Math.round(minGap * 1.6)), out);
    const alt = dedupe(out);
    if (alt.length >= 2 && covered(alt) >= P.cover) boxes = alt;
  }
  // Case « à fond perdu » (dessin jusqu'au bord de la page, sans cadre) : bande dessinée mais non couverte
  if (boxes.length) {
    const ys = []; for (const b of boxes) if ((b[2] - b[0]) * (b[3] - b[1]) >= N * 0.025) ys.push([b[1], b[3]]); ys.sort((p, q) => p[0] - q[0]);
    const bands = []; let cur = 0;
    for (const [t, bt] of ys) { if (t > cur) bands.push([cur, t]); cur = Math.max(cur, bt); }
    bands.push([cur, H]);
    for (const [t, bt] of bands) {
      if (bt - t < H * 0.1) continue;
      const dens = inkSum(0, t, W, bt) / (W * (bt - t));
      if (dens < 0.06) continue;
      const nb = trim([0, t, W, bt], inkSum);
      if (nb && (nb[2] - nb[0]) * (nb[3] - nb[1]) >= minA * 2) boxes.push(nb);
    }
    boxes = dedupe(boxes);
  }
  if (boxes.length < 2 || boxes.length > 40 || covered(boxes) < P.cover) return { boxes: [], sc };
  return { boxes, sc, H };
}
// Une case contenue dans une autre disparaît
function dedupe(bs) {
  const area = (b) => (b[2] - b[0]) * (b[3] - b[1]);
  const inter = (p, q) => Math.max(0, Math.min(p[2], q[2]) - Math.max(p[0], q[0])) * Math.max(0, Math.min(p[3], q[3]) - Math.max(p[1], q[1]));
  const s = bs.slice().sort((p, q) => area(q) - area(p)), out = [];
  for (const b of s) if (!out.some((o) => inter(o, b) > area(b) * 0.7)) out.push(b);
  return out;
}
// Ordre de lecture : bandes horizontales de haut en bas, puis colonnes (de droite à gauche en manga)
function readingOrder(bs, rtl, H) {
  if (bs.length <= 1) return bs;
  const tolY = H * 0.02;
  const byY = bs.slice().sort((p, q) => p[1] - q[1]);
  const rows = []; let cur = [byY[0]], bottom = byY[0][3];
  for (const b of byY.slice(1)) {
    if (b[1] >= bottom - tolY) { rows.push(cur); cur = [b]; bottom = b[3]; } else { cur.push(b); bottom = Math.max(bottom, b[3]); }
  }
  rows.push(cur);
  if (rows.length > 1) return rows.flatMap((r) => readingOrder(r, rtl, H));
  const tolX = (Math.max(...bs.map((b) => b[2])) - Math.min(...bs.map((b) => b[0]))) * 0.02;
  const byX = bs.slice().sort((p, q) => p[0] - q[0]);
  const cols = []; let cc = [byX[0]], right = byX[0][2];
  for (const b of byX.slice(1)) {
    if (b[0] >= right - tolX) { cols.push(cc); cc = [b]; right = b[2]; } else { cc.push(b); right = Math.max(right, b[2]); }
  }
  cols.push(cc);
  if (cols.length > 1) { if (rtl) cols.reverse(); return cols.flatMap((c) => readingOrder(c, rtl, H)); }
  // Imbriqué : haut d'abord, puis le côté de lecture
  return bs.slice().sort((p, q) => (Math.abs(p[1] - q[1]) > tolY ? p[1] - q[1] : rtl ? q[0] - p[0] : p[0] - q[0]));
}
function flatten(det, rtl, cw, ch) {
  if (!det.boxes || det.boxes.length < 2) return [{ x: 0, y: 0, w: cw, h: ch }];
  const pad = cw * 0.008;
  return readingOrder(det.boxes, rtl, det.H || ch * det.sc).map(([x0, y0, x1, y1]) => {
    const X0 = Math.max(0, x0 / det.sc - pad), Y0 = Math.max(0, y0 / det.sc - pad);
    const X1 = Math.min(cw, x1 / det.sc + pad), Y1 = Math.min(ch, y1 / det.sc + pad);
    return { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0 };
  });
}

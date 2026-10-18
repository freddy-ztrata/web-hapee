// Robot Hapee — implementación «b»: reconstrucción procedural limpia (three.js r160).
// Todo se genera en código: superficies analíticas (superelipsoides) + piezas en relieve
// proyectadas sobre ellas, con bordes redondeados reales. Sin texturas salvo la pantalla del pecho.
// Unidades de modelado: píxeles de img/robot.png (alto 737); el root se escala a alto ≈ 1.
// Interfaz: load(THREE, addons?) → { root, animate(t, { wave }), parts, screen }.
//   addons.RoundedBoxGeometry: opcional; si falta se importa 'three/addons/…' (requiere importmap).
//   parts  = { head, torso, hips }: nodos para sumar offsets DESPUÉS de animate() (mirar, inclinarse).
//   screen = { set(mode), update(t, level), material }: pantalla del pecho viva.
//            mode 'logo' (por defecto) | 'dots' (pensando) | 'talk' (hablando: barras + pulso según level ∈ [0,1]).
// Módulo compartido (2026-10-17): lo usan la home pública (js/robot/robot-view.js) y la
// propuesta oculta (propuesta-2026-r8x4/hero-robot.js). No depende de la página.
let RoundedBoxGeometry;

let T;
const H = 737;

// ───────────────────────── utilidades ─────────────────────────
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pw = (x, n) => Math.pow(Math.abs(x), n);
// máximo redondeado: une dos distancias con esquina de radio r
const rmax = (a, b, r) => Math.min(Math.max(a + r, b + r), 0) + Math.hypot(Math.max(a + r, 0), Math.max(b + r, 0)) - r;
const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * .25; };

// ── superficie estrellada: F(x,y,z) relativo al centro c; F<1 dentro ──
const star = (c, F) => ({ c, F });
function hitT(S, ox, oy, oz, dx, dy, dz) {
  const F = S.F; let lo = 0, hi = 8;
  if (F(ox, oy, oz) >= 1) return 0;
  for (let k = 0; k < 40 && F(ox + dx * hi, oy + dy * hi, oz + dz * hi) < 1; k++) hi *= 2;
  for (let i = 0; i < 34; i++) { const m = (lo + hi) * .5; if (F(ox + dx * m, oy + dy * m, oz + dz * m) < 1) lo = m; else hi = m; }
  return (lo + hi) * .5;
}
function gradN(S, x, y, z) {
  const F = S.F, e = .01;
  const gx = F(x + e, y, z) - F(x - e, y, z), gy = F(x, y + e, z) - F(x, y - e, z), gz = F(x, y, z + e) - F(x, y, z - e);
  const l = Math.hypot(gx, gy, gz) || 1; return [gx / l, gy / l, gz / l];
}

// malla de una superficie estrellada (topología de esfera, sin costuras).
// o.ext=[a,b,c] y o.ex=[eh,ev]: reparte las muestras como un superelipsoide (más densas en las esquinas).
function starGeo(S, W, thetas, o = {}) {
  const pos = [], i0 = [], i1 = [], rows = thetas.length, ext = o.ext || [1, 1, 1], eh = 2 / ((o.ex || [2, 2])[0]), ev = 2 / ((o.ex || [2, 2])[1]);
  const sp = (x, e) => Math.sign(x) * pw(x, e);
  const put = (th, ph) => {
    const r = pw(Math.sin(th), ev);
    let dx = r * sp(Math.sin(ph), eh) * ext[0], dy = sp(Math.cos(th), ev) * ext[1], dz = r * sp(Math.cos(ph), eh) * ext[2];
    const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    let t = hitT(S, 0, 0, 0, dx, dy, dz); if (o.disp) t *= o.disp(th, ph);
    pos.push(S.c[0] + dx * t, S.c[1] + dy * t, S.c[2] + dz * t);
  };
  put(0, 0);
  for (const th of thetas) for (let j = 0; j < W; j++) put(th, 2 * Math.PI * j / W);
  put(Math.PI, 0);
  const bot = 1 + rows * W, V = (i, j) => 1 + i * W + (j % W), split = o.splitRow ?? Infinity;
  for (let j = 0; j < W; j++) i0.push(0, V(0, j), V(0, j + 1));
  for (let i = 0; i < rows - 1; i++) {
    const tg = i >= split ? i1 : i0;
    for (let j = 0; j < W; j++) { const a = V(i, j), b = V(i, j + 1), c = V(i + 1, j), d = V(i + 1, j + 1); tg.push(a, c, b, b, c, d); }
  }
  for (let j = 0; j < W; j++) (rows - 1 >= split ? i1 : i0).push(V(rows - 1, j), bot, V(rows - 1, j + 1));
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setIndex([...i0, ...i1]);
  if (i1.length) { g.addGroup(0, i0.length, 0); g.addGroup(i0.length, i1.length, 1); }
  g.computeVertexNormals();
  // normales analíticas (gradiente de F): sombreado perfecto con pocas caras; el surco usa las calculadas
  const nA = g.attributes.normal, keep = o.keepNormal || (() => false), ths = [0, ...thetas.flatMap(th => Array(W).fill(th)), Math.PI];
  for (let i = 0; i < nA.count; i++) {
    if (keep(ths[i])) continue;
    const n = gradN(S, pos[3 * i] - S.c[0], pos[3 * i + 1] - S.c[1], pos[3 * i + 2] - S.c[2]); nA.setXYZ(i, n[0], n[1], n[2]);
  }
  return g;
}
const uniform = (n, a = 0, b = Math.PI) => Array.from({ length: n }, (_, i) => a + (b - a) * (i + 1) / (n + 1));
// filas con un surco fino en θs (para separar colores en una misma pieza)
function rowsWithGroove(n, ths, wDeg) {
  const base = uniform(n).filter(t => Math.abs(t - ths) > wDeg * 4 * Math.PI / 180);
  const extra = [-4, -3, -2.2, -1.5, -1, -.5, 0, .5, 1, 1.5, 2.2, 3, 4].map(k => ths + k * wDeg * Math.PI / 180);
  const all = [...base, ...extra].sort((a, b) => a - b);
  return { thetas: all, splitRow: all.indexOf(ths) };
}

// ── contornos 2D (f<0 dentro) ──
function polarHit(f, cu, cv, a) {
  const ca = Math.cos(a), sa = Math.sin(a); let lo = 0, hi = 4;
  while (f(cu + ca * hi, cv + sa * hi) < 0) hi *= 2;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) * .5; if (f(cu + ca * m, cv + sa * m) < 0) lo = m; else hi = m; }
  const r = (lo + hi) * .5; return [cu + ca * r, cv + sa * r];
}
function nrm2(f, u, v) { const e = .01, gx = f(u + e, v) - f(u - e, v), gy = f(u, v + e) - f(u, v - e), l = Math.hypot(gx, gy) || 1; return [gx / l, gy / l]; }
// ángulos que reparten N puntos sobre uno o varios contornos (mismo centro polar):
// mitad por longitud, mitad por curvatura, así las esquinas quedan finas en ambos bordes de una banda
function arcAlphas(fs, cu, cv, N) {
  const M = 1440, W = new Float64Array(M + 1);
  for (const f of [].concat(fs)) {
    const P = []; for (let k = 0; k <= M; k++) P.push(polarHit(f, cu, cv, 2 * Math.PI * k / M));
    const ang = k => Math.atan2(P[k + 1][1] - P[k][1], P[k + 1][0] - P[k][0]);
    let len = 0; for (let k = 1; k <= M; k++) len += Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]);
    const lam = len / (2 * Math.PI);
    for (let k = 1; k <= M; k++) {
      let da = k < M ? ang(k) - ang(k - 1) : 0; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
      W[k] += (Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]) + lam * da) / len;
    }
  }
  const L = [0]; for (let k = 1; k <= M; k++) L.push(L[k - 1] + W[k]);
  const out = []; let k = 0;
  for (let i = 0; i < N; i++) {
    const s = L[M] * i / N; while (L[k + 1] < s) k++;
    const fr = (s - L[k]) / (L[k + 1] - L[k] || 1); out.push(2 * Math.PI * (k + fr) / M);
  }
  return out;
}

// ── pieza en relieve sobre una superficie (placa con borde redondeado) ──
// chart(u,v) → [ox,oy,oz,dx,dy,dz] rayo (relativo al centro de S) desde dentro hacia la superficie.
// outF: contorno exterior; inF: contorno del hueco (o null = pieza llena). cen: centro polar común.
function decal(S, chart, outF, inF, cen, o) {
  const N = o.N || 160, nb = o.nb ?? 5, ni = o.ni ?? 10, t = o.t, rb = o.rb, rbIn = o.rbIn ?? rb, H2 = Math.PI / 2;
  const alphas = arcAlphas(inF ? [outF, inF] : outF, cen[0], cen[1], N), rows = [];
  // cada muestra: [u, v, h, ex, ey, f]: (ex,ey) dirección 2D hacia afuera de la pieza, f ángulo del perfil (π/2 = cara plana)
  for (const a of alphas) {
    const po = polarHit(outF, cen[0], cen[1], a), no = nrm2(outF, po[0], po[1]), R = [];
    let wOut = rb;
    if (o.blend) { // borde exterior fundido en la superficie (tangente): sin línea de unión visible
      wOut = o.blend; R.push([po[0], po[1], -.2, no[0], no[1], H2]);
      for (let j = 0; j <= nb; j++) { const x = j / nb, d = wOut * x, slope = t * 6 * x * (1 - x) / wOut; R.push([po[0] - no[0] * d, po[1] - no[1] * d, t * x * x * (3 - 2 * x), no[0], no[1], Math.atan2(1, slope)]); }
    } else {
      R.push([po[0], po[1], -(o.skirt ?? 1.5), no[0], no[1], 0]);
      for (let j = 0; j <= nb; j++) { const f = j / nb * H2, d = rb * (1 - Math.cos(f)); R.push([po[0] - no[0] * d, po[1] - no[1] * d, t - rb + rb * Math.sin(f), no[0], no[1], f]); }
    }
    const A = [po[0] - no[0] * wOut, po[1] - no[1] * wOut]; let B, pi, nI;
    if (inF) { pi = polarHit(inF, cen[0], cen[1], a); nI = nrm2(inF, pi[0], pi[1]); B = [pi[0] + nI[0] * rbIn, pi[1] + nI[1] * rbIn]; } else B = cen;
    for (let i = 1; i < ni; i++) R.push([lerp(A[0], B[0], i / ni), lerp(A[1], B[1], i / ni), t, 0, 0, H2]);
    if (inF) {
      for (let j = nb; j >= 0; j--) { const f = j / nb * H2, d = rbIn * (1 - Math.cos(f)); R.push([pi[0] + nI[0] * d, pi[1] + nI[1] * d, t - rbIn + rbIn * Math.sin(f), -nI[0], -nI[1], f]); }
      R.push([pi[0], pi[1], -(o.skirtIn ?? 3), -nI[0], -nI[1], 0]);
    }
    rows.push(R);
  }
  const pos = [], nor = [], uv = [], idx = [], A = rows[0].length;
  const surf = (u, v) => { const [ox, oy, oz, dx, dy, dz] = chart(u, v), tt = hitT(S, ox, oy, oz, dx, dy, dz); return [ox + dx * tt, oy + dy * tt, oz + dz * tt]; };
  const map = (u, v, h, ex, ey, f) => {
    const p = surf(u, v), n = gradN(S, p[0], p[1], p[2]);
    pos.push(S.c[0] + p[0] + n[0] * h, S.c[1] + p[1] + n[1] * h, S.c[2] + p[2] + n[2] * h);
    let m = n;
    if (f < H2 - 1e-6) { // normal analítica del bisel: mezcla de la normal de la superficie y la dirección del borde
      const q = surf(u + ex * .4, v + ey * .4); let e = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
      const dn = e[0] * n[0] + e[1] * n[1] + e[2] * n[2]; e = [e[0] - n[0] * dn, e[1] - n[1] * dn, e[2] - n[2] * dn];
      const el = Math.hypot(...e) || 1, c = Math.cos(f), sn = Math.sin(f);
      m = [c * e[0] / el + sn * n[0], c * e[1] / el + sn * n[1], c * e[2] / el + sn * n[2]];
      const ml = Math.hypot(...m) || 1; m = [m[0] / ml, m[1] / ml, m[2] / ml];
    }
    nor.push(m[0], m[1], m[2]);
    if (o.uv) uv.push((u - o.uv[0]) / (o.uv[2] - o.uv[0]), (v - o.uv[1]) / (o.uv[3] - o.uv[1]));
    else uv.push(0, 0);
  };
  for (const R of rows) for (const r of R) map(...r);
  let ctr = -1; if (!inF) { ctr = pos.length / 3; map(cen[0], cen[1], t, 0, 0, H2); }
  const q = (s, a) => (s % N) * A + a;
  for (let s = 0; s < N; s++) {
    for (let a = 0; a < A - 1; a++) idx.push(q(s, a), q(s + 1, a), q(s, a + 1), q(s + 1, a), q(s + 1, a + 1), q(s, a + 1));
    if (!inF) idx.push(q(s, A - 1), q(s + 1, A - 1), ctr);
  }
  // orientar las caras hacia afuera de la superficie
  const P = i => [pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]], aa = Math.min(A - 2, nb + 3);
  const [a0, b0, c0] = [P(q(0, aa)), P(q(1, aa)), P(q(0, aa) + 1)];
  const e1 = [b0[0] - a0[0], b0[1] - a0[1], b0[2] - a0[2]], e2 = [c0[0] - a0[0], c0[1] - a0[1], c0[2] - a0[2]];
  const cr = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
  const k = 3 * q(0, aa);
  if (cr[0] * nor[k] + cr[1] * nor[k + 1] + cr[2] * nor[k + 2] < 0) for (let i = 0; i < idx.length; i += 3) { const tmp = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = tmp; }
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// cartas de proyección
const frontChart = S => (u, v) => [u - S.c[0], v - S.c[1], 0, 0, 0, 1];
const backChart = S => (u, v) => [-u - S.c[0], v - S.c[1], 0, 0, 0, -1];
const sagChart = (S, R0) => (u, v) => [u - S.c[0], 0, 0, 0, Math.cos(v / R0), Math.sin(v / R0)];

// perfil con esquinas redondeadas para tornos (LatheGeometry)
function fillet(pts, rads, seg = 5) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const P = pts[i], r = rads[i] || 0;
    if (!r || i === 0 || i === pts.length - 1) { out.push(P); continue; }
    const A = pts[i - 1], B = pts[i + 1], la = Math.hypot(A[0] - P[0], A[1] - P[1]), lb = Math.hypot(B[0] - P[0], B[1] - P[1]);
    const u1 = [(A[0] - P[0]) / la, (A[1] - P[1]) / la], u2 = [(B[0] - P[0]) / lb, (B[1] - P[1]) / lb];
    const half = Math.acos(clamp(u1[0] * u2[0] + u1[1] * u2[1], -1, 1)) / 2;
    const d = Math.min(r / Math.tan(half), la * .5, lb * .5);
    const s = [P[0] + u1[0] * d, P[1] + u1[1] * d], e = [P[0] + u2[0] * d, P[1] + u2[1] * d];
    for (let k = 0; k <= seg; k++) { const t = k / seg, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; out.push([a * s[0] + b * P[0] + c * e[0], a * s[1] + b * P[1] + c * e[1]]); }
  }
  return out;
}
// tabla 1D con interpolación lineal (evita resolver bisecciones dentro de los contornos)
function table(fn, a, b, n = 256) {
  const ys = Array.from({ length: n + 1 }, (_, i) => fn(a + (b - a) * i / n));
  return x => { const f = clamp((x - a) / (b - a), 0, 1) * n, i = Math.min(n - 1, Math.floor(f)); return lerp(ys[i], ys[i + 1], f - i); };
}
// carta sagital: arco S (>0 hacia adelante) en el que la superficie alcanza la altura y (en x = X)
function sOfY(S, R0, X, y) {
  const at = th => { const d = [0, Math.cos(th), Math.sin(th)], t = hitT(S, X - S.c[0], 0, 0, ...d); return d[1] * t + S.c[1]; };
  let lo = 0, hi = Math.PI * .75; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (at(m) > y) lo = m; else hi = m; }
  return R0 * (lo + hi) / 2;
}
const lathe = (pts, rads, segs = 64) => new T.LatheGeometry(fillet(pts, rads).map(([r, y]) => new T.Vector2(Math.max(r, 0), y)), segs);

// tubo a lo largo de un arco en el plano XY (vincha de los audífonos)
function arcSweep({ cx, cy, cz, A, B, a0, a1, segs, fs, ring = 28, sec, ex = 2.6 }) {
  const pos = [], idx = [];
  fs = fs || Array.from({ length: segs + 1 }, (_, i) => i / segs); segs = fs.length - 1;
  for (let i = 0; i <= segs; i++) {
    const f = fs[i], a = lerp(a0, a1, f), ca = Math.cos(a), sa = Math.sin(a), [hr, hz] = sec(f);
    let nx = ca / A, ny = sa / B; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
    for (let k = 0; k < ring; k++) {
      const p = 2 * Math.PI * k / ring, c = Math.cos(p), s = Math.sin(p), e = 2 / ex;
      const ux = Math.sign(c) * pw(c, e), uz = Math.sign(s) * pw(s, e);
      pos.push(cx + A * ca + ux * hr * nx, cy + B * sa + ux * hr * ny, cz + uz * hz);
    }
  }
  const P = (i, k) => i * ring + (k % ring);
  for (let i = 0; i < segs; i++) for (let k = 0; k < ring; k++) idx.push(P(i, k), P(i + 1, k), P(i, k + 1), P(i + 1, k), P(i + 1, k + 1), P(i, k + 1));
  const c0 = pos.length / 3; pos.push(cx + A * Math.cos(a0), cy + B * Math.sin(a0), cz);
  const c1 = pos.length / 3; pos.push(cx + A * Math.cos(a1), cy + B * Math.sin(a1), cz);
  for (let k = 0; k < ring; k++) { idx.push(c0, P(0, k + 1), P(0, k)); idx.push(c1, P(segs, k), P(segs, k + 1)); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ── jerarquía: nodos con pivote en coordenadas de mundo; la geometría se construye en mundo ──
function node(parent, pivot) {
  const g = new T.Group(); g.userData.pivot = pivot;
  const pp = parent.userData.pivot || [0, 0, 0];
  g.position.set(pivot[0] - pp[0], pivot[1] - pp[1], pivot[2] - pp[2]);
  parent.add(g); return g;
}
function add(nd, geo, mat) {
  const m = new T.Mesh(geo, mat); const p = nd.userData.pivot;
  m.position.set(-p[0], -p[1], -p[2]); nd.add(m); return m;
}

// ── fuente de la marca para «hapee» ──
async function loadFont() {
  const fam = 'HapeeBotPoppins';
  try {
    const ff = new FontFace(fam, 'url(https://fonts.gstatic.com/s/poppins/v24/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.woff2) format("woff2")', { weight: '600' });
    await Promise.race([ff.load(), new Promise((_, rej) => setTimeout(() => rej(new Error('font timeout')), 5000))]);
    document.fonts.add(ff); return `"${fam}", Poppins, `;
  } catch (e) { return 'Poppins, "Arial Rounded MT Bold", '; }
}

// pantalla del pecho: degradado de marca + «hapee»
function screenTexture(fontStack, aspect) {
  // 1024 px de ancho (antes 1536): igual de nítido al tamaño en pantalla y mucho más barato de re-subir
  // cuando la pantalla se anima (puntos / barras).
  const W = 1024, Hh = Math.round(W / aspect), cv = document.createElement('canvas'); cv.width = W; cv.height = Hh;
  const bg = document.createElement('canvas'); bg.width = W; bg.height = Hh;
  const b = bg.getContext('2d');
  const lg = b.createLinearGradient(0, 0, W, Hh * .55);
  lg.addColorStop(0, '#ff9a0c'); lg.addColorStop(.45, '#ff6e3c'); lg.addColorStop(1, '#ff2a9a');
  b.fillStyle = lg; b.fillRect(0, 0, W, Hh);
  const blob = (x, y, r, col) => { const rg = b.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); b.fillStyle = rg; b.fillRect(0, 0, W, Hh); };
  blob(W * .02, Hh * .05, W * .55, 'rgba(255,150,0,.85)');
  blob(W * .12, Hh * .92, W * .5, 'rgba(255,196,40,.9)');
  blob(W * 1.0, Hh * .85, W * .62, 'rgba(244,32,196,.9)');
  blob(W * .88, Hh * .12, W * .45, 'rgba(255,60,120,.6)');
  blob(W * .5, Hh * .62, W * .32, 'rgba(255,186,160,.55)');
  const g = cv.getContext('2d');
  g.font = `600 100px ${fontStack}sans-serif`;
  const w100 = g.measureText('hapee').width, size = 100 * (W * .79) / w100;
  const logo = (sc = 1, y = .52) => {
    g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = `600 ${size * sc}px ${fontStack}sans-serif`;
    // base de la x en 0.5 de alto (el texto queda algo sobre el centro, como en la referencia)
    g.fillText('hapee', W / 2, Hh * y);
  };
  const pill = (x, y, w, h) => { const r = Math.min(w, h) / 2; g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); g.fill(); };
  const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; tx.anisotropy = 8;
  let mode = 'logo', last = -1;
  function draw(t, level) {
    g.drawImage(bg, 0, 0);
    if (mode === 'dots') {
      // tres puntos que rebotan en secuencia (como «escribiendo…»)
      g.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        const ph = Math.max(0, Math.sin(t * 6 - i * .9)), r = W * .072;
        g.globalAlpha = .55 + .45 * ph;
        g.beginPath(); g.arc(W * (.3 + .2 * i), Hh * (.52 - .09 * ph), r, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
    } else if (mode === 'talk') {
      const lv = Math.max(0, Math.min(1, level || 0));
      // brillo blanco suave que late con la voz
      g.fillStyle = `rgba(255,255,255,${.06 + lv * .22})`; g.fillRect(0, 0, W, Hh);
      logo(.86 + lv * .06, .44);
      // ecualizador bajo el logo
      g.fillStyle = 'rgba(255,255,255,.95)';
      const n = 7, bw = W * .055, gap = W * .035, x0 = W / 2 - (n * bw + (n - 1) * gap) / 2;
      for (let i = 0; i < n; i++) {
        const k = .35 + .65 * Math.abs(Math.sin(t * 7.3 + i * 1.7)) , h = Hh * (.04 + .22 * lv * k);
        pill(x0 + i * (bw + gap), Hh * .74 - h / 2, bw, Math.max(bw, h));
      }
    } else logo();
    tx.needsUpdate = true;
  }
  draw(0, 0);
  return {
    texture: tx,
    set(m) { if (m !== mode) { mode = m; last = -1; } },
    get mode() { return mode; },
    // redibuja a ~20 fps solo si la pantalla está animada; en 'logo' queda quieta
    update(t, level) {
      if (mode === 'logo') { if (last !== -2) { draw(t, 0); last = -2; } return; }
      if (last >= 0 && t - last < .05) return;
      last = t; draw(t, level);
    }
  };
}

// brillo cálido del visor alrededor de ojos y sonrisa (mapa emisivo, coordenadas = carta frontal)
function visorGlow(shapes) {
  const W = 1024, Hc = Math.round(W * 174 / 262), cv = document.createElement('canvas'); cv.width = W; cv.height = Hc;
  const g = cv.getContext('2d'), X = u => (u + 131) / 262 * W, Y = v => (1 - (v - 469) / 174) * Hc, S = W / 262;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, Hc);
  const rg = g.createRadialGradient(X(0), Y(600), 0, X(0), Y(600), 150 * S);
  rg.addColorStop(0, 'rgba(92,24,34,1)'); rg.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = rg; g.fillRect(0, 0, W, Hc);
  g.shadowColor = 'rgba(255,128,60,.7)'; g.shadowBlur = 14 * S; g.fillStyle = 'rgba(255,128,60,.7)';
  for (const [f, c] of shapes) {
    g.beginPath();
    for (let k = 0; k < 180; k++) { const [u, v] = polarHit(f, c[0], c[1], 2 * Math.PI * k / 180); k ? g.lineTo(X(u), Y(v)) : g.moveTo(X(u), Y(v)); }
    g.closePath(); g.fill();
  }
  const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace; return tx;
}

// ───────────────────────── modelo ─────────────────────────
export async function load(THREE, addons = {}) {
  T = THREE;
  RoundedBoxGeometry = addons.RoundedBoxGeometry || (await import('three/addons/geometries/RoundedBoxGeometry.js')).RoundedBoxGeometry;
  const fontStack = await loadFont();
  const phys = (color, o = {}) => new T.MeshPhysicalMaterial({ color, roughness: .3, metalness: 0, clearcoat: .6, clearcoatRoughness: .16, ...o });
  const M = {
    white: phys('#f4e4dd'),
    orange: phys('#ec5a00'),
    pink: phys('#cc0a5a'),
    dark: phys('#4c1f23', { roughness: .36 }),
    band: phys('#2a1c1e', { roughness: .34 }),
    visor: phys('#3a1017', { roughness: .1, clearcoat: 1, clearcoatRoughness: .04 }),
    face: new T.MeshBasicMaterial({ color: '#fff4e2', toneMapped: false }),
    boot: phys('#ffffff', { vertexColors: true }),
  };

  const root = new T.Group(); root.userData.pivot = [0, 0, 0];
  const hips = node(root, [0, 172, 0]);
  const torsoN = node(hips, [0, 236, 0]);
  const headN = node(torsoN, [0, 432, 0]);
  hips.name = 'hips'; torsoN.name = 'torso'; headN.name = 'head';

  // ══════════ CABEZA ══════════
  const HC = [0, 569.5, 0];
  const helmet = star(HC, (x, y, z) => {
    const r = Math.hypot(x, y, z) || 1, m = lerp(4.2, 2.6, sstep(-.35, .35, y / r));
    return Math.pow(pw(x / 148, 2.3) + pw(z / 140, 2.3), m / 2.3) + pw(y / 130.5, m);
  });
  add(headN, starGeo(helmet, 64, uniform(42), { ext: [148, 130, 140], ex: [2.3, 3] }), M.white);
  const FC = frontChart(helmet);
  // visor (pantalla negra) + bisel blanco
  const visorF = g => (u, v) => { const n = v > 556 ? 4 : 3.2; return (Math.pow(pw(u / (128 + g), n) + pw((v - 556) / (85 + g), n), 1 / n) - 1) * 85; };
  add(headN, decal(helmet, FC, visorF(2), null, [0, 556], { t: 1.6, rb: 1.2, nb: 2, ni: 9, N: 120, uv: [-131, 469, 131, 643] }), M.visor);
  add(headN, decal(helmet, FC, visorF(14), visorF(-1.5), [0, 556], { t: 4.2, rb: 3.2, blend: 9, rbIn: 3.4, nb: 5, ni: 3, N: 100 }), M.white);
  // ojos y sonrisa
  const eyeF = cx => (u, v) => (Math.hypot((u - cx) / 15, (v - 561) / 22.5) - 1) * 15;
  for (const cx of [-62, 62]) add(headN, decal(helmet, FC, eyeF(cx), null, [cx, 561], { t: 2.3, rb: .5, nb: 1, ni: 3, N: 56, skirt: .5 }), M.face);
  const smileF = (u, v) => smax((Math.hypot(u / 26.5, (v - 518) / 17.5) - 1) * 17.5, v - (517.5 + .006 * u * u), 4);
  M.visor.emissive = new T.Color('#ffffff'); M.visor.emissiveIntensity = 1;
  M.visor.emissiveMap = visorGlow([[eyeF(-62), [-62, 561]], [eyeF(62), [62, 561]], [(u, v) => smileF(u, v) + 1.5, [0, 510]]]);
  add(headN, decal(helmet, FC, smileF, null, [0, 510], { t: 2.3, rb: .5, nb: 1, ni: 3, N: 72, skirt: .5 }), M.face);

  // corona naranja + inserto rosado (carta sagital: S = arco sobre la cabeza, >0 hacia la cara)
  const R0 = 140, SC = sagChart(helmet, R0);
  const crownFront = table(X => sOfY(helmet, R0, X, 616 + 7 * pw(X / 95, 2)), -95, 95, 190);
  const SF0 = crownFront(0), SB = -.92 * SF0, PF0 = sOfY(helmet, R0, 0, 672);
  const crownF = (u, v) => {
    const vf = v - (crownFront(u) - SF0) * sstep(0, SF0, v);
    return rmax(Math.abs(u) - 100, Math.abs(vf - (SF0 + SB) / 2) - (SF0 - SB) / 2, 22);
  };
  const pinkF = g => (u, v) => {
    const w = lerp(50, 60, sstep(PF0, PF0 - 60, v)) + g;
    return rmax(Math.abs(u) - w, Math.abs(v - (PF0 + SB + 30) / 2) - (PF0 - SB - 30) / 2 - g, 16);
  };
  const cc = [0, (SF0 + SB) / 2];
  add(headN, decal(helmet, SC, crownF, pinkF(0), cc, { t: 9, rb: 6, rbIn: 3.5, nb: 4, ni: 5, N: 112 }), M.orange);
  add(headN, decal(helmet, SC, pinkF(3), null, cc, { t: 6.4, rb: 2, nb: 2, ni: 7, N: 100 }), M.pink);

  // audífonos
  const CUP = [150, 553, -6];
  for (const sd of [-1, 1]) {
    const cup = new T.Group(); cup.position.set(sd * CUP[0], CUP[1], CUP[2]); cup.rotation.z = -sd * Math.PI / 2;
    const mk = (geo, mat) => { const m = new T.Mesh(geo, mat); cup.add(m); };
    mk(lathe([[0, -8], [59, -8], [60, 21], [0, 21]], [0, 10, 9, 0], 34), M.dark);
    mk(lathe([[0, 16], [52, 16], [52, 41], [0, 41]], [0, 4, 13, 0], 34), M.orange);
    mk(lathe([[0, 38], [37, 38], [37, 43], [20, 46.5], [0, 47.5]], [0, 2, 3.5, 8, 0], 30), M.pink);
    const p = headN.userData.pivot; cup.position.x -= p[0]; cup.position.y -= p[1]; cup.position.z -= p[2];
    headN.add(cup);
  }
  const BC = { cx: 0, cy: 580, cz: -6, A: 172, B: 151 };
  add(headN, arcSweep({ ...BC, a0: .06, a1: Math.PI - .06, segs: 72, ring: 14, sec: () => [6.5, 8.5] }), M.band);
  // deslizadores naranjas: tramo recto + remate redondeado (muestras densas en el remate)
  const capF = 11 / ((.46) * 160), body = Array.from({ length: 11 }, (_, i) => i / 10 * (1 - capF));
  const capS = Array.from({ length: 7 }, (_, j) => 1 - capF * Math.cos((j + 1) / 7 * Math.PI / 2));
  const fsUp = [...body, ...capS];
  for (const [a0, a1, capEnd] of [[.04, .5, 1], [Math.PI - .5, Math.PI - .04, 0]]) {
    const fs = capEnd ? fsUp : fsUp.map(f => 1 - f).reverse();
    add(headN, arcSweep({ ...BC, a0, a1, fs, ring: 14, sec: f => { const e = (capEnd ? 1 - f : f) / capF, k = clamp(e, 0, 1); const sq = Math.sqrt(Math.max(0, 1 - (1 - k) * (1 - k))); return [9.5 * sq, 12 * sq]; } }), M.orange);
  }

  // cuello
  add(headN, lathe([[0, 404], [43, 404], [45, 416], [45, 444], [41, 450], [0, 450]], [0, 4, 3, 5, 0], 36), M.dark);

  // ══════════ TORSO ══════════
  const TC = [0, 330, 0];
  const torso = star(TC, (x, y, z) => {
    const r = Math.hypot(x, y, z) || 1, m = lerp(5, 6, sstep(-.25, .25, y / r)), k = sstep(-100, 0, y);
    const a = lerp(102, 118, k), cz = lerp(72, 82, k);
    return Math.pow(pw(x / a, 2.6) + pw(z / cz, 2.6), m / 2.6) + pw(y / (y > 0 ? 87 : 100), m);
  });
  const tg = rowsWithGroove(30, Math.PI / 2 + .26, .35);
  add(torsoN, starGeo(torso, 56, tg.thetas, { ext: [118, 95, 82], ex: [2.6, 4], splitRow: tg.splitRow, keepNormal: th => Math.abs(th - (Math.PI / 2 + .26)) < .03, disp: (th) => 1 - .009 * Math.exp(-pw((th - (Math.PI / 2 + .26)) / (.5 * Math.PI / 180), 2)) }), [M.orange, M.pink]);
  const TF = frontChart(torso), TB = backChart(torso);
  const shieldW = v => 98 - 36 * pw(clamp((417 - v) / 189, 0, 1), 2.2);
  const shieldF = (u, v) => rmax(rmax(Math.abs(u) - shieldW(v), v - 413, 16), 236 - v, 12);
  const scrW = v => lerp(63, 74, clamp((v - 251) / 130, 0, 1));
  const screenF = g => (u, v) => rmax(Math.abs(u) - scrW(v) - g, Math.abs(v - 316) - 65 - g, 24 + g * .5);
  add(torsoN, decal(torso, TF, shieldF, screenF(0), [0, 316], { t: 7, rb: 3.6, rbIn: 3.6, nb: 4, ni: 4, N: 112 }), M.white);
  const scr = decal(torso, TF, screenF(3), null, [0, 316], { t: 3.6, rb: 1, nb: 1, ni: 7, N: 96, uv: [-77, 248, 77, 384] });
  const screen = screenTexture(fontStack, 154 / 136);
  const screenMat = new T.MeshPhysicalMaterial({ color: '#000', emissive: '#fff', emissiveMap: screen.texture, roughness: .32, specularIntensity: .5, clearcoat: .55, clearcoatRoughness: .22, toneMapped: false });
  screen.material = screenMat;
  add(torsoN, scr, screenMat);
  // canesú naranja alrededor del cuello (delante y detrás)
  // canesú naranja: rodea el cuello por encima del torso (carta sagital, hueco para el cuello)
  const TR0 = 90, yokeS = table(X => sOfY(torso, TR0, X, 399 + 9 * pw(X / 77, 2)), -80, 80, 160), YS0 = yokeS(0);
  const yokeF = (u, v) => rmax(Math.abs(u) - 77, Math.abs(v) - YS0 - (yokeS(u) - YS0), 14);
  const neckHole = (u, v) => Math.hypot(u, v) - 39;
  add(torsoN, decal(torso, sagChart(torso, TR0), yokeF, neckHole, [0, 0], { t: 9, rb: 5, rbIn: 3, nb: 4, ni: 4, N: 120 }), M.orange);
  // placa trasera
  const backF = (u, v) => rmax(Math.abs(u) - shieldW(v) + 6, Math.abs(v - 318) - 84, 22);
  add(torsoN, decal(torso, TB, backF, null, [0, 318], { t: 6, rb: 3.6, nb: 3, ni: 5, N: 96 }), M.white);

  // cintura + pelvis
  add(hips, (() => { const g = lathe([[66, 207], [93, 207], [97, 222], [93, 238], [66, 238]], [0, 6, 8, 6, 0], 40); g.scale(1, 1, .8); return g; })(), M.orange);
  const pelvis = star([0, 200, 0], (x, y, z) => {
    const r = Math.hypot(x, y, z) || 1, up = sstep(-.2, .2, y / r), m = lerp(2.3, 4, up);
    return Math.pow(pw(x / 86, 2.4) + pw(z / 64, 2.4), m / 2.4) + pw(y / lerp(50, 24, up), m);
  });
  add(hips, starGeo(pelvis, 40, uniform(22), { ext: [86, 40, 64], ex: [2.4, 2.6] }), M.white);

  // ══════════ BRAZOS ══════════
  const arms = {};
  for (const sd of [-1, 1]) {
    const X = sd * 142, inward = -sd;
    const sh = node(torsoN, [X, 372, 0]); sh.rotation.order = 'YXZ';
    const dome = star([X, 369, 0], (x, y, z) => pw(x / 33, 2.2) + pw(y / 31, 2.2) + pw(z / 34, 2.2));
    add(sh, starGeo(dome, 30, uniform(16)), M.orange);
    add(sh, lathe([[0, 321], [16, 321], [18.5, 330], [18.5, 356], [0, 356]], [0, 5, 4, 3, 0], 24).translate(X, 0, 0), M.white);
    add(sh, new T.SphereGeometry(17.5, 20, 12).translate(X, 318, 0), M.dark);
    const el = node(sh, [X, 318, 0]); el.rotation.order = 'YXZ';
    // antebrazo: perfil suave tipo huevo (sin tramos rectos que hagan bandas en los reflejos)
    const fa = [[0, 228], [38.5, 228], [41.6, 229.2], [42.8, 231.8], [43, 235]];
    for (let k = 0; k <= 22; k++) { const f = k / 22 * Math.PI / 2; fa.push([43 * pw(Math.cos(f), 2 / 3.2), 242 + 77 * pw(Math.sin(f), 2 / 3.2)]); }
    add(el, new T.LatheGeometry(fa.map(([r, y]) => new T.Vector2(r, y)), 34).translate(X, 0, 0), M.orange);
    add(el, lathe([[0, 199], [40, 199], [43, 207], [43, 228], [0, 228]], [0, 7, 4, 3.5, 0], 34).translate(X, 0, 0), M.pink);
    const wr = node(el, [X, 199, 0]);
    // mano: palma blanca + 3 dedos oscuros segmentados que se curvan hacia el cuerpo + pulgar oscuro
    add(wr, new RoundedBoxGeometry(31, 48, 35, 4, 11).translate(X, 178, 0), M.white);
    const joints = [];
    for (const [fz, len] of [[11.5, 1], [0, 1.06], [-11.5, .94]]) {
      let parent = node(wr, [X + inward * 3, 160, fz]), y0 = 160;
      parent.rotation.z = inward * .22; joints.push([parent, inward * .22]);
      for (const [L, ang] of [[17, .32], [15, .5], [12, .45]]) {
        const l = L * len, x0 = X + inward * 3;
        add(parent, new T.CapsuleGeometry(6.6, l, 2, 10).translate(x0, y0 - l / 2, fz), M.dark);
        const nx = node(parent, [x0, y0 - l, fz]); nx.rotation.z = inward * ang; joints.push([nx, inward * ang]); parent = nx; y0 -= l;
      }
    }
    const tx = X + inward * 13;
    const th = node(wr, [tx, 186, 6]); th.rotation.set(-.3, 0, inward * .75);
    add(th, new T.CapsuleGeometry(7.2, 15, 2, 10).translate(tx, 186 - 10, 6), M.dark);
    const th2 = node(th, [tx, 167, 6]); th2.rotation.z = inward * .35;
    add(th2, new T.CapsuleGeometry(6.6, 12, 2, 10).translate(tx, 167 - 7.5, 6), M.dark);
    wr.scale.setScalar(1.15); wr.rotation.order = 'ZYX'; const L = sd < 0 ? 'R' : 'L'; sh.name = 'shoulder' + L; el.name = 'elbow' + L; wr.name = 'wrist' + L;
    arms[sd] = { sh, el, wr, joints };
  }

  // ══════════ PIERNAS ══════════
  const legs = {};
  for (const sd of [-1, 1]) {
    const X = sd * 66;
    const hp = node(hips, [X, 172, 0]);
    add(hp, new T.SphereGeometry(26, 20, 12).translate(X, 172, 0), M.dark);
    add(hp, lathe([[0, 118], [29, 118], [31, 126], [31, 160], [27, 168], [0, 168]], [0, 3, 3, 4, 0], 30).translate(X, 0, 0), M.white);
    const kn = node(hp, [X, 122, 0]);
    add(kn, lathe([[0, 112], [32, 112], [33.5, 119], [33.5, 133], [0, 136]], [0, 2, 3, 4, 0], 30).translate(X, 0, 0), M.dark);
    const boot = star([X, 77, 4], (x, y, z) => { const k = sstep(40, -40, y), a = lerp(36, 49, k), c = lerp(39, 52, k); return Math.pow(pw(x / a, 2.3) + pw(z / c, 2.3), 5 / 2.3) + pw(y / 47, 5); });
    const bg = starGeo(boot, 40, uniform(24), { ext: [44, 47, 46], ex: [2.3, 4] });
    { const p = bg.attributes.position, col = [], cA = new T.Color('#cc0a5a'), cB = new T.Color('#ec5a00'), c = new T.Color();
      for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i); c.copy(cA).lerp(cB, sstep(84, 124, y + .12 * z)); col.push(c.r, c.g, c.b); }
      bg.setAttribute('color', new T.Float32BufferAttribute(col, 3)); }
    add(kn, bg, M.boot);
    const pad = star([X + sd * 10, 101, 42], (x, y, z) => pw(x / 22, 3) + pw(y / 33, 3) + pw(z / 11, 2.2));
    add(kn, starGeo(pad, 28, uniform(16), { ext: [22, 33, 11], ex: [3, 3] }), M.orange);
    const ft = node(kn, [X, 30, 0]); ft.rotation.y = sd * .22;
    const shoe = (cx, cy, cz, a, b, c, mb = 7) => star([cx, cy, cz], (x, y, z) => { const r = Math.hypot(x, y, z) || 1, m = lerp(mb, 2.4, sstep(-.3, .3, y / r)); return Math.pow(pw(x / a, 2.5) + pw(z / c, 2.5), m / 2.5) + pw(y / b, m); });
    add(ft, starGeo(shoe(X, 21, 20, 45, 22, 64), 36, uniform(16), { ext: [45, 22, 64], ex: [2.5, 3] }), M.white);
    add(ft, starGeo(shoe(X, 21, 54, 47, 17, 32), 36, uniform(14), { ext: [47, 17, 32], ex: [2.5, 3] }), M.orange);
    const sole = star([X, 6, 20], (x, y, z) => Math.pow(pw(x / 48, 2.6) + pw(z / 67, 2.6), 8 / 2.6) + pw(y / 6.5, 8));
    add(ft, starGeo(sole, 40, uniform(10), { ext: [48, 6.5, 67], ex: [2.6, 8] }), M.dark);
    legs[sd] = { hp, kn, ft };
  }

  // pose de reposo
  for (const sd of [-1, 1]) { legs[sd].hp.rotation.z = sd * .085; legs[sd].ft.rotation.z = -sd * .085; }
  root.scale.setScalar(1 / H);
  root.traverse(o => { if (o.isMesh) o.frustumCulled = false; });

  function animate(t, opt = {}) {
    const w = clamp(opt.wave || 0, 0, 1), we = w * w * (3 - 2 * w), calm = 1 - .6 * we;
    const br = Math.sin(t * 2.1);
    // respiración: el cuerpo sube y baja levemente, el pecho no se deforma
    hips.position.y = 172 + br * 1.2;
    torsoN.rotation.x = br * .012; torsoN.position.y = 64 + br * .6;
    torsoN.rotation.y = .03 * Math.sin(t * .55) * calm;
    // mirada
    headN.rotation.order = 'YXZ';
    headN.rotation.y = (.2 * Math.sin(t * .55) + .05 * Math.sin(t * 1.37)) * calm - we * .1;
    headN.rotation.x = .045 * Math.sin(t * .8 + 1) - br * .01;
    headN.rotation.z = .03 * Math.sin(t * .47 + 2) * calm + we * .045;
    // balanceo de brazos
    for (const sd of [-1, 1]) {
      const A = arms[sd], ph = sd < 0 ? 0 : Math.PI;
      const swing = Math.sin(t * 1.4 + ph) * .1;
      A.sh.rotation.set(swing, 0, sd * (.42 + .03 * Math.sin(t * 1.4 + 1.2 + ph)));
      A.el.rotation.set(-.1 - .05 * Math.sin(t * 1.4 + ph + .6), 0, -sd * .33);
      A.wr.rotation.set(0, 0, 0);
      for (const [n, r] of A.joints) n.rotation.z = r;
    }
    // saludo con el brazo derecho (x<0): brazo arriba y adelante, antebrazo inclinado hacia afuera, mano abierta que oscila
    if (we > 0) {
      const A = arms[-1], osc = Math.sin(t * 9);
      A.sh.rotation.x = lerp(A.sh.rotation.x, 0, we);
      A.sh.rotation.y = lerp(0, .2, we);
      A.sh.rotation.z = lerp(A.sh.rotation.z, -1.45, we);
      A.el.rotation.x = lerp(A.el.rotation.x, 0, we);
      A.el.rotation.z = lerp(A.el.rotation.z, -1.05 + .12 * osc, we);
      A.wr.rotation.y = lerp(0, -Math.PI / 2, we);
      A.wr.rotation.z = lerp(0, .32 * osc, we);
      for (const [n, r] of A.joints) n.rotation.z = r * (1 - .8 * we);
    }
  }
  animate(0, { wave: 0 });
  return { root, animate, parts: { head: headN, torso: torsoN, hips }, screen };
}

// Hapee · MAQUETA «el robot recorre el home» (25-11-2026). No está en el home publicado.
// El robot del arcade sale del anillo del hero y acompaña TODO el scroll: se para junto a cada sección,
// mira, señala, habla, y viaja entre secciones caminando (el scroll mueve sus piernas) o con propulsores.
// Modos (?modo=): mixto (por omisión: camina en el piso y vuela entre secciones) · caminar · propulsores.
// Lienzo fijo a pantalla completa con pointer-events:none: nunca tapa clics. Con prefers-reduced-motion,
// sin WebGL o en equipo modesto no se carga nada y el home queda igual que el publicado.
import { kit, renderer, robot, particulas, propulsores, luces } from './robokit.js?v=1';

const q = new URLSearchParams(location.search);
const MODO = ['mixto', 'caminar', 'propulsores'].includes(q.get('modo')) ? q.get('modo') : 'mixto';
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = x => { x = cl(x, 0, 1); return x * x * (3 - 2 * x); };
const io = x => { x = cl(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

// Paradas en el orden del home. «burb» = globo corto (sin cifras); «cta» = el globo lleva enlace a la agenda real.
const PARADAS = [
  { sel: '.hero img.hero-robot', tipo: 'hero', pose: 'saluda', burb: '¡Hola! Soy Hapee. Bajemos juntos.' },
  { sel: '.video-section', pose: 'apunta', burb: 'Así trabajo, en un minuto y medio.' },
  { sel: '.stats', pose: 'celebra' },
  { sel: '#como', pose: 'piensa' },
  { sel: '#hapee-chat', pose: 'habla', burb: 'Pruébame aquí mismo.' },
  { sel: '#plataforma', pose: 'apunta' },
  { sel: '#integraciones', pose: 'apunta', burb: 'Me conecto con lo que ya usas.' },
  { sel: '#reemplaza', pose: 'piensa' },
  { sel: '#ahorro', pose: 'apunta' },
  { sel: '#planes', pose: 'apunta', burb: '¿Dudas entre planes? Lo vemos en la demo.', cta: 1 },
  { sel: '.custom-widget', pose: 'saluda' },
  { sel: '.brands', pose: 'celebra' },
  { sel: '#faq', pose: 'piensa', burb: '¿Otra duda? Escríbenos.' },
  { sel: 'footer.footer', tipo: 'pie', pose: 'celebra', burb: 'Te espero en la demo.', cta: 1 }
];

function webglOk() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }
const conn = navigator.connection || {};
const MODESTO = !!conn.saveData || (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;

function estilo() {
  const s = document.createElement('style');
  s.textContent = `
#hx-robo{position:fixed;inset:0;width:100vw;height:100vh;height:100lvh;pointer-events:none;z-index:60;opacity:0;transition:opacity .5s ease}
html.hx-on #hx-robo{opacity:1}
html.hx-on .hero img.hero-robot,html.hx-on .hero .hr-live,html.hx-on .ctaf .ctaf-robot{opacity:0!important;transition:opacity .35s ease .15s}
.hx-burb{position:fixed;left:0;top:0;z-index:61;max-width:230px;padding:11px 15px;border-radius:16px 16px 16px 4px;background:#fff;color:#1a1a1a;
 font:700 14px/1.3 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 12px 34px rgba(8,8,8,.18);pointer-events:none;opacity:0;
 transform:translate(-50%,-100%) translateY(8px) scale(.96);transition:opacity .25s ease,transform .25s ease;will-change:transform}
.hx-burb.der{border-radius:16px 16px 4px 16px}
.hx-burb.on{opacity:1;transform:translate(-50%,-100%) translateY(0) scale(1)}
.hx-burb.on.cta{pointer-events:auto}
.hx-burb a{display:inline-block;margin-top:8px;padding:8px 13px;border-radius:999px;color:#fff;text-decoration:none;font-weight:800;font-size:13px;
 background:linear-gradient(135deg,#FA5000,#CD2349);min-height:36px;line-height:20px}
html.dark .hx-burb{background:#1a1a1a;color:#F5F3F0}
.hx-modo{position:fixed;left:12px;bottom:12px;z-index:62;display:flex;gap:4px;align-items:center;padding:5px;border-radius:999px;background:rgba(8,8,8,.82);
 backdrop-filter:blur(8px);font:700 12px/1 'Plus Jakarta Sans',system-ui,sans-serif;color:#F5F3F0}
.hx-modo span{padding:0 8px 0 9px;opacity:.7}
.hx-modo a{color:#F5F3F0;text-decoration:none;padding:9px 11px;border-radius:999px;min-height:32px;display:inline-flex;align-items:center}
.hx-modo a.on{background:linear-gradient(135deg,#FA5000,#CD2349)}
@media(max-width:600px){.hx-burb{max-width:190px;font-size:13px}.hx-modo span{display:none}}`;
  document.head.appendChild(s);
}

function selector() {
  const d = document.createElement('div'); d.className = 'hx-modo';
  d.innerHTML = '<span>Maqueta · recorrido</span>' + [['mixto', 'Mixto'], ['caminar', 'Caminar'], ['propulsores', 'Propulsores']]
    .map(([k, n]) => `<a href="?modo=${k}"${k === MODO ? ' class="on"' : ''}>${n}</a>`).join('') + '<a href="/propuesta-home-v3k9/robot/casos/">Casos</a>';
  document.body.appendChild(d);
}

async function arrancar() {
  estilo(); selector();
  const cv = document.createElement('canvas'); cv.id = 'hx-robo'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const burb = document.createElement('div'); burb.className = 'hx-burb'; burb.setAttribute('aria-live', 'polite'); document.body.appendChild(burb);

  const K = await kit(), { THREE } = K;
  const R = renderer(K, cv);
  const S = new THREE.Scene(); luces(K, S);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 60); cam.position.set(0, 0, 10);
  const bot = await robot(K); S.add(bot.g);
  const part = particulas(K, 700); S.add(part.pts);
  const jet = propulsores(K, bot, part);
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(.5, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2 + .35; S.add(sombra);

  const V = { w: 0, h: 0, k: 1, movil: false };
  function medir() {
    V.w = innerWidth; V.h = innerHeight; V.movil = V.w < 760;
    const pr = Math.min(V.movil ? 1.5 : 1.75, devicePixelRatio || 1);
    R.setPixelRatio(pr); R.setSize(V.w, V.h, false);
    cam.aspect = V.w / V.h; cam.updateProjectionMatrix();
    V.k = 2 * 10 * Math.tan(15 * Math.PI / 180) / V.h; // mundo por píxel en el plano z = 0
    part.mat.uniforms.esc.value = V.h * pr * .5;
    medirParadas();
  }

  // ── paradas: posición en el documento y lado ──
  let P = [];
  function medirParadas() {
    const out = []; let lado = 1;
    for (const d of PARADAS) {
      const el = document.querySelector(d.sel); if (!el) continue;
      const r = el.getBoundingClientRect(); if (!r.height) continue;
      const top = r.top + scrollY;
      let ancla;
      if (d.tipo === 'hero') ancla = top + r.height * .5;
      else if (d.tipo === 'pie') ancla = top;
      else ancla = top + Math.min(r.height * .38, V.h * .42);
      if (!d.tipo) lado = -lado;
      // margen libre a los lados del contenido (para no tapar texto en escritorio)
      const cont = el.querySelector('.container,.wrap,.inner,.hn-wrap,[class*="container"]') || el;
      const cr = cont.getBoundingClientRect();
      out.push({ ...d, el, ancla, lado, margen: Math.max(0, cr.left) });
    }
    out.sort((a, b) => a.ancla - b.ancla);
    // la última parada tiene que ser alcanzable con el scroll (el foco llega como máximo a alto total − media pantalla)
    const maxF = document.documentElement.scrollHeight - V.h * .5 - 2;
    for (let i = out.length - 1; i >= 0; i--) { const tope = i === out.length - 1 ? maxF : out[i + 1].ancla - 40; if (out[i].ancla > tope) out[i].ancla = tope; }
    P = out;
  }

  const ALTO = () => V.movil ? Math.min(112, V.h * .14) : Math.min(250, V.h * .27);
  // posición de reposo de una parada, en píxeles de pantalla: x centro, y = pies, h = alto
  function reposo(p) {
    if (p.tipo === 'pie') {
      const r = p.el.getBoundingClientRect(), h = ALTO();
      return { x: V.movil ? V.w - h * .45 : V.w * .8, y: Math.min(r.top + 2, V.h - 8), h, cara: -.35 };
    }
    if (p.tipo === 'hero' || p.tipo === 'cta') {
      const r = p.el.getBoundingClientRect();
      const h = Math.max(60, r.height * (p.tipo === 'hero' ? .97 : 1.1));
      return { x: r.left + r.width / 2, y: r.bottom - r.height * .015, h, cara: 0 };
    }
    const h = ALTO(), wR = h * .62;
    let x;
    if (p.margen > wR + 24) x = p.lado < 0 ? p.margen / 2 : V.w - p.margen / 2;
    else x = p.lado < 0 ? wR * .62 + 6 : V.w - wR * .62 - 6;
    if (!V.movil && x > V.w / 2) x = Math.min(x, V.w - 96 - wR * .5); // deja libre el botón flotante de WhatsApp
    const piso = V.h - (V.movil ? 76 : 26);
    const y = MODO === 'propulsores' ? (V.movil ? V.h * .78 : V.h * .64) : piso;
    return { x, y, h, cara: p.lado < 0 ? .55 : -.55 };
  }

  // esquivar CTA: si un botón visible cae bajo el robot, se cambia de lado en esa parada
  const BOTONES = [...document.querySelectorAll('a.btn, button.btn, .btn')];
  function choca(px, py, h) {
    const x0 = px - h * .34, x1 = px + h * .34, y0 = py - h, y1 = py;
    for (const b of BOTONES) {
      const r = b.getBoundingClientRect();
      if (r.bottom < 0 || r.top > V.h || !r.width) continue;
      if (r.right > x0 && r.left < x1 && r.bottom > y0 && r.top < y1) return true;
    }
    return false;
  }
  const flip = new Map();

  // ── estado ──
  const E = { x: 0, y: 0, h: 100, yaw: 0, fuerza: 0, tBot: 0, ult: -1, enVuelo: false, burbI: -1, mouseX: .5, mouseY: .5, posePara: -1, giro: 0, vx: 0, vy: 0, bank: 0 };
  addEventListener('pointermove', e => { E.mouseX = e.clientX / V.w; E.mouseY = e.clientY / V.h; }, { passive: true });

  function objetivo() {
    const foco = scrollY + V.h * .5;
    if (!P.length) return null;
    let i = 0; while (i < P.length - 1 && P[i + 1].ancla <= foco) i++;
    const a = P[i], b = P[Math.min(i + 1, P.length - 1)];
    const u = a === b ? 0 : cl((foco - a.ancla) / (b.ancla - a.ancla), 0, 1);
    const A = reposo(a), B = reposo(b);
    for (const [p, X] of [[a, A], [b, B]]) {
      if (p.tipo) continue;
      const key = p.sel; let f = flip.get(key);
      if (f === undefined) { f = choca(X.x, X.y, X.h); flip.set(key, f); }
      if (f) { X.x = V.w - X.x; X.cara = -X.cara; }
    }
    // tramo: reposo en a hasta u=.42, viaje hasta .9, llegada en b
    const v = ss((u - .42) / .48);
    return { i, a, b, A, B, u, v };
  }
  // las paradas se re-evalúan si cambia el layout (imágenes que cargan, acordeones)
  let ultMed = 0;
  addEventListener('resize', () => { flip.clear(); medir(); });
  new ResizeObserver(() => { if (performance.now() - ultMed > 400) { ultMed = performance.now(); flip.clear(); medirParadas(); } }).observe(document.body);

  function mundo(px, py) { return [(px - V.w / 2) * V.k, (V.h / 2 - py) * V.k]; }

  function globo(o) {
    const enReposo = o.u < .36 || o.u > .97;
    const p = o.u > .97 ? o.b : o.a;
    const idx = P.indexOf(p);
    const mostrar = enReposo && p.burb && E.fuerza < .3;
    if (mostrar && E.burbI !== idx) {
      burb.innerHTML = p.burb + (p.cta ? '<br><a href="/agenda-tu-demo">Agendar demo</a>' : '');
      burb.classList.toggle('cta', !!p.cta);
      E.burbI = idx;
    }
    burb.classList.toggle('on', !!mostrar);
    if (mostrar) {
      const der = E.x > V.w * .55;
      burb.classList.toggle('der', der);
      const bw = Math.min(V.movil ? 190 : 230, burb.offsetWidth || 200);
      let bx = E.x + (der ? -E.h * .2 : E.h * .2);
      bx = cl(bx, bw / 2 + 8, V.w - bw / 2 - 8);
      const by = Math.max(70 + (burb.offsetHeight || 40), E.y - E.h * 1.02);
      burb.style.left = bx + 'px'; burb.style.top = by + 'px';
    }
  }

  let t = 0, prev = performance.now(), primero = true, vivo = true;
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { prev = performance.now(); requestAnimationFrame(loop); } });

  function loop(now) {
    if (document.hidden) return;
    const dt = Math.min(.05, (now - prev) / 1000); prev = now; t += dt;
    const o = objetivo();
    if (o) {
      const { A, B, v, a, b } = o;
      // destino en pantalla según el modo
      let tx, ty, th, fuerza = 0, salto = 0, viaje = v > 0 && v < 1;
      const dist = Math.hypot(B.x - A.x, B.y - A.y);
      th = lerp(A.h, B.h, v);
      if (MODO === 'caminar') {
        // camina por el piso; si hay desnivel (hero, cierre) da un salto en arco
        tx = lerp(A.x, B.x, v);
        const dy = B.y - A.y;
        if (Math.abs(dy) > 30) { ty = lerp(A.y, B.y, io(v)) - Math.sin(Math.PI * v) * Math.min(260, Math.abs(dy) * .35 + 80); salto = Math.sin(Math.PI * v); }
        else ty = lerp(A.y, B.y, v);
      } else {
        // vuelo en arco: sube, se acerca a la cámara a mitad de camino y baja
        const alto = Math.min(V.h * .42, 120 + dist * .35);
        tx = lerp(A.x, B.x, io(v));
        ty = lerp(A.y, B.y, io(v)) - Math.sin(Math.PI * v) * alto;
        th *= 1 + .28 * Math.sin(Math.PI * v);
        fuerza = viaje ? .55 + .45 * Math.sin(Math.PI * v) : 0;
        if (MODO === 'mixto' && viaje) fuerza *= ss(v / .08) ; // encendido rápido al despegar
      }
      if (MODO === 'propulsores') fuerza = Math.max(fuerza, .32); // flota siempre
      { const m = th * .38; tx = cl(tx, m, V.w - m); ty = Math.max(ty, th * 1.05 + 10); }  // nunca se sale de la pantalla
      // suavizado: el robot sigue al objetivo con inercia (si el scroll se detiene, termina el paso)
      if (primero) { E.x = tx; E.y = ty; E.h = th; primero = false; }
      const kf = 1 - Math.exp(-dt * (viaje ? 7 : 5));
      const ox = E.x, oy = E.y;
      E.x = lerp(E.x, tx, kf); E.y = lerp(E.y, ty, kf); E.h = lerp(E.h, th, 1 - Math.exp(-dt * 6));
      E.vx = (E.x - ox) / Math.max(dt, 1e-3); E.vy = (E.y - oy) / Math.max(dt, 1e-3);
      E.fuerza = lerp(E.fuerza, fuerza, 1 - Math.exp(-dt * 10));
      const dx = E.x - ox, vel = Math.abs(E.vx);

      // ── pose ──
      const enSuelo = MODO !== 'propulsores' && E.fuerza < .15 && salto < .15;
      const camina = enSuelo && vel > 18;
      const quieto = vel < 10 && Math.abs(E.vy) < 10;
      const parada = o.u > .97 ? b : a, idx = P.indexOf(parada);
      if (camina) {
        if (bot.st.pose !== 'corre') bot.pose('corre');
        // un ciclo de piernas (≈ 0,48 s del reloj del robot) por cada 1,15 alturas recorridas
        E.tBot += Math.abs(dx) / (E.h * 1.15) * .483 * .5;
      } else {
        E.tBot += dt;
        if (salto > .15) { if (bot.st.pose !== 'salta') bot.pose('salta'); }
        else if (!enSuelo && E.fuerza > .15) { if (bot.st.pose !== 'idle' && bot.st.pose !== 'apunta') bot.pose('idle'); }
        else if (quieto && E.posePara !== idx) { bot.pose(parada.pose, parada.pose === 'saluda' ? 2.4 : parada.pose === 'celebra' ? 1.8 : 0); E.posePara = idx; }
        else if (bot.st.pose === 'corre') bot.pose('idle');
      }
      if (!quieto) E.posePara = -1;

      // ── orientación: de perfil al caminar, inclinado al volar, de frente (hacia el contenido) en reposo ──
      const reposoCara = o.u > .97 ? B.cara : A.cara;
      let yaw = reposoCara;
      if (camina || (E.fuerza > .2 && vel > 30)) yaw = Math.sign(E.vx) * (camina ? 1.25 : .7);
      E.yaw = lerp(E.yaw, yaw, 1 - Math.exp(-dt * 8));
      E.bank = lerp(E.bank, cl(-E.vx / 1400, -.45, .45) * (E.fuerza > .2 ? 1 : 0), 1 - Math.exp(-dt * 6));
      // mirada: el cursor en escritorio, el contenido en celular
      bot.st.mira = quieto ? (V.movil ? -reposoCara * .4 : cl((E.mouseX - E.x / V.w) * 1.4, -.6, .6)) : 0;
      bot.st.miraY = quieto && !V.movil ? cl((E.mouseY - (E.y - E.h * .85) / V.h) * .6, -.3, .3) : 0;

      // ── a mundo ──
      const [wx, wy] = mundo(E.x, E.y), esc = E.h * V.k;
      const hover = MODO === 'propulsores' ? Math.sin(t * 2.2) * 6 * V.k : 0;
      bot.g.position.set(wx, wy + hover, 0);
      bot.g.scale.setScalar(esc);
      bot.g.rotation.set(E.fuerza > .2 ? cl(Math.abs(E.vx) / 2600, 0, .3) : 0, E.yaw, E.bank);
      bot.update(E.tBot, dt);
      // sombra en el piso (solo si hay piso: mixto/caminar)
      const pisoY = V.h - (V.movil ? 76 : 26);
      const altura = Math.max(0, pisoY - E.y);
      const [sx, sy] = mundo(E.x, pisoY);
      sombra.visible = MODO !== 'propulsores' && E.y > V.h * .4;
      sombra.position.set(sx, sy, -.2); sombra.scale.setScalar(esc * .42 * (1 - Math.min(.6, altura / 500)));
      sombra.material.opacity = .2 * (1 - Math.min(1, altura / 400));
      jet.paso(t, dt, E.fuerza, esc, { x: E.vx * V.k, y: -E.vy * V.k });
      // polvo al aterrizar (mixto) o al caer de un salto (caminar)
      const vuela = E.fuerza > .3 || salto > .3;
      if (E.enVuelo && !vuela && MODO !== 'propulsores') jet.polvo(esc);
      E.enVuelo = vuela;
      globo(o);
    }
    part.paso(dt);
    R.render(S, cam);
    if (vivo) requestAnimationFrame(loop);
  }

  medir();
  // la primera vez: aparece justo donde está el robot del hero y saluda
  requestAnimationFrame(n => { prev = n; loop(n); document.documentElement.classList.add('hx-on'); });
  window.__hx = { P: () => P, E, bot, modo: MODO };
}

function cuandoListo(fn) {
  let ya = false; const go = () => { if (ya) return; ya = true; fn(); };
  const pronto = () => { ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, go, { once: true, passive: true })); setTimeout(go, 1200); };
  if (document.readyState === 'complete') pronto(); else addEventListener('load', pronto, { once: true });
}

if (!REDUCE && !MODESTO && webglOk()) cuandoListo(() => arrancar().catch(e => console.error('[hx] robot', e)));

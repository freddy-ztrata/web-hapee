// Hapee · el robot recorre la página (PRODUCCIÓN desde el 25-11-2026, aprobado por Sebastián sobre la maqueta
// /propuesta-home-v3k9/robot/?modo=mixto). Modo mixto: camina por el piso y vuela con propulsores entre secciones.
// Se carga con <script type="module" src="/js/robot/recorrido.js?p=home|agenda&v=N"> al final del body (lo inyecta
// ~/Sites/web-dna/_build/hapee-home/robot_recorrido.py; quitarlo = vuelta atrás).
// Reglas: lienzo fijo con pointer-events:none (nunca captura clics); nunca en reposo encima de botones, formularios,
// iframes (calendario, maquetas) ni del botón de WhatsApp: si su lugar choca, se cambia de lado y, si también choca,
// se esconde; mientras se mueve, si pasa sobre algo de eso se vuelve casi transparente.
// Sin nada con prefers-reduced-motion, sin WebGL, Save-Data o equipo modesto. Si el equipo no da, baja la resolución
// y, si aun así no da, se apaga solo (el hero vuelve a su robot de siempre).
import { kit, renderer, robot, particulas, propulsores, luces } from './recorrido-kit.js?v=1';

const PAG = new URL(import.meta.url).searchParams.get('p') || 'home';
const GEN = PAG === 'gen';   // páginas sin paradas a medida: tramos de ~1 pantalla entre el encabezado y el pie
const LANG = (document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
const T = ({
  es: { hola: '¡Hola! Soy Hapee. Te acompaño.', fin: 'Te espero en la demo.', cta: 'Agendar demo', fiesta: '¡Listo! Nos vemos en la demo.' },
  en: { hola: "Hi! I'm Hapee. I'll walk you through.", fin: 'See you at the demo.', cta: 'Book a demo', fiesta: 'Done! See you at the demo.' },
  pt: { hola: 'Oi! Sou o Hapee. Vou com você.', fin: 'Te espero na demo.', cta: 'Agendar demo', fiesta: 'Pronto! Nos vemos na demo.' }
})[LANG] || null;
const TX = T || { hola: '¡Hola! Soy Hapee. Te acompaño.', fin: 'Te espero en la demo.', cta: 'Agendar demo', fiesta: '¡Listo! Nos vemos en la demo.' };
const AGENDA = LANG === 'en' || LANG === 'pt' ? '/' + LANG + '/agenda-tu-demo' : '/agenda-tu-demo';
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = x => { x = cl(x, 0, 1); return x * x * (3 - 2 * x); };
const io = x => { x = cl(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

// Paradas por página. «burb» = globo corto; «cta» = enlace del globo; «tipo»: hero (sale del robot del hero), pie.
const PARADAS = {
  home: [
    { sel: '.hero img.hero-robot', tipo: 'hero', pose: 'saluda', burb: '¡Hola! Soy Hapee. Bajemos juntos.' },
    { sel: '.video-section', pose: 'apunta', burb: 'Así trabajo, en un minuto y medio.' },
    { sel: '.stats', pose: 'celebra' },
    { sel: '#como', pose: 'piensa' },
    { sel: '#hapee-chat', pose: 'habla', burb: 'Pruébame aquí mismo.' },
    { sel: '#plataforma', pose: 'apunta' },
    { sel: '#integraciones', pose: 'apunta', burb: 'Me conecto con lo que ya usas.' },
    { sel: '#reemplaza', pose: 'piensa' },
    { sel: '#ahorro', pose: 'apunta' },
    { sel: '#planes', pose: 'apunta', burb: '¿Dudas entre planes? Lo vemos en la demo.', cta: ['Agendar demo', '/agenda-tu-demo'] },
    { sel: '.custom-widget', pose: 'saluda' },
    { sel: '.brands', pose: 'celebra' },
    { sel: '#faq', pose: 'piensa', burb: '¿Otra duda? Escríbenos.' },
    { sel: 'footer.footer', tipo: 'pie', pose: 'celebra', burb: 'Te espero en la demo.', cta: ['Agendar demo', '/agenda-tu-demo'] }
  ],
  agenda: [
    { sel: '#calendario', pose: 'apunta', burb: 'Elige aquí el día y la hora.', lado: -1 },
    { sel: '#conoce-hapee', pose: 'apunta' },
    { sel: '#casos', pose: 'celebra' },
    { sel: '#plataforma', pose: 'apunta' },
    { sel: '#hapee-chat', pose: 'habla' },
    { sel: '.stats', pose: 'celebra' },
    { sel: '.brands', pose: 'saluda' },
    { sel: '#faq', pose: 'piensa' },
    { sel: '.hn-fin', pose: 'apunta', burb: '¿Listo? Tu hora te espera arriba.', cta: ['Elegir mi hora', '#calendario'] },
    { sel: 'footer.footer', tipo: 'pie', pose: 'saluda' }
  ]
}[PAG] || [];
let cacheObs = null;
// lo que el robot nunca tapa en reposo
const PROHIBIDO = '.btn, a[href*="agenda"], iframe, form, input, textarea, select, button, video, #hapee-wa-fab, .hapee-wa, [data-hapee-calendar]';

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const conn = navigator.connection || {};
const MODESTO = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') || (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;
function webglOk() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

function estilo() {
  const s = document.createElement('style'); s.id = 'hx-robo-css';
  s.textContent = `
#hx-robo{position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:60;opacity:0;transition:opacity .5s ease}
html.hx-on #hx-robo{opacity:1}
html.hx-on .hero img.hero-robot,html.hx-on .hero .hr-live{opacity:0!important;transition:opacity .35s ease .15s}
.hx-burb{position:fixed;left:0;top:0;z-index:61;width:max-content;max-width:230px;padding:11px 15px;border-radius:16px 16px 16px 4px;background:#fff;color:#1a1a1a;
 font:700 14px/1.3 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 12px 34px rgba(8,8,8,.18);pointer-events:none;opacity:0;
 transform:translate(-50%,-100%) translateY(8px) scale(.96);transition:opacity .25s ease,transform .25s ease;will-change:transform}
.hx-burb.der{border-radius:16px 16px 4px 16px}
.hx-burb.on{opacity:1;transform:translate(-50%,-100%) translateY(0) scale(1)}
.hx-burb.on.cta{pointer-events:auto}
.hx-burb a{display:inline-block;margin-top:8px;padding:8px 14px;border-radius:999px;color:#fff;text-decoration:none;font-weight:800;font-size:13px;
 background:linear-gradient(135deg,#FA5000,#CD2349);min-height:36px;line-height:20px}
html.dark .hx-burb{background:#1a1a1a;color:#F5F3F0}
@media(max-width:600px){.hx-burb{max-width:180px;font-size:13px;padding:9px 12px}}`;
  document.head.appendChild(s);
}

async function arrancar() {
  estilo();
  const cv = document.createElement('canvas'); cv.id = 'hx-robo'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
  const burb = document.createElement('div'); burb.className = 'hx-burb'; burb.setAttribute('aria-live', 'polite'); document.body.appendChild(burb);
  burb.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    const h = a.getAttribute('href');
    if (h && h[0] === '#') { e.preventDefault(); const t = document.querySelector(h); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    try { window.gtag && gtag('event', 'robot_globo_cta', { pagina: PAG, destino: h }); } catch (er) {}
  });

  const K = await kit(), { THREE } = K;
  const TACTIL = matchMedia('(pointer:coarse)').matches;
  const esMovil = () => innerWidth < 760 || (TACTIL && innerHeight < 520);
  const V = { w: innerWidth, h: innerHeight, k: 1, movil: esMovil(), pr: 1, nav: 0 };
  const R = renderer(K, cv);
  const S = new THREE.Scene(); luces(K, S);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 60); cam.position.set(0, 0, 10);
  const bot = await robot(K); S.add(bot.g);
  // compila los shaders sin bloquear (KHR_parallel_shader_compile) antes del primer cuadro
  try { if (R.compileAsync) await R.compileAsync(S, cam); } catch (e) {}
  const part = particulas(K, V.movil || TACTIL ? 260 : 600); S.add(part.pts);
  const jet = propulsores(K, bot, part);
  let sombra = null;
  if (!V.movil && !TACTIL) {
    sombra = new THREE.Mesh(new THREE.CircleGeometry(.5, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2 + .35; S.add(sombra);
  }
  let calidad = 1;
  function medir() {
    V.w = innerWidth; V.h = innerHeight; V.movil = esMovil();
    const nv = document.querySelector('.nav'); V.nav = nv ? Math.max(0, nv.getBoundingClientRect().bottom) : 0;
    V.pr = Math.min(V.movil || TACTIL ? 1.25 : 1.5, devicePixelRatio || 1) * calidad;
    R.setPixelRatio(V.pr); R.setSize(V.w, V.h, false);
    cv.style.width = V.w + 'px'; cv.style.height = V.h + 'px';
    cam.aspect = V.w / V.h; cam.updateProjectionMatrix();
    V.k = 2 * 10 * Math.tan(15 * Math.PI / 180) / V.h;
    part.mat.uniforms.esc.value = V.h * V.pr * .5;
    medirParadas();
  }

  // ── paradas ──
  let P = [];
  function paradasGen() {
    const L = [], sy = scrollY;
    const hero = document.querySelector('.hero img.hero-robot');
    if (hero) L.push({ sel: '.hero img.hero-robot', el: hero, tipo: 'hero', pose: 'saluda', burb: TX.hola });
    const pie = document.querySelector('footer.footer') || document.querySelector('body > footer') || document.querySelector('footer');
    const cab = document.querySelector('.nav, header');
    const ini = hero ? ((hero.closest('section') || hero).getBoundingClientRect().bottom + sy) : ((cab ? cab.getBoundingClientRect().bottom : 0) + sy);
    const fin = pie ? pie.getBoundingClientRect().top + sy : document.documentElement.scrollHeight;
    const paso = Math.max(V.h * .9, 520), poses = ['apunta', 'piensa', 'celebra', 'apunta', 'saluda', 'piensa'];
    let n = 0;
    for (let y = ini; y < fin - 160; y += paso, n++) L.push({ k: 'r' + n, reg: [y, Math.min(fin, y + paso)], el: document.body, pose: poses[n % poses.length], burb: !hero && n === 0 ? TX.hola : null });
    const enAgenda = /agenda-tu-demo/.test(location.pathname);
    if (pie) L.push({ k: 'pie', sel: 'footer', el: pie, tipo: 'pie', pose: 'celebra', burb: TX.fin, cta: enAgenda ? null : [TX.cta, AGENDA] });
    return L;
  }
  function medirParadas() {
    const out = []; let lado = 1; cacheObs = null;
    const lista = GEN ? paradasGen() : PARADAS;
    const contGen = GEN ? (document.querySelector('main .ctn, main .container, article, .post, main, .ctn, .container') || document.body) : null;
    lista.forEach((d, idx) => {
      const el = d.el || document.querySelector(d.sel); if (!el) return;
      let top, alto;
      if (d.reg) { top = d.reg[0]; alto = d.reg[1] - d.reg[0]; }
      else { const r = el.getBoundingClientRect(); if (!r.height) return; top = r.top + scrollY; alto = r.height; }
      const ancla = d.tipo === 'hero' ? top + alto * .5 : d.tipo === 'pie' ? top : top + Math.min(alto * .38, V.h * .42);
      if (!d.tipo) lado = d.lado || -lado;
      const cont = contGen || el.querySelector('.ctn,.container,.wrap,.inner,[class*="container"]') || el;
      const q = { ...d, el, ancla: idx === 0 && !d.tipo ? 0 : ancla, lado, margen: Math.max(0, cont.getBoundingClientRect().left) };
      if (V.movil && d.tipo !== 'hero') {
        const vj = P.find(x => (d.k ? x.k === d.k : x.el === el));
        q.spots = lugaresLibres(el, out.length, vj && vj.spots, d.reg); q.vista = d.reg ? true : !!(vj && vj.vista);
      }
      out.push(q);
    });
    out.sort((a, b) => a.ancla - b.ancla);
    out.forEach((q, i) => (q.spots || []).forEach(sp => (sp.i = i)));
    SP = V.movil ? out.flatMap(q => q.spots || []) : [];
    out.forEach((q, i) => (q.spots || []).forEach(sp => { sp.i = i; sp.malo = MALOS.has(sp.k); }));
    out.forEach(q => { if (!q.__io && !q.reg) { q.__io = 1; ioS.observe(q.el); } });
    const maxF = document.documentElement.scrollHeight - V.h * .5 - 2;
    for (let i = out.length - 1; i >= 0; i--) { const tope = i === out.length - 1 ? maxF : out[i + 1].ancla - 40; if (out[i].ancla > tope) out[i].ancla = tope; }
    P = out;
  }

  const ALTO = () => V.movil ? Math.min(88, V.h * .11, V.w * .22) : Math.min(240, V.h * .26);

  // ── celular: lugar libre por sección ──
  // Obstáculos = líneas de texto reales (Range.getClientRects), imágenes y todo lo PROHIBIDO, en coordenadas de documento.
  // El robot se para en un hueco donde no toca nada, completo (sin recortes) y del lado izquierdo si se puede (a la
  // derecha está el botón de WhatsApp); el lugar viaja con la página, así que el texto no le pasa por debajo.
  function obstaculos(raiz) {
    const sy = scrollY, out = [];
    const tw = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, { acceptNode: n => /\S/.test(n.nodeValue) ? 1 : 2 });
    const rg = document.createRange();
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      const pe = n.parentElement; if (!pe || pe.closest('script,style,noscript')) continue;
      rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) if (r.width > 1 && r.height > 1) out.push([r.left - 6, r.top + sy - 6, r.right + 6, r.bottom + sy + 6]);
    }
    // obstáculos = texto, enlaces y botones, campos, iframes y videos (puede pararse sobre fondos e imágenes decorativas)
    raiz.querySelectorAll(PROHIBIDO + ', a, label, [role=button], [role=tab], select').forEach(e => {
      const r = e.getBoundingClientRect(); if (r.width > 4 && r.height > 4) out.push([r.left - 8, r.top + sy - 8, r.right + 8, r.bottom + sy + 8]);
    });
    // logos, insignias e íconos (imágenes chicas): también obstáculos; las imágenes grandes de fondo no
    raiz.querySelectorAll('img, svg, picture, video').forEach(e => {
      const r = e.getBoundingClientRect(); if (r.width > 4 && r.height > 4 && r.width < V.w * .6) out.push([r.left - 6, r.top + sy - 6, r.right + 6, r.bottom + sy + 6]);
    });
    // ventanas con contenido que cambia solo (chat de ejemplo, listas que se desplazan): cuentan enteras como obstáculo
    raiz.querySelectorAll('div,ul,ol,section').forEach(e => {
      if (e.clientHeight < 80) return;
      const cs = getComputedStyle(e);
      if (!/(auto|scroll)/.test(cs.overflowY) && !/(auto|scroll)/.test(cs.overflowX)) return;
      const r = e.getBoundingClientRect(); out.push([r.left - 8, r.top + sy - 8, r.right + 8, r.bottom + sy + 8]);
    });
    return out;
  }
  // todos los huecos de la sección donde el robot cabe completo sin tocar nada, separados ~media pantalla
  function lugaresLibres(el, iStop, viejos, reg) {
    let top, bot, obs;
    if (reg) { top = reg[0]; bot = reg[1]; cacheObs = cacheObs || obstaculos(document.body); obs = cacheObs.filter(o => o[3] > top - 200 && o[1] < bot + 200); }
    else { const r = el.getBoundingClientRect(); top = r.top + scrollY; bot = r.bottom + scrollY; obs = obstaculos(el); }
    const h = ALTO(), mw = h * .36;
    // 30 px libres sobre la cabeza: el aterrizaje baja desde ahí
    const libre = (x, y) => { const a = x - mw, b = x + mw, c = y - h - 30, d = y; for (const o of obs) if (o[2] > a && o[0] < b && o[3] > c && o[1] < d) return false; return true; };
    const out = [];
    let ult = -1e9;
    for (let y = top + h + 14; y <= bot - 6; y += 10) {
      if (y - ult < V.h * .42) continue;
      let lado = 0;
      if (libre(mw + 6, y)) lado = -1; else if (libre(V.w - mw - 6, y)) lado = 1;  // izquierda primero: a la derecha está WhatsApp
      if (!lado) continue;
      // conserva la clave del hueco equivalente de la medición anterior (si no, cada re-medición «movería» el destino)
      const eq = (viejos || []).find(v => v.lado === lado && Math.abs(v.y - y) < 90 && !out.some(o => o.k === v.k));
      const k = eq ? eq.k : iStop + ':' + Math.round(y) + ':' + lado;
      out.push({ k, x: lado < 0 ? mw + 6 : V.w - mw - 6, y, lado, i: iStop, primero: !out.length, malo: MALOS.has(k), obs: obs.filter(o => o[3] > y - h - 160 && o[1] < y + 160) });
      ult = y;
    }
    return out;
  }
  const PISO = () => V.h - (V.movil ? 82 : 26);   // en celular, por encima del botón flotante de WhatsApp
  function reposo(p) {
    if (p.tipo === 'pie') {
      const r = p.el.getBoundingClientRect(), h = ALTO();
      // de pie sobre el borde superior del pie de página; si ese borde ya salió por arriba, en el piso
      if (V.movil) return p.spot ? { x: p.spot.x, y: p.spot.y - scrollY, h, cara: p.spot.lado < 0 ? .5 : -.5, fijo: 1 } : { x: E.x, y: E.y, h, cara: 0, oculto: 1, fijo: 1 };
      return { x: V.w * .8, y: r.top > h + 90 ? Math.min(r.top + 2, PISO()) : PISO(), h, cara: -.35 };
    }
    if (p.tipo === 'hero') {
      const r = p.el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.bottom - r.height * .015, h: Math.max(60, r.height * .97), cara: 0 };
    }
    if (V.movil) {
      if (!p.spot) return { x: E.x || V.w / 2, y: E.y || V.h * .8, h: ALTO(), cara: 0, oculto: 1, fijo: 1 };
      return { x: p.spot.x, y: p.spot.y - scrollY, h: ALTO(), cara: p.spot.lado < 0 ? .6 : -.6, fijo: 1 };
    }
    const h = ALTO(), wR = h * .62;
    let x;
    if (p.margen > wR + 24) x = p.lado < 0 ? p.margen / 2 : V.w - p.margen / 2;
    else if (V.movil) x = p.lado < 0 ? wR * .2 : V.w - wR * .2;   // en celular se asoma desde el borde: tapa lo mínimo
    else x = p.lado < 0 ? wR * .62 + 6 : V.w - wR * .62 - 6;
    if (x > V.w / 2 && !V.movil) x = Math.min(x, V.w - 96 - wR * .5);
    return { x, y: PISO(), h, cara: p.lado < 0 ? (V.movil ? .9 : .55) : (V.movil ? -.9 : -.55) };
  }

  // ── zonas prohibidas visibles (IntersectionObserver mantiene la lista; los rectángulos se leen a demanda) ──
  const visibles = new Set();
  const ioZ = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? visibles.add(e.target) : visibles.delete(e.target)), { rootMargin: '80px' });
  const vigilar = () => document.querySelectorAll(PROHIBIDO).forEach(el => { if (!el.__hx && !cv.contains(el) && !burb.contains(el)) { el.__hx = 1; ioZ.observe(el); } });
  vigilar(); setTimeout(vigilar, 3000); setTimeout(vigilar, 9000);
  function choca(x, y, h) {
    const x0 = x - h * .3, x1 = x + h * .3, y0 = y - h * .98, y1 = y;
    for (const el of visibles) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.right > x0 && r.left < x1 && r.bottom > y0 && r.top < y1) return true;
    }
    return false;
  }
  // decide dónde reposa: su lado, el lado opuesto o escondido
  function ubicar(X, p) {
    if (p.tipo === 'hero' || X.fijo) return X;
    if (!choca(X.x, X.y, X.h)) return X;
    const Y = { ...X, x: V.w - X.x, cara: -X.cara };
    if (!choca(Y.x, Y.y, Y.h)) return Y;
    return { ...X, oculto: 1 };
  }

  const E = { x: 0, y: 0, h: 100, yaw: 0, fuerza: 0, tBot: 0, enVuelo: false, burbI: -1, mouseX: .5, mouseY: .5, posePara: -1, vx: 0, vy: 0, bank: 0, op: 1, fiesta: 0 };
  addEventListener('pointermove', e => { E.mouseX = e.clientX / V.w; E.mouseY = e.clientY / V.h; }, { passive: true });

  let SP = [];
  const MALOS = new Set();   // huecos que resultaron ocupados (contenido animado): no se vuelven a usar
  const ioS = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || !V.movil) return;
    const q = P.find(x => x.el === e.target && !x.reg); if (!q || q.tipo === 'hero') return;
    clearTimeout(q.__t); q.__t = setTimeout(() => {
      const i = P.indexOf(q); if (i < 0) return;
      q.spots = lugaresLibres(q.el, i, q.spots); q.vista = true;  // medida ya con la sección en pantalla (animaciones de entrada terminadas)
      SP = P.flatMap(x => x.spots || []);

    }, 1000);
  }), { rootMargin: '-12% 0px' });
  function objetivoMovil() {
    // hero: mientras el robot del hero esté a la vista, ahí
    const h0 = P[0] && P[0].tipo === 'hero' ? P[0] : null;
    if (h0) { const r = h0.el.getBoundingClientRect(); if (r.bottom - r.height * .45 > V.nav) return { p: h0, X: reposo(h0), key: h0 }; }
    const h = ALTO(), lo = V.nav + h + 12, hi = V.h - 26, ideal = V.h * .7;
    const ys = sp => sp.y - scrollY;
    // identidad estable por clave: re-medir (animaciones, ResizeObserver) no debe reiniciar el viaje
    const prev = E.spotK ? SP.find(c => c.k === E.spotK) : null;
    const cur = prev && !prev.malo && ys(prev) >= V.nav + h + 24 && ys(prev) <= V.h - 10 ? prev : null;  // cambia de hueco ANTES de llegar a la barra
    let sp = cur;
    if (!sp) { let best = 1e9; for (const c of SP) { if (c.malo || !(P[c.i] && P[c.i].vista)) continue; const y = ys(c); if (y < lo || y > (c.lado > 0 ? hi - 90 : hi)) continue; const d = Math.abs(y - ideal); if (d < best) { best = d; sp = c; } } }
    // sin hueco a la vista: se esconde, pero sigue pegado a su último hueco (no se queda fijo con el texto pasándole por debajo)
    if (!sp) return { p: E.pq || P[0], X: { x: prev ? prev.x : E.x, y: prev ? ys(prev) : E.y, h, cara: 0, oculto: 1, fijo: 1 }, key: 'nada' };
    E.spot = sp; E.spotK = sp.k; const p = P[sp.i]; E.pq = p;
    return { p, X: { x: sp.x, y: ys(sp), h, cara: sp.lado < 0 ? .6 : -.6, fijo: 1 }, key: sp.k, spot: sp };
  }
  let cacheU = { t: -1 };
  function objetivo(fr) {
    if (!P.length) return null;
    const foco = scrollY + V.h * .5;
    let i = 0; while (i < P.length - 1 && P[i + 1].ancla <= foco) i++;
    const a = P[i], b = P[Math.min(i + 1, P.length - 1)];
    const u = a === b ? 0 : cl((foco - a.ancla) / (b.ancla - a.ancla), 0, 1);
    let A = reposo(a), B = reposo(b);
    // la detección de choques cuesta: cada 4 cuadros o si cambió de tramo
    if (fr % 4 === 0 || cacheU.i !== i) cacheU = { i, A: ubicar(A, a), B: ubicar(B, b) };
    A = { ...A, x: cacheU.A.x, cara: cacheU.A.cara, oculto: cacheU.A.oculto };
    B = { ...B, x: cacheU.B.x, cara: cacheU.B.cara, oculto: cacheU.B.oculto };
    return { a, b, A, B, u, v: ss((u - .42) / .48) };
  }
  addEventListener('resize', () => medir());
  let tMed = 0;
  let ultMedida = 0;
  new ResizeObserver(() => {
    if (tMed) return;
    tMed = setTimeout(() => { tMed = 0; ultMedida = performance.now(); medirParadas(); }, Math.max(0, 500 - (performance.now() - ultMedida)));
  }).observe(document.body);
  addEventListener('load', () => setTimeout(medirParadas, 300), { once: true });

  function mundo(px, py) { return [(px - V.w / 2) * V.k, (V.h / 2 - py) * V.k]; }

  function globo(p, enReposo, visible, spot) {
    const idx = P.indexOf(p);
    const txt = E.fiesta > 0 ? TX.fiesta : p.burb;
    const mostrar = visible && (E.fiesta > 0 || (enReposo && p.burb && !(V.movil && p.tipo === 'hero')));
    const clave = E.fiesta > 0 ? 'fiesta' : idx;
    if (mostrar && E.burbI !== clave) {
      burb.innerHTML = txt + (p.cta && !E.fiesta ? `<br><a href="${p.cta[1]}">${p.cta[0]}</a>` : '');
      burb.classList.toggle('cta', !!p.cta && !E.fiesta); E.burbI = clave; E.bp = null;
    }
    if (V.movil && !E.fiesta && p.tipo !== 'hero') {
      if (!mostrar || !spot || !spot.primero) { burb.classList.remove('on'); return; }
      // celular: el lugar del globo se decide una vez por parada contra los mismos obstáculos (no tapa texto ni botones)
      if (!E.bp || E.bp.k !== spot.k) E.bp = { k: spot.k, pos: lugarGlobo(spot) };
      const g = E.bp.pos;
      if (!g || E.op < .6) { burb.classList.remove('on'); return; }
      burb.classList.toggle('der', g.der);
      const gb = g.bot - scrollY, gh = burb.offsetHeight || 40;
      if (gb - gh < V.nav + 6 || gb > V.h - 8) { burb.classList.remove('on'); return; }  // nunca bajo la barra ni cortado abajo
      burb.style.left = g.cx + 'px'; burb.style.top = gb + 'px';
      if (fr % 20 === 10 && burb.classList.contains('on')) {
        const r = burb.getBoundingClientRect(); let mal = false; burb.style.pointerEvents = 'none';
        for (const fx of [.03, .25, .5, .75, .97]) for (const fy of [.1, .5, .9]) { if (tocaAlgo(r.left + r.width * fx, r.top + r.height * fy + 1, 2)) { mal = true; break; } }
        burb.style.pointerEvents = '';
        if (mal) { E.bp.pos = null; burb.classList.remove('on'); return; }
      }
      burb.classList.add('on');
      return;
    }
    burb.classList.toggle('on', !!mostrar);
    if (mostrar) {
      const der = E.x > V.w * .55; burb.classList.toggle('der', der);
      const bw = burb.offsetWidth || 200, bh = burb.offsetHeight || 40;
      let bx = cl(E.x + (der ? -E.h * .2 : E.h * .2), bw / 2 + 8, V.w - bw / 2 - 8);
      let by = Math.max(64 + bh, E.y - E.h * 1.02);
      // el globo tampoco puede tapar algo prohibido: si choca, no se muestra
      const r0 = { l: bx - bw / 2, r: bx + bw / 2, t: by - bh, b: by };
      for (const el of visibles) { if (burb.contains(el)) continue; const r = el.getBoundingClientRect(); if (r.width && r.right > r0.l && r.left < r0.r && r.bottom > r0.t && r.top < r0.b) { burb.classList.remove('on'); return; } }
      burb.style.left = bx + 'px'; burb.style.top = by + 'px';
    }
  }

  function tocaAlgo(x, y, h) {
    const mw = h * .34;
    for (const fx of [-1, -.5, 0, .5, 1]) for (const fy of [.04, .2, .36, .52, .68, .84, .98]) {
      const px = x + fx * mw, py = y - fy * h;
      if (px < 0 || py < 0 || px > V.w || py > V.h) continue;
      const el = document.elementFromPoint(px, py);
      if (el && el.closest && el.closest('.hx-burb')) continue;
      if (el && el.closest && el.closest(PROHIBIDO + ', a, label, [role=button], [role=tab]')) return true;
      if (el && /^(IMG|svg|path|PICTURE)$/i.test(el.tagName)) { const q = (el.closest('svg') || el).getBoundingClientRect(); if (q.width < V.w * .6) return true; }
      // texto bajo el punto: nodos de texto directos de los elementos apilados ahí (no depende de caretRangeFromPoint)
      const pila = document.elementsFromPoint(px, py);
      for (let j = 0; j < Math.min(5, pila.length); j++) {
        const e = pila[j]; if (e === cv || e.closest('.hx-burb')) continue;
        for (const n of e.childNodes) {
          if (n.nodeType !== 3 || !/\S/.test(n.nodeValue)) continue;
          const rg = document.createRange(); rg.selectNodeContents(n);
          for (const r of rg.getClientRects()) if (px >= r.left - 3 && px <= r.right + 3 && py >= r.top - 3 && py <= r.bottom + 3) return true;
        }
      }
    }
    return false;
  }

  function lugarGlobo(sp) {
    const bw = burb.offsetWidth || 180, bh = burb.offsetHeight || 40, h = ALTO(), mw = h * .36;
    const izq = sp.lado < 0;
    const cands = [
      // encima de la cabeza, cargado hacia el centro
      { cx: izq ? sp.x - mw + bw / 2 : sp.x + mw - bw / 2, bot: sp.y - h - 6, der: !izq },
      // al lado de la cabeza, hacia el centro
      { cx: izq ? sp.x + mw + 8 + bw / 2 : sp.x - mw - 8 - bw / 2, bot: sp.y - h * .45, der: !izq }
    ];
    for (const c of cands) {
      c.cx = cl(c.cx, bw / 2 + 8, V.w - bw / 2 - 8);
      const a = c.cx - bw / 2 - 4, b = c.cx + bw / 2 + 4, t0 = c.bot - bh - 4, t1 = c.bot + 4;
      let ok = true;
      for (const o of sp.obs) if (o[2] > a && o[0] < b && o[3] > t0 && o[1] < t1) { ok = false; break; }
      if (ok) return c;
    }
    return null;
  }

  // celebra cuando el calendario avisa que la cita quedó agendada (mismo mensaje que usa la conversión de la página)
  addEventListener('message', ev => {
    const d = ev.data;
    if (d && typeof d === 'object' && d.type === 'zentru_calendar_submitted') { E.fiesta = 4; bot.pose('celebra', 3.5); for (let i = 0; i < 3; i++) setTimeout(() => jet.polvo(E.h * V.k), i * 250); }
  });

  let t = 0, prev = performance.now(), primero = true, fr = 0, vivo = true, lentos = 0, muestras = 0;
  let enCurso = false;
  const reanudar = () => { if (vivo && !document.hidden && !enCurso) { enCurso = true; prev = performance.now(); requestAnimationFrame(loop); } };
  document.addEventListener('visibilitychange', reanudar);
  addEventListener('pageshow', e => { if (e.persisted) { primero = true; E.fase = 'reposo'; medirParadas(); reanudar(); } });
  window.__hx = { E, bot, P: () => P, SP: () => SP, pag: PAG, perf: { lentos: 0, cuadros: 0 } };

  function apagar() { // el equipo no da: se va y el hero recupera su robot
    vivo = false; burb.remove(); document.documentElement.classList.remove('hx-on');
    setTimeout(() => { cv.remove(); R.dispose(); }, 600);
    try { window.gtag && gtag('event', 'robot_apagado', { pagina: PAG }); } catch (er) {}
  }

  function loop(now) {
    if (!vivo || document.hidden) { enCurso = false; return; }
    const dtR = (now - prev) / 1000; prev = now;
    const dt = Math.min(.05, dtR); t += dt; fr++;
    // vigía de rendimiento: si los cuadros pasan de 45 ms, baja la resolución; si sigue, se apaga
    if (fr > 30) { muestras++; window.__hx.perf.cuadros = muestras; if (dtR > .045) { lentos++; window.__hx.perf.lentos++; } }
    if (muestras === 180) { if (lentos > 90) { if (calidad > .7) { calidad = .7; medir(); muestras = lentos = 0; } else return apagar(); } else muestras = lentos = 0; }
    const o = !P.length ? null : V.movil ? objetivoMovil() : objetivo(fr);
    if (o && (o.p || o.a)) {
      // Destino = la parada más cercana al foco. El viaje es POR TIEMPO (no por scroll): despega, vuela en arco,
      // aterriza un poco antes y camina los últimos pasos. Así nunca queda flotando a media pantalla sobre el texto.
      const p = o.p || (o.u >= .5 ? o.b : o.a), X = o.X || (o.u >= .5 ? o.B : o.A), idx = P.indexOf(p), clave = o.key || p;
      if (primero) { E.x = X.x; E.y = X.y; E.h = X.h; E.dest = clave; E.fase = 'reposo'; primero = false; }
      if (E.dest !== clave && !(clave === 'nada')) {
        const d = Math.hypot(X.x - E.x, X.y - E.y);
        E.dest = clave; E.t0 = t; E.sx = E.x; E.sy = E.y; E.sh = E.h; E.syDoc = E.y + scrollY;
        const anclado = !!p.tipo;  // hero/pie: aterriza justo ahí, sin caminar
        E.camina = !anclado && Math.abs(X.y - E.y) < 24 && d < X.h * 1.6;
        E.fase = V.movil ? 'salta' : E.camina ? 'camina' : 'vuela';
        E.dur = E.camina ? d / (X.h * 1.7) : cl(.75 + d / 1500, .8, 1.5);
        E.dentro = anclado || X.fijo ? 0 : (X.x < V.w / 2 ? 1 : -1) * X.h * .75; // aterriza hacia el centro y camina a su sitio
        E.alto = Math.min(V.h * .32, 80 + d * .28);
      }
      let tx = X.x, ty = X.y, th = X.h, fuerza = 0, camina = false;
      if (E.fase === 'salta') {
        // celular: no cruza el contenido. Despega en su sitio desvaneciéndose y aterriza en el nuevo hueco apareciendo
        const v = (t - E.t0) / .85;
        if (v < .4) { const e = ss(v / .4); tx = E.sx; ty = E.syDoc - scrollY - 22 * e; /* el despegue viaja con la página */ th = E.sh; fuerza = .95; E.vis = 1 - e; }
        else { const u2 = cl((v - .4) / .6, 0, 1); ty = X.y - 26 * (1 - io(u2)); fuerza = .95 * (1 - ss((u2 - .72) / .28)); E.vis = ss(u2 / .55); }
        if (v >= 1) { E.fase = 'reposo'; E.vis = 1; jet.polvo(th * V.k); }
        E.vis = Math.min(E.vis, cl((ty - th - V.nav) / 30, 0, 1), cl((V.h - ty + 10) / 30, 0, 1));  // nunca bajo la barra ni cortado abajo
      } else if (E.fase === 'vuela') {
        const v = cl((t - E.t0) / E.dur, 0, 1), e = io(v);
        const lx = X.x + E.dentro;
        tx = lerp(E.sx, lx, e); ty = lerp(E.sy, X.y, e) - Math.sin(Math.PI * v) * E.alto; th = lerp(E.sh, X.h, e) * (1 + (V.movil ? .1 : .22) * Math.sin(Math.PI * v));
        fuerza = (.55 + .45 * Math.sin(Math.PI * v)) * ss(v / .1) * (1 - ss((v - .88) / .12));
        if (v >= 1) { E.fase = E.dentro ? 'camina' : 'reposo'; E.t0 = t; E.sx = lx; E.sy = X.y; E.dur = Math.abs(E.dentro) / (X.h * 1.5); }
      } else if (E.fase === 'camina') {
        const v = cl((t - E.t0) / Math.max(.05, E.dur), 0, 1);
        tx = lerp(E.sx, X.x, v); ty = X.y; camina = v < 1;
        if (v >= 1) E.fase = 'reposo';
      }
      { const m = th * .38; tx = cl(tx, m, V.w - m); if (!X.fijo || (E.fase !== 'reposo' && E.fase !== 'salta')) ty = Math.max(ty, V.nav + th * 1.04 + 6); }
      const pegado = E.fase === 'salta' || (E.fase === 'reposo' && (X.fijo || p.tipo === 'hero')); // en reposo viaja con la página, sin retraso
      const kf = pegado ? 1 : 1 - Math.exp(-dt * (E.fase === 'reposo' ? 10 : 30)), ox = E.x, oy = E.y;
      E.x = lerp(E.x, tx, kf); E.y = lerp(E.y, ty, kf); E.h = lerp(E.h, th, 1 - Math.exp(-dt * 10));
      E.vx = (E.x - ox) / Math.max(dt, 1e-3); E.vy = (E.y - oy) / Math.max(dt, 1e-3);
      E.fuerza = lerp(E.fuerza, fuerza, 1 - Math.exp(-dt * 12));
      const dx = E.x - ox, vel = Math.abs(E.vx), enReposo = E.fase === 'reposo';
      // visibilidad: escondido si su lugar de reposo choca por ambos lados; casi transparente si al moverse pasa sobre algo
      let opT = enReposo && X.oculto ? 0 : 1;
      if (E.fase === 'salta') opT = E.vis;
      const htm = document.documentElement;
      if (htm.classList.contains('menu-open') || document.body.style.overflow === 'hidden') opT = 0;
      if (fr % 6 === 0) { const wa = document.getElementById('hapee-wa-fab'); E.wa = false; if (wa) { const r = wa.getBoundingClientRect(); E.wa = r.width && r.right > E.x - E.h * .3 && r.left < E.x + E.h * .3 && r.bottom > E.y - E.h && r.top < E.y; } }
      if (E.wa) opT = 0;
      // fuera de la pantalla (la sección siguió de largo): nada que mostrar
      if (X.fijo && enReposo && (E.y - E.h < V.nav + 10 || E.y > V.h - 4)) opT = 0;
      // celular, en reposo: cada ~1/3 s comprueba que de verdad no toca texto ni botones; si toca, busca otro lugar
      if (V.movil && o.spot && enReposo && fr % 20 === 0 && E.op > .5 && tocaAlgo(E.x, E.y, E.h)) { o.spot.malo = true; MALOS.add(o.spot.k); E.spotK = null; E.bp = null; }
      if (!enReposo && fr % 3 === 0) E.pasa = choca(E.x, E.y, E.h);
      if (!enReposo && E.pasa && E.fase !== 'salta') opT = Math.min(opT, .22);
      E.op = E.fase === 'salta' ? opT : lerp(E.op, opT, 1 - Math.exp(-dt * (opT < E.op ? 22 : 8)));  // se esconde rápido, aparece suave
      cv.style.opacity = E.op < .99 ? E.op.toFixed(2) : '';

      // pose
      if (E.fiesta > 0) { E.fiesta -= dt; E.tBot += dt; }
      else if (camina) { if (bot.st.pose !== 'corre') bot.pose('corre'); E.tBot += Math.abs(dx) / (E.h * 1.15) * .483 * .5; }
      else {
        E.tBot += dt;
        if (E.fuerza > .15) { if (bot.st.pose !== 'idle') bot.pose('idle'); }
        else if (enReposo && E.posePara !== idx) { bot.pose(p.pose, p.pose === 'saluda' ? 2.4 : p.pose === 'celebra' ? 1.8 : 0); E.posePara = idx; }
        else if (bot.st.pose === 'corre') bot.pose('idle');
      }
      if (!enReposo) E.posePara = -1;
      let yaw = X.cara;
      if (camina || (E.fuerza > .2 && vel > 30)) yaw = Math.sign(E.vx || 1) * (camina ? 1.25 : .7);
      E.yaw = lerp(E.yaw, yaw, 1 - Math.exp(-dt * 8));
      E.bank = lerp(E.bank, cl(-E.vx / 1400, -.45, .45) * (E.fuerza > .2 ? 1 : 0), 1 - Math.exp(-dt * 6));
      bot.st.mira = enReposo ? (V.movil ? -X.cara * .4 : cl((E.mouseX - E.x / V.w) * 1.4, -.6, .6)) : 0;
      bot.st.miraY = enReposo && !V.movil ? cl((E.mouseY - (E.y - E.h * .85) / V.h) * .6, -.3, .3) : 0;

      const [wx, wy] = mundo(E.x, E.y), esc = E.h * V.k;
      bot.g.position.set(wx, wy, 0); bot.g.scale.setScalar(esc);
      bot.g.rotation.set(E.fuerza > .2 ? cl(vel / 2600, 0, .3) : 0, E.yaw, E.bank);
      bot.update(E.tBot, dt);
      if (sombra) {
        const altura = Math.max(0, PISO() - E.y), [sx, sy] = mundo(E.x, PISO());
        sombra.visible = E.y > V.h * .4; sombra.position.set(sx, sy, -.2); sombra.scale.setScalar(esc * .42 * (1 - Math.min(.6, altura / 500)));
        sombra.material.opacity = .2 * (1 - Math.min(1, altura / 400));
      }
      jet.paso(t, dt, E.fuerza, esc, { x: E.vx * V.k, y: -E.vy * V.k });
      const vuela = E.fuerza > .3;
      if (E.enVuelo && !vuela && !V.movil) jet.polvo(esc);
      E.enVuelo = vuela;
      globo(p, enReposo, opT === 1 && E.op > .6, o.spot);
    }
    part.paso(dt);
    // en celular, quieto y sin propulsores, basta con 30 cuadros por segundo
    const quietoTotal = V.movil && E.fuerza < .05 && Math.abs(E.vx) < 2 && Math.abs(E.vy) < 2;
    if (!quietoTotal || fr % 2 === 0) R.render(S, cam);
    requestAnimationFrame(loop);
  }

  medir();
  enCurso = true;
  requestAnimationFrame(n => { prev = n; loop(n); document.documentElement.classList.add('hx-on'); });
}

function cuandoListo(fn) {
  // arranca con la primera interacción o ~2 s después de que el DOM está listo (no espera el «load» completo:
  // en el home el video y las maquetas lo retrasan mucho y el robot no aparecía)
  let ya = false; const go = () => { if (ya) return; ya = true; fn(); };
  ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, go, { once: true, passive: true }));
  const idle = () => setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(go, { timeout: 1500 }) : go()), 1800);
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', idle, { once: true }); else idle();
}

const APAGADO = new URLSearchParams(location.search).get('hx') === '0'; // ?hx=0 = la página sin el robot (comparar, soporte)
if ((PARADAS.length || GEN) && !APAGADO && !REDUCE && !MODESTO && webglOk()) cuandoListo(() => arrancar().catch(e => { console.warn('[hx] robot', e); document.documentElement.classList.remove('hx-on'); }));

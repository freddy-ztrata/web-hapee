// Hapee Arcade · hub 3D + motor de partidas. Un renderer, un robot, seis juegos cargados a pedido.
import { cargarThree, crearBot } from './bot.js?v=1';
import { $, cl, lerp, rnd, REDUCIR, sfx, vibra, audio, esMudo, setMudo, musicaInicia, musicaPara, musicaTempo, crearParticulas, records, guardaRecord, fmt, compartir, abreCalendario, cierraCalendario, evento } from './comun.js?v=1';

export const JUEGOS = [
  { id: 'cero-visto', n: 'Cero Visto', tipo: '2d', bpm: 124,
    desc: 'Los mensajes llegan por WhatsApp, Instagram, Facebook, email y tu web. Respóndelos antes de que se enfríen.',
    ens: 'Los agentes de IA de Hapee responden, califican y agendan 24/7 en todos tus canales.',
    como: ['Toca cada mensaje antes de que se acabe su anillo.', 'Más rápido respondes, más puntos y más combo.', 'No toques el spam. Atrapa el orbe «Agente IA» y el robot responde por ti.'],
    dice: 'Cero Visto: aquí nadie queda en visto. ¿Me ayudas a responder?' },
  { id: 'lead-caliente', n: 'Lead Caliente', tipo: '2d', bpm: 118,
    desc: 'Cada mensaje trae una señal. Decide en un segundo: agendar ahora, nutrir con email o descartar.',
    ens: 'Con el rol «SDR», tu agente de Hapee califica y agenda solo; lo que no está listo sigue con Mail Marketing.',
    como: ['Desliza o toca: izquierda = Nutrir, abajo = Agendar, derecha = Descartar.', 'En teclado: flechas izquierda, abajo y derecha.', 'Tres errores y se acaba. La racha multiplica.'],
    dice: 'Lead Caliente: yo leo la intención, tú decides adónde va.' },
  { id: 'pipeline-vivo', n: 'Pipeline Vivo', tipo: '2d', bpm: 108,
    desc: 'Gira las piezas para conectar cada canal con tu CRM. Cuando fluye, entran negocios.',
    ens: 'Hapee junta WhatsApp, Instagram, Facebook, email y tu web en una bandeja omnicanal y un solo pipeline.',
    como: ['Toca una pieza para girarla.', 'Conecta los canales de la izquierda con el núcleo de la derecha.', 'Tablero completo = bono y uno nuevo, más grande.'],
    dice: 'Pipeline Vivo: conecta los canales y mira cómo entra la plata.' },
  { id: 'agenda-llena', n: 'Agenda Llena', tipo: '2d', bpm: 116,
    desc: 'Llegan pedidos de reunión con condiciones. Ubícalos en la semana antes de que el cliente se aburra.',
    ens: 'El agente de Hapee ofrece horas y agenda directo en tu calendario real, con recordatorios.',
    como: ['Arrastra la reunión al día y la hora (o tócala y después toca la celda).', 'Respeta su condición: día, mañana o tarde.', 'Semana llena = bono y semana nueva.'],
    dice: 'Agenda Llena: todos quieren reunirse. Que no se pise ninguna.' },
  { id: 'despertador', n: 'Despertador', tipo: '3d', bpm: 100,
    desc: 'Tu base de contactos está dormida. Lanza campañas y despiértala: cada contacto que despierta, despierta a sus vecinos.',
    ens: 'Con Mail Marketing y Workflows: email clickeado → WhatsApp del agente ofreciendo agendar → etiqueta «reactivado».',
    como: ['Arrastra hacia atrás para apuntar y suelta para lanzar.', 'Cada contacto despierto despierta a los cercanos: busca cadenas.', 'Tienes 10 campañas por ronda.'],
    dice: 'Despertador: hay miles de contactos dormidos en tu base. Vamos a despertarlos.' },
  { id: 'ruta-hapee', n: 'Ruta Hapee', tipo: '3d', bpm: 132,
    desc: 'Corre conmigo por la Ruta Hapee: junta leads y esquiva planillas, post-its y respuestas tardías.',
    ens: 'Hapee reemplaza más de 25 herramientas: CRM, email, automatización, reportería y tu sitio web en una sola cuenta.',
    como: ['Desliza a los lados para cambiar de pista; hacia arriba para saltar.', 'En teclado: flechas o A / D y espacio.', 'Workflow = imán de leads. Agente IA = escudo.'],
    dice: 'Ruta Hapee: tú pones las piernas, yo pongo la velocidad.' },
];

// ───────── estado ─────────
const W = { w: innerWidth, h: innerHeight, dpr: Math.min(2, devicePixelRatio || 1) };
const MOVIL = matchMedia('(pointer:coarse)').matches || innerWidth < 760;
let K, THREE, R, bot, idx = 0, modo = 'carga', juego = null, juegoMeta = null, pausado = false, reloj = 0;
const cv = $('#c2d'), g = cv.getContext('2d'), glc = $('#gl'), toque = $('#toque');
const part = crearParticulas();

// atribución: guarda UTMs de la URL igual que /js/lang.js (sin cargarlo: esta página es solo en español)
(function () {
  const TR = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'fbclid', 'gclid', 'ttclid', 'msclkid', 'wbraid', 'gbraid'];
  const q = new URLSearchParams(location.search), a = {}; let n = 0;
  TR.forEach(k => { const v = q.get(k); if (v) { a[k] = v; n++; } });
  if (n) { try { sessionStorage.setItem('hapee_attribution', JSON.stringify(a)); localStorage.setItem('hapee_attribution', JSON.stringify({ t: Date.now(), d: a })); } catch (e) {} }
})();

function carga(p, t) { $('#carga-b').style.width = Math.round(p * 100) + '%'; if (t) $('#carga-t').textContent = t; }

// ───────── arranque ─────────
async function boot() {
  carga(.15, 'Encendiendo el arcade');
  K = await cargarThree(); THREE = K.THREE;
  carga(.5, 'Armando al robot');
  R = new THREE.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, powerPreference: 'high-performance' });
  R.setClearColor(0x000000, 0);
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
  const pm = new THREE.PMREMGenerator(R);
  K.env = pm.fromScene(new K.RoomEnvironment(), .04).texture; pm.dispose();
  bot = await crearBot(K);
  carga(.85, 'Prendiendo las luces');
  armarHub();
  coachArmar();
  medir();
  addEventListener('resize', medir);
  carga(1, 'Listo');
  setTimeout(() => $('#carga').classList.add('fuera'), 250);
  modo = 'hub';
  const h = location.hash.slice(1), i = JUEGOS.findIndex(j => j.id === h);
  selecciona(i >= 0 ? i : 0, true);
  if (i >= 0) setTimeout(() => abrirIntro(i), 500);
  else setTimeout(() => { bot.pose('saluda', 2.2); dice('¡Hola! Soy el robot de Hapee. Elige un juego y vamos.', 3600); }, 700);
  requestAnimationFrame(bucle);
  window.__arcade = { listo: true, JUEGOS, jugar: i => abrirIntro(i), empezar: i => empezar(i), get juego() { return juego; }, get modo() { return modo; }, bot, part };
}

function medir() {
  W.w = innerWidth; W.h = innerHeight; W.dpr = Math.min(MOVIL ? 2 : 2, devicePixelRatio || 1);
  cv.width = Math.round(W.w * W.dpr); cv.height = Math.round(W.h * W.dpr);
  ajustaGL();
  if (juego && juego.medir) juego.medir();
}
let glEn = 'full';
function ajustaGL() {
  if (!R) return;
  if (glEn === 'coach') {
    const s = coachTam(); glc.style.inset = 'auto'; glc.style.left = s.x + 'px'; glc.style.top = s.y + 'px'; glc.style.width = s.w + 'px'; glc.style.height = s.h + 'px';
    R.setPixelRatio(Math.min(2, devicePixelRatio || 1)); R.setSize(s.w, s.h, false);
  } else {
    glc.style.inset = '0'; glc.style.left = glc.style.top = ''; glc.style.width = glc.style.height = '100%';
    const pr = MOVIL ? Math.min(1.75, devicePixelRatio || 1) : Math.min(1.5, devicePixelRatio || 1);
    R.setPixelRatio(pr * calidad); R.setSize(W.w, W.h, false);
  }
}
let calidad = 1, lentos = 0, rapidos = 0;
function vigila(dt) { // baja la resolución si el equipo no da 50 fps
  if (glEn !== 'full') return;
  if (dt > 1 / 45) { lentos++; rapidos = 0; } else if (dt < 1 / 58) { rapidos++; if (lentos > 0) lentos--; }
  if (lentos > 45 && calidad > .6) { calidad = Math.max(.6, calidad - .15); lentos = 0; ajustaGL(); }
  if (rapidos > 600 && calidad < 1) { calidad = Math.min(1, calidad + .1); rapidos = 0; ajustaGL(); }
}

// ───────── hub 3D ─────────
const H = {};
function posterArte(j, w = 512, h = 720) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2A0812'); bg.addColorStop(1, '#0C0407'); x.fillStyle = bg; x.fillRect(0, 0, w, h);
  const gl = x.createRadialGradient(w / 2, h * .42, 10, w / 2, h * .42, w * .7); gl.addColorStop(0, 'rgba(250,80,0,.45)'); gl.addColorStop(1, 'rgba(250,80,0,0)'); x.fillStyle = gl; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(255,255,255,.06)'; x.lineWidth = 2; for (let i = 0; i < w; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let i = 0; i < h; i += 32) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); }
  const gr = x.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#FA5000'); gr.addColorStop(1, '#CD2349');
  x.save(); x.translate(w / 2, h * .42); x.lineCap = 'round'; x.lineJoin = 'round';
  const burb = (bx, by, bw, bh, col) => { x.fillStyle = col; x.beginPath(); x.roundRect(bx - bw / 2, by - bh / 2, bw, bh, bh * .42); x.fill(); x.beginPath(); x.moveTo(bx - bw * .3, by + bh * .4); x.lineTo(bx - bw * .42, by + bh * .75); x.lineTo(bx - bw * .1, by + bh * .45); x.fill(); };
  if (j.id === 'cero-visto') { burb(-60, -70, 200, 90, gr); burb(70, 40, 170, 80, '#FFF1E8'); burb(-40, 140, 140, 66, 'rgba(255,255,255,.18)'); x.strokeStyle = '#FA5000'; x.lineWidth = 10; x.beginPath(); x.arc(110, -120, 46, -1.57, 2.6); x.stroke(); }
  if (j.id === 'lead-caliente') { x.fillStyle = gr; x.beginPath(); x.moveTo(0, -170); x.bezierCurveTo(110, -60, 110, 60, 0, 120); x.bezierCurveTo(-110, 60, -110, -60, 0, -170); x.fill(); x.fillStyle = '#FFF1E8'; x.beginPath(); x.moveTo(0, -40); x.bezierCurveTo(50, 10, 45, 80, 0, 100); x.bezierCurveTo(-45, 80, -50, 10, 0, -40); x.fill(); for (const [a, l] of [[-1, 'NUTRIR'], [0, 'AGENDAR'], [1, 'DESCARTAR']]) { x.fillStyle = a === 0 ? '#FA5000' : 'rgba(255,255,255,.2)'; x.beginPath(); x.roundRect(a * 150 - 66, 170, 132, 40, 20); x.fill(); x.fillStyle = '#fff'; x.font = '800 18px "Plus Jakarta Sans",sans-serif'; x.textAlign = 'center'; x.fillText(l, a * 150, 197); } }
  if (j.id === 'pipeline-vivo') { x.lineWidth = 34; x.strokeStyle = 'rgba(255,255,255,.14)'; x.beginPath(); x.moveTo(-200, -120); x.lineTo(-60, -120); x.lineTo(-60, 40); x.lineTo(80, 40); x.lineTo(80, 150); x.stroke(); x.strokeStyle = gr; x.lineWidth = 18; x.stroke(); x.fillStyle = '#FFF1E8'; x.beginPath(); x.arc(150, 150, 54, 0, 7); x.fill(); x.fillStyle = '#FA5000'; x.beginPath(); x.arc(150, 150, 26, 0, 7); x.fill(); }
  if (j.id === 'agenda-llena') { for (let c2 = 0; c2 < 5; c2++) for (let r = 0; r < 6; r++) { x.fillStyle = 'rgba(255,255,255,.07)'; x.beginPath(); x.roundRect(-190 + c2 * 78, -170 + r * 58, 70, 50, 10); x.fill(); } for (const [c2, r, l] of [[0, 1, 2], [1, 0, 1], [2, 2, 3], [3, 0, 2], [4, 3, 2], [1, 3, 2]]) { x.fillStyle = (c2 + r) % 2 ? '#FFF1E8' : gr; x.beginPath(); x.roundRect(-190 + c2 * 78, -170 + r * 58, 70, l * 58 - 8, 12); x.fill(); } }
  if (j.id === 'despertador') { x.fillStyle = gr; x.beginPath(); x.roundRect(-150, -90, 300, 190, 22); x.fill(); x.strokeStyle = '#FFF1E8'; x.lineWidth = 12; x.beginPath(); x.moveTo(-140, -80); x.lineTo(0, 30); x.lineTo(140, -80); x.stroke(); for (const [cx, cy] of [[-170, 170], [-40, 200], [110, 180], [190, 110]]) { x.fillStyle = 'rgba(180,200,230,.3)'; x.beginPath(); x.arc(cx, cy, 26, 0, 7); x.fill(); } x.fillStyle = '#FA5000'; x.beginPath(); x.arc(190, 110, 26, 0, 7); x.fill(); }
  if (j.id === 'ruta-hapee') { x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 6; for (const a of [-1, -.33, .33, 1]) { x.beginPath(); x.moveTo(a * 40, -170); x.lineTo(a * 230, 230); x.stroke(); } for (let i = 0; i < 6; i++) { const y = -140 + i * i * 12, s = .3 + i * .16; x.fillStyle = i % 2 ? '#FFF1E8' : '#FA5000'; x.beginPath(); x.arc((i % 3 - 1) * 70 * s, y, 18 * s + 4, 0, 7); x.fill(); } x.fillStyle = gr; x.beginPath(); x.roundRect(-110, 120, 220, 54, 14); x.fill(); x.fillStyle = '#fff'; x.font = '800 24px "Plus Jakarta Sans",sans-serif'; x.textAlign = 'center'; x.fillText('PLANILLA', 0, 156); }
  x.restore();
  x.fillStyle = '#FFF1E8'; x.textAlign = 'center'; x.font = '800 58px "Plus Jakarta Sans",sans-serif'; x.fillText(j.n, w / 2, h - 92);
  x.fillStyle = '#FA5000'; x.font = '800 22px "Plus Jakarta Sans",sans-serif'; x.fillText('JUEGO 0' + (JUEGOS.indexOf(j) + 1), w / 2, h - 46);
  return c;
}
function marcoGeo(w, h, r, grosor) {
  const s = new THREE.Shape(), rr = (sh, x0, y0, ww, hh, ra) => { sh.moveTo(x0 + ra, y0); sh.lineTo(x0 + ww - ra, y0); sh.quadraticCurveTo(x0 + ww, y0, x0 + ww, y0 + ra); sh.lineTo(x0 + ww, y0 + hh - ra); sh.quadraticCurveTo(x0 + ww, y0 + hh, x0 + ww - ra, y0 + hh); sh.lineTo(x0 + ra, y0 + hh); sh.quadraticCurveTo(x0, y0 + hh, x0, y0 + hh - ra); sh.lineTo(x0, y0 + ra); sh.quadraticCurveTo(x0, y0, x0 + ra, y0); };
  rr(s, -w / 2, 0, w, h, r);
  const hole = new THREE.Path(); rr(hole, -w / 2 + grosor, grosor, w - 2 * grosor, h - 2 * grosor, Math.max(.01, r - grosor)); s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth: .06, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 3, curveSegments: 12 });
}
function armarHub() {
  const S = H.scene = new THREE.Scene(); S.environment = K.env;
  H.cam = new THREE.PerspectiveCamera(MOVIL ? 42 : 34, 1, .05, 60);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(2, 4, 4); S.add(key);
  const rim = new THREE.DirectionalLight(0xff6a2a, 2.2); rim.position.set(-3, 2.5, -3); S.add(rim);
  const rim2 = new THREE.DirectionalLight(0xff2a6a, 1.4); rim2.position.set(3, 1.5, -2); S.add(rim2);
  S.add(new THREE.HemisphereLight(0x5a2030, 0x0b0507, .6));
  // piso: disco con anillos luminosos (textura de canvas)
  const fc = document.createElement('canvas'); fc.width = fc.height = 1024; const f = fc.getContext('2d');
  const rg = f.createRadialGradient(512, 512, 0, 512, 512, 512); rg.addColorStop(0, 'rgba(250,80,0,.55)'); rg.addColorStop(.18, 'rgba(205,35,73,.25)'); rg.addColorStop(.6, 'rgba(40,8,16,.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); f.fillStyle = rg; f.fillRect(0, 0, 1024, 1024);
  for (let i = 1; i < 9; i++) { f.strokeStyle = `rgba(255,${120 + i * 10},${80 + i * 8},${.32 - i * .03})`; f.lineWidth = i % 3 === 0 ? 3 : 1.4; f.beginPath(); f.arc(512, 512, i * 56, 0, 7); f.stroke(); }
  f.strokeStyle = 'rgba(255,255,255,.08)'; for (let a = 0; a < 48; a++) { const an = a / 48 * Math.PI * 2; f.beginPath(); f.moveTo(512 + Math.cos(an) * 120, 512 + Math.sin(an) * 120); f.lineTo(512 + Math.cos(an) * 500, 512 + Math.sin(an) * 500); f.stroke(); }
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace;
  H.piso = new THREE.Mesh(new THREE.CircleGeometry(7, 96), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false }));
  H.piso.rotation.x = -Math.PI / 2; S.add(H.piso);
  // pedestal
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(.62, .7, .14, 64), new THREE.MeshPhysicalMaterial({ color: 0x1a0a10, roughness: .25, metalness: .3, clearcoat: 1 }));
  ped.position.y = .07; S.add(ped);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(.66, .012, 8, 96), new THREE.MeshBasicMaterial({ color: 0xff6a20, toneMapped: false }));
  aro.rotation.x = Math.PI / 2; aro.position.y = .145; S.add(aro); H.aro = aro;
  // portales en carrusel
  H.car = new THREE.Group(); H.car.position.set(0, 0, -.2); S.add(H.car);
  H.portales = [];
  const RADIO = 3.1;
  const gradTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const gg = x.createLinearGradient(0, 256, 0, 0); gg.addColorStop(0, '#FA5000'); gg.addColorStop(1, '#CD2349'); x.fillStyle = gg; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const marco = marcoGeo(1.5, 2.15, .32, .07);
  marco.computeBoundingBox();
  { const p = marco.attributes.position, uv = marco.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, .5, p.getY(i) / 2.15); }
  JUEGOS.forEach((j, i) => {
    const gp = new THREE.Group(); const an = i / JUEGOS.length * Math.PI * 2;
    gp.userData.an = an;
    const m = new THREE.Mesh(marco, new THREE.MeshBasicMaterial({ map: gradTex, toneMapped: false }));
    m.position.z = -.03; gp.add(m);
    const pt = new THREE.CanvasTexture(posterArte(j)); pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = 4;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.92), new THREE.MeshBasicMaterial({ map: pt, transparent: true, opacity: .96, toneMapped: false }));
    pl.position.set(0, 1.075, 0); pl.renderOrder = -1; gp.add(pl);
    // halo detrás
    const hc = document.createElement('canvas'); hc.width = hc.height = 128; const hx = hc.getContext('2d'); const hg = hx.createRadialGradient(64, 64, 0, 64, 64, 64); hg.addColorStop(0, 'rgba(250,80,0,.6)'); hg.addColorStop(1, 'rgba(250,80,0,0)'); hx.fillStyle = hg; hx.fillRect(0, 0, 128, 128);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.position.set(0, 1.08, -.2); halo.renderOrder = -2; gp.add(halo);
    gp.userData.pl = pl; gp.userData.halo = halo; gp.userData.marco = m;
    H.car.add(gp); H.portales.push(gp);
  });
  H.radio = RADIO;
  // partículas: leads que suben
  const N = MOVIL ? 160 : 320, pos = new Float32Array(N * 3), vel = new Float32Array(N);
  for (let i = 0; i < N; i++) { const a = rnd(0, Math.PI * 2), r = rnd(1.2, 6); pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = rnd(0, 4); pos[i * 3 + 2] = Math.sin(a) * r - 1; vel[i] = rnd(.08, .35); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sx = sc.getContext('2d'); const sg = sx.createRadialGradient(32, 32, 0, 32, 32, 32); sg.addColorStop(0, 'rgba(255,220,190,1)'); sg.addColorStop(.25, 'rgba(250,110,40,.8)'); sg.addColorStop(1, 'rgba(250,80,0,0)'); sx.fillStyle = sg; sx.fillRect(0, 0, 64, 64);
  H.pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: .07, map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  H.pts.userData.vel = vel; S.add(H.pts);
  H.giro = 0; H.giroObj = 0; H.arrastre = null;
  // robot al centro
  bot.g.position.set(0, .14, .35); bot.g.scale.setScalar(1.25);
  S.add(bot.g);
}
function hubCam() {
  const asp = W.w / W.h; H.cam.aspect = asp;
  const vert = asp < .8;
  H.cam.fov = vert ? 48 : 34;
  const d = vert ? 4.9 : 6.0;
  H.cam.position.set(H.par ? H.par.x * .25 : 0, vert ? 1.5 : 1.35, d);
  H.cam.lookAt(0, vert ? .12 : 1.15, 0);
  if (!vert && W.w >= 900) { H.cam.position.x -= 1.35; H.cam.lookAt(-1.1, 1.15, 0); }
  H.cam.updateProjectionMatrix();
}
function pasoHub(dt, t) {
  // carrusel: el activo atrás al centro
  const obj = -idx / JUEGOS.length * Math.PI * 2;
  if (!H.arrastre) { let d = obj - H.giro; d = Math.atan2(Math.sin(d), Math.cos(d)); H.giro += d * cl(dt * 6, 0, 1); }
  H.portales.forEach((p, i) => {
    const an = p.userData.an + H.giro;
    p.position.set(Math.sin(an) * H.radio, .02, -Math.cos(an) * H.radio * .82 - .6);
    p.lookAt(0, .02, 3);
    const frente = (1 - Math.cos(an)) / 2; // 1 = detrás del robot (activo)
    const act = i === idx ? 1 : 0;
    const s = .62 + .38 * Math.pow(1 - Math.abs(Math.atan2(Math.sin(an), Math.cos(an))) / Math.PI, 2.2);
    p.scale.setScalar(s * (1 + .03 * act * Math.sin(t * 2)));
    p.userData.pl.material.opacity = .35 + .6 * Math.pow(s, 3);
    p.userData.halo.material.opacity = act ? .9 + .1 * Math.sin(t * 3) : .15;
    p.visible = Math.cos(an) > -.25;
  });
  H.car.scale.setScalar(W.w / W.h < .8 ? .74 : 1);
  H.piso.rotation.z += dt * .05; H.aro.material.color.setHSL(.05 + .02 * Math.sin(t), 1, .55);
  const pa = H.pts.geometry.attributes.position, v = H.pts.userData.vel;
  for (let i = 0; i < v.length; i++) { let y = pa.getY(i) + v[i] * dt; if (y > 4.2) y = 0; pa.setY(i, y); }
  pa.needsUpdate = true;
  // robot: mira hacia la cámara con leve giro hacia el puntero
  const objYaw = H.par ? H.par.x * .5 : 0;
  bot.g.rotation.y = lerp(bot.g.rotation.y, objYaw * .6, cl(dt * 3, 0, 1));
  bot.st.mira = lerp(bot.st.mira, objYaw * .5, cl(dt * 4, 0, 1)); bot.st.miraY = lerp(bot.st.miraY, H.par ? -H.par.y * .3 : 0, cl(dt * 4, 0, 1));
  bot.update(t, dt);
  hubCam();
  R.render(H.scene, H.cam);
  bocadilloPos(H.cam, bot.g, 1.35 * 1.25 + .14);
}
// fondo del hub en el canvas 2D: degradado + bruma
function fondoHub(t) {
  const w = cv.width, h = cv.height;
  const bg = g.createRadialGradient(w * .5, h * .62, 0, w * .5, h * .62, Math.max(w, h) * .8);
  bg.addColorStop(0, '#3B0B18'); bg.addColorStop(.45, '#16060B'); bg.addColorStop(1, '#070304');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
}

// ───────── bocadillo ─────────
const boc = $('#bocadillo'); let bocHasta = 0, bocObj = null;
function dice(txt, ms = 2600) { boc.textContent = txt; boc.classList.add('on'); bocHasta = performance.now() + ms; bot.pose('habla', Math.min(ms / 1000, 2.4)); }
function bocadilloPos(cam, obj, alto) {
  if (performance.now() > bocHasta) { boc.classList.remove('on'); return; }
  const v = new THREE.Vector3(); obj.getWorldPosition(v); v.y += alto;
  v.project(cam);
  let x = (v.x * .5 + .5) * W.w, y = (-v.y * .5 + .5) * W.h;
  const bw = boc.offsetWidth, bh = boc.offsetHeight;
  x = cl(x + 24, 12, W.w - bw - 12); y = cl(y - bh - 6, 70, W.h - bh - 12);
  boc.style.left = x + 'px'; boc.style.top = y + 'px';
}

// ───────── coach (robot en la esquina de los juegos 2D) ─────────
const C = {};
function coachArmar() {
  const S = C.scene = new THREE.Scene(); S.environment = K.env;
  const k = new THREE.DirectionalLight(0xffffff, 1.6); k.position.set(2, 3, 4); S.add(k);
  const r = new THREE.DirectionalLight(0xff7a3d, 1.6); r.position.set(-3, 2, -3); S.add(r);
  C.cam = new THREE.PerspectiveCamera(26, 1, .05, 20);
}
function coachTam() { const h = Math.round(cl(W.h * .24, 120, 230)), w = Math.round(h * .62); return { w, h, x: 0, y: W.h - h - (MOVIL ? 8 : 18) }; }
function coachPaso(dt, t) {
  const s = coachTam(); C.cam.aspect = s.w / s.h; C.cam.position.set(0, .62, 3.1); C.cam.lookAt(0, .55, 0); C.cam.updateProjectionMatrix();
  bot.g.rotation.y = lerp(bot.g.rotation.y, .35, .1);
  bot.update(t, dt);
  R.setClearColor(0, 0); R.clear();
  R.render(C.scene, C.cam);
  // bocadillo junto al coach
  if (performance.now() > bocHasta) boc.classList.remove('on');
  else { boc.style.left = (s.w * .78) + 'px'; boc.style.top = cl(s.y + 4, 70, W.h - boc.offsetHeight - 12) + 'px'; }
}

// ───────── selección en el hub ─────────
const pts = $('#puntos');
JUEGOS.forEach((j, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', j.n); b.innerHTML = '<i></i>'; b.onclick = () => { sfx.tap(); selecciona(i); }; pts.appendChild(b); });
function selecciona(i, silencio) {
  idx = (i + JUEGOS.length) % JUEGOS.length; const j = JUEGOS[idx];
  $('#f-num').textContent = `JUEGO 0${idx + 1} / 06`; $('#f-nom').textContent = j.n; $('#f-desc').textContent = j.desc;
  $('#f-ens').innerHTML = '<b>Lo que entrena:</b> ' + j.ens;
  const r = records(j.id); $('#f-rec').textContent = r.length ? 'Tu récord: ' + fmt(r[0].p) : 'Sin récord todavía';
  [...pts.children].forEach((b, k) => b.setAttribute('aria-current', k === idx ? 'true' : 'false'));
  if (!silencio) { dice(j.dice, 2600); sfx.whoosh(); }
}
$('#b-ant').onclick = () => { selecciona(idx - 1); };
$('#b-sig').onclick = () => { selecciona(idx + 1); };
$('#b-jugar').onclick = () => { audio(); abrirIntro(idx); };
$('#b-demo-top').onclick = () => abreCalendario(juegoMeta ? juegoMeta.id : 'hub');
$('#b-cierra-demo').onclick = cierraCalendario;
$('#hoja-demo').addEventListener('click', e => { if (e.target.id === 'hoja-demo') cierraCalendario(); });
const bS = $('#b-sonido');
function pintaSonido() { bS.setAttribute('aria-pressed', esMudo() ? 'true' : 'false'); bS.setAttribute('aria-label', esMudo() ? 'Activar sonido' : 'Silenciar sonido'); bS.querySelector('.on').style.opacity = esMudo() ? .15 : 1; }
bS.onclick = () => { setMudo(!esMudo()); pintaSonido(); }; pintaSonido();

// arrastre del carrusel y parallax
let ini = null;
toque.addEventListener('pointerdown', e => {
  audio();
  if (modo === 'hub') { ini = { x: e.clientX, y: e.clientY, g: H.giro, t: performance.now() }; H.arrastre = ini; toque.setPointerCapture(e.pointerId); }
  if (modo === 'juego' && juego && juego.abajo && !pausado) juego.abajo(e);
});
toque.addEventListener('pointermove', e => {
  if (modo === 'hub') {
    H.par = { x: (e.clientX / W.w - .5) * 2, y: (e.clientY / W.h - .5) * 2 };
    if (ini) H.giro = ini.g + (e.clientX - ini.x) / W.w * 3.2;
  }
  if (modo === 'juego' && juego && juego.mueve && !pausado) juego.mueve(e);
});
const suelta = e => {
  if (modo === 'hub' && ini) {
    const dx = e.clientX - ini.x, dt = performance.now() - ini.t;
    H.arrastre = null;
    if (Math.abs(dx) < 8 && dt < 400) { // toque: si es al robot, saluda
      const ny = e.clientY / W.h; if (ny > .3 && ny < .8 && Math.abs(e.clientX / W.w - (W.w >= 900 ? .62 : .5)) < .15) { bot.pose('saluda', 1.6); sfx.pop(); dice(['¡Hola! Elige un juego y te explico.', 'Pssst: el récord está para romperlo.', 'Yo respondo en segundos. ¿Y tú?', 'Toca «Jugar» cuando estés listo.'][Math.floor(Math.random() * 4)], 2200); }
    } else {
      const pasos = Math.round(-(H.giro) / (Math.PI * 2) * JUEGOS.length);
      selecciona(((pasos % 6) + 6) % 6);
    }
    ini = null;
  }
  if (modo === 'juego' && juego && juego.arriba && !pausado) juego.arriba(e);
};
toque.addEventListener('pointerup', suelta); toque.addEventListener('pointercancel', suelta);
addEventListener('keydown', e => {
  if (!$('#modal').hidden || !$('#hoja-demo').hidden) { if (e.key === 'Escape') { if (!$('#hoja-demo').hidden) cierraCalendario(); } return; }
  if (modo === 'hub') {
    if (e.key === 'ArrowLeft') selecciona(idx - 1); else if (e.key === 'ArrowRight') selecciona(idx + 1); else if (e.key === 'Enter' && document.activeElement === document.body) abrirIntro(idx);
  } else if (modo === 'juego' && juego) {
    if (e.key === 'Escape' || e.key === 'p') { pausa(true); return; }
    if (juego.tecla && !pausado) { juego.tecla(e); }
  }
});

// ───────── modal ─────────
const modal = $('#modal'), tarj = $('#tarj');
function abreModal(html, foco) {
  tarj.innerHTML = html; modal.hidden = false; requestAnimationFrame(() => modal.classList.add('on'));
  const f = tarj.querySelector(foco || '.jugar'); if (f) setTimeout(() => f.focus({ preventScroll: true }), 60);
}
function cierraModal() { modal.classList.remove('on'); setTimeout(() => { modal.hidden = true; }, 250); }
function abrirIntro(i) {
  selecciona(i, true); const j = JUEGOS[idx];
  history.replaceState(null, '', '#' + j.id);
  evento('arcade_intro', { juego: j.id });
  abreModal(`<span class="kick">JUEGO 0${idx + 1} · ${j.tipo === '3d' ? '3D' : 'ARCADE'}</span><h3 id="m-tit">${j.n}</h3><p>${j.desc}</p>
  <ul class="como">${j.como.map((c, k) => `<li><b>${k + 1}</b><span>${c}</span></li>`).join('')}</ul>
  <div class="leccion"><b>Lo que entrena:</b> ${j.ens}</div>
  <div class="acciones"><button class="jugar" type="button" data-a="ir"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>Empezar</button><button class="sec" type="button" data-a="volver">Otro juego</button></div>`);
  tarj.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return; if (a.dataset.a === 'ir') { cierraModal(); empezar(idx); } if (a.dataset.a === 'volver') { cierraModal(); volverHub(); } };
}

// ───────── partida ─────────
const hud = { pts: $('#h-pts'), combo: $('#h-combo'), t: $('#h-t'), b: $('#h-b'), extra: $('#h-extra') };
let ptsMostrados = 0, ptsReal = 0;
async function empezar(i) {
  const j = JUEGOS[i]; juegoMeta = j; modo = 'cargando';
  $('#hub').classList.add('fuera'); $('#b-salir').hidden = false;
  boc.classList.remove('on');
  let mod;
  try { mod = await import(`./j-${j.id}.js?v=1`); } catch (e) { console.error(e); modo = 'hub'; $('#hub').classList.remove('fuera'); return; }
  H.scene.remove(bot.g);
  bot.g.position.set(0, 0, 0); bot.g.rotation.set(0, 0, 0); bot.g.scale.setScalar(1);
  ptsReal = ptsMostrados = 0; hud.pts.textContent = '0'; hud.combo.textContent = ''; hud.extra.textContent = '';
  const ctx = {
    K, THREE, R, bot, cv, g, W, MOVIL, part, sfx, vibra, REDUCIR, rnd, cl, lerp,
    pts(n) { ptsReal = n; }, combo(n) { hud.combo.textContent = n > 1 ? 'COMBO ×' + n : ''; },
    tiempo(rest, total) { hud.t.textContent = Math.ceil(Math.max(0, rest)); hud.b.style.transform = `scaleX(${cl(rest / total, 0, 1)})`; },
    extra(t) { hud.extra.textContent = t; },
    aviso, dice, tempo: musicaTempo,
    coach(on) { glEn = on ? 'coach' : 'full'; if (on) C.scene.add(bot.g); ajustaGL(); },
    terminar: r => terminar(j, r),
  };
  juego = await mod.crear(ctx);
  glEn = j.tipo === '2d' ? 'coach' : 'full'; if (j.tipo === '2d') C.scene.add(bot.g); ajustaGL();
  $('#hud').classList.add('on'); document.documentElement.classList.add('jugando'); pausado = true; modo = 'juego';
  evento('arcade_partida', { juego: j.id });
  await cuentaAtras();
  pausado = false; musicaInicia(j.bpm);
  if (juego.empieza) juego.empieza();
  dice(['¡Vamos!', '¡Dale!', '¡A jugar!'][Math.floor(Math.random() * 3)], 1200);
}
function cuentaAtras() {
  return new Promise(res => {
    const c = $('#cuenta'); let n = 3;
    const t = () => { if (n === 0) { c.innerHTML = '<span>¡YA!</span>'; sfx.cuenta(true); setTimeout(() => { c.innerHTML = ''; }, 600); res(); return; } c.innerHTML = `<span>${n}</span>`; sfx.cuenta(false); n--; setTimeout(t, REDUCIR ? 300 : 650); };
    t();
  });
}
let avisoT = 0;
function aviso(txt) { const a = $('#aviso'); a.textContent = txt; a.classList.remove('on'); void a.offsetWidth; a.classList.add('on'); clearTimeout(avisoT); avisoT = setTimeout(() => a.classList.remove('on'), 1300); }
function pausa(on) {
  if (modo !== 'juego') return;
  pausado = on;
  if (on) {
    abreModal(`<span class="kick">PAUSA</span><h3 id="m-tit">${juegoMeta.n}</h3><p>El reloj está detenido.</p><div class="acciones"><button class="jugar" type="button" data-a="seguir">Seguir</button><button class="sec" type="button" data-a="salir">Salir al arcade</button></div>`);
    tarj.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return; cierraModal(); if (a.dataset.a === 'seguir') pausado = false; else salirJuego(); };
  }
}
$('#b-pausa').onclick = () => pausa(true);
$('#b-salir').onclick = () => { if (modo === 'juego') pausa(true); };
document.addEventListener('visibilitychange', () => { if (document.hidden && modo === 'juego' && !pausado) pausa(true); });

function terminar(j, r) {
  if (modo !== 'juego') return;
  modo = 'fin'; pausado = true; musicaPara(); document.documentElement.classList.remove('jugando'); sfx.fin(); vibra([30, 40, 60]);
  const pts = Math.round(r.pts);
  const prev = records(j.id); const record = !prev.length || pts > prev[0].p;
  const { top, puesto } = guardaRecord(j.id, pts);
  evento('arcade_fin', { juego: j.id, puntos: pts });
  bot.pose(record ? 'celebra' : 'triste', 3);
  setTimeout(() => {
    abreModal(`<span class="kick">${record && pts > 0 ? 'NUEVO RÉCORD' : 'FIN DE LA PARTIDA'} · ${j.n.toUpperCase()}</span>
    <div class="res-pts">${fmt(pts)}</div>
    <div class="res-sub"><span class="chip nar">${record && pts > 0 ? 'Tu mejor marca' : 'Tu récord: ' + fmt(top[0].p)}</span>${puesto >= 0 ? `<span class="chip">Puesto ${puesto + 1} de tu top 5</span>` : ''}</div>
    <h3 id="m-tit" style="font-size:clamp(22px,5vw,28px)">${r.frase}</h3>
    ${r.stats ? `<div class="stats">${r.stats.map(s => `<div><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}</div>` : ''}
    ${r.ilus ? `<p class="ilus">${r.ilus}</p>` : ''}
    <div class="cta-demo"><b>${r.gancho || '¿Y si esto lo hiciera tu agente de IA, de verdad, en tu WhatsApp?'}</b><p style="font-size:14px">${j.ens}</p><div class="acciones"><button class="jugar" type="button" data-a="demo">Agenda tu demo</button><a class="sec" href="/planes" data-a="planes">Ver planes</a></div></div>
    <details><summary style="cursor:pointer;font-weight:700;font-size:14px;min-height:32px">Tu top 5 en este equipo</summary><ol class="top5">${top.map((x, k) => `<li class="${k === puesto ? 'yo' : ''}"><span>${k + 1}.</span><span>${fmt(x.p)}</span></li>`).join('')}</ol></details>
    <div class="acciones"><button class="sec" type="button" data-a="compartir">Compartir resultado</button><button class="sec" type="button" data-a="otra">Jugar de nuevo</button><button class="sec" type="button" data-a="hub">Otro juego</button></div>`, '[data-a="demo"]');
    tarj.onclick = async e => {
      const a = e.target.closest('[data-a]'); if (!a) return;
      if (a.dataset.a === 'demo') abreCalendario(j.id);
      if (a.dataset.a === 'planes') evento('arcade_cta_planes', { juego: j.id });
      if (a.dataset.a === 'compartir') { a.textContent = 'Preparando imagen'; const rr = await compartir({ id: j.id, juego: j.n, pts, frase: r.frase }); a.textContent = rr === 'descarga' ? 'Imagen descargada' : 'Compartir resultado'; }
      if (a.dataset.a === 'otra') { cierraModal(); limpiaJuego(); empezar(JUEGOS.indexOf(j)); }
      if (a.dataset.a === 'hub') { cierraModal(); salirJuego(); }
    };
  }, 900);
}
function limpiaJuego() {
  if (juego && juego.limpia) juego.limpia();
  juego = null; part.L.length = 0;
  if (bot.g.parent) bot.g.parent.remove(bot.g);
  bot.pose('idle');
}
function salirJuego() { limpiaJuego(); volverHub(); }
function volverHub() {
  musicaPara(); modo = 'hub'; juegoMeta = null; pausado = false;
  $('#hud').classList.remove('on'); document.documentElement.classList.remove('jugando'); $('#hub').classList.remove('fuera'); $('#b-salir').hidden = true;
  history.replaceState(null, '', location.pathname + location.search);
  bot.g.position.set(0, .14, .35); bot.g.scale.setScalar(1.25); bot.g.rotation.set(0, 0, 0); H.scene.add(bot.g);
  glEn = 'full'; ajustaGL(); selecciona(idx, true);
  g.setTransform(1, 0, 0, 1, 0, 0);
}

// ───────── bucle ─────────
let ultimo = performance.now();
function bucle(ahora) {
  requestAnimationFrame(bucle);
  let dt = (ahora - ultimo) / 1000; ultimo = ahora; if (dt > .1) dt = .1;
  reloj += dt;
  vigila(dt);
  if (modo === 'hub' || modo === 'cargando') {
    g.setTransform(1, 0, 0, 1, 0, 0); fondoHub(reloj);
    pasoHub(dt, reloj);
  } else if ((modo === 'juego' || modo === 'fin') && juego) {
    const dtj = pausado ? 0 : dt;
    juego.paso(dtj, reloj);
    if (!pausado) part.paso(dt);
    if (glEn === 'coach') coachPaso(dt, reloj);
    else if (performance.now() > bocHasta) boc.classList.remove('on');
    else { boc.style.left = Math.max(12, (W.w - boc.offsetWidth) / 2) + 'px'; boc.style.top = Math.round(W.h * .56) + 'px'; }
    if (ptsMostrados !== ptsReal) { ptsMostrados = ptsMostrados + (ptsReal - ptsMostrados) * cl(dt * 12, 0, 1); if (Math.abs(ptsReal - ptsMostrados) < 1) ptsMostrados = ptsReal; hud.pts.textContent = fmt(ptsMostrados); }
  }
}
boot().catch(e => { console.error(e); carga(1, 'Tu navegador no pudo abrir el arcade 3D. Prueba con Chrome o Safari actualizados.'); });

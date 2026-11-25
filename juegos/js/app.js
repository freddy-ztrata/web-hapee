// Hapee Arcade · hub 3D + motor de partidas. Un renderer, un robot, seis juegos cargados a pedido.
import { cargarThree, crearBot } from './bot.js?v=2';
import { $, cl, lerp, rnd, REDUCIR, sfx, vibra, audio, esMudo, setMudo, musicaInicia, musicaPara, musicaTempo, crearParticulas, records, guardaRecord, fmt, compartir, abreCalendario, cierraCalendario, evento } from './comun.js?v=2';

export const JUEGOS = [
  { id: 'ruta-hapee', n: 'Ruta Hapee', bpm: 132,
    desc: 'Corre a toda velocidad por la autopista de los leads. Esquiva planillas, post-its y respuestas tardías.',
    ens: 'Hapee reemplaza más de 25 herramientas: CRM, email, automatización, reportería y tu sitio web en una sola cuenta.',
    como: ['Desliza a los lados para cambiar de pista.', 'Desliza hacia arriba para saltar.', 'Workflow = imán de leads. Agente IA = escudo.'],
    dice: '¡Ruta Hapee! La favorita de todos.' },
  { id: 'arena', n: 'Arena Anti-Spam', bpm: 140,
    desc: 'Oleadas de bots de spam te rodean. Muévete, esquiva y no dejes ninguno en pie. Al final llega el Mega Spam.',
    ens: 'Los agentes de Hapee filtran el spam y atienden solo a los clientes reales, 24/7.',
    como: ['Arrastra en cualquier parte para moverte. Yo disparo solo.', 'Toque rápido = impulso para esquivar.', 'Junta los leads que sueltan los bots.'],
    dice: '¡Arena Anti-Spam! Yo disparo, tú esquivas.' },
  { id: 'vuelo', n: 'Vuelo Nocturno', bpm: 124,
    desc: 'Mochila cohete y la ciudad de noche. Pasa entre las torres, atrapa leads y cruza los anillos de canal.',
    ens: 'Tu agente de Hapee atiende de noche igual que de día, en WhatsApp, Instagram, Facebook y tu web.',
    como: ['Mantén presionado para subir. Suelta para bajar.', 'Pasar rozando una torre da puntos extra.', 'Los anillos de colores dan +500.'],
    dice: '¡Vuelo Nocturno! Agárrate fuerte.' },
  { id: 'derrape', n: 'Derrape', bpm: 128,
    desc: 'Tres vueltas en kart flotante contra los karts de spam. Derrapa en las curvas y suelta para salir con turbo.',
    ens: 'En ventas gana el que responde primero: el agente de Hapee contesta en segundos, cada vez.',
    como: ['Arrastra a los lados para doblar.', 'Dobla fuerte para derrapar; suelta para el turbo.', 'Las flechas verdes dan turbo gratis.'],
    dice: '¡Derrape! Tres vueltas, cero frenos.' },
  { id: 'torre', n: 'Torre Arriba', bpm: 118,
    desc: 'Rebota de plataforma en plataforma hasta el cielo. Cuidado con los «visto»: se rompen.',
    ens: 'Con Hapee ningún mensaje queda en visto: cada respuesta a tiempo es un escalón más.',
    como: ['Desliza a los lados; yo salto solo.', 'Las verdes te lanzan alto. Las grises se rompen.', 'Cae encima de los bots de spam para aplastarlos.'],
    dice: '¡Torre Arriba! ¿Hasta dónde llegamos?' },
  { id: 'demoledor', n: 'Demoledor', bpm: 110,
    desc: 'Tú me lanzas, yo vuelo. Derriba las torres de spam con el menor número de tiros.',
    ens: 'Los agentes de Hapee derriban el spam de tu bandeja y dejan pasar solo a los clientes.',
    como: ['Arrastra hacia atrás para apuntar y suelta para lanzarme.', 'Bot de spam en el suelo = +1.000.', 'Robots que sobran al limpiar la torre = bono.'],
    dice: '¡Demoledor! Hoy soy la bala de cañón.' },
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
  else setTimeout(() => { bot.pose('saluda', 2.2); dice('¡Hola! Toca el piso para caminar conmigo y entra a un portal.', 3800); }, 700);
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
  if (j.id === 'ruta-hapee') { x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 6; for (const a of [-1, -.33, .33, 1]) { x.beginPath(); x.moveTo(a * 40, -170); x.lineTo(a * 230, 230); x.stroke(); } for (let i = 0; i < 6; i++) { const y = -140 + i * i * 12, s = .3 + i * .16; x.fillStyle = i % 2 ? '#FFF1E8' : '#FA5000'; x.beginPath(); x.arc((i % 3 - 1) * 70 * s, y, 18 * s + 4, 0, 7); x.fill(); } x.fillStyle = gr; x.beginPath(); x.roundRect(-110, 120, 220, 54, 14); x.fill(); x.fillStyle = '#fff'; x.font = '800 24px "Plus Jakarta Sans",sans-serif'; x.textAlign = 'center'; x.fillText('PLANILLA', 0, 156); }
  if (j.id === 'arena') { x.strokeStyle = 'rgba(250,80,0,.5)'; x.lineWidth = 6; x.beginPath(); x.arc(0, 40, 190, 0, 7); x.stroke(); for (const [cx, cy, r] of [[-120, -40, 40], [130, 0, 30], [-60, 150, 34], [110, 140, 46], [0, -150, 26]]) { x.fillStyle = '#3a0a10'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.fillStyle = '#ff2a2a'; x.beginPath(); x.arc(cx, cy, r * .35, 0, 7); x.fill(); } x.fillStyle = gr; x.beginPath(); x.arc(0, 40, 44, 0, 7); x.fill(); x.strokeStyle = '#FFC9A8'; x.lineWidth = 8; x.beginPath(); x.moveTo(30, 20); x.lineTo(110, 130); x.stroke(); }
  if (j.id === 'vuelo') { for (let i = 0; i < 7; i++) { const h = 90 + (i * 53) % 160; x.fillStyle = 'rgba(255,255,255,.08)'; x.fillRect(-230 + i * 70, 230 - h, 50, h); } x.fillStyle = '#FFB48A'; x.beginPath(); x.arc(130, -130, 46, 0, 7); x.fill(); x.strokeStyle = '#25C26A'; x.lineWidth = 12; x.beginPath(); x.ellipse(-40, -20, 34, 70, 0, 0, 7); x.stroke(); x.fillStyle = gr; x.beginPath(); x.moveTo(-180, 60); x.quadraticCurveTo(-60, -60, 60, -10); x.lineTo(60, 10); x.quadraticCurveTo(-60, -30, -180, 80); x.fill(); }
  if (j.id === 'derrape') { x.strokeStyle = 'rgba(255,255,255,.15)'; x.lineWidth = 60; x.beginPath(); x.ellipse(0, 30, 180, 120, 0, 0, 7); x.stroke(); x.strokeStyle = gr; x.lineWidth = 10; x.setLineDash([24, 18]); x.beginPath(); x.ellipse(0, 30, 180, 120, 0, 0, 7); x.stroke(); x.setLineDash([]); x.fillStyle = '#FA5000'; x.beginPath(); x.roundRect(60, 100, 90, 54, 14); x.fill(); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#FF3D7F' : '#FFD080'; x.beginPath(); x.arc(40 - i * 16, 150 + (i % 3) * 6, 7 - i * .6, 0, 7); x.fill(); } }
  if (j.id === 'torre') { for (let i = 0; i < 7; i++) { x.fillStyle = i === 2 ? '#25C26A' : i === 4 ? '#8A7A80' : '#FFF1E8'; x.beginPath(); x.roundRect(-150 + ((i * 97) % 220), 200 - i * 60, 110, 20, 10); x.fill(); } x.fillStyle = gr; x.beginPath(); x.arc(-10, -170, 30, 0, 7); x.fill(); x.strokeStyle = 'rgba(250,80,0,.5)'; x.lineWidth = 4; x.setLineDash([8, 10]); x.beginPath(); x.moveTo(-10, -140); x.quadraticCurveTo(60, -40, 20, 60); x.stroke(); x.setLineDash([]); }
  if (j.id === 'demoledor') { const B = (bx, by, w, h, c) => { x.fillStyle = c; x.fillRect(bx, by, w, h); x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = 4; x.strokeRect(bx, by, w, h); }; B(40, 120, 60, 110, '#8a1424'); B(140, 120, 60, 110, '#8a1424'); B(30, 90, 180, 30, '#5a4a52'); B(70, 20, 50, 70, '#a01830'); B(120, 20, 50, 70, '#8a1424'); x.fillStyle = '#3a0a10'; x.beginPath(); x.arc(120, -20, 30, 0, 7); x.fill(); x.fillStyle = '#ff2a2a'; x.beginPath(); x.arc(120, -20, 10, 0, 7); x.fill(); x.fillStyle = gr; x.beginPath(); x.arc(-140, -60, 40, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,241,232,.5)'; x.lineWidth = 5; x.setLineDash([10, 12]); x.beginPath(); x.moveTo(-100, -80); x.quadraticCurveTo(-20, -200, 80, -40); x.stroke(); x.setLineDash([]); }
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
  H.piso = new THREE.Mesh(new THREE.CircleGeometry(11, 96), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false }));
  H.piso.rotation.x = -Math.PI / 2; S.add(H.piso);
  // pedestal
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(.62, .7, .14, 64), new THREE.MeshPhysicalMaterial({ color: 0x1a0a10, roughness: .25, metalness: .3, clearcoat: 1 }));
  ped.position.y = .07; S.add(ped); H.ped = ped;
  const aro = new THREE.Mesh(new THREE.TorusGeometry(.66, .012, 8, 96), new THREE.MeshBasicMaterial({ color: 0xff6a20, toneMapped: false }));
  aro.rotation.x = Math.PI / 2; aro.position.y = .145; S.add(aro); H.aro = aro;
  // portales en anillo alrededor de la plaza (miran al centro)
  H.car = new THREE.Group(); S.add(H.car);
  H.portales = [];
  const RADIO = H.radio = 7.2;
  const gradTex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 256; const x = c.getContext('2d'); const gg = x.createLinearGradient(0, 256, 0, 0); gg.addColorStop(0, '#FA5000'); gg.addColorStop(1, '#CD2349'); x.fillStyle = gg; x.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const marco = marcoGeo(1.5, 2.15, .32, .07);
  { const p = marco.attributes.position, uv = marco.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, .5, p.getY(i) / 2.15); }
  const hc = document.createElement('canvas'); hc.width = hc.height = 128; { const hx = hc.getContext('2d'); const hg = hx.createRadialGradient(64, 64, 0, 64, 64, 64); hg.addColorStop(0, 'rgba(250,80,0,.6)'); hg.addColorStop(1, 'rgba(250,80,0,0)'); hx.fillStyle = hg; hx.fillRect(0, 0, 128, 128); }
  const haloTex = new THREE.CanvasTexture(hc);
  JUEGOS.forEach((j, i) => {
    const gp = new THREE.Group(); const an = i / JUEGOS.length * Math.PI * 2 + Math.PI;
    gp.position.set(Math.sin(an) * RADIO, 0, Math.cos(an) * RADIO); gp.lookAt(0, 0, 0); gp.scale.setScalar(1.45);
    const m = new THREE.Mesh(marco, new THREE.MeshBasicMaterial({ map: gradTex, toneMapped: false })); m.position.z = -.03; gp.add(m);
    const pt = new THREE.CanvasTexture(posterArte(j)); pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = 4;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 1.92), new THREE.MeshBasicMaterial({ map: pt, toneMapped: false })); pl.position.set(0, 1.075, 0); gp.add(pl);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.6), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); halo.position.set(0, 1.08, -.25); halo.renderOrder = -2; gp.add(halo);
    // plataforma de llegada frente al portal
    const pad = new THREE.Mesh(new THREE.RingGeometry(.55, .75, 48), new THREE.MeshBasicMaterial({ color: 0xfa5000, transparent: true, opacity: .5, toneMapped: false, side: THREE.DoubleSide })); pad.rotation.x = -Math.PI / 2; pad.position.set(0, .02, 1.1); gp.add(pad);
    gp.userData = { pl, halo, marco: m, pad, an, punto: new THREE.Vector3(Math.sin(an) * (RADIO - 1.7), 0, Math.cos(an) * (RADIO - 1.7)) };
    H.car.add(gp); H.portales.push(gp);
  });
  // leads flotando para juntar en la plaza
  H.leads = [];
  const geoL = new THREE.IcosahedronGeometry(.18, 1), mL = new THREE.MeshStandardMaterial({ color: 0xff7a30, emissive: 0xfa5000, emissiveIntensity: 1.6 });
  for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(geoL, mL); const a = rnd(0, Math.PI * 2), r = rnd(1.6, 5.4); m.position.set(Math.cos(a) * r, .7, Math.sin(a) * r); m.userData.f = rnd(0, 6); S.add(m); H.leads.push(m); }
  H.juntados = 0;
  // partículas: leads que suben
  const N = MOVIL ? 160 : 320, pos = new Float32Array(N * 3), vel = new Float32Array(N);
  for (let i = 0; i < N; i++) { const a = rnd(0, Math.PI * 2), r = rnd(1.2, 6); pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = rnd(0, 4); pos[i * 3 + 2] = Math.sin(a) * r - 1; vel[i] = rnd(.08, .35); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sx = sc.getContext('2d'); const sg = sx.createRadialGradient(32, 32, 0, 32, 32, 32); sg.addColorStop(0, 'rgba(255,220,190,1)'); sg.addColorStop(.25, 'rgba(250,110,40,.8)'); sg.addColorStop(1, 'rgba(250,80,0,0)'); sx.fillStyle = sg; sx.fillRect(0, 0, 64, 64);
  H.pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: .07, map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  H.pts.userData.vel = vel; S.add(H.pts);
  H.giro = 0; H.giroObj = 0; H.arrastre = null;
  // robot al centro
  H.pos = new THREE.Vector3(0, .14, 2.2); H.obj = null; H.rumbo = 0;
  bot.g.position.copy(H.pos); bot.g.scale.setScalar(1.15);
  S.add(bot.g);
  H.ray = new THREE.Raycaster(); H.plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
}
function hubCam(dt) {
  const asp = W.w / W.h; H.cam.aspect = asp;
  const vert = asp < .8, ancho = !vert && W.w >= 900;
  H.cam.fov = vert ? 58 : 46;
  const p = H.pos;
  // dirección: del centro hacia el portal elegido (la cámara va detrás del robot mirando al portal)
  const pt = H.portales[idx].userData.punto, objD = new THREE.Vector3(pt.x, 0, pt.z).normalize();
  H.dir = H.dir || objD.clone(); H.dir.lerp(objD, cl(dt * 2, 0, 1)).normalize();
  const lado = ancho ? new THREE.Vector3(H.dir.z, 0, -H.dir.x).multiplyScalar(2.4) : new THREE.Vector3();
  const obj = p.clone().addScaledVector(H.dir, vert ? -5.6 : -6.8).add(lado).setY(vert ? 3.3 : 3.6);
  if (!H.camOk) { H.cam.position.copy(obj); H.camOk = true; }
  H.cam.position.lerp(obj, cl(dt * 3, 0, 1));
  H.mira = H.mira || p.clone();
  H.mira.lerp(p.clone().addScaledVector(H.dir, vert ? 3.2 : 3).add(lado).setY(vert ? .55 : 1.2), cl(dt * 3, 0, 1));
  H.cam.lookAt(H.mira);
  H.cam.updateProjectionMatrix();
}
function pasoHub(dt, t) {
  // caminar hacia el objetivo (toque, flechas o un portal elegido)
  const teclas = H.teclas || {};
  const kx = ((teclas.ArrowRight || teclas.d) ? 1 : 0) - ((teclas.ArrowLeft || teclas.a) ? 1 : 0), kz = ((teclas.ArrowDown || teclas.s) ? 1 : 0) - ((teclas.ArrowUp || teclas.w) ? 1 : 0);
  let mov = new THREE.Vector3();
  if (kx || kz) { mov.set(kx, 0, kz).normalize(); H.obj = null; }
  else if (H.obj) { mov.copy(H.obj).sub(H.pos).setY(0); const d = mov.length(); if (d < .15) { H.obj = null; mov.set(0, 0, 0); } else mov.multiplyScalar(1 / d); }
  const v = 4.6;
  H.pos.addScaledVector(mov, v * dt);
  const L = Math.hypot(H.pos.x, H.pos.z); if (L > H.radio - 1.4) { H.pos.x *= (H.radio - 1.4) / L; H.pos.z *= (H.radio - 1.4) / L; }
  H.pos.y = Math.hypot(H.pos.x, H.pos.z) < .7 ? .14 : 0;
  const mueve = mov.lengthSq() > .01;
  if (mueve) { const a = Math.atan2(mov.x, mov.z); let da = a - H.rumbo; da = Math.atan2(Math.sin(da), Math.cos(da)); H.rumbo += da * cl(dt * 12, 0, 1); if (bot.st.pose !== 'corre') bot.pose('corre'); }
  else if (bot.st.pose === 'corre') bot.pose('idle');
  bot.g.position.copy(H.pos); bot.g.rotation.y = H.rumbo;
  // el portal más cercano manda la ficha
  let cerca = -1, cd = 1e9;
  H.portales.forEach((p, i) => { const d = p.userData.punto.distanceTo(H.pos); if (d < cd) { cd = d; cerca = i; } });
  if (cd < 2.2 && cerca !== idx) { selecciona(cerca); }
  const enPortal = cd < 1.4 && cerca === idx;
  if (enPortal && !H.enPortal && !mueve) { bot.pose('saluda', 1.2); }
  H.enPortal = enPortal;
  H.portales.forEach((p, i) => {
    const act = i === idx;
    p.userData.halo.material.opacity = act ? .85 + .15 * Math.sin(t * 3) : .18;
    p.userData.pad.material.opacity = act ? .55 + .35 * Math.sin(t * 5) : .25;
    p.userData.pad.scale.setScalar(act ? 1 + .08 * Math.sin(t * 5) : 1);
    p.scale.setScalar(1.45 * (act ? 1.04 : 1));
  });
  // leads de la plaza
  for (const m of H.leads) {
    if (!m.visible) { m.userData.t -= dt; if (m.userData.t <= 0) { const a = rnd(0, Math.PI * 2), r = rnd(1.6, 5.4); m.position.set(Math.cos(a) * r, .7, Math.sin(a) * r); m.visible = true; } continue; }
    m.position.y = .7 + Math.sin(t * 2 + m.userData.f) * .12; m.rotation.y += dt * 2;
    if (m.position.distanceTo(new THREE.Vector3(H.pos.x, .7, H.pos.z)) < .7) { m.visible = false; m.userData.t = 6; H.juntados++; sfx.bien(H.juntados % 11); vibra(8); if (H.juntados === 10) dice('¡Diez leads! Ahora juega uno de verdad.', 2200); }
  }
  H.piso.rotation.z += dt * .03; H.aro.material.color.setHSL(.05 + .02 * Math.sin(t), 1, .55);
  const pa = H.pts.geometry.attributes.position, vv = H.pts.userData.vel;
  for (let i = 0; i < vv.length; i++) { let y = pa.getY(i) + vv[i] * dt; if (y > 4.2) y = 0; pa.setY(i, y); }
  pa.needsUpdate = true;
  bot.update(t, dt);
  hubCam(dt);
  R.render(H.scene, H.cam);
  bocadilloPos(H.cam, bot.g, 1.5);
}
function irAPortal(i) { H.obj = H.portales[i].userData.punto.clone(); document.documentElement.classList.add('paseando'); }
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
JUEGOS.forEach((j, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', j.n); b.innerHTML = '<i></i>'; b.onclick = () => { sfx.tap(); selecciona(i); irAPortal(i); }; pts.appendChild(b); });
function selecciona(i, silencio) {
  idx = (i + JUEGOS.length) % JUEGOS.length; const j = JUEGOS[idx];
  $('#f-num').textContent = `JUEGO 0${idx + 1} / 06`; $('#f-nom').textContent = j.n; $('#f-desc').textContent = j.desc;
  $('#f-ens').innerHTML = '<b>Lo que entrena:</b> ' + j.ens;
  const r = records(j.id); $('#f-rec').textContent = r.length ? 'Tu récord: ' + fmt(r[0].p) : 'Sin récord todavía';
  [...pts.children].forEach((b, k) => b.setAttribute('aria-current', k === idx ? 'true' : 'false'));
  if (!silencio) { dice(j.dice, 2600); sfx.whoosh(); }
}
$('#b-ant').onclick = () => { selecciona(idx - 1); irAPortal(idx); };
$('#b-sig').onclick = () => { selecciona(idx + 1); irAPortal(idx); };
$('#b-jugar').onclick = () => { audio(); abrirIntro(idx); };
$('#b-demo-top').onclick = () => abreCalendario(juegoMeta ? juegoMeta.id : 'hub');
$('#b-cierra-demo').onclick = cierraCalendario;
$('#hoja-demo').addEventListener('click', e => { if (e.target.id === 'hoja-demo') cierraCalendario(); });
const bS = $('#b-sonido');
function pintaSonido() { bS.setAttribute('aria-pressed', esMudo() ? 'true' : 'false'); bS.setAttribute('aria-label', esMudo() ? 'Activar sonido' : 'Silenciar sonido'); bS.querySelector('.on').style.opacity = esMudo() ? .15 : 1; }
bS.onclick = () => { setMudo(!esMudo()); pintaSonido(); }; pintaSonido();

function sueloEn(e) { const v = new THREE.Vector2(e.clientX / W.w * 2 - 1, -(e.clientY / W.h) * 2 + 1); H.ray.setFromCamera(v, H.cam); const p = new THREE.Vector3(); return H.ray.ray.intersectPlane(H.plano, p) ? p : null; }
let ini = null;
toque.addEventListener('pointerdown', e => {
  audio();
  if (modo === 'hub') { ini = { x: e.clientX, y: e.clientY, t: performance.now() }; const p = sueloEn(e); if (p) H.obj = p; toque.setPointerCapture(e.pointerId); document.documentElement.classList.add('paseando'); }
  if (modo === 'juego' && juego && juego.abajo && !pausado) juego.abajo(e);
});
toque.addEventListener('pointermove', e => {
  if (modo === 'hub' && ini) { const p = sueloEn(e); if (p) H.obj = p; }
  if (modo === 'juego' && juego && juego.mueve && !pausado) juego.mueve(e);
});
const suelta = e => {
  if (modo === 'hub' && ini) {
    // toque sobre un portal: ir hacia él
    const v = new THREE.Vector2(e.clientX / W.w * 2 - 1, -(e.clientY / W.h) * 2 + 1); H.ray.setFromCamera(v, H.cam);
    const hit = H.ray.intersectObjects(H.portales.map(p => p.userData.pl), false)[0];
    if (hit) { const i = H.portales.findIndex(p => p.userData.pl === hit.object); selecciona(i); irAPortal(i); }
    ini = null;
  }
  if (modo === 'juego' && juego && juego.arriba && !pausado) juego.arriba(e);
};
toque.addEventListener('pointerup', suelta); toque.addEventListener('pointercancel', suelta);
addEventListener('keyup', e => { if (H.teclas) H.teclas[e.key] = false; if (modo === 'juego' && juego && juego.teclaArriba) juego.teclaArriba(e); });
addEventListener('keydown', e => {
  if (!$('#modal').hidden || !$('#hoja-demo').hidden) { if (e.key === 'Escape') { if (!$('#hoja-demo').hidden) cierraCalendario(); } return; }
  if (modo === 'hub') {
    H.teclas = H.teclas || {}; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(e.key)) { H.teclas[e.key] = true; e.preventDefault(); } else if (e.key === 'Enter' && document.activeElement === document.body) abrirIntro(idx);
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
  abreModal(`<span class="kick">JUEGO 0${idx + 1} · 3D</span><h3 id="m-tit">${j.n}</h3><p>${j.desc}</p>
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
  try { mod = await import(`./j-${j.id}.js?v=2`); } catch (e) { console.error(e); modo = 'hub'; $('#hub').classList.remove('fuera'); return; }
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
  glEn = 'full'; ajustaGL();
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
  bot.g.quaternion.identity(); bot.g.rotation.set(0, 0, 0); bot.g.scale.setScalar(1.15); H.pos.copy(H.portales[idx].userData.punto); H.obj = null; H.scene.add(bot.g); bot.pose('saluda', 1.5);
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

// Hapee · showcase «el robot te muestra los casos de éxito» (25-11-2026, maqueta noindex).
// Una línea de tiempo determinista (seek(t)) mueve todo: el robot camina por una galería, se detiene frente a cada
// pantalla y el cliente habla (fragmento del video testimonial real de /img/casos/, mismo dato que /js/home/casos.json).
// En vivo: el audio se arma con OfflineAudioContext y el reloj es el AudioContext (sincronía exacta).
// Render: ?render=1 + window.__seek(t) / __audio() para _build/render-cuadros.mjs (9:16 y 16:9).
import { kit, renderer, robot, particulas, propulsores, luces } from '../robokit.js?v=1';

const q = new URLSearchParams(location.search), RENDER = q.has('render');
if (RENDER) document.documentElement.classList.add('rend');
const $ = s => document.querySelector(s);
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = x => { x = cl(x, 0, 1); return x * x * (3 - 2 * x); };
const io = x => { x = cl(x, 0, 1); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const o4 = x => 1 - Math.pow(1 - cl(x, 0, 1), 4);

// Fragmentos elegidos con la transcripción (whisper) de cada video; subtítulos = palabras dichas
// («Happy» es como suena Hapee; «SRM» se oye por CRM). Tiempos en segundos DEL VIDEO.
const CASOS = [
  { id: 'fiebre', src: '/img/casos/caso-fiebre-de-cumbia-df006034.mp4', poster: '/img/casos/caso-fiebre-de-cumbia-poster-0add044b.jpg', ex: [15.95, 24.15],
    emp: 'Fiebre de Cumbia · La Fonda', quien: 'Festival con entradas agotadas',
    subs: [[15.95, 'Los agentes de IA de Hapee fueron fundamentales.'], [18.75, 'Jugaron un rol clave en la respuesta 24/7'], [21.85, 'y obviamente aún mejoraron los resultados comerciales.']] },
  { id: 'oferta', src: '/img/casos/caso-la-oferta-edaf6cca.mp4', poster: '/img/casos/caso-la-oferta-poster-b5cac7e3.jpg', ex: [10.75, 17.95],
    emp: 'La Oferta', quien: 'Óscar Retamal · Gerente Comercial',
    subs: [[10.75, 'Hoy día Hapee efectivamente nos permite tener'], [13.95, 'respuestas más claras, inmediatas, automáticas hacia clientes.']] },
  { id: 'acma', src: '/img/casos/caso-acma-8c9ea939.mp4', poster: '/img/casos/caso-acma-poster-33d37bbe.jpg', ex: [29.55, 36.1],
    emp: 'Acma', quien: 'Bárbara Albornoz · Jefa de Marketing',
    subs: [[29.55, 'Sigue todo funcionando y nosotros podemos'], [31.55, 'también dedicarnos a otras actividades.'], [33.35, 'Así que con Hapee tengo todo en un solo lugar.']] },
  { id: 'heli', src: '/img/casos/caso-heli-2aea3d3b.mp4', poster: '/img/casos/caso-heli-poster-ce33ba47.jpg', ex: [4.65, 13.95],
    emp: 'HELI Forklift Chile', quien: 'Alain · HELI Forklift Chile',
    subs: [[4.65, 'Ha sido bastante fácil poder integrar'], [6.55, 'nuestra información con el CRM, con Hapee en este caso,'], [10.75, 'y nos ha permitido poder estar en contacto 24/7 con nuestros clientes.']] }
];

// ── línea de tiempo ──
const INTRO = 2.0, CAMINA = 1.6, VUELO = 2.4, OUTRO = 3.6;
const TL = []; let T = INTRO;
CASOS.forEach((c, i) => { c.i = i; c.w0 = T; c.a = T + CAMINA; c.b = c.a + (c.ex[1] - c.ex[0]); T = c.b; });
const F0 = T, F1 = T + VUELO, D = F1 + OUTRO;

// ── galería ──
const SEP = 3.3, Z0 = -3.6;
CASOS.forEach((c, i) => { c.lado = i % 2 ? 1 : -1; c.z = Z0 - i * SEP; });
const ZFIN = Z0 - CASOS.length * SEP - .6;

let K, THREE, R, S, cam, bot, part, jet, vertical = false;
const E = { tBot: 0, ult: 0, enVuelo: false };

function texto(lineas, w = 1024, h = 256) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  x.clearRect(0, 0, w, h);
  lineas.forEach(([t, px, peso, col, y]) => { x.font = `${peso} ${px}px "Plus Jakarta Sans",sans-serif`; x.fillStyle = col; x.textBaseline = 'alphabetic'; x.fillText(t, 8, y); });
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return tx;
}

function galeria() {
  S = new THREE.Scene(); luces(K, S);
  S.fog = new THREE.FogExp2(0x080808, .055);
  S.background = new THREE.Color(0x080808);
  const largo = -ZFIN + 6, ancho = 4.4, alto = 3.4;
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(ancho, largo), new THREE.MeshStandardMaterial({ color: 0x141012, roughness: .38, metalness: .25 }));
  piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0, -largo / 2 + 3); S.add(piso);
  const muroM = new THREE.MeshStandardMaterial({ color: 0x100d0e, roughness: .85 });
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(largo, alto), muroM); m.rotation.y = -s * Math.PI / 2; m.position.set(s * ancho / 2, alto / 2, -largo / 2 + 3); S.add(m);
    // líneas de luz en el zócalo y el cielo (degradado de marca en emisivo)
    for (const y of [.03, alto - .04]) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(.03, .025, largo), new THREE.MeshBasicMaterial({ color: y < 1 ? 0xFA5000 : 0xCD2349 }));
      l.position.set(s * (ancho / 2 - .02), y, -largo / 2 + 3); S.add(l);
    }
  }
  const cielo = new THREE.Mesh(new THREE.PlaneGeometry(ancho, largo), new THREE.MeshStandardMaterial({ color: 0x0b0909, roughness: 1 }));
  cielo.rotation.x = Math.PI / 2; cielo.position.set(0, alto, -largo / 2 + 3); S.add(cielo);
  // franjas de luz en el piso, hacia el fondo
  for (let z = 1; z > ZFIN; z -= 1.1) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(.5, .025), new THREE.MeshBasicMaterial({ color: 0xFA5000, transparent: true, opacity: .35 }));
    f.rotation.x = -Math.PI / 2; f.position.set(0, .002, z); S.add(f);
  }
  // pantallas con los videos
  for (const c of CASOS) {
    const v = document.createElement('video');
    v.src = c.src; v.crossOrigin = 'anonymous'; v.muted = true; v.playsInline = true; v.preload = 'auto'; v.poster = c.poster;
    c.v = v;
    const vt = new THREE.VideoTexture(v); vt.colorSpace = THREE.SRGBColorSpace; c.vt = vt;
    const g = new THREE.Group(); const W = 2.3, H = W * 9 / 16;
    const marco = new THREE.Mesh(new THREE.BoxGeometry(W + .1, H + .1, .06), new THREE.MeshStandardMaterial({ color: 0x1c1718, roughness: .4, metalness: .5 }));
    marco.position.z = -.035; g.add(marco);
    const brillo = new THREE.Mesh(new THREE.PlaneGeometry(W + .34, H + .34), new THREE.MeshBasicMaterial({ color: 0xFA5000, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    brillo.position.z = -.07; g.add(brillo); c.brillo = brillo;
    const pan = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: vt, toneMapped: false, color: 0x555555 }));
    pan.position.z = .002; g.add(pan); c.pan = pan;
    const rot = texto([[c.emp, 64, 800, '#F5F3F0', 80], [c.quien, 34, 600, 'rgba(245,243,240,.6)', 140]], 1024, 170);
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(W, W * 170 / 1024), new THREE.MeshBasicMaterial({ map: rot, transparent: true, toneMapped: false }));
    placa.position.set(0, H / 2 + .25, 0); g.add(placa);
    g.position.set(c.lado * 1.62, 1.6, c.z); g.rotation.y = -c.lado * .62;
    S.add(g); c.g = g;
    c.C = new THREE.Vector3(c.lado * 1.62, 1.6, c.z);
    c.n = new THREE.Vector3(-c.lado * Math.sin(.62), 0, Math.cos(.62)); // normal de la pantalla (hacia el pasillo)
    const luz = new THREE.PointLight(0xffffff, 0, 3, 2); luz.position.copy(c.C).addScaledVector(c.n, .8); S.add(luz); c.luz = luz;
  }
  // muro final con el logo (sin placa: el PNG transparente va directo sobre el muro)
  const lt = new THREE.TextureLoader().load('/img/logo-hapee.png', t => { t.colorSpace = THREE.SRGBColorSpace; });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .74), new THREE.MeshBasicMaterial({ map: lt, transparent: true, toneMapped: false }));
  logo.position.set(0, 2.35, ZFIN - .02); S.add(logo);
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), muroM); fondo.position.set(0, alto / 2, ZFIN - .05); S.add(fondo);
  const hc = document.createElement('canvas'); hc.width = hc.height = 256; { const x = hc.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(250,80,0,.55)'); g.addColorStop(.5, 'rgba(205,35,73,.18)'); g.addColorStop(1, 'rgba(205,35,73,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); }
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.position.set(0, 2.2, ZFIN - .04); S.add(halo);
  const finLuz = new THREE.PointLight(0xff6a2a, 4, 6, 2); finLuz.position.set(0, 2, ZFIN + 1.5); S.add(finLuz);
}

// posición del robot en una parada: de pie junto al borde de la pantalla que da al pasillo, a su misma altura de cámara
function paradaBot(c) {
  const tp = new THREE.Vector3(Math.cos(.62), 0, c.lado * Math.sin(.62)).multiplyScalar(-c.lado);
  return new THREE.Vector3(c.C.x, 0, c.C.z).addScaledVector(c.n, .7).addScaledVector(tp, 1.55);
}
const INI = () => new THREE.Vector3(0, 0, 1.4), FIN = () => new THREE.Vector3(vertical ? 0 : -1.0, 0, ZFIN + 1.4);

// cámara de cada parada: de frente a la pantalla, encuadra pantalla + robot
function camCaso(c) {
  const b = paradaBot(c), m = c.C.clone().add(new THREE.Vector3(b.x, .6, b.z)).multiplyScalar(.5); m.y = vertical ? 1.28 : 1.4;
  const p = m.clone().addScaledVector(c.n, vertical ? 5.2 : 4.7); p.y = vertical ? 1.45 : 1.55;
  p.x = cl(p.x, -.6, .6); // en el eje del pasillo: así la pantalla vecina nunca queda entre la cámara y el caso
  return [p, m];
}
function camIni() { return [new THREE.Vector3(0, 1.05, 1.4 + (vertical ? 3.8 : 2.8)), new THREE.Vector3(0, vertical ? 1.25 : .95, 0)]; }
function camFin() { return vertical ? [new THREE.Vector3(0, 1.3, ZFIN + 6.4), new THREE.Vector3(0, 1.45, ZFIN)] : [new THREE.Vector3(0, 1.45, ZFIN + 5.4), new THREE.Vector3(0, 1.35, ZFIN)]; }

const v3 = () => new THREE.Vector3();
let camP, camM;
function estado(t) {
  // devuelve posición del robot, yaw, pose, fuerza de propulsores, cámara y caso activo
  const out = { pos: v3(), yaw: 0, pose: 'idle', fuerza: 0, camina: false, caso: null, vc: 0, salto: 0 };
  let cA, cB, mezcla;
  if (t < INTRO) {
    out.pos.copy(INI()); out.pose = 'saluda'; [cA] = [camIni()]; out.cam = cA; return out;
  }
  for (const c of CASOS) {
    if (t < c.a) { // caminando hacia c
      const prev = CASOS[c.i - 1], A = prev ? paradaBot(prev) : INI(), B = paradaBot(c);
      const u = (t - c.w0) / CAMINA, e = io(u);
      out.pos.lerpVectors(A, B, e); out.camina = true; out.pose = 'corre';
      const dir = B.clone().sub(A); out.yaw = Math.atan2(dir.x, dir.z);
      const [pa, ma] = prev ? camCaso(prev) : camIni(), [pb, mb] = camCaso(c);
      const k = ss(u); out.cam = [pa.clone().lerp(pb, k), ma.clone().lerp(mb, k)];
      // la cámara se levanta un poco a mitad de camino
      out.cam[0].y += Math.sin(Math.PI * u) * .35;
      return out;
    }
    if (t < c.b) {
      out.pos.copy(paradaBot(c)); out.caso = c; out.vc = c.ex[0] + (t - c.a);
      // mira la pantalla y la señala; al final del fragmento, se vuelve hacia la cámara
      const haciaPantalla = Math.atan2(c.C.x - out.pos.x, c.C.z - out.pos.z);
      const fin = ss((t - (c.b - .8)) / .8);
      out.yaw = lerp(haciaPantalla * .55, 0, fin);
      out.pose = (t - c.a) < (c.b - c.a) * .55 ? 'apunta' : 'idle';
      out.cam = camCaso(c);
      return out;
    }
  }
  if (t < F1) { // vuelo final con propulsores hasta el muro del logo
    const last = CASOS[CASOS.length - 1], A = paradaBot(last), B = FIN();
    const u = (t - F0) / VUELO, e = io(u);
    out.pos.lerpVectors(A, B, e); out.pos.y = Math.sin(Math.PI * u) * 1.05;
    out.fuerza = u < .9 ? .5 + .5 * Math.sin(Math.PI * cl(u / .9, 0, 1)) : 0;
    out.yaw = Math.atan2(B.x - A.x, B.z - A.z) * (1 - ss((u - .7) / .3)) + Math.PI * ss((u - .7) / .3) * 0;
    // al final gira de frente a la cámara
    out.yaw = lerp(Math.PI, 0, ss((u - .62) / .38));
    out.salto = Math.sin(Math.PI * u);
    const [pa, ma] = camCaso(last), [pb, mb] = camFin(); const k = ss(u);
    out.cam = [pa.clone().lerp(pb, k), ma.clone().lerp(mb, k)];
    out.pose = 'idle';
    return out;
  }
  out.pos.copy(FIN()); out.pose = 'celebra'; out.cam = camFin();
  return out;
}

let ultPose = '', ultT = 0, poseDesde = 0;
const visto = new Set();
function seek(t) {
  const dt = cl(t - ultT, 0, .1); ultT = t;
  const st = estado(t);
  // robot
  const prevPos = bot.g.position.clone();
  bot.g.position.copy(st.pos); bot.g.scale.setScalar(1);
  bot.g.rotation.set(st.fuerza > .2 ? .22 : 0, st.yaw, 0);
  const dist = prevPos.distanceTo(st.pos);
  E.tBot = t; // reloj del robot = reloj de la pieza (determinista: se puede renderizar por tramos)
  const pose = st.salto > .2 ? 'idle' : st.pose;
  if (pose !== ultPose) { bot.pose(pose, pose === 'saluda' ? 2.2 : 0); ultPose = pose; poseDesde = t; }
  bot.st.mira = st.caso ? 0 : 0;
  bot.update(E.tBot, dt || 1 / 30);
  jet.paso(t, dt || 1 / 30, st.fuerza, 1, null);
  const vuela = st.fuerza > .3;
  if (E.enVuelo && !vuela && t > F0) jet.polvo(1);
  E.enVuelo = vuela;
  part.paso(dt);
  // cámara (con un respiro leve)
  camP = st.cam[0]; camM = st.cam[1];
  cam.position.copy(camP); cam.position.x += Math.sin(t * .4) * .03; cam.position.y += Math.sin(t * .33) * .02;
  cam.lookAt(camM);
  // pantallas: la activa se enciende y brilla
  for (const c of CASOS) {
    const on = st.caso === c ? 1 : 0, cerca = Math.max(on, 1 - Math.min(1, Math.abs(t - (c.a + c.b) / 2) / ((c.b - c.a) / 2 + 2.2)));
    c.pan.material.color.setScalar(lerp(.35, 1, cerca));
    c.brillo.material.opacity = .13 * on + .04 * cerca;
    c.luz.intensity = 2.2 * cerca;
  }
  // capas de texto
  const tit = $('#tit'), op = t < INTRO ? Math.min(o4(t / .6), 1 - ss((t - (INTRO - .5)) / .5)) : 0;
  tit.style.opacity = op; tit.style.transform = `translateY(${(1 - o4(t / .8)) * 18}px)`;
  const ficha = $('#ficha'), sub = $('#sub');
  if (st.caso) {
    const c = st.caso, u = t - c.a, fo = 1 - ss((t - (c.b - .35)) / .35);
    if ($('#emp').textContent !== c.emp) { $('#emp').textContent = c.emp; $('#quien').textContent = c.quien; }
    ficha.style.opacity = o4(u / .5) * fo; ficha.style.transform = `translateY(${(1 - o4(u / .5)) * 14}px)`;
    let s = ''; for (const [a, txt] of c.subs) if (st.vc >= a - .05) s = txt;
    if (sub.textContent !== s) sub.textContent = s;
    sub.style.opacity = fo;
  } else { ficha.style.opacity = 0; sub.style.opacity = 0; }
  const fin = $('#fin'), pf = o4((t - (F1 - .3)) / .7);
  fin.style.opacity = pf; fin.style.transform = `translateY(${(1 - pf) * 20}px)`;
  return st;
}

// ── videos: en render se busca cada cuadro; en vivo se reproducen mudos y se corrige la deriva ──
// En render se usan cuadros extraídos con ffmpeg (?cuadros=1 → /_tmp_cuadros/<id>/NNNN.jpg, ex0 + n/30):
// con seeks en pausa Chrome headless no garantiza el cuadro nuevo. Sin ?cuadros se busca en el video.
const CUADROS = q.has('cuadros');
const imgCache = new Map();
function cuadro(c, n) {
  const url = `/_tmp_cuadros/${c.id}/${String(n).padStart(4, '0')}.jpg`;
  if (imgCache.has(url)) return imgCache.get(url);
  const p = new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = url; });
  imgCache.set(url, p); if (imgCache.size > 40) imgCache.delete(imgCache.keys().next().value);
  return p;
}
async function videosRender(st) {
  if (CUADROS) {
    for (const c of CASOS) {
      let vt = c.ex[0]; if (st.caso === c) vt = st.vc; else if (ultT >= c.b) vt = c.ex[1] - .05;
      const n = Math.max(0, Math.round((vt - c.ex[0]) * 30));
      if (c.nAct === n) continue;
      const im = await cuadro(c, n); if (!im) continue;
      if (!c.texImg) { c.texImg = new THREE.Texture(im); c.texImg.colorSpace = THREE.SRGBColorSpace; c.pan.material.map = c.texImg; c.pan.material.needsUpdate = true; }
      else c.texImg.image = im;
      c.texImg.needsUpdate = true; c.nAct = n;
      cuadro(c, n + 1);
    }
    return;
  }
  const ps = [];
  for (const c of CASOS) {
    let vt = c.ex[0];
    if (st.caso === c) vt = st.vc; else if (ultT >= c.b) vt = c.ex[1];
    if (Math.abs(c.v.currentTime - vt) > .001) ps.push(new Promise(r => { const ok = () => r(); c.v.addEventListener('seeked', ok, { once: true }); setTimeout(ok, 4000); c.v.currentTime = vt; }));
  }
  return Promise.all(ps).then(() => { for (const c of CASOS) c.vt.needsUpdate = true; });
}
function videosVivo(st) {
  for (const c of CASOS) {
    if (st.caso === c) {
      if (Math.abs(c.v.currentTime - st.vc) > .25) c.v.currentTime = st.vc;
      if (c.v.paused) c.v.play().catch(() => {});
    } else if (!c.v.paused) c.v.pause();
  }
}

// ── audio: fragmentos reales + colchón, pasos, propulsores y campana (todo en OfflineAudioContext) ──
let audioBuf = null;
async function armarAudio() {
  const SR = 48000, ac = new OfflineAudioContext(2, Math.ceil(D * SR), SR);
  const master = ac.createGain(); master.connect(ac.destination);
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 2; master.disconnect(); master.connect(comp); comp.connect(ac.destination);
  const NB = ac.createBuffer(1, SR * 2, SR), nd = NB.getChannelData(0); let s0 = 7; for (let i = 0; i < nd.length; i++) { s0 = (s0 * 16807) % 2147483647; nd[i] = s0 / 1073741823 - 1; }
  function ruido(a, b, dest) { const s = ac.createBufferSource(); s.buffer = NB; s.loop = true; s.connect(dest); s.start(a); s.stop(b); }
  // colchón musical suave (acordes cálidos), baja bajo la voz
  const musica = ac.createGain(); musica.gain.value = .5; musica.connect(master);
  const prog = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 55, 59, 64]], dur = 4;
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  for (let b = 0; b * dur < D; b++) {
    const ch = prog[b % 4], t0 = b * dur, t1 = Math.min(D, t0 + dur + 1);
    for (const n of ch) {
      const g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1100; g.connect(lp); lp.connect(musica);
      g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(.018, t0 + 1.2); g.gain.setValueAtTime(.018, Math.max(t0 + 1.3, t1 - 1)); g.gain.linearRampToValueAtTime(.0001, t1);
      for (const [tp, f, dtn] of [['triangle', mtof(n), -4], ['sine', mtof(n + 12), 5]]) { const o = ac.createOscillator(); o.type = tp; o.frequency.value = f; o.detune.value = dtn; o.connect(g); o.start(t0); o.stop(t1); }
    }
  }
  // pulso rítmico suave en los tramos de caminata
  for (const c of CASOS) {
    musica.gain.setValueAtTime(.5, c.a - .2); musica.gain.linearRampToValueAtTime(.16, c.a + .1);
    musica.gain.setValueAtTime(.16, c.b - .2); musica.gain.linearRampToValueAtTime(.5, c.b + .3);
    for (let tt = c.w0 + .12; tt < c.a - .1; tt += .29) paso(tt);
  }
  function paso(tt) {
    const g = ac.createGain(); g.connect(master); g.gain.setValueAtTime(.0001, tt); g.gain.linearRampToValueAtTime(.16, tt + .008); g.gain.exponentialRampToValueAtTime(.001, tt + .14);
    const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(140, tt); o.frequency.exponentialRampToValueAtTime(60, tt + .1); o.connect(g); o.start(tt); o.stop(tt + .16);
    const hb = ac.createBiquadFilter(); hb.type = 'highpass'; hb.frequency.value = 3000; const gn = ac.createGain(); gn.gain.setValueAtTime(.05, tt); gn.gain.exponentialRampToValueAtTime(.001, tt + .05); hb.connect(gn); gn.connect(master);
    ruido(tt, tt + .06, hb);
  }
  // propulsores: ruido filtrado que crece y se va
  { const bp = ac.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.setValueAtTime(400, F0); bp.frequency.linearRampToValueAtTime(1600, F0 + VUELO * .5); bp.frequency.linearRampToValueAtTime(300, F1);
    const g = ac.createGain(); g.gain.setValueAtTime(.0001, F0); g.gain.linearRampToValueAtTime(.32, F0 + .5); g.gain.setValueAtTime(.32, F1 - .6); g.gain.linearRampToValueAtTime(.0001, F1 - .1); bp.connect(g); g.connect(master); ruido(F0, F1, bp);
    musica.gain.setValueAtTime(.5, F0); musica.gain.linearRampToValueAtTime(.8, F1); }
  // campana del cierre
  [76, 81, 84, 88].forEach((n, i) => { const tt = F1 + .05 + i * .08, g = ac.createGain(); g.connect(master); g.gain.setValueAtTime(.0001, tt); g.gain.linearRampToValueAtTime(.06, tt + .01); g.gain.exponentialRampToValueAtTime(.0005, tt + 2.6); const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = mtof(n); o.connect(g); o.start(tt); o.stop(tt + 2.7); });
  // saludo del robot al inicio: dos notas cortas
  [[.5, 81], [.68, 88]].forEach(([tt, n]) => { const g = ac.createGain(); g.connect(master); g.gain.setValueAtTime(.0001, tt); g.gain.linearRampToValueAtTime(.05, tt + .01); g.gain.exponentialRampToValueAtTime(.0005, tt + .5); const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = mtof(n); o.connect(g); o.start(tt); o.stop(tt + .55); });
  // las voces reales de cada video
  for (const c of CASOS) {
    try {
      const ab = await (await fetch(c.src)).arrayBuffer();
      const buf = await ac.decodeAudioData(ab);
      const i0 = Math.floor(c.ex[0] * buf.sampleRate), i1 = Math.floor(c.ex[1] * buf.sampleRate);
      let sum = 0, n = 0; for (let ch = 0; ch < buf.numberOfChannels; ch++) { const d = buf.getChannelData(ch); for (let i = i0; i < i1; i += 4) { sum += d[i] * d[i]; n++; } }
      const rms = Math.sqrt(sum / Math.max(1, n)) || .05, gan = Math.min(6, .11 / rms);
      const src = ac.createBufferSource(); src.buffer = buf;
      const g = ac.createGain(); g.gain.setValueAtTime(.0001, c.a); g.gain.linearRampToValueAtTime(gan, c.a + .12); g.gain.setValueAtTime(gan, c.b - .25); g.gain.linearRampToValueAtTime(.0001, c.b);
      src.connect(g); g.connect(master); src.start(c.a, c.ex[0], c.ex[1] - c.ex[0] + .05);
    } catch (e) { console.warn('[casos] audio', c.id, e); }
  }
  master.gain.setValueAtTime(1, D - 1.2); master.gain.linearRampToValueAtTime(.0001, D - .05);
  const out = await ac.startRendering();
  let pk = 0; for (let ch = 0; ch < 2; ch++) { const d = out.getChannelData(ch); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pk) pk = a; } }
  const gn = pk ? .89 / pk : 1; for (let ch = 0; ch < 2; ch++) { const d = out.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= gn; }
  return out;
}
function toWav(buf) {
  const ch = 2, n = buf.length, sr = buf.sampleRate, bl = n * ch * 2, ab = new ArrayBuffer(44 + bl), v = new DataView(ab);
  const s = (o, x) => { for (let i = 0; i < x.length; i++) v.setUint8(o + i, x.charCodeAt(i)); };
  s(0, 'RIFF'); v.setUint32(4, 36 + bl, true); s(8, 'WAVE'); s(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, bl, true);
  let o = 44; const cs = [buf.getChannelData(0), buf.getChannelData(1)];
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, cs[c][i])); v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7FFF, true); o += 2; }
  return new Uint8Array(ab);
}

function medir() {
  const w = innerWidth, h = innerHeight; vertical = h > w;
  R.setPixelRatio(RENDER ? 1 : Math.min(devicePixelRatio || 1, w < 760 ? 1.75 : 1.5)); R.setSize(w, h, false);
  cam.aspect = w / h; cam.fov = vertical ? 58 : 40; cam.updateProjectionMatrix();
}

async function boot() {
  K = await kit(); THREE = K.THREE;
  R = renderer(K, $('#gl'), { preserve: RENDER, exp: 1.1 });
  cam = new THREE.PerspectiveCamera(40, 1, .05, 60);
  galeria();
  bot = await robot(K); S.add(bot.g);
  part = particulas(K, 600); S.add(part.pts); part.mat.uniforms.esc.value = innerHeight * .5;
  jet = propulsores(K, bot, part);
  medir(); addEventListener('resize', medir);
  await Promise.all(CASOS.map(c => new Promise(r => { if (c.v.readyState >= 2) r(); else { c.v.addEventListener('loadeddata', r, { once: true }); c.v.addEventListener('error', r, { once: true }); setTimeout(r, 15000); } c.v.load(); })));
  await document.fonts.load('800 40px "Plus Jakarta Sans"').catch(() => {});
  window.K = { D };
  window.__seek = async t => { if (t < ultT || t - ultT > .2) { for (let w = Math.max(0, t - 1.2); w < t; w += 1 / 30) seek(w); } const st = seek(t); await videosRender(st); R.render(S, cam); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return t; };
  window.__audio = async () => { const b = await armarAudio(); const u = toWav(b); let bin = ''; for (let i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); window.__wav = btoa(bin); return window.__wav.length; };
  window.__wavChunk = (i, z) => window.__wav.slice(i * z, (i + 1) * z);
  if (RENDER) { await window.__seek(0); window.__listo = true; return; }
  // vista previa quieta detrás del inicio
  seek(.01); R.render(S, cam);
  const go = $('#go'); go.disabled = false; go.textContent = 'Comenzar recorrido';
  go.addEventListener('click', comenzar);
  $('#otra').addEventListener('click', comenzar);
  window.__listo = true;
}

let actx = null, fuente = null, t0 = 0, corriendo = false;
async function comenzar() {
  const go = $('#go'); go.disabled = true; go.textContent = 'Preparando…';
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    await actx.resume();
    audioBuf = audioBuf || await armarAudio();
    if (fuente) try { fuente.stop(); } catch (e) {}
    fuente = actx.createBufferSource(); fuente.buffer = audioBuf; fuente.connect(actx.destination);
    t0 = actx.currentTime + .08; fuente.start(t0);
  } catch (e) { actx = null; t0 = performance.now() / 1000; }
  $('#inicio').classList.add('fuera'); $('#ctrl').style.display = 'none';
  E.tBot = 0; ultT = 0; part.limpia(); corriendo = true; requestAnimationFrame(loop);
}
function ahora() { return actx ? actx.currentTime - t0 : performance.now() / 1000 - t0; }
function loop() {
  if (!corriendo) return;
  const t = Math.max(0, ahora());
  const st = seek(Math.min(t, D)); videosVivo(st); R.render(S, cam);
  if (t >= D) { corriendo = false; $('#ctrl').style.display = 'flex'; for (const c of CASOS) c.v.pause(); return; }
  requestAnimationFrame(loop);
}

boot().catch(e => { console.error('[casos]', e); const go = $('#go'); if (go) { go.textContent = 'No se pudo cargar el 3D'; } });

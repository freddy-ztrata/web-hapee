// Hapee Arcade · piezas compartidas: sonido, vibración, partículas 2D, récords, resultado,
// imagen para compartir y el calendario real de demo (beta.hapee.ai, mismo que /agenda-tu-demo).
export const $ = (s, r = document) => r.querySelector(s);
export const cl = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const REDUCIR = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const COL = { nar: '#FA5000', bur: '#CD2349', ros: '#FF3D7F', cre: '#FFF1E8', tin: '#0B0507', vio: '#1A0A10', ok: '#2BD67B', gris: '#8A7A80' };

// ───────── analítica: solo gtag del sitio (GA4 + Ads). dg_agendar_demo = la conversión existente ─────────
export function evento(nombre, datos) { try { if (typeof gtag === 'function') gtag('event', nombre, datos || {}); } catch (e) {} }

// ───────── sonido (Web Audio, sintetizado: 0 archivos) ─────────
let AC = null, master = null, mudo = false, musica = null;
try { mudo = localStorage.getItem('arcade:mudo') === '1'; } catch (e) {}
export function audio() {
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AC = new C(); master = AC.createGain(); master.gain.value = mudo ? 0 : .55;
    const comp = AC.createDynamicsCompressor(); master.connect(comp); comp.connect(AC.destination);
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
export function esMudo() { return mudo; }
export function setMudo(v) { mudo = v; try { localStorage.setItem('arcade:mudo', v ? '1' : '0'); } catch (e) {} if (master) master.gain.setTargetAtTime(v ? 0 : .55, AC.currentTime, .05); }
function tono(f, d, tipo = 'sine', vol = .3, glide = 0, cuando = 0) {
  const a = audio(); if (!a || mudo) return;
  const t = a.currentTime + cuando, o = a.createOscillator(), gn = a.createGain();
  o.type = tipo; o.frequency.setValueAtTime(f, t); if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * glide), t + d);
  gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(vol, t + .008); gn.gain.exponentialRampToValueAtTime(.0008, t + d);
  o.connect(gn); gn.connect(master); o.start(t); o.stop(t + d + .02);
}
function ruido(d, vol = .2, f = 1800, q = 1, cuando = 0) {
  const a = audio(); if (!a || mudo) return;
  const t = a.currentTime + cuando, n = a.sampleRate * d, buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = a.createBufferSource(), bq = a.createBiquadFilter(), gn = a.createGain();
  bq.type = 'bandpass'; bq.frequency.value = f; bq.Q.value = q; gn.gain.value = vol;
  s.buffer = buf; s.connect(bq); bq.connect(gn); gn.connect(master); s.start(t);
}
const ESC = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
export const sfx = {
  tap() { tono(880, .06, 'triangle', .18, 1.5); },
  bien(n = 0) { const k = ESC[Math.min(n, ESC.length - 1)]; const f = 523 * Math.pow(2, k / 12); tono(f, .16, 'triangle', .25); tono(f * 2, .12, 'sine', .1, 1, .03); },
  combo(n) { for (let i = 0; i < 3; i++) tono(660 * Math.pow(2, (ESC[(n + i) % ESC.length]) / 12), .14, 'square', .07, 1, i * .05); },
  mal() { tono(220, .28, 'sawtooth', .16, .5); ruido(.12, .12, 500); },
  whoosh() { ruido(.35, .22, 900, .7); },
  boom() { tono(90, .5, 'sine', .5, .35); ruido(.4, .25, 300, .6); },
  power() { for (let i = 0; i < 6; i++) tono(392 * Math.pow(2, ESC[i] / 12), .18, 'triangle', .13, 1, i * .045); },
  cuenta(u) { tono(u ? 1046 : 523, u ? .4 : .14, 'triangle', .3); },
  fin() { [0, 4, 7, 12, 16].forEach((k, i) => tono(392 * Math.pow(2, k / 12), .5, 'triangle', .16, 1, i * .09)); },
  pop() { tono(rnd(600, 900), .08, 'sine', .2, 2.2); },
};
// música: bajo + arpegio en loop suave, tempo según intensidad
export function musicaInicia(bpm = 112) {
  const a = audio(); if (!a || musica) return;
  const gn = a.createGain(); gn.gain.value = .0001; gn.connect(master); gn.gain.linearRampToValueAtTime(.32, a.currentTime + 1.2);
  const prog = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 55, 59, 64]];
  let paso = 0, prox = a.currentTime + .1;
  const nota = (m, t, d, tipo, v) => { const o = a.createOscillator(), g2 = a.createGain(); o.type = tipo; o.frequency.value = 440 * Math.pow(2, (m - 69) / 12); g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(v, t + .01); g2.gain.exponentialRampToValueAtTime(.0005, t + d); o.connect(g2); g2.connect(gn); o.start(t); o.stop(t + d + .05); };
  const sched = () => {
    if (!musica) return;
    const sp = 60 / musica.bpm / 2;
    while (prox < a.currentTime + .25) {
      const acorde = prog[Math.floor(paso / 16) % 4], i = paso % 16;
      if (i % 4 === 0) nota(acorde[0] - 24, prox, sp * 3.6, 'triangle', .5);
      nota(acorde[(i * 3) % 4] + (i % 8 > 5 ? 12 : 0), prox, sp * .9, 'square', .045);
      if (i % 4 === 2) { const n = a.sampleRate * .05, bf = a.createBuffer(1, n, a.sampleRate), ch = bf.getChannelData(0); for (let j = 0; j < n; j++) ch[j] = (Math.random() * 2 - 1) * (1 - j / n); const s = a.createBufferSource(), hp = a.createBiquadFilter(), g3 = a.createGain(); hp.type = 'highpass'; hp.frequency.value = 6000; g3.gain.value = .12; s.buffer = bf; s.connect(hp); hp.connect(g3); g3.connect(gn); s.start(prox); }
      prox += sp; paso++;
    }
  };
  musica = { gn, bpm, id: setInterval(sched, 60) }; sched();
}
export function musicaTempo(bpm) { if (musica) musica.bpm = bpm; }
export function musicaPara() { if (!musica || !AC) return; const m = musica; musica = null; m.gn.gain.setTargetAtTime(.0001, AC.currentTime, .2); setTimeout(() => { clearInterval(m.id); m.gn.disconnect(); }, 900); }

// ───────── vibración ─────────
export function vibra(p) { try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) {} }

// ───────── partículas 2D ─────────
export function crearParticulas() {
  const L = [];
  return {
    L,
    estalla(x, y, color, n = 18, vel = 260, tam = 4) {
      if (REDUCIR) n = Math.ceil(n / 3);
      for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), v = rnd(.3, 1) * vel; L.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, v: 1, d: rnd(.45, .9), c: color, r: rnd(.5, 1) * tam, tipo: Math.random() < .3 ? 'linea' : 'punto' }); }
    },
    texto(x, y, txt, color = '#fff', tam = 22) { L.push({ x, y, vx: 0, vy: -70, v: 1, d: .9, c: color, txt, tam }); },
    anillo(x, y, color, r = 40) { L.push({ x, y, vx: 0, vy: 0, v: 1, d: .45, c: color, anillo: r }); },
    paso(dt) { for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.v -= dt / p.d; if (p.v <= 0) { L.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; if (!p.txt && !p.anillo) { p.vx *= .96; p.vy = p.vy * .96 + 260 * dt; } } },
    dibuja(g, k = 1) {
      for (const p of L) {
        g.globalAlpha = Math.max(0, p.v);
        if (p.txt) { g.fillStyle = p.c; g.font = `800 ${p.tam * k}px "Plus Jakarta Sans",sans-serif`; g.textAlign = 'center'; g.fillText(p.txt, p.x, p.y); continue; }
        if (p.anillo) { g.strokeStyle = p.c; g.lineWidth = 3 * k * p.v; g.beginPath(); g.arc(p.x, p.y, p.anillo * (1.6 - p.v * .6), 0, 7); g.stroke(); continue; }
        g.fillStyle = p.c; g.strokeStyle = p.c;
        if (p.tipo === 'linea') { g.lineWidth = p.r * .6; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * .05, p.y - p.vy * .05); g.stroke(); }
        else { g.beginPath(); g.arc(p.x, p.y, p.r * p.v + .5, 0, 7); g.fill(); }
      }
      g.globalAlpha = 1;
    }
  };
}

// ───────── récords (por dispositivo; no hay ranking global) ─────────
export function records(id) { try { return JSON.parse(localStorage.getItem('arcade:rec:' + id) || '[]'); } catch (e) { return []; } }
export function guardaRecord(id, pts) {
  const r = records(id); r.push({ p: pts, f: Date.now() }); r.sort((a, b) => b.p - a.p);
  const top = r.slice(0, 5); try { localStorage.setItem('arcade:rec:' + id, JSON.stringify(top)); } catch (e) {}
  return { top, puesto: top.findIndex(x => x.p === pts && Date.now() - x.f < 3000) };
}
export function mejores() { const o = {}; for (const id of ['cero-visto', 'lead-caliente', 'pipeline-vivo', 'agenda-llena', 'despertador', 'ruta-hapee']) { const r = records(id); o[id] = r.length ? r[0].p : 0; } return o; }
export const fmt = n => Math.round(n).toLocaleString('es-CL');

// ───────── imagen para compartir (1080×1350) ─────────
let robotImg = null;
function cargaImg(src) { return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
export async function imagenResultado(o) {
  if (!robotImg) robotImg = await cargaImg('/img/robot-v2.webp');
  const logo = await cargaImg('/img/logo-hapee.png');
  await document.fonts.ready;
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#12060A'); bg.addColorStop(1, '#2A0A14'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const gl = g.createRadialGradient(W * .7, H * .42, 0, W * .7, H * .42, 640); gl.addColorStop(0, 'rgba(250,80,0,.55)'); gl.addColorStop(1, 'rgba(250,80,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  // malla
  g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 2; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  if (robotImg) { const h = 980, w = h * robotImg.width / robotImg.height; g.drawImage(robotImg, W - w + 90, H - h - 40, w, h); }
  if (logo) { const w = 260, h = w * logo.height / logo.width; g.drawImage(logo, 80, 86, w, h); }
  g.fillStyle = '#FA5000'; g.font = '800 34px "Plus Jakarta Sans",sans-serif'; g.textAlign = 'left'; g.fillText('HAPEE ARCADE', 80, 250);
  g.fillStyle = '#FFF1E8'; g.font = '800 82px "Plus Jakarta Sans",sans-serif'; g.fillText(o.juego, 80, 340);
  const gr = g.createLinearGradient(80, 0, 700, 0); gr.addColorStop(0, '#FA5000'); gr.addColorStop(1, '#CD2349'); g.fillStyle = gr;
  g.font = '800 230px "Plus Jakarta Sans",sans-serif'; g.fillText(fmt(o.pts), 70, 600);
  g.fillStyle = 'rgba(255,241,232,.7)'; g.font = '600 40px "Plus Jakarta Sans",sans-serif'; g.fillText('puntos', 84, 660);
  g.fillStyle = '#FFF1E8'; g.font = '700 44px "Plus Jakarta Sans",sans-serif';
  let y = 790; for (const l of partir(g, o.frase, 560)) { g.fillText(l, 80, y); y += 58; }
  g.fillStyle = 'rgba(255,241,232,.75)'; g.font = '600 36px "Plus Jakarta Sans",sans-serif'; g.fillText('¿Me ganas? hapee.ai/juegos', 80, H - 90);
  return c;
}
function partir(g, t, w) { const out = []; let l = ''; for (const p of t.split(' ')) { const n = l ? l + ' ' + p : p; if (g.measureText(n).width > w && l) { out.push(l); l = p; } else l = n; } if (l) out.push(l); return out; }
export async function compartir(o) {
  const c = await imagenResultado(o);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const url = location.origin + '/juegos/#' + o.id;
  const texto = `Hice ${fmt(o.pts)} puntos en ${o.juego} de Hapee Arcade. ¿Me ganas?`;
  evento('arcade_compartir', { juego: o.id });
  try {
    const f = new File([blob], `hapee-arcade-${o.id}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'Hapee Arcade', text: texto + ' ' + url }); return 'ok'; }
    if (navigator.share) { await navigator.share({ title: 'Hapee Arcade', text: texto, url }); return 'ok'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancelado'; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `hapee-arcade-${o.id}.png`; document.body.appendChild(a); a.click(); a.remove();
  try { await navigator.clipboard.writeText(texto + ' ' + url); } catch (e) {}
  return 'descarga';
}

// ───────── calendario real de demo (mismo widget, UTMs y conversión que /agenda-tu-demo) ─────────
const TRACK = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id', 'fbclid', 'gclid', 'ttclid', 'msclkid', 'wbraid', 'gbraid'];
let calMontado = false, calConvertido = false;
export function abreCalendario(juego) {
  const hoja = $('#hoja-demo'); hoja.hidden = false; requestAnimationFrame(() => hoja.classList.add('on'));
  document.documentElement.classList.add('hoja-abierta');
  evento('arcade_cta_demo', { juego });
  if (calMontado) return;
  calMontado = true;
  const base = 'https://beta.hapee.ai/calendar/book/hapee/demo-1-a-1-hapee';
  let attr = {};
  const u = new URLSearchParams(location.search); TRACK.forEach(k => { const v = u.get(k); if (v) attr[k] = v; });
  if (!Object.keys(attr).length) { try { attr = JSON.parse(sessionStorage.getItem('hapee_attribution') || '{}'); } catch (e) {} }
  if (!Object.keys(attr).length) { try { const lt = JSON.parse(localStorage.getItem('hapee_attribution') || 'null'); if (lt && lt.d && Date.now() - lt.t < 30 * 864e5) attr = lt.d; } catch (e) {} }
  if (!attr.utm_source) { attr.utm_source = 'hapee-arcade'; attr.utm_medium = 'juego'; attr.utm_content = juego || 'hub'; }
  if (document.referrer && !attr.referrer) attr.referrer = document.referrer;
  const div = $('#hapeeCalendar'); div.setAttribute('data-hapee-calendar', base + '?' + new URLSearchParams(attr).toString());
  const s = document.createElement('script'); s.src = 'https://beta.hapee.ai/static/calendar-embed.js'; s.async = true; document.body.appendChild(s);
}
export function cierraCalendario() { const hoja = $('#hoja-demo'); hoja.classList.remove('on'); document.documentElement.classList.remove('hoja-abierta'); setTimeout(() => { hoja.hidden = true; }, 350); }
// conversión y página de gracias en el idioma: igual que agenda-tu-demo
window.addEventListener('message', e => {
  let host = ''; try { host = new URL(e.origin).hostname.toLowerCase(); } catch (er) { return; }
  if (host !== 'hapee.ai' && host.slice(-9) !== '.hapee.ai') return;
  const d = e.data; if (!d || typeof d !== 'object') return;
  if (d.type === 'zentru_calendar_submitted' && !calConvertido) {
    calConvertido = true; evento('dg_agendar_demo');
    if (typeof fbq === 'function' && d.eventId) fbq('track', 'Schedule', {}, { eventID: String(d.eventId) });
  }
  if (d.type === 'zentru_calendar_redirect' && d.url) {
    let u; try { u = new URL(d.url, location.href); } catch (er) { return; }
    if (u.hostname !== 'hapee.ai' && u.hostname !== location.hostname) return;
    e.stopImmediatePropagation();
    try { document.cookie = 'hapee_lang=es;path=/;max-age=600;samesite=lax' + (location.protocol === 'https:' ? ';secure' : ''); } catch (er) {}
    location.href = u.pathname.replace(/^\/(en|pt)(?=\/|$)/, '') + u.search + u.hash;
  }
});

// cielo nocturno con resplandor de horizonte (para los juegos 3D)
export function cieloTex(THREE, alto = .62) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 512; const d = c.getContext('2d');
  const gr = d.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#070304'); gr.addColorStop(alto * .7, '#1C060D'); gr.addColorStop(alto, '#5A1022'); gr.addColorStop(alto + .04, '#2A0A12'); gr.addColorStop(1, '#0B0507');
  d.fillStyle = gr; d.fillRect(0, 0, 16, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// Juego 06 · Ruta Hapee — corre con el robot: junta leads, esquiva lo que Hapee reemplaza.
const ALTOS = ['PLANILLA', '5 APPS', 'COPIAR Y PEGAR', 'CORREO PERDIDO'];
const BAJOS = ['POST-IT', 'RESPUESTA TARDE', 'VISTO'];
import { cieloTex } from './comun.js?v=1';
export async function crear(x) {
  const { THREE, R, K, bot, W, sfx, vibra, rnd, cl, lerp, g } = x;
  const S = new THREE.Scene(); S.environment = K.env;
  S.background = cieloTex(THREE, .5); S.fog = new THREE.Fog(0x2a0a12, 22, 64);
  const cam = new THREE.PerspectiveCamera(60, 1, .05, 90);
  S.add(new THREE.HemisphereLight(0x7a3040, 0x0b0507, 1));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(2, 5, 3); S.add(key);
  const rim = new THREE.DirectionalLight(0xff6a2a, 2.2); rim.position.set(-3, 3, -5); S.add(rim);
  const LANES = [-1.5, 0, 1.5];
  // pista con textura que se desplaza
  const pc = document.createElement('canvas'); pc.width = 256; pc.height = 512; const p = pc.getContext('2d');
  p.fillStyle = '#140609'; p.fillRect(0, 0, 256, 512);
  p.fillStyle = 'rgba(250,80,0,.9)'; for (const lx of [0, 85, 171, 254]) p.fillRect(lx - 1, 0, 3, 512);
  p.fillStyle = 'rgba(255,241,232,.12)'; for (let y = 0; y < 512; y += 64) p.fillRect(0, y, 256, 2);
  p.fillStyle = 'rgba(205,35,73,.35)'; for (let y = 32; y < 512; y += 128) { p.fillRect(40, y, 6, 30); p.fillRect(126, y, 6, 30); p.fillRect(212, y, 6, 30); }
  const pt = new THREE.CanvasTexture(pc); pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(1, 10); pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = 8;
  const pista = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 120), new THREE.MeshStandardMaterial({ map: pt, roughness: .35, metalness: .4, emissive: 0xffffff, emissiveMap: pt, emissiveIntensity: .5 }));
  pista.rotation.x = -Math.PI / 2; pista.position.z = -50; S.add(pista);
  const bordeM = new THREE.MeshBasicMaterial({ color: 0xfa5000, toneMapped: false });
  for (const sx of [-2.35, 2.35]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .06, 120), bordeM); b.position.set(sx, .03, -50); S.add(b); }
  // escenografía: paneles flotantes tipo interfaz a los costados
  const decor = [];
  const panelTex = (i) => { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const d = c.getContext('2d'); d.fillStyle = 'rgba(30,10,16,.9)'; d.fillRect(0, 0, 256, 160); d.strokeStyle = i % 2 ? '#FA5000' : '#CD2349'; d.lineWidth = 4; d.strokeRect(2, 2, 252, 156); d.fillStyle = 'rgba(255,241,232,.7)'; for (let k = 0; k < 4; k++) d.fillRect(20, 26 + k * 28, 80 + Math.random() * 130, 10); d.fillStyle = '#FA5000'; for (let k = 0; k < 6; k++) { const h = 20 + Math.random() * 60; d.fillRect(150 + k * 16, 140 - h, 10, h); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const pTexs = [0, 1, 2].map(panelTex);
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), new THREE.MeshBasicMaterial({ map: pTexs[i % 3], transparent: true, opacity: .85, toneMapped: false, side: THREE.DoubleSide }));
    const lado = i % 2 ? 1 : -1; m.position.set(lado * rnd(4, 7), rnd(1.5, 5), -i * 6); m.rotation.y = -lado * .5; S.add(m); decor.push(m);
  }
  // etiquetas de obstáculos
  const texCache = {};
  const texEtq = (txt, bajo) => { const k2 = txt + bajo; if (texCache[k2]) return texCache[k2]; const c = document.createElement('canvas'); c.width = 512; c.height = bajo ? 128 : 384; const d = c.getContext('2d'); const gr = d.createLinearGradient(0, 0, 0, c.height); gr.addColorStop(0, '#3a0c16'); gr.addColorStop(1, '#1a0509'); d.fillStyle = gr; d.fillRect(0, 0, c.width, c.height); d.strokeStyle = '#E53935'; d.lineWidth = 10; d.strokeRect(5, 5, c.width - 10, c.height - 10); d.fillStyle = '#FFF1E8'; d.textAlign = 'center'; d.textBaseline = 'middle'; let fs = bajo ? 54 : 70; d.font = `800 ${fs}px "Plus Jakarta Sans",sans-serif`; while (d.measureText(txt).width > 460) { fs -= 4; d.font = `800 ${fs}px "Plus Jakarta Sans",sans-serif`; } d.fillText(txt, 256, c.height / 2); if (!bajo) { d.fillStyle = '#E53935'; d.font = '800 40px "Plus Jakarta Sans",sans-serif'; d.fillText('ESQUIVA', 256, c.height - 60); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; texCache[k2] = t; return t; };
  const geoLead = new THREE.IcosahedronGeometry(.28, 2), mLead = new THREE.MeshStandardMaterial({ color: 0xff7a30, emissive: 0xfa5000, emissiveIntensity: 1.6, roughness: .3 });
  const geoAro = new THREE.TorusGeometry(.42, .03, 8, 40), mAro = new THREE.MeshBasicMaterial({ color: 0xffc9a8, transparent: true, opacity: .7, toneMapped: false });
  const mLado = new THREE.MeshStandardMaterial({ color: 0x2a0a12, roughness: .5 });
  const mPow = { workflow: new THREE.MeshStandardMaterial({ color: 0x9b6bff, emissive: 0x6a3bff, emissiveIntensity: 1.4 }), agente: new THREE.MeshStandardMaterial({ color: 0x2bd67b, emissive: 0x1aa85a, emissiveIntensity: 1.4 }) };
  const texPow = { workflow: (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const d = c.getContext('2d'); d.font = '800 40px "Plus Jakarta Sans",sans-serif'; d.textAlign = 'center'; d.textBaseline = 'middle'; d.fillStyle = '#E4D6FF'; d.fillText('WORKFLOW', 128, 34); return new THREE.CanvasTexture(c); })(), agente: (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const d = c.getContext('2d'); d.font = '800 40px "Plus Jakarta Sans",sans-serif'; d.textAlign = 'center'; d.textBaseline = 'middle'; d.fillStyle = '#C8FFE0'; d.fillText('AGENTE IA', 128, 34); return new THREE.CanvasTexture(c); })() };
  // escudo del agente
  const escudo = new THREE.Mesh(new THREE.SphereGeometry(.95, 32, 20), new THREE.MeshBasicMaterial({ color: 0x2bd67b, transparent: true, opacity: .18, depthWrite: false })); escudo.visible = false; S.add(escudo);
  bot.g.position.set(0, 0, 0); bot.g.rotation.y = Math.PI; bot.g.scale.setScalar(1); S.add(bot.g); bot.pose('corre');
  let objs = [], vel = 12, dist = 0, pts = 0, leads = 0, racha = 0, mejorR = 0, vidas = 3, inv = 0, lane = 1, lx = 0, y = 0, vy = 0, iman = 0, escudoT = 0, termino = false, t = 0, prox = 18, golpes = 0, textos = [];
  const DUR = 90;
  function crea(tipo, l, z, etq) {
    let m;
    if (tipo === 'lead') { m = new THREE.Group(); const o = new THREE.Mesh(geoLead, mLead); m.add(o); const a = new THREE.Mesh(geoAro, mAro); m.add(a); m.position.set(LANES[l], .9, z); }
    else if (tipo === 'alto' || tipo === 'bajo') {
      const bajo = tipo === 'bajo', h = bajo ? .5 : 1.9, tx = texEtq(etq, bajo);
      m = new THREE.Mesh(new THREE.BoxGeometry(1.3, h, .3), [mLado, mLado, mLado, mLado, new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }), mLado]);
      m.position.set(LANES[l], h / 2, z);
    } else { m = new THREE.Group(); const o = new THREE.Mesh(new THREE.OctahedronGeometry(.36), mPow[tipo]); m.add(o); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texPow[tipo], transparent: true, depthWrite: false })); s.scale.set(1.6, .4, 1); s.position.y = .7; m.add(s); m.position.set(LANES[l], 1, z); }
    S.add(m); objs.push({ tipo, l, m, vivo: true, etq });
  }
  function patron(z) {
    const dif = cl(t / 70, 0, 1), r = Math.random();
    if (r < .35) { const l = Math.floor(Math.random() * 3); for (let i = 0; i < 5; i++) crea('lead', l, z - i * 1.6); }
    else if (r < .62) { const l = Math.floor(Math.random() * 3); { const alto = Math.random() < .55, lst = alto ? ALTOS : BAJOS; crea(alto ? 'alto' : 'bajo', l, z, lst[Math.floor(Math.random() * lst.length)]); } const l2 = (l + 1 + Math.floor(Math.random() * 2)) % 3; for (let i = 0; i < 4; i++) crea('lead', l2, z - i * 1.6); }
    else if (r < .8 + dif * .1) { const libre = Math.floor(Math.random() * 3); for (let l = 0; l < 3; l++) if (l !== libre) crea('alto', l, z, ALTOS[Math.floor(Math.random() * ALTOS.length)]); for (let i = 0; i < 3; i++) crea('lead', libre, z - 2 - i * 1.6); }
    else if (r < .93) { for (let l = 0; l < 3; l++) crea('bajo', l, z, BAJOS[Math.floor(Math.random() * BAJOS.length)]); for (let i = 0; i < 3; i++) crea('lead', 1, z - 1 - i * 1.2); }
    else crea(Math.random() < .5 ? 'workflow' : 'agente', Math.floor(Math.random() * 3), z);
  }
  function salta() { if (y <= .001 && !termino) { vy = 7.2; bot.pose('salta'); sfx.whoosh(); } }
  function mover(d) { const n = cl(lane + d, 0, 2); if (n !== lane) { lane = n; sfx.tap(); vibra(8); } }
  function golpe(o) {
    if (escudoT > 0) { escudoT = 0; escudo.visible = false; o.vivo = false; S.remove(o.m); sfx.boom(); x.aviso('¡EL AGENTE TE CUBRIÓ!'); vibra(30); return; }
    if (inv > 0) return;
    vidas--; golpes++; inv = 1.4; racha = 0; x.combo(0); vel = Math.max(12, vel * .8); sfx.mal(); vibra([60, 40, 60]);
    x.dice(o.tipo === 'alto' ? `¡Chocamos con «${o.etq || 'eso'}»! Hapee reemplaza eso.` : '¡Tropezamos! Salta los bajos.', 1600);
    if (vidas <= 0) fin(false);
  }
  const vidasTxt = () => 'VIDAS ' + '●'.repeat(Math.max(0, vidas)) + '○'.repeat(3 - Math.max(0, vidas));
  let ini = null;
  const v3 = new THREE.Vector3();
  for (let z = -18; z > -60; z -= 9) patron(z);
  return {
    __fin() { t = DUR; },
    empieza() { x.dice('Desliza a los lados para cambiar de pista y hacia arriba para saltar.', 2400); x.extra(vidasTxt()); },
    abajo(e) { ini = { x: e.clientX, y: e.clientY, t: performance.now() }; },
    arriba(e) {
      if (!ini) return; const dx = e.clientX - ini.x, dy = e.clientY - ini.y; ini = null;
      if (Math.hypot(dx, dy) < 24) { if (e.clientX < W.w * .33) mover(-1); else if (e.clientX > W.w * .67) mover(1); else salta(); return; }
      if (Math.abs(dx) > Math.abs(dy)) mover(dx < 0 ? -1 : 1); else if (dy < 0) salta();
    },
    tecla(e) { if (e.key === 'ArrowLeft' || e.key === 'a') mover(-1); if (e.key === 'ArrowRight' || e.key === 'd') mover(1); if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') salta(); },
    limpia() { S.remove(bot.g); },
    paso(dt, T) {
      if (dt > 0 && !termino) {
        t += dt; x.tiempo(DUR - t, DUR); x.extra(vidasTxt());
        vel = Math.min(30, vel + dt * .22); dist += vel * dt;
        pts += vel * dt * 2; x.pts(pts);
        pt.offset.y += vel * dt / 12;
        // saltar
        vy -= 20 * dt; y = Math.max(0, y + vy * dt); if (y === 0 && vy < 0) { vy = 0; if (bot.st.pose === 'salta') bot.pose('corre'); }
        lx = lerp(lx, LANES[lane], cl(dt * 14, 0, 1));
        bot.g.position.set(lx, y, 0); bot.g.rotation.z = (LANES[lane] - lx) * .12;
        inv = Math.max(0, inv - dt); bot.g.visible = inv > 0 ? Math.floor(T * 14) % 2 === 0 : true;
        if (iman > 0) { iman -= dt; if (iman <= 0) x.dice('Se acabó el workflow.', 1000); }
        if (escudoT > 0) { escudoT -= dt; if (escudoT <= 0) escudo.visible = false; }
        escudo.position.set(lx, y + .6, 0); escudo.scale.setScalar(1 + .04 * Math.sin(T * 8));
        // mundo
        prox -= vel * dt; if (prox <= 0) { patron(-60); prox = lerp(10, 6.5, cl(t / 80, 0, 1)); }
        for (const o of objs) {
          if (!o.vivo) continue;
          o.m.position.z += vel * dt;
          if (o.tipo === 'lead') { o.m.rotation.y += dt * 3; o.m.children[1].rotation.x = T * 2; if (iman > 0 && o.m.position.z > -14) { o.m.position.x = lerp(o.m.position.x, lx, cl(dt * 6, 0, 1)); o.m.position.y = lerp(o.m.position.y, y + .9, cl(dt * 6, 0, 1)); } }
          if (o.tipo === 'workflow' || o.tipo === 'agente') o.m.children[0].rotation.y += dt * 2;
          const dz = Math.abs(o.m.position.z), mismo = Math.abs(o.m.position.x - lx) < .7;
          if (dz < .55 && mismo) {
            if (o.tipo === 'lead') { if (Math.abs(o.m.position.y - (y + .9)) < 1) { o.vivo = false; S.remove(o.m); leads++; racha++; mejorR = Math.max(mejorR, racha); const pp = 50 * (1 + Math.min(4, Math.floor(racha / 5))); pts += pp; x.pts(pts); x.combo(racha >= 5 ? racha : 0); sfx.bien(Math.min(10, racha % 11)); vibra(6); textos.push({ p: o.m.position.clone(), txt: '+' + pp, t: 0 }); if (racha % 20 === 0) { x.aviso('RACHA ×' + racha); bot.pose('celebra', .8); setTimeout(() => !termino && bot.pose('corre'), 800); } } }
            else if (o.tipo === 'workflow') { o.vivo = false; S.remove(o.m); iman = 6; sfx.power(); x.aviso('WORKFLOW: IMÁN DE LEADS'); x.dice('Un workflow trabaja por ti: los leads llegan solos.', 1800); }
            else if (o.tipo === 'agente') { o.vivo = false; S.remove(o.m); escudoT = 8; escudo.visible = true; sfx.power(); x.aviso('AGENTE IA: ESCUDO'); }
            else if (o.tipo === 'bajo') { if (y < .55) golpe(o); }
            else if (o.tipo === 'alto') golpe(o);
          }
          if (o.m.position.z > 1.6) { o.vivo = false; S.remove(o.m); }
        }
        objs = objs.filter(o => o.vivo);
        for (const d of decor) { d.position.z += vel * dt * .9; if (d.position.z > 8) d.position.z -= 108; }
        x.tempo(132 + (vel - 12) * 2);
        if (t >= DUR) fin(true);
      }
      bot.update(T, dt);
      // cámara que sigue con un poco de retraso
      const asp = W.w / W.h; cam.aspect = asp; cam.fov = asp < .8 ? 72 : 58;
      cam.position.set(lx * .55, 1.95 + y * .3, asp < .8 ? 3.7 : 3.6); cam.lookAt(lx * .3, 1.05, -7); cam.updateProjectionMatrix();
      R.render(S, cam);
      g.setTransform(W.dpr, 0, 0, W.dpr, 0, 0); g.clearRect(0, 0, W.w, W.h);
      for (const tx of textos) tx.t += dt; textos = textos.filter(tx => tx.t < .8);
      for (const tx of textos) { v3.copy(tx.p).project(cam); const sx = (v3.x * .5 + .5) * W.w, sy = (-v3.y * .5 + .5) * W.h - tx.t * 60; g.globalAlpha = 1 - tx.t / .8; g.fillStyle = '#FFF1E8'; g.font = '800 18px "Plus Jakarta Sans",sans-serif'; g.textAlign = 'center'; g.fillText(tx.txt, sx, sy); }
      g.globalAlpha = 1;
      if (iman > 0) { g.fillStyle = 'rgba(155,107,255,.12)'; g.fillRect(0, 0, W.w, W.h); }
      g.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
  function fin(meta) {
    if (termino) return; termino = true; bot.pose(meta ? 'celebra' : 'triste', 3);
    const m = Math.round(dist);
    x.terminar({
      pts, frase: meta ? `¡Llegaste a la meta con ${leads} leads!` : `Corriste ${m.toLocaleString('es-CL')} metros y juntaste ${leads} leads.`,
      stats: [[leads, 'leads juntados'], [m.toLocaleString('es-CL') + ' m', 'recorridos'], [golpes, 'choques con herramientas sueltas']],
      ilus: 'Ilustrativo: planillas, post-its y cinco apps abiertas frenan a cualquier equipo. Hapee reemplaza más de 25 herramientas con una sola cuenta: CRM, email, automatización, reportería y tu sitio web.',
      gancho: '¿Cuántas herramientas pagas hoy que Hapee reemplaza?',
    });
  }
}

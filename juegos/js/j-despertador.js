// Juego 05 · Despertador — lanza campañas para despertar contactos dormidos; cada uno despierta a sus vecinos.
import { cieloTex } from './comun.js?v=1';
export async function crear(x) {
  const { THREE, R, K, bot, W, sfx, vibra, rnd, cl, lerp, g, cv } = x;
  const S = new THREE.Scene(); S.environment = K.env;
  S.background = cieloTex(THREE, .58); S.fog = new THREE.Fog(0x220810, 16, 38);
  const cam = new THREE.PerspectiveCamera(55, 1, .05, 80);
  S.add(new THREE.HemisphereLight(0x6a3040, 0x0b0507, .9));
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(3, 6, 4); S.add(key);
  const rim = new THREE.DirectionalLight(0xff6a2a, 2); rim.position.set(-4, 3, -6); S.add(rim);
  // piso: grilla luminosa
  const grid = new THREE.GridHelper(80, 80, 0xfa5000, 0x3a1420); grid.material.transparent = true; grid.material.opacity = .55; grid.position.y = 0; S.add(grid);
  const discoC = document.createElement('canvas'); discoC.width = discoC.height = 256; { const d = discoC.getContext('2d'), gr = d.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(250,80,0,.7)'); gr.addColorStop(1, 'rgba(250,80,0,0)'); d.fillStyle = gr; d.fillRect(0, 0, 256, 256); }
  const disco = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(discoC), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  disco.rotation.x = -Math.PI / 2; disco.position.y = .01; S.add(disco);
  // portal del pipeline (adonde vuelan los despiertos)
  const portal = new THREE.Mesh(new THREE.TorusGeometry(2.2, .09, 16, 96), new THREE.MeshBasicMaterial({ color: 0xff6a20, toneMapped: false }));
  portal.position.set(0, 7.5, -22); S.add(portal);
  const portal2 = new THREE.Mesh(new THREE.TorusGeometry(1.7, .05, 12, 80), new THREE.MeshBasicMaterial({ color: 0xcd2349, toneMapped: false })); portal2.position.copy(portal.position); S.add(portal2);
  const etiqueta = (txt, col, w = 256, h = 96, fs = 44) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const d = c.getContext('2d'); d.font = `800 ${fs}px "Plus Jakarta Sans",sans-serif`; d.textAlign = 'center'; d.textBaseline = 'middle'; d.fillStyle = col; d.fillText(txt, w / 2, h / 2); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const tPip = new THREE.Sprite(new THREE.SpriteMaterial({ map: etiqueta('PIPELINE', '#FFF1E8', 512, 96, 64), transparent: true, depthWrite: false })); tPip.scale.set(4, .75, 1); tPip.position.set(0, 10.3, -22); S.add(tPip);
  const zzz = etiqueta('z z z', '#B9C6E0'), hola = etiqueta('¡Hola!', '#FFB48A');
  // robot lanzador
  bot.g.position.set(0, 0, 0); bot.g.rotation.y = Math.PI; bot.g.scale.setScalar(1.15); S.add(bot.g);
  // materiales compartidos
  const geoC = new THREE.IcosahedronGeometry(.42, 3);
  const mDuerme = new THREE.MeshStandardMaterial({ color: 0x55607a, roughness: .55, metalness: .1, emissive: 0x101828, emissiveIntensity: .6 });
  const mDespierto = new THREE.MeshStandardMaterial({ color: 0xff7a30, roughness: .3, emissive: 0xfa5000, emissiveIntensity: 1.2 });
  const mSpam = new THREE.MeshBasicMaterial({ color: 0xe53935, transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false });
  const tSpam = etiqueta('FILTRO DE SPAM', '#FFB3B3', 512, 96, 48);
  // sobre (proyectil)
  const sobre = new THREE.Group();
  { const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .04), new THREE.MeshStandardMaterial({ color: 0xfff1e8, roughness: .4 })); sobre.add(cuerpo);
    const tri = new THREE.Shape(); tri.moveTo(-.25, .16); tri.lineTo(.25, .16); tri.lineTo(0, -.02); tri.lineTo(-.25, .16);
    const flap = new THREE.Mesh(new THREE.ShapeGeometry(tri), new THREE.MeshStandardMaterial({ color: 0xfa5000, roughness: .4, side: THREE.DoubleSide })); flap.position.z = .025; sobre.add(flap); }
  // estela
  const NE = 40, ePos = new Float32Array(NE * 3), estelaG = new THREE.BufferGeometry(); estelaG.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  const estela = new THREE.Points(estelaG, new THREE.PointsMaterial({ color: 0xffa060, size: .12, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending })); S.add(estela);
  // trayectoria
  const NT = 26, tPos = new Float32Array(NT * 3), trayG = new THREE.BufferGeometry(); trayG.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
  const tray = new THREE.Points(trayG, new THREE.PointsMaterial({ color: 0xfff1e8, size: .1, transparent: true, opacity: .7, depthWrite: false })); tray.visible = false; S.add(tray);
  // pulsos (cadena)
  const geoP = new THREE.SphereGeometry(1, 24, 16);
  let contactos = [], muros = [], pulsos = [], vuelos = [], proyectiles = [], textos = [];
  let ronda = 0, tiros = 10, pts = 0, cadena = 0, mejorCad = 0, despiertos = 0, total = 0, termino = false, aim = null, t = 0, esperaRonda = 0, sinTiro = 0;
  const ORIGEN = new THREE.Vector3(.35, 1.25, -.4), GRAV = -7.5;
  function armaRonda(n) {
    for (const c of contactos) S.remove(c.m, c.s); for (const m of muros) S.remove(m.m);
    contactos = []; muros = [];
    const N2 = [16, 22, 28][n], grupos = 3 + n;
    for (let gI = 0; gI < grupos; gI++) {
      const cx = rnd(-6, 6), cz = rnd(-8, -19), cy = rnd(1, 4.5);
      const k = Math.ceil(N2 / grupos);
      for (let i = 0; i < k; i++) {
        const m = new THREE.Mesh(geoC, mDuerme); m.position.set(cx + rnd(-1.8, 1.8), Math.max(.6, cy + rnd(-1.2, 1.5)), cz + rnd(-1.6, 1.6)); S.add(m);
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zzz, transparent: true, depthWrite: false, opacity: .8 })); s.scale.set(.9, .34, 1); s.position.copy(m.position).y += .7; S.add(s);
        contactos.push({ m, s, base: m.position.clone(), fase: rnd(0, 6), estado: 'duerme' });
      }
    }
    total += contactos.length;
    for (let i = 0; i < n + 1; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), mSpam); m.position.set(rnd(-4, 4), rnd(1.5, 3.5), rnd(-5, -7)); S.add(m);
      const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: tSpam, transparent: true, depthWrite: false })); l.scale.set(2.4, .45, 1); l.position.set(0, 1.1, 0); m.add(l);
      muros.push({ m, fase: rnd(0, 6), vx: rnd(.8, 1.6) * (Math.random() < .5 ? -1 : 1) });
    }
    tiros = 10; x.extra('RONDA ' + (n + 1) + ' / 3');
  }
  armaRonda(0);
  function velDe(a) { // a = {dx,dy} en px de arrastre
    const pot = cl(Math.hypot(a.dx, a.dy) / Math.min(W.w, W.h), 0, .6) / .6;
    const yaw = cl(-a.dx / W.w * 1.6, -.9, .9), pitch = cl(.25 + a.dy / W.h * 1.6, .05, 1.2);
    const v = 9 + pot * 13;
    return new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(v);
  }
  function preview(v) {
    const p = ORIGEN.clone(), vv = v.clone();
    for (let i = 0; i < NT; i++) { tPos[i * 3] = p.x; tPos[i * 3 + 1] = p.y; tPos[i * 3 + 2] = p.z; for (let k2 = 0; k2 < 3; k2++) { vv.y += GRAV * .02; p.addScaledVector(vv, .02); } }
    trayG.attributes.position.needsUpdate = true;
  }
  function lanza(v) {
    if (tiros <= 0 || termino) return;
    tiros--; cadena = 0;
    const m = sobre.clone(); m.position.copy(ORIGEN); S.add(m);
    proyectiles.push({ m, v: v.clone(), vida: 4, cad: 0 });
    bot.pose('lanza', .6); sfx.whoosh(); vibra(15);
  }
  function despierta(c, cad, desde) {
    if (c.estado !== 'duerme') return;
    c.estado = 'despierta'; c.m.material = mDespierto; c.s.material.map = hola; c.s.material.needsUpdate = true; c.t = 0;
    despiertos++; cadena = Math.max(cadena, cad); mejorCad = Math.max(mejorCad, cad);
    const p = 100 * Math.min(cad, 8); pts += p; x.pts(pts);
    textos.push({ p: c.m.position.clone(), txt: '+' + p + (cad > 1 ? ' ×' + cad : ''), t: 0 });
    sfx.bien(Math.min(10, cad)); vibra(10);
    pulsos.push({ c, r: 0, cad, m: (() => { const m = new THREE.Mesh(geoP, new THREE.MeshBasicMaterial({ color: 0xfa5000, transparent: true, opacity: .35, wireframe: true, depthWrite: false })); m.position.copy(c.m.position); S.add(m); return m; })() });
    if (cad === 3) { x.aviso('¡CADENA ×3!'); sfx.combo(3); }
    if (cad === 5) { x.aviso('¡WORKFLOW EN CADENA!'); sfx.combo(5); bot.pose('celebra', 1.5); x.dice('Email abierto → WhatsApp del agente → reactivado. ¡Así se hace!', 2400); }
  }
  // input
  let ini = null;
  const toques = {
    abajo(e) { if (termino || tiros <= 0) return; ini = { x: e.clientX, y: e.clientY }; aim = { dx: 0, dy: 0 }; tray.visible = true; bot.pose('apunta'); },
    mueve(e) { if (!ini) return; aim = { dx: e.clientX - ini.x, dy: e.clientY - ini.y }; },
    arriba() { if (!ini) return; ini = null; tray.visible = false; const a = aim; aim = null; if (Math.hypot(a.dx, a.dy) < 12) { lanza(velDe({ dx: 0, dy: W.h * .12 })); return; } lanza(velDe(a)); },
    tecla(e) {
      if (!aimK) aimK = { dx: 0, dy: W.h * .15 };
      if (e.key === 'ArrowLeft') aimK.dx += 18; if (e.key === 'ArrowRight') aimK.dx -= 18; if (e.key === 'ArrowUp') aimK.dy += 14; if (e.key === 'ArrowDown') aimK.dy -= 14;
      tray.visible = true; aim = { ...aimK }; teclaT = 1.5;
      if (e.key === ' ' || e.key === 'Enter') { lanza(velDe(aimK)); tray.visible = false; aim = null; }
    },
  };
  let aimK = null, teclaT = 0;
  const v3 = new THREE.Vector3();
  return {
    ...toques,
    __fin() { fin(); },
    empieza() { x.dice('Arrastra hacia atrás y suelta. ¡Busca los grupos para hacer cadenas!', 2600); },
    medir() {},
    limpia() { S.remove(bot.g); },
    paso(dt, T) {
      t += dt;
      if (dt > 0 && !termino) {
        x.tiempo(tiros, 10);
        if (teclaT > 0) { teclaT -= dt; if (teclaT <= 0 && !ini) { tray.visible = false; aim = null; } }
        if (aim) preview(velDe(aim));
        // proyectiles
        for (const p of [...proyectiles]) {
          p.v.y += GRAV * dt; p.m.position.addScaledVector(p.v, dt); p.m.lookAt(v3.copy(p.m.position).add(p.v)); p.m.rotateY(Math.PI / 2); p.vida -= dt;
          // estela
          for (let i = NE - 1; i > 0; i--) { ePos[i * 3] = ePos[(i - 1) * 3]; ePos[i * 3 + 1] = ePos[(i - 1) * 3 + 1]; ePos[i * 3 + 2] = ePos[(i - 1) * 3 + 2]; }
          ePos[0] = p.m.position.x; ePos[1] = p.m.position.y; ePos[2] = p.m.position.z; estelaG.attributes.position.needsUpdate = true;
          let fuera = p.vida <= 0 || p.m.position.y < 0;
          for (const mu of muros) { const lp = mu.m.worldToLocal(v3.copy(p.m.position)); if (Math.abs(lp.z) < .25 && Math.abs(lp.x) < 1.5 && Math.abs(lp.y) < .9) { fuera = true; sfx.mal(); vibra(40); textos.push({ p: p.m.position.clone(), txt: 'Spam', t: 0, mal: true }); x.dice('El filtro de spam se comió la campaña.', 1500); } }
          for (const c of contactos) if (c.estado === 'duerme' && c.m.position.distanceTo(p.m.position) < .75) { p.cad++; despierta(c, 1); fuera = true; sfx.boom(); break; }
          if (fuera) { S.remove(p.m); proyectiles.splice(proyectiles.indexOf(p), 1); if (p.m.position.y < 0) sfx.tap(); }
        }
        // pulsos en cadena
        for (const pu of [...pulsos]) {
          pu.r += dt * 6; pu.m.scale.setScalar(pu.r); pu.m.material.opacity = .35 * (1 - pu.r / 2.8);
          for (const c of contactos) if (c.estado === 'duerme' && c.m.position.distanceTo(pu.c.m.position) < pu.r) despierta(c, pu.cad + 1);
          if (pu.r >= 2.8) { S.remove(pu.m); pu.m.material.dispose(); pulsos.splice(pulsos.indexOf(pu), 1); }
        }
        // ronda terminada
        const quedan = contactos.filter(c => c.estado === 'duerme').length;
        if (!proyectiles.length && !pulsos.length && (tiros <= 0 || quedan === 0) && !esperaRonda) {
          const bono = quedan === 0 ? tiros * 150 + 500 : 0;
          if (bono) { pts += bono; x.pts(pts); x.aviso('¡BASE DESPIERTA! +' + bono); sfx.power(); bot.pose('celebra', 1.5); }
          esperaRonda = 1.6;
        }
        if (esperaRonda) { esperaRonda -= dt; if (esperaRonda <= 0) { esperaRonda = 0; ronda++; if (ronda >= 3) fin(); else { armaRonda(ronda); x.aviso('RONDA ' + (ronda + 1)); x.tempo(100 + ronda * 10); } } }
      }
      // animaciones vivas
      for (const c of contactos) {
        if (c.estado === 'duerme') { c.m.position.y = c.base.y + Math.sin(T * 1.2 + c.fase) * .12; c.s.position.set(c.m.position.x, c.m.position.y + .7 + Math.sin(T * 2 + c.fase) * .05, c.m.position.z); }
        else if (c.estado === 'despierta') {
          c.t += dt; const e = Math.min(1, c.t / 1.4), sc = 1 + .5 * Math.sin(Math.min(1, c.t * 3) * Math.PI);
          c.m.scale.setScalar(sc * (1 - e * .7));
          if (c.t > .35) { const u = cl((c.t - .35) / 1.1, 0, 1), k2 = u * u; c.m.position.lerpVectors(c.base, portal.position, k2); c.m.position.y += Math.sin(u * Math.PI) * 3; }
          c.s.position.set(c.m.position.x, c.m.position.y + .7, c.m.position.z); c.s.material.opacity = 1 - e;
          if (c.t > 1.45) { c.estado = 'listo'; S.remove(c.m, c.s); }
        }
      }
      for (const mu of muros) { mu.m.position.x += mu.vx * dt; if (Math.abs(mu.m.position.x) > 5) mu.vx *= -1; mu.m.position.y += Math.sin(T + mu.fase) * dt * .3; }
      portal.rotation.z += dt * .6; portal2.rotation.z -= dt * .9; portal.scale.setScalar(1 + .04 * Math.sin(T * 3));
      bot.update(T, dt);
      // cámara
      const asp = W.w / W.h; cam.aspect = asp; cam.fov = asp < .8 ? 68 : 52;
      cam.position.set(asp < .8 ? .9 : 1.7, asp < .8 ? 2.6 : 2.2, asp < .8 ? 4.2 : 4.2); cam.lookAt(asp < .8 ? 0 : .4, asp < .8 ? 2.2 : 1.6, -10); cam.updateProjectionMatrix();
      R.render(S, cam);
      // textos flotantes sobre el canvas 2D (en coordenadas de pantalla)
      g.setTransform(W.dpr, 0, 0, W.dpr, 0, 0); g.clearRect(0, 0, W.w, W.h);
      for (const tx of textos) { tx.t += dt; }
      textos = textos.filter(tx => tx.t < 1);
      for (const tx of textos) {
        v3.copy(tx.p).project(cam); if (v3.z > 1) continue;
        const sx = (v3.x * .5 + .5) * W.w, sy = (-v3.y * .5 + .5) * W.h - tx.t * 50;
        g.globalAlpha = 1 - tx.t; g.fillStyle = tx.mal ? '#FF8A80' : '#FFF1E8'; g.font = '800 20px "Plus Jakarta Sans",sans-serif'; g.textAlign = 'center'; g.fillText(tx.txt, sx, sy);
      }
      g.globalAlpha = 1; g.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
  function fin() {
    if (termino) return; termino = true;
    const pct = total ? Math.round(despiertos / total * 100) : 0;
    x.terminar({
      pts, frase: `Despertaste ${despiertos} de ${total} contactos dormidos (${pct}%).`,
      stats: [[despiertos, 'contactos reactivados'], [mejorCad, 'cadena más larga'], [pct + '%', 'de la base']],
      ilus: 'Ilustrativo: en Hapee lo armas con Mail Marketing y un workflow: si abre el email, el agente le escribe por WhatsApp para agendar y lo etiqueta «reactivado».',
      gancho: 'Tu base de contactos vale plata. Hapee la despierta sola.',
    });
  }
}

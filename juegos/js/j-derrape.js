// Juego · Derrape — carrera de 3 vueltas en kart flotante contra los bots de spam. Arrastra para doblar; derrapa y suelta para el turbo.
import { base, piezas } from './kit3d.js?v=2';
export async function crear(x) {
  const { THREE, bot, W, sfx, vibra, rnd, cl, lerp } = x;
  const k = base(x, { horizonte: .52, cerca: 60, lejos: 220, far: 400 });
  const { S, cam } = k;
  const P = piezas(THREE);
  // pista: spline cerrada
  const ctrl = []; const NC = 14;
  for (let i = 0; i < NC; i++) { const a = i / NC * Math.PI * 2, r = rnd(62, 95) * (i % 3 === 0 ? .8 : 1); ctrl.push(new THREE.Vector3(Math.cos(a) * r * 1.25, 0, Math.sin(a) * r)); }
  const curva = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal');
  const NS = 900, mues = curva.getSpacedPoints(NS), tang = []; for (let i = 0; i < NS; i++) tang.push(mues[(i + 1) % NS].clone().sub(mues[i]).normalize());
  const LARGO = curva.getLength(), ANCHO = 9;
  { // malla de la pista
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= NS; i++) { const p = mues[i % NS], tg = tang[i % NS], n = new THREE.Vector3(-tg.z, 0, tg.x); for (const s of [-1, 1]) { const q = p.clone().addScaledVector(n, s * ANCHO / 2); pos.push(q.x, .02, q.z); uv.push(s < 0 ? 0 : 1, i / NS * LARGO / 6); } }
    for (let i = 0; i < NS; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.setIndex(idx); gg.computeVertexNormals();
    const c = document.createElement('canvas'); c.width = 256; c.height = 256; const d = c.getContext('2d');
    d.fillStyle = '#241018'; d.fillRect(0, 0, 256, 256); d.fillStyle = '#FA5000'; d.fillRect(0, 0, 14, 256); d.fillRect(242, 0, 14, 256);
    d.fillStyle = '#fff'; for (let y = 0; y < 256; y += 64) { d.fillRect(0, y, 14, 32); d.fillRect(242, y, 14, 32); }
    d.fillStyle = 'rgba(255,241,232,.35)'; d.fillRect(124, 0, 8, 110);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
    S.add(new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ map: t, roughness: .4, metalness: .3, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .3, side: THREE.DoubleSide })));
  }
  // suelo con grilla
  const grid = new THREE.GridHelper(600, 120, 0x5a1424, 0x2a0a12); grid.position.y = -.02; S.add(grid);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x0a0306 })); suelo.rotation.x = -Math.PI / 2; suelo.position.y = -.05; S.add(suelo);
  // postes de luz y meta
  const mPoste = new THREE.MeshBasicMaterial({ color: 0xfa5000, toneMapped: false }), mPoste2 = new THREE.MeshBasicMaterial({ color: 0xcd2349, toneMapped: false });
  for (let i = 0; i < NS; i += 18) { const p = mues[i], tg = tang[i], n = new THREE.Vector3(-tg.z, 0, tg.x); for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 2.6, 6), (i / 18) % 2 ? mPoste : mPoste2); m.position.copy(p).addScaledVector(n, s * (ANCHO / 2 + 1)); m.position.y = 1.3; S.add(m); } }
  { const p = mues[0], tg = tang[0], n = new THREE.Vector3(-tg.z, 0, tg.x); const arco = new THREE.Mesh(new THREE.TorusGeometry(ANCHO / 2 + 1, .25, 10, 40, Math.PI), new THREE.MeshBasicMaterial({ color: 0xfff1e8, toneMapped: false })); arco.position.copy(p); arco.lookAt(p.clone().add(tg)); S.add(arco); }
  // ciudad lejana
  { const mE = new THREE.MeshStandardMaterial({ color: 0x241018, emissive: 0x401020, emissiveIntensity: .6, roughness: .8 }); for (let i = 0; i < 90; i++) { const a = rnd(0, Math.PI * 2), r = rnd(150, 210), h = rnd(10, 50), m = new THREE.Mesh(new THREE.BoxGeometry(rnd(6, 14), h, rnd(6, 14)), mE); m.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r); S.add(m); } }
  // kart
  function kart(color) {
    const gk = new THREE.Group();
    const casco = new THREE.Mesh(new THREE.CapsuleGeometry(.55, 1.3, 6, 16), new THREE.MeshPhysicalMaterial({ color, roughness: .2, metalness: .3, clearcoat: 1 })); casco.rotation.x = Math.PI / 2; casco.scale.set(1.25, 1, .45); casco.position.y = .38; gk.add(casco);
    const franja = new THREE.Mesh(new THREE.BoxGeometry(.18, .05, 2.2), new THREE.MeshBasicMaterial({ color: 0xfff1e8, toneMapped: false })); franja.position.set(0, .64, 0); gk.add(franja);
    const aleron = new THREE.Mesh(new THREE.BoxGeometry(1.6, .08, .35), new THREE.MeshPhysicalMaterial({ color: 0x1a0a10, roughness: .3, clearcoat: 1 })); aleron.position.set(0, .85, -1.05); gk.add(aleron);
    for (const s of [-.6, .6]) { const pa = new THREE.Mesh(new THREE.BoxGeometry(.06, .3, .2), aleron.material); pa.position.set(s, .7, -1.05); gk.add(pa); }
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .28, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })); glow.rotation.x = -Math.PI / 2; glow.position.y = .04; gk.add(glow);
    for (const s of [-.35, .35]) { const tob = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .2, 12), new THREE.MeshBasicMaterial({ color: 0xff7a30, toneMapped: false })); tob.rotation.x = Math.PI / 2; tob.position.set(s, .4, -1.2); gk.add(tob); }
    return gk;
  }
  const yo = kart(0xfa5000); S.add(yo);
  bot.g.position.set(0, .45, -.1); bot.g.rotation.set(0, 0, 0); bot.g.scale.setScalar(1.15); yo.add(bot.g);
  // rivales: karts de spam
  const rivales = [];
  for (let i = 0; i < 3; i++) { const r = kart(0x5a0a14); const sp = P.spam.clone(true); sp.position.y = 1; sp.scale.setScalar(.8); r.add(sp); S.add(r); rivales.push({ m: r, s: 1 - (i + 1) * 9 / LARGO, vel: lerp(.9, 1.0, i / 2), lado: (i - 1) * 2.4, vuelta: -1 }); }
  // leads y turbos en la pista
  const geoTurbo = new THREE.PlaneGeometry(2.6, 2.6);
  const tTurbo = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const d = c.getContext('2d'); d.fillStyle = 'rgba(37,194,106,.85)'; d.beginPath(); d.roundRect(4, 4, 120, 120, 20); d.fill(); d.fillStyle = '#fff'; for (const y of [30, 66]) { d.beginPath(); d.moveTo(64, y); d.lineTo(100, y + 30); d.lineTo(28, y + 30); d.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  let leadsO = [], turbos = [];
  function siembra() {
    for (const l of leadsO) S.remove(l.m); leadsO = [];
    for (let i = 30; i < NS; i += 22) { const lado = rnd(-.35, .35) * ANCHO; const tg = tang[i], n = new THREE.Vector3(-tg.z, 0, tg.x); for (let j = 0; j < 3; j++) { const q = mues[(i + j * 2) % NS].clone().addScaledVector(n, lado); const l = P.lead.clone(true); l.position.set(q.x, 1, q.z); S.add(l); leadsO.push({ m: l }); } }
  }
  siembra();
  for (let i = 60; i < NS; i += 140) { const tg = tang[i], n = new THREE.Vector3(-tg.z, 0, tg.x), q = mues[i].clone().addScaledVector(n, rnd(-.25, .25) * ANCHO); const m = new THREE.Mesh(geoTurbo, new THREE.MeshBasicMaterial({ map: tTurbo, transparent: true, toneMapped: false, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(tg.x, tg.z) + Math.PI; m.position.set(q.x, .05, q.z); S.add(m); turbos.push({ m, cd: 0 }); }
  // estado del jugador
  const pos = mues[0].clone().addScaledVector(new THREE.Vector3(-tang[0].z, 0, tang[0].x), 0).addScaledVector(tang[0], -6);
  let rumbo = Math.atan2(tang[0].x, tang[0].z), velDir = rumbo, vel = 0, u = 0, deriva = 0, derivando = false, turbo = 0, idx = NS - 6, vuelta = 0, mitad = false, t = 0, pts = 0, leads = 0, turbosN = 0, termino = false, tVuelta = 0, mejorV = 99, puesto = 4, inicioOk = false;
  const VUELTAS = 3, DUR = 100, VMAX = 30;
  function cercano(p, desde) { let best = desde, bd = 1e9; for (let d = -30; d <= 30; d++) { const i = (desde + d + NS) % NS, q = mues[i], dd = (q.x - p.x) ** 2 + (q.z - p.z) ** 2; if (dd < bd) { bd = dd; best = i; } } return [best, Math.sqrt(bd)]; }
  function progresoYo() { return vuelta + (vuelta === 0 && !mitad && idx > NS * .8 ? idx / NS - 1 : idx / NS); }
  function fin() {
    if (termino) return; termino = true; k.slow(.3, 1.2);
    const bonoP = [0, 3000, 1500, 700, 200][puesto] || 0; pts += bonoP; x.pts(pts);
    bot.pose(puesto === 1 ? 'celebra' : 'triste', 3);
    setTimeout(() => x.terminar({
      pts, frase: vuelta >= VUELTAS ? `Llegaste ${['', 'primero', 'segundo', 'tercero', 'cuarto'][puesto]} con ${leads} ${leads === 1 ? 'lead' : 'leads'}.` : `Completaste ${vuelta} ${vuelta === 1 ? 'vuelta' : 'vueltas'} con ${leads} ${leads === 1 ? 'lead' : 'leads'}.`,
      stats: [[puesto + '°', 'puesto final'], [leads, 'leads en la pista'], [mejorV < 99 ? mejorV.toFixed(1).replace('.', ',') + ' s' : '—', 'mejor vuelta']],
      ilus: 'Ilustrativo: en ventas también gana el que llega primero. El agente de Hapee responde antes que tu competencia, cada vez.',
      gancho: 'Responde primero. Vende primero.',
    }), 900);
  }
  let ini = null, teclas = {};
  addEventListener('keyup', e => { teclas[e.key] = false; });
  return {
    __fin() { t = DUR; },
    abajo(e) { ini = { x: e.clientX }; },
    mueve(e) { if (ini) u = cl((e.clientX - ini.x) / (W.w * .22), -1, 1); },
    arriba() { ini = null; u = 0; },
    tecla(e) { teclas[e.key] = true; },
    empieza() { inicioOk = true; x.dice('Arrastra para doblar. ¡Derrapa y suelta para el turbo!', 2000); sfx.power(); },
    limpia() { yo.remove(bot.g); },
    paso(dtR, T) {
      const dt = k.tiempo(dtR);
      if (dtR > 0 && !termino && inicioOk) {
        t += dt; tVuelta += dt; x.tiempo(DUR - t, DUR); x.extra(`VUELTA ${Math.min(VUELTAS, vuelta + 1)} / ${VUELTAS} · ${puesto}°`);
        const uk = ((teclas.ArrowRight || teclas.d) ? 1 : 0) - ((teclas.ArrowLeft || teclas.a) ? 1 : 0), uu = ini ? u : uk;
        const [i2, dist] = cercano(pos, idx);
        // vuelta
        if (i2 < 40 && idx > NS - 40 && mitad) { vuelta++; mitad = false; mejorV = Math.min(mejorV, tVuelta); tVuelta = 0; if (vuelta < VUELTAS) { x.aviso(vuelta === VUELTAS - 1 ? '¡ÚLTIMA VUELTA!' : 'VUELTA ' + (vuelta + 1)); sfx.power(); siembra(); } else fin(); }
        if (i2 > NS * .45 && i2 < NS * .55) mitad = true;
        idx = i2;
        const fuera = dist > ANCHO / 2 + .4;
        const vObj = (fuera ? VMAX * .45 : VMAX) + (turbo > 0 ? 14 : 0);
        vel = lerp(vel, vObj, cl(dt * (vel < vObj ? 1.1 : 2.2), 0, 1));
        // dirección y derrape
        const giro = uu * (derivando ? 2.1 : 1.55) * cl(vel / 18, .3, 1.15);
        rumbo -= giro * dt;
        if (Math.abs(uu) < .15) { const tg2 = tang[(i2 + 8) % NS], q2 = mues[(i2 + 8) % NS]; const obj = Math.atan2(q2.x - pos.x, q2.z - pos.z); let dr = obj - rumbo; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); rumbo += dr * cl(dt * 2.2, 0, 1); }
        if (Math.abs(uu) > .6 && vel > 18 && !fuera) { if (!derivando && Math.abs(uu) > .8) { derivando = true; sfx.whoosh(); } }
        if (derivando) {
          deriva += dt;
          if (Math.abs(uu) < .35 || vel < 12) { derivando = false; if (deriva > .55) { turbo = deriva > 1.4 ? 1.4 : deriva > .9 ? 1 : .6; x.aviso(deriva > 1.4 ? '¡SÚPER TURBO!' : '¡TURBO!'); sfx.power(); k.shake(.35); vibra(25); pts += Math.round(deriva * 200); x.pts(pts); k.slow(.5, .2); } deriva = 0; }
          const nivel = deriva > 1.4 ? 0xff3d7f : deriva > .9 ? 0xfa5000 : 0xffd080;
          const atras = new THREE.Vector3(Math.sin(rumbo), 0, Math.cos(rumbo)).multiplyScalar(-1.1);
          for (const s of [-.6, .6]) { const lado = new THREE.Vector3(Math.cos(rumbo), 0, -Math.sin(rumbo)).multiplyScalar(s); k.burst(pos.clone().add(atras).add(lado).setY(.2), nivel, 2, 3, .14, -6); }
        }
        let dv = rumbo - velDir; dv = Math.atan2(Math.sin(dv), Math.cos(dv)); velDir += dv * cl(dt * (derivando ? 2.2 : 9), 0, 1);
        turbo = Math.max(0, turbo - dt);
        pos.x += Math.sin(velDir) * vel * dt; pos.z += Math.cos(velDir) * vel * dt;
        if (turbo > 0) { const atras = new THREE.Vector3(Math.sin(rumbo), 0, Math.cos(rumbo)).multiplyScalar(-1.4); k.burst(pos.clone().add(atras).setY(.4), 0xffa040, 3, 4, .2, 0); }
        if (fuera && vel > 10) k.burst(pos.clone().setY(.1), 0x6a3a40, 1, 2, .2);
        // leads y turbos
        for (const l of [...leadsO]) { l.m.rotation.y += dt * 3; if ((l.m.position.x - pos.x) ** 2 + (l.m.position.z - pos.z) ** 2 < 2.2) { S.remove(l.m); leadsO.splice(leadsO.indexOf(l), 1); leads++; pts += 60; x.pts(pts); sfx.bien(leads % 11); k.burst(l.m.position, 0xfa5000, 10, 3, .16); vibra(5); } }
        for (const tb of turbos) { tb.cd -= dt; if (tb.cd <= 0 && (tb.m.position.x - pos.x) ** 2 + (tb.m.position.z - pos.z) ** 2 < 3) { tb.cd = 2; turbo = 1.2; turbosN++; x.aviso('¡TURBO WHATSAPP!'); sfx.power(); k.shake(.3); k.burst(tb.m.position, 0x25c26a, 40, 7, .25); } }
        // rivales
        for (const r of rivales) {
          r.s += (VMAX * r.vel * (1 + .05 * Math.sin(T * .7 + r.lado))) * dt / LARGO;
          if (r.s >= 1) { r.s -= 1; r.vuelta++; }
          const ri = Math.floor(r.s * NS) % NS, q = mues[ri], tg = tang[ri], n = new THREE.Vector3(-tg.z, 0, tg.x);
          r.m.position.copy(q).addScaledVector(n, r.lado + Math.sin(T * .9 + r.lado) * 1.2); r.m.position.y = .15 + Math.sin(T * 4 + r.lado) * .05;
          r.m.rotation.y = Math.atan2(tg.x, tg.z);
          // choque con el jugador: empujón
          const dx = pos.x - r.m.position.x, dz = pos.z - r.m.position.z, dd = Math.hypot(dx, dz);
          if (dd < 1.9) { pos.x += dx / dd * (1.9 - dd); pos.z += dz / dd * (1.9 - dd); vel *= .85; k.shake(.4); k.burst(pos.clone().setY(.6), 0xffffff, 12, 5, .15); sfx.mal(); vibra(20); }
        }
        // puesto
        const miP = progresoYo(); puesto = 1 + rivales.filter(r => r.vuelta + r.s > miP).length;
        if (t >= DUR) fin();
        x.tempo(126 + vel);
      }
      yo.position.set(pos.x, .15 + Math.sin(T * 5) * .04, pos.z);
      yo.rotation.y = rumbo; yo.rotation.z = lerp(yo.rotation.z, -u * .18 - (derivando ? Math.sign(u) * .1 : 0), .15);
      if (!termino && bot.st.pose !== 'celebra') bot.pose(turbo > 0 ? 'celebra' : 'idle');
      bot.st.mira = -u * .5;
      bot.update(T, dt);
      k.pasoPart(dt);
      // cámara de persecución
      const vert = W.w / W.h < .8;
      cam.fov = (vert ? 74 : 62) + (turbo > 0 ? 8 : 0) + vel * .1;
      const atrasC = new THREE.Vector3(Math.sin(rumbo * .7 + velDir * .3), 0, Math.cos(rumbo * .7 + velDir * .3));
      const objC = pos.clone().addScaledVector(atrasC, vert ? -5.6 : -6).setY(vert ? 2.7 : 2.6);
      if (!this._cam) { cam.position.copy(objC); this._cam = true; }
      cam.position.lerp(objC, cl(dtR * 6, 0, 1));
      cam.lookAt(pos.clone().addScaledVector(atrasC, 5).setY(1));
      k.render(dtR, gg => {
        if (ini) { gg.strokeStyle = 'rgba(255,241,232,.3)'; gg.lineWidth = 3; gg.beginPath(); gg.moveTo(ini.x - W.w * .22, W.h - 60); gg.lineTo(ini.x + W.w * .22, W.h - 60); gg.stroke(); gg.fillStyle = '#FA5000'; gg.beginPath(); gg.arc(ini.x + u * W.w * .22, W.h - 60, 16, 0, 7); gg.fill(); }
        if (!inicioOk) return;
      });
    },
  };
}

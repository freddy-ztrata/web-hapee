// Juego · Demoledor — el robot es la bala de cañón. Tira hacia atrás y suelta para derribar las torres de spam.
import { base, piezas } from './kit3d.js?v=2';
const CANNON_URL = 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
export async function crear(x) {
  const { THREE, bot, W, sfx, vibra, rnd, cl, lerp } = x;
  const C = await import(CANNON_URL);
  const k = base(x, { horizonte: .6, cerca: 40, lejos: 110 });
  const { S, cam } = k;
  const P = piezas(THREE);
  const mundo = new C.World({ gravity: new C.Vec3(0, -14, 0) });
  mundo.allowSleep = true; mundo.broadphase = new C.SAPBroadphase(mundo);
  mundo.defaultContactMaterial.friction = .45; mundo.defaultContactMaterial.restitution = .12;
  const sueloB = new C.Body({ mass: 0, shape: new C.Plane() }); sueloB.quaternion.setFromEuler(-Math.PI / 2, 0, 0); mundo.addBody(sueloB);
  // escenario
  const fc = document.createElement('canvas'); fc.width = fc.height = 512; const f = fc.getContext('2d');
  f.fillStyle = '#170710'; f.fillRect(0, 0, 512, 512); f.strokeStyle = 'rgba(250,80,0,.25)'; f.lineWidth = 2; for (let i = 0; i <= 512; i += 32) { f.beginPath(); f.moveTo(i, 0); f.lineTo(i, 512); f.stroke(); f.beginPath(); f.moveTo(0, i); f.lineTo(512, i); f.stroke(); }
  const ft = new THREE.CanvasTexture(fc); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(20, 8); ft.colorSpace = THREE.SRGBColorSpace;
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(160, 60), new THREE.MeshStandardMaterial({ map: ft, roughness: .5, metalness: .4, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: .3 })); piso.rotation.x = -Math.PI / 2; piso.position.x = 20; S.add(piso);
  // cañón / plataforma de lanzamiento
  const base0 = new THREE.Vector3(0, 1.6, 0);
  const torreL = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.2, 1.4, 24), new THREE.MeshPhysicalMaterial({ color: 0x2a0a12, metalness: .6, roughness: .3, clearcoat: 1 })); torreL.position.set(0, .7, 0); S.add(torreL);
  const aroL = new THREE.Mesh(new THREE.TorusGeometry(1, .07, 8, 48), new THREE.MeshBasicMaterial({ color: 0xfa5000, toneMapped: false })); aroL.rotation.x = Math.PI / 2; aroL.position.set(0, 1.42, 0); S.add(aroL);
  // ciudad de fondo
  { const mE = new THREE.MeshStandardMaterial({ color: 0x241018, emissive: 0x3a0d1a, emissiveIntensity: .7 }); for (let i = 0; i < 40; i++) { const h = rnd(6, 26), m = new THREE.Mesh(new THREE.BoxGeometry(rnd(3, 7), h, rnd(3, 6)), mE); m.position.set(rnd(-20, 70), h / 2, rnd(-45, -22)); S.add(m); } }
  // texturas de bloques
  const texBloque = (txt, c1, c2) => { const c = document.createElement('canvas'); c.width = c.height = 128; const d = c.getContext('2d'); const gr = d.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, c1); gr.addColorStop(1, c2); d.fillStyle = gr; d.fillRect(0, 0, 128, 128); d.strokeStyle = 'rgba(0,0,0,.35)'; d.lineWidth = 8; d.strokeRect(4, 4, 120, 120); if (txt) { d.fillStyle = 'rgba(255,241,232,.85)'; d.font = '800 26px "Plus Jakarta Sans",sans-serif'; d.textAlign = 'center'; d.textBaseline = 'middle'; d.fillText(txt, 64, 66); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const mB = [new THREE.MeshStandardMaterial({ map: texBloque('SPAM', '#8a1424', '#4a0a12'), roughness: .5 }), new THREE.MeshStandardMaterial({ map: texBloque('', '#5a4a52', '#2a1e24'), roughness: .6 }), new THREE.MeshStandardMaterial({ map: texBloque('CLICK', '#a01830', '#5a0c18'), roughness: .5 })];
  const hold = new THREE.Group(); S.add(hold); hold.add(bot.g); bot.g.scale.setScalar(1.1); bot.g.position.set(0, -.6, 0);
  let cuerpos = [], botsS = [], nivel = 0, tiros = 4, pts = 0, eliminados = 0, bloquesCaidos = 0, t = 0, termino = false, estado = 'apunta', vuelo = 0, quieto = 0, aim = null, proyectil = null, mejorTiro = 0, tiroPts = 0;
  const DUR = 100;
  function bloque(px, py, w, h, d = 1.2, mat = 0, masa = 1) {
    const b = new C.Body({ mass: masa * w * h, shape: new C.Box(new C.Vec3(w / 2, h / 2, d / 2)), position: new C.Vec3(px, py, 0) }); b.sleepSpeedLimit = .3;
    mundo.addBody(b);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mB[mat]); S.add(m);
    const o = { b, m, y0: py, cayo: false }; cuerpos.push(o);
    b.addEventListener('collide', e => { const v = Math.abs(e.contact.getImpactVelocityAlongNormal()); if (v > 4 && estado === 'vuela') { tiroPts += 15; pts += 15; x.pts(pts); if (Math.random() < .3) { k.burst(new THREE.Vector3(b.position.x, b.position.y, 0), 0xffc080, 6, 4, .15); sfx.pop(); } } });
    return o;
  }
  function botSpam(px, py) {
    const b = new C.Body({ mass: 1.2, shape: new C.Sphere(.45), position: new C.Vec3(px, py, 0), linearDamping: .1 }); b.sleepSpeedLimit = .2; mundo.addBody(b);
    const m = P.spam.clone(true); m.scale.setScalar(.9); S.add(m);
    const o = { b, m, vivo: true, y0: py };
    b.addEventListener('collide', e => { if (!o.vivo || estado !== 'vuela') return; const v = Math.abs(e.contact.getImpactVelocityAlongNormal()); if (v > 5.5) elimina(o); });
    botsS.push(o); return o;
  }
  function elimina(o) {
    if (!o.vivo) return; o.vivo = false; eliminados++;
    const p = 1000; pts += p; tiroPts += p; x.pts(pts);
    const pp = new THREE.Vector3(o.b.position.x, o.b.position.y, 0);
    k.burst(pp, 0xff3030, 50, 9, .3); k.burst(pp, 0xfa5000, 30, 6, .25); k.flota(pp.clone().setY(pp.y + 1), '+1.000', '#FFB48A', 30);
    k.shake(.7); k.hitstop(.1); sfx.boom(); vibra(35);
    setTimeout(() => { mundo.removeBody(o.b); S.remove(o.m); }, 30);
    if (botsS.every(b => !b.vivo)) setTimeout(() => nivelListo(), 600);
  }
  function limpiaNivel() { for (const o of cuerpos) { mundo.removeBody(o.b); S.remove(o.m); } for (const o of botsS) { mundo.removeBody(o.b); S.remove(o.m); } cuerpos = []; botsS = []; }
  function arma(n) {
    limpiaNivel(); tiros = 4;
    const x0 = 15 + n * 2;
    if (n === 0) { // dos torres con puente
      for (const tx of [x0, x0 + 4]) { bloque(tx - .7, 1.2, .5, 2.4, 1.2, 1); bloque(tx + .7, 1.2, .5, 2.4, 1.2, 1); bloque(tx, 2.65, 2.2, .5, 1.2, 0); bloque(tx - .6, 3.65, .5, 1.5, 1.2, 1); bloque(tx + .6, 3.65, .5, 1.5, 1.2, 1); bloque(tx, 4.6, 1.8, .4, 1.2, 2); botSpam(tx, 3.4); botSpam(tx, 5.3); }
      bloque(x0 + 2, 5.1, 4.6, .3, 1.2, 1, .5);
    } else if (n === 1) { // pirámide
      let fila = 0; for (let filas = 5; filas > 0; filas--, fila++) for (let i = 0; i < filas; i++) bloque(x0 + (i - (filas - 1) / 2) * 1.25, .6 + fila * 1.2, 1.15, 1.15, 1.15, (i + fila) % 2 ? 0 : 2);
      botSpam(x0, 6.6); botSpam(x0 - 2.5, 1.5 + 1.2 * 1.6); botSpam(x0 + 2.5, 1.5 + 1.2 * 1.6);
    } else { // fortaleza alta
      for (let p = 0; p < 4; p++) { const h0 = p * 2.6; for (const tx of [x0, x0 + 2.4, x0 + 4.8]) bloque(tx, h0 + 1.05, .45, 2.1, 1.2, 1); bloque(x0 + 1.2, h0 + 2.3, 2.9, .35, 1.2, p % 2 ? 0 : 2); bloque(x0 + 3.6, h0 + 2.3, 2.9, .35, 1.2, p % 2 ? 2 : 0); if (p % 2 === 0) { botSpam(x0 + 1.2, h0 + 1); botSpam(x0 + 3.6, h0 + 1); } else botSpam(x0 + 2.4, h0 + 3); }
    }
    x.extra(`NIVEL ${n + 1} / 3 · ${tiros} ROBOTS`);
    preparaTiro();
  }
  function preparaTiro() {
    estado = 'apunta'; if (proyectil) { mundo.removeBody(proyectil); proyectil = null; }
    hold.position.copy(base0).y += .6; hold.quaternion.identity(); bot.g.rotation.set(0, Math.PI / 2, 0); bot.pose('apunta'); tiroPts = 0;
  }
  function velDe(a) { const L = Math.min(Math.hypot(a.dx, a.dy), Math.min(W.w, W.h) * .4); const ang = Math.atan2(a.dy, -a.dx); const pot = 8 + L / (Math.min(W.w, W.h) * .4) * 20; return new THREE.Vector3(Math.cos(ang) * pot, Math.sin(ang) * pot, 0); }
  function lanza(v) {
    if (estado !== 'apunta' || termino || tiros <= 0) return;
    tiros--; estado = 'vuela'; vuelo = 0; quieto = 0;
    proyectil = new C.Body({ mass: 6, shape: new C.Sphere(.55), position: new C.Vec3(base0.x, base0.y + .5, 0), linearDamping: .02, angularDamping: .2 });
    proyectil.velocity.set(v.x, v.y, 0); proyectil.angularVelocity.set(0, 0, -v.length() * .8); mundo.addBody(proyectil);
    proyectil.addEventListener('collide', e => { const vv = Math.abs(e.contact.getImpactVelocityAlongNormal()); if (vv > 8 && !proyectil._golpe) { proyectil._golpe = true; k.slow(.25, .5); k.shake(.9); sfx.boom(); vibra(40); k.burst(new THREE.Vector3(proyectil.position.x, proyectil.position.y, 0), 0xfa5000, 40, 9, .3); } });
    bot.pose('salta'); sfx.whoosh(); k.shake(.3); k.burst(base0.clone(), 0xffc080, 30, 6, .25);
    x.extra(`NIVEL ${nivel + 1} / 3 · ${tiros} ROBOTS`);
  }
  function nivelListo() {
    if (termino) return;
    const bono = 1500 * tiros + 1000; pts += bono; x.pts(pts); x.aviso(`¡TORRE LIMPIA! +${bono.toLocaleString('es-CL')}`); sfx.power(); bot.pose('celebra', 1.5);
    nivel++; if (nivel >= 3) return setTimeout(() => fin(true), 1200);
    setTimeout(() => { if (!termino) arma(nivel); }, 1500);
  }
  function fin(gano) {
    if (termino) return; termino = true; k.slow(.3, 1);
    setTimeout(() => x.terminar({
      pts, frase: gano ? `Derribaste las tres torres de spam.` : `Llegaste al nivel ${nivel + 1} y eliminaste ${eliminados} ${eliminados === 1 ? 'bot' : 'bots'} de spam.`,
      stats: [[eliminados, 'bots de spam derribados'], [nivel + (gano ? 0 : 1), 'nivel alcanzado'], [mejorTiro.toLocaleString('es-CL'), 'mejor tiro']],
      ilus: 'Ilustrativo: las torres de spam no se derriban a cañonazos, pero sí dejan de quitarte tiempo cuando un agente de Hapee filtra la bandeja por ti.',
      gancho: 'Derriba el spam. Quédate con los clientes.',
    }), 900);
  }
  arma(0);
  // trayectoria
  const NT = 30, tPos = new Float32Array(NT * 3), trayG = new THREE.BufferGeometry(); trayG.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
  const tray = new THREE.Points(trayG, new THREE.PointsMaterial({ color: 0xfff1e8, size: .16, transparent: true, opacity: .8, depthWrite: false })); tray.visible = false; S.add(tray);
  function preview(v) { const p = base0.clone().setY(base0.y + .5), vv = v.clone(); for (let i = 0; i < NT; i++) { tPos[i * 3] = p.x; tPos[i * 3 + 1] = p.y; tPos[i * 3 + 2] = 0; for (let j = 0; j < 3; j++) { vv.y -= 14 * .016; p.addScaledVector(vv, .016); } } trayG.attributes.position.needsUpdate = true; }
  let ini = null, aimK = { dx: -W.w * .2, dy: W.h * .12 };
  preparaTiro();
  const camPos = new THREE.Vector3(), camMira = new THREE.Vector3();
  return {
    __fin() { t = DUR; },
    abajo(e) { if (estado !== 'apunta') return; ini = { x: e.clientX, y: e.clientY }; aim = { dx: 0, dy: 0 }; tray.visible = true; },
    mueve(e) { if (!ini) return; aim = { dx: e.clientX - ini.x, dy: e.clientY - ini.y }; },
    arriba() { if (!ini) return; ini = null; tray.visible = false; const a = aim; aim = null; if (Math.hypot(a.dx, a.dy) < 14) lanza(velDe({ dx: -W.w * .22, dy: W.h * .14 })); else lanza(velDe(a)); },
    tecla(e) {
      if (e.key === 'ArrowLeft') aimK.dx -= 14; if (e.key === 'ArrowRight') aimK.dx += 14; if (e.key === 'ArrowUp') aimK.dy += 12; if (e.key === 'ArrowDown') aimK.dy -= 12;
      aim = { ...aimK }; tray.visible = true;
      if (e.key === ' ' || e.key === 'Enter') { tray.visible = false; aim = null; lanza(velDe(aimK)); }
    },
    empieza() { x.dice('¡Tira hacia atrás y suéltame contra las torres!', 2000); },
    limpia() { limpiaNivel(); hold.remove(bot.g); S.remove(hold); bot.g.position.set(0, 0, 0); },
    paso(dtR, T) {
      const dt = k.tiempo(dtR);
      if (dtR > 0 && !termino) {
        t += dt; x.tiempo(DUR - t, DUR);
        mundo.step(1 / 60, dt, 4);
        if (aim) preview(velDe(aim));
        if (estado === 'vuela' && proyectil) {
          vuelo += dt;
          hold.position.set(proyectil.position.x, proyectil.position.y, 0);
          hold.quaternion.set(proyectil.quaternion.x, proyectil.quaternion.y, proyectil.quaternion.z, proyectil.quaternion.w);
          if (vuelo < 1.2) k.estela(new THREE.Vector3(proyectil.position.x, proyectil.position.y, 0), 0xffa060, .35, .3);
          const sp = proyectil.velocity.length(); quieto = sp < 1.2 ? quieto + dt : 0;
          if (quieto > .9 || vuelo > 7 || proyectil.position.x > 60 || proyectil.position.y < -5) {
            if (tiroPts > mejorTiro) mejorTiro = tiroPts;
            if (botsS.some(b => b.vivo)) { if (tiros > 0) preparaTiro(); else fin(false); } else estado = 'espera';
          }
        }
        // bots que caen al suelo también cuentan
        for (const o of botsS) if (o.vivo && o.b.position.y < .6 && o.y0 > 1) elimina(o);
        if (t >= DUR) fin(false);
      }
      for (const o of cuerpos) { o.m.position.set(o.b.position.x, o.b.position.y, o.b.position.z); o.m.quaternion.set(o.b.quaternion.x, o.b.quaternion.y, o.b.quaternion.z, o.b.quaternion.w); if (!o.cayo && o.b.position.y < o.y0 - 1) { o.cayo = true; bloquesCaidos++; pts += 50; x.pts(pts); } }
      for (const o of botsS) { o.m.position.set(o.b.position.x, o.b.position.y, o.b.position.z); o.m.rotation.y = -Math.PI / 2 + Math.sin(T * 2 + o.y0) * .4; }
      if (estado === 'apunta') { hold.position.copy(base0); hold.position.y += .6 + Math.sin(T * 3) * .04; }
      bot.update(T, dt);
      k.pasoPart(dt);
      // cámara: lado, sigue al robot en vuelo
      const vert = W.w / W.h < .8;
      cam.fov = vert ? 68 : 48;
      const centroTorre = 17 + nivel * 2 + 2.4;
      let cx, cy, cz;
      if (estado === 'vuela' && proyectil) { cx = lerp(proyectil.position.x, centroTorre, .35); cy = Math.max(4, proyectil.position.y * .6 + 3); cz = vert ? 22 : 18; }
      else if (aim || estado === 'apunta') { cx = vert ? centroTorre * .45 : centroTorre * .5; cy = vert ? 5.5 : 5; cz = vert ? 27 : 21; }
      else { cx = centroTorre * .7; cy = 5; cz = vert ? 24 : 19; }
      camPos.lerp(new THREE.Vector3(cx, cy, cz), cl(dtR * 3, 0, 1)); if (!this._c) { camPos.set(cx, cy, cz); this._c = true; }
      cam.position.copy(camPos); camMira.set(camPos.x, cy - 1.2, 0); cam.lookAt(camMira);
      k.render(dtR, gg => {
        if (ini && aim) { gg.strokeStyle = 'rgba(255,241,232,.5)'; gg.lineWidth = 3; gg.setLineDash([6, 8]); gg.beginPath(); gg.moveTo(ini.x, ini.y); gg.lineTo(ini.x + aim.dx, ini.y + aim.dy); gg.stroke(); gg.setLineDash([]); gg.fillStyle = '#FA5000'; gg.beginPath(); gg.arc(ini.x + aim.dx, ini.y + aim.dy, 14, 0, 7); gg.fill(); }
      });
    },
  };
}

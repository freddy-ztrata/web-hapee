// Juego · Arena Anti-Spam — sobrevive a las oleadas de bots de spam. Arrastra para moverte; el robot dispara solo.
import { base, piezas } from './kit3d.js?v=2';
export async function crear(x) {
  const { THREE, bot, W, sfx, vibra, rnd, cl, lerp } = x;
  const k = base(x, { horizonte: .5, cerca: 26, lejos: 60 });
  const { S, cam } = k;
  const P = piezas(THREE);
  const RA = 13; // radio de la arena
  // piso: disco con anillos y hexágonos
  const fc = document.createElement('canvas'); fc.width = fc.height = 1024; const f = fc.getContext('2d');
  f.fillStyle = '#16060b'; f.fillRect(0, 0, 1024, 1024);
  const hx = (cx, cy, r) => { f.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; f.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } f.closePath(); };
  f.strokeStyle = 'rgba(250,80,0,.16)'; f.lineWidth = 2; for (let y = 0; y < 1100; y += 52) for (let xx = 0; xx < 1100; xx += 60) { hx(xx + ((y / 52) % 2) * 30, y, 28); f.stroke(); }
  const rg = f.createRadialGradient(512, 512, 0, 512, 512, 512); rg.addColorStop(0, 'rgba(250,80,0,.25)'); rg.addColorStop(.7, 'rgba(205,35,73,.08)'); rg.addColorStop(.97, 'rgba(250,80,0,.6)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); f.fillStyle = rg; f.fillRect(0, 0, 1024, 1024);
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 8;
  const piso = new THREE.Mesh(new THREE.CircleGeometry(RA + 1, 96), new THREE.MeshStandardMaterial({ map: ft, roughness: .45, metalness: .3, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: .12, color: 0x8a6a70 }));
  piso.rotation.x = -Math.PI / 2; S.add(piso);
  const borde = new THREE.Mesh(new THREE.TorusGeometry(RA + .6, .12, 8, 128), new THREE.MeshBasicMaterial({ color: 0xfa5000, toneMapped: false })); borde.rotation.x = Math.PI / 2; borde.position.y = .1; S.add(borde);
  // pilares exteriores con anillos de luz
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, m = new THREE.Mesh(new THREE.CylinderGeometry(.35, .5, 6, 12), new THREE.MeshStandardMaterial({ color: 0x2a0a12, roughness: .4, metalness: .5 })); m.position.set(Math.cos(a) * (RA + 3), 3, Math.sin(a) * (RA + 3)); S.add(m); const r = new THREE.Mesh(new THREE.TorusGeometry(.5, .05, 6, 24), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xcd2349 : 0xfa5000, toneMapped: false })); r.rotation.x = Math.PI / 2; r.position.set(m.position.x, 5.6, m.position.z); S.add(r); }
  // robot
  bot.g.position.set(0, 0, 0); bot.g.rotation.set(0, 0, 0); bot.g.scale.setScalar(1.5); S.add(bot.g);
  const escudo = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16), new THREE.MeshBasicMaterial({ color: 0x2bd67b, transparent: true, opacity: .2, depthWrite: false })); escudo.visible = false; S.add(escudo);
  const sombra = new THREE.Mesh(new THREE.CircleGeometry(.6, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .4, depthWrite: false })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = .02; S.add(sombra);
  // proyectiles
  const geoBala = new THREE.SphereGeometry(.13, 10, 8), mBala = new THREE.MeshBasicMaterial({ color: 0xffb07a, toneMapped: false });
  const TIPOS = {
    chico: { r: .5, vida: 1, vel: 3.8, pts: 100, col: 0x3a0a10 },
    rapido: { r: .42, vida: 1, vel: 5.6, pts: 150, col: 0x501020 },
    grande: { r: .85, vida: 7, vel: 2.1, pts: 500, col: 0x2a0508 },
    jefe: { r: 1.7, vida: 70, vel: 1.6, pts: 5000, col: 0x1a0306 },
  };
  let bots = [], balas = [], items = [], vidas = 5, inv = 0, pts = 0, combo = 0, comboT = 0, mejorC = 0, kills = 0, leads = 0, t = 0, disp = 0, spawn = .5, termino = false, triple = 0, escudoT = 0, jefe = null, dashT = 0, dashCd = 0;
  const pos = new THREE.Vector3(), vel = new THREE.Vector3(), mira = new THREE.Vector3(0, 0, 1);
  const DUR = 80;
  function nace(tipo) {
    const T = TIPOS[tipo], m = P.spam.clone(true);
    m.traverse(o => { if (o.isMesh && o.material.color && o.material.type === 'MeshStandardMaterial') { o.material = o.material.clone(); o.material.color.setHex(T.col); } });
    m.scale.setScalar(T.r / .5); const a = rnd(0, Math.PI * 2);
    const aro = new THREE.Mesh(new THREE.RingGeometry(.55, .7, 32), new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: .7, toneMapped: false, side: THREE.DoubleSide })); aro.rotation.x = -Math.PI / 2; aro.position.y = -.48; m.add(aro);
    m.position.set(Math.cos(a) * (RA + 1.5), T.r, Math.sin(a) * (RA + 1.5)); S.add(m);
    const b = { m, tipo, T, vida: T.vida, flash: 0, kb: new THREE.Vector3(), fase: rnd(0, 6) };
    bots.push(b); if (tipo === 'jefe') jefe = b; return b;
  }
  function dispara() {
    // objetivo: el bot más cercano
    let best = null, bd = 1e9; for (const b of bots) { const d = b.m.position.distanceToSquared(pos); if (d < bd) { bd = d; best = b; } }
    if (!best || bd > 120) return;
    const dir = best.m.position.clone().sub(pos).setY(0).normalize(); mira.copy(dir);
    const angs = triple > 0 ? [-.18, 0, .18] : [0];
    for (const a of angs) {
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
      const m = new THREE.Mesh(geoBala, mBala); m.position.copy(pos).add(d.clone().multiplyScalar(.7)); m.position.y = .95; S.add(m);
      balas.push({ m, v: d.multiplyScalar(22), vida: .9 });
    }
    k.estela(new THREE.Vector3(pos.x + dir.x * .8, .95, pos.z + dir.z * .8), 0xffc080, .4, 2);
    sfx.tap();
  }
  function muere(b) {
    bots.splice(bots.indexOf(b), 1); S.remove(b.m); kills++;
    combo++; comboT = 2; mejorC = Math.max(mejorC, combo);
    const mult = 1 + Math.min(4, Math.floor(combo / 5)), p = b.T.pts * mult; pts += p; x.pts(pts); x.combo(combo >= 5 ? combo : 0);
    k.burst(b.m.position, 0xfa5000, b.tipo === 'jefe' ? 160 : b.tipo === 'grande' ? 60 : 28, b.tipo === 'jefe' ? 14 : 7, b.tipo === 'jefe' ? .5 : .25);
    k.burst(b.m.position, 0xff2a2a, 10, 4, .2);
    k.flota(b.m.position.clone().setY(1.6), '+' + p, mult > 1 ? '#FFB48A' : '#FFF1E8', b.tipo === 'grande' ? 28 : 22);
    k.shake(b.tipo === 'jefe' ? 1.2 : b.tipo === 'grande' ? .5 : .15); k.hitstop(b.tipo === 'jefe' ? .25 : b.tipo === 'grande' ? .08 : .02);
    sfx.boom(); vibra(b.tipo === 'grande' ? 40 : 12);
    // suelta leads y a veces un poder
    const n = b.tipo === 'jefe' ? 14 : b.tipo === 'grande' ? 4 : 1;
    for (let i = 0; i < n; i++) item('lead', b.m.position);
    if (Math.random() < (b.tipo === 'grande' ? .5 : .05)) item(Math.random() < .5 ? 'triple' : 'escudo', b.m.position);
    if (combo % 15 === 0) { x.aviso('COMBO ×' + combo); sfx.combo(combo / 15); bot.pose('celebra', 1); }
    if (b.tipo === 'jefe') { jefe = null; k.slow(.2, 1.4); x.aviso('¡MEGA SPAM DERROTADO!'); bot.pose('celebra', 2.5); sfx.power(); }
  }
  function item(tipo, p) {
    let m;
    if (tipo === 'lead') m = P.lead.clone(true);
    else { m = new THREE.Mesh(new THREE.OctahedronGeometry(.4), P.glow(tipo === 'triple' ? 0x9b6bff : 0x2bd67b)); }
    m.position.set(p.x + rnd(-1, 1), .7, p.z + rnd(-1, 1)); S.add(m);
    items.push({ m, tipo, vida: 9, vy: rnd(3, 6), y: .7 });
  }
  function golpe(b) {
    if (inv > 0 || dashT > 0) return;
    if (escudoT > 0) { escudoT = 0; escudo.visible = false; inv = .8; k.burst(pos.clone().setY(1), 0x2bd67b, 40, 8); sfx.mal(); k.shake(.4); return; }
    vidas--; inv = 1.3; combo = 0; x.combo(0); k.shake(.9); k.hitstop(.12); sfx.mal(); vibra([60, 40, 60]);
    k.burst(pos.clone().setY(1), 0xff3030, 30, 7, .2); bot.pose('triste', .6);
    const kb = pos.clone().sub(b.m.position).setY(0).normalize().multiplyScalar(6); vel.add(kb);
    if (vidas <= 0) fin();
  }
  function fin() {
    if (termino) return; termino = true; k.slow(.25, 1.5);
    const sobrevive = vidas > 0;
    bot.pose(sobrevive ? 'celebra' : 'triste', 3);
    setTimeout(() => x.terminar({
      pts, frase: sobrevive ? `Sobreviviste. Eliminaste ${kills} ${kills === 1 ? 'bot' : 'bots'} de spam.` : `Aguantaste ${Math.floor(t)} s y eliminaste ${kills} ${kills === 1 ? 'bot' : 'bots'} de spam.`,
      stats: [[kills, 'bots de spam eliminados'], [leads, 'leads rescatados'], [mejorC, 'mejor combo']],
      ilus: 'Ilustrativo: en tu bandeja real el spam no ataca en oleadas, pero sí roba tiempo. Los agentes de Hapee filtran, responden y derivan solo lo que vale.',
      gancho: 'Que el spam lo filtre tu agente y tu equipo atienda solo leads reales.',
    }), 900);
  }
  // control: joystick relativo (un dedo); toque corto = impulso
  let ini = null, stick = new THREE.Vector2(), teclas = {};
  const ctrl = {
    abajo(e) { ini = { x: e.clientX, y: e.clientY, t: performance.now() }; stick.set(0, 0); },
    mueve(e) { if (!ini) return; const dx = e.clientX - ini.x, dy = e.clientY - ini.y, L = Math.hypot(dx, dy), R = 60; stick.set(dx, dy).multiplyScalar(1 / Math.max(R, L)); if (L > R) { ini.x = e.clientX - dx / L * R; ini.y = e.clientY - dy / L * R; } },
    arriba(e) { if (ini && performance.now() - ini.t < 200 && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) < 12) dash(); ini = null; stick.set(0, 0); },
    tecla(e) { teclas[e.key] = e.type !== 'keyup'; if (e.key === ' ' || e.key === 'Shift') dash(); },
  };
  addEventListener('keyup', e => { teclas[e.key] = false; });
  function dash() {
    if (dashCd > 0 || termino) return; dashT = .22; dashCd = .9;
    const d = vel.lengthSq() > .1 ? vel.clone().setY(0).normalize() : mira.clone(); vel.copy(d.multiplyScalar(26));
    sfx.whoosh(); k.burst(pos.clone().setY(.5), 0xffc9a8, 16, 3, .2, 0);
  }
  return {
    ...ctrl,
    __fin() { t = DUR; },
    empieza() { x.dice('¡Arrastra para moverte! Yo disparo solo.', 1800); },
    limpia() { S.remove(bot.g); },
    paso(dtR, T) {
      const dt = k.tiempo(dtR);
      if (dtR > 0 && !termino) {
        t += dt; x.tiempo(DUR - t, DUR); x.extra('VIDAS ' + '●'.repeat(Math.max(0, vidas)) + '○'.repeat(5 - Math.max(0, vidas)));
        // mover
        const ix = stick.x + ((teclas.ArrowRight || teclas.d) ? 1 : 0) - ((teclas.ArrowLeft || teclas.a) ? 1 : 0);
        const iz = stick.y + ((teclas.ArrowDown || teclas.s) ? 1 : 0) - ((teclas.ArrowUp || teclas.w) ? 1 : 0);
        const objV = new THREE.Vector3(ix, 0, iz); if (objV.length() > 1) objV.normalize(); objV.multiplyScalar(7.5);
        if (dashT > 0) { dashT -= dt; k.estela(pos.clone().setY(.8), 0xffc9a8, .3, .3); } else vel.lerp(objV, cl(dt * 12, 0, 1));
        dashCd = Math.max(0, dashCd - dt);
        pos.addScaledVector(vel, dt); const L = Math.hypot(pos.x, pos.z); if (L > RA - .6) { pos.x *= (RA - .6) / L; pos.z *= (RA - .6) / L; }
        // disparo automático
        disp -= dt; if (disp <= 0) { dispara(); disp = .2; }
        triple = Math.max(0, triple - dt); inv = Math.max(0, inv - dt);
        if (escudoT > 0) { escudoT -= dt; if (escudoT <= 0) escudo.visible = false; }
        // oleadas
        spawn -= dt;
        if (spawn <= 0) {
          const dif = t / DUR, r = Math.random();
          nace(r < .12 + dif * .15 ? 'grande' : r < .4 + dif * .2 ? 'rapido' : 'chico');
          if (dif > .4 && Math.random() < .4) nace('chico');
          spawn = lerp(.8, .3, dif);
        }
        if (t > 50 && !jefe && !bots.some(b => b.tipo === 'jefe') && !this._jefeSalio) { this._jefeSalio = true; nace('jefe'); x.aviso('¡LLEGA EL MEGA SPAM!'); sfx.boom(); k.shake(.8); x.tempo(150); }
        // bots
        for (const b of [...bots]) {
          const d = pos.clone().sub(b.m.position).setY(0), dl = d.length(); d.normalize();
          b.m.position.addScaledVector(d, b.T.vel * dt).addScaledVector(b.kb, dt); b.kb.multiplyScalar(Math.pow(.02, dt));
          b.m.position.y = b.T.r + Math.abs(Math.sin(T * 6 + b.fase)) * .15;
          b.m.lookAt(pos.x, b.m.position.y, pos.z);
          if (b.flash > 0) { b.flash -= dt; b.m.scale.setScalar(b.T.r / .5 * (1 + b.flash * .6)); } else b.m.scale.setScalar(b.T.r / .5);
          if (dl < b.T.r + .55) golpe(b);
        }
        // separación simple entre bots
        for (let i = 0; i < bots.length; i++) for (let j = i + 1; j < bots.length; j++) { const a = bots[i].m.position, c = bots[j].m.position, dx = a.x - c.x, dz = a.z - c.z, dd = Math.hypot(dx, dz), mn = bots[i].T.r + bots[j].T.r; if (dd < mn && dd > .001) { const p = (mn - dd) / 2 / dd; a.x += dx * p; a.z += dz * p; c.x -= dx * p; c.z -= dz * p; } }
        // balas
        for (const bl of [...balas]) {
          bl.m.position.addScaledVector(bl.v, dt); bl.vida -= dt;
          let quita = bl.vida <= 0;
          for (const b of bots) if (b.m.position.distanceTo(bl.m.position) < b.T.r + .2) {
            b.vida--; b.flash = .12; b.kb.add(bl.v.clone().setY(0).normalize().multiplyScalar(b.tipo === 'jefe' ? .5 : 4)); quita = true;
            k.burst(bl.m.position, 0xffc080, 6, 3, .15); sfx.pop();
            if (b.vida <= 0) muere(b);
            break;
          }
          if (quita) { S.remove(bl.m); balas.splice(balas.indexOf(bl), 1); }
        }
        // ítems con imán suave
        for (const it of [...items]) {
          it.vida -= dt; it.vy -= 14 * dt; it.y = Math.max(.7, it.y + it.vy * dt); if (it.y === .7) it.vy = Math.abs(it.vy) * .4;
          const d = pos.clone().sub(it.m.position).setY(0), dl = d.length();
          if (dl < 3.5) it.m.position.addScaledVector(d.normalize(), dt * (14 - dl * 3));
          it.m.position.y = it.y; it.m.rotation.y += dt * 3;
          if (dl < .8) {
            S.remove(it.m); items.splice(items.indexOf(it), 1);
            if (it.tipo === 'lead') { leads++; pts += 25; x.pts(pts); sfx.bien(leads % 10); k.burst(it.m.position, 0xfa5000, 8, 3, .15); }
            else if (it.tipo === 'triple') { triple = 8; x.aviso('TRIPLE DISPARO'); sfx.power(); k.slow(.4, .35); }
            else { escudoT = 10; escudo.visible = true; x.aviso('AGENTE IA: ESCUDO'); sfx.power(); k.slow(.4, .35); }
            continue;
          }
          if (it.vida <= 0) { S.remove(it.m); items.splice(items.indexOf(it), 1); }
        }
        comboT -= dt; if (comboT <= 0 && combo) { combo = 0; x.combo(0); }
        if (t >= DUR) fin();
      }
      // robot: mira hacia donde dispara, corre si se mueve
      const sp = Math.hypot(vel.x, vel.z);
      bot.g.position.set(pos.x, 0, pos.z);
      const ang = Math.atan2(mira.x, mira.z); let da = ang - bot.g.rotation.y; da = Math.atan2(Math.sin(da), Math.cos(da)); bot.g.rotation.y += da * cl(dt * 14, 0, 1);
      if (!termino && bot.st.pose !== 'celebra' && bot.st.pose !== 'triste') bot.pose(sp > 1.5 ? 'corre' : 'apunta');
      bot.g.visible = inv > 0 && !termino ? Math.floor(T * 16) % 2 === 0 : true;
      sombra.position.set(pos.x, .02, pos.z); escudo.position.set(pos.x, 1, pos.z); escudo.scale.setScalar(1 + .05 * Math.sin(T * 8));
      bot.update(T, dt);
      k.pasoPart(dt);
      // cámara: picada que sigue al robot
      const vert = W.w / W.h < .8;
      cam.fov = vert ? 58 : 48;
      cam.position.set(pos.x, vert ? 11 : 10, pos.z + (vert ? 8 : 9));
      cam.lookAt(pos.x, 0, pos.z + (vert ? .8 : 0));
      k.render(dtR, gg => {
        if (ini) { // joystick visible
          gg.strokeStyle = 'rgba(255,241,232,.35)'; gg.lineWidth = 3; gg.beginPath(); gg.arc(ini.x, ini.y, 60, 0, 7); gg.stroke();
          gg.fillStyle = 'rgba(250,80,0,.7)'; gg.beginPath(); gg.arc(ini.x + stick.x * 60, ini.y + stick.y * 60, 24, 0, 7); gg.fill();
        }
        if (jefe) { const w = Math.min(320, W.w - 40), fr = jefe.vida / jefe.T.vida; gg.fillStyle = 'rgba(0,0,0,.5)'; gg.fillRect((W.w - w) / 2, 96, w, 10); gg.fillStyle = '#E53935'; gg.fillRect((W.w - w) / 2, 96, w * fr, 10); gg.fillStyle = '#FFF1E8'; gg.font = '800 12px "Plus Jakarta Sans",sans-serif'; gg.textAlign = 'center'; gg.fillText('MEGA SPAM', W.w / 2, 124); }
      });
    },
  };
}

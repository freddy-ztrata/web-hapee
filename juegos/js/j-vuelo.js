// Juego · Vuelo Nocturno — el robot con mochila cohete cruza la ciudad de noche. Mantén presionado para subir.
import { base, piezas } from './kit3d.js?v=2';
export async function crear(x) {
  const { THREE, bot, W, sfx, vibra, rnd, cl, lerp } = x;
  const k = base(x, { horizonte: .62, cerca: 14, lejos: 60, nieblaCol: 0x1c0710 });
  const { S, cam } = k;
  const P = piezas(THREE);
  const TECHO = 11;
  // ventanas para los edificios
  const vc = document.createElement('canvas'); vc.width = 128; vc.height = 256; const v = vc.getContext('2d');
  v.fillStyle = '#12050a'; v.fillRect(0, 0, 128, 256);
  for (let y = 6; y < 256; y += 16) for (let xx = 6; xx < 128; xx += 14) { const r = Math.random(); v.fillStyle = r < .25 ? '#FFB070' : r < .32 ? '#FF5A7A' : r < .4 ? '#FFE0C0' : '#2a0c14'; v.fillRect(xx, y, 8, 10); }
  const vt = new THREE.CanvasTexture(vc); vt.colorSpace = THREE.SRGBColorSpace; vt.wrapS = vt.wrapT = THREE.RepeatWrapping;
  const mEdif = new THREE.MeshBasicMaterial({ color: 0x5a3a48, map: vt });
  // fondo: tres capas de ciudad (parallax)
  const capas = [];
  for (const [z, n, esc, vel] of [[-30, 40, 1.6, .25], [-18, 34, 1.2, .5], [-10, 26, 1, .75]]) {
    const gr = new THREE.Group(); gr.userData.vel = vel;
    for (let i = 0; i < n; i++) { const h = rnd(4, 16) * esc, w = rnd(2, 4) * esc, m = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mEdif); m.position.set(i * 5 * esc - 30, h / 2 - 2, z + rnd(-2, 2)); gr.add(m); }
    gr.userData.ancho = n * 5 * esc; S.add(gr); capas.push(gr);
  }
  // luna y torre con el logo de luz
  const luna = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.MeshBasicMaterial({ color: 0xffb48a, toneMapped: false, fog: false })); luna.position.set(18, 18, -60); S.add(luna);
  // piso / calle con luces
  const calle = new THREE.Mesh(new THREE.PlaneGeometry(400, 30), new THREE.MeshStandardMaterial({ color: 0x0e0408, roughness: .3, metalness: .6 })); calle.rotation.x = -Math.PI / 2; calle.position.y = -.5; S.add(calle);
  // robot de costado con mochila cohete
  bot.g.position.set(0, 4, 0); bot.g.rotation.set(0, Math.PI / 2, 0); bot.g.scale.setScalar(1.25); S.add(bot.g);
  const mochila = new THREE.Group();
  for (const s of [-.14, .14]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(.09, .11, .42, 16), new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: .8, roughness: .25 })); c.position.set(s, .62, -.28); mochila.add(c); const t = new THREE.Mesh(new THREE.CylinderGeometry(.07, .05, .08, 12), new THREE.MeshStandardMaterial({ color: 0xfa5000, emissive: 0xfa5000, emissiveIntensity: 1 })); t.position.set(s, .38, -.28); mochila.add(t); }
  bot.g.add(mochila);
  // obstáculos (torres y drones) + leads + anillos
  const mTorre = new THREE.MeshStandardMaterial({ color: 0xcd2349, emissive: 0x6a0a20, emissiveIntensity: .9, roughness: .3, metalness: .4 });
  const mBordeT = new THREE.MeshBasicMaterial({ color: 0xffb070, toneMapped: false });
  const mAnillo = [0x25c26a, 0xe1306c, 0x3b6fe0, 0xf2a33a].map(c => new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
  let obs = [], leadsObj = [], anillos = [], drones = [], xMundo = 0, prox = 14, y = 4, vy = 0, empuje = false, pts = 0, leads = 0, racha = 0, mejorR = 0, vidas = 3, inv = 0, t = 0, termino = false, velX = 9, anillosOk = 0, cerca = 0;
  const DUR = 75;
  function columna(px) {
    const dif = cl(t / DUR, 0, 1), hueco = lerp(4.6, 3.1, dif), centro = rnd(2 + hueco / 2, TECHO - 1 - hueco / 2);
    const hAbajo = centro - hueco / 2 + .5, hArriba = TECHO + 2 - (centro + hueco / 2);
    const a = new THREE.Mesh(new THREE.BoxGeometry(1.6, hAbajo, 1.6), mTorre); a.position.set(px, hAbajo / 2 - .5, 0); S.add(a);
    const ba = new THREE.Mesh(new THREE.BoxGeometry(1.8, .2, 1.8), mBordeT); ba.position.set(px, hAbajo - .5, 0); S.add(ba);
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, hArriba, 1.6), mTorre); b.position.set(px, TECHO + 1.5 - hArriba / 2, 0); S.add(b);
    const bb = new THREE.Mesh(new THREE.BoxGeometry(1.8, .2, 1.8), mBordeT); bb.position.set(px, TECHO + 1.5 - hArriba, 0); S.add(bb);
    obs.push({ ms: [a, ba, b, bb], x: px, lo: centro - hueco / 2, hi: centro + hueco / 2, paso: false });
    // leads en arco por el hueco
    for (let i = -2; i <= 2; i++) { const l = P.lead.clone(true); l.position.set(px + i * 1.1, centro + Math.cos(i / 2) * .3, 0); l.scale.setScalar(.8); S.add(l); leadsObj.push(l); }
    if (Math.random() < .35) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.1, .1, 10, 40), mAnillo[Math.floor(Math.random() * 4)]); r.position.set(px + 5, rnd(3, TECHO - 2), 0); r.rotation.y = Math.PI / 2; S.add(r); anillos.push({ m: r, ok: false }); }
    if (dif > .25 && Math.random() < .5) { const d = P.spam.clone(true); d.position.set(px + 4.5, rnd(2.5, TECHO - 2), 0); d.scale.setScalar(.8); S.add(d); drones.push({ m: d, base: d.position.y, fase: rnd(0, 6) }); }
  }
  function choca() {
    if (inv > 0) return;
    vidas--; inv = 1.5; racha = 0; x.combo(0); k.shake(1); k.hitstop(.12); sfx.mal(); vibra([60, 40, 60]);
    k.burst(bot.g.position.clone().setY(y + .6), 0xff3030, 40, 8, .25); bot.pose('triste', .5); vy = 4;
    if (vidas <= 0) fin();
  }
  function fin() {
    if (termino) return; termino = true; k.slow(.25, 1.2);
    setTimeout(() => x.terminar({
      pts, frase: vidas > 0 ? `Cruzaste la ciudad con ${leads} ${leads === 1 ? 'lead' : 'leads'}.` : `Volaste ${Math.round(xMundo)} metros y juntaste ${leads} ${leads === 1 ? 'lead' : 'leads'}.`,
      stats: [[leads, 'leads atrapados'], [anillosOk, 'anillos de canal'], [mejorR, 'mejor racha']],
      ilus: 'Ilustrativo: los leads llegan de noche también. Tu agente de Hapee los atiende a las 3 de la mañana igual que a las 3 de la tarde.',
      gancho: 'Mientras duermes, tu agente sigue volando.',
    }), 900);
  }
  for (let px = 14; px < 60; px += 9) columna(px);
  prox = 60;
  return {
    __fin() { t = DUR; },
    abajo() { empuje = true; },
    arriba() { empuje = false; },
    tecla(e) { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { empuje = true; clearTimeout(this._k); this._k = setTimeout(() => { empuje = false; }, 160); } },
    empieza() { x.dice('¡Mantén presionado para subir!', 1600); },
    limpia() { bot.g.remove(mochila); S.remove(bot.g); },
    paso(dtR, T) {
      const dt = k.tiempo(dtR);
      if (dtR > 0 && !termino) {
        t += dt; x.tiempo(DUR - t, DUR); x.extra('VIDAS ' + '●'.repeat(Math.max(0, vidas)) + '○'.repeat(3 - Math.max(0, vidas)));
        velX = lerp(9, 15, cl(t / DUR, 0, 1)); xMundo += velX * dt;
        vy += (empuje ? 26 : -20) * dt; vy = cl(vy, -11, 9); y += vy * dt;
        if (y < .2) { y = .2; vy = 6; k.burst(new THREE.Vector3(xMundo, .2, 0), 0xffc080, 10, 4, .15); sfx.tap(); }
        if (y > TECHO) { y = TECHO; vy = -1; }
        inv = Math.max(0, inv - dt);
        pts += velX * dt; x.pts(pts);
        if (empuje) { for (const s of [-.14, .14]) k.burst(new THREE.Vector3(xMundo - .3, y + .3, s), Math.random() < .5 ? 0xfa5000 : 0xffd080, 1, 2, .22, -2); }
        // generar
        if (xMundo + 50 > prox) { columna(prox); prox += lerp(8.5, 6.2, cl(t / DUR, 0, 1)); }
        // colisiones
        const bx = xMundo, by = y + .5;
        for (const o of [...obs]) {
          if (Math.abs(o.x - bx) < 1.15) { if (by - .45 < o.lo || by + .45 > o.hi) choca(); else if (!o.paso && Math.abs(o.x - bx) < .3) { const m = Math.min(by - o.lo, o.hi - by); if (m < .9) { cerca++; pts += 150; x.pts(pts); k.flota(new THREE.Vector3(bx, by + 1, 0), '¡AL LÍMITE! +150', '#FFB48A', 20); sfx.combo(2); k.slow(.45, .25); } } }
          if (o.x < bx - 1.2) o.paso = true;
          if (o.x < bx - 25) { o.ms.forEach(m => S.remove(m)); obs.splice(obs.indexOf(o), 1); }
        }
        for (const l of [...leadsObj]) {
          l.rotation.y += dt * 3;
          if (l.position.distanceTo(new THREE.Vector3(bx, by, 0)) < .8) { S.remove(l); leadsObj.splice(leadsObj.indexOf(l), 1); leads++; racha++; mejorR = Math.max(mejorR, racha); const p = 40 * (1 + Math.min(4, Math.floor(racha / 10))); pts += p; x.pts(pts); x.combo(racha >= 10 ? racha : 0); sfx.bien(racha % 11); k.burst(l.position, 0xfa5000, 10, 3, .16); vibra(5); }
          else if (l.position.x < bx - 25) { S.remove(l); leadsObj.splice(leadsObj.indexOf(l), 1); }
        }
        for (const a of [...anillos]) {
          a.m.rotation.x += dt * 2;
          if (!a.ok && Math.abs(a.m.position.x - bx) < .4 && Math.abs(a.m.position.y - by) < 1.05) { a.ok = true; anillosOk++; pts += 500; x.pts(pts); x.aviso('¡CANAL CONECTADO! +500'); sfx.power(); k.burst(a.m.position, a.m.material.color.getHex(), 60, 9, .3); k.slow(.35, .4); k.shake(.3); bot.pose('celebra', .8); }
          if (a.m.position.x < bx - 25) { S.remove(a.m); anillos.splice(anillos.indexOf(a), 1); }
        }
        for (const d of [...drones]) {
          d.m.position.y = d.base + Math.sin(T * 2 + d.fase) * 1.6; d.m.lookAt(bx, by, 0);
          if (d.m.position.distanceTo(new THREE.Vector3(bx, by, 0)) < .95) choca();
          if (d.m.position.x < bx - 25) { S.remove(d.m); drones.splice(drones.indexOf(d), 1); }
        }
        if (t >= DUR) fin();
      }
      // robot
      bot.g.position.set(xMundo, y, 0);
      bot.g.rotation.z = lerp(bot.g.rotation.z, cl(-vy * .05, -.35, .35), .2);
      bot.g.rotation.x = 0;
      if (!termino && bot.st.pose !== 'celebra' && bot.st.pose !== 'triste') bot.pose('salta');
      bot.g.visible = inv > 0 && !termino ? Math.floor(T * 16) % 2 === 0 : true;
      bot.update(T, dt);
      for (const c of capas) { const off = (xMundo * c.userData.vel) % (c.userData.ancho / 2); c.position.x = xMundo - off - 10; }
      luna.position.x = xMundo + 18; calle.position.x = xMundo;
      k.pasoPart(dt);
      const vert = W.w / W.h < .8;
      cam.fov = vert ? 70 : 52;
      cam.position.set(xMundo + (vert ? 2.6 : 4), 5.6 + (y - 5.5) * .3, vert ? 13 : 12);
      cam.lookAt(xMundo + (vert ? 2.2 : 4), 5.2 + (y - 5.5) * .2, 0);
      k.render(dtR);
    },
  };
}

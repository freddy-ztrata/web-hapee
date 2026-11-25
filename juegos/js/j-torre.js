// Juego · Torre Arriba — el robot rebota solo de plataforma en plataforma hacia el cielo. Desliza para moverte.
import { base, piezas } from './kit3d.js?v=2';
export async function crear(x) {
  const { THREE, bot, W, sfx, vibra, rnd, cl, lerp } = x;
  const k = base(x, { horizonte: .85, niebla: false });
  const { S, cam } = k;
  const P = piezas(THREE);
  const AN = 2.6; // medio ancho jugable
  // torre de fondo con ventanas y anillos de luz que suben
  const vc = document.createElement('canvas'); vc.width = 256; vc.height = 512; const v = vc.getContext('2d');
  v.fillStyle = '#14060b'; v.fillRect(0, 0, 256, 512);
  for (let y = 8; y < 512; y += 22) for (let xx = 8; xx < 256; xx += 20) { const r = Math.random(); v.fillStyle = r < .2 ? '#FF9A5A' : r < .26 ? '#FF5A7A' : '#24090f'; v.fillRect(xx, y, 12, 14); }
  const vt = new THREE.CanvasTexture(vc); vt.colorSpace = THREE.SRGBColorSpace; vt.wrapS = vt.wrapT = THREE.RepeatWrapping; vt.repeat.set(3, 40);
  const torre = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 400, 48, 1, true, Math.PI * .2, Math.PI * .6), new THREE.MeshStandardMaterial({ map: vt, emissive: 0xffffff, emissiveMap: vt, emissiveIntensity: .7, color: 0x401822, side: THREE.BackSide, roughness: .6 }));
  torre.position.set(0, 190, 4); torre.rotation.y = Math.PI; S.add(torre);
  // estrellas
  { const n = 400, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = rnd(-40, 40); p[i * 3 + 1] = rnd(-10, 400); p[i * 3 + 2] = rnd(-60, -30); } const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(p, 3)); S.add(new THREE.Points(gg, new THREE.PointsMaterial({ color: 0xffd0b0, size: .18 }))); }
  // plataformas
  const TIPO = {
    normal: { col: 0xfff1e8, em: 0x000000 },
    movil: { col: 0xfa5000, em: 0xfa5000 },
    fragil: { col: 0x8a7a80, em: 0x000000 },
    resorte: { col: 0x25c26a, em: 0x25c26a },
  };
  const geoP = new THREE.BoxGeometry(1.45, .26, .8, 1, 1, 1);
  const mats = {}; for (const t in TIPO) mats[t] = new THREE.MeshStandardMaterial({ color: TIPO[t].col, emissive: TIPO[t].em, emissiveIntensity: TIPO[t].em ? .6 : 0, roughness: .35, metalness: .1 });
  // etiquetas sobre las plataformas especiales
  const etq = (txt, col) => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const d = c.getContext('2d'); d.font = '800 34px "Plus Jakarta Sans",sans-serif'; d.textAlign = 'center'; d.textBaseline = 'middle'; d.fillStyle = col; d.fillText(txt, 128, 34); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }); };
  const sVisto = etq('VISTO', '#D9CCD1'), sWA = etq('WHATSAPP', '#B8FFD6');
  let plats = [], leadsO = [], spams = [], yMax = 0, ultimaY = 0, px = 0, py = .5, vx = 0, vy = 0, pts = 0, leads = 0, t = 0, termino = false, combo = 0, mejorC = 0, objX = 0, piso = 0, saltos = 0;
  const DUR = 90;
  function plataforma(y, tipo) {
    const m = new THREE.Mesh(geoP, mats[tipo]); const xx = rnd(-AN + .9, AN - .9); m.position.set(xx, y, 0); S.add(m);
    const p = { m, tipo, x: xx, y, vel: tipo === 'movil' ? rnd(1.2, 2.4) * (Math.random() < .5 ? -1 : 1) : 0, rota: false, caida: 0 };
    if (tipo === 'fragil') { const s = new THREE.Sprite(sVisto); s.scale.set(1.3, .32, 1); s.position.y = .35; m.add(s); }
    if (tipo === 'resorte') { const s = new THREE.Sprite(sWA); s.scale.set(1.5, .38, 1); s.position.y = .4; m.add(s); }
    plats.push(p);
    if (Math.random() < .45) { const l = P.lead.clone(true); l.position.set(xx + rnd(-.4, .4), y + rnd(.9, 1.8), 0); l.scale.setScalar(.85); S.add(l); leadsO.push(l); }
    return p;
  }
  function genera(hasta) {
    while (ultimaY < hasta) {
      const dif = cl(ultimaY / 260, 0, 1);
      ultimaY += rnd(1.3, lerp(2.1, 3.2, dif));
      const r = Math.random();
      const tipo = r < .08 ? 'resorte' : r < .08 + dif * .25 ? 'movil' : r < .08 + dif * .25 + dif * .2 ? 'fragil' : 'normal';
      plataforma(ultimaY, tipo);
      if (tipo === 'fragil') { ultimaY += .6; plataforma(ultimaY, 'normal'); }
      if (ultimaY > 20 && Math.random() < .06 + dif * .1) { const s = P.spam.clone(true); s.position.set(rnd(-AN + .6, AN - .6), ultimaY + 1.2, 0); s.scale.setScalar(.7); S.add(s); spams.push({ m: s, base: s.position.x, fase: rnd(0, 6) }); }
    }
  }
  { const p0 = plataforma(0, 'normal'); p0.m.position.x = 0; p0.m.scale.x = 4; p0.ancho = 2.9; p0.piso = true; px = 0; }
  genera(30);
  bot.g.position.set(0, 0, 0); bot.g.rotation.set(0, 0, 0); bot.g.scale.setScalar(1.1); S.add(bot.g);
  vy = 9;
  function fin(cayo) {
    if (termino) return; termino = true; k.slow(.3, 1); if (cayo) { sfx.mal(); k.shake(.6); bot.pose('triste', 3); } else bot.pose('celebra', 3);
    setTimeout(() => x.terminar({
      pts, frase: `Subiste ${Math.round(yMax)} metros y juntaste ${leads} ${leads === 1 ? 'lead' : 'leads'}.`,
      stats: [[Math.round(yMax) + ' m', 'altura máxima'], [leads, 'leads'], [mejorC, 'mejor racha de rebotes']],
      ilus: 'Ilustrativo: cada mensaje respondido a tiempo es un escalón más. Con Hapee ningún «visto» te hace caer.',
      gancho: '¿Hasta dónde llega tu equipo si nadie queda en visto?',
    }), 900);
  }
  let ini = null;
  return {
    __fin() { t = DUR; },
    abajo(e) { ini = { x: e.clientX, px: objX }; },
    mueve(e) { if (ini) objX = cl(ini.px + (e.clientX - ini.x) / W.w * 7, -AN, AN); },
    arriba() { ini = null; },
    tecla(e) { if (e.key === 'ArrowLeft' || e.key === 'a') objX = Math.max(-AN, objX - 1); if (e.key === 'ArrowRight' || e.key === 'd') objX = Math.min(AN, objX + 1); },
    empieza() { x.dice('Desliza a los lados. ¡Yo salto solo!', 1600); },
    limpia() { S.remove(bot.g); },
    paso(dtR, T) {
      const dt = k.tiempo(dtR);
      if (dtR > 0 && !termino) {
        t += dt; x.tiempo(DUR - t, DUR); x.extra(Math.round(yMax) + ' m');
        // horizontal: sigue al dedo, con rebote de lado a lado (sale por un lado y entra por el otro)
        vx = (objX - px) * 10; px += vx * dt;
        
        vy -= 24 * dt; const yAntes = py; py += vy * dt;
        // aterrizaje
        if (vy < 0) for (const p of plats) {
          if (p.rota) continue;
          const top = p.m.position.y + .13;
          if (yAntes >= top - .05 && py <= top && Math.abs(px - p.m.position.x) < (p.ancho || .92)) {
            py = top;
            if (p.tipo === 'fragil') { p.rota = true; sfx.mal(); k.burst(p.m.position, 0x8a7a80, 20, 4, .2); vy = 9.5; }
            else if (p.tipo === 'resorte') { vy = 20; sfx.power(); k.burst(p.m.position, 0x25c26a, 40, 8, .25); k.shake(.4); x.aviso('¡SÚPER SALTO!'); bot.pose('celebra', .9); }
            else { vy = 12.2; sfx.tap(); k.burst(p.m.position.clone().setY(top), 0xffc9a8, 8, 2.5, .15, 0); }
            saltos++; combo++; mejorC = Math.max(mejorC, combo);
            p.m.scale.set((p.piso ? 4 : 1) * 1.15, .6, 1.15);
            break;
          }
        }
        if (py > yMax) { pts += (py - yMax) * 10; yMax = py; x.pts(pts); }
        genera(yMax + 30);
        // plataformas
        for (const p of [...plats]) {
          p.m.scale.lerp(new THREE.Vector3(p.piso ? 4 : 1, 1, 1), cl(dt * 10, 0, 1));
          if (p.vel) { p.m.position.x += p.vel * dt; if (Math.abs(p.m.position.x) > AN - .8) p.vel *= -1; }
          if (p.rota) { p.caida += dt; p.m.position.y -= p.caida * 18 * dt; p.m.rotation.z += dt * 3; }
          if (p.m.position.y < yMax - 18) { S.remove(p.m); plats.splice(plats.indexOf(p), 1); }
        }
        for (const l of [...leadsO]) {
          l.rotation.y += dt * 3;
          if (Math.hypot(l.position.x - px, l.position.y - (py + .5)) < .75) { S.remove(l); leadsO.splice(leadsO.indexOf(l), 1); leads++; pts += 50; x.pts(pts); sfx.bien(leads % 11); k.burst(l.position, 0xfa5000, 12, 3.5, .16); vibra(5); }
          else if (l.position.y < yMax - 18) { S.remove(l); leadsO.splice(leadsO.indexOf(l), 1); }
        }
        for (const s of [...spams]) {
          s.m.position.x = s.base + Math.sin(T * 1.5 + s.fase) * 1.4; s.m.rotation.y = T * 2;
          const dx = s.m.position.x - px, dy = s.m.position.y - (py + .45);
          if (Math.hypot(dx, dy) < .8) {
            if (vy < 0 && dy < -.15) { // pisotón
              S.remove(s.m); spams.splice(spams.indexOf(s), 1); vy = 14; pts += 300; x.pts(pts); k.flota(s.m.position, '¡PLAF! +300', '#FFB48A', 24); k.burst(s.m.position, 0xff3030, 40, 8, .25); k.hitstop(.08); k.shake(.5); sfx.boom(); vibra(30);
            } else { vy = -6; k.shake(.8); k.hitstop(.1); sfx.mal(); vibra([60, 30, 60]); k.burst(new THREE.Vector3(px, py + .5, 0), 0xff3030, 30, 6, .2); S.remove(s.m); spams.splice(spams.indexOf(s), 1); bot.pose('triste', .6); }
            continue;
          }
          if (s.m.position.y < yMax - 18) { S.remove(s.m); spams.splice(spams.indexOf(s), 1); }
        }
        if (vy > 0 && combo && combo % 25 === 0 && !this._av25) { this._av25 = true; x.aviso('¡RACHA ×' + combo + '!'); }
        if (combo % 25 !== 0) this._av25 = false;
        // caer fuera de cámara = fin
        if (cam.position.y && py < cam.position.y - (W.w / W.h < .8 ? 8 : 6.6)) fin(true);
        if (t >= DUR) fin(false);
        x.tempo(118 + Math.min(40, yMax / 6));
      }
      bot.g.position.set(px, py, .55);
      bot.g.rotation.y = lerp(bot.g.rotation.y, cl(-vx * .06, -.7, .7), .2);
      if (!termino && bot.st.pose !== 'celebra' && bot.st.pose !== 'triste') bot.pose(vy > 2 ? 'salta' : 'idle');
      bot.update(T, dt);
      k.pasoPart(dt);
      const vert = W.w / W.h < .8;
      cam.fov = vert ? 62 : 50;
      const cy = Math.max(cam.position.y || 0, yMax + (vert ? 2.6 : 1.8));
      cam.position.set(0, lerp(cam.position.y || cy, cy, .12), vert ? 9.2 : 8.5);
      cam.lookAt(0, cam.position.y - .4, 0);
      torre.material.emissiveIntensity = .6 + .1 * Math.sin(T * 2);
      k.render(dtR);
    },
  };
}

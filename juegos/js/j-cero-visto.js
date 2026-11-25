// Juego 01 · Cero Visto — responde cada mensaje antes de que se enfríe.
const CANALES = [
  { k: 'WA', n: 'WhatsApp', c: '#25C26A' }, { k: 'IG', n: 'Instagram', c: '#E1306C' }, { k: 'FB', n: 'Facebook', c: '#3B6FE0' },
  { k: '@', n: 'Email', c: '#F2A33A' }, { k: 'WEB', n: 'Web', c: '#9B6BFF' },
];
const MSJ = ['¿Precio?', '¿Tienen stock?', 'Hola, cotización', '¿Atienden hoy?', 'Info porfa', '¿Hacen envíos?', '¿Hay hora mañana?', 'Quiero comprar', '¿Me llaman?', '¿Planes?', '¿Dónde están?', 'Necesito 20 unidades', '¿Aceptan tarjeta?', 'Me interesa', '¿Sigue disponible?', 'Hola!!'];
const SPAM = ['Ganaste un premio', 'Seguidores baratos', 'Préstamo YA', 'Click aquí'];
export async function crear(x) {
  const { g, W, part, sfx, vibra, rnd, cl, lerp } = x;
  const DUR = 60;
  let t = 0, pts = 0, combo = 0, mejorCombo = 0, resp = 0, perd = 0, sumaT = 0, burb = [], vuelan = [], spawnT = .6, auto = 0, orbe = null, sacude = 0, ultimoCombo10 = 0, peak = false, termino = false;
  const k = () => cl(Math.min(W.w, W.h) / 420, .85, 1.25);
  const zona = () => { const ch = cl(W.h * .24, 120, 230); return { x0: 14, y0: 96, x1: W.w - 14, y1: W.h - 24, cx: ch * .62, cy: W.h - ch - 8 }; };
  function libre(bx, by, bw, bh) {
    const z = zona();
    if (bx < z.cx + 10 && by + bh > z.cy) return false;
    for (const b of burb) if (Math.abs(b.x - bx) < (b.w + bw) / 2 + 6 && Math.abs(b.y - by) < (b.h + bh) / 2 + 6) return false;
    return true;
  }
  function nace() {
    const s = k(), spam = t > 6 && Math.random() < .12;
    const txt = spam ? SPAM[Math.floor(Math.random() * SPAM.length)] : MSJ[Math.floor(Math.random() * MSJ.length)];
    g.font = `700 ${15 * s}px "Plus Jakarta Sans",sans-serif`;
    const w = Math.max(150 * s, g.measureText(txt).width + 78 * s), h = 58 * s;
    const z = zona();
    for (let i = 0; i < 24; i++) {
      const bx = rnd(z.x0 + w / 2, z.x1 - w / 2), by = rnd(z.y0 + h / 2, z.y1 - h / 2);
      if (libre(bx, by, w, h)) {
        const vida = lerp(4.4, 2.3, cl(t / DUR, 0, 1)) * (spam ? 1.3 : 1);
        burb.push({ x: bx, y: by, w, h, txt, spam, can: spam ? { k: '!', c: '#E53935' } : CANALES[Math.floor(Math.random() * CANALES.length)], vida, rest: vida, nace: 0, tAuto: auto > 0 ? .25 : -1 });
        sfx.pop(); return;
      }
    }
  }
  function responde(b, porAgente) {
    burb.splice(burb.indexOf(b), 1);
    const frac = b.rest / b.vida, s = k();
    combo++; mejorCombo = Math.max(mejorCombo, combo); resp++; sumaT += b.vida - b.rest;
    const mult = 1 + Math.min(3, Math.floor(combo / 5) * .5);
    const p = Math.round((50 + 150 * frac) * mult); pts += p; x.pts(pts); x.combo(Math.floor(mult * 10) / 10 > 1 ? combo : 0);
    part.estalla(b.x, b.y, frac > .5 ? '#FA5000' : '#FF9A5A', 16, 240 * s, 4 * s); part.texto(b.x, b.y - b.h * .7, '+' + p, '#FFF1E8', 20 * s);
    vuelan.push({ x: b.x, y: b.y, w: b.w, h: b.h, c: b.can.c, k: b.can.k, txt: b.txt, t: 0, porAgente });
    sfx.bien(Math.min(10, Math.floor(combo / 2))); vibra(12);
    if (combo % 10 === 0) { x.aviso('COMBO ×' + combo); sfx.combo(combo / 10); x.bot.pose('celebra', 1.2); }
    if (combo >= ultimoCombo10 + 12 && !orbe && auto <= 0) { ultimoCombo10 = combo; const z = zona(); orbe = { x: rnd(z.x0 + 60, z.x1 - 60), y: rnd(z.y0 + 60, z.y1 - 120), v: 5 }; }
  }
  function pierde(b) {
    burb.splice(burb.indexOf(b), 1);
    if (b.spam) return; // el spam que se va solo no castiga
    perd++; combo = 0; x.combo(0);
    part.estalla(b.x, b.y, '#6E6168', 10, 120, 3); part.texto(b.x, b.y, 'Visto', '#B9A9AF', 18 * k());
    sfx.mal(); vibra(40); sacude = .25;
    if (perd % 4 === 1) x.dice(['¡Se enfrió!', 'Ese se fue a la competencia.', '¡Quedó en visto!'][perd % 3], 1400);
  }
  return {
    __fin() { t = DUR; },
    empieza() { x.dice('¡Responde antes de que se acabe el anillo!', 2000); },
    abajo(e) {
      const px = e.clientX, py = e.clientY;
      if (orbe && Math.hypot(px - orbe.x, py - orbe.y) < 46 * k()) {
        orbe = null; auto = 5; sfx.power(); vibra([20, 30, 20]); x.aviso('AGENTE IA ACTIVO'); x.bot.pose('celebra', 1.5); x.dice('Déjamelo a mí: respondo todo por 5 segundos.', 2200);
        for (const b of burb) if (!b.spam) b.tAuto = rnd(.05, .4);
        return;
      }
      for (let i = burb.length - 1; i >= 0; i--) {
        const b = burb[i];
        if (Math.abs(px - b.x) < b.w / 2 + 8 && Math.abs(py - b.y) < b.h / 2 + 10) {
          if (b.spam) { burb.splice(i, 1); pts = Math.max(0, pts - 150); x.pts(pts); combo = 0; x.combo(0); part.texto(b.x, b.y, '-150 spam', '#FF6B6B', 20 * k()); part.estalla(b.x, b.y, '#E53935', 14); sfx.mal(); vibra([40, 30, 40]); sacude = .35; return; }
          responde(b); return;
        }
      }
      sfx.tap();
    },
    tecla(e) { if (e.key === ' ' || e.key === 'Enter') { const b = burb.filter(q => !q.spam).sort((a, c) => a.rest - c.rest)[0]; if (b) responde(b); } },
    paso(dt, T) {
      if (dt > 0 && !termino) {
        t += dt; x.tiempo(DUR - t, DUR);
        if (!peak && DUR - t < 12) { peak = true; x.aviso('¡HORA PEAK!'); x.tempo(150); x.dice('¡Hora peak! Llega todo junto.', 1800); }
        spawnT -= dt * (peak ? 1.7 : 1);
        if (spawnT <= 0) { nace(); spawnT = lerp(1.05, .42, cl(t / DUR, 0, 1)); }
        if (auto > 0) { auto -= dt; x.extra('AGENTE IA · ' + Math.ceil(auto) + ' s'); if (auto <= 0) x.extra(''); }
        for (const b of [...burb]) {
          b.nace = Math.min(1, b.nace + dt * 5);
          if (auto > 0 && !b.spam) { if (b.tAuto < 0) b.tAuto = .25; b.tAuto -= dt; if (b.tAuto <= 0) { responde(b, true); continue; } }
          b.rest -= dt; if (b.rest <= 0) pierde(b);
        }
        if (orbe) { orbe.v -= dt; if (orbe.v <= 0) orbe = null; }
        for (const v of vuelan) v.t += dt * 1.8;
        vuelan = vuelan.filter(v => v.t < 1);
        sacude = Math.max(0, sacude - dt);
        if (t >= DUR) {
          termino = true;
          const prom = resp ? (sumaT / resp) : 0;
          x.terminar({
            pts,
            frase: perd === 0 ? `Cero visto: respondiste los ${resp} mensajes.` : `Respondiste ${resp} mensajes. Se te enfriaron ${perd}.`,
            stats: [[resp, 'respondidos'], [perd, 'quedaron en visto'], [prom.toFixed(1).replace('.', ',') + ' s', 'tu tiempo promedio']],
            ilus: `Ilustrativo: ${perd === 0 ? 'esta vez no se te enfrió ninguno, pero nadie aguanta así todo el día' : perd === 1 ? 'en esta partida se te enfrió 1 mensaje' : `en esta partida se te enfriaron ${perd} mensajes`}. Un agente de IA de Hapee contesta cada uno apenas llega, a cualquier hora y en todos los canales.`,
            gancho: 'Tu equipo no puede tocar cada mensaje en dos segundos. Tu agente de IA sí.',
          });
        }
      }
      // ── dibujo ──
      const dpr = W.dpr, s = k();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const bg = g.createLinearGradient(0, 0, 0, W.h); bg.addColorStop(0, '#14060B'); bg.addColorStop(1, '#2A0A14'); g.fillStyle = bg; g.fillRect(0, 0, W.w, W.h);
      if (sacude > 0) g.translate(rnd(-6, 6) * sacude * 4, rnd(-6, 6) * sacude * 4);
      // malla de puntos que late con el combo
      g.fillStyle = `rgba(255,140,90,${.07 + Math.min(.12, combo * .006)})`;
      for (let yy = 30; yy < W.h; yy += 28) for (let xx = 14 + (yy / 28 % 2) * 14; xx < W.w; xx += 28) g.fillRect(xx, yy, 2, 2);
      if (auto > 0) { const gr = g.createRadialGradient(W.w * .1, W.h, 0, W.w * .1, W.h, W.h); gr.addColorStop(0, 'rgba(250,80,0,.28)'); gr.addColorStop(1, 'rgba(250,80,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W.w, W.h); }
      // burbujas
      for (const b of burb) {
        const fr = cl(b.rest / b.vida, 0, 1), e = b.nace < 1 ? 1 - Math.pow(1 - b.nace, 3) : 1, tiembla = fr < .25 && !b.spam ? Math.sin(T * 40) * 2.5 * (1 - fr / .25) : 0;
        g.save(); g.translate(b.x + tiembla, b.y); g.scale(e, e);
        const frio = 1 - fr;
        g.shadowColor = b.spam ? 'rgba(229,57,53,.5)' : `rgba(250,80,0,${.5 * fr})`; g.shadowBlur = 24 * s;
        g.fillStyle = b.spam ? '#3A0C10' : `rgb(${Math.round(lerp(255, 70, frio))},${Math.round(lerp(241, 62, frio))},${Math.round(lerp(232, 70, frio))})`;
        g.beginPath(); g.roundRect(-b.w / 2, -b.h / 2, b.w, b.h, b.h * .45); g.fill(); g.shadowBlur = 0;
        g.beginPath(); g.moveTo(-b.w * .32, b.h * .42); g.lineTo(-b.w * .4, b.h * .72); g.lineTo(-b.w * .18, b.h * .45); g.fill();
        // insignia + anillo
        const cx = -b.w / 2 + b.h / 2, rr = b.h * .34;
        g.fillStyle = b.can.c; g.beginPath(); g.arc(cx, 0, rr, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.font = `800 ${(b.can.k.length > 2 ? 10 : 13) * s}px "Plus Jakarta Sans",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(b.can.k, cx, 1);
        g.strokeStyle = fr > .5 ? '#FA5000' : fr > .25 ? '#FF8A3D' : '#E53935'; g.lineWidth = 4 * s; g.lineCap = 'round';
        g.beginPath(); g.arc(cx, 0, rr + 6 * s, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fr); g.stroke();
        g.fillStyle = b.spam ? '#FFB3B3' : frio > .6 ? '#EDE3E6' : '#2a0d14'; g.textAlign = 'left'; g.font = `700 ${15 * s}px "Plus Jakarta Sans",sans-serif`;
        g.fillText(b.txt, cx + rr + 12 * s, 1);
        g.restore();
      }
      // respondidos volando al robot
      const z = zona();
      for (const v of vuelan) {
        const e = v.t * v.t, tx = z.cx * .5, ty = z.cy + 60;
        const px = lerp(v.x, tx, e), py = lerp(v.y, ty, e) - Math.sin(v.t * Math.PI) * 80;
        g.globalAlpha = 1 - v.t; g.fillStyle = v.porAgente ? '#FA5000' : '#FFB48A';
        g.beginPath(); g.arc(px, py, 10 * (1 - v.t * .6) * s, 0, 7); g.fill();
        if (v.porAgente) { g.strokeStyle = 'rgba(250,80,0,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(tx, ty); g.lineTo(px, py); g.stroke(); }
        g.globalAlpha = 1;
      }
      // orbe Agente IA
      if (orbe) {
        const r = 40 * s * (1 + .08 * Math.sin(T * 8));
        const gr = g.createRadialGradient(orbe.x, orbe.y, 0, orbe.x, orbe.y, r * 1.8); gr.addColorStop(0, 'rgba(255,200,150,.95)'); gr.addColorStop(.45, 'rgba(250,80,0,.9)'); gr.addColorStop(1, 'rgba(205,35,73,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(orbe.x, orbe.y, r * 1.8, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.font = `800 ${13 * s}px "Plus Jakarta Sans",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AGENTE', orbe.x, orbe.y - 7 * s); g.fillText('IA', orbe.x, orbe.y + 9 * s);
      }
      part.dibuja(g, 1);
      g.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}

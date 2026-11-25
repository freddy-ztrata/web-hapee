// Juego 04 · Agenda Llena — ubica cada reunión en la semana respetando su condición.
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const DIAS_L = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes'];
const HORAS = [9, 10, 11, 12, 13, 14, 15, 16];
const QUIEN = ['Clínica Norte', 'Inmobiliaria Sur', 'Colegio Andes', 'Ferretería Sol', 'Estudio Luna', 'Taller Pérez', 'Hotel Bahía', 'Constructora Río', 'Óptica Centro', 'Gimnasio Pulso', 'Viña Alta', 'Café Raíz'];
const TIPO = ['Demo', 'Reunión', 'Visita', 'Llamada', 'Cotización'];
export async function crear(x) {
  const { g, W, part, sfx, vibra, rnd, cl, lerp } = x;
  const DUR = 70; cursor = null;
  let t = 0, pts = 0, racha = 0, mejor = 0, ok = 0, perdidas = 0, semanas = 0, termino = false, agente = 0, sacude = 0;
  let cal = Array.from({ length: 5 }, () => Array(8).fill(null));
  let actual = null, sig = null, drag = null, sel = false, colores = ['#FA5000', '#CD2349', '#FF7A3D', '#E0457A', '#FFB48A'];
  function pedido() {
    const dur = Math.random() < .45 ? 1 : Math.random() < .7 ? 2 : 3;
    const r = Math.random(); let cond;
    if (r < .3) cond = { tipo: 'libre', txt: 'cualquier día' };
    else if (r < .6) { const d = Math.floor(Math.random() * 5); cond = { tipo: 'dia', d, txt: 'solo ' + DIAS_L[d] }; }
    else if (r < .8) cond = { tipo: 'manana', txt: 'en la mañana' };
    else cond = { tipo: 'tarde', txt: 'en la tarde' };
    if (cond.tipo === 'manana' && dur > 3) cond = { tipo: 'libre', txt: 'cualquier día' };
    return { dur, cond, quien: QUIEN[Math.floor(Math.random() * QUIEN.length)], tipo: TIPO[Math.floor(Math.random() * TIPO.length)], col: colores[Math.floor(Math.random() * colores.length)], vida: lerp(9, 5, cl(t / DUR, 0, 1)), rest: 0 };
  }
  function valido(p, d, h) {
    if (d < 0 || d > 4 || h < 0 || h + p.dur > 8) return false;
    for (let i = h; i < h + p.dur; i++) if (cal[d][i]) return false;
    const ini = HORAS[h], fin = HORAS[h] + p.dur;
    if (p.cond.tipo === 'dia' && d !== p.cond.d) return false;
    if (p.cond.tipo === 'manana' && fin > 13) return false;
    if (p.cond.tipo === 'tarde' && ini < 13) return false;
    return true;
  }
  function cabe(p) { for (let d = 0; d < 5; d++) for (let h = 0; h < 8; h++) if (valido(p, d, h)) return [d, h]; return null; }
  const ocupacion = () => cal.flat().filter(Boolean).length / 40;
  function siguiente() {
    actual = sig || pedido(); sig = pedido(); actual.rest = actual.vida; sel = false;
    if (!cabe(actual)) {
      if (ocupacion() > .6) return semanaNueva('No cabía ni una más: ¡semana llena!');
      actual.cond = { tipo: 'libre', txt: 'cualquier día' };
      if (!cabe(actual)) return semanaNueva('Semana llena');
    }
    if (agente > 0) setTimeout(() => autoAgenda(), 350);
  }
  function semanaNueva(msg) {
    semanas++; const bono = Math.round(300 + 900 * ocupacion()); pts += bono; x.pts(pts);
    x.aviso((msg || 'SEMANA LLENA') + ' +' + bono); sfx.power(); x.bot.pose('celebra', 1.4); vibra([20, 40, 20]);
    const G = geo(); part.estalla(G.x0 + G.gw / 2, G.y0 + G.gh / 2, '#FA5000', 50, 420, 5);
    cal = Array.from({ length: 5 }, () => Array(8).fill(null));
    setTimeout(() => { if (!termino) siguiente(); }, 500); actual = null;
  }
  function ubica(d, h, porAgente) {
    if (!actual || !valido(actual, d, h)) { if (actual) { sfx.mal(); vibra(30); sacude = .2; x.dice(textoError(actual, d, h), 1400); racha = 0; x.combo(0); } return false; }
    const p = actual; for (let i = h; i < h + p.dur; i++) cal[d][i] = { p, ini: i === h, nace: 0 };
    ok++; racha++; mejor = Math.max(mejor, racha);
    const vel = cl(p.rest / p.vida, 0, 1), gan = Math.round((80 * p.dur + 80 * vel) * (1 + Math.min(2, racha * .1)));
    pts += gan; x.pts(pts); x.combo(racha >= 3 ? racha : 0);
    const G = geo(); part.estalla(G.x0 + (d + .5) * G.cw, G.y0 + (h + p.dur / 2) * G.ch, p.col, 22, 260); part.texto(G.x0 + (d + .5) * G.cw, G.y0 + h * G.ch - 8, '+' + gan, '#FFF1E8', 20);
    sfx.bien(Math.min(10, racha)); vibra(14);
    if (!porAgente && racha > 0 && racha % 6 === 0 && agente <= 0) { agente = 3; x.aviso('EL AGENTE AGENDA SOLO'); sfx.power(); x.dice('Tomo las próximas tres. Yo ofrezco horas y agendo directo.', 2200); x.bot.pose('celebra', 1.2); }
    if (porAgente) agente--;
    actual = null; drag = null;
    if (ocupacion() >= .87) semanaNueva(); else setTimeout(() => { if (!termino) siguiente(); }, 160);
    return true;
  }
  function textoError(p, d, h) {
    if (d < 0 || h < 0 || h + p.dur > 8) return 'No cabe ahí.';
    for (let i = h; i < Math.min(8, h + p.dur); i++) if (cal[d] && cal[d][i]) return 'Choca con otra reunión.';
    return 'Pidió ' + p.cond.txt + '.';
  }
  function autoAgenda() { if (!actual || termino) return; const c = cabe(actual); if (c) ubica(c[0], c[1], true); }
  function geo() {
    const trayH = cl(W.h * .2, 142, 170), top = 108, izq = 40, der = 12;
    const gw = Math.min(W.w - izq - der, 860), gh = W.h - top - trayH - 20;
    const cw = gw / 5, ch = Math.min(gh / 8.4, 64), x0 = W.w > 900 ? Math.round((W.w - gw) / 2) : izq;
    return { x0, y0: top + 22, gw, gh: ch * 8, cw, ch, trayY: W.h - trayH, trayH };
  }
  function trayRect() { const G = geo(), coachW = cl(W.h * .24, 120, 230) * .62; const w = Math.min(W.w - coachW - 24, 300), h = G.trayH - 24; return { x: W.w - w - 12, y: G.trayY + 8, w, h }; }
  function celdaEn(px, py, off) { const G = geo(); return [Math.floor((px - G.x0) / G.cw), Math.floor((py - (off || 0) - G.y0) / G.ch)]; }
  siguiente();
  return {
    __fin() { t = DUR; },
    empieza() { x.dice('Arrastra cada reunión a un hueco que cumpla su condición.', 2200); },
    abajo(e) {
      if (!actual || termino) return;
      const T = trayRect(), G = geo();
      if (e.clientX >= T.x && e.clientX <= T.x + T.w && e.clientY >= T.y && e.clientY <= T.y + T.h) { drag = { x: e.clientX, y: e.clientY, off: G.ch * .5 }; sel = true; sfx.tap(); return; }
      if (sel) { const [d, h] = celdaEn(e.clientX, e.clientY); ubica(d, h); }
    },
    mueve(e) { if (drag) { drag.x = e.clientX; drag.y = e.clientY; drag.mov = true; } },
    arriba(e) {
      if (!drag) return; const d0 = drag; drag = null;
      if (!d0.mov) return; // fue un toque: queda seleccionada
      const G = geo(); if (e.clientY > G.trayY) return;
      const [d, h] = celdaEn(e.clientX, e.clientY, d0.off - G.ch / 2); ubica(d, h);
    },
    tecla(e) {
      if (!actual) return; if (!this.cur) this.cur = [0, 0];
      if (e.key === 'ArrowLeft') this.cur[0] = Math.max(0, this.cur[0] - 1); if (e.key === 'ArrowRight') this.cur[0] = Math.min(4, this.cur[0] + 1);
      if (e.key === 'ArrowUp') this.cur[1] = Math.max(0, this.cur[1] - 1); if (e.key === 'ArrowDown') this.cur[1] = Math.min(7, this.cur[1] + 1);
      if (e.key === ' ' || e.key === 'Enter') ubica(this.cur[0], this.cur[1]);
      cursor = this.cur;
    },
    paso(dt, T) {
      if (dt > 0 && !termino) {
        t += dt; x.tiempo(DUR - t, DUR); x.extra(agente > 0 ? 'AGENTE IA · ' + agente : 'SEMANA ' + (semanas + 1));
        if (actual) {
          actual.rest -= dt;
          if (actual.rest <= 0) { perdidas++; racha = 0; x.combo(0); sfx.mal(); vibra(40); sacude = .25; x.dice(actual.quien + ' se aburrió de esperar.', 1500); actual = null; drag = null; setTimeout(() => { if (!termino) siguiente(); }, 250); }
        }
        for (const col of cal) for (const c of col) if (c) c.nace = Math.min(1, c.nace + dt * 5);
        sacude = Math.max(0, sacude - dt);
        if (t >= DUR) {
          termino = true;
          x.terminar({
            pts, frase: `Agendaste ${ok} ${ok === 1 ? 'reunión' : 'reuniones'} y llenaste ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}.`,
            stats: [[ok, 'reuniones agendadas'], [perdidas, 'se aburrieron'], [mejor, 'mejor racha']],
            ilus: `Ilustrativo: ${perdidas === 1 ? '1 cliente se fue' : perdidas + ' clientes se fueron'} por esperar. En Hapee el agente ofrece horas libres de tu calendario real y deja la cita agendada, con recordatorio, en la misma conversación.`,
            gancho: 'Que tu agenda se llene sola, mientras tú atiendes.',
          });
        }
      }
      // ── dibujo ──
      const G = geo();
      g.setTransform(W.dpr, 0, 0, W.dpr, 0, 0);
      const bg = g.createLinearGradient(0, 0, 0, W.h); bg.addColorStop(0, '#13050A'); bg.addColorStop(1, '#250912'); g.fillStyle = bg; g.fillRect(0, 0, W.w, W.h);
      if (sacude > 0) g.translate(rnd(-5, 5) * sacude * 4, 0);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      // cabecera de días
      DIAS.forEach((d, i) => { const destacado = actual && actual.cond.tipo === 'dia' && actual.cond.d === i; g.fillStyle = destacado ? '#FA5000' : 'rgba(255,241,232,.7)'; g.font = `800 13px "Plus Jakarta Sans",sans-serif`; g.fillText(d.toUpperCase(), G.x0 + (i + .5) * G.cw, G.y0 - 12); });
      HORAS.forEach((h, i) => { g.fillStyle = 'rgba(255,241,232,.5)'; g.font = '600 11px "Plus Jakarta Sans",sans-serif'; g.textAlign = 'right'; g.fillText(h + ':00', G.x0 - 6, G.y0 + i * G.ch + 10); g.textAlign = 'center'; });
      // franja almuerzo (13:00) como guía mañana / tarde
      g.strokeStyle = 'rgba(250,80,0,.35)'; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(G.x0, G.y0 + 4 * G.ch); g.lineTo(G.x0 + G.gw, G.y0 + 4 * G.ch); g.stroke(); g.setLineDash([]);
      // celdas válidas para el pedido actual
      for (let d = 0; d < 5; d++) for (let h = 0; h < 8; h++) {
        const x0 = G.x0 + d * G.cw, y0 = G.y0 + h * G.ch;
        const v = actual && (drag || sel || cursor) && valido(actual, d, h);
        g.fillStyle = v ? 'rgba(43,214,123,.16)' : 'rgba(255,255,255,.045)'; g.beginPath(); g.roundRect(x0 + 2, y0 + 2, G.cw - 4, G.ch - 4, 8); g.fill();
        if (cursor && cursor[0] === d && cursor[1] === h) { g.strokeStyle = '#FA5000'; g.lineWidth = 2; g.stroke(); }
      }
      // reuniones agendadas
      for (let d = 0; d < 5; d++) for (let h = 0; h < 8; h++) {
        const c = cal[d][h]; if (!c || !c.ini) continue; const p = c.p, e = 1 - Math.pow(1 - c.nace, 3);
        const x0 = G.x0 + d * G.cw + 3, y0 = G.y0 + h * G.ch + 3, w = G.cw - 6, hh = G.ch * p.dur - 6;
        g.save(); g.translate(x0 + w / 2, y0 + hh / 2); g.scale(e, e);
        g.fillStyle = p.col; g.beginPath(); g.roundRect(-w / 2, -hh / 2, w, hh, 10); g.fill();
        g.fillStyle = '#fff'; g.font = `800 ${Math.min(12, G.cw / 6)}px "Plus Jakarta Sans",sans-serif`; g.fillText(p.tipo, 0, -hh / 2 + 13);
        if (hh > 40) { g.font = `600 ${Math.min(10.5, G.cw / 7)}px "Plus Jakarta Sans",sans-serif`; g.globalAlpha = .9; g.fillText(p.quien.split(' ')[0], 0, -hh / 2 + 28); g.globalAlpha = 1; }
        g.restore();
      }
      // bandeja con el pedido
      const Tr = trayRect();
      g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.roundRect(Tr.x, Tr.y, Tr.w, Tr.h, 18); g.fill();
      if (actual) {
        const fr = cl(actual.rest / actual.vida, 0, 1);
        g.fillStyle = fr > .35 ? '#FA5000' : '#E53935'; g.beginPath(); g.roundRect(Tr.x + 14, Tr.y + Tr.h - 12, (Tr.w - 28) * fr, 5, 3); g.fill();
        g.textAlign = 'left'; g.fillStyle = 'rgba(255,241,232,.6)'; g.font = '700 11px "Plus Jakarta Sans",sans-serif'; g.fillText('PIDE REUNIÓN', Tr.x + 16, Tr.y + 18);
        const bw = Math.min(G.cw - 6, 58), bh = Math.min(G.ch * actual.dur - 6, Tr.h - 24), tw = Tr.w - bw - 44;
        let fs = 17; g.font = `800 ${fs}px "Plus Jakarta Sans",sans-serif`; while (g.measureText(actual.quien).width > tw && fs > 12) { fs--; g.font = `800 ${fs}px "Plus Jakarta Sans",sans-serif`; }
        g.fillStyle = '#FFF1E8'; g.fillText(actual.quien, Tr.x + 16, Tr.y + 40);
        g.font = '700 14px "Plus Jakarta Sans",sans-serif'; g.fillStyle = '#FFF1E8'; g.fillText(`${actual.tipo} · ${actual.dur} h`, Tr.x + 16, Tr.y + 62);
        g.fillStyle = actual.cond.tipo === 'libre' ? '#FFB48A' : '#FA5000'; g.font = '800 14px "Plus Jakarta Sans",sans-serif'; g.fillText(actual.cond.txt, Tr.x + 16, Tr.y + 82);
        // bloque arrastrable
        let bx = Tr.x + Tr.w - bw - 14, by = Tr.y + 10;
        if (drag && drag.mov) { bx = drag.x - bw / 2; by = drag.y - drag.off; }
        g.save(); g.shadowColor = 'rgba(250,80,0,.6)'; g.shadowBlur = sel ? 30 : 12;
        g.fillStyle = actual.col; g.beginPath(); g.roundRect(bx, by, bw, drag && drag.mov ? G.ch * actual.dur - 6 : bh, 10); g.fill(); g.restore();
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 12px "Plus Jakarta Sans",sans-serif'; g.fillText(actual.dur + ' h', bx + bw / 2, by + 16);
        if (sel && !drag) { g.fillStyle = 'rgba(255,241,232,.8)'; g.font = '700 12px "Plus Jakarta Sans",sans-serif'; g.textAlign = 'left'; g.fillText('Toca una celda verde', Tr.x + 16, Tr.y + 104); }
        // vista previa de dónde cae
        if (drag && drag.mov) { const [d, h] = celdaEn(drag.x, drag.y, drag.off - G.ch / 2); if (d >= 0 && d < 5 && h >= 0 && h < 8) { const v = valido(actual, d, h); g.strokeStyle = v ? '#2BD67B' : '#E53935'; g.lineWidth = 3; g.beginPath(); g.roundRect(G.x0 + d * G.cw + 2, G.y0 + h * G.ch + 2, G.cw - 4, G.ch * actual.dur - 4, 10); g.stroke(); } }
      }
      if (sig && !(sel && !drag)) { g.textAlign = 'left'; g.fillStyle = 'rgba(255,241,232,.45)'; g.font = '600 11px "Plus Jakarta Sans",sans-serif'; g.fillText('Después: ' + sig.quien, Tr.x + 16, Tr.y + 104); }
      part.dibuja(g, 1);
      g.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}
let cursor = null;

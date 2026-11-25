// Juego 02 · Lead Caliente — califica cada mensaje: Nutrir (izq.), Agendar (abajo), Descartar (der.).
const L = {
  agendar: [['¿Tienen hora mañana a las 10?', 'Pide reunión'], ['Ya tengo el presupuesto aprobado. ¿Cuándo partimos?', 'Presupuesto listo'], ['Quiero contratar el plan anual', 'Quiere comprar'], ['¿Me llaman hoy? Necesito cerrar esta semana', 'Urgencia'], ['Somos 40 personas, ¿nos cotizan hoy?', 'Volumen + plazo'], ['Vi el video, quiero avanzar', 'Decidido'], ['¿Puedo pagar con transferencia hoy?', 'Lista para pagar'], ['Necesito tenerlo funcionando antes del viernes', 'Fecha concreta'], ['Soy el gerente, agendemos', 'Decisor']],
  nutrir: [['Estoy cotizando para marzo', 'Compra a futuro'], ['¿Me mandan información?', 'Explorando'], ['Lo estoy viendo con mi socio', 'Aún evalúa'], ['Solo quiero conocer precios', 'Explorando'], ['Tal vez el próximo semestre', 'Sin apuro'], ['Ya tengo su guía, interesante', 'Interés inicial'], ['¿Tienen casos de mi rubro?', 'Quiere pruebas'], ['Todavía no tengo presupuesto', 'Sin presupuesto']],
  descartar: [['Vendo seguidores a $1.000', 'Spam'], ['Prueba prueba 123', 'No es real'], ['Responde esta encuesta y gana', 'Spam'], ['Ofrezco servicios de posicionamiento', 'Te quiere vender'], ['Haz clic en este link para tu premio', 'Estafa'], ['Busco práctica profesional', 'No es cliente'], ['Mensaje automático: fuera de oficina', 'Respuesta automática']],
};
const DEST = { izq: 'nutrir', abajo: 'agendar', der: 'descartar' };
const NOM = { nutrir: 'NUTRIR', agendar: 'AGENDAR', descartar: 'DESCARTAR' };
const SUB = { nutrir: 'Mail Marketing', agendar: 'Calendario', descartar: 'Fuera del pipeline' };
export async function crear(x) {
  const { g, W, part, sfx, vibra, rnd, cl, lerp } = x;
  const DUR = 60;
  let t = 0, pts = 0, racha = 0, mejor = 0, bien = 0, mal = 0, vidas = 3, carta = null, vuela = [], flash = {}, sacude = 0, termino = false, ini = null, mazo = [];
  const k = () => cl(Math.min(W.w, W.h) / 420, .85, 1.3);
  function baraja() { mazo = []; for (const c in L) for (const m of L[c]) mazo.push({ c, txt: m[0], sig: m[1] }); for (let i = mazo.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [mazo[i], mazo[j]] = [mazo[j], mazo[i]]; } }
  function nueva() {
    if (!mazo.length) baraja();
    const m = mazo.pop(), dur = lerp(6, 2.4, cl(t / DUR, 0, 1));
    carta = { ...m, y: 0, dur, vive: 0, x: 0, ent: 0 };
    x.bot.pose('piensa', dur);
  }
  function geo() {
    const s = k(), cw = Math.min(W.w - 120, 330 * s), ch = 132 * s;
    const top = 104, fondo = W.h - 150 * s;
    return { s, cw, ch, top, fondo, binY: W.h - 118 * s, binH: 96 * s };
  }
  function bins() {
    const G = geo(), lw = Math.min(64 * G.s, W.w * .16), y0 = W.h * .3, h = W.h * .32;
    return {
      nutrir: { x: 0, y: y0, w: lw, h },
      descartar: { x: W.w - lw, y: y0, w: lw, h },
      agendar: { x: W.w * .34, y: G.binY, w: W.w * .64 - 8, h: G.binH },
    };
  }
  function decide(dir) {
    if (!carta || termino) return;
    const dest = DEST[dir], ok = dest === carta.c, b = bins()[dest];
    const cx = W.w / 2 + carta.x, cy = carta.yPx || W.h / 2;
    vuela.push({ txt: carta.txt, x0: cx, y0: cy, x1: b.x + b.w / 2, y1: b.y + b.h / 2, t: 0, ok });
    flash[dest] = { t: .5, ok };
    if (ok) {
      racha++; mejor = Math.max(mejor, racha); bien++;
      const vel = 1 - cl(carta.vive / carta.dur, 0, 1), p = Math.round((100 + 100 * vel) * (1 + Math.min(2, racha * .1)));
      pts += p; x.pts(pts); x.combo(racha >= 3 ? racha : 0);
      part.estalla(b.x + b.w / 2, b.y + b.h / 2, dest === 'agendar' ? '#FA5000' : dest === 'nutrir' ? '#CD2349' : '#9A8A90', 20, 260); part.texto(cx, cy - 40, '+' + p, '#FFF1E8', 22 * k());
      sfx.bien(Math.min(10, racha)); vibra(14);
      if (racha % 8 === 0) { x.aviso('RACHA ×' + racha); sfx.combo(racha / 8); x.bot.pose('celebra', 1.2); }
    } else {
      mal++; vidas--; racha = 0; x.combo(0); sacude = .3; sfx.mal(); vibra([50, 30, 50]);
      part.texto(cx, cy - 40, 'Era ' + NOM[carta.c].toLowerCase(), '#FF8A80', 20 * k());
      x.dice(carta.c === 'agendar' ? 'Ese estaba listo para comprar.' : carta.c === 'nutrir' ? 'Ese aún no compra: se nutre con email.' : 'Ese no era un cliente.', 1700);
      if (vidas <= 0) return fin();
    }
    carta = null; setTimeout(() => { if (!termino) nueva(); }, 180);
  }
  function fin() {
    if (termino) return; termino = true; carta = null;
    const tot = bien + mal, prec = tot ? Math.round(bien / tot * 100) : 0;
    x.terminar({
      pts,
      frase: `Calificaste ${bien} ${bien === 1 ? 'lead' : 'leads'} con ${prec}% de precisión.`,
      stats: [[bien, 'bien calificados'], [mal, 'errores'], [mejor, 'mejor racha']],
      ilus: 'Ilustrativo: en Hapee defines los criterios una vez y tu agente con rol «SDR» los aplica en cada conversación, día y noche, sin cansarse.',
      gancho: 'Calificar a mano cansa. Tu agente de IA lo hace en cada conversación.',
    });
  }
  const vidasTxt = () => 'CONFIANZA ' + '●'.repeat(vidas) + '○'.repeat(3 - vidas);
  return {
    __fin() { t = DUR; },
    empieza() { nueva(); x.extra(vidasTxt()); },
    abajo(e) { ini = { x: e.clientX, y: e.clientY }; },
    arriba(e) {
      if (!ini) return; const dx = e.clientX - ini.x, dy = e.clientY - ini.y; ini = null;
      if (Math.hypot(dx, dy) > 30) { if (Math.abs(dx) > Math.abs(dy)) decide(dx < 0 ? 'izq' : 'der'); else if (dy > 0) decide('abajo'); return; }
      const B = bins(), px = e.clientX, py = e.clientY;
      for (const [d, n] of [['izq', 'nutrir'], ['der', 'descartar'], ['abajo', 'agendar']]) { const b = B[n]; if (px >= b.x - 10 && px <= b.x + b.w + 10 && py >= b.y - 10 && py <= b.y + b.h + 10) return decide(d); }
    },
    mueve(e) { if (ini && carta) carta.x = cl(e.clientX - ini.x, -W.w * .3, W.w * .3); },
    tecla(e) { if (e.key === 'ArrowLeft' || e.key === 'a') decide('izq'); if (e.key === 'ArrowRight' || e.key === 'd') decide('der'); if (e.key === 'ArrowDown' || e.key === 's' || e.key === ' ') decide('abajo'); },
    paso(dt, T) {
      if (dt > 0 && !termino) {
        t += dt; x.tiempo(DUR - t, DUR); x.extra(vidasTxt());
        if (carta) {
          carta.vive += dt; carta.ent = Math.min(1, carta.ent + dt * 4);
          if (!ini) carta.x *= .8;
          if (carta.vive >= carta.dur) { // se pasó: cuenta como error
            mal++; vidas--; racha = 0; x.combo(0); sfx.mal(); vibra(50); sacude = .25; x.dice('¡Se te pasó! Quedó sin respuesta.', 1500);
            carta = null; if (vidas <= 0) fin(); else setTimeout(() => { if (!termino) nueva(); }, 200);
          }
        }
        for (const v of vuela) v.t += dt * 2.6; vuela = vuela.filter(v => v.t < 1);
        for (const f in flash) { flash[f].t -= dt; if (flash[f].t <= 0) delete flash[f]; }
        sacude = Math.max(0, sacude - dt);
        if (t >= DUR) fin();
      }
      // ── dibujo ──
      const G = geo(), s = G.s, B = bins();
      g.setTransform(W.dpr, 0, 0, W.dpr, 0, 0);
      const bg = g.createRadialGradient(W.w / 2, W.h * .45, 0, W.w / 2, W.h * .45, W.h * .8); bg.addColorStop(0, '#2C0B15'); bg.addColorStop(1, '#0C0407'); g.fillStyle = bg; g.fillRect(0, 0, W.w, W.h);
      if (sacude > 0) g.translate(rnd(-5, 5) * sacude * 4, 0);
      // carril central
      g.strokeStyle = 'rgba(255,255,255,.06)'; g.setLineDash([6, 10]); g.lineWidth = 2; g.beginPath(); g.moveTo(W.w / 2, G.top); g.lineTo(W.w / 2, G.binY - 10); g.stroke(); g.setLineDash([]);
      // destinos
      for (const n of ['nutrir', 'descartar', 'agendar']) {
        const b = B[n], f = flash[n], vert = n !== 'agendar';
        const col = n === 'agendar' ? [250, 80, 0] : n === 'nutrir' ? [205, 35, 73] : [120, 108, 114];
        const a = f ? .35 + .5 * f.t * 2 : .16;
        g.fillStyle = f && !f.ok ? `rgba(229,57,53,${a})` : `rgba(${col},${a})`;
        g.beginPath(); g.roundRect(b.x + (vert ? (n === 'nutrir' ? -20 : 0) : 0), b.y, b.w + (vert ? 20 : 0), b.h, 18); g.fill();
        g.strokeStyle = `rgba(${col},.8)`; g.lineWidth = 2; g.stroke();
        g.fillStyle = '#FFF1E8'; g.textAlign = 'center'; g.textBaseline = 'middle';
        if (vert) {
          g.save(); g.translate(b.x + b.w / 2, b.y + b.h / 2); g.rotate(n === 'nutrir' ? -Math.PI / 2 : Math.PI / 2);
          g.font = `800 ${15 * s}px "Plus Jakarta Sans",sans-serif`; g.fillText(NOM[n], 0, -8 * s);
          g.font = `600 ${11.5 * s}px "Plus Jakarta Sans",sans-serif`; g.globalAlpha = .75; g.fillText(SUB[n], 0, 11 * s); g.globalAlpha = 1; g.restore();
          g.font = `800 ${20 * s}px "Plus Jakarta Sans",sans-serif`; g.fillText(n === 'nutrir' ? '←' : '→', b.x + b.w / 2, b.y - 18 * s);
        } else {
          g.font = `800 ${18 * s}px "Plus Jakarta Sans",sans-serif`; g.fillText('↓ ' + NOM[n], b.x + b.w / 2, b.y + b.h / 2 - 9 * s);
          g.font = `600 ${12 * s}px "Plus Jakarta Sans",sans-serif`; g.globalAlpha = .75; g.fillText(SUB[n], b.x + b.w / 2, b.y + b.h / 2 + 14 * s); g.globalAlpha = 1;
        }
      }
      // carta
      if (carta) {
        const fr = cl(carta.vive / carta.dur, 0, 1), y = lerp(G.top + G.ch / 2, G.binY - G.ch / 2 - 12, fr), e = 1 - Math.pow(1 - carta.ent, 3);
        carta.yPx = y;
        g.save(); g.translate(W.w / 2 + carta.x, y); g.rotate(carta.x / W.w * .5); g.scale(e, e);
        g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
        g.fillStyle = '#FFF1E8'; g.beginPath(); g.roundRect(-G.cw / 2, -G.ch / 2, G.cw, G.ch, 22 * s); g.fill(); g.shadowColor = 'transparent';
        // barra de tiempo de la carta
        g.fillStyle = fr < .7 ? '#FA5000' : '#E53935'; g.beginPath(); g.roundRect(-G.cw / 2 + 16 * s, G.ch / 2 - 14 * s, (G.cw - 32 * s) * (1 - fr), 5 * s, 3); g.fill();
        g.fillStyle = '#7A5A64'; g.font = `700 ${12 * s}px "Plus Jakarta Sans",sans-serif`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        g.fillText('NUEVO MENSAJE', -G.cw / 2 + 18 * s, -G.ch / 2 + 26 * s);
        g.fillStyle = '#2a0d14'; g.font = `800 ${19 * s}px "Plus Jakarta Sans",sans-serif`;
        const lineas = partir(g, '«' + carta.txt + '»', G.cw - 36 * s);
        lineas.slice(0, 3).forEach((l, i) => g.fillText(l, -G.cw / 2 + 18 * s, -G.ch / 2 + 56 * s + i * 24 * s));
        g.restore();
      }
      for (const v of vuela) {
        const e = v.t * v.t * (3 - 2 * v.t);
        g.globalAlpha = 1 - v.t; g.fillStyle = v.ok ? '#FFF1E8' : '#E53935';
        g.beginPath(); g.roundRect(lerp(v.x0, v.x1, e) - 40 * (1 - e), lerp(v.y0, v.y1, e) - 20 * (1 - e), 80 * (1 - e) + 8, 40 * (1 - e) + 8, 10); g.fill(); g.globalAlpha = 1;
      }
      part.dibuja(g, 1);
      g.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}
function partir(g, t, w) { const out = []; let l = ''; for (const p of t.split(' ')) { const n = l ? l + ' ' + p : p; if (g.measureText(n).width > w && l) { out.push(l); l = p; } else l = n; } if (l) out.push(l); return out; }

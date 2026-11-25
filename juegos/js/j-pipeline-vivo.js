// Juego 03 · Pipeline Vivo — gira piezas para conectar cada canal con el CRM.
const N = 1, E = 2, S = 4, O = 8;
const rot = m => ((m << 1) | (m >> 3)) & 15;
const DIRS = [[N, -1, 0, S], [E, 0, 1, O], [S, 1, 0, N], [O, 0, -1, E]];
const CAN = [{ k: 'WA', c: '#25C26A' }, { k: 'IG', c: '#E1306C' }, { k: 'FB', c: '#3B6FE0' }, { k: '@', c: '#F2A33A' }, { k: 'WEB', c: '#9B6BFF' }];
const NIV = [[4, 5, 2], [5, 5, 2], [5, 6, 3], [6, 6, 3], [6, 7, 4], [7, 7, 4]];
export async function crear(x) {
  const { g, W, part, sfx, vibra, rnd, cl, lerp } = x;
  const DUR = 75;
  let t = 0, pts = 0, nivel = 0, tab = null, termino = false, completos = 0, negocios = 0, transicion = 0, flujoT = 0, conectadosAntes = 0;
  function genera(nv) {
    const [F, C, ns] = NIV[Math.min(nv, NIV.length - 1)];
    const m = Array.from({ length: F }, () => Array(C).fill(0));
    const filas = []; while (filas.length < ns) { const r = Math.floor(Math.random() * F); if (!filas.includes(r) || filas.length >= F) filas.push(r); }
    const destino = Math.floor(F / 2);
    for (const sr of filas) {
      // Dijkstra con pesos al azar: camino simple y distinto cada vez
      const dist = Array.from({ length: F }, () => Array(C).fill(1e9)), prev = {}, w = Array.from({ length: F }, () => Array.from({ length: C }, () => rnd(1, 6)));
      dist[sr][0] = 0; const abiertos = [[sr, 0]], vis = new Set();
      while (abiertos.length) {
        abiertos.sort((a, b) => dist[a[0]][a[1]] - dist[b[0]][b[1]]); const [r, c] = abiertos.shift(), key = r + ',' + c; if (vis.has(key)) continue; vis.add(key);
        if (r === destino && c === C - 1) break;
        for (const [, dr, dc] of DIRS) { const r2 = r + dr, c2 = c + dc; if (r2 < 0 || c2 < 0 || r2 >= F || c2 >= C) continue; const nd = dist[r][c] + w[r2][c2]; if (nd < dist[r2][c2]) { dist[r2][c2] = nd; prev[r2 + ',' + c2] = [r, c]; abiertos.push([r2, c2]); } }
      }
      let cur = [destino, C - 1]; const camino = [cur];
      while (!(cur[0] === sr && cur[1] === 0)) { cur = prev[cur[0] + ',' + cur[1]]; if (!cur) break; camino.unshift(cur); }
      m[sr][0] |= O; m[destino][C - 1] |= E;
      for (let i = 0; i < camino.length - 1; i++) { const [r1, c1] = camino[i], [r2, c2] = camino[i + 1]; for (const [b, dr, dc, op] of DIRS) if (r1 + dr === r2 && c1 + dc === c2) { m[r1][c1] |= b; m[r2][c2] |= op; } }
    }
    const RELL = [5, 10, 3, 6, 12, 9, 7, 11, 13, 14, 5, 3, 6];
    const celdas = [];
    for (let r = 0; r < F; r++) for (let c = 0; c < C; c++) {
      let mm = m[r][c] || RELL[Math.floor(Math.random() * RELL.length)];
      const giros = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < giros; i++) mm = rot(mm);
      celdas.push({ r, c, m: mm, ang: 0, flu: 0 });
    }
    return { F, C, filas, destino, celdas, can: filas.map((_, i) => CAN[(i + nv) % CAN.length]), entra: 0 };
  }
  const celda = (r, c) => tab.celdas[r * tab.C + c];
  function geo() {
    const top = 112, bot = W.h - cl(W.h * .24, 120, 230) * .55 - 16, margen = 46;
    const cs = Math.floor(Math.min((W.w - 2 * margen - 16) / tab.C, (bot - top) / tab.F, 92));
    const bw = cs * tab.C, bh = cs * tab.F;
    return { cs, x0: Math.round((W.w - bw) / 2), y0: Math.round(top + (bot - top - bh) / 2), bw, bh };
  }
  function flujo() {
    // devuelve por fuente: camino de celdas si llega al CRM
    const res = [];
    for (let i = 0; i < tab.filas.length; i++) {
      const sr = tab.filas[i]; const ini = celda(sr, 0); if (!(ini.m & O)) { res.push(null); continue; }
      const q = [[sr, 0]], prev = { [sr + ',0']: null }; let llega = null;
      while (q.length) {
        const [r, c] = q.shift(); const cc = celda(r, c);
        if (r === tab.destino && c === tab.C - 1 && (cc.m & E)) { llega = [r, c]; break; }
        for (const [b, dr, dc, op] of DIRS) { if (!(cc.m & b)) continue; const r2 = r + dr, c2 = c + dc; if (r2 < 0 || c2 < 0 || r2 >= tab.F || c2 >= tab.C) continue; if (!(celda(r2, c2).m & op)) continue; const k2 = r2 + ',' + c2; if (k2 in prev) continue; prev[k2] = [r, c]; q.push([r2, c2]); }
      }
      if (!llega) { res.push(null); continue; }
      const cam = []; let cur = llega; while (cur) { cam.unshift(cur); cur = prev[cur[0] + ',' + cur[1]]; }
      res.push(cam);
    }
    return res;
  }
  let caminos = [];
  function recalcula() {
    caminos = flujo(); const n = caminos.filter(Boolean).length;
    for (const c of tab.celdas) c.on = false;
    caminos.forEach(cm => cm && cm.forEach(([r, c]) => { celda(r, c).on = true; }));
    if (n > conectadosAntes) { sfx.combo(n); vibra(20); x.dice(n === tab.filas.length ? '¡Todo conectado!' : `¡${n} de ${tab.filas.length} canales conectados!`, 1300); x.bot.pose('saluda', 1); }
    conectadosAntes = n;
    if (n === tab.filas.length && !transicion) {
      completos++; const bono = 400 + 200 * nivel; pts += bono; x.pts(pts); x.aviso('PIPELINE COMPLETO +' + bono); sfx.power(); x.bot.pose('celebra', 1.4);
      const G = geo(); part.estalla(G.x0 + G.bw, G.y0 + (tab.destino + .5) * G.cs, '#FA5000', 40, 380, 5);
      transicion = 1.3;
    }
  }
  function nuevoTablero() { tab = genera(nivel); conectadosAntes = 0; recalcula(); if (conectadosAntes === tab.filas.length) { tab = genera(nivel); conectadosAntes = 0; recalcula(); } x.extra('TABLERO ' + (nivel + 1)); }
  nuevoTablero();
  function gira(cel) { cel.m = rot(cel.m); cel.ang -= Math.PI / 2; sfx.tap(); vibra(8); recalcula(); }
  return {
    __fin() { t = DUR; },
    empieza() { x.dice('Toca las piezas para girarlas. ¡Conecta los canales con el CRM!', 2400); },
    abajo(e) {
      if (transicion || termino) return; const G = geo();
      const c = Math.floor((e.clientX - G.x0) / G.cs), r = Math.floor((e.clientY - G.y0) / G.cs);
      if (r >= 0 && c >= 0 && r < tab.F && c < tab.C) gira(celda(r, c));
    },
    tecla(e) {
      // teclado: mover cursor y girar con espacio
      if (!tab.cur) tab.cur = [0, 0];
      if (e.key === 'ArrowUp') tab.cur[0] = Math.max(0, tab.cur[0] - 1); if (e.key === 'ArrowDown') tab.cur[0] = Math.min(tab.F - 1, tab.cur[0] + 1);
      if (e.key === 'ArrowLeft') tab.cur[1] = Math.max(0, tab.cur[1] - 1); if (e.key === 'ArrowRight') tab.cur[1] = Math.min(tab.C - 1, tab.cur[1] + 1);
      if ((e.key === ' ' || e.key === 'Enter') && !transicion) gira(celda(tab.cur[0], tab.cur[1]));
    },
    paso(dt, T) {
      if (dt > 0 && !termino) {
        t += dt; x.tiempo(DUR - t, DUR);
        const n = caminos.filter(Boolean).length;
        if (n) { flujoT += dt * n; while (flujoT > .5) { flujoT -= .5; negocios++; pts += 15 * (nivel + 1); x.pts(pts); } }
        if (transicion) { transicion -= dt; if (transicion <= 0) { transicion = 0; nivel++; nuevoTablero(); x.tempo(108 + nivel * 6); } }
        for (const c of tab.celdas) c.ang *= Math.pow(.0005, dt);
        if (t >= DUR) {
          termino = true;
          x.terminar({
            pts, frase: completos ? `Armaste ${completos} ${completos === 1 ? 'pipeline completo' : 'pipelines completos'} y entraron ${negocios} negocios.` : `Entraron ${negocios} negocios por tus conexiones.`,
            stats: [[completos, 'tableros completos'], [negocios, 'negocios que entraron'], [nivel + 1, 'nivel alcanzado']],
            ilus: 'Ilustrativo: en Hapee no hay que conectar cañerías. WhatsApp, Instagram, Facebook, email y tu web caen en una sola bandeja y en un solo pipeline desde el primer día.',
            gancho: '¿Hoy tus canales llegan a un solo lugar o a cinco?',
          });
        }
      }
      // ── dibujo ──
      const G = geo(), cs = G.cs, s = cs / 64;
      g.setTransform(W.dpr, 0, 0, W.dpr, 0, 0);
      const bg = g.createLinearGradient(0, 0, W.w, W.h); bg.addColorStop(0, '#12050A'); bg.addColorStop(1, '#260912'); g.fillStyle = bg; g.fillRect(0, 0, W.w, W.h);
      const ent = transicion ? cl(transicion / .4, 0, 1) : 1;
      g.save(); g.globalAlpha = ent;
      // fondo del tablero
      g.fillStyle = 'rgba(255,255,255,.035)'; g.beginPath(); g.roundRect(G.x0 - 8, G.y0 - 8, G.bw + 16, G.bh + 16, 18); g.fill();
      for (const c of tab.celdas) {
        const cx = G.x0 + (c.c + .5) * cs, cy = G.y0 + (c.r + .5) * cs;
        g.fillStyle = (c.r + c.c) % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.055)';
        g.beginPath(); g.roundRect(cx - cs / 2 + 2, cy - cs / 2 + 2, cs - 4, cs - 4, 10 * s); g.fill();
        if (tab.cur && tab.cur[0] === c.r && tab.cur[1] === c.c) { g.strokeStyle = '#FA5000'; g.lineWidth = 2; g.stroke(); }
        g.save(); g.translate(cx, cy); g.rotate(c.ang);
        g.lineCap = 'round';
        for (const [b, dr, dc] of DIRS) if (c.m & b) {
          g.strokeStyle = c.on ? '#FA5000' : 'rgba(255,241,232,.28)'; g.lineWidth = 14 * s;
          g.beginPath(); g.moveTo(0, 0); g.lineTo(dc * cs / 2, dr * cs / 2); g.stroke();
          if (c.on) { g.strokeStyle = '#FFC9A8'; g.lineWidth = 4 * s; g.beginPath(); g.moveTo(0, 0); g.lineTo(dc * cs / 2, dr * cs / 2); g.stroke(); }
        }
        g.fillStyle = c.on ? '#FA5000' : '#5A4249'; g.beginPath(); g.arc(0, 0, 9 * s, 0, 7); g.fill();
        g.restore();
      }
      // fuentes
      tab.filas.forEach((r, i) => {
        const cy = G.y0 + (r + .5) * cs, cx = G.x0 - 26, cn = tab.can[i], on = !!caminos[i];
        g.strokeStyle = on ? '#FA5000' : 'rgba(255,241,232,.28)'; g.lineWidth = 14 * s; g.beginPath(); g.moveTo(cx, cy); g.lineTo(G.x0, cy); g.stroke();
        g.fillStyle = cn.c; g.beginPath(); g.arc(cx, cy, 20, 0, 7); g.fill();
        if (on) { g.strokeStyle = 'rgba(250,80,0,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 24 + 3 * Math.sin(T * 6), 0, 7); g.stroke(); }
        g.fillStyle = '#fff'; g.font = `800 ${cn.k.length > 2 ? 10 : 13}px "Plus Jakarta Sans",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(cn.k, cx, cy + 1);
      });
      // núcleo CRM
      { const cy = G.y0 + (tab.destino + .5) * cs, cx = G.x0 + G.bw + 28, r = 26 + 2 * Math.sin(T * 3);
        g.strokeStyle = caminos.some(Boolean) ? '#FA5000' : 'rgba(255,241,232,.28)'; g.lineWidth = 14 * s; g.beginPath(); g.moveTo(G.x0 + G.bw, cy); g.lineTo(cx, cy); g.stroke();
        const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r * 1.9); gr.addColorStop(0, 'rgba(250,80,0,.9)'); gr.addColorStop(.5, 'rgba(205,35,73,.5)'); gr.addColorStop(1, 'rgba(205,35,73,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r * 1.9, 0, 7); g.fill();
        g.fillStyle = '#FFF1E8'; g.beginPath(); g.arc(cx, cy, r * .8, 0, 7); g.fill();
        g.fillStyle = '#CD2349'; g.font = '800 12px "Plus Jakarta Sans",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CRM', cx, cy + 1);
        g.fillStyle = '#FFF1E8'; g.font = '700 12px "Plus Jakarta Sans",sans-serif'; g.fillText(negocios + ' negocios', Math.min(cx, W.w - 46), cy + r + 26);
      }
      // leads que fluyen por los caminos
      caminos.forEach((cm, i) => {
        if (!cm) return;
        const pts2 = [[G.x0 - 26, G.y0 + (cm[0][0] + .5) * cs]]; for (const [r, c] of cm) pts2.push([G.x0 + (c + .5) * cs, G.y0 + (r + .5) * cs]); pts2.push([G.x0 + G.bw + 28, G.y0 + (tab.destino + .5) * cs]);
        const L2 = pts2.length - 1;
        for (let k2 = 0; k2 < 4; k2++) {
          const u = ((T * 1.4 + k2 / 4 + i * .13) % 1) * L2, a = Math.floor(u), f = u - a, p0 = pts2[a], p1 = pts2[Math.min(L2, a + 1)];
          g.fillStyle = tab.can[i].c; g.beginPath(); g.arc(lerp(p0[0], p1[0], f), lerp(p0[1], p1[1], f), 5 * s + 1, 0, 7); g.fill();
        }
      });
      g.restore();
      part.dibuja(g, 1);
      g.setTransform(1, 0, 0, 1, 0, 0);
    },
  };
}

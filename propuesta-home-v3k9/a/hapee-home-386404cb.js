/* Maqueta de Hapee Pro: pestañas personalizadas + menú lateral cambian de vista; en el inbox, cada hilo abre su chat.
   Con muchas pestañas la fila se desplaza en horizontal: la activa queda centrada, fundido en el borde que tiene más
   pestañas (.fl / .fr) y flechas ‹ › en escritorio. */
(function () {
  function init(raiz) {
    var T = {};
    try { T = JSON.parse(raiz.getAttribute('data-hp')); } catch (x) {}
    var titulo = raiz.querySelector('[data-titulo]'), ruta = raiz.querySelector('[data-ruta]');
    var tabs = [].slice.call(raiz.querySelectorAll('.hp-tab'));
    var lista = raiz.querySelector('.hp-tabs'), caja = raiz.querySelector('.hp-tabsw');
    function bordes() {
      if (!lista || !caja) return;
      var max = lista.scrollWidth - lista.clientWidth;
      caja.classList.toggle('fl', lista.scrollLeft > 2);
      caja.classList.toggle('fr', lista.scrollLeft < max - 2);
    }
    function centra(t, suave) {
      if (!lista || !t) return;
      var lr = lista.getBoundingClientRect(), tr = t.getBoundingClientRect();
      if (!lr.width) return;
      var x = lista.scrollLeft + (tr.left - lr.left) - (lr.width - tr.width) / 2;
      x = Math.max(0, Math.min(x, lista.scrollWidth - lista.clientWidth));
      if (suave && lista.scrollTo) lista.scrollTo({ left: x, behavior: 'smooth' }); else lista.scrollLeft = x;
      bordes();
    }
    function activa() { for (var i = 0; i < tabs.length; i++) if (tabs[i].getAttribute('aria-selected') === 'true') return tabs[i]; return null; }
    function ir(v, foco) {
      var panel = raiz.querySelector('.hp-v[data-vista="' + v + '"]');
      if (!panel || !T[v]) return;
      [].forEach.call(raiz.querySelectorAll('.hp-v'), function (p) { p.hidden = p !== panel; });
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-v') === v;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && foco) t.focus({ preventScroll: true });
        if (on) centra(t, true);
      });
      [].forEach.call(raiz.querySelectorAll('.ni-it'), function (n) { n.classList.toggle('on', n.getAttribute('data-menu') === T[v][2]); });
      if (titulo) titulo.textContent = T[v][0];
      if (ruta) ruta.textContent = T[v][1];
    }
    tabs.forEach(function (t) { t.tabIndex = t.getAttribute('aria-selected') === 'true' ? 0 : -1; });
    raiz.addEventListener('click', function (ev) {
      var f = ev.target.closest('.hp-tabs-fl');
      if (f && lista) {
        var d = +f.getAttribute('data-dir') || 1;
        lista.scrollBy ? lista.scrollBy({ left: d * lista.clientWidth * 0.7, behavior: 'smooth' }) : (lista.scrollLeft += d * lista.clientWidth * 0.7);
        return;
      }
      var b = ev.target.closest('[data-v]');
      if (b && raiz.contains(b)) { ir(b.getAttribute('data-v')); return; }
      var h = ev.target.closest('[data-hilo]');
      if (h && raiz.contains(h)) {
        var i = h.getAttribute('data-hilo');
        [].forEach.call(raiz.querySelectorAll('[data-hilo]'), function (x) { x.classList.toggle('on', x === h); });
        [].forEach.call(raiz.querySelectorAll('[data-panel]'), function (p) { p.hidden = p.getAttribute('data-panel') !== i; });
        [].forEach.call(raiz.querySelectorAll('[data-det]'), function (p) { p.hidden = p.getAttribute('data-det') !== i; });
      }
    });
    if (lista) {
      lista.addEventListener('keydown', function (ev) {
        var k = ev.key, i = tabs.indexOf(document.activeElement);
        if (i < 0 || ['ArrowRight', 'ArrowLeft', 'Home', 'End'].indexOf(k) < 0) return;
        ev.preventDefault();
        var j = k === 'Home' ? 0 : k === 'End' ? tabs.length - 1 : (i + (k === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        ir(tabs[j].getAttribute('data-v'), true);
      });
      lista.addEventListener('scroll', bordes, { passive: true });
      var ubica = function () { centra(activa(), false); };
      ubica();
      window.addEventListener('load', ubica);
      window.addEventListener('resize', ubica);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(ubica);
      window.addEventListener('beforeprint', ubica);
    }
  }
  window.HapeeProInit = init;
  function todo() { [].forEach.call(document.querySelectorAll('[data-hp]'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', todo); else todo();
})();

/* Ahorro por módulo: recalcula con el número de usuarios (mismo cálculo y formato que ahorro.py). */
(function () {
  var el = document.getElementById('ahorro-datos');
  if (!el) return;
  var D = JSON.parse(el.textContent), U = D.u;
  function usd(v) {
    var neg = v < 0; v = Math.abs(Math.round(v * 100) / 100);
    var ent = Math.floor(v), cen = Math.round((v - ent) * 100);
    if (cen === 100) { ent++; cen = 0; }
    var s = String(ent).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (cen) s += ',' + (cen < 10 ? '0' : '') + cen;
    return (neg ? '−' : '') + 'US$' + s;
  }
  function costo(o, u) { return o[0] * (o[1] ? u : 1); }
  function calcula(u) {
    var r = {mods: {}, tools: {}, ref: 0, desde: 0};
    D.m.forEach(function (m) {
      var ref = 0, desde = 0;
      m.nd.forEach(function (ops, i) {
        desde += costo(ops.filter(function (o) { return o[2]; })[0] || ops[0], u);
        ops.forEach(function (o, j) { r.tools[m.n + ':' + i + ':' + j] = costo(o, u); });
      });
      if (m.nd.length) ref = Math.max(desde + (D.mas || 0), (D.min || {})[m.n] || 0);
      r.mods[m.n] = {ref: ref, desde: desde};
      r.ref += ref; r.desde += desde;
    });
    r.neto = r.ref - D.pro; r.anual = r.neto * 12; r.neto_desde = r.desde - D.pro; r.neto_of = r.ref - D.of;
    return r;
  }
  function pinta() {
    var r = calcula(U);
    [].forEach.call(document.querySelectorAll('[data-usuarios]'), function (o) { o.textContent = U; });
    [].forEach.call(document.querySelectorAll('[data-tool]'), function (b) { var v = r.tools[b.getAttribute('data-tool')]; if (v != null) b.textContent = usd(v); });
    [].forEach.call(document.querySelectorAll('[data-mod]'), function (b) { var m = r.mods[b.getAttribute('data-mod')]; if (m) b.textContent = usd(m[b.getAttribute('data-k')]); });
    [].forEach.call(document.querySelectorAll('[data-tot]'), function (b) { var v = r[b.getAttribute('data-tot')]; if (v != null) b.textContent = usd(v); });
    [].forEach.call(document.querySelectorAll('.ah-u-print'), function (p) { p.textContent = 'Cálculo con ' + U + (U === 1 ? ' usuario.' : ' usuarios.'); });
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-u]');
    if (!b) return;
    U = Math.max(1, Math.min(25, U + (+b.getAttribute('data-u'))));
    pinta();
  });
})();

/* Agente IA de Hapee · widget del nuevo home (reemplaza al «Interactúa con Hapee»).
   Misma idea: eliges rubro y canal y conversas como si fueras el cliente. Ahora:
   - Cada rubro trae una cuenta de ejemplo con guiones por canal (WhatsApp, Instagram, Facebook) y las ACCIONES
     que hace el agente (crea el lead en el CRM, agenda, etiqueta, deriva), las mismas que se ven en la maqueta.
   - Respuestas rápidas y horas se pueden tocar; si no tocas nada, el guion sigue solo.
   - Cuando escribes, responde en vivo por /api/chat (el mismo proxy del home) con el contexto del rubro;
     si la API falla, contesta con la base de conocimiento de la cuenta. Tope de mensajes por visita.
   - Emite «hapee:rubro» y «hapee:accion» en document para que la página sincronice la maqueta.
   - Sin dependencias. Robusto: cada corrida tiene su ficha y se cancela al cambiar rubro/canal/reiniciar.
   - prefers-reduced-motion: muestra la conversación completa al instante. */
(function () {
  'use strict';
  var DATA = null;
  try { DATA = JSON.parse(document.getElementById('hx-datos').textContent); } catch (e) { return; }
  var RED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CANAL = { wa: ['WhatsApp', '#25D366'], ig: ['Instagram', 'linear-gradient(45deg,#f09433,#dc2743 55%,#bc1888)'], fb: ['Facebook', '#1877F2'] };
  var IC = {
    agenda: 'M8 2v4M16 2v4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18',
    crm: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
    tag: 'M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4zM7 7.5h.01',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-10 6L2 7',
    doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
    hum: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    ok: 'M20 6 9 17l-5-5',
    zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z'
  };
  IC.stock = IC.doc; IC.despacho = 'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 18.5a2 2 0 1 0 0 .01M18.5 18.5a2 2 0 1 0 0 .01'; IC.cotiza = IC.doc;
  function svg(d, c) { return '<svg class="' + (c || 'hx-i') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function soloB(s) { return esc(String(s).replace(/<(?!\/?b>)[^>]+>/g, '')).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>'); }
  function plano(s) { return String(s).replace(/<[^>]+>/g, ''); }
  function ini(n) { var p = String(n).split(/[\s._]+/).filter(Boolean); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : (p[0] || '').slice(1, 2))).toUpperCase(); }

  function Widget(raiz) {
    var S = { rub: raiz.getAttribute('data-rubro') || DATA.orden[0], ch: null, run: 0, tocado: false, libre: false, enviados: 0, hist: [], acc: 0, visible: false, pend: null };
    var LIM = 8;
    raiz.innerHTML =
      '<div class="hx-rub" role="tablist" aria-label="Elige tu rubro"></div>' +
      '<div class="hx-cuerpo"><div class="hx-tel">' +
        '<div class="hx-ch" role="tablist" aria-label="Canal"></div>' +
        '<div class="hx-cab"><span class="hx-av" aria-hidden="true"></span><span class="hx-id"><b class="hx-marca"></b><small class="hx-est">en línea</small></span>' +
        '<button type="button" class="hx-re" aria-label="Reiniciar la conversación">' + svg('M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5') + '</button></div>' +
        '<div class="hx-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
        '<div class="hx-sug" aria-label="Respuestas sugeridas"></div>' +
        '<form class="hx-in" autocomplete="off"><label class="hx-sr" for="' + raiz.id + '-t">Escríbele al agente</label>' +
        '<input id="' + raiz.id + '-t" type="text" maxlength="280" placeholder="Escríbele como si fueras cliente…" enterkeyhint="send">' +
        '<button type="submit" aria-label="Enviar">' + svg('M22 2 11 13M22 2l-7 20-4-9-9-4z') + '</button></form>' +
      '</div><aside class="hx-acts" aria-label="Lo que hizo el agente"><p class="hx-k">Lo que hizo el agente</p><ol></ol>' +
        '<p class="hx-crm">Todo queda en el CRM de Hapee, con su canal de origen.</p></aside></div>' +
      '<p class="hx-nota">Cuenta de ejemplo. Escribe tu pregunta: responde la IA con el contexto del rubro.</p>';
    var $ = function (s) { return raiz.querySelector(s); };
    var rubBox = $('.hx-rub'), chBox = $('.hx-ch'), log = $('.hx-log'), sug = $('.hx-sug'), form = $('.hx-in'), inp = form.querySelector('input'),
      acts = $('.hx-acts ol'), est = $('.hx-est'), marca = $('.hx-marca'), av = $('.hx-av');

    DATA.orden.forEach(function (r) {
      var R = DATA.rubros[r];
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.className = 'hx-chip'; b.setAttribute('data-r', r);
      b.innerHTML = '<span aria-hidden="true">' + R.emoji + '</span>' + esc(R.chip);
      rubBox.appendChild(b);
    });

    function sleep(ms, tk) { return new Promise(function (ok, no) { setTimeout(function () { tk === S.run ? ok() : no('x'); }, RED ? 0 : ms); }); }
    function abajo() { log.scrollTop = log.scrollHeight; }
    function burbuja(cls, html) {
      var d = document.createElement('div'); d.className = 'hx-m ' + cls; d.innerHTML = html; log.appendChild(d); abajo(); return d;
    }
    function nota(icono, html) { return burbuja('hx-nt', svg(IC[icono] || IC.zap) + '<span>' + html + '</span>'); }
    function escribiendo(on) {
      var t = log.querySelector('.hx-typ');
      if (on && !t) { t = document.createElement('div'); t.className = 'hx-m ag hx-typ'; t.setAttribute('aria-label', 'escribiendo'); t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); abajo(); }
      if (!on && t) t.remove();
      est.textContent = on ? 'escribiendo…' : (S.estado || 'en línea');
    }
    function accion(tipo, t, d) {
      S.acc++;
      var li = document.createElement('li'); li.className = 'hx-a hx-a--' + tipo;
      li.innerHTML = svg(IC[tipo] || IC.zap) + '<span><b>' + esc(t) + '</b><small>' + esc(d || '') + '</small></span>';
      acts.appendChild(li);
      if (acts.children.length > 6) acts.removeChild(acts.firstChild);
      document.dispatchEvent(new CustomEvent('hapee:accion', { detail: { tipo: tipo, t: t, d: d, rubro: S.rub, canal: S.ch } }));
    }
    function limpiaSug() { sug.innerHTML = ''; }
    function opciones(lista, def, tk, clase) {
      /* botones tocables; espera la elección (o elige sola si nadie tocó el widget) */
      return new Promise(function (ok, no) {
        limpiaSug();
        var hecho = false, auto = null;
        lista.forEach(function (o, i) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'hx-op ' + (clase || ''); b.textContent = o;
          b.addEventListener('click', function () { fin(i); });
          sug.appendChild(b);
        });
        function fin(i) { if (hecho) return; hecho = true; clearTimeout(auto); limpiaSug(); if (tk !== S.run) return no('x'); ok(i); }
        function programa() {
          clearTimeout(auto);
          /* si ya interactuaste, te da más tiempo para elegir; si no, el guion sigue solo */
          auto = setTimeout(function () {
            if (tk !== S.run) { hecho = true; return no('x'); }
            var b = sug.children[def]; if (b) b.classList.add('hx-auto');
            setTimeout(function () { fin(def); }, RED ? 0 : 650);
          }, RED ? 0 : (S.tocado ? 9000 : 2600));
        }
        S.pend = programa; programa();
      });
    }

    async function guion(tk) {
      var R = DATA.rubros[S.rub], C = R.canales.filter(function (c) { return c.c === S.ch; })[0] || R.canales[0];
      S.estado = 'en línea';
      for (var i = 0; i < C.pasos.length; i++) {
        var p = C.pasos[i], k = p[0];
        if (tk !== S.run) return;
        if (k === 'sis') burbuja('hx-dia', esc(p[1]));
        else if (k === 'c') { await sleep(500, tk); burbuja('cl', soloB(p[1])); await sleep(500 + Math.min(1200, plano(p[1]).length * 12), tk); }
        else if (k === 'a') { escribiendo(true); await sleep(650 + Math.min(1400, plano(p[1]).length * 14), tk); escribiendo(false); burbuja('ag', soloB(p[1])); await sleep(450, tk); }
        else if (k === 'est') { S.estado = p[1] + '…'; est.textContent = S.estado; }
        else if (k === 'acc') { nota(p[1], '<b>' + esc(p[2]) + '</b> · ' + esc(p[3]) + ' <em>Agente IA</em>'); accion(p[1], p[2], p[3]); await sleep(550, tk); }
        else if (k === 'qr') { var j = await opciones(p[1], p[2], tk); burbuja('cl', esc(p[1][j])); await sleep(500, tk); }
        else if (k === 'slots') {
          escribiendo(true); await sleep(700, tk); escribiendo(false);
          burbuja('ag', '<b>' + esc(p[1]) + '</b><span class="hx-sl">' + p[2].map(esc).join(' · ') + '</span>');
          var j2 = await opciones(p[2], p[3], tk, 'hx-op--h');
          burbuja('cl', esc(j2 === p[3] && p[4] ? p[4] : p[2][j2])); await sleep(500, tk);
        }
        else if (k === 'ctx') {
          var d = p[1], q = { historia: 'Respondió a una historia', anuncio: 'Llegó desde un anuncio', post: 'Comentó una publicación', comentario: 'Comentó un video' }[d.k] || 'Origen';
          nota('zap', '<b>' + q + '</b>' + (d.t ? ' · «' + esc(d.t) + '»' : ''));
          if (d.txt) { await sleep(500, tk); burbuja('cl', esc(d.txt)); }
          await sleep(400, tk);
        }
        else if (k === 'card') {
          escribiendo(true); await sleep(700, tk); escribiendo(false);
          var cd = p[1];
          burbuja('ag hx-card', '<b>' + esc(cd.t || '') + '</b><small>' + esc(cd.s || '') + '</small>' + (cd.l ? '<span class="hx-tg">' + cd.l.map(function (x) { return '<i>' + esc(x) + '</i>'; }).join('') + '</span>' : '') + (cd.b ? '<span class="hx-cb">' + esc(cd.b) + '</span>' : ''));
          await sleep(500, tk);
        }
        else if (k === 'voz') { await sleep(500, tk); burbuja('cl hx-voz', '<span class="hx-pl" aria-hidden="true"></span><span class="hx-wv" aria-hidden="true"></span><small>' + esc(p[1]) + '</small><em>«' + esc(p[2]) + '»</em>'); await sleep(900, tk); }
        else if (k === 'hum') { nota('hum', '<b>Derivó a ' + esc(p[1]) + '</b> · ' + esc(p[2])); accion('hum', 'Derivó a ' + p[1], p[2]); await sleep(500, tk); }
        else if (k === 'pub') { burbuja('ag', '<b>Respuesta pública:</b> ' + soloB(p[1])); await sleep(500, tk); }
      }
      if (tk === S.run) libre();
    }

    function libre() {
      S.libre = true; limpiaSug();
      var R = DATA.rubros[S.rub];
      R.preguntas.slice(0, 3).forEach(function (q) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'hx-op hx-op--q'; b.textContent = q;
        b.addEventListener('click', function () { envia(q); });
        sug.appendChild(b);
      });
    }

    function sistema() {
      var R = DATA.rubros[S.rub];
      return DATA.base + '\n\n--- CUENTA DE EJEMPLO ---\nEres el agente de IA de «' + R.marca + '» (cuenta de ejemplo creada para mostrar Hapee). ' + R.contexto +
        '\nPreguntas frecuentes de la cuenta:\n' + R.faq.map(function (f) { return '- ' + f.q + ' ' + f.a; }).join('\n') +
        '\nCanal actual: ' + CANAL[S.ch][0] + '. Si te preguntan qué es esto o por Hapee: es una demo de Hapee y pueden agendar una demo en hapee.ai/agenda-tu-demo.';
    }
    function local(q) {
      var R = DATA.rubros[S.rub], t = q.toLowerCase(), mejor = null, pm = 0;
      R.faq.forEach(function (f) {
        var pal = f.q.toLowerCase().replace(/[¿?]/g, '').split(/\s+/).filter(function (w) { return w.length > 3; });
        var p = pal.filter(function (w) { return t.indexOf(w) > -1; }).length;
        if (p > pm) { pm = p; mejor = f; }
      });
      return mejor ? mejor.a + ' ¿Te ayudo con algo más?' : 'Buena pregunta. Se la dejo al equipo de ' + R.marca + ' y te responden por este mismo chat. ¿Te ayudo con algo más mientras tanto?';
    }
    async function envia(txt) {
      txt = String(txt || '').trim().slice(0, 280);
      if (!txt) return;
      S.tocado = true;
      if (!S.libre) { S.run++; escribiendo(false); limpiaSug(); S.libre = true; }
      var tk = S.run;
      if (S.enviados >= LIM) {
        burbuja('ag', 'Hasta aquí la demo 🙌 Para verlo con <b>tu negocio</b>, agenda una demo 1 a 1.');
        limpiaSug(); var a = document.createElement('a'); a.className = 'hx-op hx-op--cta'; a.href = DATA.agenda; a.textContent = 'Agendar mi demo →'; sug.appendChild(a);
        return;
      }
      S.enviados++;
      limpiaSug();
      burbuja('cl', esc(txt));
      if (S.enviados === 1) accion('crm', 'Creó contacto en el CRM', 'origen ' + CANAL[S.ch][0]);
      S.hist.push({ role: 'user', content: txt });
      escribiendo(true);
      var r = '';
      try {
        var ctl = window.AbortController ? new AbortController() : null;
        var to = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
        var res = await fetch(DATA.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined,
          body: JSON.stringify({ model: DATA.modelo, max_tokens: 300, system: sistema(), messages: S.hist.slice(-10) }) });
        clearTimeout(to);
        if (!res.ok) throw new Error('api ' + res.status);
        var j = await res.json();
        r = (j && j.content && j.content[0] && j.content[0].text) || '';
        if (!r) throw new Error('vacía');
      } catch (e) { r = local(txt); }
      if (tk !== S.run) return;
      S.hist.push({ role: 'assistant', content: r });
      escribiendo(false);
      burbuja('ag', esc(r).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'));
      if (/agend|hora|visita|test drive|evaluaci|reuni/i.test(txt + ' ' + r) && !S.agendo) { S.agendo = true; accion('agenda', 'Ofreció horas para agendar', 'según la agenda del equipo'); }
      if (S.enviados === LIM) { var a2 = document.createElement('a'); a2.className = 'hx-op hx-op--cta'; a2.href = DATA.agenda; a2.textContent = 'Verlo con mi negocio →'; sug.appendChild(a2); }
    }

    function pinta() {
      var R = DATA.rubros[S.rub];
      [].forEach.call(rubBox.children, function (b) { var on = b.getAttribute('data-r') === S.rub; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      if (!R.canales.some(function (c) { return c.c === S.ch; })) S.ch = R.canales[0].c;
      chBox.innerHTML = '';
      R.canales.forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.className = 'hx-cn'; b.setAttribute('data-c', c.c);
        b.setAttribute('aria-selected', c.c === S.ch ? 'true' : 'false'); b.tabIndex = c.c === S.ch ? 0 : -1;
        b.innerHTML = '<i style="background:' + CANAL[c.c][1] + '"></i>' + CANAL[c.c][0];
        chBox.appendChild(b);
      });
      raiz.setAttribute('data-canal', S.ch);
      raiz.style.setProperty('--hx-c', R.color);
      marca.textContent = R.cuentas[S.ch] || R.marca;
      av.textContent = ini(R.marca); av.style.background = R.color;
    }
    function arranca() {
      S.run++; S.libre = false; S.hist = []; S.enviados = 0; S.agendo = false; S.estado = 'en línea';
      log.innerHTML = ''; limpiaSug(); acts.innerHTML = ''; escribiendo(false);
      pinta();
      if (!S.visible && !RED) { S.espera = true; return; }
      S.espera = false;
      var tk = S.run;
      guion(tk).catch(function () {});
    }
    function rubro(r, avisar) {
      if (!DATA.rubros[r]) return;
      S.rub = r; S.ch = DATA.rubros[r].canales[0].c;
      arranca();
      if (avisar !== false) document.dispatchEvent(new CustomEvent('hapee:rubro', { detail: { rubro: r, origen: raiz.id } }));
    }

    rubBox.addEventListener('click', function (e) { var b = e.target.closest('[data-r]'); if (b) { S.tocado = true; rubro(b.getAttribute('data-r')); } });
    chBox.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (b && b.getAttribute('data-c') !== S.ch) { S.tocado = true; S.ch = b.getAttribute('data-c'); arranca(); } });
    $('.hx-re').addEventListener('click', function () { arranca(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value; inp.value = ''; envia(v); });
    raiz.addEventListener('pointerdown', function () { if (!S.tocado) { S.tocado = true; } });
    [rubBox, chBox].forEach(function (box) {
      box.addEventListener('keydown', function (e) {
        if (['ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0) return;
        var bs = [].slice.call(box.children), i = bs.indexOf(document.activeElement); if (i < 0) return;
        e.preventDefault(); var n = bs[(i + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length]; n.focus(); n.click();
      });
    });
    document.addEventListener('hapee:rubro', function (e) { if (e.detail && e.detail.origen !== raiz.id && e.detail.rubro !== S.rub) rubro(e.detail.rubro, false); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { S.visible = en.isIntersecting; if (S.visible && S.espera) arranca(); });
      }, { threshold: 0.25 }).observe(raiz);
    } else S.visible = true;
    rubro(S.rub, false);
    raiz.hapee = { rubro: rubro, envia: envia, estado: S };
  }
  function todo() { [].forEach.call(document.querySelectorAll('[data-hx]'), function (r, i) { if (!r.id) r.id = 'hx' + i; Widget(r); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', todo); else todo();
})();

/* Une el widget de agente con la maqueta de Hapee Pro:
   - «hapee:rubro» → cambia la cuenta de ejemplo de la maqueta (fragmento por rubro, se pide una vez y queda en caché).
   - [data-rubro-set] (chips fuera del widget) → emiten «hapee:rubro».
   - «hapee:accion» → si la maqueta está a la vista y nadie la tocó hace poco, abre la pestaña de esa acción (CRM → Pipeline…).
   - [data-paso="vista"] (recorrido por scroll o botones) → abre esa pestaña.
   - [data-ir-vista="vista"] (enlaces de módulos) → baja a la maqueta y abre la pestaña. */
(function () {
  'use strict';
  var cont = document.querySelector('[data-hm]');
  var cfg = {};
  try { cfg = JSON.parse(document.getElementById('hm-datos').textContent); } catch (e) {}
  var cache = {}, tocada = 0, actual = cont ? cont.getAttribute('data-rubro') : null;
  function raiz() { return cont && cont.querySelector('[data-hp]'); }
  function abre(v) {
    var r = raiz(); if (!r) return;
    var t = r.querySelector('.hp-tab[data-v="' + v + '"]') || r.querySelector('.ni-it[data-v="' + v + '"]');
    if (t && t.getAttribute('aria-selected') !== 'true') t.click();
  }
  function etiquetas(rub) {
    var R = cfg.rubros && cfg.rubros[rub]; if (!R) return;
    [].forEach.call(document.querySelectorAll('[data-rubro-marca]'), function (el) { el.textContent = R.marca; });
    [].forEach.call(document.querySelectorAll('[data-rubro-chip]'), function (el) { el.textContent = R.chip; });
    [].forEach.call(document.querySelectorAll('[data-rubro-set]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-rubro-set') === rub ? 'true' : 'false'); });
  }
  function cambia(rub) {
    if (!cont || !cfg.rubros || !cfg.rubros[rub] || rub === actual) { etiquetas(rub); return; }
    actual = rub; etiquetas(rub);
    var r = raiz(), vista = null;
    if (r) { var on = r.querySelector('.hp-tab[aria-selected="true"]'); vista = on && on.getAttribute('data-v'); }
    var pon = function (html) {
      if (actual !== rub) return;
      cont.classList.add('hm-cambia');
      setTimeout(function () {
        cont.innerHTML = html;
        if (window.HapeeProInit) [].forEach.call(cont.querySelectorAll('[data-hp]'), window.HapeeProInit);
        if (vista) abre(vista);
        cont.setAttribute('data-rubro', rub);
        requestAnimationFrame(function () { cont.classList.remove('hm-cambia'); });
      }, 160);
    };
    if (cache[rub]) return pon(cache[rub]);
    fetch(cfg.rubros[rub].url).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (h) { cache[rub] = h; pon(h); }).catch(function () {});
  }
  if (cont) {
    cache[actual] = cont.innerHTML;
    cont.addEventListener('pointerdown', function () { tocada = Date.now(); });
    cont.addEventListener('keydown', function () { tocada = Date.now(); });
  }
  document.addEventListener('hapee:rubro', function (e) { if (e.detail) cambia(e.detail.rubro); });
  var pIni = document.querySelector('button[data-paso][aria-pressed="true"]');
  if (pIni) abre(pIni.getAttribute('data-paso'));
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rubro-set]');
    if (b) { e.preventDefault(); document.dispatchEvent(new CustomEvent('hapee:rubro', { detail: { rubro: b.getAttribute('data-rubro-set'), origen: 'chips' } })); return; }
    var p = e.target.closest && e.target.closest('[data-paso]');
    if (p && p.tagName === 'BUTTON') { abre(p.getAttribute('data-paso')); [].forEach.call(document.querySelectorAll('button[data-paso]'), function (x) { x.setAttribute('aria-pressed', x === p ? 'true' : 'false'); }); return; }
    var iv = e.target.closest && e.target.closest('[data-ir-vista]');
    if (iv && cont) {
      e.preventDefault();
      var dest = document.getElementById(iv.getAttribute('data-ancla') || 'plataforma') || cont;
      dest.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      abre(iv.getAttribute('data-ir-vista'));
    }
  });
  var MAPA = { crm: 'negocios', agenda: 'calendario', tag: 'conversaciones', hum: 'conversaciones', mail: 'email', cotiza: 'negocios', despacho: 'negocios', stock: 'negocios', doc: 'conversaciones' };
  var visible = false;
  if (cont && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (en) { visible = en.intersectionRatio > 0.35; }); }, { threshold: [0, 0.35, 0.6] }).observe(cont);
  }
  document.addEventListener('hapee:accion', function (e) {
    if (!cont || cont.getAttribute('data-sync') !== 'on' || !visible || Date.now() - tocada < 10000) return;
    var v = MAPA[e.detail && e.detail.tipo]; if (v) abre(v);
  });
  /* recorrido por scroll: cada [data-paso] que entra al centro abre su pestaña (solo pantallas anchas) */
  var pasos = document.querySelectorAll('[data-paso]:not(button)');
  if (pasos.length && 'IntersectionObserver' in window) {
    var mq = matchMedia('(min-width: 980px)');
    var io = new IntersectionObserver(function (es) {
      if (!mq.matches) return;
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        [].forEach.call(pasos, function (p) { p.classList.toggle('on', p === en.target); });
        abre(en.target.getAttribute('data-paso'));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    [].forEach.call(pasos, function (p) { io.observe(p); });
  }
  /* aparición suave de bloques */
  var rv = document.querySelectorAll('[data-rv]');
  if (rv.length && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('rv-on');
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('rv-in'); io2.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    [].forEach.call(rv, function (el) { io2.observe(el); });
  }
})();

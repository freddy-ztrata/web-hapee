/* ═════════════════════════════════════════════════════════════════════
   «Así se ve Hapee por dentro» — escenas vivas (v3)
   Cada pestaña es una escena de ~8,5 s que reconstruye la pantalla real de
   Hapee (octubre 2026) en HTML y la anima: llegan mensajes, la IA escribe,
   los negocios cambian de columna, los números cuentan, los gráficos se
   dibujan. Diseño en un lienzo fijo de 1200×680 que se escala al marco.
   Datos: ficticios, los mismos de la subcuenta DEMO.
   ═════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var stage = document.getElementById('scStage'); if (!stage) return;
  var d = document, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Shadow DOM: la escena usa clases cortas (.hero, .ring, .chips…) que la
  // página también usa; aislarla evita que los estilos se pisen en ambos sentidos.
  var R = stage.attachShadow ? stage.attachShadow({ mode: 'open' }) : stage;
  R.innerHTML = '<link rel="stylesheet" href="/propuesta-2026-r8x4/showcase.css?v=35"><div class="sc-canvas" id="scCanvas"></div>';
  var canvas = R.getElementById ? R.getElementById('scCanvas') : stage.querySelector('#scCanvas'), tabsEl = d.getElementById('psTabs'), capEl = d.getElementById('psCap'), urlEl = d.getElementById('psUrl'), frame = d.getElementById('psFrame');
  var ROBOT = '/img/robot.png', LOGO = '/img/logo-hapee.png';

  /* ── utilidades ─────────────────────────────────────── */
  function h(html) { var t = d.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  var timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, reduce ? 0 : ms)); }
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function fmt(n, dec) { return n.toLocaleString('es-CL', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); }
  function count(node, to, ms, pre, suf, dec) {
    if (!node) return; pre = pre || ''; suf = suf || '';
    if (reduce) { node.textContent = pre + fmt(to, dec) + suf; return; }
    var t0 = performance.now(), from = 0;
    (function f(t) { var p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3); node.textContent = pre + fmt(from + (to - from) * e, dec) + suf; if (p < 1) requestAnimationFrame(f); })(t0);
  }
  function reveal(list, start, step) { list.forEach(function (n, i) { n.classList.add('sc-hide'); at(start + i * (step || 120), function () { n.classList.add('sc-show'); }); }); }
  function $(s, r) { return (r || canvas).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || canvas).querySelectorAll(s)); }
  // mueve un nodo hacia la posición de otro (en coordenadas del lienzo, que está escalado)
  function flyTo(node, target, after) {
    var s = parseFloat(getComputedStyle(canvas).getPropertyValue('--sc')) || 1;
    var a = node.getBoundingClientRect(), b = target.getBoundingClientRect();
    node.classList.add('fly');
    node.style.transform = 'translate(' + ((b.left - a.left) / s) + 'px,' + ((b.top - a.top) / s) + 'px) rotate(-2deg)';
    at(950, function () { node.style.transition = 'none'; node.style.transform = ''; node.classList.remove('fly'); after(); void node.offsetWidth; node.style.transition = ''; });
  }
  // posición de un nodo en coordenadas del lienzo (sin escala)
  function pos(n) {
    var s = parseFloat(getComputedStyle(canvas).getPropertyValue('--sc')) || 1, c = canvas.getBoundingClientRect(), r = n.getBoundingClientRect();
    return { x: (r.left - c.left) / s, y: (r.top - c.top) / s, w: r.width / s, h: r.height / s };
  }
  // lleva el cursor al centro de un elemento y, si se pide, hace clic al llegar
  function point(el, click, dx, dy) {
    var p = pos(el); cursor.classList.add('on');
    cursor.style.transform = 'translate(' + (p.x + p.w / 2 + (dx || 0)) + 'px,' + (p.y + p.h / 2 + (dy || 0)) + 'px)';
    if (click) at(1150, function () { cursor.classList.remove('click'); void cursor.offsetWidth; cursor.classList.add('click'); });
  }
  /* Arrastre como lo haría una persona: el cursor va a la tarjeta, la toma
     (se levanta), en la columna destino se abre el espacio, la lleva hasta
     ahí y la suelta. La tarjeta original queda como «fantasma» punteado
     mientras tanto, así nada salta de lugar. Duración total ≈ 3 s. */
  function drag(card, toCol, onDrop) {
    var p = pos(card), grab = { x: p.x + p.w * .55, y: p.y + 28 };
    cursor.classList.add('on');
    cursor.style.transform = 'translate(' + grab.x + 'px,' + grab.y + 'px)';
    at(1150, function () {
      cursor.classList.remove('click'); void cursor.offsetWidth; cursor.classList.add('click', 'grab');
      // la copia vive dentro de la escena (hereda sus estilos) y se ubica relativa a ella
      var root = body.firstElementChild, o = pos(root);
      var g = card.cloneNode(true); g.removeAttribute('id'); g.classList.add('drag-ghost');
      g.style.cssText = 'position:absolute;left:' + (p.x - o.x) + 'px;top:' + (p.y - o.y) + 'px;width:' + p.w + 'px;margin:0;z-index:25';
      root.appendChild(g); card.classList.add('drag-src');
      var slot = h('<div class="drop-slot"></div>'); toCol.appendChild(slot);
      requestAnimationFrame(function () { slot.style.height = p.h + 'px'; });
      at(380, function () {
        var t = pos(slot), dx = t.x - p.x, dy = t.y - p.y;
        g.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(-2.5deg) scale(1.04)';
        cursor.style.transform = 'translate(' + (grab.x + dx) + 'px,' + (grab.y + dy) + 'px)';
        at(1200, function () {
          g.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
          at(220, function () {
            cursor.classList.remove('grab');
            g.remove(); slot.replaceWith(card); card.classList.remove('drag-src'); card.classList.add('sc-flash');
            if (onDrop) onDrop();
          });
        });
      });
    });
  }
  var cursor, toast;
  function cur(x, y, click) {
    cursor.classList.add('on');
    cursor.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    if (click) at(1150, function () { cursor.classList.remove('click'); void cursor.offsetWidth; cursor.classList.add('click'); });
  }
  function say(icon, text, sub, ms) {
    toast.innerHTML = '<i>' + icon + '</i><div>' + text + (sub ? '<small>' + sub + '</small>' : '') + '</div>';
    toast.classList.add('on'); at(ms || 2600, function () { toast.classList.remove('on'); });
  }
  function bell(n) { var b = $('.sc-bell b'); if (!b) return; b.textContent = n; b.classList.add('bump'); at(300, function () { b.classList.remove('bump'); }); }

  /* ── marco de la app ────────────────────────────────── */
  var I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/>', crm: '<circle cx="9" cy="8" r="3.2"/><path d="M2.8 20c.8-3.6 3.3-5.2 6.2-5.2s5.4 1.6 6.2 5.2"/><path d="M16 5.6a3 3 0 0 1 0 5.8"/>',
    conv: '<path d="M21 14.5a2 2 0 0 1-2 2H8l-4.5 4V5.5a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2z"/>', ag: '<rect x="5" y="8.5" width="14" height="10.5" rx="3"/><path d="M12 8.5V5"/><circle cx="9.5" cy="13.5" r=".9"/><circle cx="14.5" cy="13.5" r=".9"/>',
    mkt: '<path d="M3 10.8 19.5 5v13L3 13.2z"/><path d="M7.5 14.5V18a2 2 0 0 0 4 .5"/>', web: '<circle cx="12" cy="12" r="8.6"/><path d="M3.5 12h17M12 3.5c-4.6 4.8-4.6 12.2 0 17M12 3.5c4.6 4.8 4.6 12.2 0 17"/>',
    aca: '<path d="m2.5 9 9.5-4.8L21.5 9 12 13.8z"/><path d="M6.5 11.4v4.4c0 1.4 2.6 2.7 5.5 2.7s5.5-1.3 5.5-2.7v-4.4"/>', wf: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M6 8.5v4a3 3 0 0 0 3 3h6.5"/>',
    rep: '<path d="M4 19h16M6 15l4-5 3 3 5-6"/>', lic: '<path d="M4 21h16M5 10h14M12 3 4 7h16zM7 10v8M12 10v8M17 10v8"/>', radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18 6"/>',
    media: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>', cfg: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'
  };
  var NAV = [['home', 'Inicio'], ['crm', 'CRM'], ['conv', 'Conversaciones'], ['ag', 'hapee agents'], ['mkt', 'Marketing'], ['web', 'Sitios web'], ['aca', 'Academia'], ['wf', 'Workflows'], ['rep', 'Reportería'], ['lic', 'Licitaciones'], ['radar', 'Radar de Competencia'], ['media', 'Multimedia'], ['cfg', 'Configuración']];
  function svg(k) { return '<svg viewBox="0 0 24 24">' + I[k] + '</svg>'; }
  canvas.innerHTML =
    '<div class="sc-app"><aside class="sc-side"><img class="sc-logo" src="' + LOGO + '" alt="">' +
    '<div class="sc-acct"><i>T</i><div><b>TU EMPRESA</b><small>Plan Pro</small></div></div><nav class="sc-nav">' +
    NAV.map(function (n) { return '<a data-n="' + n[0] + '"' + (n[0] === 'ag' ? ' class="ag"' : '') + '>' + svg(n[0]) + n[1] + '</a>'; }).join('') +
    '</nav><div class="sc-user"><i>SV</i><div><b>Sofía Vidal</b><small>Gerente comercial</small></div></div></aside>' +
    '<section class="sc-main"><header class="sc-top"><h4 id="scTitle">Inicio</h4><div class="sc-icons">' +
    '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6M12 17h.01"/></svg>' +
    '<svg viewBox="0 0 24 24"><path d="M20 13.5A8.5 8.5 0 1 1 10.5 4a6.6 6.6 0 0 0 9.5 9.5z"/></svg>' +
    '<span style="display:flex;align-items:center;gap:6px"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><kbd>⌘K</kbd></span>' +
    '<span class="sc-bell"><svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg><b>3</b></span>' +
    '</div></header><div class="sc-body" id="scBody"></div></section></div>' +
    '<div class="sc-toast" id="scToast"></div><div class="sc-cursor" id="scCursor"><svg viewBox="0 0 24 24"><path d="M4 2.5 19.5 12l-6.8 1.6L9 20.5z" fill="#1f1915" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div>';
  var body = R.getElementById('scBody'), title = R.getElementById('scTitle');
  cursor = R.getElementById('scCursor'); toast = R.getElementById('scToast');

  /* ═════════ ESCENAS ═════════ */
  var SCENES = [
    { k: 'home', t: 'Inicio', cap: '<b>Inicio.</b> El centro de control: lo que hay que atender hoy, los negocios abiertos y la inversión del mes, en vivo.',
      html: '<div class="s-home"><div class="hero"><h3>Bienvenida, Sofía</h3><p>Bandeja al día y campañas corriendo. Aquí tienes el pulso de tu operación.</p><img src="' + ROBOT + '" alt=""></div>' +
        '<div class="kpis"><div class="sc-card kpi"><div class="sc-k">Por responder</div><div class="sc-n" data-c="8">0</div><p>la IA ya contestó <b data-c="46">0</b></p><a>Bandeja de entrada →</a></div>' +
        '<div class="sc-card kpi"><div class="sc-k">Negocios abiertos</div><div class="sc-n" data-c="34">0</div><p><b>$50,1M</b> en pipeline</p><a>Ver pipeline →</a></div>' +
        '<div class="sc-card kpi"><div class="sc-k">Citas esta semana</div><div class="sc-n" data-c="12">0</div><p>4 agendadas por la IA</p><a>Abrir calendario →</a></div>' +
        '<div class="sc-card kpi"><div class="sc-k">Licitaciones afines</div><div class="sc-n" data-c="5">0</div><p>95% de afinidad · cierra en 3 días</p><a>Ver licitaciones →</a></div></div>' +
        '<div class="row"><div class="sc-card todo"><h5>Para resolver hoy</h5>' +
        '<div class="ti"><span class="ck"></span><span>Responder a Valentina Rojas (WhatsApp)</span><em>hace 4 min</em></div>' +
        '<div class="ti"><span class="ck"></span><span>Confirmar visita de Pedro Soto · jueves 11:00</span><em>hoy</em></div>' +
        '<div class="ti"><span class="ck"></span><span>Aprobar propuesta para Viña Montegrande</span><em>vence hoy</em></div>' +
        '<div class="ti"><span class="ck"></span><span>Revisar campaña «Oferta flash»</span><em>mañana</em></div></div>' +
        '<div class="sc-card mkt"><h5>Marketing del mes</h5><div class="g"><div>Alcance<b data-c="11.3" data-dec="1" data-suf="M">0</b><span class="sc-up">▲ 74%</span></div><div>Leads<b data-c="14568">0</b><span class="sc-up">▲ 57%</span></div><div>Inversión<b data-c="150" data-pre="$" data-suf="M">0</b><span class="sc-up">▲ 77%</span></div><div>ROAS<b data-c="18" data-suf="×">0</b><span class="sc-up">▲ 12%</span></div></div></div></div></div>',
      run: function () {
        reveal($$('.s-home .kpi'), 250, 110); reveal($$('.s-home .row > div'), 650, 140);
        at(500, function () { $$('.s-home [data-c]').forEach(function (n) { count(n, +n.dataset.c, 1500, n.dataset.pre, n.dataset.suf, +n.dataset.dec || 0); }); });
        var items = $$('.s-home .ti');
        [2400, 3500, 4600].forEach(function (t, i) { at(t, function () { items[i].classList.add('done'); }); });
        at(2600, function () { say('💬', 'La IA respondió a Valentina Rojas', 'WhatsApp · hace un momento'); bell(4); });
        at(5600, function () { say('📅', 'Visita agendada por la IA', 'Pedro Soto · jueves 11:00'); bell(5); var n = $('.s-home .kpi:nth-child(3) .sc-n'); n.textContent = '13'; n.parentNode.classList.add('sc-flash'); });
      } },

    { k: 'conv', t: 'Conversaciones', cap: '<b>Bandeja omnicanal.</b> WhatsApp, Instagram, Facebook, TikTok y email en una sola bandeja. El agente IA responde, califica y agenda; tú tomas el control cuando quieras.',
      html: '<div class="s-inbox"><div class="list"><div class="tabs"><span>No leído</span><b>Todo</b><span>Recientes</span><span>Destacado</span></div>' +
        '<div class="cv sel"><span class="av">VR<u style="background:#25d366"></u></span><div><b>Valentina Rojas</b><small id="lastV">Hola! Vi el anuncio de ustedes…</small></div><span class="t">ahora</span></div>' +
        '<div class="cv"><span class="av">DS<u style="background:#111"></u></span><div><b>Diego Salazar</b><small>jajaja qué bueno, sí quiero</small></div><span class="t">12:41</span></div>' +
        '<div class="cv"><span class="av">CN<u style="background:#1877f2"></u></span><div><b>Cristóbal Navarro</b><small>¿Y cuánto vale mensual?</small></div><span class="t">12:30</span></div>' +
        '<div class="cv"><span class="av">RC<u style="background:#e1306c"></u></span><div><b>Ricardo Castillo</b><small>como 8, pero quiero subir a diario</small></div><span class="t">11:58</span></div>' +
        '<div class="cv"><span class="av">MF<u style="background:#25d366"></u></span><div><b>Matías Fuentes</b><small>Sí, tenemos manual de marca</small></div><span class="t">11:20</span></div>' +
        '<div class="cv"><span class="av">JR<u style="background:#0a66c2"></u></span><div><b>Josefa Reyes</b><small>El jueves puedo, ¿me mandan…</small></div><span class="t">10:47</span></div></div>' +
        '<div class="chat"><div class="ch-h"><span class="av" style="width:24px;height:24px;line-height:24px;font-size:8px">VR<u style="background:#25d366;width:9px;height:9px"></u></span><b>Valentina Rojas</b><span class="open">abierta</span><div class="acts"><span>Asignada</span><span>Posponer</span><span class="ok">✓ Resolver</span></div></div>' +
        '<div class="msgs" id="msgs"></div><div class="comp">Escribe un mensaje…<span>Enviar</span></div></div>' +
        '<div class="det"><h6>Detalles del contacto</h6><div class="who"><span class="av">VR</span><div><b>Valentina Rojas</b><small>valentina@andesretail.cl</small></div></div>' +
        '<div class="f"><label>Empresa</label><div id="fEmp"></div></div><div class="f"><label>Cargo</label><div id="fCar"></div></div><div class="f"><label>Interés</label><div id="fInt"></div></div><div class="f"><label>Etapa</label><div id="fEta">Nuevo</div></div><div class="f"><label>Teléfono</label><div>+56 9 1234 5501</div></div></div></div>',
      run: function () {
        var m = R.getElementById('msgs');
        function msg(cls, text, meta) { m.appendChild(h('<div class="m ' + cls + '">' + text + '</div>')); if (meta) m.appendChild(h('<div class="meta' + (cls === 'a' ? ' r' : '') + '">' + meta + '</div>')); while (m.children.length > 14) m.removeChild(m.firstChild); }
        function typing(on) { var t = $('.typing', m); if (on && !t) m.appendChild(h('<div class="typing"><i></i><i></i><i></i></div>')); if (!on && t) t.remove(); }
        at(300, function () { msg('c', 'Hola! Vi el anuncio de ustedes en Instagram, ¿me pueden contar más del plan de marketing?', '20:42'); });
        at(1100, function () { typing(true); });
        at(2200, function () { typing(false); msg('a', '¡Hola Valentina! Claro que sí 😊 Trabajamos planes integrales con IA. ¿Tu empresa es B2B o vende a consumidor final?', '✨ <b>Respondió la IA</b> · 20:42 ✓✓'); R.getElementById('lastV').textContent = '¿Tu empresa es B2B o…'; });
        at(3300, function () { msg('c', 'B2B, somos una empresa de retail para otras tiendas', '20:43'); var f = R.getElementById('fEmp'); f.textContent = 'Andes Retail'; f.classList.add('hl'); });
        at(4000, function () { typing(true); var f = R.getElementById('fInt'); f.textContent = 'Plan Performance · B2B'; f.classList.add('hl'); });
        at(5100, function () { typing(false); msg('a', 'Perfecto: para B2B nuestro plan Performance es ideal, con leads calificados + CRM. ¿Te agendo una llamada con un especialista para mañana?', '✨ <b>Respondió la IA</b> · 20:43 ✓✓'); });
        at(6200, function () { msg('c', 'Sí, en la tarde me acomoda', '20:44'); var f = R.getElementById('fCar'); f.textContent = 'Gerente de Marketing'; f.classList.add('hl'); });
        at(7000, function () { msg('sys', '📅 Llamada agendada · mañana 16:00 · por la IA'); var f = R.getElementById('fEta'); f.textContent = 'Reunión agendada'; f.classList.add('hl'); say('📅', 'Reunión agendada automáticamente', 'Valentina Rojas · mañana 16:00'); });
      } },

    { k: 'crm', t: 'Negocios · Pipeline', cap: '<b>Pipeline.</b> Tu kanban de ventas con montos, probabilidad y responsable. Cuando el agente agenda, el negocio cambia de etapa solo.',
      html: '<div class="s-pipe"><div class="bar"><span>Abiertos: <b id="pOpen">7</b></span><span class="o">Valor abierto: <b id="pVal">$50.100.000</b></span><span>Ponderado: <b id="pW">$34.090.000</b></span><span class="w">Ganados: <b id="pWon">3 · $30.900.000</b></span><span>Perdidos: <b style="color:#dc2626">1</b></span></div>' +
        '<div class="cols">' +
        '<div class="col"><div class="ch"><i style="background:#64748b"></i>Nuevo <em id="c0">(2)</em></div><div class="tot">$5.300.000</div>' +
          '<div class="sc-card deal" id="dA"><b>Plan Performance — Andes Retail</b><p>Valor: <b style="display:inline;color:#1f1915">$4.800.000</b><br>Origen: WhatsApp · IA</p><span class="p"><i>VR</i>Valentina Rojas</span></div>' +
          '<div class="sc-card deal"><b>Marca personal LinkedIn — Estudio Amparo</b><p>Valor: $2.400.000<br>Origen: LinkedIn</p><span class="p"><i>JR</i>Josefa Reyes</span></div></div>' +
        '<div class="col" id="colC"><div class="ch"><i style="background:#2563eb"></i>Contactado <em id="c1">(0)</em></div><div class="tot">$0</div></div>' +
        '<div class="col" id="colR"><div class="ch"><i style="background:#7c3aed"></i>Reunión agendada <em id="c2">(1)</em></div><div class="tot">$12.500.000</div>' +
          '<div class="sc-card deal"><b>E-commerce + Performance — Viña Montegrande</b><p>Valor: $12.500.000<br>Cierre: 30/10</p><span class="p"><i>FM</i>Fernanda Muñoz</span></div></div>' +
        '<div class="col"><div class="ch"><i style="background:#d97706"></i>Propuesta enviada <em>(2)</em></div><div class="tot">$19.800.000</div>' +
          '<div class="sc-card deal"><b>Web corporativa — Transportes BMA</b><p>Valor: $1.800.000</p><span class="p"><i>BA</i>Benjamín Araya</span></div>' +
          '<div class="sc-card deal"><b>Plan Full Funnel — Fintual Pro</b><p>Valor: $18.000.000</p><span class="p"><i>RC</i>Ricardo Castillo</span></div></div>' +
        '<div class="col" id="colN"><div class="ch"><i style="background:#16a34a"></i>Negociación <em>(1)</em></div><div class="tot">$9.600.000</div>' +
          '<div class="sc-card deal" id="dN"><b>Gestión RRSS + Ads — Clínica Vitalis</b><p>Valor: $9.600.000<br>Probabilidad: 90%</p><span class="p"><i>CS</i>Camila Soto</span></div></div>' +
        '</div></div>',
      run: function () {
        reveal($$('.s-pipe .deal'), 200, 90);
        var A = R.getElementById('dA');
        at(900, function () { drag(A, R.getElementById('colC'), function () { R.getElementById('c0').textContent = '(1)'; R.getElementById('c1').textContent = '(1)'; say('✨', 'El agente calificó el negocio', 'Andes Retail · B2B · presupuesto confirmado'); }); });
        at(4100, function () { drag(A, R.getElementById('colR'), function () { R.getElementById('c1').textContent = '(0)'; R.getElementById('c2').textContent = '(2)'; count(R.getElementById('pW'), 36490000, 900, '$'); }); });
        at(7300, function () { cursor.classList.remove('on'); var N = R.getElementById('dN'); N.classList.add('won', 'sc-flash'); N.querySelector('p').innerHTML = 'Valor: $9.600.000<br><b style="display:inline;color:#15803d">✓ Ganado</b>'; R.getElementById('pWon').textContent = '4 · $40.500.000'; say('🎉', 'Negocio ganado: Clínica Vitalis', '$9.600.000 · Camila Soto'); bell(4); });
      } },

    { k: 'ag', t: 'Centro de agentes', cap: '<b>Agentes IA.</b> Un equipo de agentes con rol propio (SDR, soporte, recepción, cobranza, marketing) que toman tareas, las resuelven y muestran su actividad en vivo.',
      html: '<div class="s-ag"><div class="chips"><span class="t on">▦ Panel</span><span class="t">∿ Actividad</span><span class="t">▣ La Oficina</span><span class="c"><b id="aAct">6</b> agentes activos</span><span class="c2"><b id="aQ">6</b> tareas en cola</span><span class="c2"><b id="aDone">3</b> hechas hoy</span><span class="c2 ok"><i></i>Operación saludable</span></div>' +
        '<div class="grid"><div class="sc-card agents"><div class="k">AGENTES</div>' +
          [['Valentina', 'SDR', 0, '#f25a1f'], ['Max', 'Soporte', 150, '#16a34a'], ['Luna', 'Recepción', 230, '#16a34a'], ['Óscar', 'Cobranza', 40, '#94a3b8'], ['Nova', 'Marketing', 300, '#f25a1f'], ['Amara', 'SAC RRSS', 190, '#16a34a'], ['Teo', 'Setter', 90, '#f25a1f']].map(function (a, i) { return '<div class="a" data-a="' + i + '"><img src="' + ROBOT + '" style="--h:' + a[2] + 'deg" alt=""><div><b>' + a[0] + '</b><small>' + a[1] + '</small></div><u style="background:' + a[3] + '"></u></div>'; }).join('') +
        '</div><div class="kb">' +
          '<div class="kc" id="k0"><h6><i style="background:#94a3b8"></i>ENTRADA</h6><div class="sc-card task" id="tA"><b>Responder RFP de Acme Corp</b><p>Cuestionario de seguridad, 50 preguntas.</p><span class="sc-tag">Ventas</span><div class="ft"><img src="' + ROBOT + '" alt="">Valentina · 19:16</div></div></div>' +
          '<div class="kc" id="k1"><h6><i style="background:#06b6d4"></i>ASIGNADAS</h6><div class="sc-card task"><b>Investigar keywords de competidores</b><p>Top 5 competidores, gaps de SEO.</p><span class="sc-tag">SEO</span><div class="ft"><img src="' + ROBOT + '" alt="">Nova · Hoy</div></div><div class="sc-card task"><b>Secuencia de onboarding (5 correos)</b><span class="sc-tag">Email</span><div class="ft"><img src="' + ROBOT + '" alt="">Nova · Mañana</div></div></div>' +
          '<div class="kc" id="k2"><h6><i style="background:#f25a1f"></i>EN CURSO</h6><div class="sc-card task"><b>Confirmar citas de la semana</b><p>Recordatorios y reagendar caídas.</p><span class="sc-tag">Agenda</span><div class="ft"><img src="' + ROBOT + '" alt="">Luna · Hoy</div></div></div>' +
          '<div class="kc" id="k3"><h6><i style="background:#16a34a"></i>HECHAS</h6><div class="sc-card task"><b>Encontrar 20 leads fintech</b><p>Startups serie A-B que calcen con el ICP.</p><span class="sc-tag">Outbound</span><div class="ft"><img src="' + ROBOT + '" alt="">Valentina · Lista</div></div></div>' +
        '</div><div class="sc-card feed"><div class="k">ACTIVIDAD EN VIVO</div><div id="feed">' +
          '<div class="ev"><i>✓</i><div><b>Max resolvió un ticket</b><small>Consulta de facturación · hace 2 min</small></div></div>' +
          '<div class="ev"><i>↗</i><div><b>Nova detectó una tendencia</b><small>CTR +18% en campaña Meta · 5 min</small></div></div>' +
          '<div class="ev"><i>📅</i><div><b>Luna agendó una cita</b><small>Demo · jueves 10:00 · 9 min</small></div></div>' +
          '<div class="ev"><i>✉</i><div><b>Enviado a revisión</b><small>Nova: post de lanzamiento · 12 min</small></div></div>' +
        '</div></div></div></div>',
      run: function () {
        reveal($$('.s-ag .a'), 150, 70); reveal($$('.s-ag .task'), 400, 90);
        var feed = R.getElementById('feed'), A = R.getElementById('tA');
        function ev(i, t, s) { var n = h('<div class="ev sc-pop"><i>' + i + '</i><div><b>' + t + '</b><small>' + s + '</small></div></div>'); feed.insertBefore(n, feed.firstChild); while (feed.children.length > 6) feed.removeChild(feed.lastChild); }
        function hot(i) { $$('.s-ag .a').forEach(function (a) { a.classList.toggle('hot', +a.dataset.a === i); }); }
        at(1300, function () { hot(0); var ph = h('<div style="height:0"></div>'); R.getElementById('k1').insertBefore(ph, R.getElementById('k1').children[1]); flyTo(A, ph, function () { ph.replaceWith(A); }); ev('→', 'Valentina tomó una tarea', 'Responder RFP de Acme Corp · ahora'); });
        at(3000, function () { var k2 = R.getElementById('k2'); var ph = h('<div style="height:0"></div>'); k2.insertBefore(ph, k2.children[1]); flyTo(A, ph, function () { ph.replaceWith(A); }); ev('⚡', 'Estado actualizado', 'Valentina: RFP en curso · ahora'); });
        at(4300, function () { hot(2); ev('📅', 'Luna agendó una cita', 'Demo con Andes Retail · mañana 16:00'); bell(4); });
        at(5600, function () { hot(0); var k3 = R.getElementById('k3'); var ph = h('<div style="height:0"></div>'); k3.insertBefore(ph, k3.children[1]); flyTo(A, ph, function () { ph.replaceWith(A); A.classList.add('sc-flash'); }); ev('✓', 'Tarea completada', 'Valentina: RFP respondido (50/50) · ahora'); count(R.getElementById('aDone'), 4, 400); count(R.getElementById('aQ'), 5, 400); });
        at(6900, function () { say('✓', 'Valentina terminó el RFP de Acme Corp', '50 preguntas respondidas · enviado a revisión'); });
      } },

    { k: 'wf', t: 'Workflows', cap: '<b>Automatizaciones.</b> Flujos visuales sin código: un disparador, esperas, envíos y condiciones que trabajan mientras duermes.',
      html: (function () {
        // área de dibujo = cuerpo de la app: 978 × 608 px; los nodos y las líneas comparten estas coordenadas
        var Y = 268, X = [96, 254, 412, 570, 728], N = [
          ['trg', '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/>', 'Etiqueta agregada', '«demo realizada»'],
          ['', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 'Esperar 1 día', '1 d'],
          ['mail', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>', 'Enviar propuesta', 'plantilla «Propuesta»'],
          ['', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 'Esperar 2 días', '2 d'],
          ['', '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M6 8.5v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2M12 13.5v2"/>', '¿Respondió?', 'condición']];
        var edges = '';
        for (var i = 0; i < 4; i++) edges += '<path class="edge" d="M' + (X[i] + 26) + ' ' + Y + ' H' + (X[i + 1] - 26) + '"/>';
        edges += '<path class="edge" id="eY" d="M' + (X[4] + 26) + ' ' + Y + ' C' + (X[4] + 60) + ' ' + Y + ' ' + (X[4] + 40) + ' 178 790 178"/>' +
                 '<path class="edge dash" d="M' + (X[4] + 26) + ' ' + Y + ' C' + (X[4] + 60) + ' ' + Y + ' ' + (X[4] + 40) + ' 358 790 358"/>';
        return '<div class="s-wf"><div class="tb"><b>Post-demo comercial</b><span class="t on">Creador</span><span class="t">Configuración</span><span class="t">Historial</span><span class="t">Registros</span><div class="r"><span class="live"><span class="dot-live"></span>Activo</span><span class="sc-btn ghost" style="height:26px">▷ Probar</span><span class="sc-btn" style="height:26px">Publicar</span></div></div>' +
          '<svg class="edges" viewBox="0 0 978 608" width="978" height="608">' + edges + '<circle class="pulse" r="6" cx="' + X[0] + '" cy="' + Y + '" id="pls"/></svg>' +
          N.map(function (n, i) { return '<div class="node ' + n[0] + '" id="n' + i + '" style="left:' + X[i] + 'px;top:' + (Y - 26) + 'px"><span class="ok">✓</span><div class="ic"><svg viewBox="0 0 24 24">' + n[1] + '</svg></div><b>' + n[2] + '</b><small>' + n[3] + '</small></div>'; }).join('') +
          '<div class="sc-card br" id="bY" style="left:790px;top:146px"><span class="sc-tag" style="background:#dcfce7;color:#15803d">Sí</span><b>Agendar reunión de cierre</b><small>pasa a Negociación</small></div>' +
          '<div class="sc-card br" style="left:790px;top:326px"><span class="sc-tag">No</span><b>Email «¿Lo dejamos aquí?»</b><small>y etiqueta como frío</small></div>' +
          '<div class="sc-card cnt"><div class="sc-k">Contactos en el flujo</div><div class="sc-n" id="wfN">128</div><span class="sc-up">62% respondió</span></div>' +
          '<div class="sc-card log"><div class="sc-k">Registro de ejecución · Valentina Rojas</div><div id="log"></div></div></div>';
      })(),
      run: function () {
        var X = [96, 254, 412, 570, 728], pls = R.getElementById('pls'), log = R.getElementById('log');
        var L = [['20:01', 'Entró al flujo: etiqueta «demo realizada»'], ['20:01', 'Esperando 1 día'], ['día 2', 'Propuesta enviada · abierta 2 veces'], ['día 2', 'Esperando 2 días'], ['día 4', 'Respondió → rama «Sí»']];
        function line(t, s) { log.appendChild(h('<div class="sc-pop"><em>' + t + '</em>' + s + '</div>')); while (log.children.length > 3) log.removeChild(log.firstChild); }
        reveal($$('.s-wf .node, .s-wf .br'), 150, 90);
        if (!reduce) pls.style.transition = 'cx 1s cubic-bezier(.65,0,.35,1)';
        X.forEach(function (x, i) {
          at(700 + i * 1250, function () {
            $$('.s-wf .node').forEach(function (n) { n.classList.remove('lit'); });
            R.getElementById('n' + i).classList.add('lit', 'done');
            pls.setAttribute('cx', x); line(L[i][0], L[i][1]);
          });
        });
        at(6100, function () { $$('.s-wf .node').forEach(function (n) { n.classList.remove('lit'); }); pls.style.opacity = 0; R.getElementById('eY').classList.add('hot'); R.getElementById('bY').classList.add('win', 'sc-flash'); count(R.getElementById('wfN'), 129, 400); say('⚡', 'Reunión de cierre agendada por el flujo', 'Valentina Rojas · pasa a Negociación'); });
      } },

    { k: 'mkt', t: 'Email marketing', cap: '<b>Email marketing.</b> Plantillas listas por objetivo (re-engagement, encuestas, reseñas, carrito abandonado). Elige una, edítala y prográmala en minutos.',
      html: '<div class="s-mail"><div class="seg"><span>✈ Campañas</span><span class="on">▦ Plantillas</span><span>∿ Rendimiento</span></div>' +
        '<div class="hint">🎨 Elige una plantilla y toca «Usar plantilla» para crear tu campaña con ese diseño.</div>' +
        '<div class="chips"><span id="chA" class="on">Todas las plantillas<i>46</i></span><span>Calendario<i>30</i></span><span id="chM">Marketing<i>12</i></span><span>Transaccional<i>4</i></span></div>' +
        '<div class="tpls">' +
        [['Encuesta · 2 min', 'Ayúdanos a mejorar', 'Son solo 5 preguntas y te toma 2 minutos.', 'Responder encuesta', 'Survey request', '#fff'], ['', 'Te extrañamos 👋', 'Hace tiempo que no sabemos de ti. Pasaron cosas nuevas que te pueden interesar.', 'Ver qué hay nuevo', 'Re-engagement', '#fff8ec'], ['★★★★★', '¿Qué te pareció?', 'Nos encantaría saber tu opinión sobre tu última experiencia.', 'Dejar mi opinión', 'Review request', '#fff'], ['', '🛒 Tu carrito te espera', 'Dejaste productos guardados. Siguen disponibles, pero no por mucho tiempo.', 'Volver al carrito', 'Carrito abandonado', '#fffbe6']].map(function (t, i) {
          return '<div class="sc-card tp" id="tp' + i + '"><div class="pv" style="background:' + t[5] + '"><small>' + t[0] + '</small><b>' + t[1] + '</b><p>' + t[2] + '</p><span>' + t[3] + '</span></div><div class="in"><b>' + t[4] + '</b><small>MARKETING</small><span class="sc-btn">Usar plantilla</span></div></div>';
        }).join('') + '</div>' +
        '<div class="sc-card ed" id="ed"><div class="cv"><div class="mail"><div class="lg">hapee</div><div style="font-size:26px">👋</div><b>Te extrañamos, Diego</b><p>Hace tiempo que no sabemos de ti. Este mes lanzamos agentes de IA y nuevas plantillas que te pueden interesar.</p><span>Ver qué hay nuevo</span></div></div>' +
        '<div class="side"><div class="sc-k">Campaña</div><label>Asunto</label><div class="in car" id="subj"></div><label>Audiencia</label><div class="in">Inactivos 60 días · 1.284 contactos</div><label>Envío</label><div class="in" id="when">—</div><div style="margin-top:14px"><span class="sc-btn" id="prog">Guardar y programar</span></div></div></div></div>',
      run: function () {
        reveal($$('.s-mail .tp'), 200, 120);
        var chM = R.getElementById('chM'), tp = R.getElementById('tp1');
        at(700, function () { point(chM, true); });
        at(1950, function () { R.getElementById('chA').classList.remove('on'); chM.classList.add('on'); $$('.s-mail .tp').forEach(function (t, i) { t.classList.remove('sc-show'); void t.offsetWidth; at(i * 90, function () { t.classList.add('sc-show'); }); }); });
        at(2700, function () { tp.classList.add('pick'); point(tp.querySelector('.sc-btn'), true); });
        at(4050, function () { cursor.classList.remove('on'); R.getElementById('ed').classList.add('on'); });
        var s = 'Te extrañamos, {nombre} 👋', subj = R.getElementById('subj');
        at(4500, function () { var i = 0; (function ty() { subj.textContent = s.slice(0, ++i); if (i < s.length) timers.push(setTimeout(ty, reduce ? 0 : 55)); })(); });
        at(6100, function () { point(R.getElementById('prog'), true); });
        at(7300, function () { cursor.classList.remove('on'); subj.classList.remove('car'); R.getElementById('when').textContent = 'Mañana 10:00 (mejor hora de apertura)'; R.getElementById('prog').textContent = '✓ Programada'; say('✉', 'Campaña programada', '1.284 contactos · mañana 10:00'); });
      } },

    { k: 'aca', t: 'Academia', cap: '<b>Academia.</b> Cursos cortos para dejar Hapee funcionando, con avance por persona y un ranking que motiva a todo el equipo.',
      html: '<div class="s-aca"><div class="grid"><div><div class="ban"><small>CONTINÚA DONDE IBAS</small><b>Agentes de IA que venden</b><div style="font-size:11px;opacity:.9">Lección 4 de 6 · Entrena a tu agente con tus precios</div><span>Seguir aprendiendo →</span><img src="' + ROBOT + '" alt=""></div>' +
        '<div class="courses">' + [['SETUP', 'Setup Hapee desde cero', '9 lecciones · 72 min', 100, 'linear-gradient(135deg,#3b2a33,#7a3b4f)', '🖥️'], ['VENTAS', 'Vende con Hapee', '6 lecciones · 42 min', 66, 'linear-gradient(135deg,#4a2a1f,#a0522d)', '🏆'], ['IA', 'Agentes de IA que venden', '6 lecciones · 42 min', 83, 'linear-gradient(135deg,#1f2a44,#5b3a8f)', '🤖'], ['OPERACIONES', 'Onboarding de clientes', '3 lecciones · 21 min', 33, 'linear-gradient(135deg,#3a1f5b,#7c3aed)', '✅'], ['AUTOMATIZACIÓN', 'Automatiza con Workflows', '6 lecciones · 42 min', 16, 'linear-gradient(135deg,#4a1f1f,#c2410c)', '⚡'], ['DATOS', 'Reportería que decide', '6 lecciones · 42 min', 50, 'linear-gradient(135deg,#2a1f3a,#be185d)', '📊']].map(function (c, i) {
          return '<div class="sc-card co"><div class="th" style="background:' + c[4] + '"><small>' + c[0] + '</small>' + c[5] + '</div><div class="in"><b>' + c[1] + '</b><p>' + c[2] + ' · <em class="' + (c[3] === 100 ? 'ok' : '') + '" data-p="' + c[3] + '">' + (c[3] === 100 ? '✓ Completado' : c[3] + '%') + '</em></p><div class="pb"><i data-w="' + c[3] + '"></i></div></div></div>';
        }).join('') + '</div></div>' +
        '<div class="sc-card rank" style="position:relative;height:420px"><h6>🏆 Ranking del equipo</h6><div id="rk"></div></div></div></div>',
      run: function () {
        var people = [['Rocío Segura', 465], ['Camila San Martín', 450], ['José Güerere', 405], ['Sofía Vidal', 395], ['Leidy Salina', 390], ['Jaime León', 375], ['Matías Laporta', 360], ['Giorgina Zanotti', 345], ['Claudia Novoa', 315], ['Sebastián Figueroa', 300]];
        var rk = R.getElementById('rk');
        people.forEach(function (p, i) { rk.appendChild(h('<div class="rk" data-i="' + i + '" style="top:' + (40 + i * 34) + 'px"><em>' + (i + 1) + '</em>' + p[0] + '<span>' + p[1] + ' pts</span></div>')); });
        reveal($$('.s-aca .co'), 200, 90);
        at(700, function () { $$('.s-aca .pb i').forEach(function (b) { b.style.width = b.dataset.w + '%'; }); });
        at(3000, function () { var b = $$('.s-aca .pb i')[2], e = $$('.s-aca em[data-p]')[2]; b.style.width = '100%'; e.textContent = '✓ Completado'; e.classList.add('ok'); say('🎓', 'Sofía completó «Agentes de IA que venden»', '+70 pts · certificado listo'); });
        at(4300, function () {
          var me = $('.rk[data-i="3"]', rk); me.classList.add('up'); me.querySelector('span').textContent = '465 pts';
          // Sofía sube del 4.º al 2.º lugar
          var order = [0, 3, 1, 2, 4, 5, 6, 7, 8, 9];
          order.forEach(function (idx, pos) { var r = $('.rk[data-i="' + idx + '"]', rk); r.style.top = (40 + pos * 34) + 'px'; r.querySelector('em').textContent = pos + 1; });
        });
        at(6200, function () { say('🔥', 'Tu equipo completó 12 lecciones esta semana', '+38% frente a la semana pasada'); });
      } },

    { k: 'rep', t: 'Reportería', cap: '<b>Reportería.</b> Meta Ads, Google Ads, TikTok, LinkedIn y GA4 en un solo tablero: inversión, resultados por canal, embudo y retorno, día a día.',
      html: '<div class="s-rep2">' +
        '<div class="hd"><div class="tabs"><span class="on">Resumen</span><span>Meta Ads</span><span>Google Ads</span><span>TikTok</span><span>LinkedIn</span><span>GA4</span></div><span class="dt">📅 1 oct → 15 oct 2026 ▾</span></div>' +
        '<div class="kp">' + [['Inversión', 6937734, '$', '', '▲ 47,2%'], ['Leads', 2148, '', '', '▲ 36,8%'], ['Costo por lead', 3230, '$', '', '▼ 7,4%'], ['Ventas', 312, '', '', '▲ 29,1%'], ['ROAS', 18, '', '×', '▲ 12%']].map(function (k) { return '<div class="sc-card"><div class="sc-k">' + k[0] + '</div><div class="sc-n" data-c="' + k[1] + '" data-pre="' + k[2] + '" data-suf="' + k[3] + '">0</div><span class="sc-up">' + k[4] + '</span></div>'; }).join('') + '</div>' +
        '<div class="row1"><div class="sc-card big"><div class="t"><span class="sc-k">Inversión vs. leads por día</span><span class="lg"><i style="background:#f25a1f"></i>Inversión <i style="background:#7c3aed"></i>Leads</span></div>' + area() + '</div>' +
        '<div class="sc-card donut"><div class="t"><span class="sc-k">Leads por canal</span></div>' + donut() + '</div></div>' +
        '<div class="row2"><div class="sc-card bars"><div class="t"><span class="sc-k">Ventas por canal</span></div>' + hbars() + '</div>' +
        '<div class="sc-card funnel"><div class="t"><span class="sc-k">Embudo del mes</span></div>' + funnel() + '</div>' +
        '<div class="sc-card heat"><div class="t"><span class="sc-k">Mejores horas para responder</span></div>' + heat() + '</div></div></div>',
      run: function () {
        at(200, function () { $$('.s-rep2 [data-c]').forEach(function (n) { count(n, +n.dataset.c, 1600, n.dataset.pre, n.dataset.suf); }); });
        at(300, function () { $$('.s-rep2 .ln').forEach(function (l, i) { setTimeout(function () { l.classList.add('go'); }, reduce ? 0 : i * 300); }); var ar = $('.s-rep2 .ar'); if (ar) ar.classList.add('go'); });
        at(700, function () { $$('.s-rep2 .seg').forEach(function (g, i) { setTimeout(function () { g.style.strokeDasharray = g.dataset.d + ' 999'; }, reduce ? 0 : i * 200); }); count(R.getElementById('dTot'), 2148, 1500); });
        at(1100, function () { $$('.s-rep2 .hb i').forEach(function (b, i) { setTimeout(function () { b.style.width = b.dataset.w + '%'; }, reduce ? 0 : i * 140); }); });
        at(1500, function () { $$('.s-rep2 .fn i').forEach(function (b, i) { setTimeout(function () { b.style.width = b.dataset.w + '%'; }, reduce ? 0 : i * 160); }); });
        at(1800, function () { $$('.s-rep2 .hm i').forEach(function (c, i) { setTimeout(function () { c.style.opacity = c.dataset.o; }, reduce ? 0 : (i % 12) * 40); }); });
        at(4400, function () { say('📈', 'Nova: Meta Ads trae los leads más baratos esta semana', 'Sugiere mover $300.000 desde Google Ads'); });
        at(6600, function () { var t = $$('.s-rep2 .tabs span'); t[0].classList.remove('on'); t[1].classList.add('on'); });
      } },

    { k: 'lic', t: 'Licitaciones', cap: '<b>Licitaciones.</b> Hapee escanea Mercado Público todo el día, descarta lo que no calza con tu rubro y te avisa cuando aparece una oportunidad con alta afinidad, con el porqué y en un clic al pipeline.',
      html: '<div class="s-lic2">' +
        '<div class="sc-card scan"><div class="sh"><span class="lv"><i></i>Escaneando Mercado Público</span><span class="sc-k">hoy</span></div>' +
          '<div class="rad"><div class="rings"></div><div class="sweep"></div><div id="blips"></div><div class="core"><b id="lN">0</b><small>analizadas</small></div></div>' +
          '<div class="feed" id="lFeed"></div></div>' +
        '<div class="right"><div class="stats"><div class="sc-card st"><div class="sc-k">Afines hoy</div><div class="sc-n" id="lA">0</div></div><div class="sc-card st hot"><div class="sc-k">HOT · ≥ 80%</div><div class="sc-n" id="lH">0</div></div><div class="sc-card st"><div class="sc-k">Monto en juego</div><div class="sc-n" id="lM">$0</div></div></div>' +
          '<div class="ops" id="ops">' + [[87, 'Community management y pauta digital universitaria', 'Universidad de Chile · cierra en 4 días', '$12.800.000'], [85, 'Servicio de marketing digital y gestión de redes', 'Municipalidad de Providencia · 6 días', '$18.500.000'], [81, 'Plataforma CRM y automatización ciudadana', 'Ministerio de Economía · 15 días', '$58.000.000']].map(op).join('') + '</div></div></div>',
      run: function () {
        var feed = R.getElementById('lFeed'), blips = R.getElementById('blips');
        var ITEMS = [['Suministro de mobiliario escolar', 0], ['Pauta digital para campaña de salud', 1], ['Mantención de ascensores', 0], ['Arriendo de vehículos', 0], ['Desarrollo de sitio web institucional', 1], ['Compra de insumos médicos', 0], ['Producción audiovisual regional', 1], ['Servicio de aseo', 0], ['Campañas digitales salud preventiva', 2]];
        function blip(hot) { var a = Math.random() * 6.28, r = 22 + Math.random() * 46; var n = h('<i class="' + (hot ? 'hot' : '') + '" style="left:calc(50% + ' + (Math.cos(a) * r).toFixed(0) + '%);top:calc(50% + ' + (Math.sin(a) * r).toFixed(0) + '%)"></i>'); blips.appendChild(n); at(2600, function () { n.remove(); }); }
        count(R.getElementById('lN'), 1284, 7200);
        ITEMS.forEach(function (it, i) {
          at(300 + i * 560, function () {
            blip(it[1] > 0);
            var n = h('<div class="fi ' + (it[1] ? 'ok' : 'no') + '"><span>' + it[0] + '</span><em>' + (it[1] === 2 ? '97% · HOT' : it[1] ? 'afín' : 'descartada') + '</em></div>');
            feed.insertBefore(n, feed.firstChild); while (feed.children.length > 6) feed.removeChild(feed.lastChild);
          });
        });
        at(400, function () { count(R.getElementById('lA'), 5, 900); count(R.getElementById('lH'), 3, 900); count(R.getElementById('lM'), 89300000, 1500, '$'); });
        at(900, function () { $$('.s-lic2 .fg').forEach(function (c, i) { setTimeout(function () { c.style.strokeDashoffset = 126 - 126 * c.dataset.v / 100; }, reduce ? 0 : i * 180); }); });
        at(5000, function () {
          var ops = R.getElementById('ops'), n = h(op([97, 'Campañas digitales para programa de salud preventiva', 'Gobierno Regional de Valparaíso · cierra en 18 días', '$32.000.000']));
          n.classList.add('new');
          n.querySelector('.txt').insertAdjacentHTML('beforeend', '<ul class="why"><li>Tu rubro: marketing digital y pauta</li><li>Monto dentro de tu rango</li><li>Plazo con margen para postular</li></ul><span class="sc-btn mk">+ Crear negocio</span>');
          ops.insertBefore(n, ops.firstChild); ops.removeChild(ops.lastChild);
          setTimeout(function () { n.querySelector('.fg').style.strokeDashoffset = 126 - 126 * .97; }, reduce ? 0 : 120);
          count(R.getElementById('lA'), 6, 500); count(R.getElementById('lH'), 4, 500); count(R.getElementById('lM'), 121300000, 900, '$');
          say('🎯', 'Nueva licitación con 97% de afinidad', 'Gobierno Regional de Valparaíso · $32.000.000'); bell(4);
          at(1100, function () { point(n.querySelector('.mk'), true); });
          at(2350, function () { cursor.classList.remove('on'); var b = n.querySelector('.mk'); b.textContent = '✓ En el pipeline'; b.classList.add('done'); say('💼', 'Negocio creado en el pipeline', 'Etapa: Preparando postulación'); });
        });
      } }
  ];

  function area() {
    var W = 560, H = 150, n = 15, inv = [], lead = [];
    for (var i = 0; i < n; i++) { inv.push(70 + Math.sin(i * .8) * 22 + i * 2.2); lead.push(60 + Math.cos(i * .7 + 1) * 18 + i * 2.8); }
    var x = function (i) { return 34 + i * (W - 44) / (n - 1); }, y = function (v) { return H - v * .8; };
    var path = function (a) { return a.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' '); };
    var areaP = path(inv) + ' L' + x(n - 1) + ' ' + H + ' L' + x(0) + ' ' + H + ' Z';
    return '<svg viewBox="0 0 ' + W + ' ' + (H + 18) + '"><defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f25a1f" stop-opacity=".28"/><stop offset="1" stop-color="#f25a1f" stop-opacity="0"/></linearGradient></defs>' +
      '<g class="gl">' + [30, 60, 90, 120, 150].map(function (v) { return '<line x1="34" x2="' + (W - 10) + '" y1="' + v + '" y2="' + v + '"/>'; }).join('') + '</g>' +
      '<path class="ar" d="' + areaP + '" fill="url(#gA)"/>' +
      '<path class="ln" style="--len:900;stroke:#f25a1f" d="' + path(inv) + '"/><path class="ln" style="--len:900;stroke:#7c3aed;stroke-dasharray:var(--len)" d="' + path(lead) + '"/>' +
      ['01 oct', '05 oct', '09 oct', '13 oct'].map(function (t, i) { return '<text class="ax" x="' + (30 + i * 168) + '" y="' + (H + 14) + '">' + t + '</text>'; }).join('') + '</svg>';
  }
  function donut() {
    var D = [['Meta Ads', 46, '#0866ff'], ['Google Ads', 24, '#34a853'], ['WhatsApp orgánico', 17, '#25d366'], ['TikTok', 13, '#1f1915']], C = 2 * Math.PI * 46, off = 0, segs = '', lg = '';
    D.forEach(function (d) { var len = C * d[1] / 100; segs += '<circle class="seg" data-d="' + (len - 2).toFixed(1) + '" cx="60" cy="60" r="46" stroke="' + d[2] + '" stroke-dashoffset="' + (-off).toFixed(1) + '"/>'; off += len; lg += '<li><i style="background:' + d[2] + '"></i>' + d[0] + '<b>' + d[1] + '%</b></li>'; });
    return '<div class="dn"><svg viewBox="0 0 120 120">' + segs + '</svg><div class="ct"><b id="dTot">0</b><small>leads</small></div></div><ul class="dl">' + lg + '</ul>';
  }
  function hbars() {
    return [['Meta Ads', 132, 100, '#0866ff'], ['Google Ads', 81, 61, '#34a853'], ['WhatsApp', 64, 48, '#25d366'], ['TikTok', 35, 27, '#1f1915']].map(function (b) {
      return '<div class="hb"><span>' + b[0] + '</span><div><i data-w="' + b[2] + '" style="background:' + b[3] + '"></i></div><b>' + b[1] + '</b></div>'; }).join('');
  }
  function funnel() {
    return [['Visitas', '48.210', 100], ['Leads', '2.148', 68], ['Calificados por IA', '1.034', 46], ['Reuniones', '418', 30], ['Ventas', '312', 20]].map(function (f) {
      return '<div class="fn"><i data-w="' + f[2] + '"></i><span>' + f[0] + '</span><b>' + f[1] + '</b></div>'; }).join('');
  }
  function heat() {
    var cells = '', days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    days.forEach(function (d, r) { cells += '<em>' + d + '</em>'; for (var c = 0; c < 12; c++) { var v = Math.max(.08, Math.min(1, (Math.sin((c - 3) / 2.4) * .5 + .45) * (r > 4 ? .55 : 1) + ((r * 7 + c * 3) % 5) * .05)); cells += '<i data-o="' + v.toFixed(2) + '"></i>'; } });
    return '<div class="hm">' + cells + '</div><div class="hx"><span>8h</span><span>14h</span><span>20h</span></div>';
  }
  function op(o) {
    return '<div class="sc-card op"><div class="ring"><svg viewBox="0 0 46 46"><circle class="bg" cx="23" cy="23" r="20"/><circle class="fg" data-v="' + o[0] + '" cx="23" cy="23" r="20"/></svg><b>' + o[0] + '%</b></div><div class="txt"><h6>' + o[1] + '</h6><p>' + o[2] + '</p><div class="m">' + o[3] + '</div></div></div>';
  }


  /* ═════════ MOTOR: pestañas, escala, avance automático ═════════ */
  var DUR = 8600, cur_ = 0, prog = null, visible = false, hover = false, pending = false;
  SCENES.forEach(function (s, i) {
    var b = d.createElement('button');
    b.className = 'ps-tab'; b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'psView');
    b.setAttribute('aria-selected', i ? 'false' : 'true'); b.tabIndex = i ? -1 : 0;
    b.innerHTML = '<span>' + ({ home: 'Inicio', conv: 'Bandeja omnicanal', crm: 'Pipeline', ag: 'Agentes IA', wf: 'Automatizaciones', mkt: 'Email marketing', aca: 'Academia', rep: 'Reportería', lic: 'Licitaciones' })[s.k] + '</span><i class="ps-prog"></i>';
    b.addEventListener('click', function () { go(i, true); });
    tabsEl.appendChild(b);
  });
  // En pantallas angostas se recorta la barra lateral de la app (202 px) y se
  // amplía el área de trabajo, para que la escena se lea en un celular.
  function fit() {
    var narrow = stage.clientWidth < 640, W = narrow ? 998 : 1200;
    stage.style.aspectRatio = W + '/680';
    canvas.style.setProperty('--sc', (stage.clientWidth / W).toFixed(4));
    canvas.style.setProperty('--ox', narrow ? '-202px' : '0px');
  }
  fit(); window.addEventListener('resize', fit);

  function go(i, user) {
    clear(); if (prog) prog.cancel(); pending = false;
    cur_ = (i + SCENES.length) % SCENES.length;
    var s = SCENES[cur_], btns = Array.prototype.slice.call(tabsEl.children);
    btns.forEach(function (b, j) { b.setAttribute('aria-selected', j === cur_ ? 'true' : 'false'); b.tabIndex = j === cur_ ? 0 : -1; });
    if (user && innerWidth < 761) btns[cur_].scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    $$('.sc-nav a').forEach(function (a) { a.classList.toggle('on', a.dataset.n === s.k); });
    title.textContent = s.t; urlEl.textContent = 'app.hapee.ai · ' + s.t; capEl.innerHTML = s.cap;
    toast.classList.remove('on'); cursor.classList.remove('on', 'click'); cursor.style.transform = 'translate(700px,560px)';
    var b = $('.sc-bell b'); if (b) b.textContent = '3';
    body.innerHTML = s.html;
    body.firstElementChild.classList.add('sc-pop');
    s.run();
    if (!reduce && visible && !d.hidden) {
      prog = btns[cur_].querySelector('.ps-prog').animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: DUR, easing: 'linear', fill: 'forwards' });
      at(DUR, function () { if (hover) pending = true; else go(cur_ + 1); });
    }
  }
  function sync() {
    var run = visible && !d.hidden;
    if (run) go(cur_); else { clear(); if (prog) prog.pause(); }
  }
  new IntersectionObserver(function (es) { var v = es[0].isIntersecting; if (v !== visible) { visible = v; sync(); } }, { threshold: .35 }).observe(frame);
  // con el mouse encima la escena sigue animándose; solo se detiene el paso a la siguiente
  frame.addEventListener('pointerenter', function () { hover = true; if (prog) prog.pause(); });
  frame.addEventListener('pointerleave', function () { hover = false; if (prog) prog.play(); if (pending) { pending = false; go(cur_ + 1); } });
  d.addEventListener('visibilitychange', sync);
  tabsEl.addEventListener('keydown', function (e) {
    var k = e.key, n = k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0;
    if (k === 'Home') go(0, true); else if (k === 'End') go(SCENES.length - 1, true); else if (n) go(cur_ + n, true); else return;
    e.preventDefault(); tabsEl.children[cur_].focus();
  });
  go(0);
})();

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
  R.innerHTML = '<link rel="stylesheet" href="/propuesta-2026-r8x4/showcase.css?v=31"><div class="sc-canvas" id="scCanvas"></div>';
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
        at(1500, function () { cur(120, 210, true); });
        at(2700, function () { var ph = h('<div class="sc-card deal" style="opacity:0;height:0;padding:0;margin:0"></div>'); R.getElementById('colC').appendChild(ph); flyTo(A, ph, function () { ph.replaceWith(A); R.getElementById('c0').textContent = '(1)'; R.getElementById('c1').textContent = '(1)'; }); cur(330, 160); });
        at(4200, function () { say('✨', 'El agente calificó el negocio', 'Andes Retail · B2B · presupuesto confirmado'); });
        at(4900, function () { var target = R.getElementById('colR'); var ph = h('<div class="sc-card deal" style="opacity:0;height:0;padding:0;margin:0"></div>'); target.appendChild(ph); flyTo(A, ph, function () { ph.replaceWith(A); A.classList.add('sc-flash'); R.getElementById('c1').textContent = '(0)'; R.getElementById('c2').textContent = '(2)'; }); cur(560, 260); });
        at(6300, function () { count(R.getElementById('pW'), 36490000, 900, '$'); });
        at(6900, function () { var N = R.getElementById('dN'); N.classList.add('won', 'sc-flash'); N.querySelector('p').innerHTML = 'Valor: $9.600.000<br><b style="display:inline;color:#15803d">✓ Ganado</b>'; R.getElementById('pWon').textContent = '4 · $40.500.000'; say('🎉', 'Negocio ganado: Clínica Vitalis', '$9.600.000 · Camila Soto'); bell(4); });
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
      html: '<div class="s-wf"><div class="tb"><b>Post-demo comercial</b><span class="t on">Creador</span><span class="t">Configuración</span><span class="t">Historial</span><span class="t">Registros</span><div class="r"><span class="live"><span class="dot-live"></span>Activo</span><span class="sc-btn ghost" style="height:26px">▷ Probar</span><span class="sc-btn" style="height:26px">Publicar</span></div></div>' +
        '<svg class="edges" viewBox="0 0 1000 628" preserveAspectRatio="none"><path class="edge" d="M90 250 H240"/><path class="edge" d="M240 250 H390"/><path class="edge" d="M390 250 H540"/><path class="edge" d="M540 250 H680"/><path class="edge" d="M680 250 C720 250 720 170 750 170"/><path class="edge dash" d="M680 250 C720 250 720 330 750 330"/><circle class="pulse" r="6" cx="90" cy="250" id="pls"/></svg>' +
        '<div class="node trg" id="n0" style="left:9%;top:40%"><span class="ok">✓</span><div class="ic"><svg viewBox="0 0 24 24"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/></svg></div><b>Etiqueta agregada</b><small>«demo realizada»</small></div>' +
        '<div class="node" id="n1" style="left:24%;top:40%"><span class="ok">✓</span><div class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><b>Esperar 1 día</b><small>1d</small></div>' +
        '<div class="node mail" id="n2" style="left:39%;top:40%"><span class="ok">✓</span><div class="ic"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/></svg></div><b>Enviar propuesta</b><small>«Tu propuesta personalizada»</small></div>' +
        '<div class="node" id="n3" style="left:54%;top:40%"><span class="ok">✓</span><div class="ic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div><b>Esperar 2 días</b><small>2d</small></div>' +
        '<div class="node" id="n4" style="left:68%;top:40%"><span class="ok">✓</span><div class="ic"><svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M6 8.5v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2M12 13.5v2"/></svg></div><b>¿Respondió la propuesta?</b><small>condición</small></div>' +
        '<div class="sc-card br" id="bY" style="left:75%;top:27%"><span class="sc-tag" style="background:#dcfce7;color:#15803d">Sí</span><b>Agendar reunión de cierre</b><small>pasa a Negociación</small></div>' +
        '<div class="sc-card br" style="left:75%;top:53%"><span class="sc-tag">No</span><b>Email «¿Lo dejamos aquí?»</b><small>y etiqueta como frío</small></div>' +
        '<div class="sc-card log"><div class="sc-k">Registro de ejecución</div><div id="log"></div></div>' +
        '<div class="sc-card cnt"><div class="sc-k">Contactos en el flujo</div><div class="sc-n" id="wfN">128</div><span class="sc-up" id="wfR">62% respondió</span></div></div>',
      run: function () {
        var pls = R.getElementById('pls'), log = R.getElementById('log'), xs = [90, 240, 390, 540, 680];
        function line(t, s) { log.appendChild(h('<div class="sc-pop"><em>' + t + '</em>' + s + '</div>')); while (log.children.length > 4) log.removeChild(log.firstChild); }
        reveal($$('.s-wf .node, .s-wf .br'), 150, 90);
        xs.forEach(function (x, i) {
          at(900 + i * 1150, function () {
            $$('.s-wf .node').forEach(function (n) { n.classList.remove('lit'); });
            var n = R.getElementById('n' + i); n.classList.add('lit', 'done');
            pls.setAttribute('cx', x);
            line(['20:01', '20:01', 'día 2', 'día 2', 'día 4'][i], ['Valentina Rojas entró al flujo', 'Esperando 1 día', 'Propuesta enviada ✓ abierta', 'Esperando 2 días', 'Respondió → Sí'][i]);
          });
        });
        if (!reduce) at(900, function () { pls.style.transition = 'cx 1.1s cubic-bezier(.65,0,.35,1)'; });
        at(6700, function () { R.getElementById('bY').classList.add('win', 'sc-flash'); count(R.getElementById('wfN'), 129, 400); say('⚡', 'Reunión de cierre agendada por el flujo', 'Valentina Rojas · pasa a Negociación'); });
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
        at(1300, function () { cur(380, 150, true); });
        at(2450, function () { R.getElementById('chA').classList.remove('on'); R.getElementById('chM').classList.add('on'); $$('.s-mail .tp').forEach(function (t, i) { t.classList.remove('sc-show'); void t.offsetWidth; at(i * 90, function () { t.classList.add('sc-show'); }); }); });
        at(3100, function () { R.getElementById('tp1').classList.add('pick'); cur(560, 470, true); });
        at(4300, function () { R.getElementById('ed').classList.add('on'); cursor.classList.remove('on'); });
        var s = 'Te extrañamos, {nombre} 👋', subj = R.getElementById('subj');
        at(4700, function () { var i = 0; (function ty() { subj.textContent = s.slice(0, ++i); if (i < s.length) timers.push(setTimeout(ty, reduce ? 0 : 55)); })(); });
        at(6500, function () { subj.classList.remove('car'); R.getElementById('when').textContent = 'Mañana 10:00 (mejor hora de apertura)'; R.getElementById('prog').textContent = '✓ Programada'; say('✉', 'Campaña programada', '1.284 contactos · mañana 10:00'); });
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

    { k: 'rep', t: 'Reportería', cap: '<b>Reportería.</b> Meta Ads, Google Ads, TikTok, LinkedIn y GA4 en un solo tablero: inversión, impresiones, clics y conversiones, día a día.',
      html: '<div class="s-rep"><div class="sub"><div class="sc-k">ORGÁNICO</div><a><i style="background:#1877f2"></i>Facebook</a><a><i style="background:linear-gradient(45deg,#f58529,#dd2a7b,#8134af)"></i>Instagram</a><a><i style="background:#111"></i>TikTok</a><a><i style="background:#0a66c2"></i>LinkedIn</a><a><i style="background:#f9ab00"></i>GA4</a><div class="sc-k" style="margin-top:10px">PUBLICITARIO</div><a class="on"><i style="background:#fff"></i>Resumen</a><a><i style="background:#0866ff"></i>Meta Ads</a><a><i style="background:#34a853"></i>Google Ads</a><a><i style="background:#111"></i>TikTok Ads</a></div>' +
        '<div><div class="hd"><small>DASHBOARD</small><b>Resumen general</b><span class="dt">📅 1 oct 2026 → 15 oct 2026 ▾</span></div>' +
        '<div class="charts">' + chart('Inversión', 'rInv', '$', '#0866ff', '#34a853', '$5.261.070', '$1.676.664') + chart('Impresiones', 'rImp', '', '#0866ff', '#34a853', '1.186.073', '170.862') + '</div>' +
        '<div class="mini"><div class="sc-card"><div class="sc-k">Clics</div><div class="sc-n" data-c="27058">0</div><span class="sc-up">▲ 36,4%</span></div><div class="sc-card"><div class="sc-k">Conversiones</div><div class="sc-n" data-c="643">0</div><span class="sc-up">▲ 36,8%</span></div><div class="sc-card"><div class="sc-k">CPC</div><div class="sc-n" data-c="256" data-pre="$">0</div><span class="sc-up">▼ 8,1%</span></div><div class="sc-card"><div class="sc-k">ROAS</div><div class="sc-n" data-c="18" data-suf="×">0</div><span class="sc-up">▲ 12%</span></div></div></div></div>',
      run: function () {
        at(300, function () { $$('.s-rep .ln').forEach(function (l, i) { setTimeout(function () { l.classList.add('go'); }, reduce ? 0 : i * 250); }); });
        at(300, function () { count(R.getElementById('rInv'), 6937734, 2200, '$'); count(R.getElementById('rImp'), 1356935, 2200); });
        at(1600, function () { $$('.s-rep .mini [data-c]').forEach(function (n) { count(n, +n.dataset.c, 1500, n.dataset.pre, n.dataset.suf); }); });
        at(4200, function () { say('📈', 'Nova: el CTR de Meta subió 18% esta semana', 'Sugiere mover $300.000 a la campaña ganadora'); });
        at(6400, function () { var a = $$('.s-rep .sub a'); a[6].classList.remove('on'); a[7].classList.add('on'); });
      } },

    { k: 'lic', t: 'Licitaciones', cap: '<b>Licitaciones.</b> Mercado Público filtrado para tu rubro: la IA calcula la afinidad de cada licitación, te explica el porqué y te avisa cuando aparece una nueva.',
      html: '<div class="s-lic"><div class="ban"><small>SNIPER COMERCIAL · MERCADO PÚBLICO</small><b>Licitaciones filtradas para tu rubro</b><p>Solo con el rubro de tu empresa filtramos las licitaciones afines: relevancia calculada con IA, montos, plazos y el porqué de cada match.</p><span class="rk">🚀</span></div>' +
        '<div class="stats"><div class="sc-card st"><div class="sc-k">Activas</div><div class="sc-n" id="lA">0</div></div><div class="sc-card st"><div class="sc-k">Relevantes</div><div class="sc-n" id="lR">0</div></div><div class="sc-card st hot"><div class="sc-k">HOT (≥70%)</div><div class="sc-n" id="lH">0</div></div><div class="sc-card st"><div class="sc-k">Con ventana (≥15d)</div><div class="sc-n" id="lV">0</div></div></div>' +
        '<div class="ops" id="ops">' + [[87, 'Community management y pauta digital universitaria', 'Universidad de Chile · Metropolitana · 4d', '$12.800.000', 'DEMO 95%'], [85, 'Servicio de marketing digital y gestión de redes', 'Municipalidad de Providencia · 6d', '$18.500.000', 'DEMO 92%'], [84, 'Desarrollo de sitio web institucional y mantención', 'Servicio de Salud Metropolitano Oriente · 9d', '$24.000.000', 'DEMO 88%'], [81, 'Plataforma CRM y automatización ciudadana', 'Ministerio de Economía · 15d', '$58.000.000', 'DEMO 81%']].map(op).join('') + '</div></div>',
      run: function () {
        reveal($$('.s-lic .op'), 300, 140);
        at(400, function () { count(R.getElementById('lA'), 5, 900); count(R.getElementById('lR'), 5, 900); count(R.getElementById('lH'), 5, 900); count(R.getElementById('lV'), 1, 900); });
        at(900, function () { $$('.s-lic .fg').forEach(function (c, i) { setTimeout(function () { c.style.strokeDashoffset = 126 - 126 * c.dataset.v / 100; }, reduce ? 0 : i * 180); }); });
        at(4300, function () {
          var ops = R.getElementById('ops'), n = h(op([92, 'Campañas digitales para programa de salud preventiva', 'Gobierno Regional de Valparaíso · 18d', '$32.000.000', 'DEMO 97%']));
          n.classList.add('new', 'sc-pop'); ops.insertBefore(n, ops.firstChild); ops.removeChild(ops.lastChild);
          setTimeout(function () { var c = n.querySelector('.fg'); c.style.strokeDashoffset = 126 - 126 * .92; }, reduce ? 0 : 120);
          count(R.getElementById('lA'), 6, 500); count(R.getElementById('lH'), 6, 500); count(R.getElementById('lV'), 2, 500);
          say('🎯', 'Nueva licitación afín: 92%', 'Gobierno Regional de Valparaíso · $32.000.000'); bell(4);
        });
      } }
  ];

  function chart(name, id, pre, c1, c2, v1, v2) {
    var W = 420, H = 140, pts = function (seed, base, amp) { var p = [], y; for (var i = 0; i <= 14; i++) { y = base + Math.sin(i * .9 + seed) * amp + Math.cos(i * 1.7 + seed) * amp * .5; p.push([30 + i * (W - 40) / 14, y]); } return p; };
    var path = function (p) { return p.map(function (q, i) { return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' '); };
    var a = pts(1, 45, 16), b = pts(3, 105, 7), len = 900;
    return '<div class="sc-card ch"><div class="t"><span class="sc-k">' + name + '</span><span class="sc-n" id="' + id + '">0</span></div><div class="lg"><span><i style="background:' + c1 + '"></i>' + v1 + ' Meta Ads</span><span><i style="background:' + c2 + '"></i>' + v2 + ' Google Ads</span></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + (H + 18) + '"><g class="gl">' + [20, 50, 80, 110, 140].map(function (y) { return '<line x1="30" x2="' + (W - 10) + '" y1="' + y + '" y2="' + y + '"/>'; }).join('') + '</g>' +
      '<path class="ln" style="--len:' + len + ';stroke:' + c1 + '" d="' + path(a) + '"/><path class="ln" style="--len:' + len + ';stroke:' + c2 + '" d="' + path(b) + '"/>' +
      ['01-oct', '05-oct', '09-oct', '13-oct'].map(function (t, i) { return '<text class="ax" x="' + (30 + i * 120) + '" y="' + (H + 14) + '">' + t + '</text>'; }).join('') + '</svg></div>';
  }
  function op(o) {
    return '<div class="sc-card op"><div class="ring"><svg viewBox="0 0 46 46"><circle class="bg" cx="23" cy="23" r="20"/><circle class="fg" data-v="' + o[0] + '" cx="23" cy="23" r="20"/></svg><b>' + o[0] + '</b></div><div><h6>' + o[1] + '</h6><p>' + o[2] + '</p><div class="m"><em>💰 ' + Math.round(o[0] * .82) + '</em>' + o[3] + '</div><span class="fit">' + o[4] + '</span></div></div>';
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

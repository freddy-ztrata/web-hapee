/* ==========================================================================
   Kit común de las páginas interiores — propuesta 2026 (no publicado)
   Se carga SIN defer como primer elemento del <body>: dibuja el nav antes del
   primer pintado y el footer al terminar de leer la página. En producción esto
   sería un layout compartido (Astro); aquí evita copiar el nav en 20 archivos.

   Uso en cada página:
     <body data-page="precios">
       <script src="/propuesta-2026-r8x4/site.js"></script>
       … contenido (<main class="page">…) …
   ========================================================================== */
(function () {
  'use strict';
  var d = document, de = d.documentElement, P = '/propuesta-2026-r8x4/';
  try { if (localStorage.getItem('hapee-prop-theme') === 'light') de.classList.remove('dark'); else de.classList.add('dark'); } catch (e) { de.classList.add('dark'); }
  de.classList.add('js');

  var ICO = {
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4"/>', code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    car: '<path d="m6 9 6 6 6-6"/>', globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'
  };
  function ico(k, cls) { return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24">' + ICO[k] + '</svg>'; }
  var LANG = '<div class="lang" data-lang><button class="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Idioma: Español">' + ico('globe') + '<span>ES</span>' + ico('car', 'car') + '</button>' +
    '<div class="lang-menu" role="menu"><button role="menuitem" data-l="es" aria-current="true"><span>Español</span><small>ES</small></button><button role="menuitem" data-l="en"><span>English</span><small>EN</small></button><button role="menuitem" data-l="pt"><span>Português</span><small>PT</small></button></div></div>';

  var NAV =
    '<a class="skip" href="#main">Saltar al contenido</a><div class="grain" aria-hidden="true"></div>' +
    '<header class="nav" id="nav"><div class="nav-in">' +
    '<a href="' + P + 'home" class="nav-logo" aria-label="Hapee, ir al inicio"><img src="/img/logo-hapee.png" alt="Hapee" width="112" height="32"></a>' +
    '<nav class="nav-links" aria-label="Principal">' +
      '<div class="mm" data-mm><button class="nav-a" aria-expanded="false" data-sec="producto">Producto ' + ico('car', 'car') + '</button><div class="mm-panel"><div class="mm-grid">' +
        [['chat', 'Agentes IA', 'Responden, califican y agendan 24/7', 'producto#agentes'], ['grid', 'CRM y pipeline', 'Cada lead y cada etapa en un lugar', 'producto#crm'], ['bolt', 'Automatizaciones', 'Flujos que trabajan mientras duermes', 'producto#automatizaciones'], ['search', 'Licitaciones', 'Mercado Público y privados, con IA', 'producto#licitaciones'], ['mic', 'Voz clonada', 'Tu agente habla con tu voz', 'producto#voz'], ['code', 'API y MCP', 'Conecta Hapee a Claude y ChatGPT', 'docs']]
          .map(function (m) { return '<a class="mm-item" href="' + P + m[3] + '"><span class="mm-ic">' + ico(m[0]) + '</span><b>' + m[1] + '</b><small>' + m[2] + '</small></a>'; }).join('') +
        '</div><a class="mm-foot" href="' + P + 'producto">Ver toda la plataforma <span class="arr">→</span></a></div></div>' +
      '<div class="mm" data-mm><button class="nav-a" aria-expanded="false" data-sec="soluciones">Soluciones ' + ico('car', 'car') + '</button><div class="mm-panel mm-panel-sm">' +
        '<a class="mm-row" href="' + P + 'soluciones#industrias"><b>Por industria</b><small>Inmobiliaria, salud, educación, retail y más</small></a>' +
        '<a class="mm-row" href="' + P + 'soluciones#tamano"><b>Por tamaño de empresa</b><small>De equipos en crecimiento a corporativos</small></a>' +
        '<a class="mm-row" href="' + P + 'whatsapp"><b>Ventas por WhatsApp</b><small>Tu agente IA en WhatsApp oficial</small></a>' +
        '<a class="mm-row" href="' + P + 'partners"><b>Agencias y partners</b><small>Revende Hapee con tu marca</small></a>' +
        '<a class="mm-row" href="' + P + 'soluciones#publico"><b>Sector público y licitaciones</b><small>Encuentra y gana licitaciones con IA</small></a>' +
        '<a class="mm-row" href="' + P + 'soluciones#corporativos"><b>Corporativos</b><small>Seguridad, roles, API e implementación</small></a></div></div>' +
      '<a class="nav-a" href="' + P + 'precios" data-sec="precios">Precios</a>' +
      '<div class="mm" data-mm><button class="nav-a" aria-expanded="false" data-sec="recursos">Recursos ' + ico('car', 'car') + '</button><div class="mm-panel mm-panel-sm">' +
        '<a class="mm-row" href="' + P + 'blog"><b>Blog</b><small>IA aplicada a ventas</small></a>' +
        '<a class="mm-row" href="' + P + 'casos"><b>Casos de éxito</b><small>Resultados de clientes de Hapee</small></a>' +
        '<a class="mm-row" href="' + P + 'docs"><b>Documentación API</b><small>Webhooks, ERP y MCP</small></a>' +
        '<a class="mm-row" href="' + P + 'academia"><b>Academia</b><small>Configura Hapee paso a paso</small></a>' +
        '<a class="mm-row" href="' + P + 'por-que-hapee"><b>Por qué Hapee</b><small>Comparativas y antes/después</small></a>' +
        '<a class="mm-row" href="' + P + 'eventos"><b>Eventos y webinars</b><small>En vivo y grabados</small></a>' +
        '<a class="mm-row" href="' + P + 'changelog"><b>Novedades</b><small>Lo último que lanzamos</small></a></div></div>' +
      '<div class="mm" data-mm><button class="nav-a" aria-expanded="false" data-sec="empresa">Empresa ' + ico('car', 'car') + '</button><div class="mm-panel mm-panel-sm">' +
        '<a class="mm-row" href="' + P + 'nosotros"><b>Nosotros</b><small>Equipo, historia e inversionistas</small></a>' +
        '<a class="mm-row" href="' + P + 'seguridad"><b>Seguridad</b><small>Datos, cumplimiento y confianza</small></a>' +
        '<a class="mm-row" href="' + P + 'integraciones"><b>Integraciones</b><small>Todo lo que conecta Hapee</small></a>' +
        '<a class="mm-row" href="' + P + 'demos"><b>Demos interactivas</b><small>Oficina 3D, juego y Vía</small></a></div></div>' +
    '</nav><div class="nav-r">' +
      LANG +
      '<button class="icon-btn" id="themeBtn" aria-label="Cambiar tema claro u oscuro">' + ico('sun', 'i-sun') + ico('moon', 'i-moon') + '</button>' +
      '<a class="nav-a nav-login" href="https://beta.hapee.ai/" rel="noopener">Ingresar</a>' +
      '<a class="btn btn-primary btn-sm" href="' + P + 'demo">Agendar demo <span class="arr">→</span></a>' +
      '<button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="sheet"><span></span><span></span></button>' +
    '</div></div></header>' +
    '<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="Menú" hidden><nav class="sheet-in">' +
      '<details><summary>Producto</summary><a href="' + P + 'producto">Toda la plataforma</a><a href="' + P + 'producto#agentes">Agentes IA</a><a href="' + P + 'producto#crm">CRM y pipeline</a><a href="' + P + 'producto#automatizaciones">Automatizaciones</a><a href="' + P + 'producto#licitaciones">Licitaciones</a><a href="' + P + 'docs">API y MCP</a></details>' +
      '<details><summary>Soluciones</summary><a href="' + P + 'soluciones#industrias">Por industria</a><a href="/propuesta-2026-r8x4/soluciones#tamano">Por tamaño</a><a href="' + P + 'whatsapp">Ventas por WhatsApp</a><a href="' + P + 'partners">Agencias y partners</a><a href="' + P + 'soluciones#publico">Sector público</a><a href="' + P + 'soluciones#corporativos">Corporativos</a></details>' +
      '<a class="sheet-a" href="' + P + 'precios">Precios</a>' +
      '<details><summary>Recursos</summary><a href="' + P + 'blog">Blog</a><a href="' + P + 'casos">Casos de éxito</a><a href="' + P + 'docs">Documentación API</a><a href="' + P + 'academia">Academia</a><a href="' + P + 'por-que-hapee">Por qué Hapee</a><a href="' + P + 'eventos">Eventos</a><a href="' + P + 'changelog">Novedades</a></details>' +
      '<details><summary>Empresa</summary><a href="' + P + 'nosotros">Nosotros</a><a href="' + P + 'seguridad">Seguridad</a><a href="' + P + 'integraciones">Integraciones</a><a href="' + P + 'demos">Demos interactivas</a></details>' +
      '<a class="sheet-a" href="https://beta.hapee.ai/">Ingresar</a>' +
      '<div class="sheet-lang" role="group" aria-label="Idioma"><span>' + ico('globe') + 'Idioma</span><div class="seg"><button data-l="es" aria-pressed="true">ES</button><button data-l="en" aria-pressed="false">EN</button><button data-l="pt" aria-pressed="false">PT</button></div></div>' +
      '<a class="btn btn-primary btn-lg" href="' + P + 'demo">Agendar demo <span class="arr">→</span></a>' +
    '</nav></div>';

  var FOOT =
    '<footer class="foot"><div class="ctn"><div class="foot-grid">' +
      '<div class="foot-brand"><img src="/img/logo-hapee.png" alt="Hapee" width="120" height="34"><p>Agentes de IA, CRM y automatización para vender más en WhatsApp, Instagram y todos tus canales.</p><a href="mailto:info@hapee.ai">info@hapee.ai</a></div>' +
      '<div><h4>Producto</h4><a href="' + P + 'producto">Plataforma</a><a href="' + P + 'producto#agentes">Agentes IA</a><a href="' + P + 'producto#crm">CRM</a><a href="' + P + 'integraciones">Integraciones</a><a href="' + P + 'precios">Precios</a><a href="' + P + 'changelog">Novedades</a></div>' +
      '<div><h4>Soluciones</h4><a href="' + P + 'soluciones#industrias">Por industria</a><a href="/propuesta-2026-r8x4/soluciones#tamano">Por tamaño</a><a href="' + P + 'whatsapp">Ventas por WhatsApp</a><a href="' + P + 'partners">Agencias y partners</a><a href="' + P + 'soluciones#publico">Sector público</a><a href="' + P + 'soluciones#corporativos">Corporativos</a></div>' +
      '<div><h4>Recursos</h4><a href="' + P + 'blog">Blog</a><a href="' + P + 'casos">Casos de éxito</a><a href="' + P + 'docs">Documentación API</a><a href="' + P + 'academia">Academia</a><a href="' + P + 'eventos">Eventos</a><a href="' + P + 'por-que-hapee">Por qué Hapee</a></div>' +
      '<div><h4>Empresa</h4><a href="' + P + 'nosotros">Nosotros</a><a href="' + P + 'seguridad">Seguridad</a><a href="' + P + 'legal#privacidad">Privacidad</a><a href="' + P + 'legal#terminos">Términos</a><a href="' + P + 'legal#eliminacion">Eliminación de datos</a></div>' +
    '</div><p class="foot-mega display" aria-hidden="true">HAPEE</p>' +
    '<div class="foot-bot"><span>© 2026 WM Digital, LLC · Hapee.ai</span><span class="foot-lang">' + ico('globe') + '<button data-l="es" aria-current="true">Español</button><button data-l="en">English</button><button data-l="pt">Português</button></span></div></div></footer>' +
    '<div class="mcta" id="mcta"><a class="btn btn-primary" href="' + P + 'demo">Agendar demo <span class="arr">→</span></a></div>' +
    '<div class="review-bar" role="region" aria-label="Revisión de la propuesta"><span class="rb-tag"><i></i><span>Propuesta 2026 · no publicada</span></span>' +
      '<button id="notesBtn" aria-pressed="false">Notas de diseño</button><a href="' + P + 'mapa">Todas las páginas</a><a href="' + P + '">Auditoría y plan</a></div>';

  d.body.insertAdjacentHTML('afterbegin', NAV);

  function ready() {
    d.body.insertAdjacentHTML('beforeend', FOOT);
    var $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
    var fine = matchMedia('(pointer: fine)').matches, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    // sección activa del menú
    var sec = d.body.dataset.sec; if (sec) $$('[data-sec="' + sec + '"]').forEach(function (b) { b.style.background = 'var(--surface-2)'; });

    $('#themeBtn').addEventListener('click', function () { var dk = de.classList.toggle('dark'); try { localStorage.setItem('hapee-prop-theme', dk ? 'dark' : 'light'); } catch (e) {} });

    var nav = $('#nav'), lastY = 0, mc = $('#mcta');
    addEventListener('scroll', function () {
      var y = scrollY; lastY = y;
      mc.classList.toggle('on', y > innerHeight * .9 && (innerHeight + y) < d.body.scrollHeight - 700);
    }, { passive: true });

    var mms = $$('[data-mm]');
    function closeMM(ex) { mms.forEach(function (m) { if (m !== ex) { m.classList.remove('open'); $('button', m).setAttribute('aria-expanded', 'false'); } }); }
    mms.forEach(function (m) {
      var b = $('button', m), t;
      function open() { clearTimeout(t); closeMM(m); m.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
      function close() { t = setTimeout(function () { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }, 120); }
      b.addEventListener('click', function (e) { e.stopPropagation(); m.classList.contains('open') ? close() : open(); });
      if (fine) { m.addEventListener('mouseenter', open); m.addEventListener('mouseleave', close); }
    });
    d.addEventListener('click', function () { closeMM(null); });

    var burger = $('#burger'), sheet = $('#sheet');
    function setSheet(on) { sheet.hidden = !on; burger.setAttribute('aria-expanded', on ? 'true' : 'false'); burger.setAttribute('aria-label', on ? 'Cerrar menú' : 'Abrir menú'); de.style.overflow = on ? 'hidden' : ''; }
    burger.addEventListener('click', function () { setSheet(sheet.hidden); });
    $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { setSheet(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMM(null); if (!sheet.hidden) setSheet(false); } });

    // idioma (en la propuesta solo avisa)
    var box = $('[data-lang]'), note = d.createElement('div'), tt; note.className = 'lang-note'; note.setAttribute('role', 'status'); d.body.appendChild(note);
    var lb = $('.lang-btn', box);
    lb.addEventListener('click', function (e) { e.stopPropagation(); var o = box.classList.toggle('open'); lb.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    d.addEventListener('click', function () { box.classList.remove('open'); lb.setAttribute('aria-expanded', 'false'); });
    $$('[data-l]').forEach(function (el) {
      el.addEventListener('click', function () {
        var l = el.dataset.l; box.classList.remove('open'); if (l === 'es') return;
        note.textContent = (l === 'en' ? 'English' : 'Português') + ': esta propuesta está solo en español. Al aprobarla, este selector lleva a la versión /' + l + '/ de la misma página y recuerda la elección.';
        note.classList.add('on'); clearTimeout(tt); tt = setTimeout(function () { note.classList.remove('on'); }, 4200);
      });
    });

    // notas de diseño
    var nb = $('#notesBtn');
    nb.addEventListener('click', function () { var on = d.body.classList.toggle('show-notes'); nb.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    if (/[?&]notas=1/.test(location.search)) nb.click();

    // reveal al hacer scroll
    var rvs = $$('.rv');
    if (reduce || !('IntersectionObserver' in window)) rvs.forEach(function (n) { n.classList.add('in'); });
    else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' }); rvs.forEach(function (n) { io.observe(n); }); }

    // spotlight en tarjetas
    $$('.spot').forEach(function (c) { c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }); });

    // índice lateral: resalta la sección visible
    var toc = $$('.toc a[href^="#"]');
    if (toc.length && 'IntersectionObserver' in window) {
      var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) toc.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); }); }, { rootMargin: '-30% 0px -60% 0px' });
      toc.forEach(function (a) { var t = d.getElementById(a.getAttribute('href').slice(1)); if (t) io2.observe(t); });
    }
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', ready); else ready();
})();

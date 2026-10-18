/* ============================================================
   Hapee.ai — Robot vivo del hero de la home (2026-10-17)
   Cargado con <script src="/js/robot/hapee-robot.js" defer></script> SOLO en
   index.html (es/en/pt). Sin dependencias; no agrega texto visible.

   Decorativo, SIN conexión con ningún chat: respira, mira alrededor, la
   cabeza sigue el cursor (escritorio), saluda al llegar y se gira
   arrastrándolo. Vistas [data-hapee-robot]: «hero» (sobre img.hero-robot) y
   «showcase» (pestaña Asistente de la vitrina).

   El 3D (js/robot/robot-view.js + three.js r160 de jsDelivr) se carga recién
   DESPUÉS del evento `load`: a los ~2,5 s (idle) o con la primera interacción,
   lo que llegue antes (también en móvil). img/robot-v2.webp|png (render de este
   mismo robot, misma pose y encuadre) es el primer pintado y el respaldo: queda sin WebGL, con prefers-reduced-motion, Save-Data, red 2g
   o equipo modesto (≤2 GB / ≤2 núcleos).
   ============================================================ */
(function () {
  'use strict';
  if (window.HapeeRobot && window.HapeeRobot.__ok) return;

  var mm = function (q) { return window.matchMedia ? matchMedia(q).matches : false; };
  var REDUCE = mm('(prefers-reduced-motion: reduce)');
  var conn = navigator.connection || {};
  var MODESTO = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') ||
    (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;

  // Estado mínimo que lee robot-view.js: reposo + gesto de saludo («happy», 2,8 s).
  var R = {
    __ok: true, state: 'idle', happyAt: -1e9, target: null, reduced: REDUCE, views: [],
    setState: function (name) {
      if (name === 'happy') {
        R.happyAt = performance.now(); R.state = 'happy';
        clearTimeout(R._t); R._t = setTimeout(function () { R.state = 'idle'; }, 2800);
      } else if (name === 'idle') { clearTimeout(R._t); R.state = 'idle'; }
    },
    level: function () { return 0; }
  };
  window.HapeeRobot = R;

  var st = document.createElement('style');
  st.id = 'hapee-robot-style';
  st.textContent =
    '[data-hapee-robot]{position:relative}' +
    '[data-hapee-robot] canvas.hr-cv{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .45s ease;touch-action:pan-y}' +
    '[data-hapee-robot].hr-ready canvas.hr-cv{opacity:1}' +
    // fundido: el 3D aparece encima (.45 s) y recién entonces se va la imagen, que es el mismo robot en la misma pose
    '.hr-ready .hr-poster,.hr-ready-poster{opacity:0!important;transition:opacity .3s ease .4s}' +
    '@media(hover:hover) and (pointer:fine){.orbit-stage .hr-live canvas.hr-cv{filter:drop-shadow(0 20px 50px rgba(250,80,0,.25))}}' +
    '.hr-live{position:absolute;z-index:6;cursor:grab;-webkit-tap-highlight-color:transparent}' +
    '.hr-live:active{cursor:grabbing}' +
    '@media(prefers-reduced-motion:reduce){[data-hapee-robot] canvas.hr-cv{transition:none!important}}';
  document.head.appendChild(st);

  var heroVista = document.querySelector('[data-hapee-robot="hero"]');
  if (heroVista) {
    // el overlay copia la caja del póster (img.hero-robot) con aire a los lados para el brazo que saluda
    var poster = heroVista.parentNode && heroVista.parentNode.querySelector('img.hero-robot');
    var calzar = function () {
      if (!poster) return;
      var w = poster.offsetWidth, h = poster.offsetHeight; if (!w || !h) return;
      var s = heroVista.style;
      s.width = Math.round(w * 1.9) + 'px'; s.height = Math.round(h * 1.12) + 'px';
      s.left = Math.round(poster.offsetLeft + w / 2 - w * .95) + 'px';
      s.top = Math.round(poster.offsetTop + h / 2 - h * .58) + 'px';
    };
    calzar();
    if (poster && !poster.complete) poster.addEventListener('load', calzar);
    window.addEventListener('resize', calzar);
    if (window.ResizeObserver && poster) new ResizeObserver(calzar).observe(poster);
    heroVista._poster = poster;
    R.views.push({ el: heroVista, name: 'hero', fit: 'full', drag: true, periodic: true });
  }
  var vitrina = document.querySelectorAll('[data-hapee-robot="showcase"]');
  for (var vi = 0; vi < vitrina.length; vi++) R.views.push({ el: vitrina[vi], name: 'showcase', fit: 'full', drag: true, periodic: false });

  // ───────────────────────── 3D diferido ─────────────────────────
  // Si la página carga <model-viewer> (trae su propia copia de three.js) queda la imagen,
  // para no bajar three dos veces.
  var conModelViewer = !!document.querySelector('model-viewer');
  var puede3D = !REDUCE && !MODESTO && !conModelViewer && (function () {
    try { var c = document.createElement('canvas'); var gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return false; var x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return true; } catch (e) { return false; }
  })();
  var cargado = false;
  function activar3D() {
    if (cargado || !puede3D) return;
    var vistas = R.views.slice();
    if (!vistas.length) return;
    cargado = true;
    import('/js/robot/robot-view.js?v=2').then(function (m) { return m.start(R, vistas); })
      .catch(function (e) { if (window.console) console.warn('Hapee robot 3D no disponible, queda la imagen:', e && e.message || e); });
  }
  // Nunca antes de `load` (no compite con el primer pintado ni con el LCP). Después de load:
  // ~2,5 s + idle, o la primera interacción del visitante, lo que llegue antes.
  var EVS = ['pointerdown', 'pointermove', 'scroll', 'keydown', 'touchstart'];
  function programar() {
    var hecho = false, timer = 0;
    var ya = function () {
      if (hecho) return; hecho = true; clearTimeout(timer);
      EVS.forEach(function (ev) { removeEventListener(ev, ya, { passive: true }); });
      (window.requestIdleCallback || function (f) { return setTimeout(f, 50); })(activar3D, { timeout: 800 });
    };
    EVS.forEach(function (ev) { addEventListener(ev, ya, { passive: true }); });
    timer = setTimeout(ya, 2500);
  }
  if (document.readyState === 'complete') programar(); else window.addEventListener('load', programar);
})();

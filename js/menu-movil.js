/* ============================================================
   Hapee.ai — Menú móvil accesible (2026-10-15)
   Cargado con <script src="/js/menu-movil.js" defer> en las páginas con el
   menú `.mbtn` + `.mmenu#mm` (index, agenda-tu-demo y sus en/pt).
   preparate-demo.html trae su propia versión de esto inline.

   El menú se abre y cierra con los onclick que ya tiene el HTML; este script
   solo agrega lo que faltaba para teclado y lector de pantalla:
     - aria-expanded en el botón hamburguesa, sincronizado con `.open`;
     - al abrir, el foco va a la X; al cerrar (X, link, CTA o Escape),
       vuelve al botón hamburguesa;
     - Escape cierra el menú (quita `.open` del menú Y `.menu-open` de <html>,
       la misma regla de CLAUDE.md que cumplen los onclick);
     - con el menú abierto, el resto de la página queda `inert`, para que Tab
       no se escape a contenido tapado (WCAG 2.4.3).
   ============================================================ */
(function () {
  'use strict';
  var mm = document.getElementById('mm');
  var btn = document.querySelector('.mbtn');
  if (!mm || !btn) return;
  var html = document.documentElement, x = mm.querySelector('.mx'), wasOpen = false;

  btn.setAttribute('aria-controls', 'mm');
  btn.setAttribute('aria-expanded', 'false');

  function sync() {
    var open = mm.classList.contains('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.querySelectorAll('nav, main, footer').forEach(function (el) {
      if (mm.contains(el) || el.contains(mm)) return;
      if (open) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
    if (open !== wasOpen) {
      wasOpen = open;
      try { (open ? (x || mm.querySelector('a,button')) : btn).focus(); } catch (e) { /* sin foco no se rompe nada */ }
    }
  }
  if ('MutationObserver' in window) new MutationObserver(sync).observe(mm, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !mm.classList.contains('open')) return;
    mm.classList.remove('open');
    html.classList.remove('menu-open');
  });
})();

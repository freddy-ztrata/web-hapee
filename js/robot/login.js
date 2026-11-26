/* Hapee · botón de login naranjo (25-11-2026). El HTML ya trae a.hx-login en el encabezado y el menú (lo pone
   robot_recorrido.py) y sitio.css lo pinta desde el primer cuadro: este script NO mueve nada (sin saltos de diseño).
   Solo agrega, en celular, una copia en la barra para que el login se vea sin abrir el menú (si cabe sin desbordar). */
(function () {
  'use strict';
  if (window.__hxLogin) return; window.__hxLogin = 1;
  function arranca() {
    var cab = document.querySelector('nav.nav, header nav, header, .nav, .top');
    if (!cab) return;
    var enCab = cab.querySelector('a.hx-login');
    if (!enCab) return;
    var mbtn = cab.querySelector('.mbtn, .hamburger, .burger, .menu-toggle, .nav-toggle, [aria-label="Menú"], [aria-label="Menu"]');
    // sin botón de menú (posts del blog): la copia va al comienzo del grupo de la derecha (tema/idioma), que sigue visible
    var grupoDer = !mbtn && (function () { var tg = cab.querySelector('#darkToggle, .dark-toggle, [data-lang-switch]'); return tg && tg.parentElement !== cab ? tg.parentElement : null; })();
    if (!mbtn && !grupoDer) return;
    var m = enCab.cloneNode(true); m.classList.add('hx-login-m'); m.removeAttribute('id');
    if (mbtn) mbtn.parentNode.insertBefore(m, mbtn); else grupoDer.insertBefore(m, grupoDer.firstChild);
    function ver() {
      var visible = !enCab.offsetParent && (!mbtn || getComputedStyle(mbtn).display !== 'none');
      document.documentElement.classList.toggle('hx-login-movil', visible);
      if (visible) {
        var logo = cab.querySelector('img'), fila = m.parentNode;
        if (document.documentElement.scrollWidth > innerWidth + 1 || fila.scrollWidth > fila.clientWidth + 1 || (logo && m.getBoundingClientRect().left < logo.getBoundingClientRect().right + 4))
          document.documentElement.classList.remove('hx-login-movil');
      }
    }
    ver(); addEventListener('resize', ver);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ver);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranca); else arranca();
})();

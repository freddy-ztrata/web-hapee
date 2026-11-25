/* Hapee · botón de login naranjo en el encabezado de todas las páginas (25-11-2026). Estilos en /js/robot/sitio.css.
   1) Marca como .hx-login los enlaces a la plataforma (beta.hapee.ai) del encabezado y del menú móvil.
   2) En escritorio lo lleva al grupo de botones (antes de «Agendar demo») si existe; si la página no tenía login, lo agrega.
   3) En celular pone una copia en la barra, al lado del menú, para que se vea sin abrirlo (solo si cabe sin desbordar). */
(function () {
  'use strict';
  if (window.__hxLogin) return; window.__hxLogin = 1;
  var URL_ = 'https://beta.hapee.ai/';
  var lang = (document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
  var TXT = { es: 'Login', en: 'Log in', pt: 'Entrar' }[lang] || 'Login';
  var ICONO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
  var ES_LOGIN = /^(login|log in|iniciar sesi[oó]n|ingresar|entrar|acceder|sign in)$/i;

  function marcar(a) {
    if (a.classList.contains('hx-login')) return;
    var t = (a.textContent || '').trim();
    a.classList.add('hx-login');
    a.innerHTML = ICONO + '<span>' + (t || TXT) + '</span>';
    if (!a.getAttribute('aria-label')) a.setAttribute('aria-label', (t || TXT) + ' · Hapee');
  }
  function arranca() {
    var cab = document.querySelector('nav.nav, header nav, header, .nav, .top');
    var enlaces = [].slice.call(document.querySelectorAll('a[href^="' + URL_ + '"], a[href="https://beta.hapee.ai"]')).filter(function (a) {
      return ES_LOGIN.test((a.textContent || '').trim()) && a.closest('nav, header, .mmenu, .mm, [class*="drawer"], [class*="menu"]');
    });
    enlaces.forEach(marcar);
    var enCab = cab ? enlaces.filter(function (a) { return cab.contains(a); })[0] : null;
    // la página ya tiene un acceso a la plataforma con otro texto («Abrir mi plataforma»): ese es el login
    if (cab && !enCab) { enCab = cab.querySelector('a[href^="https://beta.hapee.ai"]'); if (enCab) { enCab.classList.add('hx-login'); var t0 = enCab.innerHTML; if (!/<svg/i.test(t0)) enCab.innerHTML = ICONO + '<span>' + t0 + '</span>'; } }
    // escritorio: junto a los botones
    var grupo = cab && cab.querySelector('.nctas, .nav-ctas, .ctas, .nav-right, .nr');
    // encabezados sin grupo de botones (posts del blog): el grupo es donde está el selector de tema/idioma, que sigue visible en celular
    if (cab && !grupo) { var tg = cab.querySelector('#darkToggle, .dark-toggle, [data-lang-switch]'); if (tg && tg.parentElement !== cab) grupo = tg.parentElement; }
    if (cab && !enCab) {
      enCab = document.createElement('a'); enCab.href = URL_; enCab.target = '_blank'; enCab.rel = 'noopener noreferrer'; enCab.textContent = TXT;
      marcar(enCab);
      if (grupo) grupo.insertBefore(enCab, grupo.querySelector('.btn, a[class*="btn"]') || null);
      else { var c = cab.querySelector('.ctn, .container') || cab; c.appendChild(enCab); }
      // si no cabe en la barra (desborda), se quita: no puede romper el encabezado
      if (document.documentElement.scrollWidth > innerWidth + 1 || enCab.getBoundingClientRect().right > innerWidth) { enCab.remove(); enCab = null; }
    } else if (enCab && grupo && !grupo.contains(enCab)) {
      grupo.insertBefore(enCab, grupo.querySelector('.btn, a[class*="btn"]') || grupo.firstChild);
    }
    // celular: copia en la barra, antes del botón del menú
    var mbtn = cab && cab.querySelector('.mbtn, .hamburger, .burger, .menu-toggle, .nav-toggle, [aria-label="Menú"], [aria-label="Menu"]');
    if (!mbtn || !enCab) return;
    var m = enCab.cloneNode(true); m.classList.add('hx-login-m'); m.removeAttribute('id');
    mbtn.parentNode.insertBefore(m, mbtn);
    function ver() {
      var visible = getComputedStyle(mbtn).display !== 'none' && !(enCab.offsetParent);
      document.documentElement.classList.toggle('hx-login-movil', visible);
      // si no cabe (barra desbordada), se quita la copia: el login sigue dentro del menú
      if (visible) {
        var fila = mbtn.parentNode, d = fila.scrollWidth - fila.clientWidth;
        if (d > 1 || m.getBoundingClientRect().left < ((cab.querySelector('img') || m).getBoundingClientRect().right + 4)) document.documentElement.classList.remove('hx-login-movil');
      }
    }
    ver(); addEventListener('resize', ver);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ver);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranca); else arranca();
})();

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
  function todo() { [].forEach.call(document.querySelectorAll('[data-hp]'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', todo); else todo();
})();

/* TEMA-OSCURO v1 · modo oscuro de la maqueta (CSS en mockup.css, mismo marcador).
   - data-tema="oscuro|claro" en .hp (sin atributo = claro; "auto" en el HTML = sigue prefers-color-scheme).
   - El botón luna/sol del topbar alterna claro/oscuro en TODAS las maquetas de la página y avisa al padre:
       parent.postMessage({hapeeMockupTemaCambio: 'oscuro'|'claro'}, '*')
   - La página padre (iframe del mismo origen) lo controla con:
       iframe.contentWindow.postMessage({hapeeMockupTema: 'oscuro'|'claro'|'auto'}, '*')
   - ?tema=oscuro|claro|auto en la URL fija el tema inicial.
   Al imprimir sale en claro (las reglas oscuras van en @media screen). */
(function () {
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var auto = false;
  function raices() { return [].slice.call(document.querySelectorAll('.hp[data-hp]')); }
  function sinc(r) {
    var osc = r.getAttribute('data-tema') === 'oscuro';
    [].forEach.call(r.querySelectorAll('.hp-tema'), function (b) {
      b.setAttribute('aria-pressed', osc ? 'true' : 'false');
      b.setAttribute('aria-label', osc ? 'Modo claro' : 'Modo oscuro');
      b.title = osc ? 'Modo claro' : 'Modo oscuro';
    });
  }
  function fija(r, t, suave) {
    if (t !== 'oscuro' && t !== 'claro') return;
    if (r.getAttribute('data-tema') === t) { sinc(r); return; }
    if (suave) {
      r.classList.add('hp--trans');
      clearTimeout(r._hpTemaT);
      r._hpTemaT = setTimeout(function () { r.classList.remove('hp--trans'); }, 450);
    }
    r.setAttribute('data-tema', t);
    sinc(r);
  }
  function aplica(t, suave) {
    if (t === 'auto') { auto = true; t = mq && mq.matches ? 'oscuro' : 'claro'; } else auto = false;
    raices().forEach(function (r) { fija(r, t, suave); });
  }
  function avisa(t) {
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ hapeeMockupTemaCambio: t }, '*'); } catch (x) {}
  }
  function inicio() {
    var rs = raices();
    if (!rs.length) return;
    var q = null;
    try { q = new URLSearchParams(location.search).get('tema'); } catch (x) {}
    if (q === 'oscuro' || q === 'claro' || q === 'auto') aplica(q, false);
    else if (rs.some(function (r) { return r.getAttribute('data-tema') === 'auto'; })) aplica('auto', false);
    rs.forEach(function (r) {
      sinc(r);
      if (window.MutationObserver) new MutationObserver(function () { sinc(r); }).observe(r, { attributes: true, attributeFilter: ['data-tema'] });
    });
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest && ev.target.closest('.hp-tema');
      if (!b) return;
      var r = b.closest('.hp');
      var t = r && r.getAttribute('data-tema') === 'oscuro' ? 'claro' : 'oscuro';
      aplica(t, true);
      avisa(t);
    });
    window.addEventListener('message', function (ev) {
      if (ev.source !== window.parent && ev.origin !== location.origin) return;
      var d = ev.data;
      if (d && typeof d === 'object' && (d.hapeeMockupTema === 'oscuro' || d.hapeeMockupTema === 'claro' || d.hapeeMockupTema === 'auto')) aplica(d.hapeeMockupTema, true);
    });
    if (mq) {
      var cambia = function () { if (auto) aplica('auto', true); };
      mq.addEventListener ? mq.addEventListener('change', cambia) : mq.addListener && mq.addListener(cambia);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicio); else inicio();
})();

/* Dentro del iframe de la maqueta: informa su alto al home, abre la pestaña que pida el home
   (mensaje «hapee-vista» o #v=… en la URL) y avisa qué pestaña abrió la persona. Mismo origen. */
(function () {
  function raiz() { return document.querySelector('[data-hp]'); }
  function abre(v) {
    var r = raiz(); if (!r || !v) return;
    var t = r.querySelector('.hp-tab[data-v="' + v + '"]') || r.querySelector('.ni-it[data-v="' + v + '"]');
    if (t && t.getAttribute('aria-selected') !== 'true') t.click();
  }
  var ultimo = 0;
  function alto() {
    var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (h && h !== ultimo) { ultimo = h; parent.postMessage({ type: 'hapee-maqueta', h: h }, location.origin); }
  }
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin) return;
    var d = e.data;
    if (d && d.type === 'hapee-vista') abre(d.v);
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-v]');
    if (t) setTimeout(function () { parent.postMessage({ type: 'hapee-maqueta-vista', v: t.getAttribute('data-v') }, location.origin); }, 0);
    parent.postMessage({ type: 'hapee-maqueta-toque' }, location.origin);
  });
  function inicio() {
    var m = location.hash.match(/v=([a-z]+)/); if (m) abre(m[1]);
    alto();
    if (window.ResizeObserver) new ResizeObserver(alto).observe(document.documentElement);
    window.addEventListener('load', alto);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alto);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicio); else inicio();
})();

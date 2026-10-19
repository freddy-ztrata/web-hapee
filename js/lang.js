/* ============================================================
   Hapee.ai — Selector de idioma (site-wide, 2026-10-15)
   Cargado con <script src="/js/lang.js" defer> en todas las páginas.

   El sitio vive en tres idiomas con el MISMO slug:
     español   → /planes, /agenda-tu-demo, /blog/x …  (URLs de siempre)
     inglés    → /en/planes, /en/agenda-tu-demo …
     portugués → /pt/planes, /pt/agenda-tu-demo …
   Excepción: las legales ya tenían nombre propio (terms.html, termos.html…).

   El idioma por defecto lo decide nginx (ver los `map` de nginx.conf) con el
   navegador. Este script es la elección MANUAL: escribe la cookie `hapee_lang`,
   que nginx respeta por encima del navegador, y lleva a la misma página en el
   otro idioma.

   Dónde aparece: en cada elemento `[data-lang-switch]` de la página (nav,
   menú móvil). Si la página no tiene ninguno, se monta un botón flotante
   abajo a la izquierda.
   ============================================================ */
/* ── Atribución (2026-10-19): las UTMs y los click-IDs de la URL de llegada se guardan en
   CUALQUIER página, no solo en /agenda-tu-demo. Así sobreviven al cambio de idioma y a la
   navegación interna (home → «Agendar demo»), y el forwarder del calendario las lee de aquí.
   Misma clave y formato que ese forwarder: sessionStorage `hapee_attribution` = {utm_…: valor}.
   Copia en localStorage por 30 días para quien vuelve en otra pestaña. Last-click: solo se
   reescribe cuando la URL trae parámetros de campaña. */
(function () {
  var TRACK = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_id',
    'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
    'fbclid', 'gclid', 'ttclid', 'msclkid', 'dclid', 'twclid', 'yclid', 'wbraid', 'gbraid',
    'li_fat_id', 'epik', 'irclickid', 'mc_cid', 'mc_eid'];
  try {
    var q = new URLSearchParams(location.search), a = {}, n = 0;
    TRACK.forEach(function (k) { var v = q.get(k); if (v) { a[k] = v; n++; } });
    if (!n) return;
    sessionStorage.setItem('hapee_attribution', JSON.stringify(a));
    localStorage.setItem('hapee_attribution', JSON.stringify({ t: Date.now(), d: a }));
  } catch (e) { /* almacenamiento bloqueado: el calendario igual lee la URL actual */ }
})();

(function () {
  'use strict';

  var LANGS = [
    { code: 'es', short: 'ES', name: 'Español' },
    { code: 'en', short: 'EN', name: 'English' },
    { code: 'pt', short: 'PT', name: 'Português' }
  ];
  var LABEL = { es: 'Idioma', en: 'Language', pt: 'Idioma' };

  // Legales: misma página, distinto nombre de archivo por idioma.
  var LEGAL = [
    { es: '/terminos.html', en: '/terms.html', pt: '/termos.html' },
    { es: '/politica-privacidad.html', en: '/privacy-policy.html', pt: '/politica-privacidade.html' }
  ];

  var path = location.pathname;

  function legalDe(p) {
    var limpio = /\.html$/.test(p) ? p : p + '.html';
    for (var i = 0; i < LEGAL.length; i++) {
      for (var k in LEGAL[i]) if (LEGAL[i][k] === limpio) return LEGAL[i];
    }
    return null;
  }

  function idiomaActual() {
    var m = path.match(/^\/(en|pt)(\/|$)/);
    if (m) return m[1];
    var legal = legalDe(path);
    if (legal) for (var k in legal) if (legal[k] === (/\.html$/.test(path) ? path : path + '.html')) return k;
    return 'es';
  }

  var actual = idiomaActual();

  // Ruta de esta misma página en español (sin prefijo de idioma).
  var base = path.replace(/^\/(en|pt)(?=\/|$)/, '') || '/';

  function urlEn(code) {
    var legal = legalDe(path);
    var destino = legal ? legal[code] : (code === 'es' ? base : '/' + code + base);
    return destino + location.search + location.hash;
  }

  function elegir(code) {
    document.cookie = 'hapee_lang=' + code + ';path=/;max-age=31536000;samesite=lax' +
      (location.protocol === 'https:' ? ';secure' : '');
    try { localStorage.setItem('hapee-lang', code); } catch (e) { /* sin storage, igual sirve la cookie */ }
    if (code !== actual) location.href = urlEn(code);
  }

  // ---- Red de seguridad de los links internos ----
  // En /en/ y /pt/ un link a una página en español (/planes) debería llevar a
  // la versión del mismo idioma. Las traducciones ya los escriben con prefijo;
  // esto cubre los que se escaparon y los que arma el JS de cada página.
  function prefijarLinks(raiz) {
    if (actual === 'es') return;
    var as = (raiz || document).querySelectorAll('a[href^="/"]');
    for (var i = 0; i < as.length; i++) {
      var a = as[i], h = a.getAttribute('href');
      if (/^\/\//.test(h)) continue;                                   // //otro-dominio
      if (/^\/(en|pt)(\/|$|[?#])/.test(h)) continue;                   // ya traducido
      if (/^\/(api|img|js|review)\//.test(h)) continue;                // no son páginas
      if (/\.(?!html\b)[a-z0-9]{2,5}([?#]|$)/i.test(h.split('?')[0])) continue; // archivos
      var legal = legalDe(h.split(/[?#]/)[0]);
      if (legal) { a.setAttribute('href', legal[actual] + h.slice(h.split(/[?#]/)[0].length)); continue; }
      a.setAttribute('href', '/' + actual + (h === '/' ? '/' : h));
    }
  }

  // ---- Estilos ----
  var css =
    '.hl-sw{position:relative;display:inline-flex;font-family:"Plus Jakarta Sans",system-ui,-apple-system,Segoe UI,sans-serif}' +
    '.hl-sw-btn{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 10px;border-radius:999px;border:1px solid rgba(127,127,127,.35);background:transparent;color:inherit;font:inherit;font-size:.82rem;font-weight:700;letter-spacing:.04em;cursor:pointer;line-height:1}' +
    '.hl-sw-btn:hover,.hl-sw-btn:focus-visible{border-color:#FA5000;outline:none}' +
    '.hl-sw-btn svg{width:16px;height:16px;flex-shrink:0}' +
    '.hl-sw-btn .hl-car{width:10px;height:10px;transition:transform .2s}' +
    '.hl-sw.open .hl-sw-btn .hl-car{transform:rotate(180deg)}' +
    '.hl-sw-menu{position:absolute;right:0;top:calc(100% + 6px);min-width:160px;padding:6px;margin:0;list-style:none;border-radius:12px;background:#fff;color:#111;box-shadow:0 12px 32px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.06);opacity:0;visibility:hidden;transform:translateY(-4px);transition:opacity .18s,transform .18s,visibility .18s;z-index:10001}' +
    'html.dark .hl-sw-menu{background:#141414;color:#f2f2f2;box-shadow:0 12px 32px rgba(0,0,0,.6),0 0 0 1px rgba(250,80,0,.25)}' +
    '.hl-sw.open .hl-sw-menu{opacity:1;visibility:visible;transform:none}' +
    '.hl-sw.up .hl-sw-menu{top:auto;bottom:calc(100% + 6px);left:0;right:auto}' +
    '.hl-sw-menu button{display:flex;width:100%;align-items:center;justify-content:space-between;gap:12px;min-height:40px;padding:0 12px;border:0;border-radius:8px;background:none;color:inherit;font:inherit;font-size:.9rem;font-weight:600;text-align:left;cursor:pointer}' +
    '.hl-sw-menu button:hover,.hl-sw-menu button:focus-visible{background:rgba(250,80,0,.1);outline:none}' +
    '.hl-sw-menu button[aria-current="true"]{color:#FA5000}' +
    '.hl-sw-menu small{opacity:.55;font-weight:700;font-size:.72rem;letter-spacing:.05em}' +
    '.hl-sw-float{position:fixed;left:16px;bottom:16px;z-index:998;background:rgba(255,255,255,.92);color:#111;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.16);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    'html.dark .hl-sw-float{background:rgba(20,20,20,.9);color:#f2f2f2}' +
    '@media(prefers-reduced-motion:reduce){.hl-sw-menu,.hl-sw-btn .hl-car{transition:none}}';

  var GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  var CARET = '<svg class="hl-car" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 4l4 4 4-4"/></svg>';

  var abiertos = [];
  function cerrarTodos(excepto) {
    for (var i = 0; i < abiertos.length; i++) {
      if (abiertos[i] !== excepto) {
        abiertos[i].classList.remove('open');
        abiertos[i].querySelector('.hl-sw-btn').setAttribute('aria-expanded', 'false');
      }
    }
  }

  function montar(slot, flotante) {
    var cur = LANGS.filter(function (l) { return l.code === actual; })[0];
    var sw = document.createElement('div');
    sw.className = 'hl-sw' + (flotante ? ' hl-sw-float up' : '');
    if (slot.hasAttribute('data-lang-up')) sw.className += ' up';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hl-sw-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', LABEL[actual] + ': ' + cur.name);
    btn.innerHTML = GLOBE + '<span>' + cur.short + '</span>' + CARET;

    var menu = document.createElement('ul');
    menu.className = 'hl-sw-menu';
    menu.setAttribute('role', 'menu');
    LANGS.forEach(function (l) {
      var li = document.createElement('li');
      li.setAttribute('role', 'none');
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.setAttribute('lang', l.code);
      if (l.code === actual) b.setAttribute('aria-current', 'true');
      b.innerHTML = '<span>' + l.name + '</span><small>' + l.short + '</small>';
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        elegir(l.code);
        sw.classList.remove('open');
      });
      li.appendChild(b);
      menu.appendChild(li);
    });

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var abrir = !sw.classList.contains('open');
      cerrarTodos(sw);
      sw.classList.toggle('open', abrir);
      btn.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    });

    sw.appendChild(btn);
    sw.appendChild(menu);
    slot.appendChild(sw);
    abiertos.push(sw);
  }

  function init() {
    if (document.getElementById('hl-sw-style')) return;
    var style = document.createElement('style');
    style.id = 'hl-sw-style';
    style.textContent = css;
    document.head.appendChild(style);

    var slots = document.querySelectorAll('[data-lang-switch]');
    for (var i = 0; i < slots.length; i++) montar(slots[i], false);

    // Flotante: cuando la página no tiene dónde ponerlo, o cuando el nav lo
    // esconde (en móvil `.nctas` se oculta) y no hay menú móvil que lo traiga
    // (`data-lang-menu`). Se recalcula al cambiar el ancho de la ventana.
    var conMenu = document.querySelector('[data-lang-switch][data-lang-menu]');
    if (!conMenu) {
      montar(document.body, true);
      var flot = abiertos[abiertos.length - 1];
      var ajustar = function () {
        var visible = false;
        for (var j = 0; j < slots.length; j++) {
          if (slots[j].getClientRects().length) { visible = true; break; }
        }
        flot.style.display = visible ? 'none' : '';
      };
      ajustar();
      window.addEventListener('resize', ajustar);
    }

    document.addEventListener('click', function () { cerrarTodos(null); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarTodos(null); });

    prefijarLinks();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

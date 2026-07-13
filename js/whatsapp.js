/* ============================================================
   Hapee.ai — Floating WhatsApp button (site-wide)
   Single source of truth for the contact number / message.
   Loaded with <script src="/js/whatsapp.js" defer> on every page.
   ============================================================ */
(function () {
  'use strict';

  // ---- Contact config (change here, applies everywhere) ----
  var PHONE = '56965349093';                              // +56 9 6534 9093
  var MESSAGE = 'Hola 👋 Quiero saber más sobre Hapee.ai';
  var LABEL = '¿Hablamos?';

  // Guard against double-injection
  if (document.getElementById('hapee-wa-fab')) return;

  var href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(MESSAGE);

  // ---- Styles (scoped, dependency-free) ----
  var css =
    '.hapee-wa{position:fixed;right:20px;bottom:20px;z-index:999;display:flex;align-items:center;gap:10px;text-decoration:none;-webkit-tap-highlight-color:transparent}' +
    '.hapee-wa-label{background:#fff;color:#0a0a0a;font-family:"Plus Jakarta Sans",system-ui,-apple-system,Segoe UI,sans-serif;font-weight:600;font-size:.9rem;line-height:1;padding:10px 14px;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.04);white-space:nowrap;opacity:0;transform:translateX(8px);pointer-events:none;transition:opacity .25s ease,transform .25s ease}' +
    '.hapee-wa:hover .hapee-wa-label,.hapee-wa:focus-visible .hapee-wa-label{opacity:1;transform:translateX(0)}' +
    '.hapee-wa-btn{position:relative;width:58px;height:58px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(37,211,102,.45),0 3px 8px rgba(0,0,0,.22);transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease;flex-shrink:0}' +
    '.hapee-wa:hover .hapee-wa-btn,.hapee-wa:focus-visible .hapee-wa-btn{transform:scale(1.08);box-shadow:0 12px 30px rgba(37,211,102,.55),0 5px 12px rgba(0,0,0,.25)}' +
    '.hapee-wa:focus-visible{outline:none}' +
    '.hapee-wa:focus-visible .hapee-wa-btn{outline:3px solid rgba(37,211,102,.5);outline-offset:3px}' +
    '.hapee-wa-btn svg{width:32px;height:32px;color:#fff;display:block}' +
    '.hapee-wa-btn::after{content:"";position:absolute;inset:0;border-radius:50%;background:#25D366;z-index:-1;animation:hapeeWaPulse 2.4s ease-out infinite}' +
    '@keyframes hapeeWaPulse{0%{transform:scale(1);opacity:.55}70%{transform:scale(1.75);opacity:0}100%{transform:scale(1.75);opacity:0}}' +
    '@media(max-width:600px){.hapee-wa{right:14px;bottom:14px}.hapee-wa-btn{width:54px;height:54px}.hapee-wa-btn svg{width:30px;height:30px}.hapee-wa-label{display:none}}' +
    '@media(prefers-reduced-motion:reduce){.hapee-wa-btn::after{animation:none;display:none}.hapee-wa-btn,.hapee-wa-label{transition:none}}';

  var style = document.createElement('style');
  style.id = 'hapee-wa-style';
  style.textContent = css;
  document.head.appendChild(style);

  // ---- Button markup ----
  var WA_PATH = 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z';

  var a = document.createElement('a');
  a.id = 'hapee-wa-fab';
  a.className = 'hapee-wa';
  a.href = href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', 'Escríbenos por WhatsApp');
  a.innerHTML =
    '<span class="hapee-wa-label">' + LABEL + '</span>' +
    '<span class="hapee-wa-btn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + WA_PATH + '"/></svg></span>';

  // ---- Conversión: click en WhatsApp (evento clave GA4 'dg_whatsapp') ----
  // Solo dispara en páginas con el Google tag instalado (gtag definido).
  // El link abre en pestaña nueva, así que el hit sale sin necesidad de delay.
  a.addEventListener('click', function () {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'dg_whatsapp');
    }
  });

  document.body.appendChild(a);
})();

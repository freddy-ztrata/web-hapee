/* ============================================================
   Hapee.ai — Videos que se reproducen solo cuando se ven (2026-10-15)
   Cargado con <script src="/js/video-visible.js" defer> en las páginas
   con video demo (index, agenda-tu-demo, agentes-ia-whatsapp y sus en/pt).

   Antes: <video autoplay> bajaba img/video-hapee.mp4 (10 MB) apenas abría
   la página, aunque el video estuviera tres pantallas más abajo y nadie
   llegara a verlo. Ahora el video lleva preload="none" y
   data-autoplay-visible: no baja nada hasta entrar en pantalla, ahí se
   reproduce en silencio y en loop, y se pausa al salir.

   Con prefers-reduced-motion no se reproduce solo: queda el póster y los
   controles para que la persona lo inicie si quiere.
   ============================================================ */
(function () {
  'use strict';
  var videos = document.querySelectorAll('video[data-autoplay-visible]');
  if (!videos.length) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    // Sin observer (navegador muy viejo) se deja como antes: que cargue al pedirlo.
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        var p = v.play();
        if (p && p.catch) p.catch(function () { /* el navegador bloqueó el autoplay: quedan los controles */ });
      } else if (!v.paused) {
        v.pause();
      }
    });
  }, { threshold: 0.35 });
  Array.prototype.forEach.call(videos, function (v) { v.muted = true; io.observe(v); });
})();

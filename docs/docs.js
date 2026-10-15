/* Documentación para desarrolladores — Hapee API
 *
 * Lo único que hace: el botón «Copiar» de cada bloque de código.
 *
 * Los botones se crean DESDE ACÁ y no se escriben en el HTML de cada página a
 * propósito: son ~40 bloques repartidos en cinco páginas, y uno escrito a mano
 * que se olvide del `data-` correspondiente queda inerte sin que nada falle —
 * el defecto se ve igual que «al usuario no le funcionó el clic».
 *
 * Degrada sin romper: si `navigator.clipboard` no está (contexto sin HTTPS,
 * navegador viejo) el botón NO se dibuja, en vez de dibujarse y no hacer nada.
 * Un botón que no responde es peor que uno ausente.
 */
(function () {
  'use strict';

  // Textos del botón según el idioma de la página (/docs, /en/docs, /pt/docs).
  var TEXTOS = {
    es: { codigo: 'código', copiar: 'Copiar', copiado: 'Copiado', error: 'No se pudo' },
    en: { codigo: 'code', copiar: 'Copy', copiado: 'Copied', error: 'Failed' },
    pt: { codigo: 'código', copiar: 'Copiar', copiado: 'Copiado', error: 'Falhou' }
  };
  var T = TEXTOS[(document.documentElement.lang || 'es').slice(0, 2).toLowerCase()] || TEXTOS.es;

  function copiar(texto) {
    return navigator.clipboard.writeText(texto);
  }

  function montar() {
    var bloques = document.querySelectorAll('.dv-code');
    if (!bloques.length) return;

    var puedeCopiar = !!(navigator.clipboard && navigator.clipboard.writeText);

    Array.prototype.forEach.call(bloques, function (bloque) {
      var pre = bloque.querySelector('pre');
      if (!pre) return;

      var cab = bloque.querySelector('.dv-code-cab');
      if (!cab) {
        cab = document.createElement('div');
        cab.className = 'dv-code-cab';
        var lang = document.createElement('span');
        lang.className = 'dv-code-lang';
        lang.textContent = bloque.getAttribute('data-lang') || T.codigo;
        cab.appendChild(lang);
        bloque.insertBefore(cab, pre);
      }

      if (!puedeCopiar) return;

      var boton = document.createElement('button');
      boton.className = 'dv-copiar';
      boton.type = 'button';
      boton.textContent = T.copiar;
      boton.addEventListener('click', function () {
        copiar(pre.innerText).then(function () {
          boton.textContent = T.copiado;
          setTimeout(function () { boton.textContent = T.copiar; }, 1600);
        }).catch(function () {
          // Si el navegador lo niega (permisos, foco), se dice. Dejar el
          // botón como si hubiera funcionado haría que el usuario pegue lo
          // que tenía antes en el portapapeles sin darse cuenta.
          boton.textContent = T.error;
          setTimeout(function () { boton.textContent = T.copiar; }, 1600);
        });
      });
      cab.appendChild(boton);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montar);
  } else {
    montar();
  }
})();

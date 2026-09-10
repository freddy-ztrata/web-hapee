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
        lang.textContent = bloque.getAttribute('data-lang') || 'código';
        cab.appendChild(lang);
        bloque.insertBefore(cab, pre);
      }

      if (!puedeCopiar) return;

      var boton = document.createElement('button');
      boton.className = 'dv-copiar';
      boton.type = 'button';
      boton.textContent = 'Copiar';
      boton.addEventListener('click', function () {
        copiar(pre.innerText).then(function () {
          boton.textContent = 'Copiado';
          setTimeout(function () { boton.textContent = 'Copiar'; }, 1600);
        }).catch(function () {
          // Si el navegador lo niega (permisos, foco), se dice. Dejar el
          // botón como si hubiera funcionado haría que el usuario pegue lo
          // que tenía antes en el portapapeles sin darse cuenta.
          boton.textContent = 'No se pudo';
          setTimeout(function () { boton.textContent = 'Copiar'; }, 1600);
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

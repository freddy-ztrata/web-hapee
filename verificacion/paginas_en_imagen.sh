#!/usr/bin/env bash
# Cada pagina del sitio se copia a la imagen UNA POR UNA en el Dockerfile. Una
# que se commitea sin su linea COPY no llega a la imagen y nginx la sirve con el
# catch-all: devuelve la HOME con 200. No hay error, no hay 404, no hay nada
# raro en los logs — la pagina simplemente no existe y parece que si.
#
# Ya paso dos veces: con eliminacion-datos.html (que Meta abre en el App
# Review) y con marca.html. Esto lo dice antes de subir.
#
#   bash verificacion/paginas_en_imagen.sh
#
# Salida 0 = todo publicado. Salida 1 = hay paginas que no llegan a la imagen.
set -uo pipefail
cd "$(dirname "$0")/.."

locales=$(grep -vE '^\s*(#|$)' .paginas-locales 2>/dev/null || true)
faltan=()
for f in $(git ls-files '*.html' | grep -v '^blog/'); do
  grep -q "^COPY $f " Dockerfile && continue
  printf '%s\n' "$locales" | grep -qxF "$f" && continue
  faltan+=("$f")
done

sobran=()
for f in $(grep -oE '^COPY [a-zA-Z0-9._-]+\.html' Dockerfile | awk '{print $2}'); do
  [ -f "$f" ] || sobran+=("$f")
done

if [ ${#faltan[@]} -eq 0 ] && [ ${#sobran[@]} -eq 0 ]; then
  echo "OK: todas las paginas commiteadas llegan a la imagen."
  exit 0
fi
for f in "${faltan[@]:-}"; do
  [ -n "$f" ] && echo "FALTA en la imagen (nginx la va a servir como la HOME): $f"
done
for f in "${sobran[@]:-}"; do
  [ -n "$f" ] && echo "COPY sin archivo (el build va a fallar): $f"
done
exit 1

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
#
# ── DIRECTORIOS COMPLETOS ────────────────────────────────────────────────
# El Dockerfile tambien copia directorios enteros (`COPY blog/ …`,
# `COPY docs/ …`), y esas paginas SI llegan a la imagen sin una linea propia.
#
# Antes `blog/` estaba excluido con un `grep -v` escrito a mano. Eso funcionaba
# para blog y para nada mas: al agregar `docs/` las cinco paginas nuevas salieron
# como faltantes, siendo que se publican perfecto. Y el modo de falla inverso es
# peor — el dia que alguien agregue un directorio y ADEMAS lo excluya a mano,
# la excepcion tapa el caso real de una pagina suelta sin COPY.
#
# Ahora los directorios se DERIVAN del propio Dockerfile: si esta copiado, su
# contenido esta cubierto; si no, sus paginas se reportan. Una sola fuente.
set -uo pipefail
cd "$(dirname "$0")/.."

locales=$(grep -vE '^\s*(#|$)' .paginas-locales 2>/dev/null || true)

# Directorios que el Dockerfile copia enteros: lineas `COPY <algo>/ <destino>`.
dirs_copiados=$(grep -oE '^COPY [a-zA-Z0-9._/-]+/ ' Dockerfile | awk '{print $2}')

cubierto_por_directorio() {
  local archivo="$1" d
  for d in $dirs_copiados; do
    case "$archivo" in "$d"*) return 0 ;; esac
  done
  return 1
}

faltan=()
for f in $(git ls-files '*.html'); do
  grep -q "^COPY $f " Dockerfile && continue
  cubierto_por_directorio "$f" && continue
  printf '%s\n' "$locales" | grep -qxF "$f" && continue
  faltan+=("$f")
done

sobran=()
for f in $(grep -oE '^COPY [a-zA-Z0-9._-]+\.html' Dockerfile | awk '{print $2}'); do
  [ -f "$f" ] || sobran+=("$f")
done

# Un directorio nombrado en el Dockerfile que no existe rompe el build entero,
# igual que un archivo suelto. Se comprueba por el mismo motivo.
dirs_fantasma=()
for d in $dirs_copiados; do
  [ -d "$d" ] || dirs_fantasma+=("$d")
done

if [ ${#faltan[@]} -eq 0 ] && [ ${#sobran[@]} -eq 0 ] && [ ${#dirs_fantasma[@]} -eq 0 ]; then
  n_dirs=$(printf '%s\n' $dirs_copiados | grep -c . || true)
  echo "OK: todas las paginas commiteadas llegan a la imagen ($n_dirs directorios copiados enteros)."
  exit 0
fi
for f in "${faltan[@]:-}"; do
  [ -n "$f" ] && echo "FALTA en la imagen (nginx la va a servir como la HOME): $f"
done
for f in "${sobran[@]:-}"; do
  [ -n "$f" ] && echo "COPY sin archivo (el build va a fallar): $f"
done
for d in "${dirs_fantasma[@]:-}"; do
  [ -n "$d" ] && echo "COPY de un directorio que no existe (el build va a fallar): $d"
done
exit 1

# -*- coding: utf-8 -*-
"""Tanda de mutaciones de `_verificar_docs.py`.

Una suite que solo pasa no prueba nada: hay que MUTAR. Cada entrada revierte UN
arreglo --dejando los demas en su sitio-- y tiene que tirar SU comprobacion. Si
una sobrevive, esa comprobacion no mira lo que dice mirar.

La ultima es de CONTROL: no cambia nada y la suite tiene que seguir verde. Sin
ella, un harness que falla siempre se leeria como uno que caza todo.

    py docs/_mutar_docs.py
"""
from __future__ import annotations

import io
import os
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)

RUTA = os.path.join("docs", "erp.html")
SUITE = os.path.join("docs", "_verificar_docs.py")

CONTROL = "CONTROL:"

MUTACIONES = [
    # ── F. Las anclas internas ────────────────────────────────────────────
    # El bloque C recorta el `#` antes de resolver, asi que sin el bloque F
    # esta mutacion pasaria en verde y el enlace del indice no haria nada.
    ('<a href="#caminos">¿API o workflows?</a>',
     '<a href="#caminos-que-no-existe">¿API o workflows?</a>',
     "un ancla del indice apunta a un id inexistente: el enlace no hace nada"),

    # ── G. El aviso del 4xx ───────────────────────────────────────────────
    ('la variable <code>_http_status</code>',
     'la variable <code>el codigo</code>',
     "la guia deja de nombrar donde queda el codigo de respuesta"),

    ('sistema responde <strong>5xx</strong>',
     'sistema responde <strong>un error</strong>',
     "se pierde la distincion 4xx/5xx, que es TODO el aviso"),

    ('nodo «Si / Si no» que lo revise',
     'nodo que lo revise',
     "se pierde el QUE HACER: queda un aviso sin salida"),

    ('nodo «Si / Si no» que lo revise',
     'nodo If/Else que lo revise',
     "el nodo se nombra distinto de la pantalla: el cliente no lo encuentra"),

    # ── CONTROL: no debe caer ─────────────────────────────────────────────
    ('<h2 id="caminos">¿API o workflows?</h2>',
     '<h2 id="caminos">¿API o workflows?</h2><!-- seccion 2026-09-10 -->',
     CONTROL + " un comentario no cambia nada, la suite sigue verde"),
]


def _suite_verde() -> bool:
    return subprocess.run([sys.executable, SUITE],
                          capture_output=True).returncode == 0


def main() -> int:
    original = io.open(RUTA, "rb").read()

    if not _suite_verde():
        print("La suite NO esta verde antes de mutar. Abortando.")
        return 2

    cazadas, sobrevivientes, controles = 0, [], 0
    for viejo, nuevo, etiqueta in MUTACIONES:
        v = viejo.encode("utf-8")
        if original.count(v) != 1:
            print("  ANCLA AMBIGUA/AUSENTE (%d): %s"
                  % (original.count(v), etiqueta))
            sobrevivientes.append(etiqueta + " [ancla]")
            continue
        try:
            io.open(RUTA, "wb").write(original.replace(v, nuevo.encode("utf-8")))
            paso = _suite_verde()
        finally:
            # Restaura SIEMPRE: matar el proceso a mitad dejaria una mutacion
            # pegada en el arbol, y la corrida siguiente la tomaria como base.
            io.open(RUTA, "wb").write(original)

        if etiqueta.startswith(CONTROL):
            controles += 1
            print("  %s CONTROL - %s" % ("OK   " if paso else "FALLA", etiqueta))
            if not paso:
                sobrevivientes.append(etiqueta)
            continue

        if paso:
            print("  SOBREVIVE - %s" % etiqueta)
            sobrevivientes.append(etiqueta)
        else:
            cazadas += 1
            print("  CAZADA    - %s" % etiqueta)

    reales = len(MUTACIONES) - controles
    print("\nTANDA: %d/%d cazadas, %d control(es)" % (cazadas, reales, controles))
    if sobrevivientes:
        for s in sobrevivientes:
            print("  SOBREVIVIENTE: %s" % s)
        return 1
    print("TANDA OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())

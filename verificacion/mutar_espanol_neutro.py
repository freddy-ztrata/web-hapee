# -*- coding: utf-8 -*-
"""Tanda de mutaciones de `v_espanol_neutro.py`.

Un detector de texto es facil de escribir mal y dificil de ver mal: una
allowlist demasiado ancha se traga todo y la suite queda en verde para siempre,
afirmando que el sitio esta limpio sin haber mirado nada. Estas mutaciones
reintroducen el voseo --de las cinco formas en que aparecia de verdad-- y cada
una tiene que tirar SU comprobacion.

Las dos ultimas son las que mas importan y no son sobre el sitio, sino sobre el
DETECTOR: ensanchar la allowlist hasta que acepte voseo, y apagar el bloque A.
Sin el bloque A, un detector que no encuentra nada nunca se distingue de un
detector roto.

    py verificacion/mutar_espanol_neutro.py
"""
from __future__ import annotations

import io
import os
import subprocess
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)

SUITE = os.path.join("verificacion", "v_espanol_neutro.py")
ERP = os.path.join("docs", "erp.html")
WH = os.path.join("docs", "webhooks.html")
PP = "politica-privacidad.html"

CONTROL = "CONTROL:"

# (archivo, texto que hay hoy, texto mutado, etiqueta)
MUTACIONES = [
    # ── El voseo vuelve, en sus cinco formas reales ───────────────────────
    (ERP, "Guarda el <code>next_cursor</code>",
     "Guardá el <code>next_cursor</code>",
     "imperativo con vocal acentuada (Guardá)"),

    (ERP, "Puedes fijarlo con", "Podés fijarlo con",
     "presente de 2a persona (podés)"),

    (WH, "Acuérdate de borrarlo", "Acordate de borrarlo",
     "imperativo con pronombre enclitico (Acordate)"),

    (PP, "solicitar copia de los datos personales que tenemos sobre ti",
     "solicitar copia de los datos personales que tenemos sobre vos",
     "el pronombre `vos` en el texto legal"),

    (ERP, "Escríbenos a", "Escribinos a",
     "enclitico de 1a persona plural (Escribinos)"),

    # ── El DETECTOR se rompe ──────────────────────────────────────────────
    (SUITE, '    "caché",  # sustantivo (memoria caché), no el imperativo de "cachar"',
     '    "caché", "guardá", "podés", "acordate", "vos",',
     "la allowlist se ensancha y empieza a aceptar voseo"),

    # ⚠️ La primera version de esta mutacion era `[] or [...]`, que devuelve la
    # lista: no apagaba nada y "sobrevivia" por estar mal construida, no por un
    # hueco de la suite. Antes de culpar a la comprobacion, leer la mutacion.
    (SUITE, "    hay = bool(sospechosas(frase))",
     "    continue" + chr(10) + "    hay = bool(sospechosas(frase))",
     "se apaga el bloque A: el detector deja de probarse a si mismo"),

    # ── CONTROL: no debe caer ─────────────────────────────────────────────
    (ERP, '<h2 id="caminos">', '<h2 id="caminos" data-rev="2026-09-10">',
     CONTROL + " un atributo no es prosa, la suite sigue verde"),
]


def _verde() -> bool:
    return subprocess.run([sys.executable, SUITE],
                          capture_output=True).returncode == 0


def main() -> int:
    if not _verde():
        print("La suite NO esta verde antes de mutar. Abortando.")
        return 2

    cazadas, sobrevivientes, controles = 0, [], 0
    for arch, viejo, nuevo, etiqueta in MUTACIONES:
        original = io.open(arch, "rb").read()
        v = viejo.encode("utf-8")
        if original.count(v) != 1:
            print("  ANCLA AMBIGUA/AUSENTE (%d) en %s: %s"
                  % (original.count(v), arch, etiqueta))
            sobrevivientes.append(etiqueta + " [ancla]")
            continue
        try:
            io.open(arch, "wb").write(original.replace(v, nuevo.encode("utf-8")))
            paso = _verde()
        finally:
            # Restaura SIEMPRE. Matar el proceso a mitad dejaria una mutacion
            # pegada en el arbol -- y peor, la corrida siguiente la tomaria como
            # base y firmaria TANDA OK sobre codigo mutado.
            io.open(arch, "wb").write(original)

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

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
MCP = os.path.join("docs", "mcp.html")
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

    # ── H. El conector MCP ───────────────────────────────────────────────
    # Estas tocan docs/mcp.html o la politica: cuarto elemento = archivo.
    ('Si tu asistente lo supera',
     'Copia vieja: https://mcp.hapee.ai/mcp. Si tu asistente lo supera',
     "una segunda URL del conector se cuela en el texto: dos lugares que cambiar",
     MCP),

    ('<pre><code>https://mcp-oauth.hapee.ai/mcp</code></pre>',
     '<pre><code>https://mcp.hapee.ai/mcp</code></pre>',
     "el bloque publica una URL que no es la vigente",
     MCP),

    ('reemplázala por esta.',
     'reemplázala por esta (antes: hapee-mcp.digitals.cl/c/zmcp_…).',
     "la guia vuelve a ofrecer la conexion con credencial en la URL",
     MCP),

    ('<td>Calendarios y citas</td><td>15</td><td>5</td><td>10</td>',
     '<td>Calendarios y citas</td><td>15</td><td>6</td><td>10</td>',
     "una familia deja de cuadrar consulta + modifican = total",
     MCP),

    ('<td><strong>255</strong></td><td><strong>102</strong></td><td><strong>153</strong></td>',
     '<td><strong>254</strong></td><td><strong>102</strong></td><td><strong>152</strong></td>',
     "la fila Total ya no es la suma de las familias",
     MCP),

    ('<strong>102 de consulta y 153 que modifican datos</strong>',
     '<strong>110 de consulta y 145 que modifican datos</strong>',
     "el texto contradice a la tabla",
     MCP),

    ('<td><code>offline_access</code></td>',
     '<td><code>offline</code></td>',
     "se pierde la explicacion de un scope",
     MCP),

    ('<strong>30 días desde su último uso</strong>',
     '<strong>60 días</strong>',
     "la duracion de la renovacion deja de ser la del servidor",
     MCP),

    ('<a href="mailto:info@hapee.ai">info@hapee.ai</a>.</p>\n    </div>',
     '<a href="mailto:soporte@hapee.ai">soporte@hapee.ai</a>.</p>\n    </div>',
     "el contacto vuelve a la casilla retirada",
     MCP),

    ('<h2 id="conector-mcp">10. MCP connector',
     '<h2>10. MCP connector',
     "la traduccion inglesa pierde el ancla que enlaza la guia",
     "privacy-policy.html"),

    ('<h2 id="conector-mcp">10. Conector MCP para asistentes',
     '<h2 id="conector">10. Conector MCP para asistentes',
     "la politica en espanol pierde el ancla: el enlace de la guia no hace nada",
     "politica-privacidad.html"),

    ('<meta property="og:image" content="https://hapee.ai/img/hapee-mcp-icon.png">',
     '<meta property="og:image" content="https://hapee.ai/img/logo-hapee.png">',
     "la vista previa deja de usar el icono oficial del conector",
     MCP),

    ('srcset="/img/hapee-mcp-icon-256.png 1x, /img/hapee-mcp-icon-512.png 2x"',
     'srcset="/img/hapee-mcp-icon-256.png 1x, /img/hapee-mcp-icon@2x.png 2x"',
     "el icono en pantallas de alta densidad apunta a un archivo que no existe",
     MCP),

    # ── CONTROL: no debe caer ─────────────────────────────────────────────
    ('<h2 id="limites">Límites</h2>',
     '<h2 id="limites">Límites</h2><!-- revisado 2026-10-10 -->',
     CONTROL + " un comentario en la guia MCP no cambia nada",
     MCP),

    ('<h2 id="caminos">¿API o workflows?</h2>',
     '<h2 id="caminos">¿API o workflows?</h2><!-- seccion 2026-09-10 -->',
     CONTROL + " un comentario no cambia nada, la suite sigue verde"),
]


def _suite_verde() -> bool:
    return subprocess.run([sys.executable, SUITE],
                          capture_output=True).returncode == 0


def main() -> int:
    if not _suite_verde():
        print("La suite NO esta verde antes de mutar. Abortando.")
        return 2

    cazadas, sobrevivientes, controles = 0, [], 0
    for mut in MUTACIONES:
        # (viejo, nuevo, etiqueta[, archivo]): sin archivo, la guia del ERP.
        viejo, nuevo, etiqueta = mut[:3]
        ruta = mut[3] if len(mut) > 3 else RUTA
        original = io.open(ruta, "rb").read()
        v = viejo.encode("utf-8")
        if original.count(v) != 1:
            print("  ANCLA AMBIGUA/AUSENTE (%d): %s"
                  % (original.count(v), etiqueta))
            sobrevivientes.append(etiqueta + " [ancla]")
            continue
        try:
            io.open(ruta, "wb").write(original.replace(v, nuevo.encode("utf-8")))
            paso = _suite_verde()
        finally:
            # Restaura SIEMPRE: matar el proceso a mitad dejaria una mutacion
            # pegada en el arbol, y la corrida siguiente la tomaria como base.
            io.open(ruta, "wb").write(original)

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

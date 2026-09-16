# -*- coding: utf-8 -*-
"""El sitio publico se escribe en espanol NEUTRO. Sin voseo.

Es la misma regla que rige la aplicacion, y la web se habia escrito al reves:
161 apariciones repartidas en 12 archivos, incluida la politica de privacidad
--que Meta abre durante el App Review-- y la guia de la API, que es lo primero
que lee el equipo tecnico de un cliente.

**Por que hace falta una suite y no alcanza con acordarse.** El voseo no rompe
nada: la pagina carga, se ve bien y se entiende. No hay error, no hay 404, no
hay build que falle. Reaparece de a una palabra por vez, cada vez que alguien
escribe una guia nueva, y no se nota hasta que alguien lo lee entero de corrido.
Eso es exactamente lo que una comprobacion automatica sirve para sostener.

**Como detecta, y por que asi.** No busca una lista de palabras escrita de
memoria --esa fue la primera version y se le escaparon `conectás`, `respondés`,
`parseás`, `volvés` y todos los encliticos--. Extrae TODA forma que termine en
vocal acentuada o en `-ás`/`-és`/`-ís` y la contrasta contra una allowlist
EXPLICITA de lo que es correcto en neutro. Lo que no este en la allowlist se
reporta: es allowlist y no lista de prohibidos a proposito, porque una palabra
de voseo nueva tiene que caer sola, sin que nadie la haya previsto.

⚠️ La allowlist tiene tres familias y ninguna es voseo:
  1. **Futuros de indicativo** (`cobrará`, `recibirás`, `sabrás`). Son
     correctos en neutro y ademas son la mayoria del texto legal.
  2. **Nombres propios y sustantivos** (`Panamá`, `Andrés`, `Comité`, `país`,
     `inglés`, `Mié` del calendario).
  3. **Formas que el tuteo comparte** (`estás`, `verás`, `Podrás`).
Meterlas en la lista de prohibidos destrozaria el texto, empezando por los
terminos y condiciones.

    py verificacion/v_espanol_neutro.py
"""
from __future__ import annotations

import io
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)

# La consola de este equipo es cp1252 y esta suite imprime justamente las
# palabras acentuadas que viene a medir: sin esto, un UnicodeEncodeError la
# aborta a mitad y el resultado se lee como si hubiera fallado el sitio.
# `errors=replace` y no `strict`: un print nunca puede tumbar una verificacion.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:  # noqa: BLE001 -- si no se puede, se sigue igual
    pass

fallos, oks = [], []


def chk(cond, etiqueta):
    (oks if cond else fallos).append(etiqueta)
    print("  %s %s" % ("OK  " if cond else "FALLA", etiqueta))


def titulo(t):
    print("\n" + "=" * 72)
    print(t)
    print("=" * 72)


# ── Allowlist: lo que TERMINA parecido al voseo y no lo es ────────────────
# Se compara en minuscula. Cada entrada esta medida contra el sitio real; si
# agregas una, deja dicho por que no es voseo.
CORRECTAS = {
    # Adverbios y preposiciones
    "acá", "allá", "allí", "ahí", "aquí", "así", "además", "demás", "después",
    "detrás", "atrás", "través", "jamás", "más", "quizá", "ojalá", "aún",
    "según", "hasta",
    # Sustantivos, adjetivos y nombres propios
    "café", "comité", "país", "inglés", "portugués", "interés", "menú",
    "caché",  # sustantivo (memoria caché), no el imperativo de "cachar"
    "panamá", "andrés", "tomás", "mié", "revés",
    # Pronombres, interrogativos y monosilabos
    "qué", "porqué", "sé", "té", "dé", "sí", "él", "mí", "ti", "sólo",
    # Presente/subjuntivo que el tuteo comparte
    "está", "estás", "esté", "estés", "estén",
}

# Futuros de indicativo: `-rá`, `-rás`, `-rán`, `-ré`, `-rás`. Son correctos en
# neutro y son casi todo el texto legal, asi que se aceptan por REGLA y no una
# por una -- una lista fija de futuros envejeceria con cada parrafo nuevo.
FUTURO = re.compile(r"(?:ar|er|ir)[áé]s?$|r[áé]s?$")

# Pretérito de 1a persona (`Configuré`, `necesité`): un testimonio habla de si
# mismo. Termina en `-é` como el imperativo vos de `-er`, asi que se distingue
# por la persona gramatical, que el regex no ve: van declarados.
PRETERITO_1A = {"configuré", "necesité", "escribí", "empecé", "conecté"}

# Encliticos de voseo. No hay regex razonable --se parecen a sustantivos-- asi
# que van por lista y se amplia cuando aparezca uno nuevo.
ENCLITICOS = ["pasalo", "pasala", "decime", "decinos", "quedate", "acordate",
              "fijate", "asegurate", "mirala", "miralo", "avisanos", "contanos",
              "escribinos", "guardalo", "guardala", "usalo", "usala", "dejalo",
              "tomalo", "ponelo", "ponela", "mandalo", "mandala", "sentate"]

# `vos` y `sos` son inequivocos y no caen en ninguna regex de terminacion.
PRONOMBRES = ["vos", "sos"]

PAT = re.compile(r"\b[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}(?:[áéí]|ás|és|ís)\b")


#: Paginas que NO estan en espanol. Desde 2026-09-16 las dos paginas legales
#: existen tambien en ingles y portugues, y el portugues dispara este detector
#: de lleno: `ate`, `atraves`, `avisa-lo`, `revoga-la` terminan en vocal
#: acentuada igual que el voseo. Se saltan por el `lang` que declara el propio
#: archivo y no por una lista de nombres, para que una traduccion nueva quede
#: cubierta sola.
LANG = re.compile(r'<html[^>]*lang="([a-zA-Z-]+)"')


def es_espanol(ruta: str) -> bool:
    try:
        with io.open(ruta, encoding="utf-8", errors="replace") as f:
            cabeza = f.read(4096)
    except OSError:
        return True
    m = LANG.search(cabeza)
    return True if not m else m.group(1).lower().startswith("es")


def archivos():
    for base, dirs, nombres in os.walk("."):
        if ".git" in base or "node_modules" in base:
            continue
        for n in sorted(nombres):
            if not n.endswith((".html", ".js")):
                continue
            ruta = os.path.join(base, n).replace("\\", "/")
            if ruta.endswith(".html") and not es_espanol(ruta):
                continue
            yield ruta


def texto_visible(src: str) -> str:
    """Se queda con lo que LEE una persona.

    `<style>` se saca entero. `<script>` NO: los comentarios de los ejemplos de
    codigo de las guias (`// deduplicá por evento.id`) son texto que el lector
    lee, y ahi habia voseo. Lo que si se saca son los atributos de las
    etiquetas, donde un `href` o una clase podrian matchear sin ser prosa.
    """
    src = re.sub(r"<style\b.*?</style>", " ", src, flags=re.S | re.I)
    return re.sub(r"<[^>]+>", " ", src)


def sospechosas(vis: str):
    """Devuelve las formas de voseo de un texto ya limpio de marcado."""
    fuera = []
    for w in PAT.findall(vis):
        low = w.lower()
        if low in CORRECTAS or low in PRETERITO_1A:
            continue
        if FUTURO.search(low):
            continue
        fuera.append(w)
    for w in ENCLITICOS + PRONOMBRES:
        n = len(re.findall(r"\b%s\b" % w, vis, re.I))
        fuera.extend([w] * n)
    return fuera


# ══════════════════════════════════════════════════════════════════════════
titulo("A. El detector distingue voseo de lo que solo se le parece")
# ══════════════════════════════════════════════════════════════════════════
# Una suite que solo dice «no encontre nada» no prueba que sepa buscar. Estos
# casos la ejercitan en las dos direcciones ANTES de mirar el sitio: sin esto,
# un detector roto --una allowlist que se traga todo-- daria verde igual.

_antes_de_A = len(oks) + len(fallos)

for frase, esperado in [
    ("Guardá el secret ahora", True),
    ("Podés revocar el acceso", True),
    ("consultás vos con un cursor", True),
    ("Acordate de borrarlo", True),
    ("Te responde quién sos", True),
    ("Guarda el secret ahora", False),
    ("Puedes revocar el acceso", False),
    ("El cambio se aplicará al próximo ciclo", False),
    ("Recibirás un correo y verás el panel", False),
    ("Andrés viaja a Panamá y está en el Comité", False),
    ("No necesité equipo técnico. Configuré todo", False),
]:
    hay = bool(sospechosas(frase))
    chk(hay == esperado, "%s -> %s" % (frase[:46], "voseo" if esperado else "neutro"))


# Un bloque que NO SE EJECUTA no es un pase: la suite saldria en verde con
# menos comprobaciones y nadie lo notaria (rc=0, sin una sola FALLA). Se afirma
# el CONTEO -- es lo unico que distingue "probe y estuvo bien" de "no probe".
chk(len(oks) + len(fallos) - _antes_de_A >= 11,
    "el bloque A ejercito sus casos (corrieron %d)"
    % (len(oks) + len(fallos) - _antes_de_A))


# ══════════════════════════════════════════════════════════════════════════
titulo("B. Ninguna pagina del sitio usa voseo")
# ══════════════════════════════════════════════════════════════════════════

sucios = {}
paginas = 0
for p in archivos():
    paginas += 1
    src = io.open(p, encoding="utf-8", errors="replace").read()
    hall = sospechosas(texto_visible(src))
    if hall:
        sucios[p] = sorted(set(hall))

chk(paginas > 40, "el barrido alcanza el sitio entero (%d archivos)" % paginas)
chk(not sucios, "ninguna pagina usa voseo")
for p, ws in sorted(sucios.items()):
    print("     %s: %s" % (p, ", ".join(ws[:12])))


# ══════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 72)
print("RESUMEN: %d OK, %d FALLAS" % (len(oks), len(fallos)))
if fallos:
    for f in fallos:
        print("  FALLA  " + f)
print("=" * 72)
sys.exit(1 if fallos else 0)

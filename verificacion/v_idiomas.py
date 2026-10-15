# -*- coding: utf-8 -*-
"""Las versiones en ingles (/en/) y portugues (/pt/) del sitio estan completas y bien cableadas.

Desde 2026-10-15 cada pagina publicada existe en tres idiomas con el mismo slug
(ver "Languages" en CLAUDE.md). Nada de esto rompe nada si falla: una pagina sin
traduccion simplemente se queda en espanol para todos, un link sin prefijo saca
al visitante al espanol, un `lang` equivocado deja el boton de WhatsApp en otro
idioma. Justamente por eso hace falta comprobarlo: no se nota mirando.

Comprueba:
  1. toda pagina en espanol publicada tiene su `en/` y su `pt/`;
  2. cada traduccion declara su `<html lang>`, su canonical con prefijo, carga
     js/lang.js y no tiene links internos sin prefijo de idioma;
  3. lista para revisar a mano cada mencion de prueba gratis, reembolso o
     garantia en los otros idiomas (puede estar negada, por eso no falla).

    py verificacion/v_idiomas.py
"""
from __future__ import annotations

import glob
import io
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:  # noqa: BLE001
    pass

fallos, oks = [], []


def chk(cond, etiqueta):
    (oks if cond else fallos).append(etiqueta)
    if not cond:
        print("  FALLA", etiqueta)


def leer(ruta):
    with io.open(ruta, encoding="utf-8", errors="replace") as f:
        return f.read()


# Las legales tienen traduccion propia con otro nombre; la verificacion de Google no es una pagina.
NO_TRADUCIR = {"google88e8bcc2e3eec4c4.html", "terminos.html", "terms.html", "termos.html",
               "politica-privacidad.html", "privacy-policy.html", "politica-privacidade.html"}
LEGAL = {"en": {"/terminos.html": "/terms.html", "/politica-privacidad.html": "/privacy-policy.html"},
         "pt": {"/terminos.html": "/termos.html", "/politica-privacidad.html": "/politica-privacidade.html"}}


def paginas_espanol():
    docker = leer("Dockerfile")
    sueltas = re.findall(r"^COPY ([a-z0-9._-]+\.html) ", docker, re.M)
    dirs = re.findall(r"^COPY ([a-z0-9._-]+)/ ", docker, re.M)
    out = [p for p in sueltas if p not in NO_TRADUCIR]
    for d in dirs:
        if d in ("en", "pt"):
            continue
        out += sorted(glob.glob(d + "/**/*.html", recursive=True))
    return out


print("1. Cada pagina publicada existe en ingles y portugues")
for p in paginas_espanol():
    for lang in ("en", "pt"):
        chk(os.path.isfile(os.path.join(lang, p)), "%s/%s existe" % (lang, p))

print("2. Cada traduccion esta bien cableada")
HREF = re.compile(r'href="(/[^"]*)"')
NO_PAGINA = re.compile(r"^/(?:en|pt)(?:/|$|[?#])|^//|^/(?:api|img|js|review)/|\.(?!html\b)[a-z0-9]{2,5}(?:[?#]|$)", re.I)
LEGALES_OK = {"/terms.html", "/termos.html", "/privacy-policy.html", "/politica-privacidade.html"}

for lang in ("en", "pt"):
    for ruta in sorted(glob.glob(lang + "/**/*.html", recursive=True)):
        s = leer(ruta)
        m = re.search(r'<html[^>]*lang="([a-zA-Z-]+)"', s)
        chk(bool(m) and m.group(1).lower().startswith(lang), "%s declara lang=%s" % (ruta, lang))
        canon = re.search(r'<link rel="canonical" href="([^"]+)"', s)
        if canon:
            chk(canon.group(1).startswith("https://hapee.ai/%s/" % lang), "%s canonical con /%s/" % (ruta, lang))
        chk("/js/lang.js" in s, "%s carga js/lang.js" % ruta)
        sueltos = [h for h in HREF.findall(s)
                   if not NO_PAGINA.search(h) and h.split("#")[0].split("?")[0] not in LEGALES_OK]
        chk(not sueltos, "%s sin links internos al espanol %s" % (ruta, sueltos[:5] if sueltos else ""))
        for es, trad in LEGAL[lang].items():
            chk('href="%s' % es not in s, "%s enlaza la legal traducida (%s)" % (ruta, trad))

print("3. Reglas de negocio en ingles y portugues (a revisar, no falla)")
# No es FALLA automatica: la frase prohibida aparece legitimamente negada
# ("no free trial", "pagamentos nao reembolsaveis", el prompt del chat que dice
# "nunca prometas reembolsos"). Se listan con contexto para leerlas.
PROHIBIDO = re.compile(
    r"free[ -]trial|\btrial\b|days? free|money[- ]back|\brefund\w*|guarantee\w*|"
    r"teste gr[aá]tis|per[ií]odo de teste|reembols\w*|garantia\w*|"
    r"(?:soporte|suporte|support)@hapee\.ai", re.I)
revisar = 0
for lang in ("en", "pt"):
    for ruta in sorted(glob.glob(lang + "/**/*.html", recursive=True)):
        s = re.sub(r"<style.*?</style>", " ", leer(ruta), flags=re.S | re.I)
        for hit in PROHIBIDO.finditer(s):
            revisar += 1
            ctx = s[max(0, hit.start() - 60):hit.end() + 60].replace("\n", " ")
            print("  REVISAR %s: ...%s..." % (ruta, ctx.strip()))
if not revisar:
    print("  (nada que revisar)")

print()
print("%d OK, %d FALLAS" % (len(oks), len(fallos)))
sys.exit(1 if fallos else 0)

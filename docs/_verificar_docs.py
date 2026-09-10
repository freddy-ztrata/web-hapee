# -*- coding: utf-8 -*-
"""Verifica la documentacion publica de la API antes de publicarla.

LA COMPROBACION QUE DE VERDAD IMPORTA ES LA A, y es especifica de este
repositorio: **el Dockerfile copia las paginas y un archivo que no llega a la
imagen NO da 404** -- nginx lo sirve con el catch-all (`try_files ... /index.html`)
y devuelve la PORTADA con estado 200. O sea que una guia que falta se ve igual
que una URL inventada, y no hay error en ningun lado. Ya paso en este sitio con
`eliminacion-datos.html`, que la politica de privacidad linkea y que Meta abre
durante el App Review.

Por eso `docs/` se copia como DIRECTORIO entero: agregar una guia nueva no
depende de que alguien se acuerde de sumar su linea. Esta suite lo afirma.

    py docs/_verificar_docs.py
"""
from __future__ import annotations

import io
import os
import re
import sys
from html.parser import HTMLParser

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(RAIZ)

fallos, oks = [], []


def chk(cond, etiqueta):
    (oks if cond else fallos).append(etiqueta)
    print("  %s %s" % ("OK  " if cond else "FALLA", etiqueta))


def titulo(t):
    print("\n" + "=" * 72)
    print(t)
    print("=" * 72)


PAGINAS = ["docs/index.html", "docs/empezar.html", "docs/erp.html",
           "docs/webhooks.html", "docs/referencia.html"]
ESTATICOS = ["docs/docs.css", "docs/docs.js"]


def leer(p):
    return io.open(p, encoding="utf-8").read()


# ══════════════════════════════════════════════════════════════════════════
titulo("A. El Dockerfile SI copia lo que se publica")
# ══════════════════════════════════════════════════════════════════════════
# La regla GENERAL --toda pagina commiteada llega a la imagen-- la afirma
# `verificacion/paginas_en_imagen.sh`, que es el verificador canonico de este
# repositorio y ya deriva los directorios copiados del propio Dockerfile.
# Repetirla aca seria una segunda copia que diverge.
#
# Lo unico que se comprueba en esta suite es lo especifico de docs/: que se
# copie como DIRECTORIO. Si alguien lo cambiara a copias individuales, agregar
# una guia nueva volveria a depender de que se acuerden de sumar su linea.

dockerfile = leer("Dockerfile")
chk("COPY docs/ /usr/share/nginx/html/docs/" in dockerfile,
    "docs/ se copia como DIRECTORIO entero (no pagina por pagina)")
chk(os.path.exists("verificacion/paginas_en_imagen.sh"),
    "existe el verificador canonico de COPY, que cubre la regla general")


# ══════════════════════════════════════════════════════════════════════════
titulo("B. Las paginas existen y estan bien formadas")
# ══════════════════════════════════════════════════════════════════════════

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.error = None
        self.enlaces = []
        self.recursos = []
        self.titulo = None
        self._en_titulo = False

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "a" and d.get("href"):
            self.enlaces.append(d["href"])
        if tag == "link" and d.get("href"):
            self.recursos.append(d["href"])
        if tag == "script" and d.get("src"):
            self.recursos.append(d["src"])
        if tag == "title":
            self._en_titulo = True

    def handle_endtag(self, tag):
        if tag == "title":
            self._en_titulo = False

    def handle_data(self, data):
        if self._en_titulo and not self.titulo:
            self.titulo = data.strip()


parseadas = {}
for p in PAGINAS + ESTATICOS:
    chk(os.path.exists(p), "existe %s" % p)

for p in PAGINAS:
    if not os.path.exists(p):
        continue
    src = leer(p)
    par = Parser()
    try:
        par.feed(src)
        ok = True
    except Exception as e:  # noqa: BLE001
        ok = False
        print("     %s" % e)
    chk(ok, "%s parsea como HTML" % os.path.basename(p))
    parseadas[p] = par

    chk(bool(par.titulo), "%s tiene <title>" % os.path.basename(p))
    chk('name="description"' in src, "%s tiene meta description" % os.path.basename(p))
    chk('rel="canonical"' in src, "%s declara su canonical" % os.path.basename(p))


# ══════════════════════════════════════════════════════════════════════════
titulo("C. Ningun enlace interno apunta a la nada")
# ══════════════════════════════════════════════════════════════════════════
# nginx resuelve `/docs/erp` -> `docs/erp.html` por `try_files $uri $uri.html`.
# Un enlace roto NO da 404: cae al catch-all y devuelve la portada con 200, que
# es exactamente lo que hace invisible el defecto.

def resuelve(href: str) -> bool:
    ruta = href.split("#")[0].split("?")[0]
    if not ruta or ruta == "/":
        return True
    if ruta.startswith(("http://", "https://", "mailto:", "tel:")):
        return True   # externo: no se comprueba acá
    rel = ruta.lstrip("/")
    if rel.endswith("/"):
        return os.path.exists(os.path.join(rel, "index.html"))
    return os.path.exists(rel) or os.path.exists(rel + ".html")


rotos = []
for p, par in parseadas.items():
    for href in par.enlaces + par.recursos:
        if not resuelve(href):
            rotos.append("%s -> %s" % (os.path.basename(p), href))

chk(not rotos, "todos los enlaces internos resuelven a un archivo real")
for r in rotos:
    print("     ROTO: %s" % r)


# ══════════════════════════════════════════════════════════════════════════
titulo("D. Coherencia entre paginas")
# ══════════════════════════════════════════════════════════════════════════

for p, par in parseadas.items():
    nombre = os.path.basename(p)
    chk("/docs/docs.css" in par.recursos, "%s carga el CSS compartido" % nombre)
    if nombre != "referencia.html":
        chk("/docs/docs.js" in par.recursos, "%s carga el JS compartido" % nombre)

# La barra de navegacion tiene que ser la MISMA en las cinco: con una copia por
# pagina, agregar una guia deja cuatro barras sin el enlace nuevo.
navs = {}
for p in parseadas:
    src = leer(p)
    m = re.search(r'<div class="dv-nav-links">(.*?)</div>', src, re.S)
    if m:
        # Se ignora la clase `activo`, que SI cambia por pagina a proposito.
        navs[p] = re.sub(r'\s+class="activo"', "", m.group(1)).strip()

chk(len(set(navs.values())) == 1,
    "la barra de navegacion es identica en las %d paginas (salvo el marcador "
    "de pagina activa)" % len(navs))

# Cada pagina marca SU propio enlace como activo.
for p in parseadas:
    nombre = os.path.basename(p).replace(".html", "")
    src = leer(p)
    m = re.search(r'<a href="([^"]*)" class="activo">', src)
    esperado = "/docs/" if nombre == "index" else "/docs/" + nombre
    chk(m is not None and m.group(1) == esperado,
        "%s se marca a si misma como activa en la barra" % os.path.basename(p))


# ══════════════════════════════════════════════════════════════════════════
titulo("E. El contrato al que apunta la referencia")
# ══════════════════════════════════════════════════════════════════════════

ref = leer("docs/referencia.html")
chk("beta.hapee.ai/api/v1/openapi.json" in ref,
    "la referencia lee el contrato EN VIVO de la aplicacion")
chk(ref.count("openapi.json") >= 2,
    "y ademas ofrece el enlace de descarga fuera del marco, por si la app no responde")

# El sitemap tiene que conocer las paginas, o no las indexa nadie.
sitemap = leer("sitemap.xml")
for p in PAGINAS:
    slug = os.path.basename(p).replace(".html", "")
    url = "https://hapee.ai/docs/" if slug == "index" else "https://hapee.ai/docs/%s" % slug
    chk(url in sitemap, "el sitemap incluye %s" % url)


# ══════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 72)
print("RESUMEN: %d OK, %d FALLAS" % (len(oks), len(fallos)))
if fallos:
    for f in fallos:
        print("  FALLA  " + f)
print("=" * 72)
sys.exit(1 if fallos else 0)

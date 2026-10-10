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
           "docs/webhooks.html", "docs/mcp.html", "docs/referencia.html"]
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
titulo("F. Las anclas internas existen")
# ══════════════════════════════════════════════════════════════════════════
# El bloque C RECORTA el `#` antes de resolver, asi que un `href="#caminos"`
# sin su `id="caminos"` pasa en verde ahi. Es el mismo modo de falla que esta
# suite existe para cerrar: nadie recibe un error, el enlace no hace nada.

anclas_rotas = []
for p, par in parseadas.items():
    ids = set(re.findall(r'\sid="([^"]+)"', leer(p)))
    for href in par.enlaces:
        if "#" not in href:
            continue
        destino, frag = href.split("#", 1)
        # Solo las de ESTA pagina: un ancla de otra se comprueba al parsearla.
        if destino and destino not in ("", "/"):
            continue
        if frag and frag not in ids:
            anclas_rotas.append("%s -> #%s" % (os.path.basename(p), frag))

chk(not anclas_rotas, "toda ancla interna apunta a un id que existe")
for a in anclas_rotas:
    print("     ANCLA ROTA: %s" % a)


# ══════════════════════════════════════════════════════════════════════════
titulo("G. El aviso que mas caro sale aprender solo")
# ══════════════════════════════════════════════════════════════════════════
# Medido en `workflow_engine_service._action_webhook_out`: la unica rama que
# devuelve `mode="fail"` es `500 <= status < 600`. O sea que un 401 del sistema
# del cliente cae en `continue` y el workflow sigue como si hubiera funcionado.
# Nada falla, nada se registra como error, y el operador se entera cuando le
# preguntan por las ventas que nunca llegaron.

erp = leer("docs/erp.html")
chk("_http_status" in erp,
    "la guia nombra la variable donde queda el codigo de respuesta")
chk("5xx" in erp and "4xx" in erp,
    "y dice que la diferencia esta entre 4xx y 5xx")
# Se acota al AVISO donde vive `_http_status`: «If/Else» aparece tambien en la
# tabla comparativa de mas abajo, asi que un `in erp` pelado pasa en verde con
# la instruccion borrada -- pasa por la OTRA aparicion.
# Se acota al PARRAFO, no al aviso: dentro del mismo aviso el nombre del nodo
# aparece dos veces, asi que borrar la instruccion dejaba el check en verde por
# la OTRA aparicion. Contar apariciones en un bloque no prueba la rama que
# importa -- la instruccion y `_http_status` viven en el MISMO <p>.
_parrafos = re.findall(r"<p>(.*?)</p>", erp, re.S)
_aviso_4xx = next((a for a in _parrafos if "_http_status" in a), "")
# El nombre va EXACTO al de la pantalla (`wf.catalog.logic.if_else` = "Si / Si
# no" en el catalogo de la app). Un nombre inventado manda al cliente a buscar
# un nodo que no va a encontrar, y ahi concluye que el aviso esta vencido.
chk(bool(_aviso_4xx) and "«Si / Si no»" in _aviso_4xx,
    "y dice QUE hacer, nombrando el nodo como se llama en la pantalla")

# ══════════════════════════════════════════════════════════════════════════
titulo("H. El conector MCP: lo que un revisor del directorio va a comprobar")
# ══════════════════════════════════════════════════════════════════════════
# La URL del conector vive en UN solo lugar de la pagina (el bloque
# `#url-conector`); el resto del texto dice «la URL del conector». Cuando se
# haga el corte a mcp.hapee.ai se cambia esta constante y ese bloque, nada mas:
# si la URL apareciera repetida, una copia vieja quedaria mandando gente al
# servidor retirado sin que nada falle.
URL_CONECTOR = "https://mcp-oauth.hapee.ai/mcp"

mcp = leer("docs/mcp.html")
_bloque_url = re.search(r'id="url-conector">\s*<pre><code>([^<]+)</code>', mcp)
chk(bool(_bloque_url) and _bloque_url.group(1).strip() == URL_CONECTOR,
    "la guia MCP publica la URL vigente del conector en su bloque #url-conector")
_urls_mcp = re.findall(r"https://[a-z0-9.-]*hapee\.ai/mcp\b", mcp)
chk(_urls_mcp == [URL_CONECTOR],
    "y la URL aparece UNA sola vez (un solo lugar que cambiar en el corte)")
# La forma vieja (URL secreta por persona, via el proxy por-slug) no se
# documenta: es justamente lo que el conector OAuth reemplaza.
chk("hapee-mcp.digitals.cl" not in mcp and "/c/zmcp_" not in mcp,
    "la guia no ofrece la conexion vieja con credencial en la URL")

# Los numeros de la tabla tienen que cuadrar: total = consulta + modifican por
# fila, la fila Total es la suma, y el texto dice lo mismo que la tabla. Los
# valores salen de las anotaciones reales del MCP (255 = 102 + 153).
_tabla = re.search(r'<table id="tabla-herramientas">(.*?)</table>', mcp, re.S)
_filas = []
if _tabla:
    for fila in re.findall(r"<tr>(.*?)</tr>", _tabla.group(1), re.S):
        celdas = [re.sub(r"<[^>]+>", "", c).strip()
                  for c in re.findall(r"<td>(.*?)</td>", fila, re.S)]
        if len(celdas) == 4 and all(c.isdigit() for c in celdas[1:]):
            _filas.append((celdas[0], int(celdas[1]), int(celdas[2]), int(celdas[3])))
_cuerpo = [f for f in _filas if f[0] != "Total"]
_total = next((f for f in _filas if f[0] == "Total"), None)
chk(bool(_cuerpo) and all(t == r + w for _, t, r, w in _cuerpo),
    "cada familia de herramientas suma consulta + modifican = total")
chk(_total is not None and _total[1:] == (sum(f[1] for f in _cuerpo),
                                          sum(f[2] for f in _cuerpo),
                                          sum(f[3] for f in _cuerpo)),
    "la fila Total es la suma de las familias")
chk(_total is not None and _total[1:] == (255, 102, 153),
    "y coincide con el MCP real: 255 herramientas, 102 de consulta, 153 que modifican")
chk("<strong>255 herramientas</strong>" in mcp
    and "<strong>102 de consulta y 153 que modifican datos</strong>" in mcp,
    "el texto dice los mismos numeros que la tabla")

for _scope in ("hapee:read", "hapee:write", "offline_access"):
    chk("<td><code>%s</code></td>" % _scope in mcp,
        "la tabla de permisos explica el scope %s" % _scope)
chk("elegir_subcuenta" in mcp, "explica como elige subcuenta el equipo de agencia")
chk("<strong>1 hora</strong>" in mcp and "<strong>30 días desde su último uso</strong>" in mcp
    and "<strong>90 días</strong>" in mcp,
    "dice cuanto duran el acceso (1 h), la renovacion (30 d) y el tope (90 d)")
chk("mailto:info@hapee.ai" in mcp and "soporte@" not in mcp,
    "el contacto es info@hapee.ai (soporte@ esta retirado)")

# El icono del conector es el de las apps (h blanca sobre degradado). El
# bloque C no mira <img> ni <meta>, y nginx da 404 real a un .png que falta:
# la tarjeta del directorio y la vista previa saldrian sin imagen, sin error.
def _png_lado(ruta):
    try:
        b = io.open(ruta, "rb").read(24)
    except OSError:
        return None
    if b[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    return int.from_bytes(b[16:20], "big"), int.from_bytes(b[20:24], "big")


for _ico, _lado in (("img/hapee-mcp-icon.png", 1024), ("img/hapee-mcp-icon-512.png", 512),
                    ("img/hapee-mcp-icon-256.png", 256)):
    chk(_png_lado(_ico) == (_lado, _lado), "%s existe y es un PNG de %dx%d" % (_ico, _lado, _lado))
_refs_ico = re.findall(r'(?:src|content)="(?:https://hapee\.ai)?(/img/hapee-mcp-icon[^" ]*\.png)"', mcp)
_refs_ico += re.findall(r'(/img/hapee-mcp-icon[^" ]*\.png) \dx', mcp)
chk('property="og:image" content="https://hapee.ai/img/hapee-mcp-icon.png"' in mcp,
    "la guia declara el icono del conector como og:image")
chk(bool(_refs_ico) and all(os.path.exists(r.lstrip("/")) for r in _refs_ico),
    "toda referencia al icono del conector apunta a un archivo real")

# El enlace a la politica lleva ancla, y el bloque C la recorta: hay que
# mirar que el id exista en la politica, y en sus dos traducciones.
chk('href="/politica-privacidad.html#conector-mcp"' in mcp,
    "la guia enlaza la seccion del conector en la politica de privacidad")
for _pol in ("politica-privacidad.html", "privacy-policy.html", "politica-privacidade.html"):
    chk('id="conector-mcp"' in leer(_pol),
        "%s tiene la seccion #conector-mcp" % _pol)

# ══════════════════════════════════════════════════════════════════════════
print("\n" + "=" * 72)
print("RESUMEN: %d OK, %d FALLAS" % (len(oks), len(fallos)))
if fallos:
    for f in fallos:
        print("  FALLA  " + f)
print("=" * 72)
sys.exit(1 if fallos else 0)

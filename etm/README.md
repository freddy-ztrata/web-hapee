# Hapee · ETM Day — app del stand

App web instalable (PWA) que funciona **100 % sin internet**: diagnóstico de 3 preguntas → registro → pantalla «Habilitado para girar la ruleta». Los datos quedan en la tablet (IndexedDB + respaldo en localStorage) y se exportan a CSV.

**URL en producción:** https://hapee.ai/etm/ (noindex, fuera del menú y del sitemap)

Archivos: `index.html`, `app.css`, `app.js`, `sw.js`, `manifest.webmanifest`, `img/` (logo e íconos), `fonts/` (Plus Jakarta Sans local). Sin dependencias externas, sin build.

## 1. Publicar

### En hapee.ai (cómo está hoy)
Vive en el repo `web-hapee`, carpeta `etm/`. El `Dockerfile` la copia (`COPY etm/ …`) y `nginx.conf` tiene un bloque `location ^~ /etm/` (no-cache, noindex, 404 de verdad). Push a `master` = deploy automático en Dokploy.

**Para publicar un cambio:** edita, sube `VERSION` en `sw.js` (ej. `hapee-etm-v2`) y, si cambiaste `app.css` o `app.js`, sube el `?v=` en `index.html` **y** en la lista `ARCHIVOS` de `sw.js`. Commit + push. Las tablets toman la versión nueva la próxima vez que abran la app con internet (ábrela, ciérrala y vuelve a abrirla).

### Alternativa: Vercel
El manifest usa rutas `/etm/`, así que se publica la carpeta **que contiene** `etm/`:
1. `mkdir hapee-etm-sitio && cp -R etm hapee-etm-sitio/`
2. `cd hapee-etm-sitio && npx vercel@latest --prod` (inicia sesión si lo pide; acepta los valores por defecto: sin framework, sin build, directorio `./`).
3. Abre `https://<tu-proyecto>.vercel.app/etm/`.

### Alternativa: Netlify
1. Igual que arriba: una carpeta `hapee-etm-sitio/` con `etm/` adentro.
2. Entra a https://app.netlify.com/drop y arrastra la carpeta `hapee-etm-sitio` (o por terminal: `npx netlify-cli deploy --prod --dir hapee-etm-sitio`).
3. Abre `https://<tu-sitio>.netlify.app/etm/`.

Ambos dan HTTPS, que el service worker necesita.

## 2. Instalar en las tablets (con internet, el día antes)

**iPad (Safari):** abre `https://hapee.ai/etm/` → espera 5 segundos → botón **Compartir** → **Agregar a inicio** → Agregar. Abre la app **desde el ícono** una vez con internet.
> Importante en iPad: la app instalada y la pestaña de Safari guardan datos por separado. Usa **siempre el ícono**.

**Android (Chrome):** abre `https://hapee.ai/etm/` → menú **⋮** → **Instalar app** (o «Agregar a pantalla principal») → Instalar. Abre la app desde el ícono una vez con internet.

**Luego, en cada tablet:** entra al panel (ver 4) y pon la **letra de la tablet**: `A` en la primera, `B` en la segunda. Guardar configuración.

## 3. Comprobar que funciona sin internet
1. Entra al panel: la línea de estado debe decir **Modo offline: listo** (service worker activo, 11 archivos en caché).
2. Activa **modo avión**.
3. Cierra la app por completo (deslízala fuera del multitarea) y ábrela desde el ícono.
4. Haz un registro de prueba completo; en el panel debe aparecer y el estado decir «sin internet».
5. Antes del evento borra ese registro de prueba: exporta y usa **Borrar todo** (la numeración sigue; si quieres partir en 001, usa «Reiniciar numeración»).

## 4. Panel de administración
- **Entrar:** mantén presionado el **logo Hapee** (arriba a la izquierda) **3 segundos** (se llena una barra arriba) → PIN **2026** (se cambia en el panel).
- Ver registros de hoy / todos, asignar **premio** (lista editable, o «Otro…» para escribirlo) y **¿Demo? Sí/No** a cada persona. Todo se guarda al instante.
- Configurar letra de la tablet, PIN y lista de premios.
- El panel se cierra solo tras 3 minutos sin tocarlo; el flujo de los asistentes vuelve al inicio tras 60 segundos sin tocar (sin guardar registros a medias).

## 5. Exportar al final del día
En el panel → **Exportar CSV** (archivo `hapee-etm-<tablet>-<fecha>.csv`, separado por «;» y UTF-8 con BOM: se abre directo en Excel en español con tildes correctas).
- **Android:** queda en *Descargas*.
- **iPad:** usa **Compartir CSV** → *Guardar en Archivos*, *Mail* o *AirDrop* (en la app instalada la descarga directa a veces no funciona).
- Si nada de eso funciona: **Ver / copiar CSV** → *Copiar al portapapeles* y pégalo en un correo o en Notas.

Columnas: `id_participante; tablet; fecha_hora; nombre; whatsapp; empresa; cargo; email; p1; p2; p3; puntaje; nivel_riesgo; premio; quiere_demo; consentimiento`.
Si Excel muestra el WhatsApp como número, importa con *Datos → Desde texto/CSV* y marca esa columna como Texto.

**Borrar todo** solo se activa cuando exportaste después del último cambio, y pide doble confirmación. Los números de participante nunca se repiten.

## Ajustes rápidos
- **Colores:** bloque `:root` al inicio de `app.css`.
- **Textos de preguntas, resultados y premios por defecto:** al inicio de `app.js` (`PREGUNTAS`, `RESULTADOS`, `PREMIOS_DEF`).
- **Puntaje:** cada respuesta vale 0–3 en el orden mostrado; 0–3 = BAJO, 4–6 = MEDIO, 7–9 = ALTO.

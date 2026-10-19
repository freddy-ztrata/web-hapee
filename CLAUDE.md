# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Landing site for **Hapee.ai** — an AI conversational platform + automation + CRM by WM Digital, LLC (Digitals Group). Static HTML/CSS/JS with a thin nginx reverse-proxy layer for AI features. No build step, no bundler, no framework. Deployed via Docker on Dokploy.

## Site map

**Deployed via Docker.** The `Dockerfile` copies pages **one by one** (plus the `blog/`, `docs/`, `img/`, `js/` directories whole). A committed `.html` without its `COPY` line never reaches the image, and nginx's catch-all serves the **home page with a 200** for its URL — no 404, no log error, it just looks like an invented URL. This has bitten twice (`eliminacion-datos.html`, `marca.html`). Run `bash verificacion/paginas_en_imagen.sh` before pushing; pages that are deliberately unpublished are listed in `.paginas-locales`.

Main funnel:
- `index.html` — Main landing (~3500 lines). CSS in `<style>`, JS in `<script>`. Hosts an interactive **Hapee AI chat** that streams through nginx → Anthropic + ElevenLabs. Also has orbital robot hero + platform showcase + Hapee Interact demo.
- `agenda-tu-demo.html` — Demo booking landing. Same full nav + mobile menu as `index.html` (since 2026-09-13; keep both in sync). Includes VSL video, embedded Hapee booking calendar (`beta.hapee.ai`), home-page widgets, sticky demo CTAs (mobile bar + desktop pill).
- `partners.html` — Reseller/partners program landing. The application form is **hosted by the app**: `<div data-zentru-form="hapee/hapee-partners" data-mode="inline">` + `https://beta.hapee.ai/static/form-embed.js` (since 2026-09-14, replacing an in-page form that opened a `mailto:`). The script mounts the iframe, auto-resizes it by postMessage and syncs the theme by reading `html.dark`, so it follows the page toggle. Submissions land in the app, not in an inbox.
- `comparativa.html` — Hapee vs. competitors table.
- `planes.html` — Self-service pricing + Stripe checkout (see the pricing section at the bottom of this file).
- `compra-exitosa.html` — Stripe checkout success page (polls the app; creates nothing).
- `gracias-compra.html` — Legacy GHL post-purchase thank-you page.
- `agentes-ia-whatsapp.html` — WhatsApp AI-agent landing with its **own** GHL calendar (`always.hapee.ai/widget/booking/dxPntqtyC5ZeHsKLKupa`) — do not swap it for the Hapee calendar.
- `academia.html` — Academia Hapee onboarding page (`/academia`, linked from the nav).
- `webinar.html` — Webinar landing with a per-country schedule table and its own link-preview card.
- `preparate-demo.html` — Post-booking "prepárate para tu demo" page (`/preparate-demo`, `noindex,follow`). The Hapee calendar redirects here after a booking; replaces the old GHL page at `be.hapee.ai/preparate-demo`. Optional query params `?nombre=`, `?fecha=<ISO-8601 with offset>`, `?tz=` personalize the greeting / countdown / add-to-calendar; everything hides gracefully without them. Not in `sitemap.xml` on purpose.
- `demo-countdown.html` — One-pager with 5-min countdown the **host projects during the call** before the demo starts (not sent to leads). `noindex,nofollow`.
- `dossier-x8k4m2.html`, `demoday-via-x7m2.html` — Unlisted sales collateral (obfuscated slugs, `noindex,nofollow,noarchive`). Shared by link only; never add to nav or sitemap.

Content:
- `blog.html` + `blog/*.html` — Blog index plus articles. Articles share `blog/article.css` and `blog/article.js`. Add new articles to `blog.html` and `sitemap.xml`.
- `docs/` — Public API documentation (`hapee.ai/docs`): `index`, `empezar`, `referencia`, `webhooks`, `erp`, `mcp` (MCP connector guide, OAuth per user; its URL lives ONLY in the `#url-conector` block and in `URL_CONECTOR` of `_verificar_docs.py` — change both at the cutover to `mcp.hapee.ai`), sharing `docs/docs.css` + `docs/docs.js`. Copied as a whole directory, so a new guide needs no `COPY` line; `py docs/_verificar_docs.py` asserts that and checks internal links.
- `rrss-templates.html` — Social media template gallery.
- `transformacion.html` — Before/after transformation showcase (uses `img/transformacion-*.mp4`).
- `juego.html` — Interactive game/entertainment page. Served at `/juego` (clean URL).

Legal:
- `politica-privacidad.html` — Privacy policy (Chile Ley 21.719, GDPR, US).
- `terminos.html` — Terms of service. **No trial + no refund** policy lives in sections 4.2 and 5.
- `eliminacion-datos.html` — Data-deletion instructions. Linked from the privacy policy and opened by **Meta during App Review** — must always be in the image.

Assets:
- `js/whatsapp.js` — Site-wide floating WhatsApp button (loaded via `<script src="/js/whatsapp.js" defer>` on every deployed page except `demo-countdown.html`). Single source of truth for contact number + prefilled message.
- `js/robot/hapee-robot.js` — **loader for the decorative live robot in the home hero** (since 2026-10-17). Loaded with `<script src="/js/robot/hapee-robot.js" defer>` ONLY on `index.html` (es/en/pt); adds no visible text. Registers the `[data-hapee-robot]` views and keeps a minimal `window.HapeeRobot` (idle + arrival wave) read by `robot-view.js`. **The robot has NO connection to any chat** (owner decision): clicking/tapping it does nothing besides drag-to-rotate, and the home chat code has no robot hooks. Don't wire it to `/api/chat`. (A site-wide floating chat assistant was prototyped on 2026-10-17 and dropped — there is no floating chat.)
- `js/robot/` — the code-built **3D Hapee robot** (three.js r160 from jsDelivr, no GLB). `robot.js` = the model (`load(THREE, {RoundedBoxGeometry}) → {root, animate, parts, screen}`; shared with `propuesta-2026-r8x4/hero-robot.js`, which imports it from `/js/robot/robot.js`). `robot-view.js` = one WebGLRenderer + one robot copied into every `[data-hapee-robot]` view (home hero `hero`, platform showcase «Asistente» `showcase`): breathes, looks around, head follows the cursor (desktop), waves on arrival, drag to rotate; chest screen shows the logo. Lazy (desktop AND mobile since 2026-10-17): never before the `load` event; after it, ~2.5 s + idle or the first interaction, whichever comes first. The hero's first paint and fallback is `img/robot-v2.webp|png` (+ `-280` for mobile; `<picture>` + srcset, preloaded): a headless render of this same code-built robot in its exact initial pose/camera, cropped to the `img.hero-robot` box, so the image→3D crossfade is seamless (if you change `robot.js` or the framing in `robot-view.js`, re-render it). Since 2026-10-17 every robot image on the public site is a render of this robot: `img/robot-v2.*` (full body, same 435:800 aspect as the old file) for heroes/CTAs/video posters/CSS backgrounds/JSON-LD, `img/robot-v2-avatar.*` (192², head/bust with a faded bottom) for chat and phone avatars, `img/robot-v2-showcase.*` (540×772, same framing as the 3D «Asistente» showcase view) for that tab's poster; `<img>` tags use `<picture style="display:contents">` webp+png (so existing `.parent img` selectors keep working — don't write `.parent>img` for these). `img/robot.png` (the old robot) stays in the repo only for external links/emails and must not be referenced by the site. The poster stays with `prefers-reduced-motion`, Save-Data / 2g, low-end devices (`deviceMemory` ≤ 2 or ≤ 2 cores), without WebGL, or on pages that load `<model-viewer>`. `agenda-tu-demo.html` (es/en/pt) uses the same live hero robot + showcase view as the home (no model-viewer since 2026-10-17). `preparate-demo.html` (es/en/pt) uses it too: the hero view mounts over `img.launch-robot-img[data-hapee-poster]` (hapee-robot.js accepts `img.hero-robot` or `img[data-hapee-poster]` as the sibling poster). No public page loads model-viewer anymore; `img/3d/hapee-robot.glb` (the OLD robot model) stays in the repo, unreferenced (`oficina/` uses its own `assets/models/hapee-robot.glb` with three.js).
- `img/vsl-hapee.mp4` (86MB) — VSL video used in `agenda-tu-demo.html`. Above GitHub's 50MB recommended limit; if adding more videos consider CDN hosting instead of bundling.
- `img/hapee-mcp-icon.png` (1024) + `-512` / `-256` — official **app icon** (white `h` on orange→burdeo gradient, same as the iOS/Android/desktop apps, source `hapee-mobile/assets/icon.png`). Used as the MCP connector logo and `og:image` on `docs/mcp.html`. Distinct from the wordmark `img/logo-hapee.png`; same rules (never deform or recolor).
- `llms.txt` — LLM-optimized index at root, for AI crawlers.

**Not deployed (workspace only, listed in `.paginas-locales`):** `_render.html` (render helper), `blog-hero-variants.html`, `juego-cathedral.html`, `widget-opciones.html`, `widget-reemplaza-opciones.html` (design explorations). To publish one: remove it from `.paginas-locales` **and** add its `COPY` line.

**External GHL page** (NOT in this repo):
- `be.hapee.ai/registro` — Registration/checkout flow lives in GoHighLevel.

## Deployment

- **Hosting**: GitHub `freddy-ztrata/web-hapee` → Dokploy auto-deploys on push to `master`.
- **Container**: `Dockerfile` based on `nginx:alpine`. Bump the `CACHE_BUST` ARG on each release so Dokploy's layer cache invalidates and the new HTML actually ships. Also update the `COPY` list when adding new HTML pages or asset directories.
- **Entrypoint**: `entrypoint.sh` runs `envsubst` to inject `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY` and `SAAS_PUBLIC_API_KEY` into the nginx template, then starts nginx. All three must be set in Dokploy (chat, TTS, and pricing/checkout respectively). A new secret needs to be added to the `envsubst` variable list too, or nginx gets a literal empty string.
- If a push doesn't redeploy, push an empty commit to re-fire the webhook or hit *Redeploy* in Dokploy; `curl -s https://hapee.ai/<page> | grep <marker>` tells you what's actually live.

## nginx (`nginx.conf`)

- **Clean URLs**: `try_files $uri $uri.html $uri/ /index.html` — `/comparativa` and `/comparativa.html` both work. Any new HTML file gets clean-URL routing automatically. Don't link to `.html` in new code unless there's a reason (canonical exception: legal pages still self-canonicalize to `.html`).
- **Static assets 404 for real**: a `location ~* \.(css|js|png|mp4|…)$ { try_files $uri =404; }` block precedes the catch-all, so a missing asset returns 404 instead of the home page HTML with 200. HTML pages are *not* covered by it — that's why the `COPY` check above exists.
- **`/api/saas/`** — GET/POST proxy to `beta.hapee.ai/api/public/saas/` with `X-Public-Api-Key` injected. Used by `planes.html` and `compra-exitosa.html`.
- **`/api/chat`** — POST-only reverse proxy to `api.anthropic.com/v1/messages`. Injects `x-api-key` from env. Used by the Hapee AI chat.
- **`/api/tts/{voice_id}`** — POST-only streaming proxy to `api.elevenlabs.io/v1/text-to-speech/{id}/stream`. Injects `xi-api-key`. Used by the chat to speak responses.
- DNS resolver pinned to Docker internal (`127.0.0.11`) — external DNS is unreachable from the container.

## Commands

```bash
# Local preview (clean URLs work: /agenda-tu-demo, /planes, …)
npx serve -l 3000

# Pre-push checks (no build/test framework — these are the whole suite)
bash verificacion/paginas_en_imagen.sh   # every committed .html has a COPY line (or is in .paginas-locales)
py verificacion/v_espanol_neutro.py      # site copy is neutral Spanish — no voseo (see below)
py docs/_verificar_docs.py               # docs/ pages reach the image + internal links resolve
py verificacion/v_idiomas.py             # every page has its en/ + pt/ version, correctly wired
py verificacion/mutar_espanol_neutro.py  # mutation run: proves the voseo detector still detects
py docs/_mutar_docs.py                   # same for the docs verifier

# Deploy: push and Dokploy takes it from there
git push origin master
```

Bump `CACHE_BUST` in the `Dockerfile` whenever a release should bust the nginx layer cache. Use `py` (Windows launcher) for the Python scripts; they are run from the repo root.

## Languages: Spanish, English, Portuguese (since 2026-10-15)

The whole site exists in three languages with the **same slug**: Spanish at the URLs it always had (`/planes`, `/blog/x.html`, `/docs/mcp`), English under `/en/…` and Portuguese (pt-BR) under `/pt/…` — files `en/<path>` and `pt/<path>`, copied as whole directories by the `Dockerfile`. Exception: the legal pages keep their own names (`terms.html`/`termos.html`, `privacy-policy.html`/`politica-privacidade.html`).

- **Default is English, decided by nginx** (`map`s at the top of `nginx.conf`): a request for a Spanish page gets a **302** to `/en/…` or `/pt/…` when that translation exists and the visitor prefers it. Preference = cookie `hapee_lang` (es|en|pt, written by the selector) → else first `Accept-Language` (es* → es, pt* → pt, anything else → en). **No header → no redirect**, so crawlers index each language at its own URL. Pages under `/en/` and `/pt/` are never redirected.
- **Language selector**: `js/lang.js` (loaded on every page) mounts into each `<span data-lang-switch>` (nav, next to `#darkToggle`; `data-lang-menu` marks the one in the mobile menu). Pages without a visible slot get a floating pill bottom-left. Choosing writes the cookie and goes to the same page in the other language. On `/en/` and `/pt/` it also prefixes any internal link that slipped through unprefixed.
- **Assets are not duplicated**: translated pages keep relative paths (`img/…`, `assets/…`); nginx serves `/en/img/x.png` from `/img/x.png` (`$hapee_sin_idioma`). An unknown URL under `/en/` falls back to `/en/` (the English home), not the Spanish one.
- **Editing a page means editing all three versions.** A new Spanish page needs `en/` and `pt/` copies (with `lang="en"`/`lang="pt"`, canonical with the prefix, prefixed internal links, the hreflang block es/en/pt/x-default=en) and their `sitemap.xml` entries. Without them the page just stays Spanish for everyone — nothing breaks.
- Shared JS reads `<html lang>` for its strings: `js/whatsapp.js` (FAB label + prefilled message), `docs/docs.js` (copy button), `blog/article.js` (share text).
- Still Spanish-only, served by the app: the booking calendar and partners form embeds from `beta.hapee.ai`, and plan names/features returned by `/api/saas/planes`.

## Language: neutral Spanish, no voseo

All Spanish public copy (HTML text, JS strings, code comments inside docs examples) is **neutral Spanish**: `tú`/`usted` forms, never `vos` (`conectás`, `respondés`, `mirá`, …). (The `en/` and `pt/` pages are skipped by the checker through their `<html lang>`.) `verificacion/v_espanol_neutro.py` extracts every accented-ending word form and compares against an explicit allowlist (futures like `recibirás`, proper nouns, tuteo forms shared with voseo). If it flags a legitimate word, add it to the allowlist in that script rather than weakening the detector; run the mutation script afterwards.

## Brand guidelines (critical)

- **Colors**: `#FA5000` (orange primary), `#CD2349` (burdeo secondary), `#000000`, `#FFFFFF`.
- **Gradients**: always orange → burdeo, left to right.
- **Fonts**: Bebas Neue (headlines), Plus Jakarta Sans (body), Poppins (logo only). GHL snippets and email templates use Inter + Nunito Sans instead.
- **Logo**: `img/logo-hapee.png` only. Aspect-ratio must be locked (`display:block; width:auto !important; object-fit:contain; flex-shrink:0; min-width:80px`) — never deform, rotate, or place on low-contrast backgrounds. **Never** apply `filter: brightness(0) invert(1)` for dark mode — that filter has been known to render the logo invisible in certain browsers. The branded orange/burdeo wordmark is visible on both light and dark backgrounds natively.
- **Never mention** GoHighLevel, GHL, or any white-label provider as *Hapee's own* stack, in the chatbot prompt, or as the tech behind be.hapee.ai. Never imply Hapee is built on GHL.
  - **Exception (approved 2026-07-17):** `comparativa.html` names **GoHighLevel** as a *competitor* column/duel, and labels **Zolutium** and **Heat** as **"marca blanca / white-label de GoHighLevel"** (explicitly approved by the owner after being warned of the self-incrimination risk — Hapee's own app runs on GHL). Differentiate on verifiable points too (producto/soporte en inglés, self-service, sin agencia Meta/Google Partner local, sin voz clonada ni MCP Claude). Still **do not** write "software indio", and never present GHL as *Hapee's own* stack.
- **Single email address**: `info@hapee.ai` is the only public contact. `soporte@hapee.ai` is deprecated and must not appear in any file. Legal-only addresses (`legal@hapee.ai`, `privacidad@hapee.ai`) are preserved for compliance in `terminos.html` and `politica-privacidad.html`.

## Plans & pricing facts (keep consistent across HTML and the chatbot prompt)

- 3 plans: **STARTER $297/mo**, **PRO $397/mo** (badge "El más elegido", animated beam border), **ELITE SETUP USD 3,290 one-time** (matches `planes.html`, `index.html` FAQ/JSON-LD and the old `$2,990` figure is wrong — confirmed by the owner 2026-09-14).
- Starter: 2 usuarios y 2.000 contactos; incluye módulos de Email Marketing, **Licitaciones (Mercado Público)** y **Academia**. Pro: usuarios y contactos ilimitados; Licitaciones amplía a **Mercado Público y Entidades privadas**.
- **No free trial.** Never write "14 días gratis", "prueba gratis", "Empezar 14 días gratis", "Cancela antes del día 14", or any variant.
- **No money-back guarantee.** Never write "garantía de devolución", "30 días de garantía", "reembolso completo", or promise refunds. Payments are non-refundable per `terminos.html` section 5.
- CTAs on all plans (Starter, Pro, Elite) say **"Seleccionar plan"**. No trial or guarantee microcopy under the buttons.
- Canonical trust copy: *"Sin compromiso, sin contratos. Cancelas cuando quieras."*
- The system prompt for the in-page AI chat lives in `index.html` (~line 4765, `SYSTEM_PROMPT_BASE` + `INDUSTRIES.general`). Keep it aligned with pricing changes and the "no trial / no guarantee" facts above.
- Orphan CSS classes `.pc-trial` and `.pc-guarantee` remain in `index.html` and `agenda-tu-demo.html` — dead but harmless. Don't re-introduce them.

## Landing-page conventions

- **Every "Agendar demo" link on the site goes to `/agenda-tu-demo`** (same tab, no `target="_blank"`). Never link to `be.hapee.ai/agenda-tu-demo` — that is the retired GHL booking flow (owner's rule, 2026-09-14; 18 stale links were swept that day). `grep -rn "be.hapee.ai/agenda-tu-demo" --include=*.html --include=*.txt .` must return nothing.

- **`agenda-tu-demo.html`** uses the **same full nav and `.mmenu` mobile menu as `index.html`** (owner's decision 2026-09-13, replacing the earlier minimal nav). Nav CTAs: "Reservar mi demo →" (scrolls to `#calendario`) + "Ver Planes". When editing menu items on the home, mirror them here.
- **Section-per-screen** CSS rule applied on both `index.html` and `agenda-tu-demo.html`: `main > section { min-height: 100svh }` with exceptions for short sections (`midcta`, `video-section`). On mobile only key sections enforce full-viewport height to keep readability.
- **Sticky demo CTAs** on `agenda-tu-demo.html`: full-width bottom bar on mobile + floating bottom-right pill on desktop. Auto-hide when hero or calendar section is in view (IntersectionObserver). Both scroll smoothly to `#calendario`.
- **VSL video treatment**: cinematic frame with animated conic-gradient border, custom play overlay (double pulsing ring), radial glow halo. Poster is `img/robot-v2.png` (aspect-ratio locked in CSS via `object-fit:contain`).
- **Calendar embed** (Hapee app, since 2026-09-13): `<div id="hapeeCalendar" data-hapee-calendar="hapee/demo-1-a-1-hapee">` inside a plain `.cal-embed` wrapper (no card/frame — the widget brings its own), mounted by `https://beta.hapee.ai/static/calendar-embed.js` (async, end of body). The inline UTM forwarder rewrites `data-hapee-calendar` to the full `beta.hapee.ai/calendar/book/...?utm...` URL before mount; the conversion `dg_agendar_demo` fires on postMessage `{type:"zentru_calendar_submitted"}` from a `*.hapee.ai` origin. **Height and theme come from the widget** (since 2026-10-15): `calendar-embed.js` reports the card's real height (it grows on the form step and shrinks back) and, with `data-theme="auto"` on `#hapeeCalendar`, follows `html.dark` live. The old inline resize guard was removed. **Attribution** (2026-10-19): `js/lang.js` (on every page) saves the landing URL's UTMs/click-IDs to sessionStorage `hapee_attribution` (+ a 30-day localStorage copy), so they survive language switches and internal navigation; the calendar forwarder reads URL → session → local. **Thank-you page language**: the app's post-booking redirect points to `https://hapee.ai/preparate-demo`; an inline listener on agenda-tu-demo (es/en/pt), registered before the loader, intercepts `zentru_calendar_redirect` and navigates to the same path with the page's own language prefix (Spanish sets `hapee_lang=es` for 10 min so nginx doesn't bounce it). Keep `color-scheme:normal` on the iframe: if it differs from the widget document's, Chrome paints the iframe with an opaque white background. `agentes-ia-whatsapp.html` sigue con su propio calendario (`dxPntqtyC5ZeHsKLKupa`) — no se toca.

## Theming (dark/light)

- Toggle via `html.dark` class, persisted in `localStorage` key `hapee-theme`.
- CSS variables in `:root` (light) and `html.dark` (dark) drive all theme colors.
- Dark palette: pure blacks (`#080808`, `#0d0d0d`, `#0f0f0f`) with orange iridescent overlays (`radial-gradient`, `rgba(250,80,0,...)` borders/shadows).
- Light palette: white/cream backgrounds, dark text.
- Footer is always dark regardless of theme.
- **Critical gotcha**: `.mmenu` (mobile menu) is `position:fixed`. Never include it in dark-mode rules that force `position:relative` (like the dark-mode z-index rule for main/footer/ctaf) — it breaks the fullscreen overlay.
- Toggles exist in both desktop nav (`#darkToggle`) and mobile menu (`#darkToggleMobile`); both call `toggleDark()`.

## Mobile menu (`index.html` only)

- `.mmenu` + `.open` class, `position:fixed;inset:0` for fullscreen overlay.
- `html.menu-open` locks body scroll when open. **Every** menu close action (X button, nav links, CTA buttons) must remove both `.open` from `.mmenu` AND `.menu-open` from `<html>`.
- `agenda-tu-demo.html` has the same mobile menu markup (`#mm`) — apply the same close-action rule there.

## Visual effects in `index.html`

- **Hero orbital stage** — Hapee robot centered (`img.hero-robot` is the LCP poster; since 2026-10-17 the live 3D robot mounts on top of it in `.hr-live[data-hapee-robot=hero]`: decorative only — waves on arrival, follows the cursor, drag to rotate, no chat link; model-viewer is no longer loaded on the home), integration logos in dual orbital rings (WhatsApp, IG, FB, Meta, Gmail, Outlook, LinkedIn, Teams inner; Google, Ads, Calendar, Shopify, Stripe, Gemini, ChatGPT, Claude, ElevenLabs outer). Two Hapee product chips (CRM, Ads) at top corners.
- **Hapee AI section** — interactive chat with typewriter responses + voice playback. Sends to `/api/chat`, streams TTS from `/api/tts/{voice_id}`. System prompt embedded inline (~line 4765). Not connected to the hero robot.
- **CTA Final** — interactive particle nebula (90 geometric shapes, orbital motion, cursor magnetic repulsion). Gated by `IntersectionObserver`; only runs when visible. Has a 2s `setTimeout` safety fallback that forces content visible if GSAP/ScrollTrigger fail.
- **Animations**: GSAP + ScrollTrigger from CDN (deferred); custom `IntersectionObserver` for counters (replays every scroll-in) and the 3-steps sequence; CSS animations for floating robot, glow pulse, and the PRO card rotating border beam (`@property --beam-a`).
- **FOMO popup: removed (Oct 2026).** The fake "X from <country> just bought/booked" toast was deleted from the home pages (es/en/pt), and its dead CSS from agenda-tu-demo and agentes-ia-whatsapp. Do not reintroduce invented social proof. `@keyframes fomoPulse` stays because the green "online" dots use it. `img/flags/` stays because `propuesta-2026-r8x4/eventos.html` uses it.

## Partner badges

Meta Business Partner + Google Premier Partner are inline SVG (not external images) in the Stats `.partners` row. Each is a `.partner-badge` with a fixed 48×42 `.partner-ico-wrap` + `.partner-txt`.

## SEO

- Full meta tags (OG, Twitter Cards, canonical, robots).
- JSON-LD structured data on `index.html`: unified `@graph` with Organization + SoftwareApplication + ItemList of offers.
- `robots.txt`, `sitemap.xml`, and `llms.txt` (AI-crawler index) at root. **Update `sitemap.xml`** (lastmod + add new `<url>`) whenever a deployed page is added or substantially changed.
- Canonical URL: `https://hapee.ai/`.

## Tracking / pixels

**Google tag (gtag.js)** is in the `<head>` of every deployed page (including `blog/` and `docs/`): `AW-18308791323` (Google Ads) + `G-9RFLY7C3XE` (GA4). Copy the same snippet into any new page. Key events: `dg_agendar_demo` (fired on `agenda-tu-demo.html` when the calendar widget confirms a booking), `dg_whatsapp` (fired by `js/whatsapp.js` on FAB click and by the in-page WhatsApp CTA on `preparate-demo.html`) and `dg_prep_completa` (fired once on `preparate-demo.html` when the prep checklist reaches 5/5 — register it in GA4 if you want to see it) — Google Ads imports conversions from GA4, so don't add `send_to`. No Meta Pixel (`fbq`) and no Google Tag Manager; the Meta/Search Console `meta` tags are domain verification only. Post-conversion pages (`preparate-demo`, `compra-exitosa`) must **not** re-fire the conversion events.

## Skills installed

`skills-lock.json` pins these:
- 8 GSAP skills under `.agents/skills/gsap-*` — use them when adding or changing animations.
- `seo-audit` — for technical SEO review.
- `framer-motion-animator` — installed but the codebase uses GSAP, not Framer Motion.
- `ui-ux-pro-max` lives in `.claude/skills/` — UI/UX review.

## Legal entity

WM Digital, LLC (Wyoming, EIN 38-4371956), domicilio: 1908 Thomes Ave STE 12605, Cheyenne, WY 82001, US. Public contact: `info@hapee.ai`. Legal-specific addresses (compliance only, in `terminos.html` and `politica-privacidad.html`): `legal@hapee.ai`, `privacidad@hapee.ai`.

## Pricing público + checkout Stripe (self-service, 2026-07-10)

Primera integración del sitio con la app FastAPI (**`beta.hapee.ai`** — dominio canónico de la app desde 2026-07-11; el proxy nginx apunta ahí). Plan maestro:
`reporteria/docs/planes/2026-07-10-stripe-venta-subcuentas-provisioning.md` (F4).

- **`planes.html`** (`/planes`, ya publicado e indexable; el slug viejo `/planes-k9x2v7`
  redirige 301 desde `nginx.conf`): página de pricing self-service. Renderiza los planes
  desde `GET /api/saas/planes` (los precios NUNCA se hardcodean acá — la app es la
  autoridad) y el CTA abre un modal de datos → `POST /api/saas/checkout` → redirect a
  Stripe Checkout hosted. Con el flag de la app apagado exige `?preview=<token>`.
- **Consentimiento legal del checkout (obligatorio, 2026-09-04)**: el backend exige
  `acepta_terminos` + `acepta_privacidad` + un `desafio` firmado que se obtiene con
  `GET /api/saas/legal`; sin eso responde 422 **antes** de tocar Stripe. En el modal hay
  dos casillas independientes, **nunca premarcadas**, con links a `/terminos.html` y
  `/politica-privacidad.html`. Reglas al tocar ese código:
  - el desafío se pide con `cache:'no-store'` al abrir **cada** modal y vive **solo en
    memoria** — jamás en `localStorage`/`sessionStorage`;
  - fail-closed: sin desafío el botón de pago queda deshabilitado (con opción de reintento);
  - los booleanos se leen del DOM en el submit — nunca se envían literales `true`;
  - si el desafío expira (422), se pide uno nuevo y se reintenta **una sola vez**;
  - el enforcement real es del backend: la landing no debe simular el consentimiento.
- **`compra-exitosa.html`**: success page del checkout. Lee `?t=<token opaco>` y pollea
  `GET /api/saas/checkout/{t}/estado` (3s, ~2min): preparando → “revisa tu correo para
  activar” | pago en proceso | fallo. **JAMÁS crea nada** — el aprovisionamiento es 100%
  del webhook de la app. (gracias-compra.html queda para el flujo GHL legacy.)
- **Proxy nginx `location /api/saas/`** → `https://beta.hapee.ai/api/public/saas/` con
  `X-Public-Api-Key "${SAAS_PUBLIC_API_KEY}"` inyectada server-side (misma técnica que
  `/api/chat`). Env var nueva en `entrypoint.sh` + **Dokploy del sitio**: `SAAS_PUBLIC_API_KEY`
  (debe coincidir con la de la app). Sin ella todo responde 404 — fail-secure.
- La pill “30 días de garantía” de gracias-compra.html fue eliminada (regla de pricing).

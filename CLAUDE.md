# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Landing site for **Hapee.ai** — an AI conversational platform + automation + CRM by WM Digital, LLC (Digitals Group). Static HTML/CSS/JS with a thin nginx reverse-proxy layer for AI features. No build step, no bundler, no framework. Deployed via Docker on Dokploy.

## Site map

**Deployed via Docker (`Dockerfile` enumerates these — 12 HTML pages):**

Main funnel:
- `index.html` — Main landing (~3500 lines). CSS in `<style>`, JS in `<script>`. Hosts an interactive **Hapee AI chat** that streams through nginx → Anthropic + ElevenLabs. Also has orbital robot hero + platform showcase + Hapee Interact demo.
- `agenda-tu-demo.html` — Demo booking landing. **Minimal nav** (no menu, just logo + "Reservar mi demo" CTA). Includes VSL video, embedded GHL booking calendar, home-page widgets, sticky demo CTAs (mobile bar + desktop pill).
- `partners.html` — Reseller/partners program landing.
- `comparativa.html` — Hapee vs. competitors table.
- `gracias-compra.html` — Post-purchase thank-you page (linked from the checkout flow).
- `demo-countdown.html` — One-pager with 5-min countdown before demo starts. `noindex,nofollow`.

Content:
- `blog.html` + `blog/*.html` — Blog index plus 7 articles. Articles share `blog/article.css` and `blog/article.js`.
- `rrss-templates.html` — Social media template gallery.
- `transformacion.html` — Before/after transformation showcase (uses `img/transformacion-*.mp4`).
- `juego.html` — Interactive game/entertainment page. Served at `/juego` (clean URL).

Legal:
- `politica-privacidad.html` — Privacy policy (Chile Ley 21.719, GDPR, US).
- `terminos.html` — Terms of service. **No trial + no refund** policy lives in sections 4.2 and 5.

Assets:
- `js/whatsapp.js` — Site-wide floating WhatsApp button (loaded via `<script src="/js/whatsapp.js" defer>` on every deployed page except `demo-countdown.html`). Single source of truth for contact number + prefilled message.
- `img/vsl-hapee.mp4` (86MB) — VSL video used in `agenda-tu-demo.html`. Above GitHub's 50MB recommended limit; if adding more videos consider CDN hosting instead of bundling.
- `llms.txt` — LLM-optimized index at root, for AI crawlers.

**Not deployed (workspace only):**
- `_render.html` — Internal render helper, `noindex`. Not in `Dockerfile`.
- `blog-hero-variants.html` — Design exploration file.

**External GHL page** (NOT in this repo):
- `be.hapee.ai/registro` — Registration/checkout flow lives in GoHighLevel.

## Deployment

- **Hosting**: GitHub `freddy-ztrata/web-hapee` → Dokploy auto-deploys on push to `master`.
- **Container**: `Dockerfile` based on `nginx:alpine`. Bump the `CACHE_BUST` ARG on each release so Dokploy's layer cache invalidates and the new HTML actually ships. Also update the `COPY` list when adding new HTML pages or asset directories.
- **Entrypoint**: `entrypoint.sh` runs `envsubst` to inject `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` into the nginx template, then starts nginx. Both env vars are required by Dokploy for the AI chat to work.

## nginx (`nginx.conf`)

- **Clean URLs**: `try_files $uri $uri.html $uri/ /index.html` — `/comparativa` and `/comparativa.html` both work. Any new HTML file gets clean-URL routing automatically. Don't link to `.html` in new code unless there's a reason (canonical exception: legal pages still self-canonicalize to `.html`).
- **`/api/chat`** — POST-only reverse proxy to `api.anthropic.com/v1/messages`. Injects `x-api-key` from env. Used by the Hapee AI chat.
- **`/api/tts/{voice_id}`** — POST-only streaming proxy to `api.elevenlabs.io/v1/text-to-speech/{id}/stream`. Injects `xi-api-key`. Used by the chat to speak responses.
- DNS resolver pinned to Docker internal (`127.0.0.11`) — external DNS is unreachable from the container.

## Commands

```bash
# Local preview
npx serve -l 3000

# Deploy: push and Dokploy takes it from there
git push origin master
```

Bump `CACHE_BUST` in the `Dockerfile` whenever a release should bust the nginx layer cache.

## Brand guidelines (critical)

- **Colors**: `#FA5000` (orange primary), `#CD2349` (burdeo secondary), `#000000`, `#FFFFFF`.
- **Gradients**: always orange → burdeo, left to right.
- **Fonts**: Bebas Neue (headlines), Plus Jakarta Sans (body), Poppins (logo only). GHL snippets and email templates use Inter + Nunito Sans instead.
- **Logo**: `img/logo-hapee.png` only. Aspect-ratio must be locked (`display:block; width:auto !important; object-fit:contain; flex-shrink:0; min-width:80px`) — never deform, rotate, or place on low-contrast backgrounds. **Never** apply `filter: brightness(0) invert(1)` for dark mode — that filter has been known to render the logo invisible in certain browsers. The branded orange/burdeo wordmark is visible on both light and dark backgrounds natively.
- **Never mention** GoHighLevel, GHL, or any white-label provider as *Hapee's own* stack, in the chatbot prompt, or as the tech behind be.hapee.ai. Never imply Hapee is built on GHL.
  - **Exception (approved 2026-07-17):** `comparativa.html` names **GoHighLevel** as a *competitor* column/duel, and positions **Zolutium** and **Heat** as rivals. Framing must stay **defensible** — differentiate on verifiable points (producto/soporte en inglés, self-service, sin agencia Meta/Google Partner local, sin voz clonada ni MCP Claude). Do **not** write "white-label", "marca blanca", or "software indio" in deployed copy (self-incrimination risk: Hapee's own app runs on GHL).
- **Single email address**: `info@hapee.ai` is the only public contact. `soporte@hapee.ai` is deprecated and must not appear in any file. Legal-only addresses (`legal@hapee.ai`, `privacidad@hapee.ai`) are preserved for compliance in `terminos.html` and `politica-privacidad.html`.

## Plans & pricing facts (keep consistent across HTML and the chatbot prompt)

- 3 plans: **STARTER $197/mo**, **PRO $297/mo** (badge "El más elegido", animated beam border), **ELITE SETUP $2,990 one-time**.
- Starter: 2 usuarios y 2.000 contactos; incluye módulos de Email Marketing, **Licitaciones (Mercado Público)** y **Academia**. Pro: usuarios y contactos ilimitados; Licitaciones amplía a **Mercado Público y Entidades privadas**.
- **No free trial.** Never write "14 días gratis", "prueba gratis", "Empezar 14 días gratis", "Cancela antes del día 14", or any variant.
- **No money-back guarantee.** Never write "garantía de devolución", "30 días de garantía", "reembolso completo", or promise refunds. Payments are non-refundable per `terminos.html` section 5.
- CTAs on all plans (Starter, Pro, Elite) say **"Seleccionar plan"**. No trial or guarantee microcopy under the buttons.
- Canonical trust copy: *"Sin compromiso, sin contratos. Cancelas cuando quieras."*
- The system prompt for the in-page AI chat lives in `index.html` (~line 3150). Keep it aligned with pricing changes and the "no trial / no guarantee" facts above.
- Orphan CSS classes `.pc-trial` and `.pc-guarantee` remain in `index.html` and `agenda-tu-demo.html` — dead but harmless. Don't re-introduce them.

## Landing-page conventions

- **`agenda-tu-demo.html`** uses a **minimal nav** (`.nav-minimal`): logo + dark toggle + single "Reservar mi demo" CTA. No menu items, no mobile menu. Landing-page principle = zero distractions.
- **Section-per-screen** CSS rule applied on both `index.html` and `agenda-tu-demo.html`: `main > section { min-height: 100svh }` with exceptions for short sections (`midcta`, `video-section`). On mobile only key sections enforce full-viewport height to keep readability.
- **Sticky demo CTAs** on `agenda-tu-demo.html`: full-width bottom bar on mobile + floating bottom-right pill on desktop. Auto-hide when hero or calendar section is in view (IntersectionObserver). Both scroll smoothly to `#calendario`.
- **VSL video treatment**: cinematic frame with animated conic-gradient border, custom play overlay (double pulsing ring), radial glow halo. Poster is `img/robot.png` (aspect-ratio locked in CSS via `object-fit:contain`).
- **GHL calendar embed**: `always.hapee.ai/widget/booking/dxPntqtyC5ZeHsKLKupa` inside a styled `.cal-wrap` container. Requires `<script src="https://always.hapee.ai/js/form_embed.js">` at end of body to auto-resize the iframe.

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
- `agenda-tu-demo.html` has no mobile menu — the minimal nav is always visible with a single CTA.

## Visual effects in `index.html`

- **Hero orbital stage** — Hapee robot centered, integration logos in dual orbital rings (WhatsApp, IG, FB, Meta, Gmail, Outlook, LinkedIn, Teams inner; Google, Ads, Calendar, Shopify, Stripe, Gemini, ChatGPT, Claude, ElevenLabs outer). Two Hapee product chips (CRM, Ads) at top corners.
- **Hapee AI section** — interactive chat with typewriter responses + voice playback. Sends to `/api/chat`, streams TTS from `/api/tts/{voice_id}`. System prompt embedded inline (~line 3150).
- **CTA Final** — interactive particle nebula (90 geometric shapes, orbital motion, cursor magnetic repulsion). Gated by `IntersectionObserver`; only runs when visible. Has a 2s `setTimeout` safety fallback that forces content visible if GSAP/ScrollTrigger fail.
- **Animations**: GSAP + ScrollTrigger from CDN (deferred); custom `IntersectionObserver` for counters (replays every scroll-in) and the 3-steps sequence; CSS animations for floating robot, glow pulse, and the PRO card rotating border beam (`@property --beam-a`).
- **FOMO popup** — fixed bottom-left, random names + 8 target-market countries (AR/CL/CO/EC/ES/MX/PE/UY) + flag PNGs from `img/flags/{cc}.png`. First show at 15s, then every 25–45s; auto-hides at 6s.

## Partner badges

Meta Business Partner + Google Premier Partner are inline SVG (not external images) in the Stats `.partners` row. Each is a `.partner-badge` with a fixed 48×42 `.partner-ico-wrap` + `.partner-txt`.

## SEO

- Full meta tags (OG, Twitter Cards, canonical, robots).
- JSON-LD structured data on `index.html`: unified `@graph` with Organization + SoftwareApplication + ItemList of offers.
- `robots.txt`, `sitemap.xml`, and `llms.txt` (AI-crawler index) at root. **Update `sitemap.xml`** (lastmod + add new `<url>`) whenever a deployed page is added or substantially changed.
- Canonical URL: `https://hapee.ai/`.

## Tracking / pixels

**None installed.** Only domain-verification `meta` tags for Meta Business + Google Search Console (not pixels — verification only). No Meta Pixel (`fbq`), Google Tag Manager, or GA4. When adding ads, install via GTM to centralize.

## Skills installed

`skills-lock.json` pins these:
- 8 GSAP skills under `.agents/skills/gsap-*` — use them when adding or changing animations.
- `seo-audit` — for technical SEO review.
- `framer-motion-animator` — installed but the codebase uses GSAP, not Framer Motion.
- `ui-ux-pro-max` lives in `.claude/skills/` — UI/UX review.

## Legal entity

WM Digital, LLC (Wyoming, EIN 38-4371956), domicilio: 1908 Thomes Ave STE 12605, Cheyenne, WY 82001, US. Public contact: `info@hapee.ai`. Legal-specific addresses (compliance only, in `terminos.html` and `politica-privacidad.html`): `legal@hapee.ai`, `privacidad@hapee.ai`.

## Pricing oculto + checkout Stripe (self-service, 2026-07-10)

Primera integración del sitio con la app FastAPI (**`beta.hapee.ai`** — dominio canónico de la app desde 2026-07-11; el proxy nginx apunta ahí). Plan maestro:
`reporteria/docs/planes/2026-07-10-stripe-venta-subcuentas-provisioning.md` (F4).

- **`planes-k9x2v7.html`** (slug oculto `/planes-k9x2v7`): página de pricing self-service.
  `noindex,nofollow`, FUERA de sitemap/nav/robots (patrón gracias-compra). Renderiza los
  planes desde `GET /api/saas/planes` (los precios NUNCA se hardcodean acá — la app es la
  autoridad) y el CTA abre un modal de datos → `POST /api/saas/checkout` → redirect a
  Stripe Checkout hosted. Con el flag de la app apagado exige `?preview=<token>`.
  Al publicar: renombrar a `/planes`, quitar noindex, sumar a nav/sitemap + barrido de
  copy (index cards + JSON-LD + prompt del chat + llms.txt) — checklist §20 del plan.
- **`compra-exitosa.html`**: success page del checkout. Lee `?t=<token opaco>` y pollea
  `GET /api/saas/checkout/{t}/estado` (3s, ~2min): preparando → “revisa tu correo para
  activar” | pago en proceso | fallo. **JAMÁS crea nada** — el aprovisionamiento es 100%
  del webhook de la app. (gracias-compra.html queda para el flujo GHL legacy.)
- **Proxy nginx `location /api/saas/`** → `https://beta.hapee.ai/api/public/saas/` con
  `X-Public-Api-Key "${SAAS_PUBLIC_API_KEY}"` inyectada server-side (misma técnica que
  `/api/chat`). Env var nueva en `entrypoint.sh` + **Dokploy del sitio**: `SAAS_PUBLIC_API_KEY`
  (debe coincidir con la de la app). Sin ella todo responde 404 — fail-secure.
- La pill “30 días de garantía” de gracias-compra.html fue eliminada (regla de pricing).

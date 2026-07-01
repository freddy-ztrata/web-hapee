# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Landing site for **Hapee.ai** — an AI conversational platform + automation + CRM by WM Digital, LLC (Digitals Group). Static HTML/CSS/JS with a thin nginx reverse-proxy layer for AI features. No build step, no bundler, no framework. Deployed via Docker on Dokploy.

## Site map

**Deployed via Docker (`Dockerfile` enumerates these):**
- `index.html` (~2000 lines) — Main landing. CSS in `<style>`, JS in `<script>`. Hosts an interactive **Hapee AI chat** that streams through nginx → Anthropic + ElevenLabs.
- `comparativa.html` — Hapee vs. competitors table.
- `blog.html` + `blog/*.html` — Blog index plus 6 articles. Articles share `blog/article.css` and `blog/article.js`.
- `rrss-templates.html` — Social media template gallery.
- `politica-privacidad.html` — Privacy policy (Chile Ley 21.719, GDPR, US).
- `terminos.html` — Terms of service. Trial mechanics live in section 4.2.
- `gracias-compra.html` — Post-purchase thank-you page (linked from the checkout flow).

**Not deployed (workspace only):**
- `_render.html` — Internal render helper, `noindex`. Not in `Dockerfile`.
- `demo-prep.html` — Copy-paste snippet for GHL custom code blocks. Not served by this container.
- GHL pages (`be.hapee.ai/registro`, `be.hapee.ai/agenda-tu-demo`) — Live in GoHighLevel, not in this repo. Standalone HTML snippets are crafted in-conversation and pasted into GHL.

## Deployment

- **Hosting**: GitHub `freddy-ztrata/web-hapee` → Dokploy auto-deploys on push to `master`.
- **Container**: `Dockerfile` based on `nginx:alpine`. Bump the `CACHE_BUST` ARG on each release so Dokploy's layer cache invalidates and the new HTML actually ships.
- **Entrypoint**: `entrypoint.sh` runs `envsubst` to inject `ANTHROPIC_API_KEY` and `ELEVENLABS_API_KEY` into the nginx template, then starts nginx. Both env vars are required by Dokploy for the AI chat to work.

## nginx (`nginx.conf`)

- **Clean URLs**: `try_files $uri $uri.html $uri/ /index.html` — `/comparativa` and `/comparativa.html` both work. Any new HTML file gets clean-URL routing automatically. Don't link to `.html` in new code unless there's a reason.
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
- **Fonts**: Bebas Neue (headlines), Plus Jakarta Sans (body), Poppins (logo only). GHL snippets use Inter + Nunito Sans instead.
- **Logo**: `img/logo-hapee.png` only — never deform, rotate, or place on low-contrast backgrounds.
- **Never mention** GoHighLevel, GHL, or any white-label provider in deployed copy or in the chatbot prompt.

## Plans & pricing facts (keep consistent across HTML and the chatbot prompt)

- 3 plans: **STARTER $197/mo**, **PRO $297/mo** (recommended, animated beam border), **ELITE SETUP $2,990 one-time**.
- **No free trial.** Never write "14 días gratis", "prueba gratis", "Empezar 14 días gratis", "Cancela antes del día 14", or any variant.
- **No money-back guarantee.** The previous 30-day guarantee has also been discontinued. Never write "garantía de devolución", "30 días de garantía", "reembolso completo", or promise refunds. Payments are non-refundable — terminos.html section 5 states this.
- CTAs on all plans (Starter, Pro, Elite) say **"Seleccionar plan"**. No trial or guarantee microcopy under the buttons.
- Canonical trust copy: *"Sin compromiso, sin contratos. Cancelas cuando quieras."*
- The system prompt for the in-page AI chat lives in `index.html` (~line 3150) and reflects these terms. Update it whenever pricing changes.

## Theming (dark/light)

- Toggle via `html.dark` class, persisted in `localStorage` key `hapee-theme`.
- CSS variables in `:root` (light) and `html.dark` (dark) drive all theme colors.
- Dark palette: pure blacks (`#080808`, `#0d0d0d`, `#0f0f0f`) with orange iridescent overlays (`radial-gradient`, `rgba(250,80,0,...)` borders/shadows).
- Light palette: white/cream backgrounds, dark text.
- Footer is always dark regardless of theme.
- **Critical gotcha**: `.mmenu` (mobile menu) is `position:fixed`. Never include it in dark-mode rules that force `position:relative` (like the dark-mode z-index rule for main/footer/ctaf) — it breaks the fullscreen overlay.
- Toggles exist in both desktop nav (`#darkToggle`) and mobile menu (`#darkToggleMobile`); both call `toggleDark()`.

## Mobile menu

- `.mmenu` + `.open` class, `position:fixed;inset:0` for fullscreen overlay.
- `html.menu-open` locks body scroll when open. **Every** menu close action (X button, nav links, CTA buttons) must remove both `.open` from `.mmenu` AND `.menu-open` from `<html>`.

## Visual effects in `index.html`

- **Hero "Aether Flow"** — canvas particle system with mouse repulsion, click shockwaves, constellation lines. Canvas bg adapts to theme (`#080808` dark, `#fff` light).
- **Hapee AI section** — interactive chat with typewriter responses + voice playback. Sends to `/api/chat`, streams TTS from `/api/tts/{voice_id}`. System prompt embedded inline in `index.html`.
- **CTA Final** — interactive particle nebula (90 geometric shapes, orbital motion, cursor magnetic repulsion). Gated by `IntersectionObserver`; only runs when visible. Has a 2s `setTimeout` safety fallback that forces content visible if GSAP/ScrollTrigger fail.
- **Animations**: GSAP + ScrollTrigger from CDN (deferred); custom `IntersectionObserver` for counters (replays every scroll-in) and the 3-steps sequence; CSS animations for floating robot, glow pulse, and the PRO card rotating border beam (`@property --beam-a`).
- **FOMO popup** — fixed bottom-left, random names + 8 target-market countries (AR/CL/CO/EC/ES/MX/PE/UY) + flag PNGs from `img/flags/{cc}.png`. First show at 15s, then every 25–45s; auto-hides at 6s.

## Partner badges

Meta Business Partner + Google Premier Partner are inline SVG (not external images) in the Stats `.partners` row. Each is a `.partner-badge` with a fixed 48×42 `.partner-ico-wrap` + `.partner-txt`.

## SEO

- Full meta tags (OG, Twitter Cards, canonical, robots).
- JSON-LD structured data: Organization + SoftwareApplication.
- `robots.txt` and `sitemap.xml` at root. **Update `sitemap.xml`** (lastmod + add new `<url>`) whenever a deployed page is added or substantially changed.
- Canonical URL: `https://hapee.ai/`.

## Skills installed

`skills-lock.json` pins these:
- 8 GSAP skills under `.agents/skills/gsap-*` — use them when adding or changing animations.
- `seo-audit` — for technical SEO review.
- `framer-motion-animator` — installed but the codebase uses GSAP, not Framer Motion.
- `ui-ux-pro-max` lives in `.claude/skills/` — UI/UX review.

## Legal entity

WM Digital, LLC (Wyoming, EIN 38-4371956). Contact emails: `privacidad@hapee.ai`, `legal@hapee.ai`, `info@hapee.ai`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Landing page for **Hapee.ai** — an AI conversational platform + automation + CRM by Digitals Group. Single-page static site deployed via Docker/Nginx on Dokploy.

## Architecture

- **Single HTML file** (`index.html`): all CSS in `<style>`, all JS in `<script>`. No build step, no bundler, no framework.
- **Docker deployment**: `Dockerfile` copies `index.html`, `img/`, `robots.txt`, `sitemap.xml` into `nginx:alpine` container serving on port 80.
- **Hosting**: GitHub repo `freddy-ztrata/web-hapee` → Dokploy (auto-deploy on push to `master`).

## Commands

```bash
# Local dev server
npx serve -l 3000

# Deploy (just push — Dokploy auto-deploys)
git push origin master
```

## Brand Guidelines (CRITICAL)

- **Colors**: `#FA5000` (orange primary), `#CD2349` (burdeo secondary), `#000000`, `#FFFFFF`
- **Fonts**: Bebas Neue (headlines), Plus Jakarta Sans (body), Poppins (logo only)
- **Logo**: Always use `img/logo-hapee.png` from original files. Never deform, rotate, or place on low-contrast backgrounds.
- **Gradients**: Always orange → burdeo (left to right)
- **Never mention** GoHighLevel, GHL, or any white-label provider

## Key Technical Details

### Theming (Dark/Light)
- Toggle via `html.dark` class, persisted in `localStorage` key `hapee-theme`.
- CSS variables in `:root` (light) and `html.dark` (dark) control all theme colors.
- **Dark mode palette**: Pure blacks (`#080808`, `#0d0d0d`, `#0f0f0f`) with orange iridescent (tornasol) accents — subtle `radial-gradient` overlays on sections, `rgba(250,80,0,...)` borders/shadows on cards.
- **Light mode palette**: White/cream backgrounds, dark text.
- Footer always stays dark regardless of theme.

### Canvas Effects
- **Hero section**: "Aether Flow" — canvas particle system with orange/burdeo dots, mouse repulsion, click shockwaves, constellation lines. Canvas bg adapts to theme (`#080808` dark, `#fff` light).
- **CTA Final section**: Interactive particle nebula — 90 geometric shapes (circles, rings, triangles, diamonds, hexagons, crosses, stars) with orbital motion, cursor magnetic repulsion, click shockwave rings, trails, and connection lines. Gated by `IntersectionObserver` for performance (only runs when visible).

### Animations
- **GSAP + ScrollTrigger** (loaded from CDN, deferred): Hero entrance sequence, midcta reveal, CTA final content entrance timeline.
- **Custom IntersectionObserver**: Counters (replay on every scroll into view with staggered wow effects), 3-steps sequence (line draw → circle pop → text reveal).
- **CSS animations**: Floating robot (`rf`), glow pulse (`gl`), PRO card rotating border beam (`beam` with `@property --beam-a`).

### Pricing
- 3 plans — STARTER $197/mo, PRO $297/mo (animated border beam), ELITE SETUP $2,990 one-time.
- All "Seleccionar plan" buttons link to `https://be.hapee.ai/registro`.

### External Dependencies
- Google Fonts (Bebas Neue + Plus Jakarta Sans)
- GSAP + ScrollTrigger from CDN (deferred loading)
- All images/video are local in `img/`.

## index.html Structure (top to bottom)

CSS sections (~460 lines): Variables → Dark mode + iridescent overrides → Nav → Hero → Video → Stats → Features → Mid CTA → How (3 steps) → Pricing → Mobile fixes → CTA Final → Footer → Scrollbar → Skip link.

HTML sections: Nav (with dark toggle + mobile menu) → Hero (canvas + robot) → Video → Stats → Features (tabbed) → Mid CTA → How (3 steps) → Pricing (3 cards) → CTA Final (canvas nebula) → Footer.

JS sections (~250 lines): Dark mode init (IIFE before DOM) → DOMContentLoaded handler containing: Aether Flow canvas → Floating hero particles → Nav scroll → Button ripples → Counter observer → Steps observer → Feature tabs → Smooth scroll → GSAP init (hero entrance, midcta, CTA nebula canvas + entrance timeline).

## SEO

- Full meta tags (OG, Twitter Cards, canonical, robots)
- JSON-LD structured data (Organization + SoftwareApplication)
- Semantic HTML (header, main, article, nav, footer with proper roles)
- `robots.txt` and `sitemap.xml` at root
- Canonical URL: `https://hapee.ai/`

## Installed Skills

GSAP suite (8 skills in `.agents/skills/`): gsap-core, gsap-frameworks, gsap-performance, gsap-plugins, gsap-react, gsap-scrolltrigger, gsap-timeline, gsap-utils. Use these when adding/modifying animations.

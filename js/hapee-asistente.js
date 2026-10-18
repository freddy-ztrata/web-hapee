/* ============================================================
   Hapee.ai — Asistente flotante + robot vivo (site-wide, 2026-10-17)
   Cargado con <script src="/js/hapee-asistente.js" defer></script> en las
   páginas públicas (lista en CLAUDE.md). Sin dependencias.

   Qué hace:
   1. window.HapeeRobot — estado compartido del robot, siempre disponible
      (aunque three.js todavía no cargue):
        HapeeRobot.setState('idle'|'listening'|'thinking'|'talking'|'happy', opts)
          opts.maxMs  (talking): vuelve solo a idle si nadie lo apaga antes
          opts.target (listening): elemento al que mira (el input)
        HapeeRobot.attachAudio(audioEl)  pulso del pecho según la amplitud real
                                         (WebAudio AnalyserNode)
        HapeeRobot.open()                abre / enfoca el chat
      Eventos: escucha `hapee:robot` ({detail:{state,…}} o {detail:{audio}})
      y emite `hapee:robot-state` ({detail:{state,prev}}) en window.
   2. Lanzador redondo abajo a la derecha (sobre el botón de WhatsApp, nunca
      encima de él ni de la barra «Reservar demo» de agenda-tu-demo en móvil).
      - Página con chat propio (#hapee-chat: home y agenda-tu-demo): abre ESE
        chat (no hay dos chats compitiendo) y en la home se esconde mientras
        el robot del hero está en pantalla.
      - Resto: abre un panel con un chat compacto que habla con /api/chat.
   3. Robot 3D (js/robot/robot-view.js + three.js r160 de jsDelivr): se carga
      recién después de `load` + idle + primera interacción. Sin WebGL, con
      prefers-reduced-motion, ahorro de datos, equipo modesto o en móvil queda
      la imagen img/robot.png.
   Textos por idioma de la página (<html lang>), como js/whatsapp.js.
   ============================================================ */
(function () {
  'use strict';
  if (window.HapeeRobot && window.HapeeRobot.__ok) return;

  var idioma = (document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
  var TEXTOS = {
    es: {
      abrir: 'Habla con Hapee AI', cerrar: 'Cerrar chat', titulo: 'Hapee AI', online: 'en línea', escribiendo: 'escribiendo…',
      teaser: '¡Hola! ¿Te ayudo?', placeholder: 'Escribe tu pregunta…', enviar: 'Enviar', demo: 'Agendar demo',
      aviso: 'Respuestas generadas por IA', dialogo: 'Chat con Hapee AI',
      hola: '¡Hola! Soy <strong>Hapee</strong> 👋 Pregúntame lo que quieras sobre la plataforma, los planes o cómo automatizar tus ventas.',
      sugerencias: ['¿Qué hace Hapee?', '¿Cuánto cuesta?', 'Quiero agendar un demo'],
      error: 'Tuve un problema técnico. Intenta de nuevo o agenda un demo en hapee.ai/agenda-tu-demo',
      prompt: 'Tu estilo:\n- Amigable, profesional y entusiasta\n- Español neutro, entendible para toda Latinoamérica (tuteo, nunca voseo)\n- Directo y conciso: máximo 2-3 oraciones cortas\n- Sin markdown pesado; puedes usar **negritas** puntuales\n- Nunca menciones GoHighLevel, GHL o proveedores white-label.\n\n' +
        'Eres Hapee, el asistente IA de Hapee.ai — plataforma integral de IA Conversacional + CRM + Automatización desarrollada por Digitals Group y validada por Meta y Google Partner.\nInformación clave:\n- Agentes IA 24/7 en WhatsApp, Instagram, Facebook, Email\n- Clonación de voz personalizada, Pipeline ilimitados, Email marketing\n- Módulos de Licitaciones (Mercado Público) y Academia incluidos desde STARTER\n- WhatsApp Business API en plan PRO · en PRO el módulo de Licitaciones cubre Mercado Público y entidades privadas\n- Conexión nativa MCP con Claude de Anthropic (único en LATAM)\nPlanes: STARTER 297 USD/mes (2 usuarios, 2.000 contactos) · PRO 397 USD/mes, el más elegido (usuarios y contactos ilimitados) · ELITE SETUP 3290 USD pago único.\nElite es pago único de implementación llave en mano. No ofrecemos período de prueba gratuita ni garantía de devolución.\nLos planes se contratan directo en hapee.ai/planes — pago online con tarjeta y activación inmediata de la cuenta.\nPara agendar demo: hapee.ai/agenda-tu-demo',
      pagina: 'El usuario está leyendo esta página del sitio: '
    },
    en: {
      abrir: 'Chat with Hapee AI', cerrar: 'Close chat', titulo: 'Hapee AI', online: 'online', escribiendo: 'typing…',
      teaser: 'Hi! Can I help?', placeholder: 'Type your question…', enviar: 'Send', demo: 'Book a demo',
      aviso: 'AI-generated answers', dialogo: 'Chat with Hapee AI',
      hola: 'Hi! I\'m <strong>Hapee</strong> 👋 Ask me anything about the platform, the plans or how to automate your sales.',
      sugerencias: ['What does Hapee do?', 'How much does it cost?', 'I want to book a demo'],
      error: 'I ran into a technical problem. Please try again or book a demo at hapee.ai/en/agenda-tu-demo',
      prompt: 'Your style:\n- Friendly, professional and enthusiastic\n- Reply in English by default. If the user writes in another language, reply in that same language.\n- Direct and concise: 2-3 short sentences max\n- No heavy markdown; an occasional **bold** is fine\n- Never mention GoHighLevel, GHL or white-label providers.\n\n' +
        'You are Hapee, the AI assistant for Hapee.ai — an all-in-one Conversational AI + CRM + Automation platform built by Digitals Group and validated as a Meta and Google Partner.\nKey information:\n- 24/7 AI agents on WhatsApp, Instagram, Facebook and Email\n- Custom voice cloning, unlimited pipelines, email marketing\n- Public Tenders module (Mercado Público, Chile\'s public procurement marketplace) and Academy module included from STARTER\n- WhatsApp Business API on the PRO plan · on PRO the Public Tenders module covers Mercado Público and private entities\n- Native MCP connection with Anthropic\'s Claude (the only one in LATAM)\nPlans: STARTER 297 USD/month (2 users, 2,000 contacts) · PRO 397 USD/month, the most popular (unlimited users and contacts) · ELITE SETUP 3,290 USD one-time payment.\nElite is a one-time payment for a turnkey implementation. Hapee does not offer any trial period, and payments are final (see the Terms of Service).\nPlans are purchased directly at hapee.ai/en/planes — online card payment and instant account activation.\nTo book a demo: hapee.ai/en/agenda-tu-demo',
      pagina: 'The user is reading this page of the site: '
    },
    pt: {
      abrir: 'Converse com a Hapee AI', cerrar: 'Fechar chat', titulo: 'Hapee AI', online: 'online', escribiendo: 'digitando…',
      teaser: 'Oi! Posso ajudar?', placeholder: 'Digite sua pergunta…', enviar: 'Enviar', demo: 'Agendar demo',
      aviso: 'Respostas geradas por IA', dialogo: 'Chat com a Hapee AI',
      hola: 'Oi! Eu sou a <strong>Hapee</strong> 👋 Pergunte o que quiser sobre a plataforma, os planos ou como automatizar suas vendas.',
      sugerencias: ['O que a Hapee faz?', 'Quanto custa?', 'Quero agendar uma demo'],
      error: 'Tive um problema técnico. Tente de novo ou agende uma demo em hapee.ai/pt/agenda-tu-demo',
      prompt: 'Seu estilo:\n- Simpático, profissional e entusiasmado\n- Responda por padrão em português do Brasil. Se o usuário escrever em outro idioma, responda nesse mesmo idioma.\n- Direto e conciso: no máximo 2-3 frases curtas\n- Sem markdown pesado; um **negrito** pontual tudo bem\n- Nunca mencione GoHighLevel, GHL ou fornecedores white-label.\n\n' +
        'Você é a Hapee, a assistente de IA da Hapee.ai — plataforma completa de IA Conversacional + CRM + Automação desenvolvida pelo Digitals Group e validada como Meta e Google Partner.\nInformações-chave:\n- Agentes de IA 24/7 no WhatsApp, Instagram, Facebook e E-mail\n- Clonagem de voz personalizada, pipelines ilimitados, e-mail marketing\n- Módulos de Licitações (Mercado Público, o portal de compras públicas do Chile) e Academia incluídos desde o STARTER\n- WhatsApp Business API no plano PRO · no PRO o módulo de Licitações cobre o Mercado Público e entidades privadas\n- Conexão nativa MCP com o Claude da Anthropic (única na América Latina)\nPlanos: STARTER 297 USD/mês (2 usuários, 2.000 contatos) · PRO 397 USD/mês, o mais escolhido (usuários e contatos ilimitados) · ELITE SETUP 3.290 USD pagamento único.\nO Elite é um pagamento único de implementação chave na mão. A Hapee não oferece nenhum período de teste, e os pagamentos são definitivos (ver os Termos de Serviço).\nOs planos são contratados direto em hapee.ai/pt/planes — pagamento online com cartão e ativação imediata da conta.\nPara agendar uma demo: hapee.ai/pt/agenda-tu-demo',
      pagina: 'O usuário está lendo esta página do site: '
    }
  };
  var T = TEXTOS[idioma] || TEXTOS.es;
  var PREFIJO = idioma === 'en' ? '/en' : idioma === 'pt' ? '/pt' : '';
  var MODELO = 'claude-haiku-4-5-20251001';

  var mm = function (q) { return window.matchMedia ? matchMedia(q).matches : false; };
  var REDUCE = mm('(prefers-reduced-motion: reduce)');
  var MOVIL = mm('(pointer: coarse)') && Math.min(screen.width, screen.height) < 820;
  var conn = navigator.connection || {};
  var MODESTO = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '') ||
    (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;

  // ───────────────────────── estado del robot ─────────────────────────
  var ESTADOS = { idle: 1, listening: 1, thinking: 1, talking: 1, happy: 1 };
  var subs = [];
  var R = {
    __ok: true,
    state: 'idle', since: performance.now(), happyAt: -1e9, target: null,
    reduced: REDUCE,
    views: [],
    setState: function (name, opts) {
      if (!ESTADOS[name]) return;
      opts = opts || {};
      var prev = R.state;
      if (name === 'happy') {
        // saludo: es un gesto, no un estado que se quede; vuelve al anterior
        R.happyAt = performance.now();
        clearTimeout(R._happyT);
        R._happyT = setTimeout(function () { if (R.state === 'happy') R.setState(R._beforeHappy || 'idle'); }, 2800);
        if (prev !== 'happy') R._beforeHappy = prev;
      }
      if (name === 'listening') R.target = opts.target || R.target;
      if (name !== 'talking') { clearTimeout(R._talkT); detachAudio(); }
      else if (opts.maxMs) {
        clearTimeout(R._talkT);
        R._talkT = setTimeout(function () { if (R.state === 'talking' && !playing()) R.setState('idle'); }, opts.maxMs);
      }
      if (name === prev) return;
      R.state = name; R.since = performance.now();
      for (var i = 0; i < subs.length; i++) try { subs[i](name, prev); } catch (e) { /* un suscriptor roto no frena al resto */ }
      try { window.dispatchEvent(new CustomEvent('hapee:robot-state', { detail: { state: name, prev: prev } })); } catch (e) {}
    },
    on: function (fn) { subs.push(fn); },
    attachAudio: attachAudio,
    level: level,
    open: function () { abrir(); }
  };
  window.HapeeRobot = R;
  window.addEventListener('hapee:robot', function (e) {
    var d = e.detail || {};
    if (d.audio) attachAudio(d.audio);
    if (d.state) R.setState(d.state, d);
  });

  // ── audio: amplitud real con WebAudio (solo si el contexto ya corre; si no, pulso simulado) ──
  var actx = null, analyser = null, buf = null, audioEl = null, lvl = 0;
  function ensureCtx() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) { actx = new AC(); analyser = actx.createAnalyser(); analyser.fftSize = 512; analyser.connect(actx.destination); buf = new Uint8Array(analyser.fftSize); }
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { actx = null; }
  }
  function attachAudio(el) {
    if (!el) return;
    audioEl = el;
    R.setState('talking');
    clearTimeout(R._talkT);
    // Solo se enruta por WebAudio si el contexto está corriendo: si estuviera suspendido el
    // audio quedaría mudo, y la voz importa más que la animación.
    if (!actx || actx.state !== 'running' || el.__hapeeSrc) return;
    try { el.__hapeeSrc = actx.createMediaElementSource(el); el.__hapeeSrc.connect(analyser); } catch (e) { /* queda el pulso simulado */ }
  }
  function detachAudio() { audioEl = null; }
  function playing() { return !!(audioEl && !audioEl.paused && !audioEl.ended); }
  function level() {
    var target = 0;
    if (R.state === 'talking') {
      if (audioEl && audioEl.__hapeeSrc && playing()) {
        analyser.getByteTimeDomainData(buf);
        var s = 0; for (var i = 0; i < buf.length; i++) { var v = (buf[i] - 128) / 128; s += v * v; }
        target = Math.min(1, Math.sqrt(s / buf.length) * 4.2);
      } else {
        var t = performance.now() / 1000;
        target = .35 + .45 * Math.abs(Math.sin(t * 8.3) * Math.sin(t * 3.1 + .6));
      }
    }
    lvl += (target - lvl) * (target > lvl ? .5 : .18);
    return lvl;
  }

  // ───────────────────────── estilos ─────────────────────────
  var A1 = 'var(--accent,#FA5000)', A2 = 'var(--accent-alt,#CD2349)';
  var css =
    '[data-hapee-robot]{position:relative}' +
    '[data-hapee-robot] canvas.hr-cv{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .6s ease;touch-action:pan-y}' +
    '[data-hapee-robot].hr-ready canvas.hr-cv{opacity:1}' +
    '.hr-ready>.hr-poster,.hr-ready-poster{opacity:0!important;transition:opacity .6s ease}' +
    '.hr-live{position:absolute;z-index:6;cursor:pointer;border-radius:24px;-webkit-tap-highlight-color:transparent}' +
    '.hr-live:focus-visible{outline:3px solid rgba(250,80,0,.5);outline-offset:4px}' +
    '.hapee-bot{position:fixed;right:20px;bottom:20px;z-index:998;font-family:"Plus Jakarta Sans",system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity .3s ease,transform .3s ease,bottom .3s ease}' +
    '.hapee-bot.hb-oculto{opacity:0;transform:translateY(16px) scale(.9);pointer-events:none}' +
    '.hb-fab{position:relative;width:62px;height:62px;border-radius:50%;border:0;padding:0;cursor:pointer;display:block;background:radial-gradient(circle at 50% 30%,#fff 0,#fff3ec 60%,#ffe2d6 100%);box-shadow:0 10px 28px rgba(205,35,73,.35),0 3px 8px rgba(0,0,0,.18);transition:transform .25s cubic-bezier(.16,1,.3,1),box-shadow .25s ease;-webkit-tap-highlight-color:transparent}' +
    'html.dark .hb-fab{background:radial-gradient(circle at 50% 30%,#2a1a1c 0,#160d0f 100%)}' +
    '.hb-fab::before{content:"";position:absolute;inset:-3px;border-radius:50%;padding:3px;background:linear-gradient(135deg,' + A1 + ',' + A2 + ');-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}' +
    '.hb-fab:hover,.hb-fab:focus-visible{transform:scale(1.07);box-shadow:0 14px 34px rgba(205,35,73,.45),0 4px 10px rgba(0,0,0,.2)}' +
    '.hb-fab:focus-visible{outline:3px solid rgba(250,80,0,.45);outline-offset:4px}' +
    '.hb-vista{position:absolute;inset:0;border-radius:50%;overflow:hidden}' +
    '.hb-vista .hr-poster{position:absolute;left:50%;top:6%;width:64%;transform:translateX(-50%);height:auto;object-fit:contain;object-position:top;pointer-events:none}' +
    '.hb-x{position:absolute;inset:0;display:none;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(135deg,' + A1 + ',' + A2 + ');color:#fff;font-size:26px;line-height:1}' +
    '.hapee-bot.hb-abierto .hb-x{display:flex}' +
    '.hb-estado{position:absolute;right:-2px;top:-2px;width:16px;height:16px;border-radius:50%;background:#25D366;border:3px solid #fff;box-sizing:border-box}' +
    'html.dark .hb-estado{border-color:#160d0f}' +
    '.hapee-bot[data-state=thinking] .hb-estado,.hapee-bot[data-state=talking] .hb-estado{background:' + A1 + ';animation:hbLate 1s ease-in-out infinite}' +
    '.hapee-bot[data-state=talking] .hb-fab{box-shadow:0 0 0 calc(4px + var(--hb-lvl,0)*10px) rgba(250,80,0,.18),0 10px 28px rgba(205,35,73,.35)}' +
    '.hapee-bot[data-state=happy] .hb-fab{animation:hbSalto .7s cubic-bezier(.3,1.6,.5,1) 2}' +
    '@keyframes hbLate{50%{transform:scale(1.25)}}' +
    '@keyframes hbSalto{40%{transform:translateY(-8px) rotate(-6deg)}}' +
    '.hb-teaser{position:absolute;right:72px;bottom:14px;background:#fff;color:#111;font-size:.86rem;font-weight:600;line-height:1.2;padding:9px 13px;border-radius:14px 14px 4px 14px;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,.16),0 0 0 1px rgba(0,0,0,.04);opacity:0;transform:translateX(8px);transition:opacity .3s,transform .3s;pointer-events:none}' +
    '.hapee-bot.hb-teaser-on .hb-teaser,.hapee-bot:not(.hb-abierto) .hb-fab:hover+.hb-teaser{opacity:1;transform:none}' +
    '.hb-panel{position:fixed;right:20px;bottom:96px;z-index:998;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 150px));height:min(560px,calc(100dvh - 150px));display:flex;flex-direction:column;background:#fff;color:#141414;border-radius:20px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.28),0 0 0 1px rgba(0,0,0,.06);opacity:0;transform:translateY(14px) scale(.98);transform-origin:bottom right;pointer-events:none;visibility:hidden;transition:opacity .25s ease,transform .25s ease,visibility .25s}' +
    '.hb-panel.hb-on{opacity:1;transform:none;pointer-events:auto;visibility:visible}' +
    'html.dark .hb-panel{background:#111;color:#eee;box-shadow:0 24px 70px rgba(0,0,0,.6),0 0 0 1px rgba(255,255,255,.08)}' +
    '.hb-head{display:flex;align-items:center;gap:10px;padding:12px 14px;color:#fff;background:linear-gradient(135deg,' + A1 + ',' + A2 + ')}' +
    '.hb-av{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.95);overflow:hidden;flex-shrink:0;position:relative}' +
    '.hb-av img{position:absolute;left:50%;top:6%;width:66%;transform:translateX(-50%)}' +
    '.hb-tit{flex:1;min-width:0;line-height:1.15}.hb-tit b{display:block;font-size:.98rem}.hb-tit span{font-size:.76rem;opacity:.9}' +
    '.hb-cerrar{width:40px;height:40px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:22px;line-height:1;cursor:pointer}' +
    '.hb-cerrar:hover{background:rgba(255,255,255,.28)}' +
    '.hb-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#faf7f5;overscroll-behavior:contain}' +
    'html.dark .hb-msgs{background:#0b0b0b}' +
    '.hb-m{max-width:86%;padding:9px 12px;border-radius:16px;font-size:.9rem;line-height:1.42;word-wrap:break-word;overflow-wrap:anywhere}' +
    '.hb-m a{color:inherit;font-weight:700;text-decoration:underline}' +
    '.hb-m.bot{align-self:flex-start;background:#fff;border:1px solid rgba(0,0,0,.06);border-bottom-left-radius:5px}' +
    'html.dark .hb-m.bot{background:#1b1b1b;border-color:rgba(255,255,255,.06)}' +
    '.hb-m.yo{align-self:flex-end;color:#fff;background:linear-gradient(135deg,' + A1 + ',' + A2 + ');border-bottom-right-radius:5px}' +
    '.hb-m.esc{display:flex;gap:4px;padding:12px 14px}.hb-m.esc i{width:7px;height:7px;border-radius:50%;background:' + A1 + ';opacity:.5;animation:hbPunto 1s infinite}.hb-m.esc i:nth-child(2){animation-delay:.15s}.hb-m.esc i:nth-child(3){animation-delay:.3s}' +
    '@keyframes hbPunto{30%{opacity:1;transform:translateY(-3px)}}' +
    '.hb-sug{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:#faf7f5}html.dark .hb-sug{background:#0b0b0b}' +
    '.hb-sug button{border:1px solid rgba(250,80,0,.35);background:rgba(250,80,0,.06);color:inherit;font:inherit;font-size:.8rem;font-weight:600;min-height:36px;padding:6px 12px;border-radius:999px;cursor:pointer}' +
    '.hb-sug button:hover{background:rgba(250,80,0,.14)}' +
    '.hb-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(0,0,0,.07)}html.dark .hb-form{border-color:rgba(255,255,255,.08)}' +
    '.hb-in{flex:1;min-width:0;border:1px solid rgba(0,0,0,.12);border-radius:999px;padding:0 14px;height:44px;font:inherit;font-size:16px;background:#fff;color:inherit;outline:none}' +
    '.hb-in:focus{border-color:' + A1 + ';box-shadow:0 0 0 3px rgba(250,80,0,.15)}' +
    'html.dark .hb-in{background:#1a1a1a;border-color:rgba(255,255,255,.12)}' +
    '.hb-env{width:44px;height:44px;border:0;border-radius:50%;cursor:pointer;color:#fff;background:linear-gradient(135deg,' + A1 + ',' + A2 + ');display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
    '.hb-env:disabled{opacity:.5;cursor:default}.hb-env svg{width:18px;height:18px}' +
    '.hb-pie{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 14px 10px;font-size:.72rem;opacity:.75}' +
    '.hb-pie a{color:' + A1 + ';font-weight:700;text-decoration:none;min-height:32px;display:inline-flex;align-items:center}' +
    '@media(max-width:600px){.hapee-bot{right:14px}.hb-fab{width:56px;height:56px}.hb-teaser{display:none}.hb-panel{right:12px;left:12px;width:auto}}' +
    '@media(prefers-reduced-motion:reduce){.hapee-bot,.hb-fab,.hb-panel,.hb-teaser,[data-hapee-robot] canvas.hr-cv{transition:none!important;animation:none!important}.hb-estado,.hb-m.esc i{animation:none!important}}';
  var st = document.createElement('style');
  st.id = 'hapee-bot-style';
  st.textContent = css;
  document.head.appendChild(st);

  // ───────────────────────── chat de la página (home / agenda) ─────────────────────────
  var chatSec = document.getElementById('hapee-chat');
  var hiInput = document.getElementById('hiInput');
  var tieneChat = !!(chatSec && hiInput);
  var heroVista = document.querySelector('[data-hapee-robot="hero"]');

  function enfocarChatPagina() {
    // persona Hapee si el visitante todavía no escribió nada (cambiarla reinicia la conversación)
    var gen = document.querySelector('.hi-ind[data-ind="general"]');
    var msgs = document.getElementById('hiMessages');
    if (gen && !gen.classList.contains('on') && msgs && !msgs.querySelector('.hi-msg.me')) gen.click();
    var dest = document.getElementById('hiPhone') || chatSec;
    dest.scrollIntoView({ behavior: REDUCE ? 'auto' : 'smooth', block: 'center' });
    setTimeout(function () { try { hiInput.focus({ preventScroll: true }); } catch (e) { hiInput.focus(); } }, REDUCE ? 0 : 450);
    if (!R._saludo) { R._saludo = true; R.setState('happy'); }
  }

  if (tieneChat) {
    var gesto = function () { ensureCtx(); };
    chatSec.addEventListener('pointerdown', gesto, { passive: true });
    chatSec.addEventListener('keydown', gesto);
    // listening: mientras el visitante escribe, el robot se inclina y mira el input
    var esc = function () {
      if (R.state === 'thinking' || R.state === 'talking') return;
      if (hiInput.value.trim()) R.setState('listening', { target: hiInput });
      else if (R.state === 'listening') R.setState('idle');
    };
    hiInput.addEventListener('input', esc);
    hiInput.addEventListener('focus', esc);
    hiInput.addEventListener('blur', function () { if (R.state === 'listening') R.setState('idle'); });
    // Respaldo genérico para chats sin ganchos explícitos (agenda-tu-demo): la burbuja
    // «escribiendo» = thinking; la respuesta = talking con pulso por tiempo.
    var msgsEl = document.getElementById('hiMessages');
    if (msgsEl && window.MutationObserver) new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var add = ms[i].addedNodes;
        for (var j = 0; j < add.length; j++) {
          var n = add[j]; if (n.nodeType !== 1) continue;
          if (n.id === 'hiTypingBubble') R.setState('thinking');
          else if (R.state === 'thinking' && n.classList.contains('bot')) R.setState('talking', { maxMs: 3000 + (n.textContent || '').length * 85 });
        }
      }
    }).observe(msgsEl, { childList: true });
  }

  // ───────────────────────── robot del hero (home) ─────────────────────────
  if (heroVista) {
    var abrirDesdeHero = function (e) {
      if (heroVista._arrastre && performance.now() - heroVista._arrastre < 350) return; // fue un arrastre para girarlo
      if (e) e.preventDefault();
      if (tieneChat) enfocarChatPagina(); else abrir();
    };
    heroVista.addEventListener('click', abrirDesdeHero);
    heroVista.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') abrirDesdeHero(e); });
    // el overlay copia la caja del póster (img.hero-robot) con aire a los lados para el brazo que saluda
    var poster = heroVista.parentNode && heroVista.parentNode.querySelector('img.hero-robot');
    var calzar = function () {
      if (!poster) return;
      var w = poster.offsetWidth, h = poster.offsetHeight; if (!w || !h) return;
      var s = heroVista.style;
      s.width = Math.round(w * 1.9) + 'px'; s.height = Math.round(h * 1.12) + 'px';
      s.left = Math.round(poster.offsetLeft + w / 2 - w * .95) + 'px';
      s.top = Math.round(poster.offsetTop + h / 2 - h * .58) + 'px';
    };
    calzar();
    if (poster && !poster.complete) poster.addEventListener('load', calzar);
    window.addEventListener('resize', calzar);
    if (window.ResizeObserver && poster) new ResizeObserver(calzar).observe(poster);
    heroVista._poster = poster;
    R.views.push({ el: heroVista, name: 'hero', fit: 'full', drag: true, periodic: true });
  }
  var vitrina = document.querySelectorAll('[data-hapee-robot="showcase"]');
  for (var vi = 0; vi < vitrina.length; vi++) R.views.push({ el: vitrina[vi], name: 'showcase', fit: 'full', drag: true, periodic: false });

  // ───────────────────────── lanzador + panel ─────────────────────────
  var wrap = document.createElement('div');
  wrap.className = 'hapee-bot';
  wrap.id = 'hapee-bot';
  wrap.setAttribute('data-state', 'idle');
  wrap.innerHTML =
    '<button type="button" class="hb-fab" aria-label="' + T.abrir + '"' + (tieneChat ? '' : ' aria-expanded="false" aria-controls="hapee-bot-panel"') + '>' +
      '<span class="hb-vista" data-hapee-robot="launcher"><img class="hr-poster" src="/img/robot.png" alt="" width="435" height="800" loading="lazy" decoding="async"></span>' +
      '<span class="hb-x" aria-hidden="true">×</span><span class="hb-estado" aria-hidden="true"></span>' +
    '</button>' +
    '<span class="hb-teaser" aria-hidden="true">' + T.teaser + '</span>';
  var fab = wrap.querySelector('.hb-fab');
  var vistaLanzador = wrap.querySelector('.hb-vista');
  R.views.push({ el: vistaLanzador, name: 'launcher', fit: 'bust', drag: false, periodic: false });

  var panel = null, abierto = false;
  function montarPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.className = 'hb-panel';
    panel.id = 'hapee-bot-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', T.dialogo);
    panel.innerHTML =
      '<div class="hb-head"><span class="hb-av"><img src="/img/robot.png" alt=""></span>' +
        '<span class="hb-tit"><b>' + T.titulo + '</b><span class="hb-st">' + T.online + '</span></span>' +
        '<button type="button" class="hb-cerrar" aria-label="' + T.cerrar + '">×</button></div>' +
      '<div class="hb-msgs" aria-live="polite"></div>' +
      '<div class="hb-sug"></div>' +
      '<form class="hb-form"><input class="hb-in" type="text" autocomplete="off" maxlength="600" placeholder="' + T.placeholder + '" aria-label="' + T.placeholder + '">' +
        '<button class="hb-env" type="submit" aria-label="' + T.enviar + '"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></form>' +
      '<div class="hb-pie"><span>' + T.aviso + '</span><a class="hb-demo" href="' + linkDemo() + '">' + T.demo + ' →</a></div>';
    document.body.appendChild(panel);
    panel.querySelector('.hb-cerrar').addEventListener('click', function () { cerrar(true); });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(true); });
    var form = panel.querySelector('.hb-form'), inp = panel.querySelector('.hb-in');
    form.addEventListener('submit', function (e) { e.preventDefault(); enviar(inp.value); });
    inp.addEventListener('input', function () {
      if (R.state === 'thinking' || R.state === 'talking') return;
      if (inp.value.trim()) R.setState('listening', { target: inp }); else if (R.state === 'listening') R.setState('idle');
    });
    pintarHistorial();
    posicionar();
  }

  // Lleva los parámetros de campaña de la URL actual al link de demo (agenda-tu-demo los
  // reenvía al calendario). Solo agrega; no toca nada de lo que ya hace la página.
  function linkDemo() {
    var url = PREFIJO + '/agenda-tu-demo';
    try {
      var q = new URLSearchParams(location.search), out = new URLSearchParams();
      q.forEach(function (v, k) { if (/^(utm_[a-z_]+|fbclid|gclid|ttclid|msclkid|dclid|twclid|yclid|wbraid|gbraid)$/i.test(k)) out.set(k, v); });
      var s = out.toString(); if (s) url += '?' + s;
    } catch (e) {}
    return url;
  }

  // ── chat compacto (páginas sin chat propio) ──
  var CLAVE = 'hapee-bot-chat-' + idioma;
  var historial = [];
  try { historial = JSON.parse(sessionStorage.getItem(CLAVE) || '[]') || []; } catch (e) { historial = []; }
  var ocupado = false;
  function guardar() { try { sessionStorage.setItem(CLAVE, JSON.stringify(historial.slice(-12))); } catch (e) {} }
  function escapar(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function formato(t) {
    return escapar(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(?:https?:\/\/)?(?:www\.)?hapee\.ai(\/[A-Za-z0-9_\-\/.]*)?/g, function (m, p) {
        p = (p || '/').replace(/[.]+$/, '');
        var href = /\/agenda-tu-demo\/?$/.test(p) ? linkDemo() : p;
        return '<a href="' + href + '">hapee.ai' + (p === '/' ? '' : p) + '</a>';
      })
      .replace(/\n/g, '<br>');
  }
  function burbuja(rol, html) {
    var box = panel.querySelector('.hb-msgs'), d = document.createElement('div');
    d.className = 'hb-m ' + rol; d.innerHTML = html; box.appendChild(d); box.scrollTop = box.scrollHeight; return d;
  }
  function pintarHistorial() {
    var box = panel.querySelector('.hb-msgs'); box.innerHTML = '';
    burbuja('bot', T.hola);
    for (var i = 0; i < historial.length; i++) burbuja(historial[i].role === 'user' ? 'yo' : 'bot', historial[i].role === 'user' ? escapar(historial[i].content) : formato(historial[i].content));
    var sug = panel.querySelector('.hb-sug'); sug.innerHTML = '';
    if (!historial.length) T.sugerencias.forEach(function (q) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = q;
      b.addEventListener('click', function () { enviar(q); }); sug.appendChild(b);
    });
  }
  function enviar(texto) {
    texto = (texto || '').trim();
    if (!texto || ocupado) return;
    ocupado = true;
    var inp = panel.querySelector('.hb-in'), btn = panel.querySelector('.hb-env'), stEl = panel.querySelector('.hb-st');
    inp.value = ''; btn.disabled = true;
    panel.querySelector('.hb-sug').innerHTML = '';
    burbuja('yo', escapar(texto));
    historial.push({ role: 'user', content: texto });
    var esc = burbuja('bot esc', '<i></i><i></i><i></i>');
    stEl.textContent = T.escribiendo;
    R.setState('thinking');
    var sistema = T.prompt + '\n\n' + T.pagina + (document.title || '') + ' (' + location.pathname + ')';
    fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODELO, max_tokens: 400, system: sistema, messages: historial.slice(-10) })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var txt = d && d.content && d.content[0] && d.content[0].text;
        if (!txt) throw new Error('respuesta vacía');
        historial.push({ role: 'assistant', content: txt }); guardar();
        return txt;
      })
      .catch(function (e) {
        if (window.console) console.warn('Hapee AI: /api/chat no respondió', e && e.message || e);
        historial.pop();
        return null;
      })
      .then(function (txt) {
        esc.remove(); stEl.textContent = T.online;
        burbuja('bot', formato(txt || T.error));
        R.setState('talking', { maxMs: 1800 + (txt || '').length * 45 });
        ocupado = false; btn.disabled = false;
        try { inp.focus({ preventScroll: true }); } catch (e) {}
      });
  }

  function abrir() {
    if (tieneChat) { enfocarChatPagina(); return; }
    montarPanel();
    abierto = true;
    panel.classList.add('hb-on');
    wrap.classList.add('hb-abierto'); wrap.classList.remove('hb-teaser-on');
    fab.setAttribute('aria-expanded', 'true'); fab.setAttribute('aria-label', T.cerrar);
    if (!R._saludo) { R._saludo = true; R.setState('happy'); }
    if (!MOVIL) setTimeout(function () { try { panel.querySelector('.hb-in').focus({ preventScroll: true }); } catch (e) {} }, 60);
    activar3D();
  }
  function cerrar(devolverFoco) {
    if (!panel || !abierto) return;
    abierto = false;
    panel.classList.remove('hb-on'); wrap.classList.remove('hb-abierto');
    fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-label', T.abrir);
    if (R.state === 'listening') R.setState('idle');
    if (devolverFoco) fab.focus();
  }
  fab.addEventListener('click', function () { if (abierto) cerrar(false); else abrir(); });

  R.on(function (s) { wrap.setAttribute('data-state', s); });
  // pulso del anillo del lanzador cuando no hay 3D (variable CSS, barata)
  (function lazo() {
    if (R.state === 'talking') wrap.style.setProperty('--hb-lvl', level().toFixed(2));
    setTimeout(lazo, R.state === 'talking' ? 80 : 400);
  })();

  // ── posición: sobre WhatsApp y sobre la barra «Reservar demo» móvil (agenda-tu-demo) ──
  function posicionar() {
    var ancho = window.innerWidth, chico = ancho <= 600;
    var wa = document.getElementById('hapee-wa-fab');
    var base = chico ? 14 : 20;
    if (wa && wa.getClientRects().length && getComputedStyle(wa).display !== 'none') base = chico ? 14 + 54 + 12 : 20 + 58 + 14;
    var barra = document.getElementById('demoStickyMobile');
    if (barra && barra.classList.contains('visible') && getComputedStyle(barra).display !== 'none') {
      var h = barra.getBoundingClientRect().height;
      if (h > 0 && h < 200) base = Math.max(base, Math.round(h) + 12);
    }
    wrap.style.bottom = base + 'px';
    if (panel) {
      var fabH = chico ? 56 : 62, abajo = base + fabH + 12;
      panel.style.bottom = abajo + 'px';
      panel.style.height = 'min(560px, ' + Math.max(260, window.innerHeight - abajo - 76) + 'px)';
    }
  }
  window.addEventListener('resize', posicionar);
  window.addEventListener('load', posicionar);
  var barraDemo = document.getElementById('demoStickyMobile');
  if (barraDemo && window.MutationObserver) new MutationObserver(posicionar).observe(barraDemo, { attributes: true, attributeFilter: ['class'] });

  // ── en la home: escondido mientras el robot del hero está en pantalla ──
  function ocultoPorHero(si) { wrap.classList.toggle('hb-oculto', si); if (si) { fab.setAttribute('tabindex', '-1'); } else fab.removeAttribute('tabindex'); }
  if (heroVista && window.IntersectionObserver) {
    new IntersectionObserver(function (es) { ocultoPorHero(es[0].isIntersecting); }, { threshold: .15 }).observe(heroVista);
  }

  document.body.appendChild(wrap);
  posicionar();
  // teaser una sola vez por sesión, a los 9 s, solo si no lo abrió
  try {
    if (!sessionStorage.getItem('hapee-bot-teaser') && !tieneChat) setTimeout(function () {
      if (abierto || wrap.classList.contains('hb-oculto')) return;
      wrap.classList.add('hb-teaser-on'); sessionStorage.setItem('hapee-bot-teaser', '1');
      setTimeout(function () { wrap.classList.remove('hb-teaser-on'); }, 5000);
    }, 9000);
  } catch (e) {}

  // ───────────────────────── 3D diferido ─────────────────────────
  // Páginas que ya cargan <model-viewer> (agenda-tu-demo) traen su propia copia de three.js:
  // ahí el lanzador queda con la imagen para no bajar three dos veces.
  var conModelViewer = !!document.querySelector('model-viewer');
  var puede3D = !REDUCE && !MODESTO && !conModelViewer && (function () {
    try { var c = document.createElement('canvas'); var gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return false; var x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return true; } catch (e) { return false; }
  })();
  var cargado = false;
  function activar3D() {
    if (cargado || !puede3D) return;
    // en móvil queda la imagen (rendimiento y batería): ni hero ni lanzador cargan three.js
    var vistas = MOVIL ? [] : R.views.slice();
    if (!vistas.length) return;
    cargado = true;
    import('/js/robot/robot-view.js?v=1').then(function (m) { return m.start(R, vistas); })
      .catch(function (e) { if (window.console) console.warn('Hapee robot 3D no disponible, queda la imagen:', e && e.message || e); });
  }
  // después de load + idle; en páginas sin hero espera además una interacción
  function cuandoOcioso(fn) { (window.requestIdleCallback || function (f) { return setTimeout(f, 1200); })(fn, { timeout: 4000 }); }
  function programar() {
    if (heroVista) { setTimeout(function () { cuandoOcioso(activar3D); }, 900); return; }
    var una = function () {
      ['pointermove', 'scroll', 'keydown', 'touchstart'].forEach(function (ev) { removeEventListener(ev, una, { passive: true }); });
      cuandoOcioso(activar3D);
    };
    ['pointermove', 'scroll', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, una, { passive: true }); });
  }
  if (document.readyState === 'complete') programar(); else window.addEventListener('load', programar);
})();

/* Home — propuesta 2026 (no publicada). Sin dependencias obligatorias:
   GSAP/ScrollTrigger/Lenis mejoran la experiencia si cargan; si no, todo
   queda visible y usable. prefers-reduced-motion apaga el movimiento. */
(function () {
  'use strict';
  var d = document, de = d.documentElement, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  de.classList.add('js');

  /* ── Tema ─────────────────────────────────────────────── */
  $('#themeBtn').addEventListener('click', function () {
    var dark = de.classList.toggle('dark');
    try { localStorage.setItem('hapee-prop-theme', dark ? 'dark' : 'light'); } catch (e) {}
  });

  /* ── Nav: se esconde al bajar, vuelve al subir ────────── */
  var nav = $('#nav'), lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('hide', y > 400 && y > lastY && !d.querySelector('.mm.open'));
    lastY = y;
    var mc = $('#mcta');
    if (mc) {
      var fin = $('#final').getBoundingClientRect().top < window.innerHeight * .8;
      mc.classList.toggle('on', y > window.innerHeight * .9 && !fin);
    }
  }, { passive: true });

  /* ── Mega menú ────────────────────────────────────────── */
  var mms = $$('[data-mm]');
  function closeMM(ex) { mms.forEach(function (m) { if (m !== ex) { m.classList.remove('open'); $('button', m).setAttribute('aria-expanded', 'false'); } }); }
  mms.forEach(function (m) {
    var b = $('button', m), t;
    function open() { clearTimeout(t); closeMM(m); m.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    function close() { t = setTimeout(function () { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }, 120); }
    b.addEventListener('click', function (e) { e.stopPropagation(); m.classList.contains('open') ? close() : open(); });
    if (fine) { m.addEventListener('mouseenter', open); m.addEventListener('mouseleave', close); }
    $$('a', m).forEach(function (a) { a.addEventListener('click', function () { closeMM(null); }); });
  });
  d.addEventListener('click', function () { closeMM(null); });

  /* ── Menú móvil ───────────────────────────────────────── */
  var burger = $('#burger'), sheet = $('#sheet');
  function setSheet(on) {
    sheet.hidden = !on; burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    burger.setAttribute('aria-label', on ? 'Cerrar menú' : 'Abrir menú');
    de.style.overflow = on ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { setSheet(sheet.hidden); });
  $$('a', sheet).forEach(function (a) { a.addEventListener('click', function () { setSheet(false); }); });

  /* ── Notas de diseño ──────────────────────────────────── */
  var nb = $('#notesBtn');
  nb.addEventListener('click', function () {
    var on = d.body.classList.toggle('show-notes');
    nb.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  if (/[?&]notas=1/.test(location.search)) nb.click();

  /* ── Selector de idioma ───────────────────────────────────
     En el sitio real escribe la cookie hapee_lang y lleva a la misma página
     en /en/ o /pt/ (ver js/lang.js). La propuesta existe solo en español:
     aquí muestra un aviso en vez de navegar a una página que no existe. */
  (function () {
    var box = $('[data-lang]'), note = d.createElement('div'), t;
    note.className = 'lang-note'; note.setAttribute('role', 'status'); d.body.appendChild(note);
    if (box) {
      var b = $('.lang-btn', box);
      b.addEventListener('click', function (e) { e.stopPropagation(); var o = box.classList.toggle('open'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
      d.addEventListener('click', function () { box.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); });
    }
    $$('[data-l]').forEach(function (el) {
      el.addEventListener('click', function () {
        var l = el.dataset.l; if (box) box.classList.remove('open');
        if (l === 'es') return;
        note.textContent = (l === 'en' ? 'English' : 'Português') + ': esta propuesta está solo en español. Al aprobarla, este selector lleva a la versión /' + l + '/ de la misma página y recuerda la elección.';
        note.classList.add('on'); clearTimeout(t); t = setTimeout(function () { note.classList.remove('on'); }, 4200);
      });
    });
  })();

  /* ── Cursor y botones magnéticos (solo puntero fino) ──── */
  if (fine && !reduce) {
    var curEl = $('.cursor'), cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() { cx += (tx - cx) * .22; cy += (ty - cy) * .22; curEl.style.transform = 'translate(' + cx + 'px,' + cy + 'px)'; requestAnimationFrame(loop); })();
    d.addEventListener('pointerover', function (e) { curEl.classList.toggle('hot', !!e.target.closest('a,button,input,summary,.chip,.sphere')); });
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .25) + 'px,' + ((e.clientY - r.top - r.height / 2) * .35) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  } else { var c0 = $('.cursor'); if (c0) c0.remove(); }

  /* ── Spotlight en cards ───────────────────────────────── */
  $$('.spot').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ── Robot (render oficial): inclinación 3D que sigue al cursor ── */
  var tilt = $('#botTilt');
  if (tilt && !reduce) {
    var rx = 0, ry = 0, trx = 0, tryy = 0, t0 = performance.now();
    if (fine) window.addEventListener('pointermove', function (e) {
      tryy = (e.clientX / window.innerWidth - .5) * 22;
      trx = (e.clientY / window.innerHeight - .5) * -12;
    }, { passive: true });
    (function tl(now) {
      if (!fine) { var s = (now - t0) / 1000; tryy = Math.sin(s * .7) * 9; trx = Math.sin(s * .5) * 4; }   // táctil: balanceo suave
      rx += (trx - rx) * .07; ry += (tryy - ry) * .07;
      tilt.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      tilt.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      requestAnimationFrame(tl);
    })(t0);
    if (fine) $$('.float').forEach(function (f, i) {
      var k = [18, -14, 10][i] || 10;
      window.addEventListener('pointermove', function (e) {
        f.style.transform = 'translate(' + ((e.clientX / window.innerWidth - .5) * k) + 'px,' + ((e.clientY / window.innerHeight - .5) * k) + 'px)';
      }, { passive: true });
    });
  }

  /* ── Placeholder rotativo del hero ────────────────────── */
  var hi = $('#heroInput'), ideas = ['Vendo departamentos en Santiago…', 'Tengo una clínica dental…', 'Vendo cursos online de inglés…', 'Tengo una tienda de ropa en Instagram…', 'Vendo autos seminuevos…'], ii = 0;
  if (!reduce) setInterval(function () { if (d.activeElement !== hi && !hi.value) { ii = (ii + 1) % ideas.length; hi.placeholder = ideas[ii]; } }, 2600);

  /* ═════════ DEMO EN VIVO ═════════ */
  var IND = {
    inmobiliaria: { name: 'Inmobiliaria Andes', hello: '¡Hola! 👋 Soy el asistente de Inmobiliaria Andes. ¿Buscas comprar o arrendar? Cuéntame en qué comuna y te muestro opciones.', sugg: ['Busco depto de 2 dormitorios', '¿Tienen opciones con subsidio?', 'Quiero agendar una visita'], ctx: 'una inmobiliaria en Santiago de Chile con departamentos de 1 a 3 dormitorios desde UF 2.900 en Ñuñoa, La Florida y Providencia. Ofrece visitas al piloto de lunes a sábado.' },
    clinica: { name: 'Clínica Vida Plena', hello: '¡Hola! Soy el asistente de Clínica Vida Plena. ¿Quieres agendar una hora o tienes una consulta sobre nuestros servicios?', sugg: ['Quiero una hora con dermatología', '¿Atienden con Fonasa?', '¿Cuánto cuesta una consulta?'], ctx: 'una clínica ambulatoria con medicina general, dermatología, ginecología y dental. Atiende Fonasa e Isapres. Consulta general desde $25.000 CLP.' },
    educacion: { name: 'Academia Aprende+', hello: '¡Hola! Soy el asistente de Academia Aprende+. ¿Te interesa algún curso en particular o te ayudo a elegir?', sugg: ['¿Qué cursos de inglés tienen?', '¿Son online o presenciales?', '¿Cuánto cuesta?'], ctx: 'una academia online con cursos de inglés, Excel y marketing digital. Clases en vivo y grabadas, desde USD 49 al mes, con certificado.' },
    ecommerce: { name: 'Tienda Nativa', hello: '¡Hola! 🛍️ Bienvenido a Tienda Nativa. ¿Buscas algo en especial? Te ayudo con tallas, stock y despacho.', sugg: ['¿Tienen la polera en talla M?', '¿Cuánto demora el despacho?', '¿Puedo cambiar un producto?'], ctx: 'una tienda online de ropa sustentable. Despacho a todo Chile en 2 a 4 días hábiles, gratis sobre $40.000 CLP, y cambios dentro de 30 días.' },
    automotriz: { name: 'Automotriz Sur', hello: '¡Hola! Soy el asistente de Automotriz Sur. ¿Buscas un auto nuevo o seminuevo? Te ayudo a cotizar y a agendar un test drive.', sugg: ['Quiero cotizar un SUV', '¿Reciben mi auto en parte de pago?', 'Agendar test drive'], ctx: 'una automotora con autos nuevos y seminuevos certificados. Financiamiento con pie desde 20%, recibe autos en parte de pago y ofrece test drive a domicilio.' },
    servicios: { name: 'Estudio Consultor', hello: '¡Hola! Soy el asistente de Estudio Consultor. ¿En qué te podemos ayudar: contabilidad, legal o recursos humanos?', sugg: ['Necesito un contador para mi pyme', '¿Cuánto cuesta la asesoría?', 'Quiero una reunión'], ctx: 'un estudio de servicios profesionales para pymes: contabilidad, asesoría legal y gestión de personas. Planes mensuales desde 3 UF.' }
  };
  var VOICE = 'lLsDvdl6OjtZfLJPM2HA';
  var cur = 'inmobiliaria', history = [], busy = false, voiceOn = false, audio = null, custom = null;
  var body = $('#phBody'), sugg = $('#phSugg'), form = $('#phForm'), input = $('#phText'), status = $('#phStatus');

  function systemPrompt() {
    var biz = custom ? ('un negocio que el visitante describió así: «' + custom + '». Inventa un nombre comercial verosímil y datos razonables si te los piden.') : ('«' + IND[cur].name + '», ' + IND[cur].ctx);
    return 'Eres el agente de ventas por WhatsApp de ' + biz +
      ' Esta es una DEMO en la web de Hapee.ai que muestra cómo trabaja un agente de IA de Hapee.' +
      ' Reglas: responde en español neutro y trata al cliente de tú, en máximo 2 o 3 frases cortas, cálido y profesional, con a lo sumo un emoji.' +
      ' No uses Markdown ni asteriscos. Califica al cliente con una pregunta a la vez (necesidad, plazo, presupuesto) y propón agendar una visita, reunión o llamada.' +
      ' Si preguntan por Hapee: es una plataforma de agentes de IA, CRM y automatización. Planes: Starter USD 297/mes, Pro USD 397/mes, Elite Setup USD 3.290 pago único de implementación.' +
      ' No hay prueba gratis ni devolución de pagos; para conocerlo se agenda una demo en hapee.ai/agenda-tu-demo. Nunca menciones otros proveedores de software.';
  }
  function add(text, who) {
    var m = d.createElement('div'); m.className = 'msg ' + who;
    // el modelo a veces responde con **negritas** de Markdown: se muestran como negrita, sin asteriscos
    var safe = text.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
    m.innerHTML = safe.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\s)[*_](\S[^*_]*?)[*_](?=\s|$|[.,!?])/g, '$1$2').replace(/^#+\s*/gm, '').replace(/\n/g, '<br>');
    body.appendChild(m); body.scrollTop = body.scrollHeight; return m;
  }
  function typing(on) {
    var t = $('.msg.typing', body);
    if (on && !t) { t = d.createElement('div'); t.className = 'msg bot typing'; t.innerHTML = '<i></i><i></i><i></i>'; body.appendChild(t); body.scrollTop = body.scrollHeight; }
    if (!on && t) t.remove();
    status.textContent = on ? 'escribiendo…' : 'en línea';
  }
  function setSugg(list) {
    sugg.innerHTML = '';
    list.forEach(function (s) { var b = d.createElement('button'); b.type = 'button'; b.textContent = s; b.addEventListener('click', function () { send(s); }); sugg.appendChild(b); });
  }
  function reset(ind, firstMsg) {
    cur = ind; history = []; body.innerHTML = '';
    $('#phName').textContent = custom ? 'Tu negocio' : IND[ind].name;
    $$('.chips .chip').forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.ind === ind && !custom ? 'true' : 'false'); });
    if (firstMsg) { setSugg([]); send(firstMsg); return; }
    add(IND[ind].hello, 'bot'); history.push({ role: 'assistant', content: IND[ind].hello });
    setSugg(IND[ind].sugg);
  }
  async function speak(text) {
    if (!voiceOn) return;
    try {
      if (audio) audio.pause();
      var r = await fetch('/api/tts/' + VOICE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text, model_id: 'eleven_turbo_v2_5', voice_settings: { stability: .5, similarity_boost: .75, style: .3, use_speaker_boost: true }, optimize_streaming_latency: 4 }) });
      if (!r.ok) return;
      audio = new Audio(URL.createObjectURL(await r.blob())); audio.play();
    } catch (e) { /* sin voz la demo sigue en texto */ }
  }
  async function send(text) {
    text = (text || '').trim(); if (!text || busy) return;
    busy = true; add(text, 'me'); setSugg([]); input.value = '';
    // la API exige que el primer mensaje sea del usuario
    var msgs = history.filter(function (m, i) { return !(i === 0 && m.role === 'assistant'); }).concat([{ role: 'user', content: text }]);
    history.push({ role: 'user', content: text });
    typing(true);
    var reply;
    try {
      var r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 300, system: systemPrompt(), messages: msgs.slice(-10) }) });
      if (!r.ok) throw new Error(r.status);
      var data = await r.json(); reply = data.content[0].text;
    } catch (e) {
      reply = 'Ahora mismo no puedo responder (la demo necesita el servidor de hapee.ai). Agenda una demo y te lo mostramos en vivo.';
    }
    typing(false); add(reply, 'bot'); history.push({ role: 'assistant', content: reply }); speak(reply);
    busy = false;
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
  $$('.chips .chip').forEach(function (c) { c.addEventListener('click', function () { custom = null; reset(c.dataset.ind); }); });
  $('#voiceBtn').addEventListener('click', function () { voiceOn = !voiceOn; this.setAttribute('aria-pressed', voiceOn ? 'true' : 'false'); if (!voiceOn && audio) audio.pause(); });
  reset('inmobiliaria');

  // El hero alimenta la demo
  $('#heroPrompt').addEventListener('submit', function (e) {
    e.preventDefault();
    var v = hi.value.trim() || hi.placeholder.replace(/…$/, '');
    custom = v;
    // el visitante describe SU negocio; el agente atiende como ese negocio y el visitante hace de cliente
    var go = function () { reset(cur, 'Hola 👋, quiero información'); };
    if (window.__lenis) window.__lenis.scrollTo('#demo', { offset: -40, duration: 1.4, onComplete: go });
    else { $('#demo').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); setTimeout(go, reduce ? 0 : 700); }
  });

  /* ═════════ ESFERA DE INTEGRACIONES ═════════ */
  (function () {
    var sp = $('#sphere'); if (!sp) return;
    var items = $$('#sphere > img'), n = items.length, pts = [];
    for (var i = 0; i < n; i++) {           // distribución de Fibonacci
      var y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    var ax = .3, ay = 0, vx = 0, vy = reduce ? 0 : .004, drag = false, px = 0, py = 0, visible = false;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(sp);
    sp.addEventListener('pointerdown', function (e) { drag = true; px = e.clientX; py = e.clientY; sp.setPointerCapture(e.pointerId); });
    sp.addEventListener('pointermove', function (e) { if (!drag) return; vy = (e.clientX - px) * .0009; vx = (e.clientY - py) * -.0009; px = e.clientX; py = e.clientY; });
    sp.addEventListener('pointerup', function () { drag = false; });
    function frame() {
      if (visible) {
        ay += vy; ax += vx;
        if (!drag) { vy += ((reduce ? 0 : .004) - vy) * .02; vx *= .95; }
        var R = sp.clientWidth * .42, ca = Math.cos(ax), sa = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay);
        for (var k = 0; k < n; k++) {
          var p = pts[k], x = p[0] * cb + p[2] * sb, z = -p[0] * sb + p[2] * cb, y2 = p[1] * ca - z * sa, z2 = p[1] * sa + z * ca;
          var s = (z2 + 2) / 3;
          items[k].style.transform = 'translate3d(' + (x * R) + 'px,' + (y2 * R) + 'px,0) scale(' + s.toFixed(3) + ')';
          items[k].style.opacity = (.35 + (z2 + 1) * .325).toFixed(3);
          items[k].style.zIndex = Math.round((z2 + 1) * 50);
        }
      }
      requestAnimationFrame(frame);
    }
    frame();
  })();

  /* ═════════ CALCULADORA ═════════ */
  (function () {
    var f = function (n) { return '$' + Math.round(n).toLocaleString('es-CL'); };
    var ids = ['leads', 'lost', 'rec', 'ticket', 'tools'];
    function calc() {
      var v = {}; ids.forEach(function (k) { var el = $('#r-' + k); v[k] = +el.value; el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%'); });
      $('#o-leads').textContent = v.leads.toLocaleString('es-CL');
      $('#o-lost').textContent = v.lost + '%';
      $('#o-rec').textContent = v.rec + '%';
      $('#o-ticket').textContent = f(v.ticket);
      $('#o-tools').textContent = f(v.tools);
      var sales = v.leads * v.lost / 100 * v.rec / 100, rev = sales * v.ticket, gain = rev + v.tools;
      $('#v-sales').textContent = Math.round(sales).toLocaleString('es-CL');
      $('#v-rev').textContent = f(rev);
      $('#v-save').textContent = f(v.tools);
      var x = gain / 397;
      $('#v-note').innerHTML = x >= 1 ? 'Con el plan Pro (USD 397/mes), el retorno estimado es <b>' + (x >= 10 ? Math.round(x) : x.toFixed(1)) + '×</b>.' : 'Con estos valores el plan Starter es el punto de partida más razonable.';
    }
    ids.forEach(function (k) { $('#r-' + k).addEventListener('input', calc); });
    calc();
  })();

  /* ═════════ PRECIOS mensual / anual ═════════ */
  $$('.bill button').forEach(function (b) {
    b.addEventListener('click', function () {
      var y = b.dataset.bill === 'y';
      $$('.bill button').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      $$('.price [data-m]').forEach(function (el) { el.textContent = y ? el.dataset.y : el.dataset.m; });
    });
  });

  /* ═════════ NEBULOSA FINAL ═════════ */
  (function () {
    var cv = $('#nebula'); if (!cv || reduce) return;
    var ctx = cv.getContext('2d'), W, H, P = [], mx = -999, my = -999, on = false, dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener('resize', size);
    var N = window.innerWidth < 760 ? 70 : 140;
    for (var i = 0; i < N; i++) P.push({ a: Math.random() * Math.PI * 2, r: 80 + Math.random() * Math.max(W, H) * .55, s: (.0006 + Math.random() * .0016) * (Math.random() < .5 ? -1 : 1), z: .8 + Math.random() * 2.2, c: Math.random() < .55 ? '250,80,0' : '205,35,73', ox: 0, oy: 0 });
    cv.parentElement.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    cv.parentElement.addEventListener('pointerleave', function () { mx = my = -999; });
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) draw(); }).observe(cv);
    function draw() {
      if (!on) return;
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H / 2;
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.a += p.s;
        var x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * .55;
        var dx = x - mx, dy = y - my, dd = dx * dx + dy * dy;
        if (dd < 22000) { var f = (22000 - dd) / 22000 * 26; p.ox += dx / Math.sqrt(dd + 1) * f * .08; p.oy += dy / Math.sqrt(dd + 1) * f * .08; }
        p.ox *= .94; p.oy *= .94;
        ctx.beginPath(); ctx.arc(x + p.ox, y + p.oy, p.z, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + p.c + ',' + Math.min(1, .35 + p.z * .25) + ')'; ctx.fill();
      }
      requestAnimationFrame(draw);
    }
  })();

  /* ═════════ PALETA DE COMANDOS (⌘K) ═════════ */
  var P = '/propuesta-2026-r8x4/';
  (function () {
    var box = $('#cmdk'), inp = $('#cmdkInput'), list = $('#cmdkList'), sel = 0, view = [];
    var ITEMS = [
      ['Acciones', 'Agendar una demo', P + 'demo', 'Demo'],
      ['Acciones', 'Hablar con el agente IA', '#demo', 'En vivo'],
      ['Acciones', 'Calcular cuánto estoy perdiendo', '#calculadora', 'ROI'],
      ['Acciones', 'Cambiar tema claro u oscuro', 'theme', 'Tema'],
      ['Secciones', 'Plataforma', '#plataforma'], ['Secciones', 'Así se ve Hapee por dentro', '#plataforma'], ['Secciones', 'Integraciones', '#integraciones'],
      ['Secciones', 'Precios', '#precios'], ['Secciones', 'Seguridad y confianza', '#confianza'], ['Secciones', 'Equipo', '#equipo'], ['Secciones', 'Preguntas frecuentes', '#faq'],
      ['Páginas', 'Plataforma completa', P + 'producto'], ['Páginas', 'Precios', P + 'precios'], ['Páginas', 'Documentación de la API', P + 'docs'], ['Páginas', 'Blog', P + 'blog'], ['Páginas', 'Casos de éxito', P + 'casos'], ['Páginas', 'Academia', P + 'academia'], ['Páginas', 'Partners', P + 'partners'], ['Páginas', 'Por qué Hapee', P + 'por-que-hapee'], ['Páginas', 'Seguridad', P + 'seguridad'], ['Páginas', 'Nosotros', P + 'nosotros'], ['Páginas', 'Todas las páginas', P + 'mapa'],
      ['Páginas', 'Auditoría y plan 2026', '/propuesta-2026-r8x4/']
    ];
    function render() {
      var q = inp.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      view = ITEMS.filter(function (it) { return !q || (it[1] + ' ' + it[0]).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) > -1; });
      sel = Math.min(sel, Math.max(0, view.length - 1));
      var html = '', g = '';
      view.forEach(function (it, i) {
        if (it[0] !== g) { g = it[0]; html += '<li class="cmdk-group" role="presentation">' + g + '</li>'; }
        html += '<li role="option" data-i="' + i + '" aria-selected="' + (i === sel) + '">' + it[1] + (it[3] ? '<small>' + it[3] + '</small>' : '') + '</li>';
      });
      list.innerHTML = html || '<li class="cmdk-group">Sin resultados</li>';
    }
    function run(it) {
      close();
      if (!it) return;
      if (it[2] === 'theme') return $('#themeBtn').click();
      if (it[2].charAt(0) === '#') { if (window.__lenis) window.__lenis.scrollTo(it[2], { offset: -20 }); else $(it[2]).scrollIntoView({ behavior: 'smooth' }); }
      else location.href = it[2];
    }
    var lastFocus;
    function open() { lastFocus = d.activeElement; box.hidden = false; inp.value = ''; sel = 0; render(); inp.focus(); if (window.__lenis) window.__lenis.stop(); }
    function close() { box.hidden = true; if (window.__lenis) window.__lenis.start(); if (lastFocus) lastFocus.focus(); }
    $$('[data-cmdk-open]').forEach(function (b) { b.addEventListener('click', open); });
    d.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.hidden ? open() : close(); }
      else if (!box.hidden) {
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % view.length; render(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + view.length) % view.length; render(); }
        else if (e.key === 'Enter') { e.preventDefault(); run(view[sel]); }
      } else if (e.key === 'Escape') { closeMM(null); if (!sheet.hidden) setSheet(false); }
    });
    inp.addEventListener('input', function () { sel = 0; render(); });
    list.addEventListener('click', function (e) { var li = e.target.closest('[data-i]'); if (li) run(view[+li.dataset.i]); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
  })();

  /* ═════════ MOTION CON GSAP ═════════ */
  function revealAll() { $$('.reveal-up').forEach(function (el) { el.style.opacity = 1; el.style.transform = 'none'; }); }
  function startMotion() {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST || reduce) { revealAll(); stepsFallback(); return; }
    gsap.registerPlugin(ST);

    // Scroll suave
    if (window.Lenis) {
      var lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on('scroll', ST.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      $$('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) { var h = a.getAttribute('href'); if (h.length > 1 && $(h)) { e.preventDefault(); lenis.scrollTo(h, { offset: -20 }); } });
      });
    }

    // Hero: entrada
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero-h .w', { yPercent: 115, duration: 1.1, stagger: .06 })
      .to('.reveal-up', { opacity: 1, y: 0, duration: .9, stagger: .08 }, '-=.75')
      .from('.hero-stage', { opacity: 0, scale: .85, duration: 1.4 }, '-=1.2')
      .from('.float', { opacity: 0, y: 30, stagger: .15, duration: .9 }, '-=.9');
    gsap.to('.hero-stage', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Problema: el caos converge en Hapee
    var tools = $$('.tools span'), W = window.innerWidth, H = window.innerHeight;
    tools.forEach(function (t, i) {
      var a = (i / tools.length) * Math.PI * 2 + Math.random() * .4, r = .32 + Math.random() * .22;
      gsap.set(t, { xPercent: -50, yPercent: -50, x: Math.cos(a) * W * r * (W < 760 ? .9 : 1), y: Math.sin(a) * H * r * .95, rotation: (Math.random() - .5) * 24, opacity: 0 });
    });
    var ct = gsap.timeline({ scrollTrigger: { trigger: '.chaos', start: 'top top', end: 'bottom bottom', scrub: .8 } });
    ct.to(tools, { opacity: 1, stagger: .01, duration: .15 })
      .to('.cf', { opacity: 1, y: 0, stagger: .05, duration: .1 }, 0)
      .to(tools, { x: 0, y: 0, rotation: 0, scale: .2, opacity: 0, ease: 'power3.in', stagger: { each: .008, from: 'random' }, duration: .45 }, .3)
      .to('.chaos-copy', { opacity: 0, scale: .92, duration: .2 }, .45)
      .to('.core', { scale: 1, opacity: 1, ease: 'back.out(1.6)', duration: .25 }, .62)
      .to('.chaos-after', { opacity: 1, duration: .2 }, .78);
    gsap.set('.cf', { opacity: 0, y: 20 });

    // Reveals genéricos
    $$('.sec-head, .ps-frame, .plan, .quote, .tg, .step, .faq-list details, .roi-grid, .phone, .demo-copy > *').forEach(function (el) {
      gsap.from(el, { opacity: 0, y: 40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });

    // Pasos: la línea se dibuja y enciende cada número
    gsap.to('#stepsFill', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 60%', scrub: true } });
    $$('.step').forEach(function (s) { ST.create({ trigger: s, start: 'top 70%', onEnter: function () { s.classList.add('on'); }, onLeaveBack: function () { s.classList.remove('on'); } }); });

    // Equipo y titular final
    gsap.from('.faces img', { opacity: 0, y: 60, stagger: .05, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.faces', start: 'top 80%' } });
    gsap.from('.final-h span', { yPercent: 60, opacity: 0, stagger: .12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.final', start: 'top 65%' } });
    gsap.from('.foot-mega', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 85%' } });

    window.addEventListener('load', function () { ST.refresh(); });
  }
  function stepsFallback() { $$('.step').forEach(function (s) { s.classList.add('on'); }); var f = $('#stepsFill'); if (f) f.style.transform = 'scaleX(1)'; }

  // GSAP va con defer: esperar a que esté (o rendirse y mostrar todo)
  var tries = 0;
  (function wait() {
    if (window.gsap && window.ScrollTrigger) return startMotion();
    if (++tries > 40) { revealAll(); stepsFallback(); return; }
    setTimeout(wait, 50);
  })();
})();

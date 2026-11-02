/* Ahorro por módulo: recalcula con el número de usuarios (mismo cálculo y formato que ahorro.py). */
(function () {
  var el = document.getElementById('ahorro-datos');
  if (!el) return;
  var D = JSON.parse(el.textContent), U = D.u;
  function usd(v) {
    var neg = v < 0; v = Math.abs(Math.round(v * 100) / 100);
    var ent = Math.floor(v), cen = Math.round((v - ent) * 100);
    if (cen === 100) { ent++; cen = 0; }
    var s = String(ent).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (cen) s += ',' + (cen < 10 ? '0' : '') + cen;
    return (neg ? '−' : '') + 'US$' + s;
  }
  function costo(o, u) { return o[0] * (o[1] ? u : 1); }
  function calcula(u) {
    var r = {mods: {}, tools: {}, ref: 0, desde: 0};
    D.m.forEach(function (m) {
      var ref = 0, desde = 0;
      m.nd.forEach(function (ops, i) {
        desde += costo(ops.filter(function (o) { return o[2]; })[0] || ops[0], u);
        ops.forEach(function (o, j) { r.tools[m.n + ':' + i + ':' + j] = costo(o, u); });
      });
      if (m.nd.length) ref = Math.max(desde + (D.mas || 0), (D.min || {})[m.n] || 0);
      r.mods[m.n] = {ref: ref, desde: desde};
      r.ref += ref; r.desde += desde;
    });
    r.neto = r.ref - D.pro; r.anual = r.neto * 12; r.neto_desde = r.desde - D.pro; r.neto_of = r.ref - D.of;
    return r;
  }
  function pinta() {
    var r = calcula(U);
    [].forEach.call(document.querySelectorAll('[data-usuarios]'), function (o) { o.textContent = U; });
    [].forEach.call(document.querySelectorAll('[data-tool]'), function (b) { var v = r.tools[b.getAttribute('data-tool')]; if (v != null) b.textContent = usd(v); });
    [].forEach.call(document.querySelectorAll('[data-mod]'), function (b) { var m = r.mods[b.getAttribute('data-mod')]; if (m) b.textContent = usd(m[b.getAttribute('data-k')]); });
    [].forEach.call(document.querySelectorAll('[data-tot]'), function (b) { var v = r[b.getAttribute('data-tot')]; if (v != null) b.textContent = usd(v); });
    [].forEach.call(document.querySelectorAll('.ah-u-print'), function (p) { p.textContent = 'Cálculo con ' + U + (U === 1 ? ' usuario.' : ' usuarios.'); });
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-u]');
    if (!b) return;
    U = Math.max(1, Math.min(25, U + (+b.getAttribute('data-u'))));
    pinta();
  });
})();

/* Agente IA de Hapee · widget del nuevo home (reemplaza al «Interactúa con Hapee»).
   Misma idea: eliges rubro y canal y conversas como si fueras el cliente. Ahora:
   - Cada rubro trae una cuenta de ejemplo con guiones por canal (WhatsApp, Instagram, Facebook) y las ACCIONES
     que hace el agente (crea el lead en el CRM, agenda, etiqueta, deriva), las mismas que se ven en la maqueta.
   - Respuestas rápidas y horas se pueden tocar; si no tocas nada, el guion sigue solo.
   - Cuando escribes, responde en vivo por /api/chat (el mismo proxy del home) con el contexto del rubro;
     si la API falla, contesta con la base de conocimiento de la cuenta. Tope de mensajes por visita.
   - Emite «hapee:rubro» y «hapee:accion» en document para que la página sincronice la maqueta.
   - Sin dependencias. Robusto: cada corrida tiene su ficha y se cancela al cambiar rubro/canal/reiniciar.
   - prefers-reduced-motion: muestra la conversación completa al instante. */
(function () {
  'use strict';
  var DATA = null;
  try { DATA = JSON.parse(document.getElementById('hx-datos').textContent); } catch (e) { return; }
  var RED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CANAL = { wa: ['WhatsApp', '#25D366'], ig: ['Instagram', 'linear-gradient(45deg,#f09433,#dc2743 55%,#bc1888)'], fb: ['Facebook', '#1877F2'] };
  var IC = {
    agenda: 'M8 2v4M16 2v4M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18',
    crm: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
    tag: 'M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4zM7 7.5h.01',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-10 6L2 7',
    doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6',
    hum: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    ok: 'M20 6 9 17l-5-5',
    zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z'
  };
  IC.stock = IC.doc; IC.despacho = 'M1 3h15v13H1zM16 8h4l3 3v5h-7zM5.5 18.5a2 2 0 1 0 0 .01M18.5 18.5a2 2 0 1 0 0 .01'; IC.cotiza = IC.doc;
  function svg(d, c) { return '<svg class="' + (c || 'hx-i') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>'; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function soloB(s) { return esc(String(s).replace(/<(?!\/?b>)[^>]+>/g, '')).replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>'); }
  function plano(s) { return String(s).replace(/<[^>]+>/g, ''); }
  /* Red de seguridad: el sitio es español neutro con tuteo. Si el modelo se escapa al voseo, se corrige antes de mostrarlo. */
  var A_TUTEO = { 'ten\u00e9s': 'tienes', 'pod\u00e9s': 'puedes', 'quer\u00e9s': 'quieres', 'sab\u00e9s': 'sabes', 'hac\u00e9s': 'haces', 's\u006fs': 'eres', 'v\u006fs': 'tú',
    'necesit\u00e1s': 'necesitas', 'busc\u00e1s': 'buscas', 'prefer\u00eds': 'prefieres', 'ven\u00eds': 'vienes', 'dec\u00eds': 'dices', 'pens\u00e1s': 'piensas',
    'contame': 'cuéntame', 'd\u0065cime': 'dime', 'escribime': 'escríbeme', 'avisame': 'avísame', 'mir\u00e1': 'mira', 'fij\u0061te': 'fíjate',
    'mandame': 'mándame', 'pasame': 'pásame', 'llamame': 'llámame', 'quer\u00edas': 'querías', 'est\u00e1s': 'estás', 'ten\u00edas': 'tenías' };
  function tuteo(s) {
    return String(s).replace(/[A-Za-zÁÉÍÓÚáéíóúñÑ]+/g, function (w) {
      var t = A_TUTEO[w.toLowerCase()]; if (!t || t === w.toLowerCase()) return w;
      return w[0] === w[0].toUpperCase() ? t[0].toUpperCase() + t.slice(1) : t;
    });
  }
  function ini(n) { var p = String(n).split(/[\s._]+/).filter(Boolean); return ((p[0] || '?')[0] + (p[1] ? p[1][0] : (p[0] || '').slice(1, 2))).toUpperCase(); }

  /* ── Voz del agente (02-11-2026, pedido de Sebastián: «la voz de ElevenLabs que tenían los agentes antes es clave»).
     Mismas voces y el mismo proxy del «Interactúa con Hapee» original: /api/tts/<voz> (nginx agrega la llave de ElevenLabs).
     - Habla cuando la persona ya tocó el widget (el navegador bloquea audio sin gesto; además, nadie paga voz por visitas pasivas).
     - Cada respuesta del agente (guion y respuestas en vivo) se dice en voz alta; el guion espera a que termine de hablar.
     - Caché por texto (la misma línea no se cobra dos veces) y tope de caracteres por visita; si ElevenLabs falla o se pasa el
       tope, cae a la voz del navegador para que la demo nunca quede muda.
     - Botón de voz (activar/silenciar) y voz femenina/masculina; se recuerdan en este navegador. */
  /* Días y horas para LEER y para ESCUCHAR: «Mar · 09:00» se ve «Martes · 09:00» y se dice «martes a las 9».
     (02-11-2026: la voz leía «mar, cero nueve cero cero»; regla: nunca días abreviados, ni en pantalla ni en voz.) */
  var DIAS = { lun: 'lunes', mar: 'martes', mie: 'miércoles', 'mié': 'miércoles', mier: 'miércoles', 'miér': 'miércoles', jue: 'jueves', vie: 'viernes', sab: 'sábado', 'sáb': 'sábado', dom: 'domingo' };
  var RE_DIA = '(Lun|Mar|Mi[eé]r?|Jue|Vie|S[aá]b|Dom)\\.?';
  var RE_DIA_V = '(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|Lun|Mar|Mi[eé]r?|Jue|Vie|S[aá]b|Dom)\\.?';
  function diaLargo(a) {
    var d = DIAS[String(a).toLowerCase().replace(/\.$/, '')]; if (!d) return a;
    return a[0] === a[0].toUpperCase() ? d[0].toUpperCase() + d.slice(1) : d;
  }
  function diasCompletos(t) { return String(t).replace(new RegExp('\\b' + RE_DIA + '(?=\\s*(?:·|,|-)?\\s*\\d)', 'gi'), function (x, d) { return diaLargo(d); }); }
  function horaVoz(h, m) {
    h = parseInt(h, 10); m = parseInt(m, 10);
    return String(h) + (m === 30 ? ' y media' : m === 15 ? ' y cuarto' : m ? ' y ' + m : '');
  }
  function laLas(h) { return parseInt(h, 10) === 1 ? 'la' : 'las'; }
  function paraVoz(t) {
    var HRS = '(?:\\s*(?:hrs?\\.?|horas))?';
    return String(t)
      .replace(new RegExp('(\\d{1,2}):(\\d{2})\\s*(?:a|al|-|–)\\s*(\\d{1,2}):(\\d{2})' + HRS, 'g'), function (x, h1, m1, h2, m2) { return 'de ' + laLas(h1) + ' ' + horaVoz(h1, m1) + ' a ' + laLas(h2) + ' ' + horaVoz(h2, m2); })
      .replace(new RegExp('\\b' + RE_DIA_V + '\\s*(?:·|,|-)?\\s*(\\d{1,2}):(\\d{2})' + HRS, 'gi'), function (x, d, h, m) { return diaLargo(d) + ' a ' + laLas(h) + ' ' + horaVoz(h, m); })
      .replace(new RegExp('\\b' + RE_DIA_V + '\\s+(?=\\d)', 'gi'), function (x, d) { return diaLargo(d) + ' '; })
      .replace(new RegExp('\\b(la|las)\\s+(\\d{1,2}):(\\d{2})' + HRS, 'gi'), function (x, p, h, m) { return p + ' ' + horaVoz(h, m); })
      .replace(/\b(\d{1,2}):(\d{2})\s*(?:hrs?\.?|horas)/g, function (x, h, m) { return horaVoz(h, m) + ' horas'; })
      .replace(/\b(\d{1,2}):(\d{2})\b/g, function (x, h, m) { return horaVoz(h, m); })
      .replace(/\b24\s*\/\s*7\b/g, '24 horas, los 7 días')
      .replace(/\b1\s*(?:a|:)\s*1\b/g, 'uno a uno')
      .replace(/(\d)\s*%/g, '$1 por ciento')
      .replace(/\bN[°º]\s*/gi, 'número ')
      .replace(/\bhrs?\.?(?=\s|$|[,;])/gi, 'horas')
      .replace(/\baprox\./gi, 'aproximadamente')
      .replace(/\bDra\./g, 'doctora').replace(/\bDr\./g, 'doctor')
      .replace(/\s*[·|→]\s*/g, ', ');
  }

  var VZ = (function () {
    var ID = { f: 'lLsDvdl6OjtZfLJPM2HA', m: '0cheeVA5B3Cv6DGq65cT' };
    function lee(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
    function guarda(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    var V = { on: lee('hx-voz', '1') === '1', g: lee('hx-voz-g', 'f') === 'm' ? 'm' : 'f', listo: false, gasto: 0, MAX: 6000, cache: {}, au: null, fin: null, subs: [],
      cola: Promise.resolve(), gen: 0 };
    function avisa() { V.subs.forEach(function (f) { try { f(); } catch (e) {} }); }
    V.limpia = function (t) {
      return paraVoz(String(t || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\*\*/g, '')
        .replace(/[☀-➿️]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDC00-\uDFFF]/g, '').replace(/\s+/g, ' ').trim()).replace(/\s+/g, ' ').trim();
    };
    V.activa = function (on) { V.on = !!on; guarda('hx-voz', V.on ? '1' : '0'); if (!V.on) V.calla(); avisa(); };
    V.genero = function (g) { V.g = g === 'm' ? 'm' : 'f'; guarda('hx-voz-g', V.g); V.calla(); avisa(); };
    V.desbloquea = function () {
      if (V.listo) return; V.listo = true;
      try { var a = new Audio(); a.muted = true; var p = a.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
      try { if (window.speechSynthesis) speechSynthesis.getVoices(); } catch (e) {}
      avisa();
    };
    V.calla = function () {
      V.gen++;
      if (V.au) { try { V.au.pause(); } catch (e) {} V.au = null; }
      try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
      var f = V.fin; V.fin = null; if (f) f();
    };
    V.trae = function (texto) {
      var t = V.limpia(texto); if (!t) return Promise.resolve(null);
      var k = V.g + '|' + t; if (V.cache[k]) return V.cache[k];
      if (V.gasto + t.length > V.MAX) return Promise.resolve(null);
      V.gasto += t.length;
      var p = fetch((DATA.tts || '/api/tts/') + ID[V.g], { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, model_id: 'eleven_turbo_v2_5', voice_settings: { stability: .5, similarity_boost: .75, style: .3, use_speaker_boost: true }, optimize_streaming_latency: 4 }) })
        .then(function (r) { if (!r.ok) throw new Error('tts ' + r.status); return r.blob(); })
        .then(function (b) { if (!b || b.size < 256) throw new Error('tts vacío'); return URL.createObjectURL(b); })
        .catch(function () { delete V.cache[k]; return null; });
      V.cache[k] = p; return p;
    };
    function nativa(t, fin) {
      try {
        var s = window.speechSynthesis; if (!s || !window.SpeechSynthesisUtterance) return fin();
        s.cancel();
        var u = new SpeechSynthesisUtterance(t); u.lang = 'es-ES'; u.rate = 1.02; u.pitch = V.g === 'm' ? .9 : 1.08;
        var vs = (s.getVoices() || []).filter(function (v) { return /^es(-|_|$)/i.test(v.lang) || /espa|spanish/i.test(v.name); });
        if (vs.length) { var re = V.g === 'm' ? /jorge|diego|carlos|juan|male|hombre/i : /m[óo]nica|paulina|helena|laura|marisol|female|mujer/i; u.voice = vs.filter(function (v) { return re.test(v.name); })[0] || vs[0]; }
        u.onend = fin; u.onerror = fin; s.speak(u);
      } catch (e) { fin(); }
    }
    /* devuelve una promesa que se cumple cuando termina de hablar (o al tiro si la voz está apagada o aún no hubo gesto).
       Las frases van EN COLA (una no corta a la otra); V.calla() interrumpe y descarta lo que esperaba. */
    V.habla = function (texto, alEmpezar) {
      if (!V.on || !V.listo) return Promise.resolve();
      var t = V.limpia(texto); if (!t) return Promise.resolve();
      var g = V.gen;
      V.trae(t);
      var p = V.cola.then(function () { if (g !== V.gen || !V.on) return; return decir(t, alEmpezar); });
      V.cola = p.catch(function () {});
      return p;
    };
    function decir(t, alEmpezar) {
      return new Promise(function (ok) {
        var hecho = false, tope = setTimeout(fin, 9000 + t.length * 95);
        function fin() { if (hecho) return; hecho = true; clearTimeout(tope); if (V.fin === fin) V.fin = null; ok(); }
        V.fin = fin;
        V.trae(t).then(function (url) {
          if (hecho) return;
          if (alEmpezar) alEmpezar();
          if (!url) return nativa(t, fin);
          var a = new Audio(url); V.au = a;
          a.onended = fin; a.onerror = function () { if (V.au === a) V.au = null; nativa(t, fin); };
          var p = a.play(); if (p && p.catch) p.catch(function () { fin(); });
        });
      });
    };
    return V;
  })();
  var IC_VOZ = 'M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14';
  var IC_MUDO = 'M11 5 6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6';
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function Widget(raiz) {
    var S = { rub: raiz.getAttribute('data-rubro') || DATA.orden[0], ch: null, run: 0, tocado: false, libre: false, enviados: 0, hist: [], acc: 0, visible: false, pend: null };
    var LIM = 8;
    raiz.innerHTML =
      '<div class="hx-rub" role="tablist" aria-label="Elige tu rubro"></div>' +
      '<div class="hx-cuerpo"><div class="hx-tel">' +
        '<div class="hx-ch" role="tablist" aria-label="Canal"></div>' +
        '<div class="hx-cab"><span class="hx-av" aria-hidden="true"></span><span class="hx-id"><b class="hx-marca"></b><small class="hx-est">en línea</small></span>' +
        '<span class="hx-vg" role="group" aria-label="Voz del agente"><button type="button" data-g="f" aria-label="Voz femenina">♀</button><button type="button" data-g="m" aria-label="Voz masculina">♂</button></span>' +
        '<button type="button" class="hx-vz" aria-pressed="true"></button>' +
        '<button type="button" class="hx-re" aria-label="Reiniciar la conversación">' + svg('M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5') + '</button></div>' +
        '<div class="hx-pvf"><button type="button" class="hx-pv">' + svg(IC_VOZ) + '<b>Prueba la voz</b><span>toca y el agente te habla</span></button></div>' +
        '<div class="hx-log" role="log" aria-live="polite" aria-relevant="additions"></div>' +
        '<div class="hx-sug" aria-label="Respuestas sugeridas"></div>' +
        '<form class="hx-in" autocomplete="off"><label class="hx-sr" for="' + raiz.id + '-t">Escríbele al agente</label>' +
        '<input id="' + raiz.id + '-t" type="text" maxlength="280" placeholder="Escríbele como si fueras cliente…" enterkeyhint="send">' +
        (SR ? '<button type="button" class="hx-mic" aria-label="Dictar tu mensaje con la voz">' + svg('M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8') + '</button>' : '') +
        '<button type="submit" aria-label="Enviar">' + svg('M22 2 11 13M22 2l-7 20-4-9-9-4z') + '</button></form>' +
      '</div><aside class="hx-acts" aria-label="Lo que hizo el agente"><p class="hx-k">Lo que hizo el agente</p><ol></ol>' +
        '<p class="hx-crm">Todo queda en el CRM de Hapee, con su canal de origen.</p></aside></div>' +
      '<p class="hx-nota">Cuenta de ejemplo. Toca el chat y el agente te habla con voz real; escribe o dicta tu pregunta y responde la IA con el contexto del rubro.</p>';
    var $ = function (s) { return raiz.querySelector(s); };
    var rubBox = $('.hx-rub'), chBox = $('.hx-ch'), log = $('.hx-log'), sug = $('.hx-sug'), form = $('.hx-in'), inp = form.querySelector('input'),
      acts = $('.hx-acts ol'), est = $('.hx-est'), marca = $('.hx-marca'), av = $('.hx-av'), bVoz = $('.hx-vz'), gVoz = $('.hx-vg');

    /* voz: botón, género y «hablando…» en el estado */
    function pintaVoz() {
      bVoz.setAttribute('aria-pressed', VZ.on ? 'true' : 'false');
      bVoz.setAttribute('aria-label', VZ.on ? 'Silenciar la voz del agente' : 'Activar la voz del agente');
      bVoz.innerHTML = svg(VZ.on ? IC_VOZ : IC_MUDO);
      [].forEach.call(gVoz.children, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-g') === VZ.g ? 'true' : 'false'); });
      raiz.classList.toggle('hx-mudo', !VZ.on);
      raiz.classList.toggle('hx-pv-off', VZ.listo);
    }
    /* «Prueba la voz»: activa la voz y dice en voz alta el último mensaje del agente (o un saludo si aún no hay) */
    var tPv = 0;
    function pruebaVoz() {
      tPv = Date.now();
      VZ.desbloquea(); if (!VZ.on) VZ.activa(true); S.tocado = true;
      var ags = log.querySelectorAll('.hx-m.ag:not(.hx-typ)'), ult = ags[ags.length - 1];
      habla(ult ? ult.textContent : 'Hola, soy el agente de inteligencia artificial de ' + DATA.rubros[S.rub].marca + '. Escríbeme o dicta tu pregunta.');
    }
    $('.hx-pv').addEventListener('click', function () { if (Date.now() - tPv > 800) pruebaVoz(); });
    VZ.subs.push(pintaVoz); pintaVoz();
    bVoz.addEventListener('click', function () { VZ.desbloquea(); VZ.activa(!VZ.on); });
    gVoz.addEventListener('click', function (e) { var b = e.target.closest('[data-g]'); if (!b) return; VZ.desbloquea(); VZ.genero(b.getAttribute('data-g')); if (!VZ.on) VZ.activa(true); });
    function habla(texto, tk) {
      if (!VZ.on || !VZ.listo || (tk != null && tk !== S.run)) return Promise.resolve();
      return VZ.habla(texto, function () { raiz.classList.add('hx-habla'); est.textContent = 'hablando…'; })
        .then(function () { raiz.classList.remove('hx-habla'); if (!log.querySelector('.hx-typ')) est.textContent = S.estado || 'en línea'; });
    }
    function anticipa(texto) { if (VZ.on && VZ.listo) VZ.trae(texto); }

    DATA.orden.forEach(function (r) {
      var R = DATA.rubros[r];
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.className = 'hx-chip'; b.setAttribute('data-r', r);
      b.innerHTML = '<span aria-hidden="true">' + R.emoji + '</span>' + esc(R.chip);
      rubBox.appendChild(b);
    });

    function sleep(ms, tk) { return new Promise(function (ok, no) { setTimeout(function () { tk === S.run ? ok() : no('x'); }, RED ? 0 : ms); }); }
    function abajo() { log.scrollTop = log.scrollHeight; }
    function burbuja(cls, html) {
      var d = document.createElement('div'); d.className = 'hx-m ' + cls; d.innerHTML = html; log.appendChild(d); abajo(); return d;
    }
    function nota(icono, html) { return burbuja('hx-nt', svg(IC[icono] || IC.zap) + '<span>' + html + '</span>'); }
    function escribiendo(on) {
      var t = log.querySelector('.hx-typ');
      if (on && !t) { t = document.createElement('div'); t.className = 'hx-m ag hx-typ'; t.setAttribute('aria-label', 'escribiendo'); t.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(t); abajo(); }
      if (!on && t) t.remove();
      est.textContent = on ? 'escribiendo…' : (S.estado || 'en línea');
    }
    function accion(tipo, t, d) {
      S.acc++;
      var li = document.createElement('li'); li.className = 'hx-a hx-a--' + tipo;
      li.innerHTML = svg(IC[tipo] || IC.zap) + '<span><b>' + esc(t) + '</b><small>' + esc(d || '') + '</small></span>';
      acts.appendChild(li);
      if (acts.children.length > 6) acts.removeChild(acts.firstChild);
      document.dispatchEvent(new CustomEvent('hapee:accion', { detail: { tipo: tipo, t: t, d: d, rubro: S.rub, canal: S.ch } }));
    }
    function limpiaSug() { sug.innerHTML = ''; }
    function opciones(lista, def, tk, clase) {
      /* botones tocables; espera la elección (o elige sola si nadie tocó el widget) */
      return new Promise(function (ok, no) {
        limpiaSug();
        var hecho = false, auto = null;
        lista.forEach(function (o, i) {
          var b = document.createElement('button'); b.type = 'button'; b.className = 'hx-op ' + (clase || ''); b.textContent = o;
          b.addEventListener('click', function () { fin(i); });
          sug.appendChild(b);
        });
        function fin(i) { if (hecho) return; hecho = true; clearTimeout(auto); limpiaSug(); if (tk !== S.run) return no('x'); ok(i); }
        function programa() {
          clearTimeout(auto);
          /* si ya interactuaste, te da más tiempo para elegir; si no, el guion sigue solo */
          auto = setTimeout(function () {
            if (tk !== S.run) { hecho = true; return no('x'); }
            var b = sug.children[def]; if (b) b.classList.add('hx-auto');
            setTimeout(function () { fin(def); }, RED ? 0 : 650);
          }, RED ? 0 : (S.tocado ? 9000 : 2600));
        }
        S.pend = programa; programa();
      });
    }

    /* Si la persona elige una hora distinta de la sugerida, la confirmación y las acciones que siguen dicen ESA hora
       (antes confirmaba siempre la hora por defecto: «elegí martes 09:30» → «listo: martes a las 17:00»). */
    function partes(s) {
      var m = String(s).match(/^\s*(?:(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|Lun|Mar|Mi[eé]r?|Jue|Vie|S[aá]b|Dom)\.?\s*(?:·|,)?\s*)?(\d{1,2}:\d{2})(?:\s*a\s*(\d{1,2}:\d{2}))?/i);
      return m ? { d: m[1] ? diaLargo(m[1]).toLowerCase() : '', t1: m[2], t2: m[3] || '' } : null;
    }
    function ajusta(txt) {
      var a = S.cambio.a, b = S.cambio.b, out = String(txt);
      if (a.d && b.d && a.d !== b.d) out = out.replace(new RegExp(a.d + '(?=\\s+(?:a las\\s+|a la\\s+)?' + a.t1 + ')', 'gi'), function (x) { return x[0] === x[0].toUpperCase() ? b.d[0].toUpperCase() + b.d.slice(1) : b.d; });
      return out.replace(/\d{1,2}:\d{2}/g, function (t) { return t === a.t1 ? b.t1 : (a.t2 && t === a.t2 && b.t2 ? b.t2 : t); });
    }
    function ajustaP(x) {
      if (!S.cambio) return x;
      if (typeof x === 'string') return ajusta(x);
      if (Array.isArray(x)) return x.map(ajustaP);
      if (x && typeof x === 'object') { var o = {}; for (var q in x) o[q] = ajustaP(x[q]); return o; }
      return x;
    }

    async function guion(tk) {
      var R = DATA.rubros[S.rub], C = R.canales.filter(function (c) { return c.c === S.ch; })[0] || R.canales[0];
      S.estado = 'en línea'; S.cambio = null;
      for (var i = 0; i < C.pasos.length; i++) {
        var p = ajustaP(C.pasos[i]), k = p[0];
        if (tk !== S.run) return;
        if (k === 'sis') burbuja('hx-dia', esc(p[1]));
        else if (k === 'c') { await sleep(500, tk); burbuja('cl', soloB(p[1])); await sleep(500 + Math.min(1200, plano(p[1]).length * 12), tk); }
        else if (k === 'a') { anticipa(p[1]); escribiendo(true); await sleep(650 + Math.min(1400, plano(p[1]).length * 14), tk); escribiendo(false); burbuja('ag', soloB(p[1])); await habla(p[1], tk); await sleep(450, tk); }
        else if (k === 'est') { S.estado = p[1] + '…'; est.textContent = S.estado; }
        else if (k === 'acc') { nota(p[1], '<b>' + esc(p[2]) + '</b> · ' + esc(p[3]) + ' <em>Agente IA</em>'); accion(p[1], p[2], p[3]); await sleep(550, tk); }
        else if (k === 'qr') { var j = await opciones(p[1], p[2], tk); burbuja('cl', esc(p[1][j])); await sleep(500, tk); }
        else if (k === 'slots') {
          var hs = p[2].map(diasCompletos);
          var dSl = p[1].replace(/[?:.]\s*$/, '') + (/\?\s*$/.test(p[1]) ? '? Tengo ' : ': ') + hs.join(', ').replace(/, ([^,]*)$/, ' o $1') + '.'; anticipa(dSl);
          escribiendo(true); await sleep(700, tk); escribiendo(false);
          burbuja('ag', '<b>' + esc(p[1]) + '</b><span class="hx-sl">' + hs.map(esc).join(' · ') + '</span>');
          await habla(dSl, tk); if (tk !== S.run) return;
          var j2 = await opciones(hs, p[3], tk, 'hx-op--h');
          if (j2 !== p[3]) { var pa = partes(p[2][p[3]]), pb = partes(p[2][j2]); S.cambio = pa && pb ? { a: pa, b: pb } : null; }
          burbuja('cl', esc(j2 === p[3] && p[4] ? p[4] : hs[j2].replace(/\s*·\s*/, ' '))); await sleep(500, tk);
        }
        else if (k === 'ctx') {
          var d = p[1], q = { historia: 'Respondió a una historia', anuncio: 'Llegó desde un anuncio', post: 'Comentó una publicación', comentario: 'Comentó un video' }[d.k] || 'Origen';
          nota('zap', '<b>' + q + '</b>' + (d.t ? ' · «' + esc(d.t) + '»' : ''));
          if (d.txt) { await sleep(500, tk); burbuja('cl', esc(d.txt)); }
          await sleep(400, tk);
        }
        else if (k === 'card') {
          var cd = p[1]; anticipa(cd.t);
          escribiendo(true); await sleep(700, tk); escribiendo(false);
          burbuja('ag hx-card', '<b>' + esc(cd.t || '') + '</b><small>' + esc(cd.s || '') + '</small>' + (cd.l ? '<span class="hx-tg">' + cd.l.map(function (x) { return '<i>' + esc(x) + '</i>'; }).join('') + '</span>' : '') + (cd.b ? '<span class="hx-cb">' + esc(cd.b) + '</span>' : ''));
          await habla(cd.t, tk);
          await sleep(500, tk);
        }
        else if (k === 'voz') { await sleep(500, tk); burbuja('cl hx-voz', '<span class="hx-pl" aria-hidden="true"></span><span class="hx-wv" aria-hidden="true"></span><small>' + esc(p[1]) + '</small><em>«' + esc(p[2]) + '»</em>'); await sleep(900, tk); }
        else if (k === 'hum') { nota('hum', '<b>Derivó a ' + esc(p[1]) + '</b> · ' + esc(p[2])); accion('hum', 'Derivó a ' + p[1], p[2]); await sleep(500, tk); }
        else if (k === 'pub') { burbuja('ag', '<b>Respuesta pública:</b> ' + soloB(p[1])); await habla(p[1], tk); await sleep(500, tk); }
      }
      if (tk === S.run) libre();
    }

    function libre() {
      S.libre = true; limpiaSug();
      var R = DATA.rubros[S.rub];
      R.preguntas.slice(0, 3).forEach(function (q) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'hx-op hx-op--q'; b.textContent = q;
        b.addEventListener('click', function () { envia(q); });
        sug.appendChild(b);
      });
    }

    function sistema() {
      var R = DATA.rubros[S.rub];
      return DATA.base + '\n\n--- CUENTA DE EJEMPLO ---\nEres el agente de IA de «' + R.marca + '» (cuenta de ejemplo creada para mostrar Hapee). ' + R.contexto +
        '\nPreguntas frecuentes de la cuenta:\n' + R.faq.map(function (f) { return '- ' + f.q + ' ' + f.a; }).join('\n') +
        '\nCanal actual: ' + CANAL[S.ch][0] + '. Si te preguntan qué es esto o por Hapee: es una demo de Hapee y pueden agendar una demo en hapee.ai/agenda-tu-demo.';
    }
    function local(q) {
      var R = DATA.rubros[S.rub], t = q.toLowerCase(), mejor = null, pm = 0;
      R.faq.forEach(function (f) {
        var pal = f.q.toLowerCase().replace(/[¿?]/g, '').split(/\s+/).filter(function (w) { return w.length > 3; });
        var p = pal.filter(function (w) { return t.indexOf(w) > -1; }).length;
        if (p > pm) { pm = p; mejor = f; }
      });
      return mejor ? mejor.a + ' ¿Te ayudo con algo más?' : 'Buena pregunta. Se la dejo al equipo de ' + R.marca + ' y te responden por este mismo chat. ¿Te ayudo con algo más mientras tanto?';
    }
    async function envia(txt) {
      txt = String(txt || '').trim().slice(0, 280);
      if (!txt) return;
      S.tocado = true;
      if (!S.libre) { S.run++; escribiendo(false); limpiaSug(); S.libre = true; }
      var tk = S.run;
      if (S.enviados >= LIM) {
        burbuja('ag', 'Hasta aquí la demo 🙌 Para verlo con <b>tu negocio</b>, agenda una demo 1 a 1.');
        limpiaSug(); var a = document.createElement('a'); a.className = 'hx-op hx-op--cta'; a.href = DATA.agenda; a.textContent = 'Agendar mi demo →'; sug.appendChild(a);
        habla('Hasta aquí la demo. Para verlo con tu negocio, agenda una demo uno a uno.');
        return;
      }
      S.enviados++;
      limpiaSug();
      VZ.calla();
      burbuja('cl', esc(txt));
      if (S.enviados === 1) accion('crm', 'Creó contacto en el CRM', 'origen ' + CANAL[S.ch][0]);
      S.hist.push({ role: 'user', content: txt });
      escribiendo(true);
      var r = '';
      try {
        var ctl = window.AbortController ? new AbortController() : null;
        var to = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
        var res = await fetch(DATA.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl ? ctl.signal : undefined,
          body: JSON.stringify({ model: DATA.modelo, max_tokens: 300, system: sistema(), messages: S.hist.slice(-10) }) });
        clearTimeout(to);
        if (!res.ok) throw new Error('api ' + res.status);
        var j = await res.json();
        r = diasCompletos(tuteo((j && j.content && j.content[0] && j.content[0].text) || ''));
        if (!r) throw new Error('vacía');
      } catch (e) { r = local(txt); }
      if (tk !== S.run) return;
      S.hist.push({ role: 'assistant', content: r });
      escribiendo(false);
      burbuja('ag', esc(r).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'));
      habla(r, tk);
      if (/agend|hora|visita|test drive|evaluaci|reuni/i.test(txt + ' ' + r) && !S.agendo) { S.agendo = true; accion('agenda', 'Ofreció horas para agendar', 'según la agenda del equipo'); }
      if (S.enviados === LIM) { var a2 = document.createElement('a'); a2.className = 'hx-op hx-op--cta'; a2.href = DATA.agenda; a2.textContent = 'Verlo con mi negocio →'; sug.appendChild(a2); }
    }

    function pinta() {
      var R = DATA.rubros[S.rub];
      [].forEach.call(rubBox.children, function (b) { var on = b.getAttribute('data-r') === S.rub; b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
      if (!R.canales.some(function (c) { return c.c === S.ch; })) S.ch = R.canales[0].c;
      chBox.innerHTML = '';
      R.canales.forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.className = 'hx-cn'; b.setAttribute('data-c', c.c);
        b.setAttribute('aria-selected', c.c === S.ch ? 'true' : 'false'); b.tabIndex = c.c === S.ch ? 0 : -1;
        b.innerHTML = '<i style="background:' + CANAL[c.c][1] + '"></i>' + CANAL[c.c][0];
        chBox.appendChild(b);
      });
      raiz.setAttribute('data-canal', S.ch);
      raiz.style.setProperty('--hx-c', R.color);
      marca.textContent = R.cuentas[S.ch] || R.marca;
      av.textContent = ini(R.marca); av.style.background = R.color;
    }
    function arranca() {
      if (VZ.on && VZ.listo) VZ.calla();
      raiz.classList.remove('hx-habla');
      S.run++; S.libre = false; S.hist = []; S.enviados = 0; S.agendo = false; S.estado = 'en línea';
      log.innerHTML = ''; limpiaSug(); acts.innerHTML = ''; escribiendo(false);
      pinta();
      if (!S.visible && !RED) { S.espera = true; return; }
      S.espera = false;
      var tk = S.run;
      guion(tk).catch(function () {});
    }
    function rubro(r, avisar) {
      if (!DATA.rubros[r]) return;
      S.rub = r; S.ch = DATA.rubros[r].canales[0].c;
      arranca();
      if (avisar !== false) document.dispatchEvent(new CustomEvent('hapee:rubro', { detail: { rubro: r, origen: raiz.id } }));
    }

    rubBox.addEventListener('click', function (e) { var b = e.target.closest('[data-r]'); if (b) { S.tocado = true; rubro(b.getAttribute('data-r')); } });
    chBox.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (b && b.getAttribute('data-c') !== S.ch) { S.tocado = true; S.ch = b.getAttribute('data-c'); arranca(); } });
    $('.hx-re').addEventListener('click', function () { arranca(); });
    form.addEventListener('submit', function (e) { e.preventDefault(); VZ.desbloquea(); var v = inp.value; inp.value = ''; envia(v); });
    raiz.addEventListener('pointerdown', function (e) {
      /* el botón «Prueba la voz» se pliega al activarse: su acción va en pointerdown para no perder el clic */
      if (e.target.closest && e.target.closest('.hx-pv') && !raiz.classList.contains('hx-pv-off')) { pruebaVoz(); return; }
      VZ.desbloquea(); if (!S.tocado) { S.tocado = true; }
    });
    raiz.addEventListener('keydown', function () { VZ.desbloquea(); });
    /* dictado (como el «Interactúa con Hapee» original): escucha en es-CL y envía al terminar */
    var bMic = $('.hx-mic');
    if (bMic && SR) {
      var rec = null, oyendo = false, ph = inp.placeholder;
      var corta = function () { oyendo = false; raiz.classList.remove('hx-oye'); bMic.setAttribute('aria-pressed', 'false'); inp.placeholder = ph; };
      bMic.setAttribute('aria-pressed', 'false');
      bMic.addEventListener('click', function () {
        VZ.desbloquea();
        if (oyendo && rec) { try { rec.stop(); } catch (e) {} return; }
        try {
          rec = new SR(); rec.lang = 'es-CL'; rec.continuous = false; rec.interimResults = true;
          rec.onresult = function (e) { var t = ''; for (var i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript; inp.value = t; if (e.results[e.results.length - 1].isFinal) try { rec.stop(); } catch (x) {} };
          rec.onend = function () { corta(); var v = inp.value.trim(); if (v) { inp.value = ''; envia(v); } };
          rec.onerror = function () { corta(); };
          VZ.calla(); rec.start(); oyendo = true; raiz.classList.add('hx-oye'); bMic.setAttribute('aria-pressed', 'true'); inp.placeholder = 'Te escucho…';
        } catch (e) { corta(); }
      });
    }
    [rubBox, chBox].forEach(function (box) {
      box.addEventListener('keydown', function (e) {
        if (['ArrowRight', 'ArrowLeft'].indexOf(e.key) < 0) return;
        var bs = [].slice.call(box.children), i = bs.indexOf(document.activeElement); if (i < 0) return;
        e.preventDefault(); var n = bs[(i + (e.key === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length]; n.focus(); n.click();
      });
    });
    document.addEventListener('hapee:rubro', function (e) { if (e.detail && e.detail.origen !== raiz.id && e.detail.rubro !== S.rub) rubro(e.detail.rubro, false); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { S.visible = en.isIntersecting; if (S.visible && S.espera) arranca(); });
      }, { threshold: 0.25 }).observe(raiz);
    } else S.visible = true;
    rubro(S.rub, false);
    raiz.hapee = { rubro: rubro, envia: envia, estado: S, voz: VZ };
  }
  function todo() { [].forEach.call(document.querySelectorAll('[data-hx]'), function (r, i) { if (!r.id) r.id = 'hx' + i; Widget(r); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', todo); else todo();
})();

/* Homes institucionales: une la maqueta (iframe) con el agente nuevo y los recorridos.
   - Alto del iframe según su contenido (mensajes «hapee-maqueta»).
   - «hapee:rubro» (desde el agente o desde los chips [data-rubro-set]) → cambia la cuenta de ejemplo del iframe
     conservando la pestaña abierta.
   - [data-paso] (botones del recorrido) → abre esa pestaña. «hapee:accion» del agente → abre la pestaña de la acción
     si la maqueta está a la vista y nadie la tocó hace poco.
   - [data-capnav] → marca el capítulo visible (opción «Capítulos»). */
(function () {
  'use strict';
  var fr = document.querySelector('iframe[data-hmi]');
  var cfg = {};
  try { cfg = JSON.parse(document.getElementById('hmi-datos').textContent); } catch (e) {}
  var vista = 'inicio', rub = fr ? fr.getAttribute('data-rubro') : null, tocada = 0, visible = false;
  function manda(v) { if (fr && fr.contentWindow) fr.contentWindow.postMessage({ type: 'hapee-vista', v: v }, location.origin); }
  /* Tema: la maqueta sigue el modo oscuro del sitio (html.dark). El botón de luna de la maqueta cambia solo la maqueta;
     si después cambia el tema del sitio, la maqueta vuelve a seguirlo. */
  function temaSitio() { return document.documentElement.classList.contains('dark') ? 'oscuro' : 'claro'; }
  var ultimoTema = null;
  function mandaTema(forzar) {
    var t = temaSitio(); if (!forzar && t === ultimoTema) return; ultimoTema = t;
    if (fr && fr.contentWindow) fr.contentWindow.postMessage({ hapeeMockupTema: t }, location.origin);
  }
  if (fr) {
    fr.addEventListener('load', function () { mandaTema(true); });
    if (window.MutationObserver) new MutationObserver(function () { mandaTema(false); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
  window.addEventListener('message', function (e) {
    if (!fr || e.origin !== location.origin || e.source !== fr.contentWindow) return;
    var d = e.data || {};
    if (d.type === 'hapee-maqueta' && d.h > 100) { if (!fr.classList.contains('ok')) mandaTema(true); fr.style.height = d.h + 'px'; fr.classList.add('ok'); }
    if (d.hapeeMockupTemaCambio) document.documentElement.setAttribute('data-maqueta-tema', d.hapeeMockupTemaCambio);
    if (d.type === 'hapee-maqueta-vista') { vista = d.v; marcaPasos(d.v); }
    if (d.type === 'hapee-maqueta-toque') tocada = Date.now();
  });
  function marcaPasos(v) {
    [].forEach.call(document.querySelectorAll('button[data-paso]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-paso') === v ? 'true' : 'false'); });
  }
  function etiquetas(r) {
    var R = cfg.rubros && cfg.rubros[r]; if (!R) return;
    [].forEach.call(document.querySelectorAll('[data-rubro-marca]'), function (el) { el.textContent = R.marca; });
    [].forEach.call(document.querySelectorAll('[data-rubro-chip]'), function (el) { el.textContent = R.chip; });
    [].forEach.call(document.querySelectorAll('[data-rubro-set]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-rubro-set') === r ? 'true' : 'false'); });
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    [].forEach.call(document.querySelectorAll('[data-dolores] ol'), function (ol) {
      if (R.dolores) ol.innerHTML = R.dolores.map(function (d) { return '<li><b>' + esc(d[0]) + '</b><span>Con Hapee: ' + esc(d[1]) + '</span></li>'; }).join('');
    });
    var act = document.querySelector('.hn-rub [data-rubro-set="' + r + '"]');
    if (act && act.scrollIntoView && act.parentNode.scrollWidth > act.parentNode.clientWidth) {
      var p = act.parentNode; p.scrollTo({ left: act.offsetLeft - (p.clientWidth - act.offsetWidth) / 2, behavior: 'smooth' });
    }
  }
  function cambia(r) {
    etiquetas(r);
    if (!fr || !cfg.rubros || !cfg.rubros[r] || r === rub) return;
    rub = r; fr.classList.remove('ok');
    fr.src = cfg.rubros[r].url + '?tema=' + temaSitio() + '#v=' + vista;
    fr.setAttribute('data-rubro', r);
  }
  document.addEventListener('hapee:rubro', function (e) { if (e.detail) cambia(e.detail.rubro); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-rubro-set]');
    if (b) { document.dispatchEvent(new CustomEvent('hapee:rubro', { detail: { rubro: b.getAttribute('data-rubro-set'), origen: 'chips' } })); return; }
    var p = e.target.closest && e.target.closest('button[data-paso]');
    if (p) { vista = p.getAttribute('data-paso'); manda(vista); marcaPasos(vista); tocada = Date.now(); }
  });
  if (fr && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (en) { visible = en.intersectionRatio > 0.3; }); }, { threshold: [0, 0.3, 0.6] }).observe(fr);
  }
  var MAPA = { crm: 'negocios', agenda: 'calendario', tag: 'conversaciones', hum: 'conversaciones', mail: 'email', cotiza: 'negocios', despacho: 'negocios', stock: 'negocios', doc: 'conversaciones' };
  document.addEventListener('hapee:accion', function (e) {
    if (!fr || fr.getAttribute('data-sync') !== 'on' || !visible || Date.now() - tocada < 10000) return;
    var v = MAPA[e.detail && e.detail.tipo]; if (v) { vista = v; manda(v); marcaPasos(v); }
  });
  /* índice de capítulos */
  var nav = document.querySelector('[data-capnav]');
  if (nav && 'IntersectionObserver' in window) {
    var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { var on = a.getAttribute('href') === '#' + en.target.id; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(function (a) { var t = document.getElementById(a.getAttribute('href').slice(1)); if (t) io.observe(t); });
  }
})();

/* Gracias y Preparación (después de agendar). Mismo mecanismo que preparate-demo del sitio real:
   ?nombre= &fecha=<ISO-8601 con offset> &tz= llegan desde la redirección del calendario de Hapee.
   - Saludo con el nombre (solo letras; si trae otra cosa se descarta entero).
   - Fecha y hora en la zona de la persona; cuenta regresiva con estados: falta / es la hora / ya ocurrió.
   - Agregar a Google Calendar y .ics (alarma 1 h antes).
   - Lista de preparación (5 puntos) guardada en este navegador; «dg_prep_completa» una vez por carga, como el sitio real
     (es interacción, no conversión: la conversión «dg_agendar_demo» se dispara SOLO en la agenda).
   - Los enlaces internos marcados con [data-con-params] conservan ?nombre&fecha&tz (gracias → preparación).
   Sin parámetros todo se oculta con elegancia: no se inventa fecha ni nombre. */
(function () {
  'use strict';
  var html = document.documentElement;
  var DUR = +(document.body.getAttribute('data-duracion') || 45);   /* minutos: el calendario de la app dice 45 */
  var PHONE = '56965349093';
  var q; try { q = new URLSearchParams(location.search); } catch (e) { q = { get: function () { return null; } }; }
  var nombre = (q.get('nombre') || ''); try { nombre = nombre.normalize('NFC'); } catch (e) {}
  nombre = nombre.replace(/\s+/g, ' ').trim();
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(nombre) || nombre.length < 2) nombre = '';
  nombre = nombre.slice(0, 40);
  var raw = (q.get('fecha') || '').trim().replace(' ', '+'), fecha = null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/.test(raw)) {
    var d = new Date(raw.replace(/([+-]\d{2})(\d{2})$/, '$1:$2')); if (!isNaN(d.getTime())) fecha = d;
  }
  var tz = (q.get('tz') || '').trim();
  if (tz) { try { new Intl.DateTimeFormat('es', { timeZone: tz }); } catch (e) { tz = ''; } }
  if (!tz) { try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { tz = ''; } }
  var $ = function (s) { return document.querySelector(s); }, $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };
  if (nombre) { $$('[data-nombre]').forEach(function (el) { el.textContent = nombre.split(' ')[0]; }); html.classList.add('pd-nombre'); }
  /* enlaces que conservan los parámetros */
  var qs = []; if (nombre) qs.push('nombre=' + encodeURIComponent(nombre)); if (fecha) qs.push('fecha=' + encodeURIComponent(raw)); if (q.get('tz') && tz) qs.push('tz=' + encodeURIComponent(tz));
  $$('a[data-con-params]').forEach(function (a) { if (qs.length) a.href = a.getAttribute('href').split('?')[0] + '?' + qs.join('&'); });
  function fmt(dt, o) { try { return new Intl.DateTimeFormat('es-CL', Object.assign({ timeZone: tz || undefined }, o)).format(dt); } catch (e) { return dt.toLocaleString('es'); } }
  if (fecha) {
    html.classList.add('pd-fecha');
    var dia = fmt(fecha, { weekday: 'long', day: 'numeric', month: 'long' }), hora = fmt(fecha, { hour: '2-digit', minute: '2-digit' });
    $$('[data-cuando]').forEach(function (el) { el.textContent = dia.charAt(0).toUpperCase() + dia.slice(1) + ' · ' + hora + (tz ? ' (' + tz.replace(/_/g, ' ') + ')' : ''); });
    /* calendario */
    var fin = new Date(fecha.getTime() + DUR * 60000);
    var u = function (x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); };
    var det = 'Demo 1:1 con el equipo de Hapee por Google Meet. El enlace de la videollamada llega a tu correo.';
    var gcal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=Demo%20Hapee%201%3A1&dates=' + u(fecha) + '/' + u(fin) +
      '&details=' + encodeURIComponent(det) + '&location=Google%20Meet' + (tz ? '&ctz=' + encodeURIComponent(tz) : '');
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hapee//Demo 1:1//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
      'UID:demo-' + u(fecha) + '@hapee.ai', 'DTSTAMP:' + u(new Date()), 'DTSTART:' + u(fecha), 'DURATION:PT' + DUR + 'M', 'SUMMARY:Demo Hapee 1:1',
      'DESCRIPTION:' + det, 'LOCATION:Google Meet', 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Tu demo con Hapee empieza en 1 hora',
      'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
    $$('[data-gcal]').forEach(function (a) { a.href = gcal; });
    $$('[data-ics]').forEach(function (a) { a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics); });
    /* cuenta regresiva */
    var cajas = $$('[data-cd]');
    var tick = function () {
      var ms = fecha.getTime() - Date.now(), estado = ms > 0 ? 'falta' : (ms > -DUR * 60000 ? 'ahora' : 'paso');
      html.setAttribute('data-demo', estado);
      if (estado === 'falta') {
        var s = Math.floor(ms / 1000), v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
        cajas.forEach(function (c) { var k = c.getAttribute('data-cd'); c.textContent = (v[k] < 10 ? '0' : '') + v[k]; });
      }
      return estado;
    };
    if (tick() === 'falta') setInterval(tick, 1000);
  } else html.setAttribute('data-demo', 'sin-fecha');
  /* WhatsApp con mensaje */
  var msg = 'Hola, agendé una demo de Hapee' + (nombre ? ', soy ' + nombre : '') + (fecha ? ' para el ' + fmt(fecha, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).replace(/\.$/, '') : '') + '. Tengo una consulta:';
  $$('a[data-wa]').forEach(function (a) { a.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg); });
  /* lista de preparación */
  var lista = $('[data-prep]');
  if (lista) {
    var KEY = 'hapee-prep-v3k9', inputs = [].slice.call(lista.querySelectorAll('input[type=checkbox]')), barra = $('[data-prep-n]'), enviado = false;
    var guarda = function () { try { localStorage.setItem(KEY, JSON.stringify(inputs.map(function (i) { return i.checked; }))); } catch (e) {} };
    var pinta = function () {
      var n = inputs.filter(function (i) { return i.checked; }).length;
      if (barra) barra.textContent = n + '/' + inputs.length;
      lista.style.setProperty('--prep', n / inputs.length);
      lista.classList.toggle('listo', n === inputs.length);
      if (n === inputs.length && !enviado && lista.getAttribute('data-restaurando') !== '1') { enviado = true; if (typeof gtag === 'function') gtag('event', 'dg_prep_completa'); }
    };
    try { var st = JSON.parse(localStorage.getItem(KEY) || 'null'); if (st) { lista.setAttribute('data-restaurando', '1'); inputs.forEach(function (i, k) { i.checked = !!st[k]; }); } } catch (e) {}
    pinta(); lista.removeAttribute('data-restaurando');
    inputs.forEach(function (i) { i.addEventListener('change', function () { guarda(); pinta(); }); });
    var re = $('[data-prep-reset]'); if (re) re.addEventListener('click', function () { inputs.forEach(function (i) { i.checked = false; }); guarda(); pinta(); });
  }
  /* VSL: botón de reproducir sobre el póster */
  $$('[data-vsl]').forEach(function (w) {
    var v = w.querySelector('video'), b = w.querySelector('.hn-vsl-play');
    if (!v || !b) return;
    b.addEventListener('click', function () { b.hidden = true; v.setAttribute('controls', ''); var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    v.addEventListener('play', function () { b.hidden = true; });
  });
})();

/* Prueba social con video (agendas). Lee casos.json (un solo archivo de datos, ver «_como_usar») y dibuja una tarjeta por caso:
   con video → póster + botón; reproduce en el lugar, con sonido solo al tocar (nunca autoplay), pausa los demás.
   sin video → la cifra y el resultado, con la marca «Video próximamente».
   Móvil: carrusel con scroll-snap; escritorio: grilla. Sin dependencias. */
(function () {
  'use strict';
  var raiz = document.querySelector('[data-casos]');
  if (!raiz) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function url(u) { u = String(u || '').trim(); return /^(https:\/\/|\/)[^\s"'<>]+$/.test(u) ? u : ''; }
  function pinta(D) {
    var cs = (D && D.casos) || [];
    if (!cs.length) { raiz.hidden = true; return; }
    var html = cs.map(function (c, i) {
      var v = url(c.video), p = url(c.poster);
      var quien = [c.persona, c.cargo].filter(Boolean).map(esc).join(' · ');
      var media = v
        ? '<div class="cs-media"><video preload="none" playsinline' + (p ? ' poster="' + esc(p) + '"' : '') + ' aria-label="Caso de éxito: ' + esc(c.empresa) + '"><source src="' + esc(v) + '" type="video/mp4"></video>' +
          '<button type="button" class="cs-play" aria-label="Reproducir el video de ' + esc(c.empresa) + '"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button></div>'
        : '<div class="cs-media cs-sin"><b class="cs-cifra">' + esc(c.cifra) + '</b><span class="cs-prox">Video próximamente</span></div>';
      return '<li class="cs-card' + (v ? ' cs-con' : '') + '"><article>' + media + '<div class="cs-txt">' +
        (v ? '<b class="cs-cifra cs-cifra-s">' + esc(c.cifra) + '</b>' : '') +
        '<p class="cs-res">' + esc(c.resultado) + '</p>' + (c.cita ? '<blockquote class="cs-cita">«' + esc(c.cita) + '»</blockquote>' : '') +
        '<p class="cs-emp">' + esc(c.empresa) + '</p>' + (quien ? '<p class="cs-quien">' + quien + '</p>' : '') +
        '</div></article></li>';
    }).join('');
    raiz.querySelector('.cs-lista').innerHTML = html;
    var nota = raiz.querySelector('.cs-nota'); if (nota && D.nota) nota.textContent = D.nota;
    raiz.hidden = false;
  }
  var emb = null; try { emb = JSON.parse(document.getElementById('casos-datos').textContent); } catch (e) {}
  pinta(emb);
  var src = raiz.getAttribute('data-src');
  if (src && window.fetch) fetch(src, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(pinta).catch(function () {});
  raiz.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.cs-play'); if (!b) return;
    var v = b.parentNode.querySelector('video');
    [].forEach.call(raiz.querySelectorAll('video'), function (o) { if (o !== v) o.pause(); });
    b.hidden = true; v.setAttribute('controls', ''); var p = v.play(); if (p && p.catch) p.catch(function () {});
  });
})();

/* Agente IA de Sercapro · maqueta multicanal con guiones de ejemplo. */
window.AIA_DATOS={"marca":"Sercapro","agente":"Agente IA de Sercapro","firma":"con Hapee","avatar":{"img":"a/sercapro-avatar-eac7906329.webp"},"cuentas":{"wa":"Sercapro · Capacitación","ig":"sercaprootec","fb":"Sercapro OTEC","tt":"sercapro.otec","li":"Sercapro SpA"},"sub":{"li":"Capacitación · La Serena · todo Chile"},"canales":[{"c":"wa","cliente":"Marcela P.","hora":"21:40","pasos":[["sis","Hoy"],["c","Hola, necesito el curso de grúa horquilla para 6 operadores. ¿Sirve con SENCE?"],["est","Entiende la consulta"],["a","Hola, Marcela. Soy el asistente de Sercapro. <b>Grúa horquilla: mantención, conducción y operación</b> es de 36 horas presenciales y lo hacemos cerrado para su equipo."],["acc","tag","Etiquetó: curso SENCE","Grúa horquilla · empresa"],["a","¿Lo tomaría con franquicia SENCE?"],["qr",["Sí, con franquicia","Sin franquicia"],0],["est","Califica"],["voz","0:14","Somos de Ovalle y por turnos nos sirve en dos sábados seguidos."],["a","Anotado: <b>6 operadores, Ovalle, dos sábados</b>. El código SENCE y el valor se los confirma el equipo con la cotización."],["acc","crm","Creó lead en CRM","6 personas · Ovalle · origen WhatsApp"],["acc","cotiza","Pidió la cotización al equipo","con código SENCE"],["a","Listo. El lunes a primera hora le llega la cotización por este mismo chat."]]},{"c":"ig","cliente":"Javiera R.","hora":"19:05","pasos":[["ctx",{"k":"historia"}],["c","Hola! el curso de Excel es online? 🙌"],["a","¡Hola, Javiera! Sí 😊 Excel lo damos en <b>tres niveles</b>: básico, intermedio y avanzado."],["a","Puedes tomarlo con clases en vivo o a tu ritmo. ¿Cuál te acomoda más?"],["qr",["Clases en vivo","A mi ritmo"],0],["est","Recomienda"],["card",{"t":"Excel · e-learning sincrónico","s":"Básico, intermedio y avanzado","l":["Clases en vivo","Particulares y empresas"],"b":"Ver el curso"}],["c","Intermedio! cuándo parte?"],["a","La fecha de la próxima edición la confirma el equipo. Te dejo anotada y te aviso por aquí apenas se abra 🙌"],["acc","crm","Creó lead en CRM","Particular · Excel intermedio"],["acc","agenda","Programó aviso de próxima fecha","por Instagram"]]},{"c":"fb","cliente":"Rodrigo A.","hora":"11:18","pasos":[["ctx",{"k":"anuncio","t":"Cursos portuarios","s":"Sercapro OTEC"}],["c","Buenas, el curso portuario está autorizado por DIRECTEMAR?"],["a","Buenos días, Rodrigo. Sí: DIRECTEMAR autorizó dos cursos de Sercapro, 100% presenciales (res. 12600/01/1725)."],["card",{"t":"Operaciones básicas de carga, descarga y protocolos de seguridad","s":"Recintos portuarios · 200 h","l":["DIRECTEMAR","Presencial"]}],["a","También está <b>Actualización de seguridad en faenas portuarias</b>, de 35 horas. ¿Es para usted o para una empresa?"],["c","Para 12 trabajadores, terminal en Coquimbo"],["est","Agenda"],["acc","crm","Creó lead en CRM","Portuario · 12 personas · Coquimbo"],["slots","¿Cuándo lo llama el equipo?",["Mar · 10:00","Mar · 16:30","Mié · 09:30","Mié · 12:00"],1,"Martes 16:30"],["acc","agenda","Agendó llamada con el equipo","martes 16:30"],["a","Agendado. Le dejé un recordatorio por Messenger una hora antes."]]},{"c":"tt","cliente":"faena.copiapo","hora":"22:10","pasos":[["ctx",{"k":"comentario","t":"Del aula a la faena 👷 trabajo en altura","n":"Video de Sercapro","u":"faena.copiapo","txt":"hacen el curso de altura en Copiapó? somos varios 🙌"}],["pub","¡Hola! Sí, vamos donde trabaja tu equipo 👷 Te escribimos por mensaje con los detalles."],["sis","Continúa por mensaje directo"],["a","Hola 👋 <b>Trabajo y rescate en altura</b> es de 16 horas presenciales. En Copiapó ya dictamos extintores e instalador eléctrico clase D."],["c","somos 8 de una contratista, se puede con sence?"],["a","Se puede: todos nuestros cursos tienen código SENCE. El código y el valor te los confirma el equipo 👌"],["acc","tag","Etiquetó: origen TikTok","Altura · contratista"],["acc","crm","Creó lead en CRM","8 personas · Copiapó"],["hum","coordinación de faena","Te escribe una persona del equipo para coordinar fechas"]]},{"c":"li","cliente":"Andrés M.","hora":"09:12","pasos":[["c","Hola, soy jefe de RRHH en una empresa de servicios mineros. Estamos armando el plan de capacitación 2027 y nos preocupa el cambio en la franquicia."],["a","Buenos días, Andrés. Con la Ley 21.850, desde el 1 de enero de 2027 el tope baja de <b>1% a 0,7%</b> de la planilla anual, y los cursos solo de autoinstrucción dejan de contar. Referencial: confírmelo con SENCE y el SII."],["est","Califica"],["a","Podemos armar el plan con cursos cerrados, en su faena y sus horarios. ¿Cuántas personas y qué áreas incluiría?"],["c","Unas 120 personas entre faena y bodega."],["acc","crm","Creó oportunidad: Plan 2027","120 personas · faena y bodega"],["acc","mail","Envió resumen Ley 21.850 por correo","referencial"],["slots","Reunión para revisar el plan 2027",["Jue · 10:00","Jue · 15:00","Vie · 09:30","Vie · 11:00"],0,"Jueves 10:00, por videollamada"],["acc","agenda","Agendó reunión","jueves 10:00 · videollamada"]]}]};
/* Agente IA multicanal · maqueta para el hero. Sin dependencias.
   Datos: window.AIA_DATOS (los antepone generar.py). Monta cada [data-aia] cuando la hoja de estilos ya cargó,
   reproduce un guion por canal, pausa fuera de pantalla y respeta prefers-reduced-motion. */
(function () {
  'use strict';
  var D0 = window.AIA_DATOS;
  if (!D0) return;
  // Variantes opcionales: la página marca cuál usar en un atributo de <html> y avisa el cambio con un evento.
  function elige() {
    var V = D0.variantes, v = V && V.por && V.por[document.documentElement.getAttribute(V.attr || 'data-v')];
    if (!v) return D0;
    var o = {}, k;
    for (k in D0) o[k] = D0[k];
    for (k in v) o[k] = v[k];
    return o;
  }
  var D = elige();
  var RM = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var CANAL = {
    wa: { n: 'WhatsApp', sub: 'Cuenta de empresa', ph: 'Mensaje' },
    ig: { n: 'Instagram', sub: 'Cuenta de empresa', ph: 'Envía un mensaje...' },
    fb: { n: 'Facebook', sub: 'Página de Facebook', ph: 'Aa' },
    tt: { n: 'TikTok', sub: 'Cuenta de empresa', ph: 'Enviar un mensaje...' },
    li: { n: 'LinkedIn', sub: 'Página de empresa', ph: 'Escribe un mensaje...' }
  };
  var P = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  var SVG = {
    wa: '<path ' + P + ' d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><path fill="currentColor" d="M9.1 7.7c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5.5.9 1.5 1.9 2.6 2.4.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.6.8c.2.1.3.2.3.4 0 .5-.2 1.1-.7 1.4-.5.4-1.3.5-2.2.2-1.5-.5-3-1.8-4-3.3-.5-.9-.8-1.8-.6-2.6l.5-1.4z"/>',
    ig: '<rect ' + P + ' x="3.5" y="3.5" width="17" height="17" rx="5"/><circle ' + P + ' cx="12" cy="12" r="4"/><circle fill="currentColor" cx="17" cy="7" r="1.1"/>',
    fb: '<path fill="currentColor" d="M13.4 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.7v3h2.6V21z"/>',
    tt: '<path fill="currentColor" d="M14.6 3h2.7c.2 1.9 1.6 3.4 3.4 3.6v2.8a6.7 6.7 0 0 1-3.5-1.1v6.3a5.6 5.6 0 1 1-5.6-5.6l.9.1v2.9a2.8 2.8 0 1 0 2.1 2.7z"/>',
    li: '<rect ' + P + ' x="3.5" y="3.5" width="17" height="17" rx="3"/><path fill="currentColor" d="M7.4 10.2h2.1v6.6H7.4zM8.45 6.9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM11 10.2h2v.9c.3-.5 1-1.1 2.1-1.1 2.2 0 2.6 1.4 2.6 3.3v3.5h-2.1v-3.1c0-.8 0-1.7-1.1-1.7s-1.3.8-1.3 1.7v3.1H11z"/>',
    atras: '<path ' + P + ' d="M15 5l-7 7 7 7"/>',
    tel: '<path ' + P + ' d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"/>',
    cam: '<rect ' + P + ' x="3" y="6.5" width="12.5" height="11" rx="2.5"/><path ' + P + ' d="M15.5 10.5l5-3v9l-5-3z"/>',
    mas: '<path ' + P + ' d="M12 5v14M5 12h14"/>',
    mic: '<rect ' + P + ' x="9" y="3.5" width="6" height="11" rx="3"/><path ' + P + ' d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    play: '<path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/>',
    pts: '<circle fill="currentColor" cx="5.5" cy="12" r="1.6"/><circle fill="currentColor" cx="12" cy="12" r="1.6"/><circle fill="currentColor" cx="18.5" cy="12" r="1.6"/>',
    doc: '<path ' + P + ' d="M7 3h7l4 4v14H7z"/><path ' + P + ' d="M14 3v4h4M9.5 12.5h6M9.5 16h6"/>',
    cal: '<rect ' + P + ' x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path ' + P + ' d="M3.5 10h17M8 3v4M16 3v4"/>',
    crm: '<circle ' + P + ' cx="9.5" cy="8.5" r="3.5"/><path ' + P + ' d="M3 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5M18.5 8v6M15.5 11h6"/>',
    tag: '<path ' + P + ' d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8-9 9z"/><circle fill="currentColor" cx="8.2" cy="8.2" r="1.4"/>',
    hum: '<circle ' + P + ' cx="12" cy="8" r="3.8"/><path ' + P + ' d="M4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/><path ' + P + ' d="M16.5 4.5l2 2-2 2"/>',
    cot: '<path ' + P + ' d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path ' + P + ' d="M9.5 8h5M9.5 12h5"/>',
    caja: '<path ' + P + ' d="M3.5 7.5L12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path ' + P + ' d="M3.5 7.5L12 12l8.5-4.5M12 12v9"/>',
    camion: '<path ' + P + ' d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7z"/><circle ' + P + ' cx="6.5" cy="17.5" r="1.8"/><circle ' + P + ' cx="16.5" cy="17.5" r="1.8"/>',
    rayo: '<path fill="currentColor" d="M13.2 2.5L4.8 13.4h6l-1.2 8.1 8.6-11.1h-6.1z"/>',
    ok: '<path ' + P + ' d="M5 12.5l4.5 4.5L19 7.5"/>',
    mail: '<rect ' + P + ' x="3" y="5.5" width="18" height="13" rx="2"/><path ' + P + ' d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    voz: '<path ' + P + ' d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>',
    pin: '<path ' + P + ' d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle ' + P + ' cx="12" cy="10" r="2.3"/>',
    cora: '<path ' + P + ' d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>'
  };
  var ACC = { agenda: 'cal', crm: 'crm', tag: 'tag', humano: 'hum', cotiza: 'cot', stock: 'caja', despacho: 'camion', voz: 'voz', doc: 'doc', mail: 'mail', pin: 'pin', ok: 'ok' };
  function svg(k, cls) { return '<svg class="' + (cls || 'aia-i') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (SVG[k] || SVG.rayo) + '</svg>'; }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function txt(s) { return String(s).replace(/<[^>]+>/g, ''); }

  function Reloj() { this.t = null; this.fn = null; this.resto = 0; this.t0 = 0; this.pausa = true; }
  Reloj.prototype.en = function (ms, fn) { this.limpia(); this.fn = fn; this.resto = ms; if (!this.pausa) this.va(); };
  Reloj.prototype.va = function () { var s = this; s.t0 = Date.now(); s.t = setTimeout(function () { var f = s.fn; s.fn = null; s.t = null; if (f) f(); }, s.resto); };
  Reloj.prototype.detiene = function () { if (this.pausa) return; this.pausa = true; if (this.t) { clearTimeout(this.t); this.t = null; this.resto = Math.max(0, this.resto - (Date.now() - this.t0)); } };
  Reloj.prototype.sigue = function () { if (!this.pausa) return; this.pausa = false; if (this.fn && !this.t) this.va(); };
  Reloj.prototype.limpia = function () { if (this.t) clearTimeout(this.t); this.t = null; this.fn = null; };

  var nId = 0;
  function Agente(host) {
    this.host = host;
    this.id = 'aia' + (++nId);
    this.canales = D.canales.filter(function (c) { return CANAL[c.c]; });
    this.ic = 0;
    this.reloj = new Reloj();
    this.manualHasta = 0;
    this.visible = false;
    this.encima = false;
    this.arma();
    this.observa();
    this.abre(0, false);
  }

  Agente.prototype.arma = function () {
    var s = this, d = D;
    var raiz = h('div', 'aia');
    raiz.setAttribute('role', 'region');
    raiz.setAttribute('aria-label', 'Maqueta: agente de IA multicanal de ' + d.marca + ' con conversaciones de ejemplo');
    var top = h('div', 'aia-top');
    top.appendChild(h('span', 'aia-rot', '<i class="aia-pt" aria-hidden="true"></i>' + (d.rotulo || 'Maqueta · Agente IA multicanal')));
    if (d.firma) top.appendChild(h('span', 'aia-firma', d.firma));
    raiz.appendChild(top);

    var tabs = h('div', 'aia-tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Canales de la maqueta');
    this.tabs = [];
    this.canales.forEach(function (c, i) {
      var b = h('button', 'aia-tab', svg(c.c) + '<span class="aia-tab-n">' + CANAL[c.c].n + '</span><i class="aia-prog" aria-hidden="true"></i>');
      b.type = 'button';
      b.id = s.id + '-t' + i;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', s.id + '-p');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('aria-label', CANAL[c.c].n);
      b.tabIndex = -1;
      b.dataset.c = c.c;
      b.addEventListener('click', function () { s.manual(); s.abre(i, true); });
      b.addEventListener('keydown', function (e) {
        var n = s.canales.length, j = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j === null) return;
        e.preventDefault(); s.manual(); s.abre(j, true); s.tabs[j].focus();
      });
      tabs.appendChild(b);
      s.tabs.push(b);
    });
    raiz.appendChild(tabs);

    var cuerpo = h('div', 'aia-cuerpo');
    var scr = h('div', 'aia-scr');
    scr.id = this.id + '-p';
    scr.setAttribute('role', 'tabpanel');
    var hd = h('div', 'aia-hd');
    var av = d.avatar || {};
    var avHtml = av.img ? '<img src="' + av.img + '" alt="" width="40" height="40" decoding="async">' : '<b>' + (av.ini || d.marca.charAt(0)) + '</b>';
    this.avHtml = avHtml;
    hd.innerHTML = '<span class="aia-hd-atras">' + svg('atras') + '</span><span class="aia-av" style="' + (av.bg ? '--aia-av-bg:' + av.bg + ';' : '') + (av.fg ? '--aia-av-fg:' + av.fg : '') + '">' + avHtml + '</span>' +
      '<span class="aia-hd-tx"><b class="aia-hd-n"></b><span class="aia-hd-s"></span></span><span class="aia-hd-ic">' + svg('tel') + svg('cam') + '</span>';
    scr.appendChild(hd);
    var feed = h('div', 'aia-feed');
    feed.setAttribute('aria-live', 'off');
    scr.appendChild(feed);
    var ft = h('div', 'aia-ft');
    ft.setAttribute('aria-hidden', 'true');
    scr.appendChild(ft);
    cuerpo.appendChild(scr);

    var pan = h('div', 'aia-pan');
    pan.innerHTML = '<div class="aia-pan-h"><span class="aia-led" aria-hidden="true"></span><b>' + (d.agente || 'Agente IA de ' + d.marca) + '</b></div>' +
      '<div class="aia-pan-e"><span>Ahora</span><b class="aia-est">Atiende</b></div>' +
      '<ul class="aia-pan-l" aria-label="Lo que hizo el agente"></ul>' +
      '<div class="aia-pan-f">Guion de ejemplo · nada se envía</div>';
    cuerpo.appendChild(pan);
    raiz.appendChild(cuerpo);

    this.raiz = raiz; this.scr = scr; this.feed = feed; this.hdN = hd.querySelector('.aia-hd-n'); this.hdS = hd.querySelector('.aia-hd-s');
    this.ft = ft; this.est = pan.querySelector('.aia-est'); this.lista = pan.querySelector('.aia-pan-l');
    raiz.style.setProperty('--aia-ui', getComputedStyle(this.host).fontFamily);
    this.host.textContent = '';
    this.host.appendChild(raiz);
    this.host.classList.add('aia-lista');

    raiz.addEventListener('mouseenter', function () { s.encima = true; });
    raiz.addEventListener('mouseleave', function () { s.encima = false; });
    raiz.addEventListener('focusin', function () { s.encima = true; });
    raiz.addEventListener('focusout', function () { s.encima = false; });
  };

  Agente.prototype.observa = function () {
    var s = this;
    var mira = function () {
      var ve = s.visible && !document.hidden;
      s.raiz.classList.toggle('aia-quieto', !ve);
      if (ve) s.reloj.sigue(); else s.reloj.detiene();
    };
    this.mira = mira;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { s.visible = es[0].isIntersecting; mira(); }, { threshold: 0.12 }).observe(this.host);
    } else { this.visible = true; }
    document.addEventListener('visibilitychange', mira);
    if (RM.addEventListener) RM.addEventListener('change', function () { s.abre(s.ic, false); });
    mira();
  };

  Agente.prototype.manual = function () { this.manualHasta = Date.now() + 30000; };

  Agente.prototype.rehace = function () {
    var foco = this.raiz.contains(document.activeElement);
    this.reloj.limpia();
    this.canales = D.canales.filter(function (c) { return CANAL[c.c]; });
    this.arma();
    this.mira();
    this.abre(0, false);
    if (foco) this.tabs[0].focus();
  };

  Agente.prototype.abre = function (i, porUsuario) {
    var s = this, c = this.canales[i];
    this.ic = i;
    this.reloj.limpia();
    this.tabs.forEach(function (b, j) {
      var on = j === i;
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      b.classList.toggle('aia-on', on);
      b.style.setProperty('--aia-p', '0');
    });
    this.scr.setAttribute('aria-labelledby', this.tabs[i].id);
    this.scr.dataset.c = c.c;
    this.raiz.dataset.c = c.c;
    this.hdN.textContent = (D.cuentas && D.cuentas[c.c]) || D.marca;
    this.subBase = (D.sub && D.sub[c.c]) || CANAL[c.c].sub;
    this.hdS.textContent = this.subBase;
    this.ft.innerHTML = this.pie(c.c);
    this.feed.textContent = '';
    this.lista.innerHTML = '<li class="aia-vacio">Aquí aparece lo que hace el agente</li>';
    this.est.textContent = 'Atiende';
    this.ultimo = null;
    this.min = this.aMin(c.hora || '10:12');
    this.paso = 0;
    this.total = c.pasos.length;
    if (RM.matches) {
      while (this.paso < this.total) this.ejecuta(c.pasos[this.paso++], true);
      this.progreso(1);
      this.feed.scrollTop = 0;
      return;
    }
    // La conversación abre con el contexto y el primer mensaje del cliente ya a la vista.
    while (this.paso < this.total && /^(sis|ctx|est)$/.test(c.pasos[this.paso][0])) this.ejecuta(c.pasos[this.paso++], true);
    if (this.paso < this.total && /^(c|voz|img)$/.test(c.pasos[this.paso][0])) this.ejecuta(c.pasos[this.paso++], true);
    this.feed.scrollTop = this.feed.scrollHeight;
    this.progreso(this.paso / this.total);
    this.reloj.en(porUsuario ? 450 : 900, function () { s.sigue(); });
  };

  Agente.prototype.pie = function (c) {
    var ph = '<span class="aia-ft-in">' + CANAL[c].ph + '</span>';
    if (c === 'wa') return '<span class="aia-ft-caja">' + svg('mas') + ph + svg('cam') + '</span><span class="aia-ft-bt">' + svg('mic') + '</span>';
    if (c === 'ig') return '<span class="aia-ft-caja"><span class="aia-ft-bt">' + svg('cam') + '</span>' + ph + svg('mic') + '</span>';
    if (c === 'fb') return svg('mas') + svg('cam') + '<span class="aia-ft-caja">' + ph + '</span>' + svg('cora');
    if (c === 'tt') return '<span class="aia-ft-caja">' + ph + '</span>' + svg('mic');
    return '<span class="aia-ft-caja">' + ph + '</span><span class="aia-ft-env">Enviar</span>';
  };

  Agente.prototype.aMin = function (hhmm) { var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]); };
  Agente.prototype.hora = function () { var m = this.min % 1440; var hh = Math.floor(m / 60), mm = m % 60; return hh + ':' + (mm < 10 ? '0' : '') + mm; };
  Agente.prototype.progreso = function (f) { this.tabs[this.ic].style.setProperty('--aia-p', String(Math.min(1, f))); };

  Agente.prototype.sigue = function () {
    var s = this, c = this.canales[this.ic];
    if (this.paso >= this.total) {
      this.progreso(1);
      this.reloj.en(4800, function () { s.fin(); });
      return;
    }
    var p = c.pasos[this.paso];
    var t = p[0], esAg = t === 'a' || t === 'card' || t === 'doc' || t === 'slots' || t === 'pub';
    var espera = 450;
    if (t === 'c') espera = Math.min(2300, 900 + txt(p[1]).length * 16);
    else if (t === 'voz' || t === 'img') espera = 1500;
    else if (t === 'acc' || t === 'hum') espera = 650;
    else if (t === 'est') espera = 0;
    else if (t === 'qr') espera = 300;
    else if (t === 'ctx') espera = 250;
    var corre = function () {
      var g = s.ejecuta(p, false);
      if (!g) { s.avanza(); return; }
      s.reloj.en(1700, function () {
        g.marca();
        s.reloj.en(600, function () { g.envia(); s.avanza(); });
      });
    };
    if (esAg) {
      var largo = t === 'a' || t === 'pub' ? txt(p[1]).length : 60;
      var tipeo = Math.min(2500, 650 + largo * 15);
      this.reloj.en(t === 'pub' ? 500 : 350, function () {
        s.escribe(true);
        s.reloj.en(tipeo, function () { s.escribe(false); corre(); });
      });
      return;
    }
    this.reloj.en(espera, corre);
  };

  Agente.prototype.avanza = function () {
    var s = this;
    this.paso++;
    this.progreso(this.paso / this.total);
    this.reloj.en(320, function () { s.sigue(); });
  };

  Agente.prototype.fin = function () {
    var s = this;
    if (Date.now() < this.manualHasta || this.encima) { this.reloj.en(2500, function () { s.fin(); }); return; }
    this.abre((this.ic + 1) % this.canales.length, false);
  };

  Agente.prototype.escribe = function (on) {
    if (on) {
      this.hdS.textContent = this.canales[this.ic].c === 'li' ? 'Escribiendo...' : 'escribiendo...';
      this.hdS.classList.add('aia-tipeo');
      var t = h('div', 'aia-m aia-ag aia-escr', '<span class="aia-b"><i></i><i></i><i></i></span>');
      t.setAttribute('aria-hidden', 'true');
      this.tipeo = t;
      this.mete(t);
    } else {
      this.hdS.textContent = this.subBase;
      this.hdS.classList.remove('aia-tipeo');
      if (this.tipeo && this.tipeo.parentNode) this.tipeo.parentNode.removeChild(this.tipeo);
      this.tipeo = null;
    }
  };

  Agente.prototype.mete = function (el) {
    var f = this.feed;
    if (!RM.matches) el.classList.add('aia-ent');
    f.appendChild(el);
    if (!RM.matches) { if (f.scrollTo) f.scrollTo({ top: f.scrollHeight, behavior: 'smooth' }); else f.scrollTop = f.scrollHeight; }
    return el;
  };

  Agente.prototype.burbuja = function (quien, html, extra) {
    var c = this.canales[this.ic], esAg = quien === 'ag';
    var nuevo = !this.ultimo || this.ultimo.quien !== quien;
    if (!esAg) this.min += 1;
    var m = h('div', 'aia-m ' + (esAg ? 'aia-ag' : 'aia-cl') + (nuevo ? ' aia-g1' : ''));
    if (nuevo) {
      var nom = esAg ? ((D.cuentas && D.cuentas.li) || D.marca) : c.cliente;
      m.appendChild(h('span', 'aia-nom', '<span class="aia-av aia-av-s">' + (esAg ? this.avHtml : '<b>' + (c.cliente || 'C').charAt(0) + '</b>') + '</span><b>' + nom + '</b><time>' + this.hora() + '</time>'));
    }
    if (esAg && this.ultimo && this.ultimo.quien === 'ag' && this.ultimo.el) this.ultimo.el.classList.add('aia-sig');
    var b = h('div', 'aia-b', html);
    if (extra !== false) b.appendChild(h('span', 'aia-hr', this.hora() + (esAg ? '' : '<span class="aia-tk">' + svg('ok') + svg('ok') + '</span>')));
    m.appendChild(b);
    this.ultimo = { quien: quien, el: m };
    return m;
  };

  Agente.prototype.elige = function (op, grupo, respuesta, ya) {
    var s = this;
    var api = {
      marca: function () { if (op) op.classList.add('aia-sel'); },
      envia: function () { if (grupo) grupo.classList.add('aia-usado'); s.mete(s.burbuja('cl', respuesta)); }
    };
    if (ya) { api.marca(); api.envia(); return null; }
    return api;
  };

  Agente.prototype.ejecuta = function (p, ya) {
    var s = this, t = p[0], o = p[1], el;
    switch (t) {
      case 'c': this.mete(this.burbuja('cl', o)); break;
      case 'a': this.mete(this.burbuja('ag', o)); break;
      case 'pub':
        this.mete(h('div', 'aia-com aia-com-r', '<span class="aia-av aia-av-s">' + this.avHtml + '</span><div><b>' + ((D.cuentas && D.cuentas.tt) || D.marca) + ' <em>Creador</em></b><p>' + o + '</p><small>Responder · ' + svg('cora') + '</small></div>'));
        this.ultimo = null; break;
      case 'voz':
        el = this.burbuja('cl', '<span class="aia-voz"><span class="aia-voz-p">' + svg('play') + '</span><span class="aia-voz-o">' + new Array(23).join('<i></i>') + '</span><span class="aia-voz-d">' + o + '</span></span>');
        el.classList.add('aia-m-voz');
        this.mete(el);
        if (p[2]) this.mete(h('div', 'aia-trans', svg('voz') + '<span><b>Transcripción del agente:</b> «' + p[2] + '»</span>'));
        break;
      case 'img':
        el = this.burbuja('cl', '<img src="' + o + '" alt="" loading="lazy" decoding="async">' + (p[2] ? '<span class="aia-cap">' + p[2] + '</span>' : ''));
        el.classList.add('aia-m-img');
        this.mete(el); break;
      case 'card':
        el = this.burbuja('ag', (o.img ? '<span class="aia-card-f"><img src="' + o.img + '" alt="' + txt(o.t) + '" loading="lazy" decoding="async"></span>' : '') +
          '<span class="aia-card-t">' + o.t + '</span>' + (o.s ? '<span class="aia-card-s">' + o.s + '</span>' : '') +
          (o.l ? '<span class="aia-card-l">' + o.l.map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</span>' : '') +
          (o.p ? '<span class="aia-card-p">' + o.p + '</span>' : '') + (o.b ? '<span class="aia-card-b">' + o.b + '</span>' : ''));
        el.classList.add('aia-m-card');
        this.mete(el); break;
      case 'doc':
        el = this.burbuja('ag', '<span class="aia-doc"><span class="aia-doc-i">' + svg('doc') + '<em>' + (p[3] || 'PDF') + '</em></span><span><b>' + o + '</b><small>' + (p[2] || '') + '</small></span></span>');
        el.classList.add('aia-m-doc');
        this.mete(el); break;
      case 'slots':
        el = this.burbuja('ag', '<span class="aia-sl-t">' + svg('cal') + o + '</span><span class="aia-sl">' + p[2].map(function (x) { return '<span class="aia-sl-o">' + x + '</span>'; }).join('') + '</span>');
        el.classList.add('aia-m-slots');
        this.mete(el);
        return this.elige(el.querySelectorAll('.aia-sl-o')[p[3] || 0], null, p[4] || p[2][p[3] || 0], ya);
      case 'qr':
        var g = h('div', 'aia-qr', o.map(function (x) { return '<span class="aia-qr-o">' + x + '</span>'; }).join(''));
        g.setAttribute('aria-hidden', 'true');
        var prev = this.ultimo;
        if (prev && prev.quien === 'ag' && prev.el && this.canales[this.ic].c === 'wa') { prev.el.appendChild(g); if (!ya) this.feed.scrollTop = this.feed.scrollHeight; } else this.mete(g);
        return this.elige(g.children[p[2] || 0], g, p[3] || o[p[2] || 0], ya);
      case 'acc':
        var k = ACC[o] || 'rayo';
        this.mete(h('div', 'aia-acc', '<span class="aia-acc-i">' + svg(k) + '</span><span><b>' + p[2] + '</b>' + (p[3] ? '<small>' + p[3] + '</small>' : '') + '</span>'));
        var li = h('li', 'aia-ac', svg(k) + '<span><b>' + p[2] + '</b>' + (p[3] ? '<small>' + p[3] + '</small>' : '') + '</span>');
        if (!ya && !RM.matches) li.classList.add('aia-ent');
        var vacio = this.lista.querySelector('.aia-vacio');
        if (vacio) this.lista.removeChild(vacio);
        this.lista.appendChild(li);
        this.ultimo = null; break;
      case 'hum':
        this.est.textContent = 'Derivó a una persona';
        this.ejecuta(['acc', 'humano', 'Derivó a un humano', o], ya);
        if (p[2]) this.mete(h('div', 'aia-sis', p[2]));
        break;
      case 'est': this.est.textContent = o; break;
      case 'sis': this.mete(h('div', 'aia-sis', o)); this.ultimo = null; break;
      case 'ctx':
        var cab = o.k === 'historia' ? 'Respondió a su historia' : o.k === 'anuncio' ? 'Respondió a un anuncio' : o.k === 'post' ? 'Desde una publicación' : '';
        if (o.k === 'comentario') {
          this.mete(h('div', 'aia-vid', (o.img ? '<img src="' + o.img + '" alt="" loading="lazy" decoding="async">' : '') + '<span class="aia-vid-tx"><b>' + (o.t || '') + '</b><small>' + svg('cora') + (o.n || '') + '</small></span>'));
          this.mete(h('div', 'aia-com', '<span class="aia-av aia-av-s"><b>' + (o.u || 'U').charAt(0).toUpperCase() + '</b></span><div><b>' + (o.u || '') + '</b><p>' + o.txt + '</p><small>' + (o.h || 'hace 2 min') + ' · Responder</small></div>'));
        } else {
          this.mete(h('div', 'aia-ctx aia-ctx-' + o.k, '<small>' + cab + '</small><span class="aia-ctx-c">' + (o.img ? '<img src="' + o.img + '" alt="" loading="lazy" decoding="async">' : '') + '<span>' + (o.t || '') + (o.s ? '<em>' + o.s + '</em>' : '') + '</span></span>'));
        }
        this.ultimo = null; break;
    }
    return null;
  };

  var todos = [];
  // La bandeja fija y el botón flotante de la página ocupan la franja baja del primer pliegue.
  // En teléfonos, si sobre esa franja no alcanzan a verse la cabecera, las pestañas y una burbuja (VISTO), se
  // agrega el margen justo para que el widget empiece bajo el pliegue. En notebooks, si el widget está en el
  // hero y su borde inferior cae bajo la franja, se acorta el chat (sin bajar de MINFEED) para que termine sobre ella.
  var VISTO = 146, MINFEED = 110, visto = '';
  function franja(caja, alto) {
    var f = 0, els = document.body.getElementsByTagName('*');
    for (var i = 0; i < els.length; i++) {
      var e = els[i], s = getComputedStyle(e);
      if (s.position !== 'fixed' || s.display === 'none' || s.visibility === 'hidden') continue;
      // offsetTop ignora el transform de entrada de las barras; el ancho real sí lo da el rectángulo
      var t = e.offsetTop, hh = e.offsetHeight, r = e.getBoundingClientRect();
      if (!hh || hh > 200 || t + hh < alto - 100 || t >= alto || r.right <= caja.left || r.left >= caja.right) continue;
      f = Math.max(f, alto - t);
    }
    return f;
  }
  function despeja(forzar) {
    var raiz = document.documentElement, w = raiz.clientWidth, alto = raiz.clientHeight;
    // en teléfonos el alto cambia al esconderse la barra del navegador: ahí solo cuenta el ancho
    var clave = w < 768 ? String(w) : w + 'x' + alto;
    if (clave === visto && !forzar) return;
    visto = clave;
    var y0 = window.pageYOffset || 0;
    todos.forEach(function (a) {
      var el = a.host, feed = el.querySelector('.aia-feed'), caja, top, f;
      el.style.marginTop = '';
      el.style.removeProperty('--aia-alto');
      caja = el.getBoundingClientRect(); top = caja.top + y0;
      if (w < 768) {
        if (top >= alto + 16 || top < alto - 200 - VISTO) return;
        f = franja(caja, alto);
        if (f && top > alto - f - VISTO) el.style.marginTop = (parseFloat(getComputedStyle(el).marginTop) || 0) + alto + 16 - top + 'px';
        return;
      }
      var bajo = caja.bottom + y0;
      if (!feed || top >= alto - VISTO || bajo <= alto - 200) return;
      f = franja(caja, alto);
      var sobra = bajo - (alto - f - 12), nuevo = feed.offsetHeight - sobra;
      if (f && sobra > 0 && nuevo >= MINFEED) el.style.setProperty('--aia-alto', nuevo + 'px');
    });
  }
  function monta() {
    var hosts = document.querySelectorAll('[data-aia]:not(.aia-lista)');
    for (var i = 0; i < hosts.length; i++) todos.push(new Agente(hosts[i]));
    despeja(true);
    window.addEventListener('resize', function () { despeja(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { despeja(true); });
    if (D0.variantes && D0.variantes.evento) document.addEventListener(D0.variantes.evento, function () {
      var n = elige();
      if (n.canales === D.canales) return;
      D = n;
      todos.forEach(function (a) { a.rehace(); });
    });
  }
  function listo() {
    return getComputedStyle(document.documentElement).getPropertyValue('--aia-css').trim() === '1';
  }
  var intentos = 0;
  function espera() {
    if (listo() || intentos++ > 60) { monta(); return; }
    setTimeout(espera, 100);
  }
  var ini = function () { (window.requestIdleCallback || function (f) { return setTimeout(f, 1); })(espera, { timeout: 900 }); };
  if (document.readyState === 'complete') ini(); else window.addEventListener('load', ini);
})();

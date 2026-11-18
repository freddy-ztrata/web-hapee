/* Pricing 2027 · comparadores de /planes (es/en/pt).
   - Planes: la tabla se arma con lo que ya trae la API (/api/saas/planes), así
     sigue al editor de planes sin tocar este archivo. Módulos por plan tal cual;
     «Incluye» se acumula hacia arriba (cada plan trae todo lo del anterior);
     academia y soporte van como valor en una sola fila. Enterprise sale de T27.
   - Implementación: Kickstart · Guiada · Elite, con filas fijas por idioma
     (los bullets de cada implementación no son comparables uno a uno).
   - Cabecera pegajosa, columna destacada, «Solo diferencias», grupos plegables;
     en el teléfono cada fila pone su etiqueta arriba y los valores abajo. */
(function () {
  var L = (document.documentElement.lang || 'es').slice(0, 2);
  var TX = {
    es: {
      cmp_sl: 'Compara', cmp_h: 'Todo lo que trae', cmp_hg: 'cada plan', cmp_p: 'Revisa módulo por módulo qué incluye cada plan.',
      dif: 'Solo diferencias', basico: 'Lo esencial', usuarios: 'Usuarios', contactos: 'Contactos', ia: 'IA incluida al mes',
      mods: 'Módulos', inc: 'Incluye', soporte: 'Soporte', academia: 'Academia', ent: 'Solo Enterprise',
      medida: 'A medida', ilim: 'Ilimitados', mes: '/mes', anio: '/año', pop: 'El más elegido', recom: 'Recomendada', servicio: 'El servicio', elegir: 'Elegir',
      icmp_sl: 'Compara', icmp_h: '¿Qué implementación', icmp_hg: 'te conviene?', icmp_p: 'De hacerlo tú con guía a que lo dejemos todo listo.',
      modalidad: 'Cómo se trabaja', sesiones: 'Sesiones con nuestro equipo', listo: 'Qué queda listo', ideal: 'Ideal para',
      academia_v: 'Academia en video', plantillas: 'Plantillas por rubro', agente: 'Agente de IA entrenado',
      whatsapp: 'WhatsApp conectado', pipes: 'Pipelines y workflows', embudos: 'Embudos, sitios y formularios',
      calendarios: 'Calendarios configurados', migracion: 'Migración de contactos, empresas y negocios', capacita: 'Capacitación del equipo',
      v_kick: 'Kickoff de 60 min (Pro y Scale)', v_3ses: '3 sesiones', v_1a1: 'Consultoría 1 a 1',
      v_1ag: '1 agente', v_varios: 'Varios, probados', v_1p2w: '1 pipeline y 2 workflows', v_todos: 'Los que necesites',
      incluido: 'Incluido', comprar: 'Comprar', ver_planes: 'Ver planes', unico: 'pago único', ver: 'Ver'
    },
    en: {
      cmp_sl: 'Compare', cmp_h: 'Everything in', cmp_hg: 'each plan', cmp_p: 'Check module by module what each plan includes.',
      dif: 'Only differences', basico: 'The essentials', usuarios: 'Users', contactos: 'Contacts', ia: 'AI included per month',
      mods: 'Modules', inc: 'Includes', soporte: 'Support', academia: 'Academy', ent: 'Enterprise only',
      medida: 'Custom', ilim: 'Unlimited', mes: '/mo', anio: '/yr', pop: 'Most popular', recom: 'Recommended', servicio: 'The service', elegir: 'Choose',
      icmp_sl: 'Compare', icmp_h: 'Which implementation', icmp_hg: 'fits you?', icmp_p: 'From doing it yourself with guidance to us getting everything ready.',
      modalidad: 'How we work', sesiones: 'Sessions with our team', listo: 'What gets done', ideal: 'Ideal for',
      academia_v: 'Video academy', plantillas: 'Industry templates', agente: 'Trained AI agent',
      whatsapp: 'WhatsApp connected', pipes: 'Pipelines and workflows', embudos: 'Funnels, websites and forms',
      calendarios: 'Calendars configured', migracion: 'Migration of contacts, companies and deals', capacita: 'Team training',
      v_kick: '60-min kickoff (Pro and Scale)', v_3ses: '3 sessions', v_1a1: '1:1 consulting',
      v_1ag: '1 agent', v_varios: 'Several, tested', v_1p2w: '1 pipeline and 2 workflows', v_todos: 'As many as you need',
      incluido: 'Included', comprar: 'Buy', ver_planes: 'See plans', unico: 'one-time', ver: 'See'
    },
    pt: {
      cmp_sl: 'Compare', cmp_h: 'Tudo o que traz', cmp_hg: 'cada plano', cmp_p: 'Veja módulo por módulo o que cada plano inclui.',
      dif: 'Só diferenças', basico: 'O essencial', usuarios: 'Usuários', contactos: 'Contatos', ia: 'IA incluída por mês',
      mods: 'Módulos', inc: 'Inclui', soporte: 'Suporte', academia: 'Academia', ent: 'Só Enterprise',
      medida: 'Sob medida', ilim: 'Ilimitados', mes: '/mês', anio: '/ano', pop: 'O mais escolhido', recom: 'Recomendada', servicio: 'O serviço', elegir: 'Escolher',
      icmp_sl: 'Compare', icmp_h: 'Qual implementação', icmp_hg: 'combina com você?', icmp_p: 'De fazer você mesmo com orientação a deixarmos tudo pronto.',
      modalidad: 'Como trabalhamos', sesiones: 'Sessões com nossa equipe', listo: 'O que fica pronto', ideal: 'Ideal para',
      academia_v: 'Academia em vídeo', plantillas: 'Modelos por setor', agente: 'Agente de IA treinado',
      whatsapp: 'WhatsApp conectado', pipes: 'Pipelines e workflows', embudos: 'Funis, sites e formulários',
      calendarios: 'Calendários configurados', migracion: 'Migração de contatos, empresas e negócios', capacita: 'Treinamento da equipe',
      v_kick: 'Kickoff de 60 min (Pro e Scale)', v_3ses: '3 sessões', v_1a1: 'Consultoria 1 a 1',
      v_1ag: '1 agente', v_varios: 'Vários, testados', v_1p2w: '1 pipeline e 2 workflows', v_todos: 'Quantos precisar',
      incluido: 'Incluído', comprar: 'Comprar', ver_planes: 'Ver planos', unico: 'pagamento único', ver: 'Ver'
    }
  }[L];
  var NIV = {es: ['Lo haces tú, con guía', 'Lo hacemos contigo', 'Lo hacemos por ti'],
             en: ['You do it, with guidance', 'We do it with you', 'We do it for you'],
             pt: ['Você faz, com orientação', 'Fazemos com você', 'Fazemos por você']}[L];
  if (!TX) return;
  var LOC = L === 'en' ? 'en-US' : (L === 'pt' ? 'pt-BR' : 'es-CL');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SI = {__si: 1}, NO = {__no: 1};

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function svgCheck() {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    p.setAttribute('points', '20 6 9 17 4 12'); s.appendChild(p);
    return s;
  }
  function norm(t) { return String(t || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim(); }
  function sinIdeal(t) { return String(t || '').replace(/^\s*ideal (para|for)\s*:\s*/i, ''); }
  function cap(t) { t = String(t || '').trim(); return t.charAt(0).toUpperCase() + t.slice(1); }
  function num(n) { return Number(n).toLocaleString(LOC, {maximumFractionDigits: 0}); }

  // ---------- Lectura de un plan de la API ----------
  var RE_SOP = /soporte|support|suporte|kickoff|\bcsm\b/i;
  var RE_ACAD = /academ/i;
  function leerPlan(pl) {
    var d = {mods: [], inc: [], ia: null, sop: [], acad: null};
    var sec = null;
    (pl.features || []).forEach(function (f, i) {
      var t = String(f).trim();
      if (!t || /^ideal (para|for)/i.test(t)) return;
      if (i === 0 && /\d|ilimit|unlimit/i.test(t) && !/:\s*$/.test(t)) return;   // «5 usuarios y …»
      if (/:\s*$/.test(t)) { sec = /^(incluye|includes|inclui)/i.test(t) ? 'inc' : 'mods'; return; }
      var ia = t.match(/US\$\s?([\d.,]+)/);
      if (ia && /\b(IA|AI)\b/.test(t)) { d.ia = 'US$' + ia[1]; return; }
      if (RE_ACAD.test(t)) { d.acad = cap(t.replace(/academ(ia|y)\s*/i, '').trim() || t); return; }
      if (RE_SOP.test(t)) { d.sop.push(t); return; }
      (sec === 'inc' ? d.inc : d.mods).push(t);
    });
    return d;
  }

  // ---------- Construcción genérica de la tabla ----------
  // cols: [{nombre, precio, per, nota, pop, cta:{txt, fn|href}}]
  // grupos: [{tit, filas:[{lbl, vals:[SI|NO|texto]}]}]
  function tabla(cols, grupos, opts) {
    var n = cols.length;
    var w = el('div', 'p27x' + (opts.cls ? ' ' + opts.cls : ''));
    w.style.setProperty('--n', n);
    var popI = -1; cols.forEach(function (c, i) { if (c.pop) popI = i; });

    var bar = el('div', 'p27x-bar');
    if (opts.diferencias) {
      var sw = el('label', 'p27x-sw');
      var cb = el('input'); cb.type = 'checkbox';
      sw.appendChild(cb); sw.appendChild(el('span', 'p27x-sw-k')); sw.appendChild(el('span', 'p27x-sw-t', TX.dif));
      cb.addEventListener('change', function () { w.classList.toggle('p27x-dif', cb.checked); });
      bar.appendChild(sw);
    }
    w.appendChild(bar);

    var t = el('div', 'p27x-t'); t.setAttribute('role', 'table');
    // Columna destacada: una capa detrás de las celdas, de arriba abajo.
    if (popI >= 0) { var hl = el('div', 'p27x-hl'); hl.style.setProperty('--c', popI); hl.setAttribute('aria-hidden', 'true'); t.appendChild(hl); }

    var head = el('div', 'p27x-row p27x-head'); head.setAttribute('role', 'row');
    head.appendChild(el('div', 'p27x-lbl p27x-corner'));
    cols.forEach(function (c, i) {
      var h = el('div', 'p27x-cell p27x-ch' + (c.pop ? ' pop' : '')); h.setAttribute('role', 'columnheader'); h.dataset.c = i;
      if (c.pop) h.appendChild(el('span', 'p27x-pop', opts.pop || TX.pop));
      h.appendChild(el('div', 'p27x-cn', c.nombre));
      var pr = el('div', 'p27x-cp'); pr.textContent = c.precio;
      if (c.per) pr.appendChild(el('small', null, c.per));
      h.appendChild(pr);
      if (c.nota) h.appendChild(el('div', 'p27x-cnota', c.nota));
      head.appendChild(h);
    });
    t.appendChild(head);

    grupos.forEach(function (g) {
      if (!g.filas.length) return;
      var gw = el('div', 'p27x-g'); gw.setAttribute('role', 'rowgroup');
      var gh = el('button', 'p27x-gh'); gh.type = 'button'; gh.setAttribute('aria-expanded', 'true');
      gh.appendChild(el('span', null, g.tit));
      gh.appendChild(el('i', 'p27x-chev'));
      gh.addEventListener('click', function () {
        var c = gw.classList.toggle('cerrado'); gh.setAttribute('aria-expanded', c ? 'false' : 'true');
      });
      gw.appendChild(gh);
      var body = el('div', 'p27x-gb');
      g.filas.forEach(function (f, fi) {
        var r = el('div', 'p27x-row'); r.setAttribute('role', 'row');
        r.style.setProperty('--d', (fi * 35) + 'ms');
        var claves = f.vals.map(function (v) { return v === SI ? 's' : (v === NO ? 'n' : String(v)); });
        if (claves.every(function (k) { return k === claves[0]; })) r.classList.add('p27x-igual');
        var lb = el('div', 'p27x-lbl', f.lbl); lb.setAttribute('role', 'rowheader'); r.appendChild(lb);
        f.vals.forEach(function (v, i) {
          var c = el('div', 'p27x-cell' + (i === popI ? ' pop' : '')); c.setAttribute('role', 'cell'); c.dataset.c = i;
          c.dataset.col = cols[i].nombre;
          if (v === SI) { var k = el('span', 'p27x-ok'); k.appendChild(svgCheck()); k.setAttribute('aria-label', '✓'); c.appendChild(k); }
          else if (v === NO) { var x = el('span', 'p27x-no', '—'); x.setAttribute('aria-label', '—'); c.appendChild(x); }
          else c.appendChild(el('span', 'p27x-v', v));
          r.appendChild(c);
        });
        body.appendChild(r);
      });
      gw.appendChild(body);
      t.appendChild(gw);
    });

    var foot = el('div', 'p27x-row p27x-foot'); foot.setAttribute('role', 'row');
    foot.appendChild(el('div', 'p27x-lbl'));
    cols.forEach(function (c, i) {
      var f = el('div', 'p27x-cell' + (c.pop ? ' pop' : '')); f.dataset.c = i;
      if (c.cta) {
        var b = el(c.cta.href ? 'a' : 'button', 'btn ' + (c.pop ? 'bs' : 'bo'), c.cta.txt);
        if (c.cta.href) b.href = c.cta.href; else { b.type = 'button'; b.addEventListener('click', c.cta.fn); }
        f.appendChild(b);
      }
      foot.appendChild(f);
    });
    t.appendChild(foot);
    w.appendChild(t);

    // Columna bajo el puntero: se ilumina entera.
    t.addEventListener('pointerover', function (e) {
      var c = e.target.closest && e.target.closest('[data-c]');
      t.dataset.hc = c ? c.dataset.c : '';
    });
    t.addEventListener('pointerleave', function () { t.dataset.hc = ''; });
    return w;
  }

  function entrada(w) {
    if (reduce || !('IntersectionObserver' in window)) { w.classList.add('p27x-vis'); return; }
    var gs = w.querySelectorAll('.p27x-g, .p27x-head, .p27x-foot');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('p27x-on'); io.unobserve(e.target); } });
    }, {threshold: 0.12});
    gs.forEach(function (g) { io.observe(g); });
  }

  function seccion(id, sl, h, hg, p) {
    var s = document.getElementById(id);
    if (!s) {
      s = el('div', 'p27x-sec'); s.id = id;
      var hd = el('div', 'impl-head');
      hd.appendChild(el('span', 'sl', sl));
      var h2 = el('h2'); h2.appendChild(document.createTextNode(h + ' ')); h2.appendChild(el('span', 'tg', hg));
      hd.appendChild(h2); hd.appendChild(el('p', null, p));
      s.appendChild(hd);
    }
    return s;
  }
  function poner(s, w) {
    var viejo = s.querySelector('.p27x');
    var dif = viejo && viejo.classList.contains('p27x-dif');
    var cerrados = viejo ? Array.prototype.map.call(viejo.querySelectorAll('.p27x-g'), function (g) { return g.classList.contains('cerrado'); }) : [];
    if (viejo) {
      // Re-render por el cambio mensual/anual: sin volver a animar ni perder lo elegido.
      w.classList.add('p27x-vis');
      if (dif) { w.classList.add('p27x-dif'); w.querySelector('.p27x-sw input').checked = true; }
      w.querySelectorAll('.p27x-g').forEach(function (g, i) { if (cerrados[i]) g.classList.add('cerrado'); });
      s.replaceChild(w, viejo);
    } else { s.appendChild(w); entrada(w); }
    medir(w);
  }
  // La franja destacada se ubica con el ancho real de la columna de etiquetas.
  function medir(w) {
    var t = w.querySelector('.p27x-t'), c = w.querySelector('.p27x-corner');
    if (!t || !c) return;
    var lw = getComputedStyle(c).display === 'none' ? 0 : c.getBoundingClientRect().width;
    t.style.setProperty('--lwpx', lw + 'px');
  }
  window.addEventListener('resize', function () {
    document.querySelectorAll('.p27x').forEach(medir);
  }, {passive: true});

  // ---------- Planes ----------
  function planes(o) {
    var subs = o.planes.filter(function (p) { return p.tipo !== 'pago_unico'; });
    if (!subs.length) return;
    var T27 = o.T27 || {};
    var anual = o.intervalo === 'anual';
    var datos = subs.map(leerPlan);

    var cols = subs.map(function (pl) {
      var esA = anual && pl.precio_anual;
      return {nombre: pl.nombre, pop: !!pl.destacado,
              precio: '$' + num(esA ? pl.precio_anual : pl.precio_mensual),
              per: ' ' + (pl.moneda || 'USD') + (esA ? TX.anio : TX.mes),
              cta: {txt: TX.elegir, fn: function () { o.abrir(pl); }}};
    });
    cols.push({nombre: 'Enterprise', precio: T27.ent_precio || TX.medida, cta: {txt: T27.ent_btn || TX.elegir, href: '#enterprise'}});
    var N = cols.length;
    function fila(lbl, vals) { return {lbl: lbl, vals: vals}; }

    // Lo esencial
    var ess = [];
    ess.push(fila(TX.usuarios, subs.map(function (p) { var u = (p.limites || {}).usuarios_max; return u ? num(u) : TX.ilim; }).concat([TX.medida])));
    ess.push(fila(TX.contactos, subs.map(function (p) { var c = (p.limites || {}).contactos_max; return c ? num(c) : TX.ilim; }).concat([TX.medida])));
    ess.push(fila(TX.ia, datos.map(function (d) { return d.ia || NO; }).concat([TX.medida])));

    // Módulos: tal cual por plan (Scale los nombra todos).
    var orden = [], vistos = {};
    function sumar(lista) { lista.forEach(function (t) { var k = norm(t); if (!vistos[k]) { vistos[k] = t; orden.push(k); } }); }
    datos.slice().reverse().forEach(function (d) { sumar(d.mods); });
    var mods = orden.map(function (k) {
      var corto = datos.map(function (d) { return d.mods.filter(function (t) { return norm(t) === k; })[0]; });
      var lbl = corto.filter(Boolean).sort(function (a, b) { return a.length - b.length; })[0] || vistos[k];
      return fila(lbl, datos.map(function (d) { return d.mods.some(function (t) { return norm(t) === k; }) ? SI : NO; }).concat([SI]));
    });
    if (datos.some(function (d) { return d.acad; })) {
      mods.push(fila(TX.academia, datos.map(function (d) { return d.acad || NO; }).concat([datos[datos.length - 1].acad || SI])));
    }

    // Incluye: acumulado (cada plan trae lo del anterior).
    var oInc = [], vInc = {};
    datos.forEach(function (d) { d.inc.forEach(function (t) { var k = norm(t); if (!vInc[k]) { vInc[k] = t; oInc.push(k); } }); });
    var inc = oInc.map(function (k) {
      var desde = -1;
      datos.forEach(function (d, i) { if (desde < 0 && d.inc.some(function (t) { return norm(t) === k; })) desde = i; });
      return fila(vInc[k], datos.map(function (d, i) { return i >= desde ? SI : NO; }).concat([SI]));
    });
    // Soporte: lo que no menciona «soporte» (el kickoff) se arrastra; lo que sí, reemplaza.
    var acc = [];
    var sop = datos.map(function (d) {
      d.sop.forEach(function (t) {
        if (/soporte|support|suporte/i.test(t)) acc = acc.filter(function (x) { return !/soporte|support|suporte/i.test(x); });
        acc.push(t);
      });
      return acc.length ? acc.join(' · ') : NO;
    });
    var entSop = (T27.ent_feats || []).filter(function (t) { return /\bsla\b|\bcsm\b/i.test(t); });
    sop.push(entSop.length ? entSop.join(' · ') : SI);
    inc.push(fila(TX.soporte, sop));

    // Solo Enterprise
    var ent = (T27.ent_feats || []).slice(1).filter(function (t) { return !/\bsla\b|\bcsm\b/i.test(t); })
      .map(function (t) { return fila(t, datos.map(function () { return NO; }).concat([SI])); });

    var grupos = [{tit: TX.basico, filas: ess}, {tit: TX.mods, filas: mods}, {tit: TX.inc, filas: inc}, {tit: TX.ent, filas: ent}];
    var w = tabla(cols, grupos, {diferencias: true, cls: 'p27x-planes'});
    var s = seccion('comparar', TX.cmp_sl, TX.cmp_h, TX.cmp_hg, TX.cmp_p);
    var ancla = document.getElementById('note') || document.getElementById('pgrid');
    if (!s.parentNode && ancla) ancla.parentNode.insertBefore(s, ancla.nextSibling);
    poner(s, w);
    return N;
  }

  // ---------- Implementación ----------
  function implementacion(o) {
    var T27 = o.T27 || {}, X = o.P27X || {};
    var g = o.planes.filter(function (p) { return p.slug === 'implementacion-guiada'; })[0];
    var e = o.planes.filter(function (p) { return p.slug === 'elite-setup'; })[0];
    if (!g || !e) return;
    var cols = [
      {nombre: 'Kickstart', precio: T27.kick_precio || TX.incluido, nota: T27.kick_per, cta: {txt: TX.ver_planes, href: '#planes'}},
      {nombre: g.nombre, pop: true, precio: '$' + num(g.precio_mensual), per: ' ' + (g.moneda || 'USD'),
       nota: (g.reglas || {}).gratis_con_plan_anual ? X.gratis_txt : TX.unico, cta: {txt: TX.comprar, fn: function () { o.abrir(g); }}},
      {nombre: e.nombre, precio: '$' + num(e.precio_mensual), per: ' ' + (e.moneda || 'USD'),
       nota: (e.reglas || {}).cuotas ? X.cuotas_txt : TX.unico, cta: {txt: TX.comprar, fn: function () { o.abrir(e); }}}
    ];
    function f(lbl, a, b, c) { return {lbl: lbl, vals: [a, b, c]}; }
    var grupos = [
      {tit: TX.servicio, filas: [
        f(TX.modalidad, NIV[0], NIV[1], NIV[2]),
        f(TX.sesiones, TX.v_kick, TX.v_3ses, TX.v_1a1),
        f(TX.ideal, cap(T27.kick_desc || ''), cap(sinIdeal(g.ideal_para)), cap(sinIdeal(e.ideal_para)))
      ]},
      {tit: TX.listo, filas: [
        f(TX.academia_v, SI, SI, SI),
        f(TX.plantillas, SI, SI, SI),
        f(TX.agente, NO, TX.v_1ag, TX.v_varios),
        f(TX.whatsapp, NO, SI, SI),
        f(TX.pipes, NO, TX.v_1p2w, TX.v_todos),
        f(TX.calendarios, NO, NO, SI),
        f(TX.embudos, NO, NO, SI),
        f(TX.migracion, NO, NO, SI),
        f(TX.capacita, NO, NO, SI)
      ]}
    ];
    var w = tabla(cols, grupos, {cls: 'p27x-impl', pop: TX.recom});
    var s = seccion('comparar-impl', TX.icmp_sl, TX.icmp_h, TX.icmp_hg, TX.icmp_p);
    var ig = document.getElementById('igrid');
    if (!s.parentNode && ig) ig.parentNode.insertBefore(s, ig.nextSibling);
    poner(s, w);
  }

  window.HapeeComparar = {
    render: function (o) {
      try { planes(o); } catch (err) { if (window.console) console.warn('comparador de planes', err); }
      try { implementacion(o); } catch (err) { if (window.console) console.warn('comparador de implementación', err); }
    }
  };
})();

/* Pricing 2027 · presentación de planes e implementación (home y /planes, es/en/pt).
   No cambia precios ni textos de venta: toma las tarjetas que ya están en la página
   (estáticas en el home, armadas desde la API en /planes) y las reorganiza:
   - 3 planes en fila; Enterprise sale de la grilla y pasa a una franja ancha abajo.
   - Usuarios, contactos e IA incluida como cifras arriba; el botón sube.
   - Cada plan muestra lo que AGREGA sobre el anterior («Todo lo de Esencial, más:»)
     y el detalle completo queda en «Ver todo lo que incluye».
   - En el teléfono los planes son un carrusel con pestañas, partiendo por el destacado.
   - Implementación: tres niveles con medidor, con otra forma que los planes. */
(function () {
  var L = (document.documentElement.lang || 'es').slice(0, 2);
  var TX = {
    es: {mas: 'Todo lo de {p}, más:', todo: 'Ver todo lo que incluye', menos: 'Ocultar detalle',
         ia: 'de IA al mes', mods: 'Módulos', inc: 'Incluye', ilim: 'Ilimitados',
         niveles: ['Lo haces tú, con guía', 'Lo hacemos contigo', 'Lo hacemos por ti'],
         nivel: 'Nivel de acompañamiento', planes: 'Planes', desliza: 'Desliza para comparar'},
    en: {mas: 'Everything in {p}, plus:', todo: 'See everything included', menos: 'Hide details',
         ia: 'of AI per month', mods: 'Modules', inc: 'Includes', ilim: 'Unlimited',
         niveles: ['You do it, with guidance', 'We do it with you', 'We do it for you'],
         nivel: 'Level of support', planes: 'Plans', desliza: 'Swipe to compare'},
    pt: {mas: 'Tudo do {p}, mais:', todo: 'Ver tudo o que inclui', menos: 'Ocultar detalhes',
         ia: 'de IA por mês', mods: 'Módulos', inc: 'Inclui', ilim: 'Ilimitados',
         niveles: ['Você faz, com orientação', 'Fazemos com você', 'Fazemos por você'],
         nivel: 'Nível de acompanhamento', planes: 'Planos', desliza: 'Deslize para comparar'}
  }[L] || null;
  if (!TX) TX = {};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var prevPrecio = {};

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function check() {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor'); s.setAttribute('stroke-width', '2.6');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    p.setAttribute('points', '20 6 9 17 4 12'); s.appendChild(p);
    return s;
  }
  function norm(t) {
    return String(t || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  }
  function titulo(t) {
    t = String(t || '').trim();
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }
  function textoLi(li) { return (li.textContent || '').replace(/\s+/g, ' ').trim(); }

  // «5 usuarios y 15.000 contactos» → [{n:'5', t:'usuarios'}, {n:'15.000', t:'contactos'}]
  function cifras(txt) {
    var partes = txt.split(/\s+(?:y|and|e)\s+/i);
    if (partes.length !== 2) return null;
    var out = [];
    for (var i = 0; i < partes.length; i++) {
      var p = partes[i].trim(), m = p.match(/^([\d.,]+)\s+(.+)$/);
      if (m) { out.push({n: m[1], t: m[2]}); continue; }
      var w = p.split(/\s+/);
      var ilim = w.filter(function (x) { return /^(ilimitad|unlimited)/i.test(x); });
      if (!ilim.length) return null;
      out.push({n: '∞', t: w.filter(function (x) { return ilim.indexOf(x) < 0; }).join(' ')});
    }
    return out;
  }

  // Lee una tarjeta de plan: secciones, cifras e IA incluida.
  function leer(host) {
    var lis = host.querySelectorAll('.pc-feats > li');
    var d = {stats: null, ia: null, secs: [], items: []};
    var sec = {tit: '', items: []};
    for (var i = 0; i < lis.length; i++) {
      var t = textoLi(lis[i]);
      if (i === 0 && !d.stats) { var c = cifras(t); if (c) { d.stats = c; continue; } }
      var ia = t.match(/US\$\s?([\d.,]+)\s.*\b(IA|AI)\b/);
      if (ia && !d.ia) { d.ia = 'US$' + ia[1]; continue; }
      if (lis[i].classList.contains('inc') || /:\s*$/.test(t)) {
        if (sec.items.length || sec.tit) d.secs.push(sec);
        sec = {tit: t.replace(/:\s*$/, ''), items: []};
        continue;
      }
      sec.items.push(t); d.items.push(t);
    }
    if (sec.items.length || sec.tit) d.secs.push(sec);
    return d;
  }

  function lista(items) {
    var ul = el('ul', 'p27-list');
    items.forEach(function (t) {
      var li = el('li'); li.appendChild(check()); li.appendChild(el('span', '', t)); ul.appendChild(li);
    });
    return ul;
  }
  function secciones(secs) {
    var box = el('div', 'p27-secs');
    secs.forEach(function (s) {
      if (!s.items.length) return;
      var w = el('div', 'p27-sec');
      if (s.tit) w.appendChild(el('div', 'p27-lbl', s.tit));
      if (/m[oó]dul/i.test(s.tit)) {
        var ch = el('div', 'p27-chips');
        s.items.forEach(function (t) { ch.appendChild(el('span', 'p27-chip', t)); });
        w.appendChild(ch);
      } else {
        w.appendChild(lista(s.items));
      }
      box.appendChild(w);
    });
    return box;
  }

  function contar(nodo, clave) {
    var fin = parseInt(String(nodo.textContent).replace(/[^\d]/g, ''), 10);
    if (!fin || reduce) { prevPrecio[clave] = fin; return; }
    var ini = prevPrecio[clave] || 0, t0 = null, dur = ini ? 550 : 1100;
    prevPrecio[clave] = fin;
    if (ini === fin) return;
    function paso(ts) {
      if (!t0) { t0 = ts; nodo.textContent = ini.toLocaleString('es-CL'); }
      var k = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      nodo.textContent = Math.round(ini + (fin - ini) * e).toLocaleString('es-CL');
      if (k < 1) requestAnimationFrame(paso);
    }
    if (ini || !('IntersectionObserver' in window)) { requestAnimationFrame(paso); return; }
    // La primera vez cuenta recién cuando el precio entra en pantalla.
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); requestAnimationFrame(paso); }
    }, {threshold: 0.6});
    io.observe(nodo);
  }

  function spot(card) {
    var s = el('span', 'p27-spot'); s.setAttribute('aria-hidden', 'true');
    card.appendChild(s);
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  function planCard(card, previo) {
    var host = card.querySelector('.pc-inner') || card;
    var d = leer(host);
    var name = host.querySelector('.pc-name');
    var nombre = name ? name.textContent.trim() : '';
    var btn = host.querySelector(':scope > .btn');
    var per = host.querySelector('.pc-per');
    var ideal = host.querySelector('.pc-ideal');
    var feats = host.querySelector('.pc-feats');

    // Cifras: usuarios · contactos · IA incluida
    if (d.stats || d.ia) {
      var st = el('div', 'p27-stats');
      (d.stats || []).forEach(function (c) {
        var b = el('div', 'p27-stat');
        b.appendChild(el('b', '', c.n));
        b.appendChild(el('span', '', c.n === '∞' ? c.t : c.t));
        st.appendChild(b);
      });
      if (d.ia) {
        var b2 = el('div', 'p27-stat');
        b2.appendChild(el('b', '', d.ia)); b2.appendChild(el('span', '', TX.ia));
        st.appendChild(b2);
      }
      (per || host.querySelector('.pc-price')).after(st);
      if (btn) st.after(btn);
    }

    var cuerpo = el('div', 'p27-body');
    if (previo) {
      var nuevos = d.items.filter(function (t) {
        return previo.vistos.indexOf(norm(t)) < 0;
      });
      cuerpo.appendChild(el('div', 'p27-lbl p27-mas', (TX.mas || '').replace('{p}', titulo(previo.nombre))));
      cuerpo.appendChild(lista(nuevos));
      var det = el('details', 'p27-all');
      var sm = el('summary', '', TX.todo);
      det.appendChild(sm);
      det.appendChild(secciones(d.secs));
      det.addEventListener('toggle', function () { sm.textContent = det.open ? TX.menos : TX.todo; });
      cuerpo.appendChild(det);
    } else {
      cuerpo.appendChild(secciones(d.secs));
    }
    if (feats) feats.replaceWith(cuerpo); else host.appendChild(cuerpo);
    if (ideal) cuerpo.after(ideal);

    var val = host.querySelector('.pc-val');
    if (val && !val.classList.contains('pc-txt')) contar(val, nombre);
    card.classList.add('p27-card');
    spot(card);
    return {nombre: nombre, vistos: d.items.map(norm).concat(previo ? previo.vistos : [])};
  }

  function franjaEnterprise(card, grid) {
    var host = card.querySelector('.pc-inner') || card;
    var f = el('div', 'p27-ent');
    var izq = el('div', 'p27-ent-izq'), med = el('div', 'p27-ent-med'), der = el('div', 'p27-ent-der');
    var nm = host.querySelector('.pc-name');
    if (nm) izq.appendChild(el('span', 'p27-ent-tag', nm.textContent.trim()));
    var pr = host.querySelector('.pc-val');
    if (pr) izq.appendChild(el('div', 'p27-ent-precio', pr.textContent.trim()));
    var ds = host.querySelector('.pc-desc');
    if (ds) izq.appendChild(el('p', 'p27-ent-desc', ds.textContent.trim()));
    var lis = host.querySelectorAll('.pc-feats > li'), items = [], tit = '';
    for (var i = 0; i < lis.length; i++) {
      var t = textoLi(lis[i]);
      if (lis[i].classList.contains('inc') || /:\s*$/.test(t)) tit = t; else items.push(t);
    }
    if (tit) med.appendChild(el('div', 'p27-lbl', tit));
    var ul = lista(items); ul.classList.add('p27-dos'); med.appendChild(ul);
    var btn = host.querySelector('.btn'); if (btn) { btn.classList.remove('bo'); btn.classList.add('bs'); der.appendChild(btn); }
    var per = host.querySelector('.pc-per'); if (per) der.appendChild(el('div', 'p27-ent-per', per.textContent.trim()));
    f.appendChild(izq); f.appendChild(med); f.appendChild(der);
    spot(f);
    card.remove();
    grid.after(f);
  }

  // Carrusel del teléfono: pestañas sincronizadas con el scroll.
  function carrusel(grid, cards) {
    var tabs = el('div', 'p27-tabs'); tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', TX.planes);
    var bts = cards.map(function (c, i) {
      var nm = (c.querySelector('.pc-name') || {}).textContent || ('#' + (i + 1));
      c.dataset.p27n = nm.trim();
      var b = el('button', 'p27-tab', titulo(nm)); b.type = 'button'; b.setAttribute('role', 'tab');
      b.addEventListener('click', function () {
        grid.scrollTo({left: c.offsetLeft - (grid.clientWidth - c.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth'});
      });
      tabs.appendChild(b);
      return b;
    });
    grid.before(tabs);
    function activo() {
      var centro = grid.scrollLeft + grid.clientWidth / 2, mejor = 0, dist = 1e9;
      cards.forEach(function (c, i) {
        var dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - centro);
        if (dd < dist) { dist = dd; mejor = i; }
      });
      if (cards[mejor]) grid.dataset.activo = cards[mejor].dataset.p27n;
      bts.forEach(function (b, i) {
        b.classList.toggle('on', i === mejor); b.setAttribute('aria-selected', i === mejor ? 'true' : 'false');
      });
    }
    grid.addEventListener('scroll', function () { requestAnimationFrame(activo); }, {passive: true});
    var previo = grid.dataset.activo;
    var dest = cards.filter(function (c) { return previo && c.dataset.p27n === previo; })[0] ||
      cards.filter(function (c) { return c.classList.contains('pop'); })[0];
    function centrar() {
      if (getComputedStyle(grid).overflowX === 'visible' || !dest) { activo(); return; }
      grid.scrollLeft = dest.offsetLeft - (grid.clientWidth - dest.offsetWidth) / 2;
      activo();
    }
    requestAnimationFrame(centrar);
  }

  function entrada(nodos) {
    if (reduce || !('IntersectionObserver' in window)) return;
    nodos.forEach(function (n, i) { n.classList.add('p27-in'); n.style.setProperty('--d', (i * 90) + 'ms'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('p27-vis'); io.unobserve(e.target); } });
    }, {threshold: 0.12});
    nodos.forEach(function (n) { io.observe(n); });
  }

  function planes(grid) {
    var sec = grid.closest('.pricing'); if (sec) sec.classList.add('p27');
    var vieja = sec && sec.querySelector('.p27-ent'); if (vieja) vieja.remove();
    var vtabs = sec && sec.querySelector('.p27-tabs'); if (vtabs) vtabs.remove();
    grid.classList.remove('g4'); grid.classList.add('p27-grid');
    var cards = Array.prototype.slice.call(grid.querySelectorAll(':scope > .pc'));
    var ent = cards.filter(function (c) {
      return c.classList.contains('pc-ent') || /enterprise/i.test(c.getAttribute('aria-label') || '') ||
        /enterprise/i.test(((c.querySelector('.pc-name') || {}).textContent) || '');
    })[0];
    var planesC = cards.filter(function (c) { return c !== ent; });
    var prev = null;
    planesC.forEach(function (c) { prev = planCard(c, prev); });
    if (ent) franjaEnterprise(ent, grid);
    carrusel(grid, planesC);
    if (!grid.dataset.p27) { entrada(planesC.concat(ent ? [sec.querySelector('.p27-ent')] : [])); }
    grid.dataset.p27 = '1';
  }

  function implementacion(grid) {
    grid.classList.add('p27-impl');
    var cs = Array.prototype.slice.call(grid.querySelectorAll(':scope > .ic'));
    cs.forEach(function (c, i) {
      if (c.querySelector('.p27-lvl')) return;
      var n = Math.min(i, 2);
      c.classList.add('p27-ic', 'lv' + (n + 1));
      c.appendChild(el('span', 'p27-num', '0' + (i + 1))).setAttribute('aria-hidden', 'true');
      var lv = el('div', 'p27-lvl');
      lv.setAttribute('aria-label', TX.nivel + ': ' + (n + 1) + '/3');
      var bar = el('span', 'p27-bar');
      for (var k = 0; k < 3; k++) bar.appendChild(el('i', k <= n ? 'on' : ''));
      lv.appendChild(bar); lv.appendChild(el('span', '', TX.niveles[n]));
      var tag = c.querySelector('.ic-tag');
      (tag || c.firstChild).after(lv);
      spot(c);
    });
    if (!grid.dataset.p27) entrada(cs);
    grid.dataset.p27 = '1';
  }

  window.HapeePricing27 = {planes: planes, implementacion: implementacion};

  function auto() {
    document.querySelectorAll('[data-p27-auto] .pgrid').forEach(planes);
    document.querySelectorAll('[data-p27-auto] .igrid').forEach(implementacion);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto); else auto();
})();

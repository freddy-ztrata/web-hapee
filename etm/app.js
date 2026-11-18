/* Hapee · ETM Day — app del stand (offline-first, sin dependencias). */
(function () {
  'use strict';

  // ───────────────────────── Contenido ─────────────────────────
  var PREGUNTAS = [
    { t: '¿Cuánto te demoras en responder a un cliente nuevo?',
      o: ['Menos de 5 min', 'Menos de 1 hora', 'El mismo día', 'Al día siguiente o más'] },
    { t: '¿Dónde llevas a tus clientes hoy?',
      o: ['Un CRM', 'Excel o planillas', 'WhatsApp y memoria', 'No llevo registro'] },
    { t: '¿Cuántos contactos nuevos te llegan al mes?',
      o: ['Menos de 50', '50 a 200', '200 a 1.000', 'Más de 1.000'] }
  ];
  var RESULTADOS = {
    BAJO: '¡Vas bien! Respondes rápido y tienes orden. Con Hapee lo automatizas y creces sin perder el ritmo.',
    MEDIO: 'Ojo: algunos clientes se te están enfriando. Hapee responde al instante, 24/7, y no se te escapa ninguno.',
    ALTO: 'Podrías estar perdiendo 3 de cada 10 clientes. Eso es justo lo que resuelve Hapee.'
  };
  var PREMIOS_DEF = ['Sigue participando', 'Café', 'Merch Hapee', 'Mes gratis de Hapee', 'Asesoría 1:1'];
  var COLUMNAS = ['id_participante', 'tablet', 'fecha_hora', 'nombre', 'whatsapp', 'empresa', 'cargo', 'email',
    'p1', 'p2', 'p3', 'puntaje', 'nivel_riesgo', 'premio', 'quiere_demo', 'consentimiento'];

  var INACTIVIDAD = 60 * 1000, INACTIVIDAD_ADMIN = 3 * 60 * 1000, PULSACION_LOGO = 3000;
  var LS_REG = 'hapee-etm-registros', LS_CFG = 'hapee-etm-config';
  var DB_NOMBRE = 'hapee-etm', DB_VER = 1;

  // ───────────────────────── Utilidades ─────────────────────────
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function uid() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }
  var aviso_t;
  function aviso(txt) {
    var a = $('#aviso'); a.textContent = txt; a.hidden = false;
    clearTimeout(aviso_t); aviso_t = setTimeout(function () { a.hidden = true; }, 3200);
  }
  // Fecha y hora de Chile «YYYY-MM-DD HH:mm:ss» (si el navegador no conoce la zona, hora local)
  function fechaChile(ms) {
    var d = new Date(ms);
    try {
      var p = {};
      new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
        .formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      if (p.year) return p.year + '-' + p.month + '-' + p.day + ' ' + (p.hour === '24' ? '00' : p.hour) + ':' + p.minute + ':' + p.second;
    } catch (e) {}
    return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2) + ' ' +
      pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2);
  }
  function diaChile(ms) { return fechaChile(ms).slice(0, 10); }

  // ───────────────────────── Configuración ─────────────────────────
  var cfg = { tablet: 'A', pin: '2026', premios: PREMIOS_DEF.slice(), contador: 0, ultimoCambio: 0, ultimoExport: 0 };
  var cfgEnLS = false;
  function leerCfg() {
    try { var c = JSON.parse(localStorage.getItem(LS_CFG) || 'null'); if (c) { cfgEnLS = true; for (var k in c) cfg[k] = c[k]; } } catch (e) {}
  }
  function guardarCfg() {
    try { localStorage.setItem(LS_CFG, JSON.stringify(cfg)); } catch (e) {}
    idbPut('meta', { k: 'cfg', v: cfg });
  }

  // ───────────────────────── Almacenamiento ─────────────────────────
  // Cada registro se escribe en IndexedDB Y en localStorage. Al abrir se unen ambos por id.
  var db = null, registros = [];
  function abrirDB() {
    return new Promise(function (ok) {
      if (!('indexedDB' in window)) return ok(null);
      var listo = false, fin = function (v) { if (!listo) { listo = true; ok(v); } };
      setTimeout(function () { fin(null); }, 4000);
      try {
        var r = indexedDB.open(DB_NOMBRE, DB_VER);
        r.onupgradeneeded = function () {
          var d = r.result;
          if (!d.objectStoreNames.contains('registros')) d.createObjectStore('registros', { keyPath: 'uid' });
          if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'k' });
        };
        r.onsuccess = function () { fin(r.result); };
        r.onerror = function () { fin(null); };
        r.onblocked = function () { fin(null); };
      } catch (e) { fin(null); }
    });
  }
  function idbTx(store, modo, fn) {
    return new Promise(function (ok) {
      if (!db) return ok(null);
      try {
        var tx = db.transaction(store, modo), st = tx.objectStore(store), res = null;
        var q = fn(st); if (q) q.onsuccess = function () { res = q.result; };
        tx.oncomplete = function () { ok(res); };
        tx.onerror = tx.onabort = function () { ok(null); };
      } catch (e) { ok(null); }
    });
  }
  function idbPut(store, obj) { return idbTx(store, 'readwrite', function (st) { return st.put(JSON.parse(JSON.stringify(obj))); }); }
  function idbAll(store) { return idbTx(store, 'readonly', function (st) { return st.getAll(); }); }
  function idbGet(store, k) { return idbTx(store, 'readonly', function (st) { return st.get(k); }); }
  function idbClear(store) { return idbTx(store, 'readwrite', function (st) { return st.clear(); }); }

  function leerLS() { try { return JSON.parse(localStorage.getItem(LS_REG) || '[]') || []; } catch (e) { return []; } }
  function escribirLS() {
    try { localStorage.setItem(LS_REG, JSON.stringify(registros)); return true; }
    catch (e) { aviso('Ojo: el respaldo local está lleno. Exporta el CSV.'); return false; }
  }
  function unir(a, b) {
    var m = {};
    a.concat(b).forEach(function (r) {
      if (!r || !r.uid) return;
      var y = m[r.uid];
      if (!y || (r.actualizado || 0) > (y.actualizado || 0)) m[r.uid] = r;
    });
    return Object.keys(m).map(function (k) { return m[k]; }).sort(function (x, y) { return x.creado - y.creado; });
  }
  function guardarRegistro(r) {
    r.actualizado = Date.now();
    var i = -1; registros.forEach(function (x, j) { if (x.uid === r.uid) i = j; });
    if (i < 0) registros.push(r); else registros[i] = r;
    cfg.ultimoCambio = Date.now(); guardarCfg();
    var okLS = escribirLS();
    return idbPut('registros', r).then(function (okDB) {
      if (!okLS && okDB === null) aviso('No se pudo guardar. Avisa al equipo de Hapee.');
    });
  }
  function cargar() {
    leerCfg();
    return abrirDB().then(function (d) {
      db = d;
      return Promise.all([idbAll('registros'), idbGet('meta', 'cfg')]);
    }).then(function (res) {
      var deDB = res[0] || [], cfgDB = res[1] && res[1].v;
      if (cfgDB) {
        // Si se perdió la copia de localStorage, manda la de IndexedDB
        if (!cfgEnLS) for (var k in cfgDB) cfg[k] = cfgDB[k];
        // El contador y las marcas de tiempo nunca retroceden
        cfg.contador = Math.max(cfg.contador || 0, cfgDB.contador || 0);
        cfg.ultimoCambio = Math.max(cfg.ultimoCambio || 0, cfgDB.ultimoCambio || 0);
      }
      registros = unir(deDB, leerLS());
      // Recupera el contador desde los registros, por si ambos respaldos de config se perdieron
      registros.forEach(function (r) { if (r.tablet === cfg.tablet && r.numero > cfg.contador && !cfg.reinicio) cfg.contador = r.numero; });
      escribirLS();
      registros.forEach(function (r) { idbPut('registros', r); });
      guardarCfg();
    });
  }

  // ───────────────────────── Navegación ─────────────────────────
  var actual = 'reposo', sesion = null, ultimoToque = Date.now();
  function ir(p) {
    if (p === 'p1' && actual === 'reposo') sesion = { r: [null, null, null] };
    if (p === 'reposo') { sesion = null; limpiarForm(); }
    if (p === 'admin') pintarAdmin();
    if (p === 'pin') { pinTxt = ''; pintarPin(); }
    if (p === 'registro' && !sesion) p = 'reposo';
    if (/^p[123]$/.test(p)) pintarPregunta(+p[1] - 1);
    if (p === 'resultado') pintarResultado();
    $$('.pantalla').forEach(function (s) { s.classList.toggle('activa', s.dataset.p === p); });
    var paso = { p1: 1, p2: 2, p3: 3, resultado: 3, registro: 4 }[p] || 0;
    $('#pasos').classList.toggle('ver', paso > 0);
    $$('#pasos i').forEach(function (i, j) { i.classList.toggle('on', j < paso); });
    actual = p; ultimoToque = Date.now();
    var act = $('.pantalla.activa'); if (act) act.scrollTop = 0;
    if (document.activeElement && document.activeElement.blur && p !== 'registro') document.activeElement.blur();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ir]'); if (b) { e.preventDefault(); ir(b.dataset.ir); }
  });

  // Inactividad: 60 s en el flujo (también en «Listo»), 3 min en el panel
  ['pointerdown', 'touchstart', 'keydown', 'input', 'scroll', 'wheel'].forEach(function (ev) {
    document.addEventListener(ev, function () { ultimoToque = Date.now(); }, { passive: true, capture: true });
  });
  setInterval(function () {
    if (actual === 'reposo') return;
    var tope = (actual === 'admin' || actual === 'pin') ? INACTIVIDAD_ADMIN : INACTIVIDAD;
    if (Date.now() - ultimoToque > tope) { cerrarModal(); ir('reposo'); }
  }, 1000);

  // ───────────────────────── Preguntas ─────────────────────────
  function pintarPregunta(i) {
    var q = PREGUNTAS[i], s = $('.pantalla[data-p="p' + (i + 1) + '"]');
    s.innerHTML = '<div class="centro"><p class="num">Pregunta ' + (i + 1) + ' de 3</p><h2>' + esc(q.t) + '</h2>' +
      '<div class="opciones">' + q.o.map(function (o, j) {
        return '<button class="opcion" data-o="' + j + '"><span class="letra">' + 'ABCD'[j] + '</span><span>' + esc(o) + '</span></button>';
      }).join('') + '</div>' +
      '<button class="volver" data-volver="' + i + '">← Volver</button></div>';
  }
  var avanzando = false;
  document.addEventListener('click', function (e) {
    var o = e.target.closest('.opcion');
    if (o && sesion && !avanzando) {
      var i = +actual[1] - 1; sesion.r[i] = +o.dataset.o; o.classList.add('elegida'); avanzando = true;
      setTimeout(function () { avanzando = false; ir(i < 2 ? 'p' + (i + 2) : 'resultado'); }, 260);
      return;
    }
    var v = e.target.closest('[data-volver]');
    if (v) { var k = +v.dataset.volver; ir(k === 0 ? 'reposo' : 'p' + k); }
  });

  function puntaje(r) { return r[0] + r[1] + r[2]; }
  function nivel(p) { return p <= 3 ? 'BAJO' : p <= 6 ? 'MEDIO' : 'ALTO'; }
  function pintarResultado() {
    if (!sesion || sesion.r.indexOf(null) >= 0) return;
    var n = nivel(puntaje(sesion.r));
    var m = $('#medidor'); m.className = 'medidor ' + n.toLowerCase();
    $('#nivel').textContent = n; $('#mensaje').textContent = RESULTADOS[n];
  }

  // ───────────────────────── Registro ─────────────────────────
  var PREF_WA = '+56 9 ';
  function limpiarForm() {
    var f = $('#form'); f.reset(); f.whatsapp.value = PREF_WA;
    $$('.error', f).forEach(function (e) { e.textContent = ''; });
    $$('.mal', f).forEach(function (e) { e.classList.remove('mal'); });
  }
  // WhatsApp: Chile +56 9 XXXX XXXX (con o sin espacios/guiones). Otros países: + y 8 a 15 dígitos.
  function normalizarWA(v) {
    var s = String(v || '').replace(/[\s\-().]/g, '');
    if (/^00\d/.test(s)) s = '+' + s.slice(2);
    if (/^9\d{8}$/.test(s)) s = '+56' + s;
    if (/^569\d{8}$/.test(s)) s = '+' + s;
    if (/^\+56/.test(s)) return /^\+569\d{8}$/.test(s) ? s : null;
    if (/^\+[1-9]\d{7,14}$/.test(s)) return s;
    return null;
  }
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function err(f, nombre, msg) {
    var e = $('[data-err="' + nombre + '"]', f); e.textContent = msg || '';
    var c = f[nombre].closest('.campo, .consent'); if (c) c.classList.toggle('mal', !!msg);
    return !msg;
  }
  var guardando = false;
  $('#form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (guardando || !sesion) return;
    var f = e.target, ok = true, t = function (n) { return f[n].value.trim().replace(/\s+/g, ' '); };
    var wa = normalizarWA(f.whatsapp.value), email = t('email');
    ok = err(f, 'nombre', t('nombre').length < 2 ? 'Escribe tu nombre' : '') && ok;
    ok = err(f, 'whatsapp', !wa ? 'Revisa tu WhatsApp: +56 9 y 8 dígitos' : '') && ok;
    ok = err(f, 'empresa', !t('empresa') ? 'Escribe tu empresa' : '') && ok;
    ok = err(f, 'cargo', !t('cargo') ? 'Escribe tu cargo' : '') && ok;
    ok = err(f, 'email', email && !RE_EMAIL.test(email) ? 'Revisa tu email (o déjalo en blanco)' : '') && ok;
    ok = err(f, 'consent', !f.consent.checked ? 'Para participar debes aceptar' : '') && ok;
    if (!ok) { var m = $('.mal', f); if (m) m.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    guardando = true;
    cfg.contador = (cfg.contador || 0) + 1; cfg.reinicio = false;
    var letra = cfg.tablet || 'A', p = puntaje(sesion.r), ahora = Date.now();
    var r = {
      uid: uid(), numero: cfg.contador, id_participante: letra + '-' + pad(cfg.contador, 3), tablet: letra,
      creado: ahora, fecha_hora: fechaChile(ahora), nombre: t('nombre'), whatsapp: wa, empresa: t('empresa'),
      cargo: t('cargo'), email: email.toLowerCase(),
      p1: PREGUNTAS[0].o[sesion.r[0]], p2: PREGUNTAS[1].o[sesion.r[1]], p3: PREGUNTAS[2].o[sesion.r[2]],
      puntaje: p, nivel_riesgo: nivel(p), premio: '', quiere_demo: '', consentimiento: 'sí'
    };
    guardarRegistro(r).then(function () {
      guardando = false;
      $('#listo-nombre').textContent = r.nombre.split(' ')[0];
      $('#numero').textContent = '#' + r.id_participante;
      sesion = null; ir('listo');
    });
  });
  // El WhatsApp nunca queda sin prefijo si lo borran entero
  $('#form').whatsapp.addEventListener('blur', function () { if (!this.value.trim()) this.value = PREF_WA; });

  // ───────────────────────── Acceso oculto al panel ─────────────────────────
  var logo = $('#logo'), pulsa_t = null;
  function soltar() { clearTimeout(pulsa_t); pulsa_t = null; $('#carga-logo').classList.remove('corre'); }
  logo.addEventListener('pointerdown', function (e) {
    e.preventDefault(); soltar();
    var c = $('#carga-logo'); void c.offsetWidth; c.classList.add('corre');
    pulsa_t = setTimeout(function () { soltar(); ir('pin'); }, PULSACION_LOGO);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) { logo.addEventListener(ev, soltar); });
  logo.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  logo.addEventListener('dragstart', function (e) { e.preventDefault(); });
  document.addEventListener('contextmenu', function (e) { if (!e.target.closest('input, textarea')) e.preventDefault(); });

  var pinTxt = '';
  (function () {
    var t = $('#teclado');
    t.innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(function (k) {
      return '<button type="button" ' + (k ? 'data-k="' + k + '"' : 'class="vacio" tabindex="-1"') + '>' + k + '</button>';
    }).join('');
    t.addEventListener('click', function (e) {
      var b = e.target.closest('[data-k]'); if (!b) return;
      var k = b.dataset.k;
      if (k === '⌫') pinTxt = pinTxt.slice(0, -1); else if (pinTxt.length < 4) pinTxt += k;
      pintarPin();
      if (pinTxt.length === 4) {
        if (pinTxt === String(cfg.pin)) { setTimeout(function () { ir('admin'); }, 120); }
        else { var p = $('#pin-puntos'); p.classList.add('mal'); setTimeout(function () { p.classList.remove('mal'); pinTxt = ''; pintarPin(); }, 420); }
      }
    });
  })();
  function pintarPin() { $$('#pin-puntos i').forEach(function (i, j) { i.classList.toggle('on', j < pinTxt.length); }); }

  // ───────────────────────── Panel ─────────────────────────
  var filtro = 'hoy';
  function exportadoAlDia() { return cfg.ultimoExport && cfg.ultimoExport >= cfg.ultimoCambio; }
  function pintarAdmin() {
    var hoy = diaChile(Date.now());
    var deHoy = registros.filter(function (r) { return diaChile(r.creado) === hoy; });
    $('#ad-tablet').textContent = cfg.tablet;
    $('#ad-hoy').textContent = deHoy.length;
    $('#ad-total').textContent = registros.length;
    $('#ad-prox').textContent = '#' + cfg.tablet + '-' + pad((cfg.contador || 0) + 1, 3);
    $('#cfg-tablet').value = cfg.tablet; $('#cfg-pin').value = cfg.pin;
    $('#cfg-premios').value = (cfg.premios || []).join('\n');
    $('#ad-export-estado').textContent = !registros.length ? 'Aún no hay registros.' :
      exportadoAlDia() ? 'Exportado al día (' + fechaChile(cfg.ultimoExport).slice(11, 16) + ' h). ✔' :
      'Hay cambios sin exportar.';
    var b = $('#ad-borrar'); b.disabled = !(registros.length && exportadoAlDia());
    $('#ad-borrar-nota').textContent = b.disabled ? 'Solo se activa después de exportar (y si no hubo cambios después).' : 'Exportado al día: ya puedes borrar.';
    $('#ad-compartir').hidden = !puedeCompartir();
    $$('#ad-filtro button').forEach(function (x) { x.classList.toggle('on', x.dataset.f === filtro); });
    var lista = (filtro === 'hoy' ? deHoy : registros).slice().reverse();
    var premios = cfg.premios || [];
    $('#ad-lista').innerHTML = !lista.length ? '<p class="vacia">Sin registros todavía.</p>' : lista.map(function (r) {
      var enLista = !r.premio || premios.indexOf(r.premio) >= 0;
      return '<div class="reg" data-uid="' + esc(r.uid) + '">' +
        '<div class="reg-cab"><b>#' + esc(r.id_participante) + '</b><span class="quien">' + esc(r.nombre) + '</span>' +
        '<span class="det">' + esc(r.empresa) + ' · ' + esc(r.cargo) + ' · ' + esc(r.whatsapp) + ' · ' + esc(r.fecha_hora.slice(11, 16)) + '</span>' +
        '<span class="niv ' + r.nivel_riesgo + '">' + r.nivel_riesgo + '</span></div>' +
        '<div class="reg-ctl">' +
        '<select data-campo="premio" aria-label="Premio"><option value="">Premio: sin asignar</option>' +
        premios.map(function (p) { return '<option' + (p === r.premio ? ' selected' : '') + '>' + esc(p) + '</option>'; }).join('') +
        '<option value="__otro"' + (!enLista ? ' selected' : '') + '>Otro…</option></select>' +
        '<input data-campo="premio-otro" placeholder="Escribe el premio" value="' + (enLista ? '' : esc(r.premio)) + '"' + (enLista ? ' hidden' : '') + '>' +
        '<div class="demo"><span>¿Demo?</span>' +
        '<button data-demo="sí" class="' + (r.quiere_demo === 'sí' ? 'on' : '') + '">Sí</button>' +
        '<button data-demo="no" class="' + (r.quiere_demo === 'no' ? 'on' : '') + '">No</button></div>' +
        '</div></div>';
    }).join('');
    estadoOffline();
  }
  function regDe(el) { var c = el.closest('.reg'); if (!c) return null; var u = c.dataset.uid; return registros.filter(function (r) { return r.uid === u; })[0]; }
  function editar(r, cambios) {
    var n = JSON.parse(JSON.stringify(r)); for (var k in cambios) n[k] = cambios[k];
    guardarRegistro(n).then(function () { pintarAdmin(); aviso('Guardado ✔'); });
  }
  $('#ad-lista').addEventListener('change', function (e) {
    var r = regDe(e.target); if (!r) return;
    if (e.target.dataset.campo === 'premio') {
      if (e.target.value === '__otro') { var i = e.target.parentNode.querySelector('[data-campo="premio-otro"]'); i.hidden = false; i.focus(); return; }
      editar(r, { premio: e.target.value });
    } else if (e.target.dataset.campo === 'premio-otro') {
      editar(r, { premio: e.target.value.trim() });
    }
  });
  $('#ad-lista').addEventListener('click', function (e) {
    var b = e.target.closest('[data-demo]'); if (!b) return;
    var r = regDe(b); if (!r) return;
    editar(r, { quiere_demo: r.quiere_demo === b.dataset.demo ? '' : b.dataset.demo });
  });
  $('#ad-filtro').addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]'); if (b) { filtro = b.dataset.f; pintarAdmin(); }
  });

  $('#cfg-guardar').addEventListener('click', function () {
    var letra = $('#cfg-tablet').value.trim().toUpperCase(), pin = $('#cfg-pin').value.trim();
    var premios = $('#cfg-premios').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!/^[A-Z]{1,2}$/.test(letra)) return msgCfg('La letra debe ser A, B, C…');
    if (!/^\d{4}$/.test(pin)) return msgCfg('El PIN debe tener 4 dígitos.');
    cfg.tablet = letra; cfg.pin = pin; cfg.premios = premios; guardarCfg();
    pintarAdmin(); msgCfg('Configuración guardada ✔');
  });
  function msgCfg(t) { $('#cfg-msg').textContent = t; }
  $('#cfg-contador').addEventListener('click', function () {
    confirmar('¿Reiniciar la numeración? El próximo participante será #' + cfg.tablet + '-001. Úsalo solo si cambias de evento.', 'Reiniciar', function () {
      cfg.contador = 0; cfg.reinicio = true; guardarCfg(); pintarAdmin(); msgCfg('Numeración reiniciada.');
    });
  });

  // ───────────────────────── CSV ─────────────────────────
  function celda(v) {
    var s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s) && !/^\+\d+$/.test(s)) s = "'" + s; // evita fórmulas en Excel
    return /[";\r\n]/.test(s) || /^\s|\s$/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function csvTexto() {
    var filas = [COLUMNAS.join(';')].concat(registros.map(function (r) {
      return COLUMNAS.map(function (c) { return celda(r[c]); }).join(';');
    }));
    return filas.join('\r\n') + '\r\n';
  }
  function csvNombre() { return 'hapee-etm-' + cfg.tablet + '-' + diaChile(Date.now()) + '.csv'; }
  function csvBlob() { return new Blob(['﻿' + csvTexto()], { type: 'text/csv;charset=utf-8' }); }
  function marcarExport() { cfg.ultimoExport = Date.now(); guardarCfg(); pintarAdmin(); }
  function puedeCompartir() {
    try { return !!(navigator.canShare && navigator.canShare({ files: [new File(['x'], 'x.csv', { type: 'text/csv' })] })); } catch (e) { return false; }
  }
  $('#ad-csv').addEventListener('click', function () {
    if (!registros.length) return aviso('No hay registros para exportar.');
    var url = URL.createObjectURL(csvBlob()), a = document.createElement('a');
    a.href = url; a.download = csvNombre(); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    marcarExport(); aviso('CSV descargado: ' + csvNombre());
  });
  $('#ad-compartir').addEventListener('click', function () {
    if (!registros.length) return aviso('No hay registros para exportar.');
    var file = new File([csvBlob()], csvNombre(), { type: 'text/csv' });
    navigator.share({ files: [file], title: csvNombre() }).then(function () { marcarExport(); aviso('CSV compartido ✔'); })
      .catch(function (e) { if (e && e.name !== 'AbortError') aviso('No se pudo compartir. Usa «Ver / copiar CSV».'); });
  });
  $('#ad-ver').addEventListener('click', function () {
    var c = $('#csv-caja'); c.hidden = !c.hidden; if (!c.hidden) $('#csv-texto').value = csvTexto();
  });
  $('#ad-copiar').addEventListener('click', function () {
    var t = $('#csv-texto'), txt = csvTexto(); t.value = txt;
    var hecho = function () { marcarExport(); aviso('CSV copiado. Pégalo en un correo o en Notas.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(hecho, viejo); else viejo();
    function viejo() { t.focus(); t.select(); t.setSelectionRange(0, txt.length); try { if (document.execCommand('copy')) return hecho(); } catch (e) {} aviso('Selecciona el texto y cópialo a mano.'); }
  });

  // ───────────────────────── Borrar todo (doble confirmación) ─────────────────────────
  var modal_si = null;
  function confirmar(txt, si, fn) { $('#modal-txt').textContent = txt; $('#modal-si').textContent = si; modal_si = fn; $('#modal').hidden = false; }
  function cerrarModal() { $('#modal').hidden = true; modal_si = null; }
  $('#modal-no').addEventListener('click', cerrarModal);
  $('#modal-si').addEventListener('click', function () { var f = modal_si; cerrarModal(); if (f) f(); });
  $('#ad-borrar').addEventListener('click', function () {
    if (!exportadoAlDia()) return aviso('Primero exporta el CSV.');
    var n = registros.length;
    confirmar('¿Borrar los ' + n + ' registros de esta tablet? Asegúrate de tener el CSV guardado.', 'Sí, continuar', function () {
      confirmar('Última confirmación: se borran ' + n + ' registros y no se pueden recuperar.', 'Borrar definitivamente', function () {
        registros = []; escribirLS();
        idbClear('registros').then(function () { cfg.ultimoCambio = Date.now(); guardarCfg(); pintarAdmin(); aviso('Registros borrados. La numeración sigue.'); });
      });
    });
  });

  // ───────────────────────── Offline ─────────────────────────
  var persistente = null;
  function estadoOffline() {
    var e = $('#ad-estado'), sw = navigator.serviceWorker;
    var partes = function (swOk, cacheN) {
      e.innerHTML = 'Modo offline: <b class="' + (swOk && cacheN ? 'si' : 'no') + '">' + (swOk && cacheN ? 'listo' : 'no listo') + '</b>' +
        ' · Service worker: <b class="' + (swOk ? 'si' : 'no') + '">' + (swOk ? 'activo' : 'inactivo') + '</b>' +
        ' · Archivos en caché: <b class="' + (cacheN ? 'si' : 'no') + '">' + cacheN + '</b>' +
        ' · Almacenamiento persistente: <b class="' + (persistente ? 'si' : 'no') + '">' + (persistente ? 'sí' : persistente === false ? 'no' : '—') + '</b>' +
        ' · Conexión: <b>' + (navigator.onLine ? 'con internet' : 'sin internet') + '</b>' +
        ' · Base de datos: <b class="' + (db ? 'si' : 'no') + '">' + (db ? 'IndexedDB + respaldo' : 'solo respaldo') + '</b>';
    };
    var swOk = !!(sw && sw.controller);
    if (!('caches' in window)) return partes(swOk, 0);
    caches.keys().then(function (ks) {
      var mia = ks.filter(function (k) { return k.indexOf('hapee-etm-') === 0; }).pop();
      return mia ? caches.open(mia).then(function (c) { return c.keys(); }).then(function (r) { partes(swOk, r.length); }) : partes(swOk, 0);
    }).catch(function () { partes(swOk, 0); });
  }

  // ───────────────────────── Arranque ─────────────────────────
  cargar().then(function () { limpiarForm(); ir('reposo'); window.__hapeeListo = true; });
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then(function (p) { return p || navigator.storage.persist(); })
      .then(function (p) { persistente = p; }).catch(function () {});
  }
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(function () {});
    });
  }
  // Si otra pestaña cambia los datos, se recargan del respaldo
  window.addEventListener('storage', function (e) { if (e.key === LS_REG) registros = unir(registros, leerLS()); });
  // Hooks de prueba (solo lectura)
  window.__hapee = { registros: function () { return registros; }, cfg: function () { return cfg; }, csv: csvTexto, normalizarWA: normalizarWA };
})();

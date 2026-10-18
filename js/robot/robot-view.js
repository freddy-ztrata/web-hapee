/* ============================================================
   Hapee.ai — Robot 3D vivo (módulo, 2026-10-17)
   Lo importa js/robot/hapee-robot.js recién después del evento load:
     import('/js/robot/robot-view.js').then(m => m.start(HapeeRobot, vistas))
   UN solo WebGLRenderer y UN solo robot (js/robot/robot.js) para todas las
   vistas de la página (hero, vitrina «Asistente»): cada cuadro se
   renderiza en el renderer oculto y se copia al <canvas> 2D de cada vista
   visible. Una sola subida de geometría y un solo contexto WebGL.
   El estado lo manda HapeeRobot (idle | listening | thinking | talking | happy).
   Si algo falla, el llamador deja la imagen img/robot.png.
   ============================================================ */
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0';

export async function start(R, vistas) {
  // +esm: jsDelivr reescribe el `import 'three'` de los addons a esta MISMA URL → una sola copia de three
  const THREE = await import(`${CDN}/+esm`);
  const [{ RoundedBoxGeometry }, { RoomEnvironment }, { load }] = await Promise.all([
    import(`${CDN}/examples/jsm/geometries/RoundedBoxGeometry.js/+esm`),
    import(`${CDN}/examples/jsm/environments/RoomEnvironment.js/+esm`),
    import('/js/robot/robot.js?v=60')
  ]);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(1); // las vistas se miden ya en píxeles de dispositivo
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setScissorTest(true);
  const src = renderer.domElement;
  let perdido = false;
  src.addEventListener('webglcontextlost', e => { e.preventDefault(); perdido = true; for (const v of views) quitar(v); });

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  pm.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7a3d, 1.4); rim.position.set(-3, 2, -3); scene.add(rim);

  const bot = await load(THREE, { RoundedBoxGeometry });
  const { head, torso } = bot.parts;

  // encuadre: caja de reposo unida a la del saludo (el brazo levantado no se corta)
  const root = bot.root, box = new THREE.Box3();
  for (const [t, w] of [[0, 0], [.3, 1], [.55, 1], [.8, 1], [1.1, 0]]) { bot.animate(t, { wave: w }); root.updateMatrixWorld(true); box.union(new THREE.Box3().setFromObject(root, true)); }
  bot.animate(0, { wave: 0 }); root.updateMatrixWorld(true);
  const restBox = new THREE.Box3().setFromObject(root, true);
  const rest = restBox.getCenter(new THREE.Vector3());
  const ctr = box.getCenter(new THREE.Vector3()).setX(rest.x).setZ(rest.z);
  const size = new THREE.Vector3(2 * Math.max(box.max.x - rest.x, rest.x - box.min.x), box.max.y - box.min.y, 2 * Math.max(box.max.z - rest.z, rest.z - box.min.z));
  const restH = restBox.max.y - restBox.min.y, restTop = restBox.max.y - ctr.y;
  const off = new THREE.Group(); off.add(root); off.position.sub(ctr);
  const spin = new THREE.Group(); spin.add(off); scene.add(spin);

  function encuadrar(v) {
    const cam = v.cam, tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    cam.aspect = v.w / v.h;
    if (v.fit === 'bust') {
      // primer plano: cabeza + pantalla del pecho (lo que se lee en un círculo de 60 px)
      const fh = restH * .62, cy = restTop - fh * .54 + restH * .01;
      const dist = Math.max((fh / 2) / tanV, (fh * .5) / (tanV * cam.aspect)) * 1.02 + size.z / 2;
      cam.position.set(0, cy + restH * .03, dist); cam.lookAt(0, cy, 0);
    } else {
      const dist = Math.max((size.y / 2) / tanV, (size.x / 2) / (tanV * cam.aspect)) * 1.06 + size.z / 2;
      cam.position.set(0, size.y * .04, dist); cam.lookAt(0, size.y * .02, 0);
    }
    cam.updateProjectionMatrix();
  }

  // ── vistas ──
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let RW = 0, RH = 0;
  const views = vistas.map(o => {
    const cv = document.createElement('canvas'); cv.className = 'hr-cv'; cv.setAttribute('aria-hidden', 'true');
    o.el.appendChild(cv);
    const v = Object.assign({}, o, { cv, ctx: cv.getContext('2d'), cam: new THREE.PerspectiveCamera(o.fit === 'bust' ? 24 : 26, 1, .01, 100), w: 0, h: 0, visible: false, yaw: 0, userYaw: 0, userUntil: 0, lookY: 0, lookX: 0, listo: false });
    const medir = () => {
      const r = o.el.getBoundingClientRect();
      v.w = Math.round(r.width * dpr); v.h = Math.round(r.height * dpr);
      if (!v.w || !v.h) return;
      if (cv.width !== v.w || cv.height !== v.h) { cv.width = v.w; cv.height = v.h; }
      if (v.w > RW || v.h > RH) { RW = Math.max(RW, v.w); RH = Math.max(RH, v.h); renderer.setSize(RW, RH, false); }
      encuadrar(v);
    };
    medir();
    if (window.ResizeObserver) new ResizeObserver(medir).observe(o.el); else addEventListener('resize', medir);
    new IntersectionObserver(es => { v.visible = es[es.length - 1].isIntersecting; if (v.visible) medir(); }).observe(o.el);
    if (o.drag) arrastre(v);
    return v;
  });
  function quitar(v) { v.el.classList.remove('hr-ready'); if (v.el._poster) v.el._poster.classList.remove('hr-ready-poster'); }

  // arrastrar para girar (a los 4 s retoma solo); un toque sin arrastre sigue siendo click
  function arrastre(v) {
    let x0 = 0, last = 0, activo = false, movio = false;
    v.el.addEventListener('pointerdown', e => { if (e.button) return; activo = true; movio = false; x0 = last = e.clientX; });
    v.el.addEventListener('pointermove', e => {
      if (!activo) return;
      if (!movio && Math.abs(e.clientX - x0) > 6) { movio = true; try { v.el.setPointerCapture(e.pointerId); } catch (_) {} }
      if (!movio) return;
      v.userYaw += (e.clientX - last) * .012; last = e.clientX; v.userUntil = performance.now() + 4000;
    });
    const fin = () => { if (activo && movio) v.el._arrastre = performance.now(); activo = false; };
    v.el.addEventListener('pointerup', fin); v.el.addEventListener('pointercancel', fin);
  }

  // cursor (solo escritorio): la cabeza lo sigue suave
  let px = null, py = null;
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; }, { passive: true });

  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const P = { lean: 0, tilt: 0, up: 0 };
  const t0 = performance.now();
  let llegada = false, tPrev = t0;

  (function frame(now) {
    requestAnimationFrame(frame);
    if (perdido || document.hidden) return;
    const vis = views.filter(v => v.visible && v.w && v.h);
    if (!vis.length) return;
    const dt = Math.min(.1, (now - tPrev) / 1000); tPrev = now;
    const t = (now - t0) / 1000, s = R.state, lv = R.level();
    const k = 1 - Math.pow(.002, dt); // suavizado independiente de los fps

    // parámetros del estado (suavizados)
    P.lean = lerp(P.lean, s === 'listening' ? .13 : s === 'talking' ? .04 : 0, k);
    P.tilt = lerp(P.tilt, s === 'thinking' ? .2 : 0, k);
    P.up = lerp(P.up, s === 'thinking' ? -.13 : s === 'listening' ? .1 : 0, k);
    bot.screen.set(s === 'thinking' ? 'dots' : s === 'talking' ? 'talk' : 'logo');
    bot.screen.update(t, lv);
    bot.screen.material.emissiveIntensity = s === 'talking' ? .92 + lv * .45 : 1;

    // saludo: gesto «happy» (llegada, primer saludo del chat) o, en el hero, cada 12 s en reposo
    const dh = (now - R.happyAt) / 1000;
    const wHappy = dh >= 0 && dh < 2.6 ? Math.sin(clamp(Math.min(dh / .45, (2.6 - dh) / .45), 0, 1) * Math.PI / 2) : 0;
    const c = t % 12;
    const wCiclo = s === 'idle' && c > 6 && c < 8.6 ? Math.sin(clamp(Math.min((c - 6) / .45, (8.6 - c) / .45), 0, 1) * Math.PI / 2) : 0;

    for (const v of vis) {
      bot.animate(t, { wave: Math.max(wHappy, v.periodic ? wCiclo : 0) });
      // mirar: al input mientras escucha; si no, al cursor
      const r = v.el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * (v.fit === 'bust' ? .4 : .25);
      let tx = null, ty = null;
      if (s === 'listening' && R.target && R.target.getBoundingClientRect) { const q = R.target.getBoundingClientRect(); tx = q.left + q.width / 2; ty = q.top + q.height / 2; }
      else if (px !== null) { tx = px; ty = py; }
      let ly = 0, lx = 0, peso = 0;
      if (tx !== null) {
        ly = clamp((tx - cx) / Math.max(320, innerWidth * .45), -1, 1) * .55;
        lx = clamp((ty - cy) / Math.max(320, innerHeight * .5), -1, 1) * .32;
        peso = s === 'listening' ? .9 : .7;
      }
      v.lookY = lerp(v.lookY, ly, k * .8); v.lookX = lerp(v.lookX, lx, k * .8);
      head.rotation.y = lerp(head.rotation.y, v.lookY, peso);
      head.rotation.x = lerp(head.rotation.x, v.lookX, peso * .8) + P.up + (s === 'talking' ? lv * .07 * Math.sin(t * 9) : 0);
      head.rotation.z += P.tilt;
      torso.rotation.x += P.lean;
      torso.rotation.y += v.lookY * .22;

      // giro del cuerpo: arrastre del usuario o balanceo suave (de frente mientras conversa)
      if (now >= v.userUntil) {
        const meta = R.reduced || s !== 'idle' ? 0 : Math.sin(t * .45) * .22;
        v.userYaw = lerp(v.userYaw, meta, now < v.userUntil + 900 ? k * .35 : k * .6);
      }
      spin.rotation.y = v.userYaw;

      renderer.setViewport(0, 0, v.w, v.h); renderer.setScissor(0, 0, v.w, v.h);
      renderer.render(scene, v.cam);
      v.ctx.clearRect(0, 0, v.w, v.h);
      v.ctx.drawImage(src, 0, RH - v.h, v.w, v.h, 0, 0, v.w, v.h);
      if (!v.listo) {
        v.listo = true; v.el.classList.add('hr-ready');
        if (v.el._poster) v.el._poster.classList.add('hr-ready-poster');
        if (!llegada) { llegada = true; setTimeout(() => R.setState('happy'), 450); }
      }
    }
  })(t0);
  return { renderer, views };
}

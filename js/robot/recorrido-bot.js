// Copia de /juegos/js/bot.js para el recorrido del home (25-11-2026), separada para que cambios del arcade no muevan el home.
// Hapee Arcade · el robot de hapee.ai (js/robot/robot.js) con poses de juego.
// Un solo robot para todo el arcade: se mueve entre escenas (hub, juegos 3D, «coach» de los juegos 2D).
// Poses: idle · saluda · celebra · piensa · habla · corre · salta · apunta · lanza · triste
export const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0';

let cache = null;
export function cargarThree() {
  if (!cache) cache = (async () => {
    const THREE = await import(`${CDN}/+esm`);
    const [{ RoundedBoxGeometry }, { RoomEnvironment }, { load }] = await Promise.all([
      import(`${CDN}/examples/jsm/geometries/RoundedBoxGeometry.js/+esm`),
      import(`${CDN}/examples/jsm/environments/RoomEnvironment.js/+esm`),
      import('/js/robot/recorrido-robot.js?v=1')
    ]);
    return { THREE, RoundedBoxGeometry, RoomEnvironment, load };
  })();
  return cache;
}

const cl = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;

export async function crearBot(K) {
  const { THREE, RoundedBoxGeometry, load } = K;
  const b = await load(THREE, { RoundedBoxGeometry });
  const root = b.root;
  const hips = b.parts.hips, head = b.parts.head, torso = b.parts.torso;
  const sh = { R: root.getObjectByName('shoulderR'), L: root.getObjectByName('shoulderL') };
  const el = { R: root.getObjectByName('elbowR'), L: root.getObjectByName('elbowL') };
  // piernas: hijos de hips con pivote en x = ±66 (cadera) y su rodilla
  const legs = {};
  for (const c of hips.children) {
    const p = c.userData && c.userData.pivot;
    if (p && Math.abs(p[0]) === 66 && p[1] === 172) {
      const kn = c.children.find(k => k.userData && k.userData.pivot && k.userData.pivot[1] === 122);
      legs[p[0] < 0 ? 'R' : 'L'] = { hp: c, kn };
    }
  }
  // contenedor: el robot mide ≈ 1 de alto con los pies en y = 0
  const g = new THREE.Group(); g.add(root);
  const st = { pose: 'idle', desde: 0, peso: {}, mira: 0, miraY: 0, nivel: 0, t: 0 };
  const POSES = ['saluda', 'celebra', 'piensa', 'habla', 'corre', 'salta', 'apunta', 'lanza', 'triste'];
  for (const p of POSES) st.peso[p] = 0;

  function pose(p, dur) {
    st.pose = p; st.desde = st.t; st.dur = dur || 0;
    b.screen.set(p === 'piensa' ? 'dots' : p === 'habla' ? 'talk' : 'logo');
  }

  function update(t, dt) {
    st.t = t;
    if (st.dur && t - st.desde > st.dur) pose('idle');
    for (const p of POSES) st.peso[p] = lerp(st.peso[p], p === st.pose ? 1 : 0, cl(dt * 9, 0, 1));
    const P = st.peso;
    const wv = Math.max(P.saluda, P.celebra * .0);
    b.animate(t, { wave: wv });
    // habla: la pantalla late según un «nivel» sintético
    st.nivel = P.habla > .5 ? .5 + .5 * Math.abs(Math.sin(t * 11) * Math.sin(t * 3.7)) : 0;
    b.screen.update(t, st.nivel);
    // mirar (yaw de cabeza hacia st.mira)
    head.rotation.y += st.mira * .6; head.rotation.x += st.miraY * .4;

    // ── correr ──
    if (P.corre > .01) {
      const k = P.corre, f = t * 13, s = Math.sin(f);
      legs.R.hp.rotation.x = lerp(legs.R.hp.rotation.x, s * .9, k);
      legs.L.hp.rotation.x = lerp(legs.L.hp.rotation.x, -s * .9, k);
      legs.R.kn.rotation.x = lerp(legs.R.kn.rotation.x, Math.max(0, -Math.cos(f)) * 1.2 + .15, k);
      legs.L.kn.rotation.x = lerp(legs.L.kn.rotation.x, Math.max(0, Math.cos(f)) * 1.2 + .15, k);
      sh.R.rotation.x = lerp(sh.R.rotation.x, -s * .8, k); sh.L.rotation.x = lerp(sh.L.rotation.x, s * .8, k);
      el.R.rotation.x = lerp(el.R.rotation.x, -.9, k); el.L.rotation.x = lerp(el.L.rotation.x, -.9, k);
      torso.rotation.x += .16 * k; hips.position.y += Math.abs(Math.cos(f)) * 14 * k;
    } else {
      for (const s of ['R', 'L']) { legs[s].hp.rotation.x *= .8; legs[s].kn.rotation.x *= .8; }
    }
    // ── salta: piernas recogidas, brazos arriba ──
    if (P.salta > .01) {
      const k = P.salta;
      for (const s of ['R', 'L']) { legs[s].hp.rotation.x = lerp(legs[s].hp.rotation.x, -.7, k); legs[s].kn.rotation.x = lerp(legs[s].kn.rotation.x, 1.3, k); }
      sh.R.rotation.z = lerp(sh.R.rotation.z, -2.3, k); sh.L.rotation.z = lerp(sh.L.rotation.z, 2.3, k);
    }
    // ── celebra: ambos brazos arriba, rebote ──
    if (P.celebra > .01) {
      const k = P.celebra, o = Math.sin(t * 10);
      sh.R.rotation.z = lerp(sh.R.rotation.z, -2.5 + .15 * o, k); sh.L.rotation.z = lerp(sh.L.rotation.z, 2.5 - .15 * o, k);
      el.R.rotation.z = lerp(el.R.rotation.z, -.4, k); el.L.rotation.z = lerp(el.L.rotation.z, .4, k);
      hips.position.y += Math.abs(Math.sin(t * 10)) * 22 * k; head.rotation.z += .12 * o * k;
    }
    // ── piensa: mano al mentón, cabeza ladeada ──
    if (P.piensa > .01) {
      const k = P.piensa;
      sh.L.rotation.x = lerp(sh.L.rotation.x, -.9, k); sh.L.rotation.z = lerp(sh.L.rotation.z, .5, k);
      el.L.rotation.x = lerp(el.L.rotation.x, -2.1, k); head.rotation.z += .14 * k; head.rotation.x += .08 * k;
    }
    // ── apunta / lanza: brazo derecho adelante ──
    if (P.apunta > .01 || P.lanza > .01) {
      const k = Math.max(P.apunta, P.lanza), sw = P.lanza * Math.sin(cl((t - st.desde) * 9, 0, Math.PI));
      sh.R.rotation.x = lerp(sh.R.rotation.x, -1.4 + 1.6 * sw, k); sh.R.rotation.z = lerp(sh.R.rotation.z, -.15, k);
      el.R.rotation.x = lerp(el.R.rotation.x, -.3 - .6 * (1 - sw), k); torso.rotation.y += (-.25 + .5 * sw) * k;
    }
    // ── triste: hombros caídos, cabeza abajo ──
    if (P.triste > .01) {
      const k = P.triste;
      head.rotation.x += .35 * k; torso.rotation.x += .12 * k;
      sh.R.rotation.z = lerp(sh.R.rotation.z, -.12, k); sh.L.rotation.z = lerp(sh.L.rotation.z, .12, k);
    }
  }
  return { g, root, update, pose, st, screen: b.screen, parts: b.parts };
}

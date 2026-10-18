/* Robot del hero — three.js. El robot vive en /js/robot/robot.js (compartido con la home pública) con la interfaz
     load(THREE) → { root, animate(t, { wave }) }
   (root con los pies en y=0 mirando a +Z; animate respira, mira, balancea los brazos y saluda
   con el brazo derecho según wave ∈ [0,1]; el pecho y el logo nunca se deforman).
   Comportamiento en el hero:
     · reposo: respira, mira alrededor y balancea los brazos;
     · cada ~10 s saluda con el brazo derecho;
     · cada ~10 s (desfasado) da una vuelta de 360° con un saltito;
     · se puede girar arrastrándolo; a los 4 s retoma solo.
   Si WebGL o el modelo fallan, queda el póster (img/robot.png). */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const host = document.getElementById('robot3d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (host) init().catch(() => { /* sin WebGL queda el póster */ });

async function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const cv = renderer.domElement; cv.className = 'bot-canvas'; cv.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff7a3d, 1.4); rim.position.set(-3, 2, -3); scene.add(rim);
  const cam = new THREE.PerspectiveCamera(26, 1, .01, 100);

  const { load } = await import('/js/robot/robot.js?v=60');
  const bot = await load(THREE);
  // centrar y encuadrar: caja de la pose de reposo unida a la del saludo (el brazo levantado no se corta)
  const root = bot.root, box = new THREE.Box3();
  for (const [t, w] of [[0, 0], [.3, 1], [.55, 1], [.8, 1], [1.1, 0]]) { bot.animate(t, { wave: w }); root.updateMatrixWorld(true); box.union(new THREE.Box3().setFromObject(root, true)); }
  bot.animate(0, { wave: 0 }); root.updateMatrixWorld(true);
  // el eje de giro es el centro del cuerpo en reposo (así no orbita hacia el brazo levantado)
  const rest = new THREE.Box3().setFromObject(root, true).getCenter(new THREE.Vector3());
  const ctr = box.getCenter(new THREE.Vector3()).setX(rest.x).setZ(rest.z);
  const size = new THREE.Vector3(2 * Math.max(box.max.x - rest.x, rest.x - box.min.x), box.max.y - box.min.y, 2 * Math.max(box.max.z - rest.z, rest.z - box.min.z));
  const off = new THREE.Group(); off.add(root); off.position.sub(ctr);
  const spin = new THREE.Group(); spin.add(off); scene.add(spin);
  window.__heroBox = [size.x, size.y, size.z];
  const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  function frameCam() {
    const dist = Math.max((size.y / 2) / tanV, (size.x / 2) / (tanV * cam.aspect)) * 1.08 + size.z / 2;
    cam.position.set(0, size.y * .04, dist); cam.lookAt(0, size.y * .02, 0);
  }

  // poner el canvas y retirar el póster
  host.appendChild(cv);
  function resize() { const r = host.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; frameCam(); cam.updateProjectionMatrix(); }
  resize(); addEventListener('resize', resize);
  host.classList.add('ready');

  // arrastre para girar
  let userYaw = 0, dragging = false, lastX = 0, userUntil = 0;
  cv.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; userYaw += dx * .012; userUntil = performance.now() + 4000; });
  cv.addEventListener('pointerup', () => { dragging = false; });
  cv.addEventListener('pointercancel', () => { dragging = false; });

  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const hero = host.closest('.hero-bot');
  let visible = true, base = 0, spinning = null;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  const t0 = performance.now();

  (function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = (now - t0) / 1000, c = t % 10;

    // saludo: entre los segundos 2 y 5 de cada ciclo de 10 s
    const wv = !reduce && c > 2 && c < 5 ? Math.sin(Math.min(1, (c - 2) / .5, (5 - c) / .5) * Math.PI / 2) : 0;
    bot.animate(reduce ? 0 : t, { wave: wv });

    // giro: balanceo + una vuelta completa (con saltito) a los 7 s de cada ciclo
    let yaw;
    if (now < userUntil || dragging) { yaw = userYaw; }
    else {
      let s360 = 0;
      if (!reduce && c > 7 && c < 8.6) { if (spinning === null) { spinning = c; if (hero) { hero.classList.remove('hop'); void hero.offsetWidth; hero.classList.add('hop'); } } s360 = ease((c - 7) / 1.6) * Math.PI * 2; }
      else if (spinning !== null) { base += Math.PI * 2; spinning = null; }
      const target = base + s360 + (reduce ? 0 : Math.sin(t * .55) * .5);
      userYaw += (target - userYaw) * (now < userUntil + 900 ? .06 : 1);
      yaw = userYaw;
    }
    spin.rotation.y = yaw;
    renderer.render(scene, cam);
  })(t0);
}
